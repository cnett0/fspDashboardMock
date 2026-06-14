import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: string
}

export function Modal({ open, onClose, title, children, width = 'max-w-2xl' }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full mx-4 ${width} max-h-[85vh] flex flex-col`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
          <span className="text-sm font-semibold text-slate-200">{title}</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-auto flex-1 p-4">{children}</div>
      </div>
    </div>
  )
}
