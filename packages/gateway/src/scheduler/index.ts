import { Cron } from 'croner';
import { generateId, timestamp } from '@clawfree/shared';
import type { CronJob, CronExecution } from '@clawfree/shared';
import { AgentLoop } from '../agent/loop.js';

interface ScheduledJob {
  job: CronJob;
  cron: Cron;
}

export class Scheduler {
  private jobs = new Map<string, ScheduledJob>();
  private executions: CronExecution[] = [];
  private agentLoop: AgentLoop;

  constructor(agentLoop: AgentLoop) {
    this.agentLoop = agentLoop;
  }

  addJob(options: { name: string; schedule: string; prompt: string; userId?: string }): CronJob {
    const job: CronJob = {
      id: generateId(),
      userId: options.userId,
      name: options.name,
      schedule: options.schedule,
      prompt: options.prompt,
      status: 'active',
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };

    const cron = new Cron(options.schedule, async () => {
      await this.executeJob(job.id);
    });

    // Calculate next run
    const nextRun = cron.nextRun();
    if (nextRun) {
      job.nextRunAt = nextRun.toISOString();
    }

    this.jobs.set(job.id, { job, cron });
    return job;
  }

  private async executeJob(jobId: string): Promise<void> {
    const scheduled = this.jobs.get(jobId);
    if (!scheduled) return;

    const execution: CronExecution = {
      id: generateId(),
      cronJobId: jobId,
      status: 'running',
      startedAt: timestamp(),
    };
    this.executions.push(execution);

    const startTime = Date.now();

    try {
      const response = await this.agentLoop.processMessage(scheduled.job.prompt, {
        channel: 'api',
        userId: scheduled.job.userId,
      });

      execution.status = 'success';
      execution.output = response.content;
      execution.sessionId = response.sessionId;
    } catch (err) {
      execution.status = 'error';
      execution.error = err instanceof Error ? err.message : String(err);
    }

    execution.durationMs = Date.now() - startTime;
    execution.completedAt = timestamp();

    // Update job
    scheduled.job.lastRunAt = timestamp();
    const nextRun = scheduled.cron.nextRun();
    if (nextRun) {
      scheduled.job.nextRunAt = nextRun.toISOString();
    }
  }

  pauseJob(id: string): boolean {
    const scheduled = this.jobs.get(id);
    if (!scheduled) return false;
    scheduled.cron.stop();
    scheduled.job.status = 'paused';
    scheduled.job.updatedAt = timestamp();
    return true;
  }

  resumeJob(id: string): boolean {
    const scheduled = this.jobs.get(id);
    if (!scheduled) return false;
    scheduled.cron.resume();
    scheduled.job.status = 'active';
    scheduled.job.updatedAt = timestamp();
    return true;
  }

  removeJob(id: string): boolean {
    const scheduled = this.jobs.get(id);
    if (!scheduled) return false;
    scheduled.cron.stop();
    this.jobs.delete(id);
    return true;
  }

  getJob(id: string): CronJob | undefined {
    return this.jobs.get(id)?.job;
  }

  listJobs(): CronJob[] {
    return Array.from(this.jobs.values()).map(s => s.job);
  }

  getExecutions(jobId?: string, limit = 50): CronExecution[] {
    let execs = [...this.executions];
    if (jobId) {
      execs = execs.filter(e => e.cronJobId === jobId);
    }
    return execs.slice(-limit);
  }

  stopAll(): void {
    for (const scheduled of this.jobs.values()) {
      scheduled.cron.stop();
    }
  }
}
