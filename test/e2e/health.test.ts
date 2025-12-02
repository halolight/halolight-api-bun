import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { Hono } from 'hono';
import { apiRoutes } from '../../src/routes';

describe('Health Check E2E', () => {
  const app = new Hono();
  app.route('/api', apiRoutes);

  it('GET /api/health should return healthy status', async () => {
    const res = await app.request('/api/health');

    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('healthy');
    expect(json.data.timestamp).toBeDefined();
    expect(json.data.uptime).toBeDefined();
  });
});
