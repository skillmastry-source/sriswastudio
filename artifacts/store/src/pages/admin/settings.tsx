import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, ExternalLink, CreditCard, Smartphone, Truck, QrCode, Upload, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/react";

interface SettingsForm {
  storeName: string;
  adminWhatsapp: string;
  newOrderTemplate: string;
  statusUpdateTemplate: string;
  upiId: string;
  upiQrUrl: string;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const BRAND = "#9B0F5F";

function GatewayBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
      <CheckCircle2 className="h-3 w-3" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
      <XCircle className="h-3 w-3" /> Setup Required
    </span>
  );
}

const GATEWAY_INFO = [
  {
    id: "razorpay" as const,
    name: "Razorpay",
    desc: "Accept credit/debit cards, UPI, net banking & wallets via Razorpay.",
    Icon: CreditCard,
    keys: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
    docsUrl: "https://dashboard.razorpay.com/app/keys",
    docsLabel: "Get keys from Razorpay Dashboard",
    steps: [
      "Log in to dashboard.razorpay.com",
      'Go to Settings → API Keys → "Generate Key"',
      "Copy the Key ID and Key Secret",
      "Add them as secrets: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET",
    ],
  },
  {
    id: "phonepe" as const,
    name: "PhonePe",
    desc: "Accept UPI & PhonePe wallet payments via the PhonePe payment gateway.",
    Icon: Smartphone,
    keys: ["PHONEPE_MERCHANT_ID", "PHONEPE_SALT_KEY", "PHONEPE_SALT_INDEX"],
    docsUrl: "https://developer.phonepe.com/",
    docsLabel: "Get credentials from PhonePe Developer Portal",
    steps: [
      "Sign up at developer.phonepe.com",
      "Create a merchant account and complete KYC",
      "Get Merchant ID, Salt Key and Salt Index from dashboard",
      "Add them as secrets: PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX",
    ],
  },
  {
    id: "cod" as const,
    name: "Cash on Delivery",
    desc: "Always available — no setup required. Customer pays on delivery.",
    Icon: Truck,
    keys: [],
    docsUrl: "",
    docsLabel: "",
    steps: [],
  },
];

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getToken } = useAuth();

  const { data: settings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() },
  });

  const { data: gatewayStatus } = useQuery({
    queryKey: ["payment-status"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/payments/status`);
      return res.json() as Promise<{ razorpay: boolean; phonepe: boolean; cod: boolean }>;
    },
  });

  const { data: methodsData, refetch: refetchMethods } = useQuery({
    queryKey: ["admin-payment-methods"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/admin/payments/methods`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return { enabled: { razorpay: true, phonepe: true, cod: true }, keysPresent: { razorpay: false, phonepe: false, cod: true } };
      return res.json() as Promise<{ enabled: Record<string, boolean>; keysPresent: Record<string, boolean> }>;
    },
  });

  const [localEnabled, setLocalEnabled] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (methodsData?.enabled) setLocalEnabled(methodsData.enabled);
  }, [methodsData]);

  const saveMethodsMutation = useMutation({
    mutationFn: async (enabled: Record<string, boolean>) => {
      const token = await getToken();
      const res = await fetch(`${BASE}/api/admin/payments/methods`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(enabled),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Payment methods updated" });
      refetchMethods();
      queryClient.invalidateQueries({ queryKey: ["payment-status"] });
    },
    onError: () => toast({ title: "Failed to save payment methods", variant: "destructive" }),
  });

  const updateSettings = useUpdateSettings();

  const [uploadingQr, setUploadingQr] = useState(false);
  const qrFileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { isDirty } } = useForm<SettingsForm>({
    defaultValues: {
      storeName: "", adminWhatsapp: "", newOrderTemplate: "", statusUpdateTemplate: "",
      upiId: "", upiQrUrl: "",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        storeName: settings.storeName ?? "Sriswa Studio",
        adminWhatsapp: settings.adminWhatsapp ?? "",
        newOrderTemplate: settings.newOrderTemplate ?? "",
        statusUpdateTemplate: settings.statusUpdateTemplate ?? "",
        upiId: (settings as unknown as Record<string, string>).upiId ?? "",
        upiQrUrl: (settings as unknown as Record<string, string>).upiQrUrl ?? "",
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: SettingsForm) => {
    updateSettings.mutate({ data }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetSettingsQueryKey(), updated);
        reset(data);
        toast({ title: "Settings saved" });
      },
      onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
    });
  };

  async function handleQrUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image too large. Please use an image under 2 MB.", variant: "destructive" });
      return;
    }
    setUploadingQr(true);
    try {
      const token = await getToken();
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

      // Try object storage first
      const urlRes = await fetch(`${BASE}/api/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        credentials: "include",
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (urlRes.ok) {
        const { uploadURL, objectPath } = await urlRes.json();
        const uploadRes = await fetch(uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const rawPath = objectPath.replace(/^\/objects\//, "");
        setValue("upiQrUrl", `/api/storage/product-images/${rawPath}`, { shouldDirty: true });
        toast({ title: "QR uploaded — click Save Settings to apply" });
        return;
      }

      // Fallback: direct upload to VPS filesystem
      const formData = new FormData();
      formData.append("file", file);
      const directRes = await fetch(`${BASE}/api/storage/uploads/direct`, {
        method: "POST",
        headers: { ...authHeader },
        credentials: "include",
        body: formData,
      });
      if (!directRes.ok) throw new Error("Direct upload failed");
      const { url } = await directRes.json() as { url: string };
      setValue("upiQrUrl", url, { shouldDirty: true });
      toast({ title: "QR uploaded — click Save Settings to apply" });
    } catch {
      toast({ title: "Could not upload QR image. Try using a URL instead.", variant: "destructive" });
    } finally {
      setUploadingQr(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const keysPresent: Record<string, boolean> = {
    razorpay: methodsData?.keysPresent?.razorpay ?? false,
    phonepe: methodsData?.keysPresent?.phonepe ?? false,
    cod: true,
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif font-bold">Settings</h1>
          <Button type="submit" disabled={updateSettings.isPending || !isDirty}
            style={{ background: BRAND }}>
            {updateSettings.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Store Details</CardTitle>
            <CardDescription>Basic information about your store</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Store Name</Label>
              <Input {...register("storeName")} placeholder="Sriswa Studio" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Notifications</CardTitle>
            <CardDescription>
              Configure the admin WhatsApp number and message templates via Twilio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Admin WhatsApp Number</Label>
              <Input {...register("adminWhatsapp")} placeholder="+91XXXXXXXXXX" className="mt-1 font-mono" />
              <p className="text-xs text-muted-foreground mt-1">Include country code, e.g. +919876543210</p>
            </div>
            <div>
              <Label>New Order Template</Label>
              <Textarea {...register("newOrderTemplate")}
                placeholder="New order {{orderNumber}} from {{customerName}}. Total: ₹{{total}}."
                className="mt-1 text-sm font-mono resize-none" rows={3} />
              <p className="text-xs text-muted-foreground mt-1">
                Variables: <code>{"{{orderNumber}}"}</code>, <code>{"{{customerName}}"}</code>, <code>{"{{total}}"}</code>, <code>{"{{phone}}"}</code>
              </p>
            </div>
            <div>
              <Label>Status Update Template</Label>
              <Textarea {...register("statusUpdateTemplate")}
                placeholder="Hi {{customerName}}, your order {{orderNumber}} is now {{status}}."
                className="mt-1 text-sm font-mono resize-none" rows={3} />
              <p className="text-xs text-muted-foreground mt-1">
                Variables: <code>{"{{customerName}}"}</code>, <code>{"{{orderNumber}}"}</code>, <code>{"{{status}}"}</code>
              </p>
            </div>
          </CardContent>
        </Card>
        {/* UPI QR Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" style={{ color: BRAND }} />
              UPI / QR Code Payment
            </CardTitle>
            <CardDescription>
              Accept direct UPI transfers. Customers will scan your QR code, pay, and enter their UTR number at checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Your UPI ID</Label>
              <Input {...register("upiId")} placeholder="yourname@ybl or yourname@okaxis" className="mt-1 font-mono" />
              <p className="text-xs text-muted-foreground mt-1">e.g. sriswastudio@ybl — find this in your bank app or PhonePe/GPay settings</p>
            </div>
            <div>
              <Label>QR Code Image</Label>
              <input
                ref={qrFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQrUpload(f); e.target.value = ""; }}
              />
              <div className="flex gap-2 mt-1">
                <Input {...register("upiQrUrl")} placeholder="https://..." className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingQr}
                  onClick={() => qrFileRef.current?.click()}
                  className="shrink-0"
                >
                  {uploadingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="ml-1">{uploadingQr ? "Uploading…" : "Upload"}</span>
                </Button>
              </div>
              {watch("upiQrUrl") && (
                <div className="mt-2 border rounded-lg p-2 inline-block bg-white">
                  <img src={watch("upiQrUrl")} alt="UPI QR" className="h-32 w-32 object-contain" />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Click <strong>Upload</strong> to pick your QR image from your phone or computer — no URL needed.
              </p>
            </div>
            <p className="text-xs text-muted-foreground border-t pt-3">
              When UPI ID is set, the "UPI / Scanner" option appears first at checkout. Orders paid by UPI will show the customer's UTR number for you to verify in the orders list.
            </p>
          </CardContent>
        </Card>
      </form>

      {/* ── Payment Gateways ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription className="mt-1">
                Enable or disable payment methods shown at checkout.
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={saveMethodsMutation.isPending}
              style={{ background: BRAND }}
              className="text-white hover:opacity-90"
              onClick={() => saveMethodsMutation.mutate(localEnabled)}
            >
              {saveMethodsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {GATEWAY_INFO.map(({ id, name, desc, Icon, keys, docsUrl, docsLabel, steps }) => {
            const isOn = localEnabled[id] ?? true;
            const hasKeys = keysPresent[id] ?? false;
            const canEnable = keys.length === 0 || hasKeys;
            const liveAtCheckout = (keys.length === 0 ? isOn : hasKeys && isOn);

            return (
              <div
                key={id}
                className="border rounded-xl p-4 transition-colors"
                style={{
                  borderColor: liveAtCheckout ? "#d1fae5" : "#f3f4f6",
                  background: liveAtCheckout ? "#f0fdf4" : "white",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: liveAtCheckout ? BRAND : "#f3f4f6" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: liveAtCheckout ? "white" : "#9ca3af" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-gray-900">{name}</p>
                      {liveAtCheckout ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          <XCircle className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{desc}</p>

                    {keys.length > 0 && !hasKeys && (
                      <div className="mt-2 space-y-1.5">
                        <p className="text-xs text-amber-700 font-medium">API keys required to activate:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {keys.map((k) => (
                            <code key={k} className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: "#fdf6f9", color: "#9B0F5F", border: "1px solid #f0c4dc" }}>{k}</code>
                          ))}
                        </div>
                        {docsUrl && (
                          <a href={docsUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium"
                            style={{ color: "#9B0F5F" }}>
                            {docsLabel} <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Toggle */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <Switch
                      checked={isOn}
                      disabled={!canEnable}
                      onCheckedChange={(val) => setLocalEnabled((prev) => ({ ...prev, [id]: val }))}
                      style={isOn && canEnable ? { backgroundColor: BRAND } : {}}
                    />
                    <span className="text-[10px] text-gray-400">{isOn ? "On" : "Off"}</span>
                  </div>
                </div>

                {keys.length > 0 && hasKeys && (
                  <p className="text-xs text-green-600 font-medium mt-2 pl-[52px]">
                    ✓ API keys configured{isOn ? " — live at checkout" : " — currently disabled"}
                  </p>
                )}
              </div>
            );
          })}

          <p className="text-xs text-muted-foreground pt-1 border-t">
            Razorpay &amp; PhonePe require API keys — add them in the <strong>Secrets</strong> tab of your Replit workspace first.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
