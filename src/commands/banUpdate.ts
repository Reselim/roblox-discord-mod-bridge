import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js"
import * as roblox from "../roblox.ts"
import { env, log } from "../util.ts"
import * as banModal from "../modals/ban.ts"

export const id = "update-ban"

export function build() {
	return new SlashCommandBuilder()
		.setName(id)
		.setDescription("Updates a ban on a Roblox user")
		.addStringOption(option => option.setName("username").setDescription("Roblox username").setRequired(true).setMinLength(3).setMaxLength(20))
}

export async function execute(interaction: ChatInputCommandInteraction) {
	const username = interaction.options.getString("username", true)
	const userData = await roblox.resolveUsername(username)
	if (!userData) return await interaction.reply({
		content: `**Error**: Couldn't find Roblox user with the username **${username}**. Please ensure you typed the username correctly and try again.`,
		flags: MessageFlags.Ephemeral,
	})

	let ban = null
	try {
		ban = await roblox.getBan(env.ROBLOX_UNIVERSE_ID, userData.id)
	} catch(error) {
		log.warn(error, `Failed to get ban for ${userData.name}`)
	}

	interaction.showModal(banModal.build(userData, ban))
	
}