import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface SettingsForm {
  storeName: string;
  adminWhatsapp: string;
  newOrderTemplate: string;
  statusUpdateTemplate: string;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() },
  });

  const updateSettings = useUpdateSettings();

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<SettingsForm>({
    defaultValues: {
      storeName: "",
      adminWhatsapp: "",
      newOrderTemplate: "",
      statusUpdateTemplate: "",
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
    updateSettings.mutate(
      { data },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetSettingsQueryKey(), updated);
          reset(data);
          toast({ title: "Settings saved" });
        },
        onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
      }
    );
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold">Settings</h1>
        <Button
          type="submit"
          className="bg-[#9B0F5F] hover:bg-[#7d0c4c]"
          disabled={updateSettings.isPending || !isDirty}
        >
          {updateSettings.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Details</CardTitle>
          <CardDescription>Basic information about your store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            Configure the admin WhatsApp number and message templates for order notifications via Twilio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Admin WhatsApp Number</Label>
            <Input
              {...register("adminWhatsapp")}
              placeholder="+91XXXXXXXXXX"
              className="mt-1 font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">Include country code, e.g. +919876543210</p>
          </div>

          <div>
            <Label>New Order Template</Label>
            <Textarea
              {...register("newOrderTemplate")}
              placeholder="New order {{orderNumber}} from {{customerName}}. Total: ₹{{total}}. Phone: {{phone}}"
              className="mt-1 text-sm font-mono resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available variables: <code>{"{{orderNumber}}"}</code>, <code>{"{{customerName}}"}</code>, <code>{"{{total}}"}</code>, <code>{"{{phone}}"}</code>
            </p>
          </div>

          <div>
            <Label>Status Update Template</Label>
            <Textarea
              {...register("statusUpdateTemplate")}
              placeholder="Hi {{customerName}}, your order {{orderNumber}} is now {{status}}."
              className="mt-1 text-sm font-mono resize-none"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available variables: <code>{"{{customerName}}"}</code>, <code>{"{{orderNumber}}"}</code>, <code>{"{{status}}"}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
