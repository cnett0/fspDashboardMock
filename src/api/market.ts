import {
  MOCK_SPOT_PRICES,
  MOCK_REBAP_PRICES,
  MOCK_VARIABLE_GRID_FEES,
  MOCK_LOAD_DEPENDENT_FEES,
  MOCK_PV_SELF_CONSUMPTION,
  MOCK_DAILY_SPREADS,
  MOCK_NEGATIVE_HOURS_BY_YEAR,
  MOCK_FCR_RESULTS,
  MOCK_AFRR_RESULTS,
  MOCK_SOURCE_HEALTH,
} from '../mockData/market'

export interface FreshnessMetadata {
  sourceSystem: string
  lastUpdated: string | null
  isStale: boolean
  staleAfterHours: number
}

export interface MarketResponse<T> {
  data: T[]
  meta: {
    count: number
    freshness: FreshnessMetadata
    noData?: boolean
  }
}

export interface SpotPricePoint {
  hourUtc: string
  priceEurMwh: number
}

export interface ForecastPoint {
  hourUtc: string
  forecastMw: number
}

export interface WindForecastPoint {
  ts: string
  windMw: number
}

export interface SolarForecastPoint {
  ts: string
  solarMw: number
}

export interface DailySpread {
  dateUtc: string
  maxPrice: number
  minPrice: number
  spreadEurMwh: number
  avgPrice: number
  negativeHours: number
}

export interface NegativeHoursYear {
  year: number
  negativeHours: number
  avgSpread: number
}

export interface ReserveResult {
  periodStart: string
  product: string
  direction?: string
  capacityPriceEurMw: number | null
  energyPriceEurMwh: number | null
  awardedMw: number | null
}

export interface RebapPoint {
  quarterUtc: string
  rebapEurMwh: number
  seriesType: string
}

export interface VariableGridFeeRow {
  operatorId: string
  operatorName: string
  validFrom: string
  validTo?: string
  tariffLevel: 'low' | 'standard' | 'high'
  priceEurMwh: number
  vnbOperator?: string
  uenbRegion?: string
  vnbPlanningRegion?: string
}

export interface LoadDependentFeeRow {
  operatorId: string
  operatorName: string
  region: string
  uenbRegion?: string
  vnbOperator?: string
  vnbPlanningRegion?: string
  tariffCategory: string
  annualHoursMin?: number
  priceEurKwYear?: number | null
  priceEurMwh?: number | null
  validYear?: number
  sourceUrl?: string
  extractionMethod?: string
  lastVerifiedAt?: string
}

export interface PvSelfConsumptionRow {
  year: number
  eegTariffEurKwh: number | null
  eegSystemClass: string | null
  eegSourceUrl: string | null
  householdGrossEurKwh: number | null
  householdWorkEurKwh: number | null
  householdAnnualKwh: number | null
  householdSourceUrl: string | null
  solarMarketValueEurKwh: number | null
  solarMarketValueSource: string | null
}

export interface SourceHealth {
  sourceSystem: string
  lastSuccessAt: string | null
  lastAttemptAt: string | null
  lastError: string | null
  consecutiveErrors: number
  rowCount: number | null
  staleAfterHours: number
  isConfigured: boolean
  isStale: boolean
  status: 'ok' | 'stale' | 'error' | 'never_synced' | 'not_configured'
}

// ── Helper ───────────────────────────────────────────────────────────────────

function makeFreshness(source: string): FreshnessMetadata {
  return {
    sourceSystem: source,
    lastUpdated: new Date().toISOString(),
    isStale: false,
    staleAfterHours: 2,
  }
}

function makeResponse<T>(data: T[], source: string): MarketResponse<T> {
  return {
    data,
    meta: {
      count: data.length,
      freshness: makeFreshness(source),
    },
  }
}

// ── Spot ─────────────────────────────────────────────────────────────────────
// Date params intentionally ignored — mock always returns the same 48h series.

export const getSpotPrices = (_params?: { from?: string; to?: string; limit?: number }): Promise<MarketResponse<SpotPricePoint>> => {
  const data = MOCK_SPOT_PRICES.map(p => ({
    hourUtc: p.ts,
    priceEurMwh: p.priceEurMwh,
  }))
  return Promise.resolve(makeResponse(data, 'epex'))
}

export const getWindForecast = (_params?: { from?: string; to?: string; limit?: number }): Promise<MarketResponse<ForecastPoint>> => {
  const data = MOCK_SPOT_PRICES.map(p => ({
    hourUtc: p.ts,
    forecastMw: p.windMw,
  }))
  return Promise.resolve(makeResponse(data, 'openmeteo'))
}

export const getSolarForecast = (_params?: { from?: string; to?: string; limit?: number }): Promise<MarketResponse<ForecastPoint>> => {
  const data = MOCK_SPOT_PRICES.map(p => ({
    hourUtc: p.ts,
    forecastMw: p.solarMw,
  }))
  return Promise.resolve(makeResponse(data, 'openmeteo'))
}

export const getDailySpreads = (_limit = 365): Promise<MarketResponse<DailySpread>> => {
  const data: DailySpread[] = MOCK_DAILY_SPREADS.map(s => ({
    dateUtc: s.dateUtc,
    maxPrice: s.maxPrice,
    minPrice: s.minPrice,
    spreadEurMwh: s.spreadEurMwh,
    avgPrice: s.avgPrice,
    negativeHours: s.negativeHours,
  }))
  return Promise.resolve(makeResponse(data, 'epex'))
}

