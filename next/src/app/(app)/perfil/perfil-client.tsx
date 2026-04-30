"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Lock,
  ShieldCheck,
  Share2,
  Check,
  X,
  Save,
  Key,
  Shield,
  BadgeCheck,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { changePasswordFormSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageScaffold } from "@/components/ui/page-scaffold";
import { PageSection } from "@/components/ui/page-section";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { readApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type PasswordValues = z.infer<typeof changePasswordFormSchema>;
type UserProfile = {
  name: string | null;
  email: string;
  role: string;
  consentRgpd: boolean;
  consentShare: boolean;
};

const ROLE_STYLES: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  ADMIN: {
    label: "Administrador",
    bg: "bg-danger-50 dark:bg-danger-500/10",
    text: "text-danger-700 dark:text-danger-300",
    dot: "bg-danger-500",
  },
  PROFESSOR: {
    label: "Professor",
    bg: "bg-navy-50 dark:bg-navy-900/30",
    text: "text-navy-700 dark:text-navy-300",
    dot: "bg-navy-600",
  },
  ALUNO: {
    label: "Aluno",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    text: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  PAIS: {
    label: "Encarregado",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  PSICOLOGO: {
    label: "Psicólogo",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
};

function UserAvatar({ name, email }: { name?: string | null; email?: string }) {
  const displayName = name?.trim() || email || "?";
  const initials =
    displayName
      .split(" ")
      .filter((chunk) => Boolean(chunk) && !/^(prof|dr|dra|sr|sra)\.*$/i.test(chunk))
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join("") || (email?.[0] ?? "?").toUpperCase();

  return (
    <Avatar className="size-14 shadow-card ring-2 ring-white/10 dark:ring-white/5">
      <AvatarFallback className="font-display text-lg font-bold tracking-tight">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function ConsentCard({
  icon,
  iconBg,
  title,
  description,
  granted,
  loading,
  onGrant,
  onRevoke,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  granted: boolean;
  loading: boolean;
  onGrant: () => void;
  onRevoke: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-surface-secondary p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card sm:p-5">
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            iconBg,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {title}
              </h3>
            </div>
            {/* Current state badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-micro font-semibold",
                granted
                  ? "border border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-700/30 dark:bg-emerald-900/20 dark:text-emerald-300"
                  : "border border-border/60 bg-muted/60 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  granted
                    ? "bg-emerald-500 dark:bg-emerald-400"
                    : "bg-muted-foreground/40",
                )}
              />
              {granted ? "Ativo" : "Inativo"}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={granted ? "primary" : "ghost"}
              loading={loading && granted === false}
              disabled={loading || granted}
              icon={<Check className="size-3.5" />}
              onClick={onGrant}
            >
              Ativar
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!granted ? "danger" : "ghost"}
              loading={loading && granted === true}
              disabled={loading || !granted}
              icon={<X className="size-3.5" />}
              onClick={onRevoke}
            >
              Revogar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const t = useTranslations("perfil");
  const auth = useTranslations("auth");
  const common = useTranslations("common");
  const roles = useTranslations("roles");
  const { data: session, update } = useSession();
  const user = session?.user;

  const [updatingConsent, setUpdatingConsent] = useState<
    "rgpd" | "share" | null
  >(null);

  const pwForm = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
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
      await readApiResponse(response);

      toast.success(t("passwordSuccess"));
      pwForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : common("connectionError"),
      );
    }
  };

  const syncConsent = async (
    field: "consentRgpd" | "consentShare",
    value: boolean,
  ) => {
    setUpdatingConsent(field === "consentRgpd" ? "rgpd" : "share");

    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const body = await readApiResponse<UserProfile>(response);

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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : common("connectionError"),
      );
    } finally {
      setUpdatingConsent(null);
    }
  };

  const roleKey = user?.role ?? "ALUNO";
  const roleStyle = ROLE_STYLES[roleKey] ?? ROLE_STYLES.ALUNO;

  return (
    <PageScaffold
      className="gap-6"
      headerProps={{
        title: t("title"),
        description: t("description"),
        eyebrow: "CONTA · PERFIL",
      }}
    >
      <div className="grid gap-6 xl:grid-cols-2">
        {/* ── Identity & Consent ─────────────────────────────────────────── */}
        <PageSection
          tone="secondary"
          layout="default"
          eyebrow={t("activeAccount")}
          title={user?.name ?? user?.email ?? "—"}
          description={user?.name ? user.email : undefined}
          actions={<UserAvatar name={user?.name} email={user?.email} />}
        >
          {/* Role badge */}
          <div className="rounded-[24px] border border-border bg-surface-secondary px-4 py-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <BadgeCheck className="size-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("roleLabel")}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                  roleStyle.bg,
                  roleStyle.text,
                  "border-current/20",
                )}
              >
                <span
                  className={cn("size-1.5 rounded-full", roleStyle.dot)}
                />
                {roles(roleKey)}
              </span>
            </div>

            <div className="mt-3.5 flex items-center gap-2.5">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              <p className="truncate text-sm font-medium text-foreground">
                {user?.email ?? "—"}
              </p>
            </div>
          </div>

          {/* RGPD consent */}
          <ConsentCard
            icon={<ShieldCheck className="size-4" />}
            iconBg="bg-gold-100 text-gold-700 dark:bg-gold-400/10 dark:text-gold-300"
            title={t("rgpdTitle")}
            description={t("rgpdDescription")}
            granted={user?.consentRgpd ?? false}
            loading={updatingConsent === "rgpd"}
            onGrant={() => syncConsent("consentRgpd", true)}
            onRevoke={() => syncConsent("consentRgpd", false)}
          />

          {/* Share consent */}
          <ConsentCard
            icon={<Share2 className="size-4" />}
            iconBg="bg-navy-100 text-navy-700 dark:bg-navy-500/10 dark:text-navy-200"
            title={t("shareTitle")}
            description={t("shareDescription")}
            granted={user?.consentShare ?? false}
            loading={updatingConsent === "share"}
            onGrant={() => syncConsent("consentShare", true)}
            onRevoke={() => syncConsent("consentShare", false)}
          />
        </PageSection>

        {/* ── Change Password ─────────────────────────────────────────────── */}
        <Form {...pwForm}>
          <form onSubmit={pwForm.handleSubmit(onPasswordSubmit)}>
            <PageSection
              tone="primary"
              layout="form"
              className="overflow-hidden"
              eyebrow={t("securityTitle")}
              title={t("changePassword")}
              description={t("passwordDescription")}
              actions={
                <div className="flex size-9 items-center justify-center rounded-xl bg-danger-100 text-danger-700 dark:bg-danger-500/10 dark:text-danger-300">
                  <Lock className="size-4" />
                </div>
              }
            >
              {/* Hidden email for password managers */}
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={user?.email ?? ""}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
              />

              <div className="grid gap-3.5">
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
                          showPasswordLabel={auth("showPassword")}
                          hidePasswordLabel={auth("hidePassword")}
                          leftIcon={<Lock className="size-4" />}
                          error={
                            pwForm.formState.errors.currentPassword?.message
                          }
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
                          showPasswordLabel={auth("showPassword")}
                          hidePasswordLabel={auth("hidePassword")}
                          leftIcon={<Key className="size-4" />}
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
                          showPasswordLabel={auth("showPassword")}
                          hidePasswordLabel={auth("hidePassword")}
                          leftIcon={<Shield className="size-4" />}
                          error={
                            pwForm.formState.errors.confirmPassword?.message
                          }
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  loading={pwForm.formState.isSubmitting}
                  icon={<Save className="size-4" />}
                  className="h-12 w-full justify-center text-base"
                >
                  {t("savePassword")}
                </Button>
              </div>
            </PageSection>
          </form>
        </Form>
      </div>
    </PageScaffold>
  );
}
