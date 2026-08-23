CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"age" integer NOT NULL,
	"height" numeric(5, 2) NOT NULL,
	"weight" numeric(5, 2) NOT NULL,
	"goal" varchar(100) NOT NULL,
	"experience" varchar(100) NOT NULL,
	"gender" varchar(20),
	"activity_level" varchar(50),
	"injuries" text,
	"workout_days" integer,
	"equipment_access" varchar(100)
);
