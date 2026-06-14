import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { BALANCING_GROUPS } from '../lib/constants'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  ComposedChart, Line, Legend, BarChart, Bar,
} from 'recharts'
import { useApi } from '../hooks/useApi'
import { getRebapPrices } from '../api/market'
import { DataPanel } from '../components/ui/DataState'
import { useRefresh } from '../context/RefreshContext'
import { fmtEur } from '../lib/format'

const BG_DATA = BALANCING_GROUPS.map(bg => ({
  id: bg,
  exposure: 0,
  costRisk: 0,
  deliveredMWh: 0,
  scheduledMWh: 0,
  status: 'balanced' as const,
}))

export function BalancingGroupPage() {
  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      {/* Header */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Gesamtexposition" value="+0.84 MWh" color="text-amber-400" sub="Long-Position" />
        <KpiCard label="Kostrisiko reBAP" value="312 €" color="text-amber-400" sub="bei akt. reBAP-Preis" />
        <KpiCard label="Aktive Bilanzkreise" value="9" color="text-blue-400" sub="alle aktiv" />
        <KpiCard label="Settle-Fähig" value="8 / 9" color="text-green-400" sub="1 BK fehlt Telemetrie" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* BK Overview */}
        <div className="col-span-12 lg:col-span-5">
          <Card>
            <CardHeader title="Bilanzkreis-Übersicht" subtitle="Expositions-Matrix" />
            <div className="divide-y divide-border-subtle/40">
              {BG_DATA.map(bg => (
                <div key={bg.id} className="px-3 py-2 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-2xs text-blue-400">{bg.id}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PositionBar exposure={bg.exposure} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={bg.status === 'balanced' ? 'green' : bg.status === 'long' ? 'amber' : 'blue'}>
                      {bg.status === 'balanced' ? 'Ausgegl.' : bg.status === 'long' ? 'Long' : 'Short'}
                    </Badge>
                    <span className={`font-mono text-2xs ${bg.exposure > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                      {bg.exposure > 0 ? '+' : ''}{bg.exposure.toFixed(2)} MWh
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Imbalance chart */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <ImbalanceChart />
          <DispatchBKImpact />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ScheduleVsDelivered />
        <ExplanatoryPanel />
      </div>
    </div>
  )
}

function KpiCard({ label, value, color, sub }: { label: string; value: string; color: string; sub: string }) {
  return (
    <Card className="p-3">
      <div className="text-2xs text-slate-500 uppercase">{label}</div>
      <div className={`text-xl font-mono font-bold mt-1 ${color}`}>{value}</div>
      <div className="text-2xs text-slate-600 mt-0.5">{sub}</div>
    </Card>
  )
}

function PositionBar({ exposure }: { exposure: number }) {
  const pct = Math.min(Math.abs(exposure) * 25, 100)
  return (
    <div className="flex items-center gap-1 w-full">
      <div className="flex-1 flex items-center">
        <div className="w-full h-1 bg-gray-600/60 rounded-full overflow-hidden">
          <div
            className={`h-1 rounded-full ${exposure > 0 ? 'bg-amber-400' : 'bg-blue-400'} ml-auto`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function ImbalanceChart() {
  const { marketRefreshKey } = useRefresh()
  const { data: rebapResp, loading } = useApi(() => getRebapPrices({ limit: 96 }), [marketRefreshKey])

  const chartData = (rebapResp?.data ?? []).map(r => ({
    time: new Date(r.quarterUtc).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    reBAP: r.rebapEurMwh,
  }))

  return (
    <Card>
      <CardHeader title="reBAP – Verlauf letzte 24h" subtitle="Ausgleichsenergiepreis in €/MWh — netztransparenz.de" />
      <div className="p-3">
        <DataPanel loading={loading} empty={!loading && chartData.length === 0}
          freshness={rebapResp?.meta.freshness}
          emptyHint="netztransparenz.de Sync erforderlich">
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 28, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} interval={15} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} unit=" €" />
              <Tooltip contentStyle={{ background: '#181c22', border: '1px solid #263040', borderRadius: 8, fontSize: 11 }} />
              <ReferenceLine y={0} stroke="#374357" />
              <Area type="monotone" dataKey="reBAP" stroke="#f59e0b" fill="#f59e0b15" strokeWidth={1.5} dot={false} name="reBAP" />
            </ComposedChart>
          </ResponsiveContainer>
        </DataPanel>
      </div>
    </Card>
  )
}

function DispatchBKImpact() {
  return (
    <Card>
      <CardHeader title="Dispatch-Einfluss auf Bilanzkreis" subtitle="Beiträge aktiver Aktivierungen" />
      <div className="p-4 text-center text-2xs text-slate-500">
        Keine aktiven Aktivierungen — Echtzeit-Telemetrie nicht verbunden
      </div>
    </Card>
  )
}

function ScheduleVsDelivered() {
  const data = BG_DATA.slice(0, 6).map(bg => ({
    bg: bg.id.replace('BG-FSP-', ''),
    Fahrplan: bg.scheduledMWh.toFixed(1),
    Lieferung: bg.deliveredMWh.toFixed(1),
  }))
  return (
    <Card>
      <CardHeader title="Fahrplan vs. Lieferung" subtitle="Je Bilanzkreis · MWh" />
      <div className="p-3">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" />
            <XAxis dataKey="bg" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}MWh`} />
            <Tooltip contentStyle={{ background: '#181c22', border: '1px solid #263040', borderRadius: 8, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10, color: '#64748b' }} />
            <Bar dataKey="Fahrplan" fill="#374357" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Lieferung" fill="#38bdf8" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function ExplanatoryPanel() {
  return (
    <Card className="p-3">
      <div className="text-xs font-semibold text-slate-200 mb-3">Wie Spot, Reserve und reBAP zusammenwirken</div>
      <div className="space-y-2.5 text-2xs text-slate-400">
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
          <p><strong className="text-slate-200">Day-Ahead Fahrplan:</strong> Das FSP meldet bis D-1 12:00 Uhr einen Einspeise-/Abnahmefahrplan. Abweichungen davon werden als Bilanzkreisungleichgewicht sichtbar.</p>
        </div>
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
          <p><strong className="text-slate-200">Regelreserveaktivierung:</strong> Wenn das FSP aFRR-up aktiviert, erhöht es die Einspeisung. Dies kann den Bilanzkreis ausgleichen oder in die Gegenrichtung treiben – je nach Vorzeichen der Netzdisposition.</p>
        </div>
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0" />
          <p><strong className="text-slate-200">reBAP-Kostenrisiko:</strong> Verbleibende Ungleichgewichte werden zum reBAP-Preis abgerechnet. Bei volatilen reBAP-Phasen (z.B. 2022: ∅ 124 €/MWh) entstehen erhebliche Kosten.</p>
        </div>
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1 flex-shrink-0" />
          <p><strong className="text-slate-200">Optimum:</strong> Spot-Handel + Reserve-Vorhaltung so abgestimmen, dass der Bilanzkreis im DA-Fahrplan nahezu ausgeglichen ist – und Reserve-Aktivierungen diesen neutralisieren.</p>
        </div>
      </div>
    </Card>
  )
}
