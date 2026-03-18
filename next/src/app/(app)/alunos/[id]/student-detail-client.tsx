"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Ruler, Timer, ClipboardList, ShieldOff, Users, Pencil, Trash2, Check, TrendingUp } from "lucide-react";
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, ComposedChart } from "recharts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createStudentSchema } from "@/lib/validations";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useUser } from "@/components/user-context";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calcAgeFromBirthDate } from "@/lib/zaf";
import { readApiResponse } from "@/lib/api-client";

interface Props {
  student: {
    id: string;
    name: string;
    sex: string;
    birthDate: string | null;
    age: number | null;
    schoolYear: string | null;
    className: string | null;
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
      type: string;
      payload: unknown;
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

export function StudentDetailClient({ student }: Props) {
  const router = useRouter();
  const { role } = useUser();
  const t = useTranslations("studentDetail");
  const common = useTranslations("common");
  const locale = useLocale();
  const canManageStudent = role === "PROFESSOR" || role === "ADMIN";

  const age = student.age ?? calcAgeFromBirthDate(student.birthDate);

  const lastBio = student.biometrics[0];

  // Edit state
  const [editing, setEditing] = useState(false);

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

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      toast.error(error instanceof Error ? error.message : common("connectionError"));
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      await readApiResponse(res);
      toast.success(t("deleteSuccess"));
      router.push("/alunos");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : common("connectionError"));
    }
  };

  return (
    <PageScaffold
      headerProps={{
        title: student.name,
        description: `${student.sex === "M" ? t("male") : t("female")}${age !== null && age !== undefined ? " \u00b7 " + age + " " + t("years") : ""} \u00b7 ${
          student.className
            ? student.className + " (" + (student.schoolYear ?? "") + ")"
            : t("noClass")
        }`,
      }}
      headerActions={
        canManageStudent ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<Pencil className="size-4" />}
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? t("cancelBtn") : t("editBtn")}
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 className="size-4" />}
              onClick={() => setConfirmDelete(true)}
            >
              {t("deleteBtn")}
            </Button>
          </div>
        ) : null
      }
    >

      {/* Edit form */}
      {editing && (
        <Form {...editForm}>
          <form
            onSubmit={editForm.handleSubmit(handleSave)}
            className="surface-primary rounded-[20px] p-5 flex flex-col gap-4 max-w-lg"
          >
            <h3 className="font-semibold text-sm">{t("editTitle")}</h3>
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
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={editForm.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold tracking-tight text-foreground">{t("sexLabel")}</label>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">{t("male")}</SelectItem>
                            <SelectItem value="F">{t("female")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                      <Input
                        label={t("birthDateLabel")}
                        type="date"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section icon={<Ruler className="size-4" />} title={t("recentBiometrics")}>
          {lastBio ? (
            <div className="flex flex-col gap-5 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <Stat label={t("height")} value={lastBio.heightM + " m"} />
                <Stat label={t("weight")} value={lastBio.weightKg + " kg"} />
                <Stat
                  label={t("bmi")}
                  value={lastBio.imc.toFixed(1)}
                  extra={<ZoneBadge zone={lastBio.imcZone} />}
                />
                <Stat label={t("waist")} value={lastBio.waistCm ? lastBio.waistCm + " cm" : "\u2014"} />
                <Stat label={t("fatPct")} value={lastBio.fatPct ? lastBio.fatPct + "%" : "\u2014"} />
                <Stat label={t("date")} value={new Date(lastBio.recordedAt).toLocaleDateString(locale)} />
              </div>
              {student.biometrics.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border/40 bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <TrendingUp className="size-4 text-success-600 dark:text-success-400" />
                    <span>Percentis de Altura (Curva de Crescimento)</span>
                  </div>
                  <div className="h-64 w-full">
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
        </Section>

        <Section icon={<Timer className="size-4" />} title={t("recentTests")}>
          {student.tests.length > 0 ? (
            <div className="flex flex-col gap-1.5 text-sm">
              {student.tests.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.testId}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.valueText} {t.unit}</span>
                    <ZoneBadge zone={t.zone} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Section>

        <Section icon={<ClipboardList className="size-4" />} title={t("questionnaires")}>
          {student.questionnaires.length > 0 ? (
            <ul className="text-sm space-y-1">
              {student.questionnaires.map((q, i) => (
                <li key={i} className="flex justify-between">
                  <span className="font-medium">{q.type}</span>
                  <span className="text-muted-foreground">
                    {new Date(q.submittedAt).toLocaleDateString(locale)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Section>

        <Section icon={<ShieldOff className="size-4" />} title={t("dispensas")}>
          {student.dispensas.length > 0 ? (
            <ul className="text-sm space-y-1">
              {student.dispensas.map((d) => (
                <li key={d.id}>
                  <span className="font-medium">{d.reason}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(d.startDate).toLocaleDateString(locale)}
                    {" \u2014 " + new Date(d.endDate).toLocaleDateString(locale)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Section>

        <Section icon={<Users className="size-4" />} title={t("guardians")}>
          {student.guardians.length > 0 ? (
            <ul className="text-sm space-y-1">
              {student.guardians.map((g) => (
                <li key={g.id} className="flex justify-between">
                  <span>
                    {g.guardian.name}{" "}
                    <span className="text-muted-foreground">({g.relationship})</span>
                  </span>
                  <span className="text-muted-foreground">{g.guardian.email}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Section>
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
    </PageScaffold>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <PageSection
      tone="secondary"
      layout="list"
      title={
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
      }
    >
      {children}
    </PageSection>
  );
}

function Stat({
  label,
  value,
  extra,
}: {
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-sm">{value}</span>
        {extra}
      </div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">—</p>;
}

const WHO_HEIGHT_M: Record<number, { p5: number; p50: number; p95: number }> = {
  10: { p5: 125, p50: 138, p95: 151 },
  11: { p5: 130, p50: 143, p95: 158 },
  12: { p5: 135, p50: 149, p95: 165 },
  13: { p5: 141, p50: 156, p95: 173 },
  14: { p5: 148, p50: 163, p95: 180 },
  15: { p5: 154, p50: 169, p95: 185 },
  16: { p5: 159, p50: 173, p95: 188 },
  17: { p5: 161, p50: 175, p95: 189 },
  18: { p5: 162, p50: 176, p95: 190 },
};

const WHO_HEIGHT_F: Record<number, { p5: number; p50: number; p95: number }> = {
  10: { p5: 125, p50: 138, p95: 152 },
  11: { p5: 132, p50: 144, p95: 159 },
  12: { p5: 139, p50: 151, p95: 165 },
  13: { p5: 145, p50: 156, p95: 169 },
  14: { p5: 148, p50: 159, p95: 172 },
  15: { p5: 150, p50: 161, p95: 173 },
  16: { p5: 151, p50: 162, p95: 174 },
  17: { p5: 151, p50: 162, p95: 174 },
  18: { p5: 151, p50: 163, p95: 174 },
};

export function HeightPercentilesChart({
  biometrics,
  sex,
  birthDate,
}: {
  biometrics: { heightM: number; recordedAt: string }[];
  sex: string;
  birthDate: string | null;
}) {
  const whoTable = sex === "M" ? WHO_HEIGHT_M : WHO_HEIGHT_F;

  const chartData: any[] = [10, 11, 12, 13, 14, 15, 16, 17, 18].map((age) => ({
    age,
    range: [whoTable[age].p5, whoTable[age].p95],
    p50: whoTable[age].p50,
    studentHeight: null,
  }));

  if (birthDate) {
    const bDate = new Date(birthDate);
    biometrics.forEach((b) => {
      const rDate = new Date(b.recordedAt);
      const ageAtMeasurement =
        (rDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      
      if (ageAtMeasurement >= 9 && ageAtMeasurement <= 19) {
        chartData.push({
          age: Number(ageAtMeasurement.toFixed(2)),
          range: null,
          p50: null,
          studentHeight: Math.round(b.heightM * 100),
        });
      }
    });
  }

  chartData.sort((a, b) => a.age - b.age);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="age"
          type="number"
          domain={[10, 18]}
          tickCount={9}
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
          tickFormatter={(v) => `${v} cm`}
        />
        <RechartsTooltip
          cursor={{ stroke: "var(--color-border)", strokeWidth: 1, strokeDasharray: "4 4" }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="rounded-lg border border-border/60 bg-background p-2.5 text-xs shadow-sm">
                  <p className="font-semibold mb-1">Idade: {data.age} anos</p>
                  {data.studentHeight !== null && <p className="text-success-600 font-bold mt-1">Aluno: {data.studentHeight} cm</p>}
                  {data.p50 !== null && <p className="text-muted-foreground mt-1">P50 (Médio): {data.p50} cm</p>}
                  {data.range && <p className="text-muted-foreground">P5-P95: {data.range[0]} - {data.range[1]} cm</p>}
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="range"
          stroke="none"
          fill="var(--color-success-500)"
          fillOpacity={0.15}
          connectNulls
          activeDot={false}
        />
        <Line
          type="monotone"
          dataKey="p50"
          stroke="var(--color-success-600)"
          strokeOpacity={0.6}
          strokeWidth={2}
          strokeDasharray="4 4"
          connectNulls
          dot={false}
          activeDot={false}
        />
        <Line
          type="monotone"
          dataKey="studentHeight"
          stroke="var(--color-success-600)"
          strokeWidth={3}
          connectNulls
          dot={{ r: 4, strokeWidth: 2, fill: "var(--color-background)", stroke: "var(--color-success-600)" }}
          activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-success-600)" }}
          isAnimationActive={true}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
