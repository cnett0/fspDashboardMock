export const APP_NAME = 'FSP Terminal'
export const APP_VERSION = '2.4.1'
export const OPERATOR_NAME = 'OLI Systems GmbH'
export const ENVIRONMENT = 'DEV'

// ─────────────────────────────────────────────────────────────────────────────
// Static reference data — Germany's transmission and distribution grid topology.
// These are real regulatory entities and fixed grid assignments, not mock data.
// ─────────────────────────────────────────────────────────────────────────────

export type TsoRegion = {
  id: string
  name: string
  shortName: string
  color: string
  states: string[]
  controlCenter: string
}

export const TSO_REGIONS: TsoRegion[] = [
  {
    id: '50hertz',
    name: '50Hertz Transmission GmbH',
    shortName: '50Hertz',
    color: '#38bdf8',
    states: ['Berlin', 'Brandenburg', 'Hamburg', 'Mecklenburg-Vorpommern', 'Sachsen', 'Sachsen-Anhalt', 'Thüringen'],
    controlCenter: 'Berlin-Mitte',
  },
  {
    id: 'amprion',
    name: 'Amprion GmbH',
    shortName: 'Amprion',
    color: '#f59e0b',
    states: ['Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Teile Bayern'],
    controlCenter: 'Dortmund',
  },
  {
    id: 'tennet',
    name: 'TenneT TSO GmbH',
    shortName: 'TenneT',
    color: '#a855f7',
    states: ['Bayern', 'Hessen', 'Niedersachsen', 'Schleswig-Holstein', 'Teile NRW'],
    controlCenter: 'Bayreuth',
  },
  {
    id: 'transnetbw',
    name: 'TransnetBW GmbH',
    shortName: 'TransnetBW',
    color: '#22c55e',
    states: ['Baden-Württemberg'],
    controlCenter: 'Stuttgart',
  },
]

export type VnbOperator = {
  id: string
  name: string
  shortName: string
  region: 'North' | 'South' | 'West' | 'East'
  tsoId: string
  planningRegionId: string
  coverageArea: string
  hasVariableTariff: boolean
  hasLoadDependentTariff: boolean
}

export const VNB_OPERATORS: VnbOperator[] = [
  // North
  { id: 'ewe-netz', name: 'EWE Netz GmbH', shortName: 'EWE Netz', region: 'North', tsoId: '50hertz', planningRegionId: 'nord-ost', coverageArea: 'Niedersachsen, Bremen, Brandenburg', hasVariableTariff: true, hasLoadDependentTariff: true },
  { id: 'sh-netz', name: 'Schleswig-Holstein Netz GmbH', shortName: 'SH Netz', region: 'North', tsoId: 'tennet', planningRegionId: 'nord-west', coverageArea: 'Schleswig-Holstein', hasVariableTariff: true, hasLoadDependentTariff: false },
  { id: 'sw-heide', name: 'Stadtwerke Heide GmbH', shortName: 'SW Heide', region: 'North', tsoId: 'tennet', planningRegionId: 'nord-west', coverageArea: 'Dithmarschen', hasVariableTariff: false, hasLoadDependentTariff: false },
  // South
  { id: 'netze-bw', name: 'Netze BW GmbH', shortName: 'Netze BW', region: 'South', tsoId: 'transnetbw', planningRegionId: 'sued-west', coverageArea: 'Baden-Württemberg', hasVariableTariff: true, hasLoadDependentTariff: true },
  { id: 'lew-verteil', name: 'LEW Verteilnetz GmbH', shortName: 'LEW VN', region: 'South', tsoId: 'tennet', planningRegionId: 'sued-ost', coverageArea: 'Schwaben, Westbayern', hasVariableTariff: true, hasLoadDependentTariff: true },
  { id: 'sw-weilheim', name: 'Stromnetz Weilheim GmbH & Co. KG', shortName: 'SNW Weilheim', region: 'South', tsoId: 'tennet', planningRegionId: 'sued-ost', coverageArea: 'Weilheim-Schongau', hasVariableTariff: false, hasLoadDependentTariff: false },
  // West
  { id: 'westnetz', name: 'Westnetz GmbH', shortName: 'Westnetz', region: 'West', tsoId: 'amprion', planningRegionId: 'west-rhein', coverageArea: 'NRW, Rheinland', hasVariableTariff: true, hasLoadDependentTariff: true },
  { id: 'wesernetz', name: 'wesernetz Bremen GmbH', shortName: 'Wesernetz', region: 'West', tsoId: 'tennet', planningRegionId: 'nord-west', coverageArea: 'Bremen, Bremerhaven', hasVariableTariff: false, hasLoadDependentTariff: true },
  { id: 'bad-honnef', name: 'Bad Honnef AG', shortName: 'BHAG', region: 'West', tsoId: 'amprion', planningRegionId: 'west-rhein', coverageArea: 'Bad Honnef am Rhein', hasVariableTariff: false, hasLoadDependentTariff: false },
  // East
  { id: 'mitnetz', name: 'Mitteldeutsche Netzgesellschaft Strom mbH', shortName: 'MITNETZ', region: 'East', tsoId: '50hertz', planningRegionId: 'mitte-ost', coverageArea: 'Sachsen, Thüringen, Sachsen-Anhalt', hasVariableTariff: true, hasLoadDependentTariff: true },
  { id: 'netz-leipzig', name: 'Netz Leipzig GmbH', shortName: 'Netz Leipzig', region: 'East', tsoId: '50hertz', planningRegionId: 'mitte-ost', coverageArea: 'Leipzig', hasVariableTariff: true, hasLoadDependentTariff: false },
  { id: 'sw-torgau', name: 'Stadtwerke Torgau GmbH', shortName: 'SW Torgau', region: 'East', tsoId: '50hertz', planningRegionId: 'mitte-ost', coverageArea: 'Nordsachsen', hasVariableTariff: false, hasLoadDependentTariff: false },
]

