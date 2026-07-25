(() => {
  const data = window.hooxiCultivateData || { guide: { faqs: [] }, materials: [] };
  const esc = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
  const faqs = Array.isArray(data.guide?.faqs) ? data.guide.faqs : [];
  const materials = Array.isArray(data.materials) ? data.materials : [];
  const faqList = document.querySelector("#faqList");
  const matGrid = document.querySelector("#matGrid");
  const queryInput = document.querySelector("#cultivateQuery");
  const status = document.querySelector("#cultivateStatus");
  const guideSource = document.querySelector("#guideSource");

  if (guideSource && data.guide?.wikiUrl) guideSource.href = data.guide.wikiUrl;
  if (status) status.textContent = "INDEX READY";
  document.querySelector("#faqCount").textContent = String(faqs.length);
  document.querySelector("#matCount").textContent = String(materials.length);

  const matches = (text, query) => !query || String(text || "").toLowerCase().includes(query);

  function render() {
    const query = String(queryInput?.value || "").trim().toLowerCase();
    const visibleFaqs = faqs.filter((item) => matches(`${item.question} ${item.answer}`, query));
    const visibleMats = materials.filter((item) => matches(`${item.title} ${item.summary}`, query));

    faqList.innerHTML = visibleFaqs.length
      ? visibleFaqs.map((item, index) => `
          <details class="cultivate-faq-item" ${index < 3 ? "open" : ""}>
            <summary><span class="faq-index">${String(index + 1).padStart(2, "0")}</span><b>${esc(item.question)}</b></summary>
            <p>${esc(item.answer || "详见官方百科原文。")}</p>
          </details>
        `).join("")
      : `<p class="cultivate-empty">没有匹配的问答。</p>`;

    matGrid.innerHTML = visibleMats.length
      ? visibleMats.map((item) => `
          <a class="cultivate-mat-card" href="${esc(item.sourceUrl)}" target="_blank" rel="noreferrer">
            <span class="cultivate-mat-cover">${item.cover ? `<img src="${esc(item.cover)}" alt="" loading="lazy"/>` : "<i>NO ICON</i>"}</span>
            <span class="cultivate-mat-copy">
              <b>${esc(item.title)}</b>
              <small>${esc(item.summary || "养成素材")}</small>
            </span>
          </a>
        `).join("")
      : `<p class="cultivate-empty">没有匹配的素材。</p>`;
  }

  if (queryInput) queryInput.addEventListener("input", render);
  const editor = document.querySelector("#editorOpen");
  if (editor) editor.onclick = () => { location.href = "editor.html"; };
  render();
})();
