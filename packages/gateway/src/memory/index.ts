import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { resolve, join } from 'path';
import { generateId, timestamp } from '@clawfree/shared';
import type { MemoryEntry } from '@clawfree/shared';
import { getConfig } from '../config/index.js';

export class MemoryManager {
  private entries: MemoryEntry[] = [];
  private loaded = false;

  private get memoryDir(): string {
    return getConfig().memory.dir;
  }

  private get indexPath(): string {
    return resolve(this.memoryDir, 'index.json');
  }

  async load(): Promise<void> {
    if (this.loaded) return;

    try {
      await mkdir(this.memoryDir, { recursive: true });
      const data = await readFile(this.indexPath, 'utf-8');
      this.entries = JSON.parse(data);
    } catch {
      this.entries = [];
    }
    this.loaded = true;
  }

  private async save(): Promise<void> {
    await mkdir(this.memoryDir, { recursive: true });
    await writeFile(this.indexPath, JSON.stringify(this.entries, null, 2), 'utf-8');
  }

  async add(content: string, options: Partial<MemoryEntry> = {}): Promise<MemoryEntry> {
    await this.load();

    const entry: MemoryEntry = {
      id: generateId(),
      type: options.type || 'fact',
      content,
      tags: options.tags || [],
      pinned: options.pinned || false,
      source: options.source || 'user',
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };

    this.entries.push(entry);
    await this.save();

    // Also save as markdown file for easy browsing
    const mdPath = resolve(this.memoryDir, `${entry.id}.md`);
    const mdContent = [
      '---',
      `type: ${entry.type}`,
      `tags: ${entry.tags.join(', ')}`,
      `pinned: ${entry.pinned}`,
      `created: ${entry.createdAt}`,
      '---',
      '',
      content,
    ].join('\n');
    await writeFile(mdPath, mdContent, 'utf-8');

    return entry;
  }

  async search(query: string, limit = 10): Promise<MemoryEntry[]> {
    await this.load();

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    // Simple keyword-based search (vector search would use embeddings)
    const scored = this.entries.map(entry => {
      const contentLower = entry.content.toLowerCase();
      let score = 0;

      // Exact phrase match
      if (contentLower.includes(queryLower)) score += 10;

      // Individual word matches
      for (const word of queryWords) {
        if (contentLower.includes(word)) score += 2;
      }

      // Tag matches
      for (const tag of entry.tags) {
        if (queryLower.includes(tag.toLowerCase())) score += 3;
      }

      // Pinned boost
      if (entry.pinned) score += 5;

      // Recency boost
      const ageMs = Date.now() - new Date(entry.createdAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays < 7) score += 2;
      if (ageDays < 1) score += 3;

      return { entry, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.entry);
  }

  async getAll(): Promise<MemoryEntry[]> {
    await this.load();
    return [...this.entries];
  }

  async get(id: string): Promise<MemoryEntry | undefined> {
    await this.load();
    return this.entries.find(e => e.id === id);
  }

  async update(id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null> {
    await this.load();
    const idx = this.entries.findIndex(e => e.id === id);
    if (idx === -1) return null;

    this.entries[idx] = {
      ...this.entries[idx],
      ...updates,
      id, // Can't change ID
      updatedAt: timestamp(),
    };

    await this.save();
    return this.entries[idx];
  }

  async delete(id: string): Promise<boolean> {
    await this.load();
    const before = this.entries.length;
    this.entries = this.entries.filter(e => e.id !== id);
    if (this.entries.length === before) return false;
    await this.save();
    return true;
  }

  async getPinned(): Promise<MemoryEntry[]> {
    await this.load();
    return this.entries.filter(e => e.pinned);
  }
}
