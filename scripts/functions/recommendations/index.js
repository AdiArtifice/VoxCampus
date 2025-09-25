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
async function handler({ req, res, log, error }) {
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

				// Extract optional exclusions from request body
				let excludeUserId = undefined;
				let excludeEmail = undefined;
				try {
					const raw = (req && (req.body || req.bodyRaw)) || '{}';
					const parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
					excludeUserId = parsed.excludeUserId || parsed.exclude_id || undefined;
					excludeEmail = (parsed.excludeEmail || parsed.exclude_email || '').toString().toLowerCase() || undefined;
				} catch {}

				// Filter by email domain (configurable by RECOMMEND_EMAIL_SUFFIXES, comma-separated)
			const suffixEnv = (process.env.RECOMMEND_EMAIL_SUFFIXES || '').toString().toLowerCase();
			const suffixes = suffixEnv
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);

				const recommended = allUsers.filter((u) => {
					const email = (u.email || '').toString().toLowerCase();
					const uid = u.$id || u.id;
					const verified = u.emailVerification === true;
					const active = u.status === true || u.status === 1 || u.status === 'active';

					if (!email) return false;
					if (!verified) return false; // exclude unverified accounts
					if (!active) return false;   // exclude inactive/blocked
					if (excludeUserId && uid && String(uid) === String(excludeUserId)) return false; // exclude self by id
					if (excludeEmail && email === excludeEmail) return false; // exclude self by email

					if (suffixes.length > 0) {
						return suffixes.some((s) => email.endsWith(s));
					}
					// Default behavior if not configured
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

