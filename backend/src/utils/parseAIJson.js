/**
 * parseAIJson — 3-strategy resilient JSON parser for LLM outputs
 *
 * Strategy 1: Direct JSON.parse on the raw response.
 * Strategy 2: Extract JSON from a fenced code block (```json ... ``` or ``` ... ```).
 * Strategy 3: Locate the first balanced { ... } or [ ... ] block in the text and parse.
 *
 * Returns the parsed object, or `null` if all strategies fail.
 * Logs a warning on each strategy failure for observability.
 */

function tryParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractFromCodeFence(text) {
  if (!text || typeof text !== 'string') return null;
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (!fenceMatch) return null;
  return tryParse(fenceMatch[1]);
}

function extractBalancedBlock(text) {
  if (!text || typeof text !== 'string') return null;
  const openers = ['{', '['];
  for (const opener of openers) {
    const closer = opener === '{' ? '}' : ']';
    const start = text.indexOf(opener);
    if (start === -1) continue;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === opener) depth++;
      else if (ch === closer) {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(start, i + 1);
          const parsed = tryParse(candidate);
          if (parsed !== null) return parsed;
          break;
        }
      }
    }
  }
  return null;
}

function parseAIJson(rawText, { fallback = null, logger = console } = {}) {
  if (rawText == null) return fallback;
  const text = typeof rawText === 'string' ? rawText : String(rawText);

  // Strategy 1: direct parse
  const direct = tryParse(text);
  if (direct !== null) return direct;
  if (logger && logger.warn) logger.warn('[parseAIJson] strategy 1 (direct parse) failed');

  // Strategy 2: code fence extraction
  const fenced = extractFromCodeFence(text);
  if (fenced !== null) return fenced;
  if (logger && logger.warn) logger.warn('[parseAIJson] strategy 2 (code fence) failed');

  // Strategy 3: balanced block extraction
  const block = extractBalancedBlock(text);
  if (block !== null) return block;
  if (logger && logger.warn) logger.warn('[parseAIJson] strategy 3 (balanced block) failed');

  return fallback;
}

module.exports = { parseAIJson, tryParse, extractFromCodeFence, extractBalancedBlock };
