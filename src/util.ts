import type { Snowflake } from "discord.js"
import pino from "pino"

type Environment = {
	LOG_LEVEL: string,
	DISCORD_TOKEN: string,
	DISCORD_CLIENT_ID: Snowflake,
	DISCORD_GUILD_ID: Snowflake,
	DISCORD_CHANNEL_REPORT: Snowflake,
	DISCORD_CHANNEL_LOG: Snowflake,
	ROBLOX_API_KEY: string,
	ROBLOX_UNIVERSE_ID: number,
}
export const env = {
	LOG_LEVEL: process.env.LOG_LEVEL!,
	DISCORD_TOKEN: process.env.DISCORD_TOKEN!,
	DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID!,
	DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID!,
	DISCORD_CHANNEL_REPORT: process.env.DISCORD_CHANNEL_REPORT!,
	DISCORD_CHANNEL_LOG: process.env.DISCORD_CHANNEL_LOG!,
	ROBLOX_API_KEY: process.env.ROBLOX_API_KEY!,
	ROBLOX_UNIVERSE_ID: parseInt(process.env.ROBLOX_UNIVERSE_ID!),
} as Environment

export const log = pino({
	level: process.env.LOG_LEVEL!,
})

export function quote(text: string) {
	return "> " + text.replace("\n", "\n> ")
}

const MODERATOR_REGEX = /\[Moderator (\d+)\]/
const REPORT_REGEX = /\[Report (\d+\/\d+)\]/
export function parseNotes(notes: string) {
	let moderatorId: Snowflake | undefined
	notes = notes.replace(MODERATOR_REGEX, (_, id) => {
		moderatorId = id
		return ""
	})

	let reportURL: string | undefined
	notes = notes.replace(REPORT_REGEX, (_, data) => {
		reportURL = `https://discord.com/channels/${env.DISCORD_GUILD_ID}/${data}`
		return ""
	})

	notes = notes.trim()

	return { notes, moderatorId, reportURL }
}