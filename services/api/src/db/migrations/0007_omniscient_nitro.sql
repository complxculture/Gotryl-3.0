CREATE TABLE IF NOT EXISTS "github_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"project_id" text NOT NULL,
	"repo_full_name" text NOT NULL,
	"installation_id" text NOT NULL,
	"target_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "github_integrations_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_integrations_repo_idx" ON "github_integrations" ("repo_full_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_integrations_account_idx" ON "github_integrations" ("account_id");