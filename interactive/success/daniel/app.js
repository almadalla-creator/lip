/* app.js */
(() => {
  const pages = Array.from(document.querySelectorAll(".page"));
  const pageLabel = document.getElementById("pageLabel");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

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
    // A,B,C... then AA,AB... if ever needed
    const n = Number(i);
    if (!Number.isFinite(n) || n < 0) return "";
    const A = "A".charCodeAt(0);
    if (n < 26) return String.fromCharCode(A + n);
    const first = Math.floor(n / 26) - 1;
    const second = n % 26;
    return String.fromCharCode(A + first) + String.fromCharCode(A + second);
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

      if (prompt && prompt.parentNode) {
        prompt.insertAdjacentElement("afterend", choicesWrap);
      } else {
        inner.appendChild(choicesWrap);
      }
    });
  }

  function recordChoice(node, choice, text) {
    const key = "lip_success_choices";
    let data = {};
    try { data = JSON.parse(localStorage.getItem(key) || "{}"); } catch (_) { data = {}; }

    if (node) {
      data[node] = { choice: Number(choice), text: String(text || "") };
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  document.addEventListener("click", (e) => {
    const t = e.target;

    if (t && t.matches('[data-action="start"]')) {
      e.preventDefault();
      setActive(1);
      return;
    }

    if (t && t.matches(".choiceBtn")) {
      e.preventDefault();
      const node = t.dataset.node || "";
      const choice = t.dataset.choice || "0";
      const raw = t.dataset.raw || (t.textContent || "");
      recordChoice(node, choice, raw);
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
