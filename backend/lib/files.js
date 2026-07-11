'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Only these filenames may be read or written via the API.
const ALLOWED_FILES = new Set(['data.js', 'layout-data.js']);

/**
 * Compute SHA-256 hex of a buffer or string.
 */
function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Resolve and validate a filename against the whitelist.
 * Returns the absolute path, or throws on invalid input.
 */
function resolveAllowed(siteRoot, filename) {
  if (!ALLOWED_FILES.has(filename)) {
    const err = new Error(`File not allowed: ${filename}`);
    err.code = 'NOT_ALLOWED';
    throw err;
  }
  // Guard against path traversal (filename is already a basename from the Set check)
  const abs = path.resolve(siteRoot, filename);
  if (path.basename(abs) !== filename) {
    const err = new Error('Invalid filename');
    err.code = 'NOT_ALLOWED';
    throw err;
  }
  return abs;
}

/**
 * Read a whitelisted file.
 * Returns { content: string, sha: string } or throws.
 * Throws with code NOT_FOUND if file does not exist.
 */
function readAllowed(siteRoot, filename) {
  const abs = resolveAllowed(siteRoot, filename);
  let content;
  try {
    content = fs.readFileSync(abs, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      const err = new Error(`File not found: ${filename}`);
      err.code = 'NOT_FOUND';
      throw err;
    }
    throw e;
  }
  return { content, sha: sha256(content) };
}

/**
 * Write a whitelisted file, only if the expectedSha matches current file SHA.
 * Throws with code CONFLICT on SHA mismatch.
 * Throws with code NOT_FOUND if the file does not yet exist (we do not create new root files).
 */
function writeAllowed(siteRoot, filename, content, expectedSha) {
  const abs = resolveAllowed(siteRoot, filename);

  // File must already exist — we do not create new root files via API.
  if (!fs.existsSync(abs)) {
    const err = new Error(`File does not exist (will not create): ${filename}`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  const current = fs.readFileSync(abs, 'utf8');
  const currentSha = sha256(current);
  if (currentSha !== expectedSha) {
    const err = new Error('SHA conflict: file has been modified since last read');
    err.code = 'CONFLICT';
    err.currentSha = currentSha;
    throw err;
  }

  fs.writeFileSync(abs, content, 'utf8');
}

module.exports = { ALLOWED_FILES, sha256, readAllowed, writeAllowed };
