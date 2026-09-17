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
    for (const e of items) {
      const running = e.to == null;
      const tags = entryTags(e);
      const estimate = entryEstimate(e);
      let line = formatTime(e.from) + ' - ' + (running ? 'now' : formatTime(e.to)) + '  ' + e.name;
      if (estimate) line += '  (' + estimate + ' est)';
      if (tags.length) line += '  ' + tags.map((t) => '#' + t).join(' ');
      if (e.url) line += '  ' + e.url;
      out += line + '\n';
    }
    return out;
  },
};
