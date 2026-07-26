import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const FAVORITES_KEY = "hooxi:favorite-agents";
const NO_PORTRAIT_IDS = new Set(["aria", "sunna"]);
const ROSTER_DISPLAY_NAMES = {
  rina: "丽娜",
  alice: "爱丽丝",
  evelyn: "伊芙琳",
  "grace-howard": "格莉丝",
  "jane-doe": "简",
  "nicole-demara": "妮可",
  "soldier-0-anby": "零号·安比",
  "starlight-billy": "星徽·比利",
  "orphie-and-magus": "奥菲丝与鬼火",
  "ukinami-yuzuha": "柚叶",
  "ye-shunguang": "叶瞬光",
  yidhari: "伊德海莉",
  lycaon: "莱卡恩",
  "zhu-yuan": "朱鸢",
  qingyi: "青衣",
};

function rosterDisplayName(character) {
  return ROSTER_DISPLAY_NAMES[character?.id] || character?.name || "未命名代理人";
}

const CATEGORY_LINKS = [
  { id: "basic", label: "基础", hash: "profile" },
  { id: "skill", label: "技能", hash: "combat" },
  { id: "gear", label: "装备", hash: "build" },
];

function readPreviewData() {
  if (!new URLSearchParams(location.search).has("editorPreview")) return null;
  try {
    return JSON.parse(localStorage.getItem("hooxi:preview:data"));
  } catch {
    return null;
  }
}

function readFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    return new Set(Array.isArray(stored) ? stored.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function safeUrl(value, { image = false } = {}) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (image && /^data:image\//i.test(text)) return text;
  try {
    const url = new URL(text, location.href);
    const protocols = image ? ["http:", "https:", "blob:"] : ["http:", "https:"];
    if (location.protocol === "file:") protocols.push("file:");
    return protocols.includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function safeTheme(value) {
  const text = String(value || "").trim();
  return /^#[\da-f]{3}([\da-f]{3})?$/i.test(text) ? text : "var(--agent-theme-fallback)";
}

function localPortraitUrl(id) {
  return id && !NO_PORTRAIT_IDS.has(id) ? `assets/portraits/${id}-portrait.webp` : "";
}

function unique(values) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index);
}

function imageSources(character, kind) {
  if (!character) return [];
  const values = kind === "portrait"
    ? [localPortraitUrl(character.id), character.portrait, character.headshot, character.avatar]
    : [character.headshot, character.avatar, character.portrait];
  return unique(values.map((value) => safeUrl(value, { image: true })));
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function AgentImage({ character, kind = "card", editor = false, decorative = false }) {
  const sources = useMemo(() => imageSources(character, kind), [character, kind]);
  const [sourceIndex, setSourceIndex] = useState(0);
  useEffect(() => setSourceIndex(0), [character?.id, kind]);

  const source = sources[sourceIndex];
  const fallback = String(character?.name || "?").slice(0, 1);
  if (!source) return <span className="agent-image-fallback">{fallback}</span>;

  const editorProps = editor ? {
    "data-editor-id": `character.${character.id}.portrait`,
    "data-editor-type": "image",
    "data-editor-field": "portrait",
  } : {};

  return (
    <>
      <img
        src={source}
        alt={decorative ? "" : `${character.name || "代理人"}${kind === "portrait" ? "立绘" : "头像"}`}
        loading={kind === "portrait" ? "eager" : "lazy"}
        fetchPriority={kind === "portrait" ? "high" : "auto"}
        data-agent-image=""
        data-image-source-index={sourceIndex}
        onError={() => setSourceIndex((index) => index + 1)}
        {...editorProps}
      />
      <span className="agent-image-fallback" hidden>{fallback}</span>
    </>
  );
}

function BackgroundHUD({ character, index }) {
  const name = (character?.englishName || character?.name || "NO SIGNAL").toUpperCase();
  return (
    <>
      <div className="agent-stage-grid" aria-hidden="true" />
      <span className="agent-stage-backdrop-name" id="selectedAgentBackdropName" aria-hidden="true">{name}</span>
      <div className="agent-stage-heading">
        <span>// SELECTED AGENT</span>
        <b id="selectedAgentIndex">FILE {character ? String(index + 1).padStart(2, "0") : "--"}</b>
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

function CharacterInfo({ character, faction }) {
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
      <p className="agent-file-kicker">// {character.englishName || "AGENT FILE"}</p>
      <div className="agent-name-lockup">
        <span className="agent-rank-mark" aria-label={`${character.rank || "未定"}级代理人`}>{character.rank || "—"}</span>
        <h2
          id="selectedAgentName"
          data-editor-id={`character.${character.id}.name`}
          data-editor-type="character"
          data-editor-field="name"
          data-editor-bind={`characters.${character.id}`}
        >
          {character.name || "未命名代理人"}
        </h2>
      </div>
      <div className="agent-selected-meta">
        <span>
          <small>所属阵营</small>
          {faction ? (
            <a
              id="selectedAgentFaction"
              href={`faction.html?id=${encodeURIComponent(faction.id)}`}
              data-editor-id={`faction.${faction.id}.name`}
              data-editor-type="faction"
              data-editor-field="name"
              data-editor-bind={`factions.${faction.id}`}
            >
              {faction.name}
            </a>
          ) : <b>未分组</b>}
        </span>
        <span>
          <small>作战属性</small>
          <b
            data-editor-id={`character.${character.id}.attribute`}
            data-editor-type="character"
            data-editor-field="attribute"
            data-editor-bind={`characters.${character.id}`}
          >
            {character.attribute || "待补充"}
          </b>
        </span>
        <span>
          <small>战斗特性</small>
          <b
            data-editor-id={`character.${character.id}.specialty`}
            data-editor-type="character"
            data-editor-field="specialty"
            data-editor-bind={`characters.${character.id}`}
          >
            {character.specialty || "待补充"}
          </b>
        </span>
      </div>
      <p
        className="agent-selected-summary"
        data-editor-id={`character.${character.id}.summary`}
        data-editor-type="character"
        data-editor-field="summary"
        data-editor-bind={`characters.${character.id}`}
      >
        {character.summary || "角色摘要待补充。"}
      </p>
      <div className="agent-loadout-line">
        <span>专属音擎</span>
        <b>{character.signatureWEngine || "资料待补充"}</b>
      </div>
      <nav className="agent-deep-links" aria-label="当前代理人档案入口">
        <a className="agent-primary-link" id="selectedAgentPrimaryLink" href={base}>完整档案</a>
        <a href={`${base}#media`}>影像</a>
        <a href={`${base}#lore`}>剧情</a>
        <a href={`${base}#related`}>来源</a>
      </nav>
    </div>
  );
}

function CharacterPreview({ character, faction, index, wiping }) {
  const compact = Boolean(character && NO_PORTRAIT_IDS.has(character.id));
  return (
    <article
      className={`agent-selected-stage${character ? "" : " is-empty"}`}
      id="selectedAgentStage"
      aria-labelledby="selectedAgentName"
      data-agent-rank={character?.rank || undefined}
    >
      <div className="agent-stage-visual">
        <BackgroundHUD character={character} index={index} />
        <div className={`agent-stage-portrait${compact ? " is-compact-card" : ""}`} id="selectedAgentPortrait" data-stage-agent-id={character?.id || undefined} data-portrait-mode={compact ? "compact" : "transparent"}>
          {character ? <AgentImage character={character} kind="portrait" editor /> : <span className="agent-empty-mark">NO SIGNAL</span>}
        </div>
        <div className="agent-stage-signal" aria-hidden="true">
          <i />
          <span>{character ? "PERSONNEL SIGNAL / ARCHIVE READY" : "PERSONNEL SIGNAL / EMPTY"}</span>
        </div>
      </div>
      <CharacterInfo character={character} faction={faction} />
      <div className={`agent-wipe-overlay${wiping ? " is-wiping" : ""}`} id="agentWipeOverlay" aria-hidden="true" />
    </article>
  );
}

function SideButtons({ filterOpen, onToggleFilter, selected, favorite, onToggleFavorite }) {
  return (
    <div className="agent-side-buttons" aria-label="名单快捷操作">
      <button
        className={`agent-orbit-button${filterOpen ? " is-active" : ""}`}
        type="button"
        aria-label={filterOpen ? "关闭搜索与筛选" : "打开搜索与筛选"}
        aria-expanded={filterOpen}
        aria-controls="agentSearchForm"
        onClick={onToggleFilter}
      >
        <span className="agent-control-icon agent-filter-icon" aria-hidden="true" />
        <span>{filterOpen ? "收起筛选" : "筛选"}</span>
      </button>
      <button
        className={`agent-orbit-button${favorite ? " is-active" : ""}`}
        type="button"
        aria-label={selected ? `${favorite ? "取消收藏" : "收藏"}${selected.name}` : "未选择代理人"}
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

function FilterPanel({ open, query, factionId, factions, counts, onQuery, onFaction, onClear }) {
  return (
    <form className="agent-search-form" id="agentSearchForm" role="search" hidden={!open} onSubmit={(event) => event.preventDefault()}>
      <label className="agent-search-field">
        <span>搜索代理人</span>
        <input
          id="agentSearch"
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="名字 / 阵营 / 属性 / 特性"
          autoComplete="off"
        />
      </label>
      <label className="agent-faction-field">
        <span>阵营筛选</span>
        <select id="factionFilter" value={factionId} onChange={(event) => onFaction(event.target.value)}>
          <option value="">全部阵营</option>
          {factions.map((faction) => (
            <option key={faction.id} value={faction.id}>{faction.name}（{counts.get(faction.id) || 0}）</option>
          ))}
        </select>
      </label>
      <button className="agent-clear-button" type="button" onClick={onClear} disabled={!query && !factionId}>清空条件</button>
    </form>
  );
}

const CharacterCard = memo(function CharacterCard({ character, faction, index, selected, favorite, reducedMotion, onSelect }) {
  const handlePointerMove = (event) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    event.currentTarget.style.setProperty("--card-pan-x", `${(x * 4).toFixed(1)}px`);
    event.currentTarget.style.setProperty("--card-pan-y", `${(y * 3).toFixed(1)}px`);
  };
  const resetPointer = (event) => {
    event.currentTarget.style.removeProperty("--card-pan-x");
    event.currentTarget.style.removeProperty("--card-pan-y");
  };

  const displayName = rosterDisplayName(character);

  return (
    <button
      className={`agent-roster-card${selected ? " is-selected" : ""}`}
      type="button"
      data-agent-id={character.id}
      data-rank={character.rank || ""}
      data-favorite={favorite ? "true" : "false"}
      data-editor-id={`character.${character.id}`}
      data-editor-type="character"
      data-editor-bind={`characters.${character.id}`}
      aria-pressed={selected}
      aria-label={`选择${character.name}，${faction?.name || "未分组"}，${character.rank || "未定"}级代理人`}
      style={{
        "--agent-card-theme": safeTheme(faction?.theme),
        "--track-column": index % 3,
        "--track-row": Math.floor(index / 3),
      }}
      onClick={() => onSelect(character.id)}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <span className="agent-roster-index">{String(index + 1).padStart(2, "0")}</span>
      <span className="agent-card-image">
        <AgentImage character={character} decorative />
      </span>
      <span className="agent-card-grade" aria-hidden="true">{character.rank || "—"}</span>
      {favorite ? <span className="agent-card-favorite" aria-label="已收藏">FAV</span> : null}
      <span className="agent-card-copy">
        <b data-roster-display-name="">{displayName}</b>
        <small>{faction?.name || "未分组"}</small>
        <em>{character.attribute || "属性待补充"} / {character.specialty || "特性待补充"}</em>
      </span>
      <span className="agent-card-selected-mark" aria-hidden="true">SELECT</span>
    </button>
  );
});

function CharacterGrid({ characters, factionById, selectedId, favorites, reducedMotion, onSelect, onKeyDown, gridRef }) {
  if (!characters.length) {
    return (
      <div className="agent-roster-empty">
        <b>没有匹配的代理人</b>
        <p>调整关键词或清空阵营条件后继续浏览。</p>
      </div>
    );
  }

  return (
    <div className="agent-roster-grid" id="agentGrid" role="group" aria-label="代理人选择列表" ref={gridRef} onKeyDown={onKeyDown}>
      {characters.map((character, index) => (
        <CharacterCard
          key={character.id}
          character={character}
          faction={factionById.get(character.factionId)}
          index={index}
          selected={selectedId === character.id}
          favorite={favorites.has(character.id)}
          reducedMotion={reducedMotion}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function FreeComponents({ components }) {
  if (!components.length) return null;
  return (
    <div className="free-components">
      {components.map((component) => {
        const common = {
          key: component.id,
          className: "free-component",
          "data-editor-id": `component.${component.id}`,
          "data-editor-type": component.type,
          "data-editor-field": component.type === "image" ? "src" : "text",
          "data-component-id": component.id,
        };
        if (component.type === "image") return <img {...common} src={safeUrl(component.src, { image: true })} alt={component.alt || ""} />;
        if (component.type === "link") return <a {...common} href={safeUrl(component.href) || "#"}>{component.text}</a>;
        return <p {...common}>{component.text}</p>;
      })}
    </div>
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

function StoriesApp() {
  const data = useMemo(() => readPreviewData() || window.archiveData || {}, []);
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
  const defaultAgent = characterById.has(requestedAgent) ? requestedAgent : (characterById.has("anby") ? "anby" : characters[0]?.id || "");

  const [query, setQuery] = useState(initialParams.get("q") || "");
  const [factionId, setFactionId] = useState(factionById.has(initialFaction) ? initialFaction : "");
  const [selectedId, setSelectedId] = useState(defaultAgent);
  const [favorites, setFavorites] = useState(readFavorites);
  const [filterOpen, setFilterOpen] = useState(Boolean(initialParams.get("q") || initialFaction || location.hash.startsWith("#agentSearch")));
  const [status, setStatus] = useState("正在读取代理人名单。");
  const [wiping, setWiping] = useState(false);
  const reducedMotion = useReducedMotion();
  const workbenchRef = useRef(null);
  const gridRef = useRef(null);
  const hasMountedSelection = useRef(false);
  const wipeTimers = useRef([]);

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

  const cancelWipe = useCallback(() => {
    wipeTimers.current.forEach(clearTimeout);
    wipeTimers.current = [];
    setWiping(false);
  }, []);

  useEffect(() => cancelWipe, [cancelWipe]);

  useEffect(() => {
    const currentVisible = visibleCharacters.some((character) => character.id === selectedId);
    if (currentVisible) return;
    cancelWipe();
    const next = visibleCharacters[0]?.id || "";
    setSelectedId(next);
    setStatus(next ? `筛选结果 ${visibleCharacters.length} 名，已选择${characterById.get(next)?.name || "代理人"}。` : "当前条件没有匹配的代理人。");
  }, [cancelWipe, characterById, selectedId, visibleCharacters]);

  useEffect(() => {
    const next = new URL(location.href);
    if (selectedId) next.searchParams.set("agent", selectedId); else next.searchParams.delete("agent");
    if (query.trim()) next.searchParams.set("q", query.trim()); else next.searchParams.delete("q");
    if (factionId) next.searchParams.set("faction", factionId); else next.searchParams.delete("faction");
    history.replaceState(history.state, "", `${next.pathname}${next.search}${next.hash}`);
  }, [selectedId, query, factionId]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  useEffect(() => {
    if (!hasMountedSelection.current) {
      hasMountedSelection.current = true;
      return;
    }
    if (!selectedId || !gridRef.current) return;
    const card = [...gridRef.current.querySelectorAll("[data-agent-id]")].find((node) => node.dataset.agentId === selectedId);
    card?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
  }, [selectedId, visibleCharacters.length, reducedMotion]);

  useEffect(() => {
    const focusSearch = () => {
      if (!location.hash.startsWith("#agentSearch")) return;
      setFilterOpen(true);
      requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector("#agentSearch")?.focus({ preventScroll: true })));
    };
    focusSearch();
    addEventListener("hashchange", focusSearch);
    addEventListener("pageshow", focusSearch);
    return () => {
      removeEventListener("hashchange", focusSearch);
      removeEventListener("pageshow", focusSearch);
    };
  }, []);

  useEffect(() => {
    const workbench = workbenchRef.current;
    if (!workbench || reducedMotion || !matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;
    let frame = 0;
    let point = null;
    const flush = () => {
      frame = 0;
      if (!point) return;
      workbench.style.setProperty("--stage-grid-x", `${(point.x * 6).toFixed(1)}px`);
      workbench.style.setProperty("--stage-grid-y", `${(point.y * 4).toFixed(1)}px`);
      workbench.style.setProperty("--stage-copy-x", `${(point.x * 4).toFixed(1)}px`);
      workbench.style.setProperty("--stage-copy-y", `${(point.y * 3).toFixed(1)}px`);
      workbench.style.setProperty("--stage-deco-x", `${(point.x * 5).toFixed(1)}px`);
      workbench.style.setProperty("--stage-deco-y", `${(point.y * 3).toFixed(1)}px`);
      workbench.style.setProperty("--portrait-x", `${(point.x * 5).toFixed(1)}px`);
      workbench.style.setProperty("--portrait-y", `${(point.y * 3).toFixed(1)}px`);
    };
    const move = (event) => {
      const rect = workbench.getBoundingClientRect();
      point = {
        x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)),
        y: Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2)),
      };
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const reset = () => {
      point = null;
      ["--stage-grid-x", "--stage-grid-y", "--stage-copy-x", "--stage-copy-y", "--stage-deco-x", "--stage-deco-y", "--portrait-x", "--portrait-y"]
        .forEach((property) => workbench.style.removeProperty(property));
    };
    workbench.addEventListener("pointermove", move);
    workbench.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      workbench.removeEventListener("pointermove", move);
      workbench.removeEventListener("pointerleave", reset);
      reset();
    };
  }, [reducedMotion]);

  useEffect(() => {
    window.__HOOXI_STORIES_REACT__ = true;
    setStatus(selected ? `已选择${selected.name}，当前显示 ${visibleCharacters.length} 名代理人。` : "当前筛选没有匹配的代理人。");
  }, []);

  const selectAgent = useCallback((id) => {
    const character = characterById.get(id);
    if (!character || id === selectedId) return;
    cancelWipe();
    const commit = () => {
      setSelectedId(id);
      setStatus(`已选择${character.name}，所属${factionById.get(character.factionId)?.name || "未分组"}。`);
    };
    if (reducedMotion || !selectedId) {
      commit();
      return;
    }
    setWiping(true);
    wipeTimers.current = [
      setTimeout(commit, 210),
      setTimeout(() => {
        setWiping(false);
        wipeTimers.current = [];
      }, 460),
    ];
  }, [cancelWipe, characterById, factionById, reducedMotion, selectedId]);

  const toggleFavorite = useCallback(() => {
    if (!selectedId) return;
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(selectedId)) next.delete(selectedId); else next.add(selectedId);
      return next;
    });
  }, [selectedId]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setFactionId("");
    setStatus("已清空搜索与阵营筛选。");
    requestAnimationFrame(() => document.querySelector("#agentSearch")?.focus());
  }, []);

  const handleGridKeyDown = useCallback((event) => {
    if (event.target.isContentEditable || event.target.closest("input, textarea, select")) return;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const buttons = [...(gridRef.current?.querySelectorAll("[data-agent-id]") || [])];
    const current = event.target.closest("[data-agent-id]");
    const index = buttons.indexOf(current);
    if (index < 0) return;
    event.preventDefault();
    const columns = countGridColumns(gridRef.current);
    const column = index % columns;
    let next = index;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = buttons.length - 1;
    if (event.key === "ArrowLeft" && column > 0) next = index - 1;
    if (event.key === "ArrowRight" && column < columns - 1 && index + 1 < buttons.length) next = index + 1;
    if (event.key === "ArrowUp" && index - columns >= 0) next = index - columns;
    if (event.key === "ArrowDown" && index + columns < buttons.length) next = index + columns;
    if (next === index) return;
    buttons[next].focus();
    selectAgent(buttons[next].dataset.agentId);
  }, [selectAgent]);

  const freeComponents = Array.isArray(data.site?.pages?.stories?.components) ? data.site.pages.stories.components : [];
  const workbenchStyle = { "--selected-agent-theme": safeTheme(selectedFaction?.theme) };

  return (
    <section className="agent-workbench character-directory" id="agentWorkbench" ref={workbenchRef} style={workbenchStyle} aria-labelledby="agentWorkbenchTitle">
      <h1 className="agent-workbench-title" id="agentWorkbenchTitle">代理人选择</h1>
      <div className="agent-workbench-shell">
        <CharacterPreview character={selected} faction={selectedFaction} index={selectedIndex} wiping={wiping} />
        <CategoryMenu character={selected} />
        <aside className="agent-roster-panel" aria-label="代理人名单">
          <div className="agent-roster-tickers" aria-hidden="true">
            <div className="agent-roster-ticker agent-roster-ticker-primary">
              <span>AGENT ROSTER / NEW ERIDU / PERSONNEL ARCHIVE / {characters.length} FILES / </span>
              <span>AGENT ROSTER / NEW ERIDU / PERSONNEL ARCHIVE / {characters.length} FILES / </span>
            </div>
            <div className="agent-roster-ticker agent-roster-ticker-secondary">
              <span>PERSONNEL ARCHIVE / {characters.length} FILES / NEW ERIDU / AGENT ROSTER / </span>
              <span>PERSONNEL ARCHIVE / {characters.length} FILES / NEW ERIDU / AGENT ROSTER / </span>
            </div>
          </div>
          <div className="agent-roster-heading">
            <div>
              <p className="eyebrow">// AGENT ROSTER</p>
              <h2>选择代理人</h2>
            </div>
            <p className="agent-result-count"><b id="agentResultCount">{visibleCharacters.length}</b><span> / {characters.length}</span></p>
          </div>
          <SideButtons
            filterOpen={filterOpen}
            onToggleFilter={() => setFilterOpen((open) => !open)}
            selected={selected}
            favorite={Boolean(selectedId && favorites.has(selectedId))}
            onToggleFavorite={toggleFavorite}
          />
          <FilterPanel
            open={filterOpen}
            query={query}
            factionId={factionId}
            factions={factions}
            counts={factionCounts}
            onQuery={setQuery}
            onFaction={setFactionId}
            onClear={clearFilters}
          />
          <p className="agent-selection-status" id="agentSelectionStatus" role="status" aria-live="polite" aria-atomic="true">{status}</p>
          <div className="agent-roster-scroll" id="agentRosterScroll">
            <CharacterGrid
              characters={visibleCharacters}
              factionById={factionById}
              selectedId={selectedId}
              favorites={favorites}
              reducedMotion={reducedMotion}
              onSelect={selectAgent}
              onKeyDown={handleGridKeyDown}
              gridRef={gridRef}
            />
          </div>
        </aside>
      </div>
      <FreeComponents components={freeComponents} />
    </section>
  );
}

const rootNode = document.querySelector("#storiesRoot");
if (rootNode) createRoot(rootNode).render(<StoriesApp />);
