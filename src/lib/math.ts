export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}

export function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return sum(arr) / arr.length
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function pct(value: number, total: number): number {
  if (total === 0) return 0
  return (value / total) * 100
}

export function scoreToColor(score: number, thresholds = { green: 90, amber: 75 }): string {
  if (score >= thresholds.green) return '#22c55e'
  if (score >= thresholds.amber) return '#f59e0b'
  return '#ef4444'
}

export function severityToColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ef4444'
    case 'warning': return '#f59e0b'
    case 'info': return '#38bdf8'
    default: return '#64748b'
  }
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
