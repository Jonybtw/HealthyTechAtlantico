"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { FileText, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { Button } from "@/components/ui/button";

export default function RelatorioPage() {
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const loadStudents = useCallback(async () => {
    const res = await fetch("/api/students?limit=500");
    if (res.ok) {
      const body = await res.json();
      setStudents(body.students.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      if (role === "ALUNO" && body.students.length === 1) {
        setStudentId(body.students[0].id);
      }
    }
  }, [role]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  /* ── Generate PDF (client-side via jsPDF) ── */
  const handleGeneratePdf = async () => {
    if (!studentId) {
      toast.error("Selecione um aluno.");
      return;
    }
    setGeneratingPdf(true);
    try {
      // Fetch student data
      const [bioRes, testRes] = await Promise.all([
        fetch(`/api/students/${studentId}/biometrics`),
        fetch(`/api/students/${studentId}/tests`),
      ]);

      const bioData = bioRes.ok ? await bioRes.json() : [];
      const testArr = testRes.ok ? await testRes.json() : [];

      // Dynamic import to keep bundle size small
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      const student = students.find((s) => s.id === studentId);
      doc.setFontSize(18);
      doc.text("AtlânticoFit — Relatório Individual", 14, 20);

      doc.setFontSize(12);
      doc.text(`Aluno: ${student?.name ?? "—"}`, 14, 35);
      doc.text(`Data: ${new Date().toLocaleDateString("pt-PT")}`, 14, 42);

      let y = 55;

      // Biometrics
      doc.setFontSize(14);
      doc.text("Biometria", 14, y);
      y += 8;
      doc.setFontSize(10);
      if (Array.isArray(bioData) && bioData.length) {
        const b = bioData[0] as Record<string, unknown>;
        doc.text(`Altura: ${b.heightM} m | Peso: ${b.weightKg} kg | IMC: ${b.imc ?? "—"}`, 14, y);
        y += 6;
        if (b.waistCm) doc.text(`Perímetro cintura: ${b.waistCm} cm`, 14, y);
        y += 10;
      } else {
        doc.text("Sem dados de biometria.", 14, y);
        y += 10;
      }

      // Tests
      doc.setFontSize(14);
      doc.text("Testes Físicos", 14, y);
      y += 8;
      doc.setFontSize(10);
      if (Array.isArray(testArr) && testArr.length) {
        // EAV: each test is a separate row
        for (const t of testArr as { testId: string; valueText: string; unit: string }[]) {
          doc.text(`${t.testId}: ${t.valueText} ${t.unit}`, 14, y);
          y += 6;
        }
      } else {
        doc.text("Sem dados de testes.", 14, y);
      }

      doc.save(`relatorio_${student?.name?.replace(/\s+/g, "_") ?? "aluno"}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  /* ── Send report by email ── */
  const handleSendEmail = async () => {
    if (!studentId) {
      toast.error("Selecione um aluno.");
      return;
    }
    if (!recipientEmail) {
      toast.error("Introduza o e-mail do destinatário.");
      return;
    }
    setSendingEmail(true);

    try {
      const res = await fetch(`/api/students/${studentId}/reports/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailedTo: recipientEmail }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erro ao enviar e-mail.");
        return;
      }

      toast.success("Relatório enviado por e-mail!");
      setRecipientEmail("");
    } catch {
      toast.error("Erro de ligação.");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Relatórios"
        description="Gerar PDF ou enviar relatório individual por e-mail"
      />

      <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-5 max-w-lg">
        {role !== "ALUNO" && (
          <StudentPicker students={students} value={studentId} onChange={setStudentId} />
        )}

        {/* PDF */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Gerar PDF</h3>
          <Button
            onClick={handleGeneratePdf}
            loading={generatingPdf}
            icon={<FileText className="size-4" />}
            variant="secondary"
          >
            Descarregar PDF
          </Button>
        </div>

        <hr className="border-border" />

        {/* Email */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Enviar por e-mail</h3>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="encarregado@email.com"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />
          <Button
            onClick={handleSendEmail}
            loading={sendingEmail}
            icon={<Mail className="size-4" />}
            className="self-start"
          >
            Enviar relatório
          </Button>
        </div>
      </div>
    </div>
  );
}
