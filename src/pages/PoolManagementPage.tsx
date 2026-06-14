import { useState } from 'react'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Tabs } from '../components/ui/Tabs'
import { useToast } from '../components/ui/Toast'
import { useApi, useApiMutation } from '../hooks/useApi'
import { getPools, createPool, updatePool, deletePool, addAssetToPool, removeAssetFromPool, getPoolAssets } from '../api/pools'
import { getAssets } from '../api/assets'
import type { Pool, Asset } from '../types/api'
import { ASSET_TYPE_LABELS } from '../lib/constants'
import { fmtPower, fmtEnergy } from '../lib/format'
import { Plus, Trash2, Edit2, Users, Zap, BarChart2, X, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import { POOL_READINESS } from '../data/fspMockData'

const POOL_TYPE_OPTIONS = [
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'fcr', label: 'FCR' },
  { value: 'afrr', label: 'aFRR' },
  { value: 'mfrr', label: 'mFRR' },
  { value: 'congestion', label: 'Congestion Relief' },
  { value: 'spot', label: 'Spot Market' },
  { value: 'balancing', label: 'Balancing' },
]

const POOL_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
]

const UENB_OPTIONS = [
  { value: '', label: 'Alle ÜNB' },
  { value: '50hertz', label: '50Hertz' },
  { value: 'amprion', label: 'Amprion' },
  { value: 'tennet', label: 'TenneT' },
  { value: 'transnetbw', label: 'TransnetBW' },
]

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400 border-green-700/60 bg-green-900/20',
  inactive: 'text-slate-400 border-slate-700/60 bg-slate-800/20',
  draft: 'text-amber-400 border-amber-700/60 bg-amber-900/20',
  archived: 'text-red-400 border-red-700/60 bg-red-900/20',
}

const TYPE_COLORS: Record<string, string> = {
  flexibility: '#3b82f6',
  fcr: '#22c55e',
  afrr: '#f59e0b',
  mfrr: '#ef4444',
  congestion: '#a855f7',
  spot: '#06b6d4',
  balancing: '#f97316',
}

type FormData = {
  poolCode: string
  name: string
  description: string
  poolType: string
  status: string
  assetType: string
  uenbRegion: string
  vnbOperator: string
  vnbPlanningRegion: string
}

const EMPTY_FORM: FormData = {
  poolCode: '', name: '', description: '', poolType: 'flexibility',
  status: 'draft', assetType: '', uenbRegion: '', vnbOperator: '', vnbPlanningRegion: '',
}

