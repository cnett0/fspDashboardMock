/**
 * Static mock telemetry: FlexOffers, MeasuredPoints, Flexband for all 20 assets.
 * Data covers 2026-06-13 (full day) and 2026-06-14 (up to ~17:00 UTC measured).
 * All values are deterministic — no Date.now() or random calls.
 */

import type { FlexOffer, MeasuredPoint } from '../types/api'
import type { FlexbandPoint } from '../api/envelio'

// ── Helpers ───────────────────────────────────────────────────────────────────

function slots(dateStr: string): string[] {
  const t0 = Date.UTC(
    +dateStr.slice(0, 4), +dateStr.slice(5, 7) - 1, +dateStr.slice(8, 10),
  )
  return Array.from({ length: 96 }, (_, i) => new Date(t0 + i * 15 * 60_000).toISOString())
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

// Deterministic variation: sin wave seeded by asset id + slot
function noise(slotIdx: number, seed: number, amp: number): number {
  return Math.sin(slotIdx * 0.41 + seed * 2.7) * amp
}

// Solar irradiance fraction for German summer (Jun 14 UTC slots)
// Sunrise ~03:00 UTC (05:00 CEST), peak ~11:00 UTC (13:00 CEST), sunset ~19:00 UTC
function solar(slotIdx: number): number {
  const rise = 12   // 03:00 UTC
  const peak = 44   // 11:00 UTC
  const set  = 76   // 19:00 UTC
  if (slotIdx <= rise || slotIdx >= set) return 0
  const t = (slotIdx - rise) / (set - rise)
  return Math.sin(t * Math.PI)  // 0 → 1 → 0
}

// ── Profile generators ────────────────────────────────────────────────────────

/**
 * Heat pump: positive gridKw (consuming). Increases load during cheap solar hours,
 * reduces in expensive evening peak.
 */
function hpBaseline(slotIdx: number, nominalKw: number, seed: number): number {
  const hour = Math.floor(slotIdx / 4)
  // Fraction of nominal by hour (UTC 0..23)
  // Night low → morning ramp → solar absorption (high) → afternoon → eve reduction → night
  const frac = [
    0.55, 0.52, 0.50, 0.52, 0.55, 0.62, 0.74, 0.82,  // 00-07
    0.88, 0.95, 0.98, 0.96, 0.92, 0.85, 0.70, 0.60,  // 08-15 (absorb cheap solar)
    0.48, 0.42, 0.38, 0.40, 0.50, 0.58, 0.60, 0.58,  // 16-23 (evening demand reduction)
  ][hour]
  return clamp(frac * nominalKw + noise(slotIdx, seed, nominalKw * 0.04), nominalKw * 0.15, nominalKw)
}

/**
 * CI battery: positive = charging (buying from grid), negative = discharging (selling).
 * Charges during cheap/negative-price solar hours, discharges in evening peak.
 * Jun 14 prices: negative from 04-14 UTC, peak 16-19 UTC.
 */
function batBaseline(slotIdx: number, nominalKw: number, seed: number): number {
  const hour = Math.floor(slotIdx / 4)
  const frac = [
    0.08, 0.06, 0.05, 0.08, 0.22, 0.50, 0.72, 0.83,  // 00-07: gentle charge ramp
    0.88, 0.93, 0.92, 0.88, 0.78, 0.55, 0.25, -0.42, // 08-15: max charge → discharge start
   -0.62,-0.82,-0.92,-0.88,-0.72,-0.50,-0.28,-0.14,  // 16-23: evening discharge
  ][hour]
  return clamp(frac * nominalKw + noise(slotIdx, seed, nominalKw * 0.03), -nominalKw, nominalKw)
}

/** PV generation as positive kW (pvKw), follows solar irradiance × peakKw */
function pvGenKw(slotIdx: number, peakKw: number, seed: number): number {
  return Math.max(0, solar(slotIdx) * peakKw + noise(slotIdx, seed, peakKw * 0.025))
}

/**
 * PV-coupled grid sub-asset: net grid power = -(pvKw - batteryAbsorption).
 * During solar peak: negative (feed-in). Battery absorbs 30-50% of PV.
 */
function pvGridBaseline(slotIdx: number, nominalKw: number, seed: number): number {
  const pv = pvGenKw(slotIdx, nominalKw * 0.80, seed)
  const batAbsorb = slotIdx >= 12 && slotIdx <= 60 ? pv * 0.38 : 0
  const net = -(pv - batAbsorb)
  return Math.round(net * 10) / 10
}

/** Battery sub-asset for pv_coupled: charges when PV peaks, discharges in evening */
function pvBatBaseline(slotIdx: number, nominalKw: number, seed: number): number {
  const hour = Math.floor(slotIdx / 4)
  const frac = [
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.05, 0.10,  // 00-07: idle until morning
    0.15, 0.25, 0.30, 0.28, 0.22, 0.15, 0.05,-0.30,  // 08-15: absorb PV → discharge
   -0.65,-0.80,-0.85,-0.78,-0.60,-0.35,-0.12,-0.05,  // 16-23: evening discharge
  ][hour]
  return clamp(frac * nominalKw + noise(slotIdx, seed, nominalKw * 0.03), -nominalKw, nominalKw)
}

/** SoC evolution for battery (%). Returns 96-slot SoC array given power profile. */
function buildSoc(
  powerProfile: number[], // kW (positive = charging draws from system = batKw < 0 convention)
  capacityKwh: number,
  startSocPct: number,
  charging: 'positive' | 'negative', // which sign means charging
): number[] {
  const soc: number[] = []
  let s = startSocPct
  for (const p of powerProfile) {
    soc.push(Math.round(s * 10) / 10)
    const chargingPower = charging === 'positive' ? Math.max(0, p) : Math.max(0, -p)
    const dischargePower = charging === 'positive' ? Math.max(0, -p) : Math.max(0, p)
    const dE = (chargingPower - dischargePower) * (15 / 60)  // kWh per slot
    s = clamp(s + (dE / capacityKwh) * 100, 2, 98)
  }
  return soc
}

// ── FlexOffer builder ─────────────────────────────────────────────────────────

interface SubAssetSpec {
  subId: string
  assetType: string
  nominalKw: number
  capacityKwh?: number
  baselineFn: (slotIdx: number) => number
  flexUpFrac: (slotIdx: number, base: number) => number   // additional kW available upward
  flexDownFrac: (slotIdx: number, base: number) => number // additional kW available downward
  pMax: number
  pMin: number
  vmaxKwh: number | null
  vminKwh: number | null
  limitingReasons?: string[]
}

function buildOffers(
  spec: SubAssetSpec,
  day: string,
  runOffset: number,  // seconds before slot (for runTs)
): FlexOffer[] {
  return slots(day).map((ts, i) => {
    const base    = Math.round(spec.baselineFn(i) * 10) / 10
    const rdvUp   = Math.round(Math.max(0, spec.flexUpFrac(i, base)) * 10) / 10
    const rdvDown = Math.round(Math.max(0, spec.flexDownFrac(i, base)) * 10) / 10
    const conf    = clamp(0.78 + noise(i, runOffset, 0.10), 0.55, 0.97)
    const risk    = clamp(0.14 + noise(i + 50, runOffset, 0.08), 0.03, 0.45)
    const runTs   = new Date(new Date(ts).getTime() - runOffset * 1000).toISOString()
    return {
      assetId:  spec.subId,
      tenantId: 'fsp-demo',
      ts,
      runTs,
      assetType: spec.assetType,
      baselineKw: base,
      pMaxKw:    spec.pMax,
      pMinKw:    spec.pMin,
      vmaxKwh:   spec.vmaxKwh,
      vminKwh:   spec.vminKwh,
      positiveRdvKw:       rdvUp,
      negativeRdvKw:       rdvDown,
      positiveRdaKw:       Math.round(rdvUp  * 0.85 * 10) / 10,
      negativeRdaKw:       Math.round(rdvDown * 0.85 * 10) / 10,
      feasibleDurationMinutes: 60,
      confidence:    Math.round(conf * 1000) / 1000,
      riskScore:     Math.round(risk * 1000) / 1000,
      limitingReasons: spec.limitingReasons ?? null,
    }
  })
}

// ── Measured point builder ────────────────────────────────────────────────────

function buildMeasured(
  day: string,
  profileFn: (i: number) => { gridKw: number; pvKw?: number; batKw?: number; soc?: number },
  measuredUntilSlot: number,  // slots 0..N have real measurements, rest null
): MeasuredPoint[] {
  return slots(day).map((ts, i) => {
    if (i > measuredUntilSlot) {
      return { ts, gridKw: null, pvKw: null, batKw: null, soc: null }
    }
    const p = profileFn(i)
    return {
      ts,
      gridKw: Math.round((p.gridKw + noise(i, 999, Math.abs(p.gridKw) * 0.03)) * 10) / 10,
      pvKw:   p.pvKw  != null ? Math.round(Math.max(0, p.pvKw)  * 10) / 10 : null,
      batKw:  p.batKw != null ? Math.round(p.batKw * 10) / 10 : null,
      soc:    p.soc   != null ? Math.round(p.soc   * 10) / 10 : null,
    }
  })
}

// ── Flexband builder ──────────────────────────────────────────────────────────

// Envelio flexband — always contains the RDV envelope.
// Band = [baseline − rdvDown − extra, baseline + rdvUp + extra]
// Passing explicit rdvUp/rdvDown functions guarantees containment.
function buildFlexband(
  day: string,
  baselineFn: (i: number) => number,
  rdvUpFn: (i: number) => number,    // upward RDV at each slot (kW, ≥0)
  rdvDownFn: (i: number) => number,  // downward RDV at each slot (kW, ≥0)
  extraFrac: number,                 // fraction of (rdvUp+rdvDown) added outside as extra margin
  pMax: number,
  pMin: number,
): FlexbandPoint[] {
  return slots(day).map((ts, i) => {
    const base    = Math.round(baselineFn(i) * 10) / 10
    const rdvUp   = Math.max(0, rdvUpFn(i))
    const rdvDown = Math.max(0, rdvDownFn(i))
    const range   = rdvUp + rdvDown
    const extra   = Math.max(2, range * extraFrac)
    // Organic jitter on the outer edge (always positive so band never narrows)
    const jitterUp   = Math.abs(noise(i, 73, extra * 0.15))
    const jitterDown = Math.abs(noise(i, 42, extra * 0.15))
    return {
      ts,
      powerMinKw: Math.round(Math.max(pMin, base - rdvDown - extra - jitterDown) * 10) / 10,
      powerMaxKw: Math.round(Math.min(pMax, base + rdvUp   + extra + jitterUp)   * 10) / 10,
    }
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Asset data generation ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const TODAY = '2026-06-14'
const YESTERDAY = '2026-06-13'
const MEASURED_UNTIL_TODAY = 68  // slot 68 = 17:00 UTC ≈ current time
const MEASURED_UNTIL_YESTERDAY = 95  // full day

const allFlexOffers: FlexOffer[] = []
const allMeasured: Record<string, MeasuredPoint[]> = {}
const allFlexband: Record<string, FlexbandPoint[]> = {}

// ── Asset 1: HP-TEN-001, heat_pump, 45 kW ───────────────────────────────────

;(() => {
  const nm = 45, seed = 1
  const bFn = (i: number) => hpBaseline(i, nm, seed)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-1-flex', assetType: 'heat_pump', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 0, nm * 0.30),
      flexDownFrac: (_, b) => clamp(b, 2, nm * 0.55),
      pMax: nm, pMin: 0, vmaxKwh: null, vminKwh: null,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-1-${day}`] = buildMeasured(day, i => ({ gridKw: bFn(i) }), until)
  }
  for (const day of [YESTERDAY, TODAY]) {
    allFlexband[`asset-1-${day}`] = buildFlexband(day, bFn,
      i => clamp(nm - bFn(i), 0, nm * 0.30),
      i => Math.min(clamp(bFn(i), 2, nm * 0.55), nm * 0.55),
      0.30, nm, 0)
  }
})()

// ── Asset 2: BAT-TEN-002, ci_battery, 200 kW / 400 kWh ──────────────────────

;(() => {
  const nm = 200, seed = 2, cap = 400
  const bFn = (i: number) => batBaseline(i, nm, seed)
  const profile = slots(TODAY).map((_, i) => bFn(i))
  const socs = buildSoc(profile, cap, 12, 'positive')

  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-2-bat', assetType: 'ci_battery', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 5, nm * 0.95),   // can always charge more
      flexDownFrac: (_, b) => clamp(nm + b, 5, nm * 0.95),   // can always discharge more
      pMax: nm, pMin: -nm, vmaxKwh: cap, vminKwh: 0,
      limitingReasons: ['BATTERY_ENERGY_LIMIT'],
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-2-${day}`] = buildMeasured(day, i => ({
      gridKw: bFn(i),
      batKw:  -bFn(i),  // batKw = -gridKw for pure battery (charging = batKw < 0)
      soc:    socs[i],
    }), until)
  }
  for (const day of [YESTERDAY, TODAY]) {
    allFlexband[`asset-2-${day}`] = buildFlexband(day, bFn,
      i => clamp(nm - bFn(i), 5, nm * 0.95),
      i => clamp(nm + bFn(i), 5, nm * 0.95),
      0.22, nm, -nm)
  }
})()

// ── Asset 3: HP-TEN-003, heat_pump, 30 kW ───────────────────────────────────

;(() => {
  const nm = 30, seed = 3
  const bFn = (i: number) => hpBaseline(i, nm, seed)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-3-flex', assetType: 'heat_pump', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 1, nm * 0.28),
      flexDownFrac: (_, b) => clamp(b, 1, nm * 0.52),
      pMax: nm, pMin: 0, vmaxKwh: null, vminKwh: null,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-3-${day}`] = buildMeasured(day, i => ({ gridKw: bFn(i) }), until)
  }
})()

// ── Asset 4: BAT-TEN-004, home_battery, 10 kW / 20 kWh + PV 6 kW ──────────

;(() => {
  const nmBat = 10, nmPv = 6, seed = 4, cap = 20
  const pvFn  = (i: number) => pvGridBaseline(i, nmPv, seed)
  const batFn = (i: number) => pvBatBaseline(i, nmBat, seed)
  const totalFn = (i: number) => pvFn(i) + batFn(i)

  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(
      ...buildOffers({
        subId: 'asset-4-bat', assetType: 'home_battery', nominalKw: nmBat,
        baselineFn: batFn,
        flexUpFrac:   (_, b) => clamp(nmBat - b, 0.5, nmBat * 0.90),
        flexDownFrac: (_, b) => clamp(nmBat + b, 0.5, nmBat * 0.90),
        pMax: nmBat, pMin: -nmBat, vmaxKwh: cap, vminKwh: 0,
      }, day, 3600),
      ...buildOffers({
        subId: 'asset-4-pv', assetType: 'home_battery', nominalKw: nmPv,
        baselineFn: pvFn,
        flexUpFrac:   (i, _) => Math.max(0, pvGenKw(i, nmPv, seed) * 0.3),
        flexDownFrac: (i, _) => Math.max(0, pvGenKw(i, nmPv, seed) * 0.7),
        pMax: 0, pMin: -nmPv, vmaxKwh: null, vminKwh: null,
      }, day, 3600),
    )
  }
  const batProfile = slots(TODAY).map((_, i) => batFn(i))
  const socs = buildSoc(batProfile, cap, 38, 'negative')
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-4-${day}`] = buildMeasured(day, i => ({
      gridKw: totalFn(i),
      pvKw:   pvGenKw(i, nmPv, seed),
      batKw:  batFn(i),
      soc:    socs[i],
    }), until)
  }
})()

