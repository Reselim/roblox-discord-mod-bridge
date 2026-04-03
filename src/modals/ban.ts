import { Client, ComponentType, LabelBuilder, MessageFlags, ModalBuilder, TextChannel, TextDisplayBuilder, TextInputBuilder, TextInputStyle, type ModalSubmitInteraction } from "discord.js"
import * as roblox from "../roblox.ts"
import { env, log, parseNotes } from "../util.ts"
import parseDuration from "parse-duration"
import * as banContainer from "../containers/ban.ts"

export const id = "ban"

function formatDuration(time: number) {
	const days = Math.floor(time / (24*60*60))
	const hours = Math.floor(time / (60*60)) % 24
	const minutes = Math.floor(time / 60) % 60
	const seconds = time % 60

	const text = []
	if (seconds > 0) text.push(seconds + "s")
	if (minutes > 0) text.push(minutes + "m")
	if (hours > 0) text.push(hours + "h")
	if (days > 0) text.push(days + "d")

	return text.join(" ")
}

export function build(data: roblox.UserData, ban: roblox.BanData | null) {
	const modal = new ModalBuilder()
		.setCustomId(`${id}(${data.id})`)
		.setTitle(`Ban ${data.name}`)

	let reason = ""
	let notes = ""
	let duration = ""

	if (ban) {
		reason = ban.displayReason
		notes = parseNotes(ban.privateReason).notes
		
		if (ban.duration) {
			const elapsedTime = Math.floor((Date.now() - Date.parse(ban.startTime)) / 1000)
			const durationTime = parseDuration(ban.duration, "s")!

			duration = formatDuration(durationTime - elapsedTime)
		}
	}

	modal.addLabelComponents(
		new LabelBuilder()
			.setLabel("Reason")
			.setTextInputComponent(
				new TextInputBuilder()
					.setCustomId("reason")
					.setRequired(true)
					.setMaxLength(400)
					.setValue(reason)
					.setStyle(TextInputStyle.Short)
			),
		new LabelBuilder()
			.setLabel("Notes")
			.setTextInputComponent(
				new TextInputBuilder()
					.setCustomId("notes")
					.setRequired(false)
					.setMaxLength(1000)
					.setValue(notes)
					.setStyle(TextInputStyle.Paragraph)
			),
		new LabelBuilder()
			.setLabel("Duration")
			.setTextInputComponent(
				new TextInputBuilder()
					.setCustomId("duration")
					.setRequired(false)
					.setPlaceholder("Permanent")
					.setValue(duration)
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
	} as roblox.BanOptions
	
	const durationTime = parseDuration(duration, "s")
	if (durationTime) ban.duration = durationTime + "s"

	try {
		await roblox.updateBan(env.ROBLOX_UNIVERSE_ID, userId, ban)
	} catch(error) {
		log.warn(error, `Failed to ban ${userData.name}`)
		throw `Failed to ban **${userData.name}**. Please try again later.`
	}

	const container = banContainer.build({ ...ban, startTime: new Date().toISOString() })
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