import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { resolve, relative, join } from 'path';
import { registerTool } from './registry.js';
import { getConfig } from '../config/index.js';

registerTool(
  {
    name: 'file_read',
    description: 'Read the contents of a file',
    parameters: {
      path: { type: 'string', description: 'Path to the file (relative to workspace)' },
    },
    requiresApproval: false,
    timeout: 10000,
  },
  async (args) => {
    const config = getConfig();
    const filePath = resolve(config.workspace.dir, args.path as string);
    return await readFile(filePath, 'utf-8');
  }
);

registerTool(
  {
    name: 'file_write',
    description: 'Write content to a file',
    parameters: {
      path: { type: 'string', description: 'Path to the file (relative to workspace)' },
      content: { type: 'string', description: 'Content to write' },
    },
    requiresApproval: true,
    timeout: 10000,
  },
  async (args) => {
    const config = getConfig();
    const filePath = resolve(config.workspace.dir, args.path as string);
    const dir = resolve(filePath, '..');
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, args.content as string, 'utf-8');
    return `File written: ${relative(config.workspace.dir, filePath)}`;
  }
);

registerTool(
  {
    name: 'file_list',
    description: 'List files and directories',
    parameters: {
      path: { type: 'string', description: 'Directory path (relative to workspace, default ".")' },
      recursive: { type: 'boolean', description: 'List recursively (default false)' },
    },
    requiresApproval: false,
    timeout: 10000,
  },
  async (args) => {
    const config = getConfig();
    const dirPath = resolve(config.workspace.dir, (args.path as string) || '.');

    async function listDir(dir: string, depth: number): Promise<string[]> {
      const entries = await readdir(dir, { withFileTypes: true });
      const results: string[] = [];

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = relative(config.workspace.dir, fullPath);

        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

        if (entry.isDirectory()) {
          results.push(`${relPath}/`);
          if (args.recursive && depth < 5) {
            results.push(...await listDir(fullPath, depth + 1));
          }
        } else {
          const fileStat = await stat(fullPath);
          const size = fileStat.size < 1024
            ? `${fileStat.size}B`
            : `${(fileStat.size / 1024).toFixed(1)}KB`;
          results.push(`${relPath} (${size})`);
        }
      }
      return results;
    }

    const files = await listDir(dirPath, 0);
    return files.join('\n') || '(empty directory)';
  }
);
