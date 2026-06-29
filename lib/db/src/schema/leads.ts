import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id:        serial("id").primaryKey(),
  name:      text("name").notNull(),
  mobile:    text("mobile").notNull(),
  product:   text("product"),
  qty:       text("qty"),
  city:      text("city"),
  pin:       text("pin"),
  status:    text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
