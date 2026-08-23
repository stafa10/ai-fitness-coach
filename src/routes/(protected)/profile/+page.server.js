import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { profiles, user } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { saveAvatar } from '$lib/server/avatar.js';

export const load = async ({ locals }) => {
	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.userId, locals.user.id))
		.limit(1);

	return { profile: profile ?? null, avatarUrl: locals.user.image ?? null };
};

export const actions = {
	save: async ({ request, locals }) => {
		const data = await request.formData();

		const age = Number(data.get('age'));
		const height = Number(data.get('height'));
		const weight = Number(data.get('weight'));

		const gender = data.get('gender')?.toString() || null;
		const goal = data.get('goal')?.toString() || '';
		const experience = data.get('experience')?.toString() || '';

		const activityLevel = data.get('activity')?.toString() || null;

		const workoutDays = data.get('workout_days') ? Number(data.get('workout_days')) : null;

		const equipmentAccess = data.get('equipment')?.toString() || null;

		const injuries = data.get('injuries')?.toString() || null;

		if (!age || !height || !weight || !goal || !experience) {
			return fail(400, {
				error: 'Please complete all required fields.'
			});
		}

		const values = {
			userId: locals.user.id,
			age,
			height,
			weight,
			gender,
			goal,
			experience,
			activityLevel,
			workoutDays,
			equipmentAccess,
			injuries
		};

		const [existing] = await db
			.select({ id: profiles.id })
			.from(profiles)
			.where(eq(profiles.userId, locals.user.id))
			.limit(1);

		if (existing) {
			// Clear the cached AI plan so the dashboard regenerates one that reflects the
			// updated goal/equipment/injuries on next load, instead of showing a stale plan.
			await db
				.update(profiles)
				.set({ ...values, generatedWorkout: null, generatedWorkoutAt: null })
				.where(eq(profiles.id, existing.id));
		} else {
			await db.insert(profiles).values(values);
		}

		throw redirect(302, '/dashboard');
	},

	changeAvatar: async ({ request, locals }) => {
		const data = await request.formData();
		const avatar = data.get('avatar');

		if (!(avatar instanceof File) || avatar.size === 0) {
			return fail(400, { avatarError: 'Choose a photo first.' });
		}

		let image;
		try {
			image = await saveAvatar(avatar);
		} catch (err) {
			return fail(400, { avatarError: err.message });
		}

		await db.update(user).set({ image }).where(eq(user.id, locals.user.id));

		return { avatarSuccess: true };
	}
};
