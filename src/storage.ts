import { randomUUID } from 'crypto';
import * as vscode from 'vscode';
import { STORAGE_KEY } from './config';
import { nextDayKey } from './time';
import { Entry, Meeting, StoreData, Task } from './types';

function normalizeTask(task: Task): Task {
  return { ...task, tags: Array.isArray(task.tags) ? task.tags : [] };
}

function normalizeMeeting(meeting: Meeting): Meeting {
  return { ...meeting, tags: Array.isArray(meeting.tags) ? meeting.tags : [] };
}

export class Storage {
  private data: StoreData;

  constructor(private readonly memento: vscode.Memento) {
    const saved = memento.get<StoreData>(STORAGE_KEY);
    if (saved) {
      this.data = {
        tasks: (Array.isArray(saved.tasks) ? saved.tasks : []).map(normalizeTask),
        meetings: (Array.isArray(saved.meetings) ? saved.meetings : []).map(normalizeMeeting),
        entries: Array.isArray(saved.entries) ? saved.entries : [],
        currentId: saved.currentId,
      };
    } else {
      this.data = { tasks: [], meetings: [], entries: [], currentId: null };
    }
  }

  get entries(): Entry[] {
    return this.data.entries;
  }

  get tasks(): Task[] {
    return this.data.tasks;
  }

  get meetings(): Meeting[] {
    return this.data.meetings;
  }

  get currentId(): string | null {
    return this.data.currentId;
  }

  setCurrentId(id: string | null) {
    this.data.currentId = id;
    this.persist();
  }

  findEntryById(id: string): Entry | undefined {
    return this.data.entries.find((e) => e.id === id);
  }

  findTaskById(id: string): Task | undefined {
    return this.data.tasks.find((t) => t.id === id);
  }

  findMeetingById(id: string): Meeting | undefined {
    return this.data.meetings.find((m) => m.id === id);
  }

  openTasks(): Task[] {
    return this.data.tasks.filter((t) => !t.closed);
  }

  openMeetings(): Meeting[] {
    return this.data.meetings.filter((m) => !m.closed);
  }

  current(): Entry | undefined {
    const id = this.data.currentId;
    return id ? this.findEntryById(id) : undefined;
  }

  addTask(task: Partial<Task>): Task {
    if(!task.id) {
      task.id = randomUUID();
      task.createdAt = Date.now();
    }
    if (!task.tags) {
      task.tags = [];
    }

    this.data.tasks.push(task as Task);
    this.persist();

    return task as Task;
  }

  updateTask(id: string, patch: Partial<Task>): void {
    const task = this.findTaskById(id);
    if (!task) {
      return;
    }

    Object.assign(task, patch);
    this.persist();
  }

  deleteTask(id: string): void {
    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    this.persist();
  }

  addMeeting(meeting: Partial<Meeting>): Meeting {
    if(!meeting.id) {
      meeting.id = randomUUID();
      meeting.createdAt = Date.now();
    }
    if (!meeting.tags) {
      meeting.tags = [];
    }

    this.data.meetings.push(meeting as Meeting);
    this.persist();

    return meeting as Meeting;
  }

  updateMeeting(id: string, patch: Partial<Meeting>): void {
    const meeting = this.findMeetingById(id);
    if (!meeting) {
      return;
    }

    Object.assign(meeting, patch);
    this.persist();
  }

  deleteMeeting(id: string): void {
    this.data.meetings = this.data.meetings.filter((m) => m.id !== id);
    this.persist();
  }

  addEntry(entry: Partial<Entry>): Entry {
    if(!entry.id) {
      entry.id = randomUUID();
      entry.createdAt = Date.now();
    }

    this.data.entries.push(entry as Entry);
    this.persist();

    return entry as Entry;
  }

  updateEntry(id: string, patch: Partial<Entry>): void {
    const entry = this.findEntryById(id);
    if (!entry) {
      return;
    }

    Object.assign(entry, patch);
    this.persist();
  }

  deleteEntry(id: string): void {
    this.data.entries = this.data.entries.filter((e) => e.id !== id);
    if (this.data.currentId === id) {
      this.data.currentId = null;
    }

    this.persist();
  }

  splitMidnight(today: string): boolean {
    let changed = false;
    const result: Entry[] = [];
    let nextCurrentId: string | null = null;

    for (const entry of this.data.entries) {
      const fromDay = entry.from.slice(0, 10);
      const endDay = entry.to ? entry.to.slice(0, 10) : today;

      if (fromDay === endDay) {
        result.push(entry);
        continue;
      }

      changed = true;
      let from = entry.from;
      let day = fromDay;

      while (day < endDay) {
        const to = day + 'T23:59';
        if (from !== to) {
          result.push({ ...entry, id: randomUUID(), from, to });
        }
        day = nextDayKey(day);
        from = day + 'T00:00';
      }

      const lastId = randomUUID();
      if (entry.to == null || from !== entry.to) {
        result.push({ ...entry, id: lastId, from, to: entry.to });
      }

      if (entry.id === this.data.currentId) {
        nextCurrentId = lastId;
      }
    }

    if (!changed) {
      return false;
    }

    this.data.entries = result;
    if (nextCurrentId) {
      this.data.currentId = nextCurrentId;
    }
    this.persist();
    return true;
  }

  private persist(): void {
    void this.memento.update(STORAGE_KEY, this.data);
  }
}
