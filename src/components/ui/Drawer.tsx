import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: string
  side?: 'right' | 'left'
}

export function Drawer({ open, onClose, title, children, width = 'w-96', side = 'right' }: DrawerProps) {
  return (
    <div className={clsx(
      'fixed inset-y-0 z-40 flex flex-col bg-gradient-to-br from-gray-700 to-gray-900 border-l border-gray-700 shadow-2xl transition-transform duration-200',
      width,
      side === 'right' ? 'right-0' : 'left-0',
      open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full',
    )}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40 flex-shrink-0">
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="overflow-auto flex-1 p-4">{children}</div>
    </div>
  )
}
