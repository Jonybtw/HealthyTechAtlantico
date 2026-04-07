"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Activity,
  CheckCircle2,
  Download,
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
import { EmptyState } from "@/components/ui/empty-state";
import { FieldShell } from "@/components/ui/field-shell";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Skeleton } from "@/components/ui/skeleton";
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

type PdfColor = [number, number, number];

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
        ? "—"
        : String(raw.valueText),
    unit: raw.unit ?? "",
    date: raw.date ?? raw.createdAt ?? null,
  };
}

function formatNumber(value: number | null, digits = 1) {
  return typeof value === "number" ? value.toFixed(digits) : "—";
}

function getPdfImcState(
  imc: number | null,
  t: (key: string) => string,
): { label: string; color: PdfColor; badgeVariant: "success" | "warning" | "danger" } {
  if (imc === null) {
    return { label: "—", color: [95, 109, 123], badgeVariant: "warning" };
  }

  if (imc < 18.5) {
    return { label: t("lowWeight"), color: [245, 158, 11], badgeVariant: "warning" };
  }

  if (imc < 25) {
    return { label: t("normal"), color: [16, 185, 129], badgeVariant: "success" };
  }

  if (imc < 30) {
    return { label: t("overweight"), color: [245, 158, 11], badgeVariant: "warning" };
  }

  return { label: t("obesity"), color: [239, 68, 68], badgeVariant: "danger" };
}

