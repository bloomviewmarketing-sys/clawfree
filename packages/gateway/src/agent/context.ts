import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { MemoryEntry, Skill } from '@clawfree/shared';
import { getConfig } from '../config/index.js';

export interface AgentContext {
  systemPrompt: string;
  recentHistory: Array<{ role: string; content: string }>;
  activeSkills: Skill[];
}

export async function buildContext(options: {
  soulMdPath?: string;
  memories?: MemoryEntry[];
  skills?: Skill[];
  history?: Array<{ role: string; content: string }>;
  maxHistoryMessages?: number;
}): Promise<AgentContext> {
  const config = getConfig();
  const soulMdPath = options.soulMdPath || resolve(config.workspace.dir, 'SOUL.md');

  let soulMd = 'You are a helpful AI assistant.';
  try {
    soulMd = await readFile(soulMdPath, 'utf-8');
  } catch {
    // Use default if SOUL.md doesn't exist
  }

  const parts: string[] = [soulMd];

  // Add pinned memories first, then relevant ones
  if (options.memories && options.memories.length > 0) {
    const pinnedMemories = options.memories.filter(m => m.pinned);
    const otherMemories = options.memories.filter(m => !m.pinned);

    if (pinnedMemories.length > 0) {
      parts.push('\n## Pinned Memories');
      for (const m of pinnedMemories) {
        parts.push(`- [${m.type}] ${m.content}`);
      }
    }

    if (otherMemories.length > 0) {
      parts.push('\n## Relevant Memories');
      for (const m of otherMemories) {
        parts.push(`- [${m.type}] ${m.content}`);
      }
    }
  }

  // Add active skills
  const activeSkills = options.skills || [];
  if (activeSkills.length > 0) {
    parts.push('\n## Available Skills');
    for (const skill of activeSkills) {
      parts.push(`### ${skill.name}`);
      parts.push(`Triggers: ${skill.triggers.join(', ')}`);
      parts.push(skill.instructions);
    }
  }

  const maxHistory = options.maxHistoryMessages || 20;
  const recentHistory = (options.history || []).slice(-maxHistory);

  return {
    systemPrompt: parts.join('\n'),
    recentHistory,
    activeSkills,
  };
}
