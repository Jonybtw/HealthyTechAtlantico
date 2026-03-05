"use client";

import { Users, Activity, AlertTriangle, School } from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import type { Role } from "@prisma/client";

interface Props {
  role: Role;
  username: string;
  kpis: {
    totalStudents: number;
    totalSessions: number;
    pendingSos: number;
    totalClasses: number;
  } | null;
  studentSummary: {
    name: string;
    lastBiometric: string | null;
    lastTest: string | null;
  } | null;
}

export function DashboardClient({ role, username, kpis, studentSummary }: Props) {
  const greeting = getGreeting();

  if (role === "ALUNO" && studentSummary) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={`${greeting}, ${studentSummary.name.split(" ")[0]}!`}
          description="Resumo da tua atividade"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            icon={Activity}
            title="Última biometria"
            value={
              studentSummary.lastBiometric
                ? new Date(studentSummary.lastBiometric).toLocaleDateString("pt-PT")
                : "—"
            }
            description="Data da última medição"
          />
          <KpiCard
            icon={Activity}
            title="Últimos testes"
            value={
              studentSummary.lastTest
                ? new Date(studentSummary.lastTest).toLocaleDateString("pt-PT")
                : "—"
            }
            description="Data do último teste físico"
          />
        </div>
      </div>
    );
  }

  // Staff dashboard
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${greeting}, ${username}!`}
        description="Visão geral da plataforma"
      />

      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Users}
            title="Alunos"
            value={kpis.totalStudents}
            description="Total registados"
          />
          <KpiCard
            icon={Activity}
            title="Sessões"
            value={kpis.totalSessions}
            description="Avaliações realizadas"
          />
          <KpiCard
            icon={AlertTriangle}
            title="SOS Pendentes"
            value={kpis.pendingSos}
            description="Alertas por resolver"
          />
          <KpiCard
            icon={School}
            title="Turmas"
            value={kpis.totalClasses}
            description="Turmas ativas"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-3">Ações rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/biometria"
            className="px-4 py-2 rounded-lg bg-navy-800 text-white text-sm font-medium hover:bg-navy-900 transition-colors"
          >
            Registar biometria
          </a>
          <a
            href="/testes"
            className="px-4 py-2 rounded-lg bg-gold-500 text-navy-900 text-sm font-medium hover:bg-gold-600 transition-colors"
          >
            Registar testes
          </a>
          <a
            href="/turma"
            className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-navy-100 transition-colors"
          >
            Ver turma
          </a>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 19) return "Boa tarde";
  return "Boa noite";
}
