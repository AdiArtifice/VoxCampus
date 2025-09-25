// Appwrite Function: Recommended Users
// Returns users whose email ends with '@college.edu'

import { Client, Users, Query } from 'node-appwrite';

/**
 * Helper to create an Appwrite server client from environment variables.
 */
function resolveEnv() {
	const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT;
	const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
	const apiKey = process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY;

	if (!endpoint || !projectId || !apiKey) {
		throw new Error('Missing required environment variables: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
	}
		return { endpoint, projectId, apiKey };
}

function createClient() {
	const { endpoint, projectId, apiKey } = resolveEnv();

	const client = new Client()
		.setEndpoint(endpoint)
		.setProject(projectId)
		.setKey(apiKey);
	return client;
}

/**
 * List all users with pagination.
 * @param {Users} users
 * @returns {Promise<Array<object>>}
 */
async function listAllUsers(users) {
	const all = [];
	const pageSize = 100;
	let offset = 0;

	while (true) {
		const queries = [Query.limit(pageSize), Query.offset(offset)];
		const resp = await users.list(queries);
		const batch = resp.users ?? [];
		all.push(...batch);

		if (batch.length < pageSize) break;
		offset += batch.length;
	}

	return all;
}

/**
 * Appwrite function entrypoint
 */
async function handler({ res, log, error }) {
		try {
		const { endpoint, projectId, apiKey } = resolveEnv();
		const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
		const usersSvc = new Users(client);

		// Fetch all users with pagination
			let allUsers = [];
			try {
				allUsers = await listAllUsers(usersSvc);
			} catch (sdkErr) {
				log?.(`SDK list failed, falling back to REST: ${sdkErr?.message || sdkErr}`);
				// REST fallback using fetch
				const limit = 100;
				let offset = 0;
				while (true) {
					const url = `${endpoint}/users?queries[]=${encodeURIComponent(`limit(${limit})`)}&queries[]=${encodeURIComponent(`offset(${offset})`)}`;
					const r = await fetch(url, {
						method: 'GET',
						headers: {
							'X-Appwrite-Project': projectId,
							'X-Appwrite-Key': apiKey,
							'Content-Type': 'application/json',
						},
					});
					if (!r.ok) {
						const body = await r.text();
						throw new Error(`REST users list failed: ${r.status} ${body}`);
					}
					const data = await r.json();
					const batch = Array.isArray(data.users) ? data.users : [];
					allUsers.push(...batch);
					if (batch.length < limit) break;
					offset += batch.length;
				}
			}

		// Filter by email domain
		const recommended = allUsers.filter((u) => {
			const email = (u.email || '').toString().toLowerCase();
			return email.endsWith('@college.edu');
		});

			return res.json(recommended);
		} catch (e) {
			error?.(e);
			const message = e?.message || 'Failed to get recommended users';
			return res.json({ error: message }, 500);
		}
	}

	export default handler;

