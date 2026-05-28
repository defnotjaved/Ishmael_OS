export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name (see components/ui/icon.tsx)
}

export const sidebarNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Finances", href: "/finances", icon: "Wallet" },
  { label: "Goals", href: "/goals", icon: "Target" },
  { label: "Tasks & Plan", href: "/tasks", icon: "ListChecks" },
  { label: "Habits", href: "/habits", icon: "Flame" },
  { label: "Projects", href: "/projects", icon: "FolderKanban" },
  { label: "Calendar", href: "/calendar", icon: "Calendar" },
  { label: "AI Advisor", href: "/ai-advisor", icon: "Sparkles" },
  { label: "Achievements", href: "/achievements", icon: "Trophy" },
  { label: "Family", href: "/family", icon: "Users" },
  { label: "Integrations", href: "/integrations", icon: "Blocks" },
  { label: "Reports", href: "/reports", icon: "BarChart3" },
  { label: "Settings", href: "/settings", icon: "Settings" },
];

export const mobileNav: NavItem[] = [
  { label: "Home", href: "/", icon: "Home" },
  { label: "Goals", href: "/goals", icon: "Target" },
  { label: "Plan", href: "/tasks", icon: "CalendarCheck" },
  { label: "Habits", href: "/habits", icon: "Flame" },
  { label: "More", href: "/more", icon: "Menu" },
];
