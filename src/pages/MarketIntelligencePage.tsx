/**
 * Market Intelligence page — ALL data from backend real data sources.
 * No mock data. Empty state / stale / error shown when data unavailable.
 */
import { useState } from 'react'
import { Tabs } from '../components/ui/Tabs'
import { Card, CardHeader } from '../components/ui/Card'
import { MarketTicker } from '../components/market/MarketTicker'
import { DataLoading, DataError, DataEmpty, SourceBadge, DataPanel } from '../components/ui/DataState'
import { useApi, useApiMutation } from '../hooks/useApi'
import { useRefresh } from '../context/RefreshContext'
import {
  getSpotPrices, getWindForecast, getSolarForecast, getDailySpreads, getNegativeHoursByYear,
  getFcrResults, getAfrrResults, getRebapPrices,
  getVariableGridFees, getLoadDependentGridFees,
  getPvSelfConsumption, triggerSync,
} from '../api/market'
import { fmtEurMWh, fmtMW, fmtDate } from '../lib/format'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
  ReferenceLine,
} from 'recharts'
import { RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { MarketOpportunityPanel } from '../components/fsp/MarketOpportunityPanel'

const TABS = [
  { id: 'opportunity', label: 'FSP Opportunity' },
  { id: 'spot', label: 'Spot Market' },
  { id: 'reserve', label: 'Reserve' },
  { id: 'rebap', label: 'Balancing Energy' },
  { id: 'variable', label: 'Variable Grid Fees' },
  { id: 'loadbased', label: 'Load-based Fees' },
  { id: 'solar', label: 'PV Self-Consumption' },
]

export function MarketIntelligencePage() {
  const [tab, setTab] = useState('opportunity')
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MarketTicker />
      <div className="px-4 pt-3">
        <Tabs tabs={TABS} activeTab={tab} onChange={setTab} />
      </div>
      <div className="flex-1 overflow-auto p-4">
        {tab === 'opportunity' && (
          <div className="space-y-4">
            <MarketOpportunityPanel />
            <SpotTab />
          </div>
        )}
        {tab === 'spot'      && <SpotTab />}
        {tab === 'reserve'   && <ReserveTab />}
        {tab === 'rebap'     && <RebapTab />}
        {tab === 'variable'  && <VariableNetTab />}
        {tab === 'loadbased' && <LoadBasedTab />}
        {tab === 'solar'     && <SolarTab />}
      </div>
    </div>
  )
}

const tt = { contentStyle: { background: '#1e2433', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }, labelStyle: { color: '#94a3b8' } }

// ── Sync trigger button ───────────────────────────────────────────────────────
function SyncButton({ target, onDone }: { target: Parameters<typeof triggerSync>[0]; onDone: () => void }) {
  const { mutate, loading } = useApiMutation((t: Parameters<typeof triggerSync>[0]) => triggerSync(t))
  const { success, error } = useToast()
  const handle = async () => {
    const r = await mutate(target)
    if (r?.ok) { success('Sync erfolgreich gestartet'); onDone() }
    else error('Sync fehlgeschlagen')
  }
  return (
    <Button variant="ghost" onClick={handle} disabled={loading} className="h-6 px-2 text-2xs gap-1">
      <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
      {loading ? 'Syncing…' : 'Sync'}
    </Button>
  )
}

