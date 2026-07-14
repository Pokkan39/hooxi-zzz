'use strict';
const crypto = require('crypto');

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

function loadAccounts(json) {
  if (!json) throw new Error('Missing EDITOR_ACCOUNTS_JSON');

  let source;
  try {
    source = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON in EDITOR_ACCOUNTS_JSON');
  }

  if (!Array.isArray(source)) throw new Error('EDITOR_ACCOUNTS_JSON must be an array');
  if (source.length !== 3) throw new Error('EDITOR_ACCOUNTS_JSON must contain exactly 3 accounts');

  const ids = new Set();
  let adminCount = 0;
  let editorCount = 0;
  const accounts = source.map((account, index) => {
    if (!account || typeof account !== 'object' || Array.isArray(account)) {
      throw new Error(`Account at index ${index} must be an object`);
    }

    const id = typeof account.id === 'string' ? account.id.trim() : '';
    const name = typeof account.name === 'string' ? account.name.trim() : '';
    const password = typeof account.password === 'string' ? account.password : '';
    const role = account.role;

    if (!id) throw new Error(`Account at index ${index} missing or invalid id`);
    if (!name) throw new Error(`Account at index ${index} missing or invalid name`);
    if (!password) throw new Error(`Account at index ${index} missing or invalid password`);
    if (role !== 'admin' && role !== 'editor') {
      throw new Error(`Account at index ${index} must have role 'admin' or 'editor'`);
    }
    if (ids.has(id)) throw new Error(`Duplicate account id: ${id}`);

    ids.add(id);
    if (role === 'admin') adminCount += 1;
    else editorCount += 1;

    const salt = crypto.randomBytes(16);
    return {
      id,
      name,
      role,
      salt,
      hash: crypto.scryptSync(password, salt, 64)
    };
  });

  if (adminCount !== 1) throw new Error('EDITOR_ACCOUNTS_JSON must contain exactly 1 admin');
  if (editorCount !== 2) throw new Error('EDITOR_ACCOUNTS_JSON must contain exactly 2 editors');
  return accounts;
}

function createAccountService(initialAccounts, options = {}) {
  let accounts = initialAccounts;
  const attempts = new Map();
  const clock = options.clock || Date.now;

  function prune(now) {
    for (const [key, values] of attempts) {
      const recent = values.filter(time => now - time < ATTEMPT_WINDOW_MS);
      if (recent.length) attempts.set(key, recent);
      else attempts.delete(key);
    }
  }

  function verify(account, password) {
    if (!account || typeof password !== 'string') return false;
    const candidate = crypto.scryptSync(password, account.salt, account.hash.length);
    return candidate.length === account.hash.length && crypto.timingSafeEqual(candidate, account.hash);
  }

  function authenticate(ip, id, password, customClock) {
    const now = (customClock || clock)();
    prune(now);
    const key = `${ip}:${id}`;
    const recent = attempts.get(key) || [];
    if (recent.length >= MAX_FAILED_ATTEMPTS) {
      const error = new Error('rate_limited');
      error.code = 'RATE_LIMITED';
      throw error;
    }

    const account = accounts.find(item => item.id === id);
    if (!verify(account, password)) {
      recent.push(now);
      attempts.set(key, recent);
      return null;
    }

    attempts.delete(key);
    return { id: account.id, name: account.name, role: account.role };
  }

  return {
    authenticate,
    setAccounts(value) { accounts = value; },
    getAccounts() { return accounts; },
    clearAttempts() { attempts.clear(); },
    attempts
  };
}

let initialAccounts = [];
if (process.env.EDITOR_ACCOUNTS_JSON) initialAccounts = loadAccounts(process.env.EDITOR_ACCOUNTS_JSON);
const service = createAccountService(initialAccounts);

function hasRole(session, requiredRole) {
  if (!session) return false;
  if (requiredRole === 'admin') return session.role === 'admin';
  if (requiredRole === 'editor') return session.role === 'admin' || session.role === 'editor';
  return false;
}

module.exports = {
  ATTEMPT_WINDOW_MS,
  MAX_FAILED_ATTEMPTS,
  loadAccounts,
  createAccountService,
  login: service.authenticate,
  setAccounts: service.setAccounts,
  getAccounts: service.getAccounts,
  clearAttempts: service.clearAttempts,
  loginAttempts: service.attempts,
  hasRole,
  checkAdmin(session) { return hasRole(session, 'admin'); }
};
