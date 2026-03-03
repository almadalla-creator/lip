(() => {
  const pages = Array.from(document.querySelectorAll(".page"));
  const pageLabel = document.getElementById("pageLabel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  const aboutOverlay = document.getElementById("aboutOverlay");

  const nodeLookup = window.__NODE_LOOKUP__ || {};
  const vectorMap = window.__VECTOR_MAP__ || {};

  let current = 0;
  const answers = []; // { node, choice }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function setPage(idx) {
    current = clamp(idx, 0, pages.length - 1);
    pages.forEach((p, i) => p.classList.toggle("active", i === current));

    const type = pages[current].dataset.type || "text";
    const isCover = type === "cover";

    if (pageLabel) pageLabel.textContent = `${current + 1} / ${pages.length}`;

    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === pages.length - 1 || isCover;

    if (type === "result") renderAssessment();
  }

  function next() { setPage(current + 1); }
  function prev() { setPage(current - 1); }

  function resetRun() {
    answers.length = 0;
    document.querySelectorAll(".choice").forEach(btn => btn.classList.remove("picked"));
    setPage(0);
  }

  function openAbout() {
    if (!aboutOverlay) return;
    aboutOverlay.classList.add("open");
    aboutOverlay.setAttribute("aria-hidden", "false");
  }
  function closeAbout() {
    if (!aboutOverlay) return;
    aboutOverlay.classList.remove("open");
    aboutOverlay.setAttribute("aria-hidden", "true");
  }

  function renderAssessment() {
    const dominantEl = document.getElementById("dominantPattern");
    const projectionEl = document.getElementById("projection");
    const selectionsEl = document.getElementById("selections");

    if (!dominantEl || !projectionEl || !selectionsEl) return;

    const counts = { A: 0, B: 0, C: 0, D: 0 };
    answers.forEach(a => { if (counts[a.choice] != null) counts[a.choice]++; });

    const total = answers.length || 1;
    const ranked = Object.keys(counts)
      .map(k => ({ k, v: counts[k] }))
      .sort((a, b) => b.v - a.v);

    const dominantKey = ranked[0].k;
    const dom = vectorMap[dominantKey] || { name: dominantKey, desc: "" };

    dominantEl.textContent = `Dominant pattern: ${dom.name}`;

    const parts = ranked.map(r => {
      const pct = Math.round((r.v / total) * 100);
      const label = (vectorMap[r.k] && vectorMap[r.k].name) ? vectorMap[r.k].name : r.k;
      return `${r.k}: ${label} (${r.v}/${answers.length}, ${pct}%)`;
    });
    projectionEl.textContent = parts.join(" • ");

    const lines = answers
      .slice()
      .sort((a, b) => a.node - b.node)
      .map(a => {
        const nodeTitle = (nodeLookup[a.node] && nodeLookup[a.node].title) ? nodeLookup[a.node].title : `Node ${a.node}`;
        const pickedBtn = document.querySelector(`.choice[data-node="${a.node}"][data-choice="${a.choice}"]`);
        const pickedText = pickedBtn ? pickedBtn.innerText.replace(/\s+/g, " ").trim() : `${a.choice}`;
        return `Node ${a.node} — ${a.choice}. ${nodeTitle} — ${pickedText.replace(/^([A-D])\s*/,"")}`;
      });

    selectionsEl.innerHTML =
      `<div style="margin-bottom:10px;color:rgba(255,255,255,0.7)">Your selections</div>` +
      lines.map(t => `<div class="selectionLine">${escapeHtml(t)}</div>`).join("");
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  document.addEventListener("click", (e) => {
    const start = e.target.closest('[data-action="start"]');
    if (start) { setPage(1); return; }

    const replay = e.target.closest('[data-action="replay"]');
    if (replay) { resetRun(); return; }

    const about = e.target.closest('[data-action="about"]');
    if (about) { e.preventDefault(); openAbout(); return; }

    const close = e.target.closest('[data-action="closeAbout"]');
    if (close) { closeAbout(); return; }

    if (e.target === aboutOverlay) { closeAbout(); return; }

    const choiceBtn = e.target.closest(".choice");
    if (choiceBtn) {
      const node = Number(choiceBtn.dataset.node);
      const choice = String(choiceBtn.dataset.choice || "").toUpperCase();

      if (!node || !choice) return;

      const idx = answers.findIndex(a => a.node === node);
      if (idx >= 0) answers[idx] = { node, choice };
      else answers.push({ node, choice });

      // visual mark
      document.querySelectorAll(`.choice[data-node="${node}"]`).forEach(b => b.classList.remove("picked"));
      choiceBtn.classList.add("picked");

      // go forward
      next();
      return;
    }

    const prevClick = e.target.closest("#prevBtn");
    if (prevClick) { prev(); return; }

    const nextClick = e.target.closest("#nextBtn");
    if (nextClick) { next(); return; }
  });

  document.addEventListener("keydown", (e) => {
    if (aboutOverlay && aboutOverlay.classList.contains("open") && e.key === "Escape") {
      closeAbout();
      return;
    }
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });

  // init
  setPage(0);
})();
