import { ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, TextChannel, type MessageCreateOptions } from "discord.js"
import * as reportButton from "../buttons/report.ts"

const messages: { [id: string]: MessageCreateOptions } = {
	report: {
		content: "Ready to submit your report? Click the button below to begin.",
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(reportButton.build()),
		],
	},
}

export const id = "send"

export function build() {
	return new SlashCommandBuilder()
		.setName(id)
		.setDescription("Sends a message preset")
		.addStringOption(option =>
			option
				.setName("preset")
				.setDescription("Preset to use")
				.setRequired(true)
				.addChoices(Object.keys(messages).map(key => ({ name: key, value: key })))
		)
}

export async function execute(interaction: ChatInputCommandInteraction) {
	const channel = interaction.channel as TextChannel
	const preset = interaction.options.getString("preset", true) as keyof typeof messages
	await channel.send(messages[preset]!)
	await interaction.reply({ content: "Sent!", flags: MessageFlags.Ephemeral })
}