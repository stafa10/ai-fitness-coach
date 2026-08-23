import { db } from '$lib/server/db/index.js';
import { siteSettings } from '$lib/server/db/schema.js';

export const load = async () => {
	const [settings] = await db.select().from(siteSettings).limit(1);
	return { heroVideoUrl: settings?.heroVideoUrl ?? null };
};
