"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Dumbbell, FileUp, Timer, Wind, Zap, Ruler, ShieldAlert, Scale, ArrowUpDown } from "lucide-react";
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
  const canManageTests = role === "ADMIN" || role === "PROFESSOR";
  const canImportCsv = canManageTests;

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastResult, setLastResult] = useState<{ zone: string } | null>(null);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<Record<string, string>>({
    vai: "",
    abd: "",
    bracos: "",
    senta: "",
    weightKg: "",
    heightM: "",
  });

  const updateField = (field: string) => (v: string) => {
    setForm((prev) => ({ ...prev, [field]: v }));
    setLastResult(null); // Clear last result on change to encourage re-eval
  };

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
    } catch {
      toast.error(common("studentListLoadError"));
    } finally {
      setLoadingStudents(false);
    }
  }, [common]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const selectedStudent = students.find((s) => s.id === studentId);

  if (!canManageTests) {
    return (
      <PageScaffold headerProps={{ title: t("title"), description: t("description"), eyebrow: "AVALIAÇÃO · TESTES" }}>
        <EmptyState
          icon={ShieldAlert}
          title={common("noPermission")}
          description={t("description")}
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

    const age = selectedStudent?.birthDate ? calcAgeFromBirthDate(selectedStudent.birthDate) : null;
    const sex = selectedStudent?.sex ?? ("M" as Sex);

    // Prepare tests to save
    const testsToSave = Object.entries(form)
      .filter(([id, val]) => val.trim() !== "" && !["weightKg", "heightM"].includes(id))
      .map(([id, val]) => {
        const testOpt = TEST_OPTIONS.find((o) => o.id === id)!;
        const numValue = id === "milha" ? null : parseFloat(val);
        const zone = age !== null ? (classifyTest(id, val, sex, age) ?? t("improvementZone")) : t("improvementZone");
        
        return {
          testId: id,
          valueNum: numValue,
          valueText: val,
          unit: testOpt.unit,
          zone,
        };
      });

    if (testsToSave.length === 0 && !form.weightKg && !form.heightM) {
        toast.error(t("fillValue"));
        return;
    }

    setSaving(true);

    try {
      // 1. Save Tests
      if (testsToSave.length > 0) {
        const res = await fetch(`/api/students/${studentId}/tests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tests: testsToSave }),
        });
        const body = await readApiResponse<{ tests: { zone: string }[] }>(res);
        setLastResult({ zone: body.tests[0]?.zone ?? "Zona Saudável" });
      }

      // 2. Save Biometria if provided
      if (form.weightKg || form.heightM) {
          await fetch(`/api/students/${studentId}/biometria`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
                  heightM: form.heightM ? parseFloat(form.heightM) : null,
              }),
          });
      }

      toast.success(t("success"));
      // Clear form
      setForm({ vai: "", abd: "", bracos: "", senta: "", weightKg: "", heightM: "" });
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
      headerProps={{ 
        title: t("title"), 
        description: t("description"), 
        eyebrow: "AVALIAÇÃO · TESTES FÍSICOS" 
      }}
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          <div className="space-y-6">
            <PageSection tone="primary" layout="form" contentClassName="gap-4">
                <Skeleton className="h-14 w-full rounded-2xl" />
            </PageSection>
            {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-48 w-full rounded-3xl" />
            ))}
          </div>
          <div className="flex flex-col gap-6">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* LEFT — Forms */}
          <div className="space-y-8 animate-fade-in-up">
            <PageSection tone="primary" layout="form" className="shadow-none !bg-transparent !border-none !p-0">
               <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">
                  Seleção de Aluno
                </label>
                <StudentPicker
                    students={students}
                    value={studentId}
                    onChange={setStudentId}
                />
               </div>
            </PageSection>

            {/* Capacidade Aeróbia */}
            <PageSection
              tone="primary"
              title={
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">fitness_center</span>
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Capacidade Aeróbia</h2>
                </div>
              }
              className="group overflow-hidden relative"
            >
               <div className="mesh-glow -right-20 -top-20 opacity-20" />
               <UnitInput
                  label="Vai-e-Vem (20m)"
                  unit="percursos"
                  value={form.vai}
                  onChange={updateField("vai")}
                  placeholder="0"
                  icon={<Wind className="size-4" />}
                />
            </PageSection>

            {/* Composição Corporal */}
            <PageSection
              tone="primary"
              title={
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">monitor_weight</span>
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Composição Corporal</h2>
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-4">
                <UnitInput
                    label="Peso"
                    unit="kg"
                    value={form.weightKg}
                    onChange={updateField("weightKg")}
                    placeholder="0.0"
                    icon={<Scale className="size-4" />}
                />
                <UnitInput
                    label="Altura"
                    unit="m"
                    value={form.heightM}
                    onChange={updateField("heightM")}
                    placeholder="0.00"
                    icon={<ArrowUpDown className="size-4" />}
                />
              </div>
            </PageSection>

            {/* Aptidão Neuromuscular */}
            <PageSection
              tone="primary"
              title={
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Aptidão Neuromuscular</h2>
                </div>
              }
            >
               <div className="space-y-6">
                <UnitInput
                    label="Abdominais"
                    unit="reps"
                    value={form.abd}
                    onChange={updateField("abd")}
                    placeholder="0"
                    icon={<Dumbbell className="size-4" />}
                />
                <UnitInput
                    label="Flexões"
                    unit="reps"
                    value={form.bracos}
                    onChange={updateField("bracos")}
                    placeholder="0"
                    icon={<Dumbbell className="size-4" />}
                />
               </div>
            </PageSection>

            {/* Flexibilidade */}
            <PageSection
              tone="primary"
              title={
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">straighten</span>
                  </div>
                  <h2 className="text-lg font-bold tracking-tight">Flexibilidade</h2>
                </div>
              }
            >
                <UnitInput
                    label="Sentar e Alcançar"
                    unit="cm"
                    value={form.senta}
                    onChange={updateField("senta")}
                    placeholder="0.0"
                    icon={<Ruler className="size-4" />}
                />
            </PageSection>

            <Button
                onClick={handleSubmit}
                variant="sanctuary"
                size="xl"
                loading={saving}
                icon={<span className="material-symbols-outlined mr-2">save</span>}
                className="w-full text-lg shadow-glow mt-4"
              >
                Gravar todos os testes
            </Button>
          </div>

          {/* RIGHT — Info Panel */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
            <PageSection
                tone="secondary"
                title={
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                        Status da Avaliação
                    </span>
                }
                layout="analytics"
                className="relative overflow-hidden group"
            >
                {!lastResult ? (
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <div className="relative">
                            <svg width="120" height="120" viewBox="0 0 120 120" className="text-muted-foreground/10">
                                <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="6 4" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Timer className="size-8 text-muted-foreground/20" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground/60 px-4">
                            Preencha os resultados para ver a classificação
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <ZoneBadge zone={lastResult.zone} />
                        <p className="text-xs font-bold text-secondary uppercase tracking-widest">Registado com Sucesso</p>
                    </div>
                )}
            </PageSection>

            <PageSection
              tone="secondary"
              title={
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                  Referência ZAF
                </span>
              }
              layout="list"
              contentClassName="gap-3"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-full border border-transparent">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    <span className="font-bold text-foreground text-sm">Saudável (ZSAF)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-full border border-transparent">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                    <span className="font-bold text-foreground text-sm">Melhoria (ZMF)</span>
                  </div>
                </div>
              </div>
            </PageSection>
          </aside>
        </div>
      )}
    </PageScaffold>
  );
}
