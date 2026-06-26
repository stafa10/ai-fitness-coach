import { usersService } from '$lib/server/services/users-service.js';

export async function load({ locals }) {
    console.log("locals.user =", locals.user);

    if (!locals.user) {
        return {
            user: null
        };
    }

    const fullUser = await usersService.getById(locals.user.id);

    console.log("fullUser =", fullUser);

    return {
        user: fullUser
    };
}