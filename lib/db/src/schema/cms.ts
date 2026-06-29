import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cmsPagesTable = pgTable("cms_pages", {
  id:              serial("id").primaryKey(),
  type:            text("type").notNull(),
  slug:            text("slug").notNull().unique(),
  title:           text("title").notNull(),
  content:         text("content").notNull().default(""),
  metaTitle:       text("meta_title"),
  metaDescription: text("meta_description"),
  isPublished:     boolean("is_published").notNull().default(false),
  publishedAt:     timestamp("published_at"),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
});

export const insertCmsPageSchema = createInsertSchema(cmsPagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCmsPage = z.infer<typeof insertCmsPageSchema>;
export type CmsPage = typeof cmsPagesTable.$inferSelect;
