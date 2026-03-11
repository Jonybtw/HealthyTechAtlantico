"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Lock, ShieldCheck, Share2, User } from "lucide-react";
import { PageTransition, FadeIn } from "@/components/ui/motion";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { changePasswordFormSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
} from "@/components/ui/form";

type PasswordValues = z.infer<typeof changePasswordFormSchema>;

export default function PerfilPage() {
  const t = useTranslations("perfil");
  const common = useTranslations("common");
  const { data: session, update } = useSession();
  const user = session?.user;

  const [updatingConsent, setUpdatingConsent] = useState<"rgpd" | "share" | null>(null);

  const pwForm = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onPasswordSubmit = async (values: PasswordValues) => {
    try {
      const response = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        toast.error(body.error ?? common("connectionError"));
        return;
      }

      toast.success(t("passwordSuccess"));
      pwForm.reset();
    } catch {
      toast.error(common("connectionError"));
    }
  };

  const syncConsent = async (
    field: "consentRgpd" | "consentShare",
    value: boolean
  ) => {
    setUpdatingConsent(field === "consentRgpd" ? "rgpd" : "share");

    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(body.error ?? common("connectionError"));
        return;
      }

      await update({
        name: body.name,
        email: body.email,
        role: body.role,
        consentRgpd: body.consentRgpd,
        consentShare: body.consentShare,
      });

      if (field === "consentRgpd") {
        toast.success(value ? t("rgpdGrant") : t("rgpdRevoke"));
      } else {
        toast.success(value ? t("activate") : t("deactivate"));
      }
    } catch {
      toast.error(common("connectionError"));
    } finally {
      setUpdatingConsent(null);
    }
  };

  return (
    <PageTransition className="flex flex-col gap-5">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <FadeIn delay={0.1} className="overflow-hidden rounded-2xl border border-border/70 bg-card/85 p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 text-white shadow-card">
                <User className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {t("activeAccount")}
                </p>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  {user?.name || user?.email || "—"}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/65 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {t("roleLabel")}
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">{user?.role}</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/65 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gold-100 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {t("rgpdTitle")}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Controla o acesso ao tratamento dos teus dados de saude e atualiza a sessao de imediato.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      size="sm"
                      variant={user?.consentRgpd ? "primary" : "ghost"}
                      loading={updatingConsent === "rgpd"}
                      onClick={() => syncConsent("consentRgpd", true)}
                    >
                      {t("rgpdGrant")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!user?.consentRgpd ? "danger" : "ghost"}
                      loading={updatingConsent === "rgpd"}
                      onClick={() => syncConsent("consentRgpd", false)}
                    >
                      {t("rgpdRevoke")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/65 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-navy-100 text-navy-700 dark:bg-navy-500/10 dark:text-navy-200">
                  <Share2 className="size-5" />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {t("shareTitle")}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Define se os teus dados podem ser partilhados com os encarregados associados.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      size="sm"
                      variant={user?.consentShare ? "secondary" : "ghost"}
                      loading={updatingConsent === "share"}
                      onClick={() => syncConsent("consentShare", true)}
                    >
                      {t("activate")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!user?.consentShare ? "ghost" : "danger"}
                      loading={updatingConsent === "share"}
                      onClick={() => syncConsent("consentShare", false)}
                    >
                      {t("deactivate")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        <Form {...pwForm}>
          <form
            onSubmit={pwForm.handleSubmit(onPasswordSubmit)}
            className="overflow-hidden rounded-2xl border border-border/70 bg-card/85 p-5 shadow-card sm:p-6"
          >
            <div className="flex h-full flex-col gap-5">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {t("securityTitle")}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-danger-100 text-danger-700 dark:bg-danger-500/10 dark:text-danger-300">
                    <Lock className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                      {t("changePassword")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Atualiza a palavra-passe da tua conta com requisitos de producao.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <FormField
                  control={pwForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          label={t("currentPassword")}
                          type="password"
                          autoComplete="current-password"
                          error={pwForm.formState.errors.currentPassword?.message}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={pwForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          label={t("newPassword")}
                          type="password"
                          autoComplete="new-password"
                          error={pwForm.formState.errors.newPassword?.message}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={pwForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          label={t("confirmPassword")}
                          type="password"
                          autoComplete="new-password"
                          error={pwForm.formState.errors.confirmPassword?.message}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-auto flex justify-start">
                <Button type="submit" loading={pwForm.formState.isSubmitting}>
                  {t("savePassword")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </PageTransition>
  );
}
