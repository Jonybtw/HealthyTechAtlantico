"use client";

// Componente cliente de /register/guardian: recolhe dados do encarregado e o
// número de processo do aluno para pedir associação após verificação de email.

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeInfo, Lock, Mail, User, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/api-client";
import { guardianSelfRegisterFormSchema } from "@/lib/validations";

type GuardianRegisterValues = z.infer<typeof guardianSelfRegisterFormSchema>;

export default function GuardianRegisterClient() {
  const router = useRouter();
  const t = useTranslations("registerGuardian");
  const auth = useTranslations("auth");
  const common = useTranslations("common");
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<GuardianRegisterValues>({
    resolver: zodResolver(guardianSelfRegisterFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      studentProcessNumber: "",
      consentRgpd: false,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setApiError(null);

    try {
      await readApiResponse(
        await fetch("/api/auth/register/guardian", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name.trim(),
            email: values.email.trim().toLowerCase(),
            password: values.password,
            studentProcessNumber: values.studentProcessNumber.trim(),
            consentRgpd: values.consentRgpd,
          }),
        }),
      );

      router.push(
        `/login?registered=1&email=${encodeURIComponent(
          values.email.trim().toLowerCase(),
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
          <Users className="size-5" />
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

      <Form {...form}>
        <form onSubmit={handleSubmit} className="relative flex flex-col gap-4 p-5 sm:p-6">
          {apiError ? (
            <div className="rounded-[16px] border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-900 shadow-sm dark:border-danger-900/50 dark:bg-danger-950/40 dark:text-danger-200">
              {apiError}
            </div>
          ) : null}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    label={t("nameLabel")}
                    autoComplete="name"
                    leftIcon={<User className="size-4" />}
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
                    autoComplete="email"
                    leftIcon={<Mail className="size-4" />}
                    error={form.formState.errors.email?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="studentProcessNumber"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    label={t("processNumberLabel")}
                    leftIcon={<BadgeInfo className="size-4" />}
                    hint={t("processNumberHint")}
                    error={form.formState.errors.studentProcessNumber?.message}
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
                    autoComplete="new-password"
                    leftIcon={<Lock className="size-4" />}
                    hint={t("passwordRules")}
                    showPasswordLabel={auth("showPassword")}
                    hidePasswordLabel={auth("hidePassword")}
                    error={form.formState.errors.password?.message}
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
                    leftIcon={<Lock className="size-4" />}
                    showPasswordLabel={auth("showPassword")}
                    hidePasswordLabel={auth("hidePassword")}
                    error={form.formState.errors.confirmPassword?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consentRgpd"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3 rounded-[16px] border border-white/20 bg-white/30 px-4 py-3 text-sm leading-6 text-muted-foreground backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      className="mt-1 h-4 w-4 rounded border-border accent-navy-900 dark:accent-gold-300"
                    />
                  </FormControl>
                  <FormLabel className="font-normal">{t("consentLabel")}</FormLabel>
                </div>
                <FormMessage />
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

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/20 px-5 py-4 text-sm dark:border-white/10 sm:px-6">
        <Link
          href="/register"
          className="font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("back")}
        </Link>
        <Link
          href="/login"
          className="font-semibold text-gold-600 transition-colors hover:text-gold-500 dark:text-gold-400 dark:hover:text-gold-300"
        >
          {t("loginLink")}
        </Link>
      </div>
    </div>
  );
}
