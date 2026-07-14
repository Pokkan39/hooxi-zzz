(function () {
  'use strict';

  // --- Configuration ---
  // Auto-detect: same origin as page = relative, else use localhost:3001
  const API_BASE = location.hostname === 'localhost' && location.port === '3001' ? '' : 'http://localhost:3001';
  const ALLOWED_FILES = ['data.js', 'layout-data.js'];

  // --- State ---
  let auth = null; // { id, name, role, csrfToken }
  let currentFile = 'data.js';
  let contentCache = {}; // { 'data.js': string, 'layout-data.js': string }
  let originals = {}; // { 'data.js': string, 'layout-data.js': string }

  // --- DOM refs ---
  const $ = (s) => document.querySelector(s);
  const loginPanel = $('#loginPanel');
  const editorPanel = $('#editorPanel');
  const loginError = $('#loginError');
  const userInfo = $('#userInfo');
  const contentEditor = $('#contentEditor');
  const currentFileLabel = $('#currentFile');
  const draftStatus = $('#draftStatus');
  const pushStatus = $('#pushStatus');
  const reviewList = $('#reviewList');
  const reviewSection = $('#reviewSection');
  const toast = $('#toast');

  // --- Toast ---
  let toastTimer;
  function showToast(msg, isError) {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = 'toast show' + (isError ? ' error' : '');
    toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3000);
  }

  // --- API helpers ---
  async function api(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && auth.csrfToken && method !== 'GET') {
      headers['X-CSRF-Token'] = auth.csrfToken;
    }
    const opts = { method, headers, credentials: 'include' };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(API_BASE + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // --- Auth ---
  async function doLogin(id, password) {
    const data = await api('POST', '/api/auth/login', { id, password });
    auth = { id: data.id, name: data.name, role: data.role, csrfToken: data.csrfToken };
    loginPanel.classList.add('hidden');
    editorPanel.classList.remove('hidden');
    userInfo.textContent = `${data.name}（${data.role === 'admin' ? '管理员' : '编辑员'}）`;
    if (data.role !== 'admin') reviewSection.classList.add('hidden');
    await loadCurrentFile();
  }

  async function checkSession() {
    try {
      const data = await api('GET', '/api/auth/session');
      if (data.authenticated) {
        auth = { id: data.id, name: data.name, role: data.role, csrfToken: data.csrfToken };
        loginPanel.classList.add('hidden');
        editorPanel.classList.remove('hidden');
        userInfo.textContent = `${data.name}（${data.role === 'admin' ? '管理员' : '编辑员'}）`;
        if (data.role !== 'admin') reviewSection.classList.add('hidden');
        await loadCurrentFile();
        await loadReviewList();
        return true;
      }
    } catch (e) {
      // Session expired or not available
    }
    return false;
  }

  async function doLogout() {
    try { await api('POST', '/api/auth/logout'); } catch (e) { /* ignore */ }
    auth = null;
    contentCache = {};
    originals = {};
    editorPanel.classList.add('hidden');
    loginPanel.classList.remove('hidden');
    loginError.textContent = '';
    $('#loginId').value = '';
    $('#loginPassword').value = '';
  }

  // --- Content ---
  async function loadCurrentFile() {
    contentEditor.value = '';
    contentEditor.disabled = true;
    $('#saveDraftBtn').disabled = true;
    $('#pushReviewBtn').disabled = true;
    try {
      const data = await api('GET', '/api/content/' + currentFile);
      contentCache[currentFile] = data.content;
      originals[currentFile] = data.content;
      contentEditor.value = data.content;
      currentFileLabel.textContent = currentFile + ' (线上版本 SHA: ' + data.sha.slice(0, 8) + ')';
      updateDraftStatus();
    } catch (e) {
      contentEditor.value = '// 加载失败: ' + e.message;
      currentFileLabel.textContent = currentFile + ' (加载失败)';
    }
    contentEditor.disabled = false;
    $('#saveDraftBtn').disabled = false;
    $('#pushReviewBtn').disabled = false;
  }

  function switchFile(filename) {
    if (currentFile === filename) return;
    currentFile = filename;
    document.querySelectorAll('.file-tab').forEach(t => t.classList.toggle('active', t.dataset.file === filename));
    if (contentCache[filename] !== undefined) {
      contentEditor.value = contentCache[filename];
      currentFileLabel.textContent = filename + ' (已缓存)';
    } else {
      loadCurrentFile();
    }
    updateDraftStatus();
  }

  // --- Drafts (localStorage) ---
  function draftKey(file) { return 'hooxi:draft:' + file; }

  function saveDraft() {
    const content = contentEditor.value;
    contentCache[currentFile] = content;
    localStorage.setItem(draftKey(currentFile), content);
    const meta = { savedAt: Date.now(), file: currentFile };
    localStorage.setItem('hooxi:draft:meta', JSON.stringify(meta));
    updateDraftStatus();
    showToast('草稿已保存到本机浏览器');
  }

  function loadDraft() {
    const saved = localStorage.getItem(draftKey(currentFile));
    if (saved === null) {
      showToast('没有找到 ' + currentFile + ' 的本地草稿', true);
      return;
    }
    contentEditor.value = saved;
    contentCache[currentFile] = saved;
    updateDraftStatus();
    showToast('已加载 ' + currentFile + ' 的本地草稿');
  }

  async function revertToLive() {
    try {
      const data = await api('GET', '/api/content/' + currentFile);
      contentEditor.value = data.content;
      contentCache[currentFile] = data.content;
      originals[currentFile] = data.content;
      localStorage.removeItem(draftKey(currentFile));
      updateDraftStatus();
      currentFileLabel.textContent = currentFile + ' (线上版本 SHA: ' + data.sha.slice(0, 8) + ')';
      showToast('已恢复为线上版本');
    } catch (e) {
      showToast('恢复失败: ' + e.message, true);
    }
  }

  function updateDraftStatus() {
    const saved = localStorage.getItem(draftKey(currentFile));
    const current = contentCache[currentFile];
    const orig = originals[currentFile];
    if (saved !== null) {
      const meta = JSON.parse(localStorage.getItem('hooxi:draft:meta') || '{}');
      const isStale = current !== undefined && saved !== current;
      draftStatus.textContent = '本地草稿: ' + new Date(meta.savedAt || 0).toLocaleString() +
        (isStale ? ' (有未保存更改)' : '');
    } else {
      const changed = current !== undefined && orig !== undefined && current !== orig;
      draftStatus.textContent = changed ? '内容有未保存的更改' : '无本地草稿';
    }
  }

  // --- Review ---
  async function pushReview() {
    const content = contentEditor.value;
    if (!content.trim()) {
      showToast('内容不能为空', true);
      return;
    }
    // Validate JSON structure
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        showToast(currentFile + ' 必须是 JSON 对象', true);
        return;
      }
    } catch (e) {
      showToast('JSON 格式错误: ' + e.message, true);
      return;
    }

    $('#pushReviewBtn').disabled = true;
    pushStatus.textContent = '正在推送...';
    try {
      const result = await api('POST', '/api/review/push', {
        filename: currentFile,
        content: content
      });
      pushStatus.textContent = '已推送到 ' + result.branch;
      contentCache[currentFile] = content;
      originals[currentFile] = content;
      localStorage.removeItem(draftKey(currentFile));
      showToast('已提交检阅分支: ' + result.branch);
      await loadReviewList();
    } catch (e) {
      pushStatus.textContent = '推送失败';
      showToast('推送失败: ' + e.message, true);
    }
    $('#pushReviewBtn').disabled = false;
  }

  async function loadReviewList() {
    if (!auth || auth.role !== 'admin') return;
    try {
      const data = await api('GET', '/api/review/list');
      const branches = data.branches || [];
      if (branches.length === 0) {
        reviewList.innerHTML = '<p class="hint">没有待审阅的分支</p>';
        return;
      }
      reviewList.innerHTML = branches.map(b => {
        const ts = b.branch.replace('review/draft-', '');
        const date = ts ? new Date(parseInt(ts)).toLocaleString() : '未知';
        return `<div class="review-item">
          <span class="branch-name" title="${b.branch}">${b.branch}</span>
          <span style="color:#484f58;font-size:.6875rem">${date}</span>
          <button class="publish-btn" data-branch="${b.branch}">发布</button>
        </div>`;
      }).join('');

      reviewList.querySelectorAll('.publish-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const branch = btn.dataset.branch;
          if (!confirm('确认将 ' + branch + ' 发布到 main？')) return;
          btn.disabled = true;
          btn.textContent = '发布中...';
          try {
            for (const file of ALLOWED_FILES) {
              try {
                await api('POST', '/api/review/publish', { branch, filename: file });
              } catch (e) {
                if (e.status !== 404) throw e;
              }
            }
            showToast('已发布 ' + branch + ' 到 main');
            await loadReviewList();
          } catch (e) {
            showToast('发布失败: ' + e.message, true);
            btn.disabled = false;
            btn.textContent = '发布';
          }
        });
      });
    } catch (e) {
      reviewList.innerHTML = '<p class="hint" style="color:#f85149">加载检阅列表失败</p>';
    }
  }

  // --- Content change tracking ---
  contentEditor.addEventListener('input', () => {
    contentCache[currentFile] = contentEditor.value;
    updateDraftStatus();
  });

  // --- Event bindings ---
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#loginId').value.trim();
    const password = $('#loginPassword').value;
    loginError.textContent = '';
    $('#loginBtn').disabled = true;
    $('#loginBtn').textContent = '登录中...';
    try {
      await doLogin(id, password);
      await loadReviewList();
    } catch (err) {
      loginError.textContent = err.data?.error === 'invalid_credentials'
        ? '账号或密码错误'
        : err.data?.error === 'rate_limited'
        ? '登录尝试过于频繁，请稍后再试'
        : '登录失败: ' + (err.message || '网络错误');
    }
    $('#loginBtn').disabled = false;
    $('#loginBtn').textContent = '登录';
  });

  $('#logoutBtn').addEventListener('click', doLogout);
  $('#saveDraftBtn').addEventListener('click', saveDraft);
  $('#loadDraftBtn').addEventListener('click', loadDraft);
  $('#revertBtn').addEventListener('click', revertToLive);
  $('#pushReviewBtn').addEventListener('click', pushReview);

  document.querySelectorAll('.file-tab').forEach(tab => {
    tab.addEventListener('click', () => switchFile(tab.dataset.file));
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (auth) saveDraft();
    }
  });

  // --- Init ---
  // Try localStorage session first (passed from index.html login modal)
  const stored = localStorage.getItem('hooxi:session');
  if (stored) {
    try {
      const s = JSON.parse(stored);
      if (s.id && s.csrfToken) {
        auth = s;
        loginPanel.classList.add('hidden');
        editorPanel.classList.remove('hidden');
        userInfo.textContent = `${s.name}（${s.role === 'admin' ? '管理员' : '编辑员'}）`;
        if (s.role !== 'admin') reviewSection.classList.add('hidden');
        loadCurrentFile();
        loadReviewList();
      }
    } catch (_) { /* fall through to server check */ }
  }
  // Also verify with server (updates csrfToken if cookie works)
  checkSession().then(authed => {
    if (authed) {
      localStorage.setItem('hooxi:session', JSON.stringify(auth));
      loadReviewList();
    }
  });
})();
