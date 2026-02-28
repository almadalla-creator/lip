const scores={hierarchy:0,narrative:0,withdrawal:0,lucid:0};
const lastPick=[];

const labels={
  hierarchy:"Hierarchy Defense",
  narrative:"Narrative Control",
  withdrawal:"Emotional Withdrawal",
  lucid:"Lucid Tolerance"
};

const endings={
  "hierarchy+narrative":`You restore position when reduced. You reorganize perception when exposed.
You do not tolerate narrowing quietly. You move. You correct the frame. You regain ground.
This makes you effective. It also makes you guarded.
When tension rises, you escalate. When image cracks, you refine the story.
Your life will look structured. Your authority will feel solid. Intimacy will feel more fragile.
You will win competence repeatedly. You may struggle to feel fully met.
Control will protect you. Control will also distance you.`,
  "hierarchy+withdrawal":`You assert when challenged. You retreat when overwhelmed.
You defend ground fiercely,then you disappear internally.
You do not like being reduced. You also do not like being exposed.
People will experience you as strong in conflict,and difficult to reach in vulnerability.
Your relationships will feel stable until they feel distant.
Control here is not loud,it is protective.
Isolation will not arrive dramatically,it will accumulate quietly.`,
  "hierarchy+lucid":`You still move when reduced,but you pause more than before.
You value position,but you do not restore it immediately.
You can tolerate being challenged without collapsing into defense.
Authority remains,urgency decreases.
You may still feel the impulse to control,you simply see it.
Isolation reduces when control softens.
You will not be free from tension,you will be less ruled by it.`,
  "narrative+withdrawal":`You smooth perception before addressing exposure.
You rarely confront directly,you rarely reveal raw uncertainty.
You appear composed,inside pressure accumulates.
You stabilize situations through language,you stabilize yourself through distance.
Conflict decreases,closeness decreases with it.
Your life will not explode,it may thin.
Control here is subtle,isolation here is slow.`,
  "narrative+lucid":`You adjust language intelligently,but you notice when you are doing it.
You care about perception,but you are less imprisoned by it.
You can admit misalignment without collapsing your frame.
Your authority becomes quieter,your anxiety becomes manageable.
You are not immune to control,you are less dependent on it.
Isolation becomes optional,not structural.`,
  "withdrawal+lucid":`You reduce exposure less than you once did.
You still feel anxiety,you do not always act on it.
You may not dominate rooms,you do not disappear from them either.
You are learning to stay without defending.
Your life may feel less impressive,it will feel lighter.
Control loses urgency,isolation loses momentum.`
};

function keyPair(a,b){return [a,b].sort().join("+");}

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

document.addEventListener("click",(e)=>{
  const btn=e.target.closest(".choice");
  if(!btn) return;
  const v=btn.dataset.vector;
  if(!v || !(v in scores)) return;

  scores[v]++; 
  lastPick.push(v);

  const node=btn.closest(".node");
  const next=node?.dataset.next;

  if(next){
    document.querySelector(next)?.scrollIntoView({behavior:"smooth"});
    return;
  }

  const [a,b]=getTopTwo();
  const line=`Within the Work context, your dominant patterns were: ${labels[a]} + ${labels[b]}`;
  document.getElementById("dominant").textContent=line;

  const resultKey=keyPair(a,b);
  document.getElementById("projection").textContent=endings[resultKey] || "Result text missing.";

  document.getElementById("result").classList.remove("hidden");
  document.getElementById("result").scrollIntoView({behavior:"smooth"});
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
  document.getElementById("result").classList.add("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
});
