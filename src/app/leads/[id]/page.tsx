import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Send,
  UserRound,
  Wrench,
} from "lucide-react";
import { db } from "@/prisma/db";
import LeadActions from "./lead-actions";

export default async function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leadId = Number(id);

  if (!Number.isInteger(leadId) || leadId <= 0) {
    notFound();
  }

  const lead = await db.orm.public.Lead
    .where({ id: leadId })
    .first();

  if (!lead) {
    notFound();
  }

  const latestQuote = await db.orm.public.Quote
    .where({ leadId })
    .orderBy((quote) => quote.createdAt.desc())
    .first();

  const formattedValue = `$${lead.value.toLocaleString()}`;

  const followUp = lead.followUpAt
    ? new Date(lead.followUpAt).toLocaleString()
    : "Not scheduled";

  const createdAt = new Date(lead.createdAt).toLocaleString();

  const latestQuoteAmount = latestQuote
    ? `$${latestQuote.amount.toLocaleString()}`
    : null;

  const latestQuoteSentAt = latestQuote
    ? new Date(latestQuote.sentAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#17191c]">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/leads"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.07] text-black/50 transition hover:bg-black/[0.03] hover:text-black"
            >
              <ArrowLeft size={16} />
            </Link>

            <div>
              <p className="text-sm font-semibold">Fieldora</p>
              <p className="text-xs text-black/40">
                Lead record · {lead.leadCode}
              </p>
            </div>
          </div>

          <button className="flex h-10 items-center gap-2 rounded-xl bg-[#17191c] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-black">
            <Send size={15} />
            Contact lead
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-5 py-8 md:px-8">
        <div className="border-b border-black/[0.06] pb-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.05]">
              <UserRound size={20} className="text-black/55" />
            </div>

            <div>
              <p className="text-sm text-black/40">{lead.service}</p>
              <h1 className="text-[30px] font-semibold tracking-[-0.04em]">
                {lead.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="flex h-full flex-col gap-5">
            <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                Lead overview
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <InfoItem
                  icon={Mail}
                  label="Email"
                  value={lead.email || "No email added"}
                />
                <InfoItem
                  icon={Phone}
                  label="Phone"
                  value={lead.phone || "No phone added"}
                />
                <InfoItem
                  icon={Wrench}
                  label="Service"
                  value={lead.service}
                />
                <InfoItem
                  icon={CircleDollarSign}
                  label="Estimated value"
                  value={formattedValue}
                />
                <InfoItem
                  icon={MapPin}
                  label="Address"
                  value={lead.address || "No address added"}
                />
                <InfoItem
                  icon={CalendarDays}
                  label="Next follow-up"
                  value={followUp}
                />
              </div>
            </div>

            <div className="flex-1 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                Activity
              </p>

              <div className="mt-5">
                <ActivityItem
                  title="Lead created"
                  detail={`Captured from ${lead.source}`}
                  time={createdAt}
                />
              </div>

              <div className="mt-5 rounded-xl bg-[#f7f8f9] px-4 py-3">
                <p className="text-xs leading-5 text-black/40">
                  Additional CRM activity will appear here as contacts, quotes,
                  bookings, and follow-ups are recorded.
                </p>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-black/[0.06] bg-[#17191c] p-6 text-white shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">
                Opportunity
              </p>

              <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
                {formattedValue}
              </p>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Estimated potential revenue if this lead converts into a booked
                job.
              </p>

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs text-white/35">Lead source</p>
                <p className="mt-1 text-sm font-medium">{lead.source}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
              <div className="flex items-center gap-2">
                <Clock3 size={16} className="text-black/35" />
                <p className="text-sm font-medium">Next action</p>
              </div>

              {latestQuote ? (
                <div className="mt-5 rounded-2xl bg-[#f7f8f9] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black/45 shadow-sm ring-1 ring-black/[0.05]">
                        <ReceiptText size={16} />
                      </div>

                      <div>
                        <p className="text-xs text-black/35">Latest quote</p>
                        <p className="mt-1 text-sm font-semibold">
                          {latestQuote.quoteCode}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm font-semibold">
                      {latestQuoteAmount}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-black/[0.05] pt-3">
                    <p className="text-xs text-black/40">
                      Sent {latestQuoteSentAt}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-black/50">
                  {lead.status === "New"
                    ? "Contact the customer and confirm the service request before preparing a quote."
                    : "Continue moving this opportunity through the service pipeline."}
                </p>
              )}

              {latestQuote && (
                <p className="mt-4 text-sm leading-6 text-black/50">
                  Revise the quote if the scope or price changes, or book the
                  job once the customer is ready to proceed.
                </p>
              )}

              <div className="mt-5">
                <LeadActions
                  leadId={lead.id}
                  status={
                    lead.status as
                      | "New"
                      | "Contacted"
                      | "Quote Sent"
                      | "Booked"
                  }
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4f5f6] text-black/45">
        <Icon size={16} />
      </div>

      <div>
        <p className="text-xs text-black/35">{label}</p>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ActivityItem({
  title,
  detail,
  time,
}: {
  title: string;
  detail: string;
  time: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-black/30" />

      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-black/45">{detail}</p>
        <p className="mt-1 text-xs text-black/30">{time}</p>
      </div>
    </div>
  );
}