import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, BarChart2, Zap, ShieldCheck, TrendingUp, Database } from 'lucide-react'
import { KpiStrip } from '../components/fsp/KpiTile'
import { CongestionPanel } from '../components/fsp/CongestionPanel'
import { ComplianceScoreCard } from '../components/fsp/ComplianceScoreCard'
import { EventFeed } from '../components/fsp/EventFeed'
import { DispatchTimeline, ActivationQueue } from '../components/fsp/DispatchTimeline'
import { MarketTicker } from '../components/market/MarketTicker'
import { SpotPriceChart } from '../components/market/SpotPriceChart'
import { Card, CardHeader } from '../components/ui/Card'
import { FspIdentityCard } from '../components/fsp/FspIdentityCard'
import { CbpProcessTracker } from '../components/fsp/CbpProcessTracker'
import { MarketOpportunityPanel } from '../components/fsp/MarketOpportunityPanel'
import { GridRelevancePanel } from '../components/fsp/GridRelevancePanel'
import { ViewToggle, type DemoView } from '../components/fsp/ViewToggle'
import { TSO_REGIONS } from '../lib/constants'
import { OVERVIEW_KPIS } from '../data/fspMockData'
import { useRefresh } from '../context/RefreshContext'

export function OverviewPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<DemoView>('operator')
  const { assetRefreshKey, marketRefreshKey } = useRefresh()
  void assetRefreshKey; void marketRefreshKey

  const kpi = OVERVIEW_KPIS

  const kpiTiles = view === 'redispatch'
    ? [
        { label: 'RDV+ Available', value: `${(kpi.availableFlexUpKw / 1000).toFixed(1)} MW`, color: 'green' as const, subtitle: 'Aggregated upward redispatch' },
        { label: 'RDV− Available', value: `${(kpi.availableFlexDownKw / 1000).toFixed(1)} MW`, color: 'blue' as const, subtitle: 'Aggregated downward redispatch' },
        { label: 'Energy Available', value: `${(kpi.availableEnergyKwh / 1000).toFixed(1)} MWh`, color: 'blue' as const, subtitle: 'Total dispatchable energy' },
        { label: 'Active Assets', value: `${kpi.activeAssets} / ${kpi.registeredAssets}`, color: 'green' as const, subtitle: 'Grid-connected & controllable' },
        { label: 'CBP Readiness', value: `${kpi.cbpReadinessPct}%`, color: 'green' as const, subtitle: 'Process & data readiness' },
        { label: 'Flexband Compliance', value: '94%', color: 'green' as const, subtitle: 'Assets within flexband' },
        { label: 'Validation RMS', value: `${kpi.validationRmsKw} kW`, color: 'green' as const, subtitle: 'Measured vs planned deviation' },
        { label: 'Active Pools', value: `${kpi.activePools} / ${kpi.totalPools}`, color: 'blue' as const, subtitle: 'Grid-relevant pools' },
      ]
    : view === 'portfolio'
    ? [
        { label: 'Portfolio MW ↑', value: `${(kpi.availableFlexUpKw / 1000).toFixed(1)} MW`, color: 'green' as const, subtitle: 'Upward flex available' },
        { label: 'Portfolio MW ↓', value: `${(kpi.availableFlexDownKw / 1000).toFixed(1)} MW`, color: 'blue' as const, subtitle: 'Downward flex available' },
        { label: 'Est. Opportunity', value: '€428', color: 'green' as const, subtitle: 'Today\'s gross value' },
        { label: 'Active Assets', value: `${kpi.activeAssets}`, color: 'green' as const, subtitle: 'First-mover portfolio' },
        { label: 'Product Readiness', value: 'FCR / mFRR', color: 'blue' as const, subtitle: 'CBP products enabled' },
        { label: 'CBP Readiness', value: `${kpi.cbpReadinessPct}%`, color: 'green' as const, subtitle: 'Pilot-ready score' },
        { label: 'Validation Score', value: `${kpi.validationAccuracyPct}%`, color: 'green' as const, subtitle: 'Delivery accuracy' },
        { label: 'Active Pools', value: `${kpi.activePools} / ${kpi.totalPools}`, color: 'blue' as const, subtitle: 'Active pools' },
      ]
    : [
        { label: 'Available RDV+', value: `${(kpi.availableFlexUpKw / 1000).toFixed(1)} MW`, color: 'green' as const, subtitle: 'Aggregated upward flex' },
        { label: 'Available RDV−', value: `${(kpi.availableFlexDownKw / 1000).toFixed(1)} MW`, color: 'blue' as const, subtitle: 'Aggregated downward flex' },
        { label: 'Energy Available', value: `${(kpi.availableEnergyKwh / 1000).toFixed(1)} MWh`, color: 'blue' as const, subtitle: 'Total dispatchable energy' },
        { label: 'Active Assets', value: `${kpi.activeAssets} / ${kpi.registeredAssets}`, color: 'green' as const, subtitle: 'Online & controllable' },
        { label: 'Active Pools', value: `${kpi.activePools} / ${kpi.totalPools}`, color: 'blue' as const, subtitle: 'Grid-relevant pools' },
        { label: 'CBP Readiness', value: `${kpi.cbpReadinessPct}%`, color: 'green' as const, subtitle: 'Process & data readiness' },
        { label: 'Forecast Confidence', value: `${kpi.forecastConfidencePct}%`, color: 'blue' as const, subtitle: '15-min baseline confidence' },
        { label: 'Validation RMS', value: `${kpi.validationRmsKw} kW`, color: 'green' as const, subtitle: 'Measured vs planned deviation' },
      ]

  return (
    <div className="flex flex-col h-full overflow-auto">
      <MarketTicker />
      <div className="p-4 space-y-4">
        {/* View toggle */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-bold text-white">FSP Dashboard — OLI Systems GmbH</h1>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {/* FSP Identity hero card */}
        <FspIdentityCard />

        {/* KPI strip */}
        <KpiStrip tiles={kpiTiles} />

        {/* CBP Process Tracker */}
        <CbpProcessTracker />

        {/* Quick jump tiles */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: 'Grid Ops', icon: Map, to: '/grid', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800/30' },
            { label: 'Markets', icon: BarChart2, to: '/markets', color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/30' },
            { label: 'Dispatch', icon: Zap, to: '/dispatch', color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/30' },
            { label: 'CBP', icon: ShieldCheck, to: '/cbp', color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-800/30' },
            { label: 'Pricing', icon: TrendingUp, to: '/pricing', color: 'text-cyan-400', bg: 'bg-cyan-900/20 border-cyan-800/30' },
            { label: 'Assets', icon: Database, to: '/assets', color: 'text-slate-300', bg: 'bg-gray-700/50 border-gray-600/50' },
          ].map(({ label, icon: Icon, to, color, bg }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={`panel ${bg} flex items-center gap-2 p-3 hover:border-border-strong transition-colors cursor-pointer`}
            >
              <Icon size={16} className={color} />
              <span className="text-xs font-medium text-slate-300">{label}</span>
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left column */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <SpotPriceChart />
            <MarketOpportunityPanel />
            <DispatchTimeline />
            <ActivationQueue />
          </div>

          {/* Right column */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <GridRelevancePanel compact />
            <ComplianceScoreCard />
            <CongestionPanel maxItems={4} />
            <TsoReferenceTable />
            <EventFeed maxItems={5} />
          </div>
        </div>
      </div>
    </div>
  )
}

function TsoReferenceTable() {
  return (
    <Card>
      <CardHeader title="TSO Regions (ÜNB)" subtitle="Control area reference" />
      <div className="divide-y divide-border-subtle/40">
        {TSO_REGIONS.map(tso => (
          <div key={tso.id} className="px-3 py-2 flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: tso.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-200">{tso.shortName}</div>
              <div className="text-2xs text-slate-600 truncate">{tso.controlCenter}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
