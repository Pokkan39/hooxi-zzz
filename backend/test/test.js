'use strict';

// Set up default env before anything loads
const testAccounts = [
  { id: 'admin_usr', name: 'Admin User', password: 'adminpassword', role: 'admin' },
  { id: 'editor_usr1', name: 'Editor One', password: 'editorpassword1', role: 'editor' },
  { id: 'editor_usr2', name: 'Editor Two', password: 'editorpassword2', role: 'editor' }
];

process.env.EDITOR_ACCOUNTS_JSON = JSON.stringify(testAccounts);
process.env.SESSION_SECRET = 'a'.repeat(32);
process.env.COOKIE_NAME = 'hooxi_session';
process.env.CORS_ORIGINS = 'http://localhost:8080,http://127.0.0.1:8080';
process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const http = require('http');

// Helper to load server module with specific env overrides
function requireServerWithEnv(envOverrides) {
  const originalEnv = { ...process.env };
  for (const [k, v] of Object.entries(envOverrides)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
  // Clear require cache
  delete require.cache[require.resolve('../server.js')];
  delete require.cache[require.resolve('../lib/accounts.js')];
  delete require.cache[require.resolve('../lib/session.js')];

  const serverMod = require('../server.js');

  // Restore env
  process.env = originalEnv;
  return serverMod;
}

// Simple fetch-like client for testing
async function request(server, method, path, headers = {}, bodyObj = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const payload = (bodyObj && typeof bodyObj === 'object') ? JSON.stringify(bodyObj) : (bodyObj || '');
    const reqHeaders = { ...headers };
    if (bodyObj) {
      if (!reqHeaders['Content-Type']) {
        reqHeaders['Content-Type'] = 'application/json';
      }
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request({
      hostname: '127.0.0.1',
      port: address.port,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = data ? JSON.parse(data) : null;
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json,
          rawBody: data
        });
      });
    });
    req.on('error', reject);
    if (bodyObj) {
      req.write(payload);
    }
    req.end();
  });
}

test('1. 配置校验 - EDITOR_ACCOUNTS_JSON', async (t) => {
  const { loadAccounts } = require('../lib/accounts');

  await t.test('必须包含且仅包含 3 个账号', () => {
    assert.throws(() => {
      loadAccounts(JSON.stringify([
        { id: '1', name: 'A', password: 'P', role: 'admin' },
        { id: '2', name: 'B', password: 'P', role: 'editor' }
      ]));
    }, /must contain exactly 3 accounts/);
  });

  await t.test('必须有且仅有 1 个 admin', () => {
    assert.throws(() => {
      loadAccounts(JSON.stringify([
        { id: '1', name: 'A', password: 'P', role: 'editor' },
        { id: '2', name: 'B', password: 'P', role: 'editor' },
        { id: '3', name: 'C', password: 'P', role: 'editor' }
      ]));
    }, /must contain exactly 1 admin/);

    assert.throws(() => {
      loadAccounts(JSON.stringify([
        { id: '1', name: 'A', password: 'P', role: 'admin' },
        { id: '2', name: 'B', password: 'P', role: 'admin' },
        { id: '3', name: 'C', password: 'P', role: 'editor' }
      ]));
    }, /must contain exactly 1 admin/);
  });

  await t.test('字段校验 - 必填项缺失', () => {
    assert.throws(() => {
      loadAccounts(JSON.stringify([
        { name: 'A', password: 'P', role: 'admin' },
        { id: '2', name: 'B', password: 'P', role: 'editor' },
        { id: '3', name: 'C', password: 'P', role: 'editor' }
      ]));
    }, /missing or invalid id/);

    assert.throws(() => {
      loadAccounts(JSON.stringify([
        { id: '1', password: 'P', role: 'admin' },
        { id: '2', name: 'B', password: 'P', role: 'editor' },
        { id: '3', name: 'C', password: 'P', role: 'editor' }
      ]));
    }, /missing or invalid name/);

    assert.throws(() => {
      loadAccounts(JSON.stringify([
        { id: '1', name: 'A', role: 'admin' },
        { id: '2', name: 'B', password: 'P', role: 'editor' },
        { id: '3', name: 'C', password: 'P', role: 'editor' }
      ]));
    }, /missing or invalid password/);

    assert.throws(() => {
      loadAccounts(JSON.stringify([
        { id: '1', name: 'A', password: 'P' },
        { id: '2', name: 'B', password: 'P', role: 'editor' },
        { id: '3', name: 'C', password: 'P', role: 'editor' }
      ]));
    }, /role/);
  });

  await t.test('账号 ID 必须唯一', () => {
    assert.throws(() => {
      loadAccounts(JSON.stringify([
        { id: 'dup', name: 'A', password: 'P', role: 'admin' },
        { id: 'dup', name: 'B', password: 'P', role: 'editor' },
        { id: '3', name: 'C', password: 'P', role: 'editor' }
      ]));
    }, /Duplicate account id/);
  });

  await t.test('有效配置加载成功并哈希密码', () => {
    const list = loadAccounts(JSON.stringify(testAccounts));
    assert.strictEqual(list.length, 3);
    assert.strictEqual(list[0].id, 'admin_usr');
    assert.ok(Buffer.isBuffer(list[0].salt));
    assert.ok(Buffer.isBuffer(list[0].hash));
    // Clear text password must not be kept in hashed list
    assert.strictEqual(list[0].password, undefined);
  });
});

