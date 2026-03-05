"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("E-mail ou palavra-passe incorretos.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erro de ligação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* logo / branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-navy-800 text-white mb-4">
          <span className="text-xl font-bold font-display">AF</span>
        </div>
        <h1 className="text-2xl font-bold font-display">AtlânticoFit</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Plataforma de Avaliação Física Escolar
        </p>
      </div>

      {/* card */}
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-2xl border border-border shadow-card p-6 flex flex-col gap-4"
      >
        <h2 className="text-lg font-semibold text-center">Iniciar Sessão</h2>

        {error && (
          <div className="rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm px-4 py-2.5">
            {error}
          </div>
        )}

        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="exemplo@escola.pt"
          required
          autoComplete="email"
          autoFocus
        />

        <Input
          label="Palavra-passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          loading={loading}
          icon={<LogIn className="size-4" />}
          className="w-full mt-2"
        >
          Entrar
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-2">
          Ainda não tem conta?{" "}
          <Link
            href="/register"
            className="text-navy-700 font-medium hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
