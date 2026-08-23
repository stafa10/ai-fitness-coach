import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { profiles, chatConversations } from '$lib/server/db/schema.js';
import { desc, eq } from 'drizzle-orm';

export const load = async ({ locals }) => {
	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.userId, locals.user.id))
		.limit(1);

	if (!profile) {
		return { profile: null };
	}

	let [latest] = await db
		.select()
		.from(chatConversations)
		.where(eq(chatConversations.profileId, profile.id))
		.orderBy(desc(chatConversations.updatedAt))
		.limit(1);

	if (!latest) {
		[latest] = await db.insert(chatConversations).values({ profileId: profile.id }).returning();
	}

	throw redirect(302, `/coach/${latest.id}`);
};
