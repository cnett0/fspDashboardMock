import type { SourceHealth } from '../api/market'

// ── Real spot price data from DB (Jun 13–14 2026) ───────────────────────────
// Static dataset: same series always returned regardless of selected date range.
// Solar MW is 0 at night (physically correct), interpolated where DB had nulls.
// Prices reflect actual ENTSO-E data including negative midday values.

export interface SpotPriceMockPoint {
  ts: string         // ISO, used as hourUtc key
  priceEurMwh: number
  windMw: number
  solarMw: number
}

// 48 hours: Jun 13 00:00 UTC → Jun 14 23:00 UTC
// DB returns CET (UTC+2), converted here to UTC
export const MOCK_SPOT_PRICES: SpotPriceMockPoint[] = [
  // ── Jun 13 (UTC) ──────────────────────────────────────────────────────────
  { ts: '2026-06-13T00:00:00.000Z', priceEurMwh: 65.56,  windMw: 12057, solarMw: 0.1 },
  { ts: '2026-06-13T01:00:00.000Z', priceEurMwh: 53.80,  windMw: 12357, solarMw: 0.1 },
  { ts: '2026-06-13T02:00:00.000Z', priceEurMwh: 31.63,  windMw: 10064, solarMw: 8.5 },
  { ts: '2026-06-13T03:00:00.000Z', priceEurMwh: 13.66,  windMw:  8745, solarMw: 575 },
  { ts: '2026-06-13T04:00:00.000Z', priceEurMwh:  0.33,  windMw: 10063, solarMw: 3790 },
  { ts: '2026-06-13T05:00:00.000Z', priceEurMwh: -1.45,  windMw: 12149, solarMw: 10067 },
  { ts: '2026-06-13T06:00:00.000Z', priceEurMwh: -4.92,  windMw: 14433, solarMw: 18288 },
  { ts: '2026-06-13T07:00:00.000Z', priceEurMwh: -15.70, windMw: 15737, solarMw: 25620 },
  { ts: '2026-06-13T08:00:00.000Z', priceEurMwh: -27.42, windMw: 17346, solarMw: 30607 },
  { ts: '2026-06-13T09:00:00.000Z', priceEurMwh: -45.87, windMw: 18272, solarMw: 35130 },
  { ts: '2026-06-13T10:00:00.000Z', priceEurMwh: -44.49, windMw: 18942, solarMw: 37640 },
  { ts: '2026-06-13T11:00:00.000Z', priceEurMwh: -31.54, windMw: 19413, solarMw: 38125 },
  { ts: '2026-06-13T12:00:00.000Z', priceEurMwh: -19.17, windMw: 19397, solarMw: 37184 },
  { ts: '2026-06-13T13:00:00.000Z', priceEurMwh:  -4.22, windMw: 18643, solarMw: 34605 },
  { ts: '2026-06-13T14:00:00.000Z', priceEurMwh:  -0.55, windMw: 17731, solarMw: 30041 },
  { ts: '2026-06-13T15:00:00.000Z', priceEurMwh:  33.41, windMw: 16990, solarMw: 23531 },
  { ts: '2026-06-13T16:00:00.000Z', priceEurMwh:  72.26, windMw: 15965, solarMw: 16000 },
  { ts: '2026-06-13T17:00:00.000Z', priceEurMwh:  87.16, windMw: 15154, solarMw:  8285 },
  { ts: '2026-06-13T18:00:00.000Z', priceEurMwh: 102.49, windMw: 12755, solarMw:  2494 },
  { ts: '2026-06-13T19:00:00.000Z', priceEurMwh:  88.00, windMw: 11369, solarMw:   179 },
  { ts: '2026-06-13T20:00:00.000Z', priceEurMwh:  87.09, windMw: 12589, solarMw:   0.5 },
  { ts: '2026-06-13T21:00:00.000Z', priceEurMwh:  74.05, windMw: 15283, solarMw:   0.2 },
  { ts: '2026-06-13T22:00:00.000Z', priceEurMwh:  34.08, windMw: 14944, solarMw:   0.1 },
  { ts: '2026-06-13T23:00:00.000Z', priceEurMwh:  28.07, windMw: 15005, solarMw:   0.1 },
  // ── Jun 14 (UTC) ──────────────────────────────────────────────────────────
  { ts: '2026-06-14T00:00:00.000Z', priceEurMwh:  26.57, windMw: 14960, solarMw:   0.1 },
  { ts: '2026-06-14T01:00:00.000Z', priceEurMwh:  21.37, windMw: 15070, solarMw:   0.1 },
  { ts: '2026-06-14T02:00:00.000Z', priceEurMwh:   7.74, windMw: 12155, solarMw:   3.5 },
  { ts: '2026-06-14T03:00:00.000Z', priceEurMwh:   0.46, windMw: 10343, solarMw:  647 },
  { ts: '2026-06-14T04:00:00.000Z', priceEurMwh:  -0.35, windMw: 11547, solarMw:  4159 },
  { ts: '2026-06-14T05:00:00.000Z', priceEurMwh:  -2.83, windMw: 13546, solarMw:  9835 },
  { ts: '2026-06-14T06:00:00.000Z', priceEurMwh:  -6.37, windMw: 14762, solarMw: 15313 },
  { ts: '2026-06-14T07:00:00.000Z', priceEurMwh:  -9.29, windMw: 16435, solarMw: 21253 },
  { ts: '2026-06-14T08:00:00.000Z', priceEurMwh: -14.99, windMw: 17173, solarMw: 26154 },
  { ts: '2026-06-14T09:00:00.000Z', priceEurMwh: -23.42, windMw: 17599, solarMw: 29863 },
  { ts: '2026-06-14T10:00:00.000Z', priceEurMwh: -25.00, windMw: 18044, solarMw: 32291 },
  { ts: '2026-06-14T11:00:00.000Z', priceEurMwh: -20.00, windMw: 18219, solarMw: 33603 },
  { ts: '2026-06-14T12:00:00.000Z', priceEurMwh:  -9.20, windMw: 18268, solarMw: 32764 },
  { ts: '2026-06-14T13:00:00.000Z', priceEurMwh:  -1.75, windMw: 17754, solarMw: 29838 },
  { ts: '2026-06-14T14:00:00.000Z', priceEurMwh:   5.28, windMw: 17035, solarMw: 25452 },
  { ts: '2026-06-14T15:00:00.000Z', priceEurMwh:  62.08, windMw: 16499, solarMw: 20655 },
  { ts: '2026-06-14T16:00:00.000Z', priceEurMwh:  94.88, windMw: 16232, solarMw: 16431 },
  { ts: '2026-06-14T17:00:00.000Z', priceEurMwh: 102.63, windMw: 14023, solarMw:  8500 },
  { ts: '2026-06-14T18:00:00.000Z', priceEurMwh: 112.28, windMw: 11658, solarMw:  2200 },
  { ts: '2026-06-14T19:00:00.000Z', priceEurMwh: 103.40, windMw: 10300, solarMw:   150 },
  { ts: '2026-06-14T20:00:00.000Z', priceEurMwh:  67.79, windMw: 11463, solarMw:   0.5 },
  { ts: '2026-06-14T21:00:00.000Z', priceEurMwh:  49.44, windMw: 13828, solarMw:   0.2 },
  { ts: '2026-06-14T22:00:00.000Z', priceEurMwh:  85.38, windMw: 13605, solarMw:   0.1 },
  { ts: '2026-06-14T23:00:00.000Z', priceEurMwh:  83.75, windMw: 13454, solarMw:   0.1 },
]

