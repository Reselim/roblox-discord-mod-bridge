import { ButtonInteraction, Client, Collection, ChatInputCommandInteraction, Events, ModalSubmitInteraction, REST, Routes, SlashCommandBuilder, GatewayIntentBits } from "discord.js"
import path from "node:path"
import fs from "node:fs/promises"
import { log, env } from "./util.ts"
import * as roblox from "./roblox.ts"

interface Module {
	id: string,
}

async function loadCollection<T extends Module>(name: string) {
	const collection = new Collection<string, T>()

	const directoryPath = path.join(import.meta.dirname, name)
	const directoryFiles = await fs.readdir(directoryPath)
	for (const file of directoryFiles) {
		const filePath = path.join(directoryPath, file)
		const module = await import(filePath) as T
		collection.set(module.id, module)
	}

	return collection
}

function parseCustomId(customId: string): { id: string, context: string[] } {
	const result = /^(\w+)+\((.+)\)$/.exec(customId)
	if (result) {
		return { id: result[1]!, context: result[2]!.split(",") }
	} else {
		return { id: customId, context: [] }
	}
}

// --------------------------------------------------
// Init
// --------------------------------------------------

const rest = new REST().setToken(env.DISCORD_TOKEN)
const client = new Client({
    intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
	],
})

client.login(env.DISCORD_TOKEN).then(() => {
    log.info(`Connected to Discord as ${client.user!.tag}`)
})

roblox.introspect().then(data => {
	if (!data.enabled) return log.error("Roblox API key is not enabled")
	if (data.expired) return log.error("Roblox API key is expired")
	
	log.info(`Roblox API key is "${data.name}" (${data.authorizedUserId})`)
})

// --------------------------------------------------
// Interactions
// --------------------------------------------------

interface Command extends Module {
	build(): SlashCommandBuilder,
	execute(interaction: ChatInputCommandInteraction): Promise<void> | void,
}

interface Button extends Module {
	execute(interaction: ButtonInteraction, context: string[]): Promise<void> | void,
}

interface Modal extends Module {
	execute(interaction: ModalSubmitInteraction, context: string[]): Promise<void> | void,
}

;(async () => {
	const commands = await loadCollection<Command>("commands")
	const buttons = await loadCollection<Button>("buttons")
	const modals = await loadCollection<Modal>("modals")

	log.info(`Loaded ${commands.size} commands, ${buttons.size} buttons, and ${modals.size} modals`)

	await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID), {
		body: [ ...commands.values().map(command => command.build().toJSON()) ],
	})

	log.info(`Registered commands with guild ${env.DISCORD_GUILD_ID}`)

	client.on(Events.InteractionCreate, interaction => {
		if (interaction.isChatInputCommand()) {
			const command = commands.get(interaction.commandName)
			
			if (command) {
				command.execute.call(client, interaction)
			} else {
				log.error(`Failed to find command with name ${interaction.commandName}`)
			}
		} else if (interaction.isButton()) {
			const { id, context } = parseCustomId(interaction.customId)
			const button = buttons.get(id)
			if (button) {
				button.execute.call(client, interaction, context)
			} else {
				log.error(`Failed to find button with ID ${id}`)
			}
		} else if (interaction.isModalSubmit()) {
			const { id, context } = parseCustomId(interaction.customId)
			const modal = modals.get(id)
			if (modal) {
				modal.execute.call(client, interaction, context)
			} else {
				log.error(`Failed to find button with ID ${id}`)
			}
		}
	})
})()