import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { profiles, workoutSessions, workoutSets, progress } from '$lib/server/db/schema.js';
import { generateWorkoutWithAI } from '$lib/server/aiWorkoutGenerator.js';
import { getTrainingSummary } from '$lib/server/trainingSummary.js';
import { and, count, desc, eq, gt, sql } from 'drizzle-orm';

// Once at least this many sessions have been logged since the plan was generated, nudge
// the user to regenerate — matches trainingSummary's look-back window, so by the time the
// nudge shows, the AI would actually have new history to react to.
const STALE_PLAN_SESSION_THRESHOLD = 5;

async function getProfile(userId) {
	const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
	return profile ?? null;
}

async function getRecentLogs(profileId, limit = 10) {
	if (!profileId) return [];

	return db
		.select({
			id: workoutSets.id,
			exercise: workoutSets.exercise,
			setNumber: workoutSets.setNumber,
			weight: workoutSets.weight,
			reps: workoutSets.reps,
			createdAt: workoutSessions.createdAt
		})
		.from(workoutSets)
		.innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
		.where(eq(workoutSessions.profileId, profileId))
		.orderBy(desc(workoutSessions.createdAt), workoutSets.setNumber)
		.limit(limit);
}

async function getProgressHistory(profileId, limit = 30) {
	if (!profileId) return [];

	const rows = await db
		.select({ weight: progress.weight, createdAt: progress.createdAt })
		.from(progress)
		.where(eq(progress.profileId, profileId))
		.orderBy(desc(progress.createdAt))
		.limit(limit);

	return rows.reverse().map((r) => ({ ...r, weight: Number(r.weight) }));
}

function computeStreak(sessionDates) {
	const uniqueDays = [...new Set(sessionDates.map((d) => new Date(d).toDateString()))]
		.map((s) => new Date(s))
		.sort((a, b) => b - a);

	if (uniqueDays.length === 0) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const daysSinceLast = Math.round((today - uniqueDays[0]) / 86400000);
	if (daysSinceLast > 1) return 0;

	let streak = 1;
	for (let i = 1; i < uniqueDays.length; i++) {
		const gap = Math.round((uniqueDays[i - 1] - uniqueDays[i]) / 86400000);
		if (gap === 1) streak++;
		else break;
	}
	return streak;
}

function startOfWeek(date) {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	d.setDate(d.getDate() - d.getDay());
	return d;
}

// Current streak plus which days of *this* week (Sun-Sat) have a logged session.
async function getActivityInsights(profileId) {
	if (!profileId) return { streak: 0, weekActivity: Array(7).fill(false) };

	const rows = await db
		.select({ createdAt: workoutSessions.createdAt })
		.from(workoutSessions)
		.where(eq(workoutSessions.profileId, profileId));

	const dates = rows.map((r) => r.createdAt);
	const streak = computeStreak(dates);

	const weekStart = startOfWeek(new Date());
	const weekActivity = Array(7).fill(false);
	for (const d of dates) {
		const day = new Date(d);
		day.setHours(0, 0, 0, 0);
		const diffDays = Math.round((day - weekStart) / 86400000);
		if (diffDays >= 0 && diffDays < 7) weekActivity[diffDays] = true;
	}

	return { streak, weekActivity };
}

async function getVolumeHistory(profileId, limit = 10) {
	if (!profileId) return [];

	const sessions = await db
		.select({ id: workoutSessions.id, createdAt: workoutSessions.createdAt })
		.from(workoutSessions)
		.where(eq(workoutSessions.profileId, profileId))
		.orderBy(desc(workoutSessions.createdAt))
		.limit(limit);

	const withVolume = await Promise.all(
		sessions.map(async (session) => {
			const sets = await db
				.select({ weight: workoutSets.weight, reps: workoutSets.reps })
				.from(workoutSets)
				.where(eq(workoutSets.sessionId, session.id));
			const volume = sets.reduce((sum, s) => sum + Number(s.weight) * Number(s.reps), 0);
			return { date: session.createdAt, volume };
		})
	);

	return withVolume.reverse();
}

// Returns the profile's cached AI-generated plan, generating and persisting one on
// first-ever visit (or if the cache is missing/corrupt) so subsequent loads are instant.
async function getOrCreateWorkout(profile, locale) {
	if (profile.generatedWorkout) {
		try {
			return JSON.parse(profile.generatedWorkout);
		} catch {
			// fall through and regenerate
		}
	}

	return regenerateWorkout(profile, locale);
}

async function regenerateWorkout(profile, locale) {
	const trainingSummary = await getTrainingSummary(profile.id);
	const workout = await generateWorkoutWithAI(profile, trainingSummary, locale);
	// Use the database's own clock (matching workoutSessions.createdAt's defaultNow()) rather
	// than a JS-side `new Date()` — the two can land up to an hour apart against a
	// `timestamp without time zone` column depending on DST/session timezone casting, which
	// would throw off the "sessions since generated" comparison below.
	await db
		.update(profiles)
		.set({ generatedWorkout: JSON.stringify(workout), generatedWorkoutAt: sql`now()` })
		.where(eq(profiles.id, profile.id));
	return workout;
}

// How many sessions have been logged since the plan was last (re)generated, so the
// dashboard can nudge the user once there's enough new history to be worth reacting to.
async function getSessionsSinceGenerated(profileId, generatedAt) {
	if (!profileId || !generatedAt) return 0;

	const [row] = await db
		.select({ count: count() })
		.from(workoutSessions)
		.where(
			and(eq(workoutSessions.profileId, profileId), gt(workoutSessions.createdAt, generatedAt))
		);

	return row?.count ?? 0;
}

export const load = async ({ locals }) => {
	const profile = await getProfile(locals.user.id);
	const workout = profile ? await getOrCreateWorkout(profile, locals.locale) : null;
	const logs = await getRecentLogs(profile?.id);
	const progressHistory = await getProgressHistory(profile?.id);
	const { streak, weekActivity } = await getActivityInsights(profile?.id);
	const volumeHistory = await getVolumeHistory(profile?.id);
	const sessionsSinceGenerated = profile
		? await getSessionsSinceGenerated(profile.id, profile.generatedWorkoutAt)
		: 0;

	return {
		profile,
		workout,
		logs,
		progressHistory,
		streak,
		weekActivity,
		volumeHistory,
		planIsStale: sessionsSinceGenerated >= STALE_PLAN_SESSION_THRESHOLD,
		userName: locals.user.name,
		userImage: locals.user.image
	};
};

export const actions = {
	generate: async ({ locals }) => {
		const profile = await getProfile(locals.user.id);

		if (!profile) {
			return { workout: [] };
		}

		const workout = await regenerateWorkout(profile, locals.locale);

		return { workout };
	},

	logWeight: async ({ request, locals }) => {
		const profile = await getProfile(locals.user.id);
		if (!profile) return fail(403, { weightError: 'No profile found' });

		const formData = await request.formData();
		const weight = Number(formData.get('weight'));
		if (!weight || weight <= 0) {
			return fail(400, { weightError: 'Enter a valid weight' });
		}

		await db.insert(progress).values({ profileId: profile.id, weight });

		return { weightSuccess: true };
	}
};
