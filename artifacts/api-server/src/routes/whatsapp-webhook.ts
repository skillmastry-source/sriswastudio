/**
 * Meta WhatsApp Cloud API Webhook
 *
 * GET  /webhook/whatsapp  — verification handshake (Meta calls this once when you set up the webhook)
 * POST /webhook/whatsapp  — incoming messages & status updates from Meta
 *
 * Set these in Meta App Dashboard → WhatsApp → Configuration → Webhook:
 *   Callback URL:   https://yourdomain.com/api/webhook/whatsapp
 *   Verify Token:   value of META_WEBHOOK_VERIFY_TOKEN env var
 *   Subscribed fields: messages
 */

import { Router } from "express";
import { markMetaMessageRead } from "../lib/whatsapp-meta";

const router = Router();

// ── Webhook Verification (GET) ───────────────────────────────────────────────
router.get("/webhook/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    console.warn("[Meta Webhook] META_WEBHOOK_VERIFY_TOKEN not set");
    return res.sendStatus(403);
  }

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[Meta Webhook] Verified successfully");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// ── Incoming Events (POST) ───────────────────────────────────────────────────
router.post("/webhook/whatsapp", async (req, res) => {
  // Always respond 200 immediately so Meta doesn't retry
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;
        const value = change.value;

        // Handle incoming messages
        for (const msg of value.messages ?? []) {
          console.log(`[Meta Webhook] Incoming message from ${msg.from}: type=${msg.type}`);

          // Mark as read so sender sees blue ticks
          await markMetaMessageRead(msg.id);

          // You can extend here: auto-reply, log to DB, trigger flows, etc.
        }

        // Log delivery/read status updates
        for (const status of value.statuses ?? []) {
          console.log(`[Meta Webhook] Status update: msgId=${status.id} status=${status.status} recipient=${status.recipient_id}`);
        }
      }
    }
  } catch (err) {
    console.error("[Meta Webhook] Error processing event:", err);
  }
});

export default router;
