import { useState } from 'react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Tabs } from '../components/ui/Tabs'
import { getStrategyRecommendation } from '../lib/market'
import { fmtEurMWh } from '../lib/format'
import { useApi } from '../hooks/useApi'
import { getSpotPrices, getRebapPrices } from '../api/market'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'

const FCR_PRICE = 6.24
const AFRR_UP = 14.82

export function PricingSignalsPage() {
  const [tab, setTab] = useState('strategies')

  const { data: spotResp } = useApi(() => getSpotPrices({ limit: 1 }), [])
  const { data: rebapResp } = useApi(() => getRebapPrices({ limit: 1 }), [])

  const spot = spotResp?.data?.[0]?.priceEurMwh ?? 0
  const rebap = rebapResp?.data?.[0]?.rebapEurMwh ?? 0

  const strategies = [
    {
      id: 'spot_export',
      title: 'Spot-Einspeisung',
      score: spot > 80 ? 92 : spot > 50 ? 68 : 34,
      condition: `DA Spot: ${fmtEurMWh(spot)}`,
      description: 'Batterie entladen und ins Netz einspeisen bei hohem Spotpreis.',
      signals: ['spot', 'rebap'],
      color: '#38bdf8',
      active: spot > 60,
    },
    {
      id: 'absorb_surplus',
      title: 'Lokaler Überschuss',
      score: spot < 30 ? 87 : 42,
      condition: 'PV-Eigenverbrauch + Ladung',
      description: 'Bei niedrigem Spotpreis Batterie laden und PV-Einspeisung abpuffern.',
      signals: ['spot', 'solar', 'variable_grid'],
      color: '#22c55e',
      active: spot < 30,
    },
    {
      id: 'reserve_fcr',
      title: 'FCR-Vorhaltung',
      score: FCR_PRICE > 8 ? 88 : FCR_PRICE > 5 ? 72 : 48,
      condition: `FCR: ${FCR_PRICE} €/MW/h`,
      description: 'Batterie für FCR-Vorhaltung reservieren – Kapazitätsprämie ohne Aktivierung.',
      signals: ['fcr'],
      color: '#a855f7',
      active: FCR_PRICE > 5,
    },
    {
      id: 'congestion_local',
      title: 'Lokale Engpasshilfe',
      score: 78,
      condition: 'Engpass aktiv',
      description: 'Flex für VNB-seitige Engpassbehebung bereitstellen – Netzdienlichkeit priorisieren.',
      signals: ['congestion', 'variable_grid'],
      color: '#f59e0b',
      active: true,
    },
    {
      id: 'protect_bk',
      title: 'Bilanzkreis schützen',
      score: Math.abs(rebap) > 80 ? 91 : 55,
      condition: `reBAP: ${fmtEurMWh(rebap)}`,
      description: 'Bilanzkreisausgleich priorisieren um reBAP-Kosten zu vermeiden.',
      signals: ['rebap'],
      color: '#ef4444',
      active: Math.abs(rebap) > 60,
    },
    {
      id: 'self_consumption',
      title: 'Eigenverbrauch',
      score: 65,
      condition: 'Haushaltspreis: 34.8 ct/kWh',
      description: 'Eigenverbrauch von PV-Strom maximieren – vermiedener Netzbezug > EEG-Vergütung.',
      signals: ['solar', 'variable_grid'],
      color: '#facc15',
      active: false,
    },
  ]

  const signalData = [
    { name: 'Spot (DA)', value: spot, unit: '€/MWh', color: '#38bdf8', weight: spot > 60 ? 3 : 1 },
    { name: 'FCR Kap.', value: FCR_PRICE * 10, unit: '€/MW', color: '#a855f7', weight: FCR_PRICE > 7 ? 3 : 1 },
    { name: 'aFRR↑ Kap.', value: AFRR_UP * 5, unit: '€/MW', color: '#22c55e', weight: 2 },
    { name: 'reBAP', value: Math.abs(rebap), unit: '€/MWh', color: '#f59e0b', weight: Math.abs(rebap) > 80 ? 3 : 1 },
    { name: 'Niedrigtarif', value: 3.84 * 10, unit: 'ct/kWh', color: '#64748b', weight: 1 },
    { name: 'Hochtarif', value: 8.47 * 10, unit: 'ct/kWh', color: '#ef4444', weight: 1 },
  ]

  const recommendation = getStrategyRecommendation(spot, rebap, FCR_PRICE)

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      {/* Current recommendation */}
      <Card className="border-l-4 border-l-blue-500 p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-2xs text-slate-500 uppercase tracking-wide">Aktuelle Empfehlung</span>
        </div>
        <div className="text-sm font-semibold text-slate-100 mt-1">{recommendation}</div>
        <div className="flex gap-3 mt-1.5">
          <SignalPill label="Spot" value={fmtEurMWh(spot)} color={spot > 80 ? 'text-amber-400' : 'text-green-400'} />
          <SignalPill label="reBAP" value={fmtEurMWh(rebap)} color={Math.abs(rebap) > 80 ? 'text-red-400' : 'text-blue-400'} />
          <SignalPill label="FCR" value={`${FCR_PRICE} €/MW`} color="text-purple-400" />
        </div>
      </Card>

      <Tabs
        tabs={[{ id: 'strategies', label: 'Strategien' }, { id: 'signals', label: 'Signalvergleich' }, { id: 'radar', label: 'Radar' }]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'strategies' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {strategies.sort((a, b) => b.score - a.score).map(s => (
            <StrategyCard key={s.id} strategy={s} />
          ))}
        </div>
      )}

      {tab === 'signals' && (
        <div className="space-y-4">
          <SignalBarChart data={signalData} />
          <SignalTable data={signalData} />
        </div>
      )}

      {tab === 'radar' && (
        <div className="grid grid-cols-2 gap-4">
          <SignalRadar data={signalData} />
          <ScenarioPanel />
        </div>
      )}
    </div>
  )
}

