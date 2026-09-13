import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

export async function GET() {
  try {
    const quotes = await db.orm.public.Quote
      .orderBy((quote) => quote.createdAt.desc())
      .all();

    return NextResponse.json(quotes);
  } catch (error) {
    console.error("Failed to load quotes:", error);

    return NextResponse.json(
      { error: "Failed to load quotes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const leadId = Number(body.leadId);
    const amount = Number(body.amount);
    const notes = String(body.notes ?? "").trim();

    if (!Number.isInteger(leadId) || leadId <= 0) {
      return NextResponse.json(
        { error: "Invalid lead ID." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        { error: "Invalid quote amount." },
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

    if (
      lead.status !== "Contacted" &&
      lead.status !== "Quote Sent"
    ) {
      return NextResponse.json(
        {
          error:
            "Only contacted leads or leads with an existing quote can receive a quote.",
        },
        { status: 409 }
      );
    }

    const latestQuote = await db.orm.public.Quote
      .orderBy((quote) => quote.id.desc())
      .first();

    const nextNumber = (latestQuote?.id ?? 0) + 1;
    const year = new Date().getFullYear();
    const quoteCode = `FQ-${year}-${String(nextNumber).padStart(4, "0")}`;

    const sentAt = new Date();

    const quote = await db.orm.public.Quote.create({
      quoteCode,
      leadId,
      amount,
      status: "Sent",
      sentAt: sentAt.toISOString(),
      notes: notes || null,
    });

    await db.orm.public.Lead
      .where({ id: leadId })
      .update({
        status: "Quote Sent",
        value: amount,
      });

    try {
      const automations = await db.orm.public.Automation.all();

      const matchingAutomations = automations.filter(
        (automation) =>
          automation.status === "Active" &&
          automation.triggerEvent === "Quote Sent"
      );

      if (matchingAutomations.length > 0) {
        const latestExecution =
          await db.orm.public.AutomationExecution
            .orderBy((execution) => execution.id.desc())
            .first();

        let nextExecutionNumber =
          (latestExecution?.id ?? 0) + 1;

        for (const automation of matchingAutomations) {
          const scheduledFor = new Date(
            sentAt.getTime() +
              automation.delayMinutes * 60 * 1000
          );

          const executionCode = `FE-${year}-${String(
            nextExecutionNumber
          ).padStart(4, "0")}`;

          const execution =
            await db.orm.public.AutomationExecution.create({
              executionCode,
              automationId: automation.id,
              eventType: "Quote Sent",
              sourceType: "Quote",
              sourceId: quote.id,
              status: "Scheduled",
              scheduledFor: scheduledFor.toISOString(),
              executedAt: null,
            });

          nextExecutionNumber += 1;

          if (automation.delayMinutes === 0) {
            try {
              const webhookUrl = process.env.MAKE_WEBHOOK_URL;

              if (!webhookUrl) {
                throw new Error(
                  "MAKE_WEBHOOK_URL is not configured."
                );
              }

              const payload = {
                executionCode: execution.executionCode,
                automationCode: automation.automationCode,
                automationName: automation.name,
                actionType: automation.actionType,
                eventType: execution.eventType,
                sourceType: execution.sourceType,
                sourceId: execution.sourceId,
                quoteCode: quote.quoteCode,
                quoteAmount: quote.amount,
                leadCode: lead.leadCode,
                customerName: lead.name,
                customerEmail: lead.email,
                service: lead.service,
              };

              const response = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
              });

              if (!response.ok) {
                const responseText = await response.text();

                throw new Error(
                  `Make webhook failed with ${response.status}: ${responseText}`
                );
              }

              await db.orm.public.AutomationExecution
                .where({ id: execution.id })
                .update({
                  status: "Executed",
                  executedAt: new Date().toISOString(),
                });
            } catch (executionError) {
              console.error(
                `Immediate automation ${execution.executionCode} failed:`,
                executionError
              );

              await db.orm.public.AutomationExecution
                .where({ id: execution.id })
                .update({
                  status: "Failed",
                  executedAt: null,
                });
            }
          }
        }
      }
    } catch (automationError) {
      console.error(
        "Quote created, but automation processing failed:",
        automationError
      );
    }

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error("Failed to create quote:", error);

    return NextResponse.json(
      { error: "Failed to create quote." },
      { status: 500 }
    );
  }
}