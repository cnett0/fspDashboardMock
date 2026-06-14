import { clsx } from 'clsx'

type Variant = 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'purple'

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<Variant, string> = {
  green: 'badge-green',
  amber: 'badge-amber',
  red: 'badge-red',
  blue: 'badge-blue',
  slate: 'badge-slate',
  purple: 'bg-purple-900/40 text-purple-400 border border-purple-800/50 text-2xs px-1.5 py-0.5 rounded font-medium',
}

export function Badge({ variant = 'slate', children, className }: BadgeProps) {
  return (
    <span className={clsx(variantClasses[variant], className)}>
      {children}
    </span>
  )
}

export function ComplianceBadge({ state }: { state: string }) {
  const map: Record<string, { variant: Variant; label: string }> = {
    compliant: { variant: 'green', label: 'Konform' },
    warning: { variant: 'amber', label: 'Warnung' },
    non_compliant: { variant: 'red', label: 'Nicht konform' },
    unknown: { variant: 'slate', label: 'Unbekannt' },
  }
  const { variant, label } = map[state] ?? { variant: 'slate', label: state }
  return <Badge variant={variant}>{label}</Badge>
}

export function TelemetryBadge({ freshness }: { freshness: string }) {
  const map: Record<string, { variant: Variant; label: string }> = {
    fresh: { variant: 'green', label: 'Live' },
    stale: { variant: 'amber', label: 'Veraltet' },
    missing: { variant: 'red', label: 'Fehlend' },
  }
  const { variant, label } = map[freshness] ?? { variant: 'slate', label: freshness }
  return <Badge variant={variant}>{label}</Badge>
}

export function ControllabilityBadge({ status }: { status: string }) {
  const map: Record<string, { variant: Variant; label: string }> = {
    dispatchable: { variant: 'green', label: 'Dispatchbar' },
    limited: { variant: 'amber', label: 'Eingeschränkt' },
    unavailable: { variant: 'red', label: 'Nicht verfügbar' },
    maintenance: { variant: 'slate', label: 'Wartung' },
  }
  const { variant, label } = map[status] ?? { variant: 'slate', label: status }
  return <Badge variant={variant}>{label}</Badge>
}
