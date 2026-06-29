import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const customerNotesTable = pgTable("customer_notes", {
  id:            serial("id").primaryKey(),
  customerEmail: text("customer_email").notNull(),
  note:          text("note").notNull(),
  createdBy:     text("created_by").notNull().default("admin"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});

export type CustomerNote = typeof customerNotesTable.$inferSelect;
