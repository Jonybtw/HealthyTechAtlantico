"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { registerFormSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
} from "@/components/ui/form";

type RegisterValues = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "ALUNO",
      consentRgpd: true as const,
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    setApiError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name?.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          role: values.role,
          consentRgpd: true,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setApiError(body.error ?? t("createError"));
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setApiError(t("connectionError"));
    }
  };

  return (
    <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
      <div className="border-b border-border/70 bg-[linear-gradient(135deg,rgba(8,22,43,0.98),rgba(28,48,74,0.94))] px-6 py-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold-200/80">
              {t("newAccountTagline")}
            </p>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
              {t("register")}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy-100/75">
              Cria uma conta segura para acompanhar o teu percurso ou o dos teus educandos.
            </p>
          </div>
          <div className="hidden rounded-xl border border-white/10 bg-white/8 p-2.5 sm:block">
            <Image
              src="/logo.png"
              alt="HealthyTech Atlantico"
              width={64}
              height={64}
              className="object-contain brightness-0 invert"
              priority
            />
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-6">
          {apiError ? (
            <div className="rounded-2xl border border-danger-300/60 bg-danger-50/80 px-4 py-3 text-sm text-danger-700 dark:border-danger-900/30 dark:bg-danger-950/20 dark:text-danger-200">
              {apiError}
            </div>
          ) : null}

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      label={t("name")}
                      placeholder="Maria Silva"
                      autoFocus
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
                      label={t("email")}
                      type="email"
                      placeholder="exemplo@escola.pt"
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
                      label={t("password")}
                      type="password"
                      placeholder="Password"
                      autoComplete="new-password"
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
                      label={t("confirmPassword")}
                      type="password"
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      error={form.formState.errors.confirmPassword?.message}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold tracking-tight text-foreground">
              {t("roleLabel")}
            </label>
            <PillSelect
              options={[
                { value: "ALUNO", label: t("role_aluno") },
                { value: "PAIS", label: t("role_pais") },
              ]}
              value={form.watch("role")}
              onChange={(value) =>
                form.setValue("role", value as "ALUNO" | "PAIS")
              }
            />
          </div>

          <div className="rounded-xl border border-border/70 bg-background/65 p-3.5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.watch("consentRgpd") === true}
                onChange={(e) =>
                  form.setValue(
                    "consentRgpd",
                    e.target.checked ? true : (false as unknown as true),
                    { shouldValidate: true }
                  )
                }
                className="mt-1 h-4 w-4 rounded border-border accent-navy-900"
              />
              <span className="text-sm leading-relaxed text-muted-foreground">
                {t("rgpdConsent")}
              </span>
            </label>
            {form.formState.errors.consentRgpd ? (
              <p className="mt-2 text-xs font-medium text-danger-600">
                {form.formState.errors.consentRgpd.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            icon={<UserPlus className="size-4" />}
            className="w-full justify-center"
          >
            {t("createAccount")}
          </Button>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-sm">
            <p className="text-muted-foreground">{t("hasAccount")}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 font-semibold text-navy-700 transition-colors hover:text-gold-700 dark:text-gold-300"
            >
              {t("login")}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
