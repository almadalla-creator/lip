/* app.js */
(() => {
  const pages = Array.from(document.querySelectorAll(".page"));
  const pageLabel = document.getElementById("pageLabel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  const STORAGE_KEY = "lip_success_choices";
  let index = 0;

  function clamp(i) {
    if (i < 0) return 0;
    if (i > pages.length - 1) return pages.length - 1;
    return i;
  }

  function setActive(i) {
    index = clamp(i);
    pages.forEach(p => p.classList.remove("active"));
    pages[index].classList.add("active");
    updateNav();

    const scroller = pages[index].querySelector(".pageInner");
    if (scroller) scroller.scrollTop = 0;

    // When we land on reflection, refresh the assessment (in case user went back/changed).
    if (isReflectionPage(pages[index])) renderAssessment();
  }

  function updateNav() {
    if (pageLabel) pageLabel.textContent = `${index + 1} / ${pages.length}`;
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === pages.length - 1;
  }

  function next() { setActive(index + 1); }
  function prev() { setActive(index - 1); }

  function getNodeNumberFromId(id) {
    const m = String(id || "").match(/node-(\d+)/i);
    return m ? Number(m[1]) : null;
  }

  function labelForChoice(i) {
    const n = Number(i);
    if (!Number.isFinite(n) || n < 0) return "";
    const A = "A".charCodeAt(0);
    if (n < 26) return String.fromCharCode(A + n);
    const first = Math.floor(n / 26) - 1;
    const second = n % 26;
    return String.fromCharCode(A + first) + String.fromCharCode(A + second);
  }

  function readChoices() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch (_) { return {}; }
  }

  function writeChoices(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj || {}));
  }

  function clearChoices() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function recordChoice(node, choice, text) {
    const data = readChoices();
    if (node) data[node] = { choice: Number(choice), text: String(text || "") };
    writeChoices(data);
  }

  function initNodeChoices() {
    pages.forEach(section => {
      const id = section.id || "";
      if (!/node/i.test(id)) return;

      const nodeNum = getNodeNumberFromId(id);
      const inner = section.querySelector(".pageInner");
      if (!inner) return;

      const paras = Array.from(inner.querySelectorAll("p"));
      if (paras.length < 2) return;

      const prompt = paras[0];
      const options = paras.slice(1); // preserve original order as written

      const choicesWrap = document.createElement("div");
      choicesWrap.className = "choices";

      let made = 0;

      options.forEach((p) => {
        const raw = (p.textContent || "").trim();
        if (!raw) { p.remove(); return; }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choiceBtn";
        btn.dataset.action = "choose";
        btn.dataset.raw = raw;

        if (nodeNum !== null) btn.dataset.node = String(nodeNum);
        btn.dataset.choice = String(made);

        const label = labelForChoice(made);
        btn.textContent = `${label}) ${raw}`;

        choicesWrap.appendChild(btn);
        made += 1;
        p.remove();
      });

      if (prompt && prompt.parentNode) prompt.insertAdjacentElement("afterend", choicesWrap);
      else inner.appendChild(choicesWrap);
    });
  }

  function isReflectionPage(section) {
    if (!section) return false;
    const dt = (section.getAttribute("data-type") || "").toLowerCase();
    const id = (section.id || "").toLowerCase();
    return dt === "reflection" || id.includes("reflection");
  }

  function findReflectionPage() {
    return pages.find(p => isReflectionPage(p)) || null;
  }

  function ensureAssessmentBlock(refPage) {
    const inner = refPage.querySelector(".pageInner") || refPage;
    let block = inner.querySelector("#assessment");
    if (!block) {
      block = document.createElement("div");
      block.id = "assessment";
      block.style.marginTop = "22px";
      block.style.maxWidth = "820px";
      block.style.padding = "18px 18px";
      block.style.border = "1px solid rgba(255,255,255,0.10)";
      block.style.borderRadius = "14px";
      block.style.background = "rgba(0,0,0,0.35)";
      inner.appendChild(block);
    }
    return block;
  }

  function renderAssessment() {
    const refPage = findReflectionPage();
    if (!refPage) return;

    const block = ensureAssessmentBlock(refPage);
    const data = readChoices();

    const entries = Object.keys(data)
      .map(k => ({ node: Number(k), choice: data[k]?.choice ?? 0, text: String(data[k]?.text ?? "") }))
      .filter(x => Number.isFinite(x.node))
      .sort((a, b) => a.node - b.node);

    const counts = { A: 0, B: 0, C: 0, D: 0 };
    entries.forEach(e => {
      const L = labelForChoice(e.choice);
      if (counts[L] !== undefined) counts[L] += 1;
    });

    const total = entries.length || 0;
    const dominant = (() => {
      const arr = Object.entries(counts);
      arr.sort((a, b) => b[1] - a[1]);
      return arr[0][1] === 0 ? null : arr[0][0];
    })();

    const list = entries
      .map(e => {
        const L = labelForChoice(e.choice);
        const txt = e.text.length > 140 ? e.text.slice(0, 140) + "…" : e.text;
        return `<div style="margin:10px 0;opacity:0.95;">
          <span style="opacity:0.7;">Node ${e.node}:</span>
          <span style="margin-left:8px;">${L}) ${escapeHtml(txt)}</span>
        </div>`;
      })
      .join("");

    block.innerHTML = `
      <div style="font-size:18px;font-weight:700;margin-bottom:10px;">Assessment</div>
      <div style="opacity:0.80;line-height:1.55;">
        This is not a diagnosis. It is a structural snapshot of how you moved through pressure,exposure,validation,and doubt.
      </div>
      <div style="margin-top:14px;display:flex;gap:18px;flex-wrap:wrap;opacity:0.90;">
        <div><span style="opacity:0.7;">A:</span> ${counts.A}</div>
        <div><span style="opacity:0.7;">B:</span> ${counts.B}</div>
        <div><span style="opacity:0.7;">C:</span> ${counts.C}</div>
        <div><span style="opacity:0.7;">D:</span> ${counts.D}</div>
        <div style="margin-left:auto;"><span style="opacity:0.7;">Answered:</span> ${total}</div>
      </div>
      <div style="margin-top:12px;opacity:0.9;">
        <span style="opacity:0.7;">Dominant pull:</span>
        <span style="margin-left:8px;font-weight:700;">${dominant ? dominant : "—"}</span>
      </div>
      <div style="margin-top:14px;border-top:1px solid rgba(255,255,255,0.10);padding-top:12px;">
        <div style="opacity:0.7;margin-bottom:8px;">Your selections</div>
        ${list || `<div style="opacity:0.75;">No selections recorded.</div>`}
      </div>
    `;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function handleRestart() {
    clearChoices();
    setActive(0);
  }

  document.addEventListener("click", (e) => {
    const t = e.target;

    if (!t) return;

    // Start button on cover
    if (t.matches('[data-action="start"]')) {
      e.preventDefault();
      setActive(1);
      return;
    }

    // Choice buttons
    if (t.matches(".choiceBtn")) {
      e.preventDefault();
      const node = t.dataset.node || "";
      const choice = t.dataset.choice || "0";
      const raw = t.dataset.raw || (t.textContent || "");
      recordChoice(node, choice, raw);
      next();
      return;
    }

    // Begin again button (support multiple markup styles)
    if (
      t.matches('[data-action="restart"]') ||
      t.matches("#beginAgain") ||
      (t.tagName === "BUTTON" && (t.textContent || "").trim().toLowerCase() === "begin again")
    ) {
      e.preventDefault();
      handleRestart();
      return;
    }
  });

  if (prevBtn) prevBtn.addEventListener("click", (e) => { e.preventDefault(); prev(); });
  if (nextBtn) nextBtn.addEventListener("click", (e) => { e.preventDefault(); next(); });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  initNodeChoices();
  renderAssessment();
  setActive(0);
})();
