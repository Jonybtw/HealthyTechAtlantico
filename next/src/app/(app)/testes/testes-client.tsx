"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowUpDown,
  CheckCircle2,
  Clock3,
  Dumbbell,
  FileUp,
  Gauge,
  MoveRight,
  Ruler,
  Save,
  Scale,
  ShieldAlert,
  Timer,
  UserRound,
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

interface StudentOption {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string | null;
  className?: string | null;
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
  icon: React.ReactNode;
}

interface CategoryMeta {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  fields: TestFieldMeta[];
}

const HEADER_EYEBROW = "AVALIACAO · TESTES FISICOS";

const TEST_FIELD_MAP: Record<TestFieldId, TestFieldMeta> = {
  vai: {
    id: "vai",
    label: "Vai-e-vem (20m)",
    unit: "percursos",
    placeholder: "0",
    step: "1",
    icon: <Wind className="size-4" />,
  },
  cooper: {
    id: "cooper",
    label: "Cooper (12 min)",
    unit: "voltas",
    placeholder: "0",
    step: "1",
    icon: <Wind className="size-4" />,
  },
  milha: {
    id: "milha",
    label: "Milha 1609m",
    unit: "mm:ss",
    placeholder: "08:30",
    type: "text",
    icon: <Clock3 className="size-4" />,
  },
  velocidade: {
    id: "velocidade",
    label: "Velocidade 40m",
    unit: "s",
    placeholder: "6.4",
    step: "0.1",
    icon: <Zap className="size-4" />,
  },
  agilidade: {
    id: "agilidade",
    label: "Agilidade 4x10m",
    unit: "s",
    placeholder: "10.8",
    step: "0.1",
    icon: <MoveRight className="size-4" />,
  },
  abd: {
    id: "abd",
    label: "Abdominais",
    unit: "reps",
    placeholder: "0",
    step: "1",
    icon: <Dumbbell className="size-4" />,
  },
  bracos: {
    id: "bracos",
    label: "Extensoes de bracos",
    unit: "reps",
    placeholder: "0",
    step: "1",
    icon: <Dumbbell className="size-4" />,
  },
  senta: {
    id: "senta",
    label: "Sentar e alcancar",
    unit: "cm",
    placeholder: "0.0",
    step: "0.1",
    icon: <Ruler className="size-4" />,
  },
};

const CATEGORY_SECTIONS: CategoryMeta[] = [
  {
    id: "aerobica",
    title: "Capacidade aerobica",
    description: "Resultados de resistencia e esforco continuo.",
    icon: Wind,
    fields: [TEST_FIELD_MAP.vai, TEST_FIELD_MAP.cooper, TEST_FIELD_MAP.milha],
  },
  {
    id: "velocidade",
    title: "Velocidade e agilidade",
    description: "Tempo, explosao e mudanca de direcao.",
    icon: Zap,
    fields: [TEST_FIELD_MAP.velocidade, TEST_FIELD_MAP.agilidade],
  },
  {
    id: "forca",
    title: "Forca muscular",
    description: "Capacidade de repeticao e suporte do proprio peso.",
    icon: Dumbbell,
    fields: [TEST_FIELD_MAP.abd, TEST_FIELD_MAP.bracos],
  },
  {
    id: "flexibilidade",
    title: "Flexibilidade",
    description: "Amplitude e alcance do tronco.",
    icon: Ruler,
    fields: [TEST_FIELD_MAP.senta],
  },
];

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

