CREATE TABLE "liveblocks_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"room_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"share_slug" text,
	"title" text,
	"type" text DEFAULT 'book',
	"content" text,
	"format_config" jsonb,
	"password_hash" text,
	"owner_id" text,
	"github_repo" text,
	"github_path" text,
	"last_github_sha" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "writing_sessions_share_slug_unique" UNIQUE("share_slug")
);
--> statement-breakpoint
ALTER TABLE "liveblocks_rooms" ADD CONSTRAINT "liveblocks_rooms_session_id_writing_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."writing_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_sessions" ADD CONSTRAINT "writing_sessions_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "writing_sessions_share_slug_idx" ON "writing_sessions" USING btree ("share_slug");--> statement-breakpoint
CREATE INDEX "writing_sessions_owner_id_idx" ON "writing_sessions" USING btree ("owner_id");