import { TrendingUp, TrendingDown, Lightbulb, Clock } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { MARKET_OPPORTUNITY } from '../../data/fspMockData'

function SignalBadge({ direction }: { direction: 'up' | 'down' }) {
  return direction === 'up'
    ? <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-700/50 text-2xs font-mono"><TrendingUp size={10} /> RDV+</span>
    : <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-400 border border-blue-700/50 text-2xs font-mono"><TrendingDown size={10} /> RDV−</span>
}

export function MarketOpportunityPanel() {
  const mo = MARKET_OPPORTUNITY

  return (
    <Card>
      <CardHeader
        title="Market Opportunity Today"
        subtitle="Price signals → recommended FSP actions"
        icon={<TrendingUp size={13} />}
        action={
          <div className="flex items-center gap-1.5 text-2xs text-amber-400 bg-amber-900/20 border border-amber-700/40 rounded px-2 py-0.5">
            <Lightbulb size={10} />
            {mo.recommendedAction}
          </div>
        }
      />
      {/* Summary strip */}
      <div className="px-3 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-border-subtle/30">
        {[
          { label: 'DA Spot', value: `${mo.daSpotEurMwh} €/MWh`, color: 'text-white' },
          { label: 'reBAP', value: `${mo.rebapEurMwh} €/MWh`, color: 'text-amber-400' },
          { label: 'Neg. price windows', value: mo.negativePriceWindowsToday.toString(), color: 'text-blue-400' },
          { label: 'Est. gross opportunity', value: `€${mo.estimatedGrossOpportunityEur}`, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="py-1.5">
            <div className="text-2xs text-slate-500">{label}</div>
            <div className={`font-mono text-sm font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>
      {/* Windows table */}
      <div className="overflow-auto">
        <table className="w-full text-2xs">
          <thead>
            <tr className="text-slate-500 text-left">
              <th className="px-3 py-2 font-medium"><Clock size={10} className="inline mr-1" />Time</th>
              <th className="px-3 py-2 font-medium">Signal</th>
              <th className="px-3 py-2 font-medium">Recommended FSP Action</th>
              <th className="px-3 py-2 font-medium text-right">Flex Available</th>
              <th className="px-3 py-2 font-medium text-right">Mock Value</th>
            </tr>
          </thead>
          <tbody>
            {mo.windows.map((w, i) => (
              <tr
                key={i}
                className={`border-t border-gray-700/30 ${w.highlight ? 'bg-blue-900/10' : 'hover:bg-gray-800/30'}`}
              >
                <td className="px-3 py-2 font-mono text-slate-300">{w.time}</td>
                <td className="px-3 py-2 text-slate-400">{w.signal}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <SignalBadge direction={w.direction} />
                    <span className="text-slate-300">{w.action}</span>
                    {w.highlight && (
                      <span className="ml-1 px-1 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-700/40 text-2xs">Best window</span>
                    )}
                  </div>
                </td>
                <td className={`px-3 py-2 font-mono text-right ${w.direction === 'up' ? 'text-green-400' : 'text-blue-400'}`}>{w.flexMw}</td>
                <td className="px-3 py-2 font-mono text-right text-green-400">€{w.mockValueEur}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
