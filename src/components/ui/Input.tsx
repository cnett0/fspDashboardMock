import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  className?: string
}

export function Input({ icon, className, ...props }: InputProps) {
  return (
    <div className="relative flex items-center">
      {icon && (
        <span className="absolute left-2.5 text-slate-500 pointer-events-none">{icon}</span>
      )}
      <input
        className={clsx(
          'bg-gray-800/80 border border-gray-600/50 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-green-500/60 placeholder-slate-500 w-full',
          icon && 'pl-8',
          className,
        )}
        {...props}
      />
    </div>
  )
}
