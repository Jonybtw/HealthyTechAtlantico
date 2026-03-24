import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refreshMock = vi.fn();
const signOutMock = vi.fn();
const writeThemeMock = vi.fn();
let pathnameMock = "/sos";

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock,
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("next-auth/react", () => ({
  signOut: (options: unknown) => signOutMock(options),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "pt",
  useTranslations: () => (key: string) =>
    (
      {
        "nav.dashboard": "Dashboard",
        "nav.biometria": "Biometrics",
        "nav.testes": "Tests",
        "nav.questionarios": "Questionnaires",
        "nav.sos": "SOS",
        "nav.relatorio": "Reports",
        "nav.perfil": "Profile",
        "nav.changeTheme": "Change theme",
        "nav.changeLanguage": "Change language",
        "nav.logout": "Sign out",
        "roles.ALUNO": "Student",
      } as Record<string, string>
    )[key] ?? key,
}));

vi.mock("@/lib/theme", () => ({
  useTheme: () => "light",
  writeTheme: (theme: "light" | "dark") => writeThemeMock(theme),
}));

vi.mock("@/hooks/use-queries", () => ({
  useSosAlerts: () => ({ data: [], isLoading: false }),
}));

import { AppShell } from "@/components/app-shell";
import { within } from "@testing-library/react";

describe("AppShell", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    signOutMock.mockReset();
    writeThemeMock.mockReset();
    pathnameMock = "/sos";
  });

  it("renders only role-allowed navigation items", () => {
    render(
      <AppShell
        user={{
          id: "user-1",
          email: "student@example.com",
          role: "ALUNO",
          name: "Ana Student",
        }}
      >
        <div>Dashboard body</div>
      </AppShell>
    );

    expect(screen.getAllByText("SOS").length).toBeGreaterThan(0);
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Audit")).not.toBeInTheDocument();
    expect(screen.getAllByText("Ana Student").length).toBeGreaterThan(0);
  });

  it("compacts the top bar on the student questionnaires page without removing the profile dropdown", () => {
    pathnameMock = "/questionarios";

    render(
      <AppShell
        user={{
          id: "user-1",
          email: "student@example.com",
          role: "ALUNO",
          name: "Ana Student",
        }}
      >
        <div>Questionnaires body</div>
      </AppShell>
    );

    const banner = screen.getByRole("banner");
    expect(within(banner).getByText("Questionnaires")).toBeInTheDocument();
    expect(within(banner).getAllByText("Ana Student")).toHaveLength(1);
    expect(screen.getAllByText("Ana Student").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Ana Student/ })).toBeInTheDocument();
  });

  it("triggers sign out with the login callback", async () => {
    const user = userEvent.setup();

    render(
      <AppShell
        user={{
          id: "user-1",
          email: "student@example.com",
          role: "ALUNO",
        }}
      >
        <div>Dashboard body</div>
      </AppShell>
    );

    await user.click(screen.getAllByTitle("Sign out")[0]);

    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/login" });
  });
});
