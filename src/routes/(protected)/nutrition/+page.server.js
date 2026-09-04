import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { profiles, foods, foodLogs } from '$lib/server/db/schema.js';
import { and, asc, desc, eq, gte } from 'drizzle-orm';

async function getProfile(userId) {
	const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
	return profile ?? null;
}

async function getFoods(profileId) {
	if (!profileId) return [];
	return db.select().from(foods).where(eq(foods.profileId, profileId)).orderBy(asc(foods.name));
}

async function getTodayLog(profileId) {
	if (!profileId) return [];

	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	return db
		.select({
			id: foodLogs.id,
			servings: foodLogs.servings,
			createdAt: foodLogs.createdAt,
			foodId: foods.id,
			name: foods.name,
			servingSize: foods.servingSize,
			calories: foods.calories,
			protein: foods.protein,
			carbs: foods.carbs,
			fats: foods.fats
		})
		.from(foodLogs)
		.innerJoin(foods, eq(foodLogs.foodId, foods.id))
		.where(and(eq(foodLogs.profileId, profileId), gte(foodLogs.createdAt, todayStart)))
		.orderBy(desc(foodLogs.createdAt));
}

async function getProfileId(userId) {
	const [profile] = await db
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.userId, userId))
		.limit(1);
	return profile?.id ?? null;
}

export const load = async ({ locals }) => {
	const profile = await getProfile(locals.user.id);
	const library = await getFoods(profile?.id);
	const todayLog = await getTodayLog(profile?.id);

	return { profile, library, todayLog };
};

export const actions = {
	addFood: async ({ request, locals }) => {
		const profileId = await getProfileId(locals.user.id);
		if (!profileId) return fail(403, { foodError: 'No profile found' });

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const servingSize = data.get('servingSize')?.toString().trim();
		const calories = Number(data.get('calories'));
		const protein = Number(data.get('protein')) || 0;
		const carbs = Number(data.get('carbs')) || 0;
		const fats = Number(data.get('fats')) || 0;

		if (!name || !servingSize || !calories || calories <= 0) {
			return fail(400, { foodError: 'Name, serving size, and calories are required.' });
		}

		await db.insert(foods).values({
			profileId,
			name,
			servingSize,
			calories: Math.round(calories),
			protein: Math.round(protein),
			carbs: Math.round(carbs),
			fats: Math.round(fats)
		});

		return { foodSuccess: true };
	},

	deleteFood: async ({ request, locals }) => {
		const profileId = await getProfileId(locals.user.id);
		if (!profileId) return fail(403, { foodError: 'No profile found' });

		const data = await request.formData();
		const foodId = Number(data.get('foodId'));
		if (!foodId) return fail(400, { foodError: 'Invalid food' });

		// Cascades to any diary entries logged against it.
		await db.delete(foods).where(and(eq(foods.id, foodId), eq(foods.profileId, profileId)));

		return { deleted: true };
	},

	logFood: async ({ request, locals }) => {
		const profileId = await getProfileId(locals.user.id);
		if (!profileId) return fail(403, { logError: 'No profile found' });

		const data = await request.formData();
		const foodId = Number(data.get('foodId'));
		const servings = Number(data.get('servings')) || 1;

		if (!foodId || servings <= 0) {
			return fail(400, { logError: 'Choose a food and a valid number of servings.' });
		}

		const [food] = await db
			.select({ id: foods.id })
			.from(foods)
			.where(and(eq(foods.id, foodId), eq(foods.profileId, profileId)))
			.limit(1);
		if (!food) return fail(404, { logError: 'Food not found' });

		await db.insert(foodLogs).values({ profileId, foodId, servings });

		return { logSuccess: true };
	},

	deleteLogEntry: async ({ request, locals }) => {
		const profileId = await getProfileId(locals.user.id);
		if (!profileId) return fail(403, { logError: 'No profile found' });

		const data = await request.formData();
		const logId = Number(data.get('logId'));
		if (!logId) return fail(400, { logError: 'Invalid entry' });

		await db.delete(foodLogs).where(and(eq(foodLogs.id, logId), eq(foodLogs.profileId, profileId)));

		return { deleted: true };
	}
};
