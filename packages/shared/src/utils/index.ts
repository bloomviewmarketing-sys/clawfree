import { randomUUID } from 'crypto';

export function generateId(): string {
  return randomUUID();
}

export function timestamp(): string {
  return new Date().toISOString();
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export function parseMarkdownFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    frontmatter[key] = value;
  }
  return { frontmatter, body: match[2].trim() };
}

export function parseSoulMd(content: string): {
  name: string;
  identity?: string;
  instructions: string;
  personality?: string;
  constraints: string[];
  tools: string[];
} {
  const { frontmatter, body } = parseMarkdownFrontmatter(content);

  const sections: Record<string, string> = {};
  let currentSection = 'instructions';
  const lines = body.split('\n');

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)/);
    if (headerMatch) {
      currentSection = headerMatch[1].toLowerCase().trim();
      sections[currentSection] = '';
    } else {
      sections[currentSection] = (sections[currentSection] || '') + line + '\n';
    }
  }

  const parseList = (text?: string): string[] => {
    if (!text) return [];
    return text.split('\n')
      .map(l => l.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
  };

  return {
    name: frontmatter.name || 'Agent',
    identity: sections.identity?.trim(),
    instructions: sections.instructions?.trim() || body,
    personality: sections.personality?.trim(),
    constraints: parseList(sections.constraints),
    tools: parseList(sections.tools),
  };
}

export function parseSkillMd(content: string): {
  name: string;
  description: string;
  version: string;
  author: string;
  triggers: string[];
  instructions: string;
  tools: string[];
} {
  const { frontmatter, body } = parseMarkdownFrontmatter(content);

  const sections: Record<string, string> = {};
  let currentSection = 'instructions';
  const lines = body.split('\n');

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)/);
    if (headerMatch) {
      currentSection = headerMatch[1].toLowerCase().trim();
      sections[currentSection] = '';
    } else {
      sections[currentSection] = (sections[currentSection] || '') + line + '\n';
    }
  }

  const parseList = (text?: string): string[] => {
    if (!text) return [];
    return text.split('\n')
      .map(l => l.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
  };

  return {
    name: frontmatter.name || 'Unnamed Skill',
    description: frontmatter.description || sections.description?.trim() || '',
    version: frontmatter.version || '1.0.0',
    author: frontmatter.author || 'unknown',
    triggers: parseList(sections.triggers || frontmatter.triggers),
    instructions: sections.instructions?.trim() || body,
    tools: parseList(sections.tools),
  };
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}
