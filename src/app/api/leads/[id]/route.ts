import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

const allowedStatuses = [
  "New",
  "Contacted",
  "Quote Sent",
  "Booked",
] as const;

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;
    const leadId = Number(id);

    if (!Number.isInteger(leadId) || leadId <= 0) {
      return NextResponse.json(
        { error: "Invalid lead ID." },
        { status: 400 }
      );
    }

    const existingLead = await db.orm.public.Lead
      .where({ id: leadId })
      .first();

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const action = String(body.action ?? "").trim();

    if (action === "confirm-existing-customer") {
      const customerId = Number(body.customerId);

      if (!Number.isInteger(customerId) || customerId <= 0) {
        return NextResponse.json(
          { error: "Invalid customer ID." },
          { status: 400 }
        );
      }

      const customer = await db.orm.public.Customer
        .where({ id: customerId })
        .first();

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found." },
          { status: 404 }
        );
      }

      const updatedLead = await db.orm.public.Lead
        .where({ id: leadId })
        .update({
          customerId,
        });

      return NextResponse.json({
        lead: updatedLead,
        customer,
      });
    }

    if (action === "create-new-customer") {
      if (existingLead.customerId) {
        return NextResponse.json(
          { error: "This lead is already linked to a customer." },
          { status: 409 }
        );
      }

      const latestCustomer = await db.orm.public.Customer
        .orderBy((customer) => customer.id.desc())
        .first();

      const nextCustomerNumber =
        (latestCustomer?.id ?? 0) + 1;

      const year = new Date().getFullYear();

      const customerCode = `FC-${year}-${String(
        nextCustomerNumber
      ).padStart(4, "0")}`;

      const customer = await db.orm.public.Customer.create({
        customerCode,
        name: existingLead.name,
        email: existingLead.email,
        phone: existingLead.phone,
      });

      const updatedLead = await db.orm.public.Lead
        .where({ id: leadId })
        .update({
          customerId: customer.id,
        });

      return NextResponse.json({
        lead: updatedLead,
        customer,
      });
    }

    const status = String(body.status ?? "").trim();

    if (
      !allowedStatuses.includes(
        status as (typeof allowedStatuses)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Invalid lead status." },
        { status: 400 }
      );
    }

    const updatedLead = await db.orm.public.Lead
      .where({ id: leadId })
      .update({
        status,
      });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Failed to update lead:", error);

    return NextResponse.json(
      { error: "Failed to update lead." },
      { status: 500 }
    );
  }
}