// ── Asset 5: HP-TEN-005, heat_pump, 55 kW ───────────────────────────────────

;(() => {
  const nm = 55, seed = 5
  const bFn = (i: number) => hpBaseline(i, nm, seed)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-5-flex', assetType: 'heat_pump', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 0, nm * 0.30),
      flexDownFrac: (_, b) => clamp(b, 2, nm * 0.55),
      pMax: nm, pMin: 0, vmaxKwh: null, vminKwh: null,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-5-${day}`] = buildMeasured(day, i => ({ gridKw: bFn(i) }), until)
  }
  for (const day of [YESTERDAY, TODAY]) {
    allFlexband[`asset-5-${day}`] = buildFlexband(day, bFn,
      i => clamp(nm - bFn(i), 0, nm * 0.30),
      i => Math.min(clamp(bFn(i), 2, nm * 0.55), nm * 0.55),
      0.30, nm, 0)
  }
})()

// ── Asset 6: BAT-TEN-006, ci_battery, 500 kW / 1000 kWh ─────────────────────

;(() => {
  const nm = 500, seed = 6, cap = 1000
  const bFn = (i: number) => batBaseline(i, nm, seed)
  const socs = buildSoc(slots(TODAY).map((_, i) => bFn(i)), cap, 8, 'positive')
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-6-bat', assetType: 'ci_battery', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 10, nm * 0.95),
      flexDownFrac: (_, b) => clamp(nm + b, 10, nm * 0.95),
      pMax: nm, pMin: -nm, vmaxKwh: cap, vminKwh: 0,
      limitingReasons: ['BATTERY_ENERGY_LIMIT', 'GRID_LIMIT'],
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-6-${day}`] = buildMeasured(day, i => ({
      gridKw: bFn(i), batKw: -bFn(i), soc: socs[i],
    }), until)
  }
  for (const day of [YESTERDAY, TODAY]) {
    allFlexband[`asset-6-${day}`] = buildFlexband(day, bFn,
      i => clamp(nm - bFn(i), 10, nm * 0.95),
      i => clamp(nm + bFn(i), 10, nm * 0.95),
      0.20, nm, -nm)
  }
})()

