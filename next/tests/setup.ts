import React from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) =>
    React.createElement("img", props),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string | { pathname?: string };
      children: React.ReactNode;
  }) => {
    const resolvedHref =
      typeof href === "string"
        ? href
        : (href as { pathname?: string } | undefined)?.pathname ?? "#";

    return React.createElement(
      "a",
      {
        href: resolvedHref,
        ...props,
      },
      children
    );
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
