"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  ListFilter,
  ClipboardList,
  Ticket,
  BookOpen,
  FileText,
  Image,
  MessageSquare,
  GitBranch,
  Mail,
  Zap,
  Megaphone,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Package,
  Receipt,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { GlobalSearch } from "@/components/search/global-search";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = { label: string; href: string; icon: React.ElementType };
type NavSection = { section: string; items: NavItem[] };

const STORAGE_KEY = "sidebar-expanded-sections";

const navSections: NavSection[] = [
  {
    section: "CRM",
    items: [
      { label: "Home", href: "/home", icon: Home },
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Contacts", href: "/contacts", icon: Users },
      { label: "Companies", href: "/companies", icon: Building2 },
    ],
  },
  {
    section: "Sales",
    items: [
      { label: "Pipelines", href: "/deals", icon: Handshake },
      { label: "Sequences", href: "/sequences", icon: GitBranch },
      { label: "Lists", href: "/lists", icon: ListFilter },
    ],
  },
  {
    section: "Marketing",
    items: [
      { label: "Emails", href: "/emails", icon: Mail },
      { label: "Automation", href: "/automation", icon: Zap },
      { label: "Forms", href: "/forms", icon: ClipboardList },
      { label: "Campaigns", href: "/campaigns", icon: Megaphone },
    ],
  },
  {
    section: "Service",
    items: [
      { label: "Tickets", href: "/tickets", icon: Ticket },
      { label: "Chat", href: "/chat", icon: MessageSquare },
      { label: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
    ],
  },
  {
    section: "Content",
    items: [
      { label: "Content", href: "/content", icon: FileText },
      { label: "Assets", href: "/assets", icon: Image },
    ],
  },
  {
    section: "Commerce",
    items: [
      { label: "Products", href: "/commerce/products", icon: Package },
      { label: "Invoices", href: "/commerce/invoices", icon: Receipt },
      { label: "Subscriptions", href: "/commerce/subscriptions", icon: RefreshCw },
      { label: "Revenue", href: "/commerce/revenue", icon: DollarSign },
    ],
  },
  {
    section: "Analytics",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    section: "Settings",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

function getInitialExpandedSections(pathname: string): Record<string, boolean> {
  // Try loading from localStorage
  let stored: Record<string, boolean> = {};
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch {
      // ignore parse errors
    }
  }

  // Always expand the section containing the active route
  for (const section of navSections) {
    const hasActive = section.items.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
    );
    if (hasActive) {
      stored[section.section] = true;
    }
  }

  return stored;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    getInitialExpandedSections(pathname),
  );

  // Auto-expand section containing active route when pathname changes
  useEffect(() => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      for (const section of navSections) {
        const hasActive = section.items.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
        );
        if (hasActive) {
          next[section.section] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  // Persist expanded state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedSections));
    } catch {
      // ignore storage errors
    }
  }, [expandedSections]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex h-full flex-col border-r border-border bg-card transition-all duration-200",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-4">
          {!collapsed && (
            <span className="text-lg font-bold text-primary">CRM</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          {navSections.map((section) => {
            const isExpanded = !!expandedSections[section.section];

            // On collapsed sidebar, show just the icons without section headers
            if (collapsed) {
              return (
                <div key={section.section}>
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        title={item.label}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={section.section} className="pt-2">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.section)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                >
                  <span>{section.section}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>

                {/* Section items */}
                {isExpanded && (
                  <div className="mt-0.5 space-y-0.5">
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <Separator />

        {/* User section */}
        <div className="flex items-center justify-between p-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-2",
                )}
              >
                <Avatar.Root className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Avatar.Fallback className="text-xs font-medium text-primary">
                    U
                  </Avatar.Fallback>
                </Avatar.Root>
                {!collapsed && (
                  <span className="truncate">User</span>
                )}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[180px] rounded-md border border-border bg-popover p-1 shadow-md"
                side="top"
                align="start"
                sideOffset={8}
              >
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted"
                  onSelect={() => router.push("/settings")}
                >
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-muted"
                  onSelect={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <GlobalSearch />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
