import { createContext, useContext, useState, type ReactNode } from 'react'

export type PresetId = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'custom'

export interface DateRange {
  from: Date
  to: Date
  presetId: PresetId
  label: string
}

interface DateRangeContextValue {
  range: DateRange
  setRange: (r: DateRange) => void
  setPreset: (id: PresetId) => void
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

export const PRESETS: { id: PresetId; label: string; build: () => DateRange }[] = [
  {
    id: 'today',
    label: 'Heute',
    build: () => {
      const now = new Date()
      return { from: startOfDay(now), to: endOfDay(now), presetId: 'today', label: 'Heute' }
    },
  },
  {
    id: 'yesterday',
    label: 'Gestern',
    build: () => {
      const d = new Date(); d.setDate(d.getDate() - 1)
      return { from: startOfDay(d), to: endOfDay(d), presetId: 'yesterday', label: 'Gestern' }
    },
  },
  {
    id: 'last7',
    label: 'Letzte 7 Tage',
    build: () => {
      const to = new Date()
      const from = new Date(); from.setDate(from.getDate() - 6)
      return { from: startOfDay(from), to: endOfDay(to), presetId: 'last7', label: 'Letzte 7 Tage' }
    },
  },
  {
    id: 'last30',
    label: 'Letzte 30 Tage',
    build: () => {
      const to = new Date()
      const from = new Date(); from.setDate(from.getDate() - 29)
      return { from: startOfDay(from), to: endOfDay(to), presetId: 'last30', label: 'Letzte 30 Tage' }
    },
  },
  {
    id: 'thisMonth',
    label: 'Dieser Monat',
    build: () => {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: startOfDay(from), to: endOfDay(now), presetId: 'thisMonth', label: 'Dieser Monat' }
    },
  },
]

const DateRangeContext = createContext<DateRangeContextValue | null>(null)

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<DateRange>(() => PRESETS[0].build())

  function setPreset(id: PresetId) {
    const preset = PRESETS.find(p => p.id === id)
    if (preset) setRange(preset.build())
  }

  return (
    <DateRangeContext.Provider value={{ range, setRange, setPreset }}>
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange(): DateRangeContextValue {
  const ctx = useContext(DateRangeContext)
  if (!ctx) throw new Error('useDateRange must be used within DateRangeProvider')
  return ctx
}

/** Returns ISO strings suitable for API query params */
export function useDateRangeIso(): { from: string; to: string; label: string; presetId: PresetId } {
  const { range } = useDateRange()
  return {
    from: range.from.toISOString(),
    to:   range.to.toISOString(),
    label: range.label,
    presetId: range.presetId,
  }
}
