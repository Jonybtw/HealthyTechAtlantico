"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  Ruler,
  Timer,
  ClipboardList,
  ShieldOff,
  Users,
  Pencil,
  Trash2,
  Check,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createStudentSchema } from "@/lib/validations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { PageTransition } from "@/components/ui/motion";

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
    dispensas: {
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

// Deterministic avatar color from initials
function getAvatarColor(name: string) {
  const colors = [
    { bg: "#dce1ff", text: "#00236f" },
    { bg: "#ffddb8", text: "#6b3b00" },
    { bg: "#d1fae5", text: "#065f46" },
    { bg: "#fce7f3", text: "#9d174d" },
    { bg: "#ede9fe", text: "#4c1d95" },
    { bg: "#fef3c7", text: "#92400e" },
    { bg: "#dbeafe", text: "#1e40af" },
    { bg: "#f0fdf4", text: "#166534" },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function StudentDetailClient({ student }: Props) {
  const router = useRouter();
  const { role } = useUser();
  const t = useTranslations("studentDetail");
  const q = useTranslations("questionarios");
  const common = useTranslations("common");
  const locale = useLocale();
  const canManageStudent = role === "PROFESSOR" || role === "ADMIN";

  const age = student.age ?? calcAgeFromBirthDate(student.birthDate);
  const lastBio = student.biometrics[0];
  const initials = getInitials(student.name);
  const avatarColor = getAvatarColor(student.name);

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
    key: string,
    value: unknown,
    meta: { unitKey?: string; scaleMax?: number },
  ) {
    if (typeof value === "boolean") return value ? q("yes") : q("no");
    if (typeof value === "number") {
      if (meta.scaleMax) return `${value}/${meta.scaleMax}`;
      if (meta.unitKey) return `${value} ${q(meta.unitKey)}`;
    }
    if (typeof value === "string" && value.length > 0) return value;
    return t("notAvailable");
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

  return (
    <PageTransition className="relative min-h-screen">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-amber-400 opacity-[0.06] blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-navy-800 opacity-[0.07] blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* ── Hero Banner ── */}
        <div
          className="relative overflow-hidden px-8 py-8"
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #00236f 100%)",
          }}
        >
          {/* Decorative large circle */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white opacity-[0.04]" />
          <div className="pointer-events-none absolute -bottom-16 left-[40%] h-48 w-48 rounded-full bg-amber-400 opacity-[0.08] blur-3xl" />

          {/* Back link */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/alunos")}
            className="mb-6 px-0 text-blue-100/75 hover:bg-transparent hover:text-white"
            icon={<ArrowLeft className="size-3.5" />}
          >
            ALUNOS · PERFIL
          </Button>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Student identity */}
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div
                className="flex size-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-extrabold shadow-card ring-4 ring-white/20"
                style={{
                  backgroundColor: avatarColor.bg,
                  color: avatarColor.text,
                }}
              >
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {student.name}
                </h1>
                <p className="mt-1 text-sm font-medium text-blue-200/70">
                  {student.sex === "M" ? t("male") : t("female")}
                  {age !== null && ` · ${age} ${t("years")}`}
                  {student.className && ` · ${student.className}`}
                  {student.schoolYear && ` (${student.schoolYear})`}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            {canManageStudent && (
              <div className="flex gap-2.5">
                <Button
                  type="button"
                  variant="gold"
                  size="lg"
                  onClick={() => setEditing((e) => !e)}
                  icon={<Pencil className="size-4" />}
                >
                  {editing ? t("cancelBtn") : t("editBtn")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => setConfirmDelete(true)}
                  icon={<Trash2 className="size-4" />}
                  className="hover:border-danger-500/30 hover:bg-danger-500/18 hover:text-white"
                >
                  {t("deleteBtn")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Page Content ── */}
        <div className="px-8 py-8">
          {/* Edit Form */}
          {editing && (
            <Card className="mb-8 overflow-hidden p-6">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-navy-800">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                {t("editTitle")}
              </h3>
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
                                <SelectTrigger
                                  aria-label={t("sexLabel")}
                                  className="h-14 rounded-full px-4 pt-5 pb-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] focus:ring-4 focus:ring-gold-400/15"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="M">{t("male")}</SelectItem>
                                  <SelectItem value="F">
                                    {t("female")}
                                  </SelectItem>
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
                    className="self-start"
                  >
                    {t("saveChanges")}
                  </Button>
                </form>
              </Form>
            </Card>
          )}

          {/* Bento Grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* ── Biometrics Card ── */}
            <GlassCard
              icon={<Ruler className="size-4 text-navy-900" />}
              title={t("recentBiometrics")}
            >
              {lastBio ? (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-3 gap-3">
                    <StatTile
                      label={t("height")}
                      value={`${lastBio.heightM} m`}
                    />
                    <StatTile
                      label={t("weight")}
                      value={`${lastBio.weightKg} kg`}
                    />
                    <StatTile
                      label={t("bmi")}
                      value={lastBio.imc.toFixed(1)}
                      badge={<ZonePill zone={lastBio.imcZone} />}
                    />
                    <StatTile
                      label={t("waist")}
                      value={lastBio.waistCm ? `${lastBio.waistCm} cm` : "—"}
                    />
                    <StatTile
                      label={t("fatPct")}
                      value={lastBio.fatPct ? `${lastBio.fatPct}%` : "—"}
                    />
                    <StatTile
                      label={t("date")}
                      value={new Date(lastBio.recordedAt).toLocaleDateString(
                        locale,
                      )}
                    />
                  </div>

                  {/* Growth chart */}
                  {student.biometrics.length > 0 && (
                    <div
                      className="overflow-hidden rounded-2xl p-4"
                      style={{
                        background:
                          "linear-gradient(135deg, #1e3a8a 0%, #00236f 100%)",
                      }}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <TrendingUp className="size-4 text-amber-400" />
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-100/60">
                          Percentis de Altura
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
                  )}
                </div>
              ) : (
                <Empty />
              )}
            </GlassCard>

            {/* ── Tests Card ── */}
            <GlassCard
              icon={<Timer className="size-4 text-navy-900" />}
              title={t("recentTests")}
            >
              {student.tests.length > 0 ? (
                <div className="flex flex-col gap-0">
                  {student.tests.map((test, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-navy-50"
                    >
                      <span className="text-sm font-medium capitalize text-muted-foreground">
                        {test.testId}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-navy-800">
                          {test.valueText}
                          <span className="ml-1 text-xs font-normal text-slate-400">
                            {test.unit}
                          </span>
                        </span>
                        <ZonePill zone={test.zone} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty />
              )}
            </GlassCard>

            {/* ── Questionnaires Card ── */}
            <GlassCard
              icon={<ClipboardList className="size-4 text-navy-900" />}
              title={t("questionnaires")}
            >
              {student.questionnaires.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {student.questionnaires.map((questionnaire, i) => (
                    <li
                      key={i}
                      className="rounded-2xl border border-blue-50 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-navy-800">
                          {q(getQuestionnaireTypeLabelKey(questionnaire.type))}
                        </p>
                        <time className="text-micro font-bold uppercase tracking-widest text-slate-400">
                          {new Date(
                            questionnaire.submittedAt,
                          ).toLocaleDateString(locale)}
                        </time>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
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
                              <span
                                key={item.key}
                                className="inline-flex"
                              >
                                <Badge variant="info" size="sm">
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
                            const label =
                              getQuestionnairePeriodLabel(questionnaire);
                            return label ? (
                              <Badge key={item.key} variant="info" size="sm">
                                {label}
                              </Badge>
                            ) : null;
                          }
                          const meta =
                            QUESTIONNAIRE_FIELD_META[item.key] ?? item;
                          return (
                            <Badge
                              key={item.key}
                              variant="default"
                              size="sm"
                              className="font-medium normal-case tracking-tight"
                            >
                              {q(item.labelKey)}:{" "}
                              {formatQuestionnaireValue(
                                item.key,
                                item.value,
                                meta,
                              )}
                            </Badge>
                          );
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty />
              )}
            </GlassCard>

            {/* ── KIDMED Consent Card ── */}
            <GlassCard
              icon={<ShieldCheck className="size-4 text-navy-900" />}
              title={t("kidmedConsentTitle")}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-navy-800">
                      {student.kidmedConsentAt
                        ? t("kidmedConsentActive")
                        : t("kidmedConsentInactive")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {t("kidmedConsentDescription")}
                    </p>
                  </div>
                  {canManageStudent && (
                    <Switch
                      checked={Boolean(student.kidmedConsentAt)}
                      onCheckedChange={handleKidmedConsentChange}
                      disabled={updatingKidmedConsent}
                      aria-label={t("kidmedConsentToggle")}
                    />
                  )}
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-white/20 bg-card/80 p-4 dark:border-white/10">
                  {student.kidmedConsentAt ? (
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-navy-800">
                      {student.kidmedConsentAt
                        ? t("kidmedConsentRecordedAtLabel", {
                            date: new Date(
                              student.kidmedConsentAt,
                            ).toLocaleDateString(locale),
                          })
                        : t("kidmedConsentMissingLabel")}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
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
            </GlassCard>

            {/* ── Dispensas Card ── */}
            <GlassCard
              icon={<ShieldOff className="size-4 text-navy-900" />}
              title={t("dispensas")}
            >
              {student.dispensas.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {student.dispensas.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-start justify-between rounded-xl bg-navy-50 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-slate-900 border-border">
                        {d.reason}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {new Date(d.startDate).toLocaleDateString(locale)} →{" "}
                        {new Date(d.endDate).toLocaleDateString(locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty />
              )}
            </GlassCard>

            {/* ── Guardians Card ── */}
            <GlassCard
              icon={<Users className="size-4 text-navy-900" />}
              title={t("guardians")}
            >
              {student.guardians.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {student.guardians.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center justify-between rounded-xl bg-navy-50 px-4 py-3"
                    >
                      <span className="text-sm font-medium text-slate-900 border-border">
                        {g.guardian.name}{" "}
                        <span className="text-xs text-slate-400">
                          ({g.relationship})
                        </span>
                      </span>
                      <span className="text-xs text-slate-400">
                        {g.guardian.email}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty />
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title={t("deleteTitle")}
        message={t("deleteConfirm", { name: student.name })}
        confirmLabel={t("deleteConfirmBtn")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </PageTransition>
  );
}

/* ────────────────────────────────────────────────── */
/* Sub-components                                    */
/* ────────────────────────────────────────────────── */

function GlassCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-micro font-bold uppercase tracking-[0.2em] text-slate-400">
          {title}
        </p>
      </div>
      {children}
    </Card>
  );
}

function StatTile({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/20 bg-card/80 p-3 dark:border-white/10">
      <span className="text-micro font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-lg font-extrabold text-navy-800">{value}</span>
        {badge}
      </div>
    </div>
  );
}

function ZonePill({ zone }: { zone: string }) {
  return <ZoneBadge zone={zone} size="sm" />;
}

function Empty() {
  return <p className="text-sm text-slate-400">—</p>;
}
