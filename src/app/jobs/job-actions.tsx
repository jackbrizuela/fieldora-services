"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

type JobActionsProps = {
  jobId: number;
  status: string;
};

export default function JobActions({
  jobId,
  status,
}: JobActionsProps) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");

  async function completeJob() {
    if (completing || status === "Completed") {
      return;
    }

    try {
      setCompleting(true);
      setError("");

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Completed",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete job.");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to complete job:", error);

      setError(
        error instanceof Error ? error.message : "Failed to complete job."
      );
    } finally {
      setCompleting(false);
    }
  }

  if (status === "Completed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 size={14} />
        Completed
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={completeJob}
        disabled={completing}
        className="inline-flex items-center gap-2 rounded-xl bg-[#17191c] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CheckCircle2 size={14} />
        {completing ? "Completing..." : "Complete job"}
      </button>

      {error && (
        <p className="mt-2 max-w-[170px] text-xs leading-4 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}