import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFile as execFileCallback, spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import type { Logger } from '../src/core/logger.js';
import { resolveProjectPath } from '../src/utils/assets.js';
import { nowIso } from '../src/utils/time.js';
import type { RuntimeStatus } from './contracts.js';

const execFile = promisify(execFileCallback);

interface RuntimeState {
  pid: number;
  lastStartedAt: string;
  command: string[];
  stdoutLogPath: string;
  stderrLogPath: string;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolveDelay) => {
    setTimeout(resolveDelay, milliseconds);
  });
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export class RuntimeManager {
  private readonly runtimeDirectory = resolveProjectPath('output', 'runtime');

  private readonly statePath = resolve(this.runtimeDirectory, 'bot-runtime-state.json');

  private readonly stdoutLogPath = resolve(this.runtimeDirectory, 'bot.stdout.log');

  private readonly stderrLogPath = resolve(this.runtimeDirectory, 'bot.stderr.log');

  public constructor(private readonly logger: Logger) {
    mkdirSync(this.runtimeDirectory, { recursive: true });
  }

  public async getStatus(): Promise<RuntimeStatus> {
    const state = this.readState();

    if (!state) {
      return {
        status: 'stopped',
        pid: null,
        uptime: null,
        lastStartedAt: null,
        memoryUsageMb: null
      };
    }

    if (!isProcessAlive(state.pid)) {
      this.logger.warn('Etat runtime stale detecte, nettoyage.', { pid: state.pid });
      this.clearState();

      return {
        status: 'stopped',
        pid: null,
        uptime: null,
        lastStartedAt: state.lastStartedAt,
        memoryUsageMb: null
      };
    }

    return {
      status: 'running',
      pid: state.pid,
      uptime: Math.max(0, Math.floor((Date.now() - Date.parse(state.lastStartedAt)) / 1000)),
      lastStartedAt: state.lastStartedAt,
      memoryUsageMb: await this.getMemoryUsageMb(state.pid)
    };
  }

  public async start(): Promise<RuntimeStatus> {
    const status = await this.getStatus();

    if (status.status === 'running') {
      return status;
    }

    const command = this.resolveLaunchCommand();
    const stdoutFd = openSync(this.stdoutLogPath, 'a');
    const stderrFd = openSync(this.stderrLogPath, 'a');
    const child = spawn(process.execPath, command, {
      cwd: resolveProjectPath(),
      detached: true,
      stdio: ['ignore', stdoutFd, stderrFd],
      windowsHide: true,
      env: process.env
    });

    child.unref();

    const state: RuntimeState = {
      pid: child.pid ?? 0,
      lastStartedAt: nowIso(),
      command,
      stdoutLogPath: this.stdoutLogPath,
      stderrLogPath: this.stderrLogPath
    };

    if (!state.pid) {
      throw new Error('Echec du demarrage du bot : PID introuvable.');
    }

    this.writeState(state);
    this.logger.info('Bot demarre via API admin.', { pid: state.pid });
    await delay(400);

    return this.getStatus();
  }

  public async stop(): Promise<RuntimeStatus> {
    const state = this.readState();

    if (!state) {
      return {
        status: 'stopped',
        pid: null,
        uptime: null,
        lastStartedAt: null,
        memoryUsageMb: null
      };
    }

    if (isProcessAlive(state.pid)) {
      await this.terminatePid(state.pid);
      await this.waitForExit(state.pid, 8000);
    }

    this.clearState();
    this.logger.info('Bot arrete via API admin.', { pid: state.pid });

    return {
      status: 'stopped',
      pid: null,
      uptime: null,
      lastStartedAt: state.lastStartedAt,
      memoryUsageMb: null
    };
  }

  public async restart(): Promise<RuntimeStatus> {
    await this.stop();
    await delay(500);
    return this.start();
  }

  private resolveLaunchCommand(): string[] {
    const distEntry = resolveProjectPath('dist', 'index.js');

    if (existsSync(distEntry)) {
      return [distEntry];
    }

    const tsxCli = resolveProjectPath('node_modules', 'tsx', 'dist', 'cli.mjs');

    if (!existsSync(tsxCli)) {
      throw new Error(
        `Impossible de demarrer le bot : ni dist/index.js ni ${tsxCli} n'existent.`
      );
    }

    return [tsxCli, 'src/index.ts'];
  }

  private readState(): RuntimeState | null {
    if (!existsSync(this.statePath)) {
      return null;
    }

    try {
      return JSON.parse(readFileSync(this.statePath, 'utf8')) as RuntimeState;
    } catch (error) {
      this.logger.warn('Etat runtime illisible, nettoyage.', {
        error: error instanceof Error ? error.message : String(error)
      });
      this.clearState();
      return null;
    }
  }

  private writeState(state: RuntimeState): void {
    writeFileSync(this.statePath, JSON.stringify(state, null, 2));
  }

  private clearState(): void {
    rmSync(this.statePath, { force: true });
  }

  private async terminatePid(pid: number): Promise<void> {
    if (process.platform === 'win32') {
      await execFile('taskkill', ['/PID', String(pid), '/T', '/F']);
      return;
    }

    process.kill(pid, 'SIGTERM');
  }

  private async waitForExit(pid: number, timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      if (!isProcessAlive(pid)) {
        return;
      }

      await delay(250);
    }
  }

  private async getMemoryUsageMb(pid: number): Promise<number | null> {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execFile('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH']);
        const cleaned = stdout.trim();

        if (!cleaned || cleaned.startsWith('INFO:')) {
          return null;
        }

        const parts = cleaned.replace(/^"|"$/g, '').split('","');
        const memoryRaw = parts[4];

        if (!memoryRaw) {
          return null;
        }

        const kilobytes = Number(memoryRaw.replace(/[^\d]/g, ''));
        return Number.isFinite(kilobytes) ? Math.round((kilobytes / 1024) * 10) / 10 : null;
      }

      const { stdout } = await execFile('ps', ['-o', 'rss=', '-p', String(pid)]);
      const kilobytes = Number(stdout.trim());
      return Number.isFinite(kilobytes) ? Math.round((kilobytes / 1024) * 10) / 10 : null;
    } catch {
      return null;
    }
  }
}
