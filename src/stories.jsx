import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const FAVORITES_KEY = "hooxi:favorite-agents";
const DEFAULT_ART_ROOT = "assets/mindscape/default";
const GALLERY_FALLBACKS = Object.freeze({
  "alice": "assets/gallery/alice/08.webp",
  "anby": "assets/gallery/anby/01.webp",
  "anton": "assets/gallery/anton/04.webp",
  "aria": "assets/gallery/aria/01.webp",
  "astra-yao": "assets/gallery/astra-yao/03.webp",
  "banyue": "assets/gallery/banyue/06.webp",
  "ben": "assets/gallery/ben/03.webp",
  "billy-kid": "assets/gallery/billy-kid/01.webp",
  "burnice": "assets/gallery/burnice/04.webp",
  "caesar": "assets/gallery/caesar/03.webp",
  "cissia": "assets/gallery/cissia/04.webp",
  "corin": "assets/gallery/corin/01.webp",
  "dialyn": "assets/gallery/dialyn/04.webp",
  "ellen": "assets/gallery/ellen/02.webp",
  "evelyn": "assets/gallery/evelyn/01.webp",
  "grace-howard": "assets/gallery/grace-howard/02.webp",
  "harumasa": "assets/gallery/harumasa/05.webp",
  "hugo": "assets/gallery/hugo/04.webp",
  "jane-doe": "assets/gallery/jane-doe/07.webp",
  "koleda": "assets/gallery/koleda/02.webp",
  "lighter": "assets/gallery/lighter/04.webp",
  "lucia": "assets/gallery/lucia/04.webp",
  "lucy": "assets/gallery/lucy/01.webp",
  "lycaon": "assets/gallery/lycaon/03.webp",
  "manato": "assets/gallery/manato/04.webp",
  "miyabi": "assets/gallery/miyabi/05.webp",
  "nekomata": "assets/gallery/nekomata/02.webp",
  "nicole-demara": "assets/gallery/nicole-demara/05.webp",
  "norma": "assets/gallery/norma/05.webp",
  "orphie-and-magus": "assets/gallery/orphie-and-magus/05.webp",
  "piper": "assets/gallery/piper/01.webp",
  "promeia": "assets/gallery/promeia/04.webp",
  "pulchra": "assets/gallery/pulchra/02.webp",
  "pyrois": "assets/gallery/pyrois/05.webp",
  "qingyi": "assets/gallery/qingyi/03.webp",
  "rina": "assets/gallery/rina/02.webp",
  "seed": "assets/gallery/seed/06.webp",
  "soldier-11": "assets/gallery/soldier-11/01.webp",
  "soukaku": "assets/gallery/soukaku/02.webp",
  "starlight-billy": "assets/gallery/starlight-billy/04.webp",
  "sunna": "assets/gallery/sunna/01.webp",
  "trigger": "assets/gallery/trigger/01.webp",
  "ukinami-yuzuha": "assets/gallery/ukinami-yuzuha/07.webp",
  "velina": "assets/gallery/velina/05.webp",
  "vivian": "assets/gallery/vivian/08.webp",
  "yanagi": "assets/gallery/yanagi/03.webp",
  "ye-shunguang": "assets/gallery/ye-shunguang/08.webp",
  "yidhari": "assets/gallery/yidhari/05.webp",
  "zhao": "assets/gallery/zhao/04.webp",
  "zhu-yuan": "assets/gallery/zhu-yuan/03.webp",
});
const SAFE_THEME = [224, 180, 28];
const CATEGORY_LINKS = [
  { id: "basic", label: "基础", hash: "profile" },
  { id: "skill", label: "技能", hash: "combat" },
  { id: "gear", label: "装备", hash: "build" },
];

function readFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    return new Set(Array.isArray(stored) ? stored.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function field(value) {
  const text = String(value || "").trim();
  return text || "待核验";
}

function validRgb(value) {
  return Array.isArray(value) && value.length === 3
    && value.every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255);
}

function resolveCharacterArt(id) {
  if (GALLERY_FALLBACKS[id]) return { source: "gallery", path: GALLERY_FALLBACKS[id] };
  return { source: "default", path: `${DEFAULT_ART_ROOT}/${encodeURIComponent(id)}.webp` };
}

