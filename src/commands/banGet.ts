import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js"
import * as roblox from "../roblox.ts"
import { env, log } from "../util.ts"
import * as banContainer from "../containers/ban.ts"

export const id = "get-ban"

export function build() {
	return new SlashCommandBuilder()
		.setName(id)
		.setDescription("Gets a ban on a Roblox user")
		.addStringOption(option => option.setName("username").setDescription("Roblox username").setRequired(true).setMinLength(3).setMaxLength(20))
}

export async function execute(interaction: ChatInputCommandInteraction) {
	const username = interaction.options.getString("username", true)
	const userData = await roblox.resolveUsername(username)
	if (!userData) return await interaction.reply({
		content: `**Error**: Couldn't find Roblox user with the username **${username}**. Please ensure you typed the username correctly and try again.`,
		flags: MessageFlags.Ephemeral,
	})

	let ban
	try {
		ban = await roblox.getBan(env.ROBLOX_UNIVERSE_ID, userData.id)
	} catch(error) {
		log.warn(error, `Failed to get ban for ${userData.name}`)
		return await interaction.reply({
			content: `Unable to retrieve ban for **${userData.name}**. Please try again later.`,
			flags: MessageFlags.Ephemeral,
		})
	}

	if (ban) {
		await interaction.reply({
			components: [
				banContainer.build(ban),
			],
			flags: [
				MessageFlags.IsComponentsV2,
				MessageFlags.Ephemeral,
			],
		})
	} else {
		await interaction.reply({
			content: `No ban found on user **${userData.name}**.`,
			flags: MessageFlags.Ephemeral,
		})
	}
}