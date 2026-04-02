import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"

export const id = "ping"

export function build() {
	return new SlashCommandBuilder()
		.setName("ping")
		.setDescription("pong!")
}

export async function execute(interaction: ChatInputCommandInteraction) {
	await interaction.reply("pong!")
}