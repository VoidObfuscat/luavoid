/**
 * LuaVoid v3.0 — Roblox Game Picker
 * games.js
 *
 * Uses Roblox public APIs (no auth needed):
 *  - Search:    https://games.roblox.com/v1/games/list?keyword=...
 *  - Thumbnail: https://thumbnails.roblox.com/v1/games/icons?universeIds=...
 *  - Details:   https://games.roblox.com/v1/games?universeIds=...
 *
 * CORS workaround: uses allorigins.win proxy for browser requests
 */

const GamePicker = (() => {

  /* ── Proxy helper (bypasses CORS in browser) ── */
  function proxy(url) {
    return `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  }

  async function fetchJSON(url) {
    const res  = await fetch(proxy(url));
    const data = await res.json();
    return JSON.parse(data.contents);
  }

  /* ── Popular games list (shown before search) ── */
  const POPULAR = [
    { name: 'Blox Fruits',          universeId: 2753915549  },
    { name: 'Arsenal',               universeId: 286090429   },
    { name: 'Brookhaven',            universeId: 4924922222  },
    { name: 'Pet Simulator X',       universeId: 6284583030  },
    { name: 'Da Hood',               universeId: 2788229376  },
    { name: 'Adopt Me!',             universeId: 223886543   },
    { name: 'Tower of Hell',         universeId: 1060560842  },
    { name: 'Murder Mystery 2',      universeId: 142823291   },
    { name: 'Jailbreak',             universeId: 606849621   },
    { name: 'Anime Fighting Sim',    universeId: 1562448805  },
    { name: 'Doors',                 universeId: 6516141723  },
    { name: 'Work at a Pizza Place', universeId: 192800     },
    { name: 'Funky Friday',          universeId: 5325386581  },
    { name: 'Build a Boat for Treasure', universeId: 537413528 },
    { name: 'Wisteria',              universeId: 5280570655  },
    { name: 'Shindo Life',           universeId: 5283441870  },
    { name: 'Sword Fighters Sim',    universeId: 4436401254  },
    { name: 'A Universal Time',      universeId: 4891711857  },
  ];

  /* ── Search Roblox games ── */
  async function search(query) {
    if (!query || query.trim().length < 2) return [];
    const url  = `https://games.roblox.com/v1/games/list?model.keyword=${encodeURIComponent(query)}&model.maxRows=12&model.startRows=0`;
    try {
      const data = await fetchJSON(url);
      return (data.games || []).map(g => ({
        name:        g.name,
        universeId:  g.universeId,
        placeId:     g.placeId,
        playerCount: g.playerCount,
        totalPlayed: g.totalUpVotes,
        creator:     g.creatorName,
        thumbnail:   null,
      }));
    } catch(e) {
      console.warn('[GamePicker] Search error:', e.message);
      return [];
    }
  }

  /* ── Get thumbnails for universeIds ── */
  async function getThumbnails(universeIds) {
    if (!universeIds.length) return {};
    const ids  = universeIds.join(',');
    const url  = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${ids}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`;
    try {
      const data = await fetchJSON(url);
      const map  = {};
      (data.data || []).forEach(t => { map[t.targetId] = t.imageUrl; });
      return map;
    } catch(e) {
      return {};
    }
  }

  /* ── Get game details (description, visits) ── */
  async function getDetails(universeId) {
    const url = `https://games.roblox.com/v1/games?universeIds=${universeId}`;
    try {
      const data = await fetchJSON(url);
      return data.data?.[0] || null;
    } catch(e) { return null; }
  }

  /* ── Build game context for AI/AC/Bypass prompts ── */
  function buildContext(game) {
    const name  = game.name || 'Unknown';
    const plays = game.visits   ? `${Math.round((game.visits||0)/1e6*10)/10}M visits` : '';
    const online= game.playing  ? `${(game.playing||0).toLocaleString()} online` : '';
    const desc  = game.description ? game.description.slice(0, 300) : '';
    const genre = game.genre    || '';

    return {
      name,
      plays,
      online,
      desc,
      genre,

      aiPromptPrefix: `Game: ${name}${genre ? ` (${genre})` : ''}${plays ? ` | ${plays}` : ''}${online ? ` | ${online}` : ''}\nDescription: ${desc || 'N/A'}\n\n`,

      acContext: `This anti-cheat is for "${name}"${genre ? ` (${genre} game)` : ''}.${desc ? ` Game description: ${desc.slice(0,150)}` : ''}`,

      bypassContext: `Target game: "${name}"${genre ? ` — genre: ${genre}` : ''}${desc ? `. About: ${desc.slice(0,150)}` : ''}.`,
    };
  }

  return { search, getThumbnails, getDetails, buildContext, POPULAR };
})();


