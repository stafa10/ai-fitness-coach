import { z } from 'zod';
import { user} from './schema';

// =========================
// User Schemas
// =========================
export const registerAuthSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Must be a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    dob: z.string().nullable().optional()
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    dob: z.string().nullable().optional(),
    role: z.string().optional(),
    image: z.string().optional()
});

export const idSchema = z.object({
    id: z.string().min(1)
});

export const deleteUserSchema = z.object({
    id: z.number().int().positive()
});

export const updateUserSchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	dob: z.string().optional(),
	role: z.string().optional()
});


// =========================
// Admin Schemas
// =========================

export const adminInsertUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Must be a valid email'),
    dob: z.string().nullable().optional(),
    role: z.string().optional()
});
