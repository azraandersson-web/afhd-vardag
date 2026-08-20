
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const todayKey = () => new Date().toISOString().slice(0,10);
const money = n => new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK',maximumFractionDigits:0}).format(n||0);
const dt = s => new Date(s).toLocaleString('sv-SE',{dateStyle:'medium',timeStyle:'short'});

const defaults = {
  tasks:["Ta medicin","Borsta tänderna – morgon","Dagens viktigaste uppgift","En liten städuppgift","Borsta tänderna – kväll"],
  routines:["Drick vatten","Ät något","Kolla kalendern","Nycklar, plånbok, telefon","Ladda telefonen"],
  cleaning:["Torka köksbänken","Töm soporna","Plocka i 5 minuter","Rengör handfatet"],
  bills:["Hyra","El","Mobil","Internet","Försäkring"],
  savingsGoal:10000,savingsCurrent:0,smokeDailyCost:0,quitDate:"2026-09-10"
};
let data = JSON.parse(localStorage.getItem("adhdVardagData")||"{}");
data = {...defaults,...data};
data.done = data.done||{};
data.events = data.events||[];
data.purchases = data.purchases||[];
data.brain = data.brain||[];
data.billDone = data.billDone||{};
data.routineDone = data.routineDone||{};
data.cleaningDone = data.cleaningDone||{};

function save(){ localStorage.setItem("adhdVardagData",JSON.stringify(data)); render(); }
function toggleMap(map,key){ map[key]=!map[key]; save(); }

