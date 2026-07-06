import { useState, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Save, CheckCircle2, AlertCircle } from "lucide-react";

const BRAND = "#9B0F5F";

interface SmtpConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
}

interface SiteDesign { smtpConfig?: SmtpConfig }

async function getSiteDesign(): Promise<SiteDesign> {
  const res = await fetch("/api/site-design", { credentials: "include" });
  return res.json();
}

async function patchSiteDesign(patch: Partial<SiteDesign>, token?: string | null) {
  const res = await fetch("/api/admin/site-design", {
    method: "PATCH", credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}

export default function AdminEmailSettings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { getToken } = useAuth();

  const { data: design, isLoading } = useQuery({ queryKey: ["/api/site-design"], queryFn: getSiteDesign });

  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState("587");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [from, setFrom] = useState("");

  useEffect(() => {
    if (!design?.smtpConfig) return;
    const s = design.smtpConfig;
    setHost(s.host ?? "smtp.gmail.com");
    setPort(String(s.port ?? 587));
    setUser(s.user ?? "");
    setPass(s.pass ?? "");
    setFrom(s.from ?? "");
  }, [design]);

  const isConfigured = !!(design?.smtpConfig?.host && design?.smtpConfig?.user);

  const save = useMutation({
    mutationFn: async () => patchSiteDesign({
      smtpConfig: { host, port: Number(port), user, pass: pass || undefined, from: from || user },
    }, await getToken()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/site-design"] });
      toast({ title: "Saved!", description: "Email settings updated." });
    },
    onError: () => toast({ title: "Error", description: "Could not save.", variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Email Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure your SMTP provider to send broadcast emails</p>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} style={{ background: BRAND }} className="text-white gap-2">
          <Save className="h-4 w-4" />
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      {isConfigured ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">Email is configured and ready to send.</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700">Email is not configured yet. Fill in the SMTP settings below.</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" style={{ color: BRAND }} />
            <CardTitle className="text-base">SMTP Configuration</CardTitle>
          </div>
          <CardDescription>
            Works with Gmail, Zoho, SendGrid, AWS SES, or any SMTP server.
            For Gmail, use an <strong>App Password</strong> (not your regular password).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label>SMTP Host</Label>
              <Input className="mt-1 font-mono text-sm" value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.gmail.com" />
            </div>
            <div>
              <Label>Port</Label>
              <Input type="number" className="mt-1 font-mono text-sm" value={port} onChange={e => setPort(e.target.value)} placeholder="587" />
            </div>
          </div>
          <div>
            <Label>Email Address</Label>
            <Input type="email" className="mt-1" value={user} onChange={e => setUser(e.target.value)} placeholder="youremail@gmail.com" />
          </div>
          <div>
            <Label>Password / App Password</Label>
            <Input type="password" className="mt-1" value={pass} onChange={e => setPass(e.target.value)} placeholder="Leave blank to keep existing password" />
          </div>
          <div>
            <Label>From Name (optional)</Label>
            <Input className="mt-1" value={from} onChange={e => setFrom(e.target.value)} placeholder="Sriswa Studio <youremail@gmail.com>" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="py-4 space-y-2">
          <p className="text-xs font-semibold text-gray-700">Quick setup guides:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>Gmail:</strong> Host: smtp.gmail.com, Port: 587. Enable 2FA → create an App Password at myaccount.google.com/apppasswords</li>
            <li>• <strong>Zoho:</strong> Host: smtp.zoho.in, Port: 587</li>
            <li>• <strong>SendGrid:</strong> Host: smtp.sendgrid.net, Port: 587, User: apikey, Pass: your API key</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
