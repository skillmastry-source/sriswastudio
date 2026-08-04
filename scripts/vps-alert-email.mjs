// Sends a deploy-failure alert email using the store's SMTP settings
// (configured in Admin → Email Settings, stored in store_settings.site_design.smtpConfig).
// Usage: node scripts/vps-alert-email.mjs [subject] [body]
// Requires: ALERT_EMAIL_TO and DATABASE_URL in the environment (VPS .env).
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(
  fileURLToPath(new URL("../artifacts/api-server/package.json", import.meta.url)),
);
const nodemailer = require("nodemailer");
const { Client } = require("pg");

const to = process.env.ALERT_EMAIL_TO;
if (!to) {
  console.error("ALERT_EMAIL_TO not set");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rows } = await client.query("select site_design from store_settings limit 1");
await client.end();

const smtp = rows[0]?.site_design?.smtpConfig;
if (!smtp?.host || !smtp?.user || !smtp?.pass) {
  console.error("SMTP is not configured in Admin → Email Settings");
  process.exit(2);
}

const subject = process.argv[2] || "⚠️ Sriswa Studio: website update FAILED";
const body =
  process.argv[3] ||
  "The automatic website update failed. The live site is still running the previous version — nothing is broken for customers, but the latest changes did not go live.\n\nDetails: /var/log/sriswa-auto-deploy.log on the VPS.";

const primaryPort = Number(smtp.port ?? 587);
const attempts = [
  { port: primaryPort, secure: primaryPort === 465 },
  primaryPort === 587 ? { port: 465, secure: true } : { port: 587, secure: false },
];

for (const { port, secure } of attempts) {
  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port,
      secure,
      auth: { user: smtp.user, pass: smtp.pass },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 15_000,
    });
    await transporter.sendMail({
      from: smtp.from ?? `Sriswa Studio <${smtp.user}>`,
      to,
      subject,
      text: body,
    });
    console.log(`EMAIL_SENT via port ${port}`);
    process.exit(0);
  } catch (e) {
    console.error(`port ${port} failed: ${e.message}`);
  }
}
process.exit(3);
