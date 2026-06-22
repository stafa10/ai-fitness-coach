import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { profiles } from '$lib/server/db/schema.js';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const age = Number(data.get('age'));
		const height = data.get('height');
		const weight = data.get('weight');
		const goal = data.get('goal');
		const experience = data.get('experience');
		const gender = data.get('gender') || null;
		const activity = data.get('activity') || null;
		const injuries = data.get('injuries') || null;
		const workout_days = data.get('workout_days')
			? Number(data.get('workout_days'))
			: null;
		const equipment = data.get('equipment') || null;

		if (!age || !height || !weight || !goal || !experience) {
			return fail(400, { error: 'Please fill in all required fields.' });
		}

		await db.insert(profiles).values({
			age,
			height: String(height),
			weight: String(weight),
			goal,
			experience,
			gender,
			activity_level: activity,
			injuries,
			workout_days,
			equipment_access: equipment
		});

		return { success: true };
	}
};