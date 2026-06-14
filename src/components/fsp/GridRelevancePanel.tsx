import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { GRID_RELEVANCE } from '../../data/fspMockData'

export function GridRelevancePanel({ compact = false }: { compact?: boolean }) {
  const g = GRID_RELEVANCE

  const metrics = [
    { label: 'GCP mapped', value: `${g.assetsMappedToGcp} / ${g.totalAssets}`, color: 'text-green-400' },
    { label: 'Grid node assigned', value: `${g.assetsWithGridNode} / ${g.totalAssets}`, color: 'text-green-400' },
    { label: 'Inside flexband', value: `${g.assetsInsideFlexband} / ${g.totalAssets}`, color: 'text-blue-400' },
    { label: 'Flexband compliance', value: `${g.flexbandCompliancePct}%`, color: 'text-green-400' },
    { label: 'Avg. deviation', value: `${g.averageDeviationKw} kW`, color: 'text-slate-300' },
    { label: 'Measurement resolution', value: `${g.measurementResolutionMin} min`, color: 'text-slate-300' },
    { label: 'Risk level', value: g.riskLevel, color: 'text-green-400' },
    { label: 'Baseline submitted', value: g.baselineSubmitted ? 'Yes' : 'No', color: g.baselineSubmitted ? 'text-green-400' : 'text-red-400' },
  ]

  return (
    <Card>
      <CardHeader
        title="Grid Relevance & Flexband Alignment"
        subtitle="Asset–grid connection and measurement compliance"
        icon={<AlertCircle size={13} />}
      />
      <div className="px-3 pb-3 space-y-3">
        {/* Metric chips */}
        <div className={`grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {metrics.map(m => (
            <div key={m.label} className="bg-gray-800/40 rounded border border-gray-700/30 px-2 py-1.5">
              <div className="text-2xs text-slate-500">{m.label}</div>
              <div className={`font-mono text-xs font-bold ${m.color}`}>{m.value}</div>
            </div>
          ))}
        </div>
        {/* Status checklist */}
        <div className={`grid gap-1 ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {g.checks.map(c => (
            <div key={c.label} className="flex items-center gap-1.5 text-2xs">
              {c.ok
                ? <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />
                : <AlertCircle size={12} className="text-red-400 flex-shrink-0" />}
              <span className={c.ok ? 'text-slate-300' : 'text-red-300'}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
