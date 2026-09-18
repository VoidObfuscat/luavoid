/**
 * LuaVoid — Roblox Game Picker (local-first, zero CORS issues)
 * games.js
 */

/* ══════════════════════════════════════════════
   LOCAL DATABASE — 50+ games, no external deps
══════════════════════════════════════════════ */
const GAMES_DB = [
  { name:'Blox Fruits',             id:2753915549,  genre:'RPG/Grinding',    players:'~600K', emoji:'🍎', tags:['rpg','fruits','grinding','pvp','boss','raid','sea','devil fruit','sword','gun'] },
  { name:'Arsenal',                 id:286090429,   genre:'FPS Shooter',     players:'~80K',  emoji:'🔫', tags:['fps','gun','kill','deathmatch','shooter','knife','skin','crate'] },
  { name:'Brookhaven RP',           id:4924922222,  genre:'Roleplay',        players:'~400K', emoji:'🏡', tags:['roleplay','rp','house','car','social','drama','school','job'] },
  { name:'Adopt Me!',               id:223886543,   genre:'Social/Trading',  players:'~300K', emoji:'🐾', tags:['pets','trading','eggs','rare','legendary','baby','neon','fly'] },
  { name:'Da Hood',                 id:2788229376,  genre:'Shooting/Crime',  players:'~50K',  emoji:'🏙️', tags:['shooting','crime','gang','gun','pvp','hood','cash','wanted'] },
  { name:'Jailbreak',               id:606849621,   genre:'Open World',      players:'~70K',  emoji:'🚔', tags:['cops','robbers','heist','car','jail','escape','bank','train'] },
  { name:'Pet Simulator X',         id:6284583030,  genre:'Pet Simulator',   players:'~100K', emoji:'🐶', tags:['pets','gems','eggs','hatch','simulator','coins','world','rainbow'] },
  { name:'Murder Mystery 2',        id:142823291,   genre:'Mystery',         players:'~60K',  emoji:'🔪', tags:['murder','sheriff','innocent','knife','gun','lobby','round','kill'] },
  { name:'Tower of Hell',           id:1060560842,  genre:'Obby',            players:'~40K',  emoji:'🗼', tags:['obby','parkour','climb','tower','random','section','fall','speed'] },
  { name:'Doors',                   id:6516141723,  genre:'Horror',          players:'~50K',  emoji:'🚪', tags:['horror','entity','hotel','rush','ambush','seek','door','floor'] },
  { name:'Anime Fighting Sim X',    id:1562448805,  genre:'Anime Fighting',  players:'~30K',  emoji:'⚔️', tags:['anime','fighting','awakening','chi','tycoon','simulator','power','chakra'] },
  { name:'Shindo Life',             id:5283441870,  genre:'Anime RPG',       players:'~40K',  emoji:'🌀', tags:['naruto','shinobi','bloodline','tailed beast','mode','village','pvp','grinding'] },
  { name:'A Universal Time',        id:4891711857,  genre:'Anime Fighting',  players:'~15K',  emoji:'🕰️', tags:['jojo','stand','time stop','AU','DIO','giorno','requiem','arrow'] },
  { name:'Wisteria',                id:5280570655,  genre:'Demon Slayer RPG',players:'~10K',  emoji:'🌸', tags:['demon slayer','breathing','hashira','mark','sun','moon','pvp','boss'] },
  { name:'Funky Friday',            id:5325386581,  genre:'Rhythm',          players:'~20K',  emoji:'🎵', tags:['fnf','rhythm','music','arrow','note','mod','boyfriend','week'] },
  { name:'Phantom Forces',          id:292439477,   genre:'Military FPS',    players:'~20K',  emoji:'🪖', tags:['fps','tactical','military','gun','rank','team','deathmatch','sniper'] },
  { name:'BedWars',                 id:6872265039,  genre:'Strategy PVP',    players:'~30K',  emoji:'🛏️', tags:['bedwars','pvp','teams','bed','destroy','rush','diamond','gold'] },
  { name:'Deepwoken',               id:8899316981,  genre:'RPG Hardcore',    players:'~12K',  emoji:'🌊', tags:['deepwoken','permadeath','attunement','resonance','oath','build','pvp','mantra'] },
  { name:'King Legacy',             id:5901044556,  genre:'One Piece RPG',   players:'~20K',  emoji:'👑', tags:['one piece','pirate','devil fruit','sea','island','pvp','raid','boss'] },
  { name:'Fisch',                   id:16732694052, genre:'Fishing',         players:'~40K',  emoji:'🎣', tags:['fishing','fish','ocean','rod','rare','bait','island','variant'] },
  { name:'Grow a Garden',           id:126884695,   genre:'Farming',         players:'~50K',  emoji:'🌻', tags:['garden','seed','plant','water','harvest','sell','mutation','rare'] },
  { name:'The Strongest Battlegrounds', id:9551276785, genre:'Anime PVP',   players:'~25K',  emoji:'💥', tags:['one punch','genos','saitama','pvp','combo','flying','meteor','battleground'] },
  { name:'Untitled Boxing Game',    id:10449761463, genre:'Boxing',          players:'~15K',  emoji:'🥊', tags:['boxing','punch','combo','ranked','style','parry','dodge','stamina'] },
  { name:'Counter Blox',            id:301549746,   genre:'CS:GO Clone',     players:'~10K',  emoji:'💣', tags:['counter','bomb','plant','defuse','ct','t','headshot','rifle','pistol'] },
  { name:'Royale High',             id:735030788,   genre:'Dress Up RPG',    players:'~30K',  emoji:'👑', tags:['dress','fashion','school','princess','fairy','wings','gems','exchange'] },
  { name:'Work at Pizza Place',     id:192800,      genre:'Simulator',       players:'~25K',  emoji:'🍕', tags:['pizza','work','job','oven','delivery','manager','cook','cashier'] },
  { name:'Natural Disaster Survival',id:189707,     genre:'Survival',        players:'~8K',   emoji:'🌪️', tags:['disaster','flood','volcano','earthquake','tornado','survive','platform'] },
  { name:'Flee the Facility',       id:152354242,   genre:'Horror Escape',   players:'~15K',  emoji:'🏃', tags:['escape','beast','run','computer','freeze','rescue','hide','facility'] },
  { name:'Islands',                 id:4412446125,  genre:'Survival Building',players:'~10K', emoji:'🏝️', tags:['island','craft','farm','boss','ore','totem','trading','build'] },
  { name:'Piggy',                   id:6284583030,  genre:'Horror Escape',   players:'~15K',  emoji:'🐷', tags:['piggy','escape','chapter','trap','clue','key','jumpscare','book'] },
  { name:'Lumber Tycoon 2',         id:13822889,    genre:'Tycoon',          players:'~10K',  emoji:'🪵', tags:['lumber','wood','axe','money','build','truck','log','sawmill'] },
  { name:'Dragon Ball Rage',        id:1353235494,  genre:'DBZ RPG',         players:'~5K',   emoji:'🐉', tags:['dragon ball','saiyan','ki','transformation','ssj','saga','power level'] },
  { name:'Zombie Attack',           id:19204826,    genre:'Zombie Survival', players:'~5K',   emoji:'🧟', tags:['zombie','wave','gun','armor','survive','boss','horde','undead'] },
  { name:'Entry Point',             id:2427726820,  genre:'Stealth Heist',   players:'~5K',   emoji:'🕵️', tags:['heist','stealth','mask','coop','infiltrate','silencer','guard','bank'] },
  { name:'Mining Simulator 2',      id:7541320500,  genre:'Mining Simulator',players:'~8K',   emoji:'⛏️', tags:['mining','ore','gem','drill','backpack','world','sell','egg'] },
  { name:'Frontlines',              id:5765647755,  genre:'Military FPS',    players:'~10K',  emoji:'🪖', tags:['frontlines','military','squad','objective','capture','war','tactical'] },
];