// ── Rebap prices (generated, realistic pattern correlated with spot) ─────────
// Positive rebap = long grid (surplus), negative = short (deficit).
// In Germany: when spot is very negative (midday) the grid tends to be long.
// 15-min resolution for Jun 13-14.

export interface RebapMockPoint {
  ts: string
  rebapEurMwh: number
  posActivationEurMwh: number
  negActivationEurMwh: number
  balancingState: 'long' | 'short' | 'balanced'
}

function buildRebap(): RebapMockPoint[] {
  const points: RebapMockPoint[] = []
  // Rebap values anchored to actual 2026-06-13/14 price profile
  // Midday: very long (negative prices → surplus → rebap positive)
  // Evening: short (demand peak, deficit)
  const hourlyRebap: number[] = [
    // Jun 13 (UTC hours 0-23)
    18,  12,  5,   -8,  -22, -35, -55, -80,
    -95, -120, -115, -90, -70, -45, -25, 22,
    65,  85,  110, 92,  88,  72,  28,  15,
    // Jun 14 (UTC hours 0-23)
    10,  8,   2,   -15, -28, -45, -60, -75,
    -88, -102, -108, -95, -75, -40, -18, 55,
    88,  105, 118, 98,  62,  42,  80,  78,
  ]
  MOCK_SPOT_PRICES.forEach((sp, i) => {
    const base = hourlyRebap[i] ?? 20
    // Generate 4 x 15-min intervals per hour with slight variation
    for (let q = 0; q < 4; q++) {
      const noise = (Math.sin(i * 1.7 + q * 0.9) * 8)
      const rebap = Math.round((base + noise) * 10) / 10
      const state: 'long' | 'short' | 'balanced' =
        rebap > 15 ? 'long' : rebap < -15 ? 'short' : 'balanced'
      const d = new Date(sp.ts)
      d.setUTCMinutes(q * 15)
      points.push({
        ts: d.toISOString(),
        rebapEurMwh: rebap,
        posActivationEurMwh: Math.max(0, rebap) + Math.abs(noise) + 5,
        negActivationEurMwh: Math.max(0, -rebap) + Math.abs(noise) + 3,
        balancingState: state,
      })
    }
  })
  return points
}

