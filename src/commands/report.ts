import { ChatInputCommandInteraction, Client, MessageFlags, SlashCommandBuilder, TextChannel } from "discord.js"
import * as roblox from "../roblox.ts"
import * as reportContainer from "../containers/report.ts"
import { env } from "../util.ts"

export const id = "report"

export function build() {
	return new SlashCommandBuilder()
		.setName(id)
		.setDescription("Updates a ban on a Roblox user")
		.addStringOption(option => option.setName("username").setDescription("Roblox username").setRequired(true).setMinLength(3).setMaxLength(20))
		.addAttachmentOption(option => option.setName("evidence").setDescription("Images or video showing proof").setRequired(true))
		.addStringOption(option => option.setName("details").setDescription("Any additional details you'd like to share").setRequired(false))
}

export async function execute(this: Client, interaction: ChatInputCommandInteraction) {
	const reportChannel = await this.channels.fetch(env.DISCORD_CHANNEL_REPORT) as TextChannel

	const username = interaction.options.getString("username", true)
	const evidence = interaction.options.getAttachment("evidence", true)
	const details = interaction.options.getString("details", false)

	if (evidence.contentType) {
		const [ type ] = evidence.contentType.split("/")
		if (type !== "image" && type !== "video") {
			return await interaction.reply({
				content: `**Error**: Attachment is not an image or video`,
				flags: MessageFlags.Ephemeral,
			})
		}
	} else {
		return await interaction.reply({
			content: `**Error**: Invalid attachment`,
			flags: MessageFlags.Ephemeral,
		})
	}

	const targetData = await roblox.resolveUsername(username)
	if (!targetData) return await interaction.reply({
		content: `**Error**: Couldn't find Roblox user with the username **${username}**. Please ensure you typed the username correctly and try again.`,
		flags: MessageFlags.Ephemeral,
	})

	reportChannel.send({
		components: [
			await reportContainer.build(interaction.user, targetData, { details: details ?? "", evidence: [ evidence ] }),
		],
		flags: [ MessageFlags.IsComponentsV2, MessageFlags.SuppressNotifications ],
	})

	await interaction.reply({ content: "Report submitted!", flags: MessageFlags.Ephemeral })
}