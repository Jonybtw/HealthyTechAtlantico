"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Activity,
  ArrowUpDown,
  CalendarDays,
  Clock3,
  Dumbbell,
  FileUp,
  MoveRight,
  Ruler,
  Save,
  Scale,
  ShieldAlert,
  Timer,
  Wind,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Sex } from "@prisma/client";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { StudentPicker } from "@/components/ui/student-picker";
import { UnitInput } from "@/components/ui/unit-input";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/components/user-context";
import { readApiResponse } from "@/lib/api-client";
import { classifyTest } from "@/lib/fitness-tests";
import { calcAgeFromBirthDate, classifyBmi } from "@/lib/zaf";
import { cn } from "@/lib/utils";

interface StudentOption {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string | null;
  className?: string | null;
  schoolYear?: string | null;
}

type TestFieldId =
  | "vai"
  | "cooper"
  | "milha"
  | "velocidade"
  | "agilidade"
  | "abd"
  | "bracos"
  | "senta";

interface TestFieldMeta {
  id: TestFieldId;
  label: string;
  unit: string;
  placeholder: string;
  type?: "number" | "text";
  step?: string;
  Icon: LucideIcon;
}

interface CategoryMeta {
  id: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  fields: TestFieldMeta[];
}

interface TestRecordResponse {
  id: string;
  testId: string;
  valueNum: number | string | null;
  valueText: string;
  unit: string;
  zone: string;
  recordedAt: string;
}

interface TestRecord {
  id: string;
  testId: string;
  valueNum: number | null;
  valueText: string;
  unit: string;
  zone: string;
  recordedAt: string;
}

const HEADER_EYEBROW = "AVALIACAO / TESTES FISICOS";

const TEST_FIELD_MAP: Record<TestFieldId, TestFieldMeta> = {
  vai: {
    id: "vai",
    label: "Vai-e-vem 20m",
    unit: "percursos",
    placeholder: "0",
    step: "1",
    Icon: Wind,
  },
  cooper: {
    id: "cooper",
    label: "Cooper 12 min",
    unit: "voltas",
    placeholder: "0",
    step: "1",
    Icon: Wind,
  },
  milha: {
    id: "milha",
    label: "Milha 1609m",
    unit: "mm:ss",
    placeholder: "08:30",
    type: "text",
    Icon: Clock3,
  },
  velocidade: {
    id: "velocidade",
    label: "Velocidade 40m",
    unit: "s",
    placeholder: "6.4",
    step: "0.1",
    Icon: Zap,
  },
  agilidade: {
    id: "agilidade",
    label: "Agilidade 4x10m",
    unit: "s",
    placeholder: "10.8",
    step: "0.1",
    Icon: MoveRight,
  },
  abd: {
    id: "abd",
    label: "Abdominais",
    unit: "reps",
    placeholder: "0",
    step: "1",
    Icon: Dumbbell,
  },
  bracos: {
    id: "bracos",
    label: "Extensoes de bracos",
    unit: "reps",
    placeholder: "0",
    step: "1",
    Icon: Dumbbell,
  },
  senta: {
    id: "senta",
    label: "Sentar e alcancar",
    unit: "cm",
    placeholder: "0.0",
    step: "0.1",
    Icon: Ruler,
  },
};

const CATEGORY_SECTIONS: CategoryMeta[] = [
  {
    id: "aerobica",
    title: "Capacidade aerobica",
    description: "Resistencia e esforco continuo.",
    Icon: Wind,
    fields: [TEST_FIELD_MAP.vai, TEST_FIELD_MAP.cooper, TEST_FIELD_MAP.milha],
  },
  {
    id: "velocidade",
    title: "Velocidade e agilidade",
    description: "Tempo, explosao e mudanca de direcao.",
    Icon: Zap,
    fields: [TEST_FIELD_MAP.velocidade, TEST_FIELD_MAP.agilidade],
  },
  {
    id: "forca",
    title: "Forca muscular",
    description: "Repeticao, suporte e controlo do corpo.",
    Icon: Dumbbell,
    fields: [TEST_FIELD_MAP.abd, TEST_FIELD_MAP.bracos],
  },
  {
    id: "flexibilidade",
    title: "Flexibilidade",
    description: "Amplitude e alcance do tronco.",
    Icon: Ruler,
    fields: [TEST_FIELD_MAP.senta],
  },
];

