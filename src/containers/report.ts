import { ActionRowBuilder, Attachment, ButtonBuilder, ComponentType, ContainerBuilder, ContainerComponent, MediaGalleryBuilder, MediaGalleryItemBuilder, Message, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, ThumbnailBuilder, User, type APIContainerComponent } from "discord.js"
import { quote } from "../util.ts"
import * as roblox from "../roblox.ts"
import * as acceptReportButton from  "../buttons/reportAccept.ts"
import * as declineReportButton from  "../buttons/reportDecline.ts"

export async function build(source: User, target: roblox.UserData, options: {
	details: string,
	evidence: Attachment[],
}) {
	const [ profileResult, thumbnailResult ] = await Promise.allSettled([
		roblox.getUserProfile(target.id),
		roblox.getUserThumbnail(target.id),
	])
	const profile = profileResult.status === "fulfilled" ? profileResult.value : null
	const thumbnail = thumbnailResult.status === "fulfilled" ? thumbnailResult.value : null

	//

	const container = new ContainerBuilder()

	container.addTextDisplayComponents(
		new TextDisplayBuilder().setContent(quote(options.details.length > 0 ? options.details : "*No details provided*")),
		new TextDisplayBuilder().setContent(`*from <@${source.id}>*`)
	)
	container.addMediaGalleryComponents(
		new MediaGalleryBuilder().addItems([ ...options.evidence.map(attachment => new MediaGalleryItemBuilder().setURL(attachment.url)) ])
	)

	container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))

	const profileTextComponents: TextDisplayBuilder[] = [
		new TextDisplayBuilder().setContent(`### [${target.displayName} (${target.name})](https://www.roblox.com/users/${target.id}/profile)`),
		new TextDisplayBuilder().setContent(profile ? (profile.about ?? "*No bio yet*") : "*Failed to fetch profile*")
	]
	if (thumbnail) {
		container.addSectionComponents(
			new SectionBuilder()
				.setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnail))
				.addTextDisplayComponents(profileTextComponents)
		)
	} else {
		container.addTextDisplayComponents(profileTextComponents)
	}

	container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))

	container.addActionRowComponents(
		new ActionRowBuilder<ButtonBuilder>().addComponents(
			acceptReportButton.build(source.id, target.id),
			declineReportButton.build(source.id, target.id)
		)
	)

	return container
}

export function strip(message: Message, color?: number): APIContainerComponent {
	const container = (message.components[0] as ContainerComponent).toJSON()
	return {
		type: ComponentType.Container,
		components: container.components.slice(0, container.components.findIndex(component => component.type === ComponentType.Separator)),
		accent_color: color ?? null,
	}
}