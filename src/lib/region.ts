import { TSO_REGIONS, VNB_OPERATORS, VNB_PLANNING_REGIONS } from './constants'

export { TSO_REGIONS, VNB_OPERATORS, VNB_PLANNING_REGIONS }

export function getTsoById(id: string) {
  return TSO_REGIONS.find(r => r.id === id)
}

export function getVnbById(id: string) {
  return VNB_OPERATORS.find(v => v.id === id)
}

export function getPlanningRegionById(id: string) {
  return VNB_PLANNING_REGIONS.find(r => r.id === id)
}

export function getTsoColor(id: string): string {
  return getTsoById(id)?.color ?? '#64748b'
}

export function getVnbForTso(tsoId: string) {
  return VNB_OPERATORS.filter(v => v.tsoId === tsoId)
}

export function FEDERAL_STATE_SHORT(state: string): string {
  const map: Record<string, string> = {
    'Baden-Württemberg': 'BW',
    'Bayern': 'BY',
    'Berlin': 'BE',
    'Brandenburg': 'BB',
    'Bremen': 'HB',
    'Hamburg': 'HH',
    'Hessen': 'HE',
    'Mecklenburg-Vorpommern': 'MV',
    'Niedersachsen': 'NI',
    'Nordrhein-Westfalen': 'NW',
    'Rheinland-Pfalz': 'RP',
    'Saarland': 'SL',
    'Sachsen': 'SN',
    'Sachsen-Anhalt': 'ST',
    'Schleswig-Holstein': 'SH',
    'Thüringen': 'TH',
  }
  return map[state] ?? state.substring(0, 2).toUpperCase()
}
