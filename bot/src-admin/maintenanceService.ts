import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import type { Logger } from '../src/core/logger.js';
import { resolveProjectPath } from '../src/utils/assets.js';
import { nowIso } from '../src/utils/time.js';
import type { MaintenanceTask } from './contracts.js';

const allowedActions = new Set([
  'db:init',
  'db:seed',
  'assets:sync',
  'catalog:generate',
  'deploy:commands'
]);

function getSpawnCommand(action: string): { command: string; args: string[] } {
  if (process.platform === 'win32') {
    return {
      command: 'cmd.exe',
      args: ['/d', '/s', '/c', `npm run ${action}`]
    };
  }

  return {
    command: 'sh',
    args: ['-lc', `npm run ${action}`]
  };
}

export class MaintenanceService {
  private readonly outputDirectory = resolveProjectPath('output', 'admin');

  private readonly tasksPath = resolve(this.outputDirectory, 'maintenance-tasks.json');

  private tasks: MaintenanceTask[];

  public constructor(private readonly logger: Logger) {
    mkdirSync(this.outputDirectory, { recursive: true });
    this.tasks = this.loadTasks().map((task) =>
      task.status === 'running'
        ? {
            ...task,
            status: 'failed',
            completedAt: nowIso(),
            logs: [...task.logs, '[admin-api] Tache marquee failed apres redemarrage de l API.']
          }
        : task
    );
    this.persist();
  }

  public listTasks(): MaintenanceTask[] {
    return [...this.tasks].sort((left, right) => right.startedAt.localeCompare(left.startedAt));
  }

  public runAction(action: string, triggeredBy: string): MaintenanceTask {
    if (!allowedActions.has(action)) {
      throw new Error(`Action de maintenance interdite : ${action}`);
    }

    const alreadyRunning = this.tasks.find((task) => task.name === action && task.status === 'running');

    if (alreadyRunning) {
      throw new Error(`Une tache ${action} est deja en cours.`);
    }

    const task: MaintenanceTask = {
      id: randomUUID(),
      name: action,
      status: 'running',
      startedAt: nowIso(),
      completedAt: null,
      logs: [`[admin-api] Lancement de ${action}`],
      triggeredBy
    };

    this.tasks.unshift(task);
    this.persist();

    const spawnCommand = getSpawnCommand(action);
    const child = spawn(spawnCommand.command, spawnCommand.args, {
      cwd: resolveProjectPath(),
      env: process.env,
      windowsHide: true
    });

    const pushLogs = (chunk: Buffer, stream: 'stdout' | 'stderr') => {
      const lines = chunk
        .toString('utf8')
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter(Boolean);

      if (lines.length === 0) {
        return;
      }

      const nextLogs = lines.map((line) => `[${stream}] ${line}`);
      this.updateTask(task.id, (current) => ({
        ...current,
        logs: [...current.logs, ...nextLogs].slice(-120)
      }));
    };

    child.stdout?.on('data', (chunk: Buffer) => {
      pushLogs(chunk, 'stdout');
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      pushLogs(chunk, 'stderr');
    });

    child.on('error', (error) => {
      this.logger.error('Echec lancement tache maintenance.', { action, error: error.message });
      this.updateTask(task.id, (current) => ({
        ...current,
        status: 'failed',
        completedAt: nowIso(),
        logs: [...current.logs, `[admin-api] ${error.message}`].slice(-120)
      }));
    });

    child.on('close', (code) => {
      this.updateTask(task.id, (current) => ({
        ...current,
        status: code === 0 ? 'completed' : 'failed',
        completedAt: nowIso(),
        logs: [...current.logs, `[admin-api] Tache terminee avec code ${code ?? -1}`].slice(-120)
      }));
    });

    return task;
  }

  private loadTasks(): MaintenanceTask[] {
    if (!existsSync(this.tasksPath)) {
      return [];
    }

    try {
      return JSON.parse(readFileSync(this.tasksPath, 'utf8')) as MaintenanceTask[];
    } catch (error) {
      this.logger.warn('Historique maintenance illisible, reset.', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  private updateTask(taskId: string, updater: (task: MaintenanceTask) => MaintenanceTask): void {
    this.tasks = this.tasks.map((task) => (task.id === taskId ? updater(task) : task));
    this.persist();
  }

  private persist(): void {
    writeFileSync(this.tasksPath, JSON.stringify(this.tasks.slice(0, 40), null, 2));
  }
}
