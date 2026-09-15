import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ACTIVITIES, BRANCH_POLL_MS, COMMAND_IDS, DISPLAY_NAME } from './config';
import { currentBranch, listBranches, workspaceRoot } from './git';
import { EntryInput, SidebarProvider, WebviewMessage } from './sidebar';
import { StatusBar } from './statusBar';
import { Storage } from './storage';
import { dayKey, formatDuration, nowLocal, parseLocalDateTime } from './time';
import { Entry, EntryType } from './types';

interface PickItem extends vscode.QuickPickItem {
  action: 'stop' | 'general' | 'break' | 'task' | 'meeting';
  id?: string;
}

export function activate(context: vscode.ExtensionContext): void {
  const storage = new Storage(context.workspaceState);
  const statusBar = new StatusBar();
  const sidebar = new SidebarProvider(context.extensionUri, handleWebviewMessage);

  let lastStatus = '';
  let currentBranchName = '';
  let branchList: string[] = [];
  let lastBranch: string | null = null;

  function refreshSidebar(): void {
    sidebar.refresh(
      storage.entries,
      storage.tasks,
      storage.meetings,
      storage.currentId,
      dayKey(),
      currentBranchName,
      branchList,
    );
  }

  function updateStatusBar(): void {
    const entry = storage.current();
    let status: string;

    if (entry) {
      const elapsed = Date.now() - parseLocalDateTime(entry.from);
      status = `$(clock) ${entry.name} ${formatDuration(elapsed)}`;
    } else {
      status = `$(clock) ${DISPLAY_NAME}`;
    }

    if (status === lastStatus) {
      return;
    }

    lastStatus = status;
    statusBar.update(status);
  }

  function refresh(): void {
    lastStatus = '';

    refreshSidebar();
    updateStatusBar();
  }

  function stopCurrent(): void {
    const entry = storage.current();

    if (entry && entry.to == null) {
      storage.updateEntry(entry.id, { to: nowLocal() });
    }

    storage.setCurrentId(null);
    refresh();
  }

  function resumeLast(predicate: (entry: Entry) => boolean, now: string): boolean {
    const last = storage.entries[storage.entries.length - 1];
    if (last && last.to === now && predicate(last)) {
      storage.updateEntry(last.id, { to: null });
      storage.setCurrentId(last.id);
      refresh();
      return true;
    }
    return false;
  }

  function start(kind: EntryType, name: string): void {
    const entry = storage.current();

    if (
      entry &&
      entry.to == null &&
      entry.type === kind &&
      entry.name === name &&
      entry.taskId == null &&
      entry.meetingId == null
    ) {
      return;
    }

    const now = nowLocal();

    if (
      kind === 'break' &&
      resumeLast((e) => e.type === 'break' && e.taskId == null && e.meetingId == null, now)
    ) {
      return;
    }

    stopCurrent();

    const created = storage.addEntry({
      type: kind,
      name: name.trim() || kind,
      url: null,
      notes: null,
      from: now,
      to: null,
      taskId: null,
      meetingId: null,
    });

    storage.setCurrentId(created.id);
    refresh();
  }

  function startTask(taskId: string): void {
    const task = storage.findTaskById(taskId);
    if (!task) {
      return;
    }

    const entry = storage.current();
    if (entry && entry.to == null && entry.taskId === taskId) {
      return;
    }

    if (resumeLast((e) => e.type === 'work' && e.taskId === taskId, nowLocal())) {
      return;
    }

    stopCurrent();

    const created = storage.addEntry({
      type: 'work',
      name: task.name,
      url: task.url,
      notes: task.notes,
      from: nowLocal(),
      to: null,
      taskId: taskId,
      meetingId: null,
    });

    storage.setCurrentId(created.id);

    refresh();
  }

  function startMeeting(meetingId: string): void {
    const meeting = storage.findMeetingById(meetingId);
    if (!meeting) {
      return;
    }

    const entry = storage.current();
    if (entry && entry.to == null && entry.meetingId === meetingId) {
      return;
    }

    if (resumeLast((e) => e.type === 'meeting' && e.meetingId === meetingId, nowLocal())) {
      return;
    }

    stopCurrent();

    const created = storage.addEntry({
      type: 'meeting',
      name: meeting.name,
      url: meeting.url,
      notes: meeting.notes,
      from: nowLocal(),
      to: null,
      taskId: null,
      meetingId: meetingId,
    });

    storage.setCurrentId(created.id);

    refresh();
  }

  function setTaskClosed(id: string, closed: boolean): void {
    if (closed) {
      const running = storage.entries.find((e) => e.taskId === id && e.to == null);
      if (running) {
        storage.updateEntry(running.id, { to: nowLocal() });
        if (storage.currentId === running.id) {
          storage.setCurrentId(null);
        }
      }
    }

    storage.updateTask(id, { closed });

    refresh();
  }

  function setMeetingClosed(id: string, closed: boolean): void {
    if (closed) {
      const running = storage.entries.find((e) => e.meetingId === id && e.to == null);
      if (running) {
        storage.updateEntry(running.id, { to: nowLocal() });
        if (storage.currentId === running.id) {
          storage.setCurrentId(null);
        }
      }
    }
    storage.updateMeeting(id, { closed });

    refresh();
  }

  function createEntry(entry: EntryInput): void {
    storage.addEntry({
      type: entry.type,
      name: entry.name.trim() || entry.type,
      url: entry.url ?? null,
      notes: entry.notes ?? null,
      from: entry.from || nowLocal(),
      to: entry.to || null,
      taskId: entry.taskId ?? null,
      meetingId: entry.meetingId ?? null,
    });

    refresh();
  }

  function handleWebviewMessage(message: WebviewMessage): void {
    switch (message.type) {
      case 'ready':
        refreshSidebar();
        return;
      case 'start':
        start(message.kind, message.name);
        return;
      case 'startTask':
        startTask(message.taskId);
        return;
      case 'startMeeting':
        startMeeting(message.meetingId);
        return;
      case 'startNewTask': {
        const task = storage.addTask({
          name: message.name.trim() || 'Task',
          branch: null,
          deadline: null,
          estimate: null,
          url: null,
          notes: null,
          tags: [],
          closed: false,
        });
        startTask(task.id);
        return;
      }
      case 'startNewMeeting': {
        const meeting = storage.addMeeting({
          name: message.name.trim() || 'Meeting',
          start: nowLocal(),
          url: null,
          notes: null,
          tags: [],
          closed: false,
        });
        startMeeting(meeting.id);
        return;
      }
      case 'stop':
        stopCurrent();
        return;
      case 'addTask':
        storage.addTask({
          name: message.name,
          branch: message.branch || null,
          deadline: message.deadline ?? null,
          estimate: message.estimate ?? null,
          url: message.url ?? null,
          notes: message.notes ?? null,
          tags: message.tags ?? [],
          closed: false,
        });
        refresh();
        return;
      case 'updateTask':
        storage.updateTask(message.id, message.patch);
        refresh();
        return;
      case 'setTaskClosed':
        setTaskClosed(message.id, message.closed);
        return;
      case 'deleteTask':
        storage.deleteTask(message.id);
        refresh();
        return;
      case 'addMeeting':
        storage.addMeeting({
          name: message.name,
          start: message.start ?? '',
          url: message.url ?? null,
          notes: message.notes ?? null,
          tags: message.tags ?? [],
          closed: false,
        });
        refresh();
        return;
      case 'updateMeeting':
        storage.updateMeeting(message.id, message.patch);
        refresh();
        return;
      case 'setMeetingClosed':
        setMeetingClosed(message.id, message.closed);
        return;
      case 'deleteMeeting':
        storage.deleteMeeting(message.id);
        refresh();
        return;
      case 'createEntry':
        createEntry(message.entry);
        return;
      case 'updateEntry': {
        const entry = storage.findEntryById(message.id);
        storage.updateEntry(message.id, message.patch);
        if (entry && entry.taskId && entry.type === 'work') {
          const task = storage.findTaskById(entry.taskId);
          if (task) {
            storage.updateTask(task.id, {
              name: message.patch.name ?? task.name,
              branch: message.branch ?? task.branch,
              url: message.patch.url ?? task.url,
            });
          }
        }
        refresh();
        return;
      }
      case 'deleteEntry':
        storage.deleteEntry(message.id);
        refresh();
        return;
      case 'openUrl':
        void openUrl(message.url);
        return;
      case 'copyText':
        void vscode.env.clipboard.writeText(message.text);
        void vscode.window.showInformationMessage('Copied to clipboard');
        return;
      case 'exportCsv':
        void exportCsv(message.day);
        return;
    }
  }

  function openUrl(url: string): void {
    try {
      void vscode.env.openExternal(vscode.Uri.parse(url));
    } catch {
      void vscode.window.showErrorMessage(`Invalid URL: ${url}`);
    }
  }

  function tagsForEntry(e: Entry): string[] {
    if (e.taskId) {
      const task = storage.findTaskById(e.taskId);
      if (task) {
        return task.tags ?? [];
      }
    }
    if (e.meetingId) {
      const meeting = storage.findMeetingById(e.meetingId);
      if (meeting) {
        return meeting.tags ?? [];
      }
    }
    return [];
  }

  async function exportCsv(day: string): Promise<void> {
    const folders = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Select folder',
    });
    if (!folders || folders.length === 0) {
      return;
    }

    const items = storage.entries
      .filter((e) => e.from.slice(0, 10) === day)
      .sort((a, b) => a.from.localeCompare(b.from) || a.createdAt - b.createdAt);

    const rows = [['type', 'name', 'tags', 'from', 'to', 'url', 'notes']];
    for (const e of items) {
      rows.push([e.type, e.name, tagsForEntry(e).join(' '), e.from, e.to ?? '', e.url ?? '', e.notes ?? '']);
    }
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');

    const filePath = path.join(folders[0].fsPath, `task-timer-${day}.csv`);
    await fs.promises.writeFile(filePath, csv, 'utf8');
    void vscode.window.showInformationMessage(`Exported to ${filePath}`);
  }

  async function pickTask(): Promise<void> {
    const items: PickItem[] = [
      { label: '$(circle-slash) No tracking', action: 'stop' },
      { label: `$(play) ${ACTIVITIES.generalWork}`, action: 'general' },
      { label: `$(debug-pause) ${ACTIVITIES.break}`, action: 'break' },
    ];
    for (const task of storage.openTasks()) {
      items.push({ label: `Work: ${task.name}`, action: 'task', id: task.id });
    }
    for (const meeting of storage.openMeetings()) {
      items.push({ label: `Meeting: ${meeting.name}`, action: 'meeting', id: meeting.id });
    }

    const pick = await vscode.window.showQuickPick(items, { placeHolder: 'Select what to track' });
    if (!pick) {
      return;
    }
    switch (pick.action) {
      case 'stop':
        stopCurrent();
        return;
      case 'general':
        start('work', ACTIVITIES.generalWork);
        return;
      case 'break':
        start('break', ACTIVITIES.break);
        return;
      case 'task':
        if (pick.id) {
          startTask(pick.id);
        }
        return;
      case 'meeting':
        if (pick.id) {
          startMeeting(pick.id);
        }
        return;
    }
  }

  async function promptTaskForBranch(branch: string): Promise<void> {
    const matching = storage.openTasks().filter((t) => t.branch === branch);
    if (matching.length === 0) {
      return;
    }
    const pick = await vscode.window.showQuickPick(
      matching.map((t) => ({ label: t.name, taskId: t.id })),
      { placeHolder: `Select task to track on branch "${branch}"` },
    );
    if (pick) {
      startTask(pick.taskId);
    }
  }

  async function syncBranch(): Promise<void> {
    const root = workspaceRoot();
    if (!root) {
      return;
    }

    const [branch, all] = await Promise.all([currentBranch(), listBranches()]);

    if (!arraysEqual(all, branchList)) {
      branchList = all;
      refreshSidebar();
    }

    if (branch === null) {
      currentBranchName = '';
      return;
    }

    const changed = lastBranch !== null && branch !== lastBranch;
    lastBranch = branch;
    currentBranchName = branch;
    refreshSidebar();

    if (changed) {
      await promptTaskForBranch(branch);
    }
  }

  function handleTick(): void {
    const entry = storage.current();
    if (entry && entry.to == null && entry.from.slice(0, 10) !== dayKey()) {
      storage.splitMidnight(dayKey());
      refresh();
      return;
    }
    updateStatusBar();
  }

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebar),
    vscode.commands.registerCommand(COMMAND_IDS.switchTask, () => void pickTask()),
    vscode.commands.registerCommand(COMMAND_IDS.newWork, () => start('work', ACTIVITIES.generalWork)),
    vscode.commands.registerCommand(COMMAND_IDS.newBreak, () => start('break', ACTIVITIES.break)),
    statusBar,
  );

  storage.splitMidnight(dayKey());
  refresh();
  void syncBranch();
  const poll = setInterval(() => void syncBranch(), BRANCH_POLL_MS);
  const tick = setInterval(handleTick, 1000);
  context.subscriptions.push({ dispose: () => clearInterval(poll) });
  context.subscriptions.push({ dispose: () => clearInterval(tick) });
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, i) => value === b[i]);
}

function csvEscape(value: string): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function deactivate(): void {}
