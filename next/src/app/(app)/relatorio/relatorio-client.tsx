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
  ShieldAlert,
} from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { StudentPicker, getInitials, getStudentSwatch } from "@/components/ui/student-picker";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { readApiResponse } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldShell } from "@/components/ui/field-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [loadingStudents, setLoadingStudents] = useState(true);
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
    setLoadingStudents(true);
    if (!canViewReports) {
      setStudents([]);
      setStudentId(null);
      setLoadingStudents(false);
      return;
    }

    try {
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
      } else {
        toast.error(common("studentListLoadError"));
        setStudents([]);
        setStudentId(null);
      }
    } catch {
      toast.error(common("studentListLoadError"));
      setStudents([]);
      setStudentId(null);
    } finally {
      setLoadingStudents(false);
    }
  }, [canViewReports, role, common]);

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

  /* â”€â”€ Generate PDF â”€â”€ */
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

      // â”€â”€ Colour palette (Matching Site Theme) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const fgFull  = [9, 21, 35] as [number, number, number];      // --foreground (navy-950)
      const fgMuted = [95, 109, 123] as [number, number, number];  // --muted-foreground
      const bgSite  = [244, 241, 234] as [number, number, number];  // --background
      const bgCard  = [255, 255, 255] as [number, number, number];  // --card (white)
      const bgMuted = [236, 230, 218] as [number, number, number];  // --muted
      const brand   = [184, 140, 25] as [number, number, number];
      const navy50 = [238, 242, 255] as [number, number, number];
      const navy600 = [79, 70, 229] as [number, number, number];   // --accent (gold-500)
      const success = [16, 185, 129] as [number, number, number];   // --color-success-500
      const warning = [245, 158, 11] as [number, number, number];   // --color-warning-500
      const danger  = [239, 68, 68] as [number, number, number];    // --color-danger-500
      const border  = [225, 215, 203] as [number, number, number];  // warm gray border

      const fill  = (c: [number,number,number]) => doc.setFillColor(...c);
      const stroke= (c: [number,number,number]) => doc.setDrawColor(...c);
      const text  = (c: [number,number,number]) => doc.setTextColor(...c);

      // Entire page background
      fill(bgSite);
      doc.rect(0, 0, W, H, "F");

      // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      let headerTextX = 14;
      try {
        const logoRes = await fetch("/logo.png");
        const logoBlob = await logoRes.blob();
        const logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(logoBlob);
        });
        
        // Let's get image properties to maintain aspect ratio
        const props = doc.getImageProperties(logoBase64);
        const desiredHeight = 12;
        const scaledWidth = (props.width * desiredHeight) / props.height;
        
        doc.addImage(logoBase64, "PNG", 14, 13, scaledWidth, desiredHeight);
        headerTextX = 14 + scaledWidth + 4;
      } catch {
        // Fallback or ignore
      }

      text(fgMuted);
      doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("HEALTHYTECH ATLÃ‚NTICO", headerTextX, 17);

      text(fgFull);
      doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text("RelatÃ³rio Individual", headerTextX, 24);

      const today = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
      text(fgMuted);
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text(`Emitido em ${today}`, W - 14, 25, { align: "right" });

      stroke(border); doc.setLineWidth(0.3);
      doc.line(14, 32, W - 14, 32);

      // â”€â”€ Student banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      let y = 42;
      fill(bgCard); doc.circle(14 + 6, y + 2, 6, "F");
      stroke(border); doc.setLineWidth(0.3); doc.circle(14 + 6, y + 2, 6, "S");
      const initials = (selectedStudent?.name ?? "?")
        .split(" ").map((p) => p[0]).filter(Boolean).slice(0,2).join("").toUpperCase();
      text(brand);
      doc.setFontSize(7); doc.setFont("helvetica", "bold");
      doc.text(initials, 14 + 6, y + 3.5, { align: "center" });

      text(fgFull);
      doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text(selectedStudent?.name ?? "â€”", 30, y + 2);
      
      text(fgMuted);
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      const studentMeta = [
        selectedStudent?.className ? `Turma ${selectedStudent.className}` : null,
      ].filter(Boolean).join("  Â·  ") || "Aluno";
      doc.text(studentMeta, 30, y + 6);

      y = 60;

      // â”€â”€ Section helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const section = (title: string, subtitle?: string) => {
        text(fgFull);
        doc.setFontSize(10); doc.setFont("helvetica", "bold");
        doc.text(title, 14, y);
        if (subtitle) {
            text(fgMuted);
            doc.setFontSize(8); doc.setFont("helvetica", "normal");
            doc.text(subtitle, 14, y + 4);
            y += 5;
        }
        y += 6;
      };

      // â”€â”€ Biometria â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      section("MÃ©tricas Corporais", "Registos gerais mais recentes.");

      if (Array.isArray(bio) && bio.length) {
        const b = bio[0] as BiometricEntry;

        const imc = b.imc ?? 0;
        let imcZoneColor = success;
        let imcZoneLabel = "Normal";
        if (imc < 18.5) { imcZoneColor = warning; imcZoneLabel = "Baixo peso"; }
        else if (imc >= 25 && imc < 30) { imcZoneColor = warning; imcZoneLabel = "Excesso de peso"; }
        else if (imc >= 30) { imcZoneColor = danger; imcZoneLabel = "Obesidade"; }

        const metrics = [
          { label: "Altura", value: b.heightM ? `${b.heightM} m` : "â€”", badge: null },
          { label: "Peso",   value: b.weightKg ? `${b.weightKg} kg` : "â€”", badge: null },
          { label: "IMC",    value: b.imc ? String(b.imc) : "â€”", badge: { label: imcZoneLabel, color: imcZoneColor } },
          { label: "Cintura", value: b.waistCm ? `${b.waistCm} cm` : "â€”", badge: null },
        ];

        const boxW = (W - 28 - 9) / 4;
        metrics.forEach((m, i) => {
          const bx = 14 + i * (boxW + 3);
          fill(bgCard); doc.roundedRect(bx, y, boxW, 20, 3, 3, "F");
          stroke(border); doc.setLineWidth(0.3); doc.roundedRect(bx, y, boxW, 20, 3, 3, "S");

          text(fgMuted);
          doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
          doc.text(m.label.toUpperCase(), bx + 4, y + 7);

          text(fgFull);
          doc.setFontSize(11); doc.setFont("helvetica", "bold");
          doc.text(m.value, bx + 4, y + 14);

          if (m.badge) {
            text(m.badge.color); doc.setFontSize(6); doc.setFont("helvetica", "bold");
            doc.text(m.badge.label, bx + 4, y + 17.5);
          }
        });
        y += 28;
      } else {
        fill(navy50); doc.roundedRect(14, y, W - 28, 12, 3, 3, "F");
        stroke(border); doc.setLineWidth(0.3); doc.roundedRect(14, y, W - 28, 12, 3, 3, "S");
        text(navy600); doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text("Sem dados de biometria registados.", 14 + (W - 28) / 2, y + 7, { align: "center" });
        y += 20;
      }

      // â”€â”€ Testes FÃ­sicos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      y += 2;
      section("AptidÃ£o FÃ­sica", "Resultados atualizados por categoria.");

      const TEST_LABELS: Record<string, string> = {
        vai: "Vai e Vem", cooper: "Cooper", milha: "Milha 1609m",
        velocidade: "Velocidade 40m", agilidade: "Agilidade 4Ã—10m",
        abd: "Abdominais", abdominais: "Abdominais",
        bracos: "ExtensÃµes de braÃ§os", extensoes: "ExtensÃµes de braÃ§os",
        senta: "Senta e alcanÃ§a", senta_alcanca: "Senta e alcanÃ§a",
        vaivem: "Vai e Vem",
      };

      if (Array.isArray(tests) && tests.length) {
        const rowH = 9;
        
        fill(bgMuted); doc.rect(14, y, W - 28, rowH, "F");
        stroke(border); doc.setLineWidth(0.3); 
        doc.line(14, y, W - 14, y);
        doc.line(14, y + rowH, W - 14, y + rowH);
        
        text(fgFull);
        doc.setFontSize(7); doc.setFont("helvetica", "bold");
        doc.text("TESTE", 18, y + 6);
        doc.text("CATEGORIA", W / 2 - 10, y + 6);
        doc.text("RESULTADO", W - 18, y + 6, { align: "right" });
        y += rowH;

        const CATEGORIES: Record<string, string> = {
          vai: "Capacidade AerÃ³bia", cooper: "Capacidade AerÃ³bia", milha: "Capacidade AerÃ³bia",
          vaivem: "Capacidade AerÃ³bia",
          velocidade: "Velocidade", agilidade: "Agilidade",
          abd: "ForÃ§a", abdominais: "ForÃ§a", bracos: "ForÃ§a", extensoes: "ForÃ§a",
          senta: "Flexibilidade", senta_alcanca: "Flexibilidade",
        };

        (tests as TestEntry[]).forEach((test, i) => {
          const isEven = i % 2 === 0;
          fill(isEven ? bgCard : bgSite);
          doc.rect(14, y, W - 28, rowH, "F");

          const label = TEST_LABELS[test.testId] ?? test.testId;
          const cat   = CATEGORIES[test.testId] ?? "â€”";

          text(fgFull); doc.setFontSize(8); doc.setFont("helvetica", "normal");
          doc.text(label, 18, y + 6);
          
          text(fgMuted);
          doc.text(cat, W / 2 - 10, y + 6);
          
          text(fgFull); doc.setFont("helvetica", "bold");
          const valText = test.valueText;
          const unitText = test.unit.trim();
          doc.text(valText, W - 18 - doc.getTextWidth(" " + unitText), y + 6, { align: "right" });
          
          text(fgMuted); doc.setFont("helvetica", "normal"); doc.setFontSize(7);
          doc.text(" " + unitText, W - 18, y + 6, { align: "right" });

          stroke(border); doc.setLineWidth(0.2);
          doc.line(14, y + rowH, W - 14, y + rowH);

          y += rowH;
        });

        y += 12;
      } else {
        fill(bgCard); doc.roundedRect(14, y, W - 28, 10, 2, 2, "F");
        text(fgMuted); doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text("Sem dados de testes registados.", 14 + (W - 28) / 2, y + 6.5, { align: "center" });
        y += 16;
      }

      // â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      fill(fgFull); doc.rect(0, H - 16, W, 16, "F");
      fill(brand); doc.rect(0, H - 16, W, 1.5, "F");
      text(bgMuted); doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
      doc.text("HealthyTech AtlÃ¢ntico  Â·  Documento gerado automaticamente", W / 2, H - 7.5, { align: "center" });
      text(brand); doc.setFontSize(6); doc.setFont("helvetica", "bold");
      doc.text("CONFIDENCIAL â€” USO INTERNO", W / 2, H - 3.5, { align: "center" });

      // Em vez de baixar o ficheiro para o computador, abrir num separador novo para nÃ£o persistir dados sensÃ­veis
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const previewWindow = window.open("", "_blank", "noopener,noreferrer");
      if (previewWindow) {
        previewWindow.location.href = url;
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = `relatorio-${selectedStudent?.name ?? "hta"}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      // Cleanup para performance
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      
      toast.success(t("success"));
    } catch {
      toast.error(t("noData"));
    } finally {
      setGeneratingPdf(false);
    }
  };

  /* â”€â”€ Send by email â”€â”€ */
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

  /* â”€â”€ IMC classification helper â”€â”€ */
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
      <PageScaffold headerProps={{ title: t("title"), description: t("description"), eyebrow: "ALUNOS · RELATÓRIOS" }}>
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
        className="max-w-4xl"
        headerProps={{ title: t("title"), description: t("description"), eyebrow: "ALUNOS · RELATÓRIOS" }}
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
      headerProps={{ title: t("title"), description: t("description"), eyebrow: "ALUNOS · RELATÓRIOS" }}
    >

      {/* Document preview card */}
      <div className="surface-secondary rounded-[20px] border border-border/50 shadow-card overflow-hidden">
        {/* Student selector */}
        <div className="px-6 py-4 border-b border-border bg-card/60">
          {role !== "ALUNO" ? (
            <StudentPicker
              students={students}
              value={studentId}
              onChange={setStudentId}
              loading={loadingStudents}
            />
          ) : (
            <div className="flex h-[46px] w-full items-center justify-between rounded-[18px] border border-input px-4 text-left shadow-sm bg-background">
              <div className="flex w-full items-center gap-2.5">
                {selectedStudent ? (
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                    style={getStudentSwatch({ id: selectedStudent.id, name: selectedStudent.name })}
                  >
                    {getInitials(selectedStudent.name)}
                  </span>
                ) : (
                  <div className="size-7 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center shrink-0">
                    <User className="size-4 text-navy-600 dark:text-navy-300" />
                  </div>
                )}
                <span className="min-w-0 flex-1 flex flex-col justify-center">
                  <span className="truncate text-[13px] font-semibold leading-tight text-foreground">
                    {selectedStudent?.name ?? "A carregar..."}
                  </span>
                  <span className="truncate text-[10px] leading-none text-muted-foreground mt-0.5">
                    {selectedStudent?.className ?? "Sem turma atribuÃ­da"}
                  </span>
                </span>
              </div>
            </div>
          )}
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
                      value: bio0.heightM ? `${bio0.heightM} m` : "â€”",
                    },
                    {
                      icon: <Weight className="size-3.5" />,
                      label: t("weightLabel"),
                      value: bio0.weightKg ? `${bio0.weightKg} kg` : "â€”",
                    },
                    {
                      icon: <Activity className="size-3.5" />,
                      label: t("imcLabel"),
                      value: bio0.imc ? `${bio0.imc}` : "â€”",
                      extra: classification ? (
                        <span className={`text-[10px] font-medium ${classification.color}`}>
                          {classification.text}
                        </span>
                      ) : null,
                    },
                    {
                      icon: <ChevronRight className="size-3.5" />,
                      label: t("waistLabel"),
                      value: bio0.waistCm ? `${bio0.waistCm} cm` : "â€”",
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
        <div className="surface-secondary rounded-[20px] border border-border/50 p-5 flex flex-col gap-4 shadow-card transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-card">
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
            className="w-full justify-center rounded-full font-semibold shadow-lg transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #1E3A8A, #10243a)", color: "#fff", border: "none" }}
          >
            {t("generate")}
          </Button>
        </div>

        {/* Email */}
        {canSendEmail && (
          <div className="surface-secondary rounded-[20px] border border-border/50 p-5 flex flex-col gap-4 shadow-card transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-card">
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
                  <FieldShell label={t("emailRecipientLabel")}>
                    <Select value={guardianUserId} onValueChange={setGuardianUserId}>
                      <SelectTrigger
                        aria-label={t("emailRecipientLabel")}
                        className="h-14 rounded-full px-4 pt-[1.45rem] pb-[0.45rem] text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] focus:ring-4 focus:ring-gold-400/15"
                      >
                        <SelectValue placeholder={t("selectGuardianError")} />
                      </SelectTrigger>
                      <SelectContent>
                        {guardians.map((guardian) => (
                          <SelectItem key={guardian.id} value={guardian.id}>
                            {(guardian.guardian.name ?? guardian.guardian.email) +
                              " · " +
                              guardian.guardian.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldShell>
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

