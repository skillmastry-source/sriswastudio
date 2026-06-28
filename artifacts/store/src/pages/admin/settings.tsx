import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, ExternalLink, CreditCard, Smartphone, Truck } from "lucide-react";

interface SettingsForm {
  storeName: string;
  adminWhatsapp: string;
  newOrderTemplate: string;
  statusUpdateTemplate: string;
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

  const { data: settings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() },
  });

  const { data: gatewayStatus } = useQuery({
    queryKey: ["payment-status"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/payments/status`);
      return res.json() as Promise<{ razorpay: boolean; phonepe: boolean }>;
    },
  });

  const updateSettings = useUpdateSettings();

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<SettingsForm>({
    defaultValues: {
      storeName: "", adminWhatsapp: "", newOrderTemplate: "", statusUpdateTemplate: "",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        storeName: settings.storeName ?? "Sriswa Studio",
        adminWhatsapp: settings.adminWhatsapp ?? "",
        newOrderTemplate: settings.newOrderTemplate ?? "",
        statusUpdateTemplate: settings.statusUpdateTemplate ?? "",
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

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const activeStatus: Record<string, boolean> = {
    razorpay: gatewayStatus?.razorpay ?? false,
    phonepe: gatewayStatus?.phonepe ?? false,
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
      </form>

      {/* ── Payment Gateways (read-only config, keys set via Replit Secrets) ── */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Gateways</CardTitle>
          <CardDescription>
            Payment methods available at checkout. Add API keys in the <strong>Secrets</strong> tab to activate a gateway.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {GATEWAY_INFO.map(({ id, name, desc, Icon, keys, docsUrl, docsLabel, steps }) => {
            const active = activeStatus[id] ?? false;
            return (
              <div key={id} className="border rounded-lg p-4" style={{ borderColor: active ? "#d1fae5" : "#f3f4f6", background: active ? "#f0fdf4" : "white" }}>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? "#9B0F5F" : "#f3f4f6" }}>
                    <Icon className="h-5 w-5" style={{ color: active ? "white" : "#9ca3af" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-gray-900">{name}</p>
                      <GatewayBadge active={active} />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{desc}</p>

                    {keys.length > 0 && !active && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-700">How to set up:</p>
                        <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                          {steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {keys.map((k) => (
                            <code key={k} className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: "#fdf6f9", color: "#9B0F5F", border: "1px solid #f0c4dc" }}>{k}</code>
                          ))}
                        </div>
                        {docsUrl && (
                          <a href={docsUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium mt-1"
                            style={{ color: "#9B0F5F" }}>
                            {docsLabel} <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {keys.length > 0 && active && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        ✓ API keys are configured and this gateway is live at checkout.
                      </p>
                    )}

                    {keys.length === 0 && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Always available — no configuration needed.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <p className="text-xs text-muted-foreground pt-1 border-t">
            To add API keys: go to the <strong>Secrets</strong> tab (🔒) in the left sidebar of your Replit workspace and add the keys listed above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
