import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { profiles, chatConversations } from '$lib/server/db/schema.js';
import { and, eq } from 'drizzle-orm';

export const POST = async ({ locals, params }) => {
	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.userId, locals.user.id))
		.limit(1);
	if (!profile) {
		throw error(404, 'No profile found');
	}

	const conversationId = Number(params.id);

	await db
		.delete(chatConversations)
		.where(
			and(eq(chatConversations.id, conversationId), eq(chatConversations.profileId, profile.id))
		);

	return json({ success: true });
};
