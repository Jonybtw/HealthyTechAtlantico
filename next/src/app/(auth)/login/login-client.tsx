"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { loginSchema, registerFormSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { readApiResponse } from "@/lib/api-client";

type RegisterValues = z.infer<typeof registerFormSchema>;

const expandVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.32,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.22,
      ease: [0.55, 0, 1, 0.45] as [number, number, number, number],
    },
  },
};

function getPasswordStrength(pwd: string): 0 | 1 | 2 | 3 | 4 {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const registeredSuccess = searchParams.get("registered") === "1";

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    setMode(requestedMode === "register" ? "register" : "login");
    setApiError(null);
  }, [searchParams]);

  useEffect(() => {
    document.title = `${mode === "login" ? t("login") : t("register")} · HTA`;
  }, [mode, t]);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "ALUNO",
      consentRgpd: false,
    },
  });

  const passwordValue =
    useWatch({ control: form.control, name: "password" }) ?? "";
  const roleValue =
    useWatch({ control: form.control, name: "role" }) ?? "ALUNO";
  const consentRgpd =
    useWatch({ control: form.control, name: "consentRgpd" }) ?? false;
  const strength = getPasswordStrength(passwordValue);
  const strengthData = [
    null,
    {
      label: t("strengthWeak"),
      bar: "bg-danger-500",
      text: "text-danger-600 dark:text-danger-400",
    },
    {
      label: t("strengthFair"),
      bar: "bg-orange-400",
      text: "text-orange-500 dark:text-orange-400",
    },
    {
      label: t("strengthGood"),
      bar: "bg-gold-400",
      text: "text-gold-700 dark:text-gold-400",
    },
    {
      label: t("strengthStrong"),
      bar: "bg-success-500",
      text: "text-success-600 dark:text-success-400",
    },
  ];
  const strengthInfo = strengthData[strength];

  const switchToRegister = () => {
    form.reset({
      name: "",
      email: form.getValues("email"),
      password: "",
      confirmPassword: "",
      role: "ALUNO",
      consentRgpd: false,
    });
    setApiError(null);
    setMode("register");
  };

  const switchToLogin = () => {
    form.clearErrors();
    setApiError(null);
    setMode("login");
  };

  // Focus the name field after it slides in
  useEffect(() => {
    if (mode === "register") {
      const id = window.setTimeout(() => nameRef.current?.focus(), 340);
      return () => window.clearTimeout(id);
    }
  }, [mode]);

  const handleLogin = async () => {
    setApiError(null);
    form.clearErrors(["email", "password"]);
    const loginValues = {
      email: form.getValues("email"),
      password: form.getValues("password"),
    };
    const parsed = loginSchema.safeParse(loginValues);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          form.setError(field, { type: "manual", message: issue.message });
        }
      }
      return;
    }
    setIsLoading(true);
    try {
      const { email, password } = parsed.data;
      const result = await signIn("credentials", {
        email,
        password,
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = form.handleSubmit(async (values) => {
    setApiError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name?.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          role: values.role,
          consentRgpd: values.consentRgpd,
        }),
      });
      await readApiResponse(response);
      router.push("/login?registered=1");
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : t("connectionError"),
      );
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="animate-fade-in-up mx-auto w-full max-w-md rounded-2xl overflow-hidden bg-white/90 dark:bg-navy-950/80 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl">
      {/* Gold accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-slate-200/50 px-5 py-4 dark:border-slate-800/50 sm:items-center sm:px-6 sm:py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-300">
          <AnimatePresence mode="wait" initial={false}>
            {mode === "login" ? (
              <motion.span
                key="icon-login"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.18 }}
              >
                <LogIn className="size-4" />
              </motion.span>
            ) : (
              <motion.span
                key="icon-register"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.18 }}
              >
                <UserPlus className="size-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {mode === "login" ? (
              <motion.h1
                key="title-login"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="font-display text-lg font-semibold tracking-tight text-navy-950 dark:text-white"
              >
                {t("login")}
              </motion.h1>
            ) : (
              <motion.h1
                key="title-register"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="font-display text-lg font-semibold tracking-tight text-navy-950 dark:text-white"
              >
                {t("register")}
              </motion.h1>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={`subtitle-${mode}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="max-w-xs text-xs leading-relaxed text-muted-foreground"
            >
              {mode === "login" ? t("loginSubtitle") : t("registerSubtitle")}
            </motion.p>
          </AnimatePresence>
        </div>
        {/* Step indicator */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              mode === "login" ? "w-5 bg-gold-400" : "w-1.5 bg-border/50",
            )}
          />
          <div
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              mode === "register" ? "w-5 bg-gold-400" : "w-1.5 bg-border/50",
            )}
          />
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "login") {
              handleLogin();
            } else {
              handleRegister();
            }
          }}
          className="space-y-4 p-5 sm:space-y-5 sm:p-6"
        >
          {registeredSuccess && !apiError ? (
            <div
              role="status"
              className="flex items-center gap-2.5 rounded-2xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-medium text-success-800 shadow-sm dark:border-success-900/50 dark:bg-success-950/40 dark:text-success-200"
            >
              <CheckCircle2 className="size-4 shrink-0" />
              {t("registeredSuccess")}
            </div>
          ) : null}

          {apiError ? (
            <motion.div
              key={apiError}
              role="alert"
              aria-live="assertive"
              initial={{ x: 0 }}
              animate={{ x: [-5, 5, -4, 4, -2, 2, 0] }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-900 shadow-sm dark:border-danger-900/50 dark:bg-danger-950/40 dark:text-danger-200"
            >
              {apiError}
            </motion.div>
          ) : null}

          {/* Name — register only, expands above email */}
          <AnimatePresence initial={false}>
            {mode === "register" && (
              <motion.div
                key="name-field"
                variants={expandVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="overflow-hidden"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          label={t("name")}
                          autoComplete="name"
                          floatingLabel
                          leftIcon={<User className="size-4" />}
                          error={form.formState.errors.name?.message}
                          {...field}
                          ref={(el) => {
                            field.ref(el);
                            nameRef.current = el;
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email — always visible */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    label={t("email")}
                    type="email"
                    autoComplete="email"
                    autoFocus
                    floatingLabel
                    leftIcon={<Mail className="size-4" />}
                    error={form.formState.errors.email?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Password — always visible */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    label={t("password")}
                    type="password"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    showPasswordLabel={t("showPassword")}
                    hidePasswordLabel={t("hidePassword")}
                    floatingLabel
                    leftIcon={<Lock className="size-4" />}
                    error={form.formState.errors.password?.message}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Password strength — register mode only */}
          <AnimatePresence initial={false}>
            {mode === "register" && passwordValue ? (
              <motion.div
                key="strength-meter"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="-mt-2 overflow-hidden"
              >
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {([1, 2, 3, 4] as const).map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-500",
                          strengthInfo && i <= strength
                            ? strengthInfo.bar
                            : "bg-border/50",
                        )}
                      />
                    ))}
                  </div>
                  {strengthInfo ? (
                    <p
                      className={cn(
                        "text-right text-tiny font-medium",
                        strengthInfo.text,
                      )}
                    >
                      {strengthInfo.label}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Extra register fields — expand downward */}
          <AnimatePresence initial={false}>
            {mode === "register" && (
              <motion.div
                key="register-extra"
                variants={expandVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="overflow-hidden"
              >
                <div className="space-y-4 sm:space-y-5">
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            label={t("confirmPassword")}
                            type="password"
                            autoComplete="new-password"
                            showPasswordLabel={t("showPassword")}
                            hidePasswordLabel={t("hidePassword")}
                            floatingLabel
                            leftIcon={<Lock className="size-4" />}
                            error={
                              form.formState.errors.confirmPassword?.message
                            }
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-semibold tracking-tight text-foreground">
                      {t("roleLabel")}
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        {
                          value: "ALUNO",
                          label: t("role_aluno"),
                          icon: GraduationCap,
                        },
                        {
                          value: "PAIS",
                          label: t("role_pais"),
                          icon: Users,
                        },
                      ].map((option) => {
                        const active = roleValue === option.value;
                        const Icon = option.icon;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              form.setValue(
                                "role",
                                option.value as "ALUNO" | "PAIS",
                                { shouldValidate: true },
                              )
                            }
                            className={cn(
                              "flex min-h-[72px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300",
                              active
                                ? "border-navy-800/10 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 text-white shadow-card"
                                : "border-white/20 bg-white/55 text-navy-900 shadow-inner backdrop-blur-sm hover:border-gold-300/40 hover:bg-white/80 dark:border-white/10 dark:bg-navy-950/40 dark:text-white dark:hover:bg-navy-900/60",
                            )}
                            aria-pressed={active}
                          >
                            <span
                              className={cn(
                                "flex size-10 shrink-0 items-center justify-center rounded-2xl border",
                                active
                                  ? "border-white/15 bg-white/10 text-gold-300"
                                  : "border-gold-400/20 bg-gold-400/10 text-gold-600 dark:text-gold-300",
                              )}
                            >
                              <Icon className="size-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold leading-snug">
                                {option.label}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/20 bg-white/50 p-3.5 backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/40 sm:p-4">
                    <label
                      htmlFor="register-rgpd"
                      className="flex cursor-pointer items-start gap-3"
                    >
                      <input
                        type="checkbox"
                        id="register-rgpd"
                        aria-describedby={
                          form.formState.errors.consentRgpd
                            ? "register-rgpd-error"
                            : undefined
                        }
                        checked={consentRgpd}
                        onChange={(e) =>
                          form.setValue("consentRgpd", e.target.checked, {
                            shouldValidate: true,
                          })
                        }
                        className="mt-1 h-4 w-4 rounded border-white/20 dark:border-white/10 accent-navy-900"
                      />
                      <span className="text-sm leading-relaxed text-muted-foreground">
                        {t("rgpdConsent")}
                      </span>
                    </label>
                    {form.formState.errors.consentRgpd ? (
                      <p
                        id="register-rgpd-error"
                        role="alert"
                        className="mt-2 text-xs font-medium text-danger-600"
                      >
                        {form.formState.errors.consentRgpd.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            loading={isLoading}
            icon={
              mode === "login" ? (
                <LogIn className="size-4" />
              ) : (
                <UserPlus className="size-4" />
              )
            }
            className="w-full justify-center text-base h-12"
          >
            {mode === "login" ? t("enter") : t("createAccount")}
          </Button>

          <div className="mt-2 flex flex-col items-start gap-3 rounded-2xl border border-white/20 bg-white/50 px-4 py-3 text-sm backdrop-blur-sm dark:border-white/10 dark:bg-navy-950/40 sm:flex-row sm:items-center sm:justify-between">
            {mode === "login" ? (
              <>
                <p className="text-muted-foreground">{t("noAccount")}</p>
                <button
                  type="button"
                  onClick={switchToRegister}
                  className="inline-flex items-center gap-1.5 font-semibold text-gold-500 transition-colors hover:text-gold-400 dark:text-gold-400 dark:hover:text-gold-300"
                >
                  {t("createAccount")}
                  <ArrowRight className="size-4" />
                </button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">{t("hasAccount")}</p>
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="inline-flex items-center gap-1.5 font-semibold text-gold-500 transition-colors hover:text-gold-400 dark:text-gold-400 dark:hover:text-gold-300"
                >
                  <ArrowLeft className="size-4" />
                  {t("login")}
                </button>
              </>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
