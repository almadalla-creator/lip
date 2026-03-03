/* interactive/work/adrian/app.js */
(function () {
  const pages = [...document.querySelectorAll(".page")];
  let idx = 0;
  const total = pages.length;

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pageLabel = document.getElementById("pageLabel");

  const STORAGE_KEY = "lip_work_choices_v2";

  const VECTOR = [
    {
      key: "Hierarchy Defense",
      short:
        "You protect status, order, and legitimacy. Under pressure, you default to authority, strength, rank, and “this is how it must be.”",
      risk:
        "You confuse stability with truth, and loyalty with correctness. You become uncorrectable, then isolated.",
      move:
        "Trade “being right” for “staying testable.” Name one thing that would disconfirm you, today, in public.",
    },
    {
      key: "Narrative Control",
      short:
        "You protect coherence and meaning. Under pressure, you tighten the story, frame doubt as ignorance, and push certainty for impact.",
      risk:
        "You start managing optics instead of signals. Listening becomes a threat, and reality becomes something to control.",
      move:
        "Replace certainty with precision. Say what you know, what you assume, what you don’t know, then ask one question that could hurt your position.",
    },
    {
      key: "Emotional Withdrawal",
      short:
        "You protect yourself by exiting. Under pressure, you disengage, detach, disappear, or go cold to reduce exposure.",
      risk:
        "You call it boundaries, but it’s avoidance dressed as principle. You keep the pattern intact and lose the chance to correct it in real time.",
      move:
        "Stay one step longer than your reflex. Do one clean direct conversation, then decide. No silent exits, no “ghosting with philosophy.”",
    },
    {
      key: "Lucid Tolerance",
      short:
        "You can hold doubt without collapsing. Under pressure, you slow down, test yourself, and remain reachable.",
      risk:
        "Openness can become a refuge from commitment. You keep everything open to avoid being accountable to one direction.",
      move:
        "Commit to one accountable action while still uncertain. Act without full certainty, and stay correctable.",
    },
  ];

  const VECTOR_KEY_TO_IDX = {
    hierarchy: 0,
    narrative: 1,
    withdrawal: 2,
    lucid: 3,
  };

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function updateNav() {
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;
    if (pageLabel) pageLabel.textContent = `${idx + 1} / ${total}`;
  }

  function clamp(i) {
    if (i < 0) return 0;
    if (i > total - 1) return total - 1;
    return i;
  }

  function show(i) {
    i = clamp(i);
    if (i === idx) return;

    const current = pages[idx];
    const next = pages[i];
    if (!current || !next) return;

    current.classList.remove("turning-in");
    current.classList.add("turning-out");

    next.classList.remove("hidden");
    next.classList.remove("turning-out");
    next.classList.add("turning-in");

    const cleanup = () => {
      current.classList.add("hidden");
      current.classList.remove("turning-out");
      next.classList.remove("turning-in");
      current.removeEventListener("animationend", cleanup);
    };
    current.addEventListener("animationend", cleanup);

    idx = i;
    updateNav();

    const scroller = next.querySelector(".pageInner") || next;
    scroller.scrollTop = 0;

    if ((next.dataset.type || "").toLowerCase() === "result") renderResult();
  }

  function getChoices() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") || [];
    } catch (_) {
      return [];
    }
  }

  function setChoices(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
  }

  function clearChoices() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function resetAndReplay() {
    clearChoices();
    show(1);
  }

  function labelFromVecKey(vecKey) {
    const idx = VECTOR_KEY_TO_IDX[vecKey];
    return VECTOR[idx]?.key || vecKey;
  }

  function detailFromVecKey(vecKey) {
    const idx = VECTOR_KEY_TO_IDX[vecKey];
    return VECTOR[idx]?.short || "";
  }

  function renderResult() {
    const resultPage = pages[idx];
    if (!resultPage) return;

    const choices = getChoices();
    const answered = choices.length;

    const counts = { hierarchy: 0, narrative: 0, withdrawal: 0, lucid: 0 };

    choices.forEach((c) => {
      if (c && c.vector && counts[c.vector] !== undefined) counts[c.vector] += 1;
    });

    const entries = Object.keys(counts).map((k) => ({
      k,
      v: counts[k],
    }));
    entries.sort((a, b) => b.v - a.v);

    const totalAnswers = answered || 1;
    const ranked = entries.map((x) => ({
      k: x.k,
      v: x.v,
      pct: Math.round((x.v / totalAnswers) * 100),
      vecIdx: VECTOR_KEY_TO_IDX[x.k],
    }));

    const dominant = ranked[0] && ranked[0].v > 0 ? ranked[0] : null;
    const secondary = ranked[1] && ranked[1].v > 0 ? ranked[1] : null;

    const dominantVec = dominant ? VECTOR[dominant.vecIdx] : null;
    const secondaryVec = secondary ? VECTOR[secondary.vecIdx] : null;

    const domLine = document.getElementById("dominant");
    const projLine = document.getElementById("projection");

    if (domLine) {
      domLine.textContent = dominantVec
        ? `Within the Work context, your dominant patterns were: ${dominantVec.key}.`
        : "Within the Work context, your dominant patterns were: not enough data yet.";
    }
    if (projLine) {
      projLine.textContent = dominantVec
        ? dominantVec.short
        : "Make choices at the nodes to generate a pattern readout.";
    }

    let assessment = resultPage.querySelector(".assessment");
    const inner = resultPage.querySelector(".pageInner") || resultPage;

    if (!assessment) {
      assessment = document.createElement("div");
      assessment.className = "assessment";
      assessment.style.marginTop = "22px";
      inner.appendChild(assessment);
    }

    if (!answered) {
      assessment.innerHTML = `
        <div style="opacity:.85;margin-top:18px;">
          No choices were recorded.
        </div>
      `;
      return;
    }

    const breakdownHtml = ranked
      .map((s) => {
        const v = VECTOR[s.vecIdx];
        return `<div style="margin:6px 0;">
          <span style="font-weight:700;">${escapeHtml(v.key)}</span>
          <span style="opacity:.75;margin-left:8px;">(${s.v}/${answered}, ${s.pct}%)</span>
        </div>`;
      })
      .join("");

    const dominantBlock = dominantVec
      ? `
      <div style="margin-top:10px;opacity:.95;">
        <div style="font-weight:700;">Dominant pattern: ${escapeHtml(dominantVec.key)}</div>
        <div style="margin-top:8px;opacity:.9;">${escapeHtml(dominantVec.short)}</div>
        <div style="margin-top:10px;opacity:.9;"><span style="font-weight:700;">Risk:</span> ${escapeHtml(dominantVec.risk)}</div>
        <div style="margin-top:10px;opacity:.9;"><span style="font-weight:700;">Move:</span> ${escapeHtml(dominantVec.move)}</div>
      </div>`
      : "";

    const secondaryBlock = secondaryVec
      ? `
      <div style="margin-top:18px;opacity:.92;">
        <div style="font-weight:700;">Secondary pull: ${escapeHtml(secondaryVec.key)}</div>
        <div style="margin-top:8px;opacity:.9;">${escapeHtml(secondaryVec.short)}</div>
      </div>`
      : "";

    const picksHtml = choices
      .slice()
      .sort((a, b) => (a.node || 0) - (b.node || 0))
      .map((x) => {
        const nodeLabel = `Node ${escapeHtml(x.node)}`;
        const letter = escapeHtml(x.letter || "?");
        const text = escapeHtml(x.text || "");
        return `
          <div style="margin:10px 0;opacity:.92;">
            <span style="display:inline-block;min-width:64px;opacity:.75;">${nodeLabel}</span>
            <span style="display:inline-block;min-width:28px;font-weight:700;">${letter}</span>
            <span>${text}</span>
          </div>
        `;
      })
      .join("");

    assessment.innerHTML = `
      <div style="margin-top:18px;font-size:22px;font-weight:700;">Assessment</div>
      <div style="margin-top:8px;opacity:.88;">
        This is not a diagnosis. It is a structural snapshot of what you protected under pressure.
      </div>
      <div style="margin-top:14px;opacity:.92;">
        Answered: <span style="font-weight:700;">${answered}</span>
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

  if (prevBtn) prevBtn.addEventListener("click", () => show(idx - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => show(idx + 1));

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });

  // swipe
  const book = document.getElementById("book");
  let startX = null,
    startY = null;
  if (book) {
    book.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
      startY = e.clientY;
    });
    book.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      startX = null;
      startY = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) show(idx + 1);
      else show(idx - 1);
    });
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    const startBtn = t.closest('[data-action="start"]');
    if (startBtn) {
      e.preventDefault();
      show(1);
      return;
    }

    const replayBtn =
      t.closest('[data-action="replay"]') ||
      t.closest('[data-action="restart"]') ||
      t.closest("#beginAgainBtn") ||
      t.closest(".beginAgainBtn") ||
      t.closest(".restartBtn");

    if (replayBtn) {
      e.preventDefault();
      resetAndReplay();
      return;
    }

    const aboutToggle = t.closest("#aboutToggle");
    if (aboutToggle) {
      e.preventDefault();
      const panel = document.getElementById("aboutPanel");
      if (panel) panel.classList.toggle("hidden");
      return;
    }

    const btn = t.closest(".choice");
    if (!btn) return;

    e.preventDefault();

    const nodeId = parseInt(btn.dataset.node || "0", 10);
    const letter = String(btn.dataset.choice || "").toUpperCase();
    if (!nodeId || !letter) return;

    const node = window.__NODE_LOOKUP__ && window.__NODE_LOOKUP__[nodeId];
    const chapter = node && node.chapter;

    // keep your existing per-chapter mapping
    const vec =
      (window.__VECTOR_MAP__ &&
        window.__VECTOR_MAP__[chapter] &&
        window.__VECTOR_MAP__[chapter][letter]) ||
      "narrative";

    const rawText = (btn.textContent || "").trim();
    const cleanedText = rawText.replace(/^[A-D]\s*[\.\-–—:]\s*/i, "").trim();

    const list = getChoices();
    const withoutThisNode = list.filter((x) => Number(x.node) !== nodeId);

    withoutThisNode.push({
      node: nodeId,
      chapter: chapter || "",
      letter,
      vector: vec,
      text: cleanedText,
    });

    setChoices(withoutThisNode);

    show(idx + 1);
  });

  // init pages visibility
  pages.forEach((p, i) => {
    if (i !== 0) p.classList.add("hidden");
  });
  updateNav();
})();
