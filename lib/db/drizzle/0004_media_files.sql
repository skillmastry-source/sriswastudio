CREATE TABLE IF NOT EXISTS "media_files" (
  "id" serial PRIMARY KEY NOT NULL,
  "filename" text NOT NULL,
  "url" text NOT NULL,
  "folder" text DEFAULT 'Uncategorized' NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "uploaded_at" timestamp DEFAULT now() NOT NULL
);
