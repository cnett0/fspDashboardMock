import { useState } from 'react'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { AssetTable } from '../components/fsp/AssetTable'
import { AssetInspector } from '../components/fsp/AssetInspector'
import { FlexOfferPanel } from '../components/fsp/FlexOfferPanel'
import { FlexBaselineChart } from '../components/fsp/FlexBaselineChart'
import { RegionalFilterBar } from '../components/fsp/RegionalFilterBar'
import { GridRelevancePanel } from '../components/fsp/GridRelevancePanel'
import { RightInspector } from '../layout/RightInspector'
import { Tabs } from '../components/ui/Tabs'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { GermanyGridMap } from '../components/map/GermanyGridMap'
import { fmtPower, fmtEnergy } from '../lib/format'
import { TelemetryBadge, ControllabilityBadge } from '../components/ui/Badge'
import { useApi } from '../hooks/useApi'
import { getAssets } from '../api/assets'
import type { Asset } from '../types/api'
import { assetControllability, assetTelemetryFreshness } from '../types/api'
import { ASSET_TYPE_LABELS, ASSET_TYPE_COLORS } from '../lib/constants'
import { DataLoading } from '../components/ui/DataState'
import { useRefresh } from '../context/RefreshContext'
import { VALIDATION_SUMMARY, VALIDATION_TABLE_ROWS } from '../data/fspMockData'

type Filters = {
  search?: string
  tsoRegion?: string
  vnbOperator?: string
  assetType?: string
  complianceState?: string
  controllability?: string
}

