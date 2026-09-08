import React, { useEffect, useMemo, useRef, useState } from 'react';

const PREVIEW_KEY = 'hooxi:preview:data';
const DRAFT_KEY = 'hooxi:editor:home-draft:v1';
const MAX_HISTORY = 60;

const HOME_MODULES = [
  {
    id: 'hero',
    label: '主视觉 / Hero',
    description: '首页首屏主标题、简介与主视觉图片。',
    selector: '.hero',
    layoutSelector: '.hero-copy',
    target: '#heroTitle',
    fields: [
      { key: 'title', label: '主标题', path: 'archive.site.pages.home.hero.title', kind: 'textarea', bridgeId: 'site.page.home.hero.title' },
      { key: 'intro', label: '简介', path: 'archive.site.pages.home.hero.intro', kind: 'textarea', bridgeId: 'site.page.home.hero.intro' },
      { key: 'eyebrow', label: '眉题', path: 'archive.site.pages.home.hero.eyebrow', bridgeId: 'site.page.home.hero.eyebrow' },
      { key: 'image', label: '主视觉图片', path: 'archive.site.pages.home.hero.image', kind: 'image', bridgeId: 'site.page.home.hero.image' }
    ]
  },
  {
    id: 'finder',
    label: '直接查档',
    description: '首页的主线、代理人与搜索入口。',
    selector: '#finder',
    target: '#finderTitle',
    fields: [
      { key: 'title', label: '模块标题', path: 'overrides.finder.title', selector: '#finderTitle', defaultValue: '直接查档' },
      { key: 'intro', label: '模块说明', path: 'overrides.finder.intro', selector: '#finder .section-note', defaultValue: '按剧情、代理人或名字进入正式档案。' }
    ]
  },
  {
    id: 'factions',
    label: '阵营频道',
    description: '首页阵营频道模块。',
    selector: '#featured-agents',
    target: '#agentsTitle',
    fields: [
      { key: 'title', label: '模块标题', path: 'overrides.factions.title', selector: '#agentsTitle', defaultValue: '阵营频道' },
      { key: 'intro', label: '模块说明', path: 'overrides.factions.intro', selector: '#featured-agents .section-note', defaultValue: '选台查看所属代理人档案；浏览全部阵营。' }
    ]
  },
  {
    id: 'reels',
    label: '档案卷轴',
    description: '主线、活动与幕后档案预览。',
    selector: '#archive-reels',
    target: '#reelsTitle',
    fields: [
      { key: 'title', label: '模块标题', path: 'overrides.reels.title', selector: '#reelsTitle', defaultValue: '档案卷轴' },
      { key: 'intro', label: '模块说明', path: 'overrides.reels.intro', selector: '#archive-reels .section-note', defaultValue: '主线、活动与幕后各取近期记录，完整筛选仍在正式页。' }
    ]
  },
  {
    id: 'wiki',
    label: '角色 · 维基视图',
    description: '首页沉浸式角色维基展示区。',
    selector: '#officialWiki',
    target: '#owTitle',
    fields: [
      { key: 'title', label: '模块标题', path: 'overrides.wiki.title', selector: '#owTitle', defaultValue: '角色 · 维基视图' },
      { key: 'intro', label: '模块说明', path: 'overrides.wiki.intro', selector: '#officialWiki .ow-head-note', defaultValue: '模仿米哈游官方维基全屏风格：左侧代理人列表、右侧角色详情。' }
    ]
  },
  {
    id: 'sources',
    label: '来源与边界',
    description: '首页来源说明与版权边界。',
    selector: '#sources',
    target: '#sourcesTitle',
    fields: [
      { key: 'title', label: '模块标题', path: 'overrides.sources.title', selector: '#sourcesTitle', defaultValue: '来源与边界' },
      { key: 'intro', label: '模块说明', path: 'overrides.sources.intro', selector: '#sources .about-intro', defaultValue: '正式档案可搜索、可分享；录像店只是可跳过的观看入口。' }
    ]
  }
];

