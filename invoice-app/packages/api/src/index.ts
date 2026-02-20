import { serve } from '@hono/node-server';
import { createDb } from './db/index';
import { createApp } from './app';

const { db } = createDb('./data/app.db');
const app = createApp(db);

const port = 3004;
console.log(`API server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });

export { app };
export type AppType = typeof app;
