(function(){
  const pages=[...document.querySelectorAll('.page')];
  let idx=0;
  const total=pages.length;
  const prevBtn=document.getElementById('prevBtn');
  const nextBtn=document.getElementById('nextBtn');
  const pageLabel=document.getElementById('pageLabel');
  const state={hierarchy:0,narrative:0,withdrawal:0,lucid:0,choices:[]};

  function updateNav(){
    prevBtn.disabled = idx===0;
    nextBtn.disabled = idx===total-1;
    pageLabel.textContent = `${idx+1} / ${total}`;
  }

  function show(i){
    if(i<0||i>=total) return;
    const current=pages[idx];
    const next=pages[i];
    if(current===next) return;

    current.classList.remove('turning-in');
    current.classList.add('turning-out');

    next.classList.remove('hidden');
    next.classList.remove('turning-out');
    next.classList.add('turning-in');

    const cleanup=()=>{
      current.classList.add('hidden');
      current.classList.remove('turning-out');
      next.classList.remove('turning-in');
      current.removeEventListener('animationend',cleanup);
    };
    current.addEventListener('animationend',cleanup);

    idx=i;
    updateNav();
    next.scrollTop=0;

    if(next.dataset.type==='result'){ renderResult(); }
  }

  prevBtn.addEventListener('click',()=>show(idx-1));
  nextBtn.addEventListener('click',()=>show(idx+1));

  document.addEventListener('keydown',(e)=>{
    if(e.key==='ArrowLeft') show(idx-1);
    if(e.key==='ArrowRight') show(idx+1);
  });

  // swipe
  let startX=null,startY=null;
  const book=document.getElementById('book');
  book.addEventListener('pointerdown',(e)=>{startX=e.clientX;startY=e.clientY;});
  book.addEventListener('pointerup',(e)=>{
    if(startX===null) return;
    const dx=e.clientX-startX, dy=e.clientY-startY;
    startX=null;startY=null;
    if(Math.abs(dx)<60 || Math.abs(dx)<Math.abs(dy)) return;
    if(dx<0) show(idx+1);
    else show(idx-1);
  });

  document.addEventListener('click',(e)=>{
    const t=e.target;
    if(t && t.dataset && t.dataset.action==='start'){ show(1); }
    if(t && t.dataset && t.dataset.action==='replay'){ reset(); show(1); }
  });

  document.addEventListener('click',(e)=>{
    const btn=e.target.closest('.choice');
    if(!btn) return;
    const nodeId=parseInt(btn.dataset.node||'0',10);
    const letter=(btn.dataset.choice||'').toUpperCase();
    if(!nodeId||!letter) return;
    const node=window.__NODE_LOOKUP__[nodeId];
    const chapter=node && node.chapter;
    const vec=(window.__VECTOR_MAP__[chapter] && window.__VECTOR_MAP__[chapter][letter]) || 'narrative';
    state[vec]=(state[vec]||0)+1;
    state.choices.push({node:nodeId,chapter,letter,vector:vec});
    show(idx+1);
  });

  document.addEventListener('click',(e)=>{
    const a=e.target.closest('#aboutToggle');
    if(!a) return;
    e.preventDefault();
    const panel=document.getElementById('aboutPanel');
    if(panel) panel.classList.toggle('hidden');
  });

  function label(k){
    if(k==='hierarchy') return 'Hierarchy Defense';
    if(k==='narrative') return 'Narrative Control';
    if(k==='withdrawal') return 'Emotional Withdrawal';
    if(k==='lucid') return 'Lucid Tolerance';
    return k;
  }

  function detail(k){
    if(k==='hierarchy') return 'You protect position when reduced. You escalate to restore authority, even when facts are already clear.';
    if(k==='narrative') return 'You protect image under exposure. You try to control perception when reality becomes public and unstable.';
    if(k==='withdrawal') return 'You protect vulnerability by shrinking the field. You reduce exposure, avoid contact, and hide uncertainty behind distance.';
    if(k==='lucid') return 'You tolerate uncertainty without needing to win. You keep facts intact and choose clean boundaries over performance.';
    return '';
  }

  function renderResult(){
    const entries=['hierarchy','narrative','withdrawal','lucid'];
    entries.sort((a,b)=> (state[b]||0)-(state[a]||0));
    const top=entries[0];
    const dom=document.getElementById('dominant');
    const proj=document.getElementById('projection');
    if(dom) dom.textContent = `Within the Work context, your dominant patterns were: ${label(top)}.`;
    if(proj) proj.textContent = detail(top);
  }

  function reset(){
    state.hierarchy=0;state.narrative=0;state.withdrawal=0;state.lucid=0;state.choices=[];
    const panel=document.getElementById('aboutPanel');
    if(panel) panel.classList.add('hidden');
  }

  pages.forEach((p,i)=>{ if(i!==0) p.classList.add('hidden'); });
  updateNav();
})();
