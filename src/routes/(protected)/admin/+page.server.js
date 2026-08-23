import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import {
	user,
	profiles,
	workoutSessions,
	workoutSets,
	progress,
	chatConversations,
	siteSettings
} from '$lib/server/db/schema.js';
import { desc, eq, sql } from 'drizzle-orm';
import { ADMIN_EMAIL } from '$env/static/private';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { saveSiteVideo } from '$lib/server/siteVideo.js';

function assertAdmin(locals) {
	if (!locals.user || locals.user.email !== ADMIN_EMAIL) {
		throw error(404, 'Not found');
	}
}

export const load = async ({ locals }) => {
	assertAdmin(locals);

	const allUsers = await db.select().from(user).orderBy(desc(user.createdAt));

	const rows = await Promise.all(
		allUsers.map(async (u) => {
			const [profile] = await db.select().from(profiles).where(eq(profiles.userId, u.id)).limit(1);

			let sessionCount = 0;
			let chatCount = 0;
			if (profile) {
				const [{ count: sc }] = await db
					.select({ count: sql`count(*)::int` })
					.from(workoutSessions)
					.where(eq(workoutSessions.profileId, profile.id));
				sessionCount = sc;

				const [{ count: cc }] = await db
					.select({ count: sql`count(*)::int` })
					.from(chatConversations)
					.where(eq(chatConversations.profileId, profile.id));
				chatCount = cc;
			}

			return {
				id: u.id,
				name: u.name,
				email: u.email,
				emailVerified: u.emailVerified,
				createdAt: u.createdAt,
				hasProfile: !!profile,
				sessionCount,
				chatCount
			};
		})
	);

	const [settings] = await db.select().from(siteSettings).limit(1);

	return { users: rows, adminId: locals.user.id, heroVideoUrl: settings?.heroVideoUrl ?? null };
};

async function upsertSiteSettings(values) {
	const [existing] = await db.select().from(siteSettings).limit(1);
	if (existing) {
		await db.update(siteSettings).set(values).where(eq(siteSettings.id, existing.id));
	} else {
		await db.insert(siteSettings).values(values);
	}
}

export const actions = {
	uploadHeroVideo: async ({ request, locals }) => {
		assertAdmin(locals);

		const formData = await request.formData();
		const video = formData.get('video');
		if (!(video instanceof File) || video.size === 0) {
			return fail(400, { videoError: 'Choose a video first.' });
		}

		let url;
		try {
			url = await saveSiteVideo(video);
		} catch (err) {
			return fail(400, { videoError: err.message });
		}

		const [existing] = await db.select().from(siteSettings).limit(1);
		if (existing?.heroVideoUrl) {
			await unlink(path.join('static', existing.heroVideoUrl.replace(/^\//, ''))).catch(() => {});
		}
		await upsertSiteSettings({ heroVideoUrl: url, updatedAt: new Date() });

		return { videoSuccess: true };
	},

	removeHeroVideo: async ({ locals }) => {
		assertAdmin(locals);

		const [existing] = await db.select().from(siteSettings).limit(1);
		if (existing?.heroVideoUrl) {
			await unlink(path.join('static', existing.heroVideoUrl.replace(/^\//, ''))).catch(() => {});
			await upsertSiteSettings({ heroVideoUrl: null, updatedAt: new Date() });
		}

		return { videoRemoved: true };
	},

	deleteUser: async ({ request, locals }) => {
		assertAdmin(locals);

		const formData = await request.formData();
		const targetId = formData.get('userId');
		if (!targetId) return fail(400, { error: 'Missing user id' });
		if (targetId === locals.user.id) {
			return fail(400, { error: "You can't delete your own admin account from here." });
		}

		const [profile] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.userId, targetId))
			.limit(1);

		if (profile) {
			const sessions = await db
				.select()
				.from(workoutSessions)
				.where(eq(workoutSessions.profileId, profile.id));

			for (const session of sessions) {
				await db.delete(workoutSets).where(eq(workoutSets.sessionId, session.id));
				if (session.videoUrl) {
					await unlink(path.join('static', session.videoUrl.replace(/^\//, ''))).catch(() => {});
				}
			}
			await db.delete(workoutSessions).where(eq(workoutSessions.profileId, profile.id));
			await db.delete(progress).where(eq(progress.profileId, profile.id));
			// profile -> chat_conversations -> chat_messages all cascade from here
		}

		await db.delete(user).where(eq(user.id, targetId));

		return { success: true };
	}
};
