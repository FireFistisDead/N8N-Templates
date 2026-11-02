'use strict';

const TOKEN = /[A-Za-z0-9_]+/g;
const QUOTED = /"([^"]*)"/g;

/**
 * Build a safe FTS5 MATCH expression. Raw user input must never reach MATCH:
 * quotes, hyphens and colons are FTS operators and raise syntax errors.
 */
function buildMatchQuery(raw) {
  if (!raw || !String(raw).trim()) return null;

  const text = String(raw);
  const parts = [];

  for (const phrase of text.match(QUOTED) || []) {
    const tokens = phrase.slice(1, -1).match(TOKEN) || [];
    if (tokens.length) parts.push(`"${tokens.join(' ')}"`);
  }

  const withoutPhrases = text.replace(QUOTED, ' ');
  for (const token of withoutPhrases.match(TOKEN) || []) {
    parts.push(token.length >= 2 ? `${token}*` : token);
  }

  return parts.length ? parts.join(' AND ') : null;
}

module.exports = { buildMatchQuery };
