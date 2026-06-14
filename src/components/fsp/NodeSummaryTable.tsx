import { Info } from 'lucide-react'

export function NodeSummaryTable({ onSelect: _onSelect }: { onSelect?: (nodeId: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Info size={20} className="text-slate-600 mb-2" />
      <div className="text-xs text-slate-500">Keine Knotendaten</div>
      <div className="text-2xs text-slate-600 mt-1">Netzknotendaten nicht verfügbar</div>
    </div>
  )
}
