import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  PiggyBank,
  TrendingUp,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  mobileNav?: boolean; // show in bottom tab bar
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, mobileNav: true },
  { title: "Transactions", href: "/transactions", icon: ArrowLeftRight, mobileNav: true },
  { title: "Accounts", href: "/accounts", icon: Landmark, mobileNav: true },
  { title: "Goals", href: "/budgets", icon: PiggyBank, mobileNav: true },
  { title: "Net Worth", href: "/net-worth", icon: TrendingUp },
  { title: "Splits", href: "/splits", icon: Users },
  { title: "Settings", href: "/settings", icon: Settings },
];
