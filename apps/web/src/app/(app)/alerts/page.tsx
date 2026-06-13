import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shell/page-header";
import { AlertsFeed } from "@/components/alerts/alerts-feed";
import { MarkAllReadButton } from "@/components/alerts/mark-all-read";
import { ThresholdSettingsButton } from "@/components/alerts/threshold-settings";

export default async function AlertsPage() {
  const alerts = await api.getAlerts();
  const needsAttention = alerts.filter(
    (a) => a.severity === "critical" || a.severity === "warning",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Alerts"
        title="Optimization Alerts"
        description={
          needsAttention > 0
            ? `${needsAttention} ${needsAttention === 1 ? "item needs" : "items need"} your attention. Each alert links to a one-click fix.`
            : "You're all caught up — no alerts need attention right now."
        }
        actions={
          <>
            <ThresholdSettingsButton />
            <MarkAllReadButton ids={alerts.map((a) => a.id)} />
          </>
        }
      />

      <div className="p-6 sm:p-8">
        <AlertsFeed alerts={alerts} />
      </div>
    </>
  );
}
