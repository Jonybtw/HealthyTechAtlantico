"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { ArrowRight, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { loginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setApiError(null);

    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setApiError(t("wrongCredentials"));
        return;
      }

      router.push("/dashboard");
      router.refresh();
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
              HealthyTech Atlântico
            </p>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
              {t("login")}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy-100/75">
              Acede ao painel institucional para acompanhar alunos, alertas e relatórios.
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
                    autoFocus
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
                    autoComplete="current-password"
                    error={form.formState.errors.password?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            icon={<LogIn className="size-4" />}
            className="w-full justify-center"
          >
            {t("enter")}
          </Button>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-sm">
            <p className="text-muted-foreground">{t("noAccount")}</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 font-semibold text-navy-700 transition-colors hover:text-gold-700 dark:text-gold-300"
            >
              {t("createAccount")}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
