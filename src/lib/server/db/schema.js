import { pgTable, serial, integer, numeric, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export * from './auth.schema.js';
import { user } from './auth.schema.js';

export const profiles = pgTable('profiles', {
	id: serial('id').primaryKey(),

	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),

	age: integer('age').notNull(),

	height: numeric('height', {
		precision: 5,
		scale: 2
	}).notNull(),

	weight: numeric('weight', {
		precision: 5,
		scale: 2
	}).notNull(),

	gender: varchar('gender', { length: 20 }),

	goal: varchar('goal', { length: 100 }).notNull(),

	experience: varchar('experience', {
		length: 100
	}).notNull(),

	activityLevel: varchar('activity_level', {
		length: 50
	}),

	workoutDays: integer('workout_days'),

	equipmentAccess: varchar('equipment_access', {
		length: 100
	}),

	injuries: text('injuries'),

	// JSON-serialised AI-generated workout plan (array of day objects), cached so it's
	// generated once per profile instead of on every dashboard load. Null until first generated.
	generatedWorkout: text('generated_workout'),

	// When generatedWorkout was last (re)generated, so the dashboard can tell the user
	// their plan predates recent logged sessions and nudge them to regenerate.
	generatedWorkoutAt: timestamp('generated_workout_at'),

	// Optional manual override for the dashboard's auto-calculated calorie target. Null
	// means "use the calculated value" — set only when the user explicitly overrides it.
	customCalorieTarget: integer('custom_calorie_target'),

	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const progress = pgTable('progress', {
	id: serial('id').primaryKey(),

	profileId: integer('profile_id')
		.notNull()
		.references(() => profiles.id),

	weight: numeric('weight', {
		precision: 5,
		scale: 2
	}).notNull(),

	createdAt: timestamp('created_at').defaultNow().notNull()
});
export const workoutSessions = pgTable('workout_sessions', {
	id: serial('id').primaryKey(),

	profileId: integer('profile_id')
		.notNull()
		.references(() => profiles.id),

	videoUrl: varchar('video_url', { length: 255 }),

	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const workoutSets = pgTable('workout_sets', {
	id: serial('id').primaryKey(),
	sessionId: integer('session_id')
		.notNull()
		.references(() => workoutSessions.id),
	exercise: varchar('exercise', { length: 100 }).notNull(),
	setNumber: integer('set_number').notNull(),
	weight: numeric('weight', { precision: 5, scale: 2 }).notNull(),
	reps: integer('reps').notNull()
});

export const chatConversations = pgTable('chat_conversations', {
	id: serial('id').primaryKey(),
	profileId: integer('profile_id')
		.notNull()
		.references(() => profiles.id, { onDelete: 'cascade' }),
	title: varchar('title', { length: 200 }).notNull().default('New chat'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const siteSettings = pgTable('site_settings', {
	id: serial('id').primaryKey(),
	heroVideoUrl: varchar('hero_video_url', { length: 255 }),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// A user's personal library of foods they've defined (name + macros per serving).
// Logging a day's intake picks from this list rather than a shared global database.
export const foods = pgTable('foods', {
	id: serial('id').primaryKey(),
	profileId: integer('profile_id')
		.notNull()
		.references(() => profiles.id, { onDelete: 'cascade' }),
	name: varchar('name', { length: 150 }).notNull(),
	servingSize: varchar('serving_size', { length: 60 }).notNull(),
	calories: integer('calories').notNull(),
	protein: integer('protein').notNull(),
	carbs: integer('carbs').notNull(),
	fats: integer('fats').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// One diary entry: this food, logged on this day, scaled by `servings`.
export const foodLogs = pgTable('food_logs', {
	id: serial('id').primaryKey(),
	profileId: integer('profile_id')
		.notNull()
		.references(() => profiles.id, { onDelete: 'cascade' }),
	foodId: integer('food_id')
		.notNull()
		.references(() => foods.id, { onDelete: 'cascade' }),
	servings: numeric('servings', { precision: 5, scale: 2 }).notNull().default('1'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const chatMessages = pgTable('chat_messages', {
	id: serial('id').primaryKey(),
	conversationId: integer('conversation_id')
		.notNull()
		.references(() => chatConversations.id, { onDelete: 'cascade' }),
	role: varchar('role', { length: 20 }).notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});
