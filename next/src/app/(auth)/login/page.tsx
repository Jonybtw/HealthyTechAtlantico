"use client";

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
    <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_32px_80px_-12px_rgba(9,21,35,0.22),0_2px_12px_rgba(9,21,35,0.08)]">
      <div className="flex items-center gap-3 border-b border-border/60 px-6 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-navy-900 text-gold-300">
          <LogIn className="size-4" />
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">
            {t("login")}
          </h1>
          <p className="text-xs text-muted-foreground">
            Acede ao painel institucional
          </p>
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
