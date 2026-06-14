export type DenomMethod = 'mean_abs_measured' | 'rated_kw' | 'epsilon'
export type DiagnosticSeverity = 'info' | 'warning' | 'error'

// ── Structured diagnostic entry (new backend format) ─────────────────────────
export interface DiagnosticEntry {
  code: string
  severity: DiagnosticSeverity
  message: string
  timestamp?: string
  affectedSignal?: string
}

// ── New: per-interval forecast fields ────────────────────────────────────────
export interface ForecastInterval {
  timestamp: string
  solarElevationDeg: number
  isDaylight: boolean
  pvForecastKw: number
  loadForecastKw: number
  batteryBaselineKw: number
  batteryChargeKw: number
  batteryDischargeKw: number
  socForecastPct: number
  gridBaselineKw: number
  prodKw: number
  verbKw: number
}

export interface BaselineInterval {
  timestamp: string
  gridBaselineKw: number
  prodKw: number
  verbKw: number
  pvForecastKw: number
  batteryBaselineKw: number
  loadForecastKw: number
  socForecastPct: number
}

export interface FlexbandInterval {
  timestamp: string
  plusRdvKw: number
  minusRdvKw: number
  plusRdeKwh: number
  minusRdeKwh: number
  pvContributionKw: number
  batteryContributionKw: number
  gridLimitBinding: boolean
  batteryEnergyLimitBinding: boolean
  insufficientSixtyMinuteDeliverability: boolean
}

// ── Accuracy details (per-signal RMSE and denominator method) ────────────────
export interface AccuracyDetails {
  excluded_slots_low_coverage?: number
  included_slots?: number
  pv_rmse_kw?: number;       pv_denominator_method?: DenomMethod
  load_rmse_kw?: number;     load_denominator_method?: DenomMethod
  grid_rmse_kw?: number;     grid_denominator_method?: DenomMethod
  battery_rmse_kw?: number;  battery_denominator_method?: DenomMethod
  prod_rmse_kw?: number;     prod_denominator_method?: DenomMethod
  verb_rmse_kw?: number;     verb_denominator_method?: DenomMethod
  // New: also accept camelCase variants from updated backend
  pvRmseKw?: number;         loadRmseKw?: number
  gridRmseKw?: number;       batteryRmseKw?: number
  prodRmseKw?: number;       verbRmseKw?: number
  denominatorMethod?: string
  [key: string]: unknown
}

// ── Accuracy report ───────────────────────────────────────────────────────────
export interface ProsumerAccuracyReport {
  windowStart: string
  windowEnd: string
  resolution: string
  sampleCount: number
  // PV RMS split by daylight (new backend) or combined (legacy)
  pvRmsPctDaylightOnly?: number | null
  pvRmsPctAllDay?: number | null
  pvRmsPct: number | null          // legacy / fallback
  loadRmsPct: number | null
  gridRmsPct: number | null
  batteryRmsPct: number | null
  prodRmsPct: number | null
  verbRmsPct: number | null
  pvBiasPct: number | null
  loadBiasPct: number | null
  gridBiasPct: number | null
  batteryBiasPct: number | null
  prodBiasPct: number | null
  verbBiasPct: number | null
  details: AccuracyDetails
}

export interface FlexOfferStats {
  avgConfidence: number | null
  avgRiskScore: number | null
  sampleCount: number
}

// ── Legacy diagnostics shape (old backend object format) ─────────────────────
export interface LegacyDiagnostics {
  slots_computed: number
  flex_slots_computed: number
  pv_peak_kw: number | null
  battery_capacity_kwh: number | null
  active_diagnostics: string[]
  accuracy_slots_included?: number
  accuracy_slots_excluded?: number
}

export function isLegacyDiagnostics(d: unknown): d is LegacyDiagnostics {
  return !!d && !Array.isArray(d) && typeof d === 'object' && 'active_diagnostics' in (d as object)
}

export function isStructuredDiagnostics(d: unknown): d is DiagnosticEntry[] {
  return Array.isArray(d)
}

export interface AssetAccuracyResult {
  assetId: string
  accuracy: ProsumerAccuracyReport | null
  diagnostics: LegacyDiagnostics | DiagnosticEntry[] | null
  dataQualityFlags: string[]
  flexOfferStats: FlexOfferStats
  computedAt: string | null
  serviceAvailable: boolean
  // New: interval-level forecast/baseline/flexband (optional, absent on old backend)
  forecast?: { intervals: ForecastInterval[] }
  baseline?: { intervals: BaselineInterval[] }
  flexband?: { intervals: FlexbandInterval[] }
}

export async function getAssetAccuracy(assetId: string): Promise<AssetAccuracyResult> {
  return Promise.resolve({
    assetId,
    accuracy: null,
    diagnostics: null,
    dataQualityFlags: [],
    flexOfferStats: { avgConfidence: null, avgRiskScore: null, sampleCount: 0 },
    computedAt: null,
    serviceAvailable: false,
  })
}