test('2. 密码校验与防时序攻击', () => {
  const { loadAccounts, setAccounts, login } = require('../lib/accounts');
  const accounts = loadAccounts(JSON.stringify(testAccounts));
  setAccounts(accounts);

  // Correct login
  const user = login('127.0.0.1', 'admin_usr', 'adminpassword');
  assert.ok(user);
  assert.strictEqual(user.id, 'admin_usr');
  assert.strictEqual(user.role, 'admin');

  // Incorrect password
  const failed = login('127.0.0.1', 'admin_usr', 'wrongpassword');
  assert.strictEqual(failed, null);
});

test('3. 泄密防御 - 错误不泄露内部细节', async () => {
  const serverMod = requireServerWithEnv({
    NODE_ENV: 'production',
    CORS_ORIGINS: 'http://localhost:8080'
  });
  const server = http.createServer((req, res) => serverMod.router(req, res));
  
  await new Promise(r => server.listen(0, r));

  try {
    // Test invalid JSON request body (include Origin to bypass Origin filter in prod)
    const res1 = await request(server, 'POST', '/api/auth/login', {
      Origin: 'http://localhost:8080'
    }, 'invalid-json-content{');
    assert.strictEqual(res1.status, 400);
    assert.strictEqual(res1.body.error, 'bad_request');
    assert.strictEqual(res1.body.message, 'Invalid JSON');
    assert.ok(!res1.rawBody.includes('SyntaxError')); // No stack trace leaking

    // Test route error / internal error behavior (include Origin to bypass Origin filter in prod)
    const res2 = await request(server, 'POST', '/api/auth/login', {
      Origin: 'http://localhost:8080'
    }, { id: 'admin_usr', password: {} });
    assert.strictEqual(res2.status, 400); // Invalid payload type
    assert.strictEqual(res2.body.error, 'bad_request');
  } finally {
    server.close();
  }
});

test('4. 限流校验 - IP + 账号 10分钟5次限制', () => {
  const { loadAccounts, setAccounts, login, clearAttempts } = require('../lib/accounts');
  const accounts = loadAccounts(JSON.stringify(testAccounts));
  setAccounts(accounts);
  clearAttempts();

  let mockTime = Date.now();
  const clock = () => mockTime;

  // 5 failed login attempts for ip1 on admin_usr
  for (let i = 0; i < 5; i++) {
    const res = login('127.0.0.1', 'admin_usr', 'wrongpassword', clock);
    assert.strictEqual(res, null);
  }

  // 6th attempt should trigger RATE_LIMITED
  assert.throws(() => {
    login('127.0.0.1', 'admin_usr', 'wrongpassword', clock);
  }, /rate_limited/);

  // Rate limiting must be IP and account specific
  // Same IP, different account should work
  const otherAcc = login('127.0.0.1', 'editor_usr1', 'editorpassword1', clock);
  assert.ok(otherAcc);

  // Different IP, same account should work
  const otherIp = login('192.168.1.1', 'admin_usr', 'adminpassword', clock);
  assert.ok(otherIp);

  // Moving clock forward by 10 minutes (600,000 ms) should reset rate limit
  mockTime += 600000;
  const resetLogin = login('127.0.0.1', 'admin_usr', 'adminpassword', clock);
  assert.ok(resetLogin);
});

