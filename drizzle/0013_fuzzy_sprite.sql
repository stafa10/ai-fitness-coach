CREATE TABLE "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"hero_video_url" varchar(255),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
