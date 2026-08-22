export function formatDateForDatabase(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export function formatDateForDisplay(date: Date): string {
  const dayName = date.toLocaleDateString('es-ES', {weekday: 'long'})
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
}
