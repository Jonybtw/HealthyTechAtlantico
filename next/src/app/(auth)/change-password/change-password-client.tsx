"use client";

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
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/12 bg-white/10 p-6 shadow-[0_28px_70px_rgba(5,14,24,0.34)] backdrop-blur-md sm:p-8">
      <div className="flex items-start gap-4 text-white">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-gold-200">
          <KeyRound className="size-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-200/90">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm leading-7 text-white/72">
            {t("description")}
          </p>
        </div>
      </div>

      {forced ? (
        <div className="mt-6 flex gap-3 rounded-2xl border border-gold-300/25 bg-gold-300/10 px-4 py-3 text-sm leading-6 text-white/84">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold-200" />
          <span>{t("forcedNotice")}</span>
        </div>
      ) : null}

      <Form {...form}>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {apiError ? (
            <div className="rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-900 shadow-sm">
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

      <div className="mt-6 flex justify-center text-sm">
        <Link
          href="/login"
          className="font-semibold text-gold-200 transition-colors hover:text-gold-100"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
