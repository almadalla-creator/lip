/* app.js */
(() => {
  const pages = Array.from(document.querySelectorAll(".page"));
  const pageLabel = document.getElementById("pageLabel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  const STORAGE_KEY = "lip_success_choices";
  let index = 0;

  const LETTERS = ["A", "B", "C", "D"];
  const VECTORS = ["Hierarchy Defense", "Narrative Control", "Emotional Withdrawal", "Lucid Tolerance"];

  function clamp(i) {
    if (i < 0) return 0;
    if (i > pages.length - 1) return pages.length - 1;
    return i;
  }

  function getChoices() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function setChoices(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data || {}));
  }

  function clearChoices() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function updateNav() {
    if (pageLabel) pageLabel.textContent = `${index + 1} / ${pages.length}`;
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === pages.length - 1;
  }

  function renderReflectionIfNeeded() {
    const active = pages[index];
    if (!active) return;

    const id = (active.id || "").toLowerCase();
    if (!id.includes("reflection")) return;

    const inner = active.querySelector(".pageInner");
    if (!inner) return;

    const choices = getChoices();
    const nodeNums = Object.keys(choices)
      .map(n => Number(n))
      .filter(n => Number.isFinite(n))
      .sort((a, b) => a - b);

    let assessment = active.querySelector(".assessment");
    if (!assessment) {
      assessment = document.createElement("div");
      assessment.className = "assessment";
      assessment.style.marginTop = "22px";
      inner.appendChild(assessment);
    }

    if (nodeNums.length === 0) {
      assessment.innerHTML = `
        <div style="opacity:.85;margin-top:18px;">
          No choices were recorded. If this is unexpected, your node pages are not storing selections.
        </div>
      `;
      return;
    }

    const counts = [0, 0, 0, 0];
    const pickedLines = [];

    nodeNums.forEach(n => {
      const c = choices[n];
      const choiceIndex = Number(c.choice);
      if (Number.isFinite(choiceIndex) && choiceIndex >= 0 && choiceIndex < 4) counts[choiceIndex] += 1;
      const letter = LETTERS[choiceIndex] || "?";
      const text = (c.text || "").trim();
      pickedLines.push({ n, letter, text });
    });

    const total = counts.reduce((a, b) => a + b, 0) || 1;

    const scored = counts
      .map((v, i) => ({ i, v, pct: Math.round((v / total) * 100) }))
      .sort((a, b) => b.v - a.v);

    const top = scored[0];
    const dominant = VECTORS[top.i];
    const breakdownHtml = scored
      .map(s => `<div style="margin:6px 0;">${LETTERS[s.i]}: ${VECTORS[s.i]} <span style="opacity:.75;">(${s.v}/${total}, ${s.pct}%)</span></div>`)
      .join("");

    const picksHtml = pickedLines
      .map(x => `
        <div style="margin:10px 0;opacity:.92;">
          <span style="display:inline-block;min-width:64px;opacity:.75;">Node ${x.n}</span>
          <span style="display:inline-block;min-width:28px;font-weight:700;">${x.letter}</span>
          <span>${escapeHtml(x.text)}</span>
        </div>
      `)
      .join("");

    assessment.innerHTML = `
      <div style="margin-top:18px;font-size:22px;font-weight:700;">Assessment</div>
      <div style="margin-top:8px;opacity:.9;">
        Dominant pattern: <span style="font-weight:700;">${dominant}</span>
      </div>
      <div style="margin-top:14px;opacity:.9;">
        ${breakdownHtml}
      </div>
      <div style="margin-top:18px;opacity:.9;">
        <div style="font-weight:700;margin-bottom:8px;">Your selections</div>
        ${picksHtml}
      </div>
    `;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setActive(i) {
    index = clamp(i);
    pages.forEach(p => p.classList.remove("active"));
    pages[index].classList.add("active");
    updateNav();

    const scroller = pages[index].querySelector(".pageInner");
    if (scroller) scroller.scrollTop = 0;

    renderReflectionIfNeeded();
  }

  function next() { setActive(index + 1); }
  function prev() { setActive(index - 1); }

  function getNodeNumberFromId(id) {
    const m = String(id || "").match(/node-(\d+)/i);
    return m ? Number(m[1]) : null;
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
      const options = paras.slice(1);

      const choicesWrap = document.createElement("div");
      choicesWrap.className = "choices";

      options.forEach((p, choiceIndex) => {
        const raw = (p.textContent || "").trim();
        if (!raw) return;

        const letter = LETTERS[choiceIndex] || "";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choiceBtn";
        btn.dataset.action = "choose";
        if (nodeNum !== null) btn.dataset.node = String(nodeNum);
        btn.dataset.choice = String(choiceIndex);

        btn.textContent = letter ? `${letter}. ${raw}` : raw;

        choicesWrap.appendChild(btn);
        p.remove();
      });

      if (prompt && prompt.parentNode) {
        prompt.insertAdjacentElement("afterend", choicesWrap);
      } else {
        inner.appendChild(choicesWrap);
      }
    });
  }

  function recordChoice(node, choice, text) {
    const data = getChoices();
    if (node) {
      data[node] = { choice: Number(choice), text: String(text || "") };
      setChoices(data);
    }
  }

  document.addEventListener("click", (e) => {
    const t = e.target;

    if (t && t.matches('[data-action="start"]')) {
      e.preventDefault();
      setActive(1);
      return;
    }

    if (t && (t.matches('[data-action="restart"]') || t.id === "beginAgainBtn" || t.classList.contains("beginAgainBtn") || t.classList.contains("restartBtn"))) {
      e.preventDefault();
      clearChoices();
      setActive(0);
      return;
    }

    if (t && t.matches(".choiceBtn")) {
      e.preventDefault();
      const node = t.dataset.node || "";
      const choice = t.dataset.choice || "0";
      recordChoice(node, choice, t.textContent || "");
      next();
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
  setActive(0);
})();
