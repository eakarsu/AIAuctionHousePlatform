const test = require('node:test');
const assert = require('node:assert/strict');
const { requestAuctionOperationsReadiness } = require('../services/openrouterEvidence');

test('requires the canonical OpenRouter endpoint', async () => {
  const original = { base: process.env.OPENROUTER_BASE_URL, key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL };
  process.env.OPENROUTER_BASE_URL = 'https://example.test/api/v1'; process.env.OPENROUTER_API_KEY = 'unit-key'; process.env.OPENROUTER_MODEL = 'unit-model';
  await assert.rejects(() => requestAuctionOperationsReadiness('de-identified workflow'), /canonical OpenRouter endpoint/);
  process.env.OPENROUTER_BASE_URL = original.base; process.env.OPENROUTER_API_KEY = original.key; process.env.OPENROUTER_MODEL = original.model;
});

test('returns substantive provider evidence', async () => {
  const original = { base: process.env.OPENROUTER_BASE_URL, key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL };
  process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'; process.env.OPENROUTER_API_KEY = 'unit-key'; process.env.OPENROUTER_MODEL = 'unit-model';
  const evidence = await requestAuctionOperationsReadiness('de-identified workflow', async (url) => ({ ok: true, json: async () => ({ id: 'generation-unit', model: 'unit-model', choices: [{ message: { content: '{"controls":["retain lot provenance","authorize state changes","require human settlement review"]}' } }] }) }));
  assert.equal(evidence.providerReceipt.requestId, 'generation-unit'); assert.ok(evidence.result.length > 40);
  process.env.OPENROUTER_BASE_URL = original.base; process.env.OPENROUTER_API_KEY = original.key; process.env.OPENROUTER_MODEL = original.model;
});