export const MOCK_REBAP_PRICES = buildRebap()

// ── Daily spreads (35 days, real DB data) ───────────────────────────────────
export interface DailySpreadMock {
  dateUtc: string
  maxPrice: number
  minPrice: number
  spreadEurMwh: number
  avgPrice: number
  negativeHours: number
}

export const MOCK_DAILY_SPREADS: DailySpreadMock[] = [
  { dateUtc: '2026-05-11', maxPrice: 144.38, minPrice: 19.15,  spreadEurMwh: 125.23, avgPrice: 92.50,  negativeHours: 0 },
  { dateUtc: '2026-05-12', maxPrice: 117.82, minPrice: 114.92, spreadEurMwh:   2.90, avgPrice: 116.37, negativeHours: 0 },
  { dateUtc: '2026-05-13', maxPrice: 122.11, minPrice: 119.95, spreadEurMwh:   2.16, avgPrice: 121.03, negativeHours: 0 },
  { dateUtc: '2026-05-14', maxPrice: 153.22, minPrice: 42.78,  spreadEurMwh: 110.44, avgPrice: 109.23, negativeHours: 0 },
  { dateUtc: '2026-05-15', maxPrice: 142.65, minPrice: -1.02,  spreadEurMwh: 143.66, avgPrice: 80.23,  negativeHours: 3 },
  { dateUtc: '2026-05-16', maxPrice: 160.89, minPrice: 1.40,   spreadEurMwh: 159.49, avgPrice: 86.65,  negativeHours: 0 },
  { dateUtc: '2026-05-17', maxPrice: 137.31, minPrice: 137.12, spreadEurMwh:   0.19, avgPrice: 137.21, negativeHours: 0 },
  { dateUtc: '2026-05-18', maxPrice: 109.23, minPrice: 107.09, spreadEurMwh:   2.14, avgPrice: 108.16, negativeHours: 0 },
  { dateUtc: '2026-05-19', maxPrice: 167.30, minPrice: 33.23,  spreadEurMwh: 134.08, avgPrice: 107.57, negativeHours: 0 },
  { dateUtc: '2026-05-20', maxPrice: 195.66, minPrice: 13.68,  spreadEurMwh: 181.98, avgPrice: 111.50, negativeHours: 0 },
  { dateUtc: '2026-05-21', maxPrice: 222.78, minPrice: 1.14,   spreadEurMwh: 221.64, avgPrice: 107.94, negativeHours: 0 },
  { dateUtc: '2026-05-22', maxPrice: 176.13, minPrice: -45.85, spreadEurMwh: 221.99, avgPrice: 78.51,  negativeHours: 7 },
  { dateUtc: '2026-05-23', maxPrice: 128.87, minPrice: 128.83, spreadEurMwh:   0.04, avgPrice: 128.85, negativeHours: 0 },
  { dateUtc: '2026-05-24', maxPrice: 171.16, minPrice: -64.41, spreadEurMwh: 235.57, avgPrice: 72.51,  negativeHours: 7 },
  { dateUtc: '2026-05-25', maxPrice: 123.01, minPrice: 118.28, spreadEurMwh:   4.72, avgPrice: 120.64, negativeHours: 0 },
  { dateUtc: '2026-05-26', maxPrice: 162.89, minPrice: -1.00,  spreadEurMwh: 163.89, avgPrice: 86.04,  negativeHours: 5 },
  { dateUtc: '2026-05-27', maxPrice: 235.59, minPrice: 0.27,   spreadEurMwh: 235.32, avgPrice: 103.11, negativeHours: 0 },
  { dateUtc: '2026-05-28', maxPrice: 345.13, minPrice: 0.11,   spreadEurMwh: 345.02, avgPrice: 117.85, negativeHours: 0 },
  { dateUtc: '2026-05-29', maxPrice: 171.32, minPrice: -4.27,  spreadEurMwh: 175.59, avgPrice: 86.43,  negativeHours: 5 },
  { dateUtc: '2026-05-30', maxPrice: 123.37, minPrice: 120.64, spreadEurMwh:   2.74, avgPrice: 122.00, negativeHours: 0 },
  { dateUtc: '2026-05-31', maxPrice: 125.46, minPrice: 121.58, spreadEurMwh:   3.88, avgPrice: 123.52, negativeHours: 0 },
  { dateUtc: '2026-06-01', maxPrice: 174.86, minPrice: 80.30,  spreadEurMwh:  94.56, avgPrice: 122.45, negativeHours: 0 },
  { dateUtc: '2026-06-02', maxPrice: 151.97, minPrice: 24.19,  spreadEurMwh: 127.78, avgPrice: 96.34,  negativeHours: 0 },
  { dateUtc: '2026-06-03', maxPrice:  80.59, minPrice: 79.62,  spreadEurMwh:   0.97, avgPrice: 80.10,  negativeHours: 0 },
  { dateUtc: '2026-06-04', maxPrice: 137.42, minPrice: 125.58, spreadEurMwh:  11.83, avgPrice: 131.50, negativeHours: 0 },
  { dateUtc: '2026-06-05', maxPrice:  92.57, minPrice: 85.26,  spreadEurMwh:   7.32, avgPrice: 88.92,  negativeHours: 0 },
  { dateUtc: '2026-06-06', maxPrice: 140.46, minPrice: -30.44, spreadEurMwh: 170.90, avgPrice: 52.10,  negativeHours: 8 },
  { dateUtc: '2026-06-07', maxPrice: 219.04, minPrice: 60.75,  spreadEurMwh: 158.29, avgPrice: 123.98, negativeHours: 0 },
  { dateUtc: '2026-06-08', maxPrice: 161.23, minPrice: 2.81,   spreadEurMwh: 158.42, avgPrice: 98.40,  negativeHours: 0 },
  { dateUtc: '2026-06-09', maxPrice: 222.20, minPrice: 75.29,  spreadEurMwh: 146.92, avgPrice: 127.36, negativeHours: 0 },
  { dateUtc: '2026-06-10', maxPrice: 180.90, minPrice: 37.06,  spreadEurMwh: 143.84, avgPrice: 113.40, negativeHours: 0 },
  { dateUtc: '2026-06-11', maxPrice: 125.75, minPrice: 50.38,  spreadEurMwh:  75.37, avgPrice: 94.89,  negativeHours: 0 },
  { dateUtc: '2026-06-12', maxPrice: 102.49, minPrice: -45.87, spreadEurMwh: 148.35, avgPrice: 24.01,  negativeHours: 10 },
  { dateUtc: '2026-06-13', maxPrice: 112.28, minPrice: -25.00, spreadEurMwh: 137.28, avgPrice: 29.58,  negativeHours: 10 },
  { dateUtc: '2026-06-14', maxPrice: 156.26, minPrice: -2.90,  spreadEurMwh: 159.16, avgPrice: 73.34,  negativeHours: 5 },
]

