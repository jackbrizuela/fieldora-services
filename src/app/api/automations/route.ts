import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

export async function GET() {
  try {
    const automations = await db.orm.public.Automation
      .orderBy((automation) => automation.createdAt.desc())
      .all();

    return NextResponse.json(automations);
  } catch (error) {
    console.error("Failed to load automations:", error);

    return NextResponse.json(
      { error: "Failed to load automations." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const triggerEvent = String(body.triggerEvent ?? "").trim();
    const actionType = String(body.actionType ?? "").trim();
    const delayMinutes = Number(body.delayMinutes ?? 0);

    if (!name || !triggerEvent || !actionType) {
      return NextResponse.json(
        { error: "Name, trigger event, and action type are required." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(delayMinutes) ||
      delayMinutes < 0
    ) {
      return NextResponse.json(
        { error: "Delay must be a non-negative whole number." },
        { status: 400 }
      );
    }

    const latestAutomation = await db.orm.public.Automation
      .orderBy((automation) => automation.id.desc())
      .first();

    const nextNumber = (latestAutomation?.id ?? 0) + 1;
    const year = new Date().getFullYear();
    const automationCode = `FA-${year}-${String(nextNumber).padStart(4, "0")}`;

    const automation = await db.orm.public.Automation.create({
      automationCode,
      name,
      triggerEvent,
      actionType,
      delayMinutes,
      status: "Draft",
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error("Failed to create automation:", error);

    return NextResponse.json(
      { error: "Failed to create automation." },
      { status: 500 }
    );
  }
}