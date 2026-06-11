import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: new URL('../.env', import.meta.url) });

export type Config = {
  databaseUrl: string;
  host: string;
  nodeEnv: string;
  port: number;
};

export function loadConfig(): Config {
  const port = Number(process.env.PORT ?? 4010);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return {
    databaseUrl: process.env.DATABASE_URL ?? 'postgres://booking:booking@localhost:5432/booking',
    host: process.env.HOST ?? '0.0.0.0',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port,
  };
}
