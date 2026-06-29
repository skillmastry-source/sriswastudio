import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const mediaFilesTable = pgTable("media_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  folder: text("folder").notNull().default("Uncategorized"),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export type MediaFile = typeof mediaFilesTable.$inferSelect;
export type InsertMediaFile = typeof mediaFilesTable.$inferInsert;