// ── Asset 7: HP-TEN-007, heat_pump, 80 kW ───────────────────────────────────

;(() => {
  const nm = 80, seed = 7
  const bFn = (i: number) => hpBaseline(i, nm, seed)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-7-flex', assetType: 'heat_pump', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 3, nm * 0.28),
      flexDownFrac: (_, b) => clamp(b, 3, nm * 0.55),
      pMax: nm, pMin: 0, vmaxKwh: null, vminKwh: null,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-7-${day}`] = buildMeasured(day, i => ({ gridKw: bFn(i) }), until)
  }
})()

// ── Asset 8: BAT-TEN-008, pv_coupled, 150 kW / 300 kWh ──────────────────────

;(() => {
  const nmPv = 120, nmBat = 150, seed = 8, cap = 300
  const pvFn  = (i: number) => pvGridBaseline(i, nmPv, seed)
  const batFn = (i: number) => pvBatBaseline(i, nmBat, seed)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(
      ...buildOffers({
        subId: 'asset-8-pv', assetType: 'pv_coupled', nominalKw: nmPv,
        baselineFn: pvFn,
        flexUpFrac:   (i, _) => Math.max(0, pvGenKw(i, nmPv, seed) * 0.4),
        flexDownFrac: (i, _) => Math.max(0, pvGenKw(i, nmPv, seed) * 0.6),
        pMax: 0, pMin: -nmPv, vmaxKwh: null, vminKwh: null,
      }, day, 3600),
      ...buildOffers({
        subId: 'asset-8-bat', assetType: 'pv_coupled', nominalKw: nmBat,
        baselineFn: batFn,
        flexUpFrac:   (_, b) => clamp(nmBat - b, 5, nmBat * 0.92),
        flexDownFrac: (_, b) => clamp(nmBat + b, 5, nmBat * 0.92),
        pMax: nmBat, pMin: -nmBat, vmaxKwh: cap, vminKwh: 0,
        limitingReasons: ['BATTERY_ENERGY_LIMIT'],
      }, day, 3600),
    )
  }
  const socs = buildSoc(slots(TODAY).map((_, i) => batFn(i)), cap, 22, 'negative')
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-8-${day}`] = buildMeasured(day, i => ({
      gridKw: pvFn(i) + batFn(i),
      pvKw:   pvGenKw(i, nmPv, seed),
      batKw:  batFn(i),
      soc:    socs[i],
    }), until)
  }
  for (const day of [YESTERDAY, TODAY]) {
    allFlexband[`asset-8-${day}`] = buildFlexband(day,
      i => pvFn(i) + batFn(i),
      i => pvGenKw(i, nmPv, seed) * 0.4 + clamp(nmBat - batFn(i), 5, nmBat * 0.92),
      i => pvGenKw(i, nmPv, seed) * 0.6 + clamp(nmBat + batFn(i), 5, nmBat * 0.92),
      0.22, nmBat, -nmBat)
  }
})()

