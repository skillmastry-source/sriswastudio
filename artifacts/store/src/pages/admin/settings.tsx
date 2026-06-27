import { useGetSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-serif font-bold">Settings</h1>
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-medium">Store Name</h3>
          <p className="text-muted-foreground">{settings?.storeName || 'Sriswa Studio'}</p>
        </div>
        <div>
          <h3 className="font-medium">Admin WhatsApp</h3>
          <p className="text-muted-foreground">{settings?.adminWhatsapp || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
}
