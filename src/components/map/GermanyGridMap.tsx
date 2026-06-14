import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, LayerGroup, useMapEvents } from 'react-leaflet'
import { fmtPower } from '../../lib/format'
import type { Asset } from '../../types/api'
import { assetControllability } from '../../types/api'
import { ASSET_TYPE_COLORS } from '../../lib/constants'
import { useApi } from '../../hooks/useApi'
import { getAssets } from '../../api/assets'

interface GermanyGridMapProps {
  onAssetSelect?: (asset: Asset) => void
  selectedAssetId?: string
  height?: string
}

function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick })
  return null
}

export function GermanyGridMap({
  onAssetSelect,
  selectedAssetId,
  height = '100%',
}: GermanyGridMapProps) {
  const [showAssets, setShowAssets] = useState(true)
  const { data } = useApi(() => getAssets(), [])
  const assets = (data ?? []).filter(a => a.latitude != null && a.longitude != null)

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Layer toggles */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
        <button
          onClick={() => setShowAssets(v => !v)}
          className={`text-2xs px-2 py-1 rounded border font-medium transition-colors ${
            showAssets
              ? 'bg-gray-600/80 border-gray-600 text-slate-200'
              : 'bg-gray-900/80 border-gray-700/40 text-slate-500'
          }`}
        >
          Assets
        </button>
      </div>

      <MapContainer
        center={[51.1657, 10.4515]}
        zoom={6}
        style={{ height: '100%', width: '100%', borderRadius: '0' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Assets */}
        {showAssets && (
          <LayerGroup>
            {assets.map(asset => {
              const isSelected = asset.id === selectedAssetId
              const color = ASSET_TYPE_COLORS[asset.assetType] ?? '#64748b'
              const dispatchable = assetControllability(asset) === 'dispatchable'
              return (
                <CircleMarker
                  key={asset.id}
                  center={[asset.latitude!, asset.longitude!]}
                  radius={isSelected ? 10 : 7}
                  pathOptions={{
                    color: isSelected ? '#ffffff' : color,
                    fillColor: color,
                    fillOpacity: dispatchable ? 0.9 : 0.4,
                    weight: isSelected ? 2.5 : 1.5,
                  }}
                  eventHandlers={{ click: () => onAssetSelect?.(asset) }}
                >
                  <Popup>
                    <div className="text-xs">
                      <div className="font-mono text-blue-400 text-xs">{asset.assetCode}</div>
                      <div className="font-semibold text-slate-200 mb-1">{asset.name}</div>
                      <div className="text-slate-400">{asset.city} · {asset.vnbOperator ?? '—'}</div>
                      <div className="text-green-400 mt-1">↑{fmtPower(asset.availableFlexUpKw)}</div>
                      <div className="text-blue-400">↓{fmtPower(asset.availableFlexDownKw)}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </LayerGroup>
        )}
      </MapContainer>

      {/* Legend */}
      {assets.length > 0 && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-gray-900/90 border border-gray-700/40 rounded-lg p-2.5 text-2xs space-y-1.5">
          <div className="text-slate-500 font-semibold uppercase tracking-wide mb-1">Asset-Typen</div>
          {Object.entries(ASSET_TYPE_COLORS).slice(0, 5).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-500">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
