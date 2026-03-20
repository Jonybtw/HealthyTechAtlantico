"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Dumbbell, FileUp, Link2, Timer, Wind, Zap, Ruler } from "lucide-react";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { StudentPicker } from "@/components/ui/student-picker";
import { UnitInput } from "@/components/ui/unit-input";
import { PillSelect } from "@/components/ui/pill-select";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { TEST_OPTIONS, classifyTest } from "@/lib/fitness-tests";
import { calcAgeFromBirthDate } from "@/lib/zaf";
import type { Sex } from "@prisma/client";
import { readApiResponse } from "@/lib/api-client";

interface StudentOption {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string | null;
  className?: string | null;
}

// Map test IDs to Lucide icons (for pills)
const TEST_ICONS: Record<string, React.ReactNode> = {
  vai:        <Wind className="size-3.5" />,
  cooper:     <Wind className="size-3.5" />,
  milha:      <Timer className="size-3.5" />,
  velocidade: <Zap className="size-3.5" />,
  agilidade:  <Zap className="size-3.5" />,
  abd:        <Dumbbell className="size-3.5" />,
  bracos:     <Dumbbell className="size-3.5" />,
  senta:      <Ruler className="size-3.5" />,
};

// Map test IDs to larger icons for the value input
const INPUT_ICONS: Record<string, React.ReactNode> = {
  vai:        <Wind className="size-4" />,
  cooper:     <Wind className="size-4" />,
  milha:      <Timer className="size-4" />,
  velocidade: <Zap className="size-4" />,
  agilidade:  <Zap className="size-4" />,
  abd:        <Dumbbell className="size-4" />,
  bracos:     <Dumbbell className="size-4" />,
  senta:      <Ruler className="size-4" />,
};

export default function TestesPage() {
  const t = useTranslations("testes");
  const common = useTranslations("common");
  const { role } = useUser();
  const canImportCsv = role === "ADMIN" || role === "PROFESSOR";

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState(TEST_OPTIONS[0].id);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastResult, setLastResult] = useState<{ zone: string } | null>(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch("/api/students?limit=500");
      if (!res.ok) {
        toast.error(common("studentListLoadError"));
        return;
      }
      const body = await readApiResponse<{
        students: {
          id: string;
          name: string;
          sex: string;
          birthDate: string | null;
          className?: string | null;
        }[];
      }>(res);
      const mapped: StudentOption[] = body.students.map(
        (s: { id: string; name: string; sex: string; birthDate: string | null; className?: string | null }) => ({
          id: s.id,
          name: s.name,
          sex: s.sex as Sex,
          birthDate: s.birthDate ?? null,
          className: s.className ?? null,
        })
      );
      setStudents(mapped);
      if (role === "ALUNO" && mapped.length === 1) {
        setStudentId(mapped[0].id);
      }
    } catch {
      toast.error(common("studentListLoadError"));
    } finally {
      setLoadingStudents(false);
    }
  }, [role, common]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const selectedStudent = students.find((s) => s.id === studentId);
  const currentTest = TEST_OPTIONS.find((opt) => opt.id === selectedTest)!;

  if (role === "ALUNO" && students.length === 0) {
    return (
      <PageScaffold headerProps={{ title: t("title"), description: t("description") }}>
        <EmptyState
          icon={Link2}
          title={t("unlinkedTitle")}
          description={t("unlinkedDescription")}
        />
      </PageScaffold>
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
          ) ?? t("improvementZone"))
          : t("improvementZone");
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
      const body = await readApiResponse<{
        count: number;
        tests: { zone: string }[];
      }>(res);
      setLastResult({ zone: body.tests[0]?.zone ?? zone });
      toast.success(t("success"));
      setValue("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("connectionError"));
    } finally {
      setSaving(false);
    }
  };

  const importTestsCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsImportingCsv(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/tests/import", {
        method: "POST",
        body: formData,
      });
      const result = await readApiResponse<{
        created: number;
        failed: number;
      }>(response);

      toast.success(`Importados ${result.created} testes`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} linhas falharam validacao`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro na importacao CSV");
    } finally {
      event.target.value = "";
      setIsImportingCsv(false);
    }
  };

  return (
    <PageScaffold
      headerProps={{ title: t("title"), description: t("description") }}
      headerActions={
        canImportCsv ? (
          <>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={importTestsCsv}
            />
            <Button
              size="sm"
              variant="ghost"
              icon={<FileUp className="size-4" />}
              loading={isImportingCsv}
              onClick={() => importInputRef.current?.click()}
            >
              {common("importCsv")}
            </Button>
          </>
        ) : undefined
      }
    >

      {loadingStudents ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
          <PageSection tone="primary" layout="form" contentClassName="gap-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </PageSection>
          <PageSection tone="secondary" layout="list" contentClassName="gap-3">
            <Skeleton className="h-64 w-full rounded-xl" />
          </PageSection>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

          {/* LEFT — Form */}
          <PageSection tone="primary" layout="form" className="animate-fade-in-up">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {role !== "ALUNO" && (
                <StudentPicker
                  students={students}
                  value={studentId}
                  onChange={setStudentId}
                />
              )}

            {/* Test selector */}
            <PillSelect
              size="lg"
              label={t("selectTest")}
              options={TEST_OPTIONS.map((opt) => ({
                value: opt.id,
                label: opt.label,
                icon: TEST_ICONS[opt.id],
              }))}
              value={selectedTest}
              onChange={(v) => {
                setSelectedTest(v);
                setValue("");
                setLastResult(null);
              }}
            />

            <UnitInput
              label={currentTest.label}
              unit={currentTest.unit}
              value={value}
              onChange={(v) => setValue(v)}
              placeholder={currentTest.unit === "mm:ss" ? "08:30" : "0"}
              icon={INPUT_ICONS[selectedTest]}
              required
            />

            <Button
              type="submit"
              loading={saving}
              icon={<Timer className="size-4" />}
              className="self-start"
            >
              {t("save")}
            </Button>
            </form>
          </PageSection>

          {/* RIGHT — Result Panel */}
          <div className="lg:sticky lg:top-6">
            <PageSection
              tone="secondary"
              layout="list"
              title={
                <span className="flex items-center gap-2">
                  <Timer className="size-4 text-navy-600 dark:text-gold-400" />
                  {t("resultPanel")}
                </span>
              }
            >

              {!lastResult ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="size-16 rounded-full border-2 border-dashed border-border/40 flex items-center justify-center">
                    <Timer className="size-7 text-muted-foreground/30" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">{t("fillFormHint")}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4 animate-scale-in">
                  <ZoneBadge zone={lastResult.zone} />
                  <p className="text-xs text-muted-foreground text-center font-medium">{currentTest.label}</p>
                </div>
              )}
            </PageSection>
          </div>

        </div>
      )}
    </PageScaffold>
  );
}

