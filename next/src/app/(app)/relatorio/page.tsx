"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@/components/user-context";
import { toast } from "sonner";
import {
  FileText,
  Mail,
  Download,
  User,
  Ruler,
  Weight,
  Activity,
  CheckCircle2,
  ChevronRight,
  Send,
  Link2,
} from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { StudentPicker } from "@/components/ui/student-picker";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { usePageTitle } from "@/hooks/use-page-title";
import { readApiResponse } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

type BiometricEntry = {
  heightM?: number;
  weightKg?: number;
  imc?: number;
  waistCm?: number;
  date?: string;
};

type TestEntry = {
  testId: string;
  valueText: string;
  unit: string;
  date?: string;
};

type GuardianOption = {
  id: string;
  guardian: { name: string | null; email: string };
  relationship: string;
};

export default function RelatorioPage() {
  const t = useTranslations("relatorio");
  const common = useTranslations("common");
  usePageTitle(t("title"));
  const { role } = useUser();
  const canViewReports =
    role === "ADMIN" ||
    role === "PROFESSOR" ||
    role === "ALUNO" ||
    role === "PAIS";
  const canSendEmail = role === "ADMIN" || role === "PROFESSOR";

  const [students, setStudents] = useState<{ id: string; name: string; className?: string | null }[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [guardians, setGuardians] = useState<GuardianOption[]>([]);
  const [guardianUserId, setGuardianUserId] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Preview data
  const [bioData, setBioData] = useState<BiometricEntry[]>([]);
  const [testData, setTestData] = useState<TestEntry[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const loadStudents = useCallback(async () => {
    if (!canViewReports) {
      setStudents([]);
      setStudentId(null);
      return;
    }

    const res = await fetch("/api/students?limit=500");
    if (res.ok) {
      const body = await readApiResponse<{
        students: { id: string; name: string; className?: string | null }[];
      }>(res);
      const nextStudents = body.students.map((student) => ({
        id: student.id,
        name: student.name,
        className: student.className ?? null,
      }));

      setStudents(nextStudents);
      if (role === "ALUNO" && nextStudents.length === 1) {
        setStudentId(nextStudents[0].id);
      }
    }
  }, [canViewReports, role]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Load preview data when student changes
  useEffect(() => {
    if (!canViewReports || !studentId) {
      setBioData([]);
      setTestData([]);
      setGuardians([]);
      setGuardianUserId("");
      return;
    }
    setLoadingPreview(true);
    Promise.all([
      fetch(`/api/students/${studentId}/biometrics`)
        .then((response) => readApiResponse<BiometricEntry[]>(response))
        .catch(() => []),
      fetch(`/api/students/${studentId}/tests?latest=true`)
        .then((response) => readApiResponse<TestEntry[]>(response))
        .catch(() => []),
    ])
      .then(([bio, tests]) => {
        setBioData(bio);
        setTestData(tests);
      })
      .finally(() => setLoadingPreview(false));
  }, [canViewReports, studentId]);

  useEffect(() => {
    if (!studentId || !canSendEmail) {
      setGuardians([]);
      setGuardianUserId("");
      return;
    }

    let active = true;

    fetch(`/api/students/${studentId}/guardians`)
      .then((response) => readApiResponse<GuardianOption[]>(response))
      .catch(() => [])
      .then((data) => {
        if (!active) return;
        setGuardians(data);
        setGuardianUserId((current) =>
          current && data.some((guardian) => guardian.id === current)
            ? current
            : data[0]?.id ?? ""
        );
      })
      .catch(() => {
        if (!active) return;
        setGuardians([]);
        setGuardianUserId("");
      });

    return () => {
      active = false;
    };
  }, [canSendEmail, studentId]);

  const selectedStudent = students.find((s) => s.id === studentId);

  /* ── Generate PDF ── */
  const handleGeneratePdf = async () => {
    if (!studentId) {
      toast.error(t("selectStudent"));
      return;
    }
    setGeneratingPdf(true);
    try {
      const [bio, tests] = await Promise.all([
        fetch(`/api/students/${studentId}/biometrics`).then((response) =>
          readApiResponse<BiometricEntry[]>(response)
        ),
        fetch(`/api/students/${studentId}/tests?latest=true`).then((response) =>
          readApiResponse<TestEntry[]>(response)
        ),
      ]);

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const W = doc.internal.pageSize.getWidth();   // 210
      const H = doc.internal.pageSize.getHeight();  // 297

      // ── Colour palette ──────────────────────────────────────────
      const navy950 = [9,  21, 35]  as [number, number, number];
      const navy800 = [20, 48, 76]  as [number, number, number];
      const navy600 = [54, 85, 109] as [number, number, number];
      const navy100 = [221, 231, 240] as [number, number, number];
      const gold400 = [216, 173, 52] as [number, number, number];
      const white   = [255, 255, 255] as [number, number, number];
      const green   = [16, 185, 129] as [number, number, number];
      const red     = [239, 68, 68]  as [number, number, number];
      const amber   = [245, 158, 11] as [number, number, number];
      const gray50  = [248, 249, 250] as [number, number, number];
      const gray200 = [226, 232, 240] as [number, number, number];
      const gray600 = [75, 85, 99]    as [number, number, number];

      const fill  = (c: [number,number,number]) => doc.setFillColor(...c);
      const stroke= (c: [number,number,number]) => doc.setDrawColor(...c);
      const text  = (c: [number,number,number]) => doc.setTextColor(...c);
      const addContainedImage = (
        image: HTMLImageElement,
        x: number,
        y: number,
        maxWidth: number,
        maxHeight: number
      ) => {
        const sourceWidth = image.naturalWidth || image.width || maxWidth;
        const sourceHeight = image.naturalHeight || image.height || maxHeight;
        const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
        const width = sourceWidth * scale;
        const height = sourceHeight * scale;
        const offsetX = x + (maxWidth - width) / 2;
        const offsetY = y + (maxHeight - height) / 2;

        doc.addImage(image, "PNG", offsetX, offsetY, width, height, undefined, "FAST");
      };

      // ── Header ──────────────────────────────────────────────────
      fill(navy950); doc.rect(0, 0, W, 42, "F");
      // Subtle gold glow top-left
      fill([30, 55, 85]); doc.roundedRect(-10, -10, 80, 55, 8, 8, "F");
      // Gold accent line
      fill(gold400); doc.rect(0, 42, W, 2.5, "F");

      // Logo
      const logoCard = { x: 14, y: 8, width: 18, height: 18 };
      fill(white); doc.roundedRect(logoCard.x, logoCard.y, logoCard.width, logoCard.height, 4, 4, "F");
      fill(gray50); doc.roundedRect(logoCard.x + 0.8, logoCard.y + 0.8, logoCard.width - 1.6, logoCard.height - 1.6, 3.2, 3.2, "F");
      try {
        const logoImg = new window.Image();
        logoImg.decoding = "async";
        logoImg.src = "/logo.png";
        await new Promise((res, rej) => { logoImg.onload = res; logoImg.onerror = rej; });
        addContainedImage(logoImg, logoCard.x + 2, logoCard.y + 2, logoCard.width - 4, logoCard.height - 4);
      } catch { /* skip */ }

      // Title + date
      text([200, 215, 230]);
      doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text("HealthyTech Atlântico  ·  Relatório Individual", 14, 29);
      const today = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
      text([150, 170, 190]);
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text(`Emitido em ${today}`, 14, 36);

      // Page number placeholder
      text([120, 145, 165]);
      doc.setFontSize(7);
      doc.text("1 / 1", W - 14, 36, { align: "right" });

      // ── Student banner ───────────────────────────────────────────
      fill(navy100); doc.rect(0, 44.5, W, 22, "F");
      // student initial circle
      fill(navy800); doc.circle(14 + 8, 44.5 + 11, 8, "F");
      const initials = (selectedStudent?.name ?? "?")
        .split(" ").map((p) => p[0]).filter(Boolean).slice(0,2).join("").toUpperCase();
      text(white);
      doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text(initials, 14 + 8, 44.5 + 13.5, { align: "center" });

      text(navy800);
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text(selectedStudent?.name ?? "—", 33, 52.5);
      text(navy600);
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      const studentMeta = [
        selectedStudent?.className ? `Turma ${selectedStudent.className}` : null,
      ].filter(Boolean).join("  ·  ") || "Aluno";
      doc.text(studentMeta, 33, 58);

      let y = 76;

      // ── Section helper ───────────────────────────────────────────
      const section = (title: string, iconLabel: string) => {
        text(navy800);
        doc.setFontSize(10); doc.setFont("helvetica", "bold");
        doc.text(iconLabel + "  " + title, 14, y);
        y += 1.5;
        stroke(gold400); doc.setLineWidth(0.6);
        doc.line(14, y, W - 14, y);
        y += 6;
      };

      // ── Biometria ─────────────────────────────────────────────────
      section("Biometria", "◉");

      if (Array.isArray(bio) && bio.length) {
        const b = bio[0] as BiometricEntry;

        // IMC zone
        const imc = b.imc ?? 0;
        let imcZoneColor = green;
        let imcZoneLabel = "Normal";
        if (imc < 18.5) { imcZoneColor = amber; imcZoneLabel = "Baixo peso"; }
        else if (imc >= 25 && imc < 30) { imcZoneColor = amber; imcZoneLabel = "Excesso de peso"; }
        else if (imc >= 30) { imcZoneColor = red; imcZoneLabel = "Obesidade"; }

        const metrics = [
          { label: "Altura", value: b.heightM ? `${b.heightM} m` : "—", badge: null },
          { label: "Peso",   value: b.weightKg ? `${b.weightKg} kg` : "—", badge: null },
          { label: "IMC",    value: b.imc ? String(b.imc) : "—", badge: { label: imcZoneLabel, color: imcZoneColor } },
          { label: "Cintura", value: b.waistCm ? `${b.waistCm} cm` : "—", badge: null },
        ];

        const boxW = (W - 28 - 9) / 4;
        metrics.forEach((m, i) => {
          const bx = 14 + i * (boxW + 3);
          // Card shadow simulation
          fill([210, 220, 228]); doc.roundedRect(bx + 0.5, y + 0.8, boxW, 20, 3, 3, "F");
          fill(white);          doc.roundedRect(bx, y, boxW, 20, 3, 3, "F");
          // Top accent line
          fill(navy800); doc.roundedRect(bx, y, boxW, 2, 3, 3, "F");
          fill(navy800); doc.rect(bx, y + 0.5, boxW, 1.5, "F");

          text(gray600);
          doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
          doc.text(m.label.toUpperCase(), bx + 4, y + 7);

          text(navy950);
          doc.setFontSize(12); doc.setFont("helvetica", "bold");
          doc.text(m.value, bx + 4, y + 14);

          if (m.badge) {
            fill(m.badge.color); doc.roundedRect(bx + 4, y + 15.5, boxW - 8, 3.2, 1, 1, "F");
            text(white); doc.setFontSize(5.5); doc.setFont("helvetica", "bold");
            doc.text(m.badge.label, bx + boxW / 2, y + 17.8, { align: "center" });
          }
        });
        y += 26;
      } else {
        fill(gray50); doc.roundedRect(14, y, W - 28, 10, 2, 2, "F");
        text(gray600); doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text("Sem dados de biometria registados.", 14 + (W - 28) / 2, y + 6.5, { align: "center" });
        y += 16;
      }

      // ── Testes Físicos ────────────────────────────────────────────
      y += 6;
      section("Testes Físicos", "▶");

      const TEST_LABELS: Record<string, string> = {
        vai: "Vai e Vem", cooper: "Cooper", milha: "Milha 1609m",
        velocidade: "Velocidade 40m", agilidade: "Agilidade 4×10m",
        abd: "Abdominais", abdominais: "Abdominais",
        bracos: "Extensões de braços", extensoes: "Extensões de braços",
        senta: "Senta e alcança", senta_alcanca: "Senta e alcança",
        vaivem: "Vai e Vem",
      };

      if (Array.isArray(tests) && tests.length) {
        // Table header
        const rowH = 8;
        fill(navy800); doc.roundedRect(14, y, W - 28, rowH + 1, 3, 3, "F");
        fill(navy800); doc.rect(14, y + 3, W - 28, rowH - 2, "F"); // square bottom
        text(white);
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
        doc.text("Teste", 20, y + 5.8);
        doc.text("Categoria", W / 2 - 10, y + 5.8);
        doc.text("Resultado", W - 20, y + 5.8, { align: "right" });
        y += rowH + 1;

        const CATEGORIES: Record<string, string> = {
          vai: "Capacidade Aeróbia", cooper: "Capacidade Aeróbia", milha: "Capacidade Aeróbia",
          vaivem: "Capacidade Aeróbia",
          velocidade: "Velocidade", agilidade: "Agilidade",
          abd: "Força", abdominais: "Força", bracos: "Força", extensoes: "Força",
          senta: "Flexibilidade", senta_alcanca: "Flexibilidade",
        };

        (tests as TestEntry[]).forEach((test, i) => {
          const isEven = i % 2 === 0;
          fill(isEven ? white : gray50);
          doc.rect(14, y, W - 28, rowH, "F");

          const label = TEST_LABELS[test.testId] ?? test.testId;
          const cat   = CATEGORIES[test.testId] ?? "—";
          const result= `${test.valueText} ${test.unit}`.trim();

          // Category pill
          fill(navy100); doc.roundedRect(W / 2 - 22, y + 1.5, 44, 5, 2, 2, "F");
          text(navy800); doc.setFontSize(6); doc.setFont("helvetica", "normal");
          doc.text(cat, W / 2, y + 5.3, { align: "center" });

          text(navy950); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
          doc.text(label, 20, y + 5.5);
          doc.setFont("helvetica", "bold");
          doc.text(result, W - 20, y + 5.5, { align: "right" });

          // Bottom border
          stroke(gray200); doc.setLineWidth(0.2);
          doc.line(14, y + rowH, W - 14, y + rowH);

          y += rowH;
        });

        // Table bottom radius cap
        fill(navy100); doc.rect(14, y, W - 28, 0.5, "F");
        y += 8;
      } else {
        fill(gray50); doc.roundedRect(14, y, W - 28, 10, 2, 2, "F");
        text(gray600); doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text("Sem dados de testes registados.", 14 + (W - 28) / 2, y + 6.5, { align: "center" });
        y += 16;
      }

      // ── Footer ────────────────────────────────────────────────────
      fill(navy950); doc.rect(0, H - 16, W, 16, "F");
      fill(gold400); doc.rect(0, H - 16, W, 1.5, "F");
      text([120, 145, 165]); doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
      doc.text("HealthyTech Atlântico  ·  Documento gerado automaticamente", W / 2, H - 7.5, { align: "center" });
      text(gold400); doc.setFontSize(6); doc.setFont("helvetica", "bold");
      doc.text("CONFIDENCIAL — USO INTERNO", W / 2, H - 3.5, { align: "center" });

      doc.save(
        `relatorio_${selectedStudent?.name?.replace(/\s+/g, "_") ?? "aluno"}.pdf`
      );
      toast.success(t("success"));
    } catch {
      toast.error(t("noData"));
    } finally {
      setGeneratingPdf(false);
    }
  };

  /* ── Send by email ── */
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
      const res = await fetch(`/api/students/${studentId}/reports/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianUserId }),
      });
      await readApiResponse(res);
      toast.success(t("emailSuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("connectionError"));
    } finally {
      setSendingEmail(false);
    }
  };

  /* ── IMC classification helper ── */
  const imcLabel = (imc?: number) => {
    if (!imc) return null;
    if (imc < 18.5) return { text: t("lowWeight"), color: "text-gold-500" };
    if (imc < 25) return { text: t("normal"), color: "text-success-600" };
    if (imc < 30) return { text: t("overweight"), color: "text-gold-500" };
    return { text: t("obesity"), color: "text-danger-500" };
  };

  const bio0 = bioData[0] as BiometricEntry | undefined;
  const classification = imcLabel(bio0?.imc);

  if (!canViewReports) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">{common("noPermission")}</p>
      </div>
    );
  }

  if (role === "ALUNO" && students.length === 0) {
    return (
      <PageScaffold
        className="max-w-4xl"
        headerProps={{ title: t("title"), description: t("description") }}
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
      className="max-w-4xl"
      headerProps={{ title: t("title"), description: t("description") }}
    >

      {/* Document preview card */}
      <div className="bg-card rounded-2xl border border-border shadow-card">
        {/* Card header \u2014 mimics PDF header */}
        <div className="bg-navy-800 rounded-t-2xl px-6 py-5 border-b-[3px] border-gold-400">
          <p className="text-navy-200 text-xs font-medium uppercase tracking-wider">{t("previewHeader")}</p>
        </div>

        {/* Student selector */}
        <div className="px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
              <User className="size-4 text-navy-600 dark:text-navy-300" />
            </div>
            <div className="flex-1">
              {role !== "ALUNO" ? (
                <StudentPicker
                  students={students}
                  value={studentId}
                  onChange={setStudentId}
                />
              ) : (
                <span className="text-sm font-semibold text-foreground">
                  {selectedStudent?.name ?? "A carregar…"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Preview sections */}
        {studentId ? (
          <div className="divide-y divide-border">
            {/* Biometrics preview */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="size-4 text-navy-600 dark:text-navy-300" />
                <h3 className="text-sm font-semibold text-foreground">{t("biometricsSection")}</h3>
              </div>
              {loadingPreview ? (
                <div className="flex gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="flex-1 h-16" />
                  ))}
                </div>
              ) : bio0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      icon: <Ruler className="size-3.5" />,
                      label: t("heightLabel"),
                      value: bio0.heightM ? `${bio0.heightM} m` : "—",
                    },
                    {
                      icon: <Weight className="size-3.5" />,
                      label: t("weightLabel"),
                      value: bio0.weightKg ? `${bio0.weightKg} kg` : "—",
                    },
                    {
                      icon: <Activity className="size-3.5" />,
                      label: t("imcLabel"),
                      value: bio0.imc ? `${bio0.imc}` : "—",
                      extra: classification ? (
                        <span className={`text-[10px] font-medium ${classification.color}`}>
                          {classification.text}
                        </span>
                      ) : null,
                    },
                    {
                      icon: <ChevronRight className="size-3.5" />,
                      label: t("waistLabel"),
                      value: bio0.waistCm ? `${bio0.waistCm} cm` : "—",
                    },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="bg-muted rounded-xl px-4 py-3 flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {m.icon}
                        <span className="text-[10px] uppercase tracking-wider font-medium">
                          {m.label}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-foreground leading-none">
                        {m.value}
                      </p>
                      {m.extra}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("noBiometrics")}
                </p>
              )}
            </div>

            {/* Tests preview */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="size-4 text-navy-600 dark:text-navy-300" />
                <h3 className="text-sm font-semibold text-foreground">
                  {t("testsSection")}
                </h3>
              </div>
              {loadingPreview ? (
                <Skeleton className="h-24 w-full" />
              ) : testData.length ? (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/60">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t("testHeader")}
                        </th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t("resultHeader")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {testData.map((test, i) => (
                        <tr
                          key={i}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 text-foreground">
                            {test.testId}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                            {test.valueText}{" "}
                            <span className="font-normal text-muted-foreground text-xs">
                              {test.unit}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("noTests")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 py-8 flex flex-col items-center gap-2 text-center">
            <FileText className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {role !== "ALUNO"
                ? t("previewInstruction")
                : t("loadingData")}
            </p>
          </div>
        )}
      </div>

      {/* Actions row */}
      <div className={`grid gap-4 ${canSendEmail ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
        {/* PDF download */}
        <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-navy-50 dark:bg-navy-900 flex items-center justify-center">
              <Download className="size-5 text-navy-700 dark:text-navy-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("generate")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("pdfSubtitle")}
              </p>
            </div>
          </div>
          <Button
            onClick={handleGeneratePdf}
            loading={generatingPdf}
            icon={<Download className="size-4" />}
            className="w-full justify-center"
          >
            {t("generate")}
          </Button>
        </div>

        {/* Email */}
        {canSendEmail && (
          <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-navy-50 dark:bg-navy-900 flex items-center justify-center">
                <Mail className="size-5 text-navy-700 dark:text-navy-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t("emailTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("emailDescription")}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {guardians.length > 0 ? (
                <>
                  <select
                    value={guardianUserId}
                    onChange={(event) => setGuardianUserId(event.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy-600/30 transition"
                  >
                    {guardians.map((guardian) => (
                      <option key={guardian.id} value={guardian.id}>
                        {(guardian.guardian.name ?? guardian.guardian.email) +
                          " · " +
                          guardian.guardian.email}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleSendEmail}
                    loading={sendingEmail}
                    icon={<Send className="size-4" />}
                    variant="secondary"
                    className="w-full justify-center"
                  >
                    {t("emailButton")}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("noGuardiansEmail")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </PageScaffold>
  );
}
