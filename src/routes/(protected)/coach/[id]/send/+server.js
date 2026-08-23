import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { profiles, chatConversations, chatMessages } from '$lib/server/db/schema.js';
import { openai } from '$lib/server/openai.js';
import { buildCoachSystemPrompt } from '$lib/server/coachPrompt.js';
import { getTrainingSummary } from '$lib/server/trainingSummary.js';
import { and, asc, eq } from 'drizzle-orm';

function titleFromMessage(text) {
	const oneLine = text.replace(/\s+/g, ' ').trim();
	return oneLine.length > 48 ? oneLine.slice(0, 48).trimEnd() + '…' : oneLine;
}

export const POST = async ({ request, locals, params }) => {
	const body = await request.json();
	const text = body?.message?.toString().trim();
	if (!text) {
		throw error(400, 'Message required');
	}

	const conversationId = Number(params.id);

	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.userId, locals.user.id))
		.limit(1);
	if (!profile) {
		throw error(404, 'No profile found');
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

	const history = await db
		.select()
		.from(chatMessages)
		.where(eq(chatMessages.conversationId, conversationId))
		.orderBy(asc(chatMessages.createdAt));

	await db.insert(chatMessages).values({ conversationId, role: 'user', content: text });

	const updates = { updatedAt: new Date() };
	if (history.length === 0) {
		updates.title = titleFromMessage(text);
	}
	await db.update(chatConversations).set(updates).where(eq(chatConversations.id, conversationId));

	const trainingSummary = await getTrainingSummary(profile.id);

	const completion = await openai.chat.completions.create({
		model: 'gpt-5.5',
		max_completion_tokens: 1500,
		stream: true,
		messages: [
			{ role: 'system', content: buildCoachSystemPrompt(profile, trainingSummary) },
			...history.map((m) => ({ role: m.role, content: m.content })),
			{ role: 'user', content: text }
		]
	});

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			let fullText = '';

			try {
				for await (const chunk of completion) {
					const delta = chunk.choices[0]?.delta?.content;
					if (delta) {
						fullText += delta;
						controller.enqueue(encoder.encode(delta));
					}
				}

				if (!fullText) {
					fullText =
						"Sorry, I can't help with that one. Let's get back to your training or nutrition — what would you like to know?";
					controller.enqueue(encoder.encode(fullText));
				}

				await db
					.insert(chatMessages)
					.values({ conversationId, role: 'assistant', content: fullText });
			} catch (err) {
				controller.error(err);
				return;
			}

			controller.close();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'X-Conversation-Title': encodeURIComponent(updates.title ?? conversation.title)
		}
	});
};
