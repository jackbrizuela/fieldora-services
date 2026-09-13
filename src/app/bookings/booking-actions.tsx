"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

type BookingActionsProps = {
  bookingId: number;
  status: string;
};

export default function BookingActions({
  bookingId,
  status,
}: BookingActionsProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function startJob() {
    if (starting || status !== "Scheduled") {
      return;
    }

    try {
      setStarting(true);
      setError("");

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start job.");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to start job:", error);

      setError(
        error instanceof Error ? error.message : "Failed to start job."
      );
    } finally {
      setStarting(false);
    }
  }

  if (status !== "Scheduled") {
    return (
      <span className="text-xs font-medium text-black/35">
        Job started
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={startJob}
        disabled={starting}
        className="inline-flex items-center gap-2 rounded-xl bg-[#17191c] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Play size={13} fill="currentColor" />
        {starting ? "Starting..." : "Start job"}
      </button>

      {error && (
        <p className="mt-2 max-w-[160px] text-xs leading-4 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}