/* ══════════════════════════════════════════════
   SEARCH — pure local, instant, zero API
══════════════════════════════════════════════ */
function searchGames(query) {
  if (!query || !query.trim()) return GAMES_DB.slice(0, 20);
  const q = query.toLowerCase().trim();
  const scored = GAMES_DB.map(g => {
    let score = 0;
    const nameLow = g.name.toLowerCase();
    if (nameLow === q)                    score += 100;
    else if (nameLow.startsWith(q))       score += 60;
    else if (nameLow.includes(q))         score += 40;
    if (g.genre.toLowerCase().includes(q)) score += 20;
    g.tags.forEach(t => { if (t.includes(q)) score += 10; });
    return { game: g, score };
  }).filter(x => x.score > 0).sort((a,b) => b.score - a.score);
  return scored.map(x => x.game).slice(0, 20);
}

/* ══════════════════════════════════════════════
   BUILD GAME CONTEXT (for AI prompts)
══════════════════════════════════════════════ */
function buildGameContext(game) {
  if (!game) return null;
  return {
    name:  game.name,
    genre: game.genre,
    tags:  game.tags,
    aiPrefix: `\n[Roblox Game: "${game.name}" | Genre: ${game.genre} | Keywords: ${game.tags.slice(0,8).join(', ')}]\n\n`,
    acCtx:    `"${game.name}" (${game.genre}) — Tags: ${game.tags.slice(0,6).join(', ')}`,
    bpCtx:    `Target game: "${game.name}" (${game.genre}) — ${game.tags.slice(0,6).join(', ')}`,
    aiAntiCheatPrompt: `You are LuaVoid AI. Analyze this Roblox game and generate detection checks for an executor-side anti-cheat script.\n\nGame: "${game.name}"\nGenre: ${game.genre}\nKeywords: ${game.tags.join(', ')}\n\nBased on this game's genre and mechanics, list which cheat detections are most relevant. Output ONLY a JSON object like:\n{"speed":true,"fly":true,"tp":true,"god":false,"aimbot":true,"noclip":false,"hitbox":true,"remoteSpam":false,"reason":"<one sentence why these cheats are common in this game type>"}\n\nOutput ONLY the JSON, no markdown, no explanation.`,
  };
}

