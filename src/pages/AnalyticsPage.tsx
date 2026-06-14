import { Card, CardHeader } from '../components/ui/Card'
import { useApi } from '../hooks/useApi'
import { getAssets } from '../api/assets'
import { ASSET_TYPE_LABELS, TSO_REGIONS } from '../lib/constants'
import { fmtPower } from '../lib/format'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { DataLoading } from '../components/ui/DataState'
import { useRefresh } from '../context/RefreshContext'

export function AnalyticsPage() {
  const { assetRefreshKey } = useRefresh()
  const { data, loading } = useApi(() => getAssets(), [assetRefreshKey])
  const assets = data ?? []

  const totalFlexUp = assets.reduce((a, b) => a + b.availableFlexUpKw, 0)
  const totalFlexDown = assets.reduce((a, b) => a + b.availableFlexDownKw, 0)

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      {loading && <DataLoading />}
      {!loading && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <KpiCard label="Assets gesamt" value={assets.length.toString()} />
            <KpiCard label="Flex verfügbar ↑" value={fmtPower(totalFlexUp)} />
            <KpiCard label="Flex verfügbar ↓" value={fmtPower(totalFlexDown)} />
            <KpiCard label="Aktiv" value={assets.filter(a => a.status === 'active').length.toString()} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <AssetsByTypeChart assets={assets} />
            <AssetsByRegionChart assets={assets} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FlexByTypeChart assets={assets} />
            <AssetStatusChart assets={assets} />
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <div className="text-2xs text-slate-500 uppercase">{label}</div>
      <div className="text-xl font-mono font-bold text-slate-100 mt-1">{value}</div>
    </Card>
  )
}

function AssetsByTypeChart({ assets }: { assets: Awaited<ReturnType<typeof getAssets>> }) {
  const byType = Object.entries(
    assets.reduce<Record<string, number>>((acc, a) => {
      const label = ASSET_TYPE_LABELS[a.assetType] ?? a.assetType
      acc[label] = (acc[label] ?? 0) + 1
      return acc
    }, {})
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)

  return (
    <Card>
      <CardHeader title="Assets nach Typ" />
      <div className="p-3">
        {byType.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-600">Keine Assets</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byType} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 80 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} width={80} />
              <Tooltip contentStyle={{ background: '#181c22', border: '1px solid #263040', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="count" fill="#38bdf8" fillOpacity={0.8} radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

function AssetsByRegionChart({ assets }: { assets: Awaited<ReturnType<typeof getAssets>> }) {
  const byRegion = TSO_REGIONS.map(tso => ({
    name: tso.shortName,
    count: assets.filter(a => a.uenbRegion === tso.id).length,
    fill: tso.color,
  }))

  return (
    <Card>
      <CardHeader title="Assets nach ÜNB-Region" />
      <div className="p-3">
        {assets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-600">Keine Assets</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byRegion} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#181c22', border: '1px solid #263040', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {byRegion.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

function FlexByTypeChart({ assets }: { assets: Awaited<ReturnType<typeof getAssets>> }) {
  const byType = Object.entries(
    assets.reduce<Record<string, number>>((acc, a) => {
      const label = ASSET_TYPE_LABELS[a.assetType] ?? a.assetType
      acc[label] = (acc[label] ?? 0) + a.availableFlexUpKw / 1000
      return acc
    }, {})
  ).map(([name, flexMW]) => ({ name, flexMW: Number(flexMW.toFixed(2)) })).sort((a, b) => b.flexMW - a.flexMW)

  return (
    <Card>
      <CardHeader title="Flex ↑ nach Typ (MW)" />
      <div className="p-3">
        {byType.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-600">Keine Daten</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byType} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 80 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} unit=" MW" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} width={80} />
              <Tooltip contentStyle={{ background: '#181c22', border: '1px solid #263040', borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${v} MW`, 'Flex ↑']} />
              <Bar dataKey="flexMW" fill="#22c55e" fillOpacity={0.8} radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

function AssetStatusChart({ assets }: { assets: Awaited<ReturnType<typeof getAssets>> }) {
  const statuses = ['active', 'inactive', 'pending', 'maintenance', 'decommissioned']
  const labels: Record<string, string> = {
    active: 'Aktiv', inactive: 'Inaktiv', pending: 'Ausstehend', maintenance: 'Wartung', decommissioned: 'Stillgelegt',
  }
  const data = statuses
    .map(s => ({ name: labels[s], count: assets.filter(a => a.status === s).length }))
    .filter(d => d.count > 0)

  return (
    <Card>
      <CardHeader title="Assets nach Status" />
      <div className="p-3">
        {data.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-600">Keine Assets</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#181c22', border: '1px solid #263040', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="count" fill="#64748b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
