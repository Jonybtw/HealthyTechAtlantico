import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMock = vi.fn();
const writeThemeMock = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "user-1",
        name: "Ana",
        email: "ana@example.com",
        role: "ALUNO",
        consentRgpd: false,
        consentShare: false,
      },
    },
    update: updateMock,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    (
      {
        title: "Profile",
        description: "Account settings",
        passwordMismatch: "Passwords do not match.",
        passwordShort: "Minimum 8 characters.",
        passwordSuccess: "Password changed successfully.",
        currentPassword: "Current password",
        newPassword: "New password",
        confirmPassword: "Confirm password",
        savePassword: "Save password",
        lightMode: "Light",
        darkMode: "Dark",
        changePassword: "Change password",
        rgpdTitle: "GDPR consent",
        rgpdGrant: "Grant",
        rgpdRevoke: "Revoke",
      } as Record<string, string>
    )[key] ?? key,
}));

vi.mock("@/lib/theme", () => ({
  useTheme: () => "light",
  writeTheme: (theme: "light" | "dark") => writeThemeMock(theme),
}));

import PerfilPage from "@/app/(app)/perfil/page";

describe("PerfilPage", () => {
  beforeEach(() => {
    updateMock.mockReset();
    writeThemeMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("pushes consent changes into the active session without re-login", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(global.fetch);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: "Ana",
        email: "ana@example.com",
        role: "ALUNO",
        consentRgpd: true,
        consentShare: false,
      }),
    } as Response);

    render(<PerfilPage />);

    await user.click(screen.getByRole("button", { name: "Grant" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/users/me",
        expect.objectContaining({
          method: "PUT",
        })
      );
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          consentRgpd: true,
          consentShare: false,
        })
      );
    });
  });
});
