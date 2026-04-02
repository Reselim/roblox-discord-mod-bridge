import { ButtonBuilder, ButtonInteraction, ButtonStyle } from "discord.js"
import * as reportModal from "../modals/report.ts"

export const id = "report"

export function build() {
	return new ButtonBuilder().setCustomId(id).setLabel("Submit a report").setStyle(ButtonStyle.Primary)
}

export async function execute(interaction: ButtonInteraction) {
	interaction.showModal(reportModal.build())
}