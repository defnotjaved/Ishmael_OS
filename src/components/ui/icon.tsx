import {
  AlertTriangle,
  BarChart3,
  Blocks,
  Calendar,
  CalendarCheck,
  Database,
  FileText,
  Flame,
  FolderKanban,
  GitBranch,
  Home,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Mail,
  Menu,
  PiggyBank,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";

const registry: Record<string, LucideIcon> = {
  AlertTriangle,
  BarChart3,
  Blocks,
  Calendar,
  CalendarCheck,
  Database,
  FileText,
  Flame,
  FolderKanban,
  GitBranch,
  Home,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Mail,
  Menu,
  PiggyBank,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  Workflow,
};

export type IconName = keyof typeof registry;

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = registry[name] ?? LayoutDashboard;
  return <Cmp className={className} aria-hidden />;
}
