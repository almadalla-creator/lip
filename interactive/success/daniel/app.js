alert('app.js loaded');
(function(){

  const pages=[...document.querySelectorAll('.page')];
  let idx=0;
  const total=pages.length;

  const prevBtn=document.getElementById('prevBtn');
  const nextBtn=document.getElementById('nextBtn');
  const pageLabel=document.getElementById('pageLabel');

  const state={
    hierarchy:0,
    narrative:0,
    withdrawal:0,
    lucid:0,
    choices:[],
    answered:{}
  };

  // ===============================
  // SUCCESS NODE STRUCTURE
  // ===============================

  window.__NODE_LOOKUP__ = {
    1:{chapter:6},
    2:{chapter:9},
    3:{chapter:15},
    4:{chapter:20},
    5:{chapter:23},
    6:{chapter:29},
    7:{chapter:39},
  };

  window.__VECTOR_MAP__ = {
    6:  {A:'hierarchy',B:'narrative',C:'withdrawal',D:'lucid'},
    9:  {A:'lucid',B:'hierarchy',C:'narrative',D:'hierarchy'},
    15: {A:'hierarchy',B:'narrative',C:'withdrawal',D:'lucid'},
    20: {A:'narrative',B:'narrative',C:'hierarchy',D:'lucid'},
    23: {A:'hierarchy',B:'lucid',C:'narrative',D:'withdrawal'},
    29: {A:'narrative',B:'lucid',C:'hierarchy',D:'hierarchy'},
    39: {A:'hierarchy',B:'narrative',C:'withdrawal',D:'lucid'}
  };

  // ===============================
  // NAVIGATION
  // ===============================

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

  // Swipe

  let startX=null,startY=null;
  const book=document.getElementById('book');

  book.addEventListener('pointerdown',(e)=>{
    startX=e.clientX;
    startY=e.clientY;
  });

  book.addEventListener('pointerup',(e)=>{
    if(startX===null) return;
    const dx=e.clientX-startX;
    const dy=e.clientY-startY;
    startX=null;startY=null;
    if(Math.abs(dx)<60 || Math.abs(dx)<Math.abs(dy)) return;
    if(dx<0) show(idx+1);
    else show(idx-1);
  });

  // Start / Replay

  document.addEventListener('click',(e)=>{
    const t=e.target;
    if(t && t.dataset && t.dataset.action==='start'){ show(1); }
    if(t && t.dataset && t.dataset.action==='replay'){ reset(); show(1); }
  });

  // ===============================
  // NODE SELECTION
  // ===============================

  document.addEventListener('click',(e)=>{
    const btn=e.target.closest('.choice');
    if(!btn) return;

    const nodeId=parseInt(btn.dataset.node||'0',10);
    const letter=(btn.dataset.choice||'').toUpperCase();
    if(!nodeId||!letter) return;

    if(state.answered[nodeId]){
      show(idx+1);
      return;
    }

    const node=window.__NODE_LOOKUP__[nodeId];
    const chapter=node && node.chapter;
    const vec=(window.__VECTOR_MAP__[chapter] && window.__VECTOR_MAP__[chapter][letter]) || 'narrative';

    state[vec]+=1;
    state.choices.push({node:nodeId,chapter,letter,vector:vec});
    state.answered[nodeId]=true;

    const page=pages[idx];
    if(page){
      page.querySelectorAll('.choice').forEach(b=>{
        b.style.pointerEvents='none';
        b.style.opacity='0.6';
      });
    }

    show(idx+1);
  });

  // ===============================
  // ENDINGS
  // ===============================

  const ENDINGS={
    "hierarchy|narrative":
`You defend position first,explain later.

When questioned,you tighten control and refine language.

You appear stable.
You are dependent on dominance.

If recognition fades,you will attempt to rebuild authority before rebuilding yourself.

Unless you dismantle the need to control interpretation,you will always require an audience to confirm you exist.`,

    "hierarchy|withdrawal":
`You escalate publicly and close privately.

You fight to preserve position,yet detach emotionally when pressure rises.

You appear strong.
You isolate quietly.

Your blind spot is not weakness.
It is fear of being seen unraveling.`,

    "hierarchy|lucid":
`You seek dominance,but you can observe yourself.

You escalate under pressure,yet retain capacity for self-correction.

If collapse comes,you are capable of rebuilding without theatrics.

Few can do both.`,

    "narrative|withdrawal":
`You manage perception carefully.

When destabilized,you reposition rather than confront.

You survive decline.
But survival is not transformation.`,

    "narrative|lucid":
`You adjust language without losing awareness.

You can revise without humiliation.

Influence does not fully define you.
But being perceived accurately still matters more than you admit.`,

    "withdrawal|lucid":
`You tolerate invisibility better than most.

When pressure rises,you reassess instead of perform.

Your risk is subtle.

Did you rebuild quietly,
or did you avoid being seen altogether?`
  };

  function pickTop(candidates){
    let max=-1;
    candidates.forEach(k=>{
      if(state[k]>max) max=state[k];
    });
    let tied=candidates.filter(k=>state[k]===max);
    if(tied.length===1) return tied[0];
    for(let i=state.choices.length-1;i>=0;i--){
      const v=state.choices[i].vector;
      if(tied.includes(v)) return v;
    }
    return tied[0];
  }

  function renderResult(){
    const all=['hierarchy','narrative','withdrawal','lucid'];
    const primary=pickTop(all);
    const secondary=pickTop(all.filter(v=>v!==primary));
    const key=`${primary}|${secondary}`;
    const ending=ENDINGS[key] || ENDINGS[`${secondary}|${primary}`];

    const dom=document.getElementById('dominant');
    const proj=document.getElementById('projection');

    if(dom) dom.textContent="Reflection";
    if(proj) proj.textContent=ending;
  }

  function reset(){
    state.hierarchy=0;
    state.narrative=0;
    state.withdrawal=0;
    state.lucid=0;
    state.choices=[];
    state.answered={};
    const panel=document.getElementById('aboutPanel');
    if(panel) panel.classList.add('hidden');
  }

  pages.forEach((p,i)=>{ if(i!==0) p.classList.add('hidden'); });
  updateNav();

})();
