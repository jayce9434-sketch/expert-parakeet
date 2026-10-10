(() => {
  const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
  const D=window.BUGBREAK_DATA,UI=window.UI,A=window.AudioSys;
  const W=1280,H=720,CX=640,CY=360;
  const $=id=>document.getElementById(id);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const rand=(a,b)=>a+Math.random()*(b-a);
  const pick=a=>a[(Math.random()*a.length)|0];
  const angleTo=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
  const norm=(x,y)=>{const d=Math.hypot(x,y)||1;return{x:x/d,y:y/d}};
  const isTouch=('ontouchstart'in window)||navigator.maxTouchPoints>0;
  let running=false,paused=false,last=performance.now(),t=0,screenShake=0,shakeX=0,shakeY=0;
  let player,nest,enemies=[],projectiles=[],particles=[],pickups=[],clouds=[],texts=[],decor=[],wave=0,nextWave=0,boss=null;
  let crumbs=0,gemsRun=0,kills=0,combo=0,comboTimer=0,level=1,xp=0,xpNeed=55,runStart=0,contract=null,contractDone=false,eventName='CALM YARD';
  let keys={},joy={x:0,y:0},attackTimer=0,dashTimer=0,specialTimer=0,guardTimer=0,speedBuff=0,poisonTimer=0;
  let pendingRelic=false,choiceOpen=false,biteCount=0,lastDir={x:1,y:0};
  let biome=D.biomes[0],bgSeed=1;

  function mkStats(base){
    const u=UI.upgrades;
    return {maxHp:base.hp*(1+.09*(u.health||0)),hp:base.hp*(1+.09*(u.health||0)),speed:base.speed*(1+.045*(u.speed||0)),damage:base.damage*(1+.10*(u.bite||0)),cooldown:base.cooldown*Math.pow(.95,u.cooldown||0),crit:base.crit+.018*(u.crit||0),critMult:1.65+.10*(u.critdmg||0),lifesteal:.01*(u.lifesteal||0),armor:0,regen:0,range:68,repairPower:1,doubleHit:0,gemMult:1+.05*(u.gem||0),crumbMult:1,splash:0,dashPower:1,bossDamage:1,execute:1,stun:0,nestBoost:1,waveCrumbs:0,chain:false};
  }
  function selected(){return D.players.find(p=>p.id===UI.selectedBug)||D.players[0]}
  function startRun(){
    A.prewarm();const p=selected();const stats=mkStats(p.stats);const nu=UI.upgrades.nest||0;
    player={x:CX-65,y:CY+40,r:19,type:p.id,color:p.color,stats,angle:0,mark:0,invuln:0,web:0};
    nest={x:CX,y:CY,r:54,maxHp:1150*(1+.11*nu),hp:1150*(1+.11*nu),shield:0};
    enemies=[];projectiles=[];particles=[];pickups=[];clouds=[];texts=[];wave=0;nextWave=.9;boss=null;pendingRelic=false;choiceOpen=false;
    crumbs=55+(UI.upgrades.crumbs||0)*12;gemsRun=0;kills=0;combo=0;comboTimer=0;level=1;xp=0;xpNeed=55;attackTimer=0;dashTimer=0;specialTimer=0;guardTimer=0;speedBuff=0;poisonTimer=0;biteCount=0;
    running=true;paused=false;runStart=performance.now();contract=makeContract();contractDone=false;eventName='CALM YARD';
    generateDecor(1);UI.show('menu');document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$('hud').classList.remove('hidden');if(isTouch)$('mobileControls').classList.remove('hidden');
    updateHUD();A.playNormal(1);UI.toast(`${p.name} entered the yard. 18 predator species are active.`);requestAnimationFrame(loop);
  }
  function quitRun(){running=false;paused=false;$('hud').classList.add('hidden');$('mobileControls').classList.add('hidden');A.stopAll();UI.show('menu');UI.syncMenu()}
  function makeContract(){
    const arr=[
      {name:'COMBO HUNTER',desc:'Reach a x12 combo',reward:18,test:()=>combo>=12},
      {name:'NEST WARDEN',desc:'Clear Wave 10 with nest above 70%',reward:22,test:()=>wave>=10&&nest.hp/nest.maxHp>.7},
      {name:'PREDATOR BREAKER',desc:'Defeat 30 enemies',reward:20,test:()=>kills>=30},
      {name:'GEM FORAGER',desc:'Earn 25 gems this expedition',reward:16,test:()=>gemsRun>=25}
    ];return pick(arr)
  }
  function checkContract(){if(!contractDone&&contract?.test()){contractDone=true;UI.addGems(contract.reward);gemsRun+=contract.reward;A.sfx('gem');UI.toast(`Contract complete: +${contract.reward} gems`);particlesBurst(player.x,player.y,'#d9ef8c',28)}}
  function getBiome(w=wave){return D.biomes.find(b=>w>=b.from&&w<=b.to)||D.biomes.at(-1)}
  function generateDecor(seed){bgSeed=seed;decor=[];let s=(seed*9301+49297)%233280;const rr=()=>{s=(s*9301+49297)%233280;return s/233280};
    for(let i=0;i<82;i++)decor.push({type:rr()<.46?'blade':rr()<.63?'leaf':rr()<.78?'flower':rr()<.9?'stone':'mush',x:rr()*W,y:80+rr()*(H-115),r:4+rr()*10,a:rr()*Math.PI*2,h:rr()});
  }
  function startWave(){
    wave++;UI.recordWave(wave);biome=getBiome();if(wave===biome.from)generateDecor(wave);
    eventName=wave%9===0?'PREDATOR AMBUSH':wave%7===0?'POLLEN RUSH':wave%11===0?'NIGHT CHILL':'CALM YARD';
    crumbs+=player.stats.waveCrumbs;const b=D.bosses.find(x=>x.wave===wave);
    if(b){spawnBoss(b)}else{
      const pool=D.enemies.filter(e=>e.from<=wave);let count=5+Math.floor(wave*1.05)+(eventName==='PREDATOR AMBUSH'?5:0);count=Math.min(32,count);
      for(let i=0;i<count;i++){const high=pool.slice(Math.max(0,pool.length-7));const spec=Math.random()<.66?pick(high.length?high:pool):pick(pool);spawnEnemy(spec,i*.16)}
      boss=null;A.stopBoss(Math.min(4,1+Math.floor((wave-1)/12)));UI.toast(`Wave ${wave} · ${biome.name}`)
    }
    updateHUD();
  }
  function edgePos(){const side=(Math.random()*4)|0;if(side===0)return{x:rand(20,W-20),y:92};if(side===1)return{x:W-20,y:rand(95,H-55)};if(side===2)return{x:rand(20,W-20),y:H-28};return{x:20,y:rand(95,H-55)}}
  function spawnEnemy(spec,delay=0){const p=edgePos(),scale=1+(wave-1)*.035;enemies.push({id:Math.random().toString(36).slice(2),spec,x:p.x,y:p.y,hp:spec.hp*scale,maxHp:spec.hp*scale,speed:spec.speed*(1+wave*.004),damage:spec.damage*(1+wave*.025),r:spec.size,angle:angleTo(p,nest),attack:rand(.1,.7),spawn:delay,stun:0,mark:0,phase:Math.random()*6.28,charge:0,shot:rand(.8,2.2),elite:Math.random()<Math.min(.22,wave*.003),dead:false})}
  function spawnBoss(spec){const p=edgePos(),scale=1+(wave-5)*.018;boss={spec};enemies.push({id:'boss-'+spec.id,spec,x:p.x,y:p.y,hp:spec.hp*scale,maxHp:spec.hp*scale,speed:spec.speed,damage:spec.damage,r:spec.size,angle:angleTo(p,nest),attack:1.3,spawn:.3,stun:0,mark:0,phase:0,charge:0,shot:1.1,elite:true,boss:true,dead:false});A.sfx('boss');A.playBoss(spec.theme);$('bossName').textContent=spec.name.toUpperCase();$('bossTag').textContent=spec.tag;$('bossBanner').classList.add('show');setTimeout(()=>$('bossBanner').classList.remove('show'),3600);UI.toast(`${spec.name} has entered the yard`,2400)}
  function gainXp(n){xp+=n;while(xp>=xpNeed&&!choiceOpen){xp-=xpNeed;level++;xpNeed=Math.round(55+level*18+level*level*1.2);openMutation()}updateHUD()}
  function openMutation(){choiceOpen=true;paused=true;A.sfx('level');const options=[...D.mutations].sort(()=>Math.random()-.5).slice(0,3);const box=$('cards');box.innerHTML='';for(const m of options){const b=document.createElement('button');b.className='choice';b.innerHTML=`<span class="choice-mark">✦</span><div><h4>${m.name}</h4><p>${m.desc}</p></div>`;b.addEventListener('click',()=>{m.apply(player.stats);choiceOpen=false;paused=false;UI.show('menu');document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));updateHUD();UI.toast(`${m.name} mutated`);last=performance.now()});box.appendChild(b)}UI.show('levelup')}
  function openRelic(){choiceOpen=true;paused=true;const options=[...D.relics].sort(()=>Math.random()-.5).slice(0,3);const box=$('relicCards');box.innerHTML='';for(const r of options){const b=document.createElement('button');b.className='choice';b.innerHTML=`<span class="choice-mark">◆</span><div><h4>${r.name}</h4><p>${r.desc}</p></div>`;b.addEventListener('click',()=>{r.apply(player.stats);if(r.id==='queen'){nest.maxHp*=1.3;nest.hp=nest.maxHp}choiceOpen=false;paused=false;pendingRelic=false;UI.show('menu');document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));nextWave=2.8;updateHUD();last=performance.now()});box.appendChild(b)}UI.show('relic')}

  function hurtPlayer(n,source){if(player.invuln>0)return;let armor=player.stats.armor+(guardTimer>0?.4:0);n*=1-clamp(armor,0,.72);player.stats.hp-=n;player.invuln=.18;screenShake+=Math.min(14,n*.12);A.sfx('hit',.35);addText(player.x,player.y-30,`-${Math.round(n)}`,'#ff8179');if(player.stats.hp<=0){player.stats.hp=0;endRun(false)}}
  function hurtNest(n){if(nest.shield>0)n*=.45;nest.hp-=n;screenShake+=Math.min(9,n*.04);if(nest.hp<=0){nest.hp=0;endRun(false)}}
  function damageEnemy(e,n,crit=false,stun=0){if(!e||e.dead)return;let mult=e.boss?player.stats.bossDamage:1;if(e.hp/e.maxHp<.25)mult*=player.stats.execute;if(e.mark>0)mult*=1.22;n*=mult;e.hp-=n;e.stun=Math.max(e.stun,stun);addText(e.x,e.y-e.r-8,`${crit?'CRIT ':''}${Math.round(n)}`,crit?'#ffe67e':'#f1f1d9');particlesBurst(e.x,e.y,e.spec.color,crit?9:5);if(player.stats.lifesteal>0)player.stats.hp=Math.min(player.stats.maxHp,player.stats.hp+n*player.stats.lifesteal);if(e.hp<=0)killEnemy(e)}
  function killEnemy(e){if(e.dead)return;e.dead=true;kills++;combo++;comboTimer=3.2;const reward=Math.max(1,Math.round((e.spec.reward||4)*player.stats.crumbMult));crumbs+=reward;gainXp(Math.round((e.spec.xp||10)*(e.boss?1:1)));if(Math.random()<(e.boss?1:.14*player.stats.gemMult)){const g=e.boss?Math.round(10+wave*.9):1;UI.addGems(g);gemsRun+=g;A.sfx('gem',.45);pickups.push({x:e.x,y:e.y,type:'gem',life:1.4,r:8})}if(e.boss){const bonus=Math.round(e.spec.reward||25);UI.addGems(bonus);gemsRun+=bonus;pendingRelic=wave<50;A.stopBoss(Math.min(4,1+Math.floor((wave-1)/12)));particlesBurst(e.x,e.y,'#ffd66e',50);screenShake=22}else particlesBurst(e.x,e.y,e.spec.color,12);checkContract()}
  function addText(x,y,text,color){texts.push({x,y,text,color,life:1})}
  function particlesBurst(x,y,color,n=8){if(UI.settings.perf)n=Math.ceil(n*.35);for(let i=0;i<n;i++){const a=Math.random()*6.28,s=rand(22,130);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:rand(1.5,4),color,life:rand(.28,.8)})}}
  function nearest(range=9999){let best=null,bd=range;for(const e of enemies){if(e.dead||e.spawn>0)continue;const d=dist(player,e);if(d<bd){bd=d;best=e}}return best}
  function bite(){if(!running||paused||attackTimer>0)return;attackTimer=.34;A.sfx('bite',.55);const range=player.stats.range;const targets=enemies.filter(e=>!e.dead&&e.spawn<=0&&dist(player,e)<range+e.r).sort((a,b)=>dist(player,a)-dist(player,b)).slice(0,2);if(!targets.length){particlesBurst(player.x+lastDir.x*35,player.y+lastDir.y*35,'#cbd7be',3);return}biteCount++;for(const [i,e] of targets.entries()){const crit=Math.random()<player.stats.crit;let n=player.stats.damage*(crit?player.stats.critMult:1)*(i?0.7:1);damageEnemy(e,n,crit,Math.random()<player.stats.stun ? .35 : 0);if(player.stats.doubleHit&&Math.random()<player.stats.doubleHit)damageEnemy(e,n*.7,false);if(player.stats.splash){for(const o of enemies)if(o!==e&&!o.dead&&dist(o,e)<55)damageEnemy(o,n*player.stats.splash,false)}if(player.stats.chain&&biteCount%5===0){const chain=enemies.filter(o=>o!==e&&!o.dead&&dist(o,e)<180).slice(0,3);chain.forEach((o,j)=>damageEnemy(o,n*(.75-j*.13),true,.2))}}
  }
  function dash(){if(!running||paused||dashTimer>0)return;dashTimer=1.75;A.sfx('dash',.5);const move=inputVec();const d=(Math.hypot(move.x,move.y)>.1?norm(move.x,move.y):lastDir);const ox=player.x,oy=player.y;player.x=clamp(player.x+d.x*115,30,W-30);player.y=clamp(player.y+d.y*115,95,H-30);player.invuln=.28;for(const e of enemies)if(!e.dead&&lineDist(e.x,e.y,ox,oy,player.x,player.y)<e.r+26)damageEnemy(e,player.stats.damage*.95*player.stats.dashPower,false,.15);particlesBurst(player.x,player.y,'#8ccbc4',15);screenShake+=4}
  function special(){if(!running||paused||specialTimer>0)return;specialTimer=player.stats.cooldown;A.sfx('special',.65);const id=player.type;const d=lastDir;
    if(id==='ant'){for(const e of enemies)if(!e.dead&&dist(player,e)<125+e.r)damageEnemy(e,player.stats.damage*2.35,true,.45);speedBuff=4}
    else if(id==='termite'){nest.hp=Math.min(nest.maxHp,nest.hp+nest.maxHp*.18*player.stats.repairPower);nest.shield=7;clouds.push({x:nest.x,y:nest.y,r:92,life:7,type:'wall'})}
    else if(id==='ladybug'){guardTimer=5;for(const e of enemies)if(!e.dead&&dist(player,e)<90+e.r)damageEnemy(e,player.stats.damage*1.3,false,.5)}
    else if(id==='fly'){const ox=player.x,oy=player.y;player.x=clamp(player.x+d.x*190,25,W-25);player.y=clamp(player.y+d.y*190,90,H-25);for(const e of enemies)if(!e.dead&&lineDist(e.x,e.y,ox,oy,player.x,player.y)<e.r+48)damageEnemy(e,player.stats.damage*2.5,true,.35);speedBuff=3}
    else if(id==='mosquito'){const e=nearest(320);if(e){const a=angleTo(player,e);player.x=e.x-Math.cos(a)*(e.r+24);player.y=e.y-Math.sin(a)*(e.r+24);const n=player.stats.damage*3.15;damageEnemy(e,n,true,.5);player.stats.hp=Math.min(player.stats.maxHp,player.stats.hp+n*.42)}}
    else if(id==='dragonfly'){for(const e of enemies)if(!e.dead&&pointLineForward(e,player,d,340,52))damageEnemy(e,player.stats.damage*2.35,true,.5)}
    else if(id==='bee'){const e=nearest(380);if(e){const a=angleTo(player,e);player.x=clamp(e.x-Math.cos(a)*(e.r+28),25,W-25);player.y=clamp(e.y-Math.sin(a)*(e.r+28),90,H-25);e.mark=7;damageEnemy(e,player.stats.damage*3.3,true,.65)}}
    else if(id==='stinkbug'){clouds.push({x:player.x,y:player.y,r:135,life:7,type:'toxic',tick:0});for(const e of enemies)if(!e.dead&&dist(player,e)<140+e.r)e.stun=Math.max(e.stun,.45)}
    else if(id==='spider'){const around=enemies.filter(e=>!e.dead&&dist(player,e)<190+e.r);for(const e of around){e.stun=Math.max(e.stun,2.4);const m=e.hp/e.maxHp<.35?4.0:2.1;damageEnemy(e,player.stats.damage*m,true,1.3)}player.invuln=.65}
    particlesBurst(player.x,player.y,player.color,25);screenShake+=8
  }
  function pointLineForward(e,p,d,len,width){const vx=e.x-p.x,vy=e.y-p.y,proj=vx*d.x+vy*d.y;if(proj<0||proj>len)return false;return Math.abs(vx*d.y-vy*d.x)<width+e.r}
  function lineDist(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy||1;let q=((px-x1)*dx+(py-y1)*dy)/l2;q=clamp(q,0,1);return Math.hypot(px-(x1+q*dx),py-(y1+q*dy))}
  function repair(){if(!running||paused||crumbs<12||dist(player,nest)>150)return UI.toast(crumbs<12?'Need 12 crumbs':'Move closer to the nest');crumbs-=12;const amount=85*player.stats.repairPower*(1+.12*(UI.upgrades.repair||0));nest.hp=Math.min(nest.maxHp,nest.hp+amount);A.sfx('repair',.6);particlesBurst(nest.x,nest.y,'#8dd6c6',12);addText(nest.x,nest.y-55,`+${Math.round(amount)}`,'#8ee8ce');updateHUD()}
  function inputVec(){return{x:(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0)+joy.x,y:(keys.ArrowDown||keys.KeyS?1:0)-(keys.ArrowUp||keys.KeyW?1:0)+joy.y}}
  function update(dt){
    t+=dt;if(paused)return;attackTimer=Math.max(0,attackTimer-dt);dashTimer=Math.max(0,dashTimer-dt);specialTimer=Math.max(0,specialTimer-dt);player.invuln=Math.max(0,player.invuln-dt);guardTimer=Math.max(0,guardTimer-dt);speedBuff=Math.max(0,speedBuff-dt);nest.shield=Math.max(0,nest.shield-dt);comboTimer=Math.max(0,comboTimer-dt);if(comboTimer<=0)combo=0;
    if(player.stats.regen>0)player.stats.hp=Math.min(player.stats.maxHp,player.stats.hp+player.stats.maxHp*player.stats.regen*dt);
    const v=inputVec();if(Math.hypot(v.x,v.y)>.08){const n=norm(v.x,v.y);lastDir=n;player.angle=Math.atan2(n.y,n.x);const sp=player.stats.speed*(speedBuff>0?1.28:1);player.x=clamp(player.x+n.x*sp*dt,24,W-24);player.y=clamp(player.y+n.y*sp*dt,86,H-24)}
    if(nextWave>0){nextWave-=dt;if(nextWave<=0)startWave()}
    for(const c of clouds){c.life-=dt;c.tick=(c.tick||0)-dt;if(c.type==='toxic'&&c.tick<=0){c.tick=.42;for(const e of enemies)if(!e.dead&&dist(c,e)<c.r+e.r){e.stun=Math.max(e.stun,.2);damageEnemy(e,player.stats.damage*.34,false)}}}clouds=clouds.filter(c=>c.life>0);
    for(const e of enemies)updateEnemy(e,dt);enemies=enemies.filter(e=>!e.dead);
    for(const p of projectiles)updateProjectile(p,dt);projectiles=projectiles.filter(p=>p.life>0);
    for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.94;p.vy*=.94}particles=particles.filter(p=>p.life>0);
    for(const p of pickups){p.life-=dt;p.y-=10*dt}pickups=pickups.filter(p=>p.life>0);
    for(const d of texts){d.life-=dt;d.y-=25*dt}texts=texts.filter(d=>d.life>0);
    if(!enemies.length&&wave>0&&nextWave<=0&&!choiceOpen){if(wave>=50)return endRun(true);if(pendingRelic)return openRelic();const reward=Math.round(2+wave*.32);UI.addGems(reward);gemsRun+=reward;crumbs+=10+Math.floor(wave*.45);$('waveReward').textContent=`Wave ${wave} clear · +${reward} gems`;$('waveReward').style.opacity=1;setTimeout(()=>$('waveReward').style.opacity=0,1200);nextWave=2.6;checkContract()}
    checkContract();screenShake=Math.max(0,screenShake-dt*22);const sh=UI.settings.shake?screenShake:0;shakeX=rand(-sh,sh);shakeY=rand(-sh,sh);updateHUD()
  }
  function updateEnemy(e,dt){
    if(e.spawn>0){e.spawn-=dt;return}if(e.stun>0){e.stun-=dt;return}e.attack-=dt;e.shot-=dt;e.mark=Math.max(0,e.mark-dt);e.phase+=dt;
    const target=dist(e,player)<(e.boss?330:185)?player:nest;let a=angleTo(e,target);e.angle=a;let sp=e.speed;
    if(['skitter','flier','elite-flier','dive'].includes(e.spec.ai))a+=Math.sin(e.phase*(e.spec.ai==='skitter'?7:3))*0.38;
    if(e.spec.ai==='leaper')sp*=.7+Math.max(0,Math.sin(e.phase*4))*1.3;
    if(['charger','rammer'].includes(e.spec.ai)){e.charge=Math.min(1,e.charge+dt*.5);if(e.charge>.72)sp*=2.0}
    if(['artillery','sniper'].includes(e.spec.ai)&&dist(e,target)<(e.spec.ai==='sniper'?330:260)){sp=0;if(e.shot<=0){e.shot=e.spec.ai==='sniper'?2.1:2.7;fireEnemyProjectile(e,target,e.spec.ai==='sniper'?1.35:1)}}
    if(e.boss){bossAI(e,dt,target);if(e.dead)return;sp*=1+Math.sin(e.phase*.9)*.06}
    e.x+=Math.cos(a)*sp*dt;e.y+=Math.sin(a)*sp*dt;
    const d=dist(e,target);const rr=e.r+(target.r||20);if(d<rr+8&&e.attack<=0){e.attack=e.boss ? .75 : 1.0;if(target===player)hurtPlayer(e.damage,e);else hurtNest(e.damage)}
  }
  function bossAI(e,dt,target){const id=e.spec.ai;if(e.shot>0)return;
    if(['widow','waspqueen','hornetboss','watertitan','overlord'].includes(id)){e.shot=id==='overlord'?1.15:id==='hornetboss'?1.35:1.75;const count=id==='overlord'?7:id==='waspqueen'?5:3;for(let i=0;i<count;i++){const a=angleTo(e,player)+(i-(count-1)/2)*.16;projectiles.push({x:e.x,y:e.y,vx:Math.cos(a)*(id==='hornetboss'?265:220),vy:Math.sin(a)*(id==='hornetboss'?265:220),r:id==='watertitan'?10:6,damage:e.damage*.55,life:3.2,color:e.spec.color})}}
    else if(['mantis','centiking','rhino','assassinboss','scorpionboss'].includes(id)){e.shot=2.2;const d=dist(e,player);if(d<290){const a=angleTo(e,player);e.x=clamp(e.x+Math.cos(a)*90,20,W-20);e.y=clamp(e.y+Math.sin(a)*90,90,H-20);if(dist(e,player)<e.r+55)hurtPlayer(e.damage*1.15,e);screenShake+=7}}
  }
  function fireEnemyProjectile(e,target,mult=1){const a=angleTo(e,target);projectiles.push({x:e.x,y:e.y,vx:Math.cos(a)*180,vy:Math.sin(a)*180,r:7,damage:e.damage*.72*mult,life:3.2,color:e.spec.color})}
  function updateProjectile(p,dt){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(dist(p,player)<p.r+player.r){hurtPlayer(p.damage,p);p.life=0}else if(p.x<0||p.x>W||p.y<80||p.y>H)p.life=0}
  function endRun(win){if(!running)return;running=false;paused=false;A.stopAll();$('hud').classList.add('hidden');$('mobileControls').classList.add('hidden');const secs=Math.round((performance.now()-runStart)/1000);const html=`<b>Wave:</b> ${wave}/50<br><b>Kills:</b> ${kills}<br><b>Level:</b> ${level}<br><b>Gems earned:</b> ${gemsRun}<br><b>Time:</b> ${Math.floor(secs/60)}m ${secs%60}s`;
    if(win){UI.win();$('victoryStats').innerHTML=html;UI.show('victory')}else{$('runStats').innerHTML=html;UI.show('gameover');A.sfx('death')}
  }
  function updateHUD(){if(!player||!nest)return;$('hpText').textContent=`${Math.ceil(player.stats.hp)}/${Math.ceil(player.stats.maxHp)}`;$('hpBar').style.width=`${clamp(player.stats.hp/player.stats.maxHp*100,0,100)}%`;$('nestText').textContent=`${Math.ceil(nest.hp)}/${Math.ceil(nest.maxHp)}`;$('nestBar').style.width=`${clamp(nest.hp/nest.maxHp*100,0,100)}%`;$('waveText').textContent=wave;$('enemyCount').textContent=`${enemies.length} left`;$('crumbsText').textContent=crumbs;$('gemsText').textContent=gemsRun;$('levelText').textContent=level;$('xpText').textContent=`${xp}/${xpNeed}`;$('xpBar').style.width=`${clamp(xp/xpNeed*100,0,100)}%`;$('comboText').textContent=`x${combo}`;$('eventPill').textContent=eventName;$('contractHud').innerHTML=contract?`<b>${contractDone?'✓ ':''}${contract.name}</b><br>${contract.desc}<br><span>${contractDone?'COMPLETE':`Reward ${contract.reward} gems`}</span>`:'';$('abilityName').textContent=selected().ability.toUpperCase();$('abilityState').textContent=specialTimer<=0?'READY':`${specialTimer.toFixed(1)}s`}

  function draw(){ctx.save();ctx.translate(shakeX,shakeY);drawWorld();drawClouds();for(const p of pickups)drawPickup(p);for(const e of enemies)drawEnemy(e);if(player)drawPlayer(player);for(const p of projectiles)drawProjectile(p);for(const p of particles)drawParticle(p);for(const d of texts)drawText(d);ctx.restore()}
  function drawWorld(){
    const b=running?biome:D.biomes[0];const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,b.ground2);g.addColorStop(.58,b.ground);g.addColorStop(1,'#071b10');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // top fence with layered wood and moss
    ctx.fillStyle='#2b2b1d';ctx.fillRect(0,0,W,72);for(let x=-20;x<W;x+=42){ctx.fillStyle=x%84===0?'#473927':'#3a3223';roundRect(x,0,32,73,3,true);ctx.strokeStyle='rgba(224,197,126,.12)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+7,0);ctx.lineTo(x+5,70);ctx.stroke()}ctx.fillStyle='rgba(86,125,55,.25)';ctx.fillRect(0,62,W,10);
    // path
    ctx.strokeStyle=b.path;ctx.lineWidth=118;ctx.lineCap='round';ctx.globalAlpha=.72;ctx.beginPath();ctx.moveTo(-60,590);ctx.bezierCurveTo(220,520,330,300,560,370);ctx.bezierCurveTo(820,470,920,325,1340,260);ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='rgba(223,216,143,.12)';ctx.lineWidth=3;ctx.setLineDash([6,13]);ctx.beginPath();ctx.moveTo(-60,590);ctx.bezierCurveTo(220,520,330,300,560,370);ctx.bezierCurveTo(820,470,920,325,1340,260);ctx.stroke();ctx.setLineDash([]);
    // pond
    if(biome.name!=='Porch Raid'){const pg=ctx.createRadialGradient(140,150,10,140,150,180);pg.addColorStop(0,'rgba(76,154,158,.55)');pg.addColorStop(1,'rgba(34,89,97,.6)');ctx.fillStyle=pg;ctx.strokeStyle='rgba(150,228,211,.28)';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(145,150,168,111,-.12,0,Math.PI*2);ctx.fill();ctx.stroke();}
    // decor
    for(const d of decor)drawDecor(d,b);
    // right log
    ctx.save();ctx.translate(1060,585);ctx.rotate(-.16);ctx.fillStyle='#5e331f';roundRect(-120,-33,240,66,28,true);ctx.strokeStyle='#29170f';ctx.lineWidth=5;roundRect(-120,-33,240,66,28,false,true);for(let i=-95;i<90;i+=30){ctx.strokeStyle='rgba(30,15,8,.4)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(i,-26);ctx.lineTo(i+5,28);ctx.stroke()}ctx.fillStyle='#98633b';ctx.beginPath();ctx.arc(118,0,29,0,6.28);ctx.fill();ctx.strokeStyle='#4c2919';ctx.lineWidth=4;ctx.stroke();ctx.restore();
    // nest
    if(nest)drawNest(nest);else drawNest({x:640,y:360,r:54,maxHp:1,hp:1,shield:0});
  }
  function drawDecor(d,b){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.a);if(d.type==='blade'){ctx.strokeStyle=`rgba(92,151,67,${.18+d.h*.22})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,7);ctx.quadraticCurveTo(2,-10,5,-18);ctx.stroke()}else if(d.type==='leaf'){ctx.fillStyle=`rgba(72,129,59,${.18+d.h*.32})`;ctx.beginPath();ctx.ellipse(0,0,d.r*.85,d.r*.38,0,0,6.28);ctx.fill()}else if(d.type==='flower'){const cols=['#e5c969','#dd8ab6','#92c9dd','#e0a25e'];ctx.fillStyle=cols[Math.floor(d.h*cols.length)%cols.length];for(let i=0;i<5;i++){ctx.rotate(1.256);ctx.beginPath();ctx.ellipse(0,-d.r*.6,d.r*.28,d.r*.5,0,0,6.28);ctx.fill()}ctx.fillStyle='#ecd66d';ctx.beginPath();ctx.arc(0,0,d.r*.25,0,6.28);ctx.fill()}else if(d.type==='stone'){ctx.fillStyle='rgba(53,76,68,.72)';ctx.strokeStyle='rgba(10,22,18,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,d.r*1.5,d.r,0,0,6.28);ctx.fill();ctx.stroke()}else{ctx.fillStyle='#c36b4c';ctx.beginPath();ctx.arc(0,0,d.r,Math.PI,0);ctx.fill();ctx.fillStyle='#d4c49d';ctx.fillRect(-2,0,4,d.r*1.4);ctx.fillStyle='rgba(255,235,197,.7)';ctx.beginPath();ctx.arc(-d.r*.35,-d.r*.3,1.4,0,6.28);ctx.arc(d.r*.25,-d.r*.45,1.2,0,6.28);ctx.fill()}ctx.restore()}
  function drawNest(n){ctx.save();ctx.translate(n.x,n.y);const pulse=n.shield>0?.2+.08*Math.sin(t*6):0;if(n.shield>0){ctx.strokeStyle=`rgba(105,220,196,${.55+pulse})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,n.r+25+Math.sin(t*3)*4,0,6.28);ctx.stroke()}ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(8,18,82,39,0,0,6.28);ctx.fill();const g=ctx.createRadialGradient(-10,-10,5,0,0,70);g.addColorStop(0,'#8e6841');g.addColorStop(.55,'#6b472d');g.addColorStop(1,'#3d2618');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,70,42,0,0,6.28);ctx.fill();ctx.strokeStyle='#2b1a11';ctx.lineWidth=5;ctx.stroke();ctx.fillStyle='#1d120d';ctx.beginPath();ctx.ellipse(0,-4,35,20,0,0,6.28);ctx.fill();ctx.strokeStyle='#0e0a07';ctx.lineWidth=3;ctx.stroke();for(let i=0;i<7;i++){const a=i*2.399;ctx.fillStyle='#b18757';ctx.beginPath();ctx.arc(Math.cos(a)*59,Math.sin(a)*31,3.2,0,6.28);ctx.fill()}ctx.restore()}
  function drawPlayer(p){drawInsect(p.type,p.x,p.y,p.angle,1.0,p.color,false,p.invuln>0);if(p.mark>0){ctx.strokeStyle='#ffdb63';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,29,0,6.28);ctx.stroke()}}
  function drawInsect(type,x,y,a,s,color,enemy=false,flash=false){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.scale(s,s);ctx.globalAlpha=flash?.55:1;ctx.lineCap='round';ctx.lineJoin='round';const dark=mix(color,'#000',.42),light=mix(color,'#fff',.25);
    ctx.strokeStyle=dark;ctx.lineWidth=3;const legs=type==='spider'?4:3;for(let i=0;i<legs;i++){const yy=(i-(legs-1)/2)*7;ctx.beginPath();ctx.moveTo(-4,yy);ctx.lineTo(-20,yy+(i<legs/2?-13:13));ctx.lineTo(-30,yy+(i<legs/2?-8:8));ctx.stroke();ctx.beginPath();ctx.moveTo(7,yy);ctx.lineTo(23,yy+(i<legs/2?-13:13));ctx.lineTo(34,yy+(i<legs/2?-7:7));ctx.stroke()}
    if(['fly','mosquito','dragonfly','bee'].includes(type)){ctx.fillStyle='rgba(202,239,232,.52)';ctx.strokeStyle='rgba(31,65,58,.55)';ctx.lineWidth=1.5;const long=type==='dragonfly'?32:24;for(const sy of [-1,1]){ctx.beginPath();ctx.ellipse(-4,sy*13,long,8,sy*.22,0,6.28);ctx.fill();ctx.stroke()}}
    if(type==='ladybug'){ctx.fillStyle='#e7443e';ctx.beginPath();ctx.ellipse(-5,0,22,18,0,0,6.28);ctx.fill();ctx.strokeStyle='#391d1c';ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.moveTo(-6,-17);ctx.lineTo(-6,17);ctx.stroke();ctx.fillStyle='#21191a';for(const [dx,dy] of [[-14,-7],[3,-8],[-13,7],[4,7]]){ctx.beginPath();ctx.arc(dx,dy,3.3,0,6.28);ctx.fill()}}
    else if(type==='termite'){ctx.fillStyle='#e9d4a4';ctx.beginPath();ctx.ellipse(-11,0,20,13,0,0,6.28);ctx.fill();ctx.strokeStyle=dark;ctx.stroke();ctx.fillStyle='#d6b97f';ctx.beginPath();ctx.ellipse(5,0,14,12,0,0,6.28);ctx.fill();ctx.stroke()}
    else if(type==='spider'){ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(-12,0,17,16,0,0,6.28);ctx.fill();ctx.strokeStyle='#1d1720';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(5,0,13,12,0,0,6.28);ctx.fill();ctx.stroke();ctx.fillStyle='#d8a7dd';ctx.beginPath();ctx.moveTo(-16,-4);ctx.lineTo(-7,0);ctx.lineTo(-16,4);ctx.closePath();ctx.fill()}
    else if(type==='stinkbug'){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-24,0);ctx.quadraticCurveTo(-15,-20,5,-16);ctx.quadraticCurveTo(22,-11,22,0);ctx.quadraticCurveTo(22,11,5,16);ctx.quadraticCurveTo(-15,20,-24,0);ctx.fill();ctx.strokeStyle=dark;ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle=light;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-17,0);ctx.lineTo(15,0);ctx.moveTo(-5,-13);ctx.lineTo(6,13);ctx.stroke()}
    else {ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(-14,0,18,14,0,0,6.28);ctx.fill();ctx.strokeStyle=dark;ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=mix(color,'#fff',.1);ctx.beginPath();ctx.ellipse(4,0,14,13,0,0,6.28);ctx.fill();ctx.stroke()}
    ctx.fillStyle=mix(color,'#fff',type==='termite'?.05:.08);ctx.beginPath();ctx.arc(18,0,type==='spider'?9:11,0,6.28);ctx.fill();ctx.strokeStyle=dark;ctx.lineWidth=3;ctx.stroke();
    if(type==='bee'){ctx.strokeStyle='#3a2b17';ctx.lineWidth=5;for(const xx of [-15,-4,7]){ctx.beginPath();ctx.moveTo(xx,-11);ctx.lineTo(xx,11);ctx.stroke()}ctx.fillStyle='#e4bb37';ctx.beginPath();ctx.arc(18,0,11,0,6.28);ctx.fill();ctx.strokeStyle=dark;ctx.stroke();ctx.fillStyle='#2a1b14';ctx.beginPath();ctx.moveTo(-31,0);ctx.lineTo(-40,-4);ctx.lineTo(-40,4);ctx.closePath();ctx.fill()}
    if(type==='mosquito'){ctx.strokeStyle='#3d2430';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(27,0);ctx.lineTo(42,0);ctx.stroke()}
    if(type==='dragonfly'){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(-28,-7,48,14,8);ctx.fill()}
    ctx.fillStyle='#0e1110';ctx.beginPath();ctx.arc(22,-4,2.3,0,6.28);ctx.fill();ctx.beginPath();ctx.arc(22,4,2.3,0,6.28);ctx.fill();ctx.strokeStyle=dark;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(24,-7);ctx.lineTo(34,-16);ctx.moveTo(24,7);ctx.lineTo(34,16);ctx.stroke();ctx.restore()}
  function drawEnemy(e){ctx.save();if(e.spawn>0)ctx.globalAlpha=clamp(1-e.spawn*2,0,1);if(e.elite&&!e.boss){ctx.shadowColor=e.spec.color;ctx.shadowBlur=13}drawEnemyShape(e);ctx.shadowBlur=0;if(e.hp<e.maxHp||e.boss){const w=e.boss?120:Math.max(34,e.r*2.3),h=e.boss?8:4;ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(e.x-w/2,e.y-e.r-18,w,h);ctx.fillStyle=e.boss?'#e55a4d':'#d88962';ctx.fillRect(e.x-w/2,e.y-e.r-18,w*clamp(e.hp/e.maxHp,0,1),h)}if(e.mark>0){ctx.strokeStyle='#ffd76a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r+9,0,6.28);ctx.stroke()}ctx.restore()}
  function drawEnemyShape(e){const id=e.spec.id||e.spec.ai;const s=e.boss?e.r/50:e.r/18;const typeMap={'garden-ant':'ant','fire-ant':'ant','flea':'flea','spider-mite':'spider','earwig':'earwig','rove-beetle':'beetle','centipede':'centipede','wasp':'bee','robber-fly':'fly','wolf-spider':'spider','assassin-bug':'assassin','bombardier':'beetle','hornet':'bee','mantis-nymph':'mantis','water-bug':'water','scorpion':'scorpion','stag-beetle':'stag','hunter-dragonfly':'dragonfly'};if(e.boss){drawBoss(e);return}const type=typeMap[id]||'ant';
    if(['ant','spider','bee','fly','dragonfly'].includes(type)){drawInsect(type,e.x,e.y,e.angle,s,e.spec.color,true,false);return}
    ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);ctx.scale(s,s);const c=e.spec.color,d=mix(c,'#000',.5);ctx.strokeStyle=d;ctx.lineWidth=3;
    if(type==='centipede'){for(let i=0;i<7;i++){const x=18-i*8,yy=Math.sin(e.phase*7+i)*2;ctx.fillStyle=mix(c,'#fff',i*.015);ctx.beginPath();ctx.ellipse(x,yy,7,6,0,0,6.28);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x,yy-4);ctx.lineTo(x-3,yy-12);ctx.moveTo(x,yy+4);ctx.lineTo(x-3,yy+12);ctx.stroke()}}
    else if(type==='flea'){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,16,11,-.25,0,6.28);ctx.fill();ctx.stroke();ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,6);ctx.lineTo(-24,18);ctx.lineTo(-33,11);ctx.moveTo(2,7);ctx.lineTo(-8,22);ctx.stroke()}
    else if(type==='earwig'){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,22,9,0,0,6.28);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-20,-3);ctx.quadraticCurveTo(-34,-15,-38,-4);ctx.moveTo(-20,3);ctx.quadraticCurveTo(-34,15,-38,4);ctx.stroke()}
    else if(type==='mantis'){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,19,7,0,0,6.28);ctx.fill();ctx.beginPath();ctx.arc(20,0,7,0,6.28);ctx.fill();ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(7,-5);ctx.lineTo(20,-22);ctx.lineTo(28,-13);ctx.moveTo(7,5);ctx.lineTo(20,22);ctx.lineTo(28,13);ctx.stroke()}
    else if(type==='scorpion'){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(-2,0,19,12,0,0,6.28);ctx.fill();ctx.stroke();ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-19,0);ctx.quadraticCurveTo(-35,-12,-29,-27);ctx.quadraticCurveTo(-23,-36,-17,-27);ctx.stroke();ctx.beginPath();ctx.moveTo(10,-8);ctx.lineTo(25,-18);ctx.lineTo(32,-12);ctx.moveTo(10,8);ctx.lineTo(25,18);ctx.lineTo(32,12);ctx.stroke()}
    else if(type==='stag'){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(-5,0,22,15,0,0,6.28);ctx.fill();ctx.stroke();ctx.fillStyle=mix(c,'#fff',.08);ctx.beginPath();ctx.arc(18,0,10,0,6.28);ctx.fill();ctx.stroke();ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(25,-5);ctx.lineTo(37,-12);ctx.lineTo(33,-1);ctx.moveTo(25,5);ctx.lineTo(37,12);ctx.lineTo(33,1);ctx.stroke()}
    else if(type==='assassin'){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-21,0);ctx.lineTo(-6,-13);ctx.lineTo(18,-9);ctx.lineTo(25,0);ctx.lineTo(18,9);ctx.lineTo(-6,13);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(25,0);ctx.lineTo(37,0);ctx.stroke()}
    else {ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(-4,0,24,15,0,0,6.28);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(19,0,9,0,6.28);ctx.fill();ctx.stroke()}
    ctx.restore()}
  function drawBoss(e){const id=e.spec.ai,c=e.spec.color,s=e.r/45;ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);ctx.scale(s,s);ctx.shadowColor=c;ctx.shadowBlur=18;ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(-4,16,45,16,0,0,6.28);ctx.fill();ctx.shadowBlur=0;const d=mix(c,'#000',.48),l=mix(c,'#fff',.24);ctx.strokeStyle=d;ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=4;
    if(id.includes('mantis')||id==='overlord'){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(-10,0,30,10,0,0,6.28);ctx.fill();ctx.stroke();ctx.fillStyle=l;ctx.beginPath();ctx.moveTo(11,-8);ctx.lineTo(28,-14);ctx.lineTo(38,0);ctx.lineTo(28,14);ctx.lineTo(11,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.lineWidth=7;for(const sy of [-1,1]){ctx.beginPath();ctx.moveTo(5,sy*7);ctx.lineTo(25,sy*34);ctx.lineTo(43,sy*24);ctx.stroke();ctx.beginPath();ctx.moveTo(-15,sy*7);ctx.lineTo(-30,sy*27);ctx.stroke()}}
    else if(id.includes('widow')){ctx.fillStyle='#211821';ctx.beginPath();ctx.ellipse(-13,0,25,23,0,0,6.28);ctx.fill();ctx.stroke();ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(14,0,15,14,0,0,6.28);ctx.fill();ctx.stroke();ctx.strokeStyle='#1b111a';ctx.lineWidth=6;for(const sy of [-1,1])for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-2+i*5,sy*8);ctx.lineTo(-18+i*10,sy*(25+i*5));ctx.lineTo(-33+i*10,sy*(32+i*6));ctx.stroke()}ctx.fillStyle='#d34c54';ctx.beginPath();ctx.moveTo(-22,-7);ctx.lineTo(-9,0);ctx.lineTo(-22,7);ctx.closePath();ctx.fill()}
    else if(id.includes('wasp')||id.includes('hornet')){drawInsect('bee',0,0,0,1.75,c,true,false);ctx.restore();return}
    else if(id.includes('scorpion')){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(-5,0,28,18,0,0,6.28);ctx.fill();ctx.stroke();ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-29,0);ctx.bezierCurveTo(-50,-20,-43,-47,-17,-43);ctx.stroke();for(const sy of [-1,1]){ctx.beginPath();ctx.moveTo(8,sy*10);ctx.lineTo(32,sy*27);ctx.lineTo(43,sy*19);ctx.stroke()}}
    else if(id.includes('centi')){for(let i=0;i<9;i++){const x=28-i*9,yy=Math.sin(e.phase*6+i)*4;ctx.fillStyle=mix(c,'#fff',i*.018);ctx.beginPath();ctx.ellipse(x,yy,11,9,0,0,6.28);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x,yy-6);ctx.lineTo(x-4,yy-20);ctx.moveTo(x,yy+6);ctx.lineTo(x-4,yy+20);ctx.stroke()}}
    else {ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(-8,0,34,23,0,0,6.28);ctx.fill();ctx.stroke();ctx.fillStyle=l;ctx.beginPath();ctx.arc(24,0,15,0,6.28);ctx.fill();ctx.stroke();for(const sy of [-1,1]){ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(18,sy*9);ctx.lineTo(38,sy*25);ctx.stroke()}}
    ctx.fillStyle='#0b0c0b';ctx.beginPath();ctx.arc(29,-5,3,0,6.28);ctx.arc(29,5,3,0,6.28);ctx.fill();ctx.restore()}
  function drawClouds(){for(const c of clouds){ctx.save();ctx.globalAlpha=clamp(c.life/2,0,.48);ctx.fillStyle=c.type==='toxic'?'#88a65b':'#6fc8ab';for(let i=0;i<10;i++){const a=i*2.399+t*.2;ctx.beginPath();ctx.arc(c.x+Math.cos(a)*c.r*.45,c.y+Math.sin(a)*c.r*.45,c.r*.34,0,6.28);ctx.fill()}ctx.restore()}}
  function drawProjectile(p){ctx.save();ctx.shadowColor=p.color;ctx.shadowBlur=12;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill();ctx.restore()}
  function drawParticle(p){ctx.globalAlpha=clamp(p.life*2,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill();ctx.globalAlpha=1}
  function drawPickup(p){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t*3);ctx.fillStyle='#93e4df';ctx.shadowColor='#8ce5e0';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(7,0);ctx.lineTo(0,8);ctx.lineTo(-7,0);ctx.closePath();ctx.fill();ctx.restore()}
  function drawText(d){ctx.globalAlpha=clamp(d.life*1.4,0,1);ctx.fillStyle=d.color;ctx.font='800 12px system-ui';ctx.textAlign='center';ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=3;ctx.strokeText(d.text,d.x,d.y);ctx.fillText(d.text,d.x,d.y);ctx.globalAlpha=1}
  function mix(hex1,hex2,tv){const a=parseInt(hex1.replace('#','').padEnd(6,'0').slice(0,6),16),b=parseInt(hex2.replace('#','').padEnd(6,'0').slice(0,6),16);const ar=a>>16,ag=a>>8&255,ab=a&255,br=b>>16,bg=b>>8&255,bb=b&255;return `rgb(${Math.round(lerp(ar,br,tv))},${Math.round(lerp(ag,bg,tv))},${Math.round(lerp(ab,bb,tv))})`}
  function roundRect(x,y,w,h,r,fill,stroke=false){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill)ctx.fill();if(stroke)ctx.stroke()}

  function loop(now){if(!running){drawIdle();return}const dt=Math.min(.033,(now-last)/1000||.016);last=now;update(dt);draw();if(running)requestAnimationFrame(loop)}
  function drawIdle(){biome=D.biomes[0];if(!nest)nest={x:CX,y:CY,r:54,maxHp:1,hp:1,shield:0};drawWorld();ctx.save();ctx.globalAlpha=.92;drawInsect('ant',470,405,-.18,1.45,'#c9563d');drawInsect('bee',745,295,2.7,1.25,'#d9a91e');drawInsect('spider',850,470,-2.5,1.22,'#6f4f75');ctx.restore()}

  // controls
  window.addEventListener('keydown',e=>{keys[e.code]=true;if(!running)return;if(e.code==='Space'){e.preventDefault();bite()}else if(e.code==='ShiftLeft'||e.code==='ShiftRight')dash();else if(e.code==='KeyE')special();else if(e.code==='KeyR')repair();else if(e.code==='Escape')togglePause()});window.addEventListener('keyup',e=>keys[e.code]=false);
  $('playBtn').addEventListener('click',startRun);$('againBtn').addEventListener('click',startRun);$('victoryAgainBtn').addEventListener('click',startRun);$('menuBtn').addEventListener('click',()=>UI.show('menu'));$('victoryMenuBtn').addEventListener('click',()=>UI.show('menu'));
  $('pauseBtn').addEventListener('click',togglePause);$('resumeBtn').addEventListener('click',togglePause);$('quitBtn').addEventListener('click',quitRun);$('biteBtn').addEventListener('pointerdown',bite);$('dashBtn').addEventListener('pointerdown',dash);$('specialBtn').addEventListener('pointerdown',special);$('repairBtn').addEventListener('pointerdown',repair);
  function togglePause(){if(!running||choiceOpen)return;paused=!paused;if(paused){UI.show('pause')}else{document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));last=performance.now()}}
  function openRoundShop(){if(!running)return;paused=true;UI.renderShop();UI.show('shop')}
  const stick=$('stickBase'),knob=$('stickKnob');let stickId=null,stickRect=null;
  function stickMove(e){if(stickId!==e.pointerId)return;const x=e.clientX-(stickRect.left+stickRect.width/2),y=e.clientY-(stickRect.top+stickRect.height/2),n=norm(x,y),m=Math.min(1,Math.hypot(x,y)/(stickRect.width*.42));joy.x=n.x*m;joy.y=n.y*m;knob.style.transform=`translate(${joy.x*34}px,${joy.y*34}px)`}
  stick.addEventListener('pointerdown',e=>{stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stickRect=stick.getBoundingClientRect();stickMove(e)});stick.addEventListener('pointermove',stickMove);const stickEnd=e=>{if(stickId!==e.pointerId)return;stickId=null;joy.x=joy.y=0;knob.style.transform=''};stick.addEventListener('pointerup',stickEnd);stick.addEventListener('pointercancel',stickEnd);
  window.addEventListener('resize',drawIdle);generateDecor(1);drawIdle();
  window.BUGBREAK_GAME={startRun,isRunning:()=>running,openRoundShop,togglePause,debug:{spawnWave:()=>{if(running){enemies=[];nextWave=.01}},setWave:n=>{wave=clamp(+n||1,0,49);enemies=[];nextWave=.01},boss:n=>{if(!running)startRun();wave=clamp((+n||1)*5-1,0,49);enemies=[];nextWave=.01},getState:()=>({wave,enemies:enemies.length,level,xp,player,nest})}};
})();
