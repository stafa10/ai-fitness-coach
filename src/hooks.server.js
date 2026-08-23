import { auth } from '$lib/server/auth.js';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { DEFAULT_LOCALE, LOCALE_DIR, isSupportedLocale } from '$lib/i18n/locales.js';

export async function handle({ event, resolve }) {
	const session = await auth.api.getSession({ headers: event.request.headers });

	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	const cookieLocale = event.cookies.get('locale');
	const locale = isSupportedLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
	event.locals.locale = locale;

	return svelteKitHandler({
		event,
		resolve: (ev) =>
			resolve(ev, {
				transformPageChunk: ({ html }) =>
					html.replace('lang="en"', `lang="${locale}" dir="${LOCALE_DIR[locale] ?? 'ltr'}"`)
			}),
		auth
	});
}
