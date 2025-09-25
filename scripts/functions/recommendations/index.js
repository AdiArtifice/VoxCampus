// Appwrite Function: Recommended Users
// Returns users whose email ends with '@college.edu'

import { Client, Users, Query } from 'node-appwrite';

/**
 * Helper to create an Appwrite server client from environment variables.
 */
function createClient() {
	const endpoint = process.env.APPWRITE_ENDPOINT;
	const projectId = process.env.APPWRITE_PROJECT_ID;
	const apiKey = process.env.APPWRITE_API_KEY;

	if (!endpoint || !projectId || !apiKey) {
		throw new Error('Missing required environment variables: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
	}

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
		const client = createClient();
		const usersSvc = new Users(client);

		// Fetch all users with pagination
		const allUsers = await listAllUsers(usersSvc);

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
	module.exports = handler;

