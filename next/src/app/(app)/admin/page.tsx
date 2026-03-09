"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Settings, UserPlus, Trash2, Loader2, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/pill-select";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface StaffUser {
  id: string;
  name: string | null;
  email: string;
  role: "PROFESSOR" | "PSICOLOGO";
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: "PROFESSOR", label: "Professor" },
  { value: "PSICOLOGO", label: "Psicólogo" },
];

export default function AdminPage() {
  const t = useTranslations("admin");
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Create form
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "PROFESSOR" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/staff");
      if (!r.ok) throw new Error();
      setStaff(await r.json());
    } catch {
      toast.error("Erro ao carregar lista de funcionários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === "ADMIN") loadStaff();
  }, [role, loadStaff]);

  function validateForm() {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = t("nameTooShort");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t("invalidEmail");
    if (form.password.length < 6) errs.password = t("passwordMin6");
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim().toLowerCase(), password: form.password, role: form.role, name: form.name.trim() }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Erro desconhecido." }));
        toast.error(error);
        return;
      }
      toast.success(t("createSuccess"));
      setForm({ name: "", email: "", password: "", role: "PROFESSOR" });
      setFormErrors({});
      loadStaff();
    } catch {
      toast.error("Erro de ligação.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch("/api/admin/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteTarget.id }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Erro desconhecido." }));
        toast.error(error);
        return;
      }
      toast.success(t("deleteSuccess"));
      setDeleteTarget(null);
      loadStaff();
    } catch {
      toast.error("Erro de ligação.");
    }
  }

  if (role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">{t("noPermission")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {/* ── Create staff ──────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <UserPlus size={18} className="text-navy-600" />
          {t("createTitle")}
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t("nameLabel")}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ana Ferreira"
            required
            error={formErrors.name}
          />
          <Input
            label={t("emailLabel")}
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="ana.ferreira@escola.pt"
            required
            error={formErrors.email}
          />
          <Input
            label={t("passwordLabel")}
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="••••••••"
            required
            error={formErrors.password}
          />
          <div>
            <label className="block text-sm font-medium mb-1">{t("roleLabel")}</label>
            <PillSelect
              options={ROLE_OPTIONS}
              value={form.role}
              onChange={(v) => setForm((f) => ({ ...f, role: v }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              loading={creating}
              icon={<UserPlus size={16} />}
              className="self-start"
            >
              {t("createBtn")}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Staff list ────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Settings size={18} className="text-navy-600" />
            Funcionários registados
          </h2>
          <button
            onClick={loadStaff}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            title="Atualizar lista"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> A carregar…
          </div>
        )}

        {!loading && staff.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum funcionário registado.</p>
        )}

        {!loading && staff.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium">{t("nameLabel")}</th>
                  <th className="text-left py-2 px-3 font-medium">{t("emailLabel")}</th>
                  <th className="text-left py-2 px-3 font-medium">{t("roleLabel")}</th>
                  <th className="text-left py-2 px-3 font-medium">{t("createdAtLabel")}</th>
                  <th className="py-2 px-3" />
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3">{s.name ?? "—"}</td>
                    <td className="py-2 px-3 text-muted-foreground">{s.email}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.role === "PROFESSOR"
                            ? "bg-navy-100 text-navy-800"
                            : "bg-gold-100 text-gold-800"
                        }`}
                      >
                        {s.role === "PROFESSOR" ? "Professor" : "Psicólogo"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => setDeleteTarget(s)}
                        className="p-1.5 rounded-md hover:bg-danger-50 text-muted-foreground hover:text-danger-600"
                        title="Remover conta"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Confirm delete ───────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteTarget}
        title={t("deleteTitle")}
        message={`${t("deleteTitle")} "${deleteTarget?.name ?? deleteTarget?.email}"?`}
        confirmLabel={t("deleteBtn")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
}
