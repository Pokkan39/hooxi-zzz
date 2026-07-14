(function () {
  'use strict';

  const EDITOR_PASSWORD = 'Hooxi777771';
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCK_MS = 10 * 60 * 1000;
  const GATE_STATE_KEY = 'hooxi:editor-gate';
  const RECORD_GROUPS = [
    ['mainline', '主线剧情'],
    ['stories', '角色故事'],
    ['events', '往期活动'],
    ['behindScenes', '幕后 / 对谈']
  ];

  const $ = (selector) => document.querySelector(selector);
  const loginPanel = $('#loginPanel');
  const editorPanel = $('#editorPanel');
  const loginForm = $('#loginForm');
  const loginPassword = $('#loginPassword');
  const loginError = $('#loginError');
  const loginBtn = $('#loginBtn');
  const lockBtn = $('#lockBtn');
  const contentEditor = $('#contentEditor');
  const currentFileLabel = $('#currentFile');
  const draftStatus = $('#draftStatus');
  const editorStatus = $('#editorStatus');
  const editorHint = $('#editorHint');
  const toast = $('#toast');
  const saveDraftBtn = $('#saveDraftBtn');
  const loadDraftBtn = $('#loadDraftBtn');
  const revertBtn = $('#revertBtn');
  const downloadBtn = $('#downloadBtn');
  const visualEditor = $('#visualEditor');

  let currentFile = 'data.js';
  let contentCache = {};
  let originals = {};
  let toastTimer = 0;
  let editorMode = 'visual';
  let archiveDraft = null;

  function showToast(message, isError = false) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : '');
    toastTimer = window.setTimeout(() => {
      toast.className = 'toast';
    }, 3000);
  }

  function readGateState() {
    try {
      return JSON.parse(localStorage.getItem(GATE_STATE_KEY)) || { failures: 0, lockedUntil: 0 };
    } catch {
      return { failures: 0, lockedUntil: 0 };
    }
  }

  function writeGateState(state) {
    localStorage.setItem(GATE_STATE_KEY, JSON.stringify(state));
  }

  function clearGateState() {
    localStorage.removeItem(GATE_STATE_KEY);
  }

  function lockRemainingText(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}分${String(seconds).padStart(2, '0')}秒`;
  }

  function updateGateLock() {
    const state = readGateState();
    const remaining = state.lockedUntil - Date.now();
    if (remaining <= 0) {
      if (state.lockedUntil) clearGateState();
      loginBtn.disabled = false;
      loginBtn.textContent = '进入编辑';
      return false;
    }
    loginBtn.disabled = true;
    loginBtn.textContent = '已锁定';
    loginError.textContent = '输错过多，请 ' + lockRemainingText(remaining) + ' 后再试';
    window.setTimeout(updateGateLock, Math.min(remaining, 1000));
    return true;
  }

  function recordFailedPassword() {
    const state = readGateState();
    const failures = (state.failures || 0) + 1;
    if (failures >= MAX_FAILED_ATTEMPTS) {
      writeGateState({ failures, lockedUntil: Date.now() + LOCK_MS });
      updateGateLock();
      return;
    }
    writeGateState({ failures, lockedUntil: 0 });
    loginError.textContent = `密码错误，还剩 ${MAX_FAILED_ATTEMPTS - failures} 次机会`;
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function draftKey(file) {
    return 'hooxi:draft:' + file;
  }

  async function fetchFile(file) {
    const res = await fetch(file, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  function parseArchive(text) {
    const start = text.indexOf('=');
    const end = text.lastIndexOf(';');
    if (start === -1 || end === -1 || end <= start) throw new Error('data.js 格式不正确');
    return JSON.parse(text.slice(start + 1, end));
  }

  function archiveToText(data) {
    return 'window.archiveData=' + JSON.stringify(data, null, 2) + ';\n';
  }

  function canUseVisual() {
    return currentFile === 'data.js' && archiveDraft;
  }

  function setValue(path, value) {
    const parts = path.split('.');
    let target = archiveDraft;
    while (parts.length > 1) target = target[parts.shift()];
    target[parts[0]] = value;
    syncSourceFromVisual();
  }

  function field(label, path, value, type = 'text') {
    const multiline = type === 'textarea';
    const input = multiline
      ? `<textarea data-path="${esc(path)}" rows="3">${esc(value)}</textarea>`
      : `<input data-path="${esc(path)}" type="${esc(type)}" value="${esc(value)}"/>`;
    return `<label>${esc(label)}${input}</label>`;
  }

  function arrayField(label, path, value) {
    return field(label, path, Array.isArray(value) ? value.join(', ') : value);
  }

  function renderFactions() {
    const items = archiveDraft.factions || [];
    return `<section class="visual-section"><h3>阵营</h3>${items.map((item, i) => `
      <article class="visual-card">
        <h4>${esc(item.name || '未命名阵营')}</h4>
        <div class="form-grid">
          ${field('阵营 ID', `factions.${i}.id`, item.id)}
          ${field('阵营名称', `factions.${i}.name`, item.name)}
          ${field('主题色', `factions.${i}.theme`, item.theme || '#58a6ff', 'color')}
          ${arrayField('成员 ID，用英文逗号分隔', `factions.${i}.members`, item.members)}
        </div>
        ${field('阵营简介', `factions.${i}.summary`, item.summary, 'textarea')}
        <div class="form-grid">
          ${field('标志图片路径', `factions.${i}.logo`, item.logo)}
          ${field('背景图片路径', `factions.${i}.background`, item.background)}
        </div>
      </article>`).join('')}</section>`;
  }

  function renderCharacters() {
    const items = archiveDraft.characters || [];
    return `<section class="visual-section"><h3>角色</h3>${items.map((item, i) => `
      <article class="visual-card">
        <h4>${esc(item.name || '未命名角色')}</h4>
        <div class="form-grid">
          ${field('角色 ID', `characters.${i}.id`, item.id)}
          ${field('角色姓名', `characters.${i}.name`, item.name)}
          ${field('所属阵营 ID', `characters.${i}.factionId`, item.factionId)}
          ${field('属性', `characters.${i}.attribute`, item.attribute)}
          ${field('特性', `characters.${i}.specialty`, item.specialty)}
          ${field('定位', `characters.${i}.role`, item.role)}
          ${field('头像路径', `characters.${i}.avatar`, item.avatar)}
          ${field('近景路径', `characters.${i}.headshot`, item.headshot)}
          ${field('立绘路径', `characters.${i}.portrait`, item.portrait)}
        </div>
        ${field('角色简介', `characters.${i}.summary`, item.summary, 'textarea')}
        ${arrayField('关联剧情 ID，用英文逗号分隔', `characters.${i}.relatedIds`, item.relatedIds)}
      </article>`).join('')}</section>`;
  }

  function renderRecords(key, title) {
    const items = archiveDraft[key] || [];
    return `<section class="visual-section"><div class="section-head"><h3>${esc(title)}</h3><button class="btn small" data-add-record="${esc(key)}" type="button">新增</button></div>${items.map((item, i) => `
      <article class="visual-card">
        <div class="card-head"><h4>${esc(item.title || '未命名条目')}</h4><button class="btn small ghost danger" data-remove-record="${esc(key)}.${i}" type="button">删除</button></div>
        <div class="form-grid">
          ${field('排序', `${key}.${i}.order`, item.order || i + 1, 'number')}
          ${field('标题', `${key}.${i}.title`, item.title)}
          ${field('标签', `${key}.${i}.tag`, item.tag)}
          ${field('视频链接', `${key}.${i}.video`, item.video)}
          ${field('封面图片', `${key}.${i}.cover`, item.cover)}
          ${field('资料来源', `${key}.${i}.wikiUrl`, item.wikiUrl)}
          ${field('版本', `${key}.${i}.version`, item.version)}
          ${field('章节', `${key}.${i}.chapter`, item.chapter)}
          ${field('阵营', `${key}.${i}.faction`, item.faction)}
          ${field('阵营 ID', `${key}.${i}.factionId`, item.factionId)}
          ${field('角色 ID', `${key}.${i}.characterId`, item.characterId)}
        </div>
        ${field('简介', `${key}.${i}.summary`, item.summary, 'textarea')}
      </article>`).join('')}</section>`;
  }

  function renderVisualEditor() {
    if (!canUseVisual()) {
      visualEditor.innerHTML = '<div class="empty-state">当前文件暂不支持可视化编辑，请使用源码编辑。</div>';
      return;
    }
    visualEditor.innerHTML = [
      renderFactions(),
      renderCharacters(),
      ...RECORD_GROUPS.map(([key, title]) => renderRecords(key, title))
    ].join('');
  }

  function syncSourceFromVisual() {
    if (!archiveDraft) return;
    const text = archiveToText(archiveDraft);
    contentEditor.value = text;
    contentCache[currentFile] = text;
    updateDraftStatus();
  }

  function syncVisualFromSource() {
    if (currentFile !== 'data.js') {
      archiveDraft = null;
      return;
    }
    archiveDraft = parseArchive(contentEditor.value);
    renderVisualEditor();
  }

  function setEditorMode(mode) {
    editorMode = mode;
    if (mode === 'visual' && currentFile === 'data.js') {
      try {
        syncVisualFromSource();
      } catch (error) {
        editorMode = 'source';
        showToast('源码格式有误，暂时只能用源码编辑: ' + error.message, true);
      }
    }
    const visual = editorMode === 'visual' && currentFile === 'data.js';
    visualEditor.classList.toggle('hidden', !visual);
    contentEditor.classList.toggle('source-hidden', visual);
    editorHint.textContent = visual
      ? '用表单改内容；保存只写入本机浏览器，导出后再覆盖仓库文件。'
      : '直接编辑当前文件源码；保存只写入本机浏览器。';
    document.querySelectorAll('.mode-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.mode === editorMode);
      tab.disabled = tab.dataset.mode === 'visual' && currentFile !== 'data.js';
    });
  }

  function updateFileTabs() {
    document.querySelectorAll('.file-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.file === currentFile);
    });
  }

  function updateEditorCopy() {
    currentFileLabel.textContent = currentFile;
    editorStatus.textContent = currentFile === 'data.js'
      ? '表单内容会自动同步到源码；导出 data.js 后覆盖仓库同名文件。'
      : 'layout-data.js 暂无可视化结构，请在源码模式编辑。';
  }

  function updateDraftStatus() {
    const saved = localStorage.getItem(draftKey(currentFile));
    const current = contentCache[currentFile];
    const origin = originals[currentFile];

    if (saved !== null) {
      let meta = {};
      try {
        meta = JSON.parse(localStorage.getItem('hooxi:draft:meta') || '{}');
      } catch {
        meta = {};
      }
      const isStale = current !== undefined && saved !== current;
      draftStatus.textContent = '本机草稿: ' + new Date(meta.savedAt || 0).toLocaleString() + (isStale ? ' (有未保存更改)' : '');
      return;
    }

    const changed = current !== undefined && origin !== undefined && current !== origin;
    draftStatus.textContent = changed ? '内容有未保存的更改' : '无本机草稿';
  }

  async function loadCurrentFile(forceFetch = false) {
    contentEditor.disabled = true;
    saveDraftBtn.disabled = true;
    loadDraftBtn.disabled = true;
    revertBtn.disabled = true;
    downloadBtn.disabled = true;

    try {
      const text = forceFetch || contentCache[currentFile] === undefined
        ? await fetchFile(currentFile)
        : contentCache[currentFile];
      contentCache[currentFile] = text;
      originals[currentFile] = text;
      contentEditor.value = text;
      updateEditorCopy();
      updateDraftStatus();
      setEditorMode(currentFile === 'data.js' ? 'visual' : 'source');
      if (editorMode === 'source') contentEditor.focus();
    } catch (error) {
      archiveDraft = null;
      contentEditor.value = '// 加载失败: ' + error.message;
      currentFileLabel.textContent = currentFile + '（加载失败）';
      editorStatus.textContent = '请确认当前站点已发布这些文件。';
      showToast('加载失败: ' + error.message, true);
    } finally {
      contentEditor.disabled = false;
      saveDraftBtn.disabled = false;
      loadDraftBtn.disabled = false;
      revertBtn.disabled = false;
      downloadBtn.disabled = false;
    }
  }

  function switchFile(file) {
    if (currentFile === file) return;
    contentCache[currentFile] = contentEditor.value;
    currentFile = file;
    updateFileTabs();
    if (contentCache[file] !== undefined) {
      contentEditor.value = contentCache[file];
      updateEditorCopy();
      updateDraftStatus();
      setEditorMode(file === 'data.js' ? 'visual' : 'source');
    } else {
      loadCurrentFile(true);
      return;
    }
    if (editorMode === 'source') contentEditor.focus();
  }

  function saveDraft() {
    if (editorMode === 'visual') syncSourceFromVisual();
    const content = contentEditor.value;
    contentCache[currentFile] = content;
    localStorage.setItem(draftKey(currentFile), content);
    localStorage.setItem('hooxi:draft:meta', JSON.stringify({ savedAt: Date.now(), file: currentFile }));
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
    setEditorMode(currentFile === 'data.js' ? 'visual' : 'source');
    showToast('已加载 ' + currentFile + ' 的本地草稿');
  }

  async function revertToLive() {
    try {
      const text = await fetchFile(currentFile);
      contentEditor.value = text;
      contentCache[currentFile] = text;
      originals[currentFile] = text;
      localStorage.removeItem(draftKey(currentFile));
      updateDraftStatus();
      updateEditorCopy();
      setEditorMode(currentFile === 'data.js' ? 'visual' : 'source');
      showToast('已恢复为线上版本');
    } catch (error) {
      showToast('恢复失败: ' + error.message, true);
    }
  }

  function downloadCurrentFile() {
    if (editorMode === 'visual') syncSourceFromVisual();
    const blob = new Blob([contentEditor.value], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile;
    link.click();
    URL.revokeObjectURL(url);
    showToast('已导出 ' + currentFile);
  }

  function addRecord(key) {
    archiveDraft[key] ??= [];
    archiveDraft[key].push({
      id: key + '-' + Date.now(),
      order: archiveDraft[key].length + 1,
      title: '新条目',
      tag: '新节点',
      summary: '填写简介。',
      video: '',
      wikiUrl: 'https://baike.mihoyo.com/zzz/wiki/',
      cover: ''
    });
    renderVisualEditor();
    syncSourceFromVisual();
  }

  function removeRecord(key, index) {
    archiveDraft[key].splice(index, 1);
    renderVisualEditor();
    syncSourceFromVisual();
  }

  function unlockEditor() {
    clearGateState();
    loginPanel.classList.add('hidden');
    editorPanel.classList.remove('hidden');
    loginError.textContent = '';
    loginBtn.disabled = false;
    loginBtn.textContent = '进入编辑';
    loadCurrentFile();
  }

  function lockEditor() {
    editorPanel.classList.add('hidden');
    loginPanel.classList.remove('hidden');
    loginPassword.value = '';
    loginError.textContent = '';
    loginPassword.focus();
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (updateGateLock()) return;
    const password = loginPassword.value.trim();
    if (!password) return;
    if (password !== EDITOR_PASSWORD) {
      recordFailedPassword();
      return;
    }
    unlockEditor();
  });

  lockBtn.addEventListener('click', lockEditor);
  saveDraftBtn.addEventListener('click', saveDraft);
  loadDraftBtn.addEventListener('click', loadDraft);
  revertBtn.addEventListener('click', revertToLive);
  downloadBtn.addEventListener('click', downloadCurrentFile);

  updateGateLock();

  document.querySelectorAll('.file-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchFile(tab.dataset.file));
  });

  document.querySelectorAll('.mode-tab').forEach((tab) => {
    tab.addEventListener('click', () => setEditorMode(tab.dataset.mode));
  });

  visualEditor.addEventListener('input', (event) => {
    const target = event.target;
    if (!target.dataset.path) return;
    const value = target.type === 'number'
      ? Number(target.value || 0)
      : target.dataset.path.endsWith('.members') || target.dataset.path.endsWith('.relatedIds')
        ? target.value.split(',').map((item) => item.trim()).filter(Boolean)
        : target.value;
    setValue(target.dataset.path, value);
    const title = target.closest('.visual-card')?.querySelector('h4');
    if (title && target.dataset.path.endsWith('.title')) title.textContent = target.value || '未命名条目';
    if (title && target.dataset.path.endsWith('.name')) title.textContent = target.value || '未命名';
  });

  visualEditor.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add-record]');
    if (add) {
      addRecord(add.dataset.addRecord);
      return;
    }
    const remove = event.target.closest('[data-remove-record]');
    if (remove) {
      const [key, index] = remove.dataset.removeRecord.split('.');
      removeRecord(key, Number(index));
    }
  });

  contentEditor.addEventListener('input', () => {
    contentCache[currentFile] = contentEditor.value;
    if (editorMode === 'source' && currentFile === 'data.js') {
      try {
        archiveDraft = parseArchive(contentEditor.value);
      } catch {
        archiveDraft = null;
      }
    }
    updateDraftStatus();
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && !editorPanel.classList.contains('hidden')) {
      event.preventDefault();
      saveDraft();
    }
  });

  lockEditor();
})();