// ── Asset 9: HP-TEN-009, heat_pump, 40 kW ───────────────────────────────────

;(() => {
  const nm = 40, seed = 9
  const bFn = (i: number) => hpBaseline(i, nm, seed)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-9-flex', assetType: 'heat_pump', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 1, nm * 0.28),
      flexDownFrac: (_, b) => clamp(b, 1, nm * 0.52),
      pMax: nm, pMin: 0, vmaxKwh: null, vminKwh: null,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-9-${day}`] = buildMeasured(day, i => ({ gridKw: bFn(i) }), until)
  }
})()

// ── Asset 10: BAT-TEN-010, ci_battery, 120 kW / 240 kWh ─────────────────────

;(() => {
  const nm = 120, seed = 10, cap = 240
  const bFn = (i: number) => batBaseline(i, nm, seed)
  const socs = buildSoc(slots(TODAY).map((_, i) => bFn(i)), cap, 18, 'positive')
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-10-bat', assetType: 'ci_battery', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 3, nm * 0.95),
      flexDownFrac: (_, b) => clamp(nm + b, 3, nm * 0.95),
      pMax: nm, pMin: -nm, vmaxKwh: cap, vminKwh: 0,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-10-${day}`] = buildMeasured(day, i => ({
      gridKw: bFn(i), batKw: -bFn(i), soc: socs[i],
    }), until)
  }
  for (const day of [YESTERDAY, TODAY]) {
    allFlexband[`asset-10-${day}`] = buildFlexband(day, bFn,
      i => clamp(nm - bFn(i), 3, nm * 0.95),
      i => clamp(nm + bFn(i), 3, nm * 0.95),
      0.22, nm, -nm)
  }
})()

