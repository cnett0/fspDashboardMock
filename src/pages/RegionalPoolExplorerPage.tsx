import { useState } from 'react'
import { Card, CardHeader } from '../components/ui/Card'
import { Tabs } from '../components/ui/Tabs'
import { Badge } from '../components/ui/Badge'
import { useApi } from '../hooks/useApi'
import { getPools } from '../api/pools'
import { getAssets } from '../api/assets'
import type { Pool, Asset } from '../types/api'
import { fmtPower, fmtEnergy } from '../lib/format'
import { Link } from 'react-router-dom'
import { ArrowRight, Layers, Building2, Map as MapIcon, Info } from 'lucide-react'
import { POOLING_EXPLANATION, POOL_READINESS } from '../data/fspMockData'

// Static reference data for labels
const UENB_META: Record<string, { label: string; color: string; states: string }> = {
  '50hertz': { label: '50Hertz Transmission', color: '#38bdf8', states: 'Berlin, Brandenburg, Hamburg, Mecklenburg-Vorpommern, Sachsen, Sachsen-Anhalt, Thüringen' },
  amprion: { label: 'Amprion GmbH', color: '#f59e0b', states: 'Nordrhein-Westfalen, Rheinland-Pfalz, Saarland, Teile Bayerns' },
  tennet: { label: 'TenneT TSO GmbH', color: '#a855f7', states: 'Bayern, Niedersachsen, Bremen, Hessen, Schleswig-Holstein, Teile Hamburgs' },
  transnetbw: { label: 'TransnetBW GmbH', color: '#4ade80', states: 'Baden-Württemberg' },
}

const VNB_META: Record<string, { label: string; uenb: string }> = {
  'ewe-netz': { label: 'EWE Netz GmbH', uenb: '50hertz' },
  'sh-netz': { label: 'SH Netz GmbH', uenb: 'tennet' },
  'sw-heide': { label: 'Stadtwerke Heide', uenb: 'tennet' },
  'netze-bw': { label: 'Netze BW GmbH', uenb: 'transnetbw' },
  'lew-verteil': { label: 'LEW Verteilnetz', uenb: 'tennet' },
  'sw-weilheim': { label: 'Stromnetz Weilheim', uenb: 'tennet' },
  westnetz: { label: 'Westnetz GmbH', uenb: 'amprion' },
  wesernetz: { label: 'wesernetz Bremen', uenb: 'tennet' },
  'bad-honnef': { label: 'Bad Honnef AG', uenb: 'amprion' },
  mitnetz: { label: 'MITNETZ Strom', uenb: '50hertz' },
  'netz-leipzig': { label: 'Netz Leipzig GmbH', uenb: '50hertz' },
  'sw-torgau': { label: 'Stadtwerke Torgau', uenb: '50hertz' },
}

const PR_META: Record<string, { label: string; color: string; uenb: string }> = {
  'nord-west': { label: 'Planungsregion Nord-West', color: '#0ea5e9', uenb: 'tennet' },
  'nord-ost': { label: 'Planungsregion Nord-Ost', color: '#38bdf8', uenb: '50hertz' },
  'mitte-ost': { label: 'Planungsregion Mitte-Ost', color: '#7dd3fc', uenb: '50hertz' },
  'west-rhein': { label: 'Planungsregion West-Rhein', color: '#fbbf24', uenb: 'amprion' },
  'sued-west': { label: 'Planungsregion Süd-West', color: '#4ade80', uenb: 'transnetbw' },
  'sued-ost': { label: 'Planungsregion Süd-Ost', color: '#86efac', uenb: 'tennet' },
}

type GroupKey = string

function groupBy<T>(items: T[], key: (item: T) => string | undefined): Map<GroupKey, T[]> {
  const map = new Map<GroupKey, T[]>()
  for (const item of items) {
    const k = key(item) ?? 'Unbekannt'
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(item)
  }
  return map
}

