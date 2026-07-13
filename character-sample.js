(() => {
  const STORAGE_KEY = 'character-sample-layout-v2';
  const CANVAS_HEIGHTS = { desktop: 2600, mobile: 3300 };
  const DRAGGABLE_COMPONENT_TYPES = new Set(['shape', 'text', 'button', 'link', 'card', 'badge', 'slot', 'stage', 'image']);
  const NON_TEXT_TYPES = new Set(['card', 'stage', 'image', 'slot']);
  const teamSlotIds = ['team-slot-1', 'team-slot-2', 'team-slot-3', 'team-slot-bangboo', 'team-slot-empty'];
  const talentData = {
    basic: {
      label: '普攻',
      items: {
        'official-table': {
          name: '普通攻击：伏特速攻',
          description: '安比向前连续发动最多四段斩击与落雷。官方逐级数据（米游社安比条目）按等级 1-16 直接展示。',
          type: 'official-table',
          damageByLevel: [
            [31.2, 33.7, 113.6, 239.1],
            [34.1, 36.8, 124, 260.9],
            [37, 39.9, 134.4, 282.7],
            [39.9, 43, 144.8, 304.5],
            [42.8, 46.1, 155.2, 326.3],
            [45.7, 49.2, 165.6, 348.1],
            [48.6, 52.3, 176, 369.9],
            [51.5, 55.4, 186.4, 391.7],
            [54.4, 58.5, 196.8, 413.5],
            [57.3, 61.6, 207.2, 435.3],
            [60.2, 64.7, 217.6, 457.1],
            [63.1, 67.8, 228, 478.9],
            [66, 70.9, 238.4, 500.7],
            [68.9, 74, 248.8, 522.5],
            [71.8, 77.1, 259.2, 544.3],
            [74.7, 80.2, 269.6, 566.1]
          ],
          dazeByLevel: [
            [15.6, 28.7, 89.6, 187.4],
            [16.4, 30.1, 93.7, 196],
            [17.2, 31.5, 97.8, 204.6],
            [18, 32.9, 101.9, 213.2],
            [18.8, 34.3, 106, 221.8],
            [19.6, 35.7, 110.1, 230.4],
            [20.4, 37.1, 114.2, 239],
            [21.2, 38.5, 118.3, 247.6],
            [22, 39.9, 122.4, 256.2],
            [22.8, 41.3, 126.5, 264.8],
            [23.6, 42.7, 130.6, 273.4],
            [24.4, 44.1, 134.7, 282],
            [25.2, 45.5, 138.8, 290.6],
            [26, 46.9, 142.9, 299.2],
            [26.8, 48.3, 147, 307.8],
            [27.6, 49.7, 151.1, 316.4]
          ]
        },
        'basic-thunder': {
          name: '普通攻击：追加落雷',
          description: '样板子项，用于展示技能切页结构；具体逐级倍率待补充官方数据。',
          type: 'placeholder'
        }
      }
    },
    dodge: {
      label: '闪避',
      items: {
        'dodge-shift': {
          name: '闪避：疾电移位',
          description: '闪避类技能展示位，当前为样板结构，等待逐项补入官方数据。',
          type: 'placeholder'
        },
        'dodge-counter': {
          name: '闪避反击：电弧回斩',
          description: '支持展示闪避反击等子技能，保留独立切页与编辑能力。',
          type: 'placeholder'
        }
      }
    },
    assist: {
      label: '支援',
      items: {
        'assist-quick': {
          name: '快速支援：交错切入',
          description: '支援类技能展示位，当前内容为样板说明。',
          type: 'placeholder'
        },
        'assist-parry': {
          name: '招架支援：极性拦截',
          description: '后续可替换为准确的招架支援与追加攻击数据。',
          type: 'placeholder'
        }
      }
    },
    special: {
      label: '特殊',
      items: {
        'special-spark': {
          name: '特殊技：电光切裂',
          description: '强化特殊技是安比积累失衡的重要手段，此处先提供展示框架。',
          type: 'placeholder'
        },
        'special-ex': {
          name: '强化特殊技：超载突进',
          description: '当前为样板说明，便于后续替换成正式逐级表。',
          type: 'placeholder'
        }
      }
    },
    chain: {
      label: '连携',
      items: {
        'chain-burst': {
          name: '连携技：雷霆合围',
          description: '连携技 / 终结技展示位，当前只保留模块结构与切换逻辑。',
          type: 'placeholder'
        }
      }
    },
    core: {
      label: '核心',
      items: {
        'core-passive': {
          name: '核心技：极性回路',
          description: '核心技通常采用等级字母或阶段描述，当前模块作为独立展示占位。',
          type: 'placeholder'
        }
      }
    }
  };

  const talentUpgradeMaterialsData = {
    1: { nextLevel: 2, official: true, items: [{ name: '基础电击芯片', amount: 2 }, { name: '丁尼', amount: 2000 }] },
    2: { nextLevel: 3, official: true, items: [{ name: '基础电击芯片', amount: 3 }, { name: '丁尼', amount: 3000 }] },
    3: { nextLevel: 4, official: true, items: [{ name: '进阶电击芯片', amount: 2 }, { name: '丁尼', amount: 6000 }] },
    4: { nextLevel: 5, official: true, items: [{ name: '进阶电击芯片', amount: 3 }, { name: '丁尼', amount: 9000 }] },
    5: { nextLevel: 6, official: true, items: [{ name: '进阶电击芯片', amount: 4 }, { name: '丁尼', amount: 12000 }] },
    6: { nextLevel: 7, official: true, items: [{ name: '进阶电击芯片', amount: 6 }, { name: '丁尼', amount: 18000 }] },
    7: { nextLevel: 8, official: true, items: [{ name: '特化电击芯片', amount: 5 }, { name: '丁尼', amount: 45000 }] },
    8: { nextLevel: 9, official: true, items: [{ name: '特化电击芯片', amount: 8 }, { name: '丁尼', amount: 67500 }] },
    9: { nextLevel: 10, official: true, items: [{ name: '特化电击芯片', amount: 10 }, { name: '丁尼', amount: 90000 }] },
    10: { nextLevel: 11, official: true, items: [{ name: '特化电击芯片', amount: 12 }, { name: '丁尼', amount: 112500 }] },
    11: { nextLevel: 12, official: true, items: [{ name: '特化电击芯片', amount: 15 }, { name: '丁尼', amount: 135000 }, { name: '「仓鼠笼」访问器', amount: 1 }] },
    12: { nextLevel: 13, official: true, note: '影画3解锁，无普通材料', items: [] },
    13: { nextLevel: 14, official: true, note: '影画3解锁，无普通材料', items: [] },
    14: { nextLevel: 15, official: true, note: '影画5解锁，无普通材料', items: [] },
    15: { nextLevel: 16, official: true, note: '影画5解锁，无普通材料', items: [] }
  };

  const DEFAULT_LAYOUT = {
    desktop: {
      'bg-accent': { x: 518, y: 78, width: 340, height: 340, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#ff9c52', text: '', href: '', visible: true },
      'bg-grid-badge': { x: 72, y: 108, width: 160, height: 160, scale: 1, rotation: -12, opacity: 0.9, z: 0, color: '#ff9c52', text: '', href: '', visible: true },
      'bg-code': { x: 655, y: 44, width: 160, height: 24, scale: 1, rotation: 0, opacity: 1, z: 1, color: '#ffffff', text: 'AGENT / 02', href: '', visible: true },
      'bg-orbit': { x: 496, y: 180, width: 372, height: 372, scale: 1, rotation: 0, opacity: 0.7, z: 0, color: '#ffffff', text: '', href: '', visible: true },
      'back-button': { x: 48, y: 44, width: 126, height: 48, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#17191b', text: '← 角色目录', href: '', visible: true },
      'hero-kicker': { x: 48, y: 134, width: 240, height: 24, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#ff9c52', text: '// AGENT DOSSIER', href: '', visible: true },
      'hero-title': { x: 48, y: 162, width: 352, height: 84, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#f7f2e8', text: '安比·德玛拉', href: '', visible: true },
      'hero-subtitle': { x: 52, y: 258, width: 286, height: 22, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#f2eee4', text: '狡兔屋 / 电属性 / 击破定位', href: '', visible: true },
      'hero-summary': { x: 52, y: 302, width: 350, height: 134, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#f2eee4', text: '以完整 Wiki 模块方式展示角色核心档案、配装建议与培养资料，适合作为独立静态样板与编辑器演示。', href: '', visible: true },
      'cta-link': { x: 52, y: 452, width: 172, height: 48, scale: 1, rotation: -1, opacity: 1, z: 5, color: '#17191b', text: '查看完整资料 ↗', href: 'https://example.com', visible: true },
      'portrait-card': { x: 476, y: 132, width: 382, height: 546, scale: 1, rotation: 0, opacity: 1, z: 4, color: '#17191b', text: '', href: '', visible: true },
      'portrait-stage': { x: 0, y: 0, width: 382, height: 500, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#17191b', text: '', href: '', visible: true },
      'faction-logo': { x: 28, y: 40, width: 240, height: 240, scale: 1, rotation: -12, opacity: 0.9, z: 0, color: '#f2eee4', text: '', href: '', visible: true },
      'portrait-image': { x: 0, y: 0, width: 382, height: 500, scale: 1, rotation: 0, opacity: 1, z: 1, color: '#ffffff', text: '', href: '', visible: true },
      'portrait-caption': { x: 0, y: 514, width: 206, height: 32, scale: 1, rotation: 0, opacity: 1, z: 1, color: '#f2eee4', text: 'LIVE PERSONNEL FEED', href: '', visible: true },
      'profile-card': { x: 48, y: 564, width: 372, height: 250, scale: 1, rotation: -1, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'battle-card': { x: 48, y: 842, width: 372, height: 232, scale: 1, rotation: 1, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'wengine-card': { x: 676, y: 716, width: 220, height: 172, scale: 1, rotation: 2, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'drive-build-card': { x: 456, y: 910, width: 440, height: 224, scale: 1, rotation: -1, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'talent-card': { x: 48, y: 1160, width: 848, height: 620, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'promotion-card': { x: 48, y: 1820, width: 848, height: 260, scale: 1, rotation: -1, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'team-card': { x: 48, y: 2120, width: 850, height: 280, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'team-slot-1': { x: 0, y: 0, width: 0, height: 0, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#17191b', text: '', href: '', visible: true },
      'team-slot-2': { x: 0, y: 0, width: 0, height: 0, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#17191b', text: '', href: '', visible: true },
      'team-slot-3': { x: 0, y: 0, width: 0, height: 0, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#17191b', text: '', href: '', visible: true },
      'team-slot-bangboo': { x: 0, y: 0, width: 0, height: 0, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#17191b', text: '', href: '', visible: true },
      'team-slot-empty': { x: 0, y: 0, width: 0, height: 0, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#17191b', text: '', href: '', visible: true }
    },
    mobile: {
      'bg-accent': { x: 118, y: 72, width: 220, height: 220, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#ff9c52', text: '', href: '', visible: true },
      'bg-grid-badge': { x: 18, y: 96, width: 104, height: 104, scale: 1, rotation: -8, opacity: 0.9, z: 0, color: '#ff9c52', text: '', href: '', visible: true },
      'bg-code': { x: 242, y: 34, width: 120, height: 24, scale: 1, rotation: 0, opacity: 1, z: 1, color: '#ffffff', text: 'AGENT / 02', href: '', visible: true },
      'bg-orbit': { x: 100, y: 150, width: 220, height: 220, scale: 1, rotation: 0, opacity: 0.6, z: 0, color: '#ffffff', text: '', href: '', visible: true },
      'back-button': { x: 18, y: 24, width: 116, height: 44, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#17191b', text: '← 角色目录', href: '', visible: true },
      'hero-kicker': { x: 18, y: 86, width: 220, height: 22, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#ff9c52', text: '// AGENT DOSSIER', href: '', visible: true },
      'hero-title': { x: 18, y: 112, width: 240, height: 74, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#f7f2e8', text: '安比·德玛拉', href: '', visible: true },
      'hero-subtitle': { x: 20, y: 196, width: 230, height: 34, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#f2eee4', text: '狡兔屋 / 电属性 / 击破定位', href: '', visible: true },
      'hero-summary': { x: 20, y: 246, width: 220, height: 126, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#f2eee4', text: '以完整 Wiki 模块方式展示角色核心档案、配装建议与培养资料，适合作为独立静态样板与编辑器演示。', href: '', visible: true },
      'cta-link': { x: 20, y: 386, width: 166, height: 46, scale: 1, rotation: -1, opacity: 1, z: 5, color: '#17191b', text: '查看完整资料 ↗', href: 'https://example.com', visible: true },
      'portrait-card': { x: 168, y: 150, width: 198, height: 346, scale: 1, rotation: 0, opacity: 1, z: 4, color: '#17191b', text: '', href: '', visible: true },
      'portrait-stage': { x: 0, y: 0, width: 198, height: 308, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#17191b', text: '', href: '', visible: true },
      'faction-logo': { x: 18, y: 20, width: 124, height: 124, scale: 1, rotation: -10, opacity: 0.85, z: 0, color: '#f2eee4', text: '', href: '', visible: true },
      'portrait-image': { x: 0, y: 0, width: 198, height: 308, scale: 1, rotation: 0, opacity: 1, z: 1, color: '#ffffff', text: '', href: '', visible: true },
      'portrait-caption': { x: 0, y: 316, width: 164, height: 28, scale: 1, rotation: 0, opacity: 1, z: 1, color: '#f2eee4', text: 'LIVE PERSONNEL FEED', href: '', visible: true },
      'profile-card': { x: 18, y: 470, width: 354, height: 218, scale: 1, rotation: -1, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'battle-card': { x: 18, y: 708, width: 354, height: 204, scale: 1, rotation: 1, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'wengine-card': { x: 18, y: 1088, width: 354, height: 136, scale: 1, rotation: 1, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'drive-build-card': { x: 18, y: 1244, width: 354, height: 288, scale: 1, rotation: -1, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'talent-card': { x: 18, y: 1560, width: 354, height: 870, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'promotion-card': { x: 18, y: 2460, width: 354, height: 360, scale: 1, rotation: -1, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'team-card': { x: 18, y: 2860, width: 354, height: 370, scale: 1, rotation: 0, opacity: 1, z: 5, color: '#17191b', text: '', href: '', visible: true },
      'team-slot-1': { x: 0, y: 0, width: 0, height: 0, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#17191b', text: '', href: '', visible: true },
      'team-slot-2': { x: 0, y: 0, width: 0, height: 0, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#17191b', text: '', href: '', visible: true },
      'team-slot-3': { x: 0, y: 0, width: 0, height: 0, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#17191b', text: '', href: '', visible: true },
      'team-slot-bangboo': { x: 0, y: 0, width: 0, height: 0, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#17191b', text: '', href: '', visible: true },
      'team-slot-empty': { x: 0, y: 0, width: 0, height: 0, scale: 1, rotation: 0, opacity: 1, z: 0, color: '#17191b', text: '', href: '', visible: true }
    }
  };

  const state = {
    layoutMode: window.matchMedia('(max-width: 760px)').matches ? 'mobile' : 'desktop',
    selectedId: '',
    drag: null,
    history: [],
    future: [],
    suppressHistory: false,
    teamSelection: 'team-slot-1',
    talent: {
      category: 'basic',
      subItem: 'official-table',
      metric: 'damage',
      level: 1
    },
    layout: loadState()
  };

  const canvas = document.querySelector('[data-role="canvas"]');
  const components = Array.from(document.querySelectorAll('[data-component-id]'));
  const componentMap = new Map(components.map((element) => [element.dataset.componentId, element]));
  const fields = new Map(Array.from(document.querySelectorAll('[data-field]')).map((input) => [input.dataset.field, input]));
  const selectedName = document.querySelector('[data-role="selected-name"]');
  const selectionIndicator = document.querySelector('[data-role="selection-indicator"]');
  const layoutIndicator = document.querySelector('[data-role="layout-indicator"]');
  const jsonBox = document.querySelector('[data-role="json-box"]');
  const layoutButton = document.querySelector('[data-action="swap-layout"]');
  const talentSubtabs = document.querySelector('[data-role="talent-subtabs"]');
  const talentName = document.querySelector('[data-role="talent-name"]');
  const talentDescription = document.querySelector('[data-role="talent-description"]');
  const talentMetricLabel = document.querySelector('[data-role="talent-metric-label"]');
  const talentDemoNote = document.querySelector('[data-role="talent-demo-note"]');
  const talentHitList = document.querySelector('[data-role="talent-hit-list"]');
  const talentLevelDisplay = document.querySelector('[data-role="talent-level-display"]');
  const talentLevelRange = document.querySelector('[data-role="talent-level-range"]');
  const talentUpgradeNote = document.querySelector('[data-role="talent-upgrade-note"]');
  const talentUpgradeMaterials = document.querySelector('[data-role="talent-upgrade-materials"]');
  const talentTotalMaterials = document.querySelector('[data-role="talent-total-materials"]');

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return clone(DEFAULT_LAYOUT);
      const parsed = JSON.parse(saved);
      return mergeLayout(clone(DEFAULT_LAYOUT), parsed);
    } catch (error) {
      return clone(DEFAULT_LAYOUT);
    }
  }

  function mergeLayout(base, extra) {
    ['desktop', 'mobile'].forEach((mode) => {
      const source = extra && extra[mode] ? extra[mode] : {};
      Object.keys(source).forEach((id) => {
        base[mode][id] = { ...(base[mode][id] || {}), ...source[id] };
      });
    });
    return base;
  }

  function currentLayout() {
    return state.layout[state.layoutMode];
  }

  function getComponentState(id) {
    return currentLayout()[id];
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.layout));
    updateJsonBox();
  }

  function pushHistory() {
    if (state.suppressHistory) return;
    state.history.push(clone(state.layout));
    if (state.history.length > 120) state.history.shift();
    state.future = [];
  }

  function setCanvasSize() {
    const mobile = state.layoutMode === 'mobile';
    canvas.style.width = mobile ? '390px' : '960px';
    canvas.style.minHeight = CANVAS_HEIGHTS[state.layoutMode] + 'px';
    canvas.style.height = CANVAS_HEIGHTS[state.layoutMode] + 'px';
    layoutIndicator.textContent = mobile ? '手机布局' : '桌面布局';
    layoutButton.textContent = mobile ? '切换桌面布局' : '切换手机布局';
  }

  function hexToRgba(hex, alpha) {
    const value = (hex || '#ffffff').replace('#', '');
    const safe = value.length === 3 ? value.split('').map((char) => char + char).join('') : value.padEnd(6, 'f').slice(0, 6);
    const r = parseInt(safe.slice(0, 2), 16);
    const g = parseInt(safe.slice(2, 4), 16);
    const b = parseInt(safe.slice(4, 6), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  }

  function canEditText(element) {
    return !NON_TEXT_TYPES.has(element.dataset.componentType);
  }

  function applyComponent(id) {
    const element = componentMap.get(id);
    const data = getComponentState(id);
    if (!element || !data) return;
    const x = Number(data.x) || 0;
    const y = Number(data.y) || 0;
    const width = Number(data.width) || element.offsetWidth || 120;
    const height = Number(data.height) || element.offsetHeight || 40;
    const scale = Number(data.scale) || 1;
    const rotation = Number(data.rotation) || 0;
    const opacity = typeof data.opacity === 'number' ? data.opacity : Number(data.opacity) || 1;
    const z = Number(data.z) || 0;
    const color = data.color || '';
    const visible = data.visible !== false;

    element.style.left = x + 'px';
    element.style.top = y + 'px';
    element.style.width = width + 'px';
    element.style.height = height + 'px';
    element.style.transform = 'scale(' + scale + ') rotate(' + rotation + 'deg)';
    element.style.opacity = String(opacity);
    element.style.zIndex = String(z);
    element.classList.toggle('is-hidden', !visible);
    element.classList.toggle('is-selected', state.selectedId === id);
    element.setAttribute('aria-selected', state.selectedId === id ? 'true' : 'false');

    if (id.startsWith('team-slot-')) {
      element.style.left = '';
      element.style.top = '';
      element.style.width = '';
      element.style.height = '';
      element.style.transform = '';
      element.style.opacity = '';
      element.style.zIndex = '';
      element.classList.toggle('is-active', state.teamSelection === id);
      element.setAttribute('aria-pressed', state.teamSelection === id ? 'true' : 'false');
    }

    if (id === 'faction-logo' && color) {
      element.style.color = hexToRgba(color, 0.18);
      element.style.borderColor = hexToRgba(color, 0.18);
      return;
    }

    if (color) {
      if (element.dataset.componentType === 'shape') {
        if (id === 'bg-grid-badge') {
          element.style.borderColor = color;
          element.style.background = 'repeating-linear-gradient(135deg, ' + hexToRgba(color, 0.18) + ' 0 10px, transparent 10px 20px)';
        } else {
          element.style.background = 'radial-gradient(circle, ' + hexToRgba(color, 0.65) + ', ' + hexToRgba(color, 0.12) + ' 55%, transparent 70%)';
        }
      } else if (id === 'bg-orbit') {
        element.style.borderColor = hexToRgba(color, 0.26);
      } else {
        element.style.color = color;
      }
    }

    if ('text' in data && data.text && canEditText(element)) {
      if (element.tagName === 'IMG') {
        element.alt = data.text;
      } else {
        element.textContent = data.text;
      }
    }

    if ('href' in data && element.hasAttribute('href')) {
      element.setAttribute('href', data.href || '#');
    }
  }

  function updateCanvasHeightByContent() {
    let maxBottom = CANVAS_HEIGHTS[state.layoutMode];
    Object.keys(currentLayout()).forEach((id) => {
      if (id.startsWith('team-slot-')) return;
      const data = getComponentState(id);
      if (!data || data.visible === false) return;
      const scale = Number(data.scale) || 1;
      const bottom = (Number(data.y) || 0) + ((Number(data.height) || 0) * scale) + 40;
      if (bottom > maxBottom) maxBottom = bottom;
    });
    canvas.style.height = Math.ceil(maxBottom) + 'px';
  }

  function applyAll() {
    setCanvasSize();
    components.forEach((element) => applyComponent(element.dataset.componentId));
    updateCanvasHeightByContent();
    updateInspector();
    renderTalent();
    saveState();
  }

  function selectComponent(id) {
    if (!componentMap.has(id)) return;
    state.selectedId = id;
    const element = componentMap.get(id);
    const label = element.dataset.name || id;
    selectedName.textContent = label;
    selectionIndicator.textContent = '已选中：' + label;
    applyAll();
  }

  function clearSelection() {
    state.selectedId = '';
    selectedName.textContent = '未选中组件';
    selectionIndicator.textContent = '未选中组件';
    applyAll();
  }

  function updateInspector() {
    const data = state.selectedId ? getComponentState(state.selectedId) : null;
    fields.forEach((input, key) => {
      if (!data) {
        if (input.type === 'checkbox') input.checked = false;
        else input.value = '';
        input.disabled = true;
        return;
      }
      input.disabled = false;
      if (key === 'visible') input.checked = data.visible !== false;
      else if (key === 'text') input.value = data.text || '';
      else if (key === 'href') input.value = data.href || '';
      else input.value = data[key] ?? '';
    });
  }

  function updateJsonBox() {
    jsonBox.value = JSON.stringify(state.layout, null, 2);
  }

  function updateField(key, rawValue) {
    if (!state.selectedId) return;
    const data = getComponentState(state.selectedId);
    if (!data) return;
    if (!state.drag) pushHistory();
    if (key === 'visible') data.visible = Boolean(rawValue);
    else if (key === 'text' || key === 'href' || key === 'color') data[key] = rawValue;
    else data[key] = Number(rawValue);
    applyAll();
  }

  function isInteractiveTarget(target) {
    return Boolean(target.closest('button, input, textarea, a, [data-talent-action], [data-talent-category], [data-talent-metric], [data-talent-subitem]'));
  }

  function shouldAllowDrag(element, target) {
    if (!element.classList.contains('component')) return false;
    if (!DRAGGABLE_COMPONENT_TYPES.has(element.dataset.componentType)) return false;
    if (element.dataset.componentType === 'slot') return false;
    if (target.closest('.team-slot')) return false;
    if (isInteractiveTarget(target) && target !== element) return false;
    return target === element || target.classList.contains('drag-handle') || target.closest('.portrait-stage') === element;
  }

  function beginDrag(event, element) {
    const id = element.dataset.componentId;
    selectComponent(id);
    const data = getComponentState(id);
    pushHistory();
    state.drag = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: data.x,
      originY: data.y
    };
    element.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!state.drag) return;
    const data = getComponentState(state.drag.id);
    if (!data) return;
    const dx = event.clientX - state.drag.startX;
    const dy = event.clientY - state.drag.startY;
    data.x = Math.round(state.drag.originX + dx);
    data.y = Math.round(state.drag.originY + dy);
    applyAll();
  }

  function endDrag(event) {
    if (!state.drag) return;
    const element = componentMap.get(state.drag.id);
    if (element && typeof event.pointerId === 'number' && element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
    state.drag = null;
    applyAll();
  }

  function nudge(dx, dy) {
    if (!state.selectedId) return;
    pushHistory();
    const data = getComponentState(state.selectedId);
    data.x += dx;
    data.y += dy;
    applyAll();
  }

  function undo() {
    if (!state.history.length) return;
    state.future.push(clone(state.layout));
    state.layout = state.history.pop();
    applyAll();
  }

  function redo() {
    if (!state.future.length) return;
    state.history.push(clone(state.layout));
    state.layout = state.future.pop();
    applyAll();
  }

  function resetLayout() {
    pushHistory();
    state.layout = clone(DEFAULT_LAYOUT);
    applyAll();
  }

  function exportJson() {
    updateJsonBox();
    jsonBox.focus();
    jsonBox.select();
  }

  function importJson() {
    try {
      const parsed = JSON.parse(jsonBox.value);
      pushHistory();
      state.layout = mergeLayout(clone(DEFAULT_LAYOUT), parsed);
      applyAll();
    } catch (error) {
      window.alert('JSON 无法解析，请检查格式。');
    }
  }

  function swapLayout() {
    state.layoutMode = state.layoutMode === 'desktop' ? 'mobile' : 'desktop';
    applyAll();
  }

  function getCurrentTalentItem() {
    const category = talentData[state.talent.category] || talentData.basic;
    return category.items[state.talent.subItem] || Object.values(category.items)[0];
  }

  function formatMaterialAmount(amount) {
    return typeof amount === 'number' ? amount.toLocaleString('zh-CN') : amount;
  }

  function renderTalentSubtabs() {
    const category = talentData[state.talent.category];
    const items = Object.entries(category.items);
    if (!category.items[state.talent.subItem]) state.talent.subItem = items[0][0];
    talentSubtabs.innerHTML = items.map(([key, item]) => {
      const active = key === state.talent.subItem;
      return '<button type="button" class="chip-button' + (active ? ' is-active' : '') + '" data-talent-subitem="' + key + '" aria-pressed="' + (active ? 'true' : 'false') + '">' + item.name + '</button>';
    }).join('');
  }

  function renderTalentMaterials() {
    const current = talentUpgradeMaterialsData[state.talent.level];
    if (!current) {
      talentUpgradeNote.textContent = 'Lv.16 已满级，无后续升级需求。';
      talentUpgradeMaterials.innerHTML = '<li>已满级</li>';
    } else {
      talentUpgradeNote.textContent = current.official
        ? 'Lv.' + state.talent.level + ' → Lv.' + current.nextLevel + '：官方升级数据'
        : 'Lv.' + state.talent.level + ' → Lv.' + current.nextLevel + '：样板数据，待补充并逐级核验。';
      if (current.note && current.items.length === 0) {
        talentUpgradeMaterials.innerHTML = '<li>' + current.note + '</li>';
      } else {
        talentUpgradeMaterials.innerHTML = current.items.map((item) => '<li>' + item.name + ' × ' + formatMaterialAmount(item.amount) + '</li>').join('');
      }
    }

    const totals = new Map();
    for (let level = 1; level < state.talent.level; level += 1) {
      const step = talentUpgradeMaterialsData[level];
      if (!step) continue;
      step.items.forEach((item) => {
        if (typeof item.amount !== 'number') {
          if (!totals.has(item.name)) totals.set(item.name, '待补充');
          return;
        }
        const previous = totals.get(item.name);
        totals.set(item.name, (typeof previous === 'number' ? previous : 0) + item.amount);
      });
    }
    if (!totals.size) {
      talentTotalMaterials.innerHTML = '<li>当前等级无累计消耗</li>';
      return;
    }
    talentTotalMaterials.innerHTML = Array.from(totals.entries()).map(([name, amount]) => '<li>' + name + ' × ' + formatMaterialAmount(amount) + '</li>').join('');
  }

  function renderTalent() {
    renderTalentSubtabs();
    document.querySelectorAll('[data-talent-category]').forEach((button) => {
      const active = button.dataset.talentCategory === state.talent.category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-talent-metric]').forEach((button) => {
      const active = button.dataset.talentMetric === state.talent.metric;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    const currentItem = getCurrentTalentItem();
    talentName.textContent = currentItem.name;
    talentDescription.textContent = currentItem.description;
    talentLevelDisplay.textContent = 'Lv.' + state.talent.level;
    talentLevelRange.value = String(state.talent.level);
    talentMetricLabel.textContent = state.talent.metric === 'damage' ? '伤害倍率' : '失衡倍率';

    if (currentItem.type === 'official-table') {
      const levelIndex = state.talent.level - 1;
      const values = state.talent.metric === 'damage'
        ? currentItem.damageByLevel[levelIndex]
        : currentItem.dazeByLevel[levelIndex];
      talentDemoNote.textContent = '官方逐级数据（米游社安比条目 379）';
      talentHitList.innerHTML = values.map((value, index) => '<li>第 ' + (index + 1) + ' 段：' + value + '%</li>').join('');
    } else {
      talentDemoNote.textContent = '当前子项仅保留样板占位，待补充官方逐级表';
      talentHitList.innerHTML = '<li>当前子项暂无可信逐级倍率，保留为样板展示位。</li>';
    }

    renderTalentMaterials();
  }

  function changeTalentLevel(delta) {
    const next = Math.max(1, Math.min(16, state.talent.level + delta));
    if (next === state.talent.level) return;
    state.talent.level = next;
    renderTalent();
  }

  function setTalentLevel(value) {
    const next = Math.max(1, Math.min(16, Number(value) || 1));
    state.talent.level = next;
    renderTalent();
  }

  components.forEach((element) => {
    element.tabIndex = element.tabIndex >= 0 ? element.tabIndex : 0;
    if (!element.hasAttribute('role')) element.setAttribute('role', 'button');

    element.addEventListener('click', (event) => {
      if (element.dataset.componentType === 'slot') {
        event.stopPropagation();
        state.teamSelection = element.dataset.componentId;
        selectComponent(element.dataset.componentId);
        return;
      }
      if (event.target.closest('.team-slot') && element.dataset.componentId === 'team-card') return;
      if (isInteractiveTarget(event.target) && event.target !== element) return;
      if (element.tagName === 'A') event.preventDefault();
      selectComponent(element.dataset.componentId);
    });

    element.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      if (!shouldAllowDrag(element, event.target)) {
        if (element.dataset.componentType !== 'slot' && event.target === element) selectComponent(element.dataset.componentId);
        return;
      }
      beginDrag(event, element);
    });
  });

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('click', (event) => {
    if (event.target === canvas) clearSelection();
  });

  fields.forEach((input, key) => {
    input.addEventListener('input', () => {
      const value = input.type === 'checkbox' ? input.checked : input.value;
      updateField(key, value);
    });
  });

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'undo') undo();
      if (action === 'redo') redo();
      if (action === 'save') saveState();
      if (action === 'reset') resetLayout();
      if (action === 'export') exportJson();
      if (action === 'import') importJson();
      if (action === 'swap-layout') swapLayout();
      if (action === 'nudge-up') nudge(0, -1);
      if (action === 'nudge-down') nudge(0, 1);
      if (action === 'nudge-left') nudge(-1, 0);
      if (action === 'nudge-right') nudge(1, 0);
    });
  });

  document.querySelectorAll('[data-talent-category]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      state.talent.category = button.dataset.talentCategory;
      state.talent.subItem = Object.keys(talentData[state.talent.category].items)[0];
      renderTalent();
    });
  });

  document.querySelectorAll('[data-talent-metric]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      state.talent.metric = button.dataset.talentMetric;
      renderTalent();
    });
  });

  document.addEventListener('click', (event) => {
    const subButton = event.target.closest('[data-talent-subitem]');
    const actionButton = event.target.closest('[data-talent-action]');
    if (subButton) {
      event.stopPropagation();
      state.talent.subItem = subButton.dataset.talentSubitem;
      renderTalent();
    }
    if (actionButton) {
      event.stopPropagation();
      if (actionButton.dataset.talentAction === 'level-down') changeTalentLevel(-1);
      if (actionButton.dataset.talentAction === 'level-up') changeTalentLevel(1);
    }
  });

  talentLevelRange.addEventListener('input', (event) => {
    event.stopPropagation();
    setTalentLevel(event.target.value);
  });

  window.addEventListener('keydown', (event) => {
    const target = event.target;
    const editing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if (editing || !state.selectedId) return;
    const step = event.shiftKey ? 10 : 1;
    if (event.key === 'ArrowUp') { event.preventDefault(); nudge(0, -step); }
    if (event.key === 'ArrowDown') { event.preventDefault(); nudge(0, step); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); nudge(-step, 0); }
    if (event.key === 'ArrowRight') { event.preventDefault(); nudge(step, 0); }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      pushHistory();
      getComponentState(state.selectedId).visible = false;
      applyAll();
    }
  });

  window.addEventListener('resize', () => {
    const nextMode = window.matchMedia('(max-width: 760px)').matches ? 'mobile' : 'desktop';
    if (nextMode !== state.layoutMode) {
      state.layoutMode = nextMode;
      applyAll();
    }
  });

  selectComponent('hero-title');
  renderTalent();
  applyAll();
})();
