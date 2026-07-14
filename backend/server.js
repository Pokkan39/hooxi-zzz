'use strict';
const http = require('http');
const crypto = require('crypto');
const { createSession, readSession, parseCookies, buildSetCookie } = require('./lib/session');
const path = require('path');
const fs = require('fs');
const { login, checkAdmin } = require('./lib/accounts');
const { getContent: ghGetContent, putContent: ghPutContent, getRef, createBranch, listBranches } = require('./lib/github');
const { ALLOWED_FILES, readAllowed } = require('./lib/files');

const {
  SESSION_SECRET,
  COOKIE_NAME = 'hooxi_session',
  PORT = '3001',
  CORS_ORIGINS = '',
  NODE_ENV = 'development',
  SESSION_TTL_SECONDS = '43200',
  GITHUB_TOKEN = '',
  GITHUB_REPO_OWNER = '',
  GITHUB_REPO_NAME = '',
  SITE_ROOT = ''
} = process.env;

const origins = new Set(CORS_ORIGINS.split(',').map(x => x.trim()).filter(Boolean));
const prod = NODE_ENV === 'production';

// In-memory sessions store.
// Keys are random sid. Value is session data object.
const sessions = new Map();

const sessionDurationSeconds = Math.max(300, Number.parseInt(SESSION_TTL_SECONDS, 10) || 43200);

const cookieOpts = {
  httpOnly: true,
  secure: prod,
  sameSite: 'Lax',
  path: '/',
  maxAge: sessionDurationSeconds
};

function json(res, status, body) {
  const p = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(p)
  });
  res.end(p);
}

function cors(req, res) {
  const o = req.headers.origin || '';
  if (origins.has(o)) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
    res.setHeader('Vary', 'Origin');
  }
}

// Session lookup: decrypt cookie, then lookup in sessions Map.
function session(req, now = Date.now()) {
  const signed = readSession(parseCookies(req)[COOKIE_NAME], SESSION_SECRET, now);
  if (!signed) return null;
  const s = sessions.get(signed.sid);
  if (!s) return null;
  if (s.expires < now) {
    sessions.delete(signed.sid);
    return null;
  }
  return s;
}

async function body(req) {
  let s = '';
  for await (const c of req) {
    s += c;
    if (s.length > 2_000_000) {
      throw Object.assign(new Error('body_too_large'), { status: 413 });
    }
  }
  try {
    return JSON.parse(s);
  } catch (err) {
    throw Object.assign(new Error('invalid_json'), { status: 400 });
  }
}

