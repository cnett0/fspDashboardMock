import { clsx } from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiTileProps {
  label: string
  value: string
  unit?: string
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  color?: 'green' | 'amber' | 'red' | 'blue' | 'default'
  icon?: React.ReactNode
  subtitle?: string
  className?: string
}

const colorClasses = {
  green: 'text-green-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
  default: 'text-white',
}

export function KpiTile({ label, value, unit, trend, trendValue, color = 'default', icon, subtitle, className }: KpiTileProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'

  return (
    <div className={clsx('panel p-3 flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <span className="kpi-label">{label}</span>
        {icon && <span className="text-slate-600">{icon}</span>}
      </div>
      <div className="flex items-end gap-1.5">
        <span className={clsx('font-mono text-xl font-bold leading-none', colorClasses[color])}>
          {value}
        </span>
        {unit && <span className="text-xs text-slate-500 pb-0.5">{unit}</span>}
      </div>
      {(trend || subtitle) && (
        <div className="flex items-center gap-1">
          {trend && (
            <>
              <TrendIcon size={10} className={trendColor} />
              {trendValue && <span className={clsx('text-2xs', trendColor)}>{trendValue}</span>}
            </>
          )}
          {subtitle && <span className="text-2xs text-slate-600">{subtitle}</span>}
        </div>
      )}
    </div>
  )
}

interface KpiStripProps {
  tiles: KpiTileProps[]
}

export function KpiStrip({ tiles }: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
      {tiles.map((tile, i) => (
        <KpiTile key={i} {...tile} />
      ))}
    </div>
  )
}