const FALLBACK_ARCHIVE = {
  site: {
    pages: {
      home: {
        hero: {
          eyebrow: '',
          title: '绝区零剧情档案',
          intro: '按版本补剧情，按代理人追关联。',
          image: ''
        },
        components: []
      }
    }
  }
};

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function readPath(source, path) {
  return path.split('.').reduce((value, key) => value?.[key], source);
}

function writePath(source, path, value) {
  const parts = path.split('.');
  let target = source;
  while (parts.length > 1) {
    const key = parts.shift();
    target[key] ??= /^\d+$/.test(parts[0]) ? [] : {};
    target = target[key];
  }
  target[parts[0]] = value;
}

function ensureArchiveShape(source) {
  const archive = source && typeof source === 'object' ? source : clone(FALLBACK_ARCHIVE);
  archive.site ??= {};
  archive.site.pages ??= {};
  archive.site.pages.home ??= {};
  archive.site.pages.home.hero ??= {};
  archive.site.pages.home.components = Array.isArray(archive.site.pages.home.components)
    ? archive.site.pages.home.components
    : [];
  const hero = archive.site.pages.home.hero;
  hero.eyebrow ??= '';
  hero.title ??= FALLBACK_ARCHIVE.site.pages.home.hero.title;
  hero.intro ??= FALLBACK_ARCHIVE.site.pages.home.hero.intro;
  hero.image ??= '';
  return archive;
}

function parseArchiveSource(source) {
  const start = source.indexOf('=');
  const end = source.lastIndexOf(';');
  if (start < 0 || end <= start) throw new Error('data.js 格式不正确');
  return JSON.parse(source.slice(start + 1, end));
}

function selectorEscape(value) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
}

function currentBreakpoint(frame) {
  const width = frame?.innerWidth || window.innerWidth;
  return width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
}

function moduleFieldsFor(module) {
  return module?.fields || [];
}

function componentModuleFor(component, index) {
  const componentId = String(component.id || `component-${index}`);
  const isImage = component.type === 'image';
  const isLink = component.type === 'link';
  return {
    id: `component:${componentId}`,
    componentId,
    label: `${isImage ? '图片' : isLink ? '链接' : '文字'} · ${componentId}`,
    description: '首页自由组件，字段会同步到真实预览。',
    selector: `[data-editor-id="component.${selectorEscape(componentId)}"]`,
    layoutSelector: `[data-component-id="${selectorEscape(componentId)}"]`,
    target: `[data-editor-id="component.${selectorEscape(componentId)}"]`,
    fields: isImage
      ? [
          { key: 'src', label: '图片地址', path: `archive.site.pages.home.components.${index}.src`, kind: 'image', bridgeId: `component.${componentId}` },
          { key: 'alt', label: '替代说明', path: `archive.site.pages.home.components.${index}.alt`, bridgeId: `component.${componentId}` }
        ]
      : isLink
        ? [{ key: 'text', label: '链接文字', path: `archive.site.pages.home.components.${index}.text`, kind: 'textarea', bridgeId: `component.${componentId}` }]
        : [{ key: 'text', label: '文字内容', path: `archive.site.pages.home.components.${index}.text`, kind: 'textarea', bridgeId: `component.${componentId}` }]
  };
}

function modulesForModel(source) {
  const components = source?.archive?.site?.pages?.home?.components || [];
  return [...HOME_MODULES, ...components.map(componentModuleFor)];
}

