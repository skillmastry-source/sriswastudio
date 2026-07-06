import nodemailer from "nodemailer";

interface SmtpConfig {
  host: string;
  port?: number;
  secure?: boolean;
  user: string;
  pass: string;
  from?: string;
}

function getSmtpConfig(siteDesign: unknown): SmtpConfig | null {
  const design = siteDesign as Record<string, unknown> | null;
  const smtp = design?.smtpConfig as Record<string, unknown> | undefined;
  if (!smtp?.host || !smtp?.user || !smtp?.pass) return null;
  return {
    host: String(smtp.host),
    port: Number(smtp.port ?? 587),
    secure: Boolean(smtp.secure ?? false),
    user: String(smtp.user),
    pass: String(smtp.pass),
    from: smtp.from ? String(smtp.from) : undefined,
  };
}

export async function sendTransactionalEmail({
  siteDesign,
  storeName,
  to,
  subject,
  html,
  text,
}: {
  siteDesign: unknown;
  storeName: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const smtp = getSmtpConfig(siteDesign);
  if (!smtp) return false;

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port ?? 587,
      secure: smtp.secure ?? false,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    const from = smtp.from ?? `${storeName} <${smtp.user}>`;
    await transporter.sendMail({ from, to, subject, html, text });
    return true;
  } catch (err) {
    console.error("Transactional email failed:", err);
    return false;
  }
}

export function orderConfirmationHtml({
  storeName,
  customerName,
  orderNumber,
  total,
  items,
  shippingAddress,
  city,
  state,
  pincode,
  paymentMethod,
}: {
  storeName: string;
  customerName: string;
  orderNumber: string;
  total: string;
  items: { name: string; qty: number; price: string; variantLabel?: string | null }[];
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: string;
}): string {
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0e0eb;">${i.name}${i.variantLabel ? ` <span style="color:#888;font-size:12px;">(${i.variantLabel})</span>` : ""}</td>
        <td style="padding:8px;border-bottom:1px solid #f0e0eb;text-align:center;">${i.qty}</td>
        <td style="padding:8px;border-bottom:1px solid #f0e0eb;text-align:right;">₹${i.price}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fdf6fb;font-family:Georgia,serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(155,15,95,0.08);">
    <div style="background:#9B0F5F;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:1px;">${storeName}</h1>
      <p style="margin:8px 0 0;color:#f5c6e8;font-size:14px;">Order Confirmation</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#333;">Hi <strong>${customerName}</strong>,</p>
      <p style="color:#555;">Thank you for your order! We've received it and are getting it ready for you.</p>

      <div style="background:#fdf6fb;border:1px solid #f0e0eb;border-radius:6px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 4px;font-size:13px;color:#9B0F5F;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Order Details</p>
        <p style="margin:4px 0;font-size:22px;font-weight:bold;color:#333;">${orderNumber}</p>
        <p style="margin:4px 0;color:#666;font-size:14px;">Payment: <strong>${paymentMethod}</strong></p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <thead>
          <tr style="background:#fdf6fb;">
            <th style="padding:8px;text-align:left;font-size:13px;color:#9B0F5F;">Item</th>
            <th style="padding:8px;text-align:center;font-size:13px;color:#9B0F5F;">Qty</th>
            <th style="padding:8px;text-align:right;font-size:13px;color:#9B0F5F;">Price</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 8px;font-weight:bold;font-size:15px;text-align:right;">Total</td>
            <td style="padding:12px 8px;font-weight:bold;font-size:15px;text-align:right;color:#9B0F5F;">₹${total}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background:#fdf6fb;border:1px solid #f0e0eb;border-radius:6px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 6px;font-size:13px;color:#9B0F5F;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Shipping To</p>
        <p style="margin:0;color:#555;line-height:1.6;">${shippingAddress}<br>${city}, ${state} - ${pincode}</p>
      </div>

      <p style="color:#555;font-size:14px;">We'll send you a WhatsApp message when your order is shipped. For any questions, reply to this email.</p>
      <p style="color:#555;font-size:14px;">With love,<br><strong>${storeName}</strong></p>
    </div>
    <div style="background:#fdf6fb;padding:16px 32px;text-align:center;border-top:1px solid #f0e0eb;">
      <p style="margin:0;color:#aaa;font-size:12px;">© ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
