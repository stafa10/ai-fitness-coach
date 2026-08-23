ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_profile_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "conversation_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" DROP COLUMN "profile_id";