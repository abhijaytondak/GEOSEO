import { PageHeader } from "@/components/shell/page-header";
import { ThemeSettingsView } from "@/components/theme/theme-settings-view";

export default function ThemePage() {
  return (
    <>
      <PageHeader
        eyebrow="Page Engine"
        title="Theme"
        description="Scan and confirm your website's look so generated pages render in your real colors, fonts, and component styles — native to your brand, not a detached microsite."
      />
      <div className="p-6 sm:p-8">
        <ThemeSettingsView />
      </div>
    </>
  );
}
