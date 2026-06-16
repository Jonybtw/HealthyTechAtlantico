"use client";

// Componente cliente de /change-password: valida campos, chama a API de troca
// de palavra-passe e trata o fluxo forçado quando necessário.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Lock, Mail, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/api-client";
import { publicChangePasswordFormSchema } from "@/lib/validations";

type ChangePasswordValues = z.infer<typeof publicChangePasswordFormSchema>;

export default function ChangePasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("changePasswordPage");
  const auth = useTranslations("auth");
  const common = useTranslations("common");
  const [apiError, setApiError] = useState<string | null>(null);
  const forced = searchParams.get("forced") === "1";
  const emailFromQuery = searchParams.get("email") ?? "";
  const tokenFromQuery = searchParams.get("token") ?? "";
  const lockedEmail = emailFromQuery;

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(publicChangePasswordFormSchema),
    defaultValues: {
      email: lockedEmail,
      token: tokenFromQuery,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (lockedEmail) {
      form.setValue("email", lockedEmail, { shouldDirty: false });
    }
    if (tokenFromQuery) {
      form.setValue("token", tokenFromQuery, { shouldDirty: false });
    }
  }, [form, lockedEmail, tokenFromQuery]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setApiError(null);

    try {
      await readApiResponse(
        await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email?.trim().toLowerCase(),
            token: values.token || undefined,
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          }),
        }),
      );

      await signOut({ redirect: false });

      router.push(
        `/login?passwordChanged=1&email=${encodeURIComponent(
          values.email?.trim().toLowerCase() ?? lockedEmail,
        )}`,
      );
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : common("connectionError"),
      );
    }
  });

  return (
    <div className="relative w-full overflow-hidden rounded-[24px] border border-white/20 bg-white/60 shadow-[0_20px_60px_rgba(5,14,24,0.09)] backdrop-blur-md dark:border-white/10 dark:bg-navy-950/60 dark:shadow-[0_20px_60px_rgba(5,14,24,0.32)]">
      {/* Gold gradient top line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      {/* Radial gold glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(244,211,94,0.08),transparent_44%)]" />
      <div className="relative flex items-start gap-4 border-b border-white/20 px-5 py-5 dark:border-white/10 sm:px-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[16px] border border-white/20 bg-white/40 text-gold-600 dark:border-white/10 dark:bg-black/20 dark:text-gold-400">
          <KeyRound className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
            {t("eyebrow")}
          </p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
            {t("description")}
          </p>
        </div>
      </div>

      {forced ? (
        <div className="mx-5 mt-4 flex gap-3 rounded-[16px] border border-gold-300/40 bg-gold-50 px-4 py-3 text-sm leading-6 text-foreground dark:border-gold-400/20 dark:bg-gold-900/15 sm:mx-6">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold-600 dark:text-gold-400" />
          <span>{t("forcedNotice")}</span>
        </div>
      ) : null}

      <Form {...form}>
        <form onSubmit={handleSubmit} className="relative flex flex-col gap-4 p-5 sm:p-6">
          {apiError ? (
            <div className="rounded-[16px] border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-900 shadow-sm dark:border-danger-900/50 dark:bg-danger-950/40 dark:text-danger-200">
              {apiError}
            </div>
          ) : null}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    label={t("emailLabel")}
                    type="email"
                    autoComplete="email"
                    leftIcon={<Mail className="size-4" />}
                    error={form.formState.errors.email?.message}
                    readOnly={Boolean(lockedEmail)}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    label={t("currentPasswordLabel")}
                    type="password"
                    autoComplete="current-password"
                    leftIcon={<Lock className="size-4" />}
                    showPasswordLabel={auth("showPassword")}
                    hidePasswordLabel={auth("hidePassword")}
                    error={form.formState.errors.currentPassword?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    label={t("newPasswordLabel")}
                    type="password"
                    autoComplete="new-password"
                    leftIcon={<KeyRound className="size-4" />}
                    hint={t("passwordRules")}
                    showPasswordLabel={auth("showPassword")}
                    hidePasswordLabel={auth("hidePassword")}
                    error={form.formState.errors.newPassword?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    label={t("confirmPasswordLabel")}
                    type="password"
                    autoComplete="new-password"
                    leftIcon={<KeyRound className="size-4" />}
                    showPasswordLabel={auth("showPassword")}
                    hidePasswordLabel={auth("hidePassword")}
                    error={form.formState.errors.confirmPassword?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            className="h-12 w-full justify-center text-base"
          >
            {t("submit")}
          </Button>
        </form>
      </Form>

      <div className="relative flex justify-center border-t border-white/20 px-5 py-4 text-sm dark:border-white/10 sm:px-6">
        <Link
          href="/login"
          className="font-semibold text-gold-600 transition-colors hover:text-gold-500 dark:text-gold-400 dark:hover:text-gold-300"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
