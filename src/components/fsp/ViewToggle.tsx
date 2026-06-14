import { clsx } from 'clsx'

export type DemoView = 'operator' | 'redispatch' | 'portfolio'

interface ViewToggleProps {
  view: DemoView
  onChange: (v: DemoView) => void
}

const VIEWS: { id: DemoView; label: string; color: string; activeClass: string }[] = [
  {
    id: 'operator',
    label: 'Operator View',
    color: 'text-slate-300',
    activeClass: 'bg-gray-700 text-white border-gray-500',
  },
  {
    id: 'redispatch',
    label: 'Grid View',
    color: 'text-blue-400',
    activeClass: 'bg-blue-900/60 text-blue-200 border-blue-600',
  },
  {
    id: 'portfolio',
    label: 'Market View',
    color: 'text-green-400',
    activeClass: 'bg-green-900/60 text-green-200 border-green-600',
  },
]

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded border border-gray-700/60 overflow-hidden divide-x divide-gray-700/60 bg-gray-900">
      {VIEWS.map(v => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className={clsx(
            'px-3 py-1 text-2xs font-medium transition-colors border',
            view === v.id ? v.activeClass : 'text-slate-500 hover:text-slate-300 border-transparent',
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}

export const GRID_VIEW_LABELS = {
  flexUp: 'RDV+',
  flexDown: 'RDV−',
  pool: 'Pool ID',
  accent: 'Grid Node',
  highlights: [
    'Grid Node',
    'Pool ID',
    'RDV+',
    'RDV−',
    'Baseline',
    'Activation',
    'Measurement Validation',
    'Delivery Deviation',
    'Confidence',
    'Risk',
  ],
}

export const OPERATOR_VIEW_LABELS = {
  flexUp: 'Flex ↑',
  flexDown: 'Flex ↓',
  pool: 'Pool',
  accent: 'Asset',
  highlights: [
    'Asset',
    'Pool',
    'Flex ↑',
    'Flex ↓',
    'Status',
    'Telemetry',
  ],
}

export const MARKET_VIEW_LABELS = {
  flexUp: 'MW Available ↑',
  flexDown: 'MW Available ↓',
  pool: 'Portfolio',
  accent: 'Business Value',
  highlights: [
    'First-mover status',
    'Market opportunity',
    'Portfolio growth',
    'Active assets',
    'MW available',
    'Product readiness',
    'Business value',
  ],
}