// A compact stat row
function StatRow({ label, value, color = 'text-slate-300' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between text-2xs">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  )
}

// Pool chip with readiness chips
function PoolChip({ pool }: { pool: Pool }) {
  const typeColors: Record<string, string> = {
    flexibility: 'border-blue-700/60 text-blue-300 bg-blue-900/10',
    fcr: 'border-green-700/60 text-green-300 bg-green-900/10',
    afrr: 'border-amber-700/60 text-amber-300 bg-amber-900/10',
    mfrr: 'border-red-700/60 text-red-300 bg-red-900/10',
    congestion: 'border-purple-700/60 text-purple-300 bg-purple-900/10',
    spot: 'border-cyan-700/60 text-cyan-300 bg-cyan-900/10',
    balancing: 'border-orange-700/60 text-orange-300 bg-orange-900/10',
  }
  const readiness = POOL_READINESS.find(r => r.poolId === pool.id)
  return (
    <div className={`flex flex-col gap-1 px-2 py-1.5 rounded border ${typeColors[pool.poolType] ?? 'border-slate-700 text-slate-400'}`}>
      <span className="font-mono text-2xs">{pool.poolCode}</span>
      {readiness && (
        <div className="flex flex-wrap gap-1">
          {readiness.chips.slice(0, 3).map(chip => (
            <span key={chip} className="px-1 py-0.5 rounded text-2xs bg-black/30 text-slate-400 border border-white/10">{chip}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: ÜNB Regions
// ─────────────────────────────────────────────────────────────────────────────
function UenbTab({ pools, assets }: { pools: Pool[]; assets: Asset[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  const poolsByUenb = groupBy(pools, p => p.uenbRegion)
  const assetsByUenb = groupBy(assets, a => a.uenbRegion)
  const uenbKeys = Array.from(new Set([...poolsByUenb.keys(), ...assetsByUenb.keys(), ...Object.keys(UENB_META)]))

  const selPools = selected ? (poolsByUenb.get(selected) ?? []) : []
  const selAssets = selected ? (assetsByUenb.get(selected) ?? []) : []

  return (
    <div className="flex gap-3 h-full overflow-hidden">
      {/* List */}
      <div className="w-72 flex-shrink-0 overflow-auto space-y-2">
        {uenbKeys.map(key => {
          const meta = UENB_META[key]
          const pCount = (poolsByUenb.get(key) ?? []).length
          const aCount = (assetsByUenb.get(key) ?? []).length
          const flexUp = (assetsByUenb.get(key) ?? []).reduce((s, a) => s + (a.availableFlexUpKw ?? 0), 0)
          const flexDown = (assetsByUenb.get(key) ?? []).reduce((s, a) => s + (a.availableFlexDownKw ?? 0), 0)
          return (
            <div
              key={key}
              onClick={() => setSelected(selected === key ? null : key)}
              className={`p-3 rounded border cursor-pointer transition-all ${selected === key ? 'border-blue-500 bg-gray-800/50' : 'border-gray-700/40 bg-gray-800/30 hover:border-gray-600'}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta?.color ?? '#666' }} />
                <span className="font-mono text-xs text-white font-semibold">{meta?.label ?? key}</span>
              </div>
              {meta?.states && <p className="text-2xs text-slate-500 mb-2 leading-snug">{meta.states}</p>}
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <StatRow label="Pools" value={pCount} />
                <StatRow label="Assets" value={aCount} />
                <StatRow label="Flex ↑" value={fmtPower(flexUp)} color="text-green-400" />
                <StatRow label="Flex ↓" value={fmtPower(flexDown)} color="text-blue-400" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Layers size={28} className="text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500">ÜNB-Region auswählen</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: UENB_META[selected]?.color ?? '#666' }} />
                  {UENB_META[selected]?.label ?? selected} — Pools ({selPools.length})
                </div>
              </CardHeader>
              <div className="p-3 flex flex-wrap gap-2">
                {selPools.length === 0 ? <p className="text-2xs text-slate-500">Keine Pools in dieser ÜNB-Region</p>
                  : selPools.map(p => <PoolChip key={p.id} pool={p} />)}
              </div>
            </Card>
            <Card>
              <CardHeader>Assets ({selAssets.length})</CardHeader>
              <div className="overflow-auto max-h-64">
                <table className="w-full text-2xs">
                  <thead className="bg-gray-800/70 sticky top-0">
                    <tr>
                      {['Code', 'Name', 'Typ', 'VNB-Betreiber', 'VNB-Planungsreg.', 'Flex ↑', 'Flex ↓'].map(h => (
                        <th key={h} className="px-2 py-1.5 text-left text-slate-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selAssets.map(a => (
                      <tr key={a.id} className="border-t border-gray-700/40 hover:bg-gray-700/30 transition-colors">
                        <td className="px-2 py-1.5 font-mono text-blue-400">{a.assetCode}</td>
                        <td className="px-2 py-1.5 text-slate-300 max-w-[160px] truncate">{a.name}</td>
                        <td className="px-2 py-1.5"><Badge variant="slate">{a.assetType}</Badge></td>
                        <td className="px-2 py-1.5 text-amber-400">{a.vnbOperator ?? '—'}</td>
                        <td className="px-2 py-1.5 text-purple-400">{a.vnbPlanningRegion ?? '—'}</td>
                        <td className="px-2 py-1.5 font-mono text-green-400">{fmtPower(a.availableFlexUpKw)}</td>
                        <td className="px-2 py-1.5 font-mono text-blue-400">{fmtPower(a.availableFlexDownKw)}</td>
                      </tr>
                    ))}
                    {selAssets.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-6 text-slate-500">Keine Assets</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: VNB Operators
// ─────────────────────────────────────────────────────────────────────────────
function VnbOperatorsTab({ pools, assets }: { pools: Pool[]; assets: Asset[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  const poolsByVnb = groupBy(pools, p => p.vnbOperator)
  const assetsByVnb = groupBy(assets, a => a.vnbOperator)
  const vnbKeys = Array.from(new Set([...poolsByVnb.keys(), ...assetsByVnb.keys(), ...Object.keys(VNB_META)]))

  const selPools = selected ? (poolsByVnb.get(selected) ?? []) : []
  const selAssets = selected ? (assetsByVnb.get(selected) ?? []) : []

  return (
    <div className="flex gap-3 h-full overflow-hidden">
      <div className="w-72 flex-shrink-0 overflow-auto space-y-2">
        {vnbKeys.map(key => {
          const meta = VNB_META[key]
          const uenbMeta = meta ? UENB_META[meta.uenb] : undefined
          const pCount = (poolsByVnb.get(key) ?? []).length
          const aCount = (assetsByVnb.get(key) ?? []).length
          const flexUp = (assetsByVnb.get(key) ?? []).reduce((s, a) => s + (a.availableFlexUpKw ?? 0), 0)
          const flexDown = (assetsByVnb.get(key) ?? []).reduce((s, a) => s + (a.availableFlexDownKw ?? 0), 0)
          return (
            <div
              key={key}
              onClick={() => setSelected(selected === key ? null : key)}
              className={`p-3 rounded border cursor-pointer transition-all ${selected === key ? 'border-amber-500/60 bg-gray-800/50' : 'border-gray-700/40 bg-gray-800/30 hover:border-gray-600'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white font-semibold">{meta?.label ?? key}</span>
                {uenbMeta && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: uenbMeta.color }} />
                    <span className="text-2xs text-slate-500">{meta?.uenb}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <StatRow label="Pools" value={pCount} />
                <StatRow label="Assets" value={aCount} />
                <StatRow label="Flex ↑" value={fmtPower(flexUp)} color="text-green-400" />
                <StatRow label="Flex ↓" value={fmtPower(flexDown)} color="text-blue-400" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Building2 size={28} className="text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500">VNB-Betreiber auswählen</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span>{VNB_META[selected]?.label ?? selected} — Pools ({selPools.length})</span>
                  {VNB_META[selected]?.uenb && (
                    <Badge variant="blue">ÜNB: {VNB_META[selected].uenb}</Badge>
                  )}
                </div>
              </CardHeader>
              <div className="p-3 flex flex-wrap gap-2">
                {selPools.length === 0 ? <p className="text-2xs text-slate-500">Keine Pools für diesen VNB-Betreiber</p>
                  : selPools.map(p => <PoolChip key={p.id} pool={p} />)}
              </div>
            </Card>
            <Card>
              <CardHeader>Assets ({selAssets.length})</CardHeader>
              <div className="overflow-auto max-h-64">
                <table className="w-full text-2xs">
                  <thead className="bg-gray-800/70 sticky top-0">
                    <tr>
                      {['Code', 'Name', 'Typ', 'ÜNB-Region', 'VNB-Planungsreg.', 'Flex ↑', 'Flex ↓'].map(h => (
                        <th key={h} className="px-2 py-1.5 text-left text-slate-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selAssets.map(a => (
                      <tr key={a.id} className="border-t border-gray-700/40 hover:bg-gray-700/30">
                        <td className="px-2 py-1.5 font-mono text-blue-400">{a.assetCode}</td>
                        <td className="px-2 py-1.5 text-slate-300 max-w-[160px] truncate">{a.name}</td>
                        <td className="px-2 py-1.5"><Badge variant="slate">{a.assetType}</Badge></td>
                        <td className="px-2 py-1.5 text-blue-400">{a.uenbRegion ?? '—'}</td>
                        <td className="px-2 py-1.5 text-purple-400">{a.vnbPlanningRegion ?? '—'}</td>
                        <td className="px-2 py-1.5 font-mono text-green-400">{fmtPower(a.availableFlexUpKw)}</td>
                        <td className="px-2 py-1.5 font-mono text-blue-400">{fmtPower(a.availableFlexDownKw)}</td>
                      </tr>
                    ))}
                    {selAssets.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-6 text-slate-500">Keine Assets</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: VNB Planning Regions
// ─────────────────────────────────────────────────────────────────────────────
function VnbPlanningRegionsTab({ pools, assets }: { pools: Pool[]; assets: Asset[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  const poolsByPr = groupBy(pools, p => p.vnbPlanningRegion)
  const assetsByPr = groupBy(assets, a => a.vnbPlanningRegion)
  const prKeys = Array.from(new Set([...poolsByPr.keys(), ...assetsByPr.keys(), ...Object.keys(PR_META)]))

  const selPools = selected ? (poolsByPr.get(selected) ?? []) : []
  const selAssets = selected ? (assetsByPr.get(selected) ?? []) : []

  // Cross-analysis: which ÜNB regions and VNB operators appear in this planning region?
  const uenbSet = new Set(selAssets.map(a => a.uenbRegion).filter(Boolean) as string[])
  const vnbSet = new Set(selAssets.map(a => a.vnbOperator).filter(Boolean) as string[])

  return (
    <div className="flex gap-3 h-full overflow-hidden">
      <div className="w-72 flex-shrink-0 overflow-auto space-y-2">
        {prKeys.map(key => {
          const meta = PR_META[key]
          const pCount = (poolsByPr.get(key) ?? []).length
          const aCount = (assetsByPr.get(key) ?? []).length
          const flexUp = (assetsByPr.get(key) ?? []).reduce((s, a) => s + (a.availableFlexUpKw ?? 0), 0)
          const flexDown = (assetsByPr.get(key) ?? []).reduce((s, a) => s + (a.availableFlexDownKw ?? 0), 0)
          return (
            <div
              key={key}
              onClick={() => setSelected(selected === key ? null : key)}
              className={`p-3 rounded border cursor-pointer transition-all ${selected === key ? 'border-purple-500/60 bg-gray-800/50' : 'border-gray-700/40 bg-gray-800/30 hover:border-gray-600'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta?.color ?? '#888' }} />
                <span className="text-xs text-white font-semibold">{meta?.label ?? key}</span>
              </div>
              {meta?.uenb && (
                <div className="flex items-center gap-1 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: UENB_META[meta.uenb]?.color ?? '#666' }} />
                  <span className="text-2xs text-slate-500">Primär: {meta.uenb}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <StatRow label="Pools" value={pCount} />
                <StatRow label="Assets" value={aCount} />
                <StatRow label="Flex ↑" value={fmtPower(flexUp)} color="text-green-400" />
                <StatRow label="Flex ↓" value={fmtPower(flexDown)} color="text-blue-400" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <MapIcon size={28} className="text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500">VNB-Planungsregion auswählen</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Cross-reference panel */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader>ÜNB-Regionen in dieser Planungsregion</CardHeader>
                <div className="p-3 flex flex-wrap gap-2">
                  {uenbSet.size === 0 ? <p className="text-2xs text-slate-500">Keine Daten</p>
                    : [...uenbSet].map(u => (
                      <div key={u} className="flex items-center gap-1.5 px-2 py-1 rounded border border-blue-700/40 bg-blue-900/10">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: UENB_META[u]?.color ?? '#666' }} />
                        <span className="text-2xs font-mono text-blue-400">{u}</span>
                      </div>
                    ))}
                  <p className="w-full text-2xs text-slate-600 italic mt-1">
                    ÜNB-Region und Planungsregion sind eigenständige Klassifikationen.
                  </p>
                </div>
              </Card>
              <Card>
                <CardHeader>VNB-Betreiber in dieser Planungsregion</CardHeader>
                <div className="p-3 flex flex-wrap gap-2">
                  {vnbSet.size === 0 ? <p className="text-2xs text-slate-500">Keine Daten</p>
                    : [...vnbSet].map(v => (
                      <span key={v} className="px-2 py-1 rounded border border-amber-700/40 bg-amber-900/10 text-2xs font-mono text-amber-400">
                        {VNB_META[v]?.label ?? v}
                      </span>
                    ))}
                  <p className="w-full text-2xs text-slate-600 italic mt-1">
                    VNB-Betreiber und Planungsregion werden unabhängig gepflegt.
                  </p>
                </div>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PR_META[selected]?.color ?? '#888' }} />
                  {PR_META[selected]?.label ?? selected} — Pools ({selPools.length})
                </div>
              </CardHeader>
              <div className="p-3 flex flex-wrap gap-2">
                {selPools.length === 0 ? <p className="text-2xs text-slate-500">Keine Pools</p>
                  : selPools.map(p => <PoolChip key={p.id} pool={p} />)}
              </div>
            </Card>

            <Card>
              <CardHeader>Assets ({selAssets.length})</CardHeader>
              <div className="overflow-auto max-h-64">
                <table className="w-full text-2xs">
                  <thead className="bg-gray-800/70 sticky top-0">
                    <tr>
                      {['Code', 'Name', 'Typ', 'ÜNB-Region', 'VNB-Betreiber', 'Flex ↑', 'Energie'].map(h => (
                        <th key={h} className="px-2 py-1.5 text-left text-slate-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selAssets.map(a => (
                      <tr key={a.id} className="border-t border-gray-700/40 hover:bg-gray-700/30">
                        <td className="px-2 py-1.5 font-mono text-blue-400">{a.assetCode}</td>
                        <td className="px-2 py-1.5 text-slate-300 max-w-[150px] truncate">{a.name}</td>
                        <td className="px-2 py-1.5"><Badge variant="slate">{a.assetType}</Badge></td>
                        <td className="px-2 py-1.5 text-blue-400">{a.uenbRegion ?? '—'}</td>
                        <td className="px-2 py-1.5 text-amber-400">{a.vnbOperator ?? '—'}</td>
                        <td className="px-2 py-1.5 font-mono text-green-400">{fmtPower(a.availableFlexUpKw)}</td>
                        <td className="px-2 py-1.5 font-mono text-slate-300">{fmtEnergy(a.availableEnergyKwh)}</td>
                      </tr>
                    ))}
                    {selAssets.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-6 text-slate-500">Keine Assets</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export function RegionalPoolExplorerPage() {
  const [tab, setTab] = useState('uenb')

  const { data: pools, loading: poolsLoading } = useApi(() => getPools(), [])
  const { data: assets, loading: assetsLoading } = useApi(() => getAssets(), [])

  const allPools = pools ?? []
  const allAssets = assets ?? []
  const loading = poolsLoading || assetsLoading

  const totalFlexUp = allAssets.reduce((s, a) => s + (a.availableFlexUpKw ?? 0), 0)
  const totalFlexDown = allAssets.reduce((s, a) => s + (a.availableFlexDownKw ?? 0), 0)
  const totalEnergy = allAssets.reduce((s, a) => s + (a.availableEnergyKwh ?? 0), 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 bg-gradient-to-br from-gray-600 to-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-white">Regional Pool Explorer</h1>
            <p className="text-2xs text-slate-500 mt-0.5">
              Three independent dimensions: TSO Region (ÜNB) · DSO Operator (VNB) · DSO Planning Region
            </p>
          </div>
          <div className="flex items-center gap-4 text-2xs">
            {loading ? (
              <span className="text-slate-500">Loading…</span>
            ) : (
              <>
                <div className="text-center">
                  <div className="font-mono text-white font-bold">{allPools.length}</div>
                  <div className="text-slate-600">Pools</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-white font-bold">{allAssets.length}</div>
                  <div className="text-slate-600">Assets</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-green-400 font-bold">{fmtPower(totalFlexUp)}</div>
                  <div className="text-slate-600">RDV+</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-blue-400 font-bold">{fmtPower(totalFlexDown)}</div>
                  <div className="text-slate-600">RDV−</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-slate-300 font-bold">{fmtEnergy(totalEnergy)}</div>
                  <div className="text-slate-600">Energy</div>
                </div>
              </>
            )}
            <Link to="/pools" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
              Pool Management <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Pooling explanation */}
        <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="md:col-span-3 px-3 py-2 rounded border border-blue-700/30 bg-blue-900/10 text-2xs text-blue-200 flex items-start gap-2">
            <Info size={12} className="flex-shrink-0 mt-0.5 text-blue-400" />
            <span>{POOLING_EXPLANATION.body}</span>
          </div>
          <div className="px-3 py-2 rounded border border-amber-700/30 bg-amber-900/10 text-2xs text-amber-300 flex items-start gap-2">
            <span className="flex-shrink-0 font-bold text-amber-400">!</span>
            <span>{POOLING_EXPLANATION.independenceNote}</span>
          </div>
        </div>

        {/* Dimension badges */}
        <div className="mt-2 flex items-center gap-2">
          {POOLING_EXPLANATION.dimensions.map(d => (
            <span key={d.key} className={`px-2 py-0.5 rounded text-2xs border ${
              d.color === 'blue' ? 'bg-blue-900/30 text-blue-300 border-blue-700/50' :
              d.color === 'amber' ? 'bg-amber-900/30 text-amber-300 border-amber-700/50' :
              'bg-purple-900/30 text-purple-300 border-purple-700/50'
            }`}>
              {d.label}
            </span>
          ))}
          <span className="text-2xs text-slate-600 ml-1">— Managed independently for CBP transparency</span>
        </div>

        <Tabs
          tabs={[
            { id: 'uenb', label: 'TSO Regions (ÜNB) · 4' },
            { id: 'vnb', label: 'DSO Operators (VNB) · 12' },
            { id: 'planning', label: 'DSO Planning Regions · 6' },
          ]}
          activeTab={tab}
          onChange={setTab}
          className="mt-2"
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden p-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500">
            Lade Pools und Assets…
          </div>
        ) : (
          <>
            {tab === 'uenb' && <UenbTab pools={allPools} assets={allAssets} />}
            {tab === 'vnb' && <VnbOperatorsTab pools={allPools} assets={allAssets} />}
            {tab === 'planning' && <VnbPlanningRegionsTab pools={allPools} assets={allAssets} />}
          </>
        )}
      </div>
    </div>
  )
}
