"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "ALUNO" as "ALUNO" | "PAIS",
    consentRgpd: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = t("nameTooShort");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = t("invalidEmail");
    if (form.password.length < 8)
      errs.password = t("passwordMin8");
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = t("passwordNoMatch");
    if (!form.consentRgpd)
      errs.consentRgpd = t("rgpdRequired");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
          consentRgpd: true,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setApiError(body.error ?? t("createError"));
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setApiError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-4">
          <Image src="/logo.png" alt="HealthyTech Atlântico" width={200} height={60} className="object-contain" />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {t("newAccountTagline")}
        </p>
      </div>

      {/* card */}
      <form
        onSubmit={handleSubmit}
        className="animate-fade-in-up delay-100 bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-4 relative"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-navy-500 to-gold-400 opacity-80" />
        <h2 className="text-xl font-bold tracking-tight text-center">{t("register")}</h2>

        {apiError && (
          <div className="rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm px-4 py-2.5">
            {apiError}
          </div>
        )}

        <Input
          label={t("name")}
          value={form.name}
          onChange={set("name")}
          placeholder="Maria Silva"
          error={errors.name}
          required
          autoFocus
        />

        <Input
          label={t("email")}
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="exemplo@escola.pt"
          error={errors.email}
          required
          autoComplete="email"
        />

        <Input
          label={t("password")}
          type="password"
          value={form.password}
          onChange={set("password")}
          placeholder={t("passwordMin8")}
          error={errors.password}
          required
          autoComplete="new-password"
        />

        <Input
          label={t("confirmPassword")}
          type="password"
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          placeholder="Repetir palavra-passe"
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />

        {/* Role selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t("roleLabel")}</label>
          <PillSelect
            options={[
              { value: "ALUNO", label: t("role_aluno") },
              { value: "PAIS", label: t("role_pais") },
            ]}
            value={form.role}
            onChange={(v) => setForm((f) => ({ ...f, role: v as "ALUNO" | "PAIS" }))}
          />
        </div>

        {/* RGPD consent */}
        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.consentRgpd}
              onChange={(e) => setForm((f) => ({ ...f, consentRgpd: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-border accent-navy-800"
              required
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              {t("rgpdConsent")}
            </span>
          </label>
          {errors.consentRgpd && (
            <p className="text-xs text-danger-600">{errors.consentRgpd}</p>
          )}
        </div>

        <Button
          type="submit"
          loading={loading}
          icon={<UserPlus className="size-4" />}
          className="w-full mt-2"
        >
          {t("createAccount")}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-2">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="text-navy-700 font-medium hover:underline"
          >
            {t("login")}
          </Link>
        </p>
      </form>
    </div>
  );
}
