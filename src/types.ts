export type EntryType = 'work' | 'pause' | 'meeting';

export interface Task {
  id: string;
  name: string;
  branch: string | null;
  deadline?: string | null;
  estimate: string | null;
  url: string | null;
  notes: string | null;
  closed: boolean;
  createdAt: number;
}

export interface Meeting {
  id: string;
  name: string;
  start: string;
  url: string | null;
  notes: string | null;
  closed: boolean;
  createdAt: number;
}

export interface Entry {
  id: string;
  type: EntryType;
  name: string;
  url: string | null;
  notes: string | null;
  from: string;
  to: string | null;
  taskId: string | null;
  meetingId: string | null;
  createdAt: number;
}

export interface StoreData {
  tasks: Task[];
  meetings: Meeting[];
  entries: Entry[];
  currentId: string | null;
}