function resolvePortrait(id) {
  return {
    source: "portrait",
    path: `assets/portraits/${encodeURIComponent(id)}-portrait.webp`,
  };
}

function resolveTheme(id) {
  const record = (window.agentXray || {})[id];
  const source = validRgb(record?.i) ? "i" : validRgb(record?.l) ? "l" : validRgb(record?.c) ? "c" : "fallback";
  const rgb = source === "fallback" ? SAFE_THEME : record[source];
  return { source, css: rgb.join(" ") };
}

function localImageSources(character, kind) {
  if (!character?.id) return [];
  const art = resolveCharacterArt(character.id).path;
  const portrait = resolvePortrait(character.id).path;
  const card = `assets/portraits/${encodeURIComponent(character.id)}-card.webp`;
  const sources = kind === "art"
    ? [art, portrait, card]
    : kind === "portrait"
      ? [portrait, card]
      : [card, portrait];
  return sources.filter((source, index) => source && sources.indexOf(source) === index);
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    if (typeof query.addEventListener === "function") query.addEventListener("change", update);
    else query.addListener(update);
    return () => {
      if (typeof query.removeEventListener === "function") query.removeEventListener("change", update);
      else query.removeListener(update);
    };
  }, []);
  return reduced;
}

// Characters with pre-split parallax layers
const PARALLAX_CHARS = new Set([
  "miyabi","burnice","ellen","jane-doe","anby",
  "nicole-demara","lighter","caesar","lycaon","koleda"
]);

function ParallaxArt({ character }) {
  const containerRef = useRef(null);
  const id = character?.id;
  const hasLayers = id && PARALLAX_CHARS.has(id);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hasLayers) return;
    const bg = el.querySelector('.parallax-bg');
    const fg = el.querySelector('.parallax-fg');
    if (!bg || !fg) return;

    let rafId = 0;
    let mx = 0, my = 0;

    function tick() {
      bg.style.transform = `translate3d(${mx * -8}px, ${my * -6}px, 0) scale(1.04)`;
      fg.style.transform = `translate3d(${mx * 16}px, ${my * 12}px, 0) scale(1.01)`;
      rafId = 0;
    }
    function onMove(e) {
      const rect = el.getBoundingClientRect();
      mx = (e.clientX - rect.left) / rect.width - 0.5;
      my = (e.clientY - rect.top) / rect.height - 0.5;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }
    function onLeave() {
      mx = 0; my = 0;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      bg.style.transform = 'translate3d(0,0,0) scale(1.04)';
      fg.style.transform = 'translate3d(0,0,0) scale(1.01)';
    }
    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [hasLayers, id]);

  if (!character) return null;

  if (hasLayers) {
    const base = `assets/gallery/${id}/layers`;
    return (
      <div className="agent-stage-art agent-stage-art--parallax" ref={containerRef} aria-hidden="true">
        <img className="parallax-bg" src={`${base}/bg.webp`} alt="" />
        <img className="parallax-fg" src={`${base}/fg.webp`} alt="" />
      </div>
    );
  }

  // Fallback: single image
  return (
    <div className="agent-stage-art" aria-hidden="true">
      <AgentImage character={character} kind="art" decorative />
    </div>
  );
}

function AgentImage({ character, kind, decorative = false }) {
  const sources = useMemo(() => localImageSources(character, kind), [character, kind]);
  const [sourceIndex, setSourceIndex] = useState(0);
  useEffect(() => setSourceIndex(0), [character?.id, kind]);

  const source = sources[sourceIndex];
  if (!source) return <span className="agent-image-fallback" aria-hidden={decorative}>{field(character?.name).slice(0, 1)}</span>;

  return (
    <img
      src={source}
      alt={decorative ? "" : `${field(character?.name)}${kind === "portrait" ? "立绘" : "选择卡图"}`}
      loading={kind === "card" ? "lazy" : "eager"}
      fetchPriority={kind === "card" ? "auto" : "high"}
      decoding="async"
      data-agent-image=""
      data-image-kind={kind}
      data-image-source-index={sourceIndex}
      onError={() => setSourceIndex((index) => index + 1)}
    />
  );
}

