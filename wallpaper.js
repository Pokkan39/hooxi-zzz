(() => {
  const STORAGE_KEY = "hooxi.wallpaper";
  const data = window.hooxiWallpapers || { items: [] };
  const items = Array.isArray(data.items) ? data.items : [];

  const stage = document.querySelector("#wpStage");
  const poster = document.querySelector("#wpPoster");
  const loading = document.querySelector("#wpLoading");
  const track = document.querySelector("#wpTrack");
  const nameEl = document.querySelector("#wpName");
  const sizeEl = document.querySelector("#wpSize");
  const applyBtn = document.querySelector("#wpApply");
  const muteBtn = document.querySelector("#wpMute");
  const randomBtn = document.querySelector("#wpRandom");
  const statusEl = document.querySelector("#wpStatus");
  const prevBtn = document.querySelector("#wpPrev");
  const nextBtn = document.querySelector("#wpNext");

  if (!items.length || !stage || !track) return;

  const host = location.hostname;
  const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]"
    || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(host);
  const PUBLIC_BASE = typeof data.publicBase === "string" && data.publicBase
    ? data.publicBase
    : "https://github.com/Pokkan39/hooxi-zzz/releases/download/wallpapers-720p/";
  const videoOf = (item) => local ? item.video : PUBLIC_BASE + item.id + ".mp4";

  const portraitOf = (item) => `assets/portraits/${item.id}-portrait.webp`;
  const showPoster = (item) => {
    if (!poster) return;
    poster.src = portraitOf(item);
    poster.hidden = false;
  };

  function readSaved() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (raw && typeof raw.id === "string") return raw;
    } catch {}
    return null;
  }

  function writeSaved(patch) {
    const next = { ...(readSaved() || {}), ...patch };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    return next;
  }

  const saved = readSaved();
  // 未存过时默认开随机；只有明确写成 false 才关掉。
  if (!saved) writeSaved({ random: true });
  // appliedId 是真正生效到主界面的那支；viewIndex 只是当前预览
  let appliedId = saved?.id && items.some((i) => i.id === saved.id) ? saved.id : null;
  let viewIndex = Math.max(0, items.findIndex((i) => i.id === appliedId));

  let statusTimer = 0;
  function toast(text) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.add("is-visible");
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => statusEl.classList.remove("is-visible"), 1800);
  }

  function renderStage() {
    const item = items[viewIndex];
    if (!item) return;
    if (nameEl) nameEl.textContent = item.name;
    if (sizeEl) sizeEl.textContent = item.mb ? `${item.mb} MB` : "";
    if (applyBtn) {
      const isCurrent = item.id === appliedId;
      applyBtn.classList.toggle("is-current", isCurrent);
      applyBtn.querySelector(".wp-apply-text").textContent = isCurrent ? "使用中" : "切换";
    }
    showPoster(item);
    stage.hidden = false;
    if (loading) {
      loading.hidden = false;
      loading.querySelector(".wp-loading-text").textContent = "壁纸视频加载中…";
      loading.querySelector(".wp-loading-spin").style.display = "";
    }
    stage.src = videoOf(item);
    stage.load();
    stage.play().catch(() => {});
  }

  stage.addEventListener("playing", () => {
    if (loading) loading.hidden = true;
    if (poster) poster.hidden = true;
    stage.hidden = false;
  });

  stage.addEventListener("error", () => {
    if (loading) loading.hidden = true;
    stage.hidden = true;
    if (poster) poster.hidden = false;
  });

  function renderChips() {
    track.querySelectorAll(".wp-chip").forEach((chip) => {
      const id = chip.dataset.id;
      chip.setAttribute("aria-current", String(id === items[viewIndex]?.id));
      chip.classList.toggle("is-applied", id === appliedId);
    });
  }

  function scrollChipIntoView() {
    const chip = track.querySelector(`.wp-chip[data-id="${items[viewIndex]?.id}"]`);
    chip?.scrollIntoView({ inline: "center", block: "nearest" });
  }

  function select(index, opts = {}) {
    if (index < 0 || index >= items.length) return;
    viewIndex = index;
    renderStage();
    renderChips();
    if (opts.scroll !== false) scrollChipIntoView();
  }

  track.innerHTML = items.map((item) => `
    <li>
      <button class="wp-chip" type="button" data-id="${item.id}" title="${item.name}" aria-label="${item.name}">
        <img src="${item.avatar}" alt="" loading="lazy" decoding="async">
      </button>
    </li>`).join("");

  track.addEventListener("click", (event) => {
    const chip = event.target.closest(".wp-chip");
    if (!chip) return;
    select(items.findIndex((i) => i.id === chip.dataset.id));
  });

  function page(dir) {
    const step = Math.max(1, Math.round(track.clientWidth / 90));
    select(Math.min(items.length - 1, Math.max(0, viewIndex + dir * step)));
  }

  prevBtn?.addEventListener("click", () => page(-1));
  nextBtn?.addEventListener("click", () => page(1));

  applyBtn?.addEventListener("click", () => {
    const item = items[viewIndex];
    if (!item) return;
    appliedId = item.id;
    randomOn = false;
    writeSaved({ id: item.id, video: item.video, random: false });
    renderRandom(false);
    renderStage();
    renderChips();
    toast(`已将「${item.name}」设为主界面壁纸`);
  });

  // 声音开关：浏览器要求静音才能自动播放，所以默认静音
  muteBtn?.addEventListener("click", () => {
    stage.muted = !stage.muted;
    muteBtn.setAttribute("aria-pressed", String(stage.muted));
    muteBtn.setAttribute("aria-label", stage.muted ? "开启声音" : "关闭声音");
    if (!stage.muted) stage.play().catch(() => {});
  });

  function renderRandom(on) {
    if (!randomBtn) return;
    randomBtn.setAttribute("aria-checked", String(on));
    randomBtn.querySelector(".wp-switch-text").textContent = on ? "ON" : "OFF";
  }

  let randomOn = saved?.random !== false;
  randomBtn?.addEventListener("click", () => {
    randomOn = !randomOn;
    writeSaved({ random: randomOn });
    renderRandom(randomOn);
    toast(randomOn ? "随机播放已开启，每次进入主界面随机换壁纸" : "随机播放已关闭");
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest("input, textarea")) return;
    if (event.key === "ArrowRight") select(Math.min(items.length - 1, viewIndex + 1));
    else if (event.key === "ArrowLeft") select(Math.max(0, viewIndex - 1));
  });

  renderRandom(randomOn);
  select(viewIndex, { scroll: false });
  requestAnimationFrame(scrollChipIntoView);
})();
