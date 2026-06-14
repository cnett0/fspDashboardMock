import { AlertTriangle } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'

export function CongestionPanel({ maxItems: _maxItems = 6, onSelect: _onSelect }: { maxItems?: number; onSelect?: (id: string) => void }) {
  return (
    <Card>
      <CardHeader
        title="Engpasssituationen"
        subtitle="Aktuelle Netzengpässe"
        icon={<AlertTriangle size={13} />}
      />
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle size={20} className="text-slate-600 mb-2" />
        <div className="text-xs text-slate-500">Keine Engpässe</div>
        <div className="text-2xs text-slate-600 mt-1">Echtzeit-Engpassdaten nicht verfügbar</div>
      </div>
    </Card>
  )
}
