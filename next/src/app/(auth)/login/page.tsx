"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");
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
        setError(t("wrongCredentials"));
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Logo */}
      <div className="text-center mb-8 animate-fade-in-up">
        <div className="inline-flex items-center justify-center mb-4">
          <Image
            src="/logo.png"
            alt="HealthyTech Atlântico"
            width={200}
            height={60}
            className="object-contain drop-shadow-md"
            priority
          />
        </div>
      </div>

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="animate-fade-in-up delay-100 bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-4 relative"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-navy-600 to-gold-500 opacity-90 shadow-[0_0_10px_rgba(194,151,13,0.5)]" />
        <h2 className="text-xl font-bold tracking-tight text-center">{t("login")}</h2>

        {error && (
          <div className="animate-scale-in rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm px-4 py-2.5">
            {error}
          </div>
        )}

        <div className="animate-fade-in-up delay-150">
          <Input
            label={t("email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemplo@escola.pt"
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="animate-fade-in-up delay-200">
          <Input
            label={t("password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <div className="animate-fade-in-up delay-300">
          <Button
            type="submit"
            loading={loading}
            icon={<LogIn className="size-4" />}
            className="w-full mt-2"
          >
            {t("enter")}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-1 animate-fade-in delay-400">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="text-navy-700 dark:text-navy-300 font-medium hover:underline transition-colors"
          >
            {t("createAccount")}
          </Link>
        </p>
      </form>
    </div>
  );
}