// ── Asset 11: HP-TEN-011, heat_pump, 35 kW ───────────────────────────────────

;(() => {
  const nm = 35, seed = 11
  const bFn = (i: number) => hpBaseline(i, nm, seed)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-11-flex', assetType: 'heat_pump', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 1, nm * 0.28),
      flexDownFrac: (_, b) => clamp(b, 1, nm * 0.52),
      pMax: nm, pMin: 0, vmaxKwh: null, vminKwh: null,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-11-${day}`] = buildMeasured(day, i => ({ gridKw: bFn(i) }), until)
  }
})()

// ── Asset 12: BAT-TEN-012, ci_battery, 1000 kW / 2000 kWh ───────────────────

;(() => {
  const nm = 1000, seed = 12, cap = 2000
  const bFn = (i: number) => batBaseline(i, nm, seed)
  const socs = buildSoc(slots(TODAY).map((_, i) => bFn(i)), cap, 10, 'positive')
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-12-bat', assetType: 'ci_battery', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 20, nm * 0.95),
      flexDownFrac: (_, b) => clamp(nm + b, 20, nm * 0.95),
      pMax: nm, pMin: -nm, vmaxKwh: cap, vminKwh: 0,
      limitingReasons: ['BATTERY_ENERGY_LIMIT', 'GRID_LIMIT'],
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-12-${day}`] = buildMeasured(day, i => ({
      gridKw: bFn(i), batKw: -bFn(i), soc: socs[i],
    }), until)
  }
  for (const day of [YESTERDAY, TODAY]) {
    allFlexband[`asset-12-${day}`] = buildFlexband(day, bFn,
      i => clamp(nm - bFn(i), 20, nm * 0.95),
      i => clamp(nm + bFn(i), 20, nm * 0.95),
      0.20, nm, -nm)
  }
})()

