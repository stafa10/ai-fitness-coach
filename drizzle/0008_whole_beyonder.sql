ALTER TABLE "workout_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "workout_logs" CASCADE;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;