function StrategyCard({ strategy }: { strategy: { title: string; score: number; condition: string; description: string; signals: string[]; color: string; active: boolean } }) {
  const isActive = strategy.active
  return (
    <Card className={`p-3 ${isActive ? 'border-l-2' : ''}`} style={{ borderLeftColor: isActive ? strategy.color : undefined }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-xs font-semibold text-slate-200">{strategy.title}</div>
          <div className="text-2xs text-slate-500 mt-0.5">{strategy.condition}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-lg font-mono font-bold" style={{ color: strategy.color }}>{strategy.score}</span>
          {isActive && <Badge variant="green">Aktiv</Badge>}
        </div>
      </div>
      <p className="text-2xs text-slate-500 leading-relaxed">{strategy.description}</p>
      <div className="flex gap-1 flex-wrap mt-2">
        {strategy.signals.map(s => (
          <span key={s} className="text-2xs bg-gray-700/50 border border-gray-700/40 rounded px-1.5 py-0.5 text-slate-400">{s}</span>
        ))}
      </div>
      <div className="mt-2">
        <div className="w-full bg-gray-700/60 rounded-full h-1">
          <div className="h-1 rounded-full" style={{ width: `${strategy.score}%`, backgroundColor: strategy.color }} />
        </div>
      </div>
    </Card>
  )
}

function SignalPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-2xs text-slate-600">{label}:</span>
      <span className={`text-2xs font-mono font-semibold ${color}`}>{value}</span>
    </div>
  )
}

type SignalEntry = { name: string; value: number; unit: string; color: string; weight: number }

function SignalBarChart({ data }: { data: SignalEntry[] }) {
  const chartData = data.map(s => ({ name: s.name, Stärke: s.value, color: s.color }))
  return (
    <Card>
      <CardHeader title="Signalstärke-Vergleich" subtitle="Normierte Attraktivität je Marktsegment" />
      <div className="p-3">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#181c22', border: '1px solid #263040', borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="Stärke" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function SignalTable({ data }: { data: SignalEntry[] }) {
  return (
    <Card>
      <CardHeader title="Preissignale aktuell" />
      <div className="divide-y divide-border-subtle/40">
        {data.map(s => (
          <div key={s.name} className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-slate-300">{s.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-slate-200">{s.value.toFixed(2)} {s.unit}</span>
              <Badge variant={s.weight >= 3 ? 'amber' : s.weight >= 2 ? 'blue' : 'slate'}>
                {s.weight >= 3 ? 'Hoch' : s.weight >= 2 ? 'Mittel' : 'Niedrig'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function SignalRadar({ data }: { data: SignalEntry[] }) {
  const radarData = data.map(s => ({ subject: s.name, A: s.weight * 30 }))
  return (
    <Card>
      <CardHeader title="Signal-Radar" />
      <div className="p-3">
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#1e2733" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b' }} />
            <Radar dataKey="A" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} strokeWidth={1.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function ScenarioPanel() {
  const scenarios = [
    { label: 'Negativpreis-Szenario', desc: 'Spot < 0 €/MWh', action: 'Beladung maximieren, Einspeisung stoppen', risk: 'Niedrig', color: 'text-blue-400' },
    { label: 'Preisspike-Szenario', desc: 'Spot > 150 €/MWh', action: 'Einspeisung priorisieren, FCR pausieren', risk: 'Mittel', color: 'text-amber-400' },
    { label: 'Engpass + hoher reBAP', desc: 'CZ aktiv + reBAP > 100€', action: 'Netzdienliche Flex > Marktoptimierung', risk: 'Hoch', color: 'text-red-400' },
    { label: 'Normalmarkt', desc: '30–70 €/MWh', action: 'Standardstrategie – FCR + Spot-Arbitrage', risk: 'Niedrig', color: 'text-green-400' },
  ]
  return (
    <Card>
      <CardHeader title="Szenario-Vergleich" />
      <div className="divide-y divide-border-subtle/40">
        {scenarios.map(s => (
          <div key={s.label} className="px-3 py-2.5">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-200">{s.label}</span>
              <Badge variant={s.risk === 'Hoch' ? 'red' : s.risk === 'Mittel' ? 'amber' : 'green'}>{s.risk}</Badge>
            </div>
            <div className="text-2xs text-slate-600 mt-0.5">{s.desc}</div>
            <div className={`text-2xs mt-1 ${s.color}`}>{s.action}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