// ── Spot tab ──────────────────────────────────────────────────────────────────
function SpotTab() {
  const { marketRefreshKey } = useRefresh()
  const { data: spotResp, loading, error, refetch } = useApi(() => getSpotPrices({ limit: 168 }), [marketRefreshKey])
  const { data: windResp } = useApi(() => getWindForecast({ limit: 48 }), [marketRefreshKey])
  const { data: solarResp } = useApi(() => getSolarForecast({ limit: 48 }), [marketRefreshKey])
  const { data: spreadsResp } = useApi(() => getDailySpreads(30), [marketRefreshKey])
  const { data: negHoursResp } = useApi(() => getNegativeHoursByYear(), [marketRefreshKey])

  const spotData  = spotResp?.data  ?? []
  const windData  = windResp?.data  ?? []
  const solarData = solarResp?.data ?? []

  // Merge spot + wind + solar by hourUtc for combined chart
  const combined = spotData.map(s => {
    const w = windData.find(w => w.hourUtc === s.hourUtc)
    const sol = solarData.find(sl => sl.hourUtc === s.hourUtc)
    const label = new Date(s.hourUtc).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    return {
      label,
      price: s.priceEurMwh,
      wind: w ? Math.round(w.forecastMw / 1000) : undefined,  // → GW
      solar: sol ? Math.round(sol.forecastMw / 1000) : undefined,
    }
  })

  const freshness = spotResp?.meta?.freshness

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <span>Day-Ahead Spotpreise DE/LU — ENTSO-E</span>
            <SyncButton target="spot" onDone={refetch} />
          </div>
        </CardHeader>
        <DataPanel loading={loading} error={error} empty={!loading && spotData.length === 0}
          freshness={freshness}
          emptyHint="ENTSOE_SECURITY_TOKEN muss in .env konfiguriert sein">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={combined}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} interval={11} />
              <YAxis yAxisId="price" tick={{ fontSize: 9, fill: '#64748b' }} unit=" €" />
              <YAxis yAxisId="gen" orientation="right" tick={{ fontSize: 9, fill: '#64748b' }} unit=" GW" />
              <Tooltip {...tt} formatter={(v: number, name: string) => {
                if (name === 'price') return [`${v.toFixed(2)} €/MWh`, 'Spotpreis']
                if (name === 'wind') return [`${v} GW`, 'Wind-Prognose']
                return [`${v} GW`, 'Solar-Prognose']
              }} />
              <ReferenceLine yAxisId="price" y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />
              <Area yAxisId="price" type="monotone" dataKey="price" stroke="#3b82f6" fill="#3b82f620" strokeWidth={1.5} dot={false} name="price" />
              <Area yAxisId="gen" type="monotone" dataKey="wind" stroke="#22c55e" fill="#22c55e10" strokeWidth={1} dot={false} name="wind" />
              <Area yAxisId="gen" type="monotone" dataKey="solar" stroke="#f59e0b" fill="#f59e0b10" strokeWidth={1} dot={false} name="solar" />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </DataPanel>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Tägliche Spreads (30 Tage)" />
          <DataPanel loading={!spreadsResp} empty={(spreadsResp?.data ?? []).length === 0} freshness={freshness}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={(spreadsResp?.data ?? []).map(s => ({ label: fmtDate(s.dateUtc), spread: s.spreadEurMwh }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} interval={4} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} unit=" €" />
                <Tooltip {...tt} formatter={(v: number) => [`${v.toFixed(2)} €/MWh`, 'Spread']} />
                <Bar dataKey="spread" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </DataPanel>
        </Card>

        <Card>
          <CardHeader title="Negative Preise nach Jahr" />
          <DataPanel loading={!negHoursResp} empty={(negHoursResp?.data ?? []).length === 0} freshness={freshness}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={negHoursResp?.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} unit=" h" />
                <Tooltip {...tt} formatter={(v: number) => [`${v} h`, 'Negative Stunden']} />
                <Bar dataKey="negativeHours" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </DataPanel>
        </Card>
      </div>
    </div>
  )
}

