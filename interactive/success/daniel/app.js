/* app.js */
(() => {
  const pages = Array.from(document.querySelectorAll(".page"));
  const pageLabel = document.getElementById("pageLabel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  const STORAGE_KEY = "lip_success_choices";
  let index = 0;

  const LETTERS = ["A", "B", "C", "D"];
  const VECTORS = [
    "Hierarchy Defense",
    "Narrative Control",
    "Emotional Withdrawal",
    "Lucid Tolerance",
  ];

  const VECTOR_TEXT = {
    0: {
      name: "Hierarchy Defense",
      short:
        "You protect status, order, and legitimacy. Under pressure, you default to authority, strength, rank, and “this is how it must be.”",
      risks:
        "You confuse stability with truth, and loyalty with correctness. You become uncorrectable, then isolated.",
      move:
        "Trade “being right” for “staying testable.” Ask: what would I accept as disconfirming evidence, today, in public?",
    },
    1: {
      name: "Narrative Control",
      short:
        "You protect coherence and meaning. Under pressure, you tighten the story, frame doubts as ignorance, and push certainty for impact.",
      risks:
        "You become addicted to persuasion. You stop listening because listening threatens the narrative.",
      move:
        "Replace certainty with precision. Say one thing you don’t know, one thing you overstated, one thing you’ll re-check.",
    },
    2: {
      name: "Emotional Withdrawal",
      short:
        "You protect yourself by exiting. Under pressure, you disengage, detach, disappear, or turn cold to avoid exposure.",
      risks:
        "You avoid the pain but keep the pattern. You call it “boundaries,” but it’s avoidance dressed as principle.",
      move:
        "Stay present one step longer than your reflex. Do one clean, direct conversation before you exit.",
    },
    3: {
      name: "Lucid Tolerance",
      short:
        "You can hold doubt without collapsing. Under pressure, you slow down, test yourself, and stay reachable.",
      risks:
        "You can over-delay decisions by keeping everything open, mistaking openness for rigor.",
      move:
        "Commit to one action that makes you accountable, even if you’re still uncertain.",
    },
  };

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
    pages.forEach((p) => p.classList.remove("active"));
    if (pages[index]) pages[index].classList.add("active");
    updateNav();

    const scroller = pages[index]?.querySelector(".pageInner");
    if (scroller) scroller.scrollTop = 0;

    renderReflectionIfNeeded();
  }

  function next() {
    setActive(index + 1);
  }
  function prev() {
    setActive(index - 1);
  }

  function getNodeNumberFromId(id) {
    const m = String(id || "").match(/node-(\d+)/i);
    return m ? Number(m[1]) : null;
  }

  function initNodeChoices() {
    pages.forEach((section) => {
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
    if (!node) return;
    data[node] = { choice: Number(choice), text: String(text || "") };
    setChoices(data);
  }

  function findReflectionPage() {
    return pages.find((p) => String(p.id || "").toLowerCase().includes("reflection"));
  }

  function renderReflectionIfNeeded() {
    const active = pages[index];
    if (!active) return;

    const id = String(active.id || "").toLowerCase();
    if (!id.includes("reflection")) return;

    const inner = active.querySelector(".pageInner");
    if (!inner) return;

    const choices = getChoices();
    const nodeNums = Object.keys(choices)
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n))
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

    nodeNums.forEach((n) => {
      const c = choices[n];
      const choiceIndex = Number(c.choice);
      if (Number.isFinite(choiceIndex) && choiceIndex >= 0 && choiceIndex < 4) {
        counts[choiceIndex] += 1;
      }
      const letter = LETTERS[choiceIndex] || "?";
      const text = (c.text || "").replace(/^[A-D]\.\s*/i, "").trim();
      pickedLines.push({ n, letter, text });
    });

    const total = counts.reduce((a, b) => a + b, 0) || 1;

    const ranked = counts
      .map((v, i) => ({ i, v, pct: Math.round((v / total) * 100) }))
      .sort((a, b) => b.v - a.v);

    const top = ranked[0];
    const dominantIdx = top.i;
    const dominant = VECTOR_TEXT[dominantIdx];

    const secondary = ranked[1] && ranked[1].v > 0 ? VECTOR_TEXT[ranked[1].i] : null;

    const breakdownHtml = ranked
      .map((s) => {
        const v = VECTOR_TEXT[s.i];
        return `<div style="margin:6px 0;">
          <span style="font-weight:700;">${LETTERS[s.i]}:</span>
          <span style="margin-left:6px;">${escapeHtml(v.name)}</span>
          <span style="opacity:.75;margin-left:8px;">(${s.v}/${total}, ${s.pct}%)</span>
        </div>`;
      })
      .join("");

    const picksHtml = pickedLines
      .map(
        (x) => `
        <div style="margin:10px 0;opacity:.92;">
          <span style="display:inline-block;min-width:64px;opacity:.75;">Node ${x.n}</span>
          <span style="display:inline-block;min-width:28px;font-weight:700;">${escapeHtml(x.letter)}</span>
          <span>${escapeHtml(x.text)}</span>
        </div>
      `
      )
      .join("");

    const dominantBlock = `
      <div style="margin-top:10px;opacity:.95;">
        <div style="font-weight:700;">Dominant pattern: ${escapeHtml(dominant.name)}</div>
        <div style="margin-top:8px;opacity:.9;">${escapeHtml(dominant.short)}</div>
        <div style="margin-top:10px;opacity:.9;">
          <span style="font-weight:700;">Risk:</span> ${escapeHtml(dominant.risks)}
        </div>
        <div style="margin-top:10px;opacity:.9;">
          <span style="font-weight:700;">Move:</span> ${escapeHtml(dominant.move)}
        </div>
      </div>
    `;

    const secondaryBlock = secondary
      ? `
      <div style="margin-top:18px;opacity:.92;">
        <div style="font-weight:700;">Secondary pull: ${escapeHtml(secondary.name)}</div>
        <div style="margin-top:8px;opacity:.9;">${escapeHtml(secondary.short)}</div>
      </div>
    `
      : "";

    assessment.innerHTML = `
      <div style="margin-top:18px;font-size:22px;font-weight:700;">Assessment</div>
      <div style="margin-top:8px;opacity:.88;">
        This is not a diagnosis. It is a structural snapshot of what you protected under pressure.
      </div>
      <div style="margin-top:14px;opacity:.92;">
        Answered: <span style="font-weight:700;">${nodeNums.length}</span>
      </div>
      <div style="margin-top:12px;opacity:.92;">
        ${breakdownHtml}
      </div>
      <div style="margin-top:14px;border-top:1px solid rgba(255,255,255,.10);padding-top:14px;">
        ${dominantBlock}
        ${secondaryBlock}
      </div>
      <div style="margin-top:18px;opacity:.92;">
        <div style="font-weight:700;margin-bottom:8px;">Your selections</div>
        ${picksHtml}
      </div>
    `;
  }

  function restartToCover() {
    clearChoices();
    setActive(0);
  }

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const startBtn = target.closest('[data-action="start"]');
    if (startBtn) {
      e.preventDefault();
      setActive(1);
      return;
    }

    const restartBtn =
      target.closest('[data-action="restart"]') ||
      target.closest("#beginAgainBtn") ||
      target.closest(".beginAgainBtn") ||
      target.closest(".restartBtn");

    if (restartBtn) {
      e.preventDefault();
      restartToCover();
      return;
    }

    // ultra-robust: if button text says "Begin again", treat it as restart
    const btn = target.closest("button");
    if (btn && (btn.textContent || "").trim().toLowerCase() === "begin again") {
      e.preventDefault();
      restartToCover();
      return;
    }

    const choiceBtn = target.closest(".choiceBtn");
    if (choiceBtn) {
      e.preventDefault();
      const node = choiceBtn.dataset.node || "";
      const choice = choiceBtn.dataset.choice || "0";
      const text = (choiceBtn.textContent || "").trim();
      recordChoice(node, choice, text);
      next();
      return;
    }
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      prev();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      next();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  initNodeChoices();
  setActive(0);
})();
