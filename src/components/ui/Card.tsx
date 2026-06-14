import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  selected?: boolean
  style?: React.CSSProperties
}

export function Card({ children, className, onClick, selected, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={clsx(
        'panel',
        onClick && 'cursor-pointer hover:border-green-600/50 hover:shadow-xl hover:shadow-green-900/20 transition-all duration-300',
        selected && 'border-green-500/60 shadow-lg shadow-green-900/20',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  children?: React.ReactNode
}

export function CardHeader({ title, subtitle, action, icon, children }: CardHeaderProps) {
  return (
    <div className="panel-header">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {children ? (
          <div className="flex items-center gap-2 min-w-0 panel-title">{children}</div>
        ) : (
          <>
            {icon && <span className="text-green-400/70 flex-shrink-0">{icon}</span>}
            <div className="min-w-0">
              <div className="panel-title truncate">{title}</div>
              {subtitle && <div className="text-2xs text-slate-600 mt-0.5">{subtitle}</div>}
            </div>
          </>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-2">{action}</div>}
    </div>
  )
}
