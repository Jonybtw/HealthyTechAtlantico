"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link2, Timer } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { UnitInput } from "@/components/ui/unit-input";
import { PillSelect } from "@/components/ui/pill-select";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useUser } from "@/components/user-context";
import { TEST_OPTIONS, classifyTest } from "@/lib/fitness-tests";
import { calcAgeFromBirthDate } from "@/lib/zaf";
import type { Sex } from "@prisma/client";

interface StudentOption {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string | null;
}

export default function TestesPage() {
  const t = useTranslations("testes");
  const { role } = useUser();

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState(TEST_OPTIONS[0].id);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastResult, setLastResult] = useState<{ zone: string } | null>(null);

  const loadStudents = useCallback(async () => {
    const res = await fetch("/api/students?limit=500");
    if (res.ok) {
      const body = await res.json();
      const mapped: StudentOption[] = body.students.map(
        (s: { id: string; name: string; sex: string; birthDate: string | null }) => ({
          id: s.id,
          name: s.name,
          sex: s.sex as Sex,
          birthDate: s.birthDate ?? null,
        })
      );
      setStudents(mapped);
      if (role === "ALUNO" && mapped.length === 1) {
        setStudentId(mapped[0].id);
      }
    }
  }, [role]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const selectedStudent = students.find((s) => s.id === studentId);
  const currentTest = TEST_OPTIONS.find((t) => t.id === selectedTest)!;

  if (role === "ALUNO" && students.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState
          icon={Link2}
          title="Perfil não associado"
          description="A tua conta ainda não está associada a um perfil de aluno. Contacta a escola para concluírem a ligação."
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error(t("selectStudent"));
      return;
    }
    if (!value.trim()) {
      toast.error(t("fillValue"));
      return;
    }
    setSaving(true);

    try {
      const numValue = selectedTest === "milha" ? null : parseFloat(value);
      const age = selectedStudent?.birthDate
        ? calcAgeFromBirthDate(selectedStudent.birthDate)
        : null;
      const sex = selectedStudent?.sex ?? ("M" as Sex);
      const zone =
        age !== null
          ? (classifyTest(
            selectedTest,
            selectedTest === "milha" ? value : (numValue ?? value),
            sex,
            age
          ) ?? "Zona de Melhoria")
          : "Zona de Melhoria";
      const payload = {
        tests: [
          {
            testId: selectedTest,
            valueNum: numValue,
            valueText: value,
            unit: currentTest.unit,
            zone,
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
      setLastResult({ zone: body.test?.zone ?? zone });
      toast.success(t("success"));
      setValue("");
    } catch {
      toast.error("Erro de ligação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <form
        onSubmit={handleSubmit}
        className="animate-fade-in-up bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-5 flex flex-col gap-5 max-w-lg"
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
          <label className="text-sm font-medium">{t("selectTest")}</label>
          <PillSelect
            options={TEST_OPTIONS.map((t) => ({ value: t.id, label: t.label }))}
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
          <div className="flex items-center gap-3 p-4 rounded-xl bg-navy-50/50 dark:bg-navy-900/20 border border-border/50 animate-scale-in">
            <span className="text-sm font-medium">{t("lastResult")}</span>
            <ZoneBadge zone={lastResult.zone} />
          </div>
        )}

        <Button
          type="submit"
          loading={saving}
          icon={<Timer className="size-4" />}
          className="self-start"
        >
          {t("save")}
        </Button>
      </form>
    </div>
  );
}