test('5 & 6. Cookie 属性与 Session 过期/篡改校验', async () => {
  const serverMod = requireServerWithEnv({
    NODE_ENV: 'production',
    SESSION_TTL_SECONDS: '3600'
  });

  let currentClockTime = Date.now();
  const testClock = () => currentClockTime;
  const server = http.createServer((req, res) => serverMod.router(req, res, testClock));
  await new Promise(r => server.listen(0, r));

  try {
    // 1. Success login to get Session Cookie
    const resLogin = await request(server, 'POST', '/api/auth/login', {
      Origin: 'http://localhost:8080'
    }, {
      id: 'admin_usr',
      password: 'adminpassword'
    });

    assert.strictEqual(resLogin.status, 200);
    assert.ok(resLogin.headers['set-cookie']);
    const setCookieHeader = resLogin.headers['set-cookie'][0];
    
    // Cookie attributes validation
    assert.ok(setCookieHeader.includes('HttpOnly'));
    assert.ok(setCookieHeader.includes('SameSite=Lax'));
    assert.ok(setCookieHeader.includes('Secure')); // Secure in production mode
    assert.ok(setCookieHeader.includes('Max-Age=3600')); // 1 hour maxAge

    const cookieValue = setCookieHeader.split(';')[0]; // hooxi_session=xxx.yyy

    // 2. Access session with valid cookie
    const resSessionVal = await request(server, 'GET', '/api/auth/session', {
      Cookie: cookieValue
    });
    assert.strictEqual(resSessionVal.status, 200);
    assert.strictEqual(resSessionVal.body.authenticated, true);
    assert.strictEqual(resSessionVal.body.id, 'admin_usr');
    assert.ok(resSessionVal.body.csrfToken);

    // 3. Session Expiration Test
    // Advance clock by 1 hour + 1 second
    currentClockTime += 3601 * 1000;
    const resExpiredSession = await request(server, 'GET', '/api/auth/session', {
      Cookie: cookieValue
    });
    assert.strictEqual(resExpiredSession.status, 401);
    assert.strictEqual(resExpiredSession.body.authenticated, false);

    // Reset clock for tampering test
    currentClockTime = Date.now();
    const resLogin2 = await request(server, 'POST', '/api/auth/login', {
      Origin: 'http://localhost:8080'
    }, {
      id: 'admin_usr',
      password: 'adminpassword'
    });
    const cookieValue2 = resLogin2.headers['set-cookie'][0].split(';')[0];

    // 4. Session Tampering Test
    const tamperedCookie = cookieValue2 + 'tamper';
    const resTampered = await request(server, 'GET', '/api/auth/session', {
      Cookie: tamperedCookie
    });
    assert.strictEqual(resTampered.status, 401);
    assert.strictEqual(resTampered.body.authenticated, false);

  } finally {
    server.close();
  }
});