function countGridColumns(grid) {
  const template = grid ? getComputedStyle(grid).gridTemplateColumns.trim() : "";
  if (!template || template === "none") return 1;
  let depth = 0;
  let tracks = 0;
  let inTrack = false;
  for (const char of template) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (/\s/.test(char) && depth === 0) {
      if (inTrack) {
        tracks += 1;
        inTrack = false;
      }
    } else {
      inTrack = true;
    }
  }
  return tracks + (inTrack ? 1 : 0) || 1;
}

function BackgroundHUD({ character, index, artSource }) {
  const name = (character?.englishName || character?.name || "NO SIGNAL").toUpperCase();
  return (
    <>
      <div className="agent-stage-grid" aria-hidden="true" />
      <span className="agent-stage-backdrop-name" id="selectedAgentBackdropName" aria-hidden="true">{name}</span>
      <div className="agent-stage-heading">
        <span>// SELECTED AGENT</span>
        <b id="selectedAgentIndex">FILE {character ? String(index + 1).padStart(2, "0") : "--"}</b>
      </div>
      <div className="agent-stage-source" aria-hidden="true">
        <span>{artSource === "gallery" ? "LOCAL GALLERY" : "DEFAULT MINDSCAPE"}</span>
        <i />
      </div>
    </>
  );
}

function CategoryMenu({ character }) {
  const base = character ? `character.html?id=${encodeURIComponent(character.id)}` : "";
  return (
    <nav className="agent-category-menu" aria-label="代理人档案分类">
      {CATEGORY_LINKS.map((category, index) => (
        <a
          key={category.id}
          className={index === 0 ? "is-active" : ""}
          href={base ? `${base}#${category.hash}` : undefined}
          aria-disabled={base ? undefined : "true"}
          tabIndex={base ? undefined : -1}
        >
          <span aria-hidden="true">0{index + 1}</span>
          <b>{category.label}</b>
        </a>
      ))}
    </nav>
  );
}

function CharacterInfo({ character, faction, favorite, onToggleFavorite, artSource }) {
  if (!character) {
    return (
      <div className="agent-stage-info is-empty">
        <p className="agent-file-kicker">PERSONNEL SIGNAL / EMPTY</p>
        <h2 id="selectedAgentName">未找到匹配代理人</h2>
        <p className="agent-selected-summary">当前搜索或阵营筛选没有结果，请清空条件或调整关键词。</p>
      </div>
    );
  }

  const base = `character.html?id=${encodeURIComponent(character.id)}`;
  return (
    <div className="agent-stage-info">
      <p className="agent-file-kicker">// {character.englishName || "AGENT FILE"} · {artSource === "gallery" ? "本地 GALLERY" : "DEFAULT 影画"}</p>
      <div className="agent-name-lockup">
        <span className="agent-rank-mark" aria-label={`${character.rank || "未定"}级代理人`}>{character.rank || "—"}</span>
        <h2 id="selectedAgentName">{field(character.name)}</h2>
      </div>
      <div className="agent-selected-meta">
        <span>
          <small>所属阵营</small>
          {faction ? <a id="selectedAgentFaction" href={`faction.html?id=${encodeURIComponent(faction.id)}`}>{faction.name}</a> : <b>待核验</b>}
        </span>
        <span><small>作战属性</small><b>{field(character.attribute)}</b></span>
        <span><small>战斗特性</small><b>{field(character.specialty)}</b></span>
      </div>
      <p className="agent-selected-summary">{field(character.summary)}</p>
      <div className="agent-loadout-line"><span>专属音擎</span><b>{field(character.signatureWEngine)}</b></div>
      <div className="agent-stage-actions">
        <button className="agent-stage-favorite" type="button" aria-pressed={favorite} onClick={onToggleFavorite}>
          {favorite ? "已收藏" : "收藏代理人"}
        </button>
        <nav className="agent-deep-links" aria-label="当前代理人档案入口">
          <a className="agent-primary-link" id="selectedAgentPrimaryLink" href={base}>完整档案</a>
          <a href={`${base}#media`}>影像</a>
          <a href={`${base}#lore`}>剧情</a>
          <a href={`${base}#related`}>来源</a>
        </nav>
      </div>
    </div>
  );
}

