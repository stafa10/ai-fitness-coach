import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { profiles, workoutSessions, workoutSets } from '$lib/server/db/schema.js';
import { and, desc, eq, ne } from 'drizzle-orm';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { computeStreak } from '$lib/server/trainingSummary.js';
import { getExerciseInsights } from '$lib/server/exerciseInsights.js';

const UPLOAD_DIR = path.join('static', 'uploads', 'workouts');
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB
const VIDEO_EXT_BY_MIME = {
	'video/mp4': 'mp4',
	'video/webm': 'webm',
	'video/quicktime': 'mov',
	'video/x-matroska': 'mkv'
};

const WORKOUT_PLAN = [
	{ day: 1, exercise: 'Bench Press' },
	{ day: 1, exercise: 'Overhead Press' },
	{ day: 1, exercise: 'Incline Press' },
	{ day: 1, exercise: 'Dips' },
	{ day: 1, exercise: 'Lateral Raises' },
	{ day: 2, exercise: 'Pull Ups' },
	{ day: 2, exercise: 'Rows' },
	{ day: 2, exercise: 'Lat Pulldown' },
	{ day: 2, exercise: 'Face Pulls' },
	{ day: 2, exercise: 'Bicep Curls' },
	{ day: 3, exercise: 'Squats' },
	{ day: 3, exercise: 'Leg Press' },
	{ day: 3, exercise: 'Leg Curls' },
	{ day: 3, exercise: 'Leg Extensions' },
	{ day: 3, exercise: 'Calf Raises' },
	{ day: 4, exercise: 'Bench Press' },
	{ day: 4, exercise: 'Pull Ups' },
	{ day: 4, exercise: 'Overhead Press' },
	{ day: 4, exercise: 'Rows' },
	{ day: 4, exercise: 'Dips' },
	{ day: 5, exercise: 'Squats' },
	{ day: 5, exercise: 'Deadlifts' },
	{ day: 5, exercise: 'Leg Curls' },
	{ day: 5, exercise: 'Leg Extensions' },
	{ day: 5, exercise: 'Calf Raises' }
];

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

const SESSIONS_SHOWN = 2;

// Post-save summary: new PRs hit this session, volume vs the previous session,
// and the resulting streak — everything shown on the "workout saved" card.
async function computeSessionInsights(profileId, sessionId, workout) {
	const thisVolume = workout.reduce(
		(sum, ex) => sum + ex.sets.reduce((s, set) => s + Number(set.weight) * Number(set.reps), 0),
		0
	);

	const [prevSession] = await db
		.select()
		.from(workoutSessions)
		.where(and(eq(workoutSessions.profileId, profileId), ne(workoutSessions.id, sessionId)))
		.orderBy(desc(workoutSessions.createdAt))
		.limit(1);

	let volumeDeltaPct = null;
	if (prevSession) {
		const prevSets = await db
			.select()
			.from(workoutSets)
			.where(eq(workoutSets.sessionId, prevSession.id));
		const prevVolume = prevSets.reduce((sum, s) => sum + Number(s.weight) * Number(s.reps), 0);
		if (prevVolume > 0) {
			volumeDeltaPct = Math.round(((thisVolume - prevVolume) / prevVolume) * 100);
		}
	}

	const newPRs = [];
	for (const exercise of workout) {
		const thisMax = Math.max(0, ...exercise.sets.map((s) => Number(s.weight) || 0));
		if (thisMax <= 0) continue;

		const priorRows = await db
			.select({ weight: workoutSets.weight })
			.from(workoutSets)
			.innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
			.where(
				and(
					eq(workoutSessions.profileId, profileId),
					eq(workoutSets.exercise, exercise.name),
					ne(workoutSessions.id, sessionId)
				)
			);
		const priorMax = priorRows.reduce((m, r) => Math.max(m, Number(r.weight)), 0);

		if (thisMax > priorMax) newPRs.push(exercise.name);
	}

	const allDates = await db
		.select({ createdAt: workoutSessions.createdAt })
		.from(workoutSessions)
		.where(eq(workoutSessions.profileId, profileId));
	const streak = computeStreak(allDates.map((r) => r.createdAt));

	return { totalVolume: Math.round(thisVolume), volumeDeltaPct, newPRs, streak };
}

