import { test, expect } from '@playwright/test';

test('dispatch endpoint requires auth', async ({ request }) => {
  const res = await request.post('/api/reminders/dispatch');
  expect(res.status()).toBe(401);
});

test('dispatch endpoint responds with stats when authorized', async ({ request }) => {
  const res = await request.post('/api/reminders/dispatch', {
    headers: { 'x-vercel-cron': '1' },
  });
  expect([200, 500]).toContain(res.status());
  const json = await res.json();
  expect(json).toHaveProperty('processed');
});
