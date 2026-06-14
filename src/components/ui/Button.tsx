import { clsx } from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'xs' | 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: React.ReactNode
  children?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-white border-gray-300 text-gray-700 hover:bg-yellow-50 hover:border-gray-400 hover:text-yellow-700 shadow-sm',
  secondary: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm',
  ghost: 'bg-transparent hover:bg-gray-100/60 text-gray-600 hover:text-gray-800 border border-transparent',
  danger: 'bg-white border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 shadow-sm',
  success: 'bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:text-green-700 shadow-sm',
}

const sizeClasses: Record<Size, string> = {
  xs: 'text-2xs px-2 py-1 rounded gap-1',
  sm: 'text-xs px-2.5 py-1.5 rounded gap-1.5',
  md: 'text-sm px-3 py-2 rounded-lg gap-2',
}

export function Button({ variant = 'secondary', size = 'sm', icon, children, className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
