export type FieldoraLeadField =
  | "name"
  | "email"
  | "phone"
  | "service"
  | "source"
  | "status"
  | "value"
  | "address"
  | "notes";

export type MappingConfidence = "high" | "medium" | "unmapped";

export type MapForgeFieldSuggestion = {
  sourceHeader: string;
  targetField: FieldoraLeadField | null;
  confidence: MappingConfidence;
};

const aliases: Record<FieldoraLeadField, string[]> = {
  name: [
    "name",
    "customer",
    "customer name",
    "client",
    "client name",
    "full name",
    "lead",
    "lead name",
    "contact name",
  ],

  email: [
    "email",
    "email address",
    "e mail",
    "e-mail",
    "customer email",
    "client email",
  ],

  phone: [
    "phone",
    "phone number",
    "mobile",
    "mobile number",
    "mobile no",
    "contact number",
    "contact no",
    "telephone",
    "tel",
  ],

  service: [
    "service",
    "service type",
    "job type",
    "job",
    "requested service",
    "service requested",
    "work type",
  ],

  source: [
    "source",
    "lead source",
    "channel",
    "origin",
    "acquisition source",
  ],

  status: [
    "status",
    "lead status",
    "stage",
    "pipeline stage",
  ],

  value: [
    "value",
    "estimated value",
    "estimate",
    "amount",
    "budget",
    "price",
    "quote amount",
    "estimated amount",
    "job value",
  ],

  address: [
    "address",
    "customer address",
    "service address",
    "location",
    "site address",
  ],

  notes: [
    "notes",
    "note",
    "comments",
    "comment",
    "remarks",
    "description",
    "details",
  ],
};

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function suggestFieldMapping(
  headers: string[]
): MapForgeFieldSuggestion[] {
  const alreadyUsed = new Set<FieldoraLeadField>();

  return headers.map((header) => {
    const normalized = normalizeHeader(header);

    let exactMatch: FieldoraLeadField | null = null;

    for (const [field, fieldAliases] of Object.entries(aliases) as [
      FieldoraLeadField,
      string[],
    ][]) {
      if (
        !alreadyUsed.has(field) &&
        fieldAliases.some(
          (alias) => normalizeHeader(alias) === normalized
        )
      ) {
        exactMatch = field;
        break;
      }
    }

    if (exactMatch) {
      alreadyUsed.add(exactMatch);

      return {
        sourceHeader: header,
        targetField: exactMatch,
        confidence: "high" as const,
      };
    }

    let partialMatch: FieldoraLeadField | null = null;

    for (const [field, fieldAliases] of Object.entries(aliases) as [
      FieldoraLeadField,
      string[],
    ][]) {
      if (alreadyUsed.has(field)) {
        continue;
      }

      const matched = fieldAliases.some((alias) => {
        const normalizedAlias = normalizeHeader(alias);

        return (
          normalized.includes(normalizedAlias) ||
          normalizedAlias.includes(normalized)
        );
      });

      if (matched) {
        partialMatch = field;
        break;
      }
    }

    if (partialMatch) {
      alreadyUsed.add(partialMatch);

      return {
        sourceHeader: header,
        targetField: partialMatch,
        confidence: "medium" as const,
      };
    }

    return {
      sourceHeader: header,
      targetField: null,
      confidence: "unmapped" as const,
    };
  });
}

export const fieldoraLeadFields: {
  value: FieldoraLeadField;
  label: string;
  required?: boolean;
}[] = [
  { value: "name", label: "Customer name", required: true },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "service", label: "Service", required: true },
  { value: "source", label: "Lead source" },
  { value: "status", label: "Status" },
  { value: "value", label: "Estimated value" },
  { value: "address", label: "Address" },
  { value: "notes", label: "Notes" },
];