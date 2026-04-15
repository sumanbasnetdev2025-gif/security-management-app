import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns'

export function formatDate(date: string | Date | null, fmt = 'dd MMM yyyy'): string {
  if (!date) return '—'
  return format(new Date(date), fmt)
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy, hh:mm a')
}

export function formatTimeAgo(date: string | Date | null): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function calcDuration(entry: string, exit: string | null): string {
  if (!exit) return 'Still parked'
  const mins = differenceInMinutes(new Date(exit), new Date(entry))
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  const remaining = mins % 60
  return remaining > 0 ? `${hrs}h ${remaining}m` : `${hrs}h`
}

export function isOverstay(entryTime: string, maxHours = 8): boolean {
  const mins = differenceInMinutes(new Date(), new Date(entryTime))
  return mins > maxHours * 60
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function generateCameraId(existing: string[]): string {
  const nums = existing
    .map(n => parseInt(n.replace('CT-', '')))
    .filter(n => !isNaN(n))
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `CT-${String(next).padStart(4, '0')}`
}