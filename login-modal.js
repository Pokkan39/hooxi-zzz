(function () {
  'use strict';

  // Auto-detect: same origin as page = relative, else use localhost:3001
  const API_BASE = location.hostname === 'localhost' && location.port === '3001' ? '' : 'http://localhost:3001';

  const entry = document.getElementById('adminEntry');
  const modal = document.getElementById('loginModal');
  const form = document.getElementById('loginModalForm');
  const idInput = document.getElementById('modalLoginId');
  const pwInput = document.getElementById('modalLoginPassword');
  const errorEl = document.getElementById('modalLoginError');
  const closeBtn = document.getElementById('modalLoginClose');

  if (!entry || !modal) return;

  // Open modal
  entry.addEventListener('click', () => {
    modal.classList.remove('hidden');
    idInput.focus();
  });

  // Close modal
  function closeModal() {
    modal.classList.add('hidden');
    errorEl.textContent = '';
    form.reset();
  }
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });

  // Login
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = idInput.value.trim();
    const password = pwInput.value;
    if (!id || !password) return;

    errorEl.textContent = '';
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.textContent = '登录中...';

    try {
      const res = await fetch(API_BASE + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'invalid_credentials') throw new Error('账号或密码错误');
        if (data.error === 'rate_limited') throw new Error('尝试过多，请稍后再试');
        if (data.error === 'forbidden') throw new Error('Origin 不匹配，请确认通过本地端口访问');
        throw new Error(data.message || '登录失败');
      }

      // Save session to localStorage so editor.html can pick it up
      localStorage.setItem('hooxi:session', JSON.stringify({
        id: data.id,
        name: data.name,
        role: data.role,
        csrfToken: data.csrfToken
      }));

      // Redirect to editor
      window.location.href = 'editor.html';
    } catch (err) {
      errorEl.textContent = err.message;
      btn.disabled = false;
      btn.textContent = '登录并进入编辑后台';
    }
  });
})();
