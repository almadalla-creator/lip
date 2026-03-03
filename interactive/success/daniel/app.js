(function () {
  const pages = [...document.querySelectorAll('.page')];
  if (!pages.length) return;

  let idx = 0;
  const total = pages.length;

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageLabel = document.getElementById('pageLabel');

  const state = { hierarchy: 0, narrative: 0, withdrawal: 0, lucid: 0, choices: [] };

  const NODE_VECTOR_MAP = {
    1: { A: 'hierarchy',  B: 'narrative', C: 'withdrawal', D: 'lucid' },
    2: { A: 'lucid',     B: 'hierarchy', C: 'narrative',  D: 'withdrawal' },
    3: { A: 'narrative', B: 'withdrawal',C: 'lucid',      D: 'hierarchy' },
    4: { A: 'withdrawal',B: 'lucid',     C: 'hierarchy',  D: 'narrative' },
    5: { A: 'hierarchy', B: 'lucid',     C: 'narrative',  D: 'withdrawal' },
    6: { A: 'withdrawal',B: 'narrative', C: 'hierarchy',  D: 'lucid' },
    7: { A: 'lucid',     B: 'narrative', C: 'withdrawal', D: 'hierarchy' }
  };

  function updateNav() {
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;
    if (pageLabel) pageLabel.textContent = `${idx + 1} / ${total}`;
  }

  function show(i) {
    if (i < 0 || i >= total) return;

    const current = pages[idx];
    const next = pages[i];
    if (current === next) return;

    current.classList.remove('turning-in');
    current.classList.add('turning-out');

    next.classList.remove('hidden');
    next.classList.remove('turning-out');
    next.classList.add('turning-in');

    const cleanup = () => {
      current.classList.add('hidden');
      current.classList.remove('turning-out');
      next.classList.remove('turning-in');
      current.removeEventListener('animationend', cleanup);
    };
    current.addEventListener('animationend', cleanup);

    idx = i;
    updateNav();
    next.scrollTop = 0;

    if (next.dataset.type === 'result') renderResult();
  }

  function label(k) {
    if (k === 'hierarchy') return 'Hierarchy Defense';
    if (k === 'narrative') return 'Narrative Control';
    if (k === 'withdrawal') return 'Emotional Withdrawal';
    if (k === 'lucid') return 'Lucid Tolerance';
    return k;
  }

  function detail(k) {
    if (k === 'hierarchy') return 'You protect status under threat. You escalate, harden, and attempt to restore rank when recognition wobbles.';
    if (k === 'narrative') return 'You protect image under exposure. You try to steer perception when reality becomes unstable and public.';
    if (k === 'withdrawal') return 'You protect vulnerability by shrinking the field. You reduce contact, hide uncertainty, and wait for noise to fade.';
    if (k === 'lucid') return 'You tolerate loss without theatrical repair. You keep facts intact and choose clean boundaries over performance.';
    return '';
  }

  function breakTie(sortedKeys) {
    const topScore = state[sortedKeys[0]] || 0;
    const tied = sortedKeys.filter(k => (state[k] || 0) === topScore);
    if (tied.length <= 1) return tied[0] || sortedKeys[0];

    for (let i = state.choices.length - 1; i >= 0; i--) {
      const v = state.choices[i].vector;
      if (tied.includes(v)) return v;
    }
    return tied[0];
  }

  function renderResult() {
    const keys = ['hierarchy', 'narrative', 'withdrawal', 'lucid'];
    keys.sort((a, b) => (state[b] || 0) - (state[a] || 0));
    const top = breakTie(keys);

    const dom = document.getElementById('dominant');
    const proj = document.getElementById('projection');

    if (dom) dom.textContent = `Within the Success context, your dominant patterns were: ${label(top)}.`;
    if (proj) proj.textContent = detail(top);
  }

  function reset() {
    state.hierarchy = 0;
    state.narrative = 0;
    state.withdrawal = 0;
    state.lucid = 0;
    state.choices = [];
    const panel = document.getElementById('aboutPanel');
    if (panel) panel.classList.add('hidden');
  }

  pages.forEach((p, i) => { if (i !== 0) p.classList.add('hidden'); });
  updateNav();

  if (prevBtn) prevBtn.addEventListener('click', () => show(idx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => show(idx + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });

  let startX = null, startY = null;
  const book = document.getElementById('book');
  if (book) {
    book.addEventListener('pointerdown', (e) => { startX = e.clientX; startY = e.clientY; });
    book.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      startX = null; startY = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) show(idx + 1);
      else show(idx - 1);
    });
  }

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t) return;

    if (t.dataset && t.dataset.action === 'start') { show(1); return; }
    if (t.dataset && t.dataset.action === 'replay') { reset(); show(0); return; }

    const about = t.closest && t.closest('#aboutToggle');
    if (about) {
      e.preventDefault();
      const panel = document.getElementById('aboutPanel');
      if (panel) panel.classList.toggle('hidden');
      return;
    }

    const btn = t.closest && t.closest('.choice');
    if (!btn) return;

    const nodeId = parseInt(btn.dataset.node || '0', 10);
    const letter = (btn.dataset.choice || '').toUpperCase();
    if (!nodeId || !letter) return;

    const vec = (NODE_VECTOR_MAP[nodeId] && NODE_VECTOR_MAP[nodeId][letter]) || 'narrative';
    state[vec] = (state[vec] || 0) + 1;
    state.choices.push({ node: nodeId, letter, vector: vec });

    show(idx + 1);
  });
})();
