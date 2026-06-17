import { useState, useMemo } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { Tabs } from '../ui/Tabs'
import { DataLoading, DataEmpty } from '../ui/DataState'
import { useApi } from '../../hooks/useApi'
import { getFlexOffers, getMeasured, getAssetFlexband } from '../../api/index'
import type { FlexbandPoint } from '../../api/envelio'
import type { Asset, FlexOffer, MeasuredPoint } from '../../types/api'
import { fmtTime, fmtPower } from '../../lib/format'

interface FlexOfferPanelProps {
  asset: Asset
}

type ChartPoint = {
  time: string
  tsKey: string
  flexBand: [number, number] | null
  envelioband: [number, number] | null
  baseline: number | null
  pMax: number | null
  pMin: number | null
  measured: number | null
  confidence: number | null
  riskScore: number | null
}

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

// All 96 × 15-min UTC slots for the given day
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

function fmtHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

// Which MeasuredPoint field maps to each sub-asset
const SUB_ASSET_FIELD: Record<string, keyof MeasuredPoint> = {
  'dataflex-1-bat': 'batKw',
  'dataflex-1-pv':  'pvKw',
}

// ── Component ─────────────────────────────────────────────────────────────────
export function FlexOfferPanel({ asset }: FlexOfferPanelProps) {
  const subIds = asset.flexAssetIds ?? []
  const tabs = [
    { id: '_total', label: 'Gesamt' },
    ...subIds.map(id => ({ id, label: id })),
  ]
  const [activeTab, setActiveTab]       = useState('_total')
  const [selectedDate, setSelectedDate] = useState<string>(todayUTC())

  const isToday      = selectedDate === todayUTC()
  const isFutureDay  = selectedDate > todayUTC()
  const isAtTomorrow = selectedDate === addDays(todayUTC(), 1)
  const dayFrom  = `${selectedDate}T00:00:00.000Z`
  const dayTo    = `${selectedDate}T23:59:59.999Z`

  // Complete 24-hour scaffold for the selected day
  const slots = useMemo(() => daySlots(selectedDate), [selectedDate])

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
  const hasMelo = !!asset.melo
  const { data: envelioRaw, loading: envelioLoading } = useApi(
    () => getAssetFlexband(asset.id, { from: dayFrom, to: dayTo, limit: 500 }),
    [asset.id, selectedDate],
  )
  const loading = offersLoading || measuredLoading || envelioLoading

  // Index measured by 15-min bucket
  const measuredByBucket = useMemo(() => {
    const map: Record<string, MeasuredPoint> = {}
    for (const pt of measured ?? []) {
      map[toQuarterBucket(pt.ts)] = pt
    }
    return map
  }, [measured])

  // Index Envelio flex band by 15-min bucket
  const envelioByBucket = useMemo(() => {
    const map: Record<string, FlexbandPoint> = {}
    for (const pt of envelioRaw ?? []) {
      map[toQuarterBucket(pt.ts)] = pt
    }
    return map
  }, [envelioRaw])

  // Group flex offers by sub-asset, deduped by latest runTs per ts slot
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

  // ── Chart data — all 96 slots ────────────────────────────────────────────
  const chartData = useMemo((): ChartPoint[] => {
    if (activeTab === '_total') {
      return slots.map(ts => {
        let baseline = 0, posRdv = 0, negRdv = 0, pMax = 0, pMin = 0
        let hasAny = false
        for (const sid of subIds) {
          const o = offersBySubId[sid]?.get(ts)
          if (o) {
            baseline += o.baselineKw
            posRdv   += o.positiveRdvKw
            negRdv   += o.negativeRdvKw
            pMax     += o.pMaxKw
            pMin     += o.pMinKw
            hasAny    = true
          }
        }
        const pt = measuredByBucket[toQuarterBucket(ts)]
        const eb = envelioByBucket[toQuarterBucket(ts)]
        return {
          time:        fmtHHMM(ts),
          tsKey:       ts,
          flexBand:    hasAny ? [baseline - negRdv, baseline + posRdv] as [number, number] : null,
          envelioband: eb ? [eb.powerMinKw, eb.powerMaxKw] as [number, number] : null,
          baseline:    hasAny ? baseline : null,
          pMax:        hasAny ? pMax : null,
          pMin:        hasAny ? pMin : null,
          measured:    pt?.gridKw ?? null,
          confidence:  null,
          riskScore:   null,
        }
      })
    }

    const field = SUB_ASSET_FIELD[activeTab] ?? 'gridKw'
    return slots.map(ts => {
      const o  = offersBySubId[activeTab]?.get(ts)
      const pt = measuredByBucket[toQuarterBucket(ts)]
      const eb = envelioByBucket[toQuarterBucket(ts)]
      return {
        time:        fmtHHMM(ts),
        tsKey:       ts,
        flexBand:    o ? [o.baselineKw - o.negativeRdvKw, o.baselineKw + o.positiveRdvKw] as [number, number] : null,
        envelioband: eb ? [eb.powerMinKw, eb.powerMaxKw] as [number, number] : null,
        baseline:    o?.baselineKw  ?? null,
        pMax:        o?.pMaxKw      ?? null,
        pMin:        o?.pMinKw      ?? null,
        measured:    pt ? (pt[field] as number | null) : null,
        confidence:  o?.confidence ?? null,
        riskScore:   o?.riskScore  ?? null,
      }
    })
  }, [activeTab, slots, subIds, offersBySubId, measuredByBucket, envelioByBucket])

  // Latest snapshot for summary cards (last slot with an offer in the day)
  const latestOffers = useMemo(() => {
    if (activeTab === '_total') {
      return subIds.flatMap(id => {
        const entries = offersBySubId[id]
        if (!entries) return []
        const sorted = Array.from(entries.values()).sort((a, b) => a.ts.localeCompare(b.ts))
        return sorted.length ? [sorted[sorted.length - 1]] : []
      })
    }
    const entries = offersBySubId[activeTab]
    if (!entries) return []
    const sorted = Array.from(entries.values()).sort((a, b) => a.ts.localeCompare(b.ts))
    return sorted.length ? [sorted[sorted.length - 1]] : []
  }, [activeTab, offersBySubId, subIds])

  const totalFlexUp   = latestOffers.reduce((s, o) => s + o.positiveRdvKw, 0)
  const totalFlexDown = latestOffers.reduce((s, o) => s + o.negativeRdvKw, 0)
  const avgConf = latestOffers.length
    ? latestOffers.reduce((s, o) => s + (o.confidence ?? 0), 0) / latestOffers.length
    : null
  const avgRisk = latestOffers.length
    ? latestOffers.reduce((s, o) => s + (o.riskScore ?? 0), 0) / latestOffers.length
    : null

  const comparisonRows = useMemo(() =>
    chartData.filter(p => p.measured !== null && p.baseline !== null).slice(0, 20),
    [chartData],
  )

  const rmsKw = useMemo(() => {
    if (!comparisonRows.length) return null
    const mse = comparisonRows.reduce((s, r) => s + (r.measured! - r.baseline!) ** 2, 0) / comparisonRows.length
    return Math.sqrt(mse)
  }, [comparisonRows])

  // Y axis domain: take the widest bounds from offer data and Envelio band
  const offerSlots = chartData.filter(d => d.pMax !== null)
  const envelioSlots = chartData.filter(d => d.envelioband !== null)
  const yMaxCandidates = [
    ...offerSlots.map(d => d.pMax!),
    ...envelioSlots.map(d => d.envelioband![1]),
  ]
  const yMinCandidates = [
    ...offerSlots.map(d => d.pMin!),
    ...envelioSlots.map(d => d.envelioband![0]),
  ]
  const yDomainMax = yMaxCandidates.length ? Math.max(...yMaxCandidates) * 1.08 : 15
  const yDomainMin = yMinCandidates.length ? Math.min(...yMinCandidates) * 1.08 : -8

  const limitingReasons = useMemo(() => {
    if (activeTab === '_total') return []
    const entries = offersBySubId[activeTab]
    if (!entries) return []
    const sorted = Array.from(entries.values()).sort((a, b) => a.ts.localeCompare(b.ts))
    return sorted[sorted.length - 1]?.limitingReasons ?? []
  }, [activeTab, offersBySubId])

  const hasOfferData = (allOffers ?? []).length > 0

  // pMax/pMin reference lines: use first slot that has data
  const firstWithData = chartData.find(d => d.pMax !== null)

  if (subIds.length === 0) {
    return <DataEmpty label="Keine Flex-Verknüpfung" hint="Diesem Asset sind keine flex_asset_ids zugeordnet." />
  }

  return (
    <div className="space-y-3">
      {/* ── Tabs + day navigation ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          {isFutureDay && (
            <span className="px-1.5 py-0.5 rounded text-2xs font-semibold text-violet-400 bg-violet-400/10 border border-violet-400/20">
              Tag-Voraus
            </span>
          )}
        </div>

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

      {loading && <DataLoading />}

      {!loading && (
        <>
          {/* ── Flex-Envelope chart — always 96 slots ── */}
          <Card>
            <CardHeader
              title="Flex-Envelope"
              subtitle={`${selectedDate} · 96 × 15 Min · UTC${hasOfferData ? '' : ' · Keine Flex-Angebote'}${hasMelo ? ` · MeLo: ${asset.melo}` : ''}`}
            />
            <div className="px-3 pb-3">
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={chartData} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 9, fill: '#475569' }}
                    axisLine={{ stroke: '#1e293b' }}
                    tickLine={false}
                    interval={7}
                  />
                  <YAxis
                    domain={offerSlots.length ? [yDomainMin, yDomainMax] : ['auto', 'auto']}
                    tick={{ fontSize: 9, fill: '#475569' }}
                    tickFormatter={v => `${Number(v).toFixed(1)}`}
                    unit=" kW"
                    width={54}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<FlexTooltip />} />

                  <ReferenceLine
                    y={firstWithData?.pMax ?? 0}
                    stroke={firstWithData?.pMax != null ? '#334155' : 'none'}
                    strokeDasharray="4 2"
                    label={firstWithData?.pMax != null ? { value: 'P_max', position: 'insideTopRight', fill: '#475569', fontSize: 8 } : undefined}
                  />
                  <ReferenceLine
                    y={firstWithData?.pMin != null && firstWithData.pMin !== 0 ? firstWithData.pMin : 0}
                    stroke={firstWithData?.pMin != null && firstWithData.pMin !== 0 ? '#334155' : 'none'}
                    strokeDasharray="4 2"
                    label={firstWithData?.pMin != null && firstWithData.pMin !== 0 ? { value: 'P_min', position: 'insideBottomRight', fill: '#475569', fontSize: 8 } : undefined}
                  />
                  <ReferenceLine y={0} stroke="#1e293b" />

                  <Area
                    dataKey="envelioband"
                    type="stepAfter"
                    fill="#06b6d4"
                    fillOpacity={0.10}
                    stroke="#06b6d4"
                    strokeOpacity={0.5}
                    strokeWidth={1}
                    strokeDasharray="4 2"
                    name="Envelio Flexband (MeLo)"
                    connectNulls={false}
                  />
                  <Area
                    dataKey="flexBand"
                    type="stepAfter"
                    fill="#22c55e"
                    fillOpacity={0.15}
                    stroke="#22c55e"
                    strokeOpacity={0.4}
                    strokeWidth={1}
                    name="Flexibilitätsband (RDV)"
                    connectNulls={false}
                  />
                  <Line
                    dataKey="baseline"
                    type="stepAfter"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={false}
                    name="Netz-Baseline (Progn.)"
                    connectNulls={false}
                  />
                  <Line
                    dataKey="measured"
                    type="linear"
                    stroke="#f97316"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                    name="Netzbezug (gemessen)"
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 px-1">
                <LegendDot color="#06b6d4" label="Envelio Flexband" filled dashed />
                <LegendDot color="#22c55e" label="Flexibilitätsband (RDV)" filled />
                <LegendDot color="#f59e0b" label="Netz-Baseline" />
                <LegendDot color="#f97316" label="Netzbezug (gemessen)" />
                <LegendDot color="#334155" label="P-Grenzen" dashed />
              </div>
            </div>
          </Card>

          {/* ── Summary cards ── */}
          {hasOfferData && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <StatCard label="Flex hoch ↑" value={fmtPower(totalFlexUp)} color="text-green-400" />
              <StatCard label="Flex runter ↓" value={fmtPower(totalFlexDown)} color="text-blue-400" />
              <StatCard
                label="Konfidenz"
                value={avgConf !== null ? `${(avgConf * 100).toFixed(0)} %` : '—'}
                color={avgConf !== null && avgConf >= 0.75 ? 'text-green-400' : 'text-amber-400'}
              />
              <StatCard
                label="Risiko"
                value={avgRisk !== null ? `${(avgRisk * 100).toFixed(0)} %` : '—'}
                color={avgRisk !== null && avgRisk <= 0.25 ? 'text-green-400' : 'text-amber-400'}
              />
            </div>
          )}

          {/* ── Limiting reasons ── */}
          {limitingReasons.length > 0 && (
            <Card>
              <div className="p-2.5">
                <p className="text-2xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Begrenzende Faktoren
                </p>
                <div className="flex flex-wrap gap-1">
                  {limitingReasons.map((r: string) => (
                    <span key={r} className="px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-800/40 text-2xs font-mono">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* ── Comparison table ── */}
          {comparisonRows.length > 0 && (
            <Card>
              <CardHeader
                title="Vergleich: Berechnet vs. Gemessen"
                subtitle={`${comparisonRows.length} Messpunkt${comparisonRows.length !== 1 ? 'e' : ''}`}
                action={rmsKw !== null ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-700/50 border border-gray-700/40">
                    <span className="text-2xs text-slate-600">RMS</span>
                    <span className={`text-2xs font-mono font-semibold ${
                      rmsKw < 0.5 ? 'text-green-400' : rmsKw < 2 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {rmsKw.toFixed(2)} kW
                    </span>
                  </div>
                ) : undefined}
              />
              <div className="overflow-x-auto">
                <table className="w-full text-2xs">
                  <thead>
                    <tr className="border-b border-gray-700/40">
                      <Th>Zeit (UTC)</Th>
                      <Th right>Netz-Baseline</Th>
                      <Th right>Gemessen</Th>
                      <Th right>Abweichung</Th>
                      <Th right>Flexibilitätsband</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map(row => {
                      const deviation = row.measured !== null && row.baseline !== null
                        ? row.measured - row.baseline : null
                      const inBand = row.measured !== null && row.flexBand !== null &&
                        row.measured >= row.flexBand[0] && row.measured <= row.flexBand[1]
                      return (
                        <tr key={row.tsKey} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                          <Td mono>{row.time}</Td>
                          <Td right mono className="text-amber-400">
                            {row.baseline!.toFixed(2)} kW
                          </Td>
                          <Td right mono className="text-orange-400">
                            {row.measured!.toFixed(2)} kW
                          </Td>
                          <Td right mono className={deviation! >= 0 ? 'text-green-400' : 'text-blue-400'}>
                            {deviation! >= 0 ? '+' : ''}{deviation!.toFixed(2)} kW
                          </Td>
                          <Td right mono className={inBand ? 'text-slate-400' : 'text-red-400'}>
                            {row.flexBand ? `[${row.flexBand[0].toFixed(1)}, ${row.flexBand[1].toFixed(1)}]` : '—'}
                            {!inBand && row.flexBand ? ' ⚠' : ''}
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Latest offer detail table ── */}
          {latestOffers.length > 0 && (
            <Card>
              <CardHeader title="Letztes Angebot" subtitle={fmtTime(latestOffers[0].ts)} />
              <div className="overflow-x-auto">
                <table className="w-full text-2xs">
                  <thead>
                    <tr className="border-b border-gray-700/40">
                      <Th>Asset</Th>
                      <Th right>Netz-Baseline</Th>
                      <Th right>P_max</Th>
                      <Th right>P_min</Th>
                      <Th right>RDV↑</Th>
                      <Th right>RDV↓</Th>
                      <Th right>V_max</Th>
                      <Th right>V_min</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestOffers.map(o => (
                      <tr key={o.assetId} className="border-b border-gray-700/40/30">
                        <Td mono className="text-blue-400">{o.assetId}</Td>
                        <Td right mono className="text-amber-400">{o.baselineKw.toFixed(2)} kW</Td>
                        <Td right mono className="text-slate-300">{o.pMaxKw.toFixed(1)} kW</Td>
                        <Td right mono className="text-slate-300">{o.pMinKw.toFixed(1)} kW</Td>
                        <Td right mono className="text-green-400">+{o.positiveRdvKw.toFixed(2)} kW</Td>
                        <Td right mono className="text-blue-400">-{o.negativeRdvKw.toFixed(2)} kW</Td>
                        <Td right mono className="text-slate-400">{o.vmaxKwh?.toFixed(1) ?? '—'} kWh</Td>
                        <Td right mono className="text-slate-400">{o.vminKwh?.toFixed(1) ?? '—'} kWh</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!hasOfferData && (
            <div className="panel p-3 text-center text-2xs text-slate-600">
              Keine Flex-Angebote für {formatDayLabel(selectedDate)}.
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FlexTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as ChartPoint | undefined
  if (!d) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 shadow-xl text-2xs space-y-1 min-w-[200px]">
      <div className="font-mono text-slate-400 mb-1.5">{label} UTC</div>
      {d.envelioband !== null && (
        <Row label="Envelio Flexband" value={`[${d.envelioband[0].toFixed(2)}, ${d.envelioband[1].toFixed(2)}] kW`} color="text-cyan-400" />
      )}
      {d.baseline !== null && (
        <Row label="Netz-Baseline (Progn.)" value={`${d.baseline.toFixed(2)} kW`} color="text-amber-400" />
      )}
      {d.flexBand !== null && (
        <Row label="Flexibilitätsband (RDV)" value={`[${d.flexBand[0].toFixed(2)}, ${d.flexBand[1].toFixed(2)}] kW`} color="text-green-400" />
      )}
      {d.measured !== null && (
        <Row label="Netzbezug gemessen" value={`${d.measured.toFixed(2)} kW`} color="text-orange-400" />
      )}
      {d.confidence !== null && (
        <Row label="Konfidenz" value={`${(d.confidence * 100).toFixed(0)} %`} color="text-slate-300" />
      )}
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  )
}

function LegendDot({ color, label, filled, dashed }: {
  color: string; label: string; filled?: boolean; dashed?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      {filled && dashed
        ? <div className="w-3 h-2.5 rounded-sm border border-dashed" style={{ backgroundColor: color, opacity: 0.4, borderColor: color }} />
        : filled
        ? <div className="w-3 h-2.5 rounded-sm" style={{ backgroundColor: color, opacity: 0.5 }} />
        : dashed
        ? <div className="w-3 h-0 border-t-2 border-dashed" style={{ borderColor: color }} />
        : <div className="w-3 h-0 border-t-2" style={{ borderColor: color }} />
      }
      <span className="text-2xs text-slate-500">{label}</span>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="panel p-2.5">
      <div className="text-2xs text-slate-600 mb-1">{label}</div>
      <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
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
    <td className={`px-3 py-1.5 text-slate-400 ${right ? 'text-right' : ''} ${mono ? 'font-mono' : ''} ${className}`}>
      {children}
    </td>
  )
}
