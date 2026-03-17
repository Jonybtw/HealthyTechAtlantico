import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageScaffold } from "@/components/ui/page-scaffold";

describe("PageScaffold", () => {
  it("renders the shared header from headerProps and actions", () => {
    render(
      <PageScaffold
        headerProps={{
          title: "Students",
          description: "Manage linked students",
          eyebrow: "Core",
          meta: "6 records",
          status: <span>Live</span>,
        }}
        headerActions={<button type="button">Refresh</button>}
      >
        <div>Page body</div>
      </PageScaffold>
    );

    expect(screen.getByText("Students")).toBeInTheDocument();
    expect(screen.getByText("Manage linked students")).toBeInTheDocument();
    expect(screen.getByText("Refresh")).toBeInTheDocument();
    expect(screen.getByText("Page body")).toBeInTheDocument();
  });

  it("uses the custom header slot when provided", () => {
    render(
      <PageScaffold header={<div>Custom header</div>} headerProps={{ title: "Ignored" }}>
        <div>Content</div>
      </PageScaffold>
    );

    expect(screen.getByText("Custom header")).toBeInTheDocument();
    expect(screen.queryByText("Ignored")).not.toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
