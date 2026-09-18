/**
 * LuaVoid — Roblox Game Picker v3
 * Uses roproxy.com (CORS-free Roblox API mirror) for real game data + thumbnails
 */

const ROPROXY = 'https://games.roproxy.com';
const THUMBPROXY = 'https://thumbnails.roproxy.com';

/* ── Popular games fallback (shown before search, with known IDs) ── */
const POPULAR_IDS = [
  2753915549, 286090429, 4924922222, 223886543, 2788229376, 606849621,
  6284583030, 142823291, 1060560842, 6516141723, 1562448805, 5283441870,
  4891711857, 5280570655, 5325386581, 292439477, 6872265039, 8899316981,
  5901044556, 16732694052, 126884695, 9551276785, 10449761463, 301549746,
  735030788, 192800, 189707, 152354242, 4412446125, 13822889,
  7541320500, 1353235494, 19204826, 2427726820, 5765647755,
];

/* ── In-memory cache ── */
const _thumbCache = {};
const _gameCache  = {};

/* ── Fetch thumbnails for a list of universeIds ── */
async function fetchThumbs(ids) {
  const needed = ids.filter(id => !_thumbCache[id]);
  if (!needed.length) return;
  try {
    const chunks = [];
    for (let i = 0; i < needed.length; i += 100) chunks.push(needed.slice(i, i + 100));
    for (const chunk of chunks) {
      const url = `${THUMBPROXY}/v1/games/icons?universeIds=${chunk.join(',')}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const data = await res.json();
      (data.data || []).forEach(t => { _thumbCache[t.targetId] = t.imageUrl; });
    }
  } catch(e) { /* silent */ }
}

/* ── Search via roproxy ── */
async function searchRobloxGames(query) {
  try {
    const url = `${ROPROXY}/v1/games/list?model.keyword=${encodeURIComponent(query)}&model.maxRows=24&model.startRows=0&model.sortToken=&model.gameSetTargetId=&model.gameSetTypeId=`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const games = (data.games || []).map(g => ({
      id:      g.universeId,
      placeId: g.placeId,
      name:    g.name,
      players: g.playerCount || 0,
      creator: g.creatorName || '',
      thumb:   null,
    }));
    if (games.length) {
      await fetchThumbs(games.map(g => g.id));
      games.forEach(g => { g.thumb = _thumbCache[g.id] || null; });
    }
    return games;
  } catch(e) {
    console.warn('[GamePicker] search error:', e.message);
    return null;
  }
}

/* ── Load popular games ── */
async function loadPopularGames() {
  // Get details for popular IDs
  try {
    const chunks = [];
    for (let i = 0; i < POPULAR_IDS.length; i += 50) chunks.push(POPULAR_IDS.slice(i, i + 50));
    const games = [];
    for (const chunk of chunks) {
      const url = `${ROPROXY.replace('games.','')}/v1/games?universeIds=${chunk.join(',')}`;
      const res = await fetch(url.replace('https://','https://games.roproxy.com').replace('/v1/','/v1/'), { signal: AbortSignal.timeout(8000) });
      // fallback: just use IDs
      if (res.ok) {
        const data = await res.json();
        (data.data || chunk.map(id => ({id,name:'Loading...',playerCount:0}))).forEach(g => {
          games.push({ id: g.id || g.universeId, name: g.name || 'Game', players: g.playing || 0, creator: g.creator?.name || '', thumb: null });
        });
      } else {
        chunk.forEach(id => games.push({ id, name: 'Loading...', players: 0, creator: '', thumb: null }));
      }
    }
    await fetchThumbs(POPULAR_IDS);
    games.forEach(g => { g.thumb = _thumbCache[g.id] || null; });
    return games;
  } catch(e) {
    // Return stubs if API fails
    return POPULAR_IDS.map(id => ({ id, name: 'Game #' + id, players: 0, creator: '', thumb: null }));
  }
}

/* ── Game context builder ── */
function buildGameContext(game) {
  if (!game) return null;
  return {
    name:   game.name,
    aiPrefix: `\n[Roblox Game: "${game.name}"${game.creator?' by '+game.creator:''}${game.players?' | '+game.players.toLocaleString()+' online':''}]\n\n`,
    acCtx:    `"${game.name}"${game.creator?' by '+game.creator:''}`,
    bpCtx:    `Target: "${game.name}"`,
    aiAntiCheatPrompt: `You are LuaVoid AI, a Roblox anti-cheat expert. Analyze the game "${game.name}"${game.creator?' by '+game.creator:''} and determine which executor-side cheat detections are most useful.\n\nOutput ONLY this exact JSON (no markdown, no extra text):\n{"speed":true,"fly":true,"tp":true,"god":false,"aimbot":false,"noclip":false,"hitbox":false,"remoteSpam":false,"jump":true,"reason":"one sentence explaining why"}`,
  };
}

/* ══════════════════════════════════════════════
   GAME PICKER UI
══════════════════════════════════════════════ */
(function initPicker() {
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

  let isOpen = false, selected = null, ctx = null, searchTO = null, popularLoaded = false;

  /* ── Open/Close ── */
  function open() {
    isOpen = true;
    dropdown.classList.add('open');
    btn.classList.add('active');
    searchInput.focus();
    if (!popularLoaded) { popularLoaded = true; loadAndRender(); }
  }
  function close() {
    isOpen = false;
    dropdown.classList.remove('open');
    btn.classList.remove('active');
  }
  btn.addEventListener('click', e => { e.stopPropagation(); isOpen ? close() : open(); });
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
  dropdown.addEventListener('click', e => e.stopPropagation());

  /* ── Load popular ── */
  async function loadAndRender() {
    setStatus('loading', 'Loading popular games...');
    const games = await loadPopularGames();
    statusEl.style.display = 'none';
    renderGames(games, false);
  }

  /* ── Search ── */
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    clearBtn.style.display = q ? 'block' : 'none';
    clearTimeout(searchTO);
    if (!q) { loadAndRender(); return; }
    setStatus('loading', 'Searching all Roblox games...');
    resultsEl.innerHTML = '';
    searchTO = setTimeout(async () => {
      const games = await searchRobloxGames(q);
      if (games === null) {
        setStatus('error', 'Search failed. Check connection.');
        return;
      }
      if (!games.length) {
        setStatus('normal', `No results for "${esc(q)}"`);
        return;
      }
      statusEl.style.display = 'none';
      renderGames(games, false);
    }, 500);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    loadAndRender();
    searchInput.focus();
  });

  /* ── Render list ── */
  function renderGames(games, append) {
    if (!append) resultsEl.innerHTML = '';
    games.forEach(g => {
      const item = document.createElement('div');
      item.className = 'gd-result-item' + (selected?.id === g.id ? ' selected' : '');

      const thumbHTML = g.thumb
        ? `<img src="${g.thumb}" alt="" loading="lazy" onerror="this.style.display='none';this.nextSibling.style.display='flex'" /><div class="gri-fallback" style="display:none"><i class="fa-brands fa-roblox"></i></div>`
        : `<div class="gri-fallback"><i class="fa-brands fa-roblox"></i></div>`;

      const online = g.players ? `<span class="online"><i class="fa-solid fa-circle" style="font-size:.35rem"></i> ${fmtN(g.players)}</span>` : '';
      const creator = g.creator ? `<span>${esc(g.creator)}</span>` : '';

      item.innerHTML = `
        <div class="gri-thumb">${thumbHTML}</div>
        <div class="gri-info">
          <div class="gri-name">${esc(g.name)}</div>
          <div class="gri-meta">${online}${creator}</div>
        </div>
        <button class="gri-select-btn">Use</button>`;

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

    if (game.thumb) {
      gpbThumb.innerHTML = `<img src="${game.thumb}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:6px" onerror="this.parentElement.innerHTML='<i class=\\"fa-brands fa-roblox\\" style=\\"color:#e8362a\\"></i>'" />`;
    } else {
      gpbThumb.innerHTML = `<i class="fa-brands fa-roblox" style="color:#e8362a"></i>`;
    }
    gpbLabel.textContent = game.name.length > 16 ? game.name.slice(0,14)+'…' : game.name;
    gpbSub.textContent   = game.creator ? 'by '+game.creator : 'Context active';

    previewEl.style.display = 'block';
    gdspName.textContent    = game.name;
    gdspMeta.innerHTML      = (game.players?`<span class="online"><i class="fa-solid fa-circle" style="font-size:.35rem"></i> ${fmtN(game.players)} online</span>`:'') + (game.creator?`<span>by ${esc(game.creator)}</span>`:'');
    gdspDesc.textContent    = '';

    if (game.thumb) {
      gdspImg.src           = game.thumb;
      gdspImg.style.display = 'block';
      gdspImg.onerror       = () => { gdspImg.style.display = 'none'; };
    } else {
      gdspImg.style.display = 'none';
    }

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
    if (typeof toast === 'function') toast(`"${selected.name}" added to AI context`, 'success');
  });
  applyAc?.addEventListener('click', () => {
    if (!ctx) return;
    const n = document.getElementById('ac-game-name');
    if (n) n.value = selected.name;
    close(); if (window.switchTab) switchTab('anticheat');
    setTimeout(() => { document.getElementById('ac-ai-analyze')?.click(); }, 400);
    if (typeof toast === 'function') toast(`"${selected.name}" → Anti-Cheat AI analyzing...`, 'info');
  });
  applyBp?.addEventListener('click', () => {
    if (!ctx) return;
    const n = document.getElementById('bp-game-name');
    if (n) n.value = selected.name;
    close(); if (window.switchTab) switchTab('bypass');
    if (typeof toast === 'function') toast(`"${selected.name}" added to Bypass`, 'success');
  });

  /* ── Banners ── */
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
      const tHTML = selected.thumb ? `<img src="${selected.thumb}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px" />` : '';
      b.innerHTML = `
        <div class="gcb-thumb">${tHTML}</div>
        <div class="gcb-info">
          <div class="gcb-label"><i class="fa-brands fa-roblox"></i> Game Context Active</div>
          <div class="gcb-name">${esc(selected.name)}</div>
        </div>
        <button class="gcb-clear"><i class="fa-solid fa-xmark"></i></button>`;
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

  /* ── Utils ── */
  function setStatus(type, msg) {
    statusEl.style.display = 'flex';
    resultsEl.innerHTML    = '';
    const icons = { loading:'fa-spinner fa-spin', normal:'fa-magnifying-glass', error:'fa-triangle-exclamation' };
    statusEl.innerHTML = `<i class="fa-solid ${icons[type]||icons.normal}"></i> ${msg}`;
    statusEl.style.color = type==='error' ? 'var(--red)' : '';
  }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fmtN(n) { if(n>=1e6) return (n/1e6).toFixed(1)+'M'; if(n>=1e3) return (n/1e3).toFixed(0)+'K'; return String(n); }

  window.getGameContext  = () => ctx;
  window.getSelectedGame = () => selected;
})();
