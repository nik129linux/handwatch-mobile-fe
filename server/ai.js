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

// Prefer a model without remote_host (fully local). Cloud-tagged models
// (e.g. gemma4:31b-cloud, which carries remote_host) ARE valid: when they
// are the only ones installed, the first model is used.
function pickModel(models) {
  if (!Array.isArray(models) || models.length === 0) return null;
  const local = models.find((m) => m && !m.remote_host);
  const chosen = local || models[0];
  return chosen && chosen.name ? chosen.name : null;
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
