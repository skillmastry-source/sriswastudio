import twilio from "twilio";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const client = getTwilioClient();
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!client || !from) return false;

  try {
    const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:+91${to.replace(/\D/g, "").slice(-10)}`;
    const fromNumber = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
    await client.messages.create({ from: fromNumber, to: toNumber, body: message });
    return true;
  } catch (err) {
    console.error("WhatsApp send failed:", err);
    return false;
  }
}

// CallMeBot: free WhatsApp alerts to the admin's own (activated) number.
// Requires CALLMEBOT_API_KEY env var. Only works for the number that was
// activated with the CallMeBot bot — used for admin new-order alerts.
export async function sendAdminWhatsApp(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  if (apiKey) {
    try {
      const digits = phone.replace(/\D/g, "");
      const full = digits.length === 10 ? `91${digits}` : digits;
      const url = `https://api.callmebot.com/whatsapp.php?phone=%2B${full}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) return true;
      console.error("CallMeBot send failed:", res.status, await res.text().catch(() => ""));
    } catch (err) {
      console.error("CallMeBot send failed:", err);
    }
  }
  // Fallback to Twilio if configured
  return sendWhatsApp(phone, message);
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
