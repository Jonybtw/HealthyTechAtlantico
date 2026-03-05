"use client";

import { User, Ruler, Timer, ClipboardList, ShieldOff, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

interface Props {
  student: {
    id: string;
    name: string;
    sex: string;
    birthDate: string | null;
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
  const age = student.birthDate
    ? Math.floor(
        (Date.now() - new Date(student.birthDate).getTime()) / (365.25 * 24 * 3600_000)
      )
    : null;

  const lastBio = student.biometrics[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={student.name}
        description={`${student.sex === "M" ? "Masculino" : "Feminino"}${age != null ? ` · ${age} anos` : ""} · ${
          student.className
            ? `${student.className} (${student.schoolYear ?? ""})`
            : "Sem turma"
        }`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Biometria */}
        <Section icon={<Ruler className="size-4" />} title="Última biometria">
          {lastBio ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Stat label="Altura" value={`${lastBio.heightM} m`} />
              <Stat label="Peso" value={`${lastBio.weightKg} kg`} />
              <Stat label="IMC" value={`${lastBio.imc.toFixed(1)} (${lastBio.imcZone})`} />
              <Stat label="Cintura" value={lastBio.waistCm ? `${lastBio.waistCm} cm` : "—"} />
              <Stat label="Massa gorda" value={lastBio.fatPct ? `${lastBio.fatPct}%` : "—"} />
              <Stat
                label="Data"
                value={new Date(lastBio.recordedAt).toLocaleDateString("pt-PT")}
              />
            </div>
          ) : (
            <Empty />
          )}
        </Section>

        {/* Testes (EAV — one row per test type) */}
        <Section icon={<Timer className="size-4" />} title="Últimos testes">
          {student.tests.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {student.tests.map((t, i) => (
                <Stat key={i} label={t.testId} value={`${t.valueText} ${t.unit} (${t.zone})`} />
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Section>

        {/* Questionários */}
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

        {/* Dispensas */}
        <Section icon={<ShieldOff className="size-4" />} title="Dispensas">
          {student.dispensas.length > 0 ? (
            <ul className="text-sm space-y-1">
              {student.dispensas.map((d, i) => (
                <li key={i}>
                  <span className="font-medium">{d.reason}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(d.startDate).toLocaleDateString("pt-PT")}
                    {` — ${new Date(d.endDate).toLocaleDateString("pt-PT")}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Section>

        {/* Encarregados */}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">Sem dados registados.</p>;
}
