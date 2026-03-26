import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentRole, translators } = vi.hoisted(() => ({
  currentRole: { value: "ADMIN" as "ADMIN" | "PROFESSOR" },
  translators: {
    auditoria: (key: string, values?: Record<string, unknown>) =>
      (
        {
          title: "Audit Log",
          description: "Last 100 platform actions",
          refresh: "Refresh",
          totalLogs: `${values?.count ?? 0} log entries`,
          filtersTitle: "Filters",
          filtersDescription: "Narrow the audit trail by action and date range.",
          filterAction: "Action",
          filterStartDate: "Start date",
          filterEndDate: "End date",
          allActions: "All actions",
          applyFilters: "Apply",
          clearFilters: "Clear",
          blockedTitle: "Audit access restricted",
          blockedDescription: "The audit trail is available to administrators only.",
          loadError: "Error loading audit log.",
          loadFailedTitle: "Could not load the audit trail",
          loadFailedDescription: "Try again to refresh the latest platform activity.",
          emptyTitle: "Empty Grid",
          noLogs: "No audit log entries.",
          emptyFilteredTitle: "No results for these filters",
          emptyFilteredDescription: "Adjust the filters or clear them to see more records.",
          pageSummary: `Page ${values?.page ?? 1} of ${values?.pages ?? 1} - ${values?.total ?? 0} records`,
          showingCount: `Showing ${values?.count ?? 0} entries`,
          previousPage: "Previous",
          nextPage: "Next",
          colDatetime: "Date / Time",
          colAction: "Action",
          colUser: "User",
          colTarget: "Target",
          colIp: "IP",
          "actions.send_report": "Send report",
          "actions.login": "Sign in",
        } as Record<string, string>
      )[key] ?? key,
  },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en-GB",
  useTranslations: (namespace?: string) =>
    translators[(namespace ?? "auditoria") as keyof typeof translators] ??
    ((key: string) => key),
}));

vi.mock("@/components/user-context", () => ({
  useUser: () => ({
    id: "admin-1",
    email: "admin@example.com",
    role: currentRole.value,
  }),
}));

import AuditoriaPage from "@/app/(app)/auditoria/auditoria-client";

function createJsonResponse(data: unknown) {
  return {
    ok: true,
    json: async () => ({ data }),
  } as Response;
}

describe("AuditoriaPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createJsonResponse({
          logs: [
            {
              id: "log-1",
              action: "send_report",
              targetId: "student-1",
              ipAddress: "127.0.0.1",
              createdAt: "2026-03-24T10:30:00.000Z",
              userEmail: "admin@example.com",
              userName: "Admin",
            },
          ],
          total: 1,
          page: 1,
          pages: 1,
        })
      )
    );
  });

  it("translates shared audit actions instead of exposing raw keys", async () => {
    currentRole.value = "ADMIN";

    render(<AuditoriaPage />);

    await waitFor(() => {
      expect(screen.getByText("Send report")).toBeInTheDocument();
    });

    expect(screen.queryByText("send_report")).not.toBeInTheDocument();
    expect(screen.getAllByText("Page 1 of 1 - 1 records")).toHaveLength(2);
  });

  it("blocks non-admin users from the audit page", () => {
    currentRole.value = "PROFESSOR";

    render(<AuditoriaPage />);

    expect(screen.getByText("Audit access restricted")).toBeInTheDocument();
    expect(
      screen.getByText("The audit trail is available to administrators only.")
    ).toBeInTheDocument();
  });
});
