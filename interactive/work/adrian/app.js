// app.js
(() => {
  'use strict';

  const book = document.getElementById('book');
  const pages = Array.from(document.querySelectorAll('.page'));
  const pageLabel = document.getElementById('pageLabel');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (!book || pages.length === 0) return;

  const STORAGE_KEY = 'lip_story_state_v1';
  const VECTOR_BY_LETTER = {
    A: 'Hierarchy Defense',
    B: 'Narrative Control',
    C: 'Emotional Withdrawal',
    D: 'Lucid Tolerance'
  };

  let state = loadState() || {
    currentIndex: 0,
    started: false,
    selections: {}
  };

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function saveState(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(_){}
  }

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(_){ return null; }
  }

  function clearState(){
    try{ localStorage.removeItem(STORAGE_KEY); }catch(_){}
    state = { currentIndex: 0, started: false, selections: {} };
  }

  function setActivePage(index){
    state.currentIndex = clamp(index, 0, pages.length - 1);

    pages.forEach((p, i) => {
      p.classList.toggle('isActive', i === state.currentIndex);
      p.setAttribute('aria-hidden', i === state.currentIndex ? 'false' : 'true');
    });

    pageLabel.textContent = `${state.currentIndex + 1} / ${pages.length}`;

    prevBtn.disabled = (state.currentIndex === 0);
    nextBtn.disabled = (state.currentIndex === pages.length - 1);

    const active = pages[state.currentIndex];
    if(active && active.getAttribute('data-type') === 'result'){
      renderResult(active);
    }

    saveState();
  }

  function go(delta){ setActivePage(state.currentIndex + delta); }

  function applyStoredSelections(){
    pages.forEach((page) => {
      const nodeNum = page.getAttribute('data-node');
      if(!nodeNum) return;

      const chosenLetter = state.selections[nodeNum];
      if(!chosenLetter) return;

      const buttons = Array.from(page.querySelectorAll('button.choice-btn[data-choice]'));
      buttons.forEach((btn) => {
        const letter = (btn.getAttribute('data-choice') || '').toUpperCase();
        const isChosen = letter === chosenLetter;
        btn.classList.toggle('isSelected', isChosen);
        btn.disabled = !isChosen;
      });
    });
  }

  function selectChoice(page, btn){
    const nodeNum = page.getAttribute('data-node');
    const letter = (btn.getAttribute('data-choice') || '').toUpperCase();
    if(!nodeNum || !VECTOR_BY_LETTER[letter]) return;

    state.selections[nodeNum] = letter;

    const buttons = Array.from(page.querySelectorAll('button.choice-btn[data-choice]'));
    buttons.forEach((b) => {
      const l = (b.getAttribute('data-choice') || '').toUpperCase();
      const chosen = l === letter;
      b.classList.toggle('isSelected', chosen);
      b.disabled = !chosen;
    });

    saveState();

    if(state.currentIndex < pages.length - 1){
      window.setTimeout(() => go(1), 180);
    }
  }

  function scoreVectors(){
    const scores = { A:0, B:0, C:0, D:0 };
    Object.values(state.selections).forEach((letter) => {
      const L = String(letter || '').toUpperCase();
      if(scores[L] !== undefined) scores[L] += 1;
    });
    return scores;
  }

  function dominantLetter(scores){
    const entries = Object.entries(scores);
    entries.sort((a,b) => b[1] - a[1]);
    return entries[0] ? entries[0][0] : 'D';
  }

  function pct(count, total){
    if(!total) return 0;
    return Math.round((count / total) * 100);
  }

  function narrativeFor(vectorName){
    switch(vectorName){
      case 'Hierarchy Defense':
        return 'You didn’t just want to “do well.” You wanted to secure a position where doubt can’t reach you. Under pressure you formalize rank,tighten roles,and make the environment obey your structure. Risk: you stop listening the moment listening threatens the hierarchy you’re building.';
      case 'Narrative Control':
        return 'You don’t primarily fight people,you fight interpretations. Under exposure you stabilize yourself by producing meaning,framing events,turning ambiguity into coherence. Strength: you can hold complexity. Risk: you treat disagreement as ignorance and reality as a branding problem.';
      case 'Emotional Withdrawal':
        return 'When stakes rise,your system protects you by stepping back,less contact,less friction,less vulnerability. Strength: you avoid cheap escalation. Risk: you disappear exactly where presence is required and later call that “discipline.”';
      case 'Lucid Tolerance':
      default:
        return 'You can stay in contact with tension without needing to win it immediately. You allow doubt to exist without converting it into a verdict. Strength: you keep agency while others polarize. Risk: you confuse tolerance with resolution and delay the moment where a clean decision is required.';
    }
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#039;");
  }

  function renderResult(resultPage){
    const scores = scoreVectors();
    const totalAnswered = Object.keys(state.selections).length;
    const domLetter = dominantLetter(scores);
    const vectorName = VECTOR_BY_LETTER[domLetter] || 'Lucid Tolerance';

    const domEl = resultPage.querySelector('#dominant');
    const projEl = resultPage.querySelector('#projection');
    if(domEl) domEl.textContent = `Dominant pattern: ${vectorName}`;
    if(projEl) projEl.textContent = `This is not a diagnosis. It’s a structural snapshot of how you moved through pressure,exposure,validation,and doubt.`;

    const box = resultPage.querySelector('#assessment');
    if(!box) return;

    const rows = [
      `A: ${VECTOR_BY_LETTER.A} (${scores.A}/${totalAnswered},${pct(scores.A,totalAnswered)}%)`,
      `B: ${VECTOR_BY_LETTER.B} (${scores.B}/${totalAnswered},${pct(scores.B,totalAnswered)}%)`,
      `C: ${VECTOR_BY_LETTER.C} (${scores.C}/${totalAnswered},${pct(scores.C,totalAnswered)}%)`,
      `D: ${VECTOR_BY_LETTER.D} (${scores.D}/${totalAnswered},${pct(scores.D,totalAnswered)}%)`
    ];

    const selectionsLines = Object.keys(state.selections)
      .map((k) => Number(k))
      .filter((x) => Number.isFinite(x))
      .sort((a,b) => a-b)
      .map((nodeNum) => {
        const letter = state.selections[String(nodeNum)];
        const tEl = document.querySelector(`.page[data-node="${nodeNum}"] button.choice-btn[data-choice="${letter}"] .t`);
        const text = tEl ? tEl.textContent.trim() : '';
        return `Node ${nodeNum}: ${letter}) ${text}`;
      });

    box.innerHTML = `
      <div class="assessmentBox">
        <h2>Assessment</h2>
        <p class="assessmentNote">${escapeHtml(narrativeFor(vectorName))}</p>
        <div class="assessmentGrid">
          <div class="scoreLines">${rows.map(r => `<div>${escapeHtml(r)}</div>`).join('')}</div>
          <div class="answered">Answered: ${totalAnswered}</div>
        </div>
        <h3>Your selections</h3>
        <div class="selections">${selectionsLines.map(l => `<div>${escapeHtml(l)}</div>`).join('')}</div>
      </div>
    `;
  }

  document.addEventListener('click', (e) => {
    const t = e.target;

    const startBtn = t.closest('button[data-action="start"]');
    if(startBtn){
      state.started = true;
      saveState();
      setActivePage(1);
      return;
    }

    const replayBtn = t.closest('button[data-action="replay"],button[data-action="restart"]');
    if(replayBtn){
      clearState();
      pages.forEach((p) => {
        p.querySelectorAll('button.choice-btn').forEach((b) => {
          b.disabled = false;
          b.classList.remove('isSelected');
        });
      });
      setActivePage(0);
      return;
    }

    const choiceBtn = t.closest('button.choice-btn[data-choice]');
    if(choiceBtn){
      const page = choiceBtn.closest('.page');
      if(page) selectChoice(page, choiceBtn);
    }
  });

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));

  document.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowLeft') go(-1);
    if(e.key === 'ArrowRight') go(1);
  });

  setActivePage(state.currentIndex);
  applyStoredSelections();
})();
