const Due = {
  render() {
    const items = [];
    for (const t of openTasks()) {
      if (t.deadline && t.deadline <= today) {
        items.push({ kind: 'task', name: t.name, id: t.id, date: t.deadline, notes: t.notes, url: t.url, tags: t.tags });
      }
    }
    for (const m of openMeetings()) {
      const d = m.start ? m.start.slice(0, 10) : '';
      if (d && d <= today) {
        items.push({ kind: 'meeting', name: m.name, id: m.id, date: m.start, notes: m.notes, url: m.url, tags: m.tags });
      }
    }
    items.sort((a, b) => a.date.localeCompare(b.date));

    if (items.length === 0) {
      dueSectionEl.classList.add('hidden');
      return;
    }
    dueSectionEl.classList.remove('hidden');
    dueListEl.innerHTML = items.map((it) => this.rowHtml(it)).join('');
  },

  rowHtml(it) {
    const dateKey = it.kind === 'task' ? it.date : it.date.slice(0, 10);
    const dl = deadlineClass(dateKey);
    const label = formatDate(it.date);
    const urlBtn = it.url
      ? '<button class="icon-btn" data-action="openUrl" data-url="' + escapeHtml(it.url) + '" title="Open ' + escapeHtml(it.url) + '">\u2197</button>'
      : '';
    const badges = tagBadgesHtml(it.tags);
    return (
      '<div class="due-row" data-kind="' + it.kind + '" data-id="' + escapeHtml(it.id) + '" title="' + escapeHtml(itemTooltip(it)) + '">' +
        '<div class="due-line1">' +
          '<span class="d-name ' + dl + '">' + escapeHtml(it.name) + '</span>' +
          urlBtn +
          '<span class="d-deadline">' + escapeHtml(label) + '</span>' +
        '</div>' +
        (badges ? '<div class="due-line2">' + badges + '</div>' : '') +
      '</div>'
    );
  },
};
