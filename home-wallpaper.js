(() => {
  // 壁纸目录被 gitignore，线上 56 条全 404。非本机不探测、不请求。
  // 本机最多播 1 条；失败即停，不再换下一张。
  const STORAGE_KEY = "hooxi.wallpaper";
  const shell = document.querySelector(".game-shell");
  if (!shell) return;
  if (!/^(localhost|127\.0\.0\.1)$/i.test(location.hostname)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let saved = null;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw && typeof raw === "object") saved = raw;
  } catch {}

  const items = Array.isArray(window.hooxiWallpapers?.items) ? window.hooxiWallpapers.items : [];
  if (!items.length) return;

  const okPath = (src) => typeof src === "string" && /^assets\/wallpapers\/[\w-]+\.mp4$/i.test(src);
  const randomOn = !saved || saved.random !== false;
  let src = "";
  if (!randomOn && okPath(saved.video)) src = saved.video;
  else {
    const pool = items.map((item) => item.video).filter(okPath);
    if (pool.length) src = pool[Math.floor(Math.random() * pool.length)];
  }
  if (!src) return;

  const video = document.createElement("video");
  video.className = "home-wallpaper";
  video.setAttribute("aria-hidden", "true");
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "none";
  video.addEventListener("error", () => {
    video.removeAttribute("src");
    video.load();
    video.remove();
    document.body.classList.remove("has-home-wallpaper");
  }, { once: true });
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
  video.src = src;
  video.play().catch(() => {});
})();
