// Root-level Vercel function entry — auto-discovered by Vercel at /api/*
// The actual app logic lives in apps/api/src/; this just wires in the Hono handler.
export { default, config } from '../apps/api/api/index';
