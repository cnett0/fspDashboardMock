import { useState } from 'react'
import { Tabs } from '../components/ui/Tabs'
import { Badge } from '../components/ui/Badge'
import { Card, CardHeader } from '../components/ui/Card'
import { DispatchTimeline, ActivationQueue } from '../components/fsp/DispatchTimeline'
import { EventFeed } from '../components/fsp/EventFeed'
import { ViewToggle, type DemoView } from '../components/fsp/ViewToggle'
import { useApi } from '../hooks/useApi'
import { getOrders } from '../api/index'
import type { DispatchOrder } from '../types/api'
import { fmtPower, fmtDateTime, fmtEur } from '../lib/format'
import { DataLoading } from '../components/ui/DataState'
import { MOCK_ACTIVATIONS, type ActivationRecord } from '../data/fspMockData'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Clock, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react'

const STATUS_BADGE: Record<string, 'green' | 'amber' | 'red' | 'blue' | 'slate'> = {
  pending: 'slate', running: 'blue', completed: 'green', failed: 'red', cancelled: 'slate',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', running: 'Active', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled',
}

const ACT_STATUS_BADGE: Record<string, 'green' | 'amber' | 'red' | 'blue' | 'slate'> = {
  active: 'blue', pending: 'slate', completed: 'green', failed: 'red',
}

export function DispatchPage() {
  const [tab, setTab] = useState('activations')
  const [view, setView] = useState<DemoView>('operator')
  const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(null)
  const [selectedAct, setSelectedAct] = useState<ActivationRecord | null>(MOCK_ACTIVATIONS[0])

  const { data, loading } = useApi(() => getOrders(), [])
  const orders = data ?? []

  const running = orders.filter(o => o.status === 'running')
  const pending = orders.filter(o => o.status === 'pending')
  const completed = orders.filter(o => o.status === 'completed')
  const failed = orders.filter(o => o.status === 'failed')
  const activeActs = MOCK_ACTIVATIONS.filter(a => a.status === 'active')
  const pendingActs = MOCK_ACTIVATIONS.filter(a => a.status === 'pending')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-gray-800 bg-gradient-to-br from-gray-600 to-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-sm font-bold text-white">Dispatch Control Center</h1>
            <p className="text-2xs text-slate-500 mt-0.5">CBP activation → asset dispatch → delivery validation</p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              <div className="flex items-center gap-2">
                <StatPill label="Active" value={running.length + activeActs.length} color="bg-blue-900/40 text-blue-400" />
                <StatPill label="Pending" value={pending.length + pendingActs.length} color="bg-slate-800 text-slate-400" />
                <StatPill label="Done" value={completed.length} color="bg-green-900/40 text-green-400" />
                <StatPill label="Failed" value={failed.length} color="bg-red-900/40 text-red-400" />
              </div>
            )}
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>
        <Tabs
          tabs={[
            { id: 'activations', label: 'Activation Queue', count: activeActs.length + pendingActs.length },
            { id: 'queue', label: 'Dispatch Queue', count: running.length + pending.length },
            { id: 'timeline', label: 'Timeline' },
            { id: 'history', label: 'History' },
            { id: 'analytics', label: 'Analytics' },
          ]}
          activeTab={tab}
          onChange={setTab}
        />
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {loading && <DataLoading />}
        {!loading && tab === 'activations' && (
          <ActivationTraceabilityTab
            selected={selectedAct}
            onSelect={setSelectedAct}
            view={view}
          />
        )}
        {!loading && tab === 'queue' && (
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 lg:col-span-8 space-y-3">
              <ActivationQueue />
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-3">
              <EventFeed maxItems={8} />
            </div>
          </div>
        )}
        {!loading && tab === 'timeline' && <DispatchTimeline />}
        {!loading && tab === 'history' && (
          <HistoryTab orders={[...completed, ...failed]} onSelect={setSelectedOrder} selected={selectedOrder} />
        )}
        {!loading && tab === 'analytics' && <AnalyticsTab orders={orders} />}
      </div>
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${color} text-xs font-medium`} style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
      <span className="font-mono font-bold">{value}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  )
}

// ── Activation Traceability Tab ───────────────────────────────────────────────

function ActivationTraceabilityTab({
  selected,
  onSelect,
  view,
}: {
  selected: ActivationRecord | null
  onSelect: (a: ActivationRecord) => void
  view: DemoView
}) {
  return (
    <div className="grid grid-cols-12 gap-3">
      {/* Activation list */}
      <div className="col-span-12 lg:col-span-5 space-y-2">
        {MOCK_ACTIVATIONS.map(act => (
          <div
            key={act.id}
            onClick={() => onSelect(act)}
            className={`p-3 rounded border cursor-pointer transition-all ${
              selected?.id === act.id
                ? 'border-blue-500/60 bg-blue-900/10'
                : 'border-gray-700/40 bg-gray-800/20 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-blue-400">{act.activationId}</span>
                <Badge variant={ACT_STATUS_BADGE[act.status]}>{act.status.charAt(0).toUpperCase() + act.status.slice(1)}</Badge>
                <DirectionBadge direction={act.direction} />
              </div>
              <span className="font-mono text-xs text-white">{act.quantityKw} kW</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-2xs">
              <Row label="Product" value={act.product} />
              <Row label="Pool" value={act.poolCode} mono />
              <Row label="Grid Node" value={act.gridNode} mono color="text-amber-400" />
              <Row label="Start" value={act.startTimeUtc.slice(11, 16) + ' UTC'} />
              {view === 'redispatch' && <>
                <Row label="Reference Offer" value={act.referenceOfferId} mono />
                <Row label="Revision" value={`Rev. ${act.revision}`} />
                <Row label="Price" value={`${act.priceEurMwh} €/MWh`} />
                <Row label="Confidence" value={`${act.deliveryConfidencePct}%`} color="text-green-400" />
              </>}
              {view !== 'redispatch' && <Row label="Confidence" value={`${act.deliveryConfidencePct}%`} color="text-green-400" />}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div className="col-span-12 lg:col-span-7 space-y-3">
        {selected && <ActivationDetail act={selected} view={view} />}
        {!selected && (
          <div className="flex items-center justify-center h-64 text-slate-600 text-xs">
            Select an activation to view details
          </div>
        )}
        <EventFeed maxItems={6} />
      </div>
    </div>
  )
}

