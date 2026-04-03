import { Client, CheckboxBuilder, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, type ModalMessageModalSubmitInteraction, MessageFlags, TextChannel, TextDisplayBuilder, ComponentType, type Snowflake } from "discord.js"
import { env, quote } from "../util.ts"
import * as roblox from "../roblox.ts"
import * as reportContainer from "../containers/report.ts"

export const id = "reportDecline"

export function build(sourceId: Snowflake, targetId: number) {
	return new ModalBuilder()
		.setCustomId(`${id}(${sourceId},${targetId})`)
		.setTitle("Decline Report")
		.addLabelComponents(
			new LabelBuilder()
				.setLabel("Reason")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("reason")
						.setRequired(false)
						.setMaxLength(400)
						.setStyle(TextInputStyle.Paragraph)
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

	let reason = interaction.fields.getField("reason", ComponentType.TextInput).value
	const notify = interaction.fields.getCheckbox("notify")
	if (reason.length === 0) reason = "*No reason provided*"

	const sourceId = context[0]
	const targetId = parseInt(context[1])

	const target = (await roblox.resolveUserId(targetId))!

	await Promise.all([
		logsChannel.send({
			components: [
				new TextDisplayBuilder().setContent(`<@${interaction.user.id}> declined a report on **${target.name}** (${target.id})`),
				new TextDisplayBuilder().setContent(quote(reason)),
				reportContainer.strip(interaction.message, 0xD22D39),
			],
			flags: [
				MessageFlags.IsComponentsV2,
				MessageFlags.SuppressNotifications,
			],
		}),
		interaction.message.delete(),
		interaction.reply({
			content: "Report declined.",
			flags: MessageFlags.Ephemeral,
		}),
	])

	if (notify) {
		const source = await this.users.fetch(sourceId)
		
		if (source && target) {
			try {
				source.send({
					components: [
						new TextDisplayBuilder().setContent(`Your report on user **${target.name}** was declined.`),
						new TextDisplayBuilder().setContent(quote(reason)),
					],
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