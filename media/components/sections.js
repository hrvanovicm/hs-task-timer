const GROUPS = [
  { type: 'break', title: 'Breaks' },
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
    const badges = tagBadgesHtml(entryTags(e));
    const tooltip = [e.name, e.notes, e.url].filter(Boolean).join(' \u00b7 ');
    const titleAttr = tooltip ? ' title="' + escapeHtml(tooltip) + '"' : '';
    const urlBtn = e.url
      ? '<button class="icon-btn" data-action="openUrl" data-id="' + escapeHtml(e.id) + '" title="Open ' + escapeHtml(e.url) + '">\u2197</button>'
      : '';
    let editBtn = '';
    if (e.type === 'work' && e.taskId) {
      editBtn = '<button class="icon-btn" data-action="editTask" data-id="' + escapeHtml(e.taskId) + '" title="Edit task">\u270e</button>';
    } else if (e.type === 'meeting' && e.meetingId) {
      editBtn = '<button class="icon-btn" data-action="editMeeting" data-id="' + escapeHtml(e.meetingId) + '" title="Edit meeting">\u270e</button>';
    }
    const delBtn = '<button class="icon-btn" data-action="delete" data-id="' + escapeHtml(e.id) + '" title="Delete">\u00d7</button>';
    return (
      '<div class="entry' + (running ? ' running' : '') + '" data-id="' + escapeHtml(e.id) + '"' + titleAttr + '>' +
        '<div class="entry-line1">' +
          '<span class="name">' + escapeHtml(e.name) + '</span>' +
          '<span class="time">' + formatDuration(dur) + '</span>' +
          urlBtn + editBtn + delBtn +
        '</div>' +
        '<div class="entry-line2">' + range + '</div>' +
        (badges ? '<div class="entry-tags">' + badges + '</div>' : '') +
      '</div>'
    );
  },
};