// ── Asset 13: HP-TEN-013, heat_pump, 25 kW ───────────────────────────────────

;(() => {
  const nm = 25, seed = 13
  const bFn = (i: number) => hpBaseline(i, nm, seed)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-13-flex', assetType: 'heat_pump', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 0.5, nm * 0.28),
      flexDownFrac: (_, b) => clamp(b, 0.5, nm * 0.52),
      pMax: nm, pMin: 0, vmaxKwh: null, vminKwh: null,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-13-${day}`] = buildMeasured(day, i => ({ gridKw: bFn(i) }), until)
  }
})()

// ── Asset 14: BAT-TEN-014, home_battery, 12 kW / 24 kWh + PV 8 kW ──────────

;(() => {
  const nmBat = 12, nmPv = 8, seed = 14, cap = 24
  const pvFn  = (i: number) => pvGridBaseline(i, nmPv, seed)
  const batFn = (i: number) => pvBatBaseline(i, nmBat, seed)
  const totalFn = (i: number) => pvFn(i) + batFn(i)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(
      ...buildOffers({
        subId: 'asset-14-bat', assetType: 'home_battery', nominalKw: nmBat,
        baselineFn: batFn,
        flexUpFrac:   (_, b) => clamp(nmBat - b, 0.5, nmBat * 0.90),
        flexDownFrac: (_, b) => clamp(nmBat + b, 0.5, nmBat * 0.90),
        pMax: nmBat, pMin: -nmBat, vmaxKwh: cap, vminKwh: 0,
      }, day, 3600),
      ...buildOffers({
        subId: 'asset-14-pv', assetType: 'home_battery', nominalKw: nmPv,
        baselineFn: pvFn,
        flexUpFrac:   (i, _) => Math.max(0, pvGenKw(i, nmPv, seed) * 0.35),
        flexDownFrac: (i, _) => Math.max(0, pvGenKw(i, nmPv, seed) * 0.65),
        pMax: 0, pMin: -nmPv, vmaxKwh: null, vminKwh: null,
      }, day, 3600),
    )
  }
  const socs = buildSoc(slots(TODAY).map((_, i) => batFn(i)), cap, 42, 'negative')
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-14-${day}`] = buildMeasured(day, i => ({
      gridKw: totalFn(i),
      pvKw:   pvGenKw(i, nmPv, seed),
      batKw:  batFn(i),
      soc:    socs[i],
    }), until)
  }
})()