export default function RelatorioClient() {
  const t = useTranslations("relatorio");
  const common = useTranslations("common");
  const protocolos = useTranslations("protocolos");
  const locale = useLocale();
  const { role } = useUser();

  const canViewReports =
    role === "ADMIN" ||
    role === "PROFESSOR" ||
    role === "ALUNO" ||
    role === "PAIS";
  const canSendEmail = role === "ADMIN" || role === "PROFESSOR";

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

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);

    if (!canViewReports) {
      setStudents([]);
      setStudentId(null);
      setLoadingStudents(false);
      return;
    }

    try {
      const response = await fetch("/api/students?limit=500");

      if (!response.ok) {
        throw new Error(common("studentListLoadError"));
      }

      const body = await readApiResponse<{ students: StudentOption[] }>(response);
      setStudents(body.students);

      if (role === "ALUNO" && body.students.length === 1) {
        setStudentId(body.students[0].id);
      }
    } catch {
      toast.error(common("studentListLoadError"));
      setStudents([]);
      setStudentId(null);
    } finally {
      setLoadingStudents(false);
    }
  }, [canViewReports, common, role]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (!canViewReports || !studentId) {
      setBioData([]);
      setTestData([]);
      setGuardians([]);
      setGuardianUserId("");
      return;
    }

    let active = true;

    setLoadingPreview(true);

    Promise.all([
      fetch(`/api/students/${studentId}/biometrics`)
        .then((response) => readApiResponse<RawBiometricEntry[]>(response))
        .then((entries) => entries.map(normalizeBiometricEntry))
        .catch(() => []),
      fetch(`/api/students/${studentId}/tests?latest=true`)
        .then((response) => readApiResponse<RawTestEntry[]>(response))
        .then((entries) => entries.map(normalizeTestEntry))
        .catch(() => []),
    ])
      .then(([biometrics, tests]) => {
        if (!active) {
          return;
        }

        setBioData(biometrics);
        setTestData(tests);
      })
      .finally(() => {
        if (active) {
          setLoadingPreview(false);
        }
      });

    return () => {
      active = false;
    };
  }, [canViewReports, studentId]);

  useEffect(() => {
    if (!canSendEmail || !studentId) {
      setGuardians([]);
      setGuardianUserId("");
      return;
    }

    let active = true;

    fetch(`/api/students/${studentId}/guardians`)
      .then((response) => readApiResponse<GuardianOption[]>(response))
      .catch(() => [])
      .then((items) => {
        if (!active) {
          return;
        }

        setGuardians(items);
        setGuardianUserId((current) =>
          current && items.some((guardian) => guardian.id === current)
            ? current
            : (items[0]?.id ?? ""),
        );
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setGuardians([]);
        setGuardianUserId("");
      });

    return () => {
      active = false;
    };
  }, [canSendEmail, studentId]);

  const selectedStudent = students.find((student) => student.id === studentId);
  const latestBiometric = bioData[0] ?? null;
  const latestTestsDate = testData[0]?.date ?? null;
  const hasReportData = bioData.length > 0 || testData.length > 0;
  const imcState = getPdfImcState(latestBiometric?.imc ?? null, t);

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
          <div style="font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; color: #5f6d7b; margin-bottom: 12px;">HealthyTech Atlantico</div>
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">${t("generating")}</div>
          <div style="font-size: 14px; color: #5f6d7b;">${t("pdfSubtitle")}</div>
        </div>
      </div>
    `;

    setGeneratingPdf(true);

    try {
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

      if (biometrics.length === 0 && tests.length === 0) {
        toast.error(t("noData"));
        return;
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
        const logoResponse = await fetch("/logo.png");
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
      doc.text("HEALTHYTECH ATLANTICO", headerTextX, 17);

      text(foreground);
      doc.setFontSize(16);
      doc.text(t("previewHeader"), headerTextX, 24);

      text(mutedForeground);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `${locale === "en" ? "Issued on" : "Emitido em"} ${new Intl.DateTimeFormat(locale, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(new Date())}`,
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
      doc.text(selectedStudent?.name ?? "—", 30, y + 2);

      text(mutedForeground);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        selectedStudent?.className
          ? `${locale === "en" ? "Class" : "Turma"} ${selectedStudent.className}`
          : locale === "en"
            ? "Student"
            : "Aluno",
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
              entry.heightM === null ? "-" : `${formatNumber(entry.heightM, 2)} m`,
            badge: null,
          },
          {
            label: t("weightLabel"),
            value:
              entry.weightKg === null ? "-" : `${formatNumber(entry.weightKg, 1)} kg`,
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
              entry.waistCm === null ? "-" : `${formatNumber(entry.waistCm, 1)} cm`,
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

      fill(footerBackground);
      doc.rect(0, height - 16, width, 16, "F");
      fill(brand);
      doc.rect(0, height - 16, width, 1.5, "F");
      text([236, 230, 218]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(
        locale === "en"
          ? "HealthyTech Atlantico · Document generated automatically"
          : "HealthyTech Atlantico · Documento gerado automaticamente",
        width / 2,
        height - 7.5,
        { align: "center" },
      );

      const blob = doc.output("blob");
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
      const response = await fetch(`/api/students/${studentId}/reports/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianUserId }),
      });

      await readApiResponse(response);
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
          eyebrow: "ALUNOS · RELATORIOS",
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
          eyebrow: "ALUNOS · RELATORIOS",
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
      headerProps={{
        title: t("title"),
        description: t("description"),
        eyebrow: "ALUNOS · RELATORIOS",
      }}
    >
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.08fr)_360px]">
        <div className="space-y-5">
          <PageSection
            eyebrow={t("workspaceEyebrow")}
            title={t("workspaceTitle")}
            description={t("workspaceDescription")}
            tone="primary"
            layout="analytics"
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_280px]">
              <div className="space-y-4">
                <FieldShell
                  label={t("studentSelectionLabel")}
                  hint={role !== "ALUNO" ? t("studentSelectionHint") : undefined}
                >
                  {role !== "ALUNO" ? (
                    <StudentPicker
                      students={students}
                      value={studentId}
                      onChange={setStudentId}
                      loading={loadingStudents}
                    />
                  ) : (
                    <SelectedStudentCard student={selectedStudent} />
                  )}
                </FieldShell>

                {studentId && selectedStudent ? (
                  <div className="rounded-[30px] border border-white/28 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(246,240,231,0.94))] p-5 shadow-card">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span
                          className="flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                          style={getStudentSwatch(selectedStudent)}
                        >
                          {getInitials(selectedStudent.name)}
                        </span>
                        <div className="space-y-1">
                          <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {t("previewHeader")}
                          </p>
                          <h3 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground">
                            {selectedStudent.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {selectedStudent.className
                              ? selectedStudent.className
                              : t("description")}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={hasReportData ? "success" : "warning"}
                        size="md"
                      >
                        {hasReportData
                          ? t("readyToGenerateTitle")
                          : t("documentIncludesTitle")}
                      </Badge>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
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

              <div className="rounded-[28px] border border-navy-900/90 bg-[linear-gradient(160deg,rgba(9,21,35,0.98),rgba(20,38,57,0.94))] p-5 text-white shadow-card">
                <p className="text-tiny font-semibold uppercase tracking-[0.2em] text-gold-200/82">
                  {t("documentIncludesTitle")}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-white">
                  {studentId ? t("readyToGenerateTitle") : t("previewInstruction")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {studentId
                    ? t("documentIncludesDescription")
                    : t("documentEmptyDescription")}
                </p>

                <div className="mt-5 space-y-3">
                  <InlineStatusRow
                    label={t("biometricsSection")}
                    value={bioData.length > 0 ? t("includedInPdf") : biometricsStatus}
                    tone={bioData.length > 0 ? "success" : "warning"}
                  />
                  <InlineStatusRow
                    label={t("testsSection")}
                    value={testData.length > 0 ? t("includedInPdf") : testsStatus}
                    tone={testData.length > 0 ? "success" : "warning"}
                  />
                  <InlineStatusRow
                    label={t("emailTitle")}
                    value={recipientStatus}
                    tone={guardians.length > 0 ? "info" : "default"}
                  />
                </div>
              </div>
            </div>
          </PageSection>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <PageSection
              eyebrow={t("biometricsSection")}
              title={t("latestBiometricsTitle")}
              description={t("latestBiometricsDescription")}
              tone="secondary"
            >
              {loadingPreview && studentId ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[1, 2, 3, 4].map((item) => (
                    <Skeleton key={item} className="h-24 rounded-2xl" />
                  ))}
                </div>
              ) : latestBiometric ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

                  <div className="rounded-2xl border border-border/70 bg-background/65 px-4 py-3">
                    <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {t("includedInPdf")}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {previewMeta.biometrics}
                    </p>
                  </div>
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
            </PageSection>

            <PageSection
              eyebrow={t("testsSection")}
              title={t("latestTestsTitle")}
              description={t("latestTestsDescription")}
              tone="secondary"
            >
              {loadingPreview && studentId ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <Skeleton key={item} className="h-20 rounded-2xl" />
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
                    studentId ? t("noTestsSelectedTitle") : t("documentEmptyTitle")
                  }
                  description={
                    studentId
                      ? t("noTestsSelectedDescription")
                      : t("documentEmptyDescription")
                  }
                />
              )}
            </PageSection>
          </div>
        </div>

        <PageSection
          eyebrow={t("actionsEyebrow")}
          title={t("actionsTitle")}
          description={
            studentId ? t("actionsDescription") : t("noStudentActionDescription")
          }
          tone="secondary"
          className="xl:sticky xl:top-24"
        >
          <div className="space-y-4">
            <div className="rounded-[26px] border border-white/24 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(246,240,231,0.9))] p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-navy-100 text-navy-700 dark:bg-navy-900 dark:text-navy-200">
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
              <div className="rounded-[26px] border border-border/70 bg-background/75 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-gold-700 dark:bg-gold-500/10 dark:text-gold-300">
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

            <div className="rounded-[26px] border border-border/70 bg-background/70 p-4">
              <p className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("studentSelectionLabel")}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {selectedStudent?.name ?? t("previewInstruction")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedStudent?.className ?? t("noStudentActionDescription")}
              </p>
              {selectedStudent ? (
                <div className="mt-4">
                  <Badge variant={hasReportData ? "success" : "warning"} size="md">
                    {hasReportData
                      ? t("readyToGenerateTitle")
                      : t("documentIncludesTitle")}
                  </Badge>
                </div>
              ) : null}
            </div>
          </div>
        </PageSection>
      </div>
    </PageScaffold>
  );
}

