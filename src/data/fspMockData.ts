/**
 * Central FSP mock data for CBP/redispatch demo.
 * All values are static and presentation-ready for TSO/CBP/consortium demos.
 */

// ── FSP Identity ─────────────────────────────────────────────────────────────

export const FSP_IDENTITY = {
  name: 'OLI Systems GmbH',
  role: ['FSP', 'MSP'],
  tsoRegion: 'TenneT Control Area',
  tagline: ' FSP for CBP-based distributed redispatch',
  badges: [] as { label: string; color: string }[],
  description:
    'Distributed Energy Resources converted into grid-relevant, forecastable and verifiable flexibility pools.',
  registeredSince: '2024-11-01',
  pilotPartner: 'TenneT TSO GmbH',
}

// ── Overview KPIs ────────────────────────────────────────────────────────────

export const OVERVIEW_KPIS = {
  registeredAssets: 20,
  activeAssets: 20,
  availableFlexUpKw: 2800,
  availableFlexDownKw: 2700,
  availableEnergyKwh: 6200,
  cbpReadinessPct: 91,
  validationAccuracyPct: 98.7,
  activePools: 4,
  totalPools: 5,
  forecastConfidencePct: 87,
  validationRmsKw: 0.49,
}

// ── CBP Process Steps ────────────────────────────────────────────────────────

export type CbpStepStatus = 'completed' | 'active' | 'pending'

export interface CbpStep {
  id: string
  step: number
  label: string
  shortLabel: string
  status: CbpStepStatus
  timestamp?: string
  note?: string
}

export const CBP_PROCESS_STEPS: CbpStep[] = [
  {
    id: 'register-gcps',
    step: 1,
    label: 'Register Grid Connection Points',
    shortLabel: 'Grid Conn. Points',
    status: 'completed',
    timestamp: '2024-11-01',
    note: '20 GCPs registered',
  },
  {
    id: 'register-devices',
    step: 2,
    label: 'Register Flex Devices',
    shortLabel: 'Flex Devices',
    status: 'completed',
    timestamp: '2024-11-15',
    note: '20 assets',
  },
  {
    id: 'build-pools',
    step: 3,
    label: 'Build Pools',
    shortLabel: 'Build Pools',
    status: 'completed',
    timestamp: '2024-12-01',
    note: '5 pools',
  },
  {
    id: 'submit-planning',
    step: 4,
    label: 'Submit Planning Data',
    shortLabel: 'Planning Data',
    status: 'completed',
    timestamp: 'D-1 14:20 UTC',
    note: 'PRS submitted',
  },
  {
    id: 'offer-rdv',
    step: 5,
    label: 'Offer RDV',
    shortLabel: 'Offer RDV',
    status: 'completed',
    timestamp: 'D-1 15:00 UTC',
    note: 'RDV+ / RDV-',
  },
  {
    id: 'receive-activation',
    step: 6,
    label: 'Receive Activation',
    shortLabel: 'Activation',
    status: 'completed',
    timestamp: '10:20 UTC',
    note: 'CBP signal',
  },
  {
    id: 'dispatch-assets',
    step: 7,
    label: 'Dispatch Assets',
    shortLabel: 'Dispatch',
    status: 'active',
    timestamp: '10:30 UTC',
    note: '275 kW active',
  },
  {
    id: 'submit-measurements',
    step: 8,
    label: 'Submit Measurements',
    shortLabel: 'Measurements',
    status: 'pending',
    note: '15-min resolution',
  },
  {
    id: 'validate-delivery',
    step: 9,
    label: 'Validate Delivery',
    shortLabel: 'Validate',
    status: 'pending',
    note: 'Pending D+1',
  },
]

// ── Market Opportunity ───────────────────────────────────────────────────────

export const MARKET_OPPORTUNITY = {
  daSpotEurMwh: 65.56,
  rebapEurMwh: 18.0,
  fcrCapacityEurMwH: 42,
  afrrUpCapacityEurMwH: 18,
  negativePriceWindowsToday: 3,
  bestActivationWindow: '14:00–16:00 UTC',
  bestProductSignal: 'Redispatch ↓',
  estimatedGrossOpportunityEur: 428,
  recommendedAction: 'Hold downward flex for afternoon congestion window',
  windows: [
    {
      time: '08:00–10:00',
      signal: 'Spot rising',
      action: 'Preserve battery SoC',
      flexMw: '1.4 MW ↓',
      mockValueEur: 86,
      direction: 'down' as const,
    },
    {
      time: '14:00–16:00',
      signal: 'Solar peak / congestion risk',
      action: 'Offer RDV−',
      flexMw: '2.1 MW ↓',
      mockValueEur: 226,
      direction: 'down' as const,
      highlight: true,
    },
    {
      time: '18:00–20:00',
      signal: 'Evening ramp',
      action: 'Offer RDV+',
      flexMw: '1.8 MW ↑',
      mockValueEur: 116,
      direction: 'up' as const,
    },
  ],
}