// ── Asset 15: HP-TEN-015, heat_pump, 70 kW ───────────────────────────────────

;(() => {
  const nm = 70, seed = 15
  const bFn = (i: number) => hpBaseline(i, nm, seed)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-15-flex', assetType: 'heat_pump', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 2, nm * 0.28),
      flexDownFrac: (_, b) => clamp(b, 2, nm * 0.55),
      pMax: nm, pMin: 0, vmaxKwh: null, vminKwh: null,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-15-${day}`] = buildMeasured(day, i => ({ gridKw: bFn(i) }), until)
  }
  for (const day of [YESTERDAY, TODAY]) {
    allFlexband[`asset-15-${day}`] = buildFlexband(day, bFn,
      i => clamp(nm - bFn(i), 0, nm * 0.30),
      i => Math.min(clamp(bFn(i), 2, nm * 0.55), nm * 0.55),
      0.30, nm, 0)
  }
})()

// ── Asset 16: BAT-TEN-016, ci_battery, 300 kW / 600 kWh ─────────────────────

;(() => {
  const nm = 300, seed = 16, cap = 600
  const bFn = (i: number) => batBaseline(i, nm, seed)
  const socs = buildSoc(slots(TODAY).map((_, i) => bFn(i)), cap, 15, 'positive')
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-16-bat', assetType: 'ci_battery', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 8, nm * 0.95),
      flexDownFrac: (_, b) => clamp(nm + b, 8, nm * 0.95),
      pMax: nm, pMin: -nm, vmaxKwh: cap, vminKwh: 0,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-16-${day}`] = buildMeasured(day, i => ({
      gridKw: bFn(i), batKw: -bFn(i), soc: socs[i],
    }), until)
  }
  for (const day of [YESTERDAY, TODAY]) {
    allFlexband[`asset-16-${day}`] = buildFlexband(day, bFn,
      i => clamp(nm - bFn(i), 8, nm * 0.95),
      i => clamp(nm + bFn(i), 8, nm * 0.95),
      0.20, nm, -nm)
  }
})()

// ── Asset 17: HP-TEN-017, heat_pump, 50 kW ───────────────────────────────────

;(() => {
  const nm = 50, seed = 17
  const bFn = (i: number) => hpBaseline(i, nm, seed)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-17-flex', assetType: 'heat_pump', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 1.5, nm * 0.28),
      flexDownFrac: (_, b) => clamp(b, 1.5, nm * 0.52),
      pMax: nm, pMin: 0, vmaxKwh: null, vminKwh: null,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-17-${day}`] = buildMeasured(day, i => ({ gridKw: bFn(i) }), until)
  }
})()

// ── Asset 18: BAT-TEN-018, pv_coupled, 100 kW / 200 kWh ─────────────────────

;(() => {
  const nmPv = 85, nmBat = 100, seed = 18, cap = 200
  const pvFn  = (i: number) => pvGridBaseline(i, nmPv, seed)
  const batFn = (i: number) => pvBatBaseline(i, nmBat, seed)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(
      ...buildOffers({
        subId: 'asset-18-pv', assetType: 'pv_coupled', nominalKw: nmPv,
        baselineFn: pvFn,
        flexUpFrac:   (i, _) => Math.max(0, pvGenKw(i, nmPv, seed) * 0.35),
        flexDownFrac: (i, _) => Math.max(0, pvGenKw(i, nmPv, seed) * 0.65),
        pMax: 0, pMin: -nmPv, vmaxKwh: null, vminKwh: null,
      }, day, 3600),
      ...buildOffers({
        subId: 'asset-18-bat', assetType: 'pv_coupled', nominalKw: nmBat,
        baselineFn: batFn,
        flexUpFrac:   (_, b) => clamp(nmBat - b, 4, nmBat * 0.92),
        flexDownFrac: (_, b) => clamp(nmBat + b, 4, nmBat * 0.92),
        pMax: nmBat, pMin: -nmBat, vmaxKwh: cap, vminKwh: 0,
      }, day, 3600),
    )
  }
  const socs = buildSoc(slots(TODAY).map((_, i) => batFn(i)), cap, 28, 'negative')
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-18-${day}`] = buildMeasured(day, i => ({
      gridKw: pvFn(i) + batFn(i),
      pvKw:   pvGenKw(i, nmPv, seed),
      batKw:  batFn(i),
      soc:    socs[i],
    }), until)
  }
  for (const day of [YESTERDAY, TODAY]) {
    allFlexband[`asset-18-${day}`] = buildFlexband(day,
      i => pvFn(i) + batFn(i),
      i => pvGenKw(i, nmPv, seed) * 0.35 + clamp(nmBat - batFn(i), 4, nmBat * 0.92),
      i => pvGenKw(i, nmPv, seed) * 0.65 + clamp(nmBat + batFn(i), 4, nmBat * 0.92),
      0.22, nmBat, -nmBat)
  }
})()

