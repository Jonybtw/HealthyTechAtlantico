"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Dumbbell,
  CheckCircle2,
  FileCheck2,
  FileText,
  Gauge,
  Link2,
  Mail,
  type LucideIcon,
  Ruler,
  Send,
  ShieldAlert,
  User,
  Weight,
} from "lucide-react";
import { useUser } from "@/components/user-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartFrame } from "@/components/ui/chart-frame";
import { ChartTooltip } from "@/components/ui/chart-tooltip";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldShell } from "@/components/ui/field-shell";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { Skeleton } from "@/components/ui/skeleton";
import { useReducedEffects } from "@/hooks/use-reduced-effects";
import { cn } from "@/lib/utils";
import { StudentIdentity } from "@/components/ui/student-identity";
import {
  StudentPicker,
  getInitials,
  getStudentSwatch,
} from "@/components/ui/student-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { readApiResponse } from "@/lib/api-client";

type StudentOption = {
  id: string;
  name: string;
  className?: string | null;
};

type RawBiometricEntry = {
  heightM?: number | string | null;
  weightKg?: number | string | null;
  imc?: number | string | null;
  waistCm?: number | string | null;
  date?: string | null;
  createdAt?: string | null;
};

type BiometricEntry = {
  heightM: number | null;
  weightKg: number | null;
  imc: number | null;
  waistCm: number | null;
  date: string | null;
};

type RawTestEntry = {
  testId: string;
  valueText?: string | number | null;
  unit?: string | null;
  date?: string | null;
  createdAt?: string | null;
};

type TestEntry = {
  testId: string;
  valueText: string;
  unit: string;
  date: string | null;
};

type GuardianOption = {
  id: string;
  guardian: { name: string | null; email: string };
  relationship: string;
};

type ReportEmailResponse = {
  emailSent: boolean;
};

type PdfAttachmentPayload = {
  filename: string;
  contentBase64: string;
  contentType: "application/pdf";
};

type PdfColor = [number, number, number];

type HealthStatusKey = "lowWeight" | "normal" | "overweight" | "obesity";

type HealthInsight = {
  status: HealthStatusKey | "unknown";
  label: string;
  badgeVariant: "success" | "warning" | "danger";
  tone: "success" | "warning" | "danger";
  headline: string;
  summary: string;
  improvement: string;
  exercises: string[];
  maintain: string;
};

const TEST_LABEL_KEYS: Record<string, string> = {
  vai: "testVaiVem",
  vaivem: "testVaiVem",
  cooper: "testCooper",
  milha: "testMilha",
  velocidade: "testVelocidade",
  agilidade: "testAgilidade",
  abd: "testAbdominais",
  abdominais: "testAbdominais",
  bracos: "testExtensoes",
  extensoes: "testExtensoes",
  senta: "testSentaAlcanca",
  senta_alcanca: "testSentaAlcanca",
};

function sectionAnimation(index: number, re: boolean) {
  if (re) return {};
  return { animationDelay: `${index * 70}ms` };
}

function BioPanel({ children, className, index, reducedEffects }: { children: React.ReactNode; className?: string; index: number; reducedEffects: boolean }) {
  return (
    <section style={sectionAnimation(index, reducedEffects)} className={cn("relative overflow-hidden rounded-[12px] border border-border bg-card/88 shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]", !reducedEffects && "animate-fade-in-up opacity-0", className)}>
      <div className="relative">{children}</div>
    </section>
  );
}

const reportSurfaceClassName =
  "rounded-[12px] border border-border/70 bg-card/88 shadow-card backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.06]";

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("PDF invalido"));
        return;
      }

      resolve(result.split(",")[1] ?? result);
    };
    reader.readAsDataURL(blob);
  });
}