// ── Grid Relevance ───────────────────────────────────────────────────────────

export const GRID_RELEVANCE = {
  assetsMappedToGcp: 20,
  totalAssets: 20,
  assetsWithGridNode: 20,
  assetsInsideFlexband: 18,
  baselineSubmitted: true,
  measurementResolutionMin: 15,
  flexbandCompliancePct: 94,
  averageDeviationKw: 0.49,
  riskLevel: 'Low' as const,
  checks: [
    { label: 'Grid location mapped', ok: true },
    { label: 'Pool assigned', ok: true },
    { label: 'Flexband calculated', ok: true },
    { label: 'Baseline available', ok: true },
    { label: 'Measurement validation ready', ok: true },
  ],
}

// ── Pool Readiness ────────────────────────────────────────────────────────────

export interface PoolReadiness {
  poolId: string
  poolCode: string
  readinessPct: number
  productType: string
  gridNode: string
  tsoRegion: string
  planningRegion: string
  assetMix: string
  lastPrsSubmission: string
  lastValidationRmsKw: number
  eligibilityChecks: { label: string; ok: boolean; warning?: boolean }[]
  chips: string[]
  vnbOperator?: string
}

export const POOL_READINESS: PoolReadiness[] = [
  {
    poolId: 'pool-1',
    poolCode: 'POOL-NORD-FCR-01',
    readinessPct: 94,
    productType: 'FCR / Redispatch-ready',
    gridNode: 'Sh-O',
    tsoRegion: 'TenneT',
    planningRegion: 'Nord-West',
    assetMix: '5 heat pumps, 2 C&I batteries, 1 PV-storage',
    lastPrsSubmission: '2026-06-14T14:20:00Z',
    lastValidationRmsKw: 0.49,
    vnbOperator: 'SH Netz GmbH',
    eligibilityChecks: [
      { label: 'Same TSO region', ok: true },
      { label: 'Active assets only', ok: true },
      { label: 'Controllable assets', ok: true },
      { label: '15-min telemetry', ok: true },
      { label: 'Baseline available', ok: true },
      { label: 'Flex forecast available', ok: true },
      { label: '1 asset telemetry stale', ok: false, warning: true },
    ],
    chips: ['CBP-ready', 'Grid-node mapped', '15-min measurements', 'Baseline available', 'Activation capable'],
  },
  {
    poolId: 'pool-2',
    poolCode: 'POOL-SUED-FLEX-01',
    readinessPct: 88,
    productType: 'Flexibility / Redispatch',
    gridNode: 'Sl-K',
    tsoRegion: 'TenneT',
    planningRegion: 'Süd-West',
    assetMix: '2 PV-storage, 2 C&I batteries, 2 heat pumps',
    lastPrsSubmission: '2026-06-14T14:18:00Z',
    lastValidationRmsKw: 0.61,
    vnbOperator: 'LEW Verteilnetz',
    eligibilityChecks: [
      { label: 'Same TSO region', ok: true },
      { label: 'Active assets only', ok: true },
      { label: 'Controllable assets', ok: true },
      { label: '15-min telemetry', ok: true },
      { label: 'Baseline available', ok: true },
      { label: 'Flex forecast available', ok: true },
    ],
    chips: ['Grid-node mapped', '15-min measurements', 'Baseline available'],
  },
  {
    poolId: 'pool-3',
    poolCode: 'POOL-MITTE-AFRR-01',
    readinessPct: 72,
    productType: 'aFRR (draft)',
    gridNode: 'Wh-N',
    tsoRegion: 'TenneT',
    planningRegion: 'Nord-West',
    assetMix: '1 heat pump, 2 C&I batteries',
    lastPrsSubmission: '2026-06-13T09:00:00Z',
    lastValidationRmsKw: 1.1,
    vnbOperator: 'Stromnetz Weilheim',
    eligibilityChecks: [
      { label: 'Same TSO region', ok: true },
      { label: 'Active assets only', ok: true },
      { label: 'Controllable assets', ok: true },
      { label: '15-min telemetry', ok: true },
      { label: 'Baseline available', ok: false, warning: true },
      { label: 'Flex forecast available', ok: false, warning: true },
    ],
    chips: ['15-min measurements'],
  },
  {
    poolId: 'pool-4',
    poolCode: 'POOL-NORD-MFRR-01',
    readinessPct: 90,
    productType: 'mFRR',
    gridNode: 'Bm-O',
    tsoRegion: 'TenneT',
    planningRegion: 'Nord-West',
    assetMix: '2 C&I batteries',
    lastPrsSubmission: '2026-06-14T14:15:00Z',
    lastValidationRmsKw: 0.55,
    vnbOperator: 'wesernetz Bremen',
    eligibilityChecks: [
      { label: 'Same TSO region', ok: true },
      { label: 'Active assets only', ok: true },
      { label: 'Controllable assets', ok: true },
      { label: '15-min telemetry', ok: true },
      { label: 'Baseline available', ok: true },
      { label: 'Flex forecast available', ok: true },
    ],
    chips: ['CBP-ready', 'Grid-node mapped', '15-min measurements', 'Baseline available', 'Activation capable'],
  },
  {
    poolId: 'pool-5',
    poolCode: 'POOL-CONGEST-01',
    readinessPct: 45,
    productType: 'Congestion Relief',
    gridNode: 'Ha-W',
    tsoRegion: 'TenneT',
    planningRegion: 'Nord-West',
    assetMix: '1 home battery',
    lastPrsSubmission: '2026-06-10T08:00:00Z',
    lastValidationRmsKw: 0.8,
    vnbOperator: 'SH Netz GmbH',
    eligibilityChecks: [
      { label: 'Same TSO region', ok: true },
      { label: 'Active assets only', ok: true },
      { label: 'Controllable assets', ok: false, warning: true },
      { label: '15-min telemetry', ok: true },
      { label: 'Baseline available', ok: false, warning: true },
      { label: 'Flex forecast available', ok: false, warning: true },
    ],
    chips: ['15-min measurements'],
  },
]

