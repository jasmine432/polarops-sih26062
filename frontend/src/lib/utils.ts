import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates time-of-day greeting dynamically based on browser local time:
 * - 05:00–11:59 → Good Morning
 * - 12:00–16:59 → Good Afternoon
 * - 17:00–20:59 → Good Evening
 * - 21:00–04:59 → Good Night
 */
export function getTimeBasedGreeting(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) {
    return 'Good Morning'
  }
  if (hour >= 12 && hour < 17) {
    return 'Good Afternoon'
  }
  if (hour >= 17 && hour < 21) {
    return 'Good Evening'
  }
  return 'Good Night'
}

/**
 * Formats a Date object into local date format (e.g., "Wednesday, 30 September 2026")
 */
export function formatLocalDate(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

/**
 * Formats a Date object into local time with timezone indicator (e.g., "18:31 IST")
 */
export function formatLocalTimeWithZone(date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    }).formatToParts(date)

    const hour = parts.find((p) => p.type === 'hour')?.value ?? String(date.getHours()).padStart(2, '0')
    const minute = parts.find((p) => p.type === 'minute')?.value ?? String(date.getMinutes()).padStart(2, '0')
    const timeZone = parts.find((p) => p.type === 'timeZoneName')?.value ?? ''

    return `${hour}:${minute} ${timeZone}`.trim()
  } catch {
    const hours = String(date.getHours()).padStart(2, '0')
    const mins = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${mins}`
  }
}
