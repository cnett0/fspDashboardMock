import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Card, CardHeader } from '../ui/Card'
import { useApi } from '../../hooks/useApi'
import { getVariableGridFees, getLoadDependentGridFees } from '../../api/market'
import { DataLoading, DataEmpty } from '../ui/DataState'

const TARIFF_COLORS = { low: '#22c55e', standard: '#f59e0b', high: '#ef4444' }
const TARIFF_LABELS = { low: 'niedrig', standard: 'standard', high: 'hoch' }

const REGION_COLORS: Record<string, string> = {
  North: '#38bdf8', South: '#22c55e', West: '#f59e0b', East: '#a855f7',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 shadow-xl text-xs">
      <div className="font-mono text-slate-400 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-3">
          <span style={{ color: p.fill }}>{p.name}</span>
          <span className="font-mono text-slate-200">{typeof p.value === 'number' ? `${p.value.toFixed(2)} ct/kWh` : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function NetChargeTariffChart() {
  const { data: resp, loading } = useApi(() => getVariableGridFees(), [])
  const rows = resp?.data ?? []

  const data = rows.map(r => ({
    Operator: r.operatorName.replace(' GmbH', '').replace(' AG', '').replace(' mbH', ''),
    'Netzentgelt': r.priceEurMwh != null ? Number((r.priceEurMwh / 10).toFixed(2)) : null,
    tariff: r.tariffLevel,
  }))

  return (
    <Card>
      <CardHeader title="Variable Netzentgelte – Tagesgang" subtitle="Nationaler Durchschnitt · 3 Tarifstufen · ct/kWh" />
      <div className="p-3 pt-2">
        {loading && <DataLoading />}
        {!loading && data.length === 0 && <DataEmpty hint="Netzentgelte Sync erforderlich" />}
        {!loading && data.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" />
                <XAxis dataKey="Operator" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} interval={0} angle={-30} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}ct`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Netzentgelt" radius={[2, 2, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={TARIFF_COLORS[entry.tariff as keyof typeof TARIFF_COLORS] ?? '#64748b'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-3 mt-2">
              {Object.entries(TARIFF_COLORS).map(([tier, color]) => (
                <div key={tier} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-2xs text-slate-500 capitalize">{TARIFF_LABELS[tier as keyof typeof TARIFF_LABELS]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

export function LoadDependentFeeChart() {
  const { data: resp, loading } = useApi(() => getLoadDependentGridFees(), [])
  const rows = resp?.data ?? []

  const data = rows
    .filter(r => r.priceEurKwYear != null)
    .map(r => ({
      name: r.operatorName.replace(' GmbH', '').replace(' AG', '').replace(' mbH', ''),
      'Jahresl.-preis': r.priceEurKwYear,
      region: r.region,
    }))

  return (
    <Card>
      <CardHeader title="Lastabhängige Netzentgelte – VNB-Vergleich" subtitle="Jahresleistungspreissystem · RLM-Entnahmestellen · €/kW/a" />
      <div className="p-3 pt-2">
        {loading && <DataLoading />}
        {!loading && data.length === 0 && <DataEmpty hint="Lastabhängige Netzentgelte Sync erforderlich" />}
        {!loading && data.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, bottom: 0, left: 80 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}€`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Jahresl.-preis" radius={[0, 2, 2, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={REGION_COLORS[entry.region] ?? '#64748b'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-3 mt-2 flex-wrap">
              {Object.entries(REGION_COLORS).map(([region, color]) => (
                <div key={region} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-2xs text-slate-500">{region}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
