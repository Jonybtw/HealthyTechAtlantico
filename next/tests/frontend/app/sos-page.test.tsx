import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentRole } = vi.hoisted(() => ({
  currentRole: { value: "PSICOLOGO" as "PSICOLOGO" | "ADMIN" },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace?: string) => (key: string) =>
    (
      {
        "sos.staffTitle": "SOS Alerts",
        "sos.staffDescription": "Student well-being alerts",
        "sos.refresh": "Refresh",
        "sos.totalAlerts": "Total",
        "sos.totalAlertsDescription": "All alerts currently tracked.",
        "sos.pendingAlerts": "Pending",
        "sos.pendingAlertsDescription": "Alerts waiting for action.",
        "sos.resolvedAlerts": "Resolved",
        "sos.resolvedAlertsDescription": "Alerts already handled.",
        "sos.filterLabel": "Filter alerts",
        "sos.filterPending": "Pending",
        "sos.filterResolved": "Resolved",
        "sos.filterAll": "All",
        "sos.openStudentProfile": "Open student profile",
        "sos.resolve": "Resolve",
        "sos.resolved": "Resolved",
        "sos.pending": "Pending",
        "sos.psychLabel": "Psychologist",
        "sos.teacherLabel": "Teacher",
        "sos.createdAt": "Date",
        "sos.resolvedAt": "Resolved on",
        "sos.resolvedBy": "Resolved by",
        "sos.staffPendingHint": "Pending follow-up",
        "sos.emptyInboxTitle": "No SOS alerts",
        "sos.emptyInboxDescription": "Inbox empty",
        "sos.noFilteredTitle": "No filtered results",
        "sos.noFilteredDescription": "Adjust filters",
        "sos.activeAlertTitle": "Status",
        "sos.radarEyebrow": "Live radar",
        "sos.radarTitle": "Current SOS queue",
        "sos.radarDescription": "Priority view of active alerts.",
        "sos.priorityEyebrow": "Priority",
        "sos.priorityTitle": "Priority follow-up",
        "sos.priorityDescription": "Next alerts to review.",
        "sos.queueEyebrow": "Queue",
        "sos.queueTitle": "SOS queue",
        "sos.queueDescription": "Operational list of student alerts.",
        "sos.visibleAlertsCount": "{count} visible alerts",
        "sos.lastUpdated": "Updated {time}",
        "sos.neverUpdated": "Never updated",
        "sos.refreshing": "Refreshing",
        "sos.oldestPendingLabel": "Oldest pending",
        "sos.priorityEmptyTitle": "No priority alerts",
        "sos.priorityEmptyDescription": "Everything is under control.",
        "sos.priorityOnlyOldestTitle": "Only one pending alert",
        "sos.priorityOnlyOldestDescription":
          "The oldest alert is already highlighted above.",
        "sos.studentLabel": "Student",
      } as Record<string, string>
    )[`${namespace}.${key}`] ?? key,
}));

vi.mock("@/components/user-context", () => ({
  useUser: () => ({
    id: "user-1",
    email: "user@example.com",
    role: currentRole.value,
  }),
}));

import SosPage from "@/app/(app)/sos/sos-client";

function createJsonResponse(data: unknown) {
  return {
    ok: true,
    json: async () => ({ data }),
  } as Response;
}

describe("SosPage staff links", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createJsonResponse([
          {
            id: "alert-1",
            psych: "Dr. Ana",
            teacher: "Prof. Carlos",
            psychEmail: "psicologo@colegioatlantico.pt",
            teacherEmail: "professor@colegioatlantico.pt",
            resolved: false,
            createdAt: "2026-03-20T10:00:00.000Z",
            resolvedAt: null,
            student: {
              id: "student-1",
              name: "Maria Silva",
              className: "8A",
              schoolYear: "2025/2026",
            },
            resolvedBy: null,
          },
        ]),
      ),
    );
  });

  it("routes psychologists to the read-only acompanhamento page", async () => {
    currentRole.value = "PSICOLOGO";

    render(<SosPage />);

    const links = await screen.findAllByRole("link", {
      name: "Open student profile",
    });

    expect(
      links.some(
        (link) => link.getAttribute("href") === "/acompanhamento/student-1",
      ),
    ).toBe(true);
  });

  it("keeps admins on the full student detail page", async () => {
    currentRole.value = "ADMIN";

    render(<SosPage />);

    const links = await screen.findAllByRole("link", {
      name: "Open student profile",
    });

    expect(
      links.some((link) => link.getAttribute("href") === "/alunos/student-1"),
    ).toBe(true);
  });
});
