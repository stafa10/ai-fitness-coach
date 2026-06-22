import {
	pgTable,
	serial,
	integer,
	numeric,
	varchar,
	text
} from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
	id: serial('id').primaryKey(),
	age: integer('age').notNull(),
	height: numeric('height', { precision: 5, scale: 2 }).notNull(),
	weight: numeric('weight', { precision: 5, scale: 2 }).notNull(),
	goal: varchar('goal', { length: 100 }).notNull(),
	experience: varchar('experience', { length: 100 }).notNull(),
	gender: varchar('gender', { length: 20 }),
	activity_level: varchar('activity_level', { length: 50 }),
	injuries: text('injuries'),
	workout_days: integer('workout_days'),
	equipment_access: varchar('equipment_access', { length: 100 })
});