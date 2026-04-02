import { ButtonBuilder, ButtonInteraction, ButtonStyle, type Snowflake } from "discord.js"
import * as reportAcceptModal from "../modals/reportAccept.ts"

export const id = "reportAccept"

export function build(sourceId: Snowflake, targetId: number) {
	return new ButtonBuilder()
		.setCustomId(`${id}(${sourceId},${targetId})`)
		.setLabel("Accept")
		.setStyle(ButtonStyle.Success)
}

export async function execute(interaction: ButtonInteraction, context: [ string, string ]) {
	const sourceId = context[0]
	const targetId = parseInt(context[1])
	interaction.showModal(reportAcceptModal.build(sourceId, targetId))
}