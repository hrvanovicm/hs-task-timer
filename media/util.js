function toDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function pad(n) { return String(n).padStart(2, '0'); }

function nowTime() {
  const d = new Date();
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'less 1m';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0) return hours + 'h ' + rest + 'm';
  return minutes + 'm';
}

function parseLocal(value) {
  const parts = String(value).split('T');
  const datePart = parts[0] || '';
  const timePart = parts[1] || '00:00';
  const dp = datePart.split('-');
  const tp = timePart.split(':');
  return new Date(Number(dp[0]), Number(dp[1]) - 1, Number(dp[2]), Number(tp[0]) || 0, Number(tp[1]) || 0).getTime();
}

function formatTime(value) {
  return value ? value.slice(11, 16) : '';
}

function formatTimeMs(ms) {
  const d = new Date(ms);
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

const MONTH_ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function formatDate(value) {
  if (!value) return '';
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/);
  if (!m) return s;
  const day = Number(m[3]);
  const month = MONTH_ABBR[Number(m[2]) - 1] || m[2];
  let out = day + '. ' + month + ' ' + m[1];
  if (m[4]) out += ' ' + m[4];
  return out;
}

function durationForDay(entry, day) {
  const start = parseLocal(entry.from);
  const end = entry.to ? parseLocal(entry.to) : Date.now();
  const dayStart = parseLocal(day + 'T00:00');
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  return Math.max(0, Math.min(end, dayEnd) - Math.max(start, dayStart));
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseTags(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function tagBadgesHtml(tags) {
  const list = Array.isArray(tags) ? tags : [];
  if (list.length === 0) return '';
  return (
    '<span class="tags">' +
    list.map((t) => '<span class="tag" title="' + escapeHtml(t) + '">' + escapeHtml(t) + '</span>').join('') +
    '</span>'
  );
}

function itemTooltip(o) {
  return [o.name, o.notes].filter(Boolean).join(' \u00b7 ');
}
