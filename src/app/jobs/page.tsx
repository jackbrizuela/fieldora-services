import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  UserRound,
  Wrench,
} from "lucide-react";
import { db } from "@/prisma/db";
import JobActions from "./job-actions";

export default async function JobsPage() {
  const [jobs, bookings, leads] = await Promise.all([
    db.orm.public.Job
      .orderBy((job) => job.createdAt.desc())
      .all(),
    db.orm.public.Booking.all(),
    db.orm.public.Lead.all(),
  ]);

  const bookingById = new Map(
    bookings.map((booking) => [booking.id, booking])
  );

  const leadById = new Map(
    leads.map((lead) => [lead.id, lead])
  );

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
                Job operations
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-5 py-8 md:px-8 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:pt-9 lg:pb-5">
        <div className="flex flex-none flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-black/40">
              Operations
            </p>

            <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
              Jobs
            </h1>

            <p className="mt-2 text-sm text-black/45">
              Track active service work after a booking has started.
            </p>
          </div>

          <div>
            <p className="text-xs text-black/35">
              Total jobs
            </p>

            <p className="mt-1 text-xl font-semibold">
              {jobs.length}
            </p>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          {jobs.length > 0 ? (
            <div className="overflow-x-auto lg:min-h-0 lg:flex-1 lg:overflow-auto">
              <table className="w-full min-w-[1180px]">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-black/[0.055] text-left">
                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Job
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Service
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Booking
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Started
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Address
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Status
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Value
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {jobs.map((job) => {
                    const booking =
                      bookingById.get(job.bookingId);

                    const lead = booking
                      ? leadById.get(booking.leadId)
                      : undefined;

                    const startedAt = new Date(
                      job.startedAt
                    ).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <tr
                        key={job.id}
                        className="border-b border-black/[0.045] last:border-0 transition hover:bg-black/[0.015]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef0f2] text-black/45">
                              <UserRound size={16} />
                            </div>

                            <div>
                              {lead ? (
                                <Link
                                  href={`/leads/${lead.id}`}
                                  className="text-sm font-medium transition hover:text-black/60"
                                >
                                  {lead.name}
                                </Link>
                              ) : (
                                <p className="text-sm font-medium">
                                  Unknown customer
                                </p>
                              )}

                              <p className="mt-1 text-[11px] font-medium text-black/30">
                                {job.jobCode}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-black/55">
                            <Wrench
                              size={14}
                              className="text-black/30"
                            />

                            {lead?.service ??
                              "Unknown service"}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-black/45">
                          {booking?.bookingCode ??
                            "Unknown booking"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-black/55">
                            <Clock3
                              size={14}
                              className="text-black/30"
                            />

                            {startedAt}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex max-w-[260px] items-start gap-2 text-sm text-black/45">
                            <MapPin
                              size={14}
                              className="mt-0.5 shrink-0 text-black/30"
                            />

                            {booking?.address ??
                              "No address"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              job.status === "Completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium">
                          ${(lead?.value ?? 0).toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          <JobActions
                            jobId={job.id}
                            status={job.status}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-20 text-center">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3f4f5]">
                  <Wrench
                    size={19}
                    className="text-black/35"
                  />
                </div>

                <p className="mt-4 text-sm font-medium">
                  No jobs yet
                </p>

                <p className="mt-1 max-w-sm text-xs leading-5 text-black/40">
                  Jobs will appear here after a scheduled booking is started.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}