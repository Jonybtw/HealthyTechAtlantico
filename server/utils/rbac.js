const PERMISSIONS = {
  CREATE_STUDENT: "create_student",
  LIST_STUDENTS: "list_students",
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
};

const ROLE_PERMISSIONS = {
  aluno: new Set([
    PERMISSIONS.CREATE_STUDENT,
    PERMISSIONS.LIST_STUDENTS,
    PERMISSIONS.RECORD_BIOMETRICS,
    PERMISSIONS.READ_BIOMETRICS,
    PERMISSIONS.RECORD_TESTS,
    PERMISSIONS.READ_TESTS,
    PERMISSIONS.SUBMIT_QUESTIONNAIRES,
    PERMISSIONS.READ_QUESTIONNAIRES,
    PERMISSIONS.TRIGGER_SOS,
    PERMISSIONS.READ_SOS,
    PERMISSIONS.SEND_REPORTS,
    PERMISSIONS.READ_REPORTS,
  ]),
  professor: new Set(Object.values(PERMISSIONS)),
  psicologo: new Set([PERMISSIONS.READ_SOS, PERMISSIONS.READ_REPORTS, PERMISSIONS.LIST_STUDENTS]),
  pais: new Set([
    PERMISSIONS.LIST_STUDENTS,
    PERMISSIONS.READ_BIOMETRICS,
    PERMISSIONS.READ_TESTS,
    PERMISSIONS.READ_QUESTIONNAIRES,
    PERMISSIONS.READ_REPORTS,
    PERMISSIONS.READ_LINKED_STUDENTS,
  ]),
};

const canRole = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.has(permission);
};

const canAccessStudentByRole = ({ role, permission, isOwner, isGuardian }) => {
  if (!canRole(role, permission)) return false;
  if (role === "professor") return true;

  if (role === "psicologo") {
    return permission === PERMISSIONS.READ_SOS || permission === PERMISSIONS.READ_REPORTS;
  }

  if (role === "aluno") return Boolean(isOwner);
  if (role === "pais") return Boolean(isGuardian);
  return false;
};

module.exports = {
  PERMISSIONS,
  canRole,
  canAccessStudentByRole,
};