/* ══════════════════════════════════════════════
   GAME PICKER UI
══════════════════════════════════════════════ */
(function initGamePicker() {

  const wrap         = document.getElementById('game-picker-wrap');
  const btn          = document.getElementById('game-picker-btn');
  const dropdown     = document.getElementById('game-dropdown');
  const searchInput  = document.getElementById('gd-search');
  const clearBtn     = document.getElementById('gd-clear');
  const statusEl     = document.getElementById('gd-status');
  const resultsEl    = document.getElementById('gd-results');
  const previewEl    = document.getElementById('gd-selected-preview');
  const gpbThumb     = document.getElementById('gpb-thumb');
  const gpbLabel     = document.getElementById('gpb-label');
  const gpbSub       = document.getElementById('gpb-sub');
  const gpbArrow     = document.getElementById('gpb-arrow');
  const gdspImg      = document.getElementById('gdsp-img');
  const gdspName     = document.getElementById('gdsp-name');
  const gdspMeta     = document.getElementById('gdsp-meta');
  const gdspDesc     = document.getElementById('gdsp-desc');
  const applyAi      = document.getElementById('gdsp-apply-ai');
  const applyAc      = document.getElementById('gdsp-apply-ac');
  const applyBp      = document.getElementById('gdsp-apply-bp');

  // State
  let isOpen         = false;
  let selectedGame   = null;
  let selectedCtx    = null;
  let searchTimeout  = null;

  /* ── Open / Close ── */
  function openDropdown() {
    isOpen = true;
    dropdown.classList.add('open');
    btn.classList.add('active');
    searchInput.focus();
    // Show popular games on first open
    if (!searchInput.value) showPopular();
  }

  function closeDropdown() {
    isOpen = false;
    dropdown.classList.remove('open');
    btn.classList.remove('active');
  }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    isOpen ? closeDropdown() : openDropdown();
  });

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) closeDropdown();
  });

  dropdown.addEventListener('click', e => e.stopPropagation());

  /* ── Clear search ── */
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    showPopular();
    searchInput.focus();
  });

  /* ── Search input ── */
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    clearBtn.style.display = q ? 'block' : 'none';
    clearTimeout(searchTimeout);
    if (!q) { showPopular(); return; }
    setStatus('loading', 'Searching...');
    resultsEl.innerHTML = '';
    searchTimeout = setTimeout(() => doSearch(q), 400);
  });

  /* ── Show popular games ── */
  async function showPopular() {
    setStatus('loading', 'Loading popular games...');
    resultsEl.innerHTML = '';
    const ids  = GamePicker.POPULAR.map(g => g.universeId);
    const thumbs = await GamePicker.getThumbnails(ids);
    statusEl.style.display = 'none';
    renderResults(GamePicker.POPULAR.map(g => ({
      name:       g.name,
      universeId: g.universeId,
      playerCount: 0,
      thumbnail:  thumbs[g.universeId] || null,
    })));
  }

  /* ── Search ── */
  async function doSearch(q) {
    const results = await GamePicker.search(q);
    if (!results.length) {
      setStatus('normal', 'No games found for "' + q + '"');
      return;
    }
    // Fetch thumbnails
    const ids    = results.map(r => r.universeId);
    const thumbs = await GamePicker.getThumbnails(ids);
    results.forEach(r => { r.thumbnail = thumbs[r.universeId] || null; });
    statusEl.style.display = 'none';
    renderResults(results);
  }

  /* ── Render results ── */
  function renderResults(games) {
    resultsEl.innerHTML = '';
    if (!games.length) return;

    games.forEach(game => {
      const item = document.createElement('div');
      item.className = 'gd-result-item' + (selectedGame?.universeId === game.universeId ? ' selected' : '');

      const thumbHTML = game.thumbnail
        ? `<img src="${game.thumbnail}" alt="${escHTML(game.name)}" loading="lazy" />`
        : `<div class="gri-thumb-icon"><i class="fa-brands fa-roblox"></i></div>`;

      const online = game.playerCount
        ? `<span class="online"><i class="fa-solid fa-circle" style="font-size:.45rem"></i> ${game.playerCount.toLocaleString()}</span>`
        : '';
      const creator = game.creator ? `<span>${escHTML(game.creator)}</span>` : '';

      item.innerHTML = `
        <div class="gri-thumb">${thumbHTML}</div>
        <div class="gri-info">
          <div class="gri-name">${escHTML(game.name)}</div>
          <div class="gri-meta">${online}${creator}</div>
        </div>
        <button class="gri-select-btn">Select</button>`;

      item.querySelector('.gri-select-btn').addEventListener('click', e => {
        e.stopPropagation();
        selectGame(game);
      });
      item.addEventListener('click', () => selectGame(game));
      resultsEl.appendChild(item);
    });
  }

  /* ── Select a game ── */
  async function selectGame(game) {
    selectedGame = game;

    // Update button
    if (game.thumbnail) {
      gpbThumb.innerHTML = `<img src="${game.thumbnail}" alt="" />`;
    } else {
      gpbThumb.innerHTML = `<i class="fa-brands fa-roblox"></i>`;
    }
    gpbLabel.textContent = game.name.length > 18 ? game.name.slice(0,16) + '…' : game.name;
    gpbSub.textContent   = 'Context active';

    // Show loading preview
    previewEl.style.display = 'block';
    gdspName.textContent    = game.name;
    gdspMeta.innerHTML      = '<span class="loading">Loading details...</span>';
    gdspDesc.textContent    = '';
    if (game.thumbnail) {
      gdspImg.src = game.thumbnail;
    }

    // Fetch full details
    const details = await GamePicker.getDetails(game.universeId);
    if (details) {
      const fullGame = { ...game, ...details };
      selectedGame   = fullGame;
      selectedCtx    = GamePicker.buildContext(fullGame);

      const online  = details.playing  ? `<span class="online"><i class="fa-solid fa-circle" style="font-size:.4rem"></i> ${details.playing.toLocaleString()} online</span>` : '';
      const visits  = details.visits   ? `<span>${formatNum(details.visits)} visits</span>` : '';
      const genre   = details.genre    ? `<span>${details.genre}</span>` : '';
      const creator = details.creator?.name ? `<span>by ${details.creator.name}</span>` : '';

      gdspMeta.innerHTML = [online, visits, genre, creator].filter(Boolean).join('');
      gdspDesc.textContent = details.description?.slice(0, 200) || '';

      // Update thumbnail with better quality if available
      const bigThumbs = await GamePicker.getThumbnails([game.universeId]);
      if (bigThumbs[game.universeId]) {
        gdspImg.src = bigThumbs[game.universeId];
      }
    } else {
      selectedCtx = GamePicker.buildContext(game);
      gdspMeta.innerHTML = '';
      gdspDesc.textContent = '';
    }

    // Mark selected in results
    document.querySelectorAll('.gd-result-item').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.gd-result-item').forEach(el => {
      if (el.querySelector('.gri-name')?.textContent === game.name) el.classList.add('selected');
    });

    // Show context banners in all panels
    updateContextBanners();
  }

  /* ── Apply game context to panels ── */
  applyAi?.addEventListener('click', () => {
    if (!selectedCtx) return;
    const promptEl = document.getElementById('ai-prompt');
    if (promptEl && !promptEl.value.includes(selectedCtx.name)) {
      promptEl.value = selectedCtx.aiPromptPrefix + (promptEl.value || '');
    }
    closeDropdown();
    if (window.switchTab) switchTab('aiscript');
    showToastGlobal(`"${selectedGame.name}" context applied to AI!`);
  });

  applyAc?.addEventListener('click', () => {
    if (!selectedCtx) return;
    const nameEl = document.getElementById('ac-game-name');
    if (nameEl) nameEl.value = selectedGame.name;
    closeDropdown();
    if (window.switchTab) switchTab('anticheat');
    showToastGlobal(`"${selectedGame.name}" context applied to Anti-Cheat!`);
  });

  applyBp?.addEventListener('click', () => {
    if (!selectedCtx) return;
    const nameEl = document.getElementById('bp-game-name');
    if (nameEl) nameEl.value = selectedGame.name;
    closeDropdown();
    if (window.switchTab) switchTab('bypass');
    showToastGlobal(`"${selectedGame.name}" context applied to Bypass!`);
  });

  /* ── Context banners in panels ── */
  function updateContextBanners() {
    if (!selectedGame || !selectedCtx) return;
    const panels  = ['obfuscator','aiscript','anticheat','bypass'];
    const thumbHTML = selectedGame.thumbnail
      ? `<img src="${selectedGame.thumbnail}" alt="" />`
      : '';

    panels.forEach(panelId => {
      const panel = document.getElementById('panel-' + panelId);
      if (!panel) return;
      // Remove old banner
      panel.querySelector('.game-context-banner')?.remove();
      // Insert new banner after panel-hero
      const hero   = panel.querySelector('.panel-hero');
      const body   = panel.querySelector('.panel-body');
      if (!body) return;
      const banner = document.createElement('div');
      banner.className = 'game-context-banner';
      banner.innerHTML = `
        <div class="gcb-thumb">${thumbHTML}</div>
        <div class="gcb-info">
          <div class="gcb-label"><i class="fa-brands fa-roblox"></i> Game Context Active</div>
          <div class="gcb-name">${escHTML(selectedGame.name)}</div>
        </div>
        <button class="gcb-clear" title="Clear context"><i class="fa-solid fa-xmark"></i></button>`;
      banner.querySelector('.gcb-clear').addEventListener('click', () => {
        clearContext();
      });
      body.insertBefore(banner, body.firstChild);
    });
  }

  function clearContext() {
    selectedGame = null;
    selectedCtx  = null;
    gpbThumb.innerHTML  = '<i class="fa-brands fa-roblox"></i>';
    gpbLabel.textContent = 'Select Game';
    gpbSub.textContent   = 'Context for AI & tools';
    previewEl.style.display = 'none';
    document.querySelectorAll('.game-context-banner').forEach(b => b.remove());
  }

  /* ── Expose selectedCtx globally for AI integration ── */
  window.GamePicker = GamePicker;
  window.getGameContext = () => selectedCtx;
  window.getSelectedGame = () => selectedGame;
  window.clearGameContext = clearContext;

  /* ── Helpers ── */
  function setStatus(type, msg) {
    statusEl.style.display = 'flex';
    resultsEl.innerHTML    = '';
    if (type === 'loading') {
      statusEl.innerHTML = `<i class="fa-solid fa-spinner loading"></i> ${msg}`;
    } else {
      statusEl.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> ${msg}`;
    }
  }

  function escHTML(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function formatNum(n) {
    if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
    return String(n);
  }

  function showToastGlobal(msg) {
    // Use LuaVoid's toast system if available
    if (typeof toast === 'function') { toast(msg, 'success'); return; }
    // Fallback
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;background:#1e1f2e;border:1px solid #4ade80;color:#4ade80;padding:.7rem 1.1rem;border-radius:10px;font-size:.82rem;font-weight:600;z-index:9999;animation:toastIn .3s ease';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

})();


/* ══════════════════════════════════════════════
   PATCH: AI GENERATE — inject game context
   (runs after app.js sets up the AI button)
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Intercept the AI generate click to prepend game context
  const aiPromptEl = document.getElementById('ai-prompt');
  if (!aiPromptEl) return;

  // Patch quick prompt buttons to include game context
  document.querySelectorAll('.aqp-btn').forEach(btn => {
    const orig = btn.dataset.prompt;
    btn.addEventListener('click', () => {
      const ctx = window.getGameContext?.();
      if (ctx) {
        aiPromptEl.value = ctx.aiPromptPrefix + orig;
      } else {
        aiPromptEl.value = orig;
      }
    });
  });
});
