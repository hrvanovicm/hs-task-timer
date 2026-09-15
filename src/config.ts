export const DISPLAY_NAME = 'Task Timer';

export const DATA_VERSION = 1;
export const STORAGE_KEY = `taskTimer.data.v${DATA_VERSION}`;

export const VIEW_TYPE = 'taskTimer.view';

export const COMMAND_IDS = {
  switchTask: 'hsTaskTimer.switchTask',
  newWork: 'hsTaskTimer.newWork',
  newPause: 'hsTaskTimer.newPause',
} as const;

export const BRANCH_POLL_MS = 5000;

export const ACTIVITIES = {
  generalWork: 'General work',
  pause: 'Pause',
} as const;
