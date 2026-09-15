const Stats = {
  render() {
    const dayEntries = entries.filter((e) => e.from.slice(0, 10) === selectedDay);
    if (dayEntries.length === 0) {
      statsEl.classList.add('hidden');
      return;
    }
    statsEl.classList.remove('hidden');

    let pauseMs = 0, workMs = 0, meetMs = 0;
    let startMin = null, endMax = null;

    for (const e of dayEntries) {
      const d = durationForDay(e, selectedDay);
      if (e.type === 'pause') pauseMs += d;
      else if (e.type === 'work') workMs += d;
      else if (e.type === 'meeting') meetMs += d;

      const f = parseLocal(e.from);
      if (startMin == null || f < startMin) startMin = f;
      const t = e.to ? parseLocal(e.to) : Date.now();
      if (endMax == null || t > endMax) endMax = t;
    }

    statsEl.innerHTML =
      '<table>' +
        '<tr><td>Pause</td><td>' + formatDuration(pauseMs) + '</td></tr>' +
        '<tr><td>Work</td><td>' + formatDuration(workMs) + '</td></tr>' +
        '<tr><td>Meetings</td><td>' + formatDuration(meetMs) + '</td></tr>' +
        '<tr><td>Started</td><td>' + (startMin != null ? formatTimeMs(startMin) : '\u2013') + '</td></tr>' +
        '<tr><td>Ended</td><td>' + (endMax != null ? formatTimeMs(endMax) : '\u2013') + '</td></tr>' +
      '</table>';
  },
};
