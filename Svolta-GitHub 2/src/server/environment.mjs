import { AsyncLocalStorage } from 'node:async_hooks';

// The Worker supplies its bindings per request. Next.js on Vercel uses env vars.
const storage = new AsyncLocalStorage();
export const runWithOrderEnvironment = (env, callback) => storage.run(env, callback);
export const orderEnvironment = () => storage.getStore() ?? process.env;