// Helper to get remote IP
function getRemoteIP(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const parts = xff.split(',');
    return parts[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

async function router(req, res, clock = Date.now) {
  cors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const u = new URL(req.url, 'http://localhost');
  const p = u.pathname;

  const isWriteMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);

  if (isWriteMethod) {
    const origin = req.headers.origin;
    if (!origin) {
      if (prod) {
        return json(res, 403, { error: 'forbidden', message: 'Missing Origin header' });
      }
    } else {
      if (!origins.has(origin)) {
        return json(res, 403, { error: 'forbidden', message: 'Origin not allowed' });
      }
    }

    // CSRF Check for authenticated write operations before routing
    const s = session(req, clock());
    if (s) {
      const reqCsrf = req.headers['x-csrf-token'];
      if (!reqCsrf || typeof reqCsrf !== 'string') {
        return json(res, 403, { error: 'forbidden', message: 'Invalid or missing CSRF token' });
      }
      try {
        if (!crypto.timingSafeEqual(Buffer.from(reqCsrf), Buffer.from(s.csrfToken))) {
          return json(res, 403, { error: 'forbidden', message: 'Invalid or missing CSRF token' });
        }
      } catch (e) {
        return json(res, 403, { error: 'forbidden', message: 'Invalid or missing CSRF token' });
      }
    }
  }

  try {
    if (req.method === 'GET' && p === '/health') {
      return json(res, 200, { ok: true });
    }

    // POST /api/auth/login
    if (req.method === 'POST' && p === '/api/auth/login') {
      const b = await body(req);
      const { id, password } = b;
      if (typeof id !== 'string' || typeof password !== 'string') {
        return json(res, 400, { error: 'bad_request', message: 'Invalid payload' });
      }

      const ip = getRemoteIP(req);
      let user;
      try {
        user = login(ip, id, password, clock);
      } catch (err) {
        if (err.code === 'RATE_LIMITED') {
          return json(res, 429, { error: 'rate_limited', message: 'Too many attempts' });
        }
        throw err;
      }

      if (!user) {
        return json(res, 401, { error: 'invalid_credentials' });
      }

      const sid = crypto.randomBytes(32).toString('hex');
      const csrfToken = crypto.randomBytes(32).toString('hex');
      const now = clock();
      const expires = now + sessionDurationSeconds * 1000;

      sessions.set(sid, {
        id: user.id,
        name: user.name,
        role: user.role,
        csrfToken,
        expires
      });

      res.setHeader('Set-Cookie', buildSetCookie(COOKIE_NAME, createSession({ sid, expires }, SESSION_SECRET), cookieOpts));

      return json(res, 200, {
        id: user.id,
        name: user.name,
        role: user.role,
        csrfToken
      });
    }

    // GET /api/auth/session
    if (req.method === 'GET' && p === '/api/auth/session') {
      const s = session(req, clock());
      if (!s) {
        return json(res, 401, { authenticated: false });
      }
      return json(res, 200, {
        authenticated: true,
        id: s.id,
        name: s.name,
        role: s.role,
        csrfToken: s.csrfToken
      });
    }

    // POST /api/auth/logout
    if (req.method === 'POST' && p === '/api/auth/logout') {
      const activeSession = session(req, clock());
      if (!activeSession) return json(res, 401, { error: 'unauthenticated' });
      const signed = readSession(parseCookies(req)[COOKIE_NAME], SESSION_SECRET, clock());
      sessions.delete(signed.sid);
      res.setHeader('Set-Cookie', buildSetCookie(COOKIE_NAME, '', { ...cookieOpts, maxAge: 0 }));
      return json(res, 200, { ok: true });
    }

    // GET /api/content/:filename  — read data.js or layout-data.js
    const contentMatch = req.method === 'GET' && p.match(/^\/api\/content\/([a-zA-Z0-9_.-]+)$/);
    if (contentMatch) {
      const s = session(req, clock());
      if (!s) return json(res, 401, { error: 'unauthenticated' });
      const filename = contentMatch[1];
      if (!ALLOWED_FILES.has(filename)) {
        return json(res, 400, { error: 'bad_request', message: `File not allowed: ${filename}` });
      }
      if (GITHUB_TOKEN && GITHUB_REPO_OWNER && GITHUB_REPO_NAME) {
        try {
          const d = await ghGetContent(GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, filename, 'main');
          return json(res, 200, { filename: d.file, sha: d.sha, content: d.content });
        } catch (e) {
          if (e.status === 404) return json(res, 404, { error: 'not_found', message: `File not found: ${filename}` });
          throw e;
        }
      }
      try {
        const siteRoot = SITE_ROOT || path.resolve(__dirname, '..');
        const fileData = readAllowed(siteRoot, filename);
        return json(res, 200, { filename, sha: fileData.sha, content: fileData.content });
      } catch (e) {
        if (e.code === 'NOT_FOUND') return json(res, 404, { error: 'not_found', message: `File not found: ${filename}` });
        throw e;
      }
    }

    // POST /api/review/push  — editor pushes draft to review branch
    if (req.method === 'POST' && p === '/api/review/push') {
      const s = session(req, clock());
      if (!s) return json(res, 401, { error: 'unauthenticated' });
      if (s.role !== 'admin' && s.role !== 'editor') {
        return json(res, 403, { error: 'forbidden', message: 'Editor or admin role required' });
      }
      const b = await body(req);
      const { filename, content } = b;
      if (!ALLOWED_FILES.has(filename)) {
        return json(res, 400, { error: 'bad_request', message: `File not allowed: ${filename}` });
      }
      if (typeof content !== 'string') {
        return json(res, 400, { error: 'bad_request', message: 'content must be a string' });
      }
      if (!GITHUB_TOKEN) {
        return json(res, 503, { error: 'not_configured', message: 'GitHub integration not configured' });
      }
      const ts = Date.now();
      const branchName = `review/draft-${ts}`;
      const mainRef = await getRef(GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, 'main');
      await createBranch(GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, branchName, mainRef.sha);
      const result = await ghPutContent(GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, filename, branchName, content, null, s.name);
      return json(res, 200, { branch: branchName, filename, ...result });
    }

    // GET /api/review/list  — list review branches
    if (req.method === 'GET' && p === '/api/review/list') {
      const s = session(req, clock());
      if (!s) return json(res, 401, { error: 'unauthenticated' });
      if (!GITHUB_TOKEN) {
        return json(res, 200, { branches: [] });
      }
      try {
        const branches = await listBranches(GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, 'review/');
        return json(res, 200, { branches });
      } catch (e) {
        if (e.status === 404) return json(res, 200, { branches: [] });
        throw e;
      }
    }

    // GET /api/review/file  — read a file from a review branch
    if (req.method === 'GET' && p === '/api/review/file') {
      const s = session(req, clock());
      if (!s) return json(res, 401, { error: 'unauthenticated' });
      const branch = u.searchParams.get('branch');
      const filename = u.searchParams.get('file');
      if (!branch || !filename) {
        return json(res, 400, { error: 'bad_request', message: 'branch and file query params required' });
      }
      if (!ALLOWED_FILES.has(filename)) {
        return json(res, 400, { error: 'bad_request', message: `File not allowed: ${filename}` });
      }
      if (!GITHUB_TOKEN) {
        return json(res, 503, { error: 'not_configured', message: 'GitHub integration not configured' });
      }
      try {
        const d = await ghGetContent(GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, filename, branch);
        return json(res, 200, { filename: d.file, sha: d.sha, content: d.content, branch });
      } catch (e) {
        if (e.status === 404) return json(res, 404, { error: 'not_found', message: 'Branch or file not found' });
        throw e;
      }
    }

    // POST /api/review/publish  — admin publishes review branch to main
    if (req.method === 'POST' && p === '/api/review/publish') {
      const s = session(req, clock());
      if (!s) return json(res, 401, { error: 'unauthenticated' });
      if (!checkAdmin(s)) return json(res, 403, { error: 'forbidden', message: 'Admin role required' });
      const b = await body(req);
      const { branch, filename } = b;
      if (!branch || !filename) {
        return json(res, 400, { error: 'bad_request', message: 'branch and filename required' });
      }
      if (!ALLOWED_FILES.has(filename)) {
        return json(res, 400, { error: 'bad_request', message: `File not allowed: ${filename}` });
      }
      if (!GITHUB_TOKEN) {
        return json(res, 503, { error: 'not_configured', message: 'GitHub integration not configured' });
      }
      let reviewFile;
      try {
        reviewFile = await ghGetContent(GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, filename, branch);
      } catch (e) {
        if (e.status === 404) return json(res, 404, { error: 'not_found', message: 'Review branch or file not found' });
        throw e;
      }
      let mainSha = null;
      try {
        const mf = await ghGetContent(GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, filename, 'main');
        mainSha = mf.sha;
      } catch (e) {
        if (e.status !== 404) throw e;
      }
      const result = await ghPutContent(GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME, filename, 'main', reviewFile.content, mainSha, s.name);
      return json(res, 200, { published: true, filename, ...result });
    }

    // Serve static files from site root (catch-all for GET requests)
    if (req.method === 'GET') {
      const siteRoot = SITE_ROOT || path.resolve(__dirname, '..');
      const filePath = p === '/' ? '/index.html' : p;
      const absPath = path.join(siteRoot, filePath);
      if (!absPath.startsWith(path.resolve(siteRoot))) {
        return json(res, 403, { error: 'forbidden' });
      }
      try {
        const stat = fs.statSync(absPath);
        if (stat.isFile()) {
          const ext = path.extname(absPath).toLowerCase();
          const mime = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
          };
          const ct = mime[ext] || 'application/octet-stream';
          const buf = fs.readFileSync(absPath);
          res.writeHead(200, { 'Content-Type': ct, 'Content-Length': buf.length });
          return res.end(buf);
        }
      } catch (_) { /* fall through to 404 */ }
    }

    return json(res, 404, { error: 'not_found' });
  } catch (e) {
    if (e.status === 413) {
      return json(res, 413, { error: 'body_too_large', message: 'Request entity too large' });
    }
    if (e.status === 400) {
      return json(res, 400, { error: 'bad_request', message: 'Invalid JSON' });
    }
    return json(res, 500, {
      error: 'internal_error',
      message: 'Internal server error'
    });
  }
}

function start() {
  for (const k of ['SESSION_SECRET', 'EDITOR_ACCOUNTS_JSON']) {
    if (!process.env[k]) {
      throw new Error(`Missing ${k}`);
    }
  }
  const { loadAccounts, setAccounts } = require('./lib/accounts');
  setAccounts(loadAccounts(process.env.EDITOR_ACCOUNTS_JSON));

  return http.createServer((req, res) => router(req, res)).listen(Number(PORT), () => console.log(`Hooxi API :${PORT}`));
}

module.exports = { router, start, _sessions: sessions };
if (require.main === module) start();
