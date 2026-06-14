import { clsx } from 'clsx'

interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'right' | 'center'
  render: (row: T) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  selectedKey?: string
  getKey: (row: T) => string
  className?: string
  emptyMessage?: string
}

export function Table<T>({ columns, data, onRowClick, selectedKey, getKey, className, emptyMessage }: TableProps<T>) {
  return (
    <div className={clsx('overflow-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-700/40">
            {columns.map(col => (
              <th
                key={col.key}
                className={clsx(
                  'px-3 py-2 text-2xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                  col.width,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-600 text-xs">
                {emptyMessage ?? 'Keine Daten'}
              </td>
            </tr>
          )}
          {data.map(row => {
            const key = getKey(row)
            const isSelected = selectedKey === key
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'border-b border-gray-700/40/50',
                  onRowClick && 'cursor-pointer hover:bg-gray-700/50',
                  isSelected && 'bg-gray-700/50 border-l-2 border-l-blue-500',
                )}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={clsx(
                      'px-3 py-2 text-xs',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
