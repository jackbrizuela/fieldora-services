"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeDots from "@/components/theme-dots";
import {
  CalendarDays,
  ChartNoAxesCombined,
  FileText,
  House,
  LayoutDashboard,
  Menu,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Leads", icon: Users, href: "/leads" },
  { label: "Customers", icon: House, href: "/customers" },
  { label: "Quotes", icon: FileText, href: "/quotes" },
  { label: "Bookings", icon: CalendarDays, href: "/bookings" },
  { label: "Jobs", icon: Wrench, href: "/jobs" },
  { label: "Automations", icon: Sparkles, href: "/automations" },
  { label: "Reports", icon: ChartNoAxesCombined, href: "/reports" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function Navigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="mt-8 space-y-1">
      {navItems.map(({ label, icon: Icon, href }) => {
        const active = isActivePath(pathname, href);

        return (
          <Link
            key={label}
            href={href}
            onClick={onNavigate}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              active
                ? "bg-[#17191c] font-medium text-white shadow-sm"
                : "text-black/55 hover:bg-black/[0.035] hover:text-black/80"
            }`}
          >
            <Icon size={17} strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#17191c] text-white">
        <Wrench size={17} strokeWidth={2} />
      </div>

      <div>
        <p className="text-[15px] font-semibold tracking-[-0.01em]">
          Fieldora
        </p>
        <p className="text-xs text-black/40">Home Services</p>
      </div>
    </div>
  );
}

export default function FieldoraShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  // Dashboard already has the original Fieldora sidebar.
  // Leave it untouched while the shared shell is introduced safely.
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-[#f6f7f9] text-[#17191c] lg:flex lg:h-screen lg:overflow-hidden">

      <aside className="hidden w-[248px] shrink-0 border-r border-black/[0.06] bg-white px-4 py-5 lg:flex lg:flex-col">
        <Brand />

        <Navigation pathname={pathname} />

        <div className="mt-3 flex px-3">
          <ThemeDots />
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:h-screen lg:overflow-hidden">
        <header className="relative flex h-16 items-center border-b border-black/[0.06] bg-white px-4 lg:hidden">
          <details className="group relative mr-3">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-black/[0.07] text-black/55 transition hover:bg-black/[0.03] [&::-webkit-details-marker]:hidden">
              <Menu size={18} />
            </summary>

            <div className="absolute left-0 top-12 z-50 w-[240px] rounded-2xl border border-black/[0.07] bg-white p-2 shadow-xl">
              <nav className="space-y-1">
                {navItems.map(({ label, icon: Icon, href }) => {
                  const active = isActivePath(pathname, href);

                  return (
                    <Link
                      key={label}
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-[#17191c] font-medium text-white"
                          : "text-black/55 hover:bg-black/[0.035] hover:text-black/80"
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.8} />
                      {label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-2 border-t border-black/[0.06] pt-1">
                <ThemeDots />
              </div>
            </div>
          </details>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#17191c] text-white">
              <Wrench size={17} />
            </div>

            <div>
              <p className="text-sm font-semibold">Fieldora</p>
              <p className="text-[10px] text-black/35">Home Services</p>
            </div>
          </div>
        </header>

        <div className="h-full min-h-0 [&>main>header]:hidden lg:[&>main]:h-full lg:[&>main]:min-h-0 lg:[&>main>div]:mx-0 lg:[&>main>div]:max-w-none">
          {children}
        </div>
      </div>

    </div>
  );
}
