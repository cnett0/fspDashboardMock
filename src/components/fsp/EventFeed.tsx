import { Info } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'

export function EventFeed({ maxItems: _maxItems = 6 }: { maxItems?: number }) {
  return (
    <Card className="flex flex-col">
      <CardHeader title="Ereignisprotokoll" subtitle="Live-Feed" />
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Info size={20} className="text-slate-600 mb-2" />
        <div className="text-xs text-slate-500">Keine Ereignisse</div>
        <div className="text-2xs text-slate-600 mt-1">Dispatch-Aktivierungen erscheinen hier</div>
      </div>
    </Card>
  )
}
