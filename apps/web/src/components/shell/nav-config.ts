import {
  Gauge,
  Link2,
  LineChart,
  FileText,
  Bell,
  Settings,
  BrainCircuit,
  Files,
  Inbox,
  Rocket,
  Telescope,
  LayoutDashboard,
  Boxes,
  Bot,
  Palette,
  Swords,
  Home,
  Workflow,
  ShieldCheck,
  CreditCard,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** Extra search terms so the command palette finds a destination by concept. */
  keywords?: string;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

/**
 * Primary sidebar — collapsed to the workflow-first "Growth OS" model
 * (docs/PRD-workflow-navigation-optimization.md §5/§7). Six persistent
 * destinations only; every other surface is reached contextually inside these
 * workflows or via the command palette (see `commandDestinations`). Do NOT add
 * implementation-step pages here (FR1).
 */
export const navSections: NavSection[] = [
  {
    items: [
      { label: "Home", href: "/", icon: Home },
      { label: "Pipeline", href: "/pipeline", icon: Workflow },
      { label: "Authority", href: "/authority", icon: ShieldCheck },
      { label: "Leads", href: "/leads", icon: Inbox },
      { label: "Analytics", href: "/analytics", icon: LineChart },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Brand Memory", href: "/brand", icon: BrainCircuit },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/**
 * Full destination index for the command palette + global-search "Go to"
 * commands. The sidebar is intentionally collapsed, but every workflow surface —
 * including the ones folded into Pipeline / Authority / Analytics / Settings —
 * must remain findable by name (FR8 — backwards compatibility). Keep in sync as
 * routes are added.
 */
export const commandDestinations: NavItem[] = [
  { label: "Home", href: "/", icon: Home, keywords: "command center growth hq authority overview" },
  { label: "Pipeline", href: "/pipeline", icon: Workflow, keywords: "page engine workflow discover plan create review publish refresh" },
  { label: "Authority", href: "/authority", icon: ShieldCheck, keywords: "backlinks competitors citations trust signals" },
  { label: "Leads", href: "/leads", icon: Inbox, keywords: "demand inbox qualified conversion crm" },
  { label: "Analytics", href: "/analytics", icon: LineChart, keywords: "measurement ai visibility rankings performance evidence" },
  { label: "Settings", href: "/settings", icon: Settings, keywords: "workspace integrations team billing notifications brand context" },
  // Folded surfaces — no longer in the sidebar, still navigable by name:
  { label: "Page Engine Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: "pipeline overview" },
  { label: "Opportunity Explorer", href: "/research", icon: Telescope, keywords: "discover keywords research opportunities buyer intent" },
  { label: "Pages", href: "/pages", icon: Files, keywords: "create review publish generated pages editor blueprint" },
  { label: "Content", href: "/content", icon: FileText, keywords: "create drafts editor" },
  { label: "Theme", href: "/theme", icon: Palette, keywords: "site theme fidelity tokens publishing" },
  { label: "Conversion Audit", href: "/conversion-audit", icon: Gauge, keywords: "review cro audit landing" },
  { label: "Backlink Opportunities", href: "/opportunities", icon: Link2, keywords: "authority links outreach prospects" },
  { label: "Competitors", href: "/competitors", icon: Swords, keywords: "authority serp gaps rivals" },
  { label: "Performance", href: "/performance", icon: LineChart, keywords: "analytics rankings traffic gsc trends" },
  { label: "AI Search", href: "/ai-search", icon: Bot, keywords: "analytics ai visibility mentions bots citations" },
  { label: "Brand Memory", href: "/brand", icon: BrainCircuit, keywords: "brand context library products personas proof" },
  { label: "Alerts", href: "/alerts", icon: Bell, keywords: "notifications action inbox risks" },
  { label: "Onboarding", href: "/onboarding", icon: Rocket, keywords: "setup wizard getting started" },
  { label: "Solutions", href: "/solutions", icon: Boxes, keywords: "readiness ai search lead conversion paid boost" },
  { label: "Billing & plans", href: "/billing", icon: CreditCard, keywords: "subscription stripe plan upgrade pricing seats limits" },
  { label: "Admin & diagnostics", href: "/admin", icon: Wrench, keywords: "support provider health jobs errors audit internal status" },
];
