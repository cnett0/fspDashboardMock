// Derive a controllability label from the real asset's status + controllable fields
export function assetControllability(a: Asset): 'dispatchable' | 'limited' | 'unavailable' | 'maintenance' {
  if (a.status === 'maintenance') return 'maintenance'
  if (!a.controllable || a.status !== 'active') return 'unavailable'
  return 'dispatchable'
}

// Derive telemetry freshness from the DB freshness threshold and updatedAt timestamp
export function assetTelemetryFreshness(a: Asset): 'fresh' | 'stale' | 'missing' {
  const thresholdMs = (a.telemetryFreshnessSeconds ?? 300) * 1000
  const ageMs = Date.now() - new Date(a.updatedAt).getTime()
  if (ageMs > thresholdMs * 6) return 'missing'
  if (ageMs > thresholdMs) return 'stale'
  return 'fresh'
}

export type AssetType =
  | 'ev_charger' | 'ev_fleet' | 'home_battery' | 'ci_battery'
  | 'heat_pump' | 'thermal_storage' | 'pv_coupled'
  | 'industrial_load' | 'controllable_prosumer'

export type AssetStatus = 'active' | 'inactive' | 'pending' | 'maintenance' | 'decommissioned'

export type PoolType = 'flexibility' | 'fcr' | 'afrr' | 'mfrr' | 'congestion' | 'spot' | 'balancing'
export type PoolStatus = 'active' | 'inactive' | 'draft' | 'archived'

export interface Asset {
  id: string
  assetCode: string
  name: string
  assetType: AssetType
  ownerName?: string
  status: AssetStatus
  controllable: boolean
  nominalPowerKw: number
  availableFlexUpKw: number
  availableFlexDownKw: number
  availableEnergyKwh: number
  telemetryFreshnessSeconds: number
  city?: string
  postalCode?: string
  federalState?: string
  latitude?: number
  longitude?: number
  gridNode?: string
  feederName?: string
  balancingGroup?: string
  settlementRelevant: boolean
  // Three separate fields – always distinct
  uenbRegion?: string
  vnbOperator?: string
  vnbPlanningRegion?: string
  melo?: string | null
  flexAssetIds: string[]
  shovelerSiteId: string | null
  createdAt: string
  updatedAt: string
}

export type OrderType = 'manual' | 'fcr' | 'afrr' | 'mfrr' | 'congestion' | 'spot_arbitrage' | 'schedule'
export type OrderStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface DispatchOrder {
  id: string
  orderCode: string
  assetId: string | null
  poolId: string | null
  orderType: OrderType
  direction: 'up' | 'down'
  requestedPowerKw: number
  deliveredPowerKw: number | null
  startTime: string
  endTime: string
  status: OrderStatus
  createdAt: string
}

export interface Pool {
  id: string
  poolCode: string
  name: string
  description?: string
  poolType: PoolType
  status: PoolStatus
  assetType?: string
  // Three separate fields on pool
  uenbRegion?: string
  vnbOperator?: string
  vnbPlanningRegion?: string
  createdAt: string
  updatedAt: string
  // Aggregated
  assetCount?: number
  totalNominalPowerKw?: number
  totalFlexUpKw?: number
  totalFlexDownKw?: number
  totalEnergyKwh?: number
}

export interface FlexOffer {
  assetId: string
  tenantId: string
  ts: string
  runTs: string
  assetType: string
  baselineKw: number
  pMaxKw: number
  pMinKw: number
  vmaxKwh: number | null
  vminKwh: number | null
  positiveRdvKw: number
  negativeRdvKw: number
  positiveRdaKw: number
  negativeRdaKw: number
  feasibleDurationMinutes: number
  confidence: number | null
  riskScore: number | null
  limitingReasons: string[] | null
}

export interface TelemetryEvent {
  id: string
  assetId: string
  eventType: string
  value: number | null
  unit: string | null
  eventTime: string
}

export interface MeasuredPoint {
  ts: string          // ISO 8601, 15-min UTC bucket
  gridKw: number | null   // net grid exchange  (negative = feed-in)
  pvKw: number | null     // PV production      (positive = generating)
  batKw: number | null    // battery power      (negative = charging)
  soc: number | null      // state of charge (%)
}
