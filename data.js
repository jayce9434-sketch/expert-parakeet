(() => {
  const P = (id,name,subtitle,color,stats,ability,desc,unlock=0,newBug=false,best=false) => ({id,name,subtitle,color,stats,ability,desc,unlock,newBug,best});
  const E = (id,name,color,hp,speed,damage,reward,xp,ai='walker',size=18,from=1) => ({id,name,color,hp,speed,damage,reward,xp,ai,size,from});
  const B = (id,name,color,hp,speed,damage,reward,xp,theme,wave,ai='boss',size=48,tag='APEX PREDATOR') => ({id,name,color,hp,speed,damage,reward,xp,theme,wave,ai,size,tag});

  window.BUGBREAK_DATA = {
    version: '6.0 ART & AUDIO REBUILD',
    campaignWaves: 50,
    players: [
      P('ant','Ant','Balanced leader','#c9563d',{hp:205,speed:228,damage:27,cooldown:8.4,crit:.08},'Rally Bite','Reliable all-rounder. Special: a shockwave bite that damages nearby enemies and briefly boosts movement.'),
      P('termite','Termite','Fortress builder','#e4c896',{hp:280,speed:183,damage:24,cooldown:10.2,crit:.05},'Mud Bastion','Highest health. Special: raises a temporary mud wall around the nest and repairs it instantly.'),
      P('ladybug','Ladybug','Armored guardian','#e33a36',{hp:255,speed:198,damage:25,cooldown:9.0,crit:.06},'Shell Guard','Heavy armor and knockback resistance. Special: hardens the shell and reflects contact damage.'),
      P('fly','Fly','Burst speedster','#6e788b',{hp:170,speed:285,damage:23,cooldown:6.0,crit:.12},'Afterimage','Fastest movement. Special: three rapid afterimage dashes that slice enemies in your path.'),
      P('mosquito','Mosquito','Lifesteal assassin','#7b334a',{hp:165,speed:252,damage:29,cooldown:7.2,crit:.15},'Blood Rush','High crit and sustain. Special: a piercing lunge that heals for part of the damage dealt.'),
      P('dragonfly','Dragonfly','Ranged precision','#4f9d9b',{hp:180,speed:245,damage:26,cooldown:7.8,crit:.14},'Wing Lance','Attacks from farther away. Special: fires a piercing gust line through multiple enemies.'),
      P('bee','Bee','Stinger striker','#d9a91e',{hp:190,speed:252,damage:31,cooldown:7.0,crit:.13},'Royal Sting','NEW. Special: a high-damage stinger dive that marks enemies so later hits deal bonus damage.',0,true),
      P('stinkbug','Stinkbug','Area controller','#7b9b51',{hp:225,speed:205,damage:26,cooldown:8.2,crit:.08},'Noxious Cloud','NEW. Special: leaves a toxic cloud that slows and damages anything inside for several seconds.',0,true),
      P('spider','Spider','Apex hunter','#6f4f75',{hp:215,speed:240,damage:35,cooldown:6.6,crit:.18},'Web Execution','NEW · APEX. Special: webs nearby enemies, then executes low-health targets. Strongest late-game kit.',0,true,true)
    ],
    enemies: [
      E('garden-ant','Garden Ant','#3c2524',48,58,8,3,8,'walker',15,1),
      E('fire-ant','Fire Ant','#9b3a23',54,71,9,4,9,'swarm',14,2),
      E('flea','Flea','#5e463c',43,92,11,4,10,'leaper',12,3),
      E('spider-mite','Spider Mite','#572638',62,77,10,5,11,'skitter',13,4),
      E('earwig','Earwig','#6d4027',95,49,14,6,15,'bruiser',19,6),
      E('rove-beetle','Rove Beetle','#25252d',125,43,16,7,18,'tank',21,8),
      E('centipede','House Centipede','#a88c64',88,89,15,7,18,'charger',23,10),
      E('wasp','Paper Wasp','#cf9b27',76,83,16,8,20,'flier',19,12),
      E('robber-fly','Robber Fly','#667375',91,98,18,8,22,'dive',18,14),
      E('wolf-spider','Wolf Spider','#4f392d',142,67,21,10,28,'hunter',25,16),
      E('assassin-bug','Assassin Bug','#72351f',119,62,24,11,31,'bleed',23,18),
      E('bombardier','Bombardier Beetle','#262a1f',165,45,22,12,34,'artillery',24,20),
      E('hornet','Hornet','#c77b17',132,93,27,13,38,'elite-flier',23,24),
      E('mantis-nymph','Mantis Nymph','#568441',185,66,31,15,43,'slasher',28,28),
      E('water-bug','Giant Water Bug','#3d4b45',245,41,34,18,52,'heavy',31,32),
      E('scorpion','Scorpion','#8c5f35',220,54,38,19,56,'venom',30,36),
      E('stag-beetle','Stag Beetle','#503426',295,43,42,22,64,'rammer',34,40),
      E('hunter-dragonfly','Hunter Dragonfly','#397c83',190,104,40,22,66,'sniper',26,44)
    ],
    bosses: [
      B('mantis','Garden Mantis','#5d984a',760,63,28,30,95,'boss-1.mp3',5,'mantis',54,'GARDEN EXECUTIONER'),
      B('widow','Black Widow','#351b29',1080,70,34,38,120,'boss-2.mp3',10,'widow',50,'WEB TYRANT'),
      B('wasp-queen','Paper Wasp Queen','#d59b22',1430,78,40,46,150,'boss-3.mp3',15,'waspqueen',56,'SKY MATRIARCH'),
      B('centipede-king','Centipede King','#aa8a5c',1790,77,46,58,180,'boss-4.mp3',20,'centiking',66,'HUNDRED-LEGGED KING'),
      B('rhino','Rhinoceros Beetle','#473624',2260,48,55,72,220,'boss-5.mp3',25,'rhino',67,'ARMORED COLOSSUS'),
      B('assassin-king','Assassin King','#743224',2580,68,59,82,250,'boss-6.mp3',30,'assassinboss',61,'RED BLADE'),
      B('hornet-queen','Hornet Queen','#d57c14',3080,94,64,94,290,'boss-7.mp3',35,'hornetboss',63,'AIRBORNE QUEEN'),
      B('scorpion-matriarch','Scorpion Matriarch','#84552e',3550,58,72,108,330,'boss-8.mp3',40,'scorpionboss',72,'VENOM MATRIARCH'),
      B('water-titan','Water Bug Titan','#344944',4120,49,80,124,380,'boss-9.mp3',45,'watertitan',76,'POND TITAN'),
      B('mantis-overlord','Mantis Overlord','#67ad42',5200,75,92,180,500,'boss-10.mp3',50,'overlord',83,'FINAL APEX')
    ],
    upgrades: [
      {id:'bite',name:'Mandible Power',icon:'✦',desc:'+10% attack damage per rank',base:24,max:12},
      {id:'health',name:'Carapace',icon:'⬢',desc:'+9% max health per rank',base:22,max:12},
      {id:'speed',name:'Leg Strength',icon:'➤',desc:'+4.5% move speed per rank',base:20,max:10},
      {id:'cooldown',name:'Reflex Nerves',icon:'⌁',desc:'Abilities recharge 5% faster',base:26,max:10},
      {id:'nest',name:'Nest Reinforcement',icon:'⌂',desc:'+11% nest health per rank',base:28,max:12},
      {id:'repair',name:'Worker Crew',icon:'⚒',desc:'+12% repair amount per rank',base:24,max:10},
      {id:'gem',name:'Gem Sense',icon:'◇',desc:'+5% gem rewards per rank',base:30,max:10},
      {id:'crit',name:'Predator Eyes',icon:'◎',desc:'+1.8% crit chance per rank',base:27,max:10},
      {id:'critdmg',name:'Critical Bite',icon:'⚡',desc:'+10% crit damage per rank',base:29,max:10},
      {id:'magnet',name:'Forager Range',icon:'◉',desc:'+13% pickup radius per rank',base:18,max:8},
      {id:'lifesteal',name:'Hemolymph Return',icon:'♥',desc:'+1% lifesteal per rank',base:34,max:8},
      {id:'crumbs',name:'Emergency Stores',icon:'▣',desc:'+12 starting crumbs per rank',base:21,max:10}
    ],
    mutations: [
      {id:'feral',name:'Feral Mandibles',desc:'+18% attack damage',apply:s=>s.damage*=1.18},
      {id:'shell',name:'Layered Shell',desc:'+22% max health and heal 22%',apply:s=>{s.maxHp*=1.22;s.hp=Math.min(s.maxHp,s.hp+s.maxHp*.22)}},
      {id:'runner',name:'Spring Legs',desc:'+13% move speed',apply:s=>s.speed*=1.13},
      {id:'nerve',name:'Hyper Nerves',desc:'Special cooldown -16%',apply:s=>s.cooldown*=.84},
      {id:'fang',name:'Serrated Bite',desc:'+12% crit chance',apply:s=>s.crit+=.12},
      {id:'heavycrit',name:'Crushing Criticals',desc:'+45% critical damage',apply:s=>s.critMult+=.45},
      {id:'vamp',name:'Hemolymph Feast',desc:'+6% lifesteal',apply:s=>s.lifesteal+=.06},
      {id:'repair',name:'Colony Instinct',desc:'Repairs are 35% stronger',apply:s=>s.repairPower*=1.35},
      {id:'fort',name:'Nest Bond',desc:'Nest max health +18% this run',apply:s=>s.nestBoost*=1.18},
      {id:'reach',name:'Extended Lunge',desc:'+24% bite range',apply:s=>s.range*=1.24},
      {id:'double',name:'Double Mandible',desc:'18% chance to bite twice',apply:s=>s.doubleHit+=.18},
      {id:'gem',name:'Crystal Nose',desc:'+18% gem drops',apply:s=>s.gemMult*=1.18},
      {id:'crumb',name:'Efficient Forager',desc:'+24% crumb drops',apply:s=>s.crumbMult*=1.24},
      {id:'shock',name:'Impact Glands',desc:'Bites create a small splash hit',apply:s=>s.splash+=.28},
      {id:'dash',name:'Piston Legs',desc:'Dash damage +70%',apply:s=>s.dashPower*=1.7},
      {id:'armor',name:'Dense Chitin',desc:'Take 12% less damage',apply:s=>s.armor=Math.min(.58,s.armor+.12)},
      {id:'regen',name:'Quiet Regeneration',desc:'Regenerate 0.6% HP/sec',apply:s=>s.regen+=.006},
      {id:'boss',name:'Apex Hunter',desc:'+25% damage to bosses',apply:s=>s.bossDamage*=1.25},
      {id:'execute',name:'Execution Instinct',desc:'+30% damage to enemies under 25% HP',apply:s=>s.execute*=1.30},
      {id:'stun',name:'Nerve Shock',desc:'Bites have 8% chance to stun',apply:s=>s.stun+=.08}
    ],
    relics: [
      {id:'amber',name:'Amber Heart',desc:'+35% HP · regenerate 1% HP/sec',apply:s=>{s.maxHp*=1.35;s.hp=s.maxHp;s.regen+=.01}},
      {id:'fang',name:'Ancient Fang',desc:'+42% damage · +10% crit',apply:s=>{s.damage*=1.42;s.crit+=.10}},
      {id:'wing',name:'Prismatic Wing',desc:'+28% speed · cooldown -20%',apply:s=>{s.speed*=1.28;s.cooldown*=.8}},
      {id:'queen',name:'Queen Pheromone',desc:'Nest +30% max HP and full heal',apply:s=>s.nestBoost*=1.30},
      {id:'void',name:'Void Carapace',desc:'18% armor · +50% crit damage',apply:s=>{s.armor=Math.min(.65,s.armor+.18);s.critMult+=.5}},
      {id:'blood',name:'Crimson Proboscis',desc:'10% lifesteal · +20% boss damage',apply:s=>{s.lifesteal+=.10;s.bossDamage*=1.2}},
      {id:'hive',name:'Hive Crystal',desc:'+60 starting crumbs every wave',apply:s=>s.waveCrumbs+=60},
      {id:'storm',name:'Storm Thorax',desc:'Every 5th bite chains lightning',apply:s=>s.chain=true}
    ],
    biomes: [
      {name:'Clover Meadow',from:1,to:10,ground:'#173e25',ground2:'#255c35',path:'#6c6b3f',accent:'#89bf55',sky:'#8ecf98'},
      {name:'Flower Bed',from:11,to:20,ground:'#263b2b',ground2:'#4b3a31',path:'#73513a',accent:'#c77ac6',sky:'#e6a36f'},
      {name:'Night Garden',from:21,to:30,ground:'#0f2430',ground2:'#17374a',path:'#33485a',accent:'#8ba7ff',sky:'#2d396c'},
      {name:'Compost Yard',from:31,to:40,ground:'#362d20',ground2:'#55402a',path:'#785d36',accent:'#e0a547',sky:'#c46f3e'},
      {name:'Porch Raid',from:41,to:50,ground:'#262925',ground2:'#4b4d3f',path:'#726953',accent:'#f3cf70',sky:'#8aa1a3'}
    ]
  };
})();
