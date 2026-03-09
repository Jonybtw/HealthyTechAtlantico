"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Ruler, Timer, ClipboardList, ShieldOff, Users, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ZoneBadge } from "@/components/ui/zone-badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Props {
  student: {
    id: string;
    name: string;
    sex: string;
    birthDate: string | null;
    age: number | null;
    schoolYear: string | null;
    className: string | null;
    biometrics: {
      heightM: number;
      weightKg: number;
      imc: number;
      waistCm: number | null;
      fatPct: number | null;
      imcZone: string;
      fatZone: string | null;
      waistZone: string | null;
      recordedAt: string;
    }[];
    tests: {
      testId: string;
      valueNum: number | null;
      valueText: string;
      unit: string;
      zone: string;
      recordedAt: string;
    }[];
    questionnaires: {
      type: string;
      payload: unknown;
      submittedAt: string;
    }[];
    dispensas: {
      id: string;
      reason: string;
      startDate: string;
      endDate: string;
    }[];
    guardians: {
      id: string;
      relationship: string;
      guardian: { name: string | null; email: string };
    }[];
  };
}

export function StudentDetailClient({ student }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;
  const canManageStudent = role === "PROFESSOR" || role === "ADMIN";

  const age = student.birthDate
    ? Math.floor(
        (Date.now() - new Date(student.birthDate).getTime()) / (365.25 * 24 * 3600_000)
      )
    : null;

  const lastBio = student.biometrics[0];

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: student.name,
    sex: student.sex,
    birthDate: student.birthDate ? student.birthDate.slice(0, 10) : "",
    schoolYear: student.schoolYear ?? "",
    className: student.className ?? "",
  });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          sex: editForm.sex,
          birthDate: editForm.birthDate || null,
          schoolYear: editForm.schoolYear || null,
          className: editForm.className || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erro ao guardar.");
        return;
      }
      toast.success("Dados actualizados.");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Erro de liga\u00e7\u00e3o.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Erro ao eliminar.");
        return;
      }
      toast.success("Aluno eliminado.");
      router.push("/alunos");
    } catch {
      toast.error("Erro de liga\u00e7\u00e3o.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={student.name}
        description={`${student.sex === "M" ? "Masculino" : "Feminino"}${age != null ? " \u00b7 " + age + " anos" : ""} \u00b7 ${
          student.className
            ? student.className + " (" + (student.schoolYear ?? "") + ")"
            : "Sem turma"
        }`}
      >
        {canManageStudent && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<Pencil className="size-4" />}
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? "Cancelar" : "Editar"}
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 className="size-4" />}
              onClick={() => setConfirmDelete(true)}
            >
              Eliminar
            </Button>
          </div>
        )}
      </PageHeader>

      {/* Edit form */}
      {editing && (
        <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4 max-w-lg">
          <h3 className="font-semibold text-sm">Editar dados do aluno</h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Nome</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-gold-500/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Sexo</label>
              <select
                value={editForm.sex}
                onChange={(e) => setEditForm((f) => ({ ...f, sex: e.target.value }))}
                className="rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none"
              >
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Data de nasc.</label>
              <input
                type="date"
                value={editForm.birthDate}
                onChange={(e) => setEditForm((f) => ({ ...f, birthDate: e.target.value }))}
                className="rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Ano letivo</label>
              <input
                value={editForm.schoolYear}
                onChange={(e) => setEditForm((f) => ({ ...f, schoolYear: e.target.value }))}
                placeholder="2025/2026"
                className="rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Turma</label>
              <input
                value={editForm.className}
                onChange={(e) => setEditForm((f) => ({ ...f, className: e.target.value }))}
                placeholder="8A"
                className="rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none"
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            loading={saving}
            className="self-start"
          >
            Guardar altera\u00e7\u00f5es
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section icon={<Ruler className="size-4" />} title="Última biometria">
          {lastBio ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Stat label="Altura" value={lastBio.heightM + " m"} />
              <Stat label="Peso" value={lastBio.weightKg + " kg"} />
              <Stat
                label="IMC"
                value={lastBio.imc.toFixed(1)}
                extra={<ZoneBadge zone={lastBio.imcZone} />}
              />
              <Stat label="Cintura" value={lastBio.waistCm ? lastBio.waistCm + " cm" : "\u2014"} />
              <Stat label="Massa gorda" value={lastBio.fatPct ? lastBio.fatPct + "%" : "\u2014"} />
              <Stat label="Data" value={new Date(lastBio.recordedAt).toLocaleDateString("pt-PT")} />
            </div>
          ) : (
            <Empty />
          )}
        </Section>

        <Section icon={<Timer className="size-4" />} title="Últimos testes">
          {student.tests.length > 0 ? (
            <div className="flex flex-col gap-1.5 text-sm">
              {student.tests.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.testId}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.valueText} {t.unit}</span>
                    <ZoneBadge zone={t.zone} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Section>

        <Section icon={<ClipboardList className="size-4" />} title="Questionários">
          {student.questionnaires.length > 0 ? (
            <ul className="text-sm space-y-1">
              {student.questionnaires.map((q, i) => (
                <li key={i} className="flex justify-between">
                  <span className="font-medium">{q.type}</span>
                  <span className="text-muted-foreground">
                    {new Date(q.submittedAt).toLocaleDateString("pt-PT")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Section>

        <Section icon={<ShieldOff className="size-4" />} title="Dispensas">
          {student.dispensas.length > 0 ? (
            <ul className="text-sm space-y-1">
              {student.dispensas.map((d) => (
                <li key={d.id}>
                  <span className="font-medium">{d.reason}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(d.startDate).toLocaleDateString("pt-PT")}
                    {" \u2014 " + new Date(d.endDate).toLocaleDateString("pt-PT")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Section>

        <Section icon={<Users className="size-4" />} title="Encarregados de educação">
          {student.guardians.length > 0 ? (
            <ul className="text-sm space-y-1">
              {student.guardians.map((g) => (
                <li key={g.id} className="flex justify-between">
                  <span>
                    {g.guardian.name}{" "}
                    <span className="text-muted-foreground">({g.relationship})</span>
                  </span>
                  <span className="text-muted-foreground">{g.guardian.email}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Section>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Eliminar aluno"
        message={`Tem a certeza que pretende eliminar "${student.name}"? Esta acção é irreversível.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3">
      <h3 className="flex items-center gap-2 font-semibold text-sm">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  extra,
}: {
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-sm">{value}</span>
        {extra}
      </div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">Sem dados registados.</p>;
}

