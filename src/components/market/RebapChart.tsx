import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { Card, CardHeader } from '../ui/Card'
import { useApi } from '../../hooks/useApi'
import { getRebapPrices } from '../../api/market'
import { DataLoading, DataEmpty } from '../ui/DataState'
import { useDateRangeIso } from '../../context/DateRangeContext'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 shadow-xl text-xs">
      <div className="font-mono text-slate-400 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-3">
          <span className="text-slate-400">{p.name}</span>
          <span className="font-mono text-slate-200">{p.value?.toFixed(2)} €/MWh</span>
        </div>
      ))}
    </div>
  )
}

export function RebapTodayChart() {
  const { from, to, presetId } = useDateRangeIso()
  const { data: resp, loading } = useApi(() => getRebapPrices({ from, to }), [from, to])
  const points = resp?.data ?? []

  // For single-day views show HH:MM; for multi-day show date+time
  const singleDay = presetId === 'today' || presetId === 'yesterday'
  const data = points.map(p => ({
    name: new Date(p.quarterUtc).toLocaleString('de-DE', singleDay
      ? { hour: '2-digit', minute: '2-digit' }
      : { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    reBAP: p.rebapEurMwh,
  }))

  return (
    <Card>
      <CardHeader title="reBAP – Ausgleichsenergiepreise" subtitle="15-Min Auflösung · netztransparenz.de" />
      <div className="p-3 pt-2">
        {loading && <DataLoading />}
        {!loading && data.length === 0 && <DataEmpty hint="netztransparenz.de Sync erforderlich" />}
        {!loading && data.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} interval={7} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#374357" />
              <Bar dataKey="reBAP" radius={[1, 1, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.reBAP > 100 ? '#ef4444' : entry.reBAP > 0 ? '#38bdf8' : '#22c55e'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

export function RebapAnnualChart() {
  return (
    <Card>
      <CardHeader title="reBAP Jahresstatistik" subtitle="Historische Ausgleichsenergiepreise · €/MWh" />
      <DataEmpty label="Historische reBAP-Daten" hint="Daten aus netztransparenz.de Sync verfügbar sobald Sync ausgeführt wurde" />
    </Card>
  )
}
