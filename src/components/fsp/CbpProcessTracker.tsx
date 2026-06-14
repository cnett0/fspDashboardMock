import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { CBP_PROCESS_STEPS, type CbpStep, type CbpStepStatus } from '../../data/fspMockData'

const STATUS_STYLES: Record<CbpStepStatus, { icon: React.ReactNode; line: string; dot: string; text: string; bg: string }> = {
  completed: {
    icon: <CheckCircle2 size={14} className="text-green-400" />,
    line: 'bg-green-700/60',
    dot: 'border-green-500 bg-green-900/50',
    text: 'text-green-400',
    bg: 'bg-green-900/10 border-green-800/30',
  },
  active: {
    icon: <Loader2 size={14} className="text-blue-400 animate-spin" />,
    line: 'bg-gray-700/40',
    dot: 'border-blue-400 bg-blue-900/50 ring-2 ring-blue-500/30',
    text: 'text-blue-400',
    bg: 'bg-blue-900/10 border-blue-700/40',
  },
  pending: {
    icon: <Circle size={14} className="text-slate-600" />,
    line: 'bg-gray-700/30',
    dot: 'border-gray-700 bg-gray-800/30',
    text: 'text-slate-500',
    bg: 'bg-gray-800/20 border-gray-700/20',
  },
}

function StepCard({ step, compact }: { step: CbpStep; compact?: boolean }) {
  const s = STATUS_STYLES[step.status]
  return (
    <div className={clsx('flex flex-col gap-1 px-2 py-2 rounded border', s.bg)}>
      <div className="flex items-center gap-1.5">
        {s.icon}
        <span className={clsx('text-2xs font-semibold', s.text)}>
          {compact ? step.shortLabel : step.label}
        </span>
      </div>
      {step.timestamp && (
        <div className="text-2xs text-slate-600 font-mono pl-0.5">{step.timestamp}</div>
      )}
      {step.note && !compact && (
        <div className="text-2xs text-slate-500 pl-0.5">{step.note}</div>
      )}
    </div>
  )
}

interface CbpProcessTrackerProps {
  compact?: boolean
  className?: string
}

export function CbpProcessTracker({ compact = false, className }: CbpProcessTrackerProps) {
  const completed = CBP_PROCESS_STEPS.filter(s => s.status === 'completed').length
  const total = CBP_PROCESS_STEPS.length

  return (
    <div className={clsx('panel', className)}>
      <div className="panel-header">
        <div className="panel-title">CBP Process Readiness</div>
        <div className="flex items-center gap-2">
          <div className="text-2xs text-slate-500">
            <span className="text-green-400 font-mono font-bold">{completed}</span>
            <span className="text-slate-600"> / {total} steps complete</span>
          </div>
          <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <div className="px-3 pb-3">
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5">
          {CBP_PROCESS_STEPS.map(step => (
            <div key={step.id} className="flex flex-col items-center gap-1">
              <div className="text-2xs text-slate-700 font-mono">{step.step}</div>
              <StepCard step={step} compact={compact} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
