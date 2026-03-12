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
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { TEST_OPTIONS, classifyTest } from "@/lib/fitness-tests";
import { calcAgeFromBirthDate } from "@/lib/zaf";
import type { Sex } from "@prisma/client";
import { usePageTitle } from "@/hooks/use-page-title";
import { PageTransition } from "@/components/ui/motion";

interface StudentOption {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string | null;
  className?: string | null;
}

export default function TestesPage() {
  const t = useTranslations("testes");
  usePageTitle(t("title"));
  const { role } = useUser();

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState(TEST_OPTIONS[0].id);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastResult, setLastResult] = useState<{ zone: string } | null>(null);

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch("/api/students?limit=500");
      if (!res.ok) { toast.error(t("loadError")); return; }
      const body = await res.json();
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
      toast.error(t("loadConnectionError"));
    } finally {
      setLoadingStudents(false);
    }
  }, [role]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const selectedStudent = students.find((s) => s.id === studentId);
  const currentTest = TEST_OPTIONS.find((opt) => opt.id === selectedTest)!;

  if (role === "ALUNO" && students.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title={t("title")} description={t("description")} />
        <EmptyState
          icon={Link2}
          title={t("unlinkedTitle")}
          description={t("unlinkedDescription")}
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

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t("saveError"));
        return;
      }

      const body = await res.json();
      setLastResult({ zone: body.test?.zone ?? zone });
      toast.success(t("success"));
      setValue("");
    } catch {
      toast.error(t("connectionError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="flex flex-col gap-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {loadingStudents ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
          <div className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-5">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

          {/* LEFT — Form */}
          <form
            onSubmit={handleSubmit}
            className="animate-fade-in-up bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-5"
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
                options={TEST_OPTIONS.map((opt) => ({ value: opt.id, label: opt.label }))}
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

            <Button
              type="submit"
              loading={saving}
              icon={<Timer className="size-4" />}
              className="self-start"
            >
              {t("save")}
            </Button>
          </form>

          {/* RIGHT — Result Panel */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <Timer className="size-4 text-navy-600 dark:text-gold-400" />
                <h3 className="text-sm font-semibold tracking-tight">{t("resultPanel")}</h3>
              </div>

              {!lastResult ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="size-20 rounded-full border-4 border-dashed border-border/40 flex items-center justify-center">
                    <Timer className="size-7 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">{t("fillFormHint")}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4 animate-scale-in">
                  <ZoneBadge zone={lastResult.zone} />
                  <p className="text-xs text-muted-foreground text-center font-medium">{currentTest.label}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </PageTransition>
  );
}