// ── Activation Traceability ──────────────────────────────────────────────────

export interface ActivationRecord {
  id: string
  activationId: string
  product: string
  direction: 'RDV+' | 'RDV-' | 'RDA+' | 'RDA-'
  quantityKw: number
  poolId: string
  poolCode: string
  gridNode: string
  referenceOfferId: string
  revision: number
  startTimeUtc: string
  durationMin: number
  priceEurMwh: number
  status: 'active' | 'pending' | 'completed' | 'failed'
  deliveryConfidencePct: number
  eventLog: { time: string; event: string; type: 'info' | 'success' | 'warn' }[]
}

export const MOCK_ACTIVATIONS: ActivationRecord[] = [
  {
    id: 'act-1',
    activationId: 'FCR-2026-0614-002',
    product: 'Redispatch',
    direction: 'RDV+',
    quantityKw: 275,
    poolId: 'pool-1',
    poolCode: 'POOL-NORD-FCR-01',
    gridNode: 'Sh-O',
    referenceOfferId: 'PRS-2026-06-14-TENNET-SHO',
    revision: 3,
    startTimeUtc: '2026-06-14T10:30:00Z',
    durationMin: 60,
    priceEurMwh: 100.5,
    status: 'active',
    deliveryConfidencePct: 91,
    eventLog: [
      { time: '10:00', event: 'PRS submitted to CBP', type: 'info' },
      { time: '10:10', event: 'Flex offer accepted by TSO', type: 'success' },
      { time: '10:20', event: 'Activation received from CBP', type: 'success' },
      { time: '10:30', event: 'Dispatch started — 275 kW RDV+', type: 'success' },
      { time: '10:45', event: 'First 15-min measurement received', type: 'info' },
      { time: '11:30', event: 'Awaiting delivery validation', type: 'warn' },
    ],
  },
  {
    id: 'act-2',
    activationId: 'MFRR-2026-0614-001',
    product: 'mFRR',
    direction: 'RDV+',
    quantityKw: 230,
    poolId: 'pool-4',
    poolCode: 'POOL-NORD-MFRR-01',
    gridNode: 'Bm-O',
    referenceOfferId: 'PRS-2026-06-14-TENNET-BMO',
    revision: 1,
    startTimeUtc: '2026-06-14T09:00:00Z',
    durationMin: 120,
    priceEurMwh: 85.0,
    status: 'active',
    deliveryConfidencePct: 88,
    eventLog: [
      { time: '08:40', event: 'PRS submitted', type: 'info' },
      { time: '08:55', event: 'Activation received', type: 'success' },
      { time: '09:00', event: 'Dispatch started', type: 'success' },
      { time: '09:15', event: 'First measurement OK', type: 'success' },
    ],
  },
  {
    id: 'act-3',
    activationId: 'FCR-2026-0614-003',
    product: 'FCR',
    direction: 'RDV+',
    quantityKw: 38,
    poolId: 'pool-1',
    poolCode: 'POOL-NORD-FCR-01',
    gridNode: 'Sh-O',
    referenceOfferId: 'PRS-2026-06-14-TENNET-SHO-2',
    revision: 2,
    startTimeUtc: '2026-06-14T14:00:00Z',
    durationMin: 240,
    priceEurMwh: 42.0,
    status: 'pending',
    deliveryConfidencePct: 87,
    eventLog: [
      { time: '10:00', event: 'Offer submitted for 14:00 window', type: 'info' },
    ],
  },
]

