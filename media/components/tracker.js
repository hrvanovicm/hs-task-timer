const Tracker = {
  render() {
    currentRowEl.classList.toggle('hidden', selectedDay !== today);
    if (selectedDay === today) this.updateUi();
  },

  updateUi() {
    currentInputEl.disabled = pausing;
    if (pausing) {
      currentInputEl.value = 'Pause';
    } else if (document.activeElement !== currentInputEl) {
      currentInputEl.value = selectedItem ? selectedItem.name : '';
    }
    pauseBtnEl.textContent = pausing ? 'Stop pause' : 'Pause';
  },

  syncState() {
    const cur = currentEntry();
    if (!cur) {
      selectedItem = null;
      pausing = false;
    } else if (cur.type === 'pause') {
      pausing = true;
    } else if (cur.taskId) {
      pausing = false;
      selectedItem = { kind: 'task', id: cur.taskId, name: cur.name };
    } else if (cur.meetingId) {
      pausing = false;
      selectedItem = { kind: 'meeting', id: cur.meetingId, name: cur.name };
    } else {
      pausing = false;
      selectedItem = null;
    }
  },

  pickCombo(opt) {
    this.hideComboList();
    if (opt.action === 'task') {
      selectedItem = { kind: 'task', id: opt.taskId, name: opt.label };
      pausing = false;
      post({ type: 'startTask', taskId: opt.taskId });
    } else if (opt.action === 'meeting') {
      selectedItem = { kind: 'meeting', id: opt.meetingId, name: opt.label };
      pausing = false;
      post({ type: 'startMeeting', meetingId: opt.meetingId });
    }
    currentInputEl.value = selectedItem ? selectedItem.name : '';
    currentInputEl.blur();
    this.updateUi();
  },

  showComboList(filter) {
    const q = (filter || '').trim().toLowerCase();
    const items = [];

    items.push({ head: true, label: 'Tasks' });
    const taskMatches = openTasksSorted().filter((t) => !q || t.name.toLowerCase().indexOf(q) !== -1);
    for (const t of taskMatches) {
      items.push({ label: t.name, action: 'task', taskId: t.id, cls: deadlineClass(t.deadline) });
    }

    items.push({ head: true, label: 'Meetings' });
    const meetingMatches = openMeetingsSorted().filter((m) => !q || m.name.toLowerCase().indexOf(q) !== -1);
    for (const m of meetingMatches) {
      items.push({ label: m.name, action: 'meeting', meetingId: m.id });
    }

    comboListEl.innerHTML = '';
    for (const it of items) {
      const div = document.createElement('div');
      div.className = 'combo-option' + (it.head ? ' head' : '') + (it.cls ? ' ' + it.cls : '');
      div.textContent = it.label;
      if (!it.head) {
        div.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.pickCombo(it);
        });
      }
      comboListEl.appendChild(div);
    }
    comboListEl.classList.remove('hidden');
  },

  hideComboList() {
    comboListEl.classList.add('hidden');
  },
};
