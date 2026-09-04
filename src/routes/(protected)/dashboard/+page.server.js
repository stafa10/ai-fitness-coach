import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import {
	profiles,
	workoutSessions,
	workoutSets,
	progress,
	foods,
	foodLogs
} from '$lib/server/db/schema.js';
import { generateWorkoutWithAI } from '$lib/server/aiWorkoutGenerator.js';
import { getTrainingSummary } from '$lib/server/trainingSummary.js';
import { getExerciseInsights } from '$lib/server/exerciseInsights.js';
import { and, count, desc, eq, gt, gte, inArray, sql } from 'drizzle-orm';

const HEATMAP_WEEKS = 12;

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

// Current workout streak (consecutive days with a logged session, ending today or
// yesterday). The old "this week" dot-strip is superseded by the 12-week adherence
// heatmap below, which shows the same current week plus 11 more.
async function getActivityInsights(profileId) {
	if (!profileId) return { streak: 0 };

	const rows = await db
		.select({ createdAt: workoutSessions.createdAt })
		.from(workoutSessions)
		.where(eq(workoutSessions.profileId, profileId));

	const streak = computeStreak(rows.map((r) => r.createdAt));

	return { streak };
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

// Local calendar-date key (YYYY-MM-DD) using the date's own local components — never mix
// this with `.toISOString()`, which reflects UTC and can land on the *previous* local day
// once the server's timezone is ahead of UTC (bit us once already with generatedWorkoutAt).
function localDateKey(date) {
	const d = new Date(date);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

// Last 12 weeks of training activity (Sun–Sat rows), for the dashboard's consistency
// heatmap. Each day only reports whether *something* was logged and how much volume —
// this app doesn't pin training to specific weekdays (users log freely against a
// rotating N-day split), so we don't fabricate a "missed vs rest day" distinction that
// would require guessing which days were actually scheduled.
async function getAdherenceHeatmap(profileId) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const gridStart = startOfWeek(today);
	gridStart.setDate(gridStart.getDate() - (HEATMAP_WEEKS - 1) * 7);

	const volumeByDay = {};

	if (profileId) {
		const sessions = await db
			.select({ id: workoutSessions.id, createdAt: workoutSessions.createdAt })
			.from(workoutSessions)
			.where(
				and(eq(workoutSessions.profileId, profileId), gte(workoutSessions.createdAt, gridStart))
			);

		if (sessions.length) {
			const sets = await db
				.select({
					sessionId: workoutSets.sessionId,
					weight: workoutSets.weight,
					reps: workoutSets.reps
				})
				.from(workoutSets)
				.where(
					inArray(
						workoutSets.sessionId,
						sessions.map((s) => s.id)
					)
				);

			const volumeBySession = {};
			for (const s of sets) {
				volumeBySession[s.sessionId] =
					(volumeBySession[s.sessionId] ?? 0) + Number(s.weight) * Number(s.reps);
			}
			for (const session of sessions) {
				const key = localDateKey(session.createdAt);
				volumeByDay[key] = (volumeByDay[key] ?? 0) + (volumeBySession[session.id] ?? 0);
			}
		}
	}

	const grid = [];
	for (let w = 0; w < HEATMAP_WEEKS; w++) {
		const week = [];
		for (let d = 0; d < 7; d++) {
			const day = new Date(gridStart);
			day.setDate(day.getDate() + w * 7 + d);
			const key = localDateKey(day);
			week.push({
				date: key,
				volume: Math.round(volumeByDay[key] ?? 0),
				done: (volumeByDay[key] ?? 0) > 0,
				isFuture: day > today
			});
		}
		grid.push(week);
	}
	return grid;
}

// What's actually been logged in the food diary today, so the nutrition panel can show
// "X of Y kcal so far" instead of only the static target.
async function getTodayNutrition(profileId) {
	if (!profileId) return null;

	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const rows = await db
		.select({
			calories: foods.calories,
			protein: foods.protein,
			carbs: foods.carbs,
			fats: foods.fats,
			servings: foodLogs.servings
		})
		.from(foodLogs)
		.innerJoin(foods, eq(foodLogs.foodId, foods.id))
		.where(and(eq(foodLogs.profileId, profileId), gte(foodLogs.createdAt, todayStart)));

	if (rows.length === 0) return { calories: 0, protein: 0, carbs: 0, fats: 0, entries: 0 };

	return rows.reduce(
		(acc, r) => {
			const mult = Number(r.servings);
			acc.calories += Math.round(r.calories * mult);
			acc.protein += Math.round(r.protein * mult);
			acc.carbs += Math.round(r.carbs * mult);
			acc.fats += Math.round(r.fats * mult);
			acc.entries += 1;
			return acc;
		},
		{ calories: 0, protein: 0, carbs: 0, fats: 0, entries: 0 }
	);
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
	const { streak } = await getActivityInsights(profile?.id);
	const volumeHistory = await getVolumeHistory(profile?.id);
	const sessionsSinceGenerated = profile
		? await getSessionsSinceGenerated(profile.id, profile.generatedWorkoutAt)
		: 0;
	const adherenceHeatmap = await getAdherenceHeatmap(profile?.id);
	const { trends: exerciseTrends } = await getExerciseInsights(profile?.id);
	const todayNutrition = await getTodayNutrition(profile?.id);

	return {
		profile,
		workout,
		logs,
		progressHistory,
		streak,
		volumeHistory,
		adherenceHeatmap,
		exerciseTrends,
		todayNutrition,
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
