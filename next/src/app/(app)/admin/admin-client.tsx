"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  Lock,
  RefreshCw,
  Settings,
  ShieldOff,
  Trash2,
  UserPlus,
} from "lucide-react";
import type { z } from "zod";
import { FadeIn } from "@/components/ui/motion";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useUser } from "@/components/user-context";
import { useDeleteStaff, useStaff, type StaffUser } from "@/hooks/use-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { readApiResponse } from "@/lib/api-client";
import { createStaffSchema } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

type StaffValues = z.infer<typeof createStaffSchema>;

const ROLE_VALUES = ["PROFESSOR", "PSICOLOGO"] as const;

export default function AdminPage() {
  const t = useTranslations("admin");
  const auth = useTranslations("auth");
  const common = useTranslations("common");
  const roles = useTranslations("roles");
  const locale = useLocale();
  const { role } = useUser();

  const {
    data: staff = [],
    isLoading: loading,
    refetch: loadStaff,
  } = useStaff();
  const deleteStaffMutation = useDeleteStaff();

  const form = useForm<StaffValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { name: "", email: "", password: "", role: "PROFESSOR" },
  });
  const selectedRole =
    useWatch({ control: form.control, name: "role" }) ?? "PROFESSOR";

  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);

  async function handleCreate(values: StaffValues) {
    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          password: values.password,
          role: values.role,
          name: values.name.trim(),
        }),
      });

      await readApiResponse<StaffUser>(response);
      toast.success(t("createSuccess"));
      form.reset();
      loadStaff();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : common("connectionError"),
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteStaffMutation.mutateAsync(deleteTarget.id);
      toast.success(t("deleteSuccess"));
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : common("connectionError"),
      );
    }
  }

  if (role !== "ADMIN") {
    return (
      <PageScaffold
        headerProps={{
          title: t("title"),
          description: t("description"),
          eyebrow: "SISTEMA · ADMINISTRAÇÃO",
        }}
      >
        <EmptyState
          icon={ShieldOff}
          title={common("noPermission")}
          description={t("description")}
        />
      </PageScaffold>
    );
  }

  return (
    <PageScaffold
      headerProps={{
        title: t("title"),
        description: t("description"),
        meta: roles(role),
      }}
    >
      <FadeIn delay={0.1}>
        <PageSection
          title={t("createTitle")}
          description={t("description")}
          tone="primary"
        >
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreate)}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        label={t("nameLabel")}
                        placeholder="Ana Ferreira"
                        autoComplete="name"
                        error={form.formState.errors.name?.message}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        label={t("emailLabel")}
                        type="email"
                        placeholder="ana.ferreira@escola.pt"
                        autoComplete="email"
                        error={form.formState.errors.email?.message}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        label={t("passwordLabel")}
                        type="password"
                        placeholder="Palavra-passe"
                        autoComplete="new-password"
                        showPasswordLabel={auth("showPassword")}
                        hidePasswordLabel={auth("hidePassword")}
                        leftIcon={<Lock className="size-4" />}
                        error={form.formState.errors.password?.message}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div>
                <PillSelect
                  label={t("roleLabel")}
                  options={ROLE_VALUES.map((value) => ({
                    value,
                    label: roles(value),
                  }))}
                  value={selectedRole}
                  onChange={(value) =>
                    form.setValue("role", value as "PROFESSOR" | "PSICOLOGO")
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  loading={form.formState.isSubmitting}
                  icon={<UserPlus size={16} />}
                  className="self-start"
                >
                  {t("createBtn")}
                </Button>
              </div>
            </form>
          </Form>
        </PageSection>
      </FadeIn>

      <FadeIn delay={0.2}>
        <PageSection
          title={t("listTitle")}
          description={t("staffCount", { count: staff.length })}
          tone="secondary"
          actions={
            <Button
              size="icon"
              variant="ghost"
              icon={<RefreshCw size={15} />}
              loading={loading}
              aria-label={t("refreshList")}
              onClick={() => loadStaff()}
            />
          }
        >
          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : null}

          {!loading && staff.length === 0 ? (
            <EmptyState
              icon={Settings}
              title={t("noStaff")}
              description={t("noStaffDesc")}
            />
          ) : null}

          {!loading && staff.length > 0 ? (
            <div className="surface-utility overflow-x-auto rounded-2xl p-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20 dark:border-white/10 bg-muted/30">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      {t("nameLabel")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      {t("emailLabel")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      {t("roleLabel")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      {t("createdAtLabel")}
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {staff.map((staffUser) => (
                    <tr
                      key={staffUser.id}
                      className="border-b border-white/20 dark:border-white/10 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">{staffUser.name ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {staffUser.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-xl px-2.5 py-1 text-xs font-medium ${
                            staffUser.role === "PROFESSOR"
                              ? "bg-navy-100 text-navy-800 dark:bg-navy-800/40 dark:text-navy-200"
                              : "bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-300"
                          }`}
                        >
                          {roles(staffUser.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(staffUser.createdAt).toLocaleDateString(
                          locale,
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteTarget(staffUser)}
                          className="rounded-xl border border-transparent p-1.5 text-muted-foreground transition-all hover:border-danger-200 hover:bg-danger-50 hover:text-danger-600 dark:hover:border-danger-800/30 dark:hover:bg-danger-900/20"
                          aria-label={t("deleteBtn")}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </PageSection>
      </FadeIn>

      <ConfirmModal
        open={!!deleteTarget}
        title={t("deleteTitle")}
        message={`${t("deleteTitle")} "${deleteTarget?.name ?? deleteTarget?.email}"?`}
        confirmLabel={t("deleteBtn")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </PageScaffold>
  );
}
