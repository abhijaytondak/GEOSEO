import { PageHeader } from "@/components/shell/page-header";
import { AdminView } from "@/components/admin/admin-view";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Internal"
        title="Admin & diagnostics"
        description="Support console: system status, provider health, recent jobs and errors. Gated by ADMIN_API_TOKEN outside demo mode."
      />
      <div className="p-6 sm:p-8">
        <AdminView />
      </div>
    </>
  );
}