function buildReportFilename(studentName: string | null | undefined) {
  const safeName = (studentName ?? "aluno")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `relatorio-${safeName || "aluno"}.pdf`;
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeBiometricEntry(raw: RawBiometricEntry): BiometricEntry {
  return {
    heightM: toNumber(raw.heightM),
    weightKg: toNumber(raw.weightKg),
    imc: toNumber(raw.imc),
    waistCm: toNumber(raw.waistCm),
    date: raw.date ?? raw.createdAt ?? null,
  };
}

function normalizeTestEntry(raw: RawTestEntry): TestEntry {
  return {
    testId: raw.testId,
    valueText:
      raw.valueText === null || raw.valueText === undefined
        ? "-"
        : String(raw.valueText),
    unit: raw.unit ?? "",
    date: raw.date ?? raw.createdAt ?? null,
  };
}

function formatNumber(value: number | null, digits = 1) {
  return typeof value === "number" ? value.toFixed(digits) : "-";
}

function formatAxisDate(value: string | null, locale: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function getHealthStatus(imc: number | null): HealthStatusKey | "unknown" {
  if (imc === null) return "unknown";
  if (imc < 18.5) return "lowWeight";
  if (imc < 25) return "normal";
  if (imc < 30) return "overweight";
  return "obesity";
}

function getHealthInsight(
  imc: number | null,
  t: (key: string) => string,
): HealthInsight {
  const status = getHealthStatus(imc);

  if (status === "unknown") {
    return {
      status,
      label: "-",
      badgeVariant: "warning",
      tone: "warning",
      headline: t("healthUnknownHeadline"),
      summary: t("healthUnknownSummary"),
      improvement: t("healthUnknownImprovement"),
      exercises: [],
      maintain: t("healthUnknownMaintain"),
    };
  }

  const isHealthy = status === "normal";
  const label = t(status);

  return {
    status,
    label,
    badgeVariant: isHealthy ? "success" : status === "obesity" ? "danger" : "warning",
    tone: isHealthy ? "success" : status === "obesity" ? "danger" : "warning",
    headline: isHealthy
      ? t("healthHealthyHeadline")
      : t("healthNeedsAttentionHeadline"),
    summary: t(`health${status}Summary`),
    improvement: t(`health${status}Improvement`),
    exercises: [
      t(`health${status}Exercise1`),
      t(`health${status}Exercise2`),
      t(`health${status}Exercise3`),
    ],
    maintain: t(`health${status}Maintain`),
  };
}

function getPdfImcState(
  imc: number | null,
  t: (key: string) => string,
): {
  label: string;
  color: PdfColor;
  badgeVariant: "success" | "warning" | "danger";
} {
  if (imc === null) {
    return { label: "-", color: [95, 109, 123], badgeVariant: "warning" };
  }

  if (imc < 18.5) {
    return {
      label: t("lowWeight"),
      color: [245, 158, 11],
      badgeVariant: "warning",
    };
  }

  if (imc < 25) {
    return {
      label: t("normal"),
      color: [16, 185, 129],
      badgeVariant: "success",
    };
  }

  if (imc < 30) {
    return {
      label: t("overweight"),
      color: [245, 158, 11],
      badgeVariant: "warning",
    };
  }

  return { label: t("obesity"), color: [239, 68, 68], badgeVariant: "danger" };
}

export default function RelatorioClient() {
  const t = useTranslations("relatorio");
  const common = useTranslations("common");
  const protocolos = useTranslations("protocolos");
  const locale = useLocale();
  const { role } = useUser();

  const reducedEffects = useReducedEffects();
  const canViewReports =
    role === "ADMIN" ||
    role === "PROFESSOR" ||
    role === "ALUNO" ||
    role === "PAIS";
  const canSendEmail = role === "ADMIN" || role === "PROFESSOR";
  const isStudentRole = role === "ALUNO";

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [bioData, setBioData] = useState<BiometricEntry[]>([]);
  const [testData, setTestData] = useState<TestEntry[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [guardians, setGuardians] = useState<GuardianOption[]>([]);
  const [guardianUserId, setGuardianUserId] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const loadStudents = useCallback(
    async (signal?: AbortSignal) => {
      setLoadingStudents(true);

      if (!canViewReports) {
        setStudents([]);
        setStudentId(null);
        setLoadingStudents(false);
        return;
      }

      try {
        const response = await fetch("/api/students?limit=500", { signal });

        if (!response.ok) {
          throw new Error(common("studentListLoadError"));
        }

        const body = await readApiResponse<{ students: StudentOption[] }>(
          response,
        );
        setStudents(body.students);

        if (role === "ALUNO" && body.students.length === 1) {
          setStudentId(body.students[0].id);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        toast.error(common("studentListLoadError"));
        setStudents([]);
        setStudentId(null);
      } finally {
        if (!signal?.aborted) {
          setLoadingStudents(false);
        }
      }
    },
    [canViewReports, common, role],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadStudents(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadStudents]);

  useEffect(() => {
    if (loadingStudents || students.length === 0) {
      return;
    }

    setStudentId((current) => {
      if (current && students.some((student) => student.id === current)) {
        return current;
      }

      return students[0].id;
    });
  }, [loadingStudents, students]);

  useEffect(() => {
    if (!canViewReports || !studentId) {
      setBioData([]);
      setTestData([]);
      setGuardians([]);
      setGuardianUserId("");
      return;
    }

    const controller = new AbortController();

    setLoadingPreview(true);

    void (async () => {
      try {
        const [bioResponse, testsResponse] = await Promise.all([
          fetch(`/api/students/${studentId}/biometrics`, {
            signal: controller.signal,
          }),
          fetch(`/api/students/${studentId}/tests?latest=true`, {
            signal: controller.signal,
          }),
        ]);

        const [biometrics, tests] = await Promise.all([
          readApiResponse<RawBiometricEntry[]>(bioResponse),
          readApiResponse<RawTestEntry[]>(testsResponse),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        setBioData(biometrics.map(normalizeBiometricEntry));
        setTestData(tests.map(normalizeTestEntry));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (!controller.signal.aborted) {
          setBioData([]);
          setTestData([]);
          toast.error(common("connectionError"));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPreview(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [canViewReports, common, studentId]);

  useEffect(() => {
    if (!canSendEmail || !studentId) {
      setGuardians([]);
      setGuardianUserId("");
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(`/api/students/${studentId}/guardians`, {
          signal: controller.signal,
        });
        const items = await readApiResponse<GuardianOption[]>(response);

        if (controller.signal.aborted) {
          return;
        }

        setGuardians(items);
        setGuardianUserId((current) =>
          current && items.some((guardian) => guardian.id === current)
            ? current
            : (items[0]?.id ?? ""),
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (!controller.signal.aborted) {
          setGuardians([]);
          setGuardianUserId("");
          toast.error(common("connectionError"));
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [canSendEmail, common, studentId]);

  const selectedStudent = students.find((student) => student.id === studentId);
  const latestBiometric = bioData[0] ?? null;
  const latestTestsDate = testData[0]?.date ?? null;
  const hasReportData = bioData.length > 0 || testData.length > 0;
  const imcState = getPdfImcState(latestBiometric?.imc ?? null, t);
  const healthInsight = getHealthInsight(latestBiometric?.imc ?? null, t);
  const biometricChartData = bioData
    .filter((entry) => entry.imc !== null)
    .map((entry) => ({
      label: formatAxisDate(entry.date, locale),
      date: entry.date,
      imc: entry.imc ?? 0,
    }))
    .reverse();

  const formatDate = (value: string | null) => {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getTestLabel = (testId: string) => {
    const key = TEST_LABEL_KEYS[testId.toLowerCase()];
    return key ? protocolos(key as never) : testId;
  };

  const biometricsStatus = loadingPreview
    ? t("biometricsLoadingState")
    : bioData.length > 0
      ? t("biometricsReadyState")
      : t("biometricsEmptyState");

  const testsStatus = loadingPreview
    ? t("loadingData")
    : testData.length > 0
      ? t("testsReadyState")
      : t("testsEmptyState");

  const recipientStatus = !canSendEmail
    ? t("emailUnavailableState")
    : guardians.length > 0
      ? t("emailReadyState")
      : t("emailEmptyState");

  const buildMetaDetail = (value: string | null, emptyState: string) =>
    value ? t("dataRecordedAt", { date: value }) : emptyState;

  const previewMeta = {
    biometrics: buildMetaDetail(
      formatDate(latestBiometric?.date ?? null),
      t("biometricsEmptyState"),
    ),
    tests: buildMetaDetail(formatDate(latestTestsDate), t("testsEmptyState")),
  };

  const buildReportPdfBlob = async () => {
    if (!studentId) {
      throw new Error(t("selectStudent"));
    }

      const [rawBiometrics, rawTests] = await Promise.all([
        fetch(`/api/students/${studentId}/biometrics`).then((response) =>
          readApiResponse<RawBiometricEntry[]>(response),
        ),
        fetch(`/api/students/${studentId}/tests?latest=true`).then((response) =>
          readApiResponse<RawTestEntry[]>(response),
        ),
      ]);

      const biometrics = rawBiometrics.map(normalizeBiometricEntry);
      const tests = rawTests.map(normalizeTestEntry);
      const pdfHealthInsight = getHealthInsight(biometrics[0]?.imc ?? null, t);

      if (biometrics.length === 0 && tests.length === 0) {
        throw new Error(t("noData"));
      }

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();
      const foreground: PdfColor = [9, 21, 35];
      const mutedForeground: PdfColor = [95, 109, 123];
      const pageBackground: PdfColor = [244, 241, 234];
      const cardBackground: PdfColor = [255, 255, 255];
      const mutedBackground: PdfColor = [236, 230, 218];
      const brand: PdfColor = [184, 140, 25];
      const border: PdfColor = [225, 215, 203];
      const footerBackground: PdfColor = [18, 30, 45];

      const fill = (color: PdfColor) => doc.setFillColor(...color);
      const stroke = (color: PdfColor) => doc.setDrawColor(...color);
      const text = (color: PdfColor) => doc.setTextColor(...color);

      fill(pageBackground);
      doc.rect(0, 0, width, height, "F");

      let headerTextX = 14;

      try {
        const logoResponse = await fetch("/logo-icon.png");
        const logoBlob = await logoResponse.blob();
        const logoDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(logoBlob);
        });

        const image = doc.getImageProperties(logoDataUrl);
        const desiredHeight = 12;
        const desiredWidth = (image.width * desiredHeight) / image.height;

        doc.addImage(logoDataUrl, "PNG", 14, 13, desiredWidth, desiredHeight);
        headerTextX = 14 + desiredWidth + 4;
      } catch {
        // Keep export working even if the logo is unavailable.
      }

      text(mutedForeground);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("HEALTHYTECH ATLÂNTICO", headerTextX, 17);

      text(foreground);
      doc.setFontSize(16);
      doc.text(t("previewHeader"), headerTextX, 24);

      text(mutedForeground);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `${t("issuedOn")} ${new Intl.DateTimeFormat(
          locale,
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
          },
        ).format(new Date())}`,
        width - 14,
        25,
        { align: "right" },
      );

      stroke(border);
      doc.setLineWidth(0.3);
      doc.line(14, 32, width - 14, 32);

      let y = 42;

      fill(cardBackground);
      doc.circle(20, y + 2, 6, "F");
      stroke(border);
      doc.circle(20, y + 2, 6, "S");
      text(brand);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(getInitials(selectedStudent?.name ?? "?"), 20, y + 3.5, {
        align: "center",
      });

      text(foreground);
      doc.setFontSize(12);
      doc.text(selectedStudent?.name ?? "-", 30, y + 2);

      text(mutedForeground);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        selectedStudent?.className
          ? `${t("pdfClassLabel")} ${selectedStudent.className}`
          : t("pdfStudentLabel"),
        30,
        y + 6,
      );

      y = 60;

      const drawSection = (title: string) => {
        text(foreground);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(title, 14, y);
        y += 8;
      };

      drawSection(t("biometricsSection"));

      if (biometrics.length > 0) {
        const entry = biometrics[0];
        const metrics = [
          {
            label: t("heightLabel"),
            value:
              entry.heightM === null
                ? "-"
                : `${formatNumber(entry.heightM, 2)} m`,
            badge: null,
          },
          {
            label: t("weightLabel"),
            value:
              entry.weightKg === null
                ? "-"
                : `${formatNumber(entry.weightKg, 1)} kg`,
            badge: null,
          },
          {
            label: t("imcLabel"),
            value: formatNumber(entry.imc, 1),
            badge: getPdfImcState(entry.imc, t),
          },
          {
            label: t("waistLabel"),
            value:
              entry.waistCm === null
                ? "-"
                : `${formatNumber(entry.waistCm, 1)} cm`,
            badge: null,
          },
        ];

        const cardWidth = (width - 28 - 9) / 4;

        metrics.forEach((metric, index) => {
          const x = 14 + index * (cardWidth + 3);

          fill(cardBackground);
          doc.roundedRect(x, y, cardWidth, 20, 3, 3, "F");
          stroke(border);
          doc.roundedRect(x, y, cardWidth, 20, 3, 3, "S");

          text(mutedForeground);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.text(metric.label.toUpperCase(), x + 4, y + 7);

          text(foreground);
          doc.setFontSize(11);
          doc.text(metric.value, x + 4, y + 14);

          if (metric.badge) {
            text(metric.badge.color);
            doc.setFontSize(6);
            doc.text(metric.badge.label, x + 4, y + 17.5);
          }
        });

        y += 28;
      } else {
        fill(cardBackground);
        doc.roundedRect(14, y, width - 28, 12, 3, 3, "F");
        stroke(border);
        doc.roundedRect(14, y, width - 28, 12, 3, 3, "S");
        text(mutedForeground);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(t("noBiometrics"), width / 2, y + 7, { align: "center" });
        y += 20;
      }

      drawSection(t("healthInsightSection"));

      fill(cardBackground);
      doc.roundedRect(14, y, width - 28, 44, 3, 3, "F");
      stroke(border);
      doc.roundedRect(14, y, width - 28, 44, 3, 3, "S");

      text(pdfHealthInsight.tone === "success" ? [16, 185, 129] : pdfHealthInsight.tone === "danger" ? [239, 68, 68] : [245, 158, 11]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(pdfHealthInsight.label.toUpperCase(), 18, y + 8);

      text(foreground);
      doc.setFontSize(10);
      doc.text(pdfHealthInsight.headline, 18, y + 15);

      text(mutedForeground);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      const summaryLines = doc.splitTextToSize(
        `${pdfHealthInsight.summary} ${pdfHealthInsight.improvement}`,
        width - 92,
      );
      doc.text(summaryLines.slice(0, 4), 18, y + 21);

      const gaugeX = width - 66;
      const gaugeY = y + 15;
      const gaugeWidth = 42;
      const gaugeHeight = 7;
      fill([236, 230, 218]);
      doc.roundedRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 3, 3, "F");
      fill([16, 185, 129]);
      doc.roundedRect(gaugeX + gaugeWidth * 0.24, gaugeY, gaugeWidth * 0.28, gaugeHeight, 3, 3, "F");
      const bmiValue = biometrics[0]?.imc;
      const markerX =
        typeof bmiValue === "number"
          ? gaugeX + Math.min(1, Math.max(0, (bmiValue - 14) / 22)) * gaugeWidth
          : gaugeX;
      stroke(foreground);
      doc.setLineWidth(0.8);
      doc.line(markerX, gaugeY - 1.5, markerX, gaugeY + gaugeHeight + 1.5);
      text(mutedForeground);
      doc.setFontSize(6);
      doc.text("18.5", gaugeX + gaugeWidth * 0.24, gaugeY + 14, { align: "center" });
      doc.text("25", gaugeX + gaugeWidth * 0.52, gaugeY + 14, { align: "center" });

      text(foreground);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(t("recommendedExercises"), 18, y + 36);
      text(mutedForeground);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(
        pdfHealthInsight.exercises.length > 0
          ? pdfHealthInsight.exercises.join(" · ")
          : pdfHealthInsight.maintain,
        57,
        y + 36,
        { maxWidth: width - 76 },
      );
      y += 52;

      drawSection(t("testsSection"));

      if (tests.length > 0) {
        const rowHeight = 9;

        fill(mutedBackground);
        doc.rect(14, y, width - 28, rowHeight, "F");
        text(foreground);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(t("testHeader").toUpperCase(), 18, y + 6);
        doc.text(t("resultHeader").toUpperCase(), width - 18, y + 6, {
          align: "right",
        });
        y += rowHeight;

        tests.forEach((test, index) => {
          fill(index % 2 === 0 ? cardBackground : pageBackground);
          doc.rect(14, y, width - 28, rowHeight, "F");

          text(foreground);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text(getTestLabel(test.testId), 18, y + 6);

          doc.setFont("helvetica", "bold");
          doc.text(
            `${test.valueText}${test.unit ? ` ${test.unit}` : ""}`,
            width - 18,
            y + 6,
            { align: "right" },
          );

          stroke(border);
          doc.setLineWidth(0.2);
          doc.line(14, y + rowHeight, width - 14, y + rowHeight);
          y += rowHeight;
        });
      } else {
        fill(cardBackground);
        doc.roundedRect(14, y, width - 28, 10, 2, 2, "F");
        stroke(border);
        doc.roundedRect(14, y, width - 28, 10, 2, 2, "S");
        text(mutedForeground);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(t("noTests"), width / 2, y + 6.5, { align: "center" });
      }

      const disclaimerText = t("disclaimerText");

      const disclaimerLines = doc.splitTextToSize(disclaimerText, width - 28);
      const disclaimerLineHeight = 3.6;
      const disclaimerBlockH = disclaimerLines.length * disclaimerLineHeight + 6;
      const disclaimerY = height - 16 - disclaimerBlockH;

      stroke(border);
      doc.setLineWidth(0.3);
      doc.line(14, disclaimerY, width - 14, disclaimerY);

      text(mutedForeground);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.5);
      doc.text(disclaimerLines, 14, disclaimerY + 5);

      fill(footerBackground);
      doc.rect(0, height - 16, width, 16, "F");
      fill(brand);
      doc.rect(0, height - 16, width, 1.5, "F");
      text([236, 230, 218]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(
        t("pdfFooter"),
        width / 2,
        height - 7.5,
        { align: "center" },
      );

    return doc.output("blob");
  };

  const handleGeneratePdf = async () => {
    if (!studentId) {
      toast.error(t("selectStudent"));
      return;
    }

    const previewWindow = window.open("about:blank", "_blank");

    if (!previewWindow) {
      toast.error(t("previewBlocked"));
      return;
    }

    try {
      previewWindow.opener = null;
    } catch {
      // Ignore browsers that prevent overriding opener.
    }

    previewWindow.document.title = t("previewHeader");
    previewWindow.document.body.innerHTML = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; margin: 0; display: grid; place-items: center; background: #f4f1ea; color: #091523;">
        <div style="text-align: center; padding: 24px;">
          <div style="font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; color: #5f6d7b; margin-bottom: 12px;">HealthyTech Atlântico</div>
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">${t("generating")}</div>
          <div style="font-size: 14px; color: #5f6d7b;">${t("pdfSubtitle")}</div>
        </div>
      </div>
    `;

    setGeneratingPdf(true);

    try {
      const blob = await buildReportPdfBlob();
      const url = URL.createObjectURL(blob);
      previewWindow.location.href = url;

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success(t("success"));
    } catch (error) {
      if (!previewWindow.closed) {
        previewWindow.close();
      }
      toast.error(
        error instanceof Error ? error.message : t("connectionError"),
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    if (!studentId) {
      toast.error(t("selectStudent"));
      return;
    }

    if (!guardianUserId) {
      toast.error(t("selectGuardianError"));
      return;
    }

    setSendingEmail(true);

    try {
      const pdfBlob = await buildReportPdfBlob();
      const pdfAttachment: PdfAttachmentPayload = {
        filename: buildReportFilename(selectedStudent?.name),
        contentBase64: await blobToBase64(pdfBlob),
        contentType: "application/pdf",
      };

      const response = await fetch(`/api/students/${studentId}/reports/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianUserId, pdfAttachment }),
      });

      const result = await readApiResponse<ReportEmailResponse>(response);

      if (!result.emailSent) {
        toast.error(t("emailSendError"));
        return;
      }

      toast.success(t("emailSuccess"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("connectionError"),
      );
    } finally {
      setSendingEmail(false);
    }
  };

  if (!canViewReports) {
    return (
      <PageScaffold
        headerProps={{
          title: t("title"),
          description: t("description"),
        }}
      >
        <EmptyState
          icon={ShieldAlert}
          title={common("noPermission")}
          description={t("description")}
        />
      </PageScaffold>
    );
  }

  if (role === "ALUNO" && !loadingStudents && students.length === 0) {
    return (
      <PageScaffold
        headerProps={{
          title: t("title"),
          description: t("description"),
        }}
      >
        <EmptyState
          icon={Link2}
          title={t("unlinkedTitle")}
          description={t("unlinkedDescription")}
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      contentClassName="mx-auto w-full max-w-[1440px]"
      headerProps={{
        title: t("title"),
        description: t("description"),
      }}
    >
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <BioPanel index={0} reducedEffects={reducedEffects} className="p-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className={cn(reportSurfaceClassName, "p-4 sm:p-5")}>
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-navy-100 text-navy-700 dark:bg-navy-900 dark:text-navy-200">
                    <User className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {isStudentRole
                          ? t("pdfStudentLabel")
                          : t("studentSelectionLabel")}
                      </p>
                      <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">
                        {isStudentRole ? t("previewHeader") : t("flowStepSelect")}
                      </h2>
                    </div>

                    {!isStudentRole ? (
                      <StudentPicker
                        students={students}
                        value={studentId}
                        onChange={setStudentId}
                        loading={loadingStudents}
                      />
                    ) : (
                      <SelectedStudentCard student={selectedStudent} />
                    )}

                    {!isStudentRole ? (
                      <p className="text-tiny leading-relaxed text-muted-foreground">
                        {t("studentSelectionHint")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={cn(reportSurfaceClassName, "p-4 sm:p-5")}>
                {studentId && selectedStudent ? (
                  <div className="grid h-full gap-5">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {t("workspaceTitle")}
                        </p>
                        <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
                          {selectedStudent.name}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {hasReportData
                            ? t("documentIncludesDescription")
                            : t("noData")}
                        </p>
                      </div>

                      <Badge
                        variant={hasReportData ? "success" : "warning"}
                        size="md"
                        className="w-fit shrink-0"
                      >
                        {hasReportData
                          ? t("readyToGenerateTitle")
                          : t("documentIncludesTitle")}
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <ReportStatusCard
                        icon={Activity}
                        title={t("biometricsSection")}
                        description={biometricsStatus}
                        detail={previewMeta.biometrics}
                      />
                      <ReportStatusCard
                        icon={CheckCircle2}
                        title={t("testsSection")}
                        description={testsStatus}
                        detail={previewMeta.tests}
                      />
                    </div>

                    <div className="rounded-[12px] border border-border/70 bg-background/70 p-3">
                      <InlineStatusRow
                        label={t("emailTitle")}
                        value={recipientStatus}
                        tone={guardians.length > 0 ? "info" : "default"}
                      />
                    </div>
                  </div>
                ) : (
                  <ReportEmptySteps
                    title={t("documentEmptyTitle")}
                    description={t("documentEmptyDescription")}
                    steps={[
                      t("flowStepSelect"),
                      t("flowStepReview"),
                      t("flowStepGenerate"),
                    ]}
                  />
                )}
              </div>
            </div>
          </BioPanel>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <BioPanel index={1} reducedEffects={reducedEffects} className="p-5">
              <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("biometricsSection")}
                  </p>
                  <h3 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">{t("latestBiometricsTitle")}</h3>
                </div>
                {latestBiometric ? (
                  <Badge variant={imcState.badgeVariant} className="w-fit">
                    {imcState.label}
                  </Badge>
                ) : null}
              </div>
              {loadingPreview && studentId ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((item) => (
                    <Skeleton key={item} className="h-24 rounded-[12px]" />
                  ))}
                </div>
              ) : latestBiometric ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ReportMetricCard
                      icon={Ruler}
                      label={t("heightLabel")}
                      value={
                        latestBiometric.heightM === null
                          ? "-"
                          : `${formatNumber(latestBiometric.heightM, 2)} m`
                      }
                    />
                    <ReportMetricCard
                      icon={Weight}
                      label={t("weightLabel")}
                      value={
                        latestBiometric.weightKg === null
                          ? "-"
                          : `${formatNumber(latestBiometric.weightKg, 1)} kg`
                      }
                    />
                    <ReportMetricCard
                      icon={Gauge}
                      label={t("imcLabel")}
                      value={formatNumber(latestBiometric.imc, 1)}
                      badge={
                        <Badge variant={imcState.badgeVariant}>
                          {imcState.label}
                        </Badge>
                      }
                    />
                    <ReportMetricCard
                      icon={Activity}
                      label={t("waistLabel")}
                      value={
                        latestBiometric.waistCm === null
                          ? "-"
                          : `${formatNumber(latestBiometric.waistCm, 1)} cm`
                      }
                    />
                  </div>

                  <div className="rounded-[12px] border border-border/70 bg-background/65 px-4 py-3">
                    <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {t("includedInPdf")}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {previewMeta.biometrics}
                    </p>
                  </div>

                  <HealthInsightPanel insight={healthInsight} t={t} />

                  {biometricChartData.length > 0 ? (
                    <div className="rounded-[12px] border border-border/70 bg-background/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {t("healthChartEyebrow")}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-foreground">
                            {t("healthChartTitle")}
                          </h3>
                        </div>
                        <Badge variant={healthInsight.badgeVariant}>
                          {healthInsight.label}
                        </Badge>
                      </div>
                      <ChartFrame className="mt-4 h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={biometricChartData}
                            margin={{ top: 8, right: 8, left: -18, bottom: 8 }}
                          >
                            <defs>
                              <linearGradient
                                id="report-bmi"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#d4a11e"
                                  stopOpacity={0.28}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#d4a11e"
                                  stopOpacity={0.02}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="4 4"
                              stroke="rgba(9,21,35,0.08)"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="label"
                              axisLine={false}
                              tickLine={false}
                              dy={10}
                              tick={{
                                fill: "#5f6d7b",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              dx={-8}
                              tick={{
                                fill: "#5f6d7b",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                              domain={["dataMin - 1", "dataMax + 1"]}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Area
                              type="monotone"
                              dataKey="imc"
                              name={t("imcLabel")}
                              stroke="#d4a11e"
                              strokeWidth={3}
                              fill="url(#report-bmi)"
                              activeDot={{
                                r: 5,
                                fill: "#d4a11e",
                                strokeWidth: 0,
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartFrame>
                    </div>
                  ) : null}
                </div>
              ) : (
                <ReportEmptyPanel
                  icon={Activity}
                  title={
                    studentId
                      ? t("noBiometricsSelectedTitle")
                      : t("documentEmptyTitle")
                  }
                  description={
                    studentId
                      ? t("noBiometricsSelectedDescription")
                      : t("documentEmptyDescription")
                  }
                />
              )}
            </BioPanel>

            <BioPanel index={2} reducedEffects={reducedEffects} className="p-5">
              <div className="mb-4">
                <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("testsSection")}</p>
                <h3 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">{t("latestTestsTitle")}</h3>
              </div>
              {loadingPreview && studentId ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <Skeleton key={item} className="h-20 rounded-[12px]" />
                  ))}
                </div>
              ) : testData.length > 0 ? (
                <div className="space-y-3">
                  {testData.map((test) => (
                    <ReportTestRow
                      key={`${test.testId}-${test.date ?? test.valueText}`}
                      label={getTestLabel(test.testId)}
                      value={test.valueText}
                      unit={test.unit}
                      date={formatDate(test.date)}
                    />
                  ))}
                </div>
              ) : (
                <ReportEmptyPanel
                  icon={FileText}
                  title={
                    studentId
                      ? t("noTestsSelectedTitle")
                      : t("documentEmptyTitle")
                  }
                  description={
                    studentId
                      ? t("noTestsSelectedDescription")
                      : t("documentEmptyDescription")
                  }
                />
              )}
            </BioPanel>
          </div>
        </div>

        <BioPanel index={3} reducedEffects={reducedEffects} className="p-5 xl:sticky xl:top-24">
          <div className="space-y-4">
            <div>
              <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("workspaceTitle")}
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">
                {t("actionsTitle")}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {studentId
                  ? t("actionsDescription")
                  : t("noStudentActionDescription")}
              </p>
            </div>

            <div className={cn(reportSurfaceClassName, "p-4")}>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-navy-100 text-navy-700 dark:bg-navy-900 dark:text-navy-200">
                  <FileText className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("generate")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("pdfSubtitle")}
                  </p>
                </div>
              </div>

              <Button
                className="mt-4 h-12 w-full justify-center"
                icon={<FileText className="size-4" />}
                loading={generatingPdf}
                onClick={handleGeneratePdf}
                disabled={!studentId || !hasReportData}
              >
                {t("generate")}
              </Button>
            </div>

            {canSendEmail ? (
              <div className="rounded-[12px] border border-border/70 bg-background/75 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-gold-100 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300">
                    <Mail className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {t("emailTitle")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("emailDescription")}
                    </p>
                  </div>
                </div>

                {guardians.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    <FieldShell label={t("emailRecipientLabel")}>
                      <Select
                        value={guardianUserId}
                        onValueChange={setGuardianUserId}
                      >
                        <SelectTrigger
                          aria-label={t("emailRecipientLabel")}
                          className="h-14 rounded-full px-4 pt-5 pb-2 text-left"
                        >
                          <SelectValue placeholder={t("selectGuardianError")} />
                        </SelectTrigger>
                        <SelectContent>
                          {guardians.map((guardian) => (
                            <SelectItem key={guardian.id} value={guardian.id}>
                              {(guardian.guardian.name ??
                                guardian.guardian.email) +
                                " · " +
                                guardian.guardian.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldShell>

                    <Button
                      className="h-12 w-full justify-center"
                      icon={<Send className="size-4" />}
                      loading={sendingEmail}
                      onClick={handleSendEmail}
                      disabled={!studentId || !hasReportData || !guardianUserId}
                    >
                      {t("emailButton")}
                    </Button>
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {t("noGuardiansEmail")}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </BioPanel>
      </div>
    </PageScaffold>
  );
}

function SelectedStudentCard({
  student,
}: {
  student: StudentOption | undefined;
}) {
  return (
    <div className="flex min-h-[64px] w-full items-center rounded-[12px] border border-input/80 bg-card/95 px-4 py-3 shadow-sm">
      <div className="flex w-full items-center gap-3">
        {student ? (
          <StudentIdentity
            student={student}
            subtitle={student.className ?? "-"}
            size="sm"
            className="w-full"
            subtitleClassName="mt-0.5"
          />
        ) : (
          <>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-600 dark:bg-navy-900 dark:text-navy-300">
              <User className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                -
              </p>
              <p className="truncate text-xs text-muted-foreground">-</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HealthInsightPanel({
  insight,
  t,
}: {
  insight: HealthInsight;
  t: (key: string) => string;
}) {
  const toneClassName =
    insight.tone === "success"
      ? "border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
      : insight.tone === "danger"
        ? "border-red-200 bg-red-50/70 text-red-950 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100"
        : "border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100";

  return (
    <div className={`rounded-[12px] border p-5 ${toneClassName}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-white/70 text-current shadow-sm dark:bg-white/10">
            <Dumbbell className="size-5" />
          </div>
          <div>
            <p className="text-tiny font-semibold uppercase tracking-[0.16em] opacity-70">
              {t("healthInsightSection")}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
              {insight.headline}
            </h3>
          </div>
        </div>
        <Badge variant={insight.badgeVariant} size="md">
          {insight.label}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[12px] border border-white/60 bg-white/58 p-4 text-sm leading-relaxed text-current dark:border-white/10 dark:bg-white/8">
          <p className="font-semibold">{t("healthCurrentReading")}</p>
          <p className="mt-2 opacity-80">{insight.summary}</p>
        </div>
        <div className="rounded-[12px] border border-white/60 bg-white/58 p-4 text-sm leading-relaxed text-current dark:border-white/10 dark:bg-white/8">
          <p className="font-semibold">
            {insight.status === "normal"
              ? t("healthMaintainTitle")
              : t("healthImproveTitle")}
          </p>
          <p className="mt-2 opacity-80">
            {insight.status === "normal"
              ? insight.maintain
              : insight.improvement}
          </p>
        </div>
      </div>

      {insight.exercises.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold">{t("recommendedExercises")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {insight.exercises.map((exercise) => (
              <span
                key={exercise}
                className="rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-sm font-medium text-current dark:border-white/10 dark:bg-white/10"
              >
                {exercise}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReportMetricCard({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[132px] flex-col rounded-[12px] border border-border/70 bg-background/70 p-4">
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        <p className="text-tiny font-semibold uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {badge ? <div className="mt-auto pt-3">{badge}</div> : null}
    </div>
  );
}

function ReportStatusCard({
  icon: Icon,
  title,
  description,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  detail: string;
}) {
  return (
    <div className="rounded-[12px] border border-border/70 bg-background/58 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-surface-utility text-foreground shadow-sm">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="break-words text-tiny font-medium uppercase tracking-[0.14em] text-navy-700 dark:text-navy-200">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportTestRow({
  label,
  value,
  unit,
  date,
}: {
  label: string;
  value: string;
  unit: string;
  date: string | null;
}) {
  return (
    <div className="rounded-[12px] border border-border/70 bg-background/68 px-4 py-3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-tiny uppercase tracking-[0.16em] text-muted-foreground">
            {date ?? "-"}
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-lg font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{unit || "-"}</p>
        </div>
      </div>
    </div>
  );
}

function ReportEmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[12px] border border-dashed border-border/80 bg-background/55 px-6 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-[12px] bg-surface-utility text-foreground shadow-sm">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function ReportEmptySteps({
  title,
  description,
  steps,
}: {
  title: string;
  description: string;
  steps: string[];
}) {
  return (
    <div className="rounded-[12px] border border-dashed border-border/80 bg-background/50 px-5 py-6">
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[12px] bg-surface-utility text-foreground shadow-sm">
          <FileCheck2 className="size-5" />
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-[-0.04em] text-foreground">
            {title}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step}
            className="rounded-[12px] border border-border/70 bg-background/75 p-4"
          >
            <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              0{index + 1}
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InlineStatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "success" | "warning" | "info";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-[12px] border border-border bg-background/70 px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <Badge variant={tone === "default" ? "default" : tone} className="w-fit">
        {value}
      </Badge>
    </div>
  );
}