function renderRows(container, items, map, prefix){
  container.innerHTML="";
  items.forEach((t,i)=>{
    const k=`${todayKey()}-${prefix}-${i}`, done=!!map[k];
    const row=document.createElement("div"); row.className="row";
    row.innerHTML=`<button class="check ${done?'done':''}">${done?'✓':''}</button><div class="rowText ${done?'done':''}">${t}</div>`;
    row.querySelector("button").onclick=()=>toggleMap(map,k);
    container.appendChild(row);
  });
}
function renderTasks(){
  const c=$("#todayTasks"); c.innerHTML="";
  data.tasks.forEach((t,i)=>{
    const k=`${todayKey()}-task-${i}`, done=!!data.done[k];
    const row=document.createElement("div"); row.className="row";
    row.innerHTML=`<button class="check ${done?'done':''}">${done?'✓':''}</button><div class="rowText ${done?'done':''}">${t}</div><button class="linkBtn">×</button>`;
    row.children[0].onclick=()=>toggleMap(data.done,k);
    row.children[2].onclick=()=>{data.tasks.splice(i,1);save()};
    c.appendChild(row);
  });
}
function renderEvents(){
  const future=data.events.slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
  $("#eventsList").innerHTML=future.length?future.map((e,i)=>`<div class="row"><div class="rowText"><b>${e.title}</b><br><small class="muted">${dt(e.date)}</small></div><button class="linkBtn" data-ev="${i}">×</button></div>`).join(""):`<p class="muted">Inget inlagt ännu.</p>`;
  $$("[data-ev]").forEach(b=>b.onclick=()=>{data.events.splice(+b.dataset.ev,1);save()});
}
function renderPurchases(){
  const todays=data.purchases.filter(p=>p.day===todayKey());
  const sum=todays.reduce((a,p)=>a+Number(p.amount),0);
  $("#spentToday").textContent=money(sum);
  $("#moneyMini").textContent=`${money(sum)} idag`;
  $("#purchaseList").innerHTML=todays.length?todays.map((p,i)=>`<div class="row"><div class="rowText"><b>${p.name}</b><br><small class="muted">${p.category}</small></div><b>${money(p.amount)}</b></div>`).join(""):`<p class="muted">Inga köp registrerade idag.</p>`;
}
function renderSavings(){
  const pct=Math.max(0,Math.min(100,(data.savingsCurrent/data.savingsGoal)*100));
  $("#saveBar").style.width=pct+"%"; $("#saveText").textContent=`${money(data.savingsCurrent)} / ${money(data.savingsGoal)}`;
}
function renderBrain(){
  $("#brainList").innerHTML=data.brain.length?data.brain.slice().reverse().map(x=>`<div class="row"><div class="rowText">${x}</div></div>`).join(""):`<p class="muted">Tomt huvud, tom lista ✨</p>`;
}
function renderSmoke(){
  const q=new Date(data.quitDate+"T00:00:00"), now=new Date(), diff=q-now;
  if(diff>0){
    const days=Math.ceil(diff/86400000);
    $("#quitCountdown").textContent=`${days} dagar kvar till stoppdagen.`;
    $("#smokeDays").textContent="0";
    $("#smokeSaved").textContent=money(0);
    $("#smokeMini").textContent=`${days} dagar kvar`;
  }else{
    const days=Math.floor((now-q)/86400000);
    const saved=days*Number(data.smokeDailyCost||0);
    $("#quitCountdown").textContent=`Du har passerat stoppdagen. En dag i taget.`;
    $("#smokeDays").textContent=days;
    $("#smokeSaved").textContent=money(saved);
    $("#smokeMini").textContent=`${days} rökfria dagar`;
  }
  $("#smokeDailyCost").value=data.smokeDailyCost||"";
}
function renderBills(){renderRows($("#billsList"),data.bills,data.billDone,"bill")}
function render(){
  $("#todayLabel").textContent=new Date().toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'});
  renderTasks(); renderRows($("#routineList"),data.routines,data.routineDone,"routine"); renderRows($("#cleaningList"),data.cleaning,data.cleaningDone,"clean");
  renderEvents();renderPurchases();renderSavings();renderBills();renderBrain();renderSmoke();
  const tips=["Gör uppgiften mindre tills den känns nästan löjligt enkel.","Lägg det du måste komma ihåg där du ser det.","Fem minuter räknas. Du behöver inte bli klar.","Förbered nästa steg innan du avslutar det du gör.","Skriv ner tanken direkt istället för att försöka hålla den i huvudet."];
  $("#dailyTip").textContent=tips[new Date().getDate()%tips.length];
}
function go(name){
  $$(".screen").forEach(x=>x.classList.toggle("active",x.dataset.screen===name));
  $$("nav button").forEach(x=>x.classList.toggle("active",x.dataset.go===name));
  const names={today:"Idag",calendar:"Kalender",routines:"Rutiner",money:"Pengar",more:"Mer",smoke:"Rökfri",stuck:"Jag har fastnat"};
  $("#pageTitle").textContent=names[name]||"ADHD Vardag";
  scrollTo(0,0);
}
$$("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
$("#taskForm").onsubmit=e=>{e.preventDefault();const v=$("#taskInput").value.trim();if(v){data.tasks.push(v);$("#taskInput").value="";save()}};
$("#eventForm").onsubmit=e=>{e.preventDefault();data.events.push({title:$("#eventTitle").value.trim(),date:$("#eventDate").value});$("#eventTitle").value="";$("#eventDate").value="";save()};
$("#purchaseForm").onsubmit=e=>{e.preventDefault();const amount=parseFloat($("#purchaseAmount").value.replace(",","."));if(!isNaN(amount)){data.purchases.push({name:$("#purchaseName").value.trim(),amount,category:$("#purchaseCategory").value,day:todayKey()});$("#purchaseName").value="";$("#purchaseAmount").value="";save()}};
$("#brainForm").onsubmit=e=>{e.preventDefault();const v=$("#brainInput").value.trim();if(v){data.brain.push(v);$("#brainInput").value="";save()}};
$("#clearPurchases").onclick=()=>{if(confirm("Rensa dagens registrerade köp?")){data.purchases=data.purchases.filter(p=>p.day!==todayKey());save()}};
$("#resetToday").onclick=()=>{Object.keys(data.done).filter(k=>k.startsWith(todayKey())).forEach(k=>delete data.done[k]);save()};
$("#editSavings").onclick=()=>{const g=prompt("Sparmål i kronor:",data.savingsGoal);const c=prompt("Hur mycket har du sparat hittills?",data.savingsCurrent);if(g!==null&&c!==null){data.savingsGoal=Number(g)||0;data.savingsCurrent=Number(c)||0;save()}};
$("#saveSmokeCost").onclick=()=>{data.smokeDailyCost=parseFloat($("#smokeDailyCost").value.replace(",","."))||0;save()};
const cravings=["Sätt en timer på 5 minuter. Sug brukar komma i vågor och går över.","Byt plats direkt. Res dig och gå till ett annat rum.","Drick något kallt och gör något med händerna i två minuter.","Tänk inte 'aldrig mer'. Välj bara: inte den här cigaretten.","Öppna sparmålet. Pengarna du inte röker upp får stanna hos dig."];
$("#cravingBtn").onclick=()=>$("#cravingText").textContent=cravings[Math.floor(Math.random()*cravings.length)];
const tiny=["Släng tre saker som är skräp.","Fyll ett glas vatten.","Lägg fem saker på rätt plats.","Öppna posten — du behöver inte göra mer.","Torka av handfatet.","Skriv ner den enda saken som är viktigast idag."];
$("#tinyTaskBtn").onclick=()=>$("#tinyTask").textContent=tiny[Math.floor(Math.random()*tiny.length)];
$("#exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="adhd-vardag-backup.json";a.click();URL.revokeObjectURL(a.href);
};
$("#settingsBtn").onclick=()=>alert("Inställningar kommer i nästa version.");
if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{})}
render();
