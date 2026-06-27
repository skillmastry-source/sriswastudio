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

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
