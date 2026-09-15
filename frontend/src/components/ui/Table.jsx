/**
 * Table — Neobrutalist data table component.
 * Constitution Principle I: 4px border, hard shadow, 0px radius.
 * Constitution Principle III: Modular, reusable for all tabular data.
 *
 * @param {Object[]} columns - Array of { key, label, render? } column definitions.
 * @param {Object[]} data - Array of row objects keyed by column.key.
 * @param {Function} onRowClick - Optional click handler receiving the row object.
 */

export function Table({ columns = [], data = [], onRowClick, rowActionLabel = (row) => `Abrir ${row.id || 'item'}`, className = '' }) {
  return (
    <div className={`overflow-x-auto border-4 border-charcoal shadow-hard ${className}`}>
      <table className="w-full border-4 border-charcoal text-left">
        <thead>
          <tr className="bg-lime border-b-4 border-charcoal">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-sm font-bold uppercase tracking-wider text-charcoal border-r-4 border-charcoal last:border-r-0"
              >
                {col.label}
              </th>
            ))}
            {onRowClick && <th className="px-4 py-3 text-sm font-bold uppercase tracking-wider text-charcoal">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onRowClick ? 1 : 0)}
                className="px-4 py-8 text-center text-gray-500 uppercase tracking-wide text-sm"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row.id || idx}
                className={[
                  'border-b-4 border-charcoal last:border-b-0',
                  'hover:bg-lime/10 transition-colors duration-75',
                ].join(' ')}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm border-r-4 border-charcoal last:border-r-0"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {onRowClick && <td className="px-4 py-2"><button type="button" onClick={() => onRowClick(row)} className="min-h-11 border-2 border-charcoal bg-offwhite px-3 font-bold focus-visible:ring-4 focus-visible:ring-lime">{rowActionLabel(row)}</button></td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
