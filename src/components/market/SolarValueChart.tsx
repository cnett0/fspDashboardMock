import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card, CardHeader } from '../ui/Card'
import { useApi } from '../../hooks/useApi'
import { getPvSelfConsumption } from '../../api/market'
import { DataLoading, DataEmpty } from '../ui/DataState'

export function SolarValueChart() {
  const { data: resp, loading } = useApi(() => getPvSelfConsumption(), [])
  const rows = resp?.data ?? []

  const data = rows.filter(r => r.eegTariffEurKwh != null || r.householdGrossEurKwh != null).map(r => ({
    Jahr: r.year.toString(),
    'EEG-Vergütung': r.eegTariffEurKwh ? Number((r.eegTariffEurKwh * 100).toFixed(2)) : null,
    'Haushaltspreis': r.householdWorkEurKwh ? Number((r.householdWorkEurKwh * 100).toFixed(2)) : null,
    'Marktwert Solar': r.solarMarketValueEurKwh ? Number((r.solarMarketValueEurKwh * 100).toFixed(2)) : null,
  }))

  const latest = rows[rows.length - 1]

  return (
    <Card>
      <CardHeader title="PV-Eigenverbrauch & Marktwert" subtitle="EEG-Vergütung vs. Haushaltspreis vs. Solarer Marktwert · ct/kWh" />
      <div className="p-3 pt-2">
        {loading && <DataLoading />}
        {!loading && data.length === 0 && <DataEmpty hint="PV-Sync erforderlich (BNetzA + BDEW)" />}
        {!loading && data.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={data} margin={{ top: 4, right: 28, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" />
                <XAxis dataKey="Jahr" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}ct`} />
                <Tooltip contentStyle={{ background: '#181c22', border: '1px solid #263040', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#64748b' }} />
                <Bar dataKey="EEG-Vergütung" fill="#22c55e" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="Haushaltspreis" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Marktwert Solar" stroke="#38bdf8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
            {latest && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <InfoCard
                  title="Eigenverbrauchswert"
                  value={latest.householdWorkEurKwh ? `${(latest.householdWorkEurKwh * 100).toFixed(1)} ct/kWh` : '—'}
                  subtitle={`Haushaltspreis ${latest.year}`}
                  color="text-amber-400"
                />
                <InfoCard
                  title="EEG-Einspeisung"
                  value={latest.eegTariffEurKwh ? `${(latest.eegTariffEurKwh * 100).toFixed(1)} ct/kWh` : '—'}
                  subtitle={`EEG-Vergütung ${latest.year}`}
                  color="text-green-400"
                />
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

function InfoCard({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: string }) {
  return (
    <div className="bg-gray-700/60 rounded p-2">
      <div className="text-2xs text-slate-500 uppercase tracking-wide">{title}</div>
      <div className={`text-sm font-mono font-bold mt-0.5 ${color}`}>{value}</div>
      <div className="text-2xs text-slate-600 mt-0.5">{subtitle}</div>
    </div>
  )
}
