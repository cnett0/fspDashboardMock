import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { Card, CardHeader } from '../ui/Card'
import { useApi } from '../../hooks/useApi'
import { getSpotPrices, getWindForecast, getSolarForecast } from '../../api/market'
import { DataLoading, DataEmpty } from '../ui/DataState'
import { useDateRangeIso } from '../../context/DateRangeContext'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 shadow-xl text-xs">
      <div className="font-mono text-slate-400 mb-1.5">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono text-slate-200">
            {p.name === 'Preis' ? `${p.value?.toFixed(2)} €/MWh` : `${p.value} GW`}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SpotPriceChart() {
  const { from, to } = useDateRangeIso()
  const { data: spotResp, loading } = useApi(() => getSpotPrices({ from, to }), [from, to])
  const { data: windResp } = useApi(() => getWindForecast({ from, to }), [from, to])
  const { data: solarResp } = useApi(() => getSolarForecast({ from, to }), [from, to])

  const spotData = spotResp?.data ?? []
  const windData = windResp?.data ?? []
  const solarData = solarResp?.data ?? []

  const data = spotData.map(s => {
    const w = windData.find(w => w.hourUtc === s.hourUtc)
    const sol = solarData.find(sl => sl.hourUtc === s.hourUtc)
    const label = new Date(s.hourUtc).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    return {
      hour: label,
      Preis: s.priceEurMwh,
      Wind: w ? Math.round(w.forecastMw / 1000) : undefined,
      Solar: sol ? Math.round(sol.forecastMw / 1000) : undefined,
    }
  })

  const prices = spotData.map(s => s.priceEurMwh)
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null
  const minPrice = prices.length ? Math.min(...prices) : null
  const maxPrice = prices.length ? Math.max(...prices) : null
  const spread = maxPrice !== null && minPrice !== null ? maxPrice - minPrice : null

  const freshness = spotResp?.meta?.freshness
  const subtitle = freshness?.lastUpdated
    ? `DE/LU · ${new Date(freshness.lastUpdated).toLocaleDateString('de-DE')}${avgPrice !== null ? ` · Ø ${avgPrice.toFixed(2)} €/MWh` : ''}`
    : 'DE/LU · ENTSO-E'

  return (
    <Card>
      <CardHeader title="Day-Ahead Spot (SDAC)" subtitle={subtitle} />
      <div className="p-3 pt-2">
        {loading && <DataLoading />}
        {!loading && spotData.length === 0 && (
          <DataEmpty hint="ENTSOE_SECURITY_TOKEN konfigurieren und Sync ausführen" />
        )}
        {!loading && spotData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} interval={5} />
                <YAxis yAxisId="price" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}€`} />
                <YAxis yAxisId="gen" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}GW`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#64748b' }} />
                <ReferenceLine yAxisId="price" y={0} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} />
                <Area yAxisId="gen" type="monotone" dataKey="Wind" stroke="#22c55e" fill="url(#windGrad)" strokeWidth={1.5} dot={false} />
                <Area yAxisId="gen" type="monotone" dataKey="Solar" stroke="#facc15" fill="url(#solarGrad)" strokeWidth={1.5} dot={false} />
                <Area yAxisId="price" type="monotone" dataKey="Preis" stroke="#38bdf8" fill="url(#priceGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <StatChip label="Ø Preis" value={avgPrice !== null ? `${avgPrice.toFixed(1)} €` : '—'} />
              <StatChip label="Min" value={minPrice !== null ? `${minPrice.toFixed(1)} €` : '—'} color="text-blue-400" />
              <StatChip label="Max" value={maxPrice !== null ? `${maxPrice.toFixed(1)} €` : '—'} color="text-red-400" />
              <StatChip label="Spread" value={spread !== null ? `${spread.toFixed(1)} €` : '—'} color="text-amber-400" />
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

function StatChip({ label, value, color = 'text-slate-200' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-700/60 rounded px-2 py-1.5 text-center">
      <div className="text-2xs text-slate-600 uppercase">{label}</div>
      <div className={`text-xs font-mono font-bold mt-0.5 ${color}`}>{value}</div>
    </div>
  )
}
