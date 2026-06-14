/**
 * Source health dashboard — shows which market data sources are configured,
 * fresh, stale, or erroring. Used in Settings page.
 */
import { Card, CardHeader } from '../ui/Card'
import { useApi, useApiMutation } from '../../hooks/useApi'
import { getSourcesHealth, triggerSync } from '../../api/market'
import { useToast } from '../ui/Toast'
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, MinusCircle, Settings } from 'lucide-react'
import type { SourceHealth } from '../../api/market'

const STATUS_META: Record<SourceHealth['status'], { icon: React.ReactNode; label: string; color: string }> = {
  ok:            { icon: <CheckCircle size={14} />, label: 'Aktuell',         color: 'text-green-400' },
  stale:         { icon: <AlertTriangle size={14} />, label: 'Veraltet',      color: 'text-amber-400' },
  error:         { icon: <XCircle size={14} />, label: 'Fehler',              color: 'text-red-400' },
  never_synced:  { icon: <MinusCircle size={14} />, label: 'Nie synchronisiert', color: 'text-slate-500' },
  not_configured:{ icon: <Settings size={14} />, label: 'Nicht konfiguriert', color: 'text-slate-600' },
}

const SOURCE_LABELS: Record<string, string> = {
  entsoe:                  'ENTSO-E Transparency Platform',
  regelleistung:           'regelleistung.net (FCR/aFRR)',
  netztransparenz:         'netztransparenz.de (reBAP)',
  variable_netzentgelte:   'variable-netzentgelte.de',
  load_dependent_grid_fees:'DSO Preisblätter (lastabh.)',
  bundesnetzagentur:       'Bundesnetzagentur (EEG)',
  bdew:                    'BDEW Strompreisanalyse',
  pv_combined:             'PV Eigenverbrauch (kombiniert)',
}

const SYNC_TARGETS: Partial<Record<string, Parameters<typeof triggerSync>[0]>> = {
  entsoe:                  'spot',
  regelleistung:           'reserve',
  netztransparenz:         'rebap',
  variable_netzentgelte:   'grid-fees',
  load_dependent_grid_fees:'grid-fees',
  bundesnetzagentur:       'pv',
  bdew:                    'pv',
}

export function SourceHealthPanel() {
  const { data, loading, error, refetch } = useApi(() => getSourcesHealth(), [])
  const { success: toastSuccess, error: toastError } = useToast()
  const { mutate: doSync, loading: syncing } = useApiMutation(
    (target: Parameters<typeof triggerSync>[0]) => triggerSync(target),
  )

  const handleSync = async (target: Parameters<typeof triggerSync>[0]) => {
    const r = await doSync(target)
    if (r?.ok) { toastSuccess('Sync gestartet'); refetch() }
    else toastError('Sync fehlgeschlagen')
  }

  if (loading) return <div className="text-2xs text-slate-500 p-4">Lade Quellstatus…</div>
  if (error) return <div className="text-2xs text-red-400 p-4">Fehler: {error}</div>

  const sources = data?.sources ?? []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <span>Marktdaten-Quellengesundheit</span>
          <button
            onClick={refetch}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </CardHeader>

      {data && (
        <div className="px-3 pt-2 pb-1 flex gap-4 text-2xs border-b border-gray-700/40">
          {Object.entries(data.summary ?? {}).map(([k, v]) => (
            <div key={k} className="text-center">
              <div className="font-mono text-slate-100 font-bold">{String(v)}</div>
              <div className="text-slate-600 capitalize">{k.replace(/([A-Z])/g, ' $1')}</div>
            </div>
          ))}
        </div>
      )}

      <div className="divide-y divide-border-subtle">
        {sources.map(s => {
          const meta = STATUS_META[s.status]
          const syncTarget = SYNC_TARGETS[s.sourceSystem]
          const lastSuccess = s.lastSuccessAt
            ? new Date(s.lastSuccessAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
            : '—'

          return (
            <div key={s.sourceSystem} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/40 transition-colors">
              <span className={`flex-shrink-0 ${meta.color}`}>{meta.icon}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-200 font-medium">{SOURCE_LABELS[s.sourceSystem] ?? s.sourceSystem}</span>
                  <span className={`text-2xs ${meta.color}`}>{meta.label}</span>
                  {s.isStale && s.status !== 'not_configured' && (
                    <span className="text-2xs text-amber-400">(veraltet nach {s.staleAfterHours}h)</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-2xs text-slate-500">
                  <span>Zuletzt: {lastSuccess}</span>
                  {s.rowCount != null && <span>{s.rowCount.toLocaleString()} Zeilen</span>}
                  {s.consecutiveErrors > 0 && (
                    <span className="text-red-400">{s.consecutiveErrors} Fehler hintereinander</span>
                  )}
                </div>
                {s.lastError && (
                  <div className="text-2xs text-red-400 mt-0.5 truncate max-w-sm" title={s.lastError}>
                    {s.lastError}
                  </div>
                )}
              </div>

              {syncTarget && (
                <button
                  onClick={() => handleSync(syncTarget)}
                  disabled={syncing}
                  className="flex-shrink-0 flex items-center gap-1 text-2xs text-slate-500 hover:text-blue-400 transition-colors px-2 py-1 rounded border border-gray-700/40 hover:border-blue-400/40"
                >
                  <RefreshCw size={10} className={syncing ? 'animate-spin' : ''} />
                  Sync
                </button>
              )}
            </div>
          )
        })}

        {sources.length === 0 && (
          <div className="p-4 text-center text-2xs text-slate-500">
            Keine Quellen — Backend-Migration ausführen: psql $DATABASE_URL -f backend/src/db/migrations/001_market_tables.sql
          </div>
        )}
      </div>
    </Card>
  )
}