// ── Reserve tab ───────────────────────────────────────────────────────────────
function ReserveTab() {
  const { marketRefreshKey } = useRefresh()
  const { data: fcrResp, loading: fcrLoading, refetch } = useApi(() => getFcrResults(52), [marketRefreshKey])
  const { data: afrrResp, loading: afrrLoading } = useApi(() => getAfrrResults(52), [marketRefreshKey])

  const fcrData  = fcrResp?.data  ?? []
  const afrrData = afrrResp?.data ?? []

  const fcrChartData = fcrData.map(r => ({
    label: new Date(r.periodStart).toLocaleDateString('de-DE', { month: '2-digit', day: '2-digit' }),
    cap: r.capacityPriceEurMw,
    awarded: r.awardedMw,
  }))

  const afrrChartData = afrrData.filter(r => r.direction === 'up').map(r => ({
    label: new Date(r.periodStart).toLocaleDateString('de-DE', { month: '2-digit', day: '2-digit' }),
    cap: r.capacityPriceEurMw,
    energy: r.energyPriceEurMwh,
  }))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <span>FCR Tenderpreise — regelleistung.net</span>
            <SyncButton target="reserve" onDone={refetch} />
          </div>
        </CardHeader>
        <DataPanel
          loading={fcrLoading} error={null}
          empty={!fcrLoading && fcrData.length === 0}
          freshness={fcrResp?.meta.freshness}
          emptyHint="regelleistung.net Sync erforderlich. Ggf. REGELLEISTUNG_COOKIE setzen."
        >
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={fcrChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis yAxisId="cap" tick={{ fontSize: 9, fill: '#64748b' }} unit=" €" />
              <YAxis yAxisId="mw" orientation="right" tick={{ fontSize: 9, fill: '#64748b' }} unit=" MW" />
              <Tooltip {...tt} formatter={(v: number, name: string) => {
                if (name === 'cap') return [`${v?.toFixed(2)} €/MW`, 'Leistungspreis']
                return [`${v?.toFixed(1)} MW`, 'Bezuschlagt']
              }} />
              <Bar yAxisId="cap" dataKey="cap" fill="#22c55e" radius={[2, 2, 0, 0]} name="cap" />
              <Line yAxisId="mw" type="monotone" dataKey="awarded" stroke="#94a3b8" strokeWidth={1} dot={false} name="awarded" />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </DataPanel>
      </Card>

      <Card>
        <CardHeader title="aFRR Tenderpreise (Aufwärts) — regelleistung.net" />
        <DataPanel
          loading={afrrLoading} error={null}
          empty={!afrrLoading && afrrData.length === 0}
          freshness={afrrResp?.meta.freshness}
          emptyHint="Kein aFRR-Daten. REGELLEISTUNG_COOKIE prüfen."
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={afrrChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} unit=" €" />
              <Tooltip {...tt} formatter={(v: number) => [`${v?.toFixed(2)} €/MW`, 'Leistungspreis']} />
              <Bar dataKey="cap" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DataPanel>
      </Card>
    </div>
  )
}

