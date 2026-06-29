CREATE TABLE IF NOT EXISTS "coupons" (
        "id" serial PRIMARY KEY NOT NULL,
        "code" text NOT NULL,
        "type" text NOT NULL,
        "value" numeric(10, 2) DEFAULT '0' NOT NULL,
        "min_order_amount" numeric(10, 2) DEFAULT '0',
        "max_uses" integer,
        "used_count" integer DEFAULT 0 NOT NULL,
        "expires_at" timestamp,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL;