const FIELD_ORDER = Object.keys(TEST_FIELD_MAP) as TestFieldId[];

const INITIAL_FORM: Record<TestFieldId | "weightKg" | "heightM", string> = {
  vai: "",
  cooper: "",
  milha: "",
  velocidade: "",
  agilidade: "",
  abd: "",
  bracos: "",
  senta: "",
  weightKg: "",
  heightM: "",
};

function toOptionalNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTestRecord(record: TestRecordResponse): TestRecord {
  return {
    id: record.id,
    testId: record.testId,
    valueNum: toOptionalNumber(record.valueNum),
    valueText: record.valueText,
    unit: record.unit,
    zone: record.zone,
    recordedAt: record.recordedAt,
  };
}

function getTestSortIndex(testId: string) {
  const index = FIELD_ORDER.indexOf(testId as TestFieldId);
  return index === -1 ? FIELD_ORDER.length : index;
}

function isHealthyZone(zone: string | null | undefined) {
  if (!zone) {
    return false;
  }

  const normalizedZone = zone
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    normalizedZone.includes("saudavel") ||
    normalizedZone.includes("healthy") ||
    normalizedZone.includes("zsaf")
  );
}

export default function TestesPage() {
  const t = useTranslations("testes");
  const common = useTranslations("common");
  const locale = useLocale();
  const { role } = useUser();
  const canManageTests = role === "ADMIN" || role === "PROFESSOR";

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [loadingLatestTests, setLoadingLatestTests] = useState(false);
  const [latestTests, setLatestTests] = useState<TestRecord[]>([]);
  const [form, setForm] =
    useState<Record<TestFieldId | "weightKg" | "heightM", string>>(
      INITIAL_FORM,
    );
  const [lastSubmission, setLastSubmission] = useState<{
    count: number;
    zone: string | null;
    biometricsSaved: boolean;
  } | null>(null);

  const importInputRef = useRef<HTMLInputElement | null>(null);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId) ?? null,
    [studentId, students],
  );

  const selectedStudentAge = useMemo(() => {
    if (!selectedStudent) {
      return null;
    }
    return calcAgeFromBirthDate(selectedStudent.birthDate);
  }, [selectedStudent]);

  const selectedStudentContext = useMemo(
    () =>
      [selectedStudent?.className, selectedStudent?.schoolYear]
        .filter(Boolean)
        .join(" / "),
    [selectedStudent?.className, selectedStudent?.schoolYear],
  );

  const completedTestsCount = useMemo(
    () =>
      Object.entries(form).filter(
        ([key, value]) =>
          !["weightKg", "heightM"].includes(key) && value.trim().length > 0,
      ).length,
    [form],
  );

  const previewResults = useMemo(() => {
    if (!selectedStudent) {
      return [];
    }

    return FIELD_ORDER.flatMap((fieldId) => {
      const field = TEST_FIELD_MAP[fieldId];
      const value = form[field.id];
      if (!value.trim()) {
        return [];
      }

      const zone =
        selectedStudentAge !== null
          ? classifyTest(field.id, value, selectedStudent.sex, selectedStudentAge)
          : null;

      return [
        {
          id: field.id,
          label: field.label,
          value,
          unit: field.unit,
          zone,
        },
      ];
    });
  }, [form, selectedStudent, selectedStudentAge]);

  const healthyPreviewCount = previewResults.filter((result) =>
    isHealthyZone(result.zone),
  ).length;

  const resolvedPreviewCount = previewResults.filter((result) =>
    Boolean(result.zone),
  ).length;

  const biometricsReady = Boolean(form.weightKg && form.heightM);
  const biometricsPreview = useMemo(() => {
    if (!biometricsReady || !selectedStudent) {
      return null;
    }

    const height = parseFloat(form.heightM);
    const weight = parseFloat(form.weightKg);
    if (!(height > 0 && weight > 0)) {
      return null;
    }

    const bmi = Math.round((weight / (height * height)) * 10) / 10;
    const age = selectedStudentAge ?? 14;
    const imcResult = classifyBmi(bmi, selectedStudent.sex, age);

    return {
      bmi,
      zone:
        imcResult?.zone ?? (bmi <= 25 ? "Zona Saudavel" : t("improvementZone")),
    };
  }, [
    biometricsReady,
    form.heightM,
    form.weightKg,
    selectedStudent,
    selectedStudentAge,
    t,
  ]);

  const familyCoverage = useMemo(
    () =>
      CATEGORY_SECTIONS.map((section) => {
        const filled = section.fields.filter(
          (field) => form[field.id].trim().length > 0,
        ).length;

        return {
          id: section.id,
          title: section.title,
          filled,
          total: section.fields.length,
          percentage:
            section.fields.length > 0
              ? Math.round((filled / section.fields.length) * 100)
              : 0,
        };
      }),
    [form],
  );

  const sessionReady = completedTestsCount > 0 || biometricsReady;

  const loadStudents = useCallback(async (signal?: AbortSignal) => {
    setLoadingStudents(true);
    try {
      const response = await fetch("/api/students?limit=500", { signal });
      if (!response.ok) {
        toast.error(common("studentListLoadError"));
        return;
      }

      const body = await readApiResponse<{
        students: Array<{
          id: string;
          name: string;
          sex: Sex | null;
          birthDate: string | null;
          className?: string | null;
          schoolYear?: string | null;
        }>;
      }>(response);

      setStudents(
        body.students.map((student) => ({
          id: student.id,
          name: student.name,
          sex: student.sex ?? "M",
          birthDate: student.birthDate ?? null,
          className: student.className ?? null,
          schoolYear: student.schoolYear ?? null,
        })),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast.error(common("studentListLoadError"));
    } finally {
      if (!signal?.aborted) {
        setLoadingStudents(false);
      }
    }
  }, [common]);

  const loadLatestTests = useCallback(
    async (targetStudentId: string, signal?: AbortSignal) => {
      setLoadingLatestTests(true);
      try {
        const response = await fetch(
          `/api/students/${targetStudentId}/tests?latest=true`,
          { signal },
        );
        const records = await readApiResponse<TestRecordResponse[]>(response);
        setLatestTests(
          records
            .map(normalizeTestRecord)
            .sort((left, right) => {
              return (
                getTestSortIndex(left.testId) - getTestSortIndex(right.testId)
              );
            }),
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setLatestTests([]);
        toast.error(t("loadConnectionError"));
      } finally {
        if (!signal?.aborted) {
          setLoadingLatestTests(false);
        }
      }
    },
    [t],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadStudents(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadStudents]);

  useEffect(() => {
    setForm(INITIAL_FORM);
    setLastSubmission(null);
  }, [studentId]);

  useEffect(() => {
    if (!studentId) {
      setLatestTests([]);
      setLoadingLatestTests(false);
      return;
    }

    const controller = new AbortController();
    void loadLatestTests(studentId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [studentId, loadLatestTests]);

  const updateField =
    (field: TestFieldId | "weightKg" | "heightM") => (value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
      setLastSubmission(null);
    };

  const formatDate = useCallback(
    (value: string) =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value)),
    [locale],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!studentId || !selectedStudent) {
      toast.error(t("selectStudent"));
      return;
    }

    const testsToSave = FIELD_ORDER.filter(
      (fieldId) => form[fieldId].trim().length > 0,
    ).map((fieldId) => {
      const field = TEST_FIELD_MAP[fieldId];
      const zone =
        selectedStudentAge !== null
          ? classifyTest(
              field.id,
              form[field.id],
              selectedStudent.sex,
              selectedStudentAge,
            ) ?? t("improvementZone")
          : t("improvementZone");

      return {
        testId: field.id,
        valueNum: field.type === "text" ? null : parseFloat(form[field.id]),
        valueText: form[field.id],
        unit: field.unit,
        zone,
      };
    });

    if (testsToSave.length === 0 && !biometricsReady) {
      toast.error(t("fillValue"));
      return;
    }

    setSaving(true);

    try {
      let primaryZone: string | null = null;

      if (testsToSave.length > 0) {
        const response = await fetch(`/api/students/${studentId}/tests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tests: testsToSave }),
        });

        const body = await readApiResponse<{
          count: number;
          tests: TestRecordResponse[];
        }>(response);

        primaryZone = body.tests[0]?.zone ?? null;
      }

      if (biometricsReady && biometricsPreview) {
        await fetch(`/api/students/${studentId}/biometrics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            heightM: parseFloat(form.heightM),
            weightKg: parseFloat(form.weightKg),
            imc: biometricsPreview.bmi,
            imcZone: biometricsPreview.zone,
          }),
        }).then(readApiResponse);
      }

      if (testsToSave.length > 0) {
        await loadLatestTests(studentId);
      }

      setLastSubmission({
        count: testsToSave.length,
        zone: primaryZone,
        biometricsSaved: biometricsReady,
      });
      setForm(INITIAL_FORM);
      toast.success(t("success"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("connectionError"),
      );
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

      toast.success(t("importSuccess", { count: result.created }));
      if (result.failed > 0) {
        toast.warning(t("importPartialWarning", { count: result.failed }));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("importError"),
      );
    } finally {
      event.target.value = "";
      setIsImportingCsv(false);
    }
  };

  if (!canManageTests) {
    return (
      <PageScaffold
        headerProps={{
          title: t("title"),
          description: t("description"),
          eyebrow: HEADER_EYEBROW,
        }}
      >
        <EmptyState
          icon={ShieldAlert}
          title={common("noPermission")}
          description={t("description")}
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      className="gap-6"
      headerProps={{
        title: t("title"),
        description: t("description"),
        eyebrow: HEADER_EYEBROW,
      }}
      headerActions={
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
            variant="primary"
            icon={<FileUp className="size-4" />}
            loading={isImportingCsv}
            onClick={() => importInputRef.current?.click()}
          >
            {common("importCsv")}
          </Button>
        </>
      }
    >
      {loadingStudents ? (
        <TestsLoadingState />
      ) : (
        <div className="grid gap-6">
          <PageSection
            tone="primary"
            layout="form"
            className="overflow-hidden"
            eyebrow="Sessao guiada"
            title="Bateria de testes"
            description="Regista a sessao por familias de prova e confirma a leitura ZAF em tempo real."
          >
            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="rounded-2xl border border-border bg-surface-secondary p-4 shadow-sm sm:p-5">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-end">
                  <div className="min-w-0">
                    <p className="text-tiny font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Selecao de aluno
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      Escolhe o aluno antes de montar a bateria da sessao.
                    </p>
                    <div className="mt-4">
                      <StudentPicker
                        students={students}
                        value={studentId}
                        onChange={setStudentId}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-utility px-4 py-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Estado da sessao
                        </p>
                        <p className="mt-1 text-xl font-black tracking-[-0.05em] text-foreground">
                          {sessionReady ? "Pronta para guardar" : "A aguardar resultados"}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full border border-gold-400/25 bg-gold-400/10 px-2.5 py-1 text-tiny font-semibold text-gold-700 dark:text-gold-200">
                        {completedTestsCount}/8
                      </span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-navy-800 via-navy-700 to-gold-400 transition-all duration-500"
                        style={{
                          width: `${Math.round((completedTestsCount / 8) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {selectedStudent
                        ? selectedStudentContext || "Contexto escolar por confirmar"
                        : "Sem aluno selecionado"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-surface-secondary shadow-sm">
                {CATEGORY_SECTIONS.map((section, index) => (
                  <WorkbenchFamilyRow
                    key={section.id}
                    section={section}
                    bordered={index < CATEGORY_SECTIONS.length - 1}
                  >
                    <div
                      className={cn(
                        "grid gap-4",
                        section.fields.length >= 3
                          ? "md:grid-cols-2 xl:grid-cols-3"
                          : section.fields.length === 2
                            ? "md:grid-cols-2"
                            : "grid-cols-1",
                      )}
                    >
                      {section.fields.map((field) => (
                        <UnitInput
                          key={field.id}
                          label={field.label}
                          unit={field.unit}
                          value={form[field.id]}
                          onChange={updateField(field.id)}
                          placeholder={field.placeholder}
                          step={field.step}
                          type={field.type}
                          icon={<field.Icon className="size-4" />}
                        />
                      ))}
                    </div>
                  </WorkbenchFamilyRow>
                ))}

                <div className="grid gap-4 border-t border-white/18 p-5 dark:border-white/8 xl:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-10 items-center justify-center rounded-2xl bg-surface-utility text-foreground shadow-sm">
                        <Scale className="size-5" />
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        Biometria de apoio
                      </p>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Se preencher altura e peso, a sessao grava tambem a biometria base deste aluno.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <UnitInput
                      label="Peso"
                      unit="kg"
                      value={form.weightKg}
                      onChange={updateField("weightKg")}
                      placeholder="53.4"
                      step="0.1"
                      icon={<Scale className="size-4" />}
                    />
                    <UnitInput
                      label="Altura"
                      unit="m"
                      value={form.heightM}
                      onChange={updateField("heightM")}
                      placeholder="1.62"
                      step="0.01"
                      icon={<ArrowUpDown className="size-4" />}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-gold-400/18 bg-gradient-to-r from-gold-400/10 via-white/72 to-white/55 p-4 shadow-card dark:from-gold-400/10 dark:via-navy-950/60 dark:to-navy-950/50 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="space-y-2">
                    <p className="text-tiny font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Fecho da sessao
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Guarda de uma vez todas as provas preenchidas e junta biometria apenas quando altura e peso estiverem completos.
                    </p>
                    {lastSubmission ? (
                      <p className="text-sm font-semibold text-foreground">
                        Ultimo envio: {lastSubmission.count} testes
                        {lastSubmission.biometricsSaved ? " + biometria" : ""}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    loading={saving}
                    icon={<Save className="size-4" />}
                    className="h-12 w-full justify-center text-base lg:w-auto"
                  >
                    Gravar sessao de testes
                  </Button>
                </div>
              </div>
            </form>
          </PageSection>

          <div className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="grid gap-6 xl:sticky xl:top-24 xl:self-start">
              <PageSection
                tone="secondary"
                layout="list"
                eyebrow="Bateria em curso"
                title={selectedStudent?.name ?? "Sem aluno selecionado"}
                description={
                  selectedStudent
                    ? "Leitura operacional da sessao atual antes do envio."
                    : "Escolhe um aluno para ativar a leitura da sessao."
                }
              >
                <div className="grid gap-3">
                  <MetaRow
                    label="Turma"
                    value={selectedStudentContext || common("noData")}
                  />
                  <MetaRow
                    label="Idade"
                    value={
                      selectedStudentAge !== null
                        ? String(selectedStudentAge)
                        : "Sem referencia"
                    }
                  />
                  <MetaRow
                    label="Sexo"
                    value={
                      selectedStudent
                        ? selectedStudent.sex === "F"
                          ? common("female")
                          : common("male")
                        : common("noData")
                    }
                  />
                </div>

                <div className="h-px bg-border/60" />

                <div className="grid gap-3">
                  <SessionMetric
                    label="Provas preenchidas"
                    value={`${completedTestsCount}/8`}
                  />
                  <SessionMetric
                    label="Classificacoes prontas"
                    value={String(resolvedPreviewCount)}
                  />
                  <SessionMetric
                    label="Em zona saudavel"
                    value={String(healthyPreviewCount)}
                    highlight={healthyPreviewCount > 0}
                  />
                  <SessionMetric
                    label="Biometria de apoio"
                    value={
                      biometricsPreview
                        ? `${biometricsPreview.bmi.toFixed(1)} IMC`
                        : "Opcional"
                    }
                    highlight={Boolean(biometricsPreview)}
                  />
                </div>

                <div className="h-px bg-border/60" />

                {!selectedStudent ? (
                  <EmptyPanelMessage>
                    Seleciona um aluno para ver a leitura das provas desta sessao.
                  </EmptyPanelMessage>
                ) : previewResults.length === 0 ? (
                  <EmptyPanelMessage>
                    Introduz pelo menos um resultado para preencher a bateria em curso.
                  </EmptyPanelMessage>
                ) : (
                  <div className="grid gap-2.5">
                    {previewResults.map((result) => (
                      <LiveResultRow
                        key={result.id}
                        label={result.label}
                        value={`${result.value} ${result.unit}`}
                        zone={result.zone}
                      />
                    ))}
                  </div>
                )}

                {lastSubmission?.zone ? (
                  <div className="rounded-2xl border border-gold-400/18 bg-gold-400/10 px-4 py-3">
                    <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Zona principal do ultimo envio
                    </p>
                    <div className="mt-2">
                      <ZoneBadge zone={lastSubmission.zone} />
                    </div>
                  </div>
                ) : null}
              </PageSection>

              <PageSection
                tone="utility"
                layout="list"
                eyebrow="Cobertura"
                title="Familias da sessao"
                description="Ajuda a perceber o que ja esta fechado nesta bateria."
              >
                {familyCoverage.map((family) => (
                  <FamilyProgressRow
                    key={family.id}
                    title={family.title}
                    filled={family.filled}
                    total={family.total}
                    percentage={family.percentage}
                  />
                ))}
              </PageSection>
            </aside>

            <PageSection
              tone="utility"
              layout="list"
              className="self-start"
              eyebrow="Ultima bateria"
              title="Resultados recentes"
              description="Resultado mais recente por prova para o aluno selecionado."
            >
              {!selectedStudent ? (
                <EmptyPanelMessage>
                  Seleciona um aluno para consultar a ultima bateria conhecida.
                </EmptyPanelMessage>
              ) : loadingLatestTests ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 rounded-2xl" />
                  ))}
                </div>
              ) : latestTests.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {latestTests.map((record) => (
                    <RecentTestCard
                      key={record.id}
                      record={record}
                      dateLabel={formatDate(record.recordedAt)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyPanelMessage>
                  Este aluno ainda nao tem resultados guardados nesta area.
                </EmptyPanelMessage>
              )}
            </PageSection>
          </div>
        </div>
      )}
    </PageScaffold>
  );
}

function TestsLoadingState() {
  return (
    <div className="grid gap-6">
      <PageSection tone="primary" layout="form" contentClassName="gap-5">
        <Skeleton className="h-32 rounded-[1.5rem]" />
        <Skeleton className="h-[460px] rounded-[1.65rem]" />
        <Skeleton className="h-28 rounded-[1.5rem]" />
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Skeleton className="h-[540px] rounded-2xl" />
        <Skeleton className="h-[540px] rounded-2xl" />
      </div>
    </div>
  );
}

function WorkbenchFamilyRow({
  section,
  bordered,
  children,
}: {
  section: CategoryMeta;
  bordered: boolean;
  children: React.ReactNode;
}) {
  const Icon = section.Icon;

  return (
    <div
      className={cn(
        "grid gap-4 p-5 xl:grid-cols-[220px_minmax(0,1fr)]",
        bordered ? "border-b border-white/18 dark:border-white/8" : "",
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-surface-utility text-foreground shadow-sm">
            <Icon className="size-5" />
          </span>
          <p className="text-sm font-semibold text-foreground">
            {section.title}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {section.description}
        </p>
      </div>

      {children}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/65 px-4 py-3 shadow-sm">
      <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

function SessionMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/65 px-4 py-3 shadow-sm">
      <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-semibold",
          highlight ? "text-gold-700 dark:text-gold-200" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyPanelMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-8 text-center">
      <Timer className="mx-auto size-8 text-muted-foreground/35" />
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function LiveResultRow({
  label,
  value,
  zone,
}: {
  label: string;
  value: string;
  zone: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{value}</p>
      </div>
      {zone ? (
        <ZoneBadge zone={zone} size="sm" />
      ) : (
        <span className="text-xs font-semibold text-muted-foreground">
          Sem referencia
        </span>
      )}
    </div>
  );
}

function FamilyProgressRow({
  title,
  filled,
  total,
  percentage,
}: {
  title: string;
  filled: number;
  total: number;
  percentage: number;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/65 px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <span className="text-xs font-semibold text-muted-foreground">
          {filled}/{total}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-navy-800 via-navy-700 to-gold-400"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function RecentTestCard({
  record,
  dateLabel,
}: {
  record: TestRecord;
  dateLabel: string;
}) {
  const meta = TEST_FIELD_MAP[record.testId as TestFieldId];
  const Icon = meta?.Icon ?? Activity;

  return (
    <div className="rounded-[1.35rem] border border-border/70 bg-background/65 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-surface-utility text-foreground shadow-sm">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {meta?.label ?? record.testId}
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {dateLabel}
            </p>
          </div>
        </div>
        <ZoneBadge zone={record.zone} size="sm" />
      </div>

      <p className="mt-4 text-[1.9rem] font-black leading-none tracking-[-0.05em] text-foreground">
        {record.valueText}
        <span className="ml-1 text-sm font-semibold text-muted-foreground">
          {record.unit}
        </span>
      </p>
    </div>
  );
}
