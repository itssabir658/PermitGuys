import type { DataTable } from "@/content/types";

/**
 * A captioned data table that scrolls sideways on narrow screens instead of
 * overflowing. It never scrolls vertically, so rows rising into place on
 * the scroll (globals.css, "Inner pages") cannot add a vertical scrollbar.
 */
export function DataTableView({ table }: { table: DataTable }) {
  return (
    <figure className="mt-8 max-w-(--measure-article)">
      <div className="overflow-x-auto overflow-y-hidden" tabIndex={0} role="region" aria-label={table.caption}>
        <table className="w-full border-collapse text-left text-[0.95rem]">
          <caption className="pb-4 text-left font-semibold text-charcoal-900">{table.caption}</caption>
          <thead>
            <tr className="border-b-2 border-charcoal-900">
              {table.columns.map((c) => (
                <th key={c} scope="col" className="py-3 pr-6 font-semibold text-charcoal-900">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.join("|")} className="border-b border-line">
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="py-3 pr-6 font-medium text-charcoal-900">
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="py-3 pr-6 text-ink">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-3 text-sm text-ink-muted">Source: {table.source}</figcaption>
    </figure>
  );
}
