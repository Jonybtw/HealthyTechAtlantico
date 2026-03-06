"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { User, Lock, Sun, Moon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PerfilPage() {
  const t = useTranslations("perfil");
  const { data: session, update } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;

  const [theme, setTheme] = useState<"light" | "dark">(
    typeof window !== "undefined" && document.documentElement.dataset.theme === "dark"
      ? "dark"
      : "light"
  );

  /* ── Password change ── */
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPw !== pw.confirm) {
      toast.error(t("passwordMismatch"));
      return;
    }
    if (pw.newPw.length < 8) {
      toast.error(t("passwordShort"));
      return;
    }
    setChangingPw(true);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pw.current,
          newPassword: pw.newPw,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erro ao alterar palavra-passe.");
        return;
      }

      toast.success(t("passwordSuccess"));
      setPw({ current: "", newPw: "", confirm: "" });
    } catch {
      toast.error("Erro de ligação.");
    } finally {
      setChangingPw(false);
    }
  };

  /* ── RGPD consent ── */
  const [updatingConsent, setUpdatingConsent] = useState(false);
  const consentRgpd = user?.consentRgpd as boolean | undefined;

  const handleConsent = async (value: boolean) => {
    setUpdatingConsent(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentRgpd: value }),
      });
      if (res.ok) {
        toast.success(value ? t("rgpdGrant") : t("rgpdRevoke"));
        update(); // refresh session
      }
    } catch {
      toast.error("Erro ao atualizar consentimento.");
    } finally {
      setUpdatingConsent(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <PageHeader title={t("title")} description={t("description")} />

      {/* User info */}
      <div className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex items-center gap-4 animate-fade-in-up">
        <div className="flex items-center justify-center size-14 rounded-full bg-navy-100 dark:bg-navy-900/50 text-navy-700 dark:text-navy-300 ring-4 ring-navy-50 dark:ring-navy-900/20">
          <User className="size-6" />
        </div>
        <div>
          <p className="font-semibold">{(user?.name as string) ?? (user?.email as string)}</p>
          <p className="text-sm text-muted-foreground">{user?.email as string}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-navy-100 text-navy-700">
            {user?.role as string}
          </span>
        </div>
      </div>

      {/* Theme toggle */}
      <div className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex items-center justify-between animate-fade-in-up delay-75">
        <div>
          <p className="font-medium">{t("themeLabel")}</p>
          <p className="text-sm text-muted-foreground">
            {theme === "light" ? t("lightMode") : t("darkMode")}
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="p-3 rounded-lg bg-muted hover:bg-navy-100 transition-colors"
        >
          {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
        </button>
      </div>

      {/* RGPD consent */}
      <div className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-3 animate-fade-in-up delay-100">
        <div>
          <p className="font-medium">{t("rgpdTitle")}</p>
          <p className="text-sm text-muted-foreground">
            Autorização para tratamento de dados de saúde
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            size="sm"
            variant={consentRgpd ? "primary" : "ghost"}
            onClick={() => handleConsent(true)}
            loading={updatingConsent}
          >
            {t("rgpdGrant")}
          </Button>
          <Button
            size="sm"
            variant={!consentRgpd ? "danger" : "ghost"}
            onClick={() => handleConsent(false)}
            loading={updatingConsent}
          >
            {t("rgpdRevoke")}
          </Button>
        </div>
      </div>

      {/* Password change */}
      <form
        onSubmit={handlePasswordChange}
        className="bg-card/85 glass rounded-2xl border border-border/50 shadow-float p-6 flex flex-col gap-4 animate-fade-in-up delay-150"
      >
        <h3 className="font-medium flex items-center gap-2">
          <Lock className="size-4" />
          {t("changePassword")}
        </h3>

        <Input
          label={t("currentPassword")}
          type="password"
          value={pw.current}
          onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
          required
          autoComplete="current-password"
        />
        <Input
          label={t("newPassword")}
          type="password"
          value={pw.newPw}
          onChange={(e) => setPw((p) => ({ ...p, newPw: e.target.value }))}
          required
          autoComplete="new-password"
        />
        <Input
          label={t("confirmPassword")}
          type="password"
          value={pw.confirm}
          onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
          required
          autoComplete="new-password"
        />

        <Button type="submit" loading={changingPw} className="self-start">
          {t("savePassword")}
        </Button>
      </form>
    </div>
  );
}
