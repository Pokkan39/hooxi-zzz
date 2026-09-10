(() => {
  // 首页活动栏接站内真实活动：混合最新版本活动、官方影像、幕后各一条，点击进绳网页。
  const data = window.hooxiHomeEvents;
  const reel = document.querySelector(".event-reel");
  const cards = [...document.querySelectorAll(".event-reel .event-card")];
  if (!data || !cards.length) return;

  // 三源各取一条，凑不满时用各源剩余条目补位
  const picks = [data.version?.[0], data.media?.[0], data.behind?.[0]].filter(Boolean);
  const pool = [...(data.version || []).slice(1), ...(data.media || []).slice(1), ...(data.behind || []).slice(1)];
  while (picks.length < cards.length && pool.length) picks.push(pool.shift());
  if (picks.length < cards.length) return;

  cards.forEach((card, i) => {
    const item = picks[i];

    const img = card.querySelector("img");
    if (img) {
      img.src = item.cover;
      img.alt = `${item.title} 封面`;
      img.decoding = "async";
      if (i > 0) img.loading = "lazy";
    }

    // 卡片按官方样式只显示 h3 i 一行，标签/副标题/描述在 CSS 里是隐藏的；
    // 隐藏位仍要覆盖，否则残留的样例文案会被读屏软件念出来。
    const meta = card.querySelector(".event-meta");
    if (meta) {
      const tagEl = meta.querySelector("span");
      const nameEl = meta.querySelector("h3 i");
      const subEl = meta.querySelector("h3 b");
      const descEl = meta.querySelector("p");
      if (tagEl) tagEl.textContent = item.tag;
      if (nameEl) nameEl.textContent = item.title;
      if (subEl) subEl.textContent = "";
      if (descEl) descEl.textContent = "";
    }

    card.dataset.live = "1";
    card.style.cursor = "pointer";
    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `${item.tag}：${item.title}`);
  });

  const go = () => {
    const href = "events.html";
    if (typeof window.__hooxiHudGo === "function") window.__hooxiHudGo(href);
    else window.location.href = href;
  };

  reel.addEventListener("click", (event) => {
    const card = event.target instanceof Element ? event.target.closest(".event-card") : null;
    if (card?.dataset.live) go();
  });

  reel.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target instanceof Element ? event.target.closest(".event-card") : null;
    if (!card?.dataset.live) return;
    event.preventDefault();
    go();
  });
})();