function ActivationDetail({ act, view }: { act: ActivationRecord; view: DemoView }) {
  const fields = [
    { label: 'Activation ID', value: act.activationId, mono: true, color: 'text-blue-400' },
    { label: 'Product', value: act.product },
    { label: 'Direction', value: act.direction, mono: true },
    { label: 'Quantity', value: `${act.quantityKw} kW`, mono: true },
    { label: 'Pool', value: act.poolCode, mono: true, color: 'text-blue-400' },
    { label: 'Grid Node', value: act.gridNode, mono: true, color: 'text-amber-400' },
    { label: 'Reference Offer', value: act.referenceOfferId, mono: true },
    { label: 'Revision', value: `Rev. ${act.revision}`, mono: true },
    { label: 'Start Time', value: act.startTimeUtc.slice(0, 16).replace('T', ' ') + ' UTC', mono: true },
    { label: 'Duration', value: `${act.durationMin} min`, mono: true },
    { label: 'Price', value: `${act.priceEurMwh} €/MWh`, mono: true },
    { label: 'Delivery Confidence', value: `${act.deliveryConfidencePct}%`, color: 'text-green-400', mono: true },
    { label: 'Status', value: act.status },
  ]

  const visibleFields = view === 'redispatch'
    ? fields
    : view === 'portfolio'
    ? fields.filter(f => ['Activation ID', 'Product', 'Direction', 'Quantity', 'Pool', 'Delivery Confidence', 'Status'].includes(f.label))
    : fields.filter(f => !['Reference Offer', 'Revision'].includes(f.label))

  return (
    <Card>
      <CardHeader
        title={`Activation: ${act.activationId}`}
        subtitle="CBP activation → dispatch → validation trace"
        action={<DirectionBadge direction={act.direction} />}
      />
      <div className="grid grid-cols-2 gap-3 px-3 pb-3">
        {/* Fields */}
        <div className="space-y-1.5">
          {visibleFields.map(f => (
            <div key={f.label} className="flex justify-between text-2xs">
              <span className="text-slate-500">{f.label}</span>
              <span className={`${f.mono ? 'font-mono' : ''} ${f.color ?? 'text-slate-300'}`}>{f.value}</span>
            </div>
          ))}
        </div>
        {/* Event log */}
        <div>
          <div className="text-2xs text-slate-500 mb-2 font-medium">Event Log</div>
          <div className="space-y-1.5">
            {act.eventLog.map((e, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={`mt-0.5 flex-shrink-0 ${
                  e.type === 'success' ? 'text-green-400' :
                  e.type === 'warn' ? 'text-amber-400' : 'text-blue-400'
                }`}>
                  {e.type === 'success' ? <CheckCircle2 size={11} /> :
                   e.type === 'warn' ? <AlertCircle size={11} /> :
                   <Info size={11} />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-2xs text-slate-500">{e.time} </span>
                  <span className="text-2xs text-slate-300">{e.event}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function DirectionBadge({ direction }: { direction: string }) {
  const isUp = direction.includes('+') || direction === 'up'
  return (
    <span className={`px-1.5 py-0.5 rounded text-2xs font-mono border ${
      isUp
        ? 'bg-green-900/30 text-green-400 border-green-700/50'
        : 'bg-blue-900/30 text-blue-400 border-blue-700/50'
    }`}>
      {direction}
    </span>
  )
}

function Row({ label, value, mono = false, color = 'text-slate-300' }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={`${mono ? 'font-mono' : ''} ${color}`}>{value}</span>
    </div>
  )
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab({ orders, onSelect, selected }: { orders: DispatchOrder[]; onSelect: (o: DispatchOrder) => void; selected: DispatchOrder | null }) {
  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-12 lg:col-span-8">
        <Card>
          <CardHeader title="Dispatch History" subtitle={`${orders.length} entries`} />
          <div className="divide-y divide-gray-700/40">
            {orders.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-slate-600">No completed orders</div>
            )}
            {orders.map(order => (
              <div
                key={order.id}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-700/50 transition-colors ${selected?.id === order.id ? 'bg-gray-700/50 border-l-2 border-blue-500' : ''}`}
                onClick={() => onSelect(order)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xs text-blue-400">{order.orderCode}</span>
                    <Badge variant={STATUS_BADGE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                    <Badge variant={order.direction === 'up' ? 'green' : 'blue'}>{order.direction === 'up' ? '↑ RDV+' : '↓ RDV−'}</Badge>
                  </div>
                  <span className="text-xs font-mono text-slate-300">{fmtPower(order.requestedPowerKw)}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-2xs text-slate-600 font-mono">{fmtDateTime(order.startTime)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="col-span-12 lg:col-span-4">
        {selected && (
          <Card className="p-3">
            <div className="text-xs font-semibold text-slate-200 mb-3">{selected.orderCode}</div>
            <div className="space-y-1.5 text-2xs">
              <Row label="Status" value={STATUS_LABEL[selected.status]} />
              <Row label="Type" value={selected.orderType} />
              <Row label="Direction" value={selected.direction === 'up' ? '↑ RDV+' : '↓ RDV−'} />
              <Row label="Requested" value={fmtPower(selected.requestedPowerKw)} />
              <Row label="Delivered" value={selected.deliveredPowerKw !== null ? fmtPower(selected.deliveredPowerKw) : '—'} />
              <Row label="Start" value={fmtDateTime(selected.startTime)} />
              <Row label="End" value={fmtDateTime(selected.endTime)} />
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function AnalyticsTab({ orders }: { orders: DispatchOrder[] }) {
  const byType = Object.entries(
    orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.orderType] = (acc[o.orderType] ?? 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader title="Orders by Type" />
        <div className="p-3">
          {byType.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-600">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byType} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 60 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e2733" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} width={60} />
                <Tooltip contentStyle={{ background: '#181c22', border: '1px solid #263040', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="value" fill="#38bdf8" fillOpacity={0.8} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
      <Card className="p-3">
        <div className="text-xs font-semibold text-slate-200 mb-3">Performance Summary</div>
        <div className="space-y-2">
          {[
            { label: 'Total orders', value: orders.length.toString(), color: 'text-slate-300' },
            { label: 'Completed', value: orders.filter(o => o.status === 'completed').length.toString(), color: 'text-green-400' },
            { label: 'Failed', value: orders.filter(o => o.status === 'failed').length.toString(), color: 'text-red-400' },
            { label: 'Active', value: orders.filter(o => o.status === 'running').length.toString(), color: 'text-blue-400' },
            { label: 'Total delivered', value: fmtPower(orders.filter(o => o.deliveredPowerKw).reduce((s, o) => s + (o.deliveredPowerKw ?? 0), 0)), color: 'text-white' },
            { label: 'Delivery accuracy', value: '97.4%', color: 'text-green-400' },
          ].map(item => (
            <div key={item.label} className="flex justify-between text-xs">
              <span className="text-slate-500">{item.label}</span>
              <span className={`font-mono ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
