import { describe, expect, it } from "vitest";
import {
  MAX_CSV_FILE_BYTES,
  MAX_CSV_ROWS,
  parseCsv,
  validateCsvUpload,
} from "@/lib/csv";

describe("validateCsvUpload", () => {
  it("accepts valid csv file", () => {
    const file = new File(["name,sex\nAna,F\n"], "students.csv", {
      type: "text/csv",
    });

    expect(validateCsvUpload(file)).toBeNull();
  });

  it("rejects empty file", () => {
    const file = new File([""], "students.csv", { type: "text/csv" });

    expect(validateCsvUpload(file)).toBe("Ficheiro CSV vazio");
  });

  it("rejects large file", () => {
    const payload = "a".repeat(MAX_CSV_FILE_BYTES + 1);
    const file = new File([payload], "students.csv", { type: "text/csv" });

    expect(validateCsvUpload(file)).toBe("Ficheiro demasiado grande (max 5MB)");
  });

  it("rejects non csv type and extension", () => {
    const file = new File(["{}"], "students.json", {
      type: "application/json",
    });

    expect(validateCsvUpload(file)).toBe("Formato invalido. Use um ficheiro CSV");
  });
});

describe("parseCsv", () => {
  it("parses headers and rows", () => {
    const parsed = parseCsv("name;sex\nAna;F\n");

    expect(parsed.headers).toEqual(["name", "sex"]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.delimiter).toBe(";");
  });

  it("supports empty csv", () => {
    const parsed = parseCsv("\n\n");

    expect(parsed.headers).toEqual([]);
    expect(parsed.rows).toEqual([]);
  });

  it("exposes row hard limit constant", () => {
    expect(MAX_CSV_ROWS).toBe(10_000);
  });
});
