const fetch = require('node-fetch');
const { parseAIJson } = require('./parseAIJson');
const { pool } = require('./db');

const DEFAULT_MODEL = 'anthropic/claude-3-5-sonnet-20241022';

function sanitizeForPrompt(value, maxLen = 8000) {
  if (value == null) return '';
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  const cleaned = s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) + '...[truncated]' : cleaned;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callAI(systemPrompt, userPrompt, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = options.model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const retries = options.retries != null ? options.retries : 2;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const safeUser = sanitizeForPrompt(userPrompt);
  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:4000',
          'X-Title': 'AI Auction House Platform',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: safeUser },
          ],
          temperature: options.temperature != null ? options.temperature : 0.7,
        }),
      });

      if (!response.ok) {
        // Retry on transient (5xx or 429); fail fast on 4xx.
        if ((response.status === 429 || response.status >= 500) && attempt < retries) {
          await sleep(500 * Math.pow(2, attempt));
          continue;
        }
        const errorBody = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = parseAIJson(content);
      return parsed.ok ? parsed.data : (content || '');
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr;
}

/**
 * Persist an AI result to the ai_results table (JSONB result column).
 * Best-effort — never throws, returns null on failure.
 */
async function persistAIResult({ feature, user_id, entity_type, entity_id, prompt_summary, result, model }) {
  try {
    const insert = await pool.query(
      `INSERT INTO ai_results (feature, user_id, entity_type, entity_id, prompt_summary, result, model)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
      [
        feature,
        user_id || null,
        entity_type || null,
        entity_id || null,
        prompt_summary || null,
        JSON.stringify(result || {}),
        model || DEFAULT_MODEL,
      ]
    );
    return insert.rows[0];
  } catch (err) {
    // Table may not exist yet on first run; log and continue.
    console.warn('[ai_results] persist skipped:', err.message);
    return null;
  }
}

module.exports = { callAI, persistAIResult, DEFAULT_MODEL };
