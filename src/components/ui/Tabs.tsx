import { clsx } from 'clsx'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={clsx('flex gap-1 bg-gradient-to-br from-gray-600 to-gray-900 rounded-lg p-1.5 border border-gray-800 shadow-sm inline-flex', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
            activeTab === tab.id
              ? 'bg-gradient-to-r from-green-300 to-green-500 text-black shadow-sm'
              : 'text-white hover:bg-green-100/20 hover:text-black',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={clsx(
              'text-2xs px-1.5 py-0.5 rounded-full font-bold',
              activeTab === tab.id ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-300',
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
