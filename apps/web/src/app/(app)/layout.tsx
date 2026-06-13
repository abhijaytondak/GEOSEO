import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { CommandPalette } from "@/components/shell/command-palette";
import { AppFeedbackProvider } from "@/components/system/app-feedback";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppFeedbackProvider>
      <div className="flex h-dvh overflow-hidden bg-background">
        <Sidebar className="hidden lg:flex" />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </AppFeedbackProvider>
  );
}
