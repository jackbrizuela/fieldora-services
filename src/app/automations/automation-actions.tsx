"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, X } from "lucide-react";

export default function AutomationActions() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("Quote Sent");
  const [actionType, setActionType] = useState("Send Reminder");
  const [delayMinutes, setDelayMinutes] = useState("1440");

  async function createAutomation(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const delay = Number(delayMinutes);

    if (
      !name.trim() ||
      !triggerEvent.trim() ||
      !actionType.trim() ||
      !Number.isInteger(delay) ||
      delay < 0 ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/automations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          triggerEvent,
          actionType,
          delayMinutes: delay,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create automation."
        );
      }

      setOpen(false);
      setName("");
      setTriggerEvent("Quote Sent");
      setActionType("Send Reminder");
      setDelayMinutes("1440");

      router.refresh();
    } catch (error) {
      console.error("Failed to create automation:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create automation."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#17191c] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-black"
      >
        <Plus size={16} />
        New automation
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="Close automation form"
            onClick={() => {
              if (!saving) {
                setOpen(false);
                setError("");
              }
            }}
            className="absolute inset-0"
          />

          <div className="relative h-full w-full max-w-[440px] overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                  Workflow
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  New automation
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/45">
                  Define when this rule should trigger and what action it
                  should eventually perform.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setOpen(false);
                  setError("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.07] text-black/45 transition hover:bg-black/[0.03] disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={createAutomation}
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="flex items-center gap-2 text-xs font-medium text-black/45">
                  <Sparkles size={14} />
                  Automation name
                </span>

                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Quote reminder"
                  className="mt-2 w-full rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-black/45">
                  Trigger event
                </span>

                <select
                  value={triggerEvent}
                  onChange={(event) =>
                    setTriggerEvent(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                >
                  <option value="Lead Created">
                    Lead Created
                  </option>
                  <option value="Quote Sent">
                    Quote Sent
                  </option>
                  <option value="Booking Created">
                    Booking Created
                  </option>
                  <option value="Job Started">
                    Job Started
                  </option>
                  <option value="Job Completed">
                    Job Completed
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-black/45">
                  Action type
                </span>

                <select
                  value={actionType}
                  onChange={(event) =>
                    setActionType(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                >
                  <option value="Send Reminder">
                    Send Reminder
                  </option>
                  <option value="Send Confirmation">
                    Send Confirmation
                  </option>
                  <option value="Send Follow-up">
                    Send Follow-up
                  </option>
                  <option value="Request Review">
                    Request Review
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-black/45">
                  Delay in minutes
                </span>

                <input
                  required
                  min="0"
                  step="1"
                  type="number"
                  value={delayMinutes}
                  onChange={(event) =>
                    setDelayMinutes(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-black/[0.08] px-3.5 py-3 text-sm outline-none transition focus:border-black/20"
                />

                <p className="mt-2 text-xs leading-5 text-black/35">
                  Use 0 to run immediately. 1440 minutes = 24 hours.
                </p>
              </label>

              {error && (
                <p className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="border-t border-black/[0.06] pt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-[#17191c] py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Creating automation..."
                    : "Create automation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}