import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

export async function GET() {
  try {
    const executions = await db.orm.public.AutomationExecution
      .orderBy((execution) => execution.createdAt.desc())
      .all();

    return NextResponse.json(executions);
  } catch (error) {
    console.error("Failed to load automation executions:", error);

    return NextResponse.json(
      { error: "Failed to load automation executions." },
      { status: 500 }
    );
  }
}