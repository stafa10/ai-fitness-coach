import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export async function handle({ event, resolve }) {

    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    console.log("SESSION:", session);
    console.log("COOKIE:", event.request.headers.get("cookie"));

    if (session) {
        event.locals.user = session.user;
        event.locals.session = session.session;
    }

    return svelteKitHandler({ event, resolve, auth });
}