export default function TestesPage() {
  const t = useTranslations("testes");
  const common = useTranslations("common");
  const { role } = useUser();
  const canManageTests = role === "ADMIN" || role === "PROFESSOR";

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
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

    return Object.values(TEST_FIELD_MAP).flatMap((field) => {
      const value = form[field.id];
      if (!value.trim()) {
        return [];
      }

      const zone =
        selectedStudentAge !== null
          ? classifyTest(
              field.id,
              value,
              selectedStudent.sex,
              selectedStudentAge,
            )
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

  const healthyPreviewCount = previewResults.filter(
    (result) =>
      result.zone?.includes("Saud") || result.zone?.includes("Healthy"),
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

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const response = await fetch("/api/students?limit=500");
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
        }>;
      }>(response);

      setStudents(
        body.students.map((student) => ({
          id: student.id,
          name: student.name,
          sex: student.sex ?? "M",
          birthDate: student.birthDate ?? null,
          className: student.className ?? null,
        })),
      );
    } catch {
      toast.error(common("studentListLoadError"));
    } finally {
      setLoadingStudents(false);
    }
  }, [common]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const updateField =
    (field: TestFieldId | "weightKg" | "heightM") => (value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
      setLastSubmission(null);
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!studentId || !selectedStudent) {
      toast.error(t("selectStudent"));
      return;
    }

    const testsToSave = Object.values(TEST_FIELD_MAP)
      .filter((field) => form[field.id].trim().length > 0)
      .map((field) => {
        const zone =
          selectedStudentAge !== null
            ? (classifyTest(
                field.id,
                form[field.id],
                selectedStudent.sex,
                selectedStudentAge,
              ) ?? t("improvementZone"))
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
          tests: Array<{ zone: string }>;
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

      toast.success(`Importados ${result.created} testes`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} linhas falharam validacao`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro na importacao CSV",
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
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <OverviewCard
              icon={UserRound}
              label="Aluno em foco"
              value={selectedStudent?.name ?? "Sem aluno selecionado"}
              description={
                selectedStudent?.className ??
                "Seleciona o aluno antes de registar os resultados."
              }
            />
            <OverviewCard
              icon={Gauge}
              label="Testes preenchidos"
              value={`${completedTestsCount}/8`}
              description={
                completedTestsCount > 0
                  ? resolvedPreviewCount > 0
                    ? `${healthyPreviewCount} em zona saudavel`
                    : "Sem referencia etaria para classificar."
                  : "Ainda nao ha resultados introduzidos."
              }
              accent={completedTestsCount > 0 ? "gold" : "default"}
            />
            <OverviewCard
              icon={CheckCircle2}
              label="Estado do registo"
              value={
                biometricsReady || completedTestsCount > 0
                  ? "Pronto"
                  : "Pendente"
              }
              description={
                biometricsReady || completedTestsCount > 0
                  ? "Ja ha informacao suficiente para guardar a sessao."
                  : "Preenche pelo menos um teste ou altura e peso."
              }
              accent={
                biometricsReady || completedTestsCount > 0
                  ? "success"
                  : "default"
              }
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <PageSection
              tone="primary"
              layout="form"
              eyebrow="Sessao guiada"
              title="Registo de testes"
              description="Agrupa os resultados por familia para registar a sessao de forma rapida e consistente."
            >
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="rounded-2xl border border-white/35 bg-white/72 p-4 shadow-card backdrop-blur-md dark:border-white/10 dark:bg-navy-950/42">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-tiny font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Selecao de aluno
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Escolhe o contexto antes de introduzir resultados.
                      </p>
                    </div>
                    <span className="hidden rounded-full border border-gold-400/25 bg-gold-400/10 px-2.5 py-1 text-tiny font-semibold text-gold-700 dark:text-gold-200 sm:inline-flex">
                      {students.length} alunos
                    </span>
                  </div>

                  <StudentPicker
                    students={students}
                    value={studentId}
                    onChange={setStudentId}
                  />
                </div>

                <div className="grid gap-4">
                  {CATEGORY_SECTIONS.map((section) => (
                    <CategoryCard key={section.id} section={section}>
                      <div
                        className={`grid gap-4 ${
                          section.fields.length > 1
                            ? "md:grid-cols-2"
                            : "grid-cols-1"
                        }`}
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
                            icon={field.icon}
                          />
                        ))}
                      </div>
                    </CategoryCard>
                  ))}

                  <CategoryCard
                    section={{
                      id: "biometria",
                      title: "Composicao corporal de apoio",
                      description:
                        "Se preencher altura e peso, a pagina guarda tambem a biometria base desta sessao.",
                      icon: Scale,
                      fields: [],
                    }}
                  >
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
                  </CategoryCard>
                </div>

                <div className="rounded-2xl border border-gold-400/18 bg-gradient-to-r from-gold-400/10 via-white/70 to-white/55 p-4 shadow-card dark:from-gold-400/10 dark:via-navy-950/60 dark:to-navy-950/50">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <p className="text-tiny font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Fecho da sessao
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Guarda todos os testes preenchidos de uma vez e inclui
                        biometria apenas se altura e peso estiverem completos.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      loading={saving}
                      icon={<Save className="size-4" />}
                      className="h-12 w-full justify-center text-base md:w-auto"
                    >
                      Gravar sessao de testes
                    </Button>
                  </div>
                </div>
              </form>
            </PageSection>

            <aside className="flex flex-col gap-6 xl:sticky xl:top-24">
              <PageSection
                tone="secondary"
                layout="analytics"
                eyebrow="Leitura imediata"
                title="Preview ZAF"
                description="Resumo em tempo real dos testes preenchidos nesta sessao."
              >
                {!selectedStudent ? (
                  <EmptyPanelMessage>
                    Seleciona um aluno para ativar a leitura de zonas por idade
                    e sexo.
                  </EmptyPanelMessage>
                ) : previewResults.length === 0 ? (
                  <EmptyPanelMessage>
                    Introduz pelo menos um resultado para ver a classificacao
                    esperada.
                  </EmptyPanelMessage>
                ) : (
                  <div className="grid gap-3">
                    {previewResults.map((result) => (
                      <div
                        key={result.id}
                        className="rounded-2xl border border-border/60 bg-background/45 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {result.label}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {result.value} {result.unit}
                            </p>
                          </div>
                          {result.zone ? (
                            <ZoneBadge zone={result.zone} size="sm" />
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground">
                              Sem referencia etaria
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </PageSection>

              <PageSection
                tone="secondary"
                layout="list"
                eyebrow="Contexto"
                title={selectedStudent?.name ?? "Sem aluno selecionado"}
                description="Confirma rapidamente os dados base antes de gravar."
              >
                {selectedStudent ? (
                  <div className="grid gap-3">
                    <MetaRow
                      label="Turma"
                      value={selectedStudent.className ?? "-"}
                    />
                    <MetaRow
                      label="Idade"
                      value={
                        selectedStudentAge !== null
                          ? String(selectedStudentAge)
                          : "Sem registo"
                      }
                    />
                    <MetaRow
                      label="Sexo"
                      value={
                        selectedStudent.sex === "F" ? "Feminino" : "Masculino"
                      }
                    />
                    <MetaRow
                      label="Biometria de apoio"
                      value={biometricsReady ? "Completa" : "Opcional"}
                    />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    O contexto do aluno aparece aqui assim que o escolheres.
                  </p>
                )}
              </PageSection>

              <PageSection
                tone="secondary"
                layout="list"
                eyebrow="Sessao"
                title="Estado atual"
                description="Resumo do que esta pronto para ser guardado."
              >
                <MetaRow
                  label="Testes com valor"
                  value={String(completedTestsCount)}
                />
                <MetaRow
                  label="Biometria base"
                  value={
                    biometricsPreview
                      ? `${biometricsPreview.bmi} IMC`
                      : "Nao pronta"
                  }
                />
                <MetaRow
                  label="Ultimo envio"
                  value={
                    lastSubmission
                      ? `${lastSubmission.count} testes${lastSubmission.biometricsSaved ? " + biometria" : ""}`
                      : "Ainda sem envio"
                  }
                />
                {lastSubmission?.zone ? (
                  <div className="pt-1">
                    <ZoneBadge zone={lastSubmission.zone} />
                  </div>
                ) : null}
              </PageSection>

              <PageSection
                tone="secondary"
                layout="list"
                eyebrow="Referencia ZAF"
                title="Leitura rapida"
                description="Guia simples para interpretar os estados antes de gravar."
              >
                <ReferenceRow
                  tone="success"
                  title="Zona Saudavel"
                  description="Resultado dentro do patamar esperado para o contexto do aluno."
                />
                <ReferenceRow
                  tone="warning"
                  title="Zona de Melhoria"
                  description="Resultado que merece acompanhamento e nova recolha."
                />
              </PageSection>
            </aside>
          </div>
        </>
      )}
    </PageScaffold>
  );
}

function TestsLoadingState() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PageSection tone="primary" layout="form" contentClassName="gap-6">
          <Skeleton className="h-24 rounded-2xl" />
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-48 rounded-2xl" />
          ))}
        </PageSection>

        <div className="flex flex-col gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </>
  );
}

function CategoryCard({
  section,
  children,
}: {
  section: CategoryMeta;
  children: React.ReactNode;
}) {
  const Icon = section.icon;

  return (
    <div className="rounded-2xl border border-white/30 bg-white/72 p-5 shadow-card backdrop-blur-md dark:border-white/10 dark:bg-navy-950/46">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-navy-100 text-navy-800 dark:bg-white/10 dark:text-gold-200">
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold tracking-[-0.03em] text-foreground">
            {section.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {section.description}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  label,
  value,
  description,
  accent = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
  accent?: "default" | "gold" | "success";
}) {
  const accentClass =
    accent === "gold"
      ? "bg-gold-400/18 text-gold-700 dark:text-gold-200"
      : accent === "success"
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
        : "bg-navy-100 text-navy-800 dark:bg-white/10 dark:text-navy-100";

  return (
    <div className="rounded-2xl border border-white/30 bg-white/72 p-5 shadow-card backdrop-blur-md dark:border-white/10 dark:bg-navy-950/58">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-tiny font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-black tracking-[-0.04em] text-foreground">
            {value}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <span
          className={`flex size-11 items-center justify-center rounded-2xl ${accentClass}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/65 px-4 py-3 shadow-sm">
      <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function EmptyPanelMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-8 text-center">
      <Timer className="mx-auto size-8 text-muted-foreground/35" />
      <p className="mt-3 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function ReferenceRow({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "success" | "warning";
}) {
  const toneClass = tone === "success" ? "bg-emerald-500" : "bg-amber-500";

  return (
    <div className="rounded-2xl border border-border/70 bg-background/65 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`size-2.5 rounded-full ${toneClass}`} />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
