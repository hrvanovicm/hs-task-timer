import { execFile } from 'child_process';
import * as vscode from 'vscode';

export function workspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export function currentBranch(cwd: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd }, (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }
      const branch = stdout.trim();
      resolve(branch && branch !== 'HEAD' ? branch : null);
    });
  });
}

export function listBranches(cwd: string): Promise<string[]> {
  return new Promise((resolve) => {
    execFile('git', ['branch', '--format=%(refname:short)'], { cwd }, (error, stdout) => {
      if (error) {
        resolve([]);
        return;
      }
      resolve(
        stdout
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      );
    });
  });
}
