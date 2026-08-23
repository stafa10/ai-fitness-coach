import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth.js';
import { passwordError } from '$lib/password.js';
import { saveAvatar } from '$lib/server/avatar.js';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		if (!name || !email || !password) {
			return fail(400, { error: 'Fill in all fields.', name, email });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.', name, email });
		}

		const pwError = passwordError(password);
		if (pwError) {
			return fail(400, { error: pwError, name, email });
		}

		const avatar = data.get('avatar');
		let image;
		if (avatar instanceof File && avatar.size > 0) {
			try {
				image = await saveAvatar(avatar);
			} catch (err) {
				return fail(400, { error: err.message, name, email });
			}
		}

		try {
			await auth.api.signUpEmail({
				body: { name, email, password, image, callbackURL: '/dashboard' },
				headers: request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { error: error.message, name, email });
			}
			throw error;
		}

		return { success: true, email };
	}
};
