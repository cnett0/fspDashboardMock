import { Filter, Search } from 'lucide-react'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { TSO_REGIONS, VNB_OPERATORS, ASSET_TYPE_LABELS } from '../../lib/constants'

interface Filters {
  search?: string
  tsoRegion?: string
  vnbOperator?: string
  assetType?: string
  complianceState?: string
  controllability?: string
}

interface RegionalFilterBarProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

export function RegionalFilterBar({ filters, onChange }: RegionalFilterBarProps) {
  const set = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value === '' ? undefined : value })

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter size={12} className="text-slate-500 flex-shrink-0" />
      <Input
        placeholder="Suche…"
        icon={<Search size={11} />}
        value={filters.search ?? ''}
        onChange={e => set('search', e.target.value)}
        className="w-40"
      />
      <Select
        value={filters.tsoRegion ?? ''}
        onChange={e => set('tsoRegion', e.target.value)}
        options={[
          { value: '', label: 'Alle ÜNB' },
          ...TSO_REGIONS.map(t => ({ value: t.id, label: t.shortName })),
        ]}
      />
      <Select
        value={filters.vnbOperator ?? ''}
        onChange={e => set('vnbOperator', e.target.value)}
        options={[
          { value: '', label: 'Alle VNB' },
          ...VNB_OPERATORS.map(v => ({ value: v.id, label: v.shortName })),
        ]}
      />
      <Select
        value={filters.assetType ?? ''}
        onChange={e => set('assetType', e.target.value)}
        options={[
          { value: '', label: 'Alle Typen' },
          ...Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v })),
        ]}
      />
      <Select
        value={filters.complianceState ?? ''}
        onChange={e => set('complianceState', e.target.value)}
        options={[
          { value: '', label: 'Compliance: Alle' },
          { value: 'compliant', label: 'Konform' },
          { value: 'warning', label: 'Warnung' },
          { value: 'non_compliant', label: 'Nicht konform' },
        ]}
      />
      <Select
        value={filters.controllability ?? ''}
        onChange={e => set('controllability', e.target.value)}
        options={[
          { value: '', label: 'Status: Alle' },
          { value: 'active', label: 'Aktiv' },
          { value: 'maintenance', label: 'Wartung' },
          { value: 'inactive', label: 'Inaktiv' },
        ]}
      />
    </div>
  )
}