export const getNegativeHoursByYear = (): Promise<{ data: NegativeHoursYear[]; meta: { freshness: FreshnessMetadata } }> => {
  const data: NegativeHoursYear[] = MOCK_NEGATIVE_HOURS_BY_YEAR.map(y => ({
    year: y.year,
    negativeHours: y.negativeHours,
    avgSpread: y.avgSpread,
  }))
  return Promise.resolve({ data, meta: { freshness: makeFreshness('epex') } })
}

// ── Reserve ──────────────────────────────────────────────────────────────────

export const getFcrResults = (_limit = 52): Promise<MarketResponse<ReserveResult>> => {
  const data: ReserveResult[] = MOCK_FCR_RESULTS.map(r => ({
    periodStart: r.periodStartUtc,
    product: r.product,
    capacityPriceEurMw: r.capacityPriceEurMw,
    energyPriceEurMwh: r.energyPriceEurMwh,
    awardedMw: r.awardedMw,
  }))
  return Promise.resolve(makeResponse(data, 'regelleistung'))
}

export const getAfrrResults = (_limit = 52): Promise<MarketResponse<ReserveResult>> => {
  const data: ReserveResult[] = MOCK_AFRR_RESULTS.map(r => ({
    periodStart: r.periodStartUtc,
    product: r.product,
    direction: 'up',
    capacityPriceEurMw: r.capacityPriceEurMw,
    energyPriceEurMwh: r.energyPriceEurMwh,
    awardedMw: r.awardedMw,
  }))
  return Promise.resolve(makeResponse(data, 'regelleistung'))
}

// ── reBAP ─────────────────────────────────────────────────────────────────────
// Date params intentionally ignored — always return full 48h × 4 = 192 quarter-hour series.

export const getRebapPrices = (_params?: { from?: string; to?: string; limit?: number }): Promise<MarketResponse<RebapPoint>> => {
  const data: RebapPoint[] = MOCK_REBAP_PRICES.map(p => ({
    quarterUtc: p.ts,
    rebapEurMwh: p.rebapEurMwh,
    seriesType: p.balancingState,
  }))
  return Promise.resolve(makeResponse(data, 'netztransparenz'))
}

// ── Grid fees ─────────────────────────────────────────────────────────────────

export const getVariableGridFees = (_operatorId?: string): Promise<MarketResponse<VariableGridFeeRow>> => {
  const data: VariableGridFeeRow[] = MOCK_VARIABLE_GRID_FEES.map((fee, i) => ({
    operatorId: `op-${Math.floor(i / 3) + 1}`,
    operatorName: fee.operatorName,
    validFrom: '2026-01-01T00:00:00.000Z',
    tariffLevel: fee.tariffLevel,
    priceEurMwh: fee.priceEurMwh,
    uenbRegion: 'tennet',
  }))
  return Promise.resolve(makeResponse(data, 'variable-netzentgelte'))
}

export const getLoadDependentGridFees = (_region?: string): Promise<MarketResponse<LoadDependentFeeRow>> => {
  const data: LoadDependentFeeRow[] = MOCK_LOAD_DEPENDENT_FEES.map((fee, i) => ({
    operatorId: `op-load-${i + 1}`,
    operatorName: fee.operatorName,
    region: fee.region,
    tariffCategory: 'peak',
    priceEurKwYear: fee.priceEurKwYear,
    priceEurMwh: Number((fee.priceEurKwYear / 1000 * 8760 / 2500).toFixed(2)),
    validYear: 2026,
    extractionMethod: 'Preisblatt 2026',
  }))
  return Promise.resolve(makeResponse(data, 'load-dependent-grid-fees'))
}

// ── PV ────────────────────────────────────────────────────────────────────────

export const getPvSelfConsumption = (): Promise<MarketResponse<PvSelfConsumptionRow>> => {
  const data: PvSelfConsumptionRow[] = MOCK_PV_SELF_CONSUMPTION.map(r => ({
    year: r.year,
    eegTariffEurKwh: r.eegTariffEurKwh,
    eegSystemClass: '≤10 kWp',
    eegSourceUrl: null,
    householdGrossEurKwh: r.householdGrossEurKwh,
    householdWorkEurKwh: r.householdWorkEurKwh,
    householdAnnualKwh: 3500,
    householdSourceUrl: null,
    solarMarketValueEurKwh: r.solarMarketValueEurKwh,
    solarMarketValueSource: 'EPEX',
  }))
  return Promise.resolve(makeResponse(data, 'bundesnetzagentur'))
}

// ── Health ────────────────────────────────────────────────────────────────────

export const getSourcesHealth = (): Promise<{ sources: SourceHealth[]; summary: Record<string, number> }> => {
  const summary: Record<string, number> = {
    ok: MOCK_SOURCE_HEALTH.filter(s => s.status === 'ok').length,
    stale: MOCK_SOURCE_HEALTH.filter(s => s.status === 'stale').length,
    error: MOCK_SOURCE_HEALTH.filter(s => s.status === 'error').length,
  }
  return Promise.resolve({ sources: MOCK_SOURCE_HEALTH, summary })
}

// ── Admin sync ───────────────────────────────────────────────────────────────

export const triggerSync = (_target: 'spot' | 'reserve' | 'rebap' | 'grid-fees' | 'pv' | 'all'): Promise<{ ok: boolean; result: unknown }> => {
  return Promise.resolve({ ok: true, result: null })
}