// ── reBAP tab ─────────────────────────────────────────────────────────────────
function RebapTab() {
  const { marketRefreshKey } = useRefresh()
  const { data: rebapResp, loading, refetch } = useApi(() => getRebapPrices({ limit: 2880 }), [marketRefreshKey])
  const rebapData = rebapResp?.data ?? []

  // Downsample to daily averages for chart
  const byDay = new Map<string, number[]>()
  for (const r of rebapData) {
    const day = r.quarterUtc.slice(0, 10)
    const bucket = byDay.get(day) ?? []
    bucket.push(r.rebapEurMwh)
    byDay.set(day, bucket)
  }
  const chartData = Array.from(byDay.entries()).map(([day, vals]) => ({
    label: fmtDate(day),
    avg: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
    min: Math.min(...vals),
    max: Math.max(...vals),
  }))

  // Annual stats
  const byYear = new Map<number, number[]>()
  for (const r of rebapData) {
    const y = new Date(r.quarterUtc).getFullYear()
    const bucket = byYear.get(y) ?? []
    bucket.push(Math.abs(r.rebapEurMwh))
    byYear.set(y, bucket)
  }
  const annualData = Array.from(byYear.entries()).map(([y, vals]) => ({
    year: y,
    avgAbs: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
  })).sort((a, b) => a.year - b.year)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <span>Ausgleichsenergiepreis (reBAP) — netztransparenz.de</span>
            <SyncButton target="rebap" onDone={refetch} />
          </div>
        </CardHeader>
        <DataPanel loading={loading} empty={!loading && rebapData.length === 0}
          freshness={rebapResp?.meta.freshness}
          emptyHint="netztransparenz.de Sync erforderlich. NETZTRANSPARENZ_COOKIE prüfen.">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} interval={4} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} unit=" €" />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />
              <Tooltip {...tt} formatter={(v: number, name: string) => {
                const labels: Record<string, string> = { avg: 'Ø reBAP', min: 'Min', max: 'Max' }
                return [`${v} €/MWh`, labels[name] ?? name]
              }} />
              <Area type="monotone" dataKey="avg" stroke="#a855f7" fill="#a855f720" strokeWidth={1.5} dot={false} name="avg" />
              <Line type="monotone" dataKey="min" stroke="#3b82f6" strokeWidth={1} dot={false} name="min" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1} dot={false} name="max" strokeDasharray="3 3" />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </DataPanel>
      </Card>

      {annualData.length > 0 && (
        <Card>
          <CardHeader title="Jahres-Ø |reBAP| nach Jahr" />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={annualData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} unit=" €" />
              <Tooltip {...tt} formatter={(v: number) => [`${v} €/MWh`, 'Ø |reBAP|']} />
              <Bar dataKey="avgAbs" fill="#a855f7" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}

// ── Variable Netzentgelte tab ─────────────────────────────────────────────────
function VariableNetTab() {
  const { marketRefreshKey } = useRefresh()
  const { data: resp, loading, refetch } = useApi(() => getVariableGridFees(), [marketRefreshKey])
  const rows = resp?.data ?? []

  // Group by tariff level for chart
  const levels = ['low', 'standard', 'high'] as const
  const levelColors = { low: '#22c55e', standard: '#f59e0b', high: '#ef4444' }
  const levelLabels = { low: 'Niedrig', standard: 'Standard', high: 'Hoch' }

  // Compute average price per level (latest snapshots)
  const avgByLevel = levels.map(l => ({
    level: levelLabels[l],
    price: rows.filter(r => r.tariffLevel === l).reduce((sum, r, _, arr) => sum + r.priceEurMwh / arr.length, 0) || null,
  })).filter(l => l.price !== null && l.price > 0)

  // Per-operator latest snapshot
  const byOp = new Map<string, typeof rows[0][]>()
  for (const r of rows) byOp.set(r.operatorId ?? r.operatorName, [...(byOp.get(r.operatorId ?? r.operatorName) ?? []), r])
  const opData = Array.from(byOp.entries()).map(([op, snaps]) => ({
    op: snaps[0].operatorName ?? op,
    low: snaps.find(s => s.tariffLevel === 'low')?.priceEurMwh ?? 0,
    standard: snaps.find(s => s.tariffLevel === 'standard')?.priceEurMwh ?? 0,
    high: snaps.find(s => s.tariffLevel === 'high')?.priceEurMwh ?? 0,
  })).filter(d => d.low || d.standard || d.high)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <span>Variable Netzentgelte — variable-netzentgelte.de</span>
            <SyncButton target="grid-fees" onDone={refetch} />
          </div>
        </CardHeader>
        <DataPanel loading={loading} empty={!loading && rows.length === 0}
          freshness={resp?.meta.freshness}
          emptyHint="variable-netzentgelte.de Sync nötig. VARIABLE_NETZENTGELTE_COOKIE oder API-URL prüfen.">
          <div className="p-3 space-y-3">
            {avgByLevel.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {avgByLevel.map(l => (
                  <div key={l.level} className="text-center p-3 bg-gray-800/50 rounded border border-gray-700/40">
                    <div className="text-2xs text-slate-500 mb-1">{l.level}</div>
                    <div className="text-base font-mono font-bold text-slate-100">{l.price!.toFixed(2)}</div>
                    <div className="text-2xs text-slate-500">EUR/MWh Ø</div>
                  </div>
                ))}
              </div>
            )}
            {opData.length > 0 && (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={opData.slice(0, 12)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} unit=" €" />
                  <YAxis type="category" dataKey="op" tick={{ fontSize: 8, fill: '#64748b' }} width={90} />
                  <Tooltip {...tt} formatter={(v: number, name: string) => [`${v.toFixed(2)} €/MWh`, levelLabels[name as keyof typeof levelLabels] ?? name]} />
                  {levels.map(l => (
                    <Bar key={l} dataKey={l} fill={levelColors[l]} stackId="a" />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </DataPanel>
      </Card>
    </div>
  )
}

// ── Load-dependent tab ────────────────────────────────────────────────────────
function LoadBasedTab() {
  const { marketRefreshKey } = useRefresh()
  const { data: resp, loading, refetch } = useApi(() => getLoadDependentGridFees(), [marketRefreshKey])
  const rows = resp?.data ?? []

  const regionColors: Record<string, string> = {
    North: '#0ea5e9', South: '#4ade80', West: '#f59e0b', East: '#a855f7',
  }

  const chartData = rows
    .filter(r => r.priceEurKwYear != null)
    .map(r => ({
      op: r.operatorName.split(' ').slice(0, 2).join(' '),
      priceEurKwYear: Number(r.priceEurKwYear?.toFixed(2) ?? 0),
      region: r.region,
      fill: regionColors[r.region] ?? '#64748b',
    }))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <span>Lastabh. Netzentgelte — RLM Jahresleistungspreissystem NS ≥2.500 h/a</span>
            <SyncButton target="grid-fees" onDone={refetch} />
          </div>
        </CardHeader>
        <DataPanel loading={loading} empty={!loading && rows.length === 0}
          freshness={resp?.meta.freshness}
          emptyHint="DSO-Preisblatt-Sync erforderlich. Quellen in operator_price_sheet_sources.">
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} unit=" €/kW/a" />
                <YAxis type="category" dataKey="op" tick={{ fontSize: 9, fill: '#64748b' }} width={110} />
                <Tooltip {...tt} formatter={(v: number) => [`${v} €/kW/a`, 'Leistungspreis']} />
                <Bar dataKey="priceEurKwYear" radius={[0, 2, 2, 0]}
                  label={{ position: 'right', style: { fontSize: 9, fill: '#94a3b8' } }}>
                  {chartData.map((d, i) => (
                    <rect key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {rows.length > 0 && (
            <div className="overflow-auto max-h-48 mt-2">
              <table className="w-full text-2xs">
                <thead className="bg-gray-800/70 sticky top-0">
                  <tr>
                    {['Betreiber', 'Region', 'ÜNB', 'VNB-Op.', 'Plan.Reg.', 'EUR/kW/a', 'EUR/MWh', 'Quelle'].map(h => (
                      <th key={h} className="px-2 py-1 text-left text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-gray-700/40 hover:bg-gray-700/30">
                      <td className="px-2 py-1 text-slate-300 max-w-[140px] truncate">{r.operatorName}</td>
                      <td className="px-2 py-1" style={{ color: regionColors[r.region] ?? '#94a3b8' }}>{r.region}</td>
                      <td className="px-2 py-1 text-blue-400">{r.uenbRegion ?? '—'}</td>
                      <td className="px-2 py-1 text-amber-400">{r.vnbOperator ?? '—'}</td>
                      <td className="px-2 py-1 text-purple-400">{r.vnbPlanningRegion ?? '—'}</td>
                      <td className="px-2 py-1 font-mono text-green-400">{r.priceEurKwYear != null ? r.priceEurKwYear.toFixed(2) : '—'}</td>
                      <td className="px-2 py-1 font-mono text-slate-300">{r.priceEurMwh != null ? r.priceEurMwh.toFixed(2) : '—'}</td>
                      <td className="px-2 py-1 text-slate-500 text-2xs">{r.extractionMethod ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataPanel>
      </Card>
    </div>
  )
}

// ── PV Eigenverbrauch tab ─────────────────────────────────────────────────────
function SolarTab() {
  const { marketRefreshKey } = useRefresh()
  const { data: resp, loading, refetch } = useApi(() => getPvSelfConsumption(), [marketRefreshKey])
  const rows = resp?.data ?? []

  const chartData = rows.filter(r => r.householdGrossEurKwh != null || r.eegTariffEurKwh != null).map(r => ({
    year: r.year,
    household: r.householdWorkEurKwh ? Number((r.householdWorkEurKwh * 100).toFixed(2)) : null,  // ct/kWh
    eeg: r.eegTariffEurKwh ? Number((r.eegTariffEurKwh * 100).toFixed(2)) : null,
    solar: r.solarMarketValueEurKwh ? Number((r.solarMarketValueEurKwh * 100).toFixed(2)) : null,
  }))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <span>PV-Eigenverbrauch — BNetzA · BDEW · Marktwerte</span>
            <SyncButton target="pv" onDone={refetch} />
          </div>
        </CardHeader>
        <DataPanel loading={loading} empty={!loading && rows.length === 0}
          freshness={resp?.meta.freshness}
          emptyHint="PV-Sync erforderlich. EEG: BNetzA, Haushalt: BDEW, Solarmarktwert: SOLAR_MARKTWERTE_SOURCE_URL">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} unit=" ct" label={{ value: 'ct/kWh', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: '#64748b' } }} />
              <Tooltip {...tt} formatter={(v: number, name: string) => {
                const labels: Record<string, string> = { household: 'Haushaltspreis (Netto)', eeg: 'EEG-Vergütung', solar: 'Solar-Marktwert' }
                return [`${v?.toFixed(2)} ct/kWh`, labels[name] ?? name]
              }} />
              <Bar dataKey="household" fill="#ef4444" opacity={0.8} name="household" />
              <Line type="monotone" dataKey="eeg" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="eeg" />
              <Line type="monotone" dataKey="solar" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="solar" strokeDasharray="4 4" />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </DataPanel>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader title="Datenprovenienz" />
          <div className="overflow-auto max-h-48">
            <table className="w-full text-2xs">
              <thead className="bg-gray-800/70 sticky top-0">
                <tr>
                  {['Jahr', 'EEG ct/kWh', 'EEG-Klasse', 'HH-Brutto ct', 'HH-Arbeit ct', 'Solarmarktwert ct', 'Quellen'].map(h => (
                    <th key={h} className="px-2 py-1 text-left text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-gray-700/40 hover:bg-gray-700/30">
                    <td className="px-2 py-1 font-mono text-slate-300">{r.year}</td>
                    <td className="px-2 py-1 font-mono text-amber-400">{r.eegTariffEurKwh != null ? (r.eegTariffEurKwh * 100).toFixed(2) : '—'}</td>
                    <td className="px-2 py-1 text-slate-500">{r.eegSystemClass ?? '—'}</td>
                    <td className="px-2 py-1 font-mono text-red-400">{r.householdGrossEurKwh != null ? (r.householdGrossEurKwh * 100).toFixed(2) : '—'}</td>
                    <td className="px-2 py-1 font-mono text-slate-300">{r.householdWorkEurKwh != null ? (r.householdWorkEurKwh * 100).toFixed(2) : '—'}</td>
                    <td className="px-2 py-1 font-mono text-green-400">{r.solarMarketValueEurKwh != null ? (r.solarMarketValueEurKwh * 100).toFixed(2) : '—'}</td>
                    <td className="px-2 py-1 text-slate-600 text-2xs truncate max-w-[100px]">
                      {[r.eegSourceUrl, r.householdSourceUrl, r.solarMarketValueSource].filter(Boolean).length} Quellen
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

