"use client";

// Componente cliente de /alunos/[id]: apresenta e edita dados do aluno,
// histórico recente, encarregados e dispensas recebidos do servidor.

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  Dumbbell,
  Gauge,
  HeartPulse,
  Pencil,
  Percent,
  Ruler,
  Scale,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Timer,
  Trash2,
  TrendingUp,
  Users,
  Wind,
  Weight,
  Zap,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createStudentSchema } from "@/lib/validations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useUser } from "@/components/user-context";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HeightPercentilesChart } from "@/components/ui/height-percentiles-chart";
import {
  ChartFrame,
  ResponsiveChartContainer,
} from "@/components/ui/chart-frame";
import { FieldShell } from "@/components/ui/field-shell";
import { Switch } from "@/components/ui/switch";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { useReducedEffects } from "@/hooks/use-reduced-effects";
import { cn } from "@/lib/utils";
import { calcAgeFromBirthDate } from "@/lib/zaf";
import { readApiResponse } from "@/lib/api-client";
import {
  getKidmedClassificationLabelKey,
  getKidmedPeriodLabelKey,
  getQuestionnairePreviewItems,
  getQuestionnaireTypeLabelKey,
  QUESTIONNAIRE_FIELD_META,
  type KidmedClassification,
  type QuestionnaireTypeValue,
} from "@/lib/questionnaires";
import { getInitials } from "@/components/ui/student-picker";

function sectionAnimation(index: number, re: boolean) {
  if (re) return {};
  return { animationDelay: `${index * 70}ms` };
}

function BioPanel({ children, className, index, reducedEffects }: { children: React.ReactNode; className?: string; index: number; reducedEffects: boolean }) {
  return (
    <section style={sectionAnimation(index, reducedEffects)} className={cn("relative overflow-hidden rounded-[12px] border border-border bg-card/88 shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]", !reducedEffects && "animate-fade-in-up opacity-0", className)}>
      <div className="relative">{children}</div>
    </section>
  );
}

type BiometricTrendMetric = "heightM" | "weightKg" | "imc" | "waistCm" | "fatPct";
type SelectedTrend =
  | { kind: "biometric"; metric: BiometricTrendMetric }
  | { kind: "test"; testId: string };

interface Props {
  student: {
    id: string;
    name: string;
    sex: string;
    birthDate: string | null;
    age: number | null;
    schoolYear: string | null;
    className: string | null;
    kidmedConsentAt: string | null;
    kidmedConsentRecordedBy: {
      id: string;
      name: string | null;
      email: string;
    } | null;
    biometrics: {
      heightM: number;
      weightKg: number;
      imc: number;
      waistCm: number | null;
      fatPct: number | null;
      imcZone: string;
      fatZone: string | null;
      waistZone: string | null;
      recordedAt: string;
    }[];
    tests: {
      testId: string;
      valueNum: number | null;
      valueText: string;
      unit: string;
      zone: string;
      recordedAt: string;
    }[];
    questionnaires: {
      type: QuestionnaireTypeValue;
      payload: unknown;
      score: number | null;
      classification: KidmedClassification | null;
      instrumentVersion: string | null;
      schoolYear: string | null;
      periodKey: string | null;
      submittedAt: string;
    }[];
    exemptions: {
      id: string;
      reason: string;
      startDate: string;
      endDate: string;
    }[];
    guardians: {
      id: string;
      relationship: string;
      guardian: { name: string | null; email: string };
    }[];
  };
}

