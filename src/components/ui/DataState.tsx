/**
 * Shared components for displaying live data freshness, errors, and loading states.
 * Every market panel that uses real data must use these — no silent fallbacks.
 */
import { AlertTriangle, Clock, RefreshCw, WifiOff } from 'lucide-react'
import type { FreshnessMetadata } from '../../api/market'

export function DataLoading({ label = 'Lade Daten…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[120px]">
      <div className="flex flex-col items-center gap-2 text-center">
        <RefreshCw size={20} className="text-blue-400 animate-spin" />
        <span className="text-2xs text-slate-500">{label}</span>
      </div>
    </div>
  )
}

export function DataError({ message, source }: { message: string; source?: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[120px]">
      <div className="flex flex-col items-center gap-2 text-center max-w-xs px-4">
        <WifiOff size={20} className="text-red-400" />
        <span className="text-2xs font-semibold text-red-400">Daten nicht verfügbar</span>
        {source && <span className="text-2xs text-slate-600">Quelle: {source}</span>}
        <span className="text-2xs text-slate-500 italic">{message}</span>
        <span className="text-2xs text-slate-600 mt-1">
          Backend-Sync erforderlich: POST /api/admin/sync/all
        </span>
      </div>
    </div>
  )
}

export function DataEmpty({ label = 'Keine Daten', hint }: { label?: string; hint?: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[120px]">
      <div className="flex flex-col items-center gap-2 text-center max-w-xs px-4">
        <AlertTriangle size={20} className="text-amber-400" />
        <span className="text-2xs font-semibold text-amber-400">{label}</span>
        {hint && <span className="text-2xs text-slate-500">{hint}</span>}
        <span className="text-2xs text-slate-600 mt-1 italic">
          Sync starten: POST /api/admin/sync/all
        </span>
      </div>
    </div>
  )
}

interface SourceBadgeProps {
  freshness: FreshnessMetadata
  className?: string
}

export function SourceBadge({ freshness, className = '' }: SourceBadgeProps) {
  const ts = freshness.lastUpdated
    ? new Date(freshness.lastUpdated).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
    : 'Nie synchronisiert'

  const stale = freshness.isStale || !freshness.lastUpdated

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stale ? 'bg-amber-400' : 'bg-green-400'}`} />
      <span className="text-2xs text-slate-500 truncate">
        Quelle: {freshness.sourceSystem} · {ts}
      </span>
      {stale && (
        <div className="flex items-center gap-1 text-2xs text-amber-400">
          <Clock size={10} />
          <span>Veraltet</span>
        </div>
      )}
    </div>
  )
}

/** Wraps a panel with a source badge footer. */
export function DataPanel({
  freshness,
  loading,
  error,
  empty,
  emptyHint,
  children,
}: {
  freshness?: FreshnessMetadata
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyHint?: string
  children: React.ReactNode
}) {
  if (loading) return <DataLoading />
  if (error) return <DataError message={error} source={freshness?.sourceSystem} />
  if (empty) return <DataEmpty hint={emptyHint ?? `Quelle: ${freshness?.sourceSystem ?? 'unbekannt'}`} />
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">{children}</div>
      {freshness && (
        <div className="flex-shrink-0 px-3 pb-2 mt-1">
          <SourceBadge freshness={freshness} />
        </div>
      )}
    </div>
  )
}
