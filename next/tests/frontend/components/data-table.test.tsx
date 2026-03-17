import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DataTable, type Column } from "@/components/ui/data-table";

type Row = {
  id: string;
  name: string;
  classroom: string;
};

const columns: Column<Row>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "classroom", header: "Class" },
];

const rows: Row[] = [
  { id: "1", name: "Ana", classroom: "9A" },
  { id: "2", name: "Bruno", classroom: "9B" },
];

describe("DataTable", () => {
  it("renders the standardized toolbar contract", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        searchable={false}
        toolbarTitle="Students"
        toolbarSummary="2 total"
        toolbarActions={<button type="button">Export</button>}
      />
    );

    expect(screen.getByText("Students")).toBeInTheDocument();
    expect(screen.getByText("2 total")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Pesquisar...")).not.toBeInTheDocument();
  });

  it("filters rows through the shared search input", async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.id}
        searchPlaceholder="Search students"
      />
    );

    await user.type(screen.getByPlaceholderText("Search students"), "Ana");

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.queryByText("Bruno")).not.toBeInTheDocument();
  });
});
