import { env } from "./util.ts"
import querystring from "node:querystring"

async function request<Response>(options: {
	method: string,
	path: string,
	domain?: string,
	body?: object,
	query?: { [key: string]: string | number },
}): Promise<Response> {
	let url = `https://${options.domain ?? "apis"}.roblox.com`
	url += options.path

	if (options.query) {
		url += "?" + querystring.stringify(options.query)
	}

	const response = await fetch(url, {
		method: options.method,
		body: options.body ? JSON.stringify(options.body) : null,
		headers: {
			"Content-Type": "application/json",
			"X-API-Key": env.ROBLOX_API_KEY,
		},
	})
	if (!response.ok) throw response
	return await response.json() as Response
}

export type APIKeyData = {
	name: string,
	authorizedUserId: number,
	enabled: boolean,
	expired: boolean,
	scopes: {
		name: string,
		operations: string[],
		universeIds: number[],
	}[],
}
export async function introspect() {
	return await request({
		method: "POST",
		path: "/api-keys/v1/introspect",
		body: {
			apiKey: env.ROBLOX_API_KEY,
		},
	}) as APIKeyData
}

// --------------------------------------------------
// Users
// --------------------------------------------------

export type ProfileData = {
	id: number,
	name: string,
	displayName: string,
	about: string,
	locale: string,
	premium: boolean,
	idVerified: boolean,
	socialNetworkProfiles: {
		facebook: string,
		twitter: string,
		youtube: string,
		twitch: string,
		guilded: string,
		visibility: string,
	},
}
export async function getUserProfile(userId: number) {
	return await request<ProfileData>({
		method: "GET",
		path: `/cloud/v2/users/${userId}`,
	})
}

export async function getUserThumbnail(userId: number, size?: number, shape?: "SQUARE" | "ROUND") {
	const response = await request<{ done: false } | { done: true, response: { imageUri: string } }>({
		method: "GET",
		path: `/cloud/v2/users/${userId}:generateThumbnail`,
		query: {
			user_id: userId,
			size: size ?? 420,
			shape: shape ?? "CIRCLE",
		},
	})

	if (response.done) {
		return response.response.imageUri
	} else {
		return null
	}
}

export type UserData = {
	id: number,
	name: string,
	displayName: string,
}

const resolveUserIdCache: { [userId: number]: UserData | null } = {}
const resolveUsernameCache: { [username: string]: UserData | null } = {}

export async function resolveUsername(username: string) {
	username = username.toLowerCase()

	const cached = resolveUsernameCache[username]
	if (cached) return cached
	
	const response = await request<{ data: UserData[] }>({
		method: "POST",
		domain: "users",
		path: "/v1/usernames/users",
		body: {
			usernames: [ username ],
		},
	})

	const data = response.data[0] ?? null
	resolveUsernameCache[username] = data
	if (data) resolveUserIdCache[data.id] = data

	return data
}

export async function resolveUserId(userId: number) {
	const cached = resolveUserIdCache[userId]
	if (cached) return cached

	const response = await request<{ data: UserData[] }>({
		method: "POST",
		domain: "users",
		path: "/v1/users",
		body: {
			userIds: [ userId ],
		},
	})

	const data = response.data[0] ?? null
	resolveUserIdCache[userId] = data
	if (data) resolveUsernameCache[data.name] = data

	return data
}

// --------------------------------------------------
// Bans
// --------------------------------------------------

export type BanData = {
	active: boolean,
	duration?: string,
	privateReason: string,
	displayReason: string,
	excludeAltAccounts?: boolean,
}

export async function getBan(universeId: number, userId: number) {
	const response = await request<{ gameJoinRestriction?: BanData }>({
		method: "GET",
		path: `/cloud/v2/universes/${universeId}/user-restrictions/${userId}`,
	})

	return response.gameJoinRestriction ?? null
}

export async function updateBan(universeId: number, userId: number, ban: BanData) {
	await request({
		method: "PATCH",
		path: `/cloud/v2/universes/${universeId}/user-restrictions/${userId}`,
		body: {
			gameJoinRestriction: ban,
		},
	})
}

export async function removeBan(universeId: number, userId: number) {
	await request({
		method: "PATCH",
		path: `/cloud/v2/universes/${universeId}/user-restrictions/${userId}`,
		body: {
			gameJoinRestriction: { active: false },
		},
	})
}