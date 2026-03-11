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
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

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
      const body = await res.json();
      setStudents(
        body.students.map((s: { id: string; name: string; className?: string | null }) => ({
          id: s.id,
          name: s.name,
          className: s.className ?? null,
        }))
      );
      if (role === "ALUNO" && body.students.length === 1) {
        setStudentId(body.students[0].id);
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
      fetch(`/api/students/${studentId}/biometrics`).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch(`/api/students/${studentId}/tests?latest=true`).then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([bio, tests]) => {
        setBioData(Array.isArray(bio) ? bio : []);
        setTestData(Array.isArray(tests) ? tests : []);
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
      .then(async (response) => {
        if (!response.ok) return [];
        return (await response.json()) as GuardianOption[];
      })
      .then((data) => {
        if (!active) return;
        setGuardians(Array.isArray(data) ? data : []);
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
      toast.error("Selecione um aluno.");
      return;
    }
    setGeneratingPdf(true);
    try {
      const [bio, tests] = await Promise.all([
        fetch(`/api/students/${studentId}/biometrics`).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch(`/api/students/${studentId}/tests?latest=true`).then((r) =>
          r.ok ? r.json() : []
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
      const gold600 = [147, 110, 15] as [number, number, number];
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

      // ── Header ──────────────────────────────────────────────────
      fill(navy950); doc.rect(0, 0, W, 42, "F");
      // Subtle gold glow top-left
      fill([30, 55, 85]); doc.roundedRect(-10, -10, 80, 55, 8, 8, "F");
      // Gold accent line
      fill(gold400); doc.rect(0, 42, W, 2.5, "F");

      // Logo
      try {
        const logoImg = new window.Image();
        logoImg.src = "/logo.png";
        await new Promise((res, rej) => { logoImg.onload = res; logoImg.onerror = rej; });
        doc.addImage(logoImg, "PNG", 14, 9, 36, 9.26);
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
      toast.error("Selecione um aluno.");
      return;
    }
    if (!guardianUserId) {
      toast.error("Selecione um encarregado.");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/students/${studentId}/reports/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianUserId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erro ao enviar e-mail.");
        return;
      }
      toast.success("Relatório enviado por e-mail!");
    } catch {
      toast.error("Erro de ligação.");
    } finally {
      setSendingEmail(false);
    }
  };

  /* ── IMC classification helper ── */
  const imcLabel = (imc?: number) => {
    if (!imc) return null;
    if (imc < 18.5) return { text: "Baixo peso", color: "text-gold-500" };
    if (imc < 25) return { text: "Normal", color: "text-success-600" };
    if (imc < 30) return { text: "Excesso de peso", color: "text-gold-500" };
    return { text: "Obesidade", color: "text-danger-500" };
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
      <div className="flex flex-col gap-5 max-w-4xl">
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState
          icon={Link2}
          title="Perfil não associado"
          description="A tua conta ainda não está associada a um perfil de aluno. Contacta a escola para concluírem a ligação."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <PageHeader title={t("title")} description={t("description")} />

      {/* Document preview card */}
      <div className="bg-card rounded-2xl border border-border shadow-card">
        {/* Card header — mimics PDF header */}
        <div className="bg-navy-800 rounded-t-2xl px-6 py-5 border-b-[3px] border-gold-400">
          <p className="text-navy-200 text-xs font-medium uppercase tracking-wider">Relatório Individual</p>
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
                <h3 className="text-sm font-semibold text-foreground">Biometria</h3>
              </div>
              {loadingPreview ? (
                <div className="flex gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex-1 h-16 bg-muted rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : bio0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      icon: <Ruler className="size-3.5" />,
                      label: "Altura",
                      value: bio0.heightM ? `${bio0.heightM} m` : "—",
                    },
                    {
                      icon: <Weight className="size-3.5" />,
                      label: "Peso",
                      value: bio0.weightKg ? `${bio0.weightKg} kg` : "—",
                    },
                    {
                      icon: <Activity className="size-3.5" />,
                      label: "IMC",
                      value: bio0.imc ? `${bio0.imc}` : "—",
                      extra: classification ? (
                        <span className={`text-[10px] font-medium ${classification.color}`}>
                          {classification.text}
                        </span>
                      ) : null,
                    },
                    {
                      icon: <ChevronRight className="size-3.5" />,
                      label: "Cin. (cm)",
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
                  Sem dados de biometria registados.
                </p>
              )}
            </div>

            {/* Tests preview */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="size-4 text-navy-600 dark:text-navy-300" />
                <h3 className="text-sm font-semibold text-foreground">
                  Testes Físicos
                </h3>
              </div>
              {loadingPreview ? (
                <div className="h-24 bg-muted rounded-xl animate-pulse" />
              ) : testData.length ? (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/60">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Teste
                        </th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Resultado
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
                  Sem dados de testes registados.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 py-10 flex flex-col items-center gap-2 text-center">
            <FileText className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {role !== "ALUNO"
                ? "Selecione um aluno para pré-visualizar o relatório."
                : "A carregar dados…"}
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
                Documento PDF com logo e tabelas
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
                  Enviar por e-mail
                </h3>
                <p className="text-xs text-muted-foreground">
                  Apenas para encarregados associados ao aluno
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
                    Enviar relatório
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este aluno não tem encarregados associados para envio por e-mail.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