export function AssetsPage() {
  const [filters, setFilters] = useState<Filters>({})
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [viewMode, setViewMode] = useState('table')
  const { assetRefreshKey } = useRefresh()

  const { data, loading } = useApi(() => getAssets(), [assetRefreshKey])
  const assets = data ?? []

  const onlineCount = assets.filter(a => a.status === 'active' && a.controllable).length
  const isFlexView = viewMode === 'flex'
  const isCompareView = viewMode === 'compare'
  const isFullWidth = isFlexView || isCompareView

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 bg-gradient-to-br from-gray-600 to-gray-900 space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-white">Asset Portfolio</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-2xs text-slate-500">{assets.length} assets registered</span>
              <span className="text-2xs text-green-400">{onlineCount} active</span>
              <span className="px-1.5 py-0.5 rounded text-2xs bg-green-900/30 text-green-400 border border-green-700/40">CBP-ready</span>
              <span className="px-1.5 py-0.5 rounded text-2xs bg-blue-900/30 text-blue-400 border border-blue-700/40">15-min validation</span>
            </div>
          </div>
          <Tabs
            tabs={[
              { id: 'table', label: 'Table' },
              { id: 'cards', label: 'Cards' },
              { id: 'map', label: 'Map' },
              { id: 'flex', label: 'Flex View' },
              { id: 'compare', label: 'Baseline Compare' },
            ]}
            activeTab={viewMode}
            onChange={setViewMode}
          />
        </div>
        {!isFullWidth && <RegionalFilterBar filters={filters} onChange={setFilters} />}
      </div>

      {/* TSO Validation view — full width */}
      {isFlexView && (
        <div className="flex-1 overflow-auto p-3">
          {loading && <DataLoading />}
          {!loading && selectedAsset && (
            <div className="space-y-3">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-2xs text-slate-500">
                <button onClick={() => setViewMode('table')} className="hover:text-blue-400 transition-colors">
                  Asset Portfolio
                </button>
                <ChevronRight size={10} />
                <span className="text-slate-300 font-mono font-semibold">{selectedAsset.assetCode}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">{selectedAsset.name}</span>
              </div>
              {/* TSO Validation header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Flex View</h2>
                  <p className="text-2xs text-slate-500">Grid Baseline · Flexibility Band · Measured Delivery — 15-min resolution</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-2xs bg-green-900/30 text-green-400 border border-green-700/40">Baseline submitted</span>
                  <span className="px-2 py-0.5 rounded text-2xs bg-blue-900/30 text-blue-400 border border-blue-700/40">Activation traceable</span>
                  <span className="px-2 py-0.5 rounded text-2xs bg-purple-900/30 text-purple-400 border border-purple-700/40">First-mover FSP</span>
                </div>
              </div>
              {/* Summary KPI row */}
              <ValidationSummaryRow />
              {/* Main chart */}
              <FlexOfferPanel asset={selectedAsset} />
              {/* Validation table */}
              <ValidationDetailTable />
            </div>
          )}
          {!loading && !selectedAsset && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <ShieldCheck size={32} className="text-slate-700" />
              <p className="text-sm text-slate-400">No asset selected</p>
              <p className="text-2xs text-slate-600 max-w-xs">
                Select an asset from the table or map view to see its Flex View data.
              </p>
              <button onClick={() => setViewMode('table')} className="mt-1 text-2xs text-blue-400 hover:underline">
                Go to table →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Vergleich view — full width, no right inspector */}
      {isCompareView && (
        <div className="flex-1 overflow-auto p-3">
          {loading && <DataLoading />}
          {!loading && selectedAsset && (
            <>
              <div className="flex items-center gap-1.5 mb-3 text-2xs text-slate-500">
                <button
                  onClick={() => setViewMode('table')}
                  className="hover:text-blue-400 transition-colors"
                >
                  Asset-Portfolio
                </button>
                <ChevronRight size={10} />
                <span className="text-slate-300 font-mono font-semibold">{selectedAsset.assetCode}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">{selectedAsset.name}</span>
              </div>
              <FlexBaselineChart asset={selectedAsset} />
            </>
          )}
          {!loading && !selectedAsset && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <p className="text-sm text-slate-400">Kein Asset ausgewählt</p>
              <p className="text-2xs text-slate-600 max-w-xs">
                Wähle zuerst ein Asset in der Tabellen- oder Kartenansicht aus, um den Baseline-Vergleich zu sehen.
              </p>
              <button
                onClick={() => setViewMode('table')}
                className="mt-1 text-2xs text-blue-400 hover:underline"
              >
                Zur Tabelle →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table / Cards / Map views — with right inspector */}
      {!isFullWidth && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {loading && <div className="p-4"><DataLoading /></div>}
            {!loading && viewMode === 'table' && (
              <div className="h-full overflow-auto">
                <AssetTable
                  assets={assets}
                  filter={filters}
                  onSelect={a => {
                    setSelectedAsset(a)
                  }}
                  selectedId={selectedAsset?.id}
                />
              </div>
            )}
            {!loading && viewMode === 'cards' && (
              <div className="h-full overflow-auto p-3 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {assets.map(asset => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    selected={selectedAsset?.id === asset.id}
                    onSelect={() => setSelectedAsset(asset)}
                  />
                ))}
                {assets.length === 0 && (
                  <div className="col-span-4 py-12 text-center text-slate-600 text-sm">
                    Keine Assets registriert
                  </div>
                )}
              </div>
            )}
            {!loading && viewMode === 'map' && (
              <GermanyGridMap
                onAssetSelect={setSelectedAsset}
                selectedAssetId={selectedAsset?.id}
                height="100%"
              />
            )}
          </div>

          <RightInspector
            open={selectedAsset !== null}
            onClose={() => setSelectedAsset(null)}
            title="Asset Inspector"
          >
            {selectedAsset && (
              <>
                <AssetInspector asset={selectedAsset} />
                {/* Quick-jump to flex view for this asset */}
                {selectedAsset.flexAssetIds?.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1">
                    <button
                      onClick={() => setViewMode('flex')}
                      className="w-full px-3 py-2 rounded panel text-2xs text-blue-400 hover:bg-gray-700/50 transition-colors text-left flex items-center justify-between"
                    >
                      <span>Flex-Angebote ansehen</span>
                      <ChevronRight size={12} />
                    </button>
                    <button
                      onClick={() => setViewMode('compare')}
                      className="w-full px-3 py-2 rounded panel text-2xs text-blue-400 hover:bg-gray-700/50 transition-colors text-left flex items-center justify-between"
                    >
                      <span>Baseline-Vergleich ansehen</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </>
            )}
          </RightInspector>
        </div>
      )}
    </div>
  )
}

