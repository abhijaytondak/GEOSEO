import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsView } from "@/components/settings/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await api.getSettings();

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Workspace Settings"
        description="Manage publishing defaults, integrations, team access, notifications, and plan state."
      />
      <div className="p-6 sm:p-8">
        <SettingsView initial={settings} />
      </div>
    </>
  );
}
