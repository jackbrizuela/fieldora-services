"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Filter,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Upload,
  Users,
  X,
} from "lucide-react";
import { MapForgeImport } from "@/features/mapforge";

type LeadStatus = "New" | "Contacted" | "Quote Sent" | "Booked";

type Lead = {
  id: number;
  leadCode: string;
  customerId?: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  service: string;
  source: string;
  status: LeadStatus;
  value: number;
  possibleCustomer?: PossibleCustomer | null;
  customerMatchReason?: string | null;
  requiresCustomerConfirmation?: boolean;
};

type PossibleCustomer = {
  id: number;
  customerCode: string;
  name: string;
  email: string | null;
  phone: string | null;
};

const statusOptions = ["All", "New", "Contacted", "Quote Sent", "Booked"] as const;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<(typeof statusOptions)[number]>("All");
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [pendingCustomerMatch, setPendingCustomerMatch] = useState<{
    lead: Lead;
    customer: PossibleCustomer;
  } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [source, setSource] = useState("Website");
  const [value, setValue] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLeads() {
      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch("/api/leads", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load leads.");
        }

        const data = (await response.json()) as Lead[];

        if (!cancelled) {
          setLeads(data);
        }
      } catch (error) {
        console.error("Failed to load leads:", error);

        if (!cancelled) {
          setLoadError("Could not load leads from the database.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLeads();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const query = search.toLowerCase();

      const matchesSearch =
        lead.name.toLowerCase().includes(query) ||
        (lead.email ?? "").toLowerCase().includes(query) ||
        lead.service.toLowerCase().includes(query) ||
        lead.leadCode.toLowerCase().includes(query);

      const matchesStatus =
        status === "All" || lead.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, status]);

  const pipelineValue = leads.reduce(
    (total, lead) => total + lead.value,
    0
  );

  function resetLeadForm() {
    setName("");
    setEmail("");
    setPhone("");
    setService("");
    setSource("Website");
    setValue("");
    setFormError("");
    setPendingCustomerMatch(null);
  }

  async function resolveCustomerMatch(
    action: "confirm-existing-customer" | "create-new-customer"
  ) {
    if (!pendingCustomerMatch || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const response = await fetch(
        `/api/leads/${pendingCustomerMatch.lead.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            customerId:
              action === "confirm-existing-customer"
                ? pendingCustomerMatch.customer.id
                : undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to confirm customer."
        );
      }

      setLeads((current) =>
        current.map((lead) =>
          lead.id === pendingCustomerMatch.lead.id
            ? {
                ...lead,
                customerId: data.lead.customerId,
                possibleCustomer: null,
                customerMatchReason: null,
                requiresCustomerConfirmation: false,
              }
            : lead
        )
      );

      resetLeadForm();
      setShowForm(false);
    } catch (error) {
      console.error("Failed to resolve customer match:", error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to confirm customer."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function addLead(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim() || !service.trim() || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          service: service.trim(),
          source,
          value: Number(value) || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create lead."
        );
      }

      const newLead = data.lead as Lead;

      setLeads((current) => [newLead, ...current]);

      if (
        data.requiresCustomerConfirmation &&
        data.possibleCustomer
      ) {
        setPendingCustomerMatch({
          lead: newLead,
          customer: data.possibleCustomer as PossibleCustomer,
        });

        return;
      }

      resetLeadForm();
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create lead:", error);

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create lead."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#17191c] lg:h-screen lg:overflow-hidden">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-5 md:px-8">
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
                Lead management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex h-10 items-center gap-2 rounded-xl border border-black/[0.07] bg-white px-4 text-sm font-medium text-black/60 transition hover:bg-black/[0.025]">
              <Upload size={15} />
              Import with MapForge
            </button>

            <button
              onClick={() => {
                setFormError("");
                setShowForm(true);
              }}
              className="flex h-10 items-center gap-2 rounded-xl bg-[#17191c] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-black"
            >
              <Plus size={16} />
              New lead
            </button>
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
              Leads
            </h1>

            <p className="mt-2 text-sm text-black/45">
              Capture, qualify, and move opportunities toward a booked job.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-10">
            <div className="mr-4">
              <MapForgeImport
                onLeadImported={(lead) =>
                  setLeads((current) => [lead, ...current])
                }
              />
            </div>

            <div className="flex gap-6">
              <div>
                <p className="text-xs text-black/35">
                  Active leads
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {leads.length}
                </p>
              </div>

              <div className="border-l border-black/[0.07] pl-6">
                <p className="text-xs text-black/35">
                  Pipeline value
                </p>

                <p className="mt-1 text-xl font-semibold">
                  ${pipelineValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          <div className="flex flex-none flex-col gap-3 border-b border-black/[0.055] p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-black/[0.07] bg-[#f8f8f8] px-3 py-2.5">
              <Search
                size={16}
                className="text-black/35"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search leads..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-black/30"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter
                size={15}
                className="text-black/35"
              />

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as (
                      typeof statusOptions
                    )[number]
                  )
                }
                className="rounded-xl border border-black/[0.07] bg-white px-3 py-2.5 text-sm text-black/60 outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadError && (
            <div className="flex-none border-b border-black/[0.055] bg-red-50 px-5 py-3 text-sm text-red-700">
              {loadError}
            </div>
          )}

          <div className="overflow-x-auto lg:min-h-0 lg:flex-1 lg:overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-black/[0.055] text-left">
                  <th className="px-5 py-3 text-xs font-medium text-black/35">
                    Lead
                  </th>

                  <th className="px-5 py-3 text-xs font-medium text-black/35">
                    Service
                  </th>

                  <th className="px-5 py-3 text-xs font-medium text-black/35">
                    Source
                  </th>

                  <th className="px-5 py-3 text-xs font-medium text-black/35">
                    Status
                  </th>

                  <th className="px-5 py-3 text-xs font-medium text-black/35">
                    Value
                  </th>

                  <th className="w-12 px-5 py-3" />
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-black/[0.045] last:border-0 transition hover:bg-black/[0.015]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef0f2] text-xs font-semibold text-black/55">
                          {lead.name
                            .split(" ")
                            .map((word) => word[0])
                            .slice(0, 2)
                            .join("")}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/leads/${lead.id}`}
                              className="text-sm font-medium transition hover:text-black/60"
                            >
                              {lead.name}
                            </Link>

                            {lead.requiresCustomerConfirmation &&
                              lead.possibleCustomer && (
                                <button
                                  type="button"
                                  title={
                                    lead.customerMatchReason ||
                                    "Matching customer contact information"
                                  }
                                  onClick={() => {
                                    setPendingCustomerMatch({
                                      lead,
                                      customer: lead.possibleCustomer!,
                                    });
                                    setShowForm(true);
                                  }}
                                  className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 transition hover:bg-amber-100"
                                >
                                  Possible existing customer
                                </button>
                              )}
                          </div>

                          <div className="mt-0.5 text-[10px] font-medium text-black/30">
                            {lead.leadCode}
                          </div>

                          <div className="mt-1 flex gap-3 text-[11px] text-black/35">
                            <span className="flex items-center gap-1">
                              <Mail size={11} />
                              {lead.email ||
                                "No email added"}
                            </span>

                            <span className="flex items-center gap-1">
                              <Phone size={11} />
                              {lead.phone ||
                                "No phone added"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-black/55">
                      {lead.service}
                    </td>

                    <td className="px-5 py-4 text-sm text-black/45">
                      {lead.source}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-black/60">
                        {lead.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium">
                      ${lead.value.toLocaleString()}
                    </td>

                    <td className="px-5 py-4">
                      <button className="text-black/30 transition hover:text-black/70">
                        <MoreHorizontal size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading &&
              filteredLeads.length === 0 && (
                <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3f4f5]">
                    <Users
                      size={18}
                      className="text-black/35"
                    />
                  </div>

                  <p className="mt-3 text-sm font-medium">
                    No leads found
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    Try another search or pipeline status.
                  </p>
                </div>
              )}

            {loading && (
              <div className="flex min-h-[260px] items-center justify-center px-6 py-16 text-center text-sm text-black/40">
                Loading leads...
              </div>
            )}
          </div>
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[2px]">
          <button
            aria-label="Close new lead form"
            onClick={() => {
              setShowForm(false);
              setPendingCustomerMatch(null);
              setFormError("");
            }}
            className="absolute inset-0"
          />

          <div className="relative h-full w-full max-w-[440px] overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                  CRM
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Create new lead
                </h2>
              </div>

              <button
                onClick={() => {
                  setShowForm(false);
                  setPendingCustomerMatch(null);
                  setFormError("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.07] text-black/45 transition hover:bg-black/[0.03]"
              >
                <X size={16} />
              </button>
            </div>

            {pendingCustomerMatch ? (
              <div className="mt-7">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Users size={17} className="text-amber-700" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#17191c]">
                        Possible existing customer
                      </p>

                      <p className="mt-1 text-sm leading-6 text-black/50">
                        {pendingCustomerMatch.lead.customerMatchReason ||
                          "Fieldora found matching customer contact information."} Confirm the customer's identity before linking the records.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-black/[0.06] bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">
                          {pendingCustomerMatch.customer.name}
                        </p>

                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-black/30">
                          {pendingCustomerMatch.customer.customerCode}
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                        Existing customer
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-black/45">
                      <div className="flex items-center gap-2">
                        <Mail size={13} />
                        {pendingCustomerMatch.customer.email ||
                          "No email on file"}
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone size={13} />
                        {pendingCustomerMatch.customer.phone ||
                          "No phone on file"}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-black/45">
                    New lead: <span className="font-medium text-black/65">{pendingCustomerMatch.lead.name}</span>
                  </p>
                </div>

                {formError && (
                  <p className="mt-4 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                    {formError}
                  </p>
                )}

                <div className="mt-5 space-y-3 border-t border-black/[0.06] pt-5">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      void resolveCustomerMatch(
                        "confirm-existing-customer"
                      )
                    }
                    className="w-full rounded-xl bg-[#17191c] py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? "Linking customer..."
                      : "Yes, link to this customer"}
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      void resolveCustomerMatch(
                        "create-new-customer"
                      )
                    }
                    className="w-full rounded-xl border border-black/[0.08] bg-white py-3 text-sm font-medium text-black/65 transition hover:bg-black/[0.025] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    No, create as separate customer
                  </button>
                </div>
              </div>
            ) : (
            <form
              onSubmit={addLead}
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="text-xs font-medium text-black/45">
                  Customer name
                </span>

                <input
                  required
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Robert Walker"
                  className="mt-2 w-full rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-black/45">
                  Email
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="robert@example.com"
                  className="mt-2 w-full rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-black/45">
                  Phone
                </span>

                <input
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="(512) 555-0100"
                  className="mt-2 w-full rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-black/45">
                  Service needed
                </span>

                <input
                  required
                  value={service}
                  onChange={(event) =>
                    setService(event.target.value)
                  }
                  placeholder="e.g. AC repair"
                  className="mt-2 w-full rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-black/45">
                    Lead source
                  </span>

                  <div className="relative mt-2">
                    <select
                      value={source}
                      onChange={(event) =>
                        setSource(event.target.value)
                      }
                      className="w-full appearance-none rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 pr-9 text-sm outline-none"
                    >
                      <option>Website</option>
                      <option>Google</option>
                      <option>Facebook</option>
                      <option>Referral</option>
                      <option>Phone call</option>
                    </select>

                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/35"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-black/45">
                    Estimated value
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(event) =>
                      setValue(event.target.value)
                    }
                    placeholder="2500"
                    className="mt-2 w-full rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none"
                  />
                </label>
              </div>

              {formError && (
                <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="border-t border-black/[0.06] pt-5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17191c] py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} />

                  {submitting
                    ? "Saving lead..."
                    : "Add lead"}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
