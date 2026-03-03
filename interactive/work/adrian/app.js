/* app.js */
(() => {
  const pages = Array.from(document.querySelectorAll(".page"));
  const pageLabel = document.getElementById("pageLabel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  const STORAGE_KEY = "lip_work_choices";
  let index = 0;

  // A = Hierarchy Defense
  // B = Narrative Control
  // C = Emotional Withdrawal
  // D = Lucid Tolerance
  const LETTERS = ["A", "B", "C", "D"];

  const VECTOR = [
    {
      key: "Hierarchy Defense",
      short:
        "You protect status,order,and legitimacy. Under pressure you default to authority framing,strength language,and “this is how it must be.”",
      risk:
        "You confuse stability with truth,and loyalty with correctness. You become uncorrectable,then isolated.",
      move:
        "Trade “being right” for “staying testable.” Name one disconfirming signal you would accept today,and run one concrete check.",
    },
    {
      key: "Narrative Control",
      short:
        "You protect coherence and meaning. Under pressure you tighten the story,frame doubt as ignorance,and push certainty for impact.",
      risk:
        "Listening becomes a threat to the narrative. You stop hearing signals and start managing optics.",
      move:
        "Replace certainty with precision. Say what you know,what you assume,and what you don’t know,then ask one question that could hurt your position.",
    },
    {
      key: "Emotional Withdrawal",
      short:
        "You protect yourself by exiting. Under pressure you disengage,detach,go cold,or disappear to reduce exposure.",
      risk:
        "You call it boundaries,but it’s avoidance dressed as principle. You keep the pattern intact and lose the chance to correct it in real time.",
      move:
        "Stay one step longer than your reflex. Do one clean direct conversation,then decide. No silent exits.",
    },
    {
      key: "Lucid Tolerance",
      short:
        "You can hold doubt without collapsing. Under pressure you slow down,test yourself,and remain reachable.",
      risk:
        "Openness can become refuge from commitment. You delay decisions to avoid consequence.",
      move:
        "Commit to one accountable action while still uncertain. Stay correctable,don’t stay vague.",
    },
  ];

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

  function setActive(i) {
    index = clamp(i);
    pages.forEach((p) => p.classList.remove("active"));
    if (pages[index]) pages[index].classList.add("active");
    updateNav();

    const scroller = pages[index]?.querySelector(".pageInner");
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

  function restartToCover() {
    clearChoices();
    setActive(0);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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
      assessment.innerHTML = `<div style="opacity:.85;margin-top:18px;">No choices were recorded.</div>`;
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

    const answered = counts.reduce((a, b) => a + b, 0);
    const rows = counts
      .map((v, i) => {
        const pct = answered ? Math.round((v / answered) * 100) : 0;
        const name = VECTOR[i].key;
        return `<div style="margin:6px 0;"><b>${LETTERS[i]}:</b> ${escapeHtml(name)} <span style="opacity:.85;">(${v}/${answered},${pct}%)</span></div>`;
      })
      .join("");

    const max = Math.max(...counts);
    const topIdx = counts.indexOf(max);
    const sortedIdx = [0,1,2,3].sort((a,b)=>counts[b]-counts[a]);
    const dom = VECTOR[sortedIdx[0]];
    const sec = VECTOR[sortedIdx[1]];

    const selections = pickedLines
      .map((x) => {
        return `<div style="margin:6px 0;display:flex;gap:10px;">
          <div style="width:70px;opacity:.9;">Node ${x.n}</div>
          <div style="width:18px;"><b>${escapeHtml(x.letter)}</b></div>
          <div style="opacity:.92;">${escapeHtml(x.text)}</div>
        </div>`;
      })
      .join("");

    assessment.innerHTML = `
      <h2 style="margin:18px 0 6px 0;">Assessment</h2>
      <div style="opacity:.9;margin:0 0 10px 0;">
        This is not a diagnosis. It is a structural snapshot of what you protected under pressure.
      </div>
      <div style="margin:10px 0 14px 0;">
        <div style="opacity:.85;margin-bottom:6px;">Answered: ${answered}</div>
        ${rows}
      </div>
      <div style="border-top:1px solid rgba(255,255,255,.10);margin:16px 0;"></div>
      <div style="margin:10px 0 0 0;">
        <div style="font-size:20px;margin-bottom:8px;"><b>Dominant pattern:</b> ${escapeHtml(dom.key)}</div>
        <div style="opacity:.95;margin-bottom:10px;">${escapeHtml(dom.short)}</div>
        <div style="opacity:.92;margin-bottom:10px;"><b>Risk:</b> ${escapeHtml(dom.risk)}</div>
        <div style="opacity:.92;margin-bottom:14px;"><b>Move:</b> ${escapeHtml(dom.move)}</div>

        <div style="font-size:18px;margin:18px 0 8px 0;"><b>Secondary pull:</b> ${escapeHtml(sec.key)}</div>
        <div style="opacity:.92;">${escapeHtml(sec.short)}</div>
      </div>

      <div style="border-top:1px solid rgba(255,255,255,.10);margin:18px 0;"></div>
      <div style="font-size:18px;margin:0 0 10px 0;"><b>Your selections</b></div>
      <div>${selections}</div>
    `;
  }

  document.addEventListener("click", (e) => {
    const t = e.target;

    const start = t?.closest?.("[data-action='start']");
    if (start) { setActive(1); return; }

    const restart = t?.closest?.("[data-action='restart']");
    if (restart) { restartToCover(); return; }

    const choose = t?.closest?.("[data-action='choose']");
    if (choose) {
      const node = Number(choose.dataset.node || "");
      const choice = Number(choose.dataset.choice || "");
      const text = choose.textContent || "";
      if (Number.isFinite(node) && Number.isFinite(choice)) {
        recordChoice(node, choice, text);
      }
      next();
      return;
    }

    const about = t?.closest?.("#aboutToggle");
    if (about) {
      e.preventDefault();
      const panel = document.getElementById("aboutPanel");
      if (panel) panel.classList.toggle("hidden");
    }
  });

  if (prevBtn) prevBtn.addEventListener("click", prev);
  if (nextBtn) nextBtn.addEventListener("click", next);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });

  const book = document.getElementById("book");
  let startX = null, startY = null;
  if (book) {
    book.addEventListener("pointerdown", (e) => { startX = e.clientX; startY = e.clientY; });
    book.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      startX = null; startY = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) next(); else prev();
    });
  }

  initNodeChoices();
  setActive(0);
})();
