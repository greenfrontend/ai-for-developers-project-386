import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createDatabase } from './db/client.js';
import { DrizzleBookingRepository } from './repositories/drizzleBookingRepository.js';

const config = loadConfig();
const { client, db } = createDatabase(config.databaseUrl);
const app = await buildApp({
  enableResponseValidation: config.nodeEnv !== 'production',
  repository: new DrizzleBookingRepository(db),
});

app.addHook('onClose', async () => {
  await client.end();
});

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exitCode = 1;
}
