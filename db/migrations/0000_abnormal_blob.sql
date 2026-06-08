CREATE TYPE "public"."session_status" AS ENUM('running', 'paused', 'done');--> statement-breakpoint
CREATE TYPE "public"."time_of_day" AS ENUM('morning', 'noon', 'evening', 'night');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"set_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"time_of_day" time_of_day NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"set_id" uuid NOT NULL,
	"date" date NOT NULL,
	"achieved" boolean DEFAULT true NOT NULL,
	"item_done_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_achievements_owner_set_date_unique" UNIQUE("owner_id","set_id","date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "execution_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"elapsed_sec" integer DEFAULT 0 NOT NULL,
	"paused_total_sec" integer DEFAULT 0 NOT NULL,
	"note" text,
	"client_local_id" text NOT NULL,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "execution_records_owner_local_unique" UNIQUE("owner_id","client_local_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "execution_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"set_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"status" "session_status" DEFAULT 'running' NOT NULL,
	"client_local_id" text NOT NULL,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "execution_sessions_owner_local_unique" UNIQUE("owner_id","client_local_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_items_set_deleted_idx" ON "activity_items" USING btree ("set_id","deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_items_owner_idx" ON "activity_items" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_sets_owner_deleted_idx" ON "activity_sets" USING btree ("owner_id","deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_achievements_owner_date_idx" ON "daily_achievements" USING btree ("owner_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "execution_records_session_idx" ON "execution_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "execution_records_owner_started_idx" ON "execution_records" USING btree ("owner_id","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "execution_sessions_owner_started_idx" ON "execution_sessions" USING btree ("owner_id","started_at");