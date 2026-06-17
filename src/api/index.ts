export * from './assets'
export * from './pools'
export { buildQuery } from './client'

import type { DispatchOrder, FlexOffer, TelemetryEvent, MeasuredPoint } from '../types/api'
import type { FlexbandPoint } from './envelio'
import { MOCK_ORDERS } from '../mockData/dispatch'
import {
  MOCK_ALL_FLEX_OFFERS,
  getMockMeasured,
  getMockFlexband,
} from '../mockData/telemetry'

export async function getCompliance() {
  return Promise.resolve([])
}

export async function getTelemetry(_assetId?: string, _limit?: number): Promise<TelemetryEvent[]> {
  return Promise.resolve([])
}

export async function postTelemetry(event: Omit<TelemetryEvent, 'id'>): Promise<TelemetryEvent> {
  return Promise.resolve({ id: `tel-${Date.now()}`, ...event })
}

export interface FlexOfferFilters {
  assetId?: string
  from?: string
  to?: string
  limit?: number
}

export async function getFlexOffers(filters: FlexOfferFilters = {}): Promise<FlexOffer[]> {
  let data = [...MOCK_ALL_FLEX_OFFERS]
  if (filters.from) data = data.filter(o => o.ts >= filters.from!)
  if (filters.to)   data = data.filter(o => o.ts <= filters.to!)
  if (filters.limit) data = data.slice(0, filters.limit)
  return Promise.resolve(data)
}

export async function getLatestFlexOffers(): Promise<FlexOffer[]> {
  const today = new Date().toISOString().slice(0, 10)
  const cutoff = `${today}T17:00:00.000Z`
  return Promise.resolve(
    MOCK_ALL_FLEX_OFFERS.filter(o => o.ts === cutoff),
  )
}

export interface ComputeFlexResult {
  status: string
  assetsUpdated: number
  syncedAt: string
}

export async function computeFlex(): Promise<ComputeFlexResult> {
  return Promise.resolve({ status: 'ok', assetsUpdated: 20, syncedAt: new Date().toISOString() })
}

export interface MeasuredFilters {
  from?: string
  to?: string
  limit?: number
}

export async function getMeasured(assetId: string, filters: MeasuredFilters = {}): Promise<MeasuredPoint[]> {
  const data = getMockMeasured(assetId, filters.from, filters.to)
  if (filters.limit) return Promise.resolve(data.slice(0, filters.limit))
  return Promise.resolve(data)
}

export async function getAssetFlexband(assetId: string, filters: MeasuredFilters = {}): Promise<FlexbandPoint[]> {
  const data = getMockFlexband(assetId, filters.from, filters.to)
  if (filters.limit) return Promise.resolve(data.slice(0, filters.limit))
  return Promise.resolve(data)
}

export async function getOrders(): Promise<DispatchOrder[]> {
  return Promise.resolve(MOCK_ORDERS)
}

export async function getRegistrations() {
  return Promise.resolve([])
}
