import { useState, useRef, useEffect } from 'react'
import { Search, Bell, ChevronDown, Globe, Clock, Check, RefreshCw, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'
import oliLogo from '../assets/logo.png'
import { Input } from '../components/ui/Input'
import { APP_NAME, OPERATOR_NAME, ENVIRONMENT } from '../lib/constants'
import { fmtEurMWh } from '../lib/format'
import { useApi } from '../hooks/useApi'
import { getSpotPrices, getRebapPrices } from '../api/market'
import { useDateRange, PRESETS, type PresetId } from '../context/DateRangeContext'
import { useRefresh } from '../context/RefreshContext'

export function TopBar() {
  const [alerts] = useState(3)
  const { marketRefreshKey } = useRefresh()
  const { data: spotResp } = useApi(() => getSpotPrices({ limit: 1 }), [marketRefreshKey])
  const { data: rebapResp } = useApi(() => getRebapPrices({ limit: 1 }), [marketRefreshKey])

  const spot  = spotResp?.data?.[0]?.priceEurMwh ?? null
  const rebap = rebapResp?.data?.[0]?.rebapEurMwh ?? null

  return (
    <div className="flex items-center h-12 px-4 bg-gray-200 border-b border-gray-300 shadow-sm gap-4 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <img src={oliLogo} alt="OLI" className="h-9 w-auto object-contain flex-shrink-0" />
        <div>
          <div className="text-sm font-bold text-gray-900 leading-none">{APP_NAME}</div>
          <div className="text-xs text-gray-500 leading-none mt-0.5">{OPERATOR_NAME}</div>
        </div>
      </div>

      {/* CBP readiness indicator */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-green-100 text-green-700 border border-green-300">FIRST-MOVER FSP</span>
        <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">CBP PILOT</span>
      </div>

      {/* Market ticker strip */}
      <div className="flex items-center gap-4 ml-2 flex-shrink-0">
        <TickerItem
          label="DA Spot"
          value={spot !== null ? fmtEurMWh(spot) : '— €/MWh'}
          color={spot !== null ? (spot < 0 ? 'red' : spot > 100 ? 'amber' : 'green') : 'blue'}
        />
        <TickerItem
          label="reBAP"
          value={rebap !== null ? fmtEurMWh(rebap) : '— €/MWh'}
          color={rebap !== null ? (Math.abs(rebap) > 100 ? 'red' : Math.abs(rebap) > 60 ? 'amber' : 'green') : 'blue'}
        />
        <TickerItem label="FCR"   value="42 €/MW/h" color="green" />
        <TickerItem label="aFRR↑" value="18 €/MW/h" color="green" />
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="w-56">
        <Input placeholder="Suche Asset, Region, Node…" icon={<Search size={12} />} />
      </div>

      {/* Region selector */}
      <button className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-2.5 py-1.5 bg-white hover:bg-gray-50 transition-colors">
        <Globe size={12} />
        <span>DE gesamt</span>
        <ChevronDown size={10} />
      </button>

      {/* Time horizon picker */}
      <DateRangePicker />

      {/* Refresh control */}
      <RefreshControl />

      {/* Alert bell */}
      <button className="relative text-gray-500 hover:text-gray-900 transition-colors">
        <Bell size={16} />
        {alerts > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-2xs rounded-full flex items-center justify-center font-bold">
            {alerts}
          </span>
        )}
      </button>

      {/* Profile */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-700 border border-gray-500 flex items-center justify-center text-2xs font-bold text-white">
          OP
        </div>
        <div className="text-2xs leading-none">
          <div className="text-gray-700 font-medium">Operator</div>
          <div className={`font-mono ${(ENVIRONMENT as string) === 'PROD' ? 'text-green-600' : 'text-amber-600'}`}>{ENVIRONMENT}</div>
        </div>
      </div>
    </div>
  )
}

function DateRangePicker() {
  const { range, setPreset, setRange } = useDateRange()
  const [open, setOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo]     = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function applyCustom() {
    if (!customFrom || !customTo) return
    const from = new Date(customFrom + 'T00:00:00')
    const to   = new Date(customTo   + 'T23:59:59')
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) return
    const fmt = (d: Date) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    setRange({ from, to, presetId: 'custom', label: `${fmt(from)} – ${fmt(to)}` })
    setOpen(false)
  }

  function selectPreset(id: PresetId) {
    setPreset(id)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 text-xs border rounded px-2.5 py-1.5 bg-white transition-colors ${
          open ? 'border-green-500/60 text-gray-900' : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <Clock size={12} />
        <span className="font-medium">{range.label}</span>
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-60 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {/* Preset list */}
          <div className="py-1">
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => selectPreset(p.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-800 transition-colors"
              >
                <span className={range.presetId === p.id ? 'text-green-400 font-medium' : 'text-slate-300'}>
                  {p.label}
                </span>
                {range.presetId === p.id && <Check size={11} className="text-green-400" />}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          <div className="border-t border-gray-700/50 px-3 py-2.5 space-y-2">
            <div className="text-2xs text-slate-500 uppercase tracking-wide mb-1.5">Benutzerdefiniert</div>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-2xs text-slate-300 focus:outline-none focus:border-green-500/60"
              />
              <span className="text-slate-600 text-2xs">–</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-2xs text-slate-300 focus:outline-none focus:border-green-500/60"
              />
            </div>
            <button
              onClick={applyCustom}
              disabled={!customFrom || !customTo}
              className="w-full text-2xs bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 rounded px-2 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Anwenden
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TickerItem({ label, value, color }: { label: string; value: string; color: 'green' | 'amber' | 'red' | 'blue' }) {
  const colorClass = { green: 'text-green-600', amber: 'text-amber-600', red: 'text-red-600', blue: 'text-blue-600' }[color]
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-2xs text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={`text-xs font-mono font-semibold ${colorClass}`}>{value}</span>
    </div>
  )
}

// ── Refresh Control ────────────────────────────────────────────────────────────

function fmtCountdown(target: Date | null): string {
  if (!target) return '—'
  const secs = Math.max(0, Math.round((target.getTime() - Date.now()) / 1000))
  if (secs < 60) return `${secs} s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')} min`
}

function fmtAgo(d: Date | null): string {
  if (!d) return '—'
  const secs = Math.round((Date.now() - d.getTime()) / 1000)
  if (secs < 5) return 'gerade eben'
  if (secs < 60) return `vor ${secs} s`
  return `vor ${Math.floor(secs / 60)} min`
}

function RefreshControl() {
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [, tick] = useState(0)

  // Re-render every second to update countdowns
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const anyRefreshing = refresh.assetRefreshing || refresh.marketRefreshing
  const anyError = refresh.assetError || refresh.marketError

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 text-xs border rounded px-2.5 py-1.5 bg-white transition-colors ${
          open
            ? 'border-green-500/60 text-gray-900'
            : anyError
            ? 'border-red-400/60 text-red-600 hover:text-red-700'
            : refresh.autoEnabled
            ? 'border-green-500/60 text-green-700 hover:text-green-800'
            : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        title="Daten-Synchronisation"
      >
        <RefreshCw
          size={12}
          className={anyRefreshing ? 'animate-spin' : ''}
        />
        <span className="font-medium">
          {anyRefreshing ? 'Sync…' : refresh.autoEnabled ? 'Auto' : 'Sync'}
        </span>
        {/* Status dot */}
        {refresh.autoEnabled && !anyRefreshing && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        )}
        {anyError && !anyRefreshing && (
          <AlertCircle size={11} className="text-red-400" />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {/* Header: auto-refresh toggle */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700/60">
            <span className="text-xs font-semibold text-slate-300">Auto-Refresh</span>
            <button
              onClick={() => refresh.setAutoEnabled(!refresh.autoEnabled)}
              className={`flex items-center gap-1.5 text-2xs font-semibold transition-colors ${
                refresh.autoEnabled ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {refresh.autoEnabled
                ? <ToggleRight size={18} className="text-green-400" />
                : <ToggleLeft size={18} className="text-slate-500" />}
              {refresh.autoEnabled ? 'Ein' : 'Aus'}
            </button>
          </div>

          {/* Asset / flex row */}
          <div className="px-3 py-2.5 border-b border-gray-700/40">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <div className="text-2xs font-semibold text-slate-300">Asset &amp; Flex-Daten</div>
                <div className="text-2xs text-slate-600">Zyklus: 1 Min</div>
              </div>
              <button
                onClick={() => { refresh.triggerAsset(); setOpen(false) }}
                disabled={refresh.assetRefreshing}
                className="flex items-center gap-1 px-2 py-1 rounded bg-gray-700 border border-gray-600 hover:border-gray-500 text-2xs text-slate-300 disabled:opacity-40 transition-colors"
              >
                <RefreshCw size={10} className={refresh.assetRefreshing ? 'animate-spin' : ''} />
                {refresh.assetRefreshing ? 'Lädt…' : 'Jetzt'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 text-2xs">
              <div>
                <span className="text-slate-600">Zuletzt:</span>{' '}
                <span className="text-slate-400 font-mono">{fmtAgo(refresh.assetLastRefresh)}</span>
              </div>
              {refresh.autoEnabled && (
                <div>
                  <span className="text-slate-600">Nächster:</span>{' '}
                  <span className="text-slate-400 font-mono">{fmtCountdown(refresh.assetNextAt)}</span>
                </div>
              )}
            </div>
            {refresh.assetError && (
              <div className="mt-1.5 flex items-start gap-1.5 text-2xs text-red-400">
                <AlertCircle size={10} className="flex-shrink-0 mt-0.5" />
                <span className="break-all">{refresh.assetError}</span>
              </div>
            )}
          </div>

          {/* Market data row */}
          <div className="px-3 py-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <div className="text-2xs font-semibold text-slate-300">Marktdaten</div>
                <div className="text-2xs text-slate-600">xx:00, xx:15, xx:30, xx:45</div>
              </div>
              <button
                onClick={() => { refresh.triggerMarket(); setOpen(false) }}
                disabled={refresh.marketRefreshing}
                className="flex items-center gap-1 px-2 py-1 rounded bg-gray-700 border border-gray-600 hover:border-gray-500 text-2xs text-slate-300 disabled:opacity-40 transition-colors"
              >
                <RefreshCw size={10} className={refresh.marketRefreshing ? 'animate-spin' : ''} />
                {refresh.marketRefreshing ? 'Lädt…' : 'Jetzt'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 text-2xs">
              <div>
                <span className="text-slate-600">Zuletzt:</span>{' '}
                <span className="text-slate-400 font-mono">{fmtAgo(refresh.marketLastRefresh)}</span>
              </div>
              {refresh.autoEnabled && (
                <div>
                  <span className="text-slate-600">Nächster:</span>{' '}
                  <span className="text-slate-400 font-mono">{fmtCountdown(refresh.marketNextAt)}</span>
                </div>
              )}
            </div>
            {refresh.marketError && (
              <div className="mt-1.5 flex items-start gap-1.5 text-2xs text-red-400">
                <AlertCircle size={10} className="flex-shrink-0 mt-0.5" />
                <span className="break-all">{refresh.marketError}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
