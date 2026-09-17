import * as vscode from 'vscode';
import { COMMAND_IDS, DISPLAY_NAME } from './config';

export class StatusBar {
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.tooltip = DISPLAY_NAME;
    this.item.command = COMMAND_IDS.statusMenu;
    this.item.show();
  }

  update(label: string): void {
    this.item.text = label;
  }

  dispose(): void {
    this.item.dispose();
  }
}
