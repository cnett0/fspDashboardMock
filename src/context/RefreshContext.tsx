import {
  createContext, useContext, useState, useEffect, useRef, useCallback,
  type ReactNode,
} from 'react'

// ms until next clock-aligned 15-min boundary (xx:00, xx:15, xx:30, xx:45)
function msUntilNextQuarter(): number {
  const now = new Date()
  const totalMs = now.getMinutes() * 60_000 + now.getSeconds() * 1_000 + now.getMilliseconds()
  const quarterMs = 15 * 60_000
  const msIntoQuarter = totalMs % quarterMs
  return quarterMs - msIntoQuarter
}

export interface RefreshState {
  // Asset / flex data (1-min cycle)
  assetRefreshing: boolean
  assetLastRefresh: Date | null
  assetError: string | null
  assetNextAt: Date | null
  assetRefreshKey: number   // increments on every successful asset refresh

  // Market data (15-min clock-aligned cycle)
  marketRefreshing: boolean
  marketLastRefresh: Date | null
  marketError: string | null
  marketNextAt: Date | null
  marketRefreshKey: number  // increments on every successful market refresh

  // Auto-refresh toggle
  autoEnabled: boolean
  setAutoEnabled: (v: boolean) => void

  // Manual triggers
  triggerAsset: () => Promise<void>
  triggerMarket: () => Promise<void>
}

const RefreshContext = createContext<RefreshState | null>(null)

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [autoEnabled, setAutoEnabled] = useState(false)

  const [assetRefreshing, setAssetRefreshing] = useState(false)
  const [assetLastRefresh, setAssetLastRefresh] = useState<Date | null>(null)
  const [assetError, setAssetError] = useState<string | null>(null)
  const [assetNextAt, setAssetNextAt] = useState<Date | null>(null)
  const [assetRefreshKey, setAssetRefreshKey] = useState(0)

  const [marketRefreshing, setMarketRefreshing] = useState(false)
  const [marketLastRefresh, setMarketLastRefresh] = useState<Date | null>(null)
  const [marketError, setMarketError] = useState<string | null>(null)
  const [marketNextAt, setMarketNextAt] = useState<Date | null>(null)
  const [marketRefreshKey, setMarketRefreshKey] = useState(0)

  // Use refs to hold timer IDs so cleanup doesn't stale-close over old state
  const assetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const marketTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerAsset = useCallback(async () => {
    if (assetRefreshing) return
    setAssetRefreshing(true)
    setAssetError(null)
    try {
      // Mock: no API call, just update timestamp and increment key
      setAssetLastRefresh(new Date())
      setAssetRefreshKey(k => k + 1)
    } catch (err: any) {
      setAssetError(err.message ?? 'Unbekannter Fehler')
    } finally {
      setAssetRefreshing(false)
    }
  }, [assetRefreshing])

  const triggerMarket = useCallback(async () => {
    if (marketRefreshing) return
    setMarketRefreshing(true)
    setMarketError(null)
    try {
      // Mock: no API call, just update timestamp and increment key
      setMarketLastRefresh(new Date())
      setMarketRefreshKey(k => k + 1)
    } catch (err: any) {
      setMarketError(err.message ?? 'Unbekannter Fehler')
    } finally {
      setMarketRefreshing(false)
    }
  }, [marketRefreshing])

  // Asset auto-refresh: every 60 seconds
  useEffect(() => {
    if (!autoEnabled) {
      if (assetTimerRef.current) clearInterval(assetTimerRef.current)
      assetTimerRef.current = null
      setAssetNextAt(null)
      return
    }

    const scheduleNext = () => {
      setAssetNextAt(new Date(Date.now() + 60_000))
    }

    scheduleNext()
    const id = setInterval(() => {
      triggerAsset()
      scheduleNext()
    }, 60_000)
    assetTimerRef.current = id

    return () => clearInterval(id)
  }, [autoEnabled, triggerAsset])

  // Market auto-refresh: clock-aligned 15-min boundaries
  useEffect(() => {
    if (!autoEnabled) {
      if (marketTimerRef.current) clearTimeout(marketTimerRef.current)
      marketTimerRef.current = null
      setMarketNextAt(null)
      return
    }

    let cancelled = false

    const scheduleNextFire = () => {
      const ms = msUntilNextQuarter()
      const fireAt = new Date(Date.now() + ms)
      setMarketNextAt(fireAt)

      marketTimerRef.current = setTimeout(() => {
        if (cancelled) return
        triggerMarket()
        scheduleNextFire()
      }, ms)
    }

    scheduleNextFire()

    return () => {
      cancelled = true
      if (marketTimerRef.current) clearTimeout(marketTimerRef.current)
    }
  }, [autoEnabled, triggerMarket])

  return (
    <RefreshContext.Provider value={{
      assetRefreshing, assetLastRefresh, assetError, assetNextAt, assetRefreshKey,
      marketRefreshing, marketLastRefresh, marketError, marketNextAt, marketRefreshKey,
      autoEnabled, setAutoEnabled,
      triggerAsset, triggerMarket,
    }}>
      {children}
    </RefreshContext.Provider>
  )
}

export function useRefresh(): RefreshState {
  const ctx = useContext(RefreshContext)
  if (!ctx) throw new Error('useRefresh must be used inside RefreshProvider')
  return ctx
}
