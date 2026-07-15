(function () {
  'use strict';

  const EDITOR_PASSWORD = 'Hooxi777771';
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCK_MS = 10 * 60 * 1000;
  const GATE_STATE_KEY = 'hooxi:editor-gate';
  const PREVIEW_KEY = 'hooxi:preview:data';
  const GUIDE_KEY = 'hooxi:editor-guide-seen';
  const FIELD_HELP = {
    id: '稳定标识。发布后用于父级、子级和布局关联，创建后尽量不要修改。',
    title: '页面上显示的主标题。双击预览中的标题也可以直接修改。',
    summary: '内容简介或正文摘要，会显示在标题下方。支持换行，不支持 HTML。',
    label: '父级左上角的编号或短标签，例如 CHAPTER 01。',
    theme: '父级或模块的强调色。点击色块可选择颜色。',
    collapsed: '开启后，访客首次打开页面时这个父级默认收起。',
    order: '控制条目排列顺序，数字越小越靠前。',
    tag: '显示在卡片上的短标签，例如主线、活动或角色故事。',
    type: '内容分类，用于筛选和管理，不等于页面标题。',
    routeType: '主线路线图中的分支类型，用于筛选和视觉区分。',
    groupId: '选择条目属于哪个父级章节；不选择则放在未分组区域。',
    parentId: '选择另一个条目作为父条目，用于表达子集和灵感来源。',
    branchLabel: '说明这个子集与父条目的关系，例如幕后灵感、角色视角。',
    cover: '填写仓库图片路径或公开 URL。建议使用 assets/covers/xxx.webp。',
    portrait: '角色立绘路径。建议使用 assets/portraits/xxx.webp 或透明 PNG。',
    video: '填写 B 站或其他公开视频链接，访客点击后会打开视频。',
    wikiUrl: '资料来源链接，用来说明内容依据并方便后续核验。',
    version: '游戏版本号，例如 1.0、2.3。用于版本筛选。',
    chapter: '剧情章节或阶段名称，例如序章 · 第一幕。',
    faction: '页面显示的阵营或组织名称。',
    factionId: '阵营页面的稳定 ID，例如 cunning-hares；填写后标题可链接到阵营页。',
    location: '剧情发生地点或空洞区域。',
    characters: '相关角色名称，多个角色用顿号、逗号分隔。',
    relatedIds: '关联档案的 ID，多个 ID 用顿号或逗号分隔。',
    spoilerLevel: '控制该条目对访客显示的剧透提醒级别。',
    status: '资料维护状态，例如已收录、待补全、核验中。',
    src: '图片文件路径或公开 URL。仓库内图片建议放到 assets/ 下。',
    alt: '图片无法显示时的替代说明，也供读屏软件理解图片内容。',
    caption: '图片下方或角标中显示的简短说明。',
    width: '图片或模块显示宽度，单位为像素。',
    opacity: '透明度范围 0–100；100 完全不透明。',
    rotation: '顺时针旋转角度；负数会逆时针旋转。',
    showCaption: '控制是否显示图片角标文字。',
    eyebrow: '页头上方的小号英文或分类提示，用来快速说明当前页面主题。',
    intro: '页头的大段简介，会出现在页面主标题下方。'
  };
  const PAGE_OPTIONS = [
    { key: 'home', label: '首页', file: 'data.js', url: 'index.html', dataKey: 'mainline', siteKey: 'home' },
    { key: 'mainline', label: '主线剧情', file: 'data.js', url: 'mainline.html', dataKey: 'mainline' },
    { key: 'stories', label: '角色目录', file: 'data.js', url: 'stories.html', dataKey: '', siteKey: 'stories', entityType: 'faction' },
    { key: 'faction', label: '具体阵营', file: 'data.js', url: 'faction.html', dataKey: '', siteKey: 'faction', entityType: 'faction' },
    { key: 'character', label: '具体角色', file: 'data.js', url: 'character.html', dataKey: '', siteKey: 'character', entityType: 'character' },
    { key: 'behindScenes', label: '幕后 / 对谈', file: 'data.js', url: 'behind-scenes.html', dataKey: 'behindScenes' },
    { key: 'events', label: '往期活动', file: 'data.js', url: 'events.html', dataKey: 'events' },
    { key: 'wikiSample', label: 'Wiki 样板', file: 'sample', url: 'wiki-style-sample.html', dataKey: '' }
  ];
  const editablePages = PAGE_OPTIONS.filter((page) => page.dataKey);

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
  const pageTabs = $('#pageTabs');
  const previewModeTabs = $('#previewModeTabs');
  const refreshPreviewBtn = $('#refreshPreviewBtn');
  const sitePreview = $('#sitePreview');
  const previewTitle = $('#previewTitle');
  const previewUrl = $('#previewUrl');
  const selectionBreadcrumb = $('#selectionBreadcrumb');
  const editorGuide = $('#editorGuide');
  const closeGuideBtn = $('#closeGuideBtn');
  const entitySelector = $('#entitySelector');
  const entitySelectorLabel = $('#entitySelectorLabel');
  const entitySelect = $('#entitySelect');

  let currentFile = 'data.js';
  let currentPageKey = 'mainline';
  let previewMode = 'preview';
  let contentCache = {};
  let originals = {};
  let toastTimer = 0;
  let editorMode = 'visual';
  let archiveDraft = null;
  const selectedEntityIds = { faction: '', character: '' };

  function showToast(message, isError = false) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : '');
    toastTimer = window.setTimeout(() => {
      toast.className = 'toast';
    }, 3000);
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
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

  function parseAssignedObject(text, name) {
    const start = text.indexOf('=');
    const end = text.lastIndexOf(';');
    if (start === -1 || end === -1 || end <= start) throw new Error(name + ' 格式不正确');
    return JSON.parse(text.slice(start + 1, end));
  }

  function parseArchive(text) {
    return parseAssignedObject(text, 'data.js');
  }

  function mergeCatalog(data) {
    if (!window.agentCatalog) return data;
    const mergeById = (defaults, overrides) => {
      const edited = new Map((overrides || []).map((item) => [item.id, item]));
      const merged = defaults.map((item) => ({ ...item, ...(edited.get(item.id) || {}) }));
      (overrides || []).forEach((item) => { if (!defaults.some((row) => row.id === item.id)) merged.push(item); });
      return merged;
    };
    data.factions = mergeById(window.agentCatalog.factions, data.factions);
    data.characters = mergeById(window.agentCatalog.characters, data.characters);
    return data;
  }

  function archiveToText(data) {
    return 'window.archiveData=' + JSON.stringify(data, null, 2) + ';\n';
  }

  function ensureArchiveShape() {
    if (!archiveDraft) return;
    archiveDraft.factions ??= [];
    archiveDraft.characters ??= [];
    ['mainline', 'stories', 'behindScenes', 'events'].forEach((key) => {
      archiveDraft[key] = Array.isArray(archiveDraft[key]) ? archiveDraft[key] : [];
    });
    archiveDraft.site ??= {};
    archiveDraft.site.chrome ??= {
      brand: { title: 'HOOXI //', subtitle: 'ZENLESS ARCHIVE', href: 'index.html' },
      footer: { left: 'HOOXI // ZZZ STORY ARCHIVE', right: 'DATA SOURCE · MIHOYO OFFICIAL WIKI' }
    };
    archiveDraft.site.pages ??= {};
    const pageDefaults = {
      mainline: { eyebrow: '// MAINLINE STORY TIMELINE', title: '剧情主线 / 时间轴', intro: '按照绳匠的记录顺序，重新整理每一次深入空洞的行动。' },
      stories: { eyebrow: '// AGENT STORY ARCHIVE', title: '角色 / 档案', intro: '追踪代理人的个人故事、阵营关系与城市记录。' },
      faction: { eyebrow: '// FACTION ARCHIVE', title: '阵营 / 档案', intro: '阵营资料与成员记录。' },
      character: { eyebrow: '// AGENT PERSONAL ARCHIVE', title: '角色 / 档案', intro: '代理人个人资料。' },
      behindScenes: { eyebrow: '// BEHIND THE SIGNAL', title: '系列·幕后 / 对谈', intro: '收录创作幕后、访谈与特别记录。' },
      events: { eyebrow: '// EVENT ARCHIVE', title: '往期 / 活动', intro: '回看限时活动与特别主题剧情。' },
      home: { eyebrow: '// VIDEO STORY ARCHIVE · 绝区零', title: '新艾利都 / 剧情档案', intro: 'Hooxi 的绝区零剧情视频整合站。沿着代理人的记录，重新进入每一段被以太侵蚀的故事。' }
    };
    Object.entries(pageDefaults).forEach(([key, hero]) => { archiveDraft.site.pages[key] ??= { hero }; archiveDraft.site.pages[key].hero ??= hero; archiveDraft.site.pages[key].components ??= []; });
    archiveDraft.pageMeta ??= {};
    editablePages.forEach((page) => {
      archiveDraft.pageMeta[page.dataKey] ??= {};
      archiveDraft.pageMeta[page.dataKey].groups ??= [];
      archiveDraft.pageMeta[page.dataKey].decorations ??= [];
    });
  }

  function currentPage() {
    return PAGE_OPTIONS.find((page) => page.key === currentPageKey) || PAGE_OPTIONS[1];
  }

  function currentItems() {
    const page = currentPage();
    return page.dataKey ? archiveDraft?.[page.dataKey] || [] : [];
  }

  function currentMeta() {
    const page = currentPage();
    if (!page.dataKey) return { groups: [], decorations: [] };
    ensureArchiveShape();
    return archiveDraft.pageMeta[page.dataKey];
  }

  function pageStorageKey(page = currentPage()) {
    return page.dataKey === 'behindScenes' ? 'behind-scenes' : page.dataKey;
  }

  function helpMarkup(path, label) {
    const key = path.split('.').pop();
    const help = FIELD_HELP[key] || `控制“${label}”在页面中的内容或显示方式。修改后点击刷新预览查看效果。`;
    return `<span class="field-help"><button class="help-button" type="button" aria-label="查看${esc(label)}说明" aria-expanded="false">!</button><span class="tooltip" role="tooltip">${esc(help)}</span></span>`;
  }

  function field(label, path, value, type = 'text') {
    const multiline = type === 'textarea';
    const input = multiline
      ? `<textarea data-path="${esc(path)}" rows="3">${esc(value)}</textarea>`
      : `<input data-path="${esc(path)}" type="${esc(type)}" value="${esc(value)}"/>`;
    return `<label><span class="field-label">${esc(label)}${helpMarkup(path, label)}</span>${input}</label>`;
  }

  function selectField(label, path, value, options) {
    return `<label><span class="field-label">${esc(label)}${helpMarkup(path, label)}</span><select data-path="${esc(path)}">${options.map((option) => `<option value="${esc(option.value)}" ${option.value === value ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select></label>`;
  }

  function checkboxField(label, path, value) {
    return `<label class="check-row"><input data-path="${esc(path)}" type="checkbox" ${value ? 'checked' : ''}/><span class="field-label">${esc(label)}${helpMarkup(path, label)}</span></label>`;
  }

  function arrayValue(value) {
    return Array.isArray(value) ? value.join('、') : value || '';
  }

  function groupOptions(selected = '') {
    const groups = currentMeta().groups || [];
    return [{ value: '', label: '未分组' }].concat(groups.map((group) => ({ value: group.id, label: group.title || group.id })));
  }

  function itemOptions(selected = '') {
    return [{ value: '', label: '无父条目' }].concat(currentItems().map((item) => ({ value: item.id, label: item.title || item.id })));
  }

  function renderPageSelector() {
    pageTabs.innerHTML = PAGE_OPTIONS.map((page) => `<button class="page-tab ${page.key === currentPageKey ? 'active' : ''}" data-page-key="${esc(page.key)}" type="button">${esc(page.label)}</button>`).join('');
    renderEntitySelector();
  }

  function entityItems(page = currentPage()) {
    if (page.entityType === 'faction') return archiveDraft?.factions || [];
    if (page.entityType === 'character') return archiveDraft?.characters || [];
    return [];
  }

  function selectedEntity(page = currentPage()) {
    const items = entityItems(page);
    const id = selectedEntityIds[page.entityType];
    return items.find((item) => item.id === id) || items[0] || null;
  }

  function renderEntitySelector() {
    const page = currentPage();
    const show = page.key === 'faction' || page.key === 'character';
    entitySelector.classList.toggle('hidden', !show);
    if (!show) return;
    const items = entityItems(page);
    const selected = selectedEntity(page);
    if (selected) selectedEntityIds[page.entityType] = selected.id;
    entitySelectorLabel.textContent = page.entityType === 'faction' ? '选择阵营' : '选择角色';
    entitySelect.innerHTML = items.map((item) => `<option value="${esc(item.id)}" ${item.id === selected?.id ? 'selected' : ''}>${esc(item.name || item.id)}</option>`).join('');
  }

  function renderPreviewModeTabs() {
    previewModeTabs.innerHTML = `
      <button class="preview-mode-tab ${previewMode === 'preview' ? 'active' : ''}" data-preview-mode="preview" type="button">内容编辑</button>
      <button class="preview-mode-tab ${previewMode === 'layout' ? 'active' : ''}" data-preview-mode="layout" type="button">布局拖动</button>
      <button class="preview-mode-tab ${previewMode === 'interact' ? 'active' : ''}" data-preview-mode="interact" type="button">正常浏览</button>
      <button class="preview-mode-tab ${previewMode === 'mobile' ? 'active' : ''}" data-preview-mode="mobile" type="button">手机编辑</button>
    `;
  }

  function renderPageAppearance() {
    const page = currentPage();
    const siteKey = page.siteKey || page.dataKey;
    if (!siteKey || page.key === 'faction' || page.key === 'character') return '';

    const hero = archiveDraft.site.pages[siteKey]?.hero || {};
    return `<section class="visual-section"><h3>页面外观</h3><article class="visual-card compact-card">
      ${field('页头小标题', `site.pages.${siteKey}.hero.eyebrow`, hero.eyebrow)}
      ${field('页头大标题（用 / 分行）', `site.pages.${siteKey}.hero.title`, hero.title)}
      ${field('页头简介', `site.pages.${siteKey}.hero.intro`, hero.intro, 'textarea')}
    </article></section>`;
  }

  function renderGroups() {
    const page = currentPage();
    if (!page.dataKey) return '';
    const groups = currentMeta().groups || [];
    return `<section class="visual-section"><div class="section-head"><h3>父级分组</h3><button class="btn small" data-add-group type="button">新增父级</button></div>${groups.map((group, i) => `
      <article class="visual-card compact-card">
        <div class="card-head"><h4>${esc(group.title || '未命名父级')}</h4><button class="btn small ghost danger" data-remove-group="${i}" type="button">删除</button></div>
        <div class="form-grid">
          ${field('父级 ID', `pageMeta.${page.dataKey}.groups.${i}.id`, group.id)}
          ${field('父级标题', `pageMeta.${page.dataKey}.groups.${i}.title`, group.title)}
          ${field('编号 / 标签', `pageMeta.${page.dataKey}.groups.${i}.label`, group.label)}
          ${field('主题色', `pageMeta.${page.dataKey}.groups.${i}.theme`, group.theme || '#f3d33b', 'color')}
        </div>
        ${field('父级简介', `pageMeta.${page.dataKey}.groups.${i}.summary`, group.summary, 'textarea')}
        ${checkboxField('默认收纳这个父级', `pageMeta.${page.dataKey}.groups.${i}.collapsed`, group.collapsed)}
      </article>`).join('') || '<div class="empty-state">还没有父级。点击“新增父级”创建章节或栏目。</div>'}</section>`;
  }

  function renderDecorations() {
    const page = currentPage();
    if (!page.dataKey) return '';
    const decorations = currentMeta().decorations || [];
    return `<section class="visual-section"><div class="section-head"><h3>装饰图片</h3><button class="btn small" data-add-decor type="button">新增装饰图</button></div>${decorations.map((decor, i) => `
      <article class="visual-card compact-card">
        <div class="card-head"><h4>${esc(decor.alt || '装饰图片')}</h4><button class="btn small ghost danger" data-remove-decor="${i}" type="button">删除</button></div>
        <div class="form-grid">
          ${field('图片路径 / URL', `pageMeta.${page.dataKey}.decorations.${i}.src`, decor.src)}
          ${field('说明文字', `pageMeta.${page.dataKey}.decorations.${i}.alt`, decor.alt)}
          ${field('角标文字', `pageMeta.${page.dataKey}.decorations.${i}.caption`, decor.caption)}
          ${field('显示宽度', `pageMeta.${page.dataKey}.decorations.${i}.width`, decor.width || 220, 'number')}
          ${field('透明度 0-100', `pageMeta.${page.dataKey}.decorations.${i}.opacity`, decor.opacity ?? 100, 'number')}
          ${field('旋转角度', `pageMeta.${page.dataKey}.decorations.${i}.rotation`, decor.rotation || 0, 'number')}
        </div>
        ${checkboxField('显示角标', `pageMeta.${page.dataKey}.decorations.${i}.showCaption`, decor.showCaption !== false)}
      </article>`).join('') || '<div class="empty-state">还没有装饰图片。可以填写仓库图片路径或公开 URL。</div>'}</section>`;
  }

  function componentFields(component, index, pageKey) {
    const base = `site.pages.${pageKey}.components.${index}`;
    if (component.type === 'image') return `${field('图片路径 / URL', `${base}.src`, component.src)}${field('替代说明', `${base}.alt`, component.alt)}`;
    if (component.type === 'link') return `${field('链接文字', `${base}.text`, component.text)}${field('链接地址', `${base}.href`, component.href)}`;
    return field('文字内容', `${base}.text`, component.text, 'textarea');
  }

  function renderComponents() {
    const page = currentPage();
    const pageKey = page.siteKey || page.dataKey;
    if (!pageKey) return '';
    const components = archiveDraft.site.pages[pageKey].components || [];
    return `<section class="visual-section"><div class="section-head"><h3>自由组件</h3><div class="component-actions"><button class="btn small" data-add-component="text" type="button">文字</button><button class="btn small" data-add-component="image" type="button">图片</button><button class="btn small" data-add-component="link" type="button">链接</button></div></div>${components.map((component, index) => `<article class="visual-card compact-card"><div class="card-head"><h4>${esc(component.type || 'text')} · ${esc(component.id)}</h4><button class="btn small ghost danger" data-remove-component="${index}" type="button">删除</button></div>${componentFields(component, index, pageKey)}</article>`).join('') || '<div class="empty-state">还没有自由组件。内容保存在 data.js，位置在布局模式中调整。</div>'}</section>`;
  }

  function renderEntityEditor() {
    const page = currentPage();
    const entity = selectedEntity(page);
    if (!entity) return '<section class="visual-section"><div class="empty-state">暂无可编辑对象。</div></section>';
    const collection = page.entityType === 'faction' ? archiveDraft.factions : archiveDraft.characters;
    const index = collection.indexOf(entity);
    const base = `${page.entityType === 'faction' ? 'factions' : 'characters'}.${index}`;
    if (page.entityType === 'faction') return `<section class="visual-section"><h3>具体阵营</h3><article class="visual-card"><div class="card-head"><h4>${esc(entity.name)}</h4></div><div class="form-grid">${field('阵营 ID', `${base}.id`, entity.id)}${field('阵营名称', `${base}.name`, entity.name)}${field('主题色', `${base}.theme`, entity.theme || '#f3d33b', 'color')}${field('标志图片', `${base}.logo`, entity.logo)}${field('背景图片', `${base}.background`, entity.background)}${field('成员 ID，用顿号分隔', `${base}.members`, arrayValue(entity.members))}</div>${field('阵营简介', `${base}.summary`, entity.summary, 'textarea')}</article></section>`;
    return `<section class="visual-section"><h3>具体角色</h3><article class="visual-card"><div class="card-head"><h4>${esc(entity.name)}</h4></div><div class="form-grid">${field('角色 ID', `${base}.id`, entity.id)}${field('角色姓名', `${base}.name`, entity.name)}${field('所属阵营 ID', `${base}.factionId`, entity.factionId)}${field('属性', `${base}.attribute`, entity.attribute)}${field('特性', `${base}.specialty`, entity.specialty)}${field('定位', `${base}.role`, entity.role)}${field('头像路径', `${base}.avatar`, entity.avatar)}${field('近景路径', `${base}.headshot`, entity.headshot)}${field('立绘路径', `${base}.portrait`, entity.portrait)}</div>${field('角色简介', `${base}.summary`, entity.summary, 'textarea')}</article></section>`;
  }

  function renderRecords() {
    const page = currentPage();
    if (!page.dataKey) return `<section class="visual-section"><h3>${esc(page.label)}</h3><div class="empty-state">这个页面是视觉预览页，暂不绑定 data.js 表单。</div></section>`;
    const items = currentItems();
    return `<section class="visual-section"><div class="section-head"><h3>${esc(page.label)}条目</h3><button class="btn small" data-add-record type="button">新增条目</button></div>${items.map((item, i) => `
      <article class="visual-card">
        <div class="card-head"><h4>${esc(item.title || '未命名条目')}</h4><button class="btn small ghost danger" data-remove-record="${i}" type="button">删除</button></div>
        <div class="form-grid">
          ${field('排序', `${page.dataKey}.${i}.order`, item.order || i + 1, 'number')}
          ${field('标题', `${page.dataKey}.${i}.title`, item.title)}
          ${field('标签', `${page.dataKey}.${i}.tag`, item.tag)}
          ${field('类型', `${page.dataKey}.${i}.type`, item.type)}
          ${field('路线类型', `${page.dataKey}.${i}.routeType`, item.routeType)}
          ${selectField('所属父级', `${page.dataKey}.${i}.groupId`, item.groupId || '', groupOptions(item.groupId))}
          ${selectField('父条目', `${page.dataKey}.${i}.parentId`, item.parentId || '', itemOptions(item.parentId))}
          ${field('分支名称', `${page.dataKey}.${i}.branchLabel`, item.branchLabel)}
          ${field('封面图片', `${page.dataKey}.${i}.cover`, item.cover)}
          ${field('角色立绘', `${page.dataKey}.${i}.portrait`, item.portrait)}
          ${field('视频链接', `${page.dataKey}.${i}.video`, item.video)}
          ${field('资料来源', `${page.dataKey}.${i}.wikiUrl`, item.wikiUrl || item.sourceUrl)}
          ${field('版本', `${page.dataKey}.${i}.version`, item.version)}
          ${field('章节', `${page.dataKey}.${i}.chapter`, item.chapter)}
          ${field('阵营', `${page.dataKey}.${i}.faction`, item.faction)}
          ${field('阵营 ID', `${page.dataKey}.${i}.factionId`, item.factionId)}
          ${field('地点', `${page.dataKey}.${i}.location`, item.location)}
          ${field('相关角色，用顿号分隔', `${page.dataKey}.${i}.characters`, arrayValue(item.characters))}
          ${field('关联条目 ID，用顿号分隔', `${page.dataKey}.${i}.relatedIds`, arrayValue(item.relatedIds))}
          ${selectField('剧透等级', `${page.dataKey}.${i}.spoilerLevel`, item.spoilerLevel || '轻度', ['无', '轻度', '中度', '重度'].map((x) => ({ value: x, label: x })))}
          ${field('资料状态', `${page.dataKey}.${i}.status`, item.status || '已收录')}
        </div>
        ${field('简介', `${page.dataKey}.${i}.summary`, item.summary, 'textarea')}
      </article>`).join('') || '<div class="empty-state">这个页面还没有条目。点击“新增条目”创建。</div>'}</section>`;
  }

  function renderVisualEditor() {
    if (currentFile !== 'data.js' || !archiveDraft) {
      visualEditor.innerHTML = '<div class="empty-state">当前文件暂不支持可视化编辑，请使用源码编辑。</div>';
      return;
    }
    ensureArchiveShape();
    renderPageSelector();
    const page = currentPage();
    if (page.key === 'faction' || page.key === 'character') visualEditor.innerHTML = renderEntityEditor() + renderComponents();
    else if (page.key === 'stories') visualEditor.innerHTML = renderPageAppearance() + renderComponents();
    else visualEditor.innerHTML = renderPageAppearance() + renderGroups() + renderRecords() + renderDecorations() + renderComponents();
  }

  function getPath(path) {
    return path.split('.').reduce((target, key) => target?.[key], archiveDraft);
  }

  function setPath(path, value) {
    const parts = path.split('.');
    let target = archiveDraft;
    while (parts.length > 1) {
      const key = parts.shift();
      target[key] ??= /^\d+$/.test(parts[0]) ? [] : {};
      target = target[key];
    }
    target[parts[0]] = value;
    syncSourceFromVisual();
  }

  function normalizeInputValue(target) {
    if (target.type === 'checkbox') return target.checked;
    if (target.type === 'number') return Number(target.value || 0);
    if (target.dataset.path?.endsWith('.characters') || target.dataset.path?.endsWith('.relatedIds') || target.dataset.path?.endsWith('.members')) {
      return target.value.split(/[，,、]/).map((item) => item.trim()).filter(Boolean);
    }
    return target.value;
  }

  function syncSourceFromVisual() {
    if (!archiveDraft) return;
    ensureArchiveShape();
    const text = archiveToText(archiveDraft);
    contentEditor.value = text;
    contentCache[currentFile] = text;
    writePreviewDraft();
    updateDraftStatus();
  }

  function syncVisualFromSource() {
    if (currentFile !== 'data.js') {
      archiveDraft = null;
      return;
    }
    archiveDraft = mergeCatalog(parseArchive(contentEditor.value));
    ensureArchiveShape();
    renderVisualEditor();
    writePreviewDraft();
  }

  function writePreviewDraft() {
    if (!archiveDraft) return;
    localStorage.setItem(PREVIEW_KEY, JSON.stringify(archiveDraft));
  }

  function previewTargetUrl() {
    const page = currentPage();
    const params = new URLSearchParams();
    const entity = selectedEntity(page);
    if (entity && (page.key === 'faction' || page.key === 'character')) params.set('id', entity.id);
    if (previewMode === 'layout' && page.file === 'data.js') params.set('layout', '1');
    if (page.file === 'data.js') params.set('editorPreview', '1');
    params.set('v', Date.now());
    return page.url + '?' + params;
  }

  function bridgeMode() {
    if (previewMode === 'layout') return 'layout';
    if (previewMode === 'interact') return 'interact';
    return 'content';
  }

  function sendPreviewMode() {
    sitePreview.contentWindow?.postMessage({ channel: 'hooxi.editor', version: 1, type: 'EDITOR_MODE', payload: { mode: bridgeMode() } }, location.origin);
  }

  function refreshPreview() {
    writePreviewDraft();
    const page = currentPage();
    const url = previewTargetUrl();
    const suffix = previewMode === 'layout' ? '布局拖动' : previewMode === 'interact' ? '正常浏览' : '点选编辑';
    previewTitle.textContent = page.label + ' · ' + suffix;
    previewUrl.textContent = url;
    sitePreview.src = url;
    sitePreview.classList.toggle('mobile-preview', previewMode === 'mobile');
  }

  function pathForSelection(payload) {
    const page = currentPage();
    if (!payload?.id) return '';
    const siteKey = page.siteKey || page.dataKey;
    const pagePrefix = `site.page.${siteKey}.hero.`;
    const itemPrefix = `${page.dataKey}.item.`;
    const groupPrefix = `${page.dataKey}.group.`;
    if (payload.id.startsWith(pagePrefix)) return `site.pages.${siteKey}.hero.${payload.field || payload.id.slice(pagePrefix.length)}`;
    if (payload.id.startsWith('component.')) {
      const id = payload.id.slice('component.'.length).split('.')[0];
      const components = archiveDraft.site.pages[siteKey]?.components || [];
      const index = components.findIndex((component) => component.id === id);
      return index < 0 ? '' : `site.pages.${siteKey}.components.${index}.${payload.field || (components[index].type === 'image' ? 'src' : components[index].type === 'link' ? 'text' : 'text')}`;
    }
    if (payload.id.startsWith('faction.')) {
      const id = payload.id.slice('faction.'.length).split('.')[0];
      const index = archiveDraft.factions.findIndex((item) => item.id === id);
      return index < 0 ? '' : `factions.${index}.${payload.field || 'name'}`;
    }
    if (payload.id.startsWith('character.')) {
      const id = payload.id.slice('character.'.length).split('.')[0];
      const index = archiveDraft.characters.findIndex((item) => item.id === id);
      return index < 0 ? '' : `characters.${index}.${payload.field || 'name'}`;
    }
    if (page.dataKey && payload.id.startsWith(itemPrefix)) {
      const rest = payload.id.slice(itemPrefix.length);
      const item = currentItems().find((row) => rest === row.id || rest.startsWith(row.id + '.'));
      if (!item) return '';
      const index = currentItems().indexOf(item);
      return `${page.dataKey}.${index}.${payload.field || (rest.endsWith('.image') ? 'cover' : 'title')}`;
    }
    if (page.dataKey && payload.id.startsWith(groupPrefix)) {
      const rest = payload.id.slice(groupPrefix.length);
      const groups = currentMeta().groups || [];
      const group = groups.find((row) => rest === row.id || rest.startsWith(row.id + '.'));
      if (!group) return '';
      return `pageMeta.${page.dataKey}.groups.${groups.indexOf(group)}.${payload.field || 'title'}`;
    }
    return '';
  }

  function focusSelection(payload) {
    if (payload?.type === 'faction' && currentPageKey === 'stories') {
      const id = payload.id?.slice('faction.'.length).split('.')[0];
      if (archiveDraft.factions.some((item) => item.id === id)) {
        selectedEntityIds.faction = id;
        switchPage('faction');
        return;
      }
    }
    if (payload?.type === 'character' && currentPageKey === 'faction') {
      const id = payload.id?.slice('character.'.length).split('.')[0];
      if (archiveDraft.characters.some((item) => item.id === id)) {
        selectedEntityIds.character = id;
        switchPage('character');
        return;
      }
    }
    const path = pathForSelection(payload);
    const label = payload.label || payload.type || '模块';
    selectionBreadcrumb.querySelector('.selection-path').textContent = `${currentPage().label} › ${label}`;
    if (!path) return;
    const control = visualEditor.querySelector(`[data-path="${CSS.escape(path)}"]`);
    if (!control) return;
    const card = control.closest('.visual-card');
    visualEditor.querySelectorAll('.visual-card.selected-card').forEach((item) => item.classList.remove('selected-card'));
    card?.classList.add('selected-card');
    control.scrollIntoView({ behavior: 'smooth', block: 'center' });
    control.classList.add('field-selected');
    setTimeout(() => control.classList.remove('field-selected'), 1600);
  }

  function applyInlineField(payload) {
    const path = pathForSelection(payload);
    if (!path || !payload.field) return;
    setPath(path, payload.value);
    renderVisualEditor();
    focusSelection(payload);
    showToast('页面文字已同步到编辑草稿');
    setTimeout(refreshPreview, 80);
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
      ? '选页面，改文字、图片、父级和子级；右侧刷新后看真实效果。'
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

  function updatePreviewModeTabs() {
    renderPreviewModeTabs();
  }

  function updateEditorCopy() {
    currentFileLabel.textContent = currentFile;
    const page = currentPage();
    editorStatus.textContent = currentFile === 'data.js'
      ? `正在编辑：${page.label}。修改后点“刷新预览”查看真实页面。`
      : 'layout-data.js 暂无可视化结构，请在源码模式编辑；布局拖动可在右侧预览中完成。';
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
      const text = forceFetch || contentCache[currentFile] === undefined ? await fetchFile(currentFile) : contentCache[currentFile];
      contentCache[currentFile] = text;
      originals[currentFile] = text;
      contentEditor.value = text;
      if (currentFile === 'data.js') archiveDraft = mergeCatalog(parseArchive(text));
      ensureArchiveShape();
      updateEditorCopy();
      updateDraftStatus();
      setEditorMode(currentFile === 'data.js' ? 'visual' : 'source');
      refreshPreview();
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
      if (file === 'data.js') archiveDraft = mergeCatalog(parseArchive(contentEditor.value));
      updateEditorCopy();
      updateDraftStatus();
      setEditorMode(file === 'data.js' ? 'visual' : 'source');
      refreshPreview();
    } else {
      loadCurrentFile(true);
    }
  }

  function switchPage(key) {
    currentPageKey = key;
    if (currentPage().file !== 'data.js') previewMode = 'preview';
    renderPageSelector();
    updatePreviewModeTabs();
    updateEditorCopy();
    if (editorMode === 'visual') renderVisualEditor();
    refreshPreview();
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
    if (currentFile === 'data.js') archiveDraft = mergeCatalog(parseArchive(saved));
    updateDraftStatus();
    setEditorMode(currentFile === 'data.js' ? 'visual' : 'source');
    refreshPreview();
    showToast('已加载 ' + currentFile + ' 的本地草稿');
  }

  async function revertToLive() {
    try {
      const text = await fetchFile(currentFile);
      contentEditor.value = text;
      contentCache[currentFile] = text;
      originals[currentFile] = text;
      if (currentFile === 'data.js') archiveDraft = mergeCatalog(parseArchive(text));
      localStorage.removeItem(draftKey(currentFile));
      updateDraftStatus();
      updateEditorCopy();
      setEditorMode(currentFile === 'data.js' ? 'visual' : 'source');
      refreshPreview();
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

  function addGroup() {
    const meta = currentMeta();
    const n = meta.groups.length + 1;
    meta.groups.push({ id: 'group-' + Date.now(), title: '新父级', label: 'FILE ' + String(n).padStart(2, '0'), summary: '填写这个父级的说明。', theme: '#f3d33b', collapsed: false });
    renderVisualEditor();
    syncSourceFromVisual();
  }

  function removeGroup(index) {
    const meta = currentMeta();
    const removed = meta.groups.splice(index, 1)[0];
    currentItems().forEach((item) => {
      if (item.groupId === removed?.id) item.groupId = '';
    });
    renderVisualEditor();
    syncSourceFromVisual();
  }

  function addRecord() {
    const page = currentPage();
    const items = currentItems();
    items.push({ id: page.dataKey + '-' + Date.now(), order: items.length + 1, title: '新条目', tag: '新节点', summary: '填写简介。', video: '', wikiUrl: 'https://baike.mihoyo.com/zzz/wiki/', cover: '', portrait: '', characters: [], relatedIds: [], groupId: '', parentId: '', branchLabel: '', status: '已收录', spoilerLevel: '轻度' });
    renderVisualEditor();
    syncSourceFromVisual();
  }

  function removeRecord(index) {
    currentItems().splice(index, 1);
    renderVisualEditor();
    syncSourceFromVisual();
  }

  function addDecor() {
    const meta = currentMeta();
    meta.decorations.push({ id: 'decor-' + Date.now(), src: '', alt: '装饰图片', caption: 'VISUAL', tone: 'yellow', width: 220, opacity: 100, rotation: 0, showCaption: true });
    renderVisualEditor();
    syncSourceFromVisual();
  }

  function removeDecor(index) {
    currentMeta().decorations.splice(index, 1);
    renderVisualEditor();
    syncSourceFromVisual();
  }

  function addComponent(type) {
    const pageKey = currentPage().siteKey || currentPage().dataKey;
    const components = archiveDraft.site.pages[pageKey].components;
    const id = 'component-' + Date.now();
    components.push(type === 'image' ? { id, type, src: '', alt: '自由图片' } : type === 'link' ? { id, type, text: '新链接', href: '#' } : { id, type: 'text', text: '新文字组件' });
    renderVisualEditor();
    syncSourceFromVisual();
  }

  function removeComponent(index) {
    const pageKey = currentPage().siteKey || currentPage().dataKey;
    archiveDraft.site.pages[pageKey].components.splice(index, 1);
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
    renderPageSelector();
    updatePreviewModeTabs();
    if (!localStorage.getItem(GUIDE_KEY)) editorGuide?.showModal();
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
  refreshPreviewBtn.addEventListener('click', refreshPreview);
  sitePreview.addEventListener('load', () => setTimeout(sendPreviewMode, 80));
  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || event.source !== sitePreview.contentWindow || event.data?.channel !== 'hooxi.editor' || event.data?.version !== 1) return;
    if (event.data.type === 'PREVIEW_READY') sendPreviewMode();
    if (event.data.type === 'SELECT_COMPONENT') focusSelection(event.data.payload);
    if (event.data.type === 'SET_FIELD') applyInlineField(event.data.payload);
  });
  if (localStorage.getItem(GUIDE_KEY)) editorGuide?.close();
  closeGuideBtn?.addEventListener('click', () => localStorage.setItem(GUIDE_KEY, '1'));

  pageTabs.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-page-key]');
    if (!tab) return;
    switchPage(tab.dataset.pageKey);
  });

  previewModeTabs.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-preview-mode]');
    if (!tab) return;
    previewMode = tab.dataset.previewMode;
    updatePreviewModeTabs();
    refreshPreview();
  });

  entitySelect.addEventListener('change', () => {
    selectedEntityIds[currentPage().entityType] = entitySelect.value;
    renderVisualEditor();
    refreshPreview();
  });

  document.querySelectorAll('.file-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchFile(tab.dataset.file));
  });

  document.querySelectorAll('.mode-tab').forEach((tab) => {
    tab.addEventListener('click', () => setEditorMode(tab.dataset.mode));
  });

  visualEditor.addEventListener('input', (event) => {
    const target = event.target;
    if (!target.dataset.path) return;
    setPath(target.dataset.path, normalizeInputValue(target));
    const title = target.closest('.visual-card')?.querySelector('h4');
    if (title && (target.dataset.path.endsWith('.title') || target.dataset.path.endsWith('.alt'))) title.textContent = target.value || '未命名';
  });

  visualEditor.addEventListener('change', (event) => {
    const target = event.target;
    if (!target.dataset.path) return;
    setPath(target.dataset.path, normalizeInputValue(target));
  });

  visualEditor.addEventListener('click', (event) => {
    const helpButton = event.target.closest('.help-button');
    if (helpButton) {
      const box = helpButton.closest('.field-help');
      const open = !box.classList.contains('is-open');
      visualEditor.querySelectorAll('.field-help.is-open').forEach((item) => { item.classList.remove('is-open'); item.querySelector('.help-button')?.setAttribute('aria-expanded', 'false'); });
      box.classList.toggle('is-open', open);
      helpButton.setAttribute('aria-expanded', String(open));
      return;
    }
    if (event.target.closest('[data-add-group]')) return addGroup();
    const removeGroupButton = event.target.closest('[data-remove-group]');
    if (removeGroupButton) return removeGroup(Number(removeGroupButton.dataset.removeGroup));
    if (event.target.closest('[data-add-record]')) return addRecord();
    const removeRecordButton = event.target.closest('[data-remove-record]');
    if (removeRecordButton) return removeRecord(Number(removeRecordButton.dataset.removeRecord));
    if (event.target.closest('[data-add-decor]')) return addDecor();
    const removeDecorButton = event.target.closest('[data-remove-decor]');
    if (removeDecorButton) return removeDecor(Number(removeDecorButton.dataset.removeDecor));
    const addComponentButton = event.target.closest('[data-add-component]');
    if (addComponentButton) return addComponent(addComponentButton.dataset.addComponent);
    const removeComponentButton = event.target.closest('[data-remove-component]');
    if (removeComponentButton) return removeComponent(Number(removeComponentButton.dataset.removeComponent));
  });

  contentEditor.addEventListener('input', () => {
    contentCache[currentFile] = contentEditor.value;
    if (editorMode === 'source' && currentFile === 'data.js') {
      try {
        archiveDraft = mergeCatalog(parseArchive(contentEditor.value));
        ensureArchiveShape();
        writePreviewDraft();
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

  updateGateLock();
  lockEditor();
})();