export default function EditReact() {
  const iframeRef = useRef(null);
  const modelRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const [model, setModel] = useState(null);
  const [selected, setSelected] = useState(null);
  const [previewNonce, setPreviewNonce] = useState(() => Date.now());
  const [previewReady, setPreviewReady] = useState(false);
  const previewReadyRef = useRef(false);
  const storedArchiveRef = useRef(false);
  const storedHeroFieldsRef = useRef(new Set());
  const fallbackArchiveRef = useRef(false);
  const previewHeroCapturedRef = useRef(false);
  const modulesRef = useRef([]);
  const [status, setStatus] = useState('正在准备首页预览…');
  const [loadingError, setLoadingError] = useState('');
  const [historyState, setHistoryState] = useState({ index: -1, length: 0 });

  const modules = useMemo(() => modulesForModel(model), [model]);
  modulesRef.current = modules;

  const previewSrc = `./index.html?editorPreview=1&v=${previewNonce}`;

  function setModelValue(next) {
    modelRef.current = next;
    setModel(next);
  }

  function writePreviewData(archive) {
    try {
      localStorage.setItem(PREVIEW_KEY, JSON.stringify(archive));
      return true;
    } catch (error) {
      setStatus(`本地预览数据保存失败：${error.message}`);
      return false;
    }
  }

  function saveHistory(next) {
    const snapshot = clone(next);
    const history = historyRef.current.slice(0, historyIndexRef.current + 1);
    history.push(snapshot);
    if (history.length > MAX_HISTORY) history.shift();
    historyRef.current = history;
    historyIndexRef.current = history.length - 1;
    setHistoryState({ index: historyIndexRef.current, length: history.length });
  }

  function commitModel(mutator, message = '草稿已更新') {
    const current = modelRef.current;
    if (!current) return null;
    const next = clone(current);
    mutator(next);
    setModelValue(next);
    saveHistory(next);
    writePreviewData(next.archive);
    setStatus(message);
    return next;
  }

  function postToPreview(type, payload = {}) {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) return;
    const targetOrigin = window.location.origin === 'null' ? '*' : window.location.origin;
    frame.postMessage({ channel: 'hooxi.editor', version: 1, type, payload }, targetOrigin);
  }

  function previewDocument() {
    try {
      return iframeRef.current?.contentDocument || null;
    } catch {
      return null;
    }
  }

  function queryPreview(selector) {
    const documentNode = previewDocument();
    if (!documentNode || !selector) return null;
    try {
      return documentNode.querySelector(selector);
    } catch {
      return null;
    }
  }

  function moduleForPath(path) {
    if (path.startsWith('archive.site.pages.home.hero.')) return HOME_MODULES[0];
    if (path.startsWith('overrides.')) return HOME_MODULES.find((module) => path.startsWith(`overrides.${module.id}.`));
    if (path.startsWith('archive.site.pages.home.components.')) {
      const index = Number(path.split('.')[5]);
      return modulesRef.current.find((module) => module.componentId === modelRef.current?.archive?.site?.pages?.home?.components?.[index]?.id);
    }
    return null;
  }

  function fieldForPayload(module, payload) {
    const fields = moduleFieldsFor(module);
    return fields.find((field) => field.key === payload?.field)
      || fields.find((field) => field.bridgeId === payload?.id)
      || fields[0]
      || null;
  }

  function fieldPathFromPayload(payload) {
    if (!payload?.id) return '';
    if (payload.id.startsWith('site.page.home.hero.')) {
      return `archive.site.pages.home.hero.${payload.field || payload.id.slice('site.page.home.hero.'.length)}`;
    }
    if (payload.id.startsWith('component.')) {
      const componentId = payload.id.slice('component.'.length).split('.')[0];
      const index = (modelRef.current?.archive?.site?.pages?.home?.components || []).findIndex((component) => String(component.id) === componentId);
      if (index < 0) return '';
      const component = modelRef.current.archive.site.pages.home.components[index];
      const field = payload.field || (component.type === 'image' ? 'src' : 'text');
      return `archive.site.pages.home.components.${index}.${field}`;
    }
    return '';
  }

  function moduleForElement(element) {
    if (!element) return null;
    const componentId = element.dataset?.componentId || element.dataset?.editorId?.startsWith('component.') && element.dataset.editorId.slice('component.'.length).split('.')[0];
    if (componentId) return modulesRef.current.find((module) => module.componentId === componentId) || null;
    return modulesRef.current.find((module) => {
      try {
        return element.closest(module.selector);
      } catch {
        return false;
      }
    }) || null;
  }

  function selectModule(module, fieldKey) {
    if (!module) return;
    const field = module.fields.find((item) => item.key === fieldKey) || module.fields[0];
    setSelected({ moduleId: module.id, fieldKey: field?.key || '' });
    postToPreview('CLEAR_SELECTION');
    setStatus(`已选择 ${module.label}`);
  }

  function selectFromPayload(payload) {
    const path = fieldPathFromPayload(payload);
    const module = moduleForPath(path) || moduleForElement(queryPreview(payload?.id ? `[data-editor-id=\"${selectorEscape(payload.id)}\"]` : ''));
    if (!module) return;
    const field = fieldForPayload(module, payload);
    setSelected({ moduleId: module.id, fieldKey: field?.key || '' });
    setStatus(`已选择 ${payload.label || module.label}`);
  }

  function bindModuleClickBridge() {
    const documentNode = previewDocument();
    if (!documentNode || documentNode.documentElement.dataset.editorModuleBridge === '1') return;
    documentNode.documentElement.dataset.editorModuleBridge = '1';
    documentNode.addEventListener('click', (event) => {
      const module = modulesRef.current.find((item) => {
        try {
          return event.target.closest(item.selector);
        } catch {
          return false;
        }
      });
      if (!module) return;
      event.preventDefault();
      event.stopPropagation();
      selectModule(module);
    }, true);
  }

  function applyText(selector, value) {
    const element = queryPreview(selector);
    if (element) element.textContent = value ?? '';
  }

  function applyImage(selector, value) {
    const element = queryPreview(selector);
    if (element && element.tagName === 'IMG') element.src = value || '';
  }

  function applyFieldToPreview(field, module, value) {
    if (!field || !module) return;
    if (field.selector) {
      if (field.kind === 'image') applyImage(field.selector, value);
      else applyText(field.selector, value);
      return;
    }
    if (module.id === 'hero') {
      if (field.key === 'title') applyText('#heroTitle', value);
      if (field.key === 'intro') applyText('#heroIntro', value);
      if (field.key === 'eyebrow') applyText('.hero .eyebrow', value);
      if (field.key === 'image') applyImage('#heroNear', value);
      return;
    }
    if (module.componentId) {
      const target = queryPreview(module.target);
      if (!target) return;
      if (field.key === 'src') applyImage(module.target, value);
      else target.textContent = value ?? '';
    }
  }

  function applyPreviewModel(nextModel) {
    if (!previewReadyRef.current || !nextModel) return;
    const currentModules = modulesForModel(nextModel);
    modulesRef.current = currentModules;
    currentModules.forEach((module) => {
      module.fields.forEach((field) => {
        const value = readPath(nextModel, field.path) ?? field.defaultValue;
        // 空值不回写，避免用未填写的草稿字段清空真实首页内容。
        if (value === undefined || value === null || value === '') return;
        applyFieldToPreview(field, module, value);
      });
    });
    applyLayouts(nextModel.layouts);
  }

  function syncPreviewModel(nextModel) {
    if (!previewReadyRef.current || !nextModel) return;
    const currentModules = modulesForModel(nextModel);
    modulesRef.current = currentModules;
    currentModules.forEach((module) => {
      module.fields.forEach((field) => {
        const value = readPath(nextModel, field.path);
        if (value === undefined) return;
        applyFieldToPreview(field, module, value);
        postToPreview('SET_FIELD', {
          id: field.bridgeId || `home.module.${module.id}.${field.key}`,
          bind: field.path,
          field: field.key,
          value
        });
      });
    });
    applyLayouts(nextModel.layouts);
    const frame = iframeRef.current?.contentWindow;
    const breakpoint = currentBreakpoint(frame);
    Object.entries(nextModel.layouts?.[breakpoint] || {}).forEach(([key, layout]) => {
      applyLayoutToElement(queryPreview(key), layout);
      postToPreview('SET_LAYOUT', { key, breakpoint, layout });
    });
  }

  function capturePreviewHero() {
    if (previewHeroCapturedRef.current || !modelRef.current) return modelRef.current;
    const documentNode = previewDocument();
    if (!documentNode) return modelRef.current;
    const hero = modelRef.current.archive?.site?.pages?.home?.hero;
    if (!hero) return modelRef.current;
    const runtime = {
      title: documentNode.querySelector('#heroTitle')?.textContent || '',
      intro: documentNode.querySelector('#heroIntro')?.textContent || '',
      eyebrow: documentNode.querySelector('.hero .eyebrow')?.textContent || '',
      image: documentNode.querySelector('#heroNear')?.src || ''
    };
    const next = clone(modelRef.current);
    const replaceFallback = fallbackArchiveRef.current && !storedArchiveRef.current;
    let changed = false;
    Object.entries(runtime).forEach(([key, value]) => {
      if (!String(value).trim()) return;
      const shouldCapture = replaceFallback
        || (storedArchiveRef.current
          ? !storedHeroFieldsRef.current.has(key)
          : !String(hero[key] || '').trim());
      if (shouldCapture) {
        next.archive.site.pages.home.hero[key] = value;
        changed = true;
      }
    });
    previewHeroCapturedRef.current = true;
    if (!changed) return modelRef.current;
    modelRef.current = next;
    setModel(next);
    if (historyRef.current.length) historyRef.current[0] = clone(next);
    writePreviewData(next.archive);
    return next;
  }

  function layoutTarget(module) {
    return queryPreview(module?.layoutSelector || module?.selector);
  }

  function layoutKey(module) {
    const element = layoutTarget(module);
    if (!element) return module?.layoutSelector || module?.selector || '';
    if (module.componentId) return `[data-component-id="${selectorEscape(module.componentId)}"]`;
    if (element.id) return `#${selectorEscape(element.id)}`;
    if (element.dataset.layoutId) return `[data-layout-id="${selectorEscape(element.dataset.layoutId)}"]`;
    return module.layoutSelector || module.selector || '';
  }

  function applyLayoutToElement(element, value) {
    if (!element || !value) return;
    element.style.setProperty('--layout-x', `${Number(value.x) || 0}px`);
    element.style.setProperty('--layout-y', `${Number(value.y) || 0}px`);
    element.style.setProperty('--layout-w', value.w ? `${Number(value.w)}px` : '');
    element.style.setProperty('--layout-z', value.z ?? '');
    element.classList.add('layout-custom');
  }

  function applyLayouts(layouts = {}) {
    const frame = iframeRef.current?.contentWindow;
    if (frame?.hooxiLayout?.setData) {
      try {
        frame.hooxiLayout.setData(layouts || {});
      } catch {
        // 兼容未加载完成的旧页面桥接。
      }
    }
    const values = layouts?.[currentBreakpoint(frame)] || {};
    Object.entries(values).forEach(([key, value]) => applyLayoutToElement(queryPreview(key), value));
  }

  function layoutValue(module) {
    const frame = iframeRef.current?.contentWindow;
    const key = layoutKey(module);
    const saved = model?.layouts?.[currentBreakpoint(frame)]?.[key];
    if (saved) return saved;
    const element = layoutTarget(module);
    return { x: 0, y: 0, w: Math.round(element?.getBoundingClientRect?.().width || 0), z: 0 };
  }

  function updateField(module, field, value) {
    const next = commitModel((draft) => writePath(draft, field.path, value), '字段已实时同步到预览');
    if (!next) return;
    applyFieldToPreview(field, module, value);
    postToPreview('SET_FIELD', {
      id: field.bridgeId || `home.module.${module.id}.${field.key}`,
      bind: field.path,
      field: field.key,
      value
    });
  }

  function updateFieldFromPreview(payload = {}) {
    const path = fieldPathFromPayload(payload) || payload.bind;
    if (!path) return;
    const module = moduleForPath(path) || moduleForElement(queryPreview(payload.id ? `[data-editor-id="${selectorEscape(payload.id)}"]` : ''));
    if (!module) return;
    const field = fieldForPayload(module, { ...payload, field: payload.field || path.split('.').pop() });
    if (!field) return;
    const value = payload.value ?? '';
    const next = commitModel((draft) => writePath(draft, field.path, value), 'iframe 字段已同步到草稿');
    if (!next) return;
    setSelected({ moduleId: module.id, fieldKey: field.key });
    applyFieldToPreview(field, module, value);
  }

  function handleImageUpload(module, field, event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField(module, field, String(reader.result || ''));
    reader.onerror = () => setStatus('图片读取失败，请重试');
    reader.readAsDataURL(file);
  }

  function updateLayout(module, property, rawValue) {
    const key = layoutKey(module);
    if (!key) {
      setStatus('当前模块还没有可用的布局标识');
      return;
    }
    const frame = iframeRef.current?.contentWindow;
    const breakpoint = currentBreakpoint(frame);
    const current = layoutValue(module);
    const value = { ...current, [property]: Number(rawValue) || 0 };
    const next = commitModel((draft) => {
      draft.layouts ??= {};
      draft.layouts[breakpoint] ??= {};
      draft.layouts[breakpoint][key] = value;
    }, '布局已实时同步到预览');
    if (!next) return;
    applyLayoutToElement(layoutTarget(module), value);
    postToPreview('SET_LAYOUT', { id: module.id, key, breakpoint, layout: value });
  }

  function saveDraft() {
    if (!modelRef.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...modelRef.current, savedAt: Date.now() }));
      writePreviewData(modelRef.current.archive);
      setStatus('本地草稿已保存');
    } catch (error) {
      setStatus(`草稿保存失败：${error.message}`);
    }
  }

  function restoreHistory(index) {
    const snapshot = historyRef.current[index];
    if (!snapshot) return;
    const previousIndex = historyIndexRef.current;
    const next = clone(snapshot);
    historyIndexRef.current = index;
    setHistoryState({ index, length: historyRef.current.length });
    setModelValue(next);
    writePreviewData(next.archive);
    syncPreviewModel(next);
    setStatus(index < previousIndex ? '已撤销上一步修改' : '已重做修改');
  }

  function undo() {
    if (historyIndexRef.current > 0) restoreHistory(historyIndexRef.current - 1);
  }

  function redo() {
    if (historyIndexRef.current < historyRef.current.length - 1) restoreHistory(historyIndexRef.current + 1);
  }

  // 布局 key 可能是 auto-N 自动编号，导出时附带模块映射，便于按导出文件还原。
  function layoutTargetMap() {
    const map = {};
    modulesRef.current.forEach((module) => {
      const key = layoutKey(module);
      if (key) map[key] = { module: module.id, label: module.label, selector: module.layoutSelector || module.selector };
    });
    return map;
  }

  function exportDraft() {
    if (!modelRef.current) return;
    const payload = { version: 1, exportedAt: new Date().toISOString(), ...modelRef.current, layoutTargets: layoutTargetMap() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hooxi-home-editor-draft.json';
    link.click();
    URL.revokeObjectURL(url);
    setStatus('已导出首页编辑 JSON');
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let stored = null;
        try {
          stored = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
        } catch {
          stored = null;
        }
        let archive = stored?.archive || null;
        if (archive) {
          storedArchiveRef.current = true;
          const storedHero = archive.site?.pages?.home?.hero || {};
          Object.keys(storedHero).forEach((key) => {
            if (String(storedHero[key] || '').trim()) storedHeroFieldsRef.current.add(key);
          });
        }
        if (!archive) {
          try {
            const preview = JSON.parse(localStorage.getItem(PREVIEW_KEY) || 'null');
            archive = preview || null;
            if (archive) {
              storedArchiveRef.current = true;
              const storedHero = archive.site?.pages?.home?.hero || {};
              Object.keys(storedHero).forEach((key) => {
                if (String(storedHero[key] || '').trim()) storedHeroFieldsRef.current.add(key);
              });
            }
          } catch {
            archive = null;
          }
        }
        if (!archive) {
          const response = await fetch('./data.js', { cache: 'no-store' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          archive = parseArchiveSource(await response.text());
          fallbackArchiveRef.current = !archive?.site?.pages?.home?.hero;
        }
        if (cancelled) return;
        const next = {
          archive: ensureArchiveShape(clone(archive)),
          layouts: stored?.layouts && typeof stored.layouts === 'object' ? stored.layouts : {},
          overrides: stored?.overrides && typeof stored.overrides === 'object' ? stored.overrides : {}
        };
        modelRef.current = next;
        historyRef.current = [clone(next)];
        historyIndexRef.current = 0;
        setHistoryState({ index: 0, length: 1 });
        setModel(next);
        writePreviewData(next.archive);
        setStatus('草稿已载入，等待真实首页预览');
      } catch (error) {
        if (!cancelled) {
          const next = { archive: clone(FALLBACK_ARCHIVE), layouts: {}, overrides: {} };
          fallbackArchiveRef.current = true;
          modelRef.current = next;
          historyRef.current = [clone(next)];
          historyIndexRef.current = 0;
          setHistoryState({ index: 0, length: 1 });
          setModel(next);
          writePreviewData(next.archive);
          setLoadingError(`无法读取 data.js：${error.message}，已使用空白首页草稿`);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (previewReadyRef.current && modelRef.current) applyPreviewModel(modelRef.current);
  }, [model, previewReady, modules]);

  useEffect(() => {
    function onMessage(event) {
      const data = event.data;
      const originMatches = window.location.origin === 'null' || event.origin === window.location.origin;
      if (!originMatches || event.source !== iframeRef.current?.contentWindow || data?.channel !== 'hooxi.editor' || data?.version !== 1) return;
      if (data.type === 'PREVIEW_READY') {
        previewReadyRef.current = true;
        setPreviewReady(true);
        bindModuleClickBridge();
        postToPreview('EDITOR_MODE', { mode: 'content' });
        const next = capturePreviewHero();
        setStatus('真实首页已连接，可点击模块进行编辑');
        window.setTimeout(() => applyPreviewModel(next), 50);
      }
      if (data.type === 'SELECT_COMPONENT') selectFromPayload(data.payload || {});
      if (data.type === 'SET_FIELD') updateFieldFromPreview(data.payload || {});
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [modules]);

  useEffect(() => {
    function onKeyDown(event) {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      }
      if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function selectedModule() {
    return modules.find((module) => module.id === selected?.moduleId) || null;
  }

  function selectedField(module) {
    return module?.fields.find((field) => field.key === selected?.fieldKey) || module?.fields[0] || null;
  }

  function fieldValue(field) {
    const value = readPath(model, field.path);
    return value === undefined || value === null ? field.defaultValue || '' : value;
  }

  function renderField(module, field) {
    const value = fieldValue(field);
    const input = field.kind === 'textarea'
      ? <textarea rows="3" value={value} onChange={(event) => updateField(module, field, event.target.value)} />
      : <input type="text" value={value} onChange={(event) => updateField(module, field, event.target.value)} />;
    return (
      <div className="visual-editor-field" key={field.key}>
        <label htmlFor={`editor-field-${module.id}-${field.key}`}>{field.label}</label>
        {React.cloneElement(input, { id: `editor-field-${module.id}-${field.key}` })}
        {field.kind === 'image' && (
          <>
            <input className="visual-editor-file" type="file" accept="image/*" onChange={(event) => handleImageUpload(module, field, event)} />
            <small>支持仓库路径、URL 或本地图片；本地图片以草稿形式保存。</small>
          </>
        )}
      </div>
    );
  }

  function renderInspector() {
    const module = selectedModule();
    if (!module) return <div className="visual-editor-empty">从左侧选择模块，或直接点击真实首页中的可编辑文字。</div>;
    const layout = layoutValue(module);
    return (
      <>
        <div className="visual-editor-inspector-head">
          <span className="visual-editor-kicker">SELECTED MODULE</span>
          <h2>{module.label}</h2>
          <p>{module.description}</p>
        </div>
        <section className="visual-editor-property-group">
          <h3>内容属性</h3>
          {module.fields.map((field) => renderField(module, field))}
        </section>
        <section className="visual-editor-property-group">
          <h3>布局（当前视口）</h3>
          <div className="visual-editor-layout-grid">
            {['x', 'y', 'w', 'z'].map((property) => (
              <label key={property}>
                <span>{property.toUpperCase()}</span>
                <input type="number" value={layout[property] ?? 0} onChange={(event) => updateLayout(module, property, event.target.value)} />
              </label>
            ))}
          </div>
          <small>修改后会立即写入 iframe 预览和本机布局草稿。</small>
        </section>
      </>
    );
  }

  if (!model) {
    return <div className="visual-editor-loading">{loadingError || '正在读取首页数据…'}</div>;
  }

  return (
    <div className="visual-editor-app">
      <header className="visual-editor-topbar">
        <div>
          <span className="visual-editor-kicker">HOOXI // EDITOR</span>
          <h1>首页可视化编辑工作台</h1>
        </div>
        <div className="visual-editor-actions">
          <span className={`visual-editor-connection ${previewReady ? 'is-ready' : ''}`}>{previewReady ? 'PREVIEW READY' : 'CONNECTING'}</span>
          <button type="button" onClick={undo} disabled={historyState.index <= 0}>撤销</button>
          <button type="button" onClick={redo} disabled={historyState.index >= historyState.length - 1}>重做</button>
          <button type="button" onClick={saveDraft}>保存草稿</button>
          <button type="button" className="is-primary" onClick={exportDraft}>导出 JSON</button>
        </div>
      </header>
      <div className="visual-editor-grid">
        <aside className="visual-editor-sidebar">
          <section className="visual-editor-list-section">
            <div className="visual-editor-section-title"><span>01</span><h2>页面</h2></div>
            <button type="button" className="visual-editor-page-item is-active" onClick={() => selectModule(HOME_MODULES[0])}>
              <strong>首页</strong><small>index.html</small>
            </button>
          </section>
          <section className="visual-editor-list-section visual-editor-module-list">
            <div className="visual-editor-section-title"><span>02</span><h2>模块</h2></div>
            {modules.map((module) => (
              <button
                type="button"
                key={module.id}
                className={`visual-editor-module-item ${selected?.moduleId === module.id ? 'is-selected' : ''}`}
                onClick={() => selectModule(module)}
              >
                <strong>{module.label}</strong>
                <small>{module.fields.length} 个可编辑字段</small>
              </button>
            ))}
          </section>
          <div className="visual-editor-sidebar-footer">{status}</div>
        </aside>
        <main className="visual-editor-preview">
          <div className="visual-editor-preview-head">
            <div><span className="visual-editor-kicker">LIVE HOMEPAGE</span><h2>真实首页预览</h2></div>
              <button type="button" onClick={() => { previewReadyRef.current = false; setPreviewReady(false); setPreviewNonce(Date.now()); setStatus('正在刷新真实首页…'); }}>刷新预览</button>
          </div>
          <div className="visual-editor-browser">
            <div className="visual-editor-browser-bar"><i /><i /><i /><span>index.html?editorPreview=1</span></div>
            <iframe
              ref={iframeRef}
              title="HOOXI 首页真实预览"
              src={previewSrc}
              onLoad={() => postToPreview('EDITOR_MODE', { mode: 'content' })}
            />
          </div>
        </main>
        <aside className="visual-editor-inspector">
          <div className="visual-editor-inspector-scroll">{renderInspector()}</div>
          <div className="visual-editor-inspector-footer">{previewReady ? '点击首页文字可定位字段；双击仍可使用 iframe 原生编辑。' : '等待 iframe 桥接就绪…'}</div>
        </aside>
      </div>
    </div>
  );
}
