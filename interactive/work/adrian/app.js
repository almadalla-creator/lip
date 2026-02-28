const scores={hierarchy:0,narrative:0,withdrawal:0,lucid:0};
const lastPick=[];
const labels={
  hierarchy:"Hierarchy Defense",
  narrative:"Narrative Control",
  withdrawal:"Emotional Withdrawal",
  lucid:"Lucid Tolerance"
};
const endings={
  "hierarchy+narrative":`You defend position when reduced,and you defend the frame when exposed.
Your default move is correction,not surrender.
This makes you effective and respected,but it can make closeness expensive.`,
  "hierarchy+withdrawal":`You defend ground in conflict,then you disappear internally.
People experience strength and distance at the same time.
Control protects you,then isolates you.`,
  "hierarchy+lucid":`You still value position,but you can tolerate reduction without immediate retaliation.
Urgency drops. You act less automatically.
Control becomes optional,not compulsory.`,
  "narrative+withdrawal":`You manage perception,then you manage distance.
Conflict decreases,but so does intimacy.
Your stability is paid for with emotional access.`,
  "narrative+lucid":`You can shape language without becoming trapped by it.
You admit uncertainty earlier.
You keep structure,but you stop defending it reflexively.`,
  "withdrawal+lucid":`You still feel anxiety,but you stay present longer.
You don’t need to win certainty to keep moving.
Less defense,less isolation.`
};
function pairKey(a,b){return [a,b].sort().join("+");}
function getTopTwo(){
  const entries=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  const topScore=entries[0][1];
  const tied=entries.filter(e=>e[1]===topScore).map(e=>e[0]);
  let first=entries[0][0];
  if(tied.length>1){
    for(let i=lastPick.length-1;i>=0;i--){ if(tied.includes(lastPick[i])){ first=lastPick[i]; break; } }
  }
  const second=Object.entries(scores).filter(e=>e[0]!==first).sort((a,b)=>b[1]-a[1])[0][0];
  return [first,second];
}
function revealResult(){
  const [a,b]=getTopTwo();
  document.getElementById("dominant").textContent=
    `Within the Work context, your dominant patterns were: ${labels[a]} + ${labels[b]}`;
  document.getElementById("projection").textContent=endings[pairKey(a,b)] || "Result text missing.";
  document.getElementById("result").classList.remove("hidden");
  document.getElementById("result").scrollIntoView({behavior:"smooth"});
}
document.addEventListener("click",(e)=>{
  const btn=e.target.closest(".choice");
  if(!btn) return;
  if(btn.id==="replay" || btn.id==="showResult") return;
  const v=btn.dataset.vector;
  if(!v || !(v in scores)) return;
  scores[v]++; lastPick.push(v);
  const node=btn.closest(".node");
  const next=node?.dataset.next;
  if(next) document.querySelector(next)?.scrollIntoView({behavior:"smooth"});
});
document.addEventListener("click",(e)=>{
  if(e.target.id==="showResult"){ e.preventDefault(); revealResult(); }
  if(e.target.id==="aboutToggle"){ e.preventDefault(); document.getElementById("aboutPanel").classList.toggle("hidden"); }
});
document.addEventListener("click",(e)=>{
  if(e.target.id!=="replay") return;
  scores.hierarchy=scores.narrative=scores.withdrawal=scores.lucid=0;
  lastPick.length=0;
  document.getElementById("result").classList.add("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
});
