const EXTERNAL_URL_PATTERN = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

export function siteUrl(value) {
  if (!value || EXTERNAL_URL_PATTERN.test(value)) return value;
  return new URL(String(value).replace(/^\/+/, ''), document.baseURI).href;
}

export function navigateSite(value) {
  const url = siteUrl(value);
  if (window.__hooxiSiteLoader?.navigate?.(url)) return true;
  window.location.assign(url);
  return true;
}

export function mountReactApp(createRoot, app) {
  const rootElement = document.getElementById('root');
  let failed = false;
  let readyFrame = 0;

  const reportError = (error) => {
    if (failed) return;
    failed = true;
    cancelAnimationFrame(readyFrame);
    delete document.documentElement.dataset.appReady;

    if (rootElement) {
      rootElement.textContent = '页面加载失败，请刷新重试。';
      rootElement.setAttribute('role', 'alert');
      Object.assign(rootElement.style, {
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        color: '#ffffff',
        background: '#0a0a0a',
        fontFamily: 'sans-serif'
      });
    }

    console.error('React 页面渲染失败', error);
    window.dispatchEvent(new CustomEvent('hooxi:app-error', {
      detail: { message: error instanceof Error ? error.message : String(error) }
    }));
  };

  try {
    if (!rootElement) throw new Error('缺少 #root 挂载节点');

    const root = createRoot(rootElement, { onUncaughtError: reportError });
    root.render(app);
    readyFrame = requestAnimationFrame(() => {
      if (failed) return;
      document.documentElement.dataset.appReady = 'true';
      window.dispatchEvent(new CustomEvent('hooxi:app-ready'));
    });
  } catch (error) {
    reportError(error);
  }
}