export type VnbPlanningRegion = {
  id: string
  name: string
  tsoId: string
  color: string
}

export const VNB_PLANNING_REGIONS: VnbPlanningRegion[] = [
  { id: 'nord-west', name: 'Planungsregion Nord-West', tsoId: 'tennet', color: '#0ea5e9' },
  { id: 'nord-ost', name: 'Planungsregion Nord-Ost', tsoId: '50hertz', color: '#38bdf8' },
  { id: 'mitte-ost', name: 'Planungsregion Mitte-Ost', tsoId: '50hertz', color: '#7dd3fc' },
  { id: 'west-rhein', name: 'Planungsregion West-Rhein', tsoId: 'amprion', color: '#fbbf24' },
  { id: 'sued-west', name: 'Planungsregion Süd-West', tsoId: 'transnetbw', color: '#4ade80' },
  { id: 'sued-ost', name: 'Planungsregion Süd-Ost', tsoId: 'tennet', color: '#86efac' },
]

export const ASSET_TYPE_LABELS: Record<string, string> = {
  ev_charger: 'EV-Lader',
  ev_fleet: 'EV-Flotte',
  home_battery: 'Hausbatterie',
  ci_battery: 'C&I-Batterie',
  heat_pump: 'Wärmepumpe',
  thermal_storage: 'Wärmespeicher',
  pv_coupled: 'PV-Speicher',
  industrial_load: 'Industrielast',
  controllable_prosumer: 'Prosumer',
}

export const ASSET_TYPE_COLORS: Record<string, string> = {
  ev_charger: '#38bdf8',
  ev_fleet: '#0ea5e9',
  home_battery: '#a855f7',
  ci_battery: '#f59e0b',
  heat_pump: '#f97316',
  thermal_storage: '#ef4444',
  pv_coupled: '#facc15',
  industrial_load: '#64748b',
  controllable_prosumer: '#22c55e',
}

export const BALANCING_GROUPS = [
  'BG-FSP-NORD-01',
  'BG-FSP-NORD-02',
  'BG-FSP-WEST-01',
  'BG-FSP-WEST-02',
  'BG-FSP-WEST-03',
  'BG-FSP-SUED-01',
  'BG-FSP-SUED-02',
  'BG-FSP-OST-01',
  'BG-FSP-OST-02',
]

export const COMPLIANCE_THRESHOLDS = {
  telemetry: { green: 95, amber: 85, red: 0 },
  scheduleAdherence: { green: 95, amber: 80, red: 0 },
  cbpReadiness: { green: 90, amber: 75, red: 0 },
}

export const REFRESH_INTERVAL_MS = 30000

export const DATA_SOURCES = [
  { id: 'entsoe', name: 'ENTSO-E Transparency Platform', purpose: 'Day-ahead spot prices, load, generation', fields: ['spotPrice', 'load', 'windForecast', 'solarForecast'], freshness: '1h', usedFor: ['operations', 'analytics', 'pricing'] },
  { id: 'regelleistung', name: 'regelleistung.net', purpose: 'Reservemarkt-Ergebnisse FCR/aFRR/mFRR', fields: ['capacityPrice', 'activationPrice', 'volume', 'clearing'], freshness: '1d', usedFor: ['analytics', 'pricing'] },
  { id: 'netztransparenz', name: 'netztransparenz.de', purpose: 'ÜNB-Transparenzdaten, Ausgleichsenergie (reBAP)', fields: ['reBAP', 'imbalanceVolume', 'controlEnergy'], freshness: '15min', usedFor: ['operations', 'settlement', 'analytics'] },
  { id: 'variable-netzentgelte', name: 'variable-netzentgelte.de', purpose: 'Variable Netzentgeltinformationen nach §14a EnWG', fields: ['tariffTier', 'fee', 'validWindow', 'vnbId'], freshness: '1d', usedFor: ['pricing', 'analytics'] },
  { id: 'vnbdigital', name: 'VNBdigital', purpose: 'VNB-Planungsregionen und Netzbetreiber-Zuordnung', fields: ['planningRegion', 'vnbOperator', 'assetMapping'], freshness: 'static', usedFor: ['operations', 'regional_mapping'] },
  { id: 'bundesnetzagentur', name: 'Bundesnetzagentur', purpose: 'Marktrahmen, CBP-Regularien, Meldepflichten', fields: ['cbpRequirements', 'reportingDeadlines', 'certificationStatus'], freshness: 'irregular', usedFor: ['analytics', 'settlement'] },
  { id: 'bdew', name: 'BDEW', purpose: 'Branchenkennzahlen, Haushaltsstrompreis, EEG-Einspeisevergütung', fields: ['householdPrice', 'eegFeedIn', 'industryTariff'], freshness: '1a', usedFor: ['analytics', 'pricing'] },
]