/* ══════════════════════════════════════════════
   GAME PICKER UI
══════════════════════════════════════════════ */
(function initGamePicker() {
  const wrap        = document.getElementById('game-picker-wrap');
  const btn         = document.getElementById('game-picker-btn');
  const dropdown    = document.getElementById('game-dropdown');
  const searchInput = document.getElementById('gd-search');
  const clearBtn    = document.getElementById('gd-clear');
  const statusEl    = document.getElementById('gd-status');
  const resultsEl   = document.getElementById('gd-results');
  const previewEl   = document.getElementById('gd-selected-preview');
  const gpbThumb    = document.getElementById('gpb-thumb');
  const gpbLabel    = document.getElementById('gpb-label');
  const gpbSub      = document.getElementById('gpb-sub');
  const gdspImg     = document.getElementById('gdsp-img');
  const gdspName    = document.getElementById('gdsp-name');
  const gdspMeta    = document.getElementById('gdsp-meta');
  const gdspDesc    = document.getElementById('gdsp-desc');
  const applyAi     = document.getElementById('gdsp-apply-ai');
  const applyAc     = document.getElementById('gdsp-apply-ac');
  const applyBp     = document.getElementById('gdsp-apply-bp');

  if (!wrap) return;

  let isOpen = false, selected = null, ctx = null;

  /* ── Open / Close ── */
  function open() {
    isOpen = true;
    dropdown.classList.add('open');
    btn.classList.add('active');
    searchInput.focus();
    render('');
  }
  function close() {
    isOpen = false;
    dropdown.classList.remove('open');
    btn.classList.remove('active');
  }

  btn.addEventListener('click', e => { e.stopPropagation(); isOpen ? close() : open(); });
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
  dropdown.addEventListener('click', e => e.stopPropagation());

  /* ── Search ── */
  searchInput.addEventListener('input', () => {
    const q = searchInput.value;
    clearBtn.style.display = q ? 'block' : 'none';
    render(q);
  });
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    render('');
    searchInput.focus();
  });

  /* ── Render results ── */
  function render(query) {
    const games = searchGames(query);
    statusEl.style.display = 'none';
    resultsEl.innerHTML    = '';
    if (!games.length) {
      statusEl.style.display = 'flex';
      statusEl.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> No games found for "${esc(query)}"`;
      return;
    }
    games.forEach(g => {
      const item = document.createElement('div');
      item.className = 'gd-result-item' + (selected?.id === g.id ? ' selected' : '');
      item.innerHTML = `
        <div class="gri-thumb">
          <div class="gri-thumb-emoji">${g.emoji}</div>
        </div>
        <div class="gri-info">
          <div class="gri-name">${esc(g.name)}</div>
          <div class="gri-meta">
            <span class="online"><i class="fa-solid fa-circle" style="font-size:.4rem"></i>${esc(g.players)}</span>
            <span>${esc(g.genre)}</span>
          </div>
        </div>
        <button class="gri-select-btn">Select</button>`;
      const doSel = () => selectGame(g);
      item.querySelector('.gri-select-btn').addEventListener('click', e => { e.stopPropagation(); doSel(); });
      item.addEventListener('click', doSel);
      resultsEl.appendChild(item);
    });
  }

  /* ── Select ── */
  function selectGame(game) {
    selected = game;
    ctx      = buildGameContext(game);

    // Nav button
    gpbThumb.innerHTML   = `<span style="font-size:1.1rem">${game.emoji}</span>`;
    gpbLabel.textContent = game.name.length > 16 ? game.name.slice(0,14)+'…' : game.name;
    gpbSub.textContent   = game.genre;

    // Preview
    previewEl.style.display = 'block';
    gdspImg.style.display   = 'none';
    gdspName.textContent    = `${game.emoji} ${game.name}`;
    gdspMeta.innerHTML      = `<span class="online"><i class="fa-solid fa-circle" style="font-size:.4rem"></i>${esc(game.players)}</span><span>${esc(game.genre)}</span>`;
    gdspDesc.textContent    = game.tags.slice(0,10).join(' · ');

    // Highlight in list
    document.querySelectorAll('.gd-result-item').forEach(el => {
      el.classList.toggle('selected', el.querySelector('.gri-name')?.textContent === game.name);
    });

    updateBanners();
  }

  /* ── Apply buttons ── */
  applyAi?.addEventListener('click', () => {
    if (!ctx) return;
    const p = document.getElementById('ai-prompt');
    if (p && !p.value.includes(ctx.name)) p.value = ctx.aiPrefix + p.value;
    close(); if (window.switchTab) switchTab('aiscript');
    if (typeof toast === 'function') toast(`"${selected.name}" context added to AI!`, 'success');
  });

  applyAc?.addEventListener('click', () => {
    if (!ctx) return;
    const n = document.getElementById('ac-game-name');
    if (n) n.value = selected.name;
    close(); if (window.switchTab) switchTab('anticheat');
    // Auto-analyze with AI if key available
    setTimeout(() => {
      const analyzeBtn = document.getElementById('ac-ai-analyze');
      if (analyzeBtn) analyzeBtn.click();
    }, 300);
    if (typeof toast === 'function') toast(`"${selected.name}" → Anti-Cheat! AI analyzing...`, 'success');
  });

  applyBp?.addEventListener('click', () => {
    if (!ctx) return;
    const n = document.getElementById('bp-game-name');
    if (n) n.value = selected.name;
    close(); if (window.switchTab) switchTab('bypass');
    if (typeof toast === 'function') toast(`"${selected.name}" context added to Bypass!`, 'success');
  });

  /* ── Context banners ── */
  function updateBanners() {
    if (!selected) return;
    ['obfuscator','aiscript','anticheat','bypass'].forEach(pid => {
      const panel = document.getElementById('panel-' + pid);
      if (!panel) return;
      panel.querySelector('.game-context-banner')?.remove();
      const body = panel.querySelector('.panel-body');
      if (!body) return;
      const b = document.createElement('div');
      b.className = 'game-context-banner';
      b.innerHTML = `
        <div class="gcb-thumb" style="font-size:1.4rem;display:flex;align-items:center;justify-content:center">${selected.emoji}</div>
        <div class="gcb-info">
          <div class="gcb-label"><i class="fa-brands fa-roblox"></i> Game Context Active</div>
          <div class="gcb-name">${esc(selected.name)} — ${esc(selected.genre)}</div>
        </div>
        <button class="gcb-clear" title="Clear context"><i class="fa-solid fa-xmark"></i></button>`;
      b.querySelector('.gcb-clear').addEventListener('click', clearCtx);
      body.insertBefore(b, body.firstChild);
    });
  }

  function clearCtx() {
    selected = null; ctx = null;
    gpbThumb.innerHTML   = '<i class="fa-brands fa-roblox"></i>';
    gpbLabel.textContent = 'Select Game';
    gpbSub.textContent   = 'Context for AI & tools';
    previewEl.style.display = 'none';
    document.querySelectorAll('.game-context-banner').forEach(b => b.remove());
  }

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ── Expose globally ── */
  window.getGameContext  = () => ctx;
  window.getSelectedGame = () => selected;

})();
