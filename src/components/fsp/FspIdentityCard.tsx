import { Shield, Zap, CheckCircle2, Activity } from 'lucide-react'
import { FSP_IDENTITY, OVERVIEW_KPIS } from '../../data/fspMockData'
import oliLogo from '../../assets/logo.png'
import dataflexLogo from '../../assets/dataflex.png'

const BADGE_STYLES: Record<string, string> = {
  green: 'bg-green-900/40 text-green-300 border border-green-700/60',
  blue: 'bg-blue-900/40 text-blue-300 border border-blue-700/60',
  purple: 'bg-purple-900/40 text-purple-300 border border-purple-700/60',
  amber: 'bg-amber-900/40 text-amber-300 border border-amber-700/60',
}

interface MetricItem {
  label: string
  value: string
  color?: string
  icon?: React.ReactNode
}

export function FspIdentityCard() {
  const kpi = OVERVIEW_KPIS
  const metrics: MetricItem[] = [
    { label: 'Registered Assets', value: `${kpi.registeredAssets}`, color: 'text-white', icon: <Activity size={12} /> },
    { label: 'Active Assets', value: `${kpi.activeAssets}`, color: 'text-green-400', icon: <CheckCircle2 size={12} /> },
    { label: 'Available RDV+', value: `${(kpi.availableFlexUpKw / 1000).toFixed(1)} MW`, color: 'text-green-400', icon: <Zap size={12} /> },
    { label: 'Available RDV−', value: `${(kpi.availableFlexDownKw / 1000).toFixed(1)} MW`, color: 'text-blue-400', icon: <Zap size={12} /> },
    { label: 'Energy Available', value: `${(kpi.availableEnergyKwh / 1000).toFixed(1)} MWh`, color: 'text-cyan-400' },
    { label: 'CBP Readiness', value: `${kpi.cbpReadinessPct}%`, color: 'text-purple-400', icon: <Shield size={12} /> },
    { label: 'Validation Accuracy', value: `${kpi.validationAccuracyPct}%`, color: 'text-green-400' },
    { label: 'Active Pools', value: `${kpi.activePools} / ${kpi.totalPools}`, color: 'text-slate-200' },
  ]

  return (
    <div className="relative overflow-hidden rounded border border-green-700/40 bg-gradient-to-br from-gray-800/80 via-gray-900 to-black shadow-lg shadow-green-900/10">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, #4ade80 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #4ade80 0px, transparent 1px, transparent 40px)',
      }} />

      <div className="relative p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <img src={oliLogo} alt="OLI" className="h-8 w-auto object-contain flex-shrink-0" />
            <div>
              <h2 className="text-base font-bold text-white leading-tight">{FSP_IDENTITY.name}</h2>
              <p className="text-xs text-green-400/80 mt-0.5">{FSP_IDENTITY.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {FSP_IDENTITY.badges.map(b => (
              <span key={b.label} className={`px-2 py-0.5 rounded text-2xs font-bold tracking-wide uppercase ${BADGE_STYLES[b.color]}`}>
                {b.label}
              </span>
            ))}
            <div className="flex flex-col items-center gap-0.5">
              <img src={dataflexLogo} alt="DatafleX" className="h-12 w-32 object-contain flex-shrink-0" />
              <span className="text-xs text-slate-400 font-medium tracking-wide">Projekt DatafleX</span>
            </div>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-black/30 rounded border border-white/5 px-2 py-2">
              <div className="flex items-center gap-1 mb-1">
                {m.icon && <span className="text-slate-500">{m.icon}</span>}
                <span className="text-2xs text-slate-500 leading-tight">{m.label}</span>
              </div>
              <div className={`font-mono text-sm font-bold ${m.color ?? 'text-white'}`}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 italic border-t border-white/5 pt-2">
          {FSP_IDENTITY.description}
        </p>
      </div>
    </div>
  )
}
