import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  FileText,
  House,
  LayoutDashboard,
  MessageSquareText,
  Menu,
  Plus,
  Search,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { db } from "@/prisma/db";
import ThemeDots from "@/components/theme-dots";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true, href: "/" },
  { label: "Leads", icon: Users, href: "/leads" },
  { label: "Customers", icon: House, href: "/customers" },
  { label: "Quotes", icon: FileText, href: "/quotes" },
  { label: "Bookings", icon: CalendarDays, href: "/bookings" },
  { label: "Jobs", icon: Wrench, href: "/jobs" },
  { label: "Automations", icon: Sparkles, href: "/automations" },
  { label: "Reports", icon: ChartNoAxesCombined, href: "/reports" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default async function Home() {
  const [leads, quotes, bookings, jobs, automations] = await Promise.all([
    db.orm.public.Lead.all(),
    db.orm.public.Quote.all(),
    db.orm.public.Booking.all(),
    db.orm.public.Job.all(),
    db.orm.public.Automation.all(),
  ]);

  const bookingById = new Map(
    bookings.map((booking) => [booking.id, booking])
  );

  const leadById = new Map(
    leads.map((lead) => [lead.id, lead])
  );

  const activeAutomations = automations.filter(
    (automation) => automation.status === "Active"
  );

  const newLeads = leads.filter((lead) => lead.status === "New");

  const quotedLeads = quotes;

  const activeJobs = jobs.filter((job) => job.status === "In Progress");

  const completedJobs = jobs.filter((job) => job.status === "Completed");

  const completedRevenue = completedJobs.reduce((total, job) => {
    const booking = bookingById.get(job.bookingId);
    const lead = booking ? leadById.get(booking.leadId) : undefined;

    return total + (lead?.value ?? 0);
  }, 0);

  const metrics = [
    {
      label: "New leads",
      value: String(newLeads.length),
      change: `${leads.length} total`,
      detail: "in CRM",
      icon: Users,
    },
    {
      label: "Quotes sent",
      value: String(quotedLeads.length),
      change: `${quotes.filter((quote) => quote.status === "Sent").length} sent`,
      detail: "tracked quotes",
      icon: FileText,
    },
    {
      label: "Active jobs",
      value: String(activeJobs.length),
      change: `${completedJobs.length} completed`,
      detail: "all time",
      icon: ClipboardList,
    },
    {
      label: "Revenue",
      value: formatCurrency(completedRevenue),
      change: `${completedJobs.length} completed`,
      detail: "recognized jobs",
      icon: CircleDollarSign,
    },
  ];

  const pipelineStages = [
    {
      stage: "New lead",
      status: "New",
    },
    {
      stage: "Contacted",
      status: "Contacted",
    },
    {
      stage: "Quote sent",
      status: "Quote Sent",
    },
  ];

  const pipeline = pipelineStages.map(({ stage, status }) => {
    const stageLeads = leads.filter((lead) => lead.status === status);

    return {
      stage,
      count: stageLeads.length,
      total: stageLeads.reduce((sum, lead) => sum + lead.value, 0),
      leads: stageLeads.slice(0, 3),
    };
  });

  const scheduledBookings = bookings
    .filter((booking) => booking.status === "Scheduled")
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() -
        new Date(b.scheduledAt).getTime()
    )
    .slice(0, 3);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="relative min-h-screen bg-[#f6f7f9] text-[#17191c] lg:h-screen lg:overflow-hidden">

      <div className="flex min-h-screen lg:h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r border-black/[0.06] bg-white px-4 py-5 lg:fixed lg:left-0 lg:top-0 lg:flex lg:h-screen lg:flex-col">
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

          <nav className="mt-8 space-y-1">
            {navItems.map(({ label, icon: Icon, active, href }) => (
              <Link
                key={label}
                href={href ?? "#"}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-[#17191c] font-medium text-white shadow-sm"
                    : "text-black/55 hover:bg-black/[0.035] hover:text-black/80"
                }`}
              >
                <Icon size={17} strokeWidth={1.8} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 flex justify-center">
            <ThemeDots />
          </div>

          <div className="mt-auto rounded-2xl border border-black/[0.06] bg-[#fafafa] p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/[0.05]">
                <Sparkles size={14} />
              </div>

              <p className="text-sm font-medium">
                {activeAutomations.length > 0
                  ? "Automation active"
                  : "Automation workspace"}
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-black/45">
              {activeAutomations.length > 0
                ? `${activeAutomations.length} ${
                    activeAutomations.length === 1
                      ? "workflow is"
                      : "workflows are"
                  } enabled.`
                : "No automation rules are currently active."}
            </p>

            {activeAutomations[0] ? (
              <Link
                href="/automations"
                className="mt-3 block rounded-xl border border-black/[0.055] bg-white p-3 transition hover:bg-black/[0.02]"
              >
                <p className="text-xs font-medium">
                  {activeAutomations[0].name}
                </p>

                <p className="mt-1 text-[11px] leading-5 text-black/40">
                  {activeAutomations[0].triggerEvent} →{" "}
                  {activeAutomations[0].actionType}
                </p>
              </Link>
            ) : (
              <Link
                href="/automations"
                className="mt-3 inline-block text-xs font-medium text-black/60 transition hover:text-black"
              >
                Configure workflows →
              </Link>
            )}
          </div>
        </aside>

        <section className="min-w-0 flex-1 lg:ml-[248px] lg:h-screen lg:overflow-y-auto">
          <header className="relative flex h-[64px] items-center border-b border-black/[0.06] bg-white px-5 lg:hidden">
            <details className="group relative mr-3">
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-black/[0.07] text-black/55 transition hover:bg-black/[0.03] [&::-webkit-details-marker]:hidden">
                <Menu size={18} />
              </summary>

              <div className="absolute left-0 top-12 z-50 w-[240px] rounded-2xl border border-black/[0.07] bg-white p-2 shadow-xl">
                <nav className="space-y-1">
                  {navItems.map(({ label, icon: Icon, active, href }) => (
                    <Link
                      key={label}
                      href={href ?? "#"}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-[#17191c] font-medium text-white"
                          : "text-black/55 hover:bg-black/[0.035] hover:text-black/80"
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.8} />
                      {label}
                    </Link>
                  ))}
                </nav>
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

          <div className="flex min-h-0 lg:min-h-screen w-full flex-col px-5 pt-7 pb-5 md:px-8 md:pt-9 md:pb-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-black/40">{todayLabel}</p>

                <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.035em] sm:text-[32px]">
                  Good morning, Charlie.
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-black/45">
                  Here&apos;s what&apos;s happening across your home service
                  business.
                </p>
              </div>

              <Link
                href="/leads"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#17191c] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-black"
              >
                <Plus size={16} />
                New lead
              </Link>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(({ label, value, change, detail, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-black/45">{label}</p>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f6f7] text-black/55">
                      <Icon size={16} strokeWidth={1.8} />
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <p className="text-[28px] font-semibold tracking-[-0.04em]">
                      {value}
                    </p>

                    <div className="pb-1 text-right">
                      <p className="text-xs font-medium text-emerald-600">
                        {change}
                      </p>
                      <p className="mt-0.5 text-[11px] text-black/35">
                        {detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_0.9fr]">
              <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] md:p-6 lg:h-[420px] lg:overflow-y-auto">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                      Sales pipeline
                    </p>

                    <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.02em]">
                      Active opportunities
                    </h2>
                  </div>

                  <Link
                    href="/leads"
                    className="text-sm font-medium text-black/45 transition hover:text-black/80"
                  >
                    View pipeline
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                  {pipeline.map((column) => (
                    <div
                      key={column.stage}
                      className="fieldora-pipeline-column rounded-xl border border-black/[0.055] bg-[#f8f9fa] p-3"
                    >
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#7f8b96]" />
                          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-black/40">{column.stage}</p>
                        </div>

                        <span className="text-xs text-black/35">
                          {column.count}
                        </span>
                      </div>

                      <p className="mt-1 px-1 text-xs text-black/35">
                        {formatCurrency(column.total)} pipeline value
                      </p>

                      <div className="mt-3 space-y-2">
                        {column.leads.length > 0 ? (
                          column.leads.map((lead) => (
                            <Link
                              key={lead.id}
                              href={`/leads/${lead.id}`}
                              className="fieldora-pipeline-lead block rounded-xl border border-black/[0.055] bg-white p-3 shadow-[0_1px_1px_rgba(0,0,0,0.015)] transition hover:-translate-y-0.5 hover:shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">
                                    {lead.name}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-black/40">
                                    {lead.service}
                                  </p>
                                </div>

                                <span className="shrink-0 rounded-md bg-black/[0.035] px-2 py-1 text-[10px] text-black/45">
                                  {formatCurrency(lead.value)}
                                </span>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="fieldora-pipeline-empty rounded-xl border border-dashed border-black/[0.07] px-3 py-5 text-center">
                            <p className="text-xs text-black/30">
                              No leads in this stage
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] md:p-6 lg:h-[420px] lg:overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                      Schedule
                    </p>

                    <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.02em]">
                      Upcoming bookings
                    </h2>
                  </div>

                  <CalendarDays size={17} className="text-black/35" />
                </div>

                {scheduledBookings.length > 0 ? (
                  <div className="mt-5 divide-y divide-black/[0.055]">
                    {scheduledBookings.map((booking) => {
                      const lead = leadById.get(booking.leadId);
                      const date = new Date(booking.scheduledAt);

                      return (
                        <div
                          key={booking.id}
                          className="flex gap-4 py-4 first:pt-0"
                        >
                          <div className="w-14 shrink-0 pt-0.5">
                            <p className="text-xs font-medium text-black/45">
                              {date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>

                            <p className="mt-1 text-[11px] text-black/30">
                              {date.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {lead?.name ?? "Unknown customer"}
                            </p>

                            <p className="mt-1 text-xs text-black/40">
                              {lead?.service ?? "Unknown service"}
                            </p>

                            <p className="mt-2 text-[11px] text-black/35">
                              {booking.bookingCode}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-black/[0.07] px-4 py-10 text-center">
                    <CalendarDays
                      size={18}
                      className="mx-auto text-black/25"
                    />
                    <p className="mt-3 text-sm font-medium">
                      No upcoming bookings
                    </p>
                    <p className="mt-1 text-xs text-black/35">
                      New scheduled work will appear here.
                    </p>
                  </div>
                )}

                <Link
                  href="/bookings"
                  className="mt-4 block w-full rounded-xl border border-black/[0.06] py-2.5 text-center text-xs font-medium text-black/55 transition hover:bg-black/[0.025] hover:text-black/80"
                >
                  View full schedule
                </Link>
              </div>
            </div>

            <div className="mt-4 grid flex-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
              <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] md:p-6 lg:h-[300px] lg:overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                      Automation
                    </p>

                    <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.02em]">
                      Workflow roadmap
                    </h2>
                  </div>

                  <Sparkles size={17} className="text-black/35" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {automations.length > 0 ? (
                    automations.slice(0, 4).map((automation) => (
                      <Link
                        key={automation.id}
                        href="/automations"
                        className="flex items-center justify-between rounded-xl border border-black/[0.055] bg-[#fafafa] p-3.5 transition hover:bg-black/[0.025]"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {automation.name}
                          </p>

                          <p className="mt-1 text-xs text-black/35">
                            {automation.triggerEvent} → {automation.actionType}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            automation.status === "Active"
                              ? "bg-emerald-50 text-emerald-700"
                              : automation.status === "Paused"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-black/[0.035] text-black/45"
                          }`}
                        >
                          {automation.status}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full rounded-xl border border-dashed border-black/[0.07] px-4 py-8 text-center">
                      <p className="text-sm font-medium">
                        No automation rules yet
                      </p>

                      <Link
                        href="/automations"
                        className="mt-2 inline-block text-xs font-medium text-black/45 transition hover:text-black"
                      >
                        Configure your first workflow
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-black/[0.06] bg-[#17191c] p-5 text-white shadow-sm md:p-6 lg:h-[300px] lg:overflow-y-auto">
                <div className="flex items-center gap-2">
                  <MessageSquareText size={17} className="text-white/60" />
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/45">
                    Fieldora summary
                  </p>
                </div>

                <p className="mt-5 text-lg font-medium leading-7 tracking-[-0.02em]">
                  {leads.length > 0
                    ? `${leads.length} active ${
                        leads.length === 1 ? "lead" : "leads"
                      } currently in Fieldora.`
                    : "Your pipeline is ready for new opportunities."}
                </p>

                <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-white/40">
                      Pipeline value
                    </span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(
                        leads.reduce(
                          (total, lead) => total + lead.value,
                          0
                        )
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-white/40">
                      Upcoming bookings
                    </span>
                    <span className="text-sm font-semibold">
                      {scheduledBookings.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-white/40">
                      Active jobs
                    </span>
                    <span className="text-sm font-semibold">
                      {activeJobs.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-white/40">
                      Completed jobs
                    </span>
                    <span className="text-sm font-semibold">
                      {completedJobs.length}
                    </span>
                  </div>
                </div>

                <Link
                  href="/leads"
                  className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#17191c] transition hover:bg-white/90"
                >
                  Review pipeline
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}