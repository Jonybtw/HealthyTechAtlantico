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

  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
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
        body.students.map((s: { id: string; name: string }) => ({
          id: s.id,
          name: s.name,
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

      const pageW = doc.internal.pageSize.getWidth();

      // ── Header band ──────────────────────────────────────────────
      doc.setFillColor(20, 48, 76); // Azul Escuro
      doc.rect(0, 0, pageW, 36, "F");

      // Add actual logo to PDF
      try {
        const logoImg = new window.Image();
        logoImg.src = "/logo.png";
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
        doc.addImage(logoImg, "PNG", 14, 10, 40, 10.27);
      } catch {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("HealthyTech Atlântico", 14, 18);
      }

      doc.setTextColor(176, 198, 211); // Azul Claro
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("HealthyTech Atlântico — Relatório Individual", 14, 25);

      const today = new Date().toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Emitido em ${today}`, 14, 30);

      // Accent gold line
      doc.setFillColor(194, 151, 13); // Dourado
      doc.rect(0, 36, pageW, 2, "F");

      // ── Student name block ────────────────────────────────────────
      doc.setFillColor(176, 198, 211); // Azul Claro
      doc.rect(0, 38, pageW, 20, "F");
      doc.setTextColor(20, 48, 76); // Azul Escuro
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(selectedStudent?.name ?? "—", 14, 50);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(20, 48, 76); // Azul Escuro
      doc.text("Aluno", 14, 55);

      let y = 68;

      // ── Biometria section ─────────────────────────────────────────
      doc.setTextColor(20, 48, 76); // Azul Escuro
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Biometria", 14, y);
      y += 2;
      doc.setDrawColor(194, 151, 13); // Dourado
      doc.setLineWidth(0.5);
      doc.line(14, y, pageW - 14, y);
      y += 6;

      if (Array.isArray(bio) && bio.length) {
        const b = bio[0] as BiometricEntry;

        // small metric boxes
        const metrics = [
          { label: "Altura", value: b.heightM ? `${b.heightM} m` : "—" },
          { label: "Peso", value: b.weightKg ? `${b.weightKg} kg` : "—" },
          { label: "IMC", value: b.imc ? `${b.imc}` : "—" },
          { label: "Cin. (cm)", value: b.waistCm ? `${b.waistCm}` : "—" },
        ];
        const boxW = (pageW - 28 - 9) / 4;
        metrics.forEach((m, i) => {
          const bx = 14 + i * (boxW + 3);
          doc.setFillColor(176, 198, 211); // Azul Claro
          doc.roundedRect(bx, y, boxW, 16, 2, 2, "F");
          doc.setTextColor(20, 48, 76); // Azul Escuro
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(m.label, bx + 3, y + 6);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(m.value, bx + 3, y + 13);
        });
        y += 22;
      } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(176, 198, 211); // Azul Claro
        doc.text("Sem dados de biometria registados.", 14, y);
        y += 10;
      }

      // ── Testes Físicos section ────────────────────────────────────
      y += 4;
      doc.setTextColor(20, 48, 76); // Azul Escuro
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Testes Físicos", 14, y);
      y += 2;
      doc.setDrawColor(194, 151, 13); // Dourado
      doc.line(14, y, pageW - 14, y);
      y += 6;

      if (Array.isArray(tests) && tests.length) {
        // Table header
        doc.setFillColor(20, 48, 76); // Azul Escuro
        doc.rect(14, y, pageW - 28, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Teste", 16, y + 5.5);
        doc.text("Resultado", pageW - 50, y + 5.5);
        y += 8;

        (tests as TestEntry[]).forEach((test, i) => {
          if (i % 2 === 0) {
            // Using a slightly lighter version of Azul Claro for row striping so text is readable
            // 210, 222, 230 is approx 40% transparent Azul Claro over white
            doc.setFillColor(210, 222, 230);
            doc.rect(14, y, pageW - 28, 7, "F");
          }
          doc.setTextColor(20, 48, 76); // Azul Escuro
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(test.testId, 16, y + 5);
          doc.setFont("helvetica", "bold");
          doc.text(`${test.valueText} ${test.unit}`, pageW - 50, y + 5);
          y += 7;
        });
      } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(176, 198, 211); // Azul Claro
        doc.text("Sem dados de testes registados.", 14, y);
        y += 10;
      }

      // ── Footer ────────────────────────────────────────────────────
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(20, 48, 76); // Azul Escuro
      doc.rect(0, pageH - 14, pageW, 14, "F");
      doc.setTextColor(176, 198, 211); // Azul Claro
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(
        "HealthyTech Atlântico · Documento gerado automaticamente",
        pageW / 2,
        pageH - 5,
        { align: "center" }
      );

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
