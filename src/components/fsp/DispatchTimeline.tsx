import { Card, CardHeader } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { DispatchOrder } from '../../types/api'
import { fmtPower } from '../../lib/format'
import { useApi } from '../../hooks/useApi'
import { getOrders } from '../../api/index'

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-slate-600',
  running: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-slate-500',
}

const STATUS_BADGE: Record<string, 'green' | 'amber' | 'red' | 'blue' | 'slate'> = {
  pending: 'slate',
  running: 'blue',
  completed: 'green',
  failed: 'red',
  cancelled: 'slate',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ausstehend',
  running: 'Aktiv',
  completed: 'Abgeschlossen',
  failed: 'Fehlgeschlagen',
  cancelled: 'Storniert',
}

function timeToX(timeStr: string, dayStart = 0, dayEnd = 24): number {
  const h = new Date(timeStr).getHours() + new Date(timeStr).getMinutes() / 60
  return Math.max(0, Math.min(100, ((h - dayStart) / (dayEnd - dayStart)) * 100))
}

export function DispatchTimeline() {
  const { data } = useApi(() => getOrders(), [])
  const orders = data ?? []
  const regions = ['50hertz', 'amprion', 'tennet', 'transnetbw']

  // Group orders by pool region if available (order_type as fallback grouping)
  const ordersByType: Record<string, DispatchOrder[]> = {
    '50hertz': [],
    amprion: [],
    tennet: [],
    transnetbw: [],
    other: [],
  }
  for (const o of orders) {
    ordersByType.other.push(o)
  }

  return (
    <Card>
      <CardHeader title="Dispatch-Timeline" subtitle="Heute · alle Regionen" />
      <div className="p-3">
        {/* Hour axis */}
        <div className="flex mb-2 ml-20">
          {[0, 4, 8, 12, 16, 20, 24].map(h => (
            <div key={h} className="flex-1 text-center">
              <span className="text-2xs text-slate-600 font-mono">{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        {/* Single row showing all orders */}
        {orders.length === 0 ? (
          <div className="flex items-center mb-2 gap-2">
            <div className="w-20 flex-shrink-0 text-right">
              <span className="text-2xs font-mono text-slate-500 uppercase">Aufträge</span>
            </div>
            <div className="flex-1 h-6 bg-gray-700/60 rounded flex items-center justify-center">
              <span className="text-2xs text-slate-700">Keine Aufträge heute</span>
            </div>
          </div>
        ) : (
          regions.map(region => (
            <div key={region} className="flex items-center mb-2 gap-2">
              <div className="w-20 flex-shrink-0 text-right">
                <span className="text-2xs font-mono text-slate-500 uppercase">{region.replace('hertz', 'Hz')}</span>
              </div>
              <div className="flex-1 h-6 bg-gray-700/60 rounded relative">
                {orders.filter((_, i) => i % regions.length === regions.indexOf(region)).map(order => {
                  const x1 = timeToX(order.startTime)
                  const x2 = timeToX(order.endTime)
                  const w = x2 - x1
                  return (
                    <div
                      key={order.id}
                      className={`absolute top-0.5 bottom-0.5 rounded ${STATUS_COLOR[order.status]} opacity-80 flex items-center px-1 overflow-hidden cursor-pointer hover:opacity-100`}
                      style={{ left: `${x1}%`, width: `${Math.max(w, 2)}%` }}
                      title={`${order.orderCode} · ${order.orderType} · ${fmtPower(order.requestedPowerKw)}`}
                    >
                      <span className="text-2xs text-white font-mono truncate whitespace-nowrap">
                        {fmtPower(order.requestedPowerKw)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {/* Legend */}
        <div className="flex gap-3 mt-3 flex-wrap">
          {Object.entries(STATUS_LABEL).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-sm ${STATUS_COLOR[status]}`} />
              <span className="text-2xs text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export function ActivationQueue() {
  const { data } = useApi(() => getOrders(), [])
  const orders = data ?? []
  const active = orders.filter(o => o.status === 'running' || o.status === 'pending')

  return (
    <Card>
      <CardHeader title="Aktivierungswarteschlange" subtitle={`${active.length} aktiv / ausstehend`} />
      <div className="divide-y divide-border-subtle/40">
        {active.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-600">Keine aktiven Aufträge</div>
        ) : (
          active.map(order => <DispatchRow key={order.id} order={order} />)
        )}
      </div>
    </Card>
  )
}

function DispatchRow({ order }: { order: DispatchOrder }) {
  const delivered = order.deliveredPowerKw !== null && order.deliveredPowerKw > 0
    ? Math.round((order.deliveredPowerKw / order.requestedPowerKw) * 100)
    : 0
  return (
    <div className="px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-2xs text-blue-400">{order.orderCode}</span>
            <Badge variant={STATUS_BADGE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{order.orderType}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-mono text-slate-200">{fmtPower(order.requestedPowerKw)}</div>
          <div className={`text-2xs font-mono ${order.direction === 'up' ? 'text-green-400' : 'text-blue-400'}`}>
            {order.direction === 'up' ? '↑' : '↓'}
          </div>
        </div>
      </div>
      {order.status === 'running' && (
        <div className="mt-1.5">
          <div className="flex justify-between text-2xs text-slate-600 mb-1">
            <span>Lieferung</span>
            <span className="font-mono">{delivered}%</span>
          </div>
          <div className="w-full bg-gray-700/60 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${delivered >= 95 ? 'bg-green-500' : delivered >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(delivered, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
