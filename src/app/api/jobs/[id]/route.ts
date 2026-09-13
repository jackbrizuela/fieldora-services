import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = Number(id);

    if (!Number.isInteger(jobId) || jobId <= 0) {
      return NextResponse.json(
        { error: "Invalid job ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = String(body.status ?? "").trim();

    if (status !== "Completed") {
      return NextResponse.json(
        { error: "Invalid job status." },
        { status: 400 }
      );
    }

    const job = await db.orm.public.Job
      .where({ id: jobId })
      .first();

    if (!job) {
      return NextResponse.json(
        { error: "Job not found." },
        { status: 404 }
      );
    }

    if (job.status === "Completed") {
      return NextResponse.json(
        { error: "Job is already completed." },
        { status: 409 }
      );
    }

    const completedAt = new Date().toISOString();

    const updatedJob = await db.orm.public.Job
      .where({ id: jobId })
      .update({
        status: "Completed",
        completedAt,
      });

    await db.orm.public.Booking
      .where({ id: job.bookingId })
      .update({
        status: "Completed",
      });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("Failed to complete job:", error);

    return NextResponse.json(
      { error: "Failed to complete job." },
      { status: 500 }
    );
  }
}