// ── Asset 19: HP-TEN-019, heat_pump, 65 kW ───────────────────────────────────

;(() => {
  const nm = 65, seed = 19
  const bFn = (i: number) => hpBaseline(i, nm, seed)
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-19-flex', assetType: 'heat_pump', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 2, nm * 0.28),
      flexDownFrac: (_, b) => clamp(b, 2, nm * 0.55),
      pMax: nm, pMin: 0, vmaxKwh: null, vminKwh: null,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-19-${day}`] = buildMeasured(day, i => ({ gridKw: bFn(i) }), until)
  }
})()

// ── Asset 20: BAT-TEN-020, ci_battery, 250 kW / 500 kWh ─────────────────────

;(() => {
  const nm = 250, seed = 20, cap = 500
  const bFn = (i: number) => batBaseline(i, nm, seed)
  const socs = buildSoc(slots(TODAY).map((_, i) => bFn(i)), cap, 20, 'positive')
  for (const day of [YESTERDAY, TODAY]) {
    allFlexOffers.push(...buildOffers({
      subId: 'asset-20-bat', assetType: 'ci_battery', nominalKw: nm,
      baselineFn: bFn,
      flexUpFrac:   (_, b) => clamp(nm - b, 6, nm * 0.95),
      flexDownFrac: (_, b) => clamp(nm + b, 6, nm * 0.95),
      pMax: nm, pMin: -nm, vmaxKwh: cap, vminKwh: 0,
    }, day, 3600))
  }
  for (const [day, until] of [[YESTERDAY, MEASURED_UNTIL_YESTERDAY],[TODAY, MEASURED_UNTIL_TODAY]] as const) {
    allMeasured[`asset-20-${day}`] = buildMeasured(day, i => ({
      gridKw: bFn(i), batKw: -bFn(i), soc: socs[i],
    }), until)
  }
  for (const day of [YESTERDAY, TODAY]) {
    allFlexband[`asset-20-${day}`] = buildFlexband(day, bFn,
      i => clamp(nm - bFn(i), 6, nm * 0.95),
      i => clamp(nm + bFn(i), 6, nm * 0.95),
      0.20, nm, -nm)
  }
})()

// ═══════════════════════════════════════════════════════════════════════════════
// ── Exports ───────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_ALL_FLEX_OFFERS: FlexOffer[] = allFlexOffers

/** Get measured points for a given asset + date range */
export function getMockMeasured(assetId: string, from?: string, to?: string): MeasuredPoint[] {
  const days = [YESTERDAY, TODAY]
  let pts: MeasuredPoint[] = []
  for (const day of days) {
    const key = `${assetId}-${day}`
    if (allMeasured[key]) pts = pts.concat(allMeasured[key])
  }
  if (from) pts = pts.filter(p => p.ts >= from)
  if (to)   pts = pts.filter(p => p.ts <= to)
  return pts
}

/** Get Envelio flexband for a given asset + date range */
export function getMockFlexband(assetId: string, from?: string, to?: string): FlexbandPoint[] {
  const days = [YESTERDAY, TODAY]
  let pts: FlexbandPoint[] = []
  for (const day of days) {
    const key = `${assetId}-${day}`
    if (allFlexband[key]) pts = pts.concat(allFlexband[key])
  }
  if (from) pts = pts.filter(p => p.ts >= from)
  if (to)   pts = pts.filter(p => p.ts <= to)
  return pts
}
