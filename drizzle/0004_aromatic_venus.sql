CREATE TABLE "session_collaborators" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "session_collaborators" ADD CONSTRAINT "session_collaborators_session_id_writing_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."writing_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_collaborators" ADD CONSTRAINT "session_collaborators_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_collaborators_session_idx" ON "session_collaborators" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_collaborators_user_idx" ON "session_collaborators" USING btree ("user_id");