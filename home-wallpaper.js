(() => {
  // 好感壁纸目录被 gitignore，线上没有。最多试 1 条壁纸；失败改播入库首页片。
  const STORAGE_KEY = "hooxi.wallpaper";
  const FALLBACK = "assets/home-video/lucy.mp4";
  const shell = document.querySelector(".game-shell");
  if (!shell) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let saved = null;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw && typeof raw === "object") saved = raw;
  } catch {}

  const items = Array.isArray(window.hooxiWallpapers?.items) ? window.hooxiWallpapers.items : [];
  const okPath = (src) => typeof src === "string" && /^assets\/wallpapers\/[\w-]+\.mp4$/i.test(src);
  const randomOn = !saved || saved.random !== false;
  const queue = [];
  if (!randomOn && okPath(saved.video)) queue.push(saved.video);
  else {
    const pool = items.map((item) => item.video).filter(okPath);
    if (pool.length) queue.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  queue.push(FALLBACK);

  const video = document.createElement("video");
  video.className = "home-wallpaper";
  video.setAttribute("aria-hidden", "true");
  video.muted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "metadata";
  let i = 0;
  const fail = () => {
    video.removeAttribute("src");
    video.load();
    video.remove();
    document.body.classList.remove("has-home-wallpaper", "has-bg-video");
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
