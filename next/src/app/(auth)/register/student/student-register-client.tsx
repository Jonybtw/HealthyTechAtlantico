"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Hash, Lock, Mail, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/api-client";
import { studentSelfRegisterFormSchema } from "@/lib/validations";

type StudentRegisterValues = z.infer<typeof studentSelfRegisterFormSchema>;

export default function StudentRegisterClient() {
  const router = useRouter();
  const t = useTranslations("registerStudent");
  const auth = useTranslations("auth");
  const common = useTranslations("common");
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<StudentRegisterValues>({
    resolver: zodResolver(studentSelfRegisterFormSchema),
    defaultValues: {
      name: "",
      email: "",
      studentProcessNumber: "",
      password: "",
      confirmPassword: "",
      consentRgpd: false,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setApiError(null);

    try {
      await readApiResponse(
        await fetch("/api/auth/register/student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name.trim(),
            email: values.email.trim().toLowerCase(),
            studentProcessNumber: values.studentProcessNumber.trim(),
            password: values.password,
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
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/12 bg-white/10 p-6 shadow-[0_28px_70px_rgba(5,14,24,0.34)] backdrop-blur-md sm:p-8">
      <div className="flex items-start gap-4 text-white">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-gold-200">
          <GraduationCap className="size-5" />
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

      <Form {...form}>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {apiError ? (
            <div className="rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-900 shadow-sm">
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
                    hint={t("emailHint")}
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
                    autoComplete="off"
                    leftIcon={<Hash className="size-4" />}
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
                <div className="flex items-start gap-3 rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm leading-6 text-white/82">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      className="mt-1 h-4 w-4 rounded border-white/20 accent-gold-300"
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

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          href="/register"
          className="font-semibold text-white/70 transition-colors hover:text-white"
        >
          {t("back")}
        </Link>
        <Link
          href="/login"
          className="font-semibold text-gold-200 transition-colors hover:text-gold-100"
        >
          {t("loginLink")}
        </Link>
      </div>
    </div>
  );
}
