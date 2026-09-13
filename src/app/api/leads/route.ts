import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

function normalizeEmail(value: string | null) {
  return value?.trim().toLowerCase() || null;
}

function normalizePhone(value: string | null) {
  const digits = value?.replace(/\D/g, "") || "";
  return digits || null;
}

function findPossibleCustomer(
  lead: {
    customerId?: number | null;
    name: string;
    email: string | null;
    phone: string | null;
  },
  customers: Array<{
    id: number;
    customerCode: string;
    name: string;
    email: string | null;
    phone: string | null;
  }>
) {
  if (lead.customerId) {
    return null;
  }

  const normalizedEmail = normalizeEmail(lead.email);
  const normalizedPhone = normalizePhone(lead.phone);
  const normalizedName = lead.name.trim().toLowerCase();

  for (const customer of customers) {
    const customerEmail = normalizeEmail(customer.email);
    const customerPhone = normalizePhone(customer.phone);
    const customerName = customer.name.trim().toLowerCase();

    const emailMatch =
      normalizedEmail !== null &&
      customerEmail !== null &&
      normalizedEmail === customerEmail;

    const phoneMatch =
      normalizedPhone !== null &&
      customerPhone !== null &&
      normalizedPhone === customerPhone;

    const nameMatch =
      normalizedName.length > 0 &&
      customerName.length > 0 &&
      normalizedName === customerName;

    if (!emailMatch && !phoneMatch) {
      continue;
    }

    let matchReason = "";

    if (emailMatch && phoneMatch) {
      matchReason = "Same phone number and email address";
    } else if (phoneMatch && nameMatch) {
      matchReason = "Same name and phone number";
    } else if (emailMatch && nameMatch) {
      matchReason = "Same name and email address";
    } else if (phoneMatch) {
      matchReason = "Same phone number";
    } else if (emailMatch) {
      matchReason = "Same email address";
    }

    return {
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      matchReason,
    };
  }

  return null;
}

export async function GET() {
  try {
    const leads = await db.orm.public.Lead
      .orderBy((lead) => lead.createdAt.desc())
      .all();

    const customers = await db.orm.public.Customer.all();

    const enrichedLeads = leads.map((lead) => {
      const possibleMatch = findPossibleCustomer(lead, customers);

      return {
        ...lead,
        possibleCustomer: possibleMatch?.customer ?? null,
        customerMatchReason: possibleMatch?.matchReason ?? null,
        requiresCustomerConfirmation: possibleMatch !== null,
      };
    });

    return NextResponse.json(enrichedLeads);
  } catch (error) {
    console.error("Failed to load leads:", error);

    return NextResponse.json(
      { error: "Failed to load leads." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const service = String(body.service ?? "").trim();

    const email = body.email
      ? String(body.email).trim()
      : null;

    const phone = body.phone
      ? String(body.phone).trim()
      : null;

    if (!name || !service) {
      return NextResponse.json(
        { error: "Name and service are required." },
        { status: 400 }
      );
    }

    const latestLead = await db.orm.public.Lead
      .orderBy((lead) => lead.id.desc())
      .first();

    const nextLeadNumber = (latestLead?.id ?? 0) + 1;
    const year = new Date().getFullYear();

    const leadCode = `FD-${year}-${String(
      nextLeadNumber
    ).padStart(4, "0")}`;

    const customers = await db.orm.public.Customer.all();

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    const possibleCustomer =
      customers.find((customer) => {
        const customerEmail = normalizeEmail(customer.email);
        const customerPhone = normalizePhone(customer.phone);

        const emailMatch =
          normalizedEmail !== null &&
          customerEmail !== null &&
          normalizedEmail === customerEmail;

        const phoneMatch =
          normalizedPhone !== null &&
          customerPhone !== null &&
          normalizedPhone === customerPhone;

        return emailMatch || phoneMatch;
      }) ?? null;

    let customerId: number | null = null;

    if (!possibleCustomer) {
      const latestCustomer = await db.orm.public.Customer
        .orderBy((customer) => customer.id.desc())
        .first();

      const nextCustomerNumber =
        (latestCustomer?.id ?? 0) + 1;

      const customerCode = `FC-${year}-${String(
        nextCustomerNumber
      ).padStart(4, "0")}`;

      const customer =
        await db.orm.public.Customer.create({
          customerCode,
          name,
          email,
          phone,
        });

      customerId = customer.id;
    }

    const lead = await db.orm.public.Lead.create({
      leadCode,
      customerId,
      name,
      email,
      phone,
      service,
      source: body.source
        ? String(body.source).trim()
        : "Manual",

      // Every incoming service request begins here.
      status: "New",

      value: Number(body.value) || 0,
      address: body.address
        ? String(body.address).trim()
        : null,
      notes: body.notes
        ? String(body.notes).trim()
        : null,
      followUpAt: null,
    });

    const possibleMatch = possibleCustomer
      ? findPossibleCustomer(lead, customers)
      : null;

    return NextResponse.json(
      {
        lead: {
          ...lead,
          possibleCustomer: possibleMatch?.customer ?? null,
          customerMatchReason: possibleMatch?.matchReason ?? null,
          requiresCustomerConfirmation: possibleMatch !== null,
        },
        possibleCustomer: possibleMatch?.customer ?? null,
        customerMatchReason: possibleMatch?.matchReason ?? null,
        requiresCustomerConfirmation: possibleMatch !== null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create lead:", error);

    return NextResponse.json(
      { error: "Failed to create lead." },
      { status: 500 }
    );
  }
}