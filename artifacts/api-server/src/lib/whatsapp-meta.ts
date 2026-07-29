/**
 * Meta WhatsApp Cloud API
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
 *
 * Required env vars:
 *   META_WHATSAPP_TOKEN     — System User permanent access token
 *   META_PHONE_NUMBER_ID    — Phone Number ID from Meta Business Manager
 *   META_WEBHOOK_VERIFY_TOKEN — Any secret string you choose (for webhook verification)
 */

const GRAPH_URL = "https://graph.facebook.com/v20.0";

interface MetaConfig {
  token: string;
  phoneNumberId: string;
}

function getConfig(): MetaConfig | null {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return null;
  return { token, phoneNumberId };
}

/** Format Indian phone numbers to E.164 (no +) */
export function formatWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

export function isMetaConfigured(): boolean {
  return !!getConfig();
}

/**
 * Send a free-form text message.
 * Works only within the 24-hour customer service window
 * (i.e. after the customer messages you first).
 * For business-initiated messages outside that window, use sendMetaTemplate().
 */
export async function sendMetaText(to: string, message: string): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  try {
    const res = await fetch(`${GRAPH_URL}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formatWhatsAppNumber(to),
        type: "text",
        text: { preview_url: false, body: message },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Meta WA] text send failed:", JSON.stringify(err));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Meta WA] text send failed:", err);
    return false;
  }
}

/**
 * Send a pre-approved Meta template message.
 * Required for business-initiated messages outside the 24-hour window.
 *
 * Example components for a template with body params:
 *   [{ type: "body", parameters: [{ type: "text", text: "John" }] }]
 */
export async function sendMetaTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  components: unknown[] = [],
): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  try {
    const res = await fetch(`${GRAPH_URL}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formatWhatsAppNumber(to),
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Meta WA] template send failed:", JSON.stringify(err));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Meta WA] template send failed:", err);
    return false;
  }
}

/**
 * Mark a received message as read (shows blue ticks to sender).
 */
export async function markMetaMessageRead(messageId: string): Promise<void> {
  const config = getConfig();
  if (!config) return;

  await fetch(`${GRAPH_URL}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  }).catch(() => {});
}
