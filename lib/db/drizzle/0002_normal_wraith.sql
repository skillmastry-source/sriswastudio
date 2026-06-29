CREATE TABLE IF NOT EXISTS "customer_notes" (
        "id" serial PRIMARY KEY NOT NULL,
        "customer_email" text NOT NULL,
        "note" text NOT NULL,
        "created_by" text DEFAULT 'admin' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'new' NOT NULL;
