"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
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
import { FieldShell } from "@/components/ui/field-shell";
import { Switch } from "@/components/ui/switch";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
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

  const age = student.age ?? calcAgeFromBirthDate(student.birthDate);
  const lastBio = student.biometrics[0];
  const initials = getInitials(student.name);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [updatingKidmedConsent, setUpdatingKidmedConsent] = useState(false);

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
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/12 text-sm font-bold text-white backdrop-blur-sm">
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

            <div className="hidden items-center gap-2 rounded-2xl border border-white/14 bg-white/9 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md lg:flex">
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
          <PageSection tone="primary" layout="form" title={t("editTitle")}>
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
          </PageSection>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <PageSection
            tone="secondary"
            layout="analytics"
            title={
              <span className="flex items-center gap-2">
                <Ruler className="size-4 text-gold-600" />
                {t("recentBiometrics")}
              </span>
            }
          >
            {lastBio ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatTile
                    label={t("height")}
                    value={`${lastBio.heightM} m`}
                    icon={<Ruler className="size-4" />}
                  />
                  <StatTile
                    label={t("weight")}
                    value={`${lastBio.weightKg} kg`}
                    icon={<Weight className="size-4" />}
                  />
                  <StatTile
                    label={t("bmi")}
                    value={lastBio.imc.toFixed(1)}
                    icon={<Activity className="size-4" />}
                    badge={<ZonePill zone={lastBio.imcZone} />}
                  />
                  <StatTile
                    label={t("waist")}
                    icon={<Scale className="size-4" />}
                    value={lastBio.waistCm !== null ? `${lastBio.waistCm} cm` : "—"}
                  />
                  <StatTile
                    label={t("fatPct")}
                    icon={<Percent className="size-4" />}
                    value={lastBio.fatPct !== null ? `${lastBio.fatPct}%` : "—"}
                  />
                  <StatTile
                    label={t("date")}
                    value={formatDate(lastBio.recordedAt)}
                    icon={<CalendarDays className="size-4" />}
                  />
                </div>

                {student.biometrics.length > 0 ? (
                  <div className="rounded-2xl border border-border bg-surface-utility p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <TrendingUp className="size-4 text-gold-500" />
                      <p className="text-tiny font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Percentis de altura
                      </p>
                    </div>
                    <div className="h-56 w-full">
                      <HeightPercentilesChart
                        biometrics={student.biometrics}
                        sex={student.sex}
                        birthDate={student.birthDate}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <Empty message={t("noRecords")} />
            )}
          </PageSection>

          <PageSection
            tone="secondary"
            layout="list"
            title={
              <span className="flex items-center gap-2">
                <Timer className="size-4 text-gold-600" />
                {t("recentTests")}
              </span>
            }
          >
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
                    <div
                      key={`${test.testId}-${test.recordedAt}`}
                      className={`group relative overflow-hidden rounded-2xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_24px_-20px_rgba(9,21,35,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_16px_30px_-20px_rgba(9,21,35,0.45)] ${cardStateClass}`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/45 bg-white/80 text-navy-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/8 dark:text-gold-200 dark:shadow-none">
                            {getTestIcon(test.testId)}
                          </span>
                          <p className="text-base font-semibold capitalize tracking-tight text-foreground">
                            {getTestLabel(test.testId)}
                          </p>
                      </div>
                      <time className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/40 bg-white/78 px-2.5 py-1 text-tiny font-semibold uppercase tracking-[0.16em] text-navy-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/12 dark:bg-white/9 dark:text-navy-100 dark:shadow-none">
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
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty message={t("noRecords")} />
            )}
          </PageSection>

          <PageSection
            tone="secondary"
            layout="list"
            title={
              <span className="flex items-center gap-2">
                <ClipboardList className="size-4 text-gold-600" />
                {t("questionnaires")}
              </span>
            }
          >
            {student.questionnaires.length > 0 ? (
              <ul className="grid gap-3">
                {student.questionnaires.map((questionnaire, index) => (
                  <li
                    key={`${questionnaire.type}-${questionnaire.submittedAt}-${index}`}
                    className="group relative overflow-hidden rounded-2xl border border-white/28 bg-gradient-to-br from-white/78 via-white/62 to-white/48 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_24px_-20px_rgba(9,21,35,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-300/35 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_16px_30px_-20px_rgba(9,21,35,0.45)] dark:border-white/10 dark:from-navy-950/50 dark:via-navy-950/38 dark:to-navy-950/28 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  >
                    <span className="pointer-events-none absolute -right-10 -top-10 size-24 rounded-full bg-gold-300/14 blur-2xl opacity-70 transition-opacity duration-300 group-hover:opacity-100 dark:bg-gold-400/10" />

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/45 bg-white/80 text-gold-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/10 dark:bg-white/8 dark:text-gold-200 dark:shadow-none">
                          <ClipboardList className="size-4" />
                        </span>
                        <p className="truncate text-base font-semibold tracking-tight text-foreground">
                          {q(getQuestionnaireTypeLabelKey(questionnaire.type))}
                        </p>
                      </div>
                      <time className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/40 bg-white/78 px-2.5 py-1 text-tiny font-semibold uppercase tracking-[0.16em] text-navy-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/12 dark:bg-white/9 dark:text-navy-100 dark:shadow-none">
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
          </PageSection>

          <PageSection
            tone="secondary"
            layout="default"
            title={
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-gold-600" />
                {t("kidmedConsentTitle")}
              </span>
            }
            description={t("kidmedConsentDescription")}
          >
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

              <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-utility p-4">
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
          </PageSection>

          <PageSection
            tone="secondary"
            layout="list"
            title={
              <span className="flex items-center gap-2">
                <ShieldOff className="size-4 text-gold-600" />
                {t("exemptions")}
              </span>
            }
          >
            {student.exemptions.length > 0 ? (
              <ul className="grid gap-2">
                {student.exemptions.map((exemption) => (
                  <li
                    key={exemption.id}
                    className="flex items-start justify-between rounded-xl border border-border bg-surface-utility px-4 py-3"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {exemption.reason}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(exemption.startDate)} - {formatDate(exemption.endDate)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty message={t("noRecords")} />
            )}
          </PageSection>

          <PageSection
            tone="secondary"
            layout="list"
            title={
              <span className="flex items-center gap-2">
                <Users className="size-4 text-gold-600" />
                {t("guardians")}
              </span>
            }
          >
            {student.guardians.length > 0 ? (
              <ul className="grid gap-2">
                {student.guardians.map((guardianLink) => (
                  <li
                    key={guardianLink.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface-utility px-4 py-3"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {guardianLink.guardian.name ?? guardianLink.guardian.email}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({guardianLink.relationship})
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {guardianLink.guardian.email}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty message={t("noRecords")} />
            )}
          </PageSection>
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
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="group relative flex min-h-[114px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface-secondary px-4 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-gold-300/35">
      <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-gold-300/12 blur-2xl transition-opacity duration-300 group-hover:opacity-100 dark:bg-gold-400/10" />

      <div className="flex items-center gap-2.5">
        {icon ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/45 bg-white/80 text-navy-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] dark:border-white/10 dark:bg-white/8 dark:text-gold-200 dark:shadow-none">
            {icon}
          </span>
        ) : null}
        <span className="text-tiny font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-start gap-1">
        <span className="text-[1.7rem] font-black leading-none tracking-tight text-foreground sm:text-[1.85rem]">
          {value}
        </span>
        {badge ? <span className="pt-0.5">{badge}</span> : null}
      </div>
    </div>
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
