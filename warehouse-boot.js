(() => {
  // 仓库脚本和数据约 250KB，点开再加载，避免拖慢首页首屏。
  let loading = false;
  const open = () => {
    if (window.__WH__) return;
    if (loading) return;
    loading = true;
    if (!document.getElementById("wh-fonts")) {
      const fonts = document.createElement("style");
      fonts.id = "wh-fonts";
      fonts.textContent = "@font-face{font-family:'ZzzZH';src:url('assets/fonts/zzz/zzz-zh.ttf') format('truetype');font-display:swap;}@font-face{font-family:'ZzzEN';src:url('assets/fonts/zzz/zzz-en.ttf') format('truetype');font-display:swap;}";
      document.head.appendChild(fonts);
    }
    const files = ["disc-sets.js", "wengine-data.js", "mat-data.js", "warehouse.js"];
    const run = (i) => {
      if (i >= files.length) {
        document.querySelector('.nav-item[data-label="仓库"]')?.click();
        return;
      }
      const s = document.createElement("script");
      s.src = files[i];
      s.onload = () => run(i + 1);
      s.onerror = () => { loading = false; };
      document.body.appendChild(s);
    };
    run(0);
  };
  document.querySelectorAll(".nav-item").forEach((btn) => {
    if (btn.getAttribute("data-label") !== "仓库") return;
    btn.addEventListener("click", (event) => {
      if (window.__WH__) return;
      event.stopImmediatePropagation();
      open();
    }, true);
  });
})();
