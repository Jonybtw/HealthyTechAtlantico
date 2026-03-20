export interface ParsedCsv {
  delimiter: "," | ";";
  headers: string[];
  rows: string[][];
}

const ALLOWED_CSV_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "text/plain",
  "application/vnd.ms-excel",
  "",
]);

export const MAX_CSV_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 10_000;

export function validateCsvUpload(file: File): string | null {
  if (file.size <= 0) {
    return "Ficheiro CSV vazio";
  }

  if (file.size > MAX_CSV_FILE_BYTES) {
    return "Ficheiro demasiado grande (max 5MB)";
  }

  const fileName = file.name.toLowerCase();
  const hasCsvExtension = fileName.endsWith(".csv");
  const hasAllowedMimeType = ALLOWED_CSV_MIME_TYPES.has(file.type);

  if (!hasCsvExtension && !hasAllowedMimeType) {
    return "Formato invalido. Use um ficheiro CSV";
  }

  return null;
}

export function normalizeCsvHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function parseCsv(text: string): ParsedCsv {
  const cleaned = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(cleaned);
  const parsedRows = splitCsvRows(cleaned, delimiter);
  const nonEmptyRows = parsedRows.filter((row) =>
    row.some((cell) => cell.trim().length > 0),
  );

  if (nonEmptyRows.length === 0) {
    return { delimiter, headers: [], rows: [] };
  }

  const headers = nonEmptyRows[0].map((header) => header.trim());
  const rows = nonEmptyRows.slice(1);

  return { delimiter, headers, rows };
}

function detectDelimiter(text: string): "," | ";" {
  const firstNonEmptyLine =
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  const commaCount = (firstNonEmptyLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstNonEmptyLine.match(/;/g) ?? []).length;

  return semicolonCount > commaCount ? ";" : ",";
}

function splitCsvRows(text: string, delimiter: "," | ";"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
}
