CREATE TABLE IF NOT EXISTS "runs" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"account_id" text NOT NULL,
	"target_url" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"duration_ms" integer,
	"stdout" text,
	"stderr" text,
	"error" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "runs_test_id_idx" ON "runs" ("test_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "runs_account_id_idx" ON "runs" ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "runs_status_idx" ON "runs" ("status");
