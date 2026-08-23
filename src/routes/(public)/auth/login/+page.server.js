import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth.js';

export const actions = {
	login: async ({ request, url }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Enter your email and password.', email });
		}

		try {
			await auth.api.signInEmail({ body: { email, password }, headers: request.headers });
		} catch (error) {
			if (error instanceof APIError) {
				const unverified = error.body?.code === 'EMAIL_NOT_VERIFIED';
				return fail(400, {
					error: unverified
						? 'Verify your email before signing in — check your inbox for the link.'
						: error.message,
					unverified,
					email
				});
			}
			throw error;
		}

		const next = url.searchParams.get('next');
		throw redirect(302, next && next.startsWith('/') ? next : '/dashboard');
	},

	resend: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		if (!email) return fail(400, { error: 'Enter your email above first.' });

		try {
			await auth.api.sendVerificationEmail({
				body: { email, callbackURL: '/dashboard' },
				headers: request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { error: error.message, email });
			}
			throw error;
		}

		return { resent: true, email };
	}
};
