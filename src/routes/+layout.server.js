import { ADMIN_EMAIL } from '$env/static/private';

export const load = async ({ locals }) => {
	return {
		user: locals.user,
		isAdmin: !!locals.user && locals.user.email === ADMIN_EMAIL,
		locale: locals.locale
	};
};
