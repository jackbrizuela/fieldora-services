import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

export async function GET() {
  try {
    const bookings = await db.orm.public.Booking
      .orderBy((booking) => booking.createdAt.desc())
      .all();

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Failed to load bookings:", error);

    return NextResponse.json(
      { error: "Failed to load bookings." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const leadId = Number(body.leadId);
    const scheduledAt = String(body.scheduledAt ?? "").trim();
    const address = String(body.address ?? "").trim();
    const notes = String(body.notes ?? "").trim();

    if (!Number.isInteger(leadId) || leadId <= 0) {
      return NextResponse.json(
        { error: "Invalid lead ID." },
        { status: 400 }
      );
    }

    if (!scheduledAt || !address) {
      return NextResponse.json(
        { error: "Schedule and address are required." },
        { status: 400 }
      );
    }

    const lead = await db.orm.public.Lead
      .where({ id: leadId })
      .first();

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found." },
        { status: 404 }
      );
    }

    if (lead.status !== "Quote Sent") {
      return NextResponse.json(
        { error: "Only leads with a sent quote can be booked." },
        { status: 409 }
      );
    }

    const existingBooking = await db.orm.public.Booking
      .where({ leadId })
      .first();

    if (existingBooking) {
      return NextResponse.json(
        { error: "This lead already has a booking." },
        { status: 409 }
      );
    }

    const latestBooking = await db.orm.public.Booking
      .orderBy((booking) => booking.id.desc())
      .first();

    const nextNumber = (latestBooking?.id ?? 0) + 1;
    const year = new Date().getFullYear();
    const bookingCode = `FB-${year}-${String(nextNumber).padStart(4, "0")}`;

    const booking = await db.orm.public.Booking.create({
      bookingCode,
      leadId,
      scheduledAt,
      address,
      status: "Scheduled",
      notes: notes || null,
    });

    await db.orm.public.Lead
      .where({ id: leadId })
      .update({
        status: "Booked",
        address,
      });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Failed to create booking:", error);

    return NextResponse.json(
      { error: "Failed to create booking." },
      { status: 500 }
    );
  }
}