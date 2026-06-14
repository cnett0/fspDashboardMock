import type { Pool, Asset } from '../types/api'
import { MOCK_POOLS, MOCK_POOL_ASSETS } from '../mockData/pools'
import { MOCK_ASSETS } from '../mockData/assets'

export interface PoolFilters {
  uenbRegion?: string
  vnbOperator?: string
  vnbPlanningRegion?: string
  status?: string
  poolType?: string
  assetType?: string
}

export async function getPools(filters: PoolFilters = {}): Promise<Pool[]> {
  let data = [...MOCK_POOLS]

  if (filters.status) data = data.filter(p => p.status === filters.status)
  if (filters.poolType) data = data.filter(p => p.poolType === filters.poolType)
  if (filters.uenbRegion) data = data.filter(p => p.uenbRegion === filters.uenbRegion)
  if (filters.vnbOperator) data = data.filter(p => p.vnbOperator === filters.vnbOperator)
  if (filters.vnbPlanningRegion) data = data.filter(p => p.vnbPlanningRegion === filters.vnbPlanningRegion)

  return Promise.resolve(data)
}

export async function getPool(id: string): Promise<Pool> {
  const pool = MOCK_POOLS.find(p => p.id === id || p.poolCode === id)
  if (!pool) throw new Error(`Pool not found: ${id}`)
  return Promise.resolve(pool)
}

export async function createPool(data: Partial<Pool>): Promise<Pool> {
  const newPool: Pool = {
    id: `pool-${Date.now()}`,
    poolCode: data.poolCode ?? `POOL-MOCK-${Date.now()}`,
    name: data.name ?? 'New Pool',
    poolType: data.poolType ?? 'flexibility',
    status: data.status ?? 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assetCount: 0,
    totalNominalPowerKw: 0,
    totalFlexUpKw: 0,
    totalFlexDownKw: 0,
    totalEnergyKwh: 0,
    ...data,
  }
  return Promise.resolve(newPool)
}

export async function updatePool(id: string, data: Partial<Pool>): Promise<Pool> {
  const existing = MOCK_POOLS.find(p => p.id === id)
  if (!existing) throw new Error(`Pool not found: ${id}`)
  return Promise.resolve({ ...existing, ...data, updatedAt: new Date().toISOString() })
}

export async function deletePool(_id: string): Promise<void> {
  return Promise.resolve()
}

export async function addAssetToPool(_poolId: string, _assetId: string): Promise<void> {
  return Promise.resolve()
}

export async function removeAssetFromPool(_poolId: string, _assetId: string): Promise<void> {
  return Promise.resolve()
}

export async function getPoolAssets(poolId: string): Promise<Asset[]> {
  const assetIds = MOCK_POOL_ASSETS[poolId] ?? []
  const assets = assetIds
    .map(id => MOCK_ASSETS.find(a => a.id === id))
    .filter((a): a is Asset => a !== undefined)
  return Promise.resolve(assets)
}
