"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, FileText, X } from "lucide-react";

type LeadStatus = "New" | "Contacted" | "Quote Sent" | "Booked";

type LeadActionsProps = {
  leadId: number;
  status: LeadStatus;
};

const actionLabel: Record<LeadStatus, string> = {
  New: "Mark as contacted",
  Contacted: "Send quote",
  "Quote Sent": "Revise quote",
  Booked: "Job booked",
};

export default function LeadActions({
  leadId,
  status,
}: LeadActionsProps) {
  const router = useRouter();

  const [updating, setUpdating] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [error, setError] = useState("");

  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");

  const [scheduledAt, setScheduledAt] = useState("");
  const [address, setAddress] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");

  async function advanceLead() {
    if (updating || status === "Booked") {
      return;
    }

    if (status === "Contacted") {
      setError("");
      setShowQuote(true);
      return;
    }

    if (status === "Quote Sent") {
      setError("");
      setShowQuote(true);
      return;
    }

    if (status !== "New") {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Contacted",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update lead.");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to update lead:", error);

      setError(
        error instanceof Error ? error.message : "Failed to update lead."
      );
    } finally {
      setUpdating(false);
    }
  }

  async function createQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(quoteAmount);

    if (!Number.isFinite(amount) || amount < 0 || updating) {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId,
          amount,
          notes: quoteNotes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create quote.");
      }

      setShowQuote(false);
      setQuoteAmount("");
      setQuoteNotes("");

      router.refresh();
    } catch (error) {
      console.error("Failed to create quote:", error);

      setError(
        error instanceof Error ? error.message : "Failed to create quote."
      );
    } finally {
      setUpdating(false);
    }
  }

  async function createBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!scheduledAt || !address.trim() || updating) {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId,
          scheduledAt: new Date(scheduledAt).toISOString(),
          address: address.trim(),
          notes: bookingNotes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking.");
      }

      setShowBooking(false);
      setScheduledAt("");
      setAddress("");
      setBookingNotes("");

      router.refresh();
    } catch (error) {
      console.error("Failed to create booking:", error);

      setError(
        error instanceof Error ? error.message : "Failed to create booking."
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <div>
        {status === "Quote Sent" ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowQuote(true);
              }}
              disabled={updating}
              className="rounded-xl border border-black/[0.08] bg-white py-3 text-sm font-medium text-black transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Revise quote
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowBooking(true);
              }}
              disabled={updating}
              className="rounded-xl bg-[#17191c] py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Book job
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={advanceLead}
            disabled={status === "Booked" || updating}
            className="w-full rounded-xl bg-[#17191c] py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating ? "Updating..." : actionLabel[status]}
          </button>
        )}

        {error && !showQuote && !showBooking && (
          <p className="mt-3 text-xs leading-5 text-red-600">
            {error}
          </p>
        )}
      </div>

      {showQuote && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="Close quote form"
            onClick={() => {
              if (!updating) {
                setShowQuote(false);
                setError("");
              }
            }}
            className="absolute inset-0"
          />

          <div className="relative h-full w-full max-w-[440px] overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                  Sales
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {status === "Quote Sent" ? "Revise quote" : "Send quote"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/45">
                  {status === "Quote Sent"
                    ? "Create a revised quote while preserving the customer's previous quote history."
                    : "Confirm the quoted amount and add any customer-facing notes."}
                </p>
              </div>

              <button
                type="button"
                disabled={updating}
                onClick={() => {
                  setShowQuote(false);
                  setError("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.07] text-black/45 transition hover:bg-black/[0.03] disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={createQuote} className="mt-7 space-y-5">
              <label className="block">
                <span className="flex items-center gap-2 text-xs font-medium text-black/45">
                  <FileText size={14} />
                  Quote amount
                </span>

                <input
                  required
                  min="0"
                  step="1"
                  type="number"
                  value={quoteAmount}
                  onChange={(event) => setQuoteAmount(event.target.value)}
                  placeholder="8500"
                  className="mt-2 w-full rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-black/45">
                  Quote notes
                </span>

                <textarea
                  rows={4}
                  value={quoteNotes}
                  onChange={(event) => setQuoteNotes(event.target.value)}
                  placeholder="Scope, pricing details, or customer notes..."
                  className="mt-2 w-full resize-none rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                />
              </label>

              {error && (
                <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="border-t border-black/[0.06] pt-5">
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full rounded-xl bg-[#17191c] py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating
                    ? "Creating quote..."
                    : status === "Quote Sent"
                      ? "Send revised quote"
                      : "Send quote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBooking && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="Close booking form"
            onClick={() => {
              if (!updating) {
                setShowBooking(false);
                setError("");
              }
            }}
            className="absolute inset-0"
          />

          <div className="relative h-full w-full max-w-[440px] overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                  Scheduling
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Book service
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/45">
                  Confirm when and where this service will take place.
                </p>
              </div>

              <button
                type="button"
                disabled={updating}
                onClick={() => {
                  setShowBooking(false);
                  setError("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.07] text-black/45 transition hover:bg-black/[0.03] disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={createBooking} className="mt-7 space-y-5">
              <label className="block">
                <span className="flex items-center gap-2 text-xs font-medium text-black/45">
                  <CalendarDays size={14} />
                  Service date and time
                </span>

                <input
                  required
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-black/45">
                  Service address
                </span>

                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Enter the full service address"
                  className="mt-2 w-full resize-none rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-black/45">
                  Booking notes
                </span>

                <textarea
                  rows={4}
                  value={bookingNotes}
                  onChange={(event) => setBookingNotes(event.target.value)}
                  placeholder="Access instructions, customer requests, or other notes..."
                  className="mt-2 w-full resize-none rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                />
              </label>

              {error && (
                <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="border-t border-black/[0.06] pt-5">
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full rounded-xl bg-[#17191c] py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating ? "Creating booking..." : "Confirm booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}