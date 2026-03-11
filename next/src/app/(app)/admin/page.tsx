"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Settings, UserPlus, Trash2, Loader2, RefreshCw } from "lucide-react";
import { PageTransition, FadeIn } from "@/components/ui/motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createStaffSchema } from "@/lib/validations";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useUser } from "@/components/user-context";
import { useStaff, useDeleteStaff, type StaffUser } from "@/hooks/use-queries";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
} from "@/components/ui/form";

type StaffValues = z.infer<typeof createStaffSchema>;

const ROLE_VALUES = ["PROFESSOR", "PSICOLOGO"] as const;

export default function AdminPage() {
  const t = useTranslations("admin");
  const common = useTranslations("common");
  const roles = useTranslations("roles");
  const { role } = useUser();

  const { data: staff = [], isLoading: loading, refetch: loadStaff } = useStaff();
  const deleteStaffMutation = useDeleteStaff();

  const form = useForm<StaffValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { name: "", email: "", password: "", role: "PROFESSOR" },
  });

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);

  async function handleCreate(values: StaffValues) {
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email.trim().toLowerCase(),
          password: values.password,
          role: values.role,
          name: values.name.trim(),
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: common("connectionError") }));
        toast.error(error);
        return;
      }
      toast.success(t("createSuccess"));
      form.reset();
      loadStaff();
    } catch {
      toast.error(common("connectionError"));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteStaffMutation.mutateAsync(deleteTarget.id);
      toast.success(t("deleteSuccess"));
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : common("connectionError"));
    }
  }

  if (role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">{t("noPermission")}</p>
      </div>
    );
  }

  return (
    <PageTransition className="flex flex-col gap-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {/* ── Create staff ──────────────────────────────────────── */}
      <FadeIn delay={0.1} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <UserPlus size={18} className="text-navy-600" />
          {t("createTitle")}
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreate)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      label={t("nameLabel")}
                      placeholder="Ana Ferreira"
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
                      placeholder="••••••••"
                      error={form.formState.errors.password?.message}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div>
              <label className="block text-sm font-medium mb-1">{t("roleLabel")}</label>
              <PillSelect
                options={ROLE_VALUES.map((v) => ({ value: v, label: roles(v) }))}
                value={form.watch("role")}
                onChange={(v) => form.setValue("role", v as "PROFESSOR" | "PSICOLOGO")}
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
      </FadeIn>

      {/* ── Staff list ────────────────────────────────────────── */}
      <FadeIn delay={0.2} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Settings size={18} className="text-navy-600" />
            {t("listTitle")}
          </h2>
          <button
            onClick={() => loadStaff()}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            title={t("refreshList")}
            aria-label={t("refreshList")}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> {common("loading")}
          </div>
        )}

        {!loading && staff.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noStaff")}</p>
        )}

        {!loading && staff.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium">{t("nameLabel")}</th>
                  <th className="text-left py-2 px-3 font-medium">{t("emailLabel")}</th>
                  <th className="text-left py-2 px-3 font-medium">{t("roleLabel")}</th>
                  <th className="text-left py-2 px-3 font-medium">{t("createdAtLabel")}</th>
                  <th className="py-2 px-3" />
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3">{s.name ?? "—"}</td>
                    <td className="py-2 px-3 text-muted-foreground">{s.email}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.role === "PROFESSOR"
                            ? "bg-navy-100 text-navy-800"
                            : "bg-gold-100 text-gold-800"
                        }`}
                      >
                        {roles(s.role)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => setDeleteTarget(s)}
                        className="p-1.5 rounded-md hover:bg-danger-50 text-muted-foreground hover:text-danger-600"
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
        )}
      </FadeIn>

      {/* ── Confirm delete ───────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteTarget}
        title={t("deleteTitle")}
        message={`${t("deleteTitle")} "${deleteTarget?.name ?? deleteTarget?.email}"?`}
        confirmLabel={t("deleteBtn")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </PageTransition>
  );
}
