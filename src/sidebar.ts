import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { VIEW_TYPE } from './config';
import { Entry, EntryType, Meeting, Task } from './types';

export interface EntryInput {
  type: EntryType;
  name: string;
  url?: string | null;
  notes?: string | null;
  from?: string | null;
  to?: string | null;
  taskId?: string | null;
  meetingId?: string | null;
}

export interface EntryPatch {
  name?: string;
  url?: string;
  notes?: string;
  from?: string;
  to?: string | null;
}

export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'start'; kind: EntryType; name: string; url?: string; notes?: string }
  | { type: 'startTask'; taskId: string }
  | { type: 'startMeeting'; meetingId: string }
  | { type: 'startNewTask'; name: string }
  | { type: 'startNewMeeting'; name: string }
  | { type: 'stop' }
  | { type: 'addTask'; name: string; branch?: string | null; deadline?: string | null; estimate?: string | null; url?: string | null; notes?: string | null; tags?: string[] }
  | { type: 'updateTask'; id: string; patch: Partial<Task> }
  | { type: 'setTaskClosed'; id: string; closed: boolean }
  | { type: 'deleteTask'; id: string }
  | { type: 'addMeeting'; name: string; start?: string; url?: string | null; notes?: string | null; tags?: string[] }
  | { type: 'updateMeeting'; id: string; patch: Partial<Meeting> }
  | { type: 'setMeetingClosed'; id: string; closed: boolean }
  | { type: 'deleteMeeting'; id: string }
  | { type: 'createEntry'; entry: EntryInput }
  | { type: 'updateEntry'; id: string; patch: EntryPatch; branch?: string }
  | { type: 'deleteEntry'; id: string }
  | { type: 'openUrl'; url: string }
  | { type: 'copyText'; text: string }
  | { type: 'exportCsv'; day: string }
  | { type: 'setExportContext'; context: string };

interface UpdateMessage {
  type: 'update';
  entries: Entry[];
  tasks: Task[];
  meetings: Meeting[];
  currentId: string | null;
  today: string;
  currentBranch: string;
  branches: string[];
  exportContext: string;
}

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = VIEW_TYPE;

  private view: vscode.WebviewView | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly onMessage: (msg: WebviewMessage) => void,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.renderHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg: WebviewMessage) => {
      this.onMessage(msg);
    });
  }

  refresh(
    entries: Entry[],
    tasks: Task[],
    meetings: Meeting[],
    currentId: string | null,
    today: string,
    currentBranch: string,
    branches: string[],
    exportContext: string,
  ): void {
    const message: UpdateMessage = {
      type: 'update',
      entries,
      tasks,
      meetings,
      currentId,
      today,
      currentBranch,
      branches,
      exportContext,
    };
    void this.view?.webview.postMessage(message);
  }

  private renderHtml(webview: vscode.Webview): string {
    const htmlPath = path.join(this.extensionUri.fsPath, 'media', 'sidebar.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace(/__CSP_SOURCE__/g, webview.cspSource);

    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'styles.css'),
    );
    html = html.replace('__CSS_URI__', cssUri.toString());

    const scripts = [
      'util',
      'state',
      'dom',
      'components/form',
      'components/branch',
      'components/tabs',
      'components/tracker',
      'components/due',
      'components/sections',
      'components/stats',
      'components/list',
      'components/entry-form',
      'components/item-form',
      'components/export',
      'main',
    ];
    for (const name of scripts) {
      const uri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, 'media', `${name}.js`),
      );
      html = html.replace(`__SCRIPT_URI_${name.toUpperCase()}__`, uri.toString());
    }
    return html;
  }
}
