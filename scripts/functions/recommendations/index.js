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
	let cursor = undefined;

	while (true) {
		const queries = [Query.limit(pageSize)];
		if (cursor) queries.push(Query.cursorAfter(cursor));

		const resp = await users.list(queries);
		const batch = resp.users ?? [];
		all.push(...batch);

		if (batch.length < pageSize) break;
		cursor = batch[batch.length - 1].$id;
	}

	return all;
}

/**
 * Appwrite function entrypoint
 */
export default async ({ res, log, error }) => {
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
};

