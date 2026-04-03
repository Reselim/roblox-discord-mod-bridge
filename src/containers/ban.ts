import { ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder } from "discord.js"
import * as roblox from "../roblox.ts"
import parseDuration from "parse-duration"
import { parseNotes } from "../util.ts"

export function build(ban: roblox.BanData) {
	const { notes, moderatorId, reportURL } = parseNotes(ban.privateReason)

	const container = new ContainerBuilder()

	const startTime = Math.floor(Date.parse(ban.startTime) / 1000)
	const durationTime = parseDuration(ban.duration, "s")

	const footer = []
	footer.push(`Created <t:${startTime}:D>`)
	footer.push(durationTime ? `Expires <t:${startTime + durationTime!}:D>` : "Permanent")
	if (moderatorId) footer.push(`Banned by <@${moderatorId}>`)

	const textComponents = [
		new TextDisplayBuilder().setContent("### " + ban.displayReason),
		new TextDisplayBuilder().setContent(notes.length > 0 ? notes : "*No notes provided*"),
		new TextDisplayBuilder().setContent("-# " + footer.join(" · ")),
	]

	if (reportURL) {
		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(textComponents)
				.setButtonAccessory(
					new ButtonBuilder()
						.setLabel("View Report")
						.setStyle(ButtonStyle.Link)
						.setURL(reportURL)
				)
		)
	} else {
		container.addTextDisplayComponents(textComponents)
	}

	return container
}