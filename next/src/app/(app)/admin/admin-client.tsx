"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  KeyRound,
  Lock,
  RefreshCw,
  Settings,
  ShieldOff,
  Trash2,
  UserPlus,
  Users,
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
import {
  useAdminUsers,
  useDeleteStaff,
  useForceResetPassword,
  useStaff,
  type AdminUser,
  type StaffUser,
} from "@/hooks/use-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { readApiResponse } from "@/lib/api-client";
import { createStaffSchema } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

type StaffValues = z.infer<typeof createStaffSchema>;

const ROLE_VALUES = ["PROFESSOR", "PSICOLOGO"] as const;

function getRoleBadgeClass(role: AdminUser["role"] | StaffUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300";
    case "ALUNO":
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
    case "PAIS":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "PROFESSOR":
      return "bg-navy-100 text-navy-800 dark:bg-navy-800/40 dark:text-navy-200";
    case "PSICOLOGO":
      return "bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-300";
    default:
      return "bg-muted text-foreground";
  }
}

export default function AdminPage() {
  const t = useTranslations("admin");
  const auth = useTranslations("auth");
  const common = useTranslations("common");
  const roles = useTranslations("roles");
  const locale = useLocale();
  const { role, id: currentUserId } = useUser();

  const {
    data: staff = [],
    isLoading: loadingStaff,
    refetch: loadStaff,
  } = useStaff();
  const {
    data: users = [],
    isLoading: loadingUsers,
    refetch: loadUsers,
  } = useAdminUsers();
  const deleteStaffMutation = useDeleteStaff();
  const forceResetMutation = useForceResetPassword();

  const form = useForm<StaffValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { name: "", email: "", password: "", role: "PROFESSOR" },
  });
  const selectedRole =
    useWatch({ control: form.control, name: "role" }) ?? "PROFESSOR";

  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const normalizedQuery = userSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => {
      const haystack = [
        user.name ?? "",
        user.email,
        roles(user.role),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [roles, userSearch, users]);

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
      loadUsers();
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
      loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : common("connectionError"),
      );
    }
  }

  async function handleForceReset() {
    if (!resetTarget) {
      return;
    }

    try {
      await forceResetMutation.mutateAsync(resetTarget.id);
      toast.success(
        t("forceResetSuccess", {
          email: resetTarget.email,
        }),
      );
      setResetTarget(null);
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
          description={t("staffCreateDescription")}
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
              loading={loadingStaff}
              aria-label={t("refreshList")}
              onClick={() => loadStaff()}
            />
          }
        >
          {loadingStaff ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12 w-full rounded-[8px]" />
              <Skeleton className="h-12 w-full rounded-[8px]" />
              <Skeleton className="h-12 w-full rounded-[8px]" />
            </div>
          ) : null}

          {!loadingStaff && staff.length === 0 ? (
            <EmptyState
              icon={Settings}
              title={t("noStaff")}
              description={t("noStaffDesc")}
            />
          ) : null}

          {!loadingStaff && staff.length > 0 ? (
            <div className="surface-utility overflow-x-auto rounded-[12px] p-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20 bg-muted/30 dark:border-white/10">
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
                      className="border-b border-white/20 transition-colors hover:bg-muted/30 dark:border-white/10"
                    >
                      <td className="px-4 py-3">{staffUser.name ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {staffUser.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-[8px] px-2.5 py-1 text-xs font-medium ${getRoleBadgeClass(
                            staffUser.role,
                          )}`}
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
                          className="rounded-[8px] border border-transparent p-1.5 text-muted-foreground transition-all hover:border-danger-200 hover:bg-danger-50 hover:text-danger-600 dark:hover:border-danger-800/30 dark:hover:bg-danger-900/20"
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

      <FadeIn delay={0.3}>
        <PageSection
          title={t("userListTitle")}
          description={t("userListDescription", { count: filteredUsers.length })}
          tone="secondary"
          actions={
            <Button
              size="icon"
              variant="ghost"
              icon={<RefreshCw size={15} />}
              loading={loadingUsers}
              aria-label={t("refreshUsers")}
              onClick={() => loadUsers()}
            />
          }
        >
          <div className="mb-4">
            <Input
              label={t("searchLabel")}
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
            />
          </div>

          {loadingUsers ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12 w-full rounded-[8px]" />
              <Skeleton className="h-12 w-full rounded-[8px]" />
              <Skeleton className="h-12 w-full rounded-[8px]" />
            </div>
          ) : null}

          {!loadingUsers && filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("noUsers")}
              description={t("noUsersDesc")}
            />
          ) : null}

          {!loadingUsers && filteredUsers.length > 0 ? (
            <div className="surface-utility overflow-x-auto rounded-[12px] p-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20 bg-muted/30 dark:border-white/10">
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
                      {t("statusLabel")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      {t("createdAtLabel")}
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/20 transition-colors hover:bg-muted/30 dark:border-white/10"
                    >
                      <td className="px-4 py-3">{user.name ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-[8px] px-2.5 py-1 text-xs font-medium ${getRoleBadgeClass(
                            user.role,
                          )}`}
                        >
                          {roles(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-block rounded-[8px] px-2.5 py-1 text-xs font-medium ${
                              user.emailVerified
                                ? "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            }`}
                          >
                            {user.emailVerified
                              ? t("verifiedStatus")
                              : t("pendingVerification")}
                          </span>
                          {user.mustChangePassword ? (
                            <span className="inline-block rounded-[8px] bg-danger-100 px-2.5 py-1 text-xs font-medium text-danger-700 dark:bg-danger-900/30 dark:text-danger-300">
                              {t("needsResetStatus")}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString(locale)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          icon={<KeyRound size={15} />}
                          disabled={
                            forceResetMutation.isPending ||
                            user.id === currentUserId
                          }
                          onClick={() => setResetTarget(user)}
                        >
                          {t("forceResetButton")}
                        </Button>
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

      <ConfirmModal
        open={!!resetTarget}
        title={t("forceResetTitle")}
        message={t("forceResetDescription", {
          email: resetTarget?.email ?? "",
        })}
        confirmLabel={t("forceResetButton")}
        onConfirm={handleForceReset}
        onCancel={() => setResetTarget(null)}
      />
    </PageScaffold>
  );
}
