import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Sex } from "@prisma/client";

// ── Fetcher ──────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `Request failed: ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

async function mutateJson<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? `Request failed: ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────

export interface StudentListItem {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string | null;
  age: number | null;
  className: string | null;
  schoolYear: string | null;
}

export interface StaffUser {
  id: string;
  name: string | null;
  email: string;
  role: "PROFESSOR" | "PSICOLOGO";
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalBiometrics: number;
  totalTests: number;
  totalQuestionnaires: number;
  totalSosAlerts: number;
  pendingSosAlerts: number;
  [key: string]: unknown;
}

// ── Query Keys ───────────────────────────────────────────────────

export const queryKeys = {
  students: (limit?: number) => ["students", { limit }] as const,
  student: (id: string) => ["student", id] as const,
  staff: () => ["staff"] as const,
  dashboard: () => ["dashboard"] as const,
  dispensas: (studentId: string) => ["dispensas", studentId] as const,
  sosAlerts: () => ["sos-alerts"] as const,
  studentSos: (studentId: string) => ["student-sos", studentId] as const,
} as const;

// ── Hooks ────────────────────────────────────────────────────────

export function useStudents(limit = 500) {
  return useQuery({
    queryKey: queryKeys.students(limit),
    queryFn: async () => {
      const body = await fetchJson<{ students: StudentListItem[] }>(
        `/api/students?limit=${limit}`
      );
      return body.students;
    },
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: queryKeys.student(id),
    queryFn: () => fetchJson<Record<string, unknown>>(`/api/students/${id}`),
    enabled: !!id,
  });
}

export function useStaff() {
  return useQuery({
    queryKey: queryKeys.staff(),
    queryFn: () => fetchJson<StaffUser[]>("/api/admin/staff"),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: () => fetchJson<DashboardStats>("/api/stats/dashboard"),
    staleTime: 30 * 1000,
  });
}

export function useDispensas(studentId: string | null) {
  return useQuery({
    queryKey: queryKeys.dispensas(studentId ?? ""),
    queryFn: async () => {
      const body = await fetchJson<
        { id: string; reason: string; startDate: string; endDate: string; createdAt: string }[]
        | { dispensas: { id: string; reason: string; startDate: string; endDate: string; createdAt: string }[] }
      >(`/api/students/${studentId}/dispensas`);
      return Array.isArray(body) ? body : body.dispensas ?? [];
    },
    enabled: !!studentId,
  });
}

export function useSosAlerts(options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.sosAlerts(),
    queryFn: async () => {
      const body = await fetchJson<unknown>("/api/stats/sos-alerts");
      if (Array.isArray(body)) return body;
      if (body && typeof body === "object" && "alerts" in body && Array.isArray((body as { alerts?: unknown }).alerts)) {
        return (body as { alerts: unknown[] }).alerts;
      }
      return [];
    },
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  });
}

// ── Mutations ────────────────────────────────────────────────────

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      mutateJson("/api/admin/staff", "DELETE", { userId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.staff() });
    },
  });
}

export function useCreateDispensa(studentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { reason: string; startDate: string; endDate?: string }) =>
      mutateJson(`/api/students/${studentId}/dispensas`, "POST", data),
    onSuccess: () => {
      if (studentId) {
        void qc.invalidateQueries({ queryKey: queryKeys.dispensas(studentId) });
      }
    },
  });
}

export function useDeleteDispensa(studentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dispensaId: string) =>
      mutateJson(`/api/students/${studentId}/dispensas`, "DELETE", { dispensaId }),
    onSuccess: () => {
      if (studentId) {
        void qc.invalidateQueries({ queryKey: queryKeys.dispensas(studentId) });
      }
    },
  });
}
