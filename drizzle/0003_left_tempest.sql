CREATE TABLE "purchased_books" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchased_books_user_session_unique" UNIQUE("user_id","session_id")
);
--> statement-breakpoint
ALTER TABLE "purchased_books" ADD CONSTRAINT "purchased_books_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_books" ADD CONSTRAINT "purchased_books_session_id_writing_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."writing_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchased_books_user_id_idx" ON "purchased_books" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "purchased_books_session_id_idx" ON "purchased_books" USING btree ("session_id");