import { Entry } from './types';

export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) {
    return 'less 1m';
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${rest}m`;
  }
  return `${minutes}m`;
}

export function parseLocalDateTime(value: string): number {
  const [datePart, timePart = '00:00'] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0).getTime();
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function nowLocal(date: Date = new Date()): string {
  return `${dayKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatTime(value: string): string {
  return value.slice(11, 16) || '';
}

export function durationForDay(entry: Entry, day: string, now = Date.now()): number {
  const start = parseLocalDateTime(entry.from);
  const end = entry.to ? parseLocalDateTime(entry.to) : now;
  const dayStart = parseLocalDateTime(`${day}T00:00`);
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  return Math.max(0, Math.min(end, dayEnd) - Math.max(start, dayStart));
}

export function entryDuration(entry: Entry, now = Date.now()): number {
  const end = entry.to ? parseLocalDateTime(entry.to) : now;
  return Math.max(0, end - parseLocalDateTime(entry.from));
}