// ── Negative hours by year (real DB data + historical) ───────────────────────
export interface NegativeHoursYearMock {
  year: number
  negativeHours: number
  avgSpread: number
}

export const MOCK_NEGATIVE_HOURS_BY_YEAR: NegativeHoursYearMock[] = [
  { year: 2018, negativeHours: 134,  avgSpread: 89.2 },
  { year: 2019, negativeHours: 211,  avgSpread: 76.4 },
  { year: 2020, negativeHours: 298,  avgSpread: 65.1 },
  { year: 2021, negativeHours: 186,  avgSpread: 91.8 },
  { year: 2022, negativeHours:  64,  avgSpread: 198.4 },
  { year: 2023, negativeHours: 312,  avgSpread: 88.7 },
  { year: 2024, negativeHours: 468,  avgSpread: 72.3 },
  { year: 2025, negativeHours: 421,  avgSpread: 95.6 },
  { year: 2026, negativeHours: 140,  avgSpread: 118.6 }, // real DB value
]

// ── Variable grid fees (real DB sample — 10 representative operators) ────────
export interface VariableGridFeeMock {
  operatorName: string
  tariffLevel: 'low' | 'standard' | 'high'
  priceEurMwh: number
}

export const MOCK_VARIABLE_GRID_FEES: VariableGridFeeMock[] = [
  { operatorName: 'Albstadtwerke GmbH',       tariffLevel: 'low',      priceEurMwh: 14.21 },
  { operatorName: 'Albstadtwerke GmbH',       tariffLevel: 'standard', priceEurMwh: 71.07 },
  { operatorName: 'Albstadtwerke GmbH',       tariffLevel: 'high',     priceEurMwh: 96.66 },
  { operatorName: 'Avacon Netz GmbH',         tariffLevel: 'low',      priceEurMwh:  6.61 },
  { operatorName: 'Avacon Netz GmbH',         tariffLevel: 'standard', priceEurMwh: 66.07 },
  { operatorName: 'Avacon Netz GmbH',         tariffLevel: 'high',     priceEurMwh: 91.83 },
  { operatorName: 'EWR GmbH',                 tariffLevel: 'low',      priceEurMwh: 30.51 },
  { operatorName: 'EWR GmbH',                 tariffLevel: 'standard', priceEurMwh: 71.07 },
  { operatorName: 'EWR GmbH',                 tariffLevel: 'high',     priceEurMwh: 95.95 },
  { operatorName: 'AllgäuNetz GmbH',          tariffLevel: 'low',      priceEurMwh: 28.43 },
  { operatorName: 'AllgäuNetz GmbH',          tariffLevel: 'standard', priceEurMwh: 71.07 },
  { operatorName: 'AllgäuNetz GmbH',          tariffLevel: 'high',     priceEurMwh: 113.72 },
  { operatorName: 'AVU Netz GmbH',            tariffLevel: 'low',      priceEurMwh: 23.45 },
  { operatorName: 'AVU Netz GmbH',            tariffLevel: 'standard', priceEurMwh: 71.07 },
  { operatorName: 'AVU Netz GmbH',            tariffLevel: 'high',     priceEurMwh: 127.93 },
  { operatorName: 'ASCANETZ GmbH',            tariffLevel: 'low',      priceEurMwh: 25.17 },
  { operatorName: 'ASCANETZ GmbH',            tariffLevel: 'standard', priceEurMwh: 76.28 },
  { operatorName: 'ASCANETZ GmbH',            tariffLevel: 'high',     priceEurMwh: 114.41 },
  { operatorName: 'Albwerk GmbH & Co. KG',    tariffLevel: 'low',      priceEurMwh: 28.43 },
  { operatorName: 'Albwerk GmbH & Co. KG',    tariffLevel: 'standard', priceEurMwh: 71.07 },
  { operatorName: 'Albwerk GmbH & Co. KG',    tariffLevel: 'high',     priceEurMwh: 109.45 },
]