function CharacterPreview({ character, faction, index, favorite, onToggleFavorite, switching }) {
  const art = character ? resolveCharacterArt(character.id) : { source: "default", path: "" };
  const portrait = character ? resolvePortrait(character.id) : { source: "portrait", path: "" };
  const compact = portrait.source === "card-fallback";
  return (
    <article
      className={`agent-selected-stage${character ? "" : " is-empty"}`}
      id="selectedAgentStage"
      aria-labelledby="selectedAgentName"
      data-agent-rank={character?.rank || undefined}
      data-character-art-source={art.source}
      data-character-art-path={art.path || undefined}
      data-portrait-source={portrait.source}
    >
      {character ? <ParallaxArt character={character} key={`art-${character.id}`} /> : null}
      <div className="agent-stage-visual">
        <BackgroundHUD character={character} index={index} artSource={art.source} />
        <div className={`agent-stage-portrait${compact ? " is-compact-card" : ""}`} key={`portrait-${character?.id}`} id="selectedAgentPortrait" data-stage-agent-id={character?.id || undefined} data-portrait-mode={compact ? "card-fallback" : "portrait"}>
          {character ? <AgentImage character={character} kind="portrait" decorative /> : <span className="agent-empty-mark">NO SIGNAL</span>}
        </div>
        <div className="agent-stage-signal" aria-hidden="true">
          <i />
          <span>{character ? "PERSONNEL SIGNAL / ARCHIVE READY" : "PERSONNEL SIGNAL / EMPTY"}</span>
        </div>
      </div>
      <CharacterInfo character={character} faction={faction} favorite={favorite} onToggleFavorite={onToggleFavorite} artSource={art.source} />
      <div className={`agent-wipe-overlay${switching ? " is-wiping" : ""}`} id="agentWipeOverlay" aria-hidden="true" />
    </article>
  );
}

function SideButtons({ filterOpen, onToggleFilter, selected, favorite, onToggleFavorite, children }) {
  return (
    <div className="agent-side-buttons" aria-label="名单快捷操作">
      <details
        className="agent-filter-disclosure"
        id="agentFilterDisclosure"
        data-archive-disclosure=""
        open={filterOpen}
        onToggle={(event) => onToggleFilter(event.currentTarget.open)}
      >
        <summary
          className={`agent-orbit-button${filterOpen ? " is-active" : ""}`}
          aria-label={filterOpen ? "关闭搜索与筛选" : "打开搜索与筛选"}
          aria-expanded={filterOpen}
          aria-controls="agentSearchForm"
        >
          <span className="agent-control-icon agent-filter-icon" aria-hidden="true" />
          <span>{filterOpen ? "收起筛选" : "筛选"}</span>
        </summary>
        {children}
      </details>
      <button
        className={`agent-orbit-button agent-favorite-toggle${favorite ? " is-active" : ""}`}
        type="button"
        aria-label={selected ? `${favorite ? "取消收藏" : "收藏"}${field(selected.name)}` : "未选择代理人"}
        aria-pressed={favorite}
        disabled={!selected}
        onClick={onToggleFavorite}
      >
        <span className="agent-control-icon agent-favorite-icon" aria-hidden="true" />
        <span>{favorite ? "已收藏" : "收藏"}</span>
      </button>
    </div>
  );
}

function FilterPanel({ query, factionId, factions, counts, onQuery, onFaction, onClear }) {
  return (
    <form className="agent-search-form" id="agentSearchForm" role="search" onSubmit={(event) => event.preventDefault()}>
      <label className="agent-search-field" htmlFor="agentSearch">
        <span>搜索代理人</span>
        <input id="agentSearch" type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="名字 / 阵营 / 属性 / 特性" autoComplete="off" />
      </label>
      <label className="agent-faction-field" htmlFor="factionFilter">
        <span>阵营筛选</span>
        <select id="factionFilter" value={factionId} onChange={(event) => onFaction(event.target.value)}>
          <option value="">全部阵营</option>
          {factions.map((faction) => <option key={faction.id} value={faction.id}>{faction.name}（{counts.get(faction.id) || 0}）</option>)}
        </select>
      </label>
      <button className="agent-clear-button" id="agentSearchClear" type="button" onClick={onClear} disabled={!query && !factionId}>清空条件</button>
    </form>
  );
}

