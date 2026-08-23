import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { profiles, workoutSessions, workoutSets } from '$lib/server/db/schema.js';
import { and, desc, eq, sql } from 'drizzle-orm';
import { unlink } from 'node:fs/promises';
import path from 'node:path';

const PAGE_SIZE = 10;

async function getProfileId(userId) {
	const [profile] = await db
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.userId, userId))
		.limit(1);
	return profile?.id ?? null;
}

function volumeByExercise(sets) {
	const totals = {};
	for (const set of sets) {
		totals[set.exercise] = (totals[set.exercise] ?? 0) + Number(set.weight) * Number(set.reps);
	}
	return totals;
}

export const load = async ({ locals, url }) => {
	const profileId = await getProfileId(locals.user.id);
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);

	if (!profileId) {
		return { sessions: [], page, totalPages: 0, needsProfile: true };
	}

	const [{ count: totalCount }] = await db
		.select({ count: sql`count(*)::int` })
		.from(workoutSessions)
		.where(eq(workoutSessions.profileId, profileId));

	const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

	// Fetch one extra session beyond the page so the oldest displayed session
	// on this page has something to compare its trend against.
	const rows = await db
		.select()
		.from(workoutSessions)
		.where(eq(workoutSessions.profileId, profileId))
		.orderBy(desc(workoutSessions.createdAt))
		.limit(PAGE_SIZE + 1)
		.offset((page - 1) * PAGE_SIZE);

	const rowsWithSets = await Promise.all(
		rows.map(async (session) => ({
			session,
			sets: await db.select().from(workoutSets).where(eq(workoutSets.sessionId, session.id))
		}))
	);

	const sessions = rowsWithSets.slice(0, PAGE_SIZE).map((entry, i) => {
		const olderVolumes = rowsWithSets[i + 1] ? volumeByExercise(rowsWithSets[i + 1].sets) : null;
		const currentVolumes = volumeByExercise(entry.sets);
		const exerciseNames = [...new Set(entry.sets.map((s) => s.exercise))];

		const trends = {};
		for (const name of exerciseNames) {
			if (!olderVolumes) {
				trends[name] = null;
			} else if (!(name in olderVolumes)) {
				trends[name] = 'new';
			} else {
				const diff = currentVolumes[name] - olderVolumes[name];
				trends[name] = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
			}
		}

		return {
			session: entry.session,
			sets: entry.sets,
			totalVolume: Object.values(currentVolumes).reduce((a, b) => a + b, 0),
			totalSets: entry.sets.length,
			exerciseCount: exerciseNames.length,
			trends
		};
	});

	return { sessions, page, totalPages, needsProfile: false };
};

export const actions = {
	deleteSession: async ({ request, locals }) => {
		const formData = await request.formData();
		const sessionId = Number(formData.get('sessionId'));
		if (!sessionId) return fail(400, { error: 'Invalid session' });

		const profileId = await getProfileId(locals.user.id);
		if (!profileId) return fail(403, { error: 'No profile' });

		const [session] = await db
			.select()
			.from(workoutSessions)
			.where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.profileId, profileId)))
			.limit(1);
		if (!session) return fail(404, { error: 'Session not found' });

		await db.delete(workoutSets).where(eq(workoutSets.sessionId, sessionId));
		await db.delete(workoutSessions).where(eq(workoutSessions.id, sessionId));

		if (session.videoUrl) {
			await unlink(path.join('static', session.videoUrl.replace(/^\//, ''))).catch(() => {});
		}

		return { deleted: true };
	}
};
