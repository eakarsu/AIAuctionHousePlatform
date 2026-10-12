const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createAIWorkspaceRouter, validateFields, FIELD_KEYS } = require('../aiWorkspace.cjs');

const feature = { id: 'auction-readiness', title: 'Auction readiness', description: 'Review an auction plan.' };
const completeFields = Object.fromEntries(FIELD_KEYS.map((key) => [key, `${key} example`]));

function memoryPool() {
  const rows = [];
  let nextId = 1;
  return {
    rows,
    async query(text, values = []) {
      if (/^CREATE TABLE/i.test(text.trim())) return { rows: [] };
      if (/^SELECT \* FROM ai_workspace_runs/i.test(text.trim())) {
        return { rows: rows.filter((row) => row.user_id === String(values[0]) && row.feature === values[1]) };
      }
      if (/^SELECT id FROM ai_workspace_runs/i.test(text.trim())) {
        return { rows: rows.filter((row) => String(row.id) === String(values[0]) && row.user_id === String(values[1]) && row.feature === values[2]).map(({ id }) => ({ id })) };
      }
      if (/^INSERT INTO ai_workspace_runs/i.test(text.trim())) {
        const row = {
          id: nextId++, user_id: String(values[0]), feature: values[1], input: values[2], result: values[3],
          result_json: values[4], model: values[5], usage: values[6], created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        };
        rows.push(row);
        return { rows: [row] };
      }
      if (/^UPDATE ai_workspace_runs/i.test(text.trim())) {
        const row = rows.find((item) => String(item.id) === String(values[7]) && item.user_id === String(values[0]) && item.feature === values[1]);
        if (!row) return { rows: [] };
        Object.assign(row, { input: values[2], result: values[3], result_json: values[4], model: values[5], usage: values[6], updated_at: new Date().toISOString() });
        return { rows: [row] };
      }
      if (/^DELETE FROM ai_workspace_runs/i.test(text.trim())) {
        const index = rows.findIndex((row) => String(row.id) === String(values[0]) && row.user_id === String(values[1]));
        if (index < 0) return { rows: [] };
        return { rows: [{ id: rows.splice(index, 1)[0].id }] };
      }
      throw new Error(`Unexpected test query: ${text}`);
    },
  };
}

async function startWorkspace({ pool = memoryPool(), fetchImpl } = {}) {
  const app = express();
  app.use(express.json());
  app.use('/api/report-workspace', createAIWorkspaceRouter({
    pool,
    features: [feature],
    authenticateToken: (req, _res, next) => { req.user = { id: req.headers['x-test-user'] || 'actor-1' }; next(); },
    aiRateLimiter: (_req, _res, next) => next(),
    fetchImpl,
    env: { OPENROUTER_API_KEY: 'unit-key', OPENROUTER_MODEL: 'unit-model' },
  }));
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  return { pool, server, url: `http://127.0.0.1:${server.address().port}/api/report-workspace` };
}

function close(server) {
  return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

test('validates required fields while retaining every supported optional field', () => {
  assert.deepEqual(validateFields(completeFields), completeFields);
  assert.throws(() => validateFields({ input: 'brief' }), /desired outcome/i);
  assert.throws(() => validateFields({ ...completeFields, unexpected: 'no' }), /invalid/i);
});

test('generates, persists, lists, isolates, and deletes readable OpenRouter reports', async (t) => {
  const providerCalls = [];
  const runtime = await startWorkspace({ fetchImpl: async (url, options) => {
    providerCalls.push({ url, options, body: JSON.parse(options.body) });
    return { ok: true, status: 200, json: async () => ({ model: 'unit-model-receipt', usage: { total_tokens: 42 }, choices: [{ message: { content: '# Summary\n\n- Review reserve assumptions\n- Confirm bidder verification' } }] }) };
  } });
  t.after(() => close(runtime.server));

  const generated = await fetch(`${runtime.url}/run`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-test-user': 'actor-1' },
    body: JSON.stringify({ feature: feature.id, fields: completeFields }),
  });
  assert.equal(generated.status, 200);
  const saved = (await generated.json()).item;
  assert.match(saved.result, /# Summary/);
  assert.equal(saved.model, 'unit-model-receipt');
  assert.equal(providerCalls.length, 1);
  assert.equal(providerCalls[0].url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.deepEqual(Object.keys(saved.input).sort(), [...FIELD_KEYS].sort());

  const ownHistory = await fetch(`${runtime.url}/runs?feature=${feature.id}`, { headers: { 'x-test-user': 'actor-1' } });
  assert.equal(ownHistory.status, 200);
  assert.equal((await ownHistory.json()).items.length, 1);
  const otherHistory = await fetch(`${runtime.url}/runs?feature=${feature.id}`, { headers: { 'x-test-user': 'actor-2' } });
  assert.equal((await otherHistory.json()).items.length, 0);

  const deleted = await fetch(`${runtime.url}/runs/${saved.id}`, { method: 'DELETE', headers: { 'x-test-user': 'actor-1' } });
  assert.equal(deleted.status, 200);
  assert.equal(runtime.pool.rows.length, 0);
});

test('aborts an in-flight provider request without persisting a report', async (t) => {
  let providerStarted;
  const started = new Promise((resolve) => { providerStarted = resolve; });
  let providerAborted = false;
  const runtime = await startWorkspace({ fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
    providerStarted();
    options.signal.addEventListener('abort', () => {
      providerAborted = true;
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    }, { once: true });
  }) });
  t.after(() => close(runtime.server));

  const controller = new AbortController();
  const request = fetch(`${runtime.url}/run`, {
    method: 'POST', signal: controller.signal, headers: { 'content-type': 'application/json', 'x-test-user': 'actor-1' },
    body: JSON.stringify({ feature: feature.id, fields: completeFields }),
  });
  await started;
  controller.abort();
  await assert.rejects(request, (error) => error.name === 'AbortError');
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(providerAborted, true);
  assert.equal(runtime.pool.rows.length, 0);
});
