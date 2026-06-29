CREATE TABLE IF NOT EXISTS "cms_pages" (
        "id" serial PRIMARY KEY NOT NULL,
        "type" text NOT NULL,
        "slug" text NOT NULL,
        "title" text NOT NULL,
        "content" text DEFAULT '' NOT NULL,
        "meta_title" text,
        "meta_description" text,
        "is_published" boolean DEFAULT false NOT NULL,
        "published_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "cms_pages_slug_unique" UNIQUE("slug")
);
