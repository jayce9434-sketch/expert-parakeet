(() => {
  const D=window.BUGBREAK_DATA;
  const SAVE_KEY='bugbreak-v6-save';
  const defaultSave=()=>({
    version:6,gems:180,totalGems:180,bestWave:0,wins:0,selectedBug:'ant',
    upgrades:Object.fromEntries(D.upgrades.map(u=>[u.id,0])),
    settings:{master:100,music:100,sfx:100,normalMusic:true,shake:true,perf:false},
    dailyDay:'',dailyStreak:0
  });
  function load(){
    try{const x=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!x)return defaultSave();const d=defaultSave();return {...d,...x,upgrades:{...d.upgrades,...(x.upgrades||{})},settings:{...d.settings,...(x.settings||{})}}}catch{return defaultSave()}
  }
  let save=load();
  const persist=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch{}};
  const $=id=>document.getElementById(id);
  const screens=[...document.querySelectorAll('.screen')];
  let previous='menu',toastTimer=0;
  function show(id){
    const active=screens.find(s=>s.classList.contains('active'))?.id;
    if(active&&id!=='settings'&&id!=='shop') previous=active;
    screens.forEach(s=>s.classList.toggle('active',s.id===id));
  }
  function toast(msg,ms=1900){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),ms)}
  function bugMini(p){return `<div class="mini-bug" style="--bug:${p.color}"><i class="body"></i><i class="head"></i><i class="leg l1"></i><i class="leg l2"></i><i class="leg l3"></i></div>`}
  function unlocked(p){return !p.unlock || save.totalGems>=p.unlock}
  function renderBugs(){
    const box=$('bugSelect');box.innerHTML='';
    for(const p of D.players){
      const on=save.selectedBug===p.id,ok=unlocked(p);
      const b=document.createElement('button');b.type='button';b.className=`bug-card ${on?'selected':''} ${ok?'':'locked'} ${p.best?'best':''}`;
      b.innerHTML=`${p.newBug?'<span class="new-ribbon">NEW</span>':''}${p.best?'<span class="apex-dot">APEX</span>':''}${bugMini(p)}<b>${p.name}</b><small>${p.subtitle}</small>`;
      b.addEventListener('click',()=>{ if(!ok)return toast(`Earn ${p.unlock} total gems to unlock ${p.name}`); save.selectedBug=p.id;persist();renderBugs();window.AudioSys.ui(); });
      box.appendChild(b);
    }
    const p=D.players.find(x=>x.id===save.selectedBug)||D.players[0];
    $('bugDetail').innerHTML=`<div class="desc"><b>${p.name} · ${p.ability}</b><p>${p.desc}</p></div><div class="stat-pill"><small>HP</small><strong>${p.stats.hp}</strong></div><div class="stat-pill"><small>DAMAGE</small><strong>${p.stats.damage}</strong></div><div class="stat-pill"><small>SPEED</small><strong>${p.stats.speed}</strong></div><div class="stat-pill"><small>CRIT</small><strong>${Math.round(p.stats.crit*100)}%</strong></div>`;
    $('rosterCount').textContent=`${D.players.filter(unlocked).length}/${D.players.length}`;
  }
  function upCost(u,rank){return Math.round(u.base*(1+rank*.53+rank*rank*.035))}
  function renderShop(){
    $('shopGems').textContent=save.gems;const g=$('upgradeGrid');g.innerHTML='';
    for(const u of D.upgrades){const r=save.upgrades[u.id]||0,c=upCost(u,r),max=r>=u.max;const card=document.createElement('div');card.className='upgrade';card.innerHTML=`<div class="up-top"><span class="up-icon">${u.icon}</span><span class="rank">LV ${r}/${u.max}</span></div><h4>${u.name}</h4><p>${u.desc}</p><button ${max||save.gems<c?'disabled':''}>${max?'MAXED':`${c} GEMS`}</button>`;card.querySelector('button').addEventListener('click',()=>{if(max||save.gems<c)return;save.gems-=c;save.upgrades[u.id]=r+1;persist();renderShop();syncMenu();window.AudioSys.sfx('gem',.35)});g.appendChild(card)}
  }
  function syncMenu(){ $('bestWave').textContent=save.bestWave;$('menuGems').textContent=save.gems;renderBugs();renderDaily(); }
  function dayKey(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
  function renderDaily(){
    const today=dayKey(),claimed=save.dailyDay===today,box=$('dailyCard');
    box.innerHTML=`<span><b>DAILY FORAGE</b> · ${claimed?'collected today':'+35 gems and +1 streak'}</span><button ${claimed?'disabled':''}>${claimed?'CLAIMED':'CLAIM'}</button>`;
    box.querySelector('button').addEventListener('click',()=>{if(claimed)return;save.dailyDay=today;save.dailyStreak=(save.dailyStreak||0)+1;save.gems+=35;save.totalGems+=35;persist();syncMenu();window.AudioSys.sfx('gem');toast('Daily forage: +35 gems')});
  }
  function settingsUI(){
    const s=save.settings;
    const pairs=[['masterVol','masterOut','master'],['musicVol','musicOut','music'],['sfxVol','sfxOut','sfx']];
    for(const [id,out,key] of pairs){const el=$(id);el.value=s[key];$(out).textContent=s[key]+'%';el.oninput=()=>{$(out).textContent=el.value+'%';s[key]=+el.value;window.AudioSys.update(s);persist()}}
    $('normalMusicToggle').checked=s.normalMusic;$('shakeToggle').checked=s.shake;$('perfToggle').checked=s.perf;
    $('normalMusicToggle').onchange=e=>{s.normalMusic=e.target.checked;window.AudioSys.update(s);persist()};$('shakeToggle').onchange=e=>{s.shake=e.target.checked;persist()};$('perfToggle').onchange=e=>{s.perf=e.target.checked;persist()};
    window.AudioSys.update(s);
  }
  function addGems(n){n=Math.max(0,Math.round(n));save.gems+=n;save.totalGems+=n;persist();syncMenu();}
  function recordWave(w){if(w>save.bestWave){save.bestWave=w;persist();syncMenu()}}
  function win(){save.wins++;save.bestWave=50;persist();syncMenu()}
  function reset(){save=defaultSave();persist();settingsUI();syncMenu();toast('Save reset. Starter gems restored.')}

  $('shopBtn').addEventListener('click',()=>{previous='menu';renderShop();show('shop');window.AudioSys.ui()});
  document.querySelector('[data-close="shop"]').addEventListener('click',()=>show(window.BUGBREAK_GAME?.isRunning?.()?'pause':'menu'));
  $('settingsBtn').addEventListener('click',()=>{previous='menu';settingsUI();show('settings');window.AudioSys.ui()});
  $('settingsClose').addEventListener('click',()=>show(window.BUGBREAK_GAME?.isRunning?.()?'pause':'menu'));
  $('resetBtn').addEventListener('click',()=>{if(confirm('Reset BUGBREAK progress and upgrades?'))reset()});
  $('pauseShopBtn').addEventListener('click',()=>{renderShop();show('shop')});$('pauseSettingsBtn').addEventListener('click',()=>{settingsUI();show('settings')});
  $('roundShopBtn').addEventListener('click',()=>window.BUGBREAK_GAME?.openRoundShop?.());

  settingsUI();syncMenu();
  window.UI={show,toast,renderShop,syncMenu,addGems,recordWave,win,persist,get save(){return save},set save(v){save=v;persist()},get selectedBug(){return save.selectedBug},get settings(){return save.settings},get upgrades(){return save.upgrades},upCost};
})();
