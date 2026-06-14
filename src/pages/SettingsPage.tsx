import { useState } from 'react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Tabs } from '../components/ui/Tabs'
import { DATA_SOURCES, APP_NAME, APP_VERSION, OPERATOR_NAME } from '../lib/constants'
import { CheckCircle, Database, RefreshCw, Globe } from 'lucide-react'
import { SourceHealthPanel } from '../components/market/SourceHealthPanel'

export function SettingsPage() {
  const [tab, setTab] = useState('data_catalog')

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-900">{APP_NAME}</h1>
          <div className="text-2xs text-slate-500 mt-0.5">{OPERATOR_NAME} · v{APP_VERSION}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-2xs text-green-400">Alle Datenquellen verbunden</span>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'source_health', label: 'Quellstatus' },
          { id: 'data_catalog', label: 'Datenkatalog' },
          { id: 'regions', label: 'Regionszuordnung' },
          { id: 'preferences', label: 'Einstellungen' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'source_health' && <SourceHealthPanel />}
      {tab === 'data_catalog' && <DataCatalog />}
      {tab === 'regions' && <RegionMappings />}
      {tab === 'preferences' && <Preferences />}
    </div>
  )
}

function DataCatalog() {
  return (
    <div className="space-y-3">
      <div className="text-2xs text-slate-500 uppercase tracking-wide flex items-center gap-2">
        <Database size={12} />
        <span>Datenquellen-Katalog ({DATA_SOURCES.length} Quellen)</span>
      </div>
      {DATA_SOURCES.map(source => (
        <Card key={source.id} className="p-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-200">{source.name}</span>
              </div>
              <p className="text-2xs text-slate-500 mb-2">{source.purpose}</p>
              <div className="flex gap-1.5 flex-wrap">
                {source.fields.map(f => (
                  <span key={f} className="text-2xs bg-gray-700/50 border border-gray-600/50 rounded px-1.5 py-0.5 text-slate-400 font-mono">{f}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
              <div className="flex items-center gap-1">
                <RefreshCw size={10} className="text-slate-600" />
                <span className="text-2xs text-slate-500 font-mono">{source.freshness}</span>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {source.usedFor.map(u => (
                  <Badge key={u} variant={u === 'operations' ? 'blue' : u === 'settlement' ? 'green' : u === 'pricing' ? 'amber' : 'slate'}>
                    {u === 'operations' ? 'Betrieb' : u === 'analytics' ? 'Analyse' : u === 'settlement' ? 'Abrechnung' : u === 'regional_mapping' ? 'Region' : u === 'pricing' ? 'Pricing' : u}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function RegionMappings() {
  const mappings = [
    { vnb: 'EWE Netz GmbH', tso: '50Hertz', planningRegion: 'Planungsregion Nord-Ost', state: 'Niedersachsen, Brandenburg' },
    { vnb: 'Schleswig-Holstein Netz GmbH', tso: 'TenneT', planningRegion: 'Planungsregion Nord-West', state: 'Schleswig-Holstein' },
    { vnb: 'Netze BW GmbH', tso: 'TransnetBW', planningRegion: 'Planungsregion Süd-West', state: 'Baden-Württemberg' },
    { vnb: 'Westnetz GmbH', tso: 'Amprion', planningRegion: 'Planungsregion West-Rhein', state: 'NRW, Rheinland' },
    { vnb: 'MITNETZ Strom mbH', tso: '50Hertz', planningRegion: 'Planungsregion Mitte-Ost', state: 'Sachsen, Thüringen, SA' },
    { vnb: 'LEW Verteilnetz GmbH', tso: 'TenneT', planningRegion: 'Planungsregion Süd-Ost', state: 'Bayern' },
  ]

  return (
    <Card>
      <CardHeader title="VNB-Zuordnungsmatrix" subtitle="VNBdigital-basierte Planungsregionen" icon={<Globe size={13} />} />
      <div className="overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-700/40">
              {['VNB Netzbetreiber', 'ÜNB', 'Planungsregion', 'Bundesland'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-2xs text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mappings.map((m, i) => (
              <tr key={i} className="border-b border-gray-700/40 hover:bg-gray-700/50">
                <td className="px-3 py-2 text-slate-200">{m.vnb}</td>
                <td className="px-3 py-2 font-mono text-blue-400 text-2xs">{m.tso}</td>
                <td className="px-3 py-2 text-slate-400 text-2xs">{m.planningRegion}</td>
                <td className="px-3 py-2 text-slate-500 text-2xs">{m.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Preferences() {
  const prefs = [
    { label: 'Standardregion', value: 'DE gesamt', type: 'select' },
    { label: 'Standard-Zeithorizont', value: 'Heute', type: 'select' },
    { label: 'Karte: Standard-Layer', value: 'Assets + Engpässe', type: 'select' },
    { label: 'Telemetrie-Refresh', value: '30 Sekunden', type: 'select' },
    { label: 'Compliance-Warnschwelle', value: '85%', type: 'number' },
    { label: 'Telemetrie-Staleness-Grenze', value: '20 Minuten', type: 'select' },
    { label: 'reBAP-Risikoalarm', value: '100 €/MWh', type: 'number' },
  ]
  return (
    <Card>
      <CardHeader title="UI-Einstellungen" />
      <div className="divide-y divide-gray-700/40">
        {prefs.map(p => (
          <div key={p.label} className="px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs text-slate-300">{p.label}</span>
            <span className="font-mono text-xs text-slate-400 bg-gray-700/50 border border-gray-600/50 rounded px-2 py-1">
              {p.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
