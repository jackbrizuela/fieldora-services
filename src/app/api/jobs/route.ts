import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

export async function GET() {
  try {
    const jobs = await db.orm.public.Job
      .orderBy((job) => job.createdAt.desc())
      .all();

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Failed to load jobs:", error);

    return NextResponse.json(
      { error: "Failed to load jobs." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingId = Number(body.bookingId);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { error: "Invalid booking ID." },
        { status: 400 }
      );
    }

    const booking = await db.orm.public.Booking
      .where({ id: bookingId })
      .first();

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    const existingJob = await db.orm.public.Job
      .where({ bookingId })
      .first();

    if (existingJob) {
      return NextResponse.json(
        { error: "This booking already has a job." },
        { status: 409 }
      );
    }

    const latestJob = await db.orm.public.Job
      .orderBy((job) => job.id.desc())
      .first();

    const nextNumber = (latestJob?.id ?? 0) + 1;
    const year = new Date().getFullYear();
    const jobCode = `FJ-${year}-${String(nextNumber).padStart(4, "0")}`;

    const job = await db.orm.public.Job.create({
      jobCode,
      bookingId,
      status: "In Progress",
      startedAt: new Date().toISOString(),
      completedAt: null,
      notes: null,
    });

    await db.orm.public.Booking
      .where({ id: bookingId })
      .update({
        status: "In Progress",
      });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Failed to create job:", error);

    return NextResponse.json(
      { error: "Failed to create job." },
      { status: 500 }
    );
  }
}