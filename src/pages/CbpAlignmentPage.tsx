import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ComplianceScoreCard } from '../components/fsp/ComplianceScoreCard'
import { CbpProcessTracker } from '../components/fsp/CbpProcessTracker'
import { GridRelevancePanel } from '../components/fsp/GridRelevancePanel'
import { OVERVIEW_KPIS, POOL_READINESS } from '../data/fspMockData'

export function CbpAlignmentPage() {
  const kpi = OVERVIEW_KPIS

  return (
    <div className="p-4 space-y-4 overflow-auto h-full">
      {/* Header KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <ScoreCard label="Registered Assets" value={`${kpi.registeredAssets}`} color="text-white" />
        <ScoreCard label="Active Assets" value={`${kpi.activeAssets}`} color="text-green-400" />
        <ScoreCard label="CBP Readiness" value={`${kpi.cbpReadinessPct}%`} color="text-purple-400" />
        <ScoreCard label="Validation Accuracy" value={`${kpi.validationAccuracyPct}%`} color="text-green-400" />
      </div>

      {/* CBP Process Tracker */}
      <CbpProcessTracker />

      {/* Main content */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <ComplianceScoreCard />
          <SettlementReadiness />
        </div>

        {/* Middle */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <GridRelevancePanel />
          <PoolReadinessTable />
        </div>

        {/* Right */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <CbpChecklist />
        </div>
      </div>
    </div>
  )
}

function ScoreCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card className="p-3">
      <div className="text-2xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="mt-1">
        <span className={`text-2xl font-mono font-bold ${color}`}>{value}</span>
      </div>
    </Card>
  )
}

function PoolReadinessTable() {
  return (
    <Card>
      <CardHeader title="Pool CBP Readiness" subtitle="Per-pool eligibility status" icon={<ShieldCheck size={13} />} />
      <div className="overflow-auto">
        <table className="w-full text-2xs">
          <thead>
            <tr className="text-slate-500 text-left bg-gray-800/50">
              <th className="px-3 py-2 font-medium">Pool</th>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Grid Node</th>
              <th className="px-3 py-2 font-medium text-right">Readiness</th>
              <th className="px-3 py-2 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {POOL_READINESS.map(p => (
              <tr key={p.poolId} className="border-t border-gray-700/30 hover:bg-gray-800/30">
                <td className="px-3 py-2 font-mono text-blue-400">{p.poolCode}</td>
                <td className="px-3 py-2 text-slate-400">{p.productType}</td>
                <td className="px-3 py-2 font-mono text-slate-300">{p.gridNode}</td>
                <td className="px-3 py-2 text-right">
                  <ReadinessBar pct={p.readinessPct} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Badge variant={p.readinessPct >= 85 ? 'green' : p.readinessPct >= 60 ? 'amber' : 'red'}>
                    {p.readinessPct >= 85 ? 'CBP-ready' : p.readinessPct >= 60 ? 'Partial' : 'Not ready'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function ReadinessBar({ pct }: { pct: number }) {
  const color = pct >= 85 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-slate-300 w-8 text-right">{pct}%</span>
    </div>
  )
}

function SettlementReadiness() {
  const checks = [
    { label: 'Telemetry complete', ok: true },
    { label: 'Planning data submitted', ok: true },
    { label: 'Settlement basis', ok: true },
    { label: 'Baseline data available', ok: true },
    { label: 'Activation traceable', ok: true },
    { label: 'Balancing group notification', ok: false, warn: true },
  ]
  return (
    <Card>
      <CardHeader title="Settlement Readiness" icon={<ShieldCheck size={13} />} />
      <div className="divide-y divide-border-subtle/40">
        {checks.map(c => (
          <div key={c.label} className="px-3 py-2 flex items-center justify-between">
            <span className="text-2xs text-slate-400">{c.label}</span>
            {c.ok
              ? <CheckCircle2 size={13} className="text-green-400" />
              : c.warn
              ? <AlertCircle size={13} className="text-amber-400" />
              : <AlertCircle size={13} className="text-red-400" />}
          </div>
        ))}
      </div>
    </Card>
  )
}

function CbpChecklist() {
  const items = [
    { label: 'FSP role registered', ok: true },
    { label: 'MSP role registered', ok: true },
    { label: 'Grid Connection Points', ok: true },
    { label: 'Flex Devices registered', ok: true },
    { label: 'Pools configured', ok: true },
    { label: 'Baseline submitted', ok: true },
    { label: 'RDV+ / RDV− available', ok: true },
    { label: 'Activation API live', ok: true },
    { label: 'Dispatch connected', ok: true },
    { label: '15-min measurements', ok: true },
    { label: 'Delivery validation', ok: true },
    { label: 'RDA confirmation', ok: false, warn: true },
    { label: 'RDK settlement', ok: false, warn: true },
  ]
  return (
    <Card>
      <CardHeader title="CBP Eligibility Checklist" icon={<ShieldCheck size={13} />} />
      <div className="divide-y divide-border-subtle/40">
        {items.map(c => (
          <div key={c.label} className="px-3 py-1.5 flex items-center justify-between">
            <span className="text-2xs text-slate-400">{c.label}</span>
            {c.ok
              ? <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />
              : c.warn
              ? <AlertCircle size={12} className="text-amber-400 flex-shrink-0" />
              : <AlertCircle size={12} className="text-red-400 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </Card>
  )
}
