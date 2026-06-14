export function getMarketRegime(price: number): { label: string; color: string; description: string } {
  if (price < 0) return { label: 'Negativ', color: '#ef4444', description: 'Negativpreislage – Einspeisung unattraktiv, Abnahme prämiert' }
  if (price < 20) return { label: 'Niedrig', color: '#f59e0b', description: 'Niedriges Preisniveau – geringe Spread-Optionen' }
  if (price < 60) return { label: 'Normal', color: '#22c55e', description: 'Normales Preisniveau – Standardstrategie anwendbar' }
  if (price < 120) return { label: 'Erhöht', color: '#f59e0b', description: 'Erhöhtes Preisniveau – Spot-Arbitrage attraktiv' }
  return { label: 'Hoch', color: '#ef4444', description: 'Hohes Preisniveau – Lastmanagement kritisch' }
}

export function getStrategyRecommendation(spotPrice: number, rebap: number, fcr: number): string {
  if (spotPrice > 100 && rebap > 80) return 'Einspeisung priorisieren – Spot + reBAP attraktiv'
  if (spotPrice < 20 && rebap < 20) return 'Laden / Einlagern – günstige Einkaufsphase'
  if (fcr > 10) return 'FCR-Vorhaltung priorisieren – Regelreservepreis hoch'
  if (rebap > 100) return 'Bilanzkreis ausgleichen – reBAP-Risiko hoch'
  return 'Standardbetrieb – kein starkes Signal'
}
