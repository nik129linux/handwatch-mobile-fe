'use strict';

// Shared Ollama client for the nursing prototype backend.
// Zero dependencies. Every function accepts an injected fetchImpl so tests
// can mock the network without touching globals.

const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';
const OLLAMA_TIMEOUT_MS = 8000;

function baseUrl() {
  return process.env.OLLAMA_URL || DEFAULT_BASE_URL;
}

function createClient(options) {
  const opts = options || {};
  return {
    baseUrl: opts.baseUrl || baseUrl(),
    timeoutMs: opts.timeoutMs || OLLAMA_TIMEOUT_MS,
    fetchImpl: opts.fetchImpl || fetch
  };
}

// Runs fetchImpl with an 8s abort timeout. Any failure (network, timeout,
// non-2xx, bad JSON) is thrown so callers fall back to deterministic rules.
async function fetchJson(client, path, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), client.timeoutMs);
  try {
    const response = await client.fetchImpl(client.baseUrl + path, {
      method: (options && options.method) || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: options && options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
    if (!response || !response.ok) {
      throw new Error('ollama http ' + (response ? response.status : 'no-response'));
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function listModels(client) {
  const data = await fetchJson(client, '/api/tags');
  if (!data || !Array.isArray(data.models)) throw new Error('ollama bad tags');
  return data.models;
}

// Model policy: OLLAMA_MODEL env wins, otherwise a gemma model (cloud-tagged
// gemma4:31b-cloud is fine). Never auto-pick another local model: a big local
// one can freeze the PC. No gemma = null = rules.
function pickModel(models) {
  if (!Array.isArray(models)) return null;
  const want = process.env.OLLAMA_MODEL;
  const hit = models.find((m) => m && m.name && (want ? m.name === want : /^gemma/i.test(m.name)));
  return hit ? hit.name : null;
}

async function activeModel(client) {
  const models = await listModels(client);
  return pickModel(models);
}

// POST /api/generate with format json and stream false. The model must
// return {"response": "<json string>"}; the inner string is parsed here so
// malformed model JSON throws and the caller falls back to rules.
// Leading ```json fences are stripped; anything else unparseable throws.
function cleanModelJson(raw) {
  const trimmed = String(raw || '').trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

async function generateJson(client, model, prompt) {
  const data = await fetchJson(client, '/api/generate', {
    method: 'POST',
    body: { model, prompt, format: 'json', stream: false }
  });
  if (!data || typeof data.response !== 'string') throw new Error('ollama bad generate');
  return JSON.parse(cleanModelJson(data.response));
}

module.exports = {
  OLLAMA_TIMEOUT_MS,
  DEFAULT_BASE_URL,
  baseUrl,
  createClient,
  fetchJson,
  listModels,
  pickModel,
  activeModel,
  generateJson
};
