export function getReadinessColor(score: number): string {
  if (score >= 90) return '#22c55e'
  if (score >= 75) return '#f59e0b'
  return '#ef4444'
}

export function getReadinessLabel(score: number): string {
  if (score >= 90) return 'Bereit'
  if (score >= 75) return 'Eingeschränkt'
  return 'Nicht bereit'
}
