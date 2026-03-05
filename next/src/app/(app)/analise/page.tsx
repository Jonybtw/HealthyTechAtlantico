"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/ui/page-header";
import { StudentPicker } from "@/components/ui/student-picker";
import { PillSelect } from "@/components/ui/pill-select";

type ChartType = "bmi" | "tests";

export default function AnalisePage() {
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [chart, setChart] = useState<ChartType>("bmi");
  const [bmiData, setBmiData] = useState<{ date: string; imc: number }[]>([]);
  const [testData, setTestData] = useState<Record<string, unknown>[]>([]);

  const loadStudents = useCallback(async () => {
    const res = await fetch("/api/students?limit=500");
    if (res.ok) {
      const body = await res.json();
      setStudents(body.students.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      if (role === "ALUNO" && body.students.length === 1) {
        setStudentId(body.students[0].id);
      }
    }
  }, [role]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  /* Fetch data when student changes */
  useEffect(() => {
    if (!studentId) return;

    const fetchBio = async () => {
      const res = await fetch(`/api/students/${studentId}/biometrics`);
      if (res.ok) {
        const body = await res.json();
        setBmiData(
          (body as { recordedAt: string; imc: number | string; weightKg: number | string; heightM: number | string }[])
            .map((b) => ({
              date: new Date(b.recordedAt).toLocaleDateString("pt-PT", {
                month: "short",
                year: "2-digit",
              }),
              imc: Number(b.imc),
            }))
            .reverse()
        );
      }
    };

    const fetchTests = async () => {
      const res = await fetch(`/api/students/${studentId}/tests`);
      if (res.ok) {
        const body = await res.json();
        // EAV: group tests by recordedAt date into rows for chart
        const grouped = new Map<string, Record<string, unknown>>();
        for (const t of body as { testId: string; valueNum: number | null; recordedAt: string }[]) {
          const dateKey = new Date(t.recordedAt).toLocaleDateString("pt-PT", {
            month: "short",
            year: "2-digit",
          });
          if (!grouped.has(dateKey)) {
            grouped.set(dateKey, { date: dateKey });
          }
          grouped.get(dateKey)![t.testId] = t.valueNum ?? 0;
        }
        setTestData(Array.from(grouped.values()).reverse());
      }
    };

    fetchBio();
    fetchTests();
  }, [studentId]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Análise"
        description="Evolução dos indicadores de saúde e aptidão física"
      />

      <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-end gap-4">
          {role !== "ALUNO" && (
            <div className="w-64">
              <StudentPicker students={students} value={studentId} onChange={setStudentId} />
            </div>
          )}
          <PillSelect
            options={[
              { value: "bmi", label: "IMC" },
              { value: "tests", label: "Testes" },
            ]}
            value={chart}
            onChange={(v) => setChart(v as ChartType)}
          />
        </div>

        {!studentId ? (
          <p className="py-10 text-center text-muted-foreground text-sm">
            Selecione um aluno para ver os gráficos.
          </p>
        ) : chart === "bmi" ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bmiData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="imc"
                  name="IMC"
                  stroke="var(--color-navy-700)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={testData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="vaivem" name="Vai e Vem" fill="var(--color-navy-600)" />
                <Bar dataKey="abdominais" name="Abdominais" fill="var(--color-gold-500)" />
                <Bar dataKey="extensoes" name="Extensões" fill="var(--color-navy-400)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
