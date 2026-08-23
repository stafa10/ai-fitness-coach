import { fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth.js';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();

		if (!email) {
			return fail(400, { error: 'Enter your email address.' });
		}

		await auth.api.requestPasswordReset({
			body: { email, redirectTo: '/auth/reset-password' },
			headers: request.headers
		});

		// Always report success, regardless of whether the email exists, to avoid leaking
		// which addresses have accounts.
		return { success: true };
	}
};
