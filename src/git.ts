import * as vscode from 'vscode';

export function workspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function rootUri(): vscode.Uri | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri;
}

async function gitDir(root: vscode.Uri): Promise<vscode.Uri | undefined> {
  const dotGit = vscode.Uri.joinPath(root, '.git');
  try {
    const stat = await vscode.workspace.fs.stat(dotGit);
    if (stat.type === vscode.FileType.Directory) {
      return dotGit;
    }
    if (stat.type === vscode.FileType.File) {
      const content = (await vscode.workspace.fs.readFile(dotGit)).toString();
      const match = content.match(/^gitdir:\s*(.+)$/m);
      if (match) {
        const target = match[1].trim();
        if (target.startsWith('/')) {
          return root.with({ path: target });
        }
        return vscode.Uri.joinPath(root, target);
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

async function readText(uri: vscode.Uri): Promise<string | undefined> {
  try {
    return (await vscode.workspace.fs.readFile(uri)).toString();
  } catch {
    return undefined;
  }
}

async function collectBranches(dir: vscode.Uri, prefix: string, out: Set<string>): Promise<void> {
  let entries;
  try {
    entries = await vscode.workspace.fs.readDirectory(dir);
  } catch {
    return;
  }
  for (const [name, type] of entries) {
    const full = prefix ? prefix + '/' + name : name;
    if (type & vscode.FileType.Directory) {
      await collectBranches(vscode.Uri.joinPath(dir, name), full, out);
    } else {
      out.add(full);
    }
  }
}

export async function currentBranch(): Promise<string | null> {
  const root = rootUri();
  if (!root) {
    return null;
  }
  const dir = await gitDir(root);
  if (!dir) {
    return null;
  }
  const head = await readText(vscode.Uri.joinPath(dir, 'HEAD'));
  if (!head) {
    return null;
  }
  const match = head.match(/^ref:\s*refs\/heads\/(.+)$/);
  return match ? match[1].trim() : null;
}

export async function listBranches(): Promise<string[]> {
  const root = rootUri();
  if (!root) {
    return [];
  }
  const dir = await gitDir(root);
  if (!dir) {
    return [];
  }

  const names = new Set<string>();
  await collectBranches(vscode.Uri.joinPath(dir, 'refs', 'heads'), '', names);

  const packed = await readText(vscode.Uri.joinPath(dir, 'packed-refs'));
  if (packed) {
    for (const line of packed.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      const ref = trimmed.split(/\s+/).pop() ?? '';
      const match = ref.match(/^refs\/heads\/(.+)$/);
      if (match) {
        names.add(match[1]);
      }
    }
  }

  return Array.from(names).sort();
}
