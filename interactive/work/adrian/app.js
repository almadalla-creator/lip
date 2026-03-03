(() => {
  "use strict";

  const book = document.getElementById("book");
  const pagesWrap = book ? book.querySelector(".pages") : null;
  const pages = pagesWrap ? Array.from(pagesWrap.querySelectorAll(".page")) : [];

  const pageLabel = document.getElementById("pageLabel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  const VECTOR_LABELS = {
    A: "Hierarchy Defense",
    B: "Narrative Control",
    C: "Emotional Withdrawal",
    D: "Lucid Tolerance",
  };

  const VECTOR_BLURBS = {
    A: "You stabilize through authority, position, certainty, and control when pressure rises.",
    B: "You stabilize by narrating meaning, framing, moralizing, and explaining reality into coherence.",
    C: "You stabilize by distancing, minimizing exposure, and exiting emotionally when friction builds.",
    D: "You stabilize by holding doubt without collapse, slowing down, and refusing performative certainty.",
  };

  let current = 0; // 0 = cover
  let started = false;

  // Node answers keyed by node number string: "1".."n"
  const answers = Object.create(null);

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function isCoverPage(pageEl) {
    return !!(pageEl && pageEl.getAttribute("data-type") === "cover");
  }

  function isReflectionPage(pageEl) {
    if (!pageEl) return false;
    const t = (pageEl.textContent || "").trim().toLowerCase();
    return t.includes("reflection") && t.includes("about lip");
  }

  function getNodeNumber(pageEl) {
    if (!pageEl) return null;
    const inner = pageEl.querySelector(".pageInner") || pageEl;
    const h = inner.querySelector("h1,h2,h3");
    const title = (h ? h.textContent : inner.textContent || "").trim();
    const m = title.match(/node\s*(\d+)/i);
    return m ? m[1] : null;
  }

  function isNodePage(pageEl) {
    return getNodeNumber(pageEl) !== null;
  }

  function updatePageLabel() {
    if (!pageLabel) return;
    // Show 1-based page count excluding cover, but including reflection
    const total = Math.max(1, pages.length - 1);
    const shown = clamp(current, 1, pages.length - 1);
    const idx = Math.max(1, shown); // cover still shows 1
    pageLabel.textContent = `${idx} / ${total}`;
  }

  function setButtonsState() {
    if (prevBtn) prevBtn.disabled = current <= 0;

    if (!nextBtn) return;

    if (current >= pages.length - 1) {
      nextBtn.disabled = true;
      return;
    }

    const pageEl = pages[current];
    if (isCoverPage(pageEl)) {
      // Cover: next disabled until start is pressed (cleaner UX)
      nextBtn.disabled = !started;
      return;
    }

    if (isNodePage(pageEl)) {
      const nodeNo = getNodeNumber(pageEl);
      nextBtn.disabled = !answers[nodeNo];
      return;
    }

    nextBtn.disabled = false;
  }

  function showPage(idx) {
    current = clamp(idx, 0, pages.length - 1);
    pages.forEach((p, i) => p.classList.toggle("active", i === current));
    updatePageLabel();
    setButtonsState();

    // When landing on reflection, render assessment automatically
    const pageEl = pages[current];
    if (isReflectionPage(pageEl)) {
      renderAssessment(pageEl);
    }
  }

  function nextPage() {
    if (current >= pages.length - 1) return;

    const pageEl = pages[current];
    if (isCoverPage(pageEl) && !started) return;

    if (isNodePage(pageEl)) {
      const nodeNo = getNodeNumber(pageEl);
      if (!answers[nodeNo]) return;
    }

    showPage(current + 1);
  }

  function prevPage() {
    if (current <= 0) return;
    showPage(current - 1);
  }

  function hardReset() {
    // Clear answers
    Object.keys(answers).forEach(k => delete answers[k]);

    // Reset all node UI states
    pages.forEach(p => {
      const nodeNo = getNodeNumber(p);
      if (!nodeNo) return;
      const btns = p.querySelectorAll(".choiceBtn");
      btns.forEach(b => {
        b.classList.remove("selected");
        b.disabled = false;
        b.removeAttribute("aria-pressed");
      });
    });

    // Remove assessment block if exists
    pages.forEach(p => {
      const mount = p.querySelector("[data-assessment-mount]");
      if (mount) mount.remove();
    });

    started = false;
    showPage(0);
  }

  function computeVectorCounts() {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    let total = 0;

    for (const k of Object.keys(answers)) {
      const letter = answers[k].letter;
      if (counts[letter] !== undefined) {
        counts[letter] += 1;
        total += 1;
      }
    }

    let dominant = "A";
    let max = -1;
    for (const l of ["A", "B", "C", "D"]) {
      if (counts[l] > max) {
        max = counts[l];
        dominant = l;
      }
    }

    return { counts, total, dominant };
  }

  function renderAssessment(reflectionPageEl) {
    const { counts, total, dominant } = computeVectorCounts();

    const inner = reflectionPageEl.querySelector(".pageInner") || reflectionPageEl;

    // Make or replace mount
    let mount = reflectionPageEl.querySelector("[data-assessment-mount]");
    if (mount) mount.remove();

    mount = document.createElement("div");
    mount.setAttribute("data-assessment-mount", "1");
    mount.className = "assessmentCard";

    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

    // Build selections list in node order
    const nodeNumbers = Object.keys(answers)
      .map(n => parseInt(n, 10))
      .filter(n => Number.isFinite(n))
      .sort((a, b) => a - b);

    const selectionsHtml = nodeNumbers.length
      ? nodeNumbers.map(n => {
          const a = answers[String(n)];
          const safe = (s) => String(s).replace(/[&<>"']/g, (c) => ({
            "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
          }[c]));
          return `<div class="selRow"><span class="selNode">Node ${n}</span><span class="selPick">${a.letter}.</span><span class="selText">${safe(a.text)}</span></div>`;
        }).join("")
      : `<div class="selRow"><span class="selText">No node choices were recorded.</span></div>`;

    mount.innerHTML = `
      <div class="assessmentTitle">Assessment</div>
      <div class="assessmentLine">Dominant pattern: <span class="assessmentStrong">${VECTOR_LABELS[dominant]}</span></div>
      <div class="assessmentGrid">
        <div class="assessmentItem">A: ${VECTOR_LABELS.A} (${counts.A}/${total || 0}, ${pct(counts.A)}%)</div>
        <div class="assessmentItem">B: ${VECTOR_LABELS.B} (${counts.B}/${total || 0}, ${pct(counts.B)}%)</div>
        <div class="assessmentItem">C: ${VECTOR_LABELS.C} (${counts.C}/${total || 0}, ${pct(counts.C)}%)</div>
        <div class="assessmentItem">D: ${VECTOR_LABELS.D} (${counts.D}/${total || 0}, ${pct(counts.D)}%)</div>
      </div>
      <div class="assessmentBlurb">${VECTOR_BLURBS[dominant]}</div>
      <div class="assessmentSub">Your selections</div>
      <div class="selections">${selectionsHtml}</div>
    `;

    // Insert under "About LIP" link (or just append)
    const about = inner.querySelector(".aboutLink") || inner.querySelector("a");
    if (about && about.parentElement) {
      about.parentElement.insertAdjacentElement("afterend", mount);
    } else {
      inner.appendChild(mount);
    }

    // Ensure assessment is visible without needing manual scroll
    const scroller = inner;
    if (scroller && typeof scroller.scrollTo === "function") {
      scroller.scrollTo({ top: 0, behavior: "instant" });
    }
  }

  function convertNodePageToButtons(pageEl) {
    const nodeNo = getNodeNumber(pageEl);
    if (!nodeNo) return;

    const inner = pageEl.querySelector(".pageInner") || pageEl;

    // Already converted
    if (inner.querySelector(".choices")) return;

    // Collect paragraphs that look like the options: we take all <p> after the first prompt <p>
    const ps = Array.from(inner.querySelectorAll("p"));
    if (ps.length < 2) return;

    const promptP = ps[0];
    const optionPs = ps.slice(1).filter(p => (p.textContent || "").trim().length > 0);
    if (optionPs.length < 2) return;

    // Keep the original order, label A,B,C,D in that order
    const letters = ["A", "B", "C", "D"];

    const choicesWrap = document.createElement("div");
    choicesWrap.className = "choices";

    optionPs.forEach((p, i) => {
      const letter = letters[i] || letters[letters.length - 1];
      const text = (p.textContent || "").trim();

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choiceBtn";
      btn.setAttribute("data-node", nodeNo);
      btn.setAttribute("data-letter", letter);
      btn.setAttribute("aria-label", `Option ${letter}`);
      btn.innerHTML = `<span class="choiceLetter">${letter}.</span><span class="choiceText">${escapeHtml(text)}</span>`;

      // If already answered, reflect it
      if (answers[nodeNo] && answers[nodeNo].letter === letter) {
        btn.classList.add("selected");
        btn.setAttribute("aria-pressed", "true");
        btn.disabled = false;
      }

      choicesWrap.appendChild(btn);
    });

    // Remove old option paragraphs but keep prompt paragraph
    optionPs.forEach(p => p.remove());

    // Insert choices right after prompt paragraph
    promptP.insertAdjacentElement("afterend", choicesWrap);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function initAllNodes() {
    pages.forEach(p => {
      if (isNodePage(p)) convertNodePageToButtons(p);
    });
  }

  function onChoiceClick(btn) {
    const nodeNo = btn.getAttribute("data-node");
    const letter = btn.getAttribute("data-letter");
    const textEl = btn.querySelector(".choiceText");
    const text = textEl ? textEl.textContent.trim() : btn.textContent.trim();

    if (!nodeNo || !letter) return;

    answers[nodeNo] = { letter, text };

    // UI state: highlight chosen, disable none (you can change answer if you want)
    const pageEl = pages[current];
    const all = pageEl.querySelectorAll(`.choiceBtn[data-node="${nodeNo}"]`);
    all.forEach(b => {
      b.classList.toggle("selected", b === btn);
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    });

    setButtonsState();
  }

  function wireEvents() {
    // Nav buttons
    if (prevBtn) prevBtn.addEventListener("click", prevPage);
    if (nextBtn) nextBtn.addEventListener("click", nextPage);

    // Keyboard arrows
    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
    });

    // Global click delegation for: Start, Begin again, choices
    document.addEventListener("click", (e) => {
      const target = e.target;

      const start = target.closest('[data-action="start"], .startBtn');
      if (start) {
        started = true;
        // Go to first page after cover
        showPage(1);
        return;
      }

      const replay = target.closest('[data-action="replay"], [data-action="beginAgain"], .beginAgainBtn');
      if (replay) {
        hardReset();
        return;
      }

      const choiceBtn = target.closest(".choiceBtn");
      if (choiceBtn) {
        onChoiceClick(choiceBtn);
        return;
      }
    });
  }

  function boot() {
    if (!book || !pagesWrap || pages.length === 0) return;

    // Ensure exactly one active page
    pages.forEach((p, i) => p.classList.toggle("active", i === 0));

    // Convert node pages into clickable A,B,C,D buttons without changing story text order
    initAllNodes();

    wireEvents();
    showPage(0);
  }

  boot();
})();