// ── Validation Results ────────────────────────────────────────────────────────

export const VALIDATION_SUMMARY = {
  baselineQualityPct: 98.7,
  forecastConfidencePct: 87,
  flexbandCompliancePct: 94,
  deliveryRisk: 'Low' as const,
  rmsDeviationKw: 0.49,
  availableFlexUpKw: 14,
  availableFlexDownKw: 25,
}

export const VALIDATION_TABLE_ROWS = [
  { time: '00:00', baselineKw: 25.5, measuredKw: 26.3, deviationKw: +0.8, flexbandStatus: 'Inside', status: 'OK' },
  { time: '00:15', baselineKw: 24.8, measuredKw: 25.4, deviationKw: +0.6, flexbandStatus: 'Inside', status: 'OK' },
  { time: '00:30', baselineKw: 24.1, measuredKw: 24.4, deviationKw: +0.3, flexbandStatus: 'Inside', status: 'OK' },
  { time: '00:45', baselineKw: 23.5, measuredKw: 23.5, deviationKw: 0.0, flexbandStatus: 'Inside', status: 'OK' },
  { time: '01:00', baselineKw: 22.8, measuredKw: 23.1, deviationKw: +0.3, flexbandStatus: 'Inside', status: 'OK' },
  { time: '01:15', baselineKw: 22.2, measuredKw: 22.8, deviationKw: +0.6, flexbandStatus: 'Inside', status: 'OK' },
  { time: '01:30', baselineKw: 21.8, measuredKw: 22.5, deviationKw: +0.7, flexbandStatus: 'Inside', status: 'OK' },
  { time: '01:45', baselineKw: 21.5, measuredKw: 22.1, deviationKw: +0.6, flexbandStatus: 'Inside', status: 'OK' },
]

// ── Regional grouping info ────────────────────────────────────────────────────

export const POOLING_EXPLANATION = {
  title: 'Pooling Logic',
  body: 'Pools are formed using independent grid and market dimensions. TSO region (ÜNB) identifies the transmission system operator control area, DSO operator (VNB) identifies the connecting distribution network operator, and DSO planning region supports analytical grouping for grid-relevant flexibility.',
  independenceNote:
    'Note: TSO region, DSO operator and planning region are intentionally managed as separate dimensions. This keeps market responsibility, grid ownership and analytical pooling transparent and auditable for CBP compliance.',
  dimensions: [
    {
      key: 'tso',
      label: 'TSO Region (ÜNB)',
      description: 'Transmission system operator control area — defines the balancing zone and CBP market scope.',
      color: 'blue',
    },
    {
      key: 'dso',
      label: 'DSO Operator (VNB)',
      description: 'Distribution network operator — owns the grid infrastructure connecting each asset.',
      color: 'amber',
    },
    {
      key: 'planning',
      label: 'DSO Planning Region',
      description: 'Analytical grouping region used for grid planning and redispatch area assignment.',
      color: 'purple',
    },
  ],
}
