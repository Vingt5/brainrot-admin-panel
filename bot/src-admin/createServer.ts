import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';

import type { AppContext } from '../src/core/appContext.js';
import type { AdminEnv } from './adminEnv.js';
import { AdminDataService } from './adminDataService.js';
import { MaintenanceService } from './maintenanceService.js';
import { RuntimeManager } from './runtimeManager.js';

interface RequestWithAdmin extends Request {
  adminIdentity?: string;
}

export interface AdminServerDeps {
  env: AdminEnv;
  context: AppContext;
  dataService: AdminDataService;
  runtimeManager: RuntimeManager;
  maintenanceService: MaintenanceService;
}

function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void> | void
) {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

export function createServer(deps: AdminServerDeps) {
  const app = express();
  const { env, context, dataService, runtimeManager, maintenanceService } = deps;

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin non autorisee : ${origin}`));
      }
    })
  );
  app.use(express.json());

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true, service: 'brainrot-admin-api' });
  });

  app.use('/api/admin', (request: RequestWithAdmin, response, next) => {
    if (!env.apiToken) {
      request.adminIdentity = 'local-admin';
      next();
      return;
    }

    const expected = `Bearer ${env.apiToken}`;

    if (request.header('Authorization') !== expected) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    request.adminIdentity = 'token-admin';
    next();
  });

  app.get('/api/admin/dashboard/kpis', (_request, response) => {
    response.json(dataService.getDashboardKPIs());
  });

  app.get('/api/admin/dashboard/health', (_request, response) => {
    response.json(dataService.getDataHealth());
  });

  app.get(
    '/api/admin/runtime/status',
    asyncHandler(async (_request, response) => {
      response.json(await runtimeManager.getStatus());
    })
  );

  app.post(
    '/api/admin/runtime/start',
    asyncHandler(async (_request, response) => {
      response.json(await runtimeManager.start());
    })
  );

  app.post(
    '/api/admin/runtime/stop',
    asyncHandler(async (_request, response) => {
      response.json(await runtimeManager.stop());
    })
  );

  app.post(
    '/api/admin/runtime/restart',
    asyncHandler(async (_request, response) => {
      response.json(await runtimeManager.restart());
    })
  );

  app.get('/api/admin/players', (request, response) => {
    response.json(
      dataService.getPlayers({
        page: Number(request.query.page) || 1,
        search: typeof request.query.search === 'string' ? request.query.search : undefined
      })
    );
  });

  app.get('/api/admin/players/:id', (request, response) => {
    const player = dataService.getPlayerById(Number(request.params.id));

    if (!player) {
      response.status(404).json({ error: 'Player not found' });
      return;
    }

    response.json(player);
  });

  app.get('/api/admin/players/:id/stats', (request, response) => {
    const stats = dataService.getPlayerStats(Number(request.params.id));

    if (!stats) {
      response.status(404).json({ error: 'Player not found' });
      return;
    }

    response.json(stats);
  });

  app.get('/api/admin/players/:id/inventory', (request, response) => {
    const inventory = dataService.getPlayerInventory(Number(request.params.id));

    if (!inventory) {
      response.status(404).json({ error: 'Player not found' });
      return;
    }

    response.json(inventory);
  });

  app.get('/api/admin/brainrots', (request, response) => {
    response.json(
      dataService.getBrainrots({
        page: Number(request.query.page) || 1,
        search: typeof request.query.search === 'string' ? request.query.search : undefined,
        rarity: typeof request.query.rarity === 'string' ? request.query.rarity : undefined
      })
    );
  });

  app.get('/api/admin/brainrots/:id', (request, response) => {
    const brainrot = dataService.getBrainrotById(Number(request.params.id));

    if (!brainrot) {
      response.status(404).json({ error: 'Brainrot not found' });
      return;
    }

    response.json(brainrot);
  });

  app.get('/api/admin/guilds', (_request, response) => {
    response.json(dataService.getGuilds());
  });

  app.get('/api/admin/rolls', (request, response) => {
    response.json(
      dataService.getRolls({
        page: Number(request.query.page) || 1,
        status: typeof request.query.status === 'string' ? request.query.status : undefined
      })
    );
  });

  app.get('/api/admin/leaderboard/:guildId', (request, response) => {
    response.json(dataService.getLeaderboard(Number(request.params.guildId)));
  });

  app.get('/api/admin/maintenance/tasks', (_request, response) => {
    response.json(maintenanceService.listTasks());
  });

  app.post('/api/admin/maintenance/run', (request: RequestWithAdmin, response) => {
    const action = typeof request.body?.action === 'string' ? request.body.action : '';

    if (!action) {
      response.status(400).json({ error: 'Missing action' });
      return;
    }

    response.json(maintenanceService.runAction(action, request.adminIdentity ?? 'local-admin'));
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    context.logger.error('Erreur API admin.', { message });
    response.status(500).json({ error: message });
  });

  return app;
}
