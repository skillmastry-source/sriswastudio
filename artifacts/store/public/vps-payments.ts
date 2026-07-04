import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "@workspace/db";
import { storeSettingsTable } from "@workspace/db";

const router = Router();

// Payment gateway status (safe — no keys exposed)
router.get("/payments/status", (_req, res) => {
  res.json({
    razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    phonepe: !!(process.env.PHONEPE_MERCHANT_ID && process.env.PHONEPE_SALT_KEY),
  });
});

// UPI settings — public endpoint (no secrets, just UPI ID + QR image URL)
router.get("/payments/upi/settings", async (_req, res) => {
  const [settings] = await db.select().from(storeSettingsTable);
  return res.json({
    upiId: settings?.upiId ?? "",
    upiQrUrl: settings?.upiQrUrl ?? "",
    enabled: !!(settings?.upiId),
  });
});

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/* ── RAZORPAY ── */

// Public key (safe to expose)
router.get("/payments/razorpay/key", (_req, res) => {
  const key = process.env.RAZORPAY_KEY_ID;
  if (!key) return res.status(503).json({ error: "Razorpay not configured" });
  return res.json({ key });
});

// Create Razorpay order
router.post("/payments/razorpay/create-order", async (req, res) => {
  try {
    const rzp = getRazorpay();
    if (!rzp) return res.status(503).json({ error: "Razorpay not configured" });

    const { amount } = req.body as { amount: number };
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const order = await rzp.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });
    return res.json(order);
  } catch (err) {
    console.error("[Razorpay] create-order error:", err);
    return res.status(500).json({ error: "Could not create Razorpay order" });
  }
});

// Verify Razorpay payment
router.post("/payments/razorpay/verify", (req, res) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return res.status(503).json({ error: "Razorpay not configured" });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body as { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac("sha256", secret).update(sign).digest("hex");

    if (expected === razorpay_signature) {
      return res.json({ verified: true, paymentId: razorpay_payment_id });
    } else {
      return res.status(400).json({ verified: false, error: "Invalid signature" });
    }
  } catch (err) {
    console.error("[Razorpay] verify error:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
});

/* ── PHONEPE ── */

const PHONEPE_BASE =
  process.env.PHONEPE_ENV === "production"
    ? "https://api.phonepe.com/apis/hermes"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";

// Initiate PhonePe payment
router.post("/payments/phonepe/initiate", async (req, res) => {
  try {
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX ?? "1";

    if (!merchantId || !saltKey) {
      return res.status(503).json({ error: "PhonePe not configured" });
    }

    const { amount, transactionId, redirectUrl } =
      req.body as { amount: number; transactionId: string; redirectUrl: string };

    const payload = {
      merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: `MUID_${Date.now()}`,
      amount: Math.round(amount * 100),
      redirectUrl,
      redirectMode: "REDIRECT",
      callbackUrl: `${process.env.API_BASE_URL ?? ""}/api/payments/phonepe/callback`,
      mobileNumber: "",
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const hash = crypto
      .createHash("sha256")
      .update(`${base64}/pg/v1/pay${saltKey}`)
      .digest("hex");
    const checksum = `${hash}###${saltIndex}`;

    const response = await fetch(`${PHONEPE_BASE}/pg/v1/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        accept: "application/json",
      },
      body: JSON.stringify({ request: base64 }),
    });

    const data = (await response.json()) as { success: boolean; data?: { instrumentResponse?: { redirectInfo?: { url?: string } } }; message?: string };
    if (!data.success) {
      return res.status(400).json({ error: data.message ?? "PhonePe initiation failed" });
    }

    const redirectInfo = data.data?.instrumentResponse?.redirectInfo;
    return res.json({ redirectUrl: redirectInfo?.url, transactionId });
  } catch (err) {
    console.error("[PhonePe] initiate error:", err);
    return res.status(500).json({ error: "Could not initiate PhonePe payment" });
  }
});

// Check PhonePe payment status
router.get("/payments/phonepe/status/:transactionId", async (req, res) => {
  try {
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX ?? "1";

    if (!merchantId || !saltKey) {
      return res.status(503).json({ error: "PhonePe not configured" });
    }

    const { transactionId } = req.params;
    const path = `/pg/v1/status/${merchantId}/${transactionId}`;
    const hash = crypto.createHash("sha256").update(`${path}${saltKey}`).digest("hex");
    const checksum = `${hash}###${saltIndex}`;

    const response = await fetch(`${PHONEPE_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchantId,
      },
    });

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("[PhonePe] status error:", err);
    return res.status(500).json({ error: "Status check failed" });
  }
});

// PhonePe server-to-server callback
router.post("/payments/phonepe/callback", (req, res) => {
  console.log("[PhonePe] callback received:", req.body);
  res.status(200).send("OK");
});

export default router;
