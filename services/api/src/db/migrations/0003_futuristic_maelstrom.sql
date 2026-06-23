CREATE TABLE IF NOT EXISTS "tests" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"account_id" text NOT NULL,
	"description" text NOT NULL,
	"generated_code" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tests_project_id_idx" ON "tests" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tests_account_id_idx" ON "tests" ("account_id");