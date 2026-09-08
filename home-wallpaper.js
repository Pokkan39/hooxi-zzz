(() => {
  // 读取壁纸页保存的选择，在主界面循环播放该动态壁纸；开启随机播放时每次进入随机取一支。
  const STORAGE_KEY = "hooxi.wallpaper";
  const shell = document.querySelector(".game-shell");
  if (!shell) return;

  let saved = null;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw && typeof raw === "object") saved = raw;
  } catch {}
  if (!saved) return;

  const items = Array.isArray(window.hooxiWallpapers?.items) ? window.hooxiWallpapers.items : [];

  let src = "";
  if (saved.random && items.length) {
    src = items[Math.floor(Math.random() * items.length)].video;
  } else if (typeof saved.video === "string") {
    // 只接受站内相对路径，避免写入异常值时加载外部资源
    src = /^assets\/wallpapers\/[\w-]+\.mp4$/i.test(saved.video) ? saved.video : "";
  }
  if (!src) return;

  const video = document.createElement("video");
  video.className = "home-wallpaper";
  video.setAttribute("aria-hidden", "true");
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = src;

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
  video.play().catch(() => {});
})();
