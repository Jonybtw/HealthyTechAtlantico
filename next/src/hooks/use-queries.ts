import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role, Sex } from "@prisma/client";
import { readApiResponse } from "@/lib/api-client";
import { useSosStream, type SosStreamResult } from "@/hooks/use-sos-stream";
import type { NormalizedSosAlert } from "@/lib/sos-alerts";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return readApiResponse<T>(response);
}

async function mutateJson<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  return readApiResponse<T>(response);
}

interface LatestBiometric {
  imc: number | string;
  imcZone: string;
  recordedAt: string;
}

interface LatestTest {
  recordedAt: string;
}

interface StudentListItem {
  id: string;
  name: string;
  sex: Sex;
  birthDate: string | null;
  age: number | null;
  className: string | null;
  schoolYear: string | null;
  processNumber: string | null;
  biometrics: LatestBiometric[];
  tests: LatestTest[];
}

interface StudentsListResponse {
  students: StudentListItem[];
  total: number;
  page: number;
  pages: number;
}

export interface StaffUser {
  id: string;
  name: string | null;
  email: string;
  role: "PROFESSOR" | "PSICOLOGO";
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  emailVerified: string | null;
  mustChangePassword: boolean;
  createdAt: string;
}

interface SosAlertSummary {
  id: string;
  resolved: boolean;
  createdAt: string;
}

const queryKeys = {
  students: (limit?: number) => ["students", { limit }] as const,
  studentsList: (
    page: number,
    limit: number,
    search: string,
    className: string,
    schoolYear: string,
  ) =>
    ["students-list", { page, limit, search, className, schoolYear }] as const,
  staff: () => ["staff"] as const,
  adminUsers: () => ["admin-users"] as const,
  dispensas: (studentId: string) => ["dispensas", studentId] as const,
  sosAlerts: () => ["sos-alerts"] as const,
  studentSos: (studentId: string) => ["student-sos", studentId] as const,
  classes: () => ["classes"] as const,
} as const;

export function useStudents(limit = 500) {
  return useQuery({
    queryKey: queryKeys.students(limit),
    queryFn: async () =>
      (
        await fetchJson<{ students: StudentListItem[] }>(
          `/api/students?limit=${limit}`,
        )
      ).students,
    staleTime: 2 * 60 * 1000,
  });
}

interface ClassOption {
  id: string;
  name: string;
  year: string;
}

export function useClasses(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.classes(),
    queryFn: async () => {
      const years =
        await fetchJson<
          { label: string; classes: { id: string; name: string }[] }[]
        >("/api/classes");
      return years.flatMap((year) =>
        year.classes.map((schoolClass) => ({
          id: schoolClass.id,
          name: schoolClass.name,
          year: year.label,
        })),
      ) satisfies ClassOption[];
    },
    enabled: options?.enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStaff() {
  return useQuery({
    queryKey: queryKeys.staff(),
    queryFn: () => fetchJson<StaffUser[]>("/api/admin/staff"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers(),
    queryFn: () => fetchJson<AdminUser[]>("/api/admin/users"),
    staleTime: 60 * 1000,
  });
}

export function useDispensas(studentId: string | null) {
  return useQuery({
    queryKey: queryKeys.dispensas(studentId ?? ""),
    queryFn: () =>
      fetchJson<
        {
          id: string;
          reason: string;
          startDate: string;
          endDate: string;
          createdAt: string;
        }[]
      >(`/api/students/${studentId}/dispensas`),
    enabled: !!studentId,
    staleTime: 60 * 1000,
  });
}

export const useExemptions = useDispensas;

export function useStudentsList(options: {
  page: number;
  limit: number;
  search?: string;
  className?: string;
  schoolYear?: string;
}) {
  const search = options.search?.trim() ?? "";
  const className = options.className?.trim() ?? "";
  const schoolYear = options.schoolYear?.trim() ?? "";
  const params = new URLSearchParams({
    page: String(options.page),
    limit: String(options.limit),
  });

  if (search) {
    params.set("search", search);
  }

  if (className) {
    params.set("class_name", className);
  }

  if (schoolYear) {
    params.set("school_year", schoolYear);
  }

  return useQuery({
    queryKey: queryKeys.studentsList(
      options.page,
      options.limit,
      search,
      className,
      schoolYear,
    ),
    queryFn: () =>
      fetchJson<StudentsListResponse>(`/api/students?${params.toString()}`),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useSosAlerts(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: queryKeys.sosAlerts(),
    queryFn: () => fetchJson<SosAlertSummary[]>("/api/stats/sos-alerts"),
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
    staleTime: 30 * 1000,
  });
}

/**
 * Subscribes to `/api/sos/stream` via SSE. The polling version
 * (`useSosAlerts` above) stays for callers that can't open a long-lived
 * connection; the SSE path is preferred for the staff SOS inbox because
 * it eliminates the 5 s polling flicker and saves a round-trip per tick.
 *
 * Auto-reconnects on error (the underlying `EventSource` handles this).
 *
 * Pass `enabled: false` to skip the connection entirely (e.g. for
 * students who don't have access to the staff inbox). The hook will
 * stay in the `connecting` state and never open a socket.
 *
 * Pass `key` to force a fresh subscription — bumping the key closes
 * the existing EventSource and opens a new one. The SOS inbox uses
 * this for its manual "Refresh" button.
 */
export function useSosAlertsStream(
  options: { enabled?: boolean; key?: number | string } = {},
): SosStreamResult<NormalizedSosAlert[]> {
  return useSosStream<NormalizedSosAlert[]>("/api/sos/stream", {
    enabled: options.enabled,
    key: options.key,
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      mutateJson<void>("/api/admin/staff", "DELETE", { userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adminUsers(),
      });
    },
  });
}

export function useForceResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      mutateJson<{ email: string }>(
        `/api/admin/users/${encodeURIComponent(userId)}/force-reset-password`,
        "POST",
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adminUsers(),
      });
    },
  });
}

export function useCreateDispensa(studentId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      reason: string;
      startDate: string;
      endDate?: string;
    }) => mutateJson(`/api/students/${studentId}/dispensas`, "POST", data),
    onSuccess: () => {
      if (studentId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.dispensas(studentId),
        });
      }
    },
  });
}

export const useCreateExemption = useCreateDispensa;

export function useDeleteDispensa(studentId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dispensaId: string) =>
      mutateJson<void>(`/api/students/${studentId}/dispensas`, "DELETE", {
        dispensaId,
      }),
    onSuccess: () => {
      if (studentId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.dispensas(studentId),
        });
      }
    },
  });
}

export const useDeleteExemption = useDeleteDispensa;
