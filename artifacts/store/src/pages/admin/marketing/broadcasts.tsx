import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Mail, Send, AlertCircle, CheckCircle2, Settings, Download } from "lucide-react";
import { Link } from "wouter";

const BRAND = "#9B0F5F";

async function getStats(token?: string | null) {
  const res = await fetch("/api/admin/marketing/broadcast/stats", {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<{ whatsappRecipients: number; emailRecipients: number }>;
}

export default function AdminBroadcasts() {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const [waMessage, setWaMessage] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [activeTab, setActiveTab] = useState<"whatsapp" | "email">("whatsapp");
  const [waResult, setWaResult] = useState<{ sent: number; failed: number } | null>(null);
  const [emailResult, setEmailResult] = useState<{ sent: number; failed: number } | null>(null);

  const { data: stats } = useQuery({ queryKey: ["broadcast-stats"], queryFn: async () => getStats(await getToken()) });

  const sendWA = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch("/api/admin/marketing/broadcast/whatsapp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: waMessage }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: (data) => {
      setWaResult(data);
      toast({ title: "Broadcast sent!", description: `${data.sent} messages delivered.` });
      setWaMessage("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sendEmail = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch("/api/admin/marketing/broadcast/email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ subject: emailSubject, html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">${emailBody.replace(/\n/g, "<br>")}</div>` }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: (data) => {
      setEmailResult(data);
      toast({ title: "Emails sent!", description: `${data.sent} emails delivered.` });
      setEmailSubject("");
      setEmailBody("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const tabs = [
    { key: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle, count: stats?.whatsappRecipients },
    { key: "email" as const, label: "Email", icon: Mail, count: stats?.emailRecipients },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-serif font-bold">Broadcasts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Send messages to all your customers at once</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-xl p-4 text-left border-2 transition-all ${activeTab === key ? "border-[#9B0F5F] bg-[#9B0F5F08]" : "border-gray-200 hover:border-gray-300"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4" style={{ color: activeTab === key ? BRAND : "#6b7280" }} />
              <span className="text-sm font-semibold">{label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: BRAND }}>{count ?? "—"}</p>
            <p className="text-xs text-muted-foreground">recipients</p>
          </button>
        ))}
      </div>

      {activeTab === "whatsapp" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <CardTitle className="text-base">WhatsApp Broadcast</CardTitle>
            </div>
            <CardDescription>
              Send a message to all your customers via WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Download contacts — always visible */}
            <div className="rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4 bg-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-800">📥 Download Customer Contacts</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Export all {stats?.whatsappRecipients ?? 0} customer phone numbers as a CSV file.
                  Open it in Excel or paste numbers directly into{" "}
                  <strong>WhatsApp Business app</strong> to send messages manually — no Twilio needed.
                </p>
              </div>
              <a
                href="/api/admin/marketing/broadcast/contacts.csv"
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: "#16a34a" }}
              >
                <Download className="h-4 w-4" />
                CSV
              </a>
            </div>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 flex-shrink-0">OR send automatically via Twilio</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <div>
              <Label>Message</Label>
              <Textarea
                className="mt-1 resize-none"
                rows={5}
                placeholder="Hi, 🌟 Exciting news from Sriswa Studio! ..."
                value={waMessage}
                onChange={e => setWaMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">{waMessage.length} characters</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Twilio must be configured in Settings. WhatsApp Business API also requires pre-approved message templates.
              </p>
            </div>

            {waResult && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700">Sent: {waResult.sent} · Failed: {waResult.failed}</p>
              </div>
            )}

            <Button
              onClick={() => sendWA.mutate()}
              disabled={sendWA.isPending || !waMessage.trim()}
              className="w-full gap-2 text-white"
              style={{ background: BRAND }}
            >
              <Send className="h-4 w-4" />
              {sendWA.isPending ? "Sending…" : `Send via Twilio to ${stats?.whatsappRecipients ?? 0} Customers`}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "email" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" style={{ color: BRAND }} />
              <CardTitle className="text-base">Email Campaign</CardTitle>
            </div>
            <CardDescription>
              Sends to all unique customer email addresses from orders. Requires SMTP configured in{" "}
              <Link href="/admin/marketing/email-settings" className="underline" style={{ color: BRAND }}>Email Settings</Link>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Subject Line</Label>
              <Input
                className="mt-1"
                placeholder="✨ New arrivals from Sriswa Studio!"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
              />
            </div>
            <div>
              <Label>Message Body</Label>
              <Textarea
                className="mt-1 resize-none"
                rows={8}
                placeholder="Write your email content here. Plain text or simple HTML is supported."
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
              />
            </div>

            {emailResult && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700">
                  Sent: {emailResult.sent} · Failed: {emailResult.failed}
                </p>
              </div>
            )}

            <Button
              onClick={() => sendEmail.mutate()}
              disabled={sendEmail.isPending || !emailSubject.trim() || !emailBody.trim()}
              className="w-full gap-2 text-white"
              style={{ background: BRAND }}
            >
              <Send className="h-4 w-4" />
              {sendEmail.isPending ? "Sending…" : `Send to ${stats?.emailRecipients ?? 0} Customers`}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Settings className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Email SMTP Settings</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure Gmail or any SMTP provider in{" "}
                <Link href="/admin/marketing/email-settings" className="underline" style={{ color: BRAND }}>Email Settings →</Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
