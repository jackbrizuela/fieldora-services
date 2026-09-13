import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  FileText,
  Plus,
  Sparkles,
} from "lucide-react";
import { db } from "@/prisma/db";
import AutomationActions from "./automation-actions";
import AutomationStatusAction from "./automation-status-action";

export default async function AutomationsPage() {
  const [automations, executions, quotes] = await Promise.all([
    db.orm.public.Automation
      .orderBy((automation) => automation.createdAt.desc())
      .all(),

    db.orm.public.AutomationExecution
      .orderBy((execution) => execution.createdAt.desc())
      .all(),

    db.orm.public.Quote.all(),
  ]);

  const activeCount = automations.filter(
    (automation) => automation.status === "Active"
  ).length;

  const automationById = new Map(
    automations.map((automation) => [automation.id, automation])
  );

  const quoteById = new Map(
    quotes.map((quote) => [quote.id, quote])
  );

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#17191c] lg:h-screen lg:overflow-hidden">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.07] text-black/50 transition hover:bg-black/[0.03] hover:text-black"
            >
              <ArrowLeft size={16} />
            </Link>

            <div>
              <p className="text-sm font-semibold">Fieldora</p>
              <p className="text-xs text-black/40">
                Workflow automation
              </p>
            </div>
          </div>

          <AutomationActions />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-5 py-8 md:px-8 lg:flex lg:h-full lg:flex-col lg:overflow-hidden lg:pt-9 lg:pb-5">
        <div className="flex flex-none flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-black/40">Operations</p>

            <h1 className="mt-1 text-[30px] font-semibold tracking-[-0.04em]">
              Automations
            </h1>

            <p className="mt-2 text-sm text-black/45">
              Configure workflow rules and monitor scheduled executions.
            </p>
          </div>

          <div className="flex gap-8">
            <div>
              <p className="text-xs text-black/35">Total rules</p>
              <p className="mt-1 text-xl font-semibold">
                {automations.length}
              </p>
            </div>

            <div>
              <p className="text-xs text-black/35">Active</p>
              <p className="mt-1 text-xl font-semibold">
                {activeCount}
              </p>
            </div>

            <div>
              <p className="text-xs text-black/35">Executions</p>
              <p className="mt-1 text-xl font-semibold">
                {executions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] lg:flex lg:min-h-0 lg:flex-col">
            {automations.length > 0 ? (
              <div className="overflow-x-auto lg:min-h-0 lg:flex-1 lg:overflow-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-black/[0.055] text-left">
                      <th className="px-5 py-3 text-xs font-medium text-black/35">
                        Automation
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-black/35">
                        Trigger
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-black/35">
                        Action
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-black/35">
                        Delay
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-black/35">
                        Status
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-black/35">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {automations.map((automation) => (
                      <tr
                        key={automation.id}
                        className="border-b border-black/[0.045] last:border-0 transition hover:bg-black/[0.015]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef0f2] text-black/45">
                              <Sparkles size={16} />
                            </div>

                            <div>
                              <p className="text-sm font-medium">
                                {automation.name}
                              </p>

                              <p className="mt-1 text-[11px] font-medium text-black/30">
                                {automation.automationCode}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-black/55">
                          {automation.triggerEvent}
                        </td>

                        <td className="px-5 py-4 text-sm text-black/55">
                          {automation.actionType}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-black/45">
                            <Clock3 size={14} className="text-black/25" />
                            {automation.delayMinutes === 0
                              ? "Immediately"
                              : `${automation.delayMinutes} min`}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              automation.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : automation.status === "Paused"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-black/[0.035] text-black/45"
                            }`}
                          >
                            {automation.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <AutomationStatusAction
                            automationId={automation.id}
                            status={automation.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3f4f5]">
                    <Sparkles size={19} className="text-black/35" />
                  </div>

                  <p className="mt-4 text-sm font-medium">
                    No automation rules yet
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    Create your first workflow rule to define a trigger and action.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-black/35">
                    <Plus size={13} />
                    Start with a simple rule
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] lg:flex lg:min-h-0 lg:flex-col">
            <div className="flex flex-none items-center justify-between border-b border-black/[0.055] px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                  Execution activity
                </p>

                <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">
                  Workflow runs
                </h2>
              </div>

              <Sparkles size={17} className="text-black/30" />
            </div>

            {executions.length > 0 ? (
              <div className="overflow-x-auto lg:min-h-0 lg:flex-1 lg:overflow-auto">
                <table className="w-full min-w-[950px]">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-black/[0.055] text-left">
                      <th className="px-5 py-3 text-xs font-medium text-black/35">
                        Execution
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-black/35">
                        Automation
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-black/35">
                        Event
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-black/35">
                        Source
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-black/35">
                        Scheduled for
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-black/35">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {executions.map((execution) => {
                      const automation =
                        automationById.get(execution.automationId);

                      const quote =
                        execution.sourceType === "Quote"
                          ? quoteById.get(execution.sourceId)
                          : undefined;

                      const scheduledFor = new Date(
                        execution.scheduledFor
                      ).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      });

                      return (
                        <tr
                          key={execution.id}
                          className="border-b border-black/[0.045] last:border-0 transition hover:bg-black/[0.015]"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium">
                              {execution.executionCode}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm text-black/55">
                              {automation?.name ?? "Unknown automation"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-black/55">
                            {execution.eventType}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-black/45">
                              <FileText size={14} className="text-black/25" />
                              {quote?.quoteCode ??
                                `${execution.sourceType} #${execution.sourceId}`}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-black/45">
                              <Clock3 size={14} className="text-black/25" />
                              {scheduledFor}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                execution.status === "Executed"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : execution.status === "Failed"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {execution.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 py-12 text-center">
                <div>
                  <Clock3 size={19} className="mx-auto text-black/30" />

                  <p className="mt-3 text-sm font-medium">
                    No executions yet
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    Workflow activity will appear here when active rules match business events.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}