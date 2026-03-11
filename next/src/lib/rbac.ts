import type { Role } from "@prisma/client";

// ── Permission Keys ──────────────────────────────────────────────────────────

export const PERMISSIONS = {
  CREATE_STUDENT: "create_student",
  LIST_STUDENTS: "list_students",
  READ_STUDENT_PROFILE: "read_student_profile",
  RECORD_BIOMETRICS: "record_biometrics",
  READ_BIOMETRICS: "read_biometrics",
  RECORD_TESTS: "record_tests",
  READ_TESTS: "read_tests",
  SUBMIT_QUESTIONNAIRES: "submit_questionnaires",
  READ_QUESTIONNAIRES: "read_questionnaires",
  TRIGGER_SOS: "trigger_sos",
  READ_SOS: "read_sos",
  SEND_REPORTS: "send_reports",
  READ_REPORTS: "read_reports",
  MANAGE_DISPENSAS: "manage_dispensas",
  READ_CLASS_REPORTS: "read_class_reports",
  MANAGE_GUARDIANS: "manage_guardians",
  READ_LINKED_STUDENTS: "read_linked_students",
  MANAGE_STAFF: "manage_staff",
  READ_AUDIT: "read_audit",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ── Role → Permission Map ────────────────────────────────────────────────────

const ALL_PERMISSIONS = new Set<Permission>(
  Object.values(PERMISSIONS) as Permission[]
);

const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  ADMIN: ALL_PERMISSIONS,
  ALUNO: new Set([
    PERMISSIONS.LIST_STUDENTS,
    PERMISSIONS.RECORD_BIOMETRICS,
    PERMISSIONS.READ_BIOMETRICS,
    PERMISSIONS.RECORD_TESTS,
    PERMISSIONS.READ_TESTS,
    PERMISSIONS.SUBMIT_QUESTIONNAIRES,
    PERMISSIONS.READ_QUESTIONNAIRES,
    PERMISSIONS.TRIGGER_SOS,
    PERMISSIONS.READ_REPORTS,
  ]),
  PROFESSOR: new Set([
    PERMISSIONS.CREATE_STUDENT,
    PERMISSIONS.LIST_STUDENTS,
    PERMISSIONS.READ_STUDENT_PROFILE,
    PERMISSIONS.RECORD_BIOMETRICS,
    PERMISSIONS.READ_BIOMETRICS,
    PERMISSIONS.RECORD_TESTS,
    PERMISSIONS.READ_TESTS,
    PERMISSIONS.READ_QUESTIONNAIRES,
    PERMISSIONS.READ_SOS,
    PERMISSIONS.SEND_REPORTS,
    PERMISSIONS.READ_REPORTS,
    PERMISSIONS.MANAGE_DISPENSAS,
    PERMISSIONS.READ_CLASS_REPORTS,
    PERMISSIONS.MANAGE_GUARDIANS,
  ]),
  PSICOLOGO: new Set([
    PERMISSIONS.LIST_STUDENTS,
    PERMISSIONS.READ_SOS,
    PERMISSIONS.READ_QUESTIONNAIRES,
  ]),
  PAIS: new Set([
    PERMISSIONS.LIST_STUDENTS,
    PERMISSIONS.READ_BIOMETRICS,
    PERMISSIONS.READ_TESTS,
    PERMISSIONS.READ_QUESTIONNAIRES,
    PERMISSIONS.READ_REPORTS,
    PERMISSIONS.READ_LINKED_STUDENTS,
  ]),
};

// ── Public API ───────────────────────────────────────────────────────────────

export function canRole(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function getRolePermissions(role: Role): Permission[] {
  return Array.from(ROLE_PERMISSIONS[role] ?? []);
}

export function isKnownRole(role: string): role is Role {
  return role in ROLE_PERMISSIONS;
}

export function isAdminRole(role: Role): boolean {
  return role === "ADMIN";
}

export function isStaffRole(role: Role): boolean {
  return role === "ADMIN" || role === "PROFESSOR";
}

export function canAccessSosInbox(role: Role): boolean {
  return role === "ADMIN" || role === "PROFESSOR" || role === "PSICOLOGO";
}

export function canAccessStudentByRole({
  role,
  permission,
  isOwner,
  isGuardian,
}: {
  role: Role;
  permission: Permission;
  isOwner: boolean;
  isGuardian: boolean;
}): boolean {
  if (!canRole(role, permission)) return false;
  if (role === "ADMIN" || role === "PROFESSOR") return true;
  if (role === "PSICOLOGO") {
    return (
      permission === PERMISSIONS.READ_SOS ||
      permission === PERMISSIONS.READ_QUESTIONNAIRES
    );
  }
  if (role === "ALUNO") return isOwner;
  if (role === "PAIS") return isGuardian;
  return false;
}
