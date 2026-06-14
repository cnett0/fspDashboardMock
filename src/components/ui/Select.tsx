import { clsx } from 'clsx'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  className?: string
}

export function Select({ options, className, ...props }: SelectProps) {
  return (
    <select
      className={clsx(
        'bg-gray-800/80 border border-gray-600/50 text-slate-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-green-500/60 cursor-pointer',
        className,
      )}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
