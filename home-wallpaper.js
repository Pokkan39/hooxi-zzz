(() => {
  // 默认随机播动态壁纸；指定片加载失败时换下一张。随机可用本地开关关掉。
  const STORAGE_KEY = "hooxi.wallpaper";
  const shell = document.querySelector(".game-shell");
  if (!shell) return;

  let saved = null;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw && typeof raw === "object") saved = raw;
  } catch {}

  const items = Array.isArray(window.hooxiWallpapers?.items) ? window.hooxiWallpapers.items : [];
  if (!items.length) return;

  const okPath = (src) => typeof src === "string" && /^assets\/wallpapers\/[\w-]+\.mp4$/i.test(src);
  const shuffle = (list) => {
    const next = list.slice();
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  };

  const randomOn = !saved || saved.random !== false;
  let queue = [];
  if (randomOn) {
    queue = shuffle(items.map((item) => item.video).filter(okPath));
  } else if (okPath(saved.video)) {
    queue = [saved.video, ...items.map((item) => item.video).filter((src) => src !== saved.video && okPath(src))];
  } else {
    queue = shuffle(items.map((item) => item.video).filter(okPath));
  }
  if (!queue.length) return;

  const video = document.createElement("video");
  video.className = "home-wallpaper";
  video.setAttribute("aria-hidden", "true");
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";

  let i = 0;
  const tryNext = () => {
    if (i >= queue.length) return;
    video.src = queue[i++];
    video.play().catch(() => {});
  };
  video.addEventListener("error", tryNext);

  shell.prepend(video);
  document.body.classList.add("has-bg-video", "has-home-wallpaper");
  const shade = document.getElementById("bg-shade");
  const legacy = document.getElementById("bg-video");
  if (shade) shade.hidden = true;
  if (legacy) {
    legacy.hidden = true;
    legacy.removeAttribute("src");
    legacy.load();
  }
  tryNext();
})();
