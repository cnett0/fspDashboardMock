import { useState, useMemo } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { DataLoading, DataEmpty } from '../ui/DataState'
import { useApi } from '../../hooks/useApi'
import { getFlexOffers, getMeasured } from '../../api/index'
import type { Asset, FlexOffer, MeasuredPoint } from '../../types/api'

// ── Colour palette ────────────────────────────────────────────────────────────
const PALETTE: Record<string, string> = {
  'dataflex-1-bat': '#38bdf8',
  'dataflex-1-pv':  '#f59e0b',
  'hp-001':         '#a78bfa',
}
const FALLBACK = ['#34d399', '#f87171', '#fb923c', '#4ade80']

function colorFor(id: string, idx: number): string {
  return PALETTE[id] ?? FALLBACK[idx % FALLBACK.length]
}

const MEASURED_COLOR = '#f97316'
const TOTAL_COLOR    = '#22c55e'

const SUB_ASSET_FIELD: Record<string, keyof MeasuredPoint> = {
  'dataflex-1-bat': 'batKw',
  'dataflex-1-pv':  'pvKw',
}

const FIELD_LABEL: Record<string, string> = {
  gridKw: 'Netz-Baseline (gemessen)',
  pvKw:   'PV-Erzeugung (gemessen)',
  batKw:  'Batterie-Baseline (gemessen)',
}

// PV sub-assets where interpolation should be linear (not monotone) to avoid
// visually implying PV generation across sunrise/sunset zero crossings.
const PV_FIELDS = new Set<keyof MeasuredPoint>(['pvKw'])

// ── Date helpers ──────────────────────────────────────────────────────────────
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function formatDayLabel(dateStr: string): string {
  const today = todayUTC()
  const yesterday = addDays(today, -1)
  const tomorrow  = addDays(today, 1)
  if (dateStr === today)     return 'Heute'
  if (dateStr === yesterday) return 'Gestern'
  if (dateStr === tomorrow)  return 'Morgen'
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

// Generate all 96 × 15-min UTC slots for a given day
function daySlots(dateStr: string): string[] {
  const start = new Date(`${dateStr}T00:00:00.000Z`).getTime()
  return Array.from({ length: 96 }, (_, i) =>
    new Date(start + i * 15 * 60_000).toISOString(),
  )
}

function toQuarterBucket(iso: string): string {
  const d = new Date(iso)
  d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 15) * 15, 0, 0)
  return d.toISOString()
}

// "HH:MM" in UTC
function fmtHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

// ── Component ─────────────────────────────────────────────────────────────────
interface FlexBaselineChartProps {
  asset: Asset
}

