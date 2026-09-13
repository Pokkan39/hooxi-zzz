(() => {
  // 本机播本地原片；公开站播 Release 720p，不探测 gitignore 的 wallpapers。
  const STORAGE_KEY = "hooxi.wallpaper";
  const FALLBACK = "assets/home-video/lucy.mp4";
  const data = window.hooxiWallpapers || {};
  const PUBLIC_BASE = typeof data.publicBase === "string" && data.publicBase
    ? data.publicBase
    : "https://github.com/Pokkan39/hooxi-zzz/releases/download/wallpapers-720p/";
  const shell = document.querySelector(".game-shell");
  const done = () => {
    document.documentElement.dataset.homeReady = "true";
    window.dispatchEvent(new Event("hooxi:home-ready"));
  };
  if (!shell) {
    done();
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    done();
    return;
  }

  const host = location.hostname;
  const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]"
    || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(host);

  let saved = null;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw && typeof raw === "object") saved = raw;
  } catch {}

  const items = Array.isArray(data.items) ? data.items : [];
  const okPath = (src) => typeof src === "string" && /^assets\/wallpapers\/[\w-]+\.mp4$/i.test(src);
  const publicSrc = (id) => PUBLIC_BASE + id + ".mp4";
  const pickItem = () => {
    const randomOn = !saved || saved.random !== false;
    if (!randomOn) {
      return items.find((item) => item.id === saved.id)
        || items.find((item) => item.video === saved.video)
        || null;
    }
    if (!items.length) return null;
    return items[Math.floor(Math.random() * items.length)];
  };

  const queue = [];
  const picked = pickItem();
  if (local) {
    if (picked && okPath(picked.video)) queue.push(picked.video);
    else if (saved && okPath(saved.video)) queue.push(saved.video);
    queue.push(FALLBACK);
  } else if (picked) {
    queue.push(publicSrc(picked.id));
    if (picked.id !== "lucy") queue.push(publicSrc("lucy"));
  } else {
    queue.push(publicSrc("lucy"));
  }

  const video = document.createElement("video");
  video.className = "home-wallpaper";
  video.setAttribute("aria-hidden", "true");
  video.muted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "auto";
  let i = 0;
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    done();
  };
  const fail = () => {
    video.removeAttribute("src");
    video.load();
    video.remove();
    document.body.classList.remove("has-home-wallpaper", "has-bg-video");
    settle();
  };
  const tryNext = () => {
    if (i >= queue.length) {
      fail();
      return;
    }
    video.src = queue[i++];
    video.play().catch(() => {});
  };
  video.addEventListener("error", tryNext);
  video.addEventListener("playing", settle, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) video.pause();
    else video.play().catch(() => {});
  });

  shell.prepend(video);
  document.body.classList.add("has-bg-video", "has-home-wallpaper");
  const shade = document.getElementById("bg-shade");
  const legacy = document.getElementById("bg-video");
  if (shade) shade.hidden = true;
  if (legacy) {
    legacy.hidden = true;
    legacy.removeAttribute("src");
    legacy.pause();
  }
  tryNext();
})();