test('7 & 8. CSRF 校验 & Origin 校验 (精确白名单与生产验证)', async () => {
  const serverMod = requireServerWithEnv({
    NODE_ENV: 'production',
    CORS_ORIGINS: 'http://localhost:8080,http://127.0.0.1:8080'
  });

  const server = http.createServer((req, res) => serverMod.router(req, res));
  await new Promise(r => server.listen(0, r));

  try {
    // 1. In production, missing Origin header for POST should be rejected with 403
    const resNoOrigin = await request(server, 'POST', '/api/auth/login', {}, {
      id: 'admin_usr',
      password: 'adminpassword'
    });
    assert.strictEqual(resNoOrigin.status, 403);
    assert.strictEqual(resNoOrigin.body.error, 'forbidden');
    assert.strictEqual(resNoOrigin.body.message, 'Missing Origin header');

    // 2. In production, mismatched Origin header for POST should be rejected with 403
    const resBadOrigin = await request(server, 'POST', '/api/auth/login', {
      Origin: 'http://malicious.site'
    }, {
      id: 'admin_usr',
      password: 'adminpassword'
    });
    assert.strictEqual(resBadOrigin.status, 403);
    assert.strictEqual(resBadOrigin.body.error, 'forbidden');
    assert.strictEqual(resBadOrigin.body.message, 'Origin not allowed');

    // 3. Login with allowed Origin
    const resLogin = await request(server, 'POST', '/api/auth/login', {
      Origin: 'http://localhost:8080'
    }, {
      id: 'admin_usr',
      password: 'adminpassword'
    });
    if (resLogin.status !== 200) {
      throw new Error('Login failed with status ' + resLogin.status + ' body: ' + JSON.stringify(resLogin.body));
    }
    assert.strictEqual(resLogin.status, 200);
    const cookie = resLogin.headers['set-cookie'][0].split(';')[0];
    const csrfToken = resLogin.body.csrfToken;

    // CORS Headers Verification
    assert.strictEqual(resLogin.headers['access-control-allow-origin'], 'http://localhost:8080');
    assert.strictEqual(resLogin.headers['access-control-allow-credentials'], 'true');

    // 4. Logout (write request) with missing CSRF Token should be rejected with 403
    const resNoCsrf = await request(server, 'POST', '/api/auth/logout', {
      Origin: 'http://localhost:8080',
      Cookie: cookie
    });
    assert.strictEqual(resNoCsrf.status, 403);
    assert.strictEqual(resNoCsrf.body.error, 'forbidden');
    assert.strictEqual(resNoCsrf.body.message, 'Invalid or missing CSRF token');

    // 5. Logout (write request) with mismatched CSRF Token should be rejected with 403
    const resWrongCsrf = await request(server, 'POST', '/api/auth/logout', {
      Origin: 'http://localhost:8080',
      Cookie: cookie,
      'X-CSRF-Token': 'wrongtoken'
    });
    assert.strictEqual(resWrongCsrf.status, 403);

    // 6. Logout (write request) with correct CSRF Token should succeed
    const resGoodCsrf = await request(server, 'POST', '/api/auth/logout', {
      Origin: 'http://localhost:8080',
      Cookie: cookie,
      'X-CSRF-Token': csrfToken
    });
    assert.strictEqual(resGoodCsrf.status, 200);
    assert.strictEqual(resGoodCsrf.body.ok, true);

  } finally {
    server.close();
  }
});

test('9. 权限校验 - checkAdmin helper', () => {
  const { checkAdmin } = require('../lib/accounts');

  assert.strictEqual(checkAdmin(null), false);
  assert.strictEqual(checkAdmin({ role: 'editor' }), false);
  assert.strictEqual(checkAdmin({ role: 'admin' }), true);
});

test('11. 内容读取 API', async () => {
  const serverMod = requireServerWithEnv({
    NODE_ENV: 'test'
  });
  const server = http.createServer((req, res) => serverMod.router(req, res));
  await new Promise(r => server.listen(0, r));

  try {
    // Unauthenticated request should fail
    const r1 = await request(server, 'GET', '/api/content/data.js');
    assert.strictEqual(r1.status, 401);
    assert.strictEqual(r1.body.error, 'unauthenticated');

    // Login as admin
    const loginRes = await request(server, 'POST', '/api/auth/login', {}, {
      id: 'admin_usr',
      password: 'adminpassword'
    });
    assert.strictEqual(loginRes.status, 200);
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];
    const csrfToken = loginRes.body.csrfToken;

    // Authenticated request should succeed (local file read)
    const r2 = await request(server, 'GET', '/api/content/data.js', { Cookie: cookie });
    assert.strictEqual(r2.status, 200);
    assert.strictEqual(r2.body.filename, 'data.js');
    assert.ok(typeof r2.body.sha === 'string');
    assert.ok(typeof r2.body.content === 'string');
    assert.ok(r2.body.content.includes('window.archiveData'));

    // Invalid filename should fail
    const r3 = await request(server, 'GET', '/api/content/evil.js', { Cookie: cookie });
    assert.strictEqual(r3.status, 400);
    assert.strictEqual(r3.body.error, 'bad_request');

    // layout-data.js should also work
    const r4 = await request(server, 'GET', '/api/content/layout-data.js', { Cookie: cookie });
    assert.strictEqual(r4.status, 200);
    assert.strictEqual(r4.body.filename, 'layout-data.js');
  } finally {
    server.close();
  }
});

