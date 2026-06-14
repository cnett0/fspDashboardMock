import type { Asset } from '../types/api'
import { MOCK_ASSETS } from '../mockData/assets'

export interface AssetFilters {
  assetType?: string
  status?: string
  uenbRegion?: string
  vnbOperator?: string
  vnbPlanningRegion?: string
  balancingGroup?: string
  controllable?: boolean
  q?: string
}

export async function getAssets(filters: AssetFilters = {}): Promise<Asset[]> {
  let data = [...MOCK_ASSETS]

  if (filters.status) data = data.filter(a => a.status === filters.status)
  if (filters.assetType) data = data.filter(a => a.assetType === filters.assetType)
  if (filters.uenbRegion) data = data.filter(a => a.uenbRegion === filters.uenbRegion)
  if (filters.vnbOperator) data = data.filter(a => a.vnbOperator === filters.vnbOperator)
  if (filters.vnbPlanningRegion) data = data.filter(a => a.vnbPlanningRegion === filters.vnbPlanningRegion)
  if (filters.balancingGroup) data = data.filter(a => a.balancingGroup === filters.balancingGroup)
  if (filters.controllable !== undefined) data = data.filter(a => a.controllable === filters.controllable)
  if (filters.q) {
    const q = filters.q.toLowerCase()
    data = data.filter(a =>
      a.assetCode.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.city ?? '').toLowerCase().includes(q) ||
      (a.ownerName ?? '').toLowerCase().includes(q)
    )
  }

  return Promise.resolve(data)
}

export async function getAsset(id: string): Promise<Asset> {
  const asset = MOCK_ASSETS.find(a => a.id === id || a.assetCode === id)
  if (!asset) throw new Error(`Asset not found: ${id}`)
  return Promise.resolve(asset)
}

export async function createAsset(data: Partial<Asset>): Promise<Asset> {
  const newAsset: Asset = {
    id: `asset-${Date.now()}`,
    assetCode: data.assetCode ?? `MOCK-${Date.now()}`,
    name: data.name ?? 'New Asset',
    assetType: data.assetType ?? 'ci_battery',
    status: data.status ?? 'active',
    controllable: data.controllable ?? true,
    nominalPowerKw: data.nominalPowerKw ?? 100,
    availableFlexUpKw: data.availableFlexUpKw ?? 80,
    availableFlexDownKw: data.availableFlexDownKw ?? 80,
    availableEnergyKwh: data.availableEnergyKwh ?? 200,
    telemetryFreshnessSeconds: data.telemetryFreshnessSeconds ?? 300,
    settlementRelevant: data.settlementRelevant ?? true,
    flexAssetIds: data.flexAssetIds ?? [],
    shovelerSiteId: data.shovelerSiteId ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  }
  return Promise.resolve(newAsset)
}

export async function updateAsset(id: string, data: Partial<Asset>): Promise<Asset> {
  const existing = MOCK_ASSETS.find(a => a.id === id || a.assetCode === id)
  if (!existing) throw new Error(`Asset not found: ${id}`)
  return Promise.resolve({ ...existing, ...data, updatedAt: new Date().toISOString() })
}

export async function deleteAsset(_id: string): Promise<void> {
  return Promise.resolve()
}

export async function getAssetTelemetry(_id: string) {
  return Promise.resolve([])
}

export async function getAssetCompliance(_id: string) {
  return Promise.resolve(null)
}