export function FlexBaselineChart({ asset }: FlexBaselineChartProps) {
  const subIds = asset.flexAssetIds ?? []
  const [view, setView]               = useState<'aggregated' | string>('aggregated')
  const [selectedDate, setSelectedDate] = useState<string>(todayUTC())

  const isToday      = selectedDate === todayUTC()
  const isFutureDay  = selectedDate > todayUTC()
  const isAtTomorrow = selectedDate === addDays(todayUTC(), 1)

  const dayFrom = `${selectedDate}T00:00:00.000Z`
  const dayTo   = `${selectedDate}T23:59:59.999Z`

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: allOffers, loading: offersLoading } = useApi(
    () => getFlexOffers({ from: dayFrom, to: dayTo, limit: 500 }),
    [asset.id, selectedDate],
  )
  const hasShoveler = !!asset.shovelerSiteId
  const { data: measured, loading: measuredLoading } = useApi(
    () => hasShoveler
      ? getMeasured(asset.id, { from: dayFrom, to: dayTo, limit: 200 })
      : Promise.resolve([]),
    [asset.id, selectedDate],
  )
  const loading = offersLoading || measuredLoading

  // Complete 24-hour scaffold — all 96 slots for the selected day
  const slots = useMemo(() => daySlots(selectedDate), [selectedDate])

  // Index measured by 15-min UTC bucket
  const measuredByBucket = useMemo(() => {
    const map: Record<string, MeasuredPoint> = {}
    for (const pt of measured ?? []) {
      map[toQuarterBucket(pt.ts)] = pt
    }
    return map
  }, [measured])

  // Offers grouped by sub-asset, deduped by latest runTs per ts slot
  const offersBySubId = useMemo(() => {
    const map: Record<string, Map<string, FlexOffer>> = {}
    for (const o of allOffers ?? []) {
      if (!subIds.includes(o.assetId)) continue
      if (!map[o.assetId]) map[o.assetId] = new Map()
      const existing = map[o.assetId].get(o.ts)
      if (!existing || o.runTs > existing.runTs) map[o.assetId].set(o.ts, o)
    }
    return map
  }, [allOffers, subIds])

  // ── Aggregated chart data (all 96 slots) ─────────────────────────────────
  const aggData = useMemo(() => slots.map(ts => {
    const bucket = toQuarterBucket(ts)
    const pt = measuredByBucket[bucket]
    const point: Record<string, unknown> = {
      time:     fmtHHMM(ts),
      ts,
      measured: pt?.gridKw ?? null,
      soc:      pt?.soc    ?? null,
    }
    let total = 0
    let hasAnyOffer = false
    for (const sid of subIds) {
      const o = offersBySubId[sid]?.get(ts)
      const val = o?.baselineKw ?? null
      point[sid] = val
      if (val !== null) { total += val; hasAnyOffer = true }
    }
    point.total = hasAnyOffer ? total : null
    return point
  }), [slots, subIds, offersBySubId, measuredByBucket])

  // ── Individual chart data (all 96 slots) ─────────────────────────────────
  const indData = useMemo(() => {
    if (view === 'aggregated') return []
    const field = SUB_ASSET_FIELD[view] ?? 'gridKw'
    return slots.map(ts => {
      const o = offersBySubId[view]?.get(ts)
      const pt = measuredByBucket[toQuarterBucket(ts)]
      return {
        time:     fmtHHMM(ts),
        ts,
        baseline: o?.baselineKw                          ?? null,
        flexHigh: o ? o.baselineKw + o.positiveRdvKw    : null,
        flexLow:  o ? o.baselineKw - o.negativeRdvKw    : null,
        measured: pt ? (pt[field] as number | null)      : null,
        soc:      pt?.soc ?? null,
      }
    })
  }, [view, slots, offersBySubId, measuredByBucket])

  // ── Deviation stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const src = view === 'aggregated' ? aggData : indData
    const paired = src
      .filter(d => {
        const baseline = view === 'aggregated'
          ? (d as Record<string, unknown>).total
          : (d as Record<string, unknown>).baseline
        return d.measured !== null && d.measured !== undefined && baseline !== null && baseline !== undefined
      })
      .map(d => {
        const baseline = (view === 'aggregated'
          ? (d as Record<string, unknown>).total
          : (d as Record<string, unknown>).baseline) as number
        const measuredVal = d.measured as number
        return { baseline, measured: measuredVal, deviation: measuredVal - baseline, ts: d.ts as string }
      })
    if (!paired.length) return null
    const abs = paired.map(p => Math.abs(p.deviation))
    const mae  = abs.reduce((s, v) => s + v, 0) / abs.length
    const bias = paired.reduce((s, p) => s + p.deviation, 0) / paired.length
    const maxDev = Math.max(...abs)
    return { paired, mae, bias, maxDev, count: paired.length }
  }, [view, aggData, indData])

  // ── Y-axis domain ─────────────────────────────────────────────────────────
  const yDomain = useMemo(() => {
    const vals: number[] = []
    if (view === 'aggregated') {
      for (const d of aggData) {
        for (const sid of subIds) {
          const v = (d as Record<string, unknown>)[sid]
          if (v !== null && v !== undefined) vals.push(v as number)
        }
        if (d.total !== null && d.total !== undefined) vals.push(d.total as number)
        if (d.measured !== null && d.measured !== undefined) vals.push(d.measured as number)
      }
    } else {
      for (const d of indData) {
        if (d.baseline !== null) vals.push(d.baseline, d.flexHigh!, d.flexLow!)
        if (d.measured !== null && d.measured !== undefined) vals.push(d.measured)
      }
    }
    if (!vals.length) return ['auto', 'auto'] as [string, string]
    const pad = (Math.max(...vals) - Math.min(...vals)) * 0.1 || 1
    return [Math.min(...vals) - pad, Math.max(...vals) + pad] as [number, number]
  }, [view, aggData, indData, subIds])

  const hasOfferData = (allOffers ?? []).length > 0
  const measuredCount = (measured ?? []).length
  const measuredField = view === 'aggregated' ? 'gridKw' : (SUB_ASSET_FIELD[view] ?? 'gridKw')
  const measuredLabel = FIELD_LABEL[measuredField] ?? 'Gemessen'
  const indColor = view !== 'aggregated' ? colorFor(view, subIds.indexOf(view)) : TOTAL_COLOR
  // Use linear (not monotone) for PV to avoid implying solar generation across night zeros
  const measuredInterp: 'linear' | 'monotone' = PV_FIELDS.has(measuredField as keyof MeasuredPoint) ? 'linear' : 'monotone'

  if (subIds.length === 0) {
    return <DataEmpty label="Keine Flex-Verknüpfung" hint="flex_asset_ids für dieses Asset konfigurieren." />
  }

  return (
    <div className="space-y-3">
      {/* ── Controls ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Sub-asset view selector */}
        <div className="flex items-center gap-0.5 bg-gray-900/80 border border-gray-700/40 rounded-lg p-0.5">
          <SegBtn active={view === 'aggregated'} onClick={() => setView('aggregated')}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TOTAL_COLOR }} />
            Aggregiert
          </SegBtn>
          {subIds.map((sid, i) => (
            <SegBtn key={sid} active={view === sid} onClick={() => setView(sid)}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colorFor(sid, i) }} />
              {sid}
            </SegBtn>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Future-day / measured-source badge */}
          {isFutureDay ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded text-2xs text-violet-400 bg-violet-400/10">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              Tag-Voraus-Prognose
            </div>
          ) : (
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-2xs ${
              hasShoveler ? 'text-green-400 bg-green-400/10' : 'text-slate-400 bg-gray-800/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasShoveler ? 'bg-green-400' : 'bg-slate-600'}`} />
              {hasShoveler ? `${measuredCount} Messpunkte` : 'Kein Telemetrie-Link'}
            </div>
          )}

          {/* Day navigation */}
          <div className="flex items-center gap-0 bg-gray-900/80 border border-gray-700/40 rounded-lg overflow-hidden">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="px-2 py-1.5 text-slate-400 hover:text-slate-100 hover:bg-gray-700/50 transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <span className={`px-3 py-1.5 text-2xs font-medium border-x border-gray-700/40 min-w-[80px] text-center ${
              isFutureDay ? 'text-violet-300' : 'text-slate-200'
            }`}>
              {formatDayLabel(selectedDate)}
            </span>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              disabled={isAtTomorrow}
              className="px-2 py-1.5 text-slate-400 hover:text-slate-100 hover:bg-gray-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {loading && <DataLoading />}

      {!loading && (
        <>
          {/* ── Main chart ── always rendered for the full day ── */}
          <Card>
            <CardHeader
              icon={<Activity size={13} />}
              title={
                view === 'aggregated'
                  ? 'Aggregierte Netz-Baseline vs. Gemessen'
                  : `${measuredField === 'pvKw' ? 'PV-Erzeugung' : measuredField === 'batKw' ? 'Batterie-Baseline' : 'Baseline'} ${view} vs. ${measuredLabel}`
              }
              subtitle={
                `${selectedDate} · 96 × 15 Min · UTC`
                + (hasOfferData ? '' : ' · Keine Flex-Angebote')
              }
            />
            <div className="px-3 pb-3">
              <ResponsiveContainer width="100%" height={260}>
                {view === 'aggregated' ? (
                  <ComposedChart data={aggData} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 9, fill: '#475569' }}
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                      // show a tick every 8 slots = every 2 hours → "00:00", "02:00", ...
                      interval={7}
                    />
                    <YAxis
                      domain={yDomain}
                      tick={{ fontSize: 9, fill: '#475569' }}
                      unit=" kW"
                      width={54}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => Number(v).toFixed(1)}
                    />
                    <ReferenceLine y={0} stroke="#334155" />
                    <Tooltip content={<AggTooltip subIds={subIds} />} />

                    {subIds.map((sid, i) => (
                      <Line key={sid} dataKey={sid} type="stepAfter"
                        stroke={colorFor(sid, i)} strokeWidth={1} strokeDasharray="5 3"
                        dot={false} name={sid} connectNulls={false} />
                    ))}
                    <Line dataKey="total" type="stepAfter"
                      stroke={TOTAL_COLOR} strokeWidth={2} dot={false}
                      name="Gesamt-Baseline" connectNulls={false} />
                    <Line dataKey="measured" type="linear"
                      stroke={MEASURED_COLOR} strokeWidth={1.5}
                      dot={false} activeDot={{ r: 4 }}
                      connectNulls={false} name="Netz-Baseline (gemessen)" />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={indData} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 9, fill: '#475569' }}
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                      interval={7}
                    />
                    <YAxis
                      domain={yDomain}
                      tick={{ fontSize: 9, fill: '#475569' }}
                      unit=" kW"
                      width={54}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => Number(v).toFixed(1)}
                    />
                    <ReferenceLine y={0} stroke="#334155" />
                    <Tooltip content={<IndTooltip color={indColor} measuredLabel={measuredLabel} isPv={measuredField === 'pvKw'} />} />

                    <Area dataKey="flexHigh" type="stepAfter" fill={indColor} fillOpacity={0}   stroke="none" legendType="none" />
                    <Area dataKey="flexLow"  type="stepAfter" fill={indColor} fillOpacity={0.12} stroke="none" legendType="none" />
                    <Line dataKey="baseline" type="stepAfter"
                      stroke={indColor} strokeWidth={2} dot={false}
                      name={`Baseline (${view})`} connectNulls={false} />
                    <Line dataKey="measured" type={measuredInterp}
                      stroke={MEASURED_COLOR} strokeWidth={1.5}
                      dot={false} activeDot={{ r: 4 }}
                      connectNulls={false} name={measuredLabel} />
                  </ComposedChart>
                )}
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 px-1">
                {view === 'aggregated' && subIds.map((sid, i) => (
                  <LegendItem key={sid} color={colorFor(sid, i)} label={sid} dashed />
                ))}
                {view === 'aggregated'
                  ? <LegendItem color={TOTAL_COLOR} label="Gesamt-Baseline" />
                  : <LegendItem color={indColor} label={`Batterie-Baseline (${view})`} />
                }
                {view !== 'aggregated' && <LegendItem color={indColor} label="Flexibilitätsband" filled />}
                <LegendItem color={MEASURED_COLOR} label={measuredLabel} line />
              </div>
            </div>
          </Card>

          {/* ── Deviation stats ── */}
          {stats ? (
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                label="Ø Abweichung (MAE)"
                value={`${stats.mae.toFixed(2)} kW`}
                sub={`${stats.count} Vergleichspunkte`}
                color={stats.mae < 0.5 ? 'text-green-400' : stats.mae < 2 ? 'text-amber-400' : 'text-red-400'}
              />
              <StatCard
                label="Bias"
                value={`${stats.bias >= 0 ? '+' : ''}${stats.bias.toFixed(2)} kW`}
                sub={stats.bias > 0 ? 'Messung > Baseline' : 'Messung < Baseline'}
                color={Math.abs(stats.bias) < 0.5 ? 'text-green-400' : 'text-amber-400'}
              />
              <StatCard
                label="Max. Abweichung"
                value={`${stats.maxDev.toFixed(2)} kW`}
                sub="Größte Einzelabweichung"
                color={stats.maxDev < 1 ? 'text-green-400' : stats.maxDev < 3 ? 'text-amber-400' : 'text-red-400'}
              />
            </div>
          ) : (
            <div className="panel p-3 text-center text-2xs text-slate-600">
              {hasShoveler && hasOfferData
                ? 'Keine überlappenden Zeitschritte zwischen Flex-Angeboten und Messwerten.'
                : !hasOfferData
                ? 'Keine Flex-Angebote für diesen Tag.'
                : 'Kein Telemetrie-Link konfiguriert — shoveler_site_id für dieses Asset setzen.'
              }
            </div>
          )}

          {/* ── Comparison table ── */}
          {stats && stats.paired.length > 0 && (
            <Card>
              <CardHeader
                title="Messpunkte im Detail"
                subtitle={`${stats.paired.length} Vergleichspunkte · ${selectedDate}`}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-2xs">
                  <thead>
                    <tr className="border-b border-gray-700/40">
                      <Th>Zeit (UTC)</Th>
                      <Th right>Baseline</Th>
                      <Th right>Gemessen</Th>
                      <Th right>Δ Abweichung</Th>
                      <Th right>|Δ| / Baseline</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.paired.map(row => {
                      const relErr = Math.abs(row.baseline) > 0.01
                        ? Math.abs(row.deviation / row.baseline) * 100
                        : null
                      const isPositive = row.deviation >= 0
                      return (
                        <tr key={row.ts} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                          <Td mono>{fmtHHMM(row.ts)}</Td>
                          <Td right mono className="text-slate-300">{row.baseline.toFixed(2)} kW</Td>
                          <Td right mono className="text-orange-400">{row.measured.toFixed(2)} kW</Td>
                          <Td right mono className={isPositive ? 'text-green-400' : 'text-blue-400'}>
                            {isPositive ? '+' : ''}{row.deviation.toFixed(2)} kW
                          </Td>
                          <Td right mono className="text-slate-500">
                            {relErr !== null ? `${relErr.toFixed(1)} %` : '—'}
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ── Tooltips ──────────────────────────────────────────────────────────────────

function AggTooltip({ active, payload, label, subIds }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 shadow-xl text-2xs space-y-1 min-w-[200px]">
      <div className="font-mono text-slate-400 mb-1.5">{label} UTC</div>
      {subIds?.map((sid: string, i: number) => {
        const v = d?.[sid]
        if (v === null || v === undefined) return null
        return <TooltipRow key={sid} color={colorFor(sid, i)} label={sid} value={`${Number(v).toFixed(2)} kW`} />
      })}
      <div className="border-t border-gray-700/40 pt-1 mt-1">
        <TooltipRow color={TOTAL_COLOR} label="Gesamt-Baseline"
          value={d?.total !== null && d?.total !== undefined ? `${Number(d.total).toFixed(2)} kW` : '—'} bold />
      </div>
      {d?.measured !== null && d?.measured !== undefined && (
        <TooltipRow color={MEASURED_COLOR} label="Netz-Baseline (gemessen)" value={`${Number(d.measured).toFixed(2)} kW`} />
      )}
      {d?.soc !== null && d?.soc !== undefined && (
        <TooltipRow color="#94a3b8" label="SoC" value={`${Number(d.soc).toFixed(0)} %`} dim />
      )}
    </div>
  )
}

function IndTooltip({ active, payload, label, color, measuredLabel, isPv }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 shadow-xl text-2xs space-y-1 min-w-[180px]">
      <div className="font-mono text-slate-400 mb-1.5">{label} UTC</div>
      {d?.baseline !== null && d?.baseline !== undefined && (
        <TooltipRow color={color} label="Batterie-Baseline" value={`${Number(d.baseline).toFixed(2)} kW`} />
      )}
      {d?.flexHigh !== null && d?.flexLow !== null && d?.flexHigh !== undefined && (
        <TooltipRow color={color} label="Flexibilitätsband"
          value={`[${Number(d.flexLow).toFixed(1)}, ${Number(d.flexHigh).toFixed(1)}] kW`} dim />
      )}
      {d?.measured !== null && d?.measured !== undefined && (
        <TooltipRow color={MEASURED_COLOR} label={measuredLabel ?? 'Gemessen'} value={`${Number(d.measured).toFixed(2)} kW`} />
      )}
      {isPv && (
        <div className="text-slate-600 pt-0.5 border-t border-gray-700/30 leading-tight">
          PV-Prognose physikalisch auf 0 außerhalb der Tageslichtstunden (Standort-Geolokation).
        </div>
      )}
      {d?.soc !== null && d?.soc !== undefined && (
        <TooltipRow color="#94a3b8" label="SoC" value={`${Number(d.soc).toFixed(0)} %`} dim />
      )}
    </div>
  )
}

function TooltipRow({ color, label, value, bold, dim }: {
  color: string; label: string; value: string; bold?: boolean; dim?: boolean
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className={`flex items-center gap-1.5 ${dim ? 'text-slate-600' : 'text-slate-400'}`}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        {label}
      </span>
      <span className={`font-mono ${bold ? 'text-slate-100 font-semibold' : 'text-slate-300'}`}>{value}</span>
    </div>
  )
}

// ── Primitives ────────────────────────────────────────────────────────────────

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-2xs font-medium transition-colors ${
        active ? 'bg-gray-600/80 text-white' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function LegendItem({ color, label, dashed, filled, line }: {
  color: string; label: string; dashed?: boolean; filled?: boolean; line?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      {filled
        ? <span className="w-3 h-2.5 rounded-sm" style={{ background: color, opacity: 0.35 }} />
        : <span className={`w-3 h-0 border-t-2 ${dashed ? 'border-dashed' : ''}`} style={{ borderColor: color }} />
      }
      <span className="text-2xs text-slate-500">{label}</span>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="panel p-2.5">
      <div className="text-2xs text-slate-600 mb-1">{label}</div>
      <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
      <div className="text-2xs text-slate-600 mt-0.5">{sub}</div>
    </div>
  )
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-3 py-2 text-slate-500 font-semibold uppercase tracking-wide ${right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  )
}

function Td({ children, right, mono, className = '' }: {
  children: React.ReactNode; right?: boolean; mono?: boolean; className?: string
}) {
  return (
    <td className={`px-3 py-1.5 ${right ? 'text-right' : ''} ${mono ? 'font-mono' : ''} ${className}`}>
      {children}
    </td>
  )
}
