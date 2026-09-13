import * as XLSX from "xlsx";

export type MapForgeCellValue = string | number | boolean | null;

export type MapForgeRow = Record<string, MapForgeCellValue>;

export type ParsedSpreadsheet = {
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: MapForgeRow[];
  rowCount: number;
};

function cleanHeader(value: unknown, index: number) {
  const header = String(value ?? "").trim();

  return header || `Column ${index + 1}`;
}

function cleanCell(value: unknown): MapForgeCellValue {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return String(value);
}

export async function parseSpreadsheet(
  file: File
): Promise<ParsedSpreadsheet> {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: false,
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("The spreadsheet does not contain any sheets.");
  }

  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error("The first spreadsheet sheet could not be read.");
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (matrix.length === 0) {
    throw new Error("The spreadsheet is empty.");
  }

  const firstRow = matrix[0] ?? [];
  const headers = firstRow.map((value, index) =>
    cleanHeader(value, index)
  );

  if (headers.length === 0) {
    throw new Error("No spreadsheet columns were found.");
  }

  const rows: MapForgeRow[] = matrix
    .slice(1)
    .filter((row) =>
      row.some((value) => String(value ?? "").trim() !== "")
    )
    .map((row) => {
      const record: MapForgeRow = {};

      headers.forEach((header, index) => {
        record[header] = cleanCell(row[index]);
      });

      return record;
    });

  return {
    fileName: file.name,
    sheetName,
    headers,
    rows,
    rowCount: rows.length,
  };
}