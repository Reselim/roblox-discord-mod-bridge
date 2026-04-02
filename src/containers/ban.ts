import { ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder, TextDisplayBuilder } from "discord.js"
import * as roblox from "../roblox.ts"
import parseDuration from "parse-duration"
import { parseNotes } from "../util.ts"

export function build(ban: roblox.BanData) {
	const duration = parseDuration(ban.duration, "s")
	const { notes, moderatorId, reportURL } = parseNotes(ban.privateReason)

	const container = new ContainerBuilder()

	const footer = [ duration ? `Expires <t:${Math.floor(Date.now() / 1000) + duration!}:f>` : "Permanent" ]
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