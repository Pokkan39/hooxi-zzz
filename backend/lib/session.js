'use strict';
const crypto = require('crypto');

/**
 * Sign data with HMAC-SHA256.
 * Returns base64url string.
 */
function sign(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

/**
 * Create a signed session cookie value.
 * Format: base64url(JSON).<hmac>
 */
function createSession(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = sign(data, secret);
  return `${data}.${sig}`;
}

/**
 * Verify and decode a session cookie value.
 * Returns payload object or null on invalid/tampered.
 */
function readSession(cookieValue, secret) {
  if (!cookieValue || typeof cookieValue !== 'string') return null;
  const dot = cookieValue.lastIndexOf('.');
  if (dot < 1) return null;
  const data = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  const expected = sign(data, secret);
  // Constant-time comparison (both must be same length since same HMAC algo)
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch { return null; }
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch { return null; }
}

/**
 * Parse Cookie header into key→value map.
 */
function parseCookies(req) {
  const header = req.headers['cookie'] || '';
  return Object.fromEntries(
    header.split(';')
      .map(s => s.trim().split('='))
      .filter(p => p.length === 2)
      .map(([k, v]) => [k.trim(), decodeURIComponent(v.trim())])
  );
}

/**
 * Build a Set-Cookie header string.
 * opts: { maxAge, httpOnly, secure, sameSite, path }
 */
function buildSetCookie(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.httpOnly) parts.push('HttpOnly');
  if (opts.secure) parts.push('Secure');
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  return parts.join('; ');
}

module.exports = { createSession, readSession, parseCookies, buildSetCookie };
