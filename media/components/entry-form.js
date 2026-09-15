const EntryForm = {
  renderDetail(id) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;

    const isManual = entry.type !== 'work';
    const task = entry.type === 'work' && entry.taskId ? tasks.find((t) => t.id === entry.taskId) : null;
    const anchor = entry.from.slice(0, 10) || selectedDay;
    const back = () => Tabs.showCurrent();

    let body = '';
    if (entry.type === 'work') {
      const toText = entry.to
        ? (entry.to.slice(0, 10) === entry.from.slice(0, 10) ? formatTime(entry.to) : formatDate(entry.to))
        : 'now';
      body += Form.field('Time', '<span class="meta">' + escapeHtml(formatDate(entry.from)) + ' \u2013 ' + escapeHtml(toText) + '</span>');
    }
    body += Form.field('Title', Form.input('f-name', entry.name));
    if (task) body += Form.field('Branch', BranchAutocomplete.field(task.branch));
    if (isManual) {
      body += Form.field('From (' + formatDate(anchor) + ')', Form.input('f-from', formatTime(entry.from), { type: 'time' }));
      body += Form.field('To (' + formatDate(anchor) + ')', Form.input('f-to', entry.to ? formatTime(entry.to) : '', { type: 'time' }), entry.to == null ? 'Leave empty to keep running.' : '');
    }
    body += Form.field('URL', Form.input('f-url', entry.url));
    body += Form.field('Notes', Form.textarea('f-notes', entry.notes));

    const buttons = [
      { id: 'delete', cls: 'danger', label: 'Delete', onClick: () => { post({ type: 'deleteEntry', id: entry.id }); back(); } },
    ];
    if (entry.type === 'work' && entry.taskId && isTaskOpen(entry.taskId)) {
      buttons.push({ id: 'close', cls: 'secondary', label: 'Close task', onClick: () => { post({ type: 'setTaskClosed', id: entry.taskId, closed: true }); back(); } });
    }
    buttons.push({ id: 'cancel', cls: 'secondary', label: 'Cancel', onClick: back });
    buttons.push({ id: 'save', label: 'Save', onClick: save });

    Form.render(detailView, entry.type, body, buttons);
    if (task) BranchAutocomplete.bind();

    function save() {
      const name = Form.read('f-name').trim();
      if (!name) return;
      const patch = { name };
      if (isManual) {
        const fromTime = Form.read('f-from');
        const toTime = Form.read('f-to');
        patch.from = fromTime ? anchor + 'T' + fromTime : entry.from;
        patch.to = toTime ? anchor + 'T' + toTime : null;
      }
      patch.url = Form.read('f-url').trim();
      patch.notes = Form.read('f-notes');
      const msg = { type: 'updateEntry', id: entry.id, patch };
      if (task) msg.branch = Form.read('f-branch').trim();
      post(msg);
      back();
    }
  },

  renderManualForm(type) {
    const isWork = type === 'work';
    const isMeeting = type === 'meeting';
    const now = nowTime();
    const back = () => Tabs.showCurrent();

    let nameField = '';
    if (isWork) nameField = Form.field('Task', Form.select('f-task', taskSelectOptions()));
    else if (isMeeting) nameField = Form.field('Meeting', Form.select('f-meeting', meetingSelectOptions()));

    Form.render(
      newView,
      'Add ' + type,
      nameField +
        Form.field('From (' + formatDate(selectedDay) + ')', Form.input('f-from', now, { type: 'time' })) +
        Form.field('To (' + formatDate(selectedDay) + ')', Form.input('f-to', now, { type: 'time' })),
      [
        { id: 'cancel', cls: 'secondary', label: 'Cancel', onClick: back },
        { id: 'save', label: 'Add', onClick: save },
      ],
    );

    function save() {
      const from = Form.read('f-from');
      const to = Form.read('f-to');
      let name = type === 'break' ? 'Break' : type;
      let taskId = null;
      let meetingId = null;
      if (isWork) {
        taskId = Form.read('f-task') || null;
        const task = tasks.find((x) => x.id === taskId);
        name = task ? task.name : 'work';
      } else if (isMeeting) {
        meetingId = Form.read('f-meeting') || null;
        const meeting = meetings.find((x) => x.id === meetingId);
        name = meeting ? meeting.name : 'meeting';
      }
      post({
        type: 'createEntry',
        entry: {
          type,
          name,
          taskId,
          meetingId,
          from: from ? selectedDay + 'T' + from : null,
          to: to ? selectedDay + 'T' + to : null,
        },
      });
      back();
    }
  },
};