// ── Load-dependent grid fees (representative VNB sample) ────────────────────
export interface LoadDependentFeeMock {
  operatorName: string
  region: string
  priceEurKwYear: number
}

export const MOCK_LOAD_DEPENDENT_FEES: LoadDependentFeeMock[] = [
  { operatorName: 'SH Netz AG',           region: 'North',  priceEurKwYear: 42.80 },
  { operatorName: 'EWE Netz GmbH',        region: 'North',  priceEurKwYear: 38.60 },
  { operatorName: 'Wesernetz Bremen',      region: 'North',  priceEurKwYear: 51.20 },
  { operatorName: 'Avacon Netz GmbH',     region: 'North',  priceEurKwYear: 45.40 },
  { operatorName: 'Netze BW GmbH',        region: 'South',  priceEurKwYear: 67.90 },
  { operatorName: 'LEW Verteilnetz GmbH', region: 'South',  priceEurKwYear: 58.30 },
  { operatorName: 'Bayernwerk Netz GmbH', region: 'South',  priceEurKwYear: 62.10 },
  { operatorName: 'Westnetz GmbH',        region: 'West',   priceEurKwYear: 54.70 },
  { operatorName: 'AVU Netz GmbH',        region: 'West',   priceEurKwYear: 59.20 },
  { operatorName: 'MITNETZ STROM',        region: 'East',   priceEurKwYear: 48.50 },
  { operatorName: 'E.DIS Netz GmbH',      region: 'East',   priceEurKwYear: 44.30 },
]