const CharacterCard = memo(function CharacterCard({ character, faction, index, selected, favorite, onSelect }) {
  return (
    <li>
      <button
        className={`agent-roster-card${selected ? " is-selected" : ""}`}
        type="button"
        data-agent-id={character.id}
        data-rank={character.rank || ""}
        data-favorite={favorite ? "true" : "false"}
        aria-current={selected ? "true" : undefined}
        aria-pressed={selected}
        aria-label={`选择${field(character.name)}，${faction?.name || "未分组"}，${character.rank || "未定"}级代理人${favorite ? "，已收藏" : ""}`}
        aria-controls="selectedAgentStage"
        tabIndex={selected ? 0 : -1}
        onClick={() => onSelect(character.id)}
      >
        <span className="agent-roster-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="agent-card-image"><AgentImage character={character} kind="card" decorative /></span>
        <span className="agent-card-grade" aria-hidden="true">{character.rank || "—"}</span>
        {favorite ? <span className="agent-card-favorite" aria-hidden="true">FAV</span> : null}
        <span className="agent-card-copy">
          <b>{field(character.name)}</b>
          <small>{faction?.name || "未分组"}</small>
          <em>{field(character.attribute)} / {field(character.specialty)}</em>
        </span>
        <span className="agent-card-selected-mark" aria-hidden="true">SELECT</span>
      </button>
    </li>
  );
});

