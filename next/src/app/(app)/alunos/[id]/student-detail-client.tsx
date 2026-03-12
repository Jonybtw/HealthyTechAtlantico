"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Ruler, Timer, ClipboardList, ShieldOff, Users, Pencil, Trash2, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createStudentSchema } from "@/lib/validations";
import { PageHeader } from "@/components/ui/page-header";
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
import { PageTransition } from "@/components/ui/motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const age = student.birthDate
    ? Math.floor(
        (Date.now() - new Date(student.birthDate).getTime()) / (365.25 * 24 * 3600_000)
      )
    : null;

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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t("saveError"));
        return;
      }
      toast.success(t("saveSuccess"));
      setEditing(false);
      router.refresh();
    } catch {
      toast.error(common("connectionError"));
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? t("deleteError"));
        return;
      }
      toast.success(t("deleteSuccess"));
      router.push("/alunos");
    } catch {
      toast.error(common("connectionError"));
    }
  };

  return (
    <PageTransition className="flex flex-col gap-5">
      <PageHeader
        title={student.name}
        description={`${student.sex === "M" ? t("male") : t("female")}${age !== null && age !== undefined ? " \u00b7 " + age + " " + t("years") : ""} \u00b7 ${
          student.className
            ? student.className + " (" + (student.schoolYear ?? "") + ")"
            : t("noClass")
        }`}
      >
        {canManageStudent && (
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
        )}
      </PageHeader>

      {/* Edit form */}
      {editing && (
        <Form {...editForm}>
          <form
            onSubmit={editForm.handleSubmit(handleSave)}
            className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-5 flex flex-col gap-4 max-w-lg"
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
            <div className="grid grid-cols-2 gap-2 text-sm">
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
    </PageTransition>
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
    <div className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-5 flex flex-col gap-3">
      <h3 className="flex items-center gap-2 font-semibold text-sm">
        {icon}
        {title}
      </h3>
      {children}
    </div>
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
