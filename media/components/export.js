const Export = {
  render() {
    Form.render(
      syncView,
      'Export - ' + formatDate(selectedDay),
      Form.field('Context', Form.textarea('att-input', exportContext), 'Always included in Copy.') +
        '<textarea class="sync-text" id="sync-text" readonly></textarea>',
      [
        { id: 'copy', cls: 'secondary', label: 'Copy', onClick: () => post({ type: 'copyText', text: Form.read('sync-text') }) },
        { id: 'csv', label: 'Export CSV', onClick: () => post({ type: 'exportCsv', day: selectedDay }) },
      ],
      () => Tabs.showCurrent(),
    );
    document.getElementById('sync-text').value = this.buildText(selectedDay);
    document.getElementById('att-input').addEventListener('input', (event) => {
      exportContext = event.target.value;
      post({ type: 'setExportContext', context: exportContext });
      document.getElementById('sync-text').value = this.buildText(selectedDay);
    });
  },

  buildText(day) {
    const ctx = (exportContext || '').trim();
    const items = entries
      .filter((e) => e.from.slice(0, 10) === day)
      .sort((a, b) => a.from.localeCompare(b.from) || a.createdAt - b.createdAt);

    let out = 'Task Timer - ' + formatDate(day) + '\n\n';
    if (ctx) out += ctx + '\n\n';
    if (items.length === 0) return out + '(no entries)';

    for (const g of this.groupEntries(items, day)) {
      out += g.title + '\n';
      out += '\tTotal: ' + formatDuration(g.total) + '\n';
      if (g.estimate) out += '\tEstimate: ' + g.estimate + '\n';
      if (g.url) out += '\tURL: ' + g.url + '\n';
      if (g.notes) out += '\tNotes: ' + g.notes + '\n';
      out += '\tWork times:\n';
      for (const e of g.entries) {
        const running = e.to == null;
        out += '\t\t' + formatTime(e.from) + ' - ' + (running ? 'now' : formatTime(e.to)) + '\n';
      }
      out += '\n';
    }
    return out;
  },

  groupEntries(items, day) {
    const map = new Map();
    for (const e of items) {
      const key = this.groupKey(e);
      if (!map.has(key)) {
        map.set(key, { type: e.type, name: e.name, url: e.url, notes: e.notes, estimate: entryEstimate(e), entries: [] });
      }
      map.get(key).entries.push(e);
    }
    const groups = [...map.values()];
    for (const g of groups) {
      g.total = g.entries.reduce((sum, e) => sum + durationForDay(e, day), 0);
      g.title = this.groupTitle(g);
    }
    groups.sort((a, b) => a.entries[0].from.localeCompare(b.entries[0].from));
    return groups;
  },

  groupKey(e) {
    if (e.type === 'work') return 'work:' + (e.taskId || e.name);
    if (e.type === 'meeting') return 'meeting:' + (e.meetingId || e.name);
    return 'break';
  },

  groupTitle(g) {
    if (g.type === 'work') return 'Work: ' + g.name;
    if (g.type === 'meeting') return 'Meeting: ' + g.name;
    return 'Break';
  },
};
