export function fmtMW(kw: number, decimals = 1): string {
  if (Math.abs(kw) >= 1000) return `${(kw / 1000).toFixed(decimals)} MW`
  return `${kw.toFixed(0)} kW`
}

export function fmtKW(kw: number): string {
  return `${kw.toLocaleString('de-DE')} kW`
}

export function fmtMWh(kwh: number, decimals = 1): string {
  if (Math.abs(kwh) >= 1000) return `${(kwh / 1000).toFixed(decimals)} MWh`
  return `${kwh.toFixed(0)} kWh`
}

export function fmtEur(eur: number, decimals = 2): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(eur)
}

export function fmtEurMWh(price: number): string {
  return `${price.toFixed(2)} €/MWh`
}

export function fmtPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function fmtScore(score: number): string {
  return `${Math.round(score)}`
}

export function fmtPower(kw: number): string {
  if (Math.abs(kw) >= 1000000) return `${(kw / 1000000).toFixed(2)} GW`
  if (Math.abs(kw) >= 1000) return `${(kw / 1000).toFixed(1)} MW`
  return `${Math.round(kw)} kW`
}

export function fmtEnergy(kwh: number): string {
  if (Math.abs(kwh) >= 1000000) return `${(kwh / 1000000).toFixed(2)} GWh`
  if (Math.abs(kwh) >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`
  return `${Math.round(kwh)} kWh`
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function fmtAge(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'jetzt'
  if (diffMin < 60) return `vor ${diffMin} Min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `vor ${diffH} Std`
  return `vor ${Math.floor(diffH / 24)} Tagen`
}
