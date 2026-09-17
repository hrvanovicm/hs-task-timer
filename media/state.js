let entries = [];
let tasks = [];
let meetings = [];
let currentId = null;
let today = toDayKey(new Date());
let selectedDay = today;
let currentBranch = '';
let branches = [];
let selectedItem = null;
let pausing = false;
let exportContext = '';

function currentEntry() {
  return entries.find((e) => e.id === currentId) || null;
}

function resumeTarget() {
  const cur = currentEntry();
  if (!cur || cur.type !== 'break') return null;
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e === cur) continue;
    if (e.type === 'work' && e.taskId && isTaskOpen(e.taskId)) {
      return { kind: 'task', id: e.taskId, name: e.name };
    }
    if (e.type === 'meeting' && e.meetingId && isMeetingOpen(e.meetingId)) {
      return { kind: 'meeting', id: e.meetingId, name: e.name };
    }
  }
  return null;
}

function openTasks() {
  return tasks.filter((t) => !t.closed);
}

function openMeetings() {
  return meetings.filter((m) => !m.closed);
}

function taskLastUse(task) {
  let latest = task.createdAt;
  for (const e of entries) {
    if (e.taskId === task.id && e.createdAt > latest) latest = e.createdAt;
  }
  return latest;
}

function meetingLastUse(meeting) {
  let latest = meeting.createdAt;
  for (const e of entries) {
    if (e.meetingId === meeting.id && e.createdAt > latest) latest = e.createdAt;
  }
  return latest;
}

function openTasksSorted() {
  return openTasks().sort((a, b) => taskLastUse(b) - taskLastUse(a));
}

function openMeetingsSorted() {
  return openMeetings().sort((a, b) => meetingLastUse(b) - meetingLastUse(a));
}

function deadlineClass(deadline) {
  if (!deadline) return '';
  if (deadline === today) return 'dl-today';
  if (deadline < today) return 'dl-overdue';
  return '';
}

function isTaskOpen(taskId) {
  const t = tasks.find((x) => x.id === taskId);
  return !!t && !t.closed;
}

function isMeetingOpen(meetingId) {
  const m = meetings.find((x) => x.id === meetingId);
  return !!m && !m.closed;
}

function entryTags(e) {
  if (e.type === 'work' && e.taskId) {
    const t = tasks.find((x) => x.id === e.taskId);
    if (t) return Array.isArray(t.tags) ? t.tags : [];
  }
  if (e.type === 'meeting' && e.meetingId) {
    const m = meetings.find((x) => x.id === e.meetingId);
    if (m) return Array.isArray(m.tags) ? m.tags : [];
  }
  return [];
}

function entryEstimate(e) {
  if (e.taskId) {
    const t = tasks.find((x) => x.id === e.taskId);
    if (t && t.estimate) return t.estimate;
  }
  return '';
}

function combinedItems() {
  const items = [];
  for (const t of tasks) items.push({ kind: 'task', obj: t });
  for (const m of meetings) items.push({ kind: 'meeting', obj: m });
  return items;
}

function itemDate(it) {
  if (it.kind === 'meeting') return it.obj.start ? it.obj.start.slice(0, 10) : '';
  return it.obj.deadline || '';
}

function sortByDeadline(items) {
  return items.sort((a, b) => {
    const da = itemDate(a);
    const db = itemDate(b);
    if (!da && !db) return b.obj.createdAt - a.obj.createdAt;
    if (!da) return 1;
    if (!db) return -1;
    return da.localeCompare(db);
  });
}

function itemSubLine(it) {
  const o = it.obj;
  const parts = [];
  if (it.kind === 'task') {
    if (o.deadline) parts.push(formatDate(o.deadline));
    if (o.estimate) parts.push(o.estimate + ' est');
  } else {
    if (o.start) parts.push(formatDate(o.start));
  }
  return parts.join(' \u00b7 ');
}

function taskSelectOptions() {
  return '<option value="">-- none --</option>' +
    openTasks()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => '<option value="' + escapeHtml(t.id) + '">' + escapeHtml(t.name) + '</option>')
      .join('');
}

function meetingSelectOptions() {
  return '<option value="">-- none --</option>' +
    openMeetings()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((m) => '<option value="' + escapeHtml(m.id) + '">' + escapeHtml(m.name) + '</option>')
      .join('');
}
