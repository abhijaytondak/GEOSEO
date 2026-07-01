import { PageHeader } from "./page-header";
import { Construction } from "lucide-react";

export function ComingSoon({
  title,
  eyebrow,
  description,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
}) {
  return (
    <>
      <PageHeader title={title} eyebrow={eyebrow} description={description} />
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground shadow-card">
          <Construction className="size-5" />
        </div>
        <div className="mt-4 text-sm font-medium text-foreground">Coming soon</div>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This module is part of the Citensity roadmap and isn&apos;t wired up in the MVP
          prototype yet.
        </p>
      </div>
    </>
  );
}
