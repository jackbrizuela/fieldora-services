"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play } from "lucide-react";

type AutomationStatusActionProps = {
  automationId: number;
  status: string;
};

export default function AutomationStatusAction({
  automationId,
  status,
}: AutomationStatusActionProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const targetStatus = status === "Active" ? "Paused" : "Active";
  const isActive = status === "Active";

  async function updateStatus() {
    if (updating) {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const response = await fetch(`/api/automations/${automationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: targetStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update automation."
        );
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to update automation:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update automation."
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={updateStatus}
        disabled={updating}
        className="inline-flex items-center gap-2 rounded-xl border border-black/[0.07] bg-white px-3.5 py-2 text-xs font-medium text-black/65 transition hover:bg-black/[0.025] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isActive ? <Pause size={13} /> : <Play size={13} />}
        {updating
          ? "Updating..."
          : isActive
            ? "Pause"
            : "Activate"}
      </button>

      {error && (
        <p className="mt-2 max-w-[170px] text-xs leading-4 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}