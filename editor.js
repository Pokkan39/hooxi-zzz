(function () {
  'use strict';

  const EDITOR_PASSWORD = 'Hooxi777771';
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCK_MS = 10 * 60 * 1000;
  const GATE_STATE_KEY = 'hooxi:editor-gate';

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
  const toast = $('#toast');
  const saveDraftBtn = $('#saveDraftBtn');
  const loadDraftBtn = $('#loadDraftBtn');
  const revertBtn = $('#revertBtn');
  const downloadBtn = $('#downloadBtn');

  let currentFile = 'data.js';
  let contentCache = {};
  let originals = {};
  let toastTimer = 0;

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

  function draftKey(file) {
    return 'hooxi:draft:' + file;
  }

  async function fetchFile(file) {
    const res = await fetch(file, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  function updateFileTabs() {
    document.querySelectorAll('.file-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.file === currentFile);
    });
  }

  function updateEditorCopy() {
    currentFileLabel.textContent = currentFile;
    editorStatus.textContent = '本地编辑只保存到浏览器；导出后请覆盖仓库同名文件。';
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
      contentEditor.focus();
    } catch (error) {
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
    } else {
      loadCurrentFile(true);
      return;
    }
    contentEditor.focus();
  }

  function saveDraft() {
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
      showToast('已恢复为线上版本');
    } catch (error) {
      showToast('恢复失败: ' + error.message, true);
    }
  }

  function downloadCurrentFile() {
    const blob = new Blob([contentEditor.value], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile;
    link.click();
    URL.revokeObjectURL(url);
    showToast('已导出 ' + currentFile);
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

  contentEditor.addEventListener('input', () => {
    contentCache[currentFile] = contentEditor.value;
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
