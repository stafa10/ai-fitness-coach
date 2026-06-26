import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load = async (event) => {
    if (event.locals.user) throw redirect(302, '/dashboard');
    return {};
};

export const actions = {
    signInEmail: async (event) => {
        const formData = await event.request.formData();
        const email = formData.get('email')?.toString() ?? '';
        const password = formData.get('password')?.toString() ?? '';

        try {
            await auth.api.signInEmail({
                body: { email, password }
            });
        } catch (error) {
            if (error instanceof APIError) {
                return fail(400, { message: error.message || 'Login failed' });
            }
            return fail(500, { message: 'Unexpected error: ' + error?.message });
        }

        throw redirect(302, '/dashboard');
    }
};