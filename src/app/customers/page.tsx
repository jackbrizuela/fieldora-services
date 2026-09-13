import {
  BriefcaseBusiness,
  Mail,
  Phone,
  RotateCcw,
  UserRound,
  Wrench,
} from "lucide-react";
import { db } from "@/prisma/db";

export default async function CustomersPage() {
  const [customers, leads, bookings, jobs] = await Promise.all([
    db.orm.public.Customer.all(),
    db.orm.public.Lead.all(),
    db.orm.public.Booking.all(),
    db.orm.public.Job.all(),
  ]);

  const leadsByCustomerId = new Map<
    number,
    typeof leads
  >();

  for (const lead of leads) {
    if (!lead.customerId) {
      continue;
    }

    const customerLeads =
      leadsByCustomerId.get(lead.customerId) ?? [];

    customerLeads.push(lead);
    leadsByCustomerId.set(
      lead.customerId,
      customerLeads
    );
  }

  const bookingByLeadId = new Map(
    bookings.map((booking) => [
      booking.leadId,
      booking,
    ])
  );

  const jobByBookingId = new Map(
    jobs.map((job) => [
      job.bookingId,
      job,
    ])
  );

  const customerRows = customers
    .map((customer) => {
      const customerLeads =
        leadsByCustomerId.get(customer.id) ?? [];

      const sortedLeads = [...customerLeads].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      const latestLead = sortedLeads[0];

      const customerBookings = customerLeads
        .map((lead) => bookingByLeadId.get(lead.id))
        .filter(Boolean);

      const customerJobs = customerBookings
        .map((booking) =>
          booking
            ? jobByBookingId.get(booking.id)
            : undefined
        )
        .filter(Boolean);

      const completedJobs = customerJobs.filter(
        (job) => job?.status === "Completed"
      ).length;

      const customerValue = customerLeads.reduce(
        (total, lead) => total + lead.value,
        0
      );

      return {
        customer,
        customerLeads,
        latestLead,
        customerJobs,
        completedJobs,
        customerValue,
      };
    })
    .sort(
      (a, b) =>
        new Date(
          b.customer.updatedAt
        ).getTime() -
        new Date(
          a.customer.updatedAt
        ).getTime()
    );

  const repeatCustomers = customerRows.filter(
    (row) => row.customerLeads.length > 1
  ).length;

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#17191c] lg:h-screen lg:overflow-hidden">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center px-5 md:px-8">
          <div>
            <p className="text-sm font-semibold">
              Fieldora
            </p>

            <p className="text-xs text-black/40">
              Customer management
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-5 py-8 md:px-8 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:pt-9 lg:pb-5">
        <div className="flex flex-none flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-black/40">
              CRM
            </p>

            <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
              Customers
            </h1>

            <p className="mt-2 text-sm text-black/45">
              One customer profile across every
              service request, quote, booking, and
              completed job.
            </p>
          </div>

          <div className="flex gap-6">
            <div>
              <p className="text-xs text-black/35">
                Total customers
              </p>

              <p className="mt-1 text-xl font-semibold">
                {customerRows.length}
              </p>
            </div>

            <div className="border-l border-black/[0.07] pl-6">
              <p className="text-xs text-black/35">
                Repeat customers
              </p>

              <p className="mt-1 text-xl font-semibold">
                {repeatCustomers}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          {customerRows.length > 0 ? (
            <div className="overflow-x-auto lg:min-h-0 lg:flex-1 lg:overflow-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-black/[0.055] text-left">
                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Contact
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Latest service
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Requests
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Jobs
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-black/35">
                      Customer value
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {customerRows.map(
                    ({
                      customer,
                      customerLeads,
                      latestLead,
                      customerJobs,
                      completedJobs,
                      customerValue,
                    }) => {
                      const isRepeat =
                        customerLeads.length > 1;

                      return (
                        <tr
                          key={customer.id}
                          className="border-b border-black/[0.045] last:border-0 transition hover:bg-black/[0.015]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef0f2] text-black/45">
                                <UserRound size={16} />
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">
                                    {customer.name}
                                  </p>

                                  {isRepeat && (
                                    <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                                      <RotateCcw size={10} />
                                      Repeat
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-[11px] font-medium text-black/30">
                                  {customer.customerCode}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-1.5 text-sm text-black/45">
                              {customer.email && (
                                <div className="flex items-center gap-2">
                                  <Mail
                                    size={13}
                                    className="text-black/25"
                                  />

                                  {customer.email}
                                </div>
                              )}

                              {customer.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone
                                    size={13}
                                    className="text-black/25"
                                  />

                                  {customer.phone}
                                </div>
                              )}

                              {!customer.email &&
                                !customer.phone && (
                                  <span className="text-black/30">
                                    No contact details
                                  </span>
                                )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {latestLead ? (
                              <div>
                                <div className="flex items-center gap-2 text-sm text-black/55">
                                  <Wrench
                                    size={14}
                                    className="text-black/30"
                                  />

                                  {latestLead.service}
                                </div>

                                <p className="mt-1 text-[11px] text-black/30">
                                  {latestLead.leadCode}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-black/30">
                                No service requests
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <BriefcaseBusiness
                                size={14}
                                className="text-black/25"
                              />

                              <span className="text-sm font-medium">
                                {customerLeads.length}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-medium">
                                {customerJobs.length}
                              </p>

                              <p className="mt-1 text-[11px] text-black/30">
                                {completedJobs} completed
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm font-medium">
                            ${customerValue.toLocaleString()}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-20 text-center">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3f4f5]">
                  <UserRound
                    size={19}
                    className="text-black/35"
                  />
                </div>

                <p className="mt-4 text-sm font-medium">
                  No customers yet
                </p>

                <p className="mt-1 text-xs text-black/40">
                  Customer profiles will appear here
                  as leads enter Fieldora.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}