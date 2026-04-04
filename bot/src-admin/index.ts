import { loadAdminEnv } from './adminEnv.js';
import { AdminDataService } from './adminDataService.js';
import { createAdminContext } from './createAdminContext.js';
import { createServer } from './createServer.js';
import { MaintenanceService } from './maintenanceService.js';
import { RuntimeManager } from './runtimeManager.js';

const env = loadAdminEnv();
const context = createAdminContext(env.appEnv);
const dataService = new AdminDataService(context);
const runtimeManager = new RuntimeManager(context.logger);
const maintenanceService = new MaintenanceService(context.logger);
const server = createServer({
  env,
  context,
  dataService,
  runtimeManager,
  maintenanceService
});

const httpServer = server.listen(env.port, env.host, () => {
  context.logger.info('API admin demarree.', {
    host: env.host,
    port: env.port
  });
});

const shutdown = (): void => {
  context.logger.info("Arret de l'API admin.");
  httpServer.close(() => {
    context.database.close();
    process.exit(0);
  });
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
