-- Add variant_id to order_items so re-orders can restore the original variant selection
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variant_id" integer;
