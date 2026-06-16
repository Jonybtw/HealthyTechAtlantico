"use client";

// Componente cliente de /perfil: gere atualização de consentimentos e alteração
// de palavra-passe da conta atualmente autenticada.

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  Check,
  Key,
  Lock,
  Mail,
  Save,
  Share2,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { changePasswordFormSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { readApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useReducedEffects } from "@/hooks/use-reduced-effects";

type PasswordValues = z.infer<typeof changePasswordFormSchema>;
type UserProfile = {
  name: string | null;
  email: string;
  role: string;
  consentRgpd: boolean;
  consentShare: boolean;
};

const ROLE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  ADMIN:      { bg: "bg-danger-50 dark:bg-danger-500/10",   text: "text-danger-700 dark:text-danger-300",   dot: "bg-danger-500" },
  PROFESSOR:  { bg: "bg-navy-50 dark:bg-navy-900/30",       text: "text-navy-700 dark:text-navy-300",       dot: "bg-navy-600" },
  ALUNO:      { bg: "bg-sky-50 dark:bg-sky-900/20",         text: "text-sky-700 dark:text-sky-300",         dot: "bg-sky-500" },
  PAIS:       { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  PSICOLOGO:  { bg: "bg-violet-50 dark:bg-violet-900/20",   text: "text-violet-700 dark:text-violet-300",   dot: "bg-violet-500" },
};

function sectionAnimation(index: number, reducedEffects: boolean) {
  if (reducedEffects) return {};
  return { animationDelay: `${index * 80}ms` };
}

function getInitials(name?: string | null, email?: string) {
  const display = name?.trim() || email || "?";
  return (
    display
      .split(" ")
      .filter((c) => Boolean(c) && !/^(prof|dr|dra|sr|sra)\.*$/i.test(c))
      .slice(0, 2)
      .map((c) => c[0]?.toUpperCase())
      .join("") || (email?.[0] ?? "?").toUpperCase()
  );
}

function BioPanel({
  children,
  className,
  index,
  reducedEffects,
}: {
  children: React.ReactNode;
  className?: string;
  index: number;
  reducedEffects: boolean;
}) {
  return (
    <section
      style={sectionAnimation(index, reducedEffects)}
      className={cn(
        "relative overflow-hidden rounded-[12px] border border-border bg-card/88 shadow-[0_4px_12px_rgba(9,21,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/68 dark:shadow-[0_4px_18px_rgba(0,0,0,0.22)]",
        !reducedEffects && "animate-fade-in-up opacity-0",
        className,
      )}
    >
      <div className="relative">{children}</div>
    </section>
  );
}

export default function PerfilPage() {
  const t = useTranslations("perfil");
  const auth = useTranslations("auth");
  const common = useTranslations("common");
  const roles = useTranslations("roles");
  const reducedEffects = useReducedEffects();
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
        body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
      });
      await readApiResponse(response);
      toast.success(t("passwordSuccess"));
      pwForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : common("connectionError"));
    }
  };

  const syncConsent = async (field: "consentRgpd" | "consentShare", value: boolean) => {
    setUpdatingConsent(field === "consentRgpd" ? "rgpd" : "share");
    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const body = await readApiResponse<UserProfile>(response);
      await update({ name: body.name, email: body.email, role: body.role, consentRgpd: body.consentRgpd, consentShare: body.consentShare });
      if (field === "consentRgpd") {
        toast.success(value ? t("rgpdGrant") : t("rgpdRevoke"));
      } else {
        toast.success(value ? t("activate") : t("deactivate"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : common("connectionError"));
    } finally {
      setUpdatingConsent(null);
    }
  };

  const roleKey = user?.role ?? "ALUNO";
  const roleStyle = ROLE_STYLES[roleKey] ?? ROLE_STYLES.ALUNO!;

  return (
    <PageScaffold className="gap-5" headerProps={{ title: t("title"), description: t("description") }}>
      <div className="grid gap-5 xl:grid-cols-2">
        {/* ── Identity & Consent ── */}
        <BioPanel index={0} reducedEffects={reducedEffects} className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="size-14 shrink-0 shadow-card ring-2 ring-white/10 dark:ring-white/5">
              <AvatarFallback className="font-display text-lg font-bold tracking-tight">
                {getInitials(user?.name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("activeAccount")}</p>
              <h2 className="mt-0.5 truncate text-xl font-black tracking-[-0.04em] text-foreground">
                {user?.name ?? user?.email ?? "—"}
              </h2>
              {user?.name && (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-[12px] border border-border/70 bg-background/65 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-muted-foreground" />
              <span className="text-tiny font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("roleLabel")}</span>
            </div>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold border-current/20", roleStyle.bg, roleStyle.text)}>
              <span className={cn("size-1.5 rounded-full", roleStyle.dot)} />
              {roles(roleKey)}
            </span>
          </div>

          {/* RGPD consent */}
          <div className="mt-3 rounded-[12px] border border-border/70 bg-background/65 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-gold-100 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300">
                <ShieldCheck className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{t("rgpdTitle")}</p>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                    (user?.consentRgpd ?? false)
                      ? "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-700/30 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : "border-border/60 bg-muted/60 text-muted-foreground")}>
                    <span className={cn("size-1.5 rounded-full", (user?.consentRgpd ?? false) ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                    {(user?.consentRgpd ?? false) ? t("statusActive") : t("statusInactive")}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("rgpdDescription")}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant={user?.consentRgpd ? "primary" : "ghost"} loading={updatingConsent === "rgpd" && !(user?.consentRgpd ?? false)} disabled={updatingConsent === "rgpd" || (user?.consentRgpd ?? false)} icon={<Check className="size-3.5" />} onClick={() => syncConsent("consentRgpd", true)}>{t("activate")}</Button>
                  <Button size="sm" variant={!user?.consentRgpd ? "danger" : "ghost"} loading={updatingConsent === "rgpd" && (user?.consentRgpd ?? false)} disabled={updatingConsent === "rgpd" || !(user?.consentRgpd ?? false)} icon={<X className="size-3.5" />} onClick={() => syncConsent("consentRgpd", false)}>{t("revoke")}</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Share consent */}
          <div className="mt-3 rounded-[12px] border border-border/70 bg-background/65 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-navy-100 text-navy-700 dark:bg-navy-500/10 dark:text-navy-200">
                <Share2 className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{t("shareTitle")}</p>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                    (user?.consentShare ?? false)
                      ? "border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-700/30 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : "border-border/60 bg-muted/60 text-muted-foreground")}>
                    <span className={cn("size-1.5 rounded-full", (user?.consentShare ?? false) ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                    {(user?.consentShare ?? false) ? t("statusActive") : t("statusInactive")}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("shareDescription")}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant={user?.consentShare ? "primary" : "ghost"} loading={updatingConsent === "share" && !(user?.consentShare ?? false)} disabled={updatingConsent === "share" || (user?.consentShare ?? false)} icon={<Check className="size-3.5" />} onClick={() => syncConsent("consentShare", true)}>{t("activate")}</Button>
                  <Button size="sm" variant={!user?.consentShare ? "danger" : "ghost"} loading={updatingConsent === "share" && (user?.consentShare ?? false)} disabled={updatingConsent === "share" || !(user?.consentShare ?? false)} icon={<X className="size-3.5" />} onClick={() => syncConsent("consentShare", false)}>{t("revoke")}</Button>
                </div>
              </div>
            </div>
          </div>
        </BioPanel>

        {/* ── Change Password ── */}
        <BioPanel index={1} reducedEffects={reducedEffects} className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-danger-100 text-danger-700 dark:bg-danger-500/10 dark:text-danger-300">
              <Lock className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-tiny font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("securityTitle")}</p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">{t("changePassword")}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("passwordDescription")}</p>
            </div>
          </div>

          <Form {...pwForm}>
            <form onSubmit={pwForm.handleSubmit(onPasswordSubmit)} className="mt-5 grid gap-3.5">
              <input type="email" name="email" autoComplete="username" value={user?.email ?? ""} readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
              <FormField control={pwForm.control} name="currentPassword" render={({ field }) => (
                <FormItem><FormControl>
                  <Input label={t("currentPassword")} type="password" autoComplete="current-password" showPasswordLabel={auth("showPassword")} hidePasswordLabel={auth("hidePassword")} leftIcon={<Lock className="size-4" />} error={pwForm.formState.errors.currentPassword?.message} {...field} />
                </FormControl></FormItem>
              )} />
              <FormField control={pwForm.control} name="newPassword" render={({ field }) => (
                <FormItem><FormControl>
                  <Input label={t("newPassword")} type="password" autoComplete="new-password" showPasswordLabel={auth("showPassword")} hidePasswordLabel={auth("hidePassword")} leftIcon={<Key className="size-4" />} error={pwForm.formState.errors.newPassword?.message} {...field} />
                </FormControl></FormItem>
              )} />
              <FormField control={pwForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormControl>
                  <Input label={t("confirmPassword")} type="password" autoComplete="new-password" showPasswordLabel={auth("showPassword")} hidePasswordLabel={auth("hidePassword")} leftIcon={<Shield className="size-4" />} error={pwForm.formState.errors.confirmPassword?.message} {...field} />
                </FormControl></FormItem>
              )} />
              <div className="pt-1">
                <Button type="submit" loading={pwForm.formState.isSubmitting} icon={<Save className="size-4" />} className="h-12 w-full justify-center text-base">
                  {t("savePassword")}
                </Button>
              </div>
            </form>
          </Form>
        </BioPanel>
      </div>
    </PageScaffold>
  );
}
