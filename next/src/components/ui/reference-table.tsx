interface ReferenceTableProps {
  title?: string;
  caption?: string;
  headers: string[];
  rows: { cells: string[] }[];
}

export function ReferenceTable({
  title,
  caption,
  headers,
  rows,
}: ReferenceTableProps) {
  return (
    <div className="animate-fade-in-up flex flex-col gap-3">
      {title ? (
        <h3 className="section-title text-foreground">{title}</h3>
      ) : null}
      <div className="surface-secondary overflow-x-auto rounded-2xl border border-border/60 shadow-[0_8px_22px_-20px_rgb(9_21_35_/_0.35)]">
        <table className="w-full min-w-[340px] table-fixed text-sm sm:min-w-[360px]">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[38%]" />
            <col className="w-[38%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border/60 bg-muted/55">
              {headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-3 py-2.5 text-left text-tiny font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:px-4"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={`${row.cells.join("-")}-${rowIndex}`}
                className="border-t border-border/50 transition-colors odd:bg-transparent even:bg-muted/15 hover:bg-navy-100/45 dark:hover:bg-navy-900/35"
              >
                {row.cells.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th
                      key={cellIndex}
                      scope="row"
                      className="px-3 py-3 text-left font-semibold text-foreground/95 sm:px-4"
                    >
                      {cell}
                    </th>
                  ) : (
                    <td
                      key={cellIndex}
                      className="px-3 py-3 text-left font-medium tabular-nums text-foreground/95 sm:px-4"
                    >
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
