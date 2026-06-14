import { ShieldCheck } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'

export function ComplianceScoreCard() {
  return (
    <Card>
      <CardHeader title="CBP-Bereitschaft" icon={<ShieldCheck size={13} />} />
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ShieldCheck size={24} className="text-slate-600 mb-2" />
        <div className="text-xs text-slate-500">Keine Compliance-Daten</div>
        <div className="text-2xs text-slate-600 mt-1">Assets registrieren um CBP-Score zu berechnen</div>
      </div>
    </Card>
  )
}
