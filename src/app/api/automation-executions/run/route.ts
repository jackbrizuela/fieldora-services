import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

export async function POST() {
  try {
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "MAKE_WEBHOOK_URL is not configured." },
        { status: 500 }
      );
    }

    const executions = await db.orm.public.AutomationExecution
      .orderBy((execution) => execution.createdAt.asc())
      .all();

    const now = new Date();

    const dueExecutions = executions.filter(
      (execution) =>
        execution.status === "Scheduled" &&
        new Date(execution.scheduledFor).getTime() <= now.getTime()
    );

    const completedExecutions = [];
    const failedExecutions = [];

    for (const execution of dueExecutions) {
      try {
        const automation = await db.orm.public.Automation
          .where({ id: execution.automationId })
          .first();

        if (!automation) {
          throw new Error(
            `Automation ${execution.automationId} was not found.`
          );
        }

        if (execution.sourceType !== "Quote") {
          throw new Error(
            `Unsupported automation source type: ${execution.sourceType}`
          );
        }

        const quote = await db.orm.public.Quote
          .where({ id: execution.sourceId })
          .first();

        if (!quote) {
          throw new Error(
            `Quote ${execution.sourceId} was not found.`
          );
        }

        const lead = await db.orm.public.Lead
          .where({ id: quote.leadId })
          .first();

        if (!lead) {
          throw new Error(
            `Lead ${quote.leadId} was not found.`
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

        const executedAt = new Date().toISOString();

        const updatedExecution =
          await db.orm.public.AutomationExecution
            .where({ id: execution.id })
            .update({
              status: "Executed",
              executedAt,
            });

        completedExecutions.push(updatedExecution);
      } catch (executionError) {
        console.error(
          `Automation execution ${execution.executionCode} failed:`,
          executionError
        );

        const failedExecution =
          await db.orm.public.AutomationExecution
            .where({ id: execution.id })
            .update({
              status: "Failed",
              executedAt: null,
            });

        failedExecutions.push(failedExecution);
      }
    }

    return NextResponse.json({
      checked: executions.length,
      due: dueExecutions.length,
      executed: completedExecutions.length,
      failed: failedExecutions.length,
      executions: completedExecutions,
      failures: failedExecutions,
    });
  } catch (error) {
    console.error("Failed to run automation executions:", error);

    return NextResponse.json(
      { error: "Failed to run automation executions." },
      { status: 500 }
    );
  }
}