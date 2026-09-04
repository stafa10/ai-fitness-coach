import { db } from './db/index.js';
import { workoutSessions, workoutSets } from './db/schema.js';
import { eq } from 'drizzle-orm';

const TREND_POINTS = 12;

// All-time personal record (max weight ever logged) per exercise, plus a
// per-exercise sparkline of each session's top weight for that exercise. Shared by
// workout-log (per-session PR badges) and the dashboard (strength progression chart).
export async function getExerciseInsights(profileId) {
	if (!profileId) return { records: {}, trends: {} };

	const rows = await db
		.select({
			exercise: workoutSets.exercise,
			weight: workoutSets.weight,
			reps: workoutSets.reps,
			sessionId: workoutSets.sessionId,
			createdAt: workoutSessions.createdAt
		})
		.from(workoutSets)
		.innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
		.where(eq(workoutSessions.profileId, profileId));

	const records = {};
	const bestPerSession = {};

	for (const row of rows) {
		const weight = Number(row.weight);
		if (weight <= 0) continue;

		const record = records[row.exercise];
		if (!record || weight > record.weight) {
			records[row.exercise] = { weight, reps: row.reps, date: row.createdAt };
		}

		bestPerSession[row.exercise] ??= new Map();
		const sessionMap = bestPerSession[row.exercise];
		const existing = sessionMap.get(row.sessionId);
		if (!existing || weight > existing.weight) {
			sessionMap.set(row.sessionId, { weight, date: row.createdAt });
		}
	}

	const trends = {};
	for (const [exercise, sessionMap] of Object.entries(bestPerSession)) {
		trends[exercise] = [...sessionMap.values()]
			.sort((a, b) => new Date(a.date) - new Date(b.date))
			.slice(-TREND_POINTS);
	}

	return { records, trends };
}