function AssetCard({ asset, selected, onSelect }: { asset: Asset; selected: boolean; onSelect: () => void }) {
  const color = ASSET_TYPE_COLORS[asset.assetType] ?? '#64748b'
  return (
    <Card selected={selected} onClick={onSelect} className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-mono text-blue-400 text-2xs">{asset.assetCode}</span>
          </div>
          <div className="text-xs font-semibold text-slate-200 leading-snug">{asset.name}</div>
          <div className="text-2xs text-slate-500 mt-0.5">{asset.city}</div>
        </div>
        <ControllabilityBadge status={assetControllability(asset)} />
      </div>

      <div className="flex gap-2 flex-wrap mb-2">
        <Badge variant="slate">{ASSET_TYPE_LABELS[asset.assetType] ?? asset.assetType}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <div className="flex justify-between text-2xs">
          <span className="text-slate-600">Flex ↑</span>
          <span className="font-mono text-green-400">{fmtPower(asset.availableFlexUpKw)}</span>
        </div>
        <div className="flex justify-between text-2xs">
          <span className="text-slate-600">Flex ↓</span>
          <span className="font-mono text-blue-400">{fmtPower(asset.availableFlexDownKw)}</span>
        </div>
        <div className="flex justify-between text-2xs">
          <span className="text-slate-600">Energie</span>
          <span className="font-mono text-slate-400">{fmtEnergy(asset.availableEnergyKwh)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/40">
        <TelemetryBadge freshness={assetTelemetryFreshness(asset)} />
        <span className="text-2xs text-slate-600">{asset.vnbOperator ?? '—'}</span>
      </div>
    </Card>
  )
}

// ── Validation Summary Row ────────────────────────────────────────────────────

function ValidationSummaryRow() {
  const s = VALIDATION_SUMMARY
  const items = [
    { label: 'Baseline Quality', value: `${s.baselineQualityPct}%`, color: 'text-green-400' },
    { label: 'Forecast Confidence', value: `${s.forecastConfidencePct}%`, color: 'text-blue-400' },
    { label: 'Flexband Compliance', value: `${s.flexbandCompliancePct}%`, color: 'text-green-400' },
    { label: 'Delivery Risk', value: s.deliveryRisk, color: 'text-green-400' },
    { label: 'RMS Deviation', value: `${s.rmsDeviationKw} kW`, color: 'text-slate-300' },
    { label: 'Available RDV+', value: `${s.availableFlexUpKw} kW`, color: 'text-green-400' },
    { label: 'Available RDV−', value: `${s.availableFlexDownKw} kW`, color: 'text-blue-400' },
  ]
  return (
    <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
      {items.map(m => (
        <div key={m.label} className="panel p-2">
          <div className="text-2xs text-slate-500">{m.label}</div>
          <div className={`font-mono text-xs font-bold mt-0.5 ${m.color}`}>{m.value}</div>
        </div>
      ))}
    </div>
  )
}

// ── Validation Detail Table ───────────────────────────────────────────────────

function ValidationDetailTable() {
  return (
    <Card>
      <CardHeader
        title="Delivery Validation — 15-min Resolution"
        subtitle="Grid Baseline vs Measured Delivery vs Flexibility Band"
        icon={<ShieldCheck size={13} />}
      />
      <div className="overflow-auto">
        <table className="w-full text-2xs">
          <thead>
            <tr className="bg-gray-800/60 text-slate-500 text-left">
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Grid Baseline</th>
              <th className="px-3 py-2 font-medium">Measured Grid</th>
              <th className="px-3 py-2 font-medium">Deviation</th>
              <th className="px-3 py-2 font-medium">Flexibility Band</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {VALIDATION_TABLE_ROWS.map(row => (
              <tr key={row.time} className="border-t border-gray-700/30 hover:bg-gray-800/30">
                <td className="px-3 py-2 font-mono text-slate-400">{row.time}</td>
                <td className="px-3 py-2 font-mono text-slate-300">{row.baselineKw} kW</td>
                <td className="px-3 py-2 font-mono text-blue-400">{row.measuredKw} kW</td>
                <td className={`px-3 py-2 font-mono ${Math.abs(row.deviationKw) > 1 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {row.deviationKw >= 0 ? '+' : ''}{row.deviationKw} kW
                </td>
                <td className="px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded bg-green-900/20 text-green-400 border border-green-700/30 text-2xs">
                    {row.flexbandStatus}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${
                    row.status === 'OK'
                      ? 'bg-green-900/20 text-green-400 border border-green-700/30'
                      : 'bg-red-900/20 text-red-400 border border-red-700/30'
                  }`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-2 border-t border-gray-700/30 flex items-center gap-4 text-2xs text-slate-600">
        <span>Grid Baseline: scheduled grid consumption from planning data</span>
        <span>·</span>
        <span>Flexibility Band: Envelio flexband (Pmin/Pmax envelope)</span>
        <span>·</span>
        <span>RDV+ / RDV−: available upward/downward redispatch per slot</span>
      </div>
    </Card>
  )
}
