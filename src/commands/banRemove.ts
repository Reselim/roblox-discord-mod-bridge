import { ChatInputCommandInteraction, Client, MessageFlags, SlashCommandBuilder, TextChannel, TextDisplayBuilder } from "discord.js"
import * as roblox from "../roblox.ts"
import { env, log } from "../util.ts"

export const id = "remove-ban"

export function build() {
	return new SlashCommandBuilder()
		.setName(id)
		.setDescription("Removes a ban on a Roblox user")
		.addStringOption(option => option.setName("username").setDescription("Roblox username").setRequired(true).setMinLength(3).setMaxLength(20))
}

export async function execute(this: Client, interaction: ChatInputCommandInteraction) {
	const logsChannel = await this.channels.fetch(env.DISCORD_CHANNEL_LOG) as TextChannel

	const username = interaction.options.getString("username", true)
	const userData = await roblox.resolveUsername(username)
	if (!userData) throw `Couldn't find Roblox user with the username **${username}**. Please ensure you typed the username correctly and try again.`

	try {
		await roblox.removeBan(env.ROBLOX_UNIVERSE_ID, userData.id)
	} catch(error) {
		log.warn(error, `Failed to unban ${userData.name}`)
		throw `Failed to unban **${userData.name}**. Please try again later.`
	}

	await Promise.all([
		interaction.reply({
			components: [
				new TextDisplayBuilder().setContent(`Unbanned **${userData.name}**`),
			],
			flags: [
				MessageFlags.IsComponentsV2,
				MessageFlags.Ephemeral,
			],
		}),

		logsChannel.send({
			components: [
				new TextDisplayBuilder().setContent(`<@${interaction.user.id}> unbanned **${userData.name}** (${userData.id})`),
			],
			flags: [
				MessageFlags.IsComponentsV2,
				MessageFlags.SuppressNotifications,
			],
		}),
	])
}