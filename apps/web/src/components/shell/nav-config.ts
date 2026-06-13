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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    items: [
      { label: "Authority HQ", href: "/", icon: Gauge },
      { label: "Backlink Opportunities", href: "/opportunities", icon: Link2, badge: "15" },
      { label: "Performance", href: "/performance", icon: LineChart },
    ],
  },
  {
    label: "Page Engine",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Onboarding", href: "/onboarding", icon: Rocket },
      { label: "Opportunity Explorer", href: "/research", icon: Telescope },
      { label: "Pages", href: "/pages", icon: Files },
      { label: "Leads", href: "/leads", icon: Inbox },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Brand Memory", href: "/brand", icon: BrainCircuit },
      { label: "Content", href: "/content", icon: FileText },
      { label: "Alerts", href: "/alerts", icon: Bell, badge: "5" },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
