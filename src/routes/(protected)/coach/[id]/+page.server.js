import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { profiles, chatConversations, chatMessages } from '$lib/server/db/schema.js';
import { and, asc, desc, eq } from 'drizzle-orm';

export const load = async ({ locals, params }) => {
	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.userId, locals.user.id))
		.limit(1);

	if (!profile) {
		throw error(404, 'No profile found');
	}

	const conversationId = Number(params.id);
	if (!Number.isInteger(conversationId)) {
		throw error(404, 'Conversation not found');
	}

	const [conversation] = await db
		.select()
		.from(chatConversations)
		.where(
			and(eq(chatConversations.id, conversationId), eq(chatConversations.profileId, profile.id))
		)
		.limit(1);

	if (!conversation) {
		throw error(404, 'Conversation not found');
	}

	const conversations = await db
		.select()
		.from(chatConversations)
		.where(eq(chatConversations.profileId, profile.id))
		.orderBy(desc(chatConversations.updatedAt));

	const messages = await db
		.select()
		.from(chatMessages)
		.where(eq(chatMessages.conversationId, conversationId))
		.orderBy(asc(chatMessages.createdAt));

	return { profile, conversation, conversations, messages };
};
