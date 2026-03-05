"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Nome demasiado curto.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "E-mail inválido.";
    if (form.password.length < 8)
      errs.password = "Mínimo 8 caracteres.";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Palavras-passe não coincidem.";
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
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setApiError(body.error ?? "Erro ao criar conta.");
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setApiError("Erro de ligação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-navy-800 text-white mb-4">
          <span className="text-xl font-bold font-display">AF</span>
        </div>
        <h1 className="text-2xl font-bold font-display">AtlânticoFit</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Criar nova conta de aluno
        </p>
      </div>

      {/* card */}
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-2xl border border-border shadow-card p-6 flex flex-col gap-4"
      >
        <h2 className="text-lg font-semibold text-center">Registo</h2>

        {apiError && (
          <div className="rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm px-4 py-2.5">
            {apiError}
          </div>
        )}

        <Input
          label="Nome completo"
          value={form.name}
          onChange={set("name")}
          placeholder="Maria Silva"
          error={errors.name}
          required
          autoFocus
        />

        <Input
          label="E-mail"
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="exemplo@escola.pt"
          error={errors.email}
          required
          autoComplete="email"
        />

        <Input
          label="Palavra-passe"
          type="password"
          value={form.password}
          onChange={set("password")}
          placeholder="Mínimo 8 caracteres"
          error={errors.password}
          required
          autoComplete="new-password"
        />

        <Input
          label="Confirmar palavra-passe"
          type="password"
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          placeholder="Repetir palavra-passe"
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />

        <Button
          type="submit"
          loading={loading}
          icon={<UserPlus className="size-4" />}
          className="w-full mt-2"
        >
          Criar conta
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-2">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="text-navy-700 font-medium hover:underline"
          >
            Iniciar sessão
          </Link>
        </p>
      </form>
    </div>
  );
}
