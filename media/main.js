const vscode = acquireVsCodeApi();

function post(message) { vscode.postMessage(message); }

tabCurrentBtn.addEventListener('click', () => Tabs.showCurrent());
tabListBtn.addEventListener('click', () => Tabs.showList());

dueListEl.addEventListener('click', (event) => {
  const row = event.target.closest('.due-row');
  if (!row) return;
  if (row.dataset.kind === 'meeting') ItemForm.editMeeting(row.dataset.id);
  else ItemForm.editTask(row.dataset.id);
});

sectionsEl.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-action]');
  if (btn) {
    const action = btn.dataset.action;
    if (action === 'openUrl') {
      const entry = entries.find((e) => e.id === btn.dataset.id);
      if (entry && entry.url) post({ type: 'openUrl', url: entry.url });
    } else if (action === 'closeTask') {
      const entry = entries.find((e) => e.id === btn.dataset.id);
      if (entry && entry.taskId) post({ type: 'setTaskClosed', id: entry.taskId, closed: true });
    } else if (action === 'closeMeeting') {
      const entry = entries.find((e) => e.id === btn.dataset.id);
      if (entry && entry.meetingId) post({ type: 'setMeetingClosed', id: entry.meetingId, closed: true });
    } else if (action === 'delete') {
      post({ type: 'deleteEntry', id: btn.dataset.id });
    } else if (action === 'add') {
      EntryForm.renderManualForm(btn.dataset.type);
    }
    return;
  }
  const row = event.target.closest('.entry');
  if (row) EntryForm.renderDetail(row.dataset.id);
});

listItemsEl.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-action]');
  if (btn) {
    const action = btn.dataset.action;
    const kind = btn.dataset.kind;
    const id = btn.dataset.id;
    if (action === 'closeItem') {
      post({ type: kind === 'task' ? 'setTaskClosed' : 'setMeetingClosed', id, closed: true });
    } else if (action === 'uncloseItem') {
      post({ type: kind === 'task' ? 'setTaskClosed' : 'setMeetingClosed', id, closed: false });
    } else if (action === 'deleteItem') {
      post({ type: kind === 'task' ? 'deleteTask' : 'deleteMeeting', id });
    }
    return;
  }
  const row = event.target.closest('.item-row');
  if (!row) return;
  if (row.dataset.kind === 'task') ItemForm.editTask(row.dataset.id);
  else ItemForm.editMeeting(row.dataset.id);
});

currentInputEl.addEventListener('focus', () => Tracker.showComboList());
currentInputEl.addEventListener('input', () => Tracker.showComboList(currentInputEl.value));
currentInputEl.addEventListener('blur', () => {
  setTimeout(() => Tracker.hideComboList(), 150);
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.combobox')) Tracker.hideComboList();
});

clearBtnEl.addEventListener('click', () => {
  post({ type: 'stop' });
  selectedItem = null;
  pausing = false;
  Tracker.updateUi();
});

pauseBtnEl.addEventListener('click', () => {
  if (pausing) {
    post({ type: 'stop' });
    if (selectedItem && selectedItem.kind === 'task') {
      post({ type: 'startTask', taskId: selectedItem.id });
    } else if (selectedItem && selectedItem.kind === 'meeting') {
      post({ type: 'startMeeting', meetingId: selectedItem.id });
    }
    pausing = false;
  } else {
    pausing = true;
    post({ type: 'start', kind: 'pause', name: 'Pause' });
  }
  Tracker.updateUi();
});

dayEl.addEventListener('change', () => {
  selectedDay = dayEl.value;
  Tabs.renderCurrent();
});

listSearchEl.addEventListener('input', () => List.render());
showClosedEl.addEventListener('change', () => List.render());

document.getElementById('newTaskBtn').addEventListener('click', () => ItemForm.task());
document.getElementById('newMeetingBtn').addEventListener('click', () => ItemForm.meeting());

syncBtnEl.addEventListener('click', () => Export.render());

window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.type === 'update') {
    entries = message.entries;
    tasks = message.tasks;
    meetings = message.meetings;
    currentId = message.currentId;
    today = message.today;
    currentBranch = message.currentBranch;
    branches = message.branches;
    branchListEl.innerHTML = branches
      .map((b) => '<option value="' + escapeHtml(b) + '"></option>')
      .join('');
    Tracker.syncState();
    Tracker.updateUi();
    if (Tabs.active === 'current') Tabs.renderCurrent();
    else List.render();
  }
});

dayEl.value = selectedDay;
Tabs.showCurrent();
post({ type: 'ready' });
