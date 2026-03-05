"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Timer } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { UnitInput } from "@/components/ui/unit-input";
import { PillSelect } from "@/components/ui/pill-select";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";

const TEST_OPTIONS = [
  { key: "vaivem", label: "Vai e Vem", unit: "percursos" },
  { key: "cooper", label: "Cooper", unit: "m" },
  { key: "milha", label: "Milha", unit: "mm:ss" },
  { key: "velocidade", label: "Velocidade", unit: "seg" },
  { key: "agilidade", label: "Agilidade", unit: "seg" },
  { key: "abdominais", label: "Abdominais", unit: "rep" },
  { key: "extensoes", label: "Extensões de braços", unit: "rep" },
  { key: "senta_alcanca", label: "Senta e Alcança", unit: "cm" },
];

export default function TestesPage() {
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState(TEST_OPTIONS[0].key);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastResult, setLastResult] = useState<{ zone: string } | null>(null);

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

  const currentTest = TEST_OPTIONS.find((t) => t.key === selectedTest)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error("Selecione um aluno.");
      return;
    }
    if (!value.trim()) {
      toast.error("Introduza o valor do teste.");
      return;
    }
    setSaving(true);

    try {
      const numValue = selectedTest === "milha" ? null : parseFloat(value);
      const payload = {
        tests: [
          {
            testId: selectedTest,
            valueNum: numValue,
            valueText: value,
            unit: currentTest.unit,
            zone: "ZSAF", // default — server can recalculate
          },
        ],
      };

      const res = await fetch(`/api/students/${studentId}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erro ao gravar teste.");
        return;
      }

      const body = await res.json();
      setLastResult({ zone: body.test?.zone ?? "healthy" });
      toast.success("Teste registado com sucesso!");
      setValue("");
    } catch {
      toast.error("Erro de ligação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Testes Físicos"
        description="Registar resultados dos testes de aptidão física"
      />

      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-xl border border-border p-6 flex flex-col gap-5 max-w-lg"
      >
        {role !== "ALUNO" && (
          <StudentPicker
            students={students}
            value={studentId}
            onChange={setStudentId}
          />
        )}

        {/* Test selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Teste</label>
          <PillSelect
            options={TEST_OPTIONS.map((t) => ({ value: t.key, label: t.label }))}
            value={selectedTest}
            onChange={(v) => {
              setSelectedTest(v);
              setValue("");
              setLastResult(null);
            }}
          />
        </div>

        <UnitInput
          label={currentTest.label}
          unit={currentTest.unit}
          value={value}
          onChange={(v) => setValue(v)}
          placeholder={currentTest.unit === "mm:ss" ? "08:30" : "0"}
          required
        />

        {lastResult && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-navy-50 dark:bg-navy-900/30">
            <span className="text-sm font-medium">Resultado:</span>
            <ZoneBadge zone={lastResult.zone as "healthy" | "risk"} />
          </div>
        )}

        <Button
          type="submit"
          loading={saving}
          icon={<Timer className="size-4" />}
          className="self-start"
        >
          Gravar teste
        </Button>
      </form>
    </div>
  );
}
