(() => {
  const data = window.hooxiCultivateData || { guide: { faqs: [] }, materials: [] };
  const faqs = Array.isArray(data.guide?.faqs) ? data.guide.faqs : [];
  const materials = Array.isArray(data.materials) ? data.materials : [];
  const faqList = document.querySelector("#faqList");
  const matGrid = document.querySelector("#matGrid");
  const queryInput = document.querySelector("#cultivateQuery");
  const searchForm = document.querySelector(".cultivate-search-form");
  const clearButton = document.querySelector("#cultivateClear");
  const resultCount = document.querySelector("#cultivateResultCount");
  const faqEmpty = document.querySelector("#faqEmpty");
  const matEmpty = document.querySelector("#matEmpty");
  const guideSource = document.querySelector("#guideSource");
  const checkedSummary = document.querySelector("#sourceCheckedSummary");

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  function safeHref(value) {
    const raw = String(value ?? "").trim();
    if (!raw || /[\u0000-\u001f\u007f]/.test(raw)) return "";
    try {
      const absoluteScheme = /^[a-z][a-z\d+.-]*:/i.test(raw);
      const parsed = new URL(raw, window.location.href);
      if (absoluteScheme) return /^(https?):$/i.test(parsed.protocol) ? raw : "";
      if (raw.startsWith("//")) return "";
      return parsed.origin === window.location.origin && /^(https?):$/i.test(parsed.protocol) ? raw : "";
    } catch {
      return "";
    }
  }

  function safeImagePath(value) {
    const raw = String(value ?? "").trim();
    if (!raw || raw.includes("..") || raw.includes("\\") || raw.startsWith("/")) return "";
    return /^assets\/[a-z\d_./-]+\.(?:png|jpe?g|webp|avif|svg)$/i.test(raw) ? raw : "";
  }

  function sourceAction(url, label) {
    const href = safeHref(url);
    return href
      ? `<a class="cultivate-primary-action" data-source-action href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`
      : `<span class="cultivate-primary-action is-disabled" data-source-action>百科来源不可用</span>`;
  }

  function normalizeSearch(value) {
    return String(value ?? "").trim().toLocaleLowerCase("zh-CN");
  }

  const guideId = /^[a-z\d_-]+$/i.test(String(data.guide?.id || "")) ? String(data.guide.id) : "guide";
  const faqEntries = [];
  const materialEntries = [];

  if (faqList) {
    faqList.innerHTML = faqs.map((item, index) => {
      const number = String(index + 1).padStart(2, "0");
      const id = `cultivate-faq-${guideId}-${number}`;
      const summaryId = `${id}-summary`;
      const answerId = `${id}-answer`;
      const searchText = normalizeSearch([
        item.question,
        item.answer,
        data.guide?.title,
        data.guide?.wikiUrl,
        "official-wiki-mirror",
        "fan-index-use"
      ].join(" "));
      faqEntries.push({ id, searchText });
      return `
        <details id="${id}" class="cultivate-faq-item" data-archive-disclosure data-cultivate-search-item>
          <summary id="${summaryId}" aria-controls="${answerId}"><span class="faq-index" aria-hidden="true">${number}</span><b>${escapeHtml(item.question)}</b></summary>
          <p id="${answerId}" class="cultivate-faq-answer">${escapeHtml(item.answer || "详见官方百科来源。")}</p>
        </details>`;
    }).join("");
  }

  if (matGrid) {
    matGrid.innerHTML = materials.map((item, index) => {
      const rawId = String(item.id || "");
      const id = /^[a-z\d_-]+$/i.test(rawId) ? rawId : `cultivate-material-${index + 1}`;
      const detailsId = `${id}-source-details`;
      const summaryId = `${detailsId}-summary`;
      const contentId = `${detailsId}-content`;
      const image = safeImagePath(item.cover);
      const shortSummary = item.summary && item.summary !== item.title ? item.summary : "养成素材索引条目。";
      const searchText = normalizeSearch([
        item.title,
        item.summary,
        item.sourceUrl,
        item.sourceType,
        item.rightsStatus,
        item.rightsNote,
        item.sourceCheckedAt,
        item.wikiId
      ].join(" "));
      materialEntries.push({ id, searchText });
      return `
        <article id="${id}" class="cultivate-mat-card" data-cultivate-search-item>
          <div class="cultivate-mat-main">
            <span class="cultivate-mat-cover">${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy"/>` : "<span>无可用本地图标</span>"}</span>
            <div class="cultivate-mat-copy">
              <h3>${escapeHtml(item.title || "未命名素材")}</h3>
              <p>${escapeHtml(shortSummary)}</p>
              ${sourceAction(item.sourceUrl, "打开官方百科")}
            </div>
          </div>
          <details id="${detailsId}" class="cultivate-mat-disclosure" data-archive-disclosure>
            <summary id="${summaryId}" aria-controls="${contentId}">来源与权利说明</summary>
            <div id="${contentId}" class="cultivate-source-details">
              <dl>
                <div><dt>来源类型</dt><dd>${escapeHtml(item.sourceType || "未标注")}</dd></div>
                <div><dt>核验日期</dt><dd>${escapeHtml(item.sourceCheckedAt || "未标注")}</dd></div>
                <div><dt>权利状态</dt><dd>${escapeHtml(item.rightsStatus || "未标注")}</dd></div>
                <div><dt>使用说明</dt><dd>${escapeHtml(item.rightsNote || "未标注")}</dd></div>
              </dl>
            </div>
          </details>
        </article>`;
    }).join("");
  }

  faqEntries.forEach((entry) => {
    entry.element = document.getElementById(entry.id);
  });
  materialEntries.forEach((entry) => {
    entry.element = document.getElementById(entry.id);
  });

  function updateOwnedQuery(value) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("q", value);
    else url.searchParams.delete("q");
    history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function applyFilter() {
    const query = normalizeSearch(queryInput?.value);
    let visibleFaqs = 0;
    let visibleMaterials = 0;

    faqEntries.forEach((entry) => {
      const visible = !query || entry.searchText.includes(query);
      if (entry.element) {
        entry.element.hidden = !visible;
        entry.element.open = Boolean(query && visible);
      }
      if (visible) visibleFaqs += 1;
    });

    materialEntries.forEach((entry) => {
      const visible = !query || entry.searchText.includes(query);
      if (entry.element) entry.element.hidden = !visible;
      const disclosure = entry.element?.querySelector(":scope > details[data-archive-disclosure]");
      if (!query && disclosure) disclosure.open = false;
      if (visible) visibleMaterials += 1;
    });

    if (faqEmpty) faqEmpty.hidden = visibleFaqs !== 0;
    if (matEmpty) matEmpty.hidden = visibleMaterials !== 0;
    if (clearButton) clearButton.disabled = !query;
    if (resultCount) {
      resultCount.value = String(visibleFaqs + visibleMaterials);
      resultCount.textContent = `显示 ${visibleFaqs} 条问答、${visibleMaterials} 个素材，共 ${visibleFaqs + visibleMaterials} 项`;
    }
  }

  function hashTarget() {
    const raw = window.location.hash.slice(1);
    if (!raw) return null;
    try {
      return document.getElementById(decodeURIComponent(raw));
    } catch {
      return document.getElementById(raw);
    }
  }

  function expandTarget(target) {
    if (target instanceof HTMLDetailsElement) target.open = true;
    for (let node = target.parentElement; node; node = node.parentElement) {
      if (node instanceof HTMLDetailsElement) node.open = true;
    }
  }

  function focusTarget(target) {
    const focusNode = target instanceof HTMLDetailsElement
      ? target.querySelector(":scope > summary")
      : target;
    if (!(focusNode instanceof HTMLElement)) return;
    if (!focusNode.matches("a,button,input,select,textarea,summary,[tabindex]")) focusNode.tabIndex = -1;
    focusNode.scrollIntoView({ block: "center", inline: "nearest" });
    focusNode.focus({ preventScroll: true });
  }

  function handleHashTarget() {
    let target = hashTarget();
    if (!target) return;
    const searchItem = target.closest("[data-cultivate-search-item]");
    if (searchItem?.hidden && normalizeSearch(queryInput?.value)) {
      queryInput.value = "";
      updateOwnedQuery("");
      applyFilter();
      target = hashTarget();
      if (!target) return;
    }
    expandTarget(target);
    focusTarget(target);
  }

  function setGuideSource() {
    if (!(guideSource instanceof HTMLAnchorElement)) return;
    const href = safeHref(data.guide?.wikiUrl);
    if (href) {
      guideSource.href = href;
      return;
    }
    const unavailable = document.createElement("span");
    unavailable.id = guideSource.id;
    unavailable.dataset.sourceAction = "";
    unavailable.className = "cultivate-primary-action is-disabled";
    unavailable.textContent = "市民指南来源不可用";
    guideSource.replaceWith(unavailable);
  }

  function setCheckedSummary() {
    if (!checkedSummary) return;
    const dates = materials.map((item) => String(item.sourceCheckedAt || "").trim()).filter(Boolean);
    const uniqueDates = [...new Set(dates)];
    if (materials.length && dates.length === materials.length && uniqueDates.length === 1) {
      checkedSummary.textContent = `${materials.length} 个素材的数据核验日期均标注为 ${uniqueDates[0]}。`;
      return;
    }
    const dataDate = String(data.meta?.updatedAt || "").trim();
    checkedSummary.textContent = dataDate
      ? `索引数据标注更新日期为 ${dataDate}；各条目核验日期以披露字段为准。`
      : "各条目核验日期以披露字段为准。";
  }

  if (queryInput) {
    queryInput.value = new URL(window.location.href).searchParams.get("q") || "";
    queryInput.addEventListener("input", () => {
      const value = queryInput.value.trim();
      updateOwnedQuery(value);
      applyFilter();
    });
  }

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!queryInput) return;
    updateOwnedQuery(queryInput.value.trim());
    applyFilter();
  });

  clearButton?.addEventListener("click", () => {
    if (!queryInput) return;
    queryInput.value = "";
    updateOwnedQuery("");
    applyFilter();
    queryInput.focus();
  });

  window.addEventListener("hashchange", () => requestAnimationFrame(handleHashTarget));

  setGuideSource();
  setCheckedSummary();
  applyFilter();
  requestAnimationFrame(handleHashTarget);
})();
