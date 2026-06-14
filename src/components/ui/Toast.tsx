import { useState, useCallback, createContext, useContext } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { clsx } from 'clsx'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = nextId++
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const success = useCallback((m: string) => toast('success', m), [toast])
  const error = useCallback((m: string) => toast('error', m), [toast])
  const info = useCallback((m: string) => toast('info', m), [toast])

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  const icon = { success: <CheckCircle size={14} />, error: <XCircle size={14} />, info: <Info size={14} /> }
  const colors = {
    success: 'border-green-700/60 bg-green-900/30 text-green-300',
    error: 'border-red-700/60 bg-red-900/30 text-red-300',
    info: 'border-blue-700/60 bg-blue-900/30 text-blue-300',
  }

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={clsx('flex items-start gap-2.5 px-3 py-2.5 rounded-lg border shadow-lg text-xs animate-fade-in', colors[t.type])}>
            <span className="flex-shrink-0 mt-0.5">{icon[t.type]}</span>
            <span className="flex-1 leading-snug">{t.message}</span>
            <button onClick={() => remove(t.id)} className="flex-shrink-0 opacity-60 hover:opacity-100">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
