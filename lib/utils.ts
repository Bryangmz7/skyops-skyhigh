import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'dd/MM/yyyy', { locale: es })
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es })
}

export function formatTime(date: string | Date) {
  return format(new Date(date), 'HH:mm', { locale: es })
}