function CharacterGrid({ characters, factionById, selectedId, favorites, onSelect, onKeyDown, gridRef }) {
  if (!characters.length) return <p className="agent-roster-empty" id="agentGrid">没有匹配的代理人。调整关键词或清空阵营条件后继续浏览。</p>;
  return (
    <ul className="agent-roster-grid" id="agentGrid" aria-label="代理人选择列表" ref={gridRef} onKeyDown={onKeyDown}>
      {characters.map((character, index) => (
        <CharacterCard
          key={character.id}
          character={character}
          faction={factionById.get(character.factionId)}
          index={index}
          selected={selectedId === character.id}
          favorite={favorites.has(character.id)}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function StoriesApp() {
  const data = useMemo(() => window.archiveData || {}, []);
  const factions = Array.isArray(data.factions) ? data.factions : [];
  const characters = Array.isArray(data.characters) ? data.characters : [];
  const factionById = useMemo(() => new Map(factions.map((faction) => [faction.id, faction])), [factions]);
  const characterById = useMemo(() => new Map(characters.map((character) => [character.id, character])), [characters]);
  const factionCounts = useMemo(() => {
    const counts = new Map();
    characters.forEach((character) => counts.set(character.factionId, (counts.get(character.factionId) || 0) + 1));
    return counts;
  }, [characters]);
  const initialParams = useMemo(() => new URLSearchParams(location.search), []);
  const initialFaction = initialParams.get("faction") || "";
  const requestedAgent = initialParams.get("agent") || "";
  const initialSelected = characterById.has(requestedAgent) ? requestedAgent : (characterById.has("anby") ? "anby" : characters[0]?.id || "");
  const [query, setQuery] = useState(initialParams.get("q") || "");
  const [factionId, setFactionId] = useState(factionById.has(initialFaction) ? initialFaction : "");
  const [selectedId, setSelectedId] = useState(initialSelected);
  const [favorites, setFavorites] = useState(readFavorites);
  const [filterOpen, setFilterOpen] = useState(Boolean(initialParams.get("q") || initialFaction || location.hash.startsWith("#agentSearch")));
  const [status, setStatus] = useState(initialSelected ? `已选择${field(characterById.get(initialSelected)?.name)}。` : "当前没有可用代理人。");
  const [switching, setSwitching] = useState(false);
  const reducedMotion = useReducedMotion();
  const gridRef = useRef(null);
  const switchTimer = useRef(null);
  const hasMountedSelection = useRef(false);

  const visibleCharacters = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return characters.filter((character) => {
      if (factionId && character.factionId !== factionId) return false;
      if (!normalized) return true;
      const factionName = factionById.get(character.factionId)?.name || "";
      return [character.id, character.name, character.englishName, character.attribute, character.specialty, character.summary, factionName]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [characters, factionById, factionId, query]);

  const selected = characterById.get(selectedId) || null;
  const selectedFaction = selected ? factionById.get(selected.factionId) : null;
  const selectedIndex = selected ? characters.indexOf(selected) : -1;
  const theme = resolveTheme(selectedId);
  const workbenchStyle = {
    "--character-theme-rgb": theme.css,
    "--selected-agent-theme": `rgb(${theme.css})`,
    "--character-ambient": `rgb(${theme.css} / .22)`,
    "--character-line": `rgb(${theme.css} / .42)`,
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.style.setProperty('--character-theme-rgb', theme.css);
    root.style.setProperty('--selected-agent-theme', `rgb(${theme.css})`);
    // Override accent system on BODY to beat data-theme specificity
    body.style.setProperty('--accent', `rgb(${theme.css})`);
    body.style.setProperty('--accent-soft', `rgb(${theme.css} / .12)`);
    body.style.setProperty('--accent-dim', `rgb(${theme.css} / .18)`);
    body.style.setProperty('--accent-line', `rgb(${theme.css} / .38)`);
    body.style.setProperty('--amber', `rgb(${theme.css})`);
    body.style.setProperty('--amber-dim', `rgb(${theme.css} / .18)`);
    body.style.setProperty('--amber-line', `rgb(${theme.css} / .38)`);
    body.style.setProperty('--hooxi-confirm', `rgb(${theme.css})`);
    return () => {
      root.style.removeProperty('--character-theme-rgb');
      root.style.removeProperty('--selected-agent-theme');
      body.style.removeProperty('--accent');
      body.style.removeProperty('--accent-soft');
      body.style.removeProperty('--accent-dim');
      body.style.removeProperty('--accent-line');
      body.style.removeProperty('--amber');
      body.style.removeProperty('--amber-dim');
      body.style.removeProperty('--amber-line');
      body.style.removeProperty('--hooxi-confirm');
    };
  }, [theme.css]);

  useEffect(() => {
    if (visibleCharacters.some((character) => character.id === selectedId)) return;
    clearTimeout(switchTimer.current);
    setSwitching(false);
    const next = visibleCharacters[0]?.id || "";
    setSelectedId(next);
    setStatus(next ? `筛选结果 ${visibleCharacters.length} 名，已选择${field(characterById.get(next)?.name)}。` : "当前条件没有匹配的代理人。");
  }, [characterById, selectedId, visibleCharacters]);

  useEffect(() => {
    const next = new URL(location.href);
    if (selectedId) next.searchParams.set("agent", selectedId); else next.searchParams.delete("agent");
    if (query.trim()) next.searchParams.set("q", query.trim()); else next.searchParams.delete("q");
    if (factionId) next.searchParams.set("faction", factionId); else next.searchParams.delete("faction");
    history.replaceState(history.state, "", `${next.pathname}${next.search}${next.hash}`);
  }, [selectedId, query, factionId]);

  useEffect(() => {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); } catch { /* 本机偏好不可用不影响目录。 */ }
  }, [favorites]);

  useEffect(() => {
    if (!hasMountedSelection.current) {
      hasMountedSelection.current = true;
      return;
    }
    if (!selectedId || !gridRef.current) return;
    const card = [...gridRef.current.querySelectorAll("[data-agent-id]")].find((node) => node.dataset.agentId === selectedId);
    card?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion, selectedId, visibleCharacters.length]);

  useEffect(() => {
    window.__HOOXI_STORIES_REACT__ = true;
    return () => clearTimeout(switchTimer.current);
  }, []);

  useEffect(() => {
    const revealHashTarget = () => {
      const hash = location.hash.slice(1);
      if (!hash) return;
      if (hash === "agentSearch" || hash === "agentSearchForm") {
        setFilterOpen(true);
        requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector("#agentSearch")?.focus({ preventScroll: true })));
        return;
      }
      const target = document.getElementById(hash);
      if (!target) return;
      for (let node = target.parentElement; node; node = node.parentElement) if (node instanceof HTMLDetailsElement) node.open = true;
      target.scrollIntoView({ block: "start" });
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
    };
    requestAnimationFrame(revealHashTarget);
    addEventListener("hashchange", revealHashTarget);
    addEventListener("pageshow", revealHashTarget);
    return () => {
      removeEventListener("hashchange", revealHashTarget);
      removeEventListener("pageshow", revealHashTarget);
    };
  }, []);

  const selectAgent = useCallback((id) => {
    const character = characterById.get(id);
    if (!character || id === selectedId) return;
    clearTimeout(switchTimer.current);
    setSwitching(!reducedMotion);
    setSelectedId(id);
    setStatus(`已选择${field(character.name)}，所属${field(factionById.get(character.factionId)?.name)}。`);
    if (!reducedMotion) switchTimer.current = setTimeout(() => setSwitching(false), 420);
  }, [characterById, factionById, reducedMotion, selectedId]);

  const toggleFavorite = useCallback(() => {
    if (!selectedId) return;
    const willFavorite = !favorites.has(selectedId);
    setFavorites((current) => {
      const next = new Set(current);
      if (willFavorite) next.add(selectedId); else next.delete(selectedId);
      return next;
    });
    setStatus(`${field(characterById.get(selectedId)?.name)}${willFavorite ? "已加入收藏" : "已取消收藏"}。`);
  }, [characterById, favorites, selectedId]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setFactionId("");
    setFilterOpen(true);
    setStatus("已清空搜索与阵营筛选。");
    requestAnimationFrame(() => document.querySelector("#agentSearch")?.focus());
  }, []);

  const handleGridKeyDown = useCallback((event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const cards = [...(gridRef.current?.querySelectorAll("[data-agent-id]") || [])];
    const current = event.target.closest("[data-agent-id]");
    const index = cards.indexOf(current);
    if (index < 0) return;
    event.preventDefault();
    const columns = countGridColumns(gridRef.current);
    const column = index % columns;
    let next = index;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = cards.length - 1;
    if (event.key === "ArrowLeft" && column > 0) next = index - 1;
    if (event.key === "ArrowRight" && column < columns - 1 && index + 1 < cards.length) next = index + 1;
    if (event.key === "ArrowUp" && index - columns >= 0) next = index - columns;
    if (event.key === "ArrowDown" && index + columns < cards.length) next = index + columns;
    if (next === index) return;
    cards[next].focus();
    selectAgent(cards[next].dataset.agentId);
  }, [selectAgent]);

  return (
    <section className="agent-workbench character-directory" id="agentWorkbench" style={workbenchStyle} data-character-color-source={theme.source} aria-labelledby="agentWorkbenchTitle">
      <h2 className="agent-workbench-title" id="agentWorkbenchTitle">代理人选择工作台</h2>
      <div className="agent-workbench-shell">
        <CharacterPreview
          character={selected}
          faction={selectedFaction}
          index={selectedIndex}
          favorite={Boolean(selectedId && favorites.has(selectedId))}
          onToggleFavorite={toggleFavorite}
          switching={switching}
        />
        <CategoryMenu character={selected} />
        <aside className="agent-roster-panel" aria-labelledby="agentDirectoryTitle">
          <div className="agent-roster-heading">
            <div>
              <p className="eyebrow">// AGENT ROSTER</p>
              <h2 id="agentDirectoryTitle">选择代理人</h2>
              <p>方向键、Home 与 End 可移动选择。</p>
            </div>
              <p className="agent-result-count"><b id="agentResultCount">{visibleCharacters.length}</b><span> / <span id="agentTotalCount">{characters.length}</span></span></p>

          </div>
          <SideButtons
            filterOpen={filterOpen}
            onToggleFilter={setFilterOpen}
            selected={selected}
            favorite={Boolean(selectedId && favorites.has(selectedId))}
            onToggleFavorite={toggleFavorite}
          >
            <FilterPanel
              query={query}
              factionId={factionId}
              factions={factions}
              counts={factionCounts}
              onQuery={setQuery}
              onFaction={setFactionId}
              onClear={clearFilters}
            />
          </SideButtons>
          <p className="agent-selection-status" id="agentSelectionStatus" role="status" aria-live="polite" aria-atomic="true">{status}</p>
          <div className="agent-roster-scroll" id="agentRosterScroll">
            <CharacterGrid
              characters={visibleCharacters}
              factionById={factionById}
              selectedId={selectedId}
              favorites={favorites}
              onSelect={selectAgent}
              onKeyDown={handleGridKeyDown}
              gridRef={gridRef}
            />
          </div>
        </aside>
      </div>
    </section>
  );
}

const rootNode = document.querySelector("#storiesRoot");
if (rootNode) createRoot(rootNode).render(<StoriesApp />);
