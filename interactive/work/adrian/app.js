const scores={hierarchy:0,narrative:0,withdrawal:0,lucid:0};
const lastPick=[];

function getTopTwo(){
  const entries=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  const topScore=entries[0][1];
  const tied=entries.filter(e=>e[1]===topScore).map(e=>e[0]);
  let first=entries[0][0];
  if(tied.length>1){
    for(let i=lastPick.length-1;i>=0;i--){
      if(tied.includes(lastPick[i])){ first=lastPick[i]; break; }
    }
  }
  const second=Object.entries(scores).filter(e=>e[0]!==first).sort((a,b)=>b[1]-a[1])[0][0];
  return [first,second];
}

const labels={
  hierarchy:"Hierarchy Defense",
  narrative:"Narrative Control",
  withdrawal:"Emotional Withdrawal",
  lucid:"Lucid Tolerance"
};

const endings={
  "hierarchy+narrative":"(Placeholder) Hierarchy + Narrative ending text goes here.",
  "hierarchy+withdrawal":"(Placeholder) Hierarchy + Withdrawal ending text goes here.",
  "hierarchy+lucid":"(Placeholder) Hierarchy + Lucid ending text goes here.",
  "narrative+withdrawal":"(Placeholder) Narrative + Withdrawal ending text goes here.",
  "narrative+lucid":"(Placeholder) Narrative + Lucid ending text goes here.",
  "withdrawal+lucid":"(Placeholder) Withdrawal + Lucid ending text goes here."
};

function keyPair(a,b){return [a,b].sort().join("+");}

document.addEventListener("click",(e)=>{
  const btn=e.target.closest(".choice");
  if(!btn) return;
  const v=btn.dataset.vector;
  scores[v]++; lastPick.push(v);

  const node=btn.closest(".node");
  const next=node?.dataset.next;

  if(next){
    document.querySelector(next)?.scrollIntoView({behavior:"smooth"});
    return;
  }

  const [a,b]=getTopTwo();
  const resultKey=keyPair(a,b);
  document.getElementById("dominant").textContent=`Within the Work context, your dominant patterns were: ${labels[a]} + ${labels[b]}`;
  document.getElementById("projection").textContent=endings[resultKey]||"(Missing ending text)";
  document.getElementById("final").classList.remove("hidden");
  document.getElementById("final").scrollIntoView({behavior:"smooth"});
});

document.addEventListener("click",(e)=>{
  if(e.target.id!=="aboutToggle") return;
  e.preventDefault();
  document.getElementById("aboutPanel").classList.toggle("hidden");
});

document.addEventListener("click",(e)=>{
  if(e.target.id!=="replay") return;
  scores.hierarchy=scores.narrative=scores.withdrawal=scores.lucid=0;
  lastPick.length=0;
  document.getElementById("final").classList.add("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
});
