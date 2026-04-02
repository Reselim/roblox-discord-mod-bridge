import { ButtonBuilder, ButtonInteraction, ButtonStyle, type Snowflake } from "discord.js"
import * as reportDeclineModal from "../modals/reportDecline.ts"

export const id = "reportDecline"

export function build(sourceId: Snowflake, targetId: number) {
	return new ButtonBuilder()
		.setCustomId(`${id}(${sourceId},${targetId})`)
		.setLabel("Decline")
		.setStyle(ButtonStyle.Danger)
}

export async function execute(interaction: ButtonInteraction, context: [ string, string ]) {
	const sourceId = context[0]
	const targetId = parseInt(context[1])
	interaction.showModal(reportDeclineModal.build(sourceId, targetId))
}