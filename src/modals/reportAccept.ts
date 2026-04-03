import { Client, CheckboxBuilder, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ModalMessageModalSubmitInteraction, MessageFlags, TextChannel, TextDisplayBuilder, ComponentType, type Snowflake } from "discord.js"
import { env } from "../util.ts"
import * as roblox from "../roblox.ts"
import parseDuration from "parse-duration"
import * as banContainer from "../containers/ban.ts"
import * as reportContainer from "../containers/report.ts"

export const id = "reportAccept"

export function build(sourceId: Snowflake, targetId: number) {
	return new ModalBuilder()
		.setCustomId(`${id}(${sourceId},${targetId})`)
		.setTitle("Accept Report")
		.addLabelComponents(
			new LabelBuilder()
				.setLabel("Reason")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("reason")
						.setRequired(true)
						.setMaxLength(400)
						.setStyle(TextInputStyle.Short)
				),
			new LabelBuilder()
				.setLabel("Notes")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("notes")
						.setRequired(false)
						.setMaxLength(1000)
						.setStyle(TextInputStyle.Paragraph)
				),
			new LabelBuilder()
				.setLabel("Duration")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("duration")
						.setRequired(false)
						.setPlaceholder("Permanent")
						.setStyle(TextInputStyle.Short)
				),
			new LabelBuilder()
				.setLabel("Notify reporter of this decision")
				.setCheckboxComponent(
					new CheckboxBuilder()
						.setCustomId("notify")
				)
		)
}

export async function execute(this: Client, interaction: ModalMessageModalSubmitInteraction, context: [ string, string ]) {
	const logsChannel = await this.channels.fetch(env.DISCORD_CHANNEL_LOG) as TextChannel

	const reason = interaction.fields.getField("reason", ComponentType.TextInput).value
	const notes = interaction.fields.getField("notes", ComponentType.TextInput).value
	const duration = interaction.fields.getField("duration", ComponentType.TextInput).value
	const notify = interaction.fields.getCheckbox("notify")

	const sourceId = context[0]
	const targetId = parseInt(context[1])
	
	const target = (await roblox.resolveUserId(targetId))!

	const logMessage = await logsChannel.send({
		components: [ new TextDisplayBuilder().setContent("...") ],
		flags: [
			MessageFlags.IsComponentsV2,
			MessageFlags.SuppressNotifications,
		],
	})

	const ban = {
		active: true,
		displayReason: reason,
		privateReason: `[Moderator ${interaction.user.id}] [Report ${env.DISCORD_CHANNEL_LOG}/${logMessage.id}] ${notes}`,
		excludeAltAccounts: true,
	} as roblox.BanData
	
	const durationTime = parseDuration(duration, "s")
	if (durationTime) ban.duration = durationTime + "s"

	try {
		await roblox.updateBan(env.ROBLOX_UNIVERSE_ID, targetId, ban)
	} catch {
		await logMessage.delete()
		throw "Failed to ban Roblox user. Please try again later."
	}

	await logMessage.edit({
		components: [
			new TextDisplayBuilder().setContent(`<@${interaction.user.id}> accepted a report on **${target.name}** (${target.id})`),
			banContainer.build(ban),
			reportContainer.strip(interaction.message, 0x008545),
		],
		flags: MessageFlags.IsComponentsV2,
	})
	await interaction.message.delete()

	await interaction.reply({
		content: "Report accepted.",
		flags: MessageFlags.Ephemeral,
	})

	if (notify) {
		const source = await this.users.fetch(sourceId)
		
		if (source && target) {
			try {
				source.send({
					components: [ new TextDisplayBuilder().setContent(`Your report on user **${target.name}** was accepted.`) ],
					flags: MessageFlags.IsComponentsV2,
				})
			} catch {
				await interaction.followUp({
					content: `Failed to notify <@${source.id}> of report decision`,
					flags: MessageFlags.Ephemeral,
				})
			}
		}
	}
}