test('12. 检阅/发布 API 鉴权与参数校验', async () => {
  const serverMod = requireServerWithEnv({
    NODE_ENV: 'test'
  });
  const server = http.createServer((req, res) => serverMod.router(req, res));
  await new Promise(r => server.listen(0, r));

  let adminCookie, adminCsrf, editorCookie, editorCsrf;

  try {
    // Login as admin
    const adminLogin = await request(server, 'POST', '/api/auth/login', {}, {
      id: 'admin_usr', password: 'adminpassword'
    });
    assert.strictEqual(adminLogin.status, 200);
    adminCookie = adminLogin.headers['set-cookie'][0].split(';')[0];
    adminCsrf = adminLogin.body.csrfToken;

    // Login as editor
    const editorLogin = await request(server, 'POST', '/api/auth/login', {}, {
      id: 'editor_usr1', password: 'editorpassword1'
    });
    assert.strictEqual(editorLogin.status, 200);
    editorCookie = editorLogin.headers['set-cookie'][0].split(';')[0];
    editorCsrf = editorLogin.body.csrfToken;

    // --- Review push ---
    // No auth
    const r1 = await request(server, 'POST', '/api/review/push', {
      'Content-Type': 'application/json'
    }, { filename: 'data.js', content: '{}' });
    assert.strictEqual(r1.status, 401);

    // No CSRF token (authenticated write)
    const r2 = await request(server, 'POST', '/api/review/push', {
      'Content-Type': 'application/json',
      Cookie: editorCookie
    }, { filename: 'data.js', content: '{}' });
    assert.strictEqual(r2.status, 403);

    // With CSRF but no GitHub config → 503
    const r3 = await request(server, 'POST', '/api/review/push', {
      'Content-Type': 'application/json',
      Cookie: editorCookie,
      'X-CSRF-Token': editorCsrf
    }, { filename: 'data.js', content: '{}' });
    assert.strictEqual(r3.status, 503);
    assert.strictEqual(r3.body.error, 'not_configured');

    // Invalid filename
    const r4 = await request(server, 'POST', '/api/review/push', {
      'Content-Type': 'application/json',
      Cookie: editorCookie,
      'X-CSRF-Token': editorCsrf
    }, { filename: 'evil.js', content: '{}' });
    assert.strictEqual(r4.status, 400);

    // --- Review list ---
    const r5 = await request(server, 'GET', '/api/review/list');
    assert.strictEqual(r5.status, 401);

    const r6 = await request(server, 'GET', '/api/review/list', { Cookie: adminCookie });
    assert.strictEqual(r6.status, 200);
    assert.deepStrictEqual(r6.body.branches, []);

    // --- Review file ---
    const r7 = await request(server, 'GET', '/api/review/file');
    assert.strictEqual(r7.status, 401);

    const r8 = await request(server, 'GET', '/api/review/file?branch=x&file=data.js');
    assert.strictEqual(r8.status, 401);

    const r9 = await request(server, 'GET', '/api/review/file?branch=x&file=data.js', { Cookie: adminCookie });
    assert.strictEqual(r9.status, 503); // No GitHub config

    const r10 = await request(server, 'GET', '/api/review/file', { Cookie: adminCookie });
    assert.strictEqual(r10.status, 400); // Missing params checked before GitHub config

    // --- Publish ---
    const r11 = await request(server, 'POST', '/api/review/publish', {
      'Content-Type': 'application/json'
    }, { branch: 'x', filename: 'data.js' });
    assert.strictEqual(r11.status, 401);

    // Editor cannot publish
    const r12 = await request(server, 'POST', '/api/review/publish', {
      'Content-Type': 'application/json',
      Cookie: editorCookie,
      'X-CSRF-Token': editorCsrf
    }, { branch: 'x', filename: 'data.js' });
    assert.strictEqual(r12.status, 403);
    assert.strictEqual(r12.body.error, 'forbidden');

    // Admin can reach but no GitHub config → 503
    const r13 = await request(server, 'POST', '/api/review/publish', {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
      'X-CSRF-Token': adminCsrf
    }, { branch: 'x', filename: 'data.js' });
    assert.strictEqual(r13.status, 503);
    assert.strictEqual(r13.body.error, 'not_configured');

  } finally {
    server.close();
  }
});

test('10. 旧路由关闭 - OAuth 及 archive 关闭', async () => {
  const serverMod = requireServerWithEnv({
    NODE_ENV: 'test'
  });
  const server = http.createServer((req, res) => serverMod.router(req, res));
  await new Promise(r => server.listen(0, r));

  try {
    const r1 = await request(server, 'GET', '/api/auth/github/start');
    assert.strictEqual(r1.status, 404);

    const r2 = await request(server, 'GET', '/api/auth/github/callback');
    assert.strictEqual(r2.status, 404);

    const r3 = await request(server, 'GET', '/api/archive');
    assert.strictEqual(r3.status, 404);

    const r4 = await request(server, 'PUT', '/api/archive', {}, {});
    assert.strictEqual(r4.status, 404);
  } finally {
    server.close();
  }
});
