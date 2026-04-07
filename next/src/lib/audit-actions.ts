export const AUDIT_ACTIONS = {
  LOGIN: "login",
  LOGOUT: "logout",
  REGISTER: "register",
  CREATE_STUDENT: "create_student",
  UPDATE_STUDENT: "update_student",
  DELETE_STUDENT: "delete_student",
  READ_BIOMETRICS: "read_biometrics",
  RECORD_BIOMETRICS: "record_biometrics",
  READ_TESTS: "read_tests",
  RECORD_TESTS: "record_tests",
  READ_QUESTIONNAIRES: "read_questionnaires",
  SUBMIT_QUESTIONNAIRE: "submit_questionnaire",
  READ_SOS: "read_sos",
  TRIGGER_SOS: "trigger_sos",
  RESOLVE_SOS: "resolve_sos",
  SEND_REPORT: "send_report",
  EXPORT_REPORT: "export_report",
  CREATE_EXEMPTION: "create_exemption",
  UPDATE_EXEMPTION: "update_exemption",
  DELETE_EXEMPTION: "delete_exemption",
  ADD_GUARDIAN: "add_guardian",
  REMOVE_GUARDIAN: "remove_guardian",
  CHANGE_PASSWORD: "change_password",
  UPDATE_CONSENT: "update_consent",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ACTION_VALUES = Object.values(
  AUDIT_ACTIONS,
) as AuditAction[];

export interface AuditLogListItem {
  id: string;
  action: string;
  targetId: string | null;
  ipAddress: string | null;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
}

export interface AuditLogListResponse {
  logs: AuditLogListItem[];
  total: number;
  page: number;
  pages: number;
}

export function isAuditAction(action: string): action is AuditAction {
  return AUDIT_ACTION_VALUES.includes(action as AuditAction);
}
