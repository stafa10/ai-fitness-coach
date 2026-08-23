import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth.js';
import { passwordError } from '$lib/password.js';

export const load = async ({ url }) => {
	return { token: url.searchParams.get('token') ?? '' };
};

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const token = data.get('token')?.toString();
		const newPassword = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		if (!token) {
			return fail(400, { error: 'This reset link is invalid or has expired.' });
		}
		if (!newPassword) {
			return fail(400, { error: 'Enter a new password.' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		const pwError = passwordError(newPassword);
		if (pwError) {
			return fail(400, { error: pwError });
		}

		try {
			await auth.api.resetPassword({ body: { newPassword, token }, headers: request.headers });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { error: error.message });
			}
			throw error;
		}

		throw redirect(302, '/auth/login?reset=1');
	}
};
