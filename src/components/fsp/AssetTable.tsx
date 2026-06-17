import { Table } from '../ui/Table'
import { Badge, TelemetryBadge, ControllabilityBadge } from '../ui/Badge'
import type { Asset } from '../../types/api'
import { assetControllability, assetTelemetryFreshness } from '../../types/api'
import { fmtPower, fmtEnergy, fmtAge } from '../../lib/format'
import { FEDERAL_STATE_SHORT } from '../../lib/region'
import { ASSET_TYPE_LABELS } from '../../lib/constants'

interface AssetTableProps {
  assets: Asset[]
  filter?: Partial<Record<string, string>>
  onSelect?: (asset: Asset) => void
  selectedId?: string
  maxRows?: number
}

export function AssetTable({ assets, filter, onSelect, selectedId, maxRows }: AssetTableProps) {
  let data = assets

  if (filter?.tsoRegion) data = data.filter(a => a.uenbRegion === filter.tsoRegion)
  if (filter?.vnbOperator) data = data.filter(a => a.vnbOperator === filter.vnbOperator)
  if (filter?.assetType) data = data.filter(a => a.assetType === filter.assetType)
  if (filter?.controllability) data = data.filter(a => a.status === filter.controllability)
  if (filter?.search) {
    const q = filter.search.toLowerCase()
    data = data.filter(a =>
      a.assetCode.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.city ?? '').toLowerCase().includes(q)
    )
  }

  if (maxRows) data = data.slice(0, maxRows)

  const columns = [
    {
      key: 'id', header: 'Asset ID', width: 'w-24',
      render: (a: Asset) => <span className="font-mono text-blue-400 text-2xs">{a.assetCode}</span>,
    },
    {
      key: 'name', header: 'Name',
      render: (a: Asset) => (
        <div>
          <div className="text-slate-800 text-xs truncate max-w-44">{a.name}</div>
          <div className="text-2xs text-slate-600">{a.city} · {FEDERAL_STATE_SHORT(a.federalState ?? '')}</div>
        </div>
      ),
    },
    {
      key: 'type', header: 'Typ',
      render: (a: Asset) => <Badge variant="slate">{ASSET_TYPE_LABELS[a.assetType] ?? a.assetType}</Badge>,
    },
    {
      key: 'tso', header: 'ÜNB',
      render: (a: Asset) => <span className="text-2xs text-slate-400 uppercase">{a.uenbRegion ?? '—'}</span>,
    },
    {
      key: 'flex', header: 'Flex', align: 'right' as const,
      render: (a: Asset) => (
        <div className="text-right">
          <div className="text-xs font-mono text-green-400">↑{fmtPower(a.availableFlexUpKw)}</div>
          <div className="text-2xs font-mono text-blue-400">↓{fmtPower(a.availableFlexDownKw)}</div>
        </div>
      ),
    },
    {
      key: 'energy', header: 'Energie verfügbar', align: 'center' as const,
      render: (a: Asset) => <span className="text-xs font-mono text-slate-400">{fmtEnergy(a.availableEnergyKwh)}</span>,
    },
    {
      key: 'telemetry', header: 'Telemetrie',
      render: (a: Asset) => <TelemetryBadge freshness={assetTelemetryFreshness(a)} />,
    },
    {
      key: 'status', header: 'Status',
      render: (a: Asset) => <ControllabilityBadge status={assetControllability(a)} />,
    },
    {
      key: 'contact', header: 'Aktualisiert',
      render: (a: Asset) => <span className="text-2xs text-slate-600 font-mono">{fmtAge(a.updatedAt)}</span>,
    },
  ]

  return (
    <Table
      columns={columns}
      data={data}
      onRowClick={onSelect}
      selectedKey={selectedId}
      getKey={a => a.id}
      emptyMessage="Keine Assets gefunden"
    />
  )
}
