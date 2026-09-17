const Tracker = {
  render() {
    currentRowEl.classList.toggle('hidden', selectedDay !== today);
    if (selectedDay === today) this.updateUi();
  },

  updateUi() {
    currentInputEl.disabled = pausing;
    if (pausing) {
      currentInputEl.value = 'Break';
    } else if (document.activeElement !== currentInputEl) {
      currentInputEl.value = selectedItem ? selectedItem.name : '';
    }
    breakBtnEl.textContent = pausing ? 'Stop break' : 'Start break';
  },

  syncState() {
    const cur = currentEntry();
    if (!cur) {
      selectedItem = null;
      pausing = false;
    } else if (cur.type === 'break') {
      pausing = true;
      selectedItem = resumeTarget();
    } else if (cur.taskId) {
      pausing = false;
      selectedItem = { kind: 'task', id: cur.taskId, name: cur.name };
    } else if (cur.meetingId) {
      pausing = false;
      selectedItem = { kind: 'meeting', id: cur.meetingId, name: cur.name };
    } else if (cur.type === 'work') {
      pausing = false;
      selectedItem = { kind: 'general', name: cur.name };
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
    } else if (opt.action === 'newTask') {
      post({ type: 'startNewTask', name: opt.name });
    } else if (opt.action === 'newMeeting') {
      post({ type: 'startNewMeeting', name: opt.name });
    } else if (opt.action === 'general') {
      selectedItem = { kind: 'general', name: opt.name };
      pausing = false;
      post({ type: 'start', kind: 'work', name: opt.name });
    }
    currentInputEl.value = selectedItem ? selectedItem.name : (opt.name || '');
    currentInputEl.blur();
    this.updateUi();
  },

  showComboList(filter) {
    const q = (filter || '').trim();
    const lq = q.toLowerCase();
    const items = [];

    if (!q) {
      items.push({ label: 'Start general work', action: 'general', name: 'General work' });
    }

    items.push({ head: true, label: 'Tasks' });
    const taskMatches = openTasksSorted().filter((t) => !lq || (t.name + ' ' + (Array.isArray(t.tags) ? t.tags.join(' ') : '')).toLowerCase().indexOf(lq) !== -1);
    for (const t of taskMatches) {
      items.push({ label: t.name, action: 'task', taskId: t.id, cls: deadlineClass(t.deadline) });
    }
    if (taskMatches.length === 0) {
      items.push({ label: '+ add task' + (q ? ' "' + q + '"' : ''), action: 'newTask', name: q, cls: 'add' });
    }

    items.push({ head: true, label: 'Meetings' });
    const meetingMatches = openMeetingsSorted().filter((m) => !lq || (m.name + ' ' + (Array.isArray(m.tags) ? m.tags.join(' ') : '')).toLowerCase().indexOf(lq) !== -1);
    for (const m of meetingMatches) {
      items.push({ label: m.name, action: 'meeting', meetingId: m.id });
    }
    if (meetingMatches.length === 0) {
      items.push({ label: '+ add meeting' + (q ? ' "' + q + '"' : ''), action: 'newMeeting', name: q, cls: 'add' });
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
