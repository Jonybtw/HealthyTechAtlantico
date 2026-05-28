"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Download,
  FileUp,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { readApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { PreviewRow } from "@/app/api/students/import/preview/route";

type Step = "upload" | "preview";

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

const TEMPLATE_HEADERS = ["name", "sex", "birthDate", "className", "schoolYear", "processNumber"];
const TEMPLATE_EXAMPLE = ["Ana Costa", "F", "2010-05-14", "8A", "2025/2026", "123456"];

function downloadTemplate() {
  const csv = [TEMPLATE_HEADERS.join(","), TEMPLATE_EXAMPLE.join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "students_template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadErrorReport(rows: PreviewRow[]) {
  const errorRows = rows.filter((r) => r.status === "error");
  if (!errorRows.length) return;
  const headers = ["row", "name", "dob", "sex", "class", "error"];
  const lines = errorRows.map((r) =>
    [r.row, r.name, r.dob, r.sex, r.className, r.errorMessage ?? ""].join(","),
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "import_errors.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BulkImportModal({ open, onClose, onSuccess }: BulkImportModalProps) {
  const t = useTranslations("alunos");
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("upload");
    setSelectedFile(null);
    setPreviewRows([]);
    setValidCount(0);
    setErrorCount(0);
    setIsDragging(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Formato inválido. Use um ficheiro .csv");
      return;
    }
    setSelectedFile(file);
    setLoadingPreview(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/students/import/preview", {
        method: "POST",
        body: formData,
      });
      const data = await readApiResponse<{ valid: number; errors: number; rows: PreviewRow[] }>(res);
      setPreviewRows(data.rows);
      setValidCount(data.valid);
      setErrorCount(data.errors);
      setStep("preview");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("importError"));
    } finally {
      setLoadingPreview(false);
    }
  }, [t]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void processFile(file);
    event.target.value = "";
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const handleConfirm = async () => {
    if (!selectedFile || validCount === 0) return;
    setConfirming(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });
      const result = await readApiResponse<{ created: number; failed: number }>(res);
      toast.success(t("importSuccess", { count: result.created }));
      if (result.failed > 0) {
        toast.warning(t("importPartialWarning", { count: result.failed }));
      }
      onSuccess(result.created);
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("importError"));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        className="flex max-h-[90vh] w-full max-w-[640px] flex-col gap-0 overflow-hidden bg-white p-0 dark:bg-navy-950"
        hideClose
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/70 px-6 py-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              {step === "upload" ? t("bulkImportTitle") : t("bulkImportPreviewTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {step === "upload" ? t("bulkImportSubtitle") : t("bulkImportPreviewSubtitle")}
            </DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={handleClose}
            className="ml-4 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {step === "upload" ? (
            <UploadStep
              isDragging={isDragging}
              loading={loadingPreview}
              selectedFile={selectedFile}
              fileInputRef={fileInputRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileChange={handleFileChange}
              onDownloadTemplate={downloadTemplate}
              t={t}
            />
          ) : (
            <PreviewStep
              rows={previewRows}
              validCount={validCount}
              errorCount={errorCount}
              onDownloadErrors={() => downloadErrorReport(previewRows)}
              t={t}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border/70 px-6 py-4">
          {step === "preview" && errorCount > 0 ? (
            <button
              type="button"
              onClick={() => downloadErrorReport(previewRows)}
              className="flex items-center gap-1.5 text-sm font-medium text-danger-600 hover:underline dark:text-danger-400"
            >
              <Download className="size-3.5" />
              {t("bulkImportDownloadErrors")}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              {step === "upload" ? "Cancelar" : "Cancelar"}
            </Button>
            {step === "upload" ? (
              <Button
                type="button"
                variant="primary"
                icon={<Upload className="size-4" />}
                loading={loadingPreview}
                disabled={loadingPreview}
                onClick={() => fileInputRef.current?.click()}
              >
                {t("bulkImportUploadBtn")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                icon={<FileUp className="size-4" />}
                loading={confirming}
                disabled={validCount === 0 || confirming}
                onClick={() => void handleConfirm()}
              >
                {t("bulkImportConfirmBtn", { count: validCount })}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadStep({
  isDragging,
  loading,
  selectedFile,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onDownloadTemplate,
  t,
}: {
  isDragging: boolean;
  loading: boolean;
  selectedFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  t: ReturnType<typeof useTranslations<"alunos">>;
}) {
  return (
    <div className="space-y-5 px-6 py-5">
      <button
        type="button"
        onClick={onDownloadTemplate}
        className="flex items-center gap-2 text-sm font-medium text-gold-700 hover:underline dark:text-gold-400"
      >
        <Download className="size-4" />
        {t("bulkImportTemplateLink")}
      </button>

      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed transition-colors",
          isDragging
            ? "border-gold-500 bg-gold-50/60 dark:border-gold-400 dark:bg-gold-400/10"
            : "border-gold-300/80 bg-gold-50/30 hover:border-gold-400 hover:bg-gold-50/50 dark:border-gold-500/30 dark:bg-gold-400/5 dark:hover:border-gold-400/50",
          loading && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={onFileChange}
        />
        <div className="flex size-14 items-center justify-center rounded-[18px] bg-gold-100/80 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300">
          <Upload className="size-6" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gold-700 dark:text-gold-400">
            {loading && selectedFile
              ? `A processar ${selectedFile.name}…`
              : t("bulkImportDropHint")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("bulkImportDropClick")}</p>
        </div>
      </label>

      <div className="flex flex-wrap gap-2">
        {["Name", "DOB", "Gender", "Class", "School Year"].map((col) => (
          <span
            key={col}
            className="rounded-full border border-border/70 bg-surface-secondary px-3 py-1 text-xs font-semibold text-muted-foreground"
          >
            {col}
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewStep({
  rows,
  validCount,
  errorCount,
  t,
}: {
  rows: PreviewRow[];
  validCount: number;
  errorCount: number;
  onDownloadErrors: () => void;
  t: ReturnType<typeof useTranslations<"alunos">>;
}) {
  return (
    <div className="space-y-4 px-6 py-5">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-success-600 dark:text-success-400">
          <span className="size-2 rounded-full bg-success-500" />
          {t("bulkImportValidRows", { count: validCount })}
        </span>
        {errorCount > 0 && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-danger-600 dark:text-danger-400">
            <span className="size-2 rounded-full bg-danger-500" />
            {t("bulkImportErrorRows", { count: errorCount })}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[16px] border border-border/70">
        <div className="max-h-[340px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-border/70 bg-card">
              <tr>
                <th className="px-4 py-2.5 text-left text-tiny font-semibold uppercase tracking-[0.14em] text-muted-foreground w-12">
                  {t("bulkImportColRow")}
                </th>
                <th className="px-4 py-2.5 text-left text-tiny font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t("bulkImportColName")}
                </th>
                <th className="px-4 py-2.5 text-left text-tiny font-semibold uppercase tracking-[0.14em] text-muted-foreground w-28">
                  {t("bulkImportColDob")}
                </th>
                <th className="px-4 py-2.5 text-left text-tiny font-semibold uppercase tracking-[0.14em] text-muted-foreground w-20">
                  {t("bulkImportColGender")}
                </th>
                <th className="px-4 py-2.5 text-left text-tiny font-semibold uppercase tracking-[0.14em] text-muted-foreground w-20">
                  {t("bulkImportColClass")}
                </th>
                <th className="px-4 py-2.5 text-right text-tiny font-semibold uppercase tracking-[0.14em] text-muted-foreground w-24">
                  {t("bulkImportColStatus")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((row) => {
                const isError = row.status === "error";
                return (
                  <tr
                    key={row.row}
                    className={cn(
                      "transition-colors",
                      isError
                        ? "bg-danger-50/40 dark:bg-danger-950/20"
                        : "hover:bg-accent/40",
                    )}
                    title={isError ? row.errorMessage : undefined}
                  >
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.row}</td>
                    <td className="px-4 py-2.5">
                      <CellValue value={row.name} error={isError && !row.name} />
                    </td>
                    <td className="px-4 py-2.5">
                      <CellValue
                        value={row.dob}
                        error={isError && !!row.errorMessage?.toLowerCase().includes("data")}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <CellValue
                        value={row.sex}
                        error={isError && !!row.errorMessage?.toLowerCase().includes("sexo")}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <CellValue value={row.className} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isError ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger-600 dark:text-danger-400">
                          <XCircle className="size-3.5" />
                          {t("bulkImportStatusError")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-600 dark:text-success-400">
                          <CheckCircle2 className="size-3.5" />
                          {t("bulkImportStatusValid")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CellValue({ value, error }: { value: string; error?: boolean }) {
  if (!value || value === "-" || value === "Missing") {
    return <span className="italic text-danger-500 dark:text-danger-400">Missing</span>;
  }
  if (error) {
    return <span className="italic text-danger-500 dark:text-danger-400">{value}</span>;
  }
  return <span className="font-medium text-foreground">{value}</span>;
}
