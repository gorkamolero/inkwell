CREATE TABLE "writing_session_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"content" text,
	"source" text DEFAULT 'update' NOT NULL,
	"actor_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "writing_session_revisions" ADD CONSTRAINT "writing_session_revisions_session_id_writing_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."writing_sessions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "writing_session_revisions" ADD CONSTRAINT "writing_session_revisions_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "writing_session_revisions_session_idx" ON "writing_session_revisions" USING btree ("session_id");
--> statement-breakpoint
CREATE INDEX "writing_session_revisions_created_idx" ON "writing_session_revisions" USING btree ("created_at");
