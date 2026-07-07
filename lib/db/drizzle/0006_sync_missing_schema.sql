ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_reference" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "site_design" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "upi_id" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "upi_qr_url" text NOT NULL DEFAULT '';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "landing_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"sections" jsonb DEFAULT '[]' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_in_nav" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "landing_pages_slug_unique" UNIQUE("slug")
);
