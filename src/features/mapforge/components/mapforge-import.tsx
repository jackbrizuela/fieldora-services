"use client";

import {
  Check,
  FileSpreadsheet,
  FolderOpen,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  parseSpreadsheet,
  type ParsedSpreadsheet,
} from "../lib/parse-spreadsheet";
import {
  fieldoraLeadFields,
  suggestFieldMapping,
  type MapForgeFieldSuggestion,
} from "../lib/field-mapper";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx"];

function isSupportedFile(file: File) {
  const name = file.name.toLowerCase();

  return ACCEPTED_EXTENSIONS.some((extension) =>
    name.endsWith(extension)
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFieldLabel(targetField: string | null) {
  if (!targetField) {
    return null;
  }

  return (
    fieldoraLeadFields.find((field) => field.value === targetField)?.label ??
    targetField
  );
}

type MapForgeImportedLead = {
  id: number;
  leadCode: string;
  customerId?: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  service: string;
  source: string;
  status: "New" | "Contacted" | "Quote Sent" | "Booked";
  value: number;
};

export default function MapForgeImport({
  onLeadImported,
}: {
  onLeadImported?: (lead: MapForgeImportedLead) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedSpreadsheet, setParsedSpreadsheet] =
    useState<ParsedSpreadsheet | null>(null);
  const [mappings, setMappings] = useState<MapForgeFieldSuggestion[]>([]);
  const [reviewStarted, setReviewStarted] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [importError, setImportError] = useState("");
  const [importComplete, setImportComplete] = useState(false);

  async function selectFile(file: File) {
    if (!isSupportedFile(file)) {
      setSelectedFile(null);
      setParsedSpreadsheet(null);
      setMappings([]);
      setReviewStarted(false);
      setFileError(
        "Unsupported file type. Please use a CSV or XLSX spreadsheet."
      );
      return;
    }

    setSelectedFile(file);
    setFileError("");
    setParsedSpreadsheet(null);
    setMappings([]);
    setReviewStarted(false);
    setShowAllRecords(false);
    setParsing(true);

    try {
      const parsed = await parseSpreadsheet(file);
      const suggestions = suggestFieldMapping(parsed.headers);

      setParsedSpreadsheet(parsed);
      setMappings(suggestions);
    } catch (error) {
      setSelectedFile(null);
      setParsedSpreadsheet(null);
      setMappings([]);

      setFileError(
        error instanceof Error
          ? error.message
          : "MapForge could not read this spreadsheet."
      );
    } finally {
      setParsing(false);
    }
  }

  function removeFile() {
    setSelectedFile(null);
    setParsedSpreadsheet(null);
    setMappings([]);
    setReviewStarted(false);
    setShowAllRecords(false);
    setFileError("");
  }

  function closeDrawer() {
    if (importing) {
      return;
    }

    setOpen(false);
    setDragging(false);
  }

  function finishAndClose() {
    if (importing) {
      return;
    }

    setOpen(false);
    setDragging(false);
    setSelectedFile(null);
    setFileError("");
    setParsedSpreadsheet(null);
    setMappings([]);
    setReviewStarted(false);
    setShowAllRecords(false);
    setImportError("");
    setImportComplete(false);
    setImportedCount(0);
  }

  function getMappedValue(
    row: Record<string, string | number | boolean | null>,
    targetField: string
  ) {
    const mapping = mappings.find(
      (item) => item.targetField === targetField
    );

    if (!mapping) {
      return null;
    }

    return row[mapping.sourceHeader] ?? null;
  }

  async function importLeads() {
    if (!parsedSpreadsheet || importing) {
      return;
    }

    try {
      setImporting(true);
      setImportError("");
      setImportComplete(false);
      setImportedCount(0);

      for (let index = 0; index < parsedSpreadsheet.rows.length; index++) {
        const row = parsedSpreadsheet.rows[index];

        const payload = {
          name: String(getMappedValue(row, "name") ?? "").trim(),
          email: String(getMappedValue(row, "email") ?? "").trim() || null,
          phone: String(getMappedValue(row, "phone") ?? "").trim() || null,
          service: String(getMappedValue(row, "service") ?? "").trim(),
          source:
            String(getMappedValue(row, "source") ?? "").trim() || "Import",
          status: "New",
          value: Number(getMappedValue(row, "value")) || 0,
          address:
            String(getMappedValue(row, "address") ?? "").trim() || null,
          notes:
            String(getMappedValue(row, "notes") ?? "").trim() || null,
        };

        const response = await fetch("/api/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              `Import failed at record ${index + 1}.`
          );
        }

        if (result?.lead) {
          onLeadImported?.(result.lead as MapForgeImportedLead);
        }

        setImportedCount(index + 1);
      }

      setImportComplete(true);
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "MapForge import failed."
      );
    } finally {
      setImporting(false);
    }
  }

  const mappedFields = mappings.filter(
    (mapping) => mapping.targetField !== null
  );

  const ignoredFields = mappings.filter(
    (mapping) => mapping.targetField === null
  );

  const requiredReady = ["name", "service"].every((requiredField) =>
    mappings.some((mapping) => mapping.targetField === requiredField)
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/[0.07] bg-white px-4 text-sm font-medium text-black/65 shadow-sm transition hover:bg-black/[0.025] hover:text-black"
      >
        <Sparkles size={15} />
        Import leads with MapForge
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/20 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label={
              importing
                ? "MapForge import in progress"
                : "Close MapForge"
            }
            onClick={closeDrawer}
            disabled={importing}
            className="absolute inset-0 disabled:cursor-wait"
          />

          <div className="relative h-full w-full max-w-[560px] overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-black/[0.06] bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#17191c] text-white">
                    <Sparkles size={15} />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                      Nuffdev
                    </p>

                    <h2 className="text-xl font-semibold tracking-[-0.025em]">
                      MapForge
                    </h2>
                  </div>
                </div>

                <p className="mt-3 max-w-md text-sm leading-6 text-black/50">
                  Import existing lead data into Fieldora without rebuilding
                  your spreadsheet first.
                </p>
              </div>

              <button
                type="button"
                aria-label={
                  importing
                    ? "MapForge import in progress"
                    : "Close MapForge"
                }
                onClick={closeDrawer}
                disabled={importing}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.07] text-black/45 transition hover:bg-black/[0.03] disabled:cursor-wait disabled:opacity-30"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <section>
                <div
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setDragging(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);

                    const file = event.dataTransfer.files?.[0];

                    if (file) {
                      void selectFile(file);
                    }
                  }}
                  className={`rounded-2xl border border-dashed p-7 text-center transition ${
                    dragging
                      ? "border-black/30 bg-black/[0.025]"
                      : "border-black/[0.12] bg-[#fafafa]"
                  }`}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black/50 shadow-sm ring-1 ring-black/[0.06]">
                    <UploadCloud size={21} />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold">
                    Drag and drop your spreadsheet here
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-black/40">
                    Or locate a file from your computer.
                  </p>

                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#17191c] px-4 text-sm font-medium text-white transition hover:bg-black"
                  >
                    <FolderOpen size={15} />
                    Locate spreadsheet
                  </button>

                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,.xlsx"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        void selectFile(file);
                      }

                      event.target.value = "";
                    }}
                  />
                </div>

                {fileError && (
                  <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                    {fileError}
                  </p>
                )}

                {selectedFile && (
                  <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-black/[0.06] bg-white p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4f5f6] text-black/50">
                        <FileSpreadsheet size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {selectedFile.name}
                        </p>

                        <p className="mt-0.5 text-xs text-black/35">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-xs font-medium text-black/40 transition hover:text-black"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </section>

              {!parsedSpreadsheet && (
                <>
                  <section className="rounded-2xl border border-black/[0.06] bg-[#f8f9fa] p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                      Format guide
                    </p>

                    <h3 className="mt-2 text-sm font-semibold">
                      Supported spreadsheet formats
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-black/50">
                      MapForge accepts CSV (.csv) and Excel workbook (.xlsx)
                      files.
                    </p>

                    <p className="mt-3 text-sm leading-6 text-black/50">
                      Files from Google Sheets, Apple Numbers, LibreOffice, or
                      another spreadsheet app can be exported as CSV or XLSX.
                    </p>
                  </section>

                  <section className="rounded-2xl border border-black/[0.06] bg-white p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <ShieldCheck size={17} />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold">
                          Review before import
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-black/50">
                          MapForge reads your spreadsheet and prepares the data
                          for review before anything is added to Fieldora.
                        </p>

                        <p className="mt-3 text-sm font-medium leading-6 text-black/65">
                          Nothing is written to the CRM until you confirm.
                        </p>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {parsing && (
                <div className="rounded-2xl border border-black/[0.06] bg-[#fafafa] p-6 text-center">
                  <p className="text-sm font-medium">
                    Reading spreadsheet...
                  </p>

                  <p className="mt-1 text-xs text-black/35">
                    MapForge is checking the structure of your file.
                  </p>
                </div>
              )}

              {parsedSpreadsheet && !reviewStarted && (
                <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
                  <div className="border-b border-black/[0.06] p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                      What MapForge found
                    </p>

                    <h3 className="mt-2 text-base font-semibold">
                      Your spreadsheet is ready for review
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-black/50">
                      MapForge read your file and matched the information it
                      understands to Fieldora.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#f4f5f6] px-3 py-1.5 text-xs text-black/50">
                        {parsedSpreadsheet.rowCount} records
                      </span>

                      <span className="rounded-full bg-[#f4f5f6] px-3 py-1.5 text-xs text-black/50">
                        {parsedSpreadsheet.headers.length} columns
                      </span>

                      <span className="rounded-full bg-[#f4f5f6] px-3 py-1.5 text-xs text-black/50">
                        {ignoredFields.length} ignored
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-black/[0.055]">
                    {mappedFields.map((mapping) => (
                      <div
                        key={mapping.sourceHeader}
                        className="flex items-center justify-between gap-5 px-5 py-3.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {getFieldLabel(mapping.targetField)}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-black/35">
                            Read from “{mapping.sourceHeader}”
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5 text-xs text-emerald-700">
                          <Check size={13} />
                          Ready
                        </div>
                      </div>
                    ))}
                  </div>

                  {ignoredFields.length > 0 && (
                    <div className="border-t border-black/[0.06] bg-[#fafafa] px-5 py-4">
                      <p className="text-xs font-medium text-black/45">
                        Ignored columns ({ignoredFields.length})
                      </p>

                      <p className="mt-1 text-xs leading-5 text-black/35">
                        {ignoredFields
                          .map((mapping) => mapping.sourceHeader)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-black/[0.06] p-5">
                    <button
                      type="button"
                      disabled={!requiredReady}
                      onClick={() => setReviewStarted(true)}
                      className="flex w-full items-center justify-center rounded-xl bg-[#17191c] py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Start review
                    </button>

                    {!requiredReady && (
                      <p className="mt-2 text-center text-xs text-red-600">
                        Customer name and service could not be identified.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {parsedSpreadsheet && reviewStarted && (
                <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
                  <div className="border-b border-black/[0.06] p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">
                      Import review
                    </p>

                    <div className="mt-2 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold">
                          {parsedSpreadsheet.rowCount} records analyzed
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-black/50">
                          Check a sample of the data MapForge read before
                          starting the import.
                        </p>
                      </div>

                      <div className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-center">
                        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-700/60">
                          File read
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-emerald-700">
                          Complete
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-black/[0.055] bg-[#fafafa] px-5 py-3">
                    <p className="text-xs text-black/40">
                      {showAllRecords
                        ? `Showing all ${parsedSpreadsheet.rowCount} records`
                        : `Showing 5 sample records`}
                    </p>

                    {parsedSpreadsheet.rowCount > 5 && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowAllRecords((current) => !current)
                        }
                        className="text-xs font-medium text-black/55 transition hover:text-black"
                      >
                        {showAllRecords
                          ? "Show sample only"
                          : `Show all ${parsedSpreadsheet.rowCount}`}
                      </button>
                    )}
                  </div>

                  <div className="max-h-[430px] divide-y divide-black/[0.055] overflow-y-auto">
                    {(showAllRecords
                      ? parsedSpreadsheet.rows
                      : parsedSpreadsheet.rows.slice(0, 5)
                    ).map((row, index) => (
                      <div key={index} className="p-5">
                        <p className="text-xs font-medium text-black/35">
                          Record {index + 1}
                        </p>

                        <div className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2">
                          {mappedFields.slice(0, 6).map((mapping) => (
                            <div key={mapping.sourceHeader}>
                              <p className="text-[10px] uppercase tracking-[0.1em] text-black/30">
                                {getFieldLabel(mapping.targetField)}
                              </p>

                              <p className="mt-0.5 truncate text-xs font-medium text-black/65">
                                {String(
                                  row[mapping.sourceHeader] ?? "—"
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-black/[0.06] bg-[#fafafa] p-5">
                    {importing && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-black/55">
                            Importing leads
                          </p>

                          <p className="text-xs text-black/35">
                            {importedCount} / {parsedSpreadsheet.rowCount}
                          </p>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.06]">
                          <div
                            className="h-full rounded-full bg-[#17191c] transition-all duration-300"
                            style={{
                              width: `${Math.round(
                                (importedCount /
                                  parsedSpreadsheet.rowCount) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>

                        <p className="mt-2 text-[11px] leading-5 text-black/35">
                          Keep this window open while MapForge finishes the import.
                        </p>
                      </div>
                    )}

                    {!importComplete ? (
                      <button
                        type="button"
                        onClick={importLeads}
                        disabled={importing}
                        className="flex w-full items-center justify-center rounded-xl bg-[#17191c] py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-60"
                      >
                        {importing
                          ? `Importing ${importedCount} of ${parsedSpreadsheet.rowCount}...`
                          : `Import ${parsedSpreadsheet.rowCount} leads`}
                      </button>
                    ) : (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                        <p className="text-sm font-semibold text-emerald-800">
                          {importedCount} leads imported successfully
                        </p>

                        <p className="mt-1 text-xs leading-5 text-emerald-700/70">
                          Fieldora has been updated with the imported records.
                        </p>

                        <button
                          type="button"
                          onClick={finishAndClose}
                          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#17191c] px-5 text-sm font-medium text-white transition hover:bg-black"
                        >
                          Done
                        </button>
                      </div>
                    )}

                    {importError ? (
                      <p className="mt-2 text-center text-[11px] leading-5 text-red-600">
                        {importError}
                      </p>
                    ) : !importing && !importComplete ? (
                      <p className="mt-2 text-center text-[11px] leading-5 text-black/30">
                        Nothing is added until you confirm this import.
                      </p>
                    ) : null}
                  </div>
                </section>
              )}
              <div className="border-t border-black/[0.06] pt-4 text-center">
                <p className="mx-auto max-w-[360px] text-[11px] leading-5 text-black/30">
                  Import existing spreadsheet data with guided review,
                  duplicate checks, and a final confirmation before anything
                  is added to your CRM.
                </p>

                <p className="mt-2 text-[11px] font-medium text-black/45">
                  MapForge by Nuffdev
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}