function SelectedStudentCard({ student }: { student: StudentOption | undefined }) {
  return (
    <div className="flex h-[46px] w-full items-center justify-between rounded-2xl border border-input bg-card px-4 shadow-sm">
      <div className="flex w-full items-center gap-2.5">
        {student ? (
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-tiny font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
            style={getStudentSwatch(student)}
          >
            {getInitials(student.name)}
          </span>
        ) : (
          <div className="flex size-7 items-center justify-center rounded-full bg-navy-100 text-navy-600 dark:bg-navy-900 dark:text-navy-300">
            <User className="size-4" />
          </div>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {student?.name ?? "-"}
          </span>
          <span className="block truncate text-micro text-muted-foreground">
            {student?.className ?? "-"}
          </span>
        </span>
      </div>
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
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <p className="text-tiny font-semibold uppercase tracking-[0.16em]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">
        {value}
      </p>
      {badge ? <div className="mt-3">{badge}</div> : null}
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
    <div className="rounded-2xl border border-border/70 bg-background/58 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-navy-700 shadow-sm dark:bg-navy-900 dark:text-navy-200">
          <Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-tiny font-medium uppercase tracking-[0.14em] text-navy-700 dark:text-navy-200">
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
    <div className="rounded-2xl border border-border/70 bg-background/68 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-tiny uppercase tracking-[0.16em] text-muted-foreground">
            {date ?? "-"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tracking-[-0.03em] text-foreground">
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
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border/80 bg-background/55 px-6 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-white/88 text-muted-foreground shadow-sm dark:bg-navy-900 dark:text-navy-200">
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
    <div className="rounded-[30px] border border-dashed border-border/80 bg-background/50 px-5 py-6">
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-navy-700 shadow-sm dark:bg-navy-900 dark:text-navy-200">
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
            className="rounded-2xl border border-border/70 bg-background/75 p-4"
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
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
      <span className="text-sm text-white/78">{label}</span>
      <Badge variant={tone === "default" ? "default" : tone}>{value}</Badge>
    </div>
  );
}
