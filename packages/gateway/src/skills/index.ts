import { readFile, readdir, writeFile, mkdir, unlink } from 'fs/promises';
import { resolve, join } from 'path';
import { generateId, parseSkillMd, timestamp } from '@clawfree/shared';
import type { Skill } from '@clawfree/shared';
import { getConfig } from '../config/index.js';

export class SkillLoader {
  private skills: Skill[] = [];
  private loaded = false;

  private get skillsDir(): string {
    return resolve(getConfig().workspace.dir, 'skills');
  }

  async load(): Promise<void> {
    if (this.loaded) return;

    try {
      await mkdir(this.skillsDir, { recursive: true });
      const files = await readdir(this.skillsDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));

      for (const file of mdFiles) {
        try {
          const content = await readFile(join(this.skillsDir, file), 'utf-8');
          const parsed = parseSkillMd(content);
          this.skills.push({
            id: generateId(),
            name: parsed.name,
            description: parsed.description,
            version: parsed.version,
            author: parsed.author,
            triggers: parsed.triggers,
            instructions: parsed.instructions,
            tools: parsed.tools,
            installedAt: timestamp(),
          });
        } catch {
          // Skip invalid skill files
        }
      }
    } catch {
      // Skills directory doesn't exist yet
    }

    this.loaded = true;
  }

  getActiveSkills(): Skill[] {
    return [...this.skills];
  }

  findSkillByTrigger(message: string): Skill | undefined {
    const msgLower = message.toLowerCase();
    return this.skills.find(skill =>
      skill.triggers.some(trigger =>
        msgLower.includes(trigger.toLowerCase())
      )
    );
  }

  async install(content: string, sourceUrl?: string): Promise<Skill> {
    await this.load();

    const parsed = parseSkillMd(content);
    const skill: Skill = {
      id: generateId(),
      name: parsed.name,
      description: parsed.description,
      version: parsed.version,
      author: parsed.author,
      triggers: parsed.triggers,
      instructions: parsed.instructions,
      tools: parsed.tools,
      sourceUrl,
      installedAt: timestamp(),
    };

    // Remove existing skill with same name
    this.skills = this.skills.filter(s => s.name !== skill.name);
    this.skills.push(skill);

    // Save to disk
    await mkdir(this.skillsDir, { recursive: true });
    const filename = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
    await writeFile(join(this.skillsDir, filename), content, 'utf-8');

    return skill;
  }

  async installFromUrl(url: string): Promise<Skill> {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Failed to fetch skill: ${response.status}`);
    const content = await response.text();
    return this.install(content, url);
  }

  async remove(name: string): Promise<boolean> {
    const idx = this.skills.findIndex(s => s.name === name);
    if (idx === -1) return false;

    this.skills.splice(idx, 1);

    const filename = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
    try {
      await unlink(join(this.skillsDir, filename));
    } catch {
      // File might not exist
    }

    return true;
  }

  list(): Skill[] {
    return [...this.skills];
  }
}
