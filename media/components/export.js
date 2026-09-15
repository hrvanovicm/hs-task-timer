const Export = {
  render() {
    Form.render(
      syncView,
      'Export - ' + formatDate(selectedDay),
      '<textarea class="sync-text" id="sync-text" readonly></textarea>',
      [
        { id: 'copy', cls: 'secondary', label: 'Copy', onClick: () => post({ type: 'copyText', text: Form.read('sync-text') }) },
        { id: 'csv', label: 'Export CSV', onClick: () => post({ type: 'exportCsv', day: selectedDay }) },
      ],
      () => Tabs.showCurrent(),
    );
    document.getElementById('sync-text').value = this.buildText(selectedDay);
  },

  buildText(day) {
    const items = entries
      .filter((e) => e.from.slice(0, 10) === day)
      .sort((a, b) => a.from.localeCompare(b.from) || a.createdAt - b.createdAt);

    let out = 'Task Timer - ' + formatDate(day) + '\n\n';
    if (items.length === 0) return out + '(no entries)';
    for (const e of items) {
      const running = e.to == null;
      const tags = entryTags(e);
      let line = formatTime(e.from) + ' - ' + (running ? 'now' : formatTime(e.to)) + '  ' + e.name;
      if (tags.length) line += '  ' + tags.map((t) => '#' + t).join(' ');
      out += line + '\n';
    }
    return out;
  },
};
