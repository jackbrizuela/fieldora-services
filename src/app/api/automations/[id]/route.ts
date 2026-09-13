import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

const allowedStatuses = ["Draft", "Active", "Paused"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const automationId = Number(id);

    if (!Number.isInteger(automationId) || automationId <= 0) {
      return NextResponse.json(
        { error: "Invalid automation ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = String(body.status ?? "").trim();

    if (
      !allowedStatuses.includes(
        status as (typeof allowedStatuses)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Invalid automation status." },
        { status: 400 }
      );
    }

    const existingAutomation =
      await db.orm.public.Automation
        .where({ id: automationId })
        .first();

    if (!existingAutomation) {
      return NextResponse.json(
        { error: "Automation not found." },
        { status: 404 }
      );
    }

    const updatedAutomation =
      await db.orm.public.Automation
        .where({ id: automationId })
        .update({ status });

    return NextResponse.json(updatedAutomation);
  } catch (error) {
    console.error("Failed to update automation:", error);

    return NextResponse.json(
      { error: "Failed to update automation." },
      { status: 500 }
    );
  }
}