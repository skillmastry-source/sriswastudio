import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storeSettingsTable = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("Sriswa Studio"),
  adminWhatsapp: text("admin_whatsapp").notNull().default(""),
  newOrderTemplate: text("new_order_template").notNull().default("New order {{orderNumber}} from {{customerName}} for ₹{{total}}. Phone: {{phone}}"),
  statusUpdateTemplate: text("status_update_template").notNull().default("Hi {{customerName}}, your Sriswa Studio order {{orderNumber}} is now {{status}}. Thank you!"),
});

export const insertStoreSettingsSchema = createInsertSchema(storeSettingsTable).omit({ id: true });
export type InsertStoreSettings = z.infer<typeof insertStoreSettingsSchema>;
export type StoreSettings = typeof storeSettingsTable.$inferSelect;
