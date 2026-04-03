import { Client, ComponentType, FileUploadBuilder, LabelBuilder, MessageFlags, ModalBuilder, TextChannel, TextInputBuilder, TextInputStyle, type ModalSubmitInteraction } from "discord.js"
import { env } from "../util.ts"
import * as roblox from "../roblox.ts"
import * as reportContainer from "../containers/report.ts"

export const id = "report"

export function build() {
	return new ModalBuilder()
		.setCustomId(id)
		.setTitle("Report")
		.addLabelComponents(
			new LabelBuilder()
				.setLabel("Roblox Username")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("username")
						.setMinLength(3)
						.setMaxLength(20)
						.setRequired(true)
						.setStyle(TextInputStyle.Short)
				),
			new LabelBuilder()
				.setLabel("Details")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("details")
						.setRequired(false)
						.setStyle(TextInputStyle.Paragraph)
				),
			new LabelBuilder()
				.setLabel("Evidence")
				.setFileUploadComponent(
					new FileUploadBuilder()
						.setCustomId("evidence")
						.setMinValues(1)
						.setMaxValues(5)
				)
		)
}

export async function execute(this: Client, interaction: ModalSubmitInteraction) {
	const reportChannel = await this.channels.fetch(env.DISCORD_CHANNEL_REPORT) as TextChannel

	const username = interaction.fields.getField("username", ComponentType.TextInput).value
	const details = interaction.fields.getField("details", ComponentType.TextInput).value
	const evidence = interaction.fields.getUploadedFiles("evidence", true)

	for (const attachment of evidence.values()) {
		if (attachment.contentType) {
			const [ type ] = attachment.contentType.split("/")
			if (type !== "image" && type !== "video") {
				throw `Attachment **${attachment.name}** is not an image or video`
			}
		} else {
			throw `Invalid attachment **${attachment.name}**`
		}
	}

	const targetData = await roblox.resolveUsername(username)
	if (!targetData) throw `Couldn't find Roblox user with the username **${username}**. Please ensure you typed the username correctly and try again.`

	reportChannel.send({
		components: [
			await reportContainer.build(interaction.user, targetData, { details, evidence: [ ...evidence.values() ] }),
		],
		flags: [ MessageFlags.IsComponentsV2, MessageFlags.SuppressNotifications ],
	})

	await interaction.reply({ content: "Report submitted!", flags: MessageFlags.Ephemeral })
}