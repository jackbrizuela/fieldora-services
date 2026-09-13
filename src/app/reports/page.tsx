import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Users,
  Wrench,
} from "lucide-react";
import { db } from "@/prisma/db";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default async function ReportsPage() {
  const [leads, quotes, bookings, jobs] = await Promise.all([
    db.orm.public.Lead.all(),
    db.orm.public.Quote.all(),
    db.orm.public.Booking.all(),
    db.orm.public.Job.all(),
  ]);

  const bookingById = new Map(
    bookings.map((booking) => [booking.id, booking])
  );

  const leadById = new Map(
    leads.map((lead) => [lead.id, lead])
  );

  const stageCounts = {
    New: leads.filter((lead) => lead.status === "New").length,
    Contacted: leads.filter((lead) => lead.status === "Contacted").length,
    "Quote Sent": leads.filter((lead) => lead.status === "Quote Sent").length,
    Booked: leads.filter((lead) => lead.status === "Booked").length,
  };

  const pipelineValue = leads
    .filter((lead) =>
      ["New", "Contacted", "Quote Sent"].includes(lead.status)
    )
    .reduce((sum, lead) => sum + lead.value, 0);

  const quoteValue = quotes.reduce(
    (sum, quote) => sum + quote.amount,
    0
  );

  const activeJobs = jobs.filter(
    (job) => job.status === "In Progress"
  );

  const completedJobs = jobs.filter(
    (job) => job.status === "Completed"
  );

  const completedRevenue = completedJobs.reduce((sum, job) => {
    const booking = bookingById.get(job.bookingId);
    const lead = booking
      ? leadById.get(booking.leadId)
      : undefined;

    return sum + (lead?.value ?? 0);
  }, 0);

  const quoteConversion =
    leads.length > 0
      ? Math.round((quotes.length / leads.length) * 100)
      : 0;

  const quotedLeadIds = new Set(
    quotes.map((quote) => quote.leadId)
  );

  const bookedQuotedLeads = bookings.filter((booking) =>
    quotedLeadIds.has(booking.leadId)
  );

  const bookingConversion =
    quotes.length > 0
      ? Math.round(
          (bookedQuotedLeads.length / quotes.length) * 100
        )
      : 0;

  const completionRate =
    jobs.length > 0
      ? Math.round(
          (completedJobs.length / jobs.length) * 100
        )
      : 0;

  const metrics = [
    {
      label: "Total leads",
      value: String(leads.length),
      detail: `${stageCounts["Quote Sent"]} currently quoted`,
      icon: Users,
    },
    {
      label: "Quote value",
      value: formatCurrency(quoteValue),
      detail: `${quotes.length} sent`,
      icon: FileText,
    },
    {
      label: "Bookings",
      value: String(bookings.length),
      detail: `${bookingConversion}% quote-to-booking`,
      icon: CalendarDays,
    },
    {
      label: "Completed revenue",
      value: formatCurrency(completedRevenue),
      detail: `${completedJobs.length} completed jobs`,
      icon: CircleDollarSign,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#17191c] lg:h-screen lg:overflow-hidden">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center px-5 md:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.07] text-black/50 transition hover:bg-black/[0.03] hover:text-black"
            >
              <ArrowLeft size={16} />
            </Link>

            <div>
              <p className="text-sm font-semibold">
                Fieldora
              </p>

              <p className="text-xs text-black/40">
                Business reporting
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-5 py-8 md:px-8 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:pt-9 lg:pb-5">
        <div className="flex flex-none flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-black/40">
              Analytics
            </p>

            <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
              Reports
            </h1>

            <p className="mt-2 text-sm text-black/45">
              Live performance metrics across sales, scheduling, and service delivery.
            </p>
          </div>

          <div>
            <p className="text-xs text-black/35">
              Pipeline value
            </p>

            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(pipelineValue)}
            </p>
          </div>
        </div>

        <div className="mt-8 grid flex-none gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(
            ({ label, value, detail, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-black/45">
                    {label}
                  </p>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f6f7] text-black/55">
                    <Icon
                      size={16}
                      strokeWidth={1.8}
                    />
                  </div>
                </div>

                <p className="mt-5 text-[28px] font-semibold tracking-[-0.04em]">
                  {value}
                </p>

                <p className="mt-1 text-xs text-black/35">
                  {detail}
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-4 grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] md:p-6">
            <div className="flex items-center gap-2">
              <BarChart3
                size={17}
                className="text-black/35"
              />

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                  Lead funnel
                </p>

                <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.02em]">
                  Pipeline stages
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {Object.entries(stageCounts).map(
                ([stage, count]) => (
                  <div
                    key={stage}
                    className="flex items-center justify-between rounded-xl border border-black/[0.055] bg-[#fafafa] px-4 py-3"
                  >
                    <span className="text-sm font-medium">
                      {stage}
                    </span>

                    <span className="text-sm text-black/45">
                      {count}
                    </span>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] md:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
              Conversion
            </p>

            <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.02em]">
              Funnel performance
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-black/45">
                    Lead → Quote
                  </p>

                  <p className="text-sm font-medium">
                    {quoteConversion}%
                  </p>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.05]">
                  <div
                    className="h-full rounded-full bg-black"
                    style={{
                      width: `${Math.min(
                        quoteConversion,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-black/45">
                    Quote → Booking
                  </p>

                  <p className="text-sm font-medium">
                    {bookingConversion}%
                  </p>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.05]">
                  <div
                    className="h-full rounded-full bg-black"
                    style={{
                      width: `${Math.min(
                        bookingConversion,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-black/45">
                    Job completion
                  </p>

                  <p className="text-sm font-medium">
                    {completionRate}%
                  </p>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.05]">
                  <div
                    className="h-full rounded-full bg-black"
                    style={{
                      width: `${Math.min(
                        completionRate,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-[#f7f8f9] p-4">
              <div className="flex items-center gap-2">
                <Wrench
                  size={15}
                  className="text-black/35"
                />

                <p className="text-sm font-medium">
                  Job status
                </p>
              </div>

              <p className="mt-2 text-xs leading-5 text-black/40">
                {activeJobs.length} active,{" "}
                {completedJobs.length} completed.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}