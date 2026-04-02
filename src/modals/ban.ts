import { Client, ComponentType, LabelBuilder, MessageFlags, ModalBuilder, TextChannel, TextDisplayBuilder, TextInputBuilder, TextInputStyle, type ModalSubmitInteraction } from "discord.js"
import * as roblox from "../roblox.ts"
import { env, log, parseNotes } from "../util.ts"
import parseDuration from "parse-duration"
import * as banContainer from "../containers/ban.ts"

export const id = "ban"

export function build(data: roblox.UserData, ban: roblox.BanData | null) {
	const modal = new ModalBuilder()
		.setCustomId(`${id}(${data.id})`)
		.setTitle(`Ban ${data.name}`)

	modal.addLabelComponents(
		new LabelBuilder()
			.setLabel("Reason")
			.setTextInputComponent(
				new TextInputBuilder()
					.setCustomId("reason")
					.setRequired(true)
					.setMaxLength(400)
					.setValue(ban?.displayReason ?? "")
					.setStyle(TextInputStyle.Short)
			),
		new LabelBuilder()
			.setLabel("Notes")
			.setTextInputComponent(
				new TextInputBuilder()
					.setCustomId("notes")
					.setRequired(false)
					.setMaxLength(1000)
					.setValue(ban ? parseNotes(ban.privateReason).notes : "") // TODO: strip data
					.setStyle(TextInputStyle.Paragraph)
			),
		new LabelBuilder()
			.setLabel("Duration")
			.setTextInputComponent(
				new TextInputBuilder()
					.setCustomId("duration")
					.setRequired(false)
					.setPlaceholder("Permanent")
					.setValue(ban?.duration ?? "")
					.setStyle(TextInputStyle.Short)
			)
	)

	if (ban) {
		modal.addTextDisplayComponents(
			new TextDisplayBuilder().setContent("**This user is already banned.** Pressing Submit will update their ban.")
		)
	}

	return modal
}

export async function execute(this: Client, interaction: ModalSubmitInteraction, context: [ string ]) {
	const logsChannel = await this.channels.fetch(env.DISCORD_CHANNEL_LOG) as TextChannel

	const reason = interaction.fields.getField("reason", ComponentType.TextInput).value
	const notes = interaction.fields.getField("notes", ComponentType.TextInput).value
	const duration = interaction.fields.getField("duration", ComponentType.TextInput).value

	const userId = parseInt(context[0])
	const userData = (await roblox.resolveUserId(userId))!

	const ban = {
		active: true,
		displayReason: reason,
		privateReason: `[Moderator ${interaction.user.id}] ${notes}`,
		excludeAltAccounts: true,
	} as roblox.BanData
	
	const durationTime = parseDuration(duration, "s")
	if (durationTime) ban.duration = durationTime + "s"

	try {
		await roblox.updateBan(env.ROBLOX_UNIVERSE_ID, userId, ban)
	} catch(error) {
		log.warn(error, `Failed to ban ${userData.name}`)
		return await interaction.reply({
			content: `Failed to ban **${userData.name}**. Please try again later.`,
			flags: MessageFlags.Ephemeral,
		})
	}

	const container = banContainer.build(ban)
	await Promise.all([
		interaction.reply({
			components: [
				new TextDisplayBuilder().setContent(`Banned **${userData.name}**`),
				container,
			],
			flags: [
				MessageFlags.IsComponentsV2,
				MessageFlags.Ephemeral,
			],
		}),

		logsChannel.send({
			components: [
				new TextDisplayBuilder().setContent(`<@${interaction.user.id}> banned **${userData.name}** (${userData.id})`),
				container,
			],
			flags: [
				MessageFlags.IsComponentsV2,
				MessageFlags.SuppressNotifications,
			],
		}),
	])
}