// ── PV self-consumption series (real DB data 2012–2024) ──────────────────────
export interface PvSelfConsumptionMock {
  year: number
  eegTariffEurKwh: number
  householdGrossEurKwh: number
  householdWorkEurKwh: number
  solarMarketValueEurKwh: number | null
}

export const MOCK_PV_SELF_CONSUMPTION: PvSelfConsumptionMock[] = [
  { year: 2012, eegTariffEurKwh: 0.1759, householdGrossEurKwh: 0.2576, householdWorkEurKwh: 0.2233, solarMarketValueEurKwh: 0.0452 },
  { year: 2013, eegTariffEurKwh: 0.1482, householdGrossEurKwh: 0.2888, householdWorkEurKwh: 0.2545, solarMarketValueEurKwh: 0.0378 },
  { year: 2014, eegTariffEurKwh: 0.1300, householdGrossEurKwh: 0.2969, householdWorkEurKwh: 0.2626, solarMarketValueEurKwh: 0.0336 },
  { year: 2015, eegTariffEurKwh: 0.1232, householdGrossEurKwh: 0.2904, householdWorkEurKwh: 0.2561, solarMarketValueEurKwh: 0.0318 },
  { year: 2016, eegTariffEurKwh: 0.1199, householdGrossEurKwh: 0.2852, householdWorkEurKwh: 0.2509, solarMarketValueEurKwh: 0.0290 },
  { year: 2017, eegTariffEurKwh: 0.1276, householdGrossEurKwh: 0.2962, householdWorkEurKwh: 0.2619, solarMarketValueEurKwh: 0.0341 },
  { year: 2018, eegTariffEurKwh: 0.1231, householdGrossEurKwh: 0.2985, householdWorkEurKwh: 0.2642, solarMarketValueEurKwh: 0.0451 },
  { year: 2019, eegTariffEurKwh: 0.1014, householdGrossEurKwh: 0.3089, householdWorkEurKwh: 0.2746, solarMarketValueEurKwh: 0.0376 },
  { year: 2020, eegTariffEurKwh: 0.0870, householdGrossEurKwh: 0.3128, householdWorkEurKwh: 0.2785, solarMarketValueEurKwh: 0.0282 },
  { year: 2021, eegTariffEurKwh: 0.0820, householdGrossEurKwh: 0.3187, householdWorkEurKwh: 0.2844, solarMarketValueEurKwh: 0.0803 },
  { year: 2022, eegTariffEurKwh: 0.0820, householdGrossEurKwh: 0.3726, householdWorkEurKwh: 0.3383, solarMarketValueEurKwh: 0.1912 },
  { year: 2023, eegTariffEurKwh: 0.0820, householdGrossEurKwh: 0.4105, householdWorkEurKwh: 0.3762, solarMarketValueEurKwh: 0.0816 },
  { year: 2024, eegTariffEurKwh: 0.0820, householdGrossEurKwh: 0.3957, householdWorkEurKwh: 0.3614, solarMarketValueEurKwh: 0.0720 },
]

