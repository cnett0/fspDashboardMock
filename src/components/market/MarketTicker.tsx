import { TrendingUp, TrendingDown } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { getSpotPrices, getRebapPrices } from '../../api/market'
import { useRefresh } from '../../context/RefreshContext'

export function MarketTicker() {
  const { marketRefreshKey } = useRefresh()
  const { data: spotResp } = useApi(() => getSpotPrices({ limit: 2 }), [marketRefreshKey])
  const { data: rebapResp } = useApi(() => getRebapPrices({ limit: 2 }), [marketRefreshKey])

  const currentSpot = spotResp?.data?.[0]?.priceEurMwh ?? null
  const currentRebap = rebapResp?.data?.[0]?.rebapEurMwh ?? null

  const items = [
    { label: 'DA Spot DE/LU', value: currentSpot !== null ? `${currentSpot.toFixed(2)} €/MWh` : '—', up: (currentSpot ?? 0) >= 0 },
    { label: 'reBAP aktuell', value: currentRebap !== null ? `${currentRebap.toFixed(2)} €/MWh` : '—', up: (currentRebap ?? 0) >= 0 },
    { label: 'FCR Kapazität', value: '— €/MW', up: null },
    { label: 'aFRR↑ Kapazität', value: '— €/MW', up: null },
    { label: 'aFRR↓ Kapazität', value: '— €/MW', up: null },
    { label: 'Niedrigtarif', value: '— ct/kWh', up: null },
    { label: 'Standardtarif', value: '— ct/kWh', up: null },
    { label: 'Hochtarif', value: '— ct/kWh', up: null },
    { label: 'EEG-Vergütung', value: '— ct/kWh', up: null },
    { label: 'Haushaltspreis', value: '— ct/kWh', up: null },
  ]

  return (
    <div className="bg-gradient-to-br from-gray-600 to-gray-900 border-b border-gray-800 overflow-hidden">
      <div className="flex">
        <div className="flex gap-6 px-4 py-1.5 items-center flex-wrap">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-2xs text-slate-400 uppercase tracking-wide">{item.label}</span>
              <span className="text-xs font-mono font-semibold text-white">{item.value}</span>
              {item.up !== null && (
                <span className={`text-2xs font-mono flex items-center gap-0.5 ${item.up ? 'text-green-400' : 'text-red-400'}`}>
                  {item.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
