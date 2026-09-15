const GROUPS = [
  { type: 'pause', title: 'Pauses' },
  { type: 'work', title: 'Work' },
  { type: 'meeting', title: 'Meetings' },
];

const Sections = {
  render() {
    const dayEntries = entries.filter((e) => e.from.slice(0, 10) === selectedDay);

    let html = '';
    for (const group of GROUPS) {
      const items = dayEntries
        .filter((e) => e.type === group.type)
        .sort((a, b) => a.from.localeCompare(b.from) || a.createdAt - b.createdAt);

      html += '<div class="section">';
      html +=
        '<div class="section-head">' +
          '<span class="section-title">' + group.title + '</span>' +
          '<button class="add-btn" data-action="add" data-type="' + group.type + '" title="Add ' + group.type + '">+</button>' +
        '</div>';
      html += items.length === 0
        ? '<div class="empty">None</div>'
        : items.map((e) => this.entryRowHtml(e)).join('');
      html += '</div>';
    }

    sectionsEl.innerHTML = html;
  },

  entryRowHtml(e) {
    const running = e.to == null;
    const dur = durationForDay(e, selectedDay);
    const range = formatTime(e.from) + ' \u2013 ' + (running ? 'now' : formatTime(e.to));
    const tooltip = [e.notes, e.url].filter(Boolean).join(' \u00b7 ');
    const titleAttr = tooltip ? ' title="' + escapeHtml(tooltip) + '"' : '';
    const urlBtn = e.url
      ? '<button class="icon-btn" data-action="openUrl" data-id="' + escapeHtml(e.id) + '" title="Open ' + escapeHtml(e.url) + '">\u2197</button>'
      : '';
    let closeBtn = '';
    if (e.type === 'work' && e.taskId && isTaskOpen(e.taskId)) {
      closeBtn = '<button class="icon-btn" data-action="closeTask" data-id="' + escapeHtml(e.id) + '" title="Close task">\u2713</button>';
    } else if (e.type === 'meeting' && e.meetingId && isMeetingOpen(e.meetingId)) {
      closeBtn = '<button class="icon-btn" data-action="closeMeeting" data-id="' + escapeHtml(e.id) + '" title="Close meeting">\u2713</button>';
    }
    const delBtn = '<button class="icon-btn" data-action="delete" data-id="' + escapeHtml(e.id) + '" title="Delete">\u00d7</button>';
    return (
      '<div class="entry' + (running ? ' running' : '') + '" data-id="' + escapeHtml(e.id) + '"' + titleAttr + '>' +
        '<div class="entry-line1">' +
          '<span class="name">' + escapeHtml(e.name) + '</span>' +
          '<span class="time">' + formatDuration(dur) + '</span>' +
          urlBtn + closeBtn + delBtn +
        '</div>' +
        '<div class="entry-line2">' + range + '</div>' +
      '</div>'
    );
  },
};
