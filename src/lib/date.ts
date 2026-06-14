export function now(): Date {
  return new Date()
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600000)
}

export function addHours(date: Date, h: number): Date {
  return new Date(date.getTime() + h * 3600000)
}

export function formatHHMM(date: Date): string {
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function formatDDMM(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}
