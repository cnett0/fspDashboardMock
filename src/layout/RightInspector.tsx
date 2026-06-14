import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface RightInspectorProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: string
}

export function RightInspector({ open, onClose, title, children, width = 'w-80' }: RightInspectorProps) {
  return (
    <aside className={clsx(
      'flex-shrink-0 border-l border-gray-800 bg-gradient-to-b from-gray-600 to-gray-900 flex flex-col transition-all duration-200 overflow-hidden',
      open ? width : 'w-0',
    )}>
      {open && (
        <>
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/60 flex-shrink-0">
            <span className="text-xs font-semibold text-white">{title}</span>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="overflow-auto flex-1 p-3 space-y-3">
            {children}
          </div>
        </>
      )}
    </aside>
  )
}
