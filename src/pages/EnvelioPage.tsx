import { useState, useEffect } from 'react'
import { Card, CardHeader } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import { DataLoading, DataError, DataEmpty } from '../components/ui/DataState'
import { useApi } from '../hooks/useApi'
import { getFlexbandResources, getFlexband } from '../api/envelio'
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'

const tt = {
  contentStyle: { background: '#1e2433', border: '1px solid #334155', borderRadius: 6, fontSize: 11 },
  labelStyle: { color: '#94a3b8' },
}

function fmtTs(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export function EnvelioPage() {
  const { data: resourcesResp, loading: resourcesLoading, error: resourcesError } = useApi(
    () => getFlexbandResources(), [],
  )

  const resources = resourcesResp?.data ?? []
  const [selectedResource, setSelectedResource] = useState<string>('')

  useEffect(() => {
    if (resources.length > 0 && !selectedResource) {
      setSelectedResource(resources[0].selector)
    }
  }, [resources, selectedResource])

  const { data: flexResp, loading: flexLoading, error: flexError } = useApi(
    () => (selectedResource ? getFlexband({ resource: selectedResource, limit: 500 }) : Promise.resolve(null)),
    [selectedResource],
  )

  const flexData = flexResp?.data ?? []

  const chartData = flexData.map(p => ({
    label: fmtTs(p.ts),
    powerMin: p.powerMinKw,
    powerMax: p.powerMaxKw,
    band: [p.powerMinKw, p.powerMaxKw] as [number, number],
  }))

  const resourceOptions = resources.map(r => ({ value: r.selector, label: r.selector }))

  const selectorType = resources.find(r => r.selector === selectedResource)?.selectorType ?? ''

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">Envelio Flexband</h1>
          <p className="text-2xs text-slate-500 mt-0.5">envelio_flexband_raw — Steuerbare Ressourcen</p>
        </div>
        {!resourcesLoading && resources.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-2xs text-slate-500">Resource</span>
            <Select
              options={resourceOptions}
              value={selectedResource}
              onChange={e => setSelectedResource(e.target.value)}
              className="min-w-[260px]"
            />
            {selectorType && (
              <span className="text-2xs text-slate-400 bg-gray-800/50 px-2 py-0.5 rounded border border-gray-700/40">
                {selectorType}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {resourcesLoading && <DataLoading label="Lade Ressourcen…" />}
        {resourcesError && <DataError message={resourcesError} />}

        {!resourcesLoading && resources.length === 0 && (
          <DataEmpty label="Keine Ressourcen gefunden" hint="envelio_flexband_raw enthält keine Datensätze." />
        )}

        {!resourcesLoading && resources.length > 0 && (
          <>
            {/* Flexband — min/max area chart */}
            <Card>
              <CardHeader title="Flexband — Power Min / Max (kW)" />
              {flexLoading && <DataLoading />}
              {flexError && <DataError message={flexError} />}
              {!flexLoading && !flexError && flexData.length === 0 && (
                <DataEmpty hint={`Keine Daten für Resource: ${selectedResource}`} />
              )}
              {!flexLoading && !flexError && flexData.length > 0 && (
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} interval={Math.floor(chartData.length / 10)} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} unit=" kW" />
                    <Tooltip {...tt} formatter={(v: number, name: string) => {
                      const labels: Record<string, string> = { powerMin: 'Min kW', powerMax: 'Max kW' }
                      return [`${v.toFixed(2)} kW`, labels[name] ?? name]
                    }} />
                    <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />
                    <Area type="monotone" dataKey="powerMax" stroke="#22c55e" fill="#22c55e15" strokeWidth={1.5} dot={false} name="powerMax" />
                    <Area type="monotone" dataKey="powerMin" stroke="#3b82f6" fill="#3b82f615" strokeWidth={1.5} dot={false} name="powerMin" />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Spread: max - min */}
            <Card>
              <CardHeader title="Flexband-Bandbreite — Max − Min (kW)" />
              {!flexLoading && !flexError && flexData.length > 0 && (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData.map(d => ({ ...d, spread: d.powerMax - d.powerMin }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} interval={Math.floor(chartData.length / 10)} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} unit=" kW" />
                    <Tooltip {...tt} formatter={(v: number) => [`${v.toFixed(2)} kW`, 'Bandbreite']} />
                    <Bar dataKey="spread" fill="#a855f7" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {(flexLoading || flexData.length === 0) && !flexError && (
                flexLoading ? <DataLoading /> : <DataEmpty hint="Keine Daten für diese Ressource." />
              )}
            </Card>

            {/* Summary stats */}
            {!flexLoading && flexData.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Ø Power Min', value: (flexData.reduce((s, d) => s + d.powerMinKw, 0) / flexData.length).toFixed(1), unit: 'kW', color: 'text-blue-400' },
                  { label: 'Ø Power Max', value: (flexData.reduce((s, d) => s + d.powerMaxKw, 0) / flexData.length).toFixed(1), unit: 'kW', color: 'text-green-400' },
                  { label: 'Min Power Min', value: Math.min(...flexData.map(d => d.powerMinKw)).toFixed(1), unit: 'kW', color: 'text-red-400' },
                  { label: 'Max Power Max', value: Math.max(...flexData.map(d => d.powerMaxKw)).toFixed(1), unit: 'kW', color: 'text-amber-400' },
                ].map(stat => (
                  <Card key={stat.label}>
                    <div className="p-3 text-center">
                      <div className="text-2xs text-slate-500 mb-1">{stat.label}</div>
                      <div className={`text-base font-mono font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-2xs text-slate-500">{stat.unit}</div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Data table */}
            {!flexLoading && flexData.length > 0 && (
              <Card>
                <CardHeader title={`Rohdaten — ${flexData.length} Messpunkte`} />
                <div className="overflow-auto max-h-64">
                  <table className="w-full text-2xs">
                    <thead className="bg-gray-800/70 sticky top-0">
                      <tr>
                        {['Zeitpunkt (UTC)', 'Power Min (kW)', 'Power Max (kW)', 'Bandbreite (kW)'].map(h => (
                          <th key={h} className="px-3 py-1.5 text-left text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {flexData.map((row, i) => (
                        <tr key={i} className="border-t border-gray-700/40 hover:bg-gray-700/30">
                          <td className="px-3 py-1 text-slate-400 font-mono">{fmtTs(row.ts)}</td>
                          <td className="px-3 py-1 font-mono text-blue-400">{row.powerMinKw.toFixed(2)}</td>
                          <td className="px-3 py-1 font-mono text-green-400">{row.powerMaxKw.toFixed(2)}</td>
                          <td className="px-3 py-1 font-mono text-purple-400">{(row.powerMaxKw - row.powerMinKw).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
