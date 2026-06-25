CREATE TABLE IF NOT EXISTS "test_deletions" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"test_id" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "test_deletions_account_id_idx" ON "test_deletions" ("account_id");