export const load = async ({ locals }) => {
	const profileId = await getProfileId(locals.user.id);

	if (!profileId) {
		return { workoutPlan: WORKOUT_PLAN, previousSessions: [], needsProfile: true };
	}

	// Fetch one extra session beyond what's shown, purely so the oldest displayed
	// session has something to compare its trend against.
	const sessions = await db
		.select()
		.from(workoutSessions)
		.where(eq(workoutSessions.profileId, profileId))
		.orderBy(desc(workoutSessions.createdAt))
		.limit(SESSIONS_SHOWN + 1);

	const sessionsWithSets = await Promise.all(
		sessions.map(async (session) => ({
			session,
			sets: await db.select().from(workoutSets).where(eq(workoutSets.sessionId, session.id))
		}))
	);

	const previousSessions = sessionsWithSets.slice(0, SESSIONS_SHOWN).map((entry, i) => {
		const olderVolumes = sessionsWithSets[i + 1]
			? volumeByExercise(sessionsWithSets[i + 1].sets)
			: null;
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

	// Per-set lookup (exercise + set number) from the single most recent session,
	// so the logging form can show "last time" beside each set as it's typed.
	const lastSessionSets = {};
	if (sessionsWithSets[0]) {
		for (const set of sessionsWithSets[0].sets) {
			(lastSessionSets[set.exercise] ??= []).push({
				setNumber: set.setNumber,
				weight: Number(set.weight),
				reps: Number(set.reps)
			});
		}
	}

	const { records: personalRecords, trends: exerciseTrends } = await getExerciseInsights(profileId);

	return {
		workoutPlan: WORKOUT_PLAN,
		previousSessions,
		lastSessionSets,
		personalRecords,
		exerciseTrends,
		needsProfile: false
	};
};

export const actions = {
	save: async ({ request, locals }) => {
		const formData = await request.formData();
		const workoutJson = formData.get('workout');
		if (!workoutJson) return fail(400, { error: 'No workout data' });

		const workout = JSON.parse(workoutJson);
		if (!Array.isArray(workout) || workout.length === 0) {
			return fail(400, { error: 'At least one exercise required' });
		}

		const hasLoggedSet = workout.some((ex) =>
			ex.sets.some((s) => Number(s.weight) > 0 || Number(s.reps) > 0)
		);
		if (!hasLoggedSet) {
			return fail(400, { error: 'Log at least one set with a weight or rep count.' });
		}

		const video = formData.get('video');
		if (video instanceof File && video.size > 0) {
			if (!video.type.startsWith('video/')) {
				return fail(400, { error: 'Attachment must be a video file' });
			}
			if (video.size > MAX_VIDEO_BYTES) {
				return fail(400, { error: 'Video must be under 200MB' });
			}
		}

		const profileId = await getProfileId(locals.user.id);
		if (!profileId) {
			throw redirect(302, '/profile');
		}

		const [session] = await db.insert(workoutSessions).values({ profileId }).returning();

		for (const exercise of workout) {
			for (const set of exercise.sets) {
				// Skip untouched sets (the form always submits every set slot for every
				// exercise in the day's template, most left at their 0/0 default).
				if (Number(set.weight) <= 0 && Number(set.reps) <= 0) continue;

				await db.insert(workoutSets).values({
					sessionId: session.id,
					exercise: exercise.name,
					setNumber: set.setNumber,
					weight: set.weight,
					reps: set.reps
				});
			}
		}

		if (video instanceof File && video.size > 0) {
			const ext = VIDEO_EXT_BY_MIME[video.type] ?? 'mp4';
			const filename = `${session.id}-${randomUUID()}.${ext}`;
			await mkdir(UPLOAD_DIR, { recursive: true });
			await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await video.arrayBuffer()));
			await db
				.update(workoutSessions)
				.set({ videoUrl: `/uploads/workouts/${filename}` })
				.where(eq(workoutSessions.id, session.id));
		}

		const insights = await computeSessionInsights(profileId, session.id, workout);

		return { success: true, insights };
	},

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