export function StudentDetailClient({ student }: Props) {
  const router = useRouter();
  const { role } = useUser();
  const t = useTranslations("studentDetail");
  const q = useTranslations("questionarios");
  const common = useTranslations("common");
  const nav = useTranslations("nav");
  const locale = useLocale();
  const canManageStudent = role === "PROFESSOR" || role === "ADMIN";

  const reducedEffects = useReducedEffects();
  const age = student.age ?? calcAgeFromBirthDate(student.birthDate);
  const lastBio = student.biometrics[0];
  const initials = getInitials(student.name);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [updatingKidmedConsent, setUpdatingKidmedConsent] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<SelectedTrend>({
    kind: "biometric",
    metric: "heightM",
  });

  type StudentEditValues = z.infer<typeof createStudentSchema>;
  const editForm = useForm<StudentEditValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      name: student.name,
      sex: student.sex as "M" | "F",
      birthDate: student.birthDate ? student.birthDate.slice(0, 10) : "",
      schoolYear: student.schoolYear ?? "",
      className: student.className ?? "",
    },
  });

  function getQuestionnairePeriodLabel(
    questionnaire: Props["student"]["questionnaires"][number],
  ) {
    const period = questionnaire.periodKey?.split(":")[1];
    if (
      (period === "P1" || period === "P2" || period === "P3") &&
      questionnaire.schoolYear
    ) {
      return `${q(getKidmedPeriodLabelKey(period))} - ${questionnaire.schoolYear}`;
    }
    return questionnaire.schoolYear ?? questionnaire.periodKey ?? null;
  }

  function formatQuestionnaireValue(
    value: unknown,
    meta: { unitKey?: string; scaleMax?: number },
  ) {
    if (typeof value === "boolean") return value ? q("yes") : q("no");
    if (typeof value === "number") {
      if (meta.scaleMax) return `${value}/${meta.scaleMax}`;
      if (meta.unitKey) return `${value} ${q(meta.unitKey)}`;
    }
    if (typeof value === "string" && value.length > 0) return value;
    return common("noData");
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(locale);
  }

  async function handleKidmedConsentChange(checked: boolean) {
    setUpdatingKidmedConsent(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidmedConsentGranted: checked }),
      });
      await readApiResponse(res);
      toast.success(
        checked
          ? t("kidmedConsentActivatedSuccess")
          : t("kidmedConsentRevokedSuccess"),
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : common("connectionError"),
      );
    } finally {
      setUpdatingKidmedConsent(false);
    }
  }

  const handleSave = async (values: StudentEditValues) => {
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          sex: values.sex,
          birthDate: values.birthDate || null,
          schoolYear: values.schoolYear || null,
          className: values.className || null,
        }),
      });
      await readApiResponse(res);
      toast.success(t("saveSuccess"));
      setEditing(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : common("connectionError"),
      );
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      });
      await readApiResponse(res);
      toast.success(t("deleteSuccess"));
      router.push("/alunos");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : common("connectionError"),
      );
    }
  };

  const studentSummary = [
    student.sex === "M" ? t("male") : t("female"),
    age !== null ? `${age} ${t("years")}` : null,
    student.className ?? t("noClass"),
    student.schoolYear,
  ]
    .filter(Boolean)
    .join(" · ");

  const studentMeta = student.birthDate
    ? `${t("birthDateLabel")}: ${formatDate(student.birthDate)}`
    : undefined;

  const orderedTests = [...student.tests].sort((a, b) => {
    const zoneDelta =
      getTestZonePriority(a.zone) - getTestZonePriority(b.zone);
    if (zoneDelta !== 0) return zoneDelta;
    return (
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
  });

  return (
    <>
      <PageScaffold
        headerProps={{
          title: student.name,
          description: studentSummary,
          eyebrow: nav("alunos"),
          meta: studentMeta,
          actionsClassName: "w-full lg:w-auto lg:self-start",
          status: (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-white/15 bg-white/12 text-sm font-bold text-white backdrop-blur-sm">
              {initials}
            </span>
          ),
        }}
        headerActions={
          <div className="w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-2 lg:hidden">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => router.push("/alunos")}
                icon={<ArrowLeft className="size-4" />}
                className={
                  canManageStudent
                    ? "order-2 h-10 w-full justify-center border-white/24 bg-white/74 text-navy-900 shadow-none hover:border-white/36 hover:bg-white/86"
                    : "order-1 col-span-2 h-10 w-full justify-center border-white/24 bg-white/74 text-navy-900 shadow-none hover:border-white/36 hover:bg-white/86"
                }
              >
                {nav("alunos")}
              </Button>

              {canManageStudent ? (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setEditing((isEditing) => !isEditing)}
                    icon={<Pencil className="size-4" />}
                    className="order-1 col-span-2 h-10 w-full justify-center border-white/20 bg-white/12 text-white shadow-none hover:border-white/30 hover:bg-white/18"
                  >
                    {editing ? t("cancelBtn") : t("editBtn")}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                    icon={<Trash2 className="size-4" />}
                    className="order-3 h-10 w-full justify-center border-danger-400/70 bg-gradient-to-b from-danger-500 via-danger-600 to-danger-700 text-white shadow-none hover:from-danger-500 hover:via-danger-600 hover:to-danger-600"
                  >
                    {t("deleteBtn")}
                  </Button>
                </>
              ) : null}
            </div>

            <div className="hidden items-center gap-2 rounded-[12px] border border-white/14 bg-white/9 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md lg:flex">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => router.push("/alunos")}
                icon={<ArrowLeft className="size-4" />}
                className="h-9 border-white/22 bg-white/74 text-navy-900 shadow-none hover:border-white/34 hover:bg-white/86"
              >
                {nav("alunos")}
              </Button>

              {canManageStudent ? (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setEditing((isEditing) => !isEditing)}
                    icon={<Pencil className="size-4" />}
                    className="h-9 border-white/20 bg-white/12 text-white shadow-none hover:border-white/30 hover:bg-white/18"
                  >
                    {editing ? t("cancelBtn") : t("editBtn")}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                    icon={<Trash2 className="size-4" />}
                    className="h-9 border-danger-400/70 bg-gradient-to-b from-danger-500 via-danger-600 to-danger-700 text-white shadow-none hover:from-danger-500 hover:via-danger-600 hover:to-danger-600"
                  >
                    {t("deleteBtn")}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        }
      >
        {editing ? (
          <BioPanel index={0} reducedEffects={reducedEffects} className="p-5">
            <p className="mb-4 text-sm font-bold text-foreground">{t("editTitle")}</p>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(handleSave)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          label={t("nameLabel")}
                          error={editForm.formState.errors.name?.message}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FieldShell label={t("sexLabel")}>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger aria-label={t("sexLabel")}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="M">{t("male")}</SelectItem>
                                <SelectItem value="F">{t("female")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FieldShell>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <DateField
                            label={t("birthDateLabel")}
                            name={field.name}
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={editForm.control}
                    name="schoolYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label={t("schoolYearLabel")}
                            placeholder="2025/2026"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="className"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label={t("classNameLabel")}
                            placeholder="8A"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  loading={editForm.formState.isSubmitting}
                  icon={<Check className="size-4" />}
                  className="h-12 self-start text-base"
                >
                  {t("saveChanges")}
                </Button>
              </form>
            </Form>
          </BioPanel>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <BioPanel index={1} reducedEffects={reducedEffects} className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Ruler className="size-4 text-gold-600" />
              <p className="text-sm font-bold tracking-tight text-foreground">{t("recentBiometrics")}</p>
            </div>
            {lastBio ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatTile
                    label={t("height")}
                    value={`${lastBio.heightM} m`}
                    icon={<Ruler className="size-4" />}
                    selected={
                      selectedTrend.kind === "biometric" &&
                      selectedTrend.metric === "heightM"
                    }
                    onClick={() =>
                      setSelectedTrend({ kind: "biometric", metric: "heightM" })
                    }
                  />
                  <StatTile
                    label={t("weight")}
                    value={`${lastBio.weightKg} kg`}
                    icon={<Weight className="size-4" />}
                    selected={
                      selectedTrend.kind === "biometric" &&
                      selectedTrend.metric === "weightKg"
                    }
                    onClick={() =>
                      setSelectedTrend({ kind: "biometric", metric: "weightKg" })
                    }
                  />
                  <StatTile
                    label={t("bmi")}
                    value={lastBio.imc.toFixed(1)}
                    icon={<Activity className="size-4" />}
                    badge={<ZonePill zone={lastBio.imcZone} />}
                    selected={
                      selectedTrend.kind === "biometric" &&
                      selectedTrend.metric === "imc"
                    }
                    onClick={() =>
                      setSelectedTrend({ kind: "biometric", metric: "imc" })
                    }
                  />
                  <StatTile
                    label={t("waist")}
                    icon={<Scale className="size-4" />}
                    value={lastBio.waistCm !== null ? `${lastBio.waistCm} cm` : "—"}
                    selected={
                      selectedTrend.kind === "biometric" &&
                      selectedTrend.metric === "waistCm"
                    }
                    onClick={() =>
                      setSelectedTrend({ kind: "biometric", metric: "waistCm" })
                    }
                  />
                  <StatTile
                    label={t("fatPct")}
                    icon={<Percent className="size-4" />}
                    value={lastBio.fatPct !== null ? `${lastBio.fatPct}%` : "—"}
                    selected={
                      selectedTrend.kind === "biometric" &&
                      selectedTrend.metric === "fatPct"
                    }
                    onClick={() =>
                      setSelectedTrend({ kind: "biometric", metric: "fatPct" })
                    }
                  />
                  <StatTile
                    label={t("date")}
                    value={formatDate(lastBio.recordedAt)}
                    icon={<CalendarDays className="size-4" />}
                  />
                </div>

                {student.biometrics.length > 0 ? (
                  <div className="rounded-[12px] border border-border bg-surface-utility p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <TrendingUp className="size-4 text-gold-500" />
                      <p className="label-micro text-muted-foreground">
                        {getTrendTitle(selectedTrend)}
                      </p>
                    </div>
                    <div className="h-56 w-full">
                      <StudentTrendChart
                        selectedTrend={selectedTrend}
                        biometrics={student.biometrics}
                        tests={student.tests}
                        sex={student.sex}
                        birthDate={student.birthDate}
                        formatDate={formatDate}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <Empty message={t("noRecords")} />
            )}
          </BioPanel>

          <BioPanel index={2} reducedEffects={reducedEffects} className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Timer className="size-4 text-gold-600" />
              <p className="text-sm font-bold tracking-tight text-foreground">{t("recentTests")}</p>
            </div>
            {orderedTests.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {orderedTests.map((test) => {
                  const isRisk = test.zone.toUpperCase().includes("ZMF");
                  const isSafe = test.zone.toUpperCase().includes("ZSAF");
                  const cardStateClass = isRisk
                    ? "border-danger-200/55 bg-gradient-to-br from-danger-50/70 via-white/70 to-danger-50/35 hover:border-danger-300/65 dark:border-danger-700/30 dark:from-danger-950/20 dark:via-navy-950/35 dark:to-danger-950/12"
                    : isSafe
                      ? "border-success-200/55 bg-gradient-to-br from-success-50/70 via-white/70 to-success-50/35 hover:border-success-300/65 dark:border-success-700/30 dark:from-success-950/20 dark:via-navy-950/35 dark:to-success-950/12"
                      : "border-white/28 bg-gradient-to-br from-white/76 via-white/62 to-white/46 hover:border-gold-300/35 dark:border-white/10 dark:from-navy-950/50 dark:via-navy-950/38 dark:to-navy-950/28";

                  return (
                    <button
                      key={`${test.testId}-${test.recordedAt}`}
                      type="button"
                      aria-pressed={
                        selectedTrend.kind === "test" &&
                        selectedTrend.testId === test.testId
                      }
                      onClick={() =>
                        setSelectedTrend({ kind: "test", testId: test.testId })
                      }
                      className={`group relative overflow-hidden rounded-[12px] border p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_24px_-20px_rgba(9,21,35,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_16px_30px_-20px_rgba(9,21,35,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${cardStateClass}`}
                    >
                      {selectedTrend.kind === "test" &&
                      selectedTrend.testId === test.testId ? (
                        <span className="pointer-events-none absolute inset-0 rounded-[12px] ring-2 ring-gold-400/70" />
                      ) : null}
                      <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-white/45 bg-white/80 text-navy-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/8 dark:text-gold-200 dark:shadow-none">
                            {getTestIcon(test.testId)}
                          </span>
                          <p className="text-base font-semibold capitalize tracking-tight text-foreground">
                            {getTestLabel(test.testId)}
                          </p>
                      </div>
                      <time className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/40 bg-white/78 px-2.5 py-1 label-micro text-navy-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/12 dark:bg-white/9 dark:text-navy-100 dark:shadow-none">
                          <CalendarDays className="size-3.5" />
                          {formatDate(test.recordedAt)}
                      </time>

                      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[1.6rem] font-black leading-none tracking-tight text-foreground">
                          {test.valueText}
                          <span className="ml-1 text-sm font-semibold text-muted-foreground">
                            {test.unit}
                          </span>
                        </p>
                        <ZonePill zone={test.zone} />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <Empty message={t("noRecords")} />
            )}
          </BioPanel>

          <BioPanel index={3} reducedEffects={reducedEffects} className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="size-4 text-gold-600" />
              <p className="text-sm font-bold tracking-tight text-foreground">{t("questionnaires")}</p>
            </div>
            {student.questionnaires.length > 0 ? (
              <ul className="grid gap-3">
                {student.questionnaires.map((questionnaire, index) => (
                  <li
                    key={`${questionnaire.type}-${questionnaire.submittedAt}-${index}`}
                    className="group relative overflow-hidden rounded-[12px] border border-white/28 bg-gradient-to-br from-white/78 via-white/62 to-white/48 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_24px_-20px_rgba(9,21,35,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-300/35 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_16px_30px_-20px_rgba(9,21,35,0.45)] dark:border-white/10 dark:from-navy-950/50 dark:via-navy-950/38 dark:to-navy-950/28 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  >
                    <span className="pointer-events-none absolute -right-10 -top-10 size-24 rounded-full bg-gold-300/14 blur-2xl opacity-70 transition-opacity duration-300 group-hover:opacity-100 dark:bg-gold-400/10" />

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-white/45 bg-white/80 text-gold-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/8 dark:text-gold-200 dark:shadow-none">
                          <ClipboardList className="size-4" />
                        </span>
                        <p className="truncate text-base font-semibold tracking-tight text-foreground">
                          {q(getQuestionnaireTypeLabelKey(questionnaire.type))}
                        </p>
                      </div>
                      <time className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/40 bg-white/78 px-2.5 py-1 label-micro text-navy-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/12 dark:bg-white/9 dark:text-navy-100 dark:shadow-none">
                        <CalendarDays className="size-3.5" />
                        {formatDate(questionnaire.submittedAt)}
                      </time>
                    </div>

                    <div className="relative mt-3.5 flex flex-wrap gap-2">
                      {getQuestionnairePreviewItems({
                        ...questionnaire,
                        payload: (questionnaire.payload ?? {}) as Record<
                          string,
                          unknown
                        >,
                      }).map((item) => {
                        if (
                          item.key === "classification" &&
                          typeof item.value === "string"
                        ) {
                          return (
                            <span key={item.key} className="inline-flex">
                              <Badge
                                variant="info"
                                size="md"
                                className="font-semibold"
                              >
                                {q(
                                  getKidmedClassificationLabelKey(
                                    item.value as KidmedClassification,
                                  ),
                                )}
                              </Badge>
                            </span>
                          );
                        }

                        if (item.key === "period") {
                          const label = getQuestionnairePeriodLabel(questionnaire);
                          return label ? (
                            <Badge
                              key={item.key}
                              variant="gold"
                              size="md"
                              className="font-semibold"
                            >
                              {label}
                            </Badge>
                          ) : null;
                        }

                        const meta = QUESTIONNAIRE_FIELD_META[item.key] ?? item;
                        return (
                          <Badge
                            key={item.key}
                            variant="default"
                            size="md"
                            className="border-white/40 bg-white/82 font-semibold normal-case tracking-tight text-navy-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/12 dark:bg-white/8 dark:text-navy-100 dark:shadow-none"
                          >
                            {q(item.labelKey)}: {" "}
                            {formatQuestionnaireValue(item.value, meta)}
                          </Badge>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty message={t("noRecords")} />
            )}
          </BioPanel>

          <BioPanel index={4} reducedEffects={reducedEffects} className="p-5">
            <div className="mb-1 flex items-center gap-2">
              <ShieldCheck className="size-4 text-gold-600" />
              <p className="text-sm font-bold tracking-tight text-foreground">{t("kidmedConsentTitle")}</p>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">{t("kidmedConsentDescription")}</p>
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {student.kidmedConsentAt
                      ? t("kidmedConsentActive")
                      : t("kidmedConsentInactive")}
                  </p>
                </div>

                {canManageStudent ? (
                  <Switch
                    checked={Boolean(student.kidmedConsentAt)}
                    onCheckedChange={handleKidmedConsentChange}
                    disabled={updatingKidmedConsent}
                    aria-label={t("kidmedConsentToggle")}
                  />
                ) : null}
              </div>

              <div className="flex items-start gap-3 rounded-[8px] border border-border bg-surface-utility p-4">
                {student.kidmedConsentAt ? (
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success-600 dark:text-success-300" />
                ) : (
                  <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger-600 dark:text-danger-300" />
                )}

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {student.kidmedConsentAt
                      ? t("kidmedConsentRecordedAtLabel", {
                          date: formatDate(student.kidmedConsentAt),
                        })
                      : t("kidmedConsentMissingLabel")}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {student.kidmedConsentRecordedBy
                      ? t("kidmedConsentRecordedByLabel", {
                          name:
                            student.kidmedConsentRecordedBy.name ??
                            student.kidmedConsentRecordedBy.email,
                        })
                      : t("kidmedConsentInstitutionalNote")}
                  </p>
                </div>
              </div>
            </div>
          </BioPanel>

          <BioPanel index={5} reducedEffects={reducedEffects} className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldOff className="size-4 text-gold-600" />
              <p className="text-sm font-bold tracking-tight text-foreground">{t("exemptions")}</p>
            </div>
            {student.exemptions.length > 0 ? (
              <ul className="grid gap-2">
                {student.exemptions.map((exemption) => (
                  <li
                    key={exemption.id}
                    className="flex items-start gap-3 rounded-[8px] border border-border bg-surface-utility px-4 py-3"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-danger-500/10 text-danger-700 dark:text-danger-400">
                      <ShieldOff className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {exemption.reason}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDate(exemption.startDate)} - {formatDate(exemption.endDate)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty message={t("noRecords")} />
            )}
          </BioPanel>

          <BioPanel index={6} reducedEffects={reducedEffects} className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-4 text-gold-600" />
              <p className="text-sm font-bold tracking-tight text-foreground">{t("guardians")}</p>
            </div>
            {student.guardians.length > 0 ? (
              <ul className="grid gap-2">
                {student.guardians.map((guardianLink) => (
                  <li
                    key={guardianLink.id}
                    className="flex items-center gap-3 rounded-[8px] border border-border bg-surface-utility px-4 py-3"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-navy-500/10 text-navy-700 dark:text-navy-300">
                      <Users className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {guardianLink.guardian.name ?? guardianLink.guardian.email}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({guardianLink.relationship})
                          </span>
                        </span>
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {guardianLink.guardian.email}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty message={t("noRecords")} />
            )}
          </BioPanel>
        </div>
      </PageScaffold>

      <ConfirmModal
        open={confirmDelete}
        title={t("deleteTitle")}
        message={t("deleteConfirm", { name: student.name })}
        confirmLabel={t("deleteConfirmBtn")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

function StatTile({
  label,
  value,
  icon,
  badge,
  selected = false,
  onClick,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  badge?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-gold-300/12 blur-2xl transition-opacity duration-300 group-hover:opacity-100 dark:bg-gold-400/10" />

      <div className="flex items-center gap-2.5">
        {icon ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-white/45 bg-white/80 text-navy-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] dark:border-white/10 dark:bg-white/8 dark:text-gold-200 dark:shadow-none">
            {icon}
          </span>
        ) : null}
        <span className="label-micro text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-start gap-1">
        <span className="text-[1.7rem] font-black leading-none tracking-tight text-foreground sm:text-[1.85rem]">
          {value}
        </span>
        {badge ? <span className="pt-0.5">{badge}</span> : null}
      </div>
    </>
  );
  const className = cn(
    "group relative flex min-h-[114px] w-full flex-col justify-between overflow-hidden rounded-[12px] border border-border bg-surface-secondary px-4 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-300/35 hover:shadow-card-hover",
    selected && "border-gold-400/70 ring-2 ring-gold-400/35",
    onClick && "text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  );

  if (onClick) {
    return (
      <button type="button" aria-pressed={selected} onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}

function getTrendTitle(selectedTrend: SelectedTrend) {
  if (selectedTrend.kind === "test") {
    return `Evolução: ${getTestLabel(selectedTrend.testId)}`;
  }

  const labels: Record<BiometricTrendMetric, string> = {
    heightM: "Percentis de altura",
    weightKg: "Evolução: Peso",
    imc: "Evolução: IMC",
    waistCm: "Evolução: Cintura",
    fatPct: "Evolução: Massa gorda",
  };

  return labels[selectedTrend.metric];
}

function getBiometricTrendConfig(metric: BiometricTrendMetric) {
  const config: Record<
    BiometricTrendMetric,
    { label: string; unit: string; multiplier?: number }
  > = {
    heightM: { label: "Altura", unit: "cm", multiplier: 100 },
    weightKg: { label: "Peso", unit: "kg" },
    imc: { label: "IMC", unit: "" },
    waistCm: { label: "Cintura", unit: "cm" },
    fatPct: { label: "Massa gorda", unit: "%" },
  };

  return config[metric];
}

function toChartNumber(value: number | string | null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function StudentTrendChart({
  selectedTrend,
  biometrics,
  tests,
  sex,
  birthDate,
  formatDate,
}: {
  selectedTrend: SelectedTrend;
  biometrics: Props["student"]["biometrics"];
  tests: Props["student"]["tests"];
  sex: string;
  birthDate: string | null;
  formatDate: (value: string) => string;
}) {
  if (
    selectedTrend.kind === "biometric" &&
    selectedTrend.metric === "heightM"
  ) {
    return (
      <HeightPercentilesChart
        biometrics={biometrics}
        sex={sex}
        birthDate={birthDate}
      />
    );
  }

  const config =
    selectedTrend.kind === "biometric"
      ? getBiometricTrendConfig(selectedTrend.metric)
      : { label: getTestLabel(selectedTrend.testId), unit: "" };

  const chartData =
    selectedTrend.kind === "biometric"
      ? biometrics
          .map((entry) => {
            const rawValue = entry[selectedTrend.metric];
            const numericValue =
              typeof rawValue === "number" && Number.isFinite(rawValue)
                ? rawValue
                : null;
            if (numericValue === null) return null;

            return {
              date: entry.recordedAt,
              label: formatDate(entry.recordedAt),
              value:
                numericValue *
                (selectedTrend.metric === "heightM"
                  ? (config.multiplier ?? 1)
                  : 1),
            };
          })
          .filter((item): item is { date: string; label: string; value: number } =>
            Boolean(item),
          )
      : tests
          .filter((test) => test.testId === selectedTrend.testId)
          .map((test) => {
            const value = toChartNumber(test.valueNum ?? test.valueText);
            if (value === null) return null;

            return {
              date: test.recordedAt,
              label: formatDate(test.recordedAt),
              value,
            };
          })
          .filter((item): item is { date: string; label: string; value: number } =>
            Boolean(item),
          );

  chartData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-[12px] border border-dashed border-border bg-background/60 px-4 text-center text-sm text-muted-foreground">
        Sem dados suficientes para este gráfico.
      </div>
    );
  }

  return (
    <ChartFrame className="h-full min-h-0 min-w-0">
      <ResponsiveChartContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
      >
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 12, bottom: 20, left: -10 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--color-border)"
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              config.unit ? `${value} ${config.unit}` : String(value)
            }
          />
          <RechartsTooltip
            cursor={{
              stroke: "var(--color-border)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
            content={({ active, payload, label }) => {
              const value = payload?.[0]?.value;
              if (!active || value === undefined || value === null) return null;

              return (
                <div className="rounded-[8px] border border-border/60 bg-background p-2.5 text-xs shadow-sm">
                  <p className="mb-1 font-semibold">{label}</p>
                  <p className="font-bold text-success-600">
                    {config.label}: {String(value)}
                    {config.unit ? ` ${config.unit}` : ""}
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            name={config.label}
            stroke="var(--color-success-600)"
            strokeWidth={3}
            dot={{
              r: 4,
              strokeWidth: 2,
              fill: "var(--color-background)",
              stroke: "var(--color-success-600)",
            }}
            activeDot={{
              r: 6,
              strokeWidth: 0,
              fill: "var(--color-success-600)",
            }}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveChartContainer>
    </ChartFrame>
  );
}

function getTestZonePriority(zone: string) {
  const normalized = zone.toUpperCase();
  if (normalized.includes("ZMF")) return 0;
  if (normalized.includes("ZSAF")) return 1;
  return 2;
}

function getTestLabel(testId: string) {
  const normalized = testId.trim().toLowerCase();
  if (normalized === "vai") return "Vai e Vem";
  if (normalized === "cooper") return "Cooper";
  if (normalized === "milha") return "Milha";
  if (normalized === "velocidade") return "Velocidade";
  if (normalized === "agilidade") return "Agilidade";
  if (normalized === "abd") return "Abdominais";
  if (normalized === "bracos") return "Extensoes";
  if (normalized === "senta") return "Senta e Alcanca";
  return testId;
}

function getTestIcon(testId: string) {
  const normalized = testId.trim().toLowerCase();
  if (normalized === "vai") return <Wind className="size-4" />;
  if (normalized === "cooper") return <HeartPulse className="size-4" />;
  if (normalized === "milha") return <Timer className="size-4" />;
  if (normalized === "velocidade") return <Zap className="size-4" />;
  if (normalized === "agilidade") return <Activity className="size-4" />;
  if (normalized === "abd") return <Dumbbell className="size-4" />;
  if (normalized === "bracos") return <Dumbbell className="size-4" />;
  if (normalized === "senta") return <Ruler className="size-4" />;
  return <Gauge className="size-4" />;
}

function ZonePill({ zone }: { zone: string }) {
  return <ZoneBadge zone={zone} size="sm" />;
}

function Empty({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}
