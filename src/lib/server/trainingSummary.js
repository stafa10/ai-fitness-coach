import { db } from './db/index.js';
import { workoutSessions, workoutSets, progress } from './db/schema.js';
import { desc, eq } from 'drizzle-orm';

const RECENT_SESSIONS = 5;

export function computeStreak(sessionDates) {
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

// A compact, factual summary of what this profile has actually logged, so the
// AI coach can reference real training history instead of only static profile fields.
export async function getTrainingSummary(profileId) {
	if (!profileId) return null;

	const recentSessions = await db
		.select()
		.from(workoutSessions)
		.where(eq(workoutSessions.profileId, profileId))
		.orderBy(desc(workoutSessions.createdAt))
		.limit(RECENT_SESSIONS);

	const recentWithSets = await Promise.all(
		recentSessions.map(async (session) => ({
			session,
			sets: await db.select().from(workoutSets).where(eq(workoutSets.sessionId, session.id))
		}))
	);

	const allSetsRows = await db
		.select({
			exercise: workoutSets.exercise,
			weight: workoutSets.weight,
			reps: workoutSets.reps,
			createdAt: workoutSessions.createdAt
		})
		.from(workoutSets)
		.innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
		.where(eq(workoutSessions.profileId, profileId));

	if (allSetsRows.length === 0 && recentSessions.length === 0) {
		return 'This person has not logged any workouts yet.';
	}

	const records = {};
	for (const row of allSetsRows) {
		const weight = Number(row.weight);
		if (weight <= 0) continue;
		const existing = records[row.exercise];
		if (!existing || weight > existing.weight) {
			records[row.exercise] = { weight, reps: row.reps };
		}
	}

	const streak = computeStreak(allSetsRows.map((r) => r.createdAt));

	const weightRows = await db
		.select({ weight: progress.weight, createdAt: progress.createdAt })
		.from(progress)
		.where(eq(progress.profileId, profileId))
		.orderBy(desc(progress.createdAt))
		.limit(2);

	const lines = [];

	if (recentWithSets.length > 0) {
		lines.push('Recent workout sessions (most recent first):');
		for (const { session, sets } of recentWithSets) {
			const loggedSets = sets.filter((s) => Number(s.weight) > 0 || Number(s.reps) > 0);
			const exerciseNames = [...new Set(loggedSets.map((s) => s.exercise))];
			const volume = loggedSets.reduce((sum, s) => sum + Number(s.weight) * Number(s.reps), 0);
			const date = new Date(session.createdAt).toLocaleDateString('en-IE', {
				day: 'numeric',
				month: 'short'
			});
			lines.push(
				`- ${date}: ${exerciseNames.join(', ') || 'no exercises recorded'} (${loggedSets.length} sets, ${Math.round(volume)}kg total volume)`
			);
		}
	} else {
		lines.push('No workout sessions logged yet.');
	}

	const recordEntries = Object.entries(records).sort((a, b) => a[0].localeCompare(b[0]));
	if (recordEntries.length > 0) {
		lines.push('\nPersonal records (heaviest weight ever logged per exercise):');
		for (const [name, r] of recordEntries) {
			lines.push(`- ${name}: ${r.weight}kg x ${r.reps} reps`);
		}
	}

	lines.push(`\nCurrent workout streak: ${streak} day${streak === 1 ? '' : 's'} in a row.`);

	if (weightRows.length > 0) {
		const latest = weightRows[0];
		const latestDate = new Date(latest.createdAt).toLocaleDateString('en-IE', {
			day: 'numeric',
			month: 'short'
		});
		lines.push(`\nMost recently logged bodyweight: ${latest.weight}kg (on ${latestDate}).`);
		if (weightRows.length > 1) {
			const delta = Number(latest.weight) - Number(weightRows[1].weight);
			if (Math.abs(delta) >= 0.1) {
				lines.push(
					`Trending ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta).toFixed(1)}kg since the previous weigh-in.`
				);
			}
		}
	}

	return lines.join('\n');
}