export function PoolManagementPage() {
  const [activeTab, setActiveTab] = useState('pools')
  const [filterUenb, setFilterUenb] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterAssetType, setFilterAssetType] = useState('')
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const { success: toastSuccess, error: toastError } = useToast()

  const { data: pools, loading, refetch } = useApi(
    () => getPools({ uenbRegion: filterUenb || undefined, status: filterStatus || undefined, assetType: filterAssetType || undefined }),
    [filterUenb, filterStatus, filterAssetType],
  )

  const { data: poolAssets, refetch: refetchAssets } = useApi(
    () => selectedPool ? getPoolAssets(selectedPool.id) as Promise<Asset[]> : Promise.resolve([]),
    [selectedPool?.id],
  )

  const { data: allAssets } = useApi(() => getAssets(), [])

  const { mutate: doCreate, loading: creating } = useApiMutation((d: Partial<Pool>) => createPool(d))
  const { mutate: doUpdate, loading: updating } = useApiMutation(({ id, d }: { id: string; d: Partial<Pool> }) => updatePool(id, d))
  const { mutate: doDelete } = useApiMutation((id: string) => deletePool(id))
  const { mutate: doAdd } = useApiMutation(({ poolId, assetId }: { poolId: string; assetId: string }) => addAssetToPool(poolId, assetId))
  const { mutate: doRemove } = useApiMutation(({ poolId, assetId }: { poolId: string; assetId: string }) => removeAssetFromPool(poolId, assetId))

  const setField = (k: keyof FormData, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const openCreate = () => { setForm(EMPTY_FORM); setShowCreateModal(true) }
  const openEdit = (pool: Pool) => {
    setForm({
      poolCode: pool.poolCode, name: pool.name, description: pool.description ?? '',
      poolType: pool.poolType, status: pool.status, assetType: pool.assetType ?? '',
      uenbRegion: pool.uenbRegion ?? '', vnbOperator: pool.vnbOperator ?? '',
      vnbPlanningRegion: pool.vnbPlanningRegion ?? '',
    })
    setSelectedPool(pool)
    setShowEditModal(true)
  }

  const handleCreate = async () => {
    if (!form.poolCode || !form.name) { toastError('Pool-Code und Name erforderlich'); return }
    const result = await doCreate({
      poolCode: form.poolCode, name: form.name,
      description: form.description || undefined,
      poolType: form.poolType as Pool['poolType'],
      status: form.status as Pool['status'],
      assetType: form.assetType || undefined,
      uenbRegion: form.uenbRegion || undefined,
      vnbOperator: form.vnbOperator || undefined,
      vnbPlanningRegion: form.vnbPlanningRegion || undefined,
    })
    if (result) { toastSuccess(`Pool ${result.poolCode} angelegt`); setShowCreateModal(false); refetch() }
    else toastError('Fehler beim Anlegen des Pools')
  }

  const handleUpdate = async () => {
    if (!selectedPool) return
    const result = await doUpdate({
      id: selectedPool.id, d: {
        name: form.name, description: form.description || undefined,
        poolType: form.poolType as Pool['poolType'],
        status: form.status as Pool['status'],
        assetType: form.assetType || undefined,
        uenbRegion: form.uenbRegion || undefined,
        vnbOperator: form.vnbOperator || undefined,
        vnbPlanningRegion: form.vnbPlanningRegion || undefined,
      },
    })
    if (result) { toastSuccess('Pool aktualisiert'); setShowEditModal(false); refetch() }
    else toastError('Fehler beim Aktualisieren')
  }

  const handleDelete = async (pool: Pool) => {
    if (!confirm(`Pool "${pool.name}" wirklich löschen?`)) return
    await doDelete(pool.id)
    toastSuccess(`Pool ${pool.poolCode} gelöscht`)
    if (selectedPool?.id === pool.id) setSelectedPool(null)
    refetch()
  }

  const handleAddAsset = async (assetId: string) => {
    if (!selectedPool) return
    await doAdd({ poolId: selectedPool.id, assetId })
    toastSuccess('Asset zum Pool hinzugefügt')
    refetchAssets()
    refetch()
  }

  const handleRemoveAsset = async (assetId: string) => {
    if (!selectedPool) return
    await doRemove({ poolId: selectedPool.id, assetId })
    toastSuccess('Asset aus Pool entfernt')
    refetchAssets()
    refetch()
  }

  const displayedPools = pools ?? []
  const assignedIds = new Set((poolAssets ?? []).map((a: Asset) => a.id))
  const unassignedAssets = (allAssets ?? []).filter(a => !assignedIds.has(a.id))

  // Compute pool composition stats by three separate dimensions
  const poolStats = selectedPool && poolAssets ? (() => {
    const assets = poolAssets as Asset[]
    const byUenb = new Map<string, number>()
    const byVnbOp = new Map<string, number>()
    const byVnbPr = new Map<string, number>()
    for (const a of assets) {
      const u = a.uenbRegion ?? 'Unbekannt'
      const v = a.vnbOperator ?? 'Unbekannt'
      const p = a.vnbPlanningRegion ?? 'Unbekannt'
      byUenb.set(u, (byUenb.get(u) ?? 0) + 1)
      byVnbOp.set(v, (byVnbOp.get(v) ?? 0) + 1)
      byVnbPr.set(p, (byVnbPr.get(p) ?? 0) + 1)
    }
    return { byUenb, byVnbOp, byVnbPr, total: assets.length }
  })() : null

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Pool list */}
      <div className="w-80 flex-shrink-0 border-r border-gray-800 flex flex-col bg-gradient-to-b from-gray-600 to-gray-900 overflow-hidden">
        <div className="p-3 border-b border-gray-800 space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-white">Pool-Verwaltung</h1>
            <Button variant="primary" onClick={openCreate} className="h-7 px-2 text-2xs gap-1">
              <Plus size={12} /> Neuer Pool
            </Button>
          </div>
          <div className="flex gap-2">
            <Select
              value={filterUenb}
              onChange={e => setFilterUenb(e.target.value)}
              options={UENB_OPTIONS}
              className="flex-1"
            />
            <Select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              options={[{ value: '', label: 'Alle Status' }, ...POOL_STATUS_OPTIONS]}
              className="flex-1"
            />
          </div>
          <Select
            value={filterAssetType}
            onChange={e => setFilterAssetType(e.target.value)}
            options={[
              { value: '', label: 'Alle Asset-Typen' },
              ...Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>

        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-2xs text-slate-500">Laden…</div>
          )}
          {!loading && displayedPools.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Users size={24} className="text-slate-600 mb-2" />
              <p className="text-xs text-slate-500">Keine Pools gefunden</p>
              <p className="text-2xs text-slate-600 mt-1">Backend ggf. nicht verbunden</p>
            </div>
          )}
          {displayedPools.map(pool => (
            <div
              key={pool.id}
              onClick={() => { setSelectedPool(pool); setActiveTab('detail') }}
              className={`p-3 border-b border-gray-700/40 cursor-pointer transition-colors hover:bg-gray-800/50 ${selectedPool?.id === pool.id ? 'bg-gray-800/50 border-l-2 border-l-blue-500' : ''}`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[pool.poolType] ?? '#666' }} />
                  <span className="font-mono text-2xs text-blue-400 truncate">{pool.poolCode}</span>
                </div>
                <span className={`text-2xs px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${STATUS_COLORS[pool.status] ?? ''}`}>
                  {pool.status}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate mb-1">{pool.name}</div>
              <div className="flex items-center justify-between text-2xs text-slate-500">
                <span>{pool.poolType}</span>
                <span>{pool.assetCount ?? 0} Assets</span>
              </div>
              {(pool.uenbRegion || pool.vnbOperator || pool.vnbPlanningRegion) && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {pool.uenbRegion && <Badge variant="blue">{pool.uenbRegion}</Badge>}
                  {pool.vnbOperator && <Badge variant="amber">{pool.vnbOperator}</Badge>}
                  {pool.vnbPlanningRegion && <Badge variant="slate">{pool.vnbPlanningRegion}</Badge>}
                </div>
              )}
              <div className="flex items-center gap-3 mt-2 text-2xs">
                <span className="text-green-400 font-mono">{fmtPower((pool.totalFlexUpKw ?? 0))}</span>
                <span className="text-blue-400 font-mono">{fmtPower((pool.totalFlexDownKw ?? 0))}</span>
                <span className="text-slate-500 font-mono">{fmtEnergy((pool.totalEnergyKwh ?? 0))}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Detail panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedPool ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <BarChart2 size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-500">Pool aus der Liste wählen</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-gray-800 bg-gradient-to-br from-gray-600 to-gray-900 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[selectedPool.poolType] ?? '#666' }} />
                    <span className="font-mono text-xs text-blue-400">{selectedPool.poolCode}</span>
                    <span className={`text-2xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[selectedPool.status]}`}>
                      {selectedPool.status}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-white mt-0.5">{selectedPool.name}</h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => openEdit(selectedPool)} className="h-7 px-2 text-2xs gap-1">
                    <Edit2 size={12} /> Bearbeiten
                  </Button>
                  <Button variant="primary" onClick={() => setShowAssignModal(true)} className="h-7 px-2 text-2xs gap-1">
                    <Plus size={12} /> Asset zuweisen
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(selectedPool)} className="h-7 px-2 text-2xs gap-1">
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
              <Tabs
                tabs={[
                  { id: 'detail', label: 'Detail' },
                  { id: 'assets', label: `Assets (${selectedPool.assetCount ?? 0})` },
                  { id: 'composition', label: 'Zusammensetzung' },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                className="mt-2"
              />
            </div>

            <div className="flex-1 overflow-auto p-3">
              {activeTab === 'detail' && (
                <div className="space-y-3">
                  {/* Pool readiness card */}
                  <PoolReadinessCard poolId={selectedPool.id} />

                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardHeader>Configuration</CardHeader>
                      <div className="p-3 space-y-2">
                        {[
                          ['Product Type', selectedPool.poolType],
                          ['Status', selectedPool.status],
                          ['Description', selectedPool.description ?? '—'],
                          ['Created', new Date(selectedPool.createdAt).toLocaleDateString('en-GB')],
                          ['Updated', new Date(selectedPool.updatedAt).toLocaleDateString('en-GB')],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between text-2xs">
                            <span className="text-slate-500">{k}</span>
                            <span className="text-slate-300 font-mono">{v}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card>
                      <CardHeader>Flex Capacity</CardHeader>
                      <div className="p-3 space-y-2">
                        {[
                          ['Assets', selectedPool.assetCount ?? 0, ''],
                          ['Nominal Power', fmtPower(selectedPool.totalNominalPowerKw ?? 0), 'text-slate-300'],
                          ['RDV+ (Available)', fmtPower(selectedPool.totalFlexUpKw ?? 0), 'text-green-400'],
                          ['RDV− (Available)', fmtPower(selectedPool.totalFlexDownKw ?? 0), 'text-blue-400'],
                          ['Energy', fmtEnergy(selectedPool.totalEnergyKwh ?? 0), 'text-slate-300'],
                        ].map(([k, v, cls]) => (
                          <div key={String(k)} className="flex justify-between text-2xs">
                            <span className="text-slate-500">{k}</span>
                            <span className={`font-mono ${cls || 'text-slate-300'}`}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="col-span-2">
                      <CardHeader>Grid Classification</CardHeader>
                      <div className="p-3 grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-2xs text-slate-600 mb-1">TSO Region (ÜNB)</div>
                          <div className="text-xs font-mono text-blue-400">{selectedPool.uenbRegion ?? '—'}</div>
                          <div className="text-2xs text-slate-600 mt-1 italic">Transmission system operator</div>
                        </div>
                        <div>
                          <div className="text-2xs text-slate-600 mb-1">DSO Operator (VNB)</div>
                          <div className="text-xs font-mono text-amber-400">{selectedPool.vnbOperator ?? '—'}</div>
                          <div className="text-2xs text-slate-600 mt-1 italic">Distribution network operator</div>
                        </div>
                        <div>
                          <div className="text-2xs text-slate-600 mb-1">DSO Planning Region</div>
                          <div className="text-xs font-mono text-purple-400">{selectedPool.vnbPlanningRegion ?? '—'}</div>
                          <div className="text-2xs text-slate-600 mt-1 italic">Analytical planning region</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'assets' && (
                <div className="space-y-1">
                  {(poolAssets as Asset[] ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Zap size={24} className="text-slate-600 mb-2" />
                      <p className="text-xs text-slate-500">Keine Assets in diesem Pool</p>
                      <Button variant="primary" className="mt-3 text-2xs h-7 px-2 gap-1" onClick={() => setShowAssignModal(true)}>
                        <Plus size={12} /> Asset zuweisen
                      </Button>
                    </div>
                  ) : (
                    (poolAssets as Asset[]).map(asset => (
                      <div key={asset.id} className="flex items-center justify-between p-2.5 bg-gray-800/50 rounded border border-gray-700/40 hover:border-gray-600 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-2xs text-blue-400">{asset.assetCode}</span>
                            <Badge variant="slate">{asset.assetType}</Badge>
                          </div>
                          <div className="text-xs text-slate-300 mt-0.5 truncate">{asset.name}</div>
                          <div className="flex gap-3 mt-1 text-2xs text-slate-500">
                            {asset.uenbRegion && <span className="text-blue-400">{asset.uenbRegion}</span>}
                            {asset.vnbOperator && <span className="text-amber-400">{asset.vnbOperator}</span>}
                            {asset.vnbPlanningRegion && <span className="text-purple-400">{asset.vnbPlanningRegion}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          <div className="text-right text-2xs">
                            <div className="text-green-400 font-mono">{fmtPower(asset.availableFlexUpKw)}</div>
                            <div className="text-blue-400 font-mono">{fmtPower(asset.availableFlexDownKw)}</div>
                          </div>
                          <button
                            onClick={() => handleRemoveAsset(asset.id)}
                            className="text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'composition' && poolStats && (
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardHeader>Nach ÜNB-Region</CardHeader>
                    <div className="p-3 space-y-2">
                      {[...poolStats.byUenb.entries()].map(([k, count]) => (
                        <div key={k}>
                          <div className="flex justify-between text-2xs mb-0.5">
                            <span className="text-blue-400 font-mono">{k}</span>
                            <span className="text-slate-400">{count} / {poolStats.total}</span>
                          </div>
                          <div className="h-1 bg-gray-700/60 rounded overflow-hidden">
                            <div className="h-full bg-accent-blue rounded" style={{ width: `${(count / poolStats.total) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                      {poolStats.byUenb.size === 0 && <p className="text-2xs text-slate-500">Keine Daten</p>}
                    </div>
                  </Card>

                  <Card>
                    <CardHeader>Nach VNB-Betreiber</CardHeader>
                    <div className="p-3 space-y-2">
                      {[...poolStats.byVnbOp.entries()].map(([k, count]) => (
                        <div key={k}>
                          <div className="flex justify-between text-2xs mb-0.5">
                            <span className="text-amber-400 font-mono truncate mr-2">{k}</span>
                            <span className="text-slate-400 flex-shrink-0">{count} / {poolStats.total}</span>
                          </div>
                          <div className="h-1 bg-gray-700/60 rounded overflow-hidden">
                            <div className="h-full bg-amber-400 rounded" style={{ width: `${(count / poolStats.total) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                      {poolStats.byVnbOp.size === 0 && <p className="text-2xs text-slate-500">Keine Daten</p>}
                    </div>
                  </Card>

                  <Card>
                    <CardHeader>Nach VNB-Planungsregion</CardHeader>
                    <div className="p-3 space-y-2">
                      {[...poolStats.byVnbPr.entries()].map(([k, count]) => (
                        <div key={k}>
                          <div className="flex justify-between text-2xs mb-0.5">
                            <span className="text-purple-400 font-mono truncate mr-2">{k}</span>
                            <span className="text-slate-400 flex-shrink-0">{count} / {poolStats.total}</span>
                          </div>
                          <div className="h-1 bg-gray-700/60 rounded overflow-hidden">
                            <div className="h-full bg-purple-400 rounded" style={{ width: `${(count / poolStats.total) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                      {poolStats.byVnbPr.size === 0 && <p className="text-2xs text-slate-500">Keine Daten</p>}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Neuen Pool anlegen">
        <PoolForm form={form} setField={setField} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Abbrechen</Button>
          <Button variant="primary" onClick={handleCreate} disabled={creating}>
            {creating ? 'Anlegen…' : 'Pool anlegen'}
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Pool bearbeiten">
        <PoolForm form={form} setField={setField} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowEditModal(false)}>Abbrechen</Button>
          <Button variant="primary" onClick={handleUpdate} disabled={updating}>
            {updating ? 'Speichern…' : 'Speichern'}
          </Button>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Asset zu "${selectedPool?.name}" hinzufügen`}>
        <div className="space-y-1 max-h-80 overflow-auto">
          {unassignedAssets.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6">Alle verfügbaren Assets sind bereits zugewiesen</p>
          )}
          {unassignedAssets.map(asset => (
            <div key={asset.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-700/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xs text-blue-400">{asset.assetCode}</span>
                  <Badge variant="slate">{asset.assetType}</Badge>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">{asset.name}</div>
                <div className="flex gap-2 mt-0.5 text-2xs">
                  {asset.uenbRegion && <span className="text-blue-400">{asset.uenbRegion}</span>}
                  {asset.vnbOperator && <span className="text-amber-400">{asset.vnbOperator}</span>}
                  {asset.vnbPlanningRegion && <span className="text-purple-400">{asset.vnbPlanningRegion}</span>}
                </div>
              </div>
              <Button variant="secondary" className="h-7 px-2 text-2xs" onClick={() => handleAddAsset(asset.id)}>
                + Zuweisen
              </Button>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={() => setShowAssignModal(false)}>Schließen</Button>
        </div>
      </Modal>
    </div>
  )
}

// ── Pool Readiness Card ───────────────────────────────────────────────────────

function PoolReadinessCard({ poolId }: { poolId: string }) {
  const readiness = POOL_READINESS.find(r => r.poolId === poolId)
  if (!readiness) return null

  const pct = readiness.readinessPct
  const barColor = pct >= 85 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
  const textColor = pct >= 85 ? 'text-green-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'

  return (
    <Card>
      <CardHeader title="Pool Readiness & CBP Eligibility" icon={<ShieldCheck size={13} />} />
      <div className="p-3 space-y-3">
        {/* Score row */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xs text-slate-500">Readiness Score</span>
              <span className={`font-mono font-bold text-sm ${textColor}`}>{pct}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {readiness.chips.map(chip => (
              <span key={chip} className="px-1.5 py-0.5 rounded border border-green-700/50 bg-green-900/20 text-2xs text-green-400">{chip}</span>
            ))}
          </div>
        </div>
        {/* Details grid */}
        <div className="grid grid-cols-3 gap-3 text-2xs">
          <div>
            <div className="text-slate-600 mb-0.5">Product Type</div>
            <div className="text-slate-300 font-mono">{readiness.productType}</div>
          </div>
          <div>
            <div className="text-slate-600 mb-0.5">Grid Node</div>
            <div className="text-amber-400 font-mono">{readiness.gridNode}</div>
          </div>
          <div>
            <div className="text-slate-600 mb-0.5">Asset Mix</div>
            <div className="text-slate-300">{readiness.assetMix}</div>
          </div>
          <div>
            <div className="text-slate-600 mb-0.5">Last PRS Submission</div>
            <div className="text-slate-300 font-mono">{new Date(readiness.lastPrsSubmission).toLocaleString('en-GB').slice(0, 17)}</div>
          </div>
          <div>
            <div className="text-slate-600 mb-0.5">Last Validation RMS</div>
            <div className="text-green-400 font-mono">{readiness.lastValidationRmsKw} kW</div>
          </div>
          <div>
            <div className="text-slate-600 mb-0.5">DSO Operator</div>
            <div className="text-amber-400">{readiness.vnbOperator ?? '—'}</div>
          </div>
        </div>
        {/* Eligibility checklist */}
        <div>
          <div className="text-2xs text-slate-600 mb-1.5 font-medium">Eligibility Checklist</div>
          <div className="grid grid-cols-2 gap-1">
            {readiness.eligibilityChecks.map(c => (
              <div key={c.label} className="flex items-center gap-1.5 text-2xs">
                {c.ok
                  ? <CheckCircle2 size={11} className="text-green-400 flex-shrink-0" />
                  : c.warning
                  ? <AlertCircle size={11} className="text-amber-400 flex-shrink-0" />
                  : <AlertCircle size={11} className="text-red-400 flex-shrink-0" />}
                <span className={c.ok ? 'text-slate-400' : c.warning ? 'text-amber-300' : 'text-red-300'}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function PoolForm({ form, setField }: { form: FormData; setField: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-2xs text-slate-400 mb-1">Pool-Code *</label>
          <Input value={form.poolCode} onChange={e => setField('poolCode', e.target.value.toUpperCase())} placeholder="z.B. POOL-FCR-01" className="font-mono" />
        </div>
        <div>
          <label className="block text-2xs text-slate-400 mb-1">Name *</label>
          <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Pool-Bezeichnung" />
        </div>
        <div>
          <label className="block text-2xs text-slate-400 mb-1">Pool-Typ</label>
          <Select value={form.poolType} onChange={e => setField('poolType', e.target.value)} options={POOL_TYPE_OPTIONS} />
        </div>
        <div>
          <label className="block text-2xs text-slate-400 mb-1">Status</label>
          <Select value={form.status} onChange={e => setField('status', e.target.value)} options={POOL_STATUS_OPTIONS} />
        </div>
        <div className="col-span-2">
          <label className="block text-2xs text-slate-400 mb-1">Asset-Typ</label>
          <Select
            value={form.assetType}
            onChange={e => setField('assetType', e.target.value)}
            options={[
              { value: '', label: '— Kein spezifischer Typ —' },
              ...Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
      </div>
      <div>
        <label className="block text-2xs text-slate-400 mb-1">Beschreibung</label>
        <Input value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Optional" />
      </div>
      <div className="border-t border-gray-700/40 pt-3">
        <div className="text-2xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Netzeinordnung (alle drei unabhängig)</div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-2xs text-blue-400 mb-1">ÜNB-Region</label>
            <Select
              value={form.uenbRegion}
              onChange={e => setField('uenbRegion', e.target.value)}
              options={[{ value: '', label: '— Keine —' }, { value: '50hertz', label: '50Hertz' }, { value: 'amprion', label: 'Amprion' }, { value: 'tennet', label: 'TenneT' }, { value: 'transnetbw', label: 'TransnetBW' }]}
            />
          </div>
          <div>
            <label className="block text-2xs text-amber-400 mb-1">VNB-Betreiber</label>
            <Select
              value={form.vnbOperator}
              onChange={e => setField('vnbOperator', e.target.value)}
              options={[
                { value: '', label: '— Keine —' },
                { value: 'ewe-netz', label: 'EWE Netz' },
                { value: 'sh-netz', label: 'SH Netz' },
                { value: 'netze-bw', label: 'Netze BW' },
                { value: 'westnetz', label: 'Westnetz' },
                { value: 'wesernetz', label: 'Wesernetz' },
                { value: 'mitnetz', label: 'MITNETZ' },
                { value: 'netz-leipzig', label: 'Netz Leipzig' },
                { value: 'lew-verteil', label: 'LEW Verteil' },
              ]}
            />
          </div>
          <div>
            <label className="block text-2xs text-purple-400 mb-1">VNB-Planungsregion</label>
            <Select
              value={form.vnbPlanningRegion}
              onChange={e => setField('vnbPlanningRegion', e.target.value)}
              options={[
                { value: '', label: '— Keine —' },
                { value: 'nord-west', label: 'Nord-West' },
                { value: 'nord-ost', label: 'Nord-Ost' },
                { value: 'mitte-ost', label: 'Mitte-Ost' },
                { value: 'west-rhein', label: 'West-Rhein' },
                { value: 'sued-west', label: 'Süd-West' },
                { value: 'sued-ost', label: 'Süd-Ost' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
