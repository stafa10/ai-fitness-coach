import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { profiles, chatConversations } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export const POST = async ({ locals }) => {
	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.userId, locals.user.id))
		.limit(1);

	if (!profile) {
		throw error(400, 'Create a profile first');
	}

	const [conversation] = await db
		.insert(chatConversations)
		.values({ profileId: profile.id })
		.returning();

	return json({ id: conversation.id, title: conversation.title });
};