// ── FCR / aFRR reserve results (generated plausible data) ───────────────────
export interface ReserveResultMock {
  periodStartUtc: string
  product: string
  capacityPriceEurMw: number
  energyPriceEurMwh: number | null
  awardedMw: number
}

export const MOCK_FCR_RESULTS: ReserveResultMock[] = Array.from({ length: 52 }, (_, i) => {
  const d = new Date('2025-06-16T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - i * 7)
  return {
    periodStartUtc: d.toISOString(),
    product: 'FCR',
    capacityPriceEurMw: Math.round((8 + Math.sin(i * 0.4) * 4 + Math.random() * 3) * 100) / 100,
    energyPriceEurMwh: null,
    awardedMw: Math.round((1400 + Math.sin(i * 0.3) * 200) * 10) / 10,
  }
})

export const MOCK_AFRR_RESULTS: ReserveResultMock[] = Array.from({ length: 52 }, (_, i) => {
  const d = new Date('2025-06-16T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - i * 7)
  return {
    periodStartUtc: d.toISOString(),
    product: 'aFRR',
    capacityPriceEurMw: Math.round((22 + Math.sin(i * 0.5) * 8 + Math.random() * 5) * 100) / 100,
    energyPriceEurMwh: Math.round((45 + Math.sin(i * 0.6) * 15) * 100) / 100,
    awardedMw: Math.round((2800 + Math.sin(i * 0.35) * 400) * 10) / 10,
  }
})

// ── Source health ────────────────────────────────────────────────────────────
export const MOCK_SOURCE_HEALTH: SourceHealth[] = [
  {
    sourceSystem: 'entsoe',
    lastSuccessAt: '2026-06-14T16:57:00.000Z',
    lastAttemptAt: '2026-06-14T16:57:00.000Z',
    lastError: null,
    consecutiveErrors: 0,
    rowCount: 48,
    staleAfterHours: 2,
    isConfigured: true,
    isStale: false,
    status: 'ok',
  },
  {
    sourceSystem: 'netztransparenz',
    lastSuccessAt: '2026-06-14T15:30:00.000Z',
    lastAttemptAt: '2026-06-14T15:30:00.000Z',
    lastError: null,
    consecutiveErrors: 0,
    rowCount: 192,
    staleAfterHours: 1,
    isConfigured: true,
    isStale: false,
    status: 'ok',
  },
  {
    sourceSystem: 'bundesnetzagentur',
    lastSuccessAt: '2026-06-14T08:00:00.000Z',
    lastAttemptAt: '2026-06-14T08:00:00.000Z',
    lastError: null,
    consecutiveErrors: 0,
    rowCount: 13,
    staleAfterHours: 24,
    isConfigured: true,
    isStale: false,
    status: 'ok',
  },
  {
    sourceSystem: 'variable_netzentgelte',
    lastSuccessAt: '2026-06-14T10:16:00.000Z',
    lastAttemptAt: '2026-06-14T10:16:00.000Z',
    lastError: null,
    consecutiveErrors: 0,
    rowCount: 21,
    staleAfterHours: 168,
    isConfigured: true,
    isStale: false,
    status: 'ok',
  },
  {
    sourceSystem: 'openmeteo',
    lastSuccessAt: '2026-06-14T17:00:00.000Z',
    lastAttemptAt: '2026-06-14T17:00:00.000Z',
    lastError: null,
    consecutiveErrors: 0,
    rowCount: 96,
    staleAfterHours: 1,
    isConfigured: true,
    isStale: false,
    status: 'ok',
  },
  {
    sourceSystem: 'bdew',
    lastSuccessAt: '2026-06-14T08:30:00.000Z',
    lastAttemptAt: '2026-06-14T08:30:00.000Z',
    lastError: null,
    consecutiveErrors: 0,
    rowCount: 13,
    staleAfterHours: 168,
    isConfigured: true,
    isStale: false,
    status: 'ok',
  },
]
