/**
 * LuaVoid v3.0 — App Logic
 * app.js
 */

/* ══════════════════════════════════════════════
   WELCOME SCREEN
══════════════════════════════════════════════ */

(function initWelcome() {
  const canvas    = document.getElementById('welcome-canvas');
  const ctx       = canvas.getContext('2d');
  const bar       = document.getElementById('wl-bar');
  const status    = document.getElementById('wl-status');
  const typed     = document.getElementById('wt-typed');
  const enterBtn  = document.getElementById('welcome-enter');
  const screen    = document.getElementById('welcome-screen');
  const mainApp   = document.getElementById('main-app');

  /* ── Canvas particle field ── */
  let W, H, particles = [];
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function mkParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '124,90,245' : '34,211,238',
    };
  }
  for (let i = 0; i < 140; i++) particles.push(mkParticle());

  // Connection lines
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          const alpha = (1 - dist/120) * 0.12;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(124,90,245,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  let animId;
  function animCanvas() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
    }
    animId = requestAnimationFrame(animCanvas);
  }
  animCanvas();

  /* ── Typing animation ── */
  const LINES = [
    'Professional Lua Obfuscation Hub',
    'Roblox Executor Compatible',
    'Protect. Encode. Deploy.',
  ];
  let li = 0, ci = 0, deleting = false;

  function typeStep() {
    const line = LINES[li];
    if (!deleting) {
      typed.textContent = line.slice(0, ++ci);
      if (ci >= line.length) { deleting = true; setTimeout(typeStep, 1800); return; }
    } else {
      typed.textContent = line.slice(0, --ci);
      if (ci <= 0) { deleting = false; li = (li + 1) % LINES.length; setTimeout(typeStep, 400); return; }
    }
    setTimeout(typeStep, deleting ? 40 : 55);
  }
  setTimeout(typeStep, 600);

  /* ── Loading sequence ── */
  const STAGES = [
    { pct: 15, msg: 'Initializing engine...' },
    { pct: 32, msg: 'Loading obfuscation layers...' },
    { pct: 55, msg: 'Preparing Roblox compatibility...' },
    { pct: 72, msg: 'Setting up Script Hub...' },
    { pct: 88, msg: 'Finalizing deobfuscator...' },
    { pct: 100, msg: 'Ready!' },
  ];

  let si = 0;
  function nextStage() {
    if (si >= STAGES.length) {
      // Show feature pills
      setTimeout(() => { document.getElementById('wf-1').classList.add('show'); }, 100);
      setTimeout(() => { document.getElementById('wf-2').classList.add('show'); }, 250);
      setTimeout(() => { document.getElementById('wf-3').classList.add('show'); }, 400);
      // Show enter button
      setTimeout(() => {
        enterBtn.style.display = 'inline-flex';
        enterBtn.style.animation = 'enterPulse 2s ease-in-out infinite, wFadeIn 0.4s ease forwards';
      }, 700);
      return;
    }
    const s = STAGES[si++];
    bar.style.width    = s.pct + '%';
    status.textContent = s.msg;
    setTimeout(nextStage, 320 + Math.random() * 180);
  }
  setTimeout(nextStage, 400);

  /* ── Enter button ── */
  let entered = false;
  function enterApp() {
    if (entered) return;
    entered = true;
    screen.classList.add('exit');
    mainApp.classList.remove('hidden');
    setTimeout(() => {
      mainApp.classList.add('visible');
      screen.style.display = 'none';
      cancelAnimationFrame(animId);
    }, 650);
  }

  enterBtn.addEventListener('click', enterApp);

  // Allow clicking anywhere after 100% loaded
  screen.addEventListener('click', e => {
    if (enterBtn.style.display !== 'none') enterApp();
  });

  // Skip with any key
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      if (enterBtn.style.display !== 'none') {
        document.removeEventListener('keydown', onKey);
        enterApp();
      }
    }
  });
})();


/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
const $  = id  => document.getElementById(id);
const $q = sel => document.querySelector(sel);
const $a = sel => document.querySelectorAll(sel);

/* Toast system */
const toastContainer = $('toast-container');
function toast(msg, type = 'success', duration = 2800) {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warn: 'fa-triangle-exclamation' };
  const el = document.createElement('div');
  el.className = `toast t-${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.success}"></i><span>${msg}</span>`;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}

async function copyText(text, msg) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  }
  if (msg) toast(msg);
}

function downloadLua(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* Line numbers */
function updateLineNumbers(textarea, lnEl) {
  if (!textarea || !lnEl) return;
  const lines = (textarea.value || '').split('\n').length;
  let html = '';
  for (let i = 1; i <= lines; i++) html += i + '\n';
  lnEl.textContent = html;
  // Sync scroll
  lnEl.scrollTop = textarea.scrollTop;
}

function syncScroll(textarea, lnEl) {
  if (textarea && lnEl) textarea.addEventListener('scroll', () => { lnEl.scrollTop = textarea.scrollTop; });
}

function updateStats(textarea, el) {
  if (!textarea || !el) return;
  const val   = textarea.value;
  const lines = val ? val.split('\n').length : 0;
  el.textContent = `${lines} line${lines !== 1 ? 's' : ''} · ${val.length.toLocaleString()} chars`;
}

/* Progress ring animation */
function animRing(circleEl, cb) {
  const circ = 125.6;
  let pct = 0;
  const steps = [10, 25, 42, 60, 78, 92, 100];
  let si = 0;
  function step() {
    if (si >= steps.length) { cb && cb(); return; }
    pct = steps[si++];
    circleEl.style.strokeDashoffset = circ - (pct / 100) * circ;
    setTimeout(step, 70 + Math.random() * 80);
  }
  step();
}

function resetRing(circleEl) {
  circleEl.style.strokeDashoffset = 125.6;
}


/* ══════════════════════════════════════════════
   TAB SYSTEM
══════════════════════════════════════════════ */
const navTabs  = $a('.nav-tab');
const mTabs    = $a('.mtab');
const panels   = $a('.panel');

function switchTab(tabName) {
  navTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
  mTabs.forEach(t   => t.classList.toggle('active', t.dataset.tab === tabName));
  panels.forEach(p  => p.classList.toggle('active', p.dataset.panel === tabName));
}

navTabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
mTabs.forEach(t   => t.addEventListener('click', () => switchTab(t.dataset.tab)));


/* ══════════════════════════════════════════════
   OBFUSCATOR TAB
══════════════════════════════════════════════ */
const inputCode   = $('input-code');
const outputCode  = $('output-code');
const btnObf      = $('btn-obfuscate');
const btnSwap     = $('btn-swap');
const btnCopy     = $('btn-copy');
const btnDownload = $('btn-download');
const btnSample   = $('btn-sample');
const btnClearIn  = $('btn-clear-input');
const btnSendHub  = $('btn-send-hub');
const inputStats  = $('input-stats');
const outputStats = $('output-stats');
const obfProtected= $('obf-protected');
const obfRingFill = $('obf-ring-fill');
const lnInput     = $('ln-input');
const lnOutput    = $('ln-output');

const SAMPLE = `-- LuaVoid Sample — Roblox Game Script
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

-- Configuration
local config = {
  walkSpeed = 32,
  jumpPower = 75,
  autoHeal  = true,
  healRate  = 5,
}

-- Apply settings
local function applyConfig()
  humanoid.WalkSpeed = config.walkSpeed
  humanoid.JumpPower = config.jumpPower
  print("Config applied for: " .. player.Name)
end

-- Auto heal loop
local function startAutoHeal()
  if not config.autoHeal then return end
  RunService.Heartbeat:Connect(function()
    if humanoid.Health < humanoid.MaxHealth then
      humanoid.Health = humanoid.Health + config.healRate
    end
  end)
end

applyConfig()
startAutoHeal()
print("Script loaded successfully!")`;

// Initialize line numbers
syncScroll(inputCode,  lnInput);
syncScroll(outputCode, lnOutput);

inputCode.addEventListener('input', () => {
  updateLineNumbers(inputCode, lnInput);
  updateStats(inputCode, inputStats);
});
inputCode.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = inputCode.selectionStart, en = inputCode.selectionEnd;
    inputCode.value = inputCode.value.slice(0, s) + '  ' + inputCode.value.slice(en);
    inputCode.selectionStart = inputCode.selectionEnd = s + 2;
    updateLineNumbers(inputCode, lnInput);
  }
});
outputCode.addEventListener('scroll', () => { lnOutput.scrollTop = outputCode.scrollTop; });
updateLineNumbers(inputCode,  lnInput);
updateLineNumbers(outputCode, lnOutput);

function getObfOptions() {
  return {
    stripComments:  $('opt-comments').checked,
    renameVars:     $('opt-rename').checked,
    encryptStrings: $('opt-strings').checked,
    encodeNumbers:  $('opt-numbers').checked,
    injectJunk:     $('opt-junk').checked,
    junkIntensity:  parseInt($('junk-intensity').value, 10),
    flattenFlow:    $('opt-flatten').checked,
    robloxWrap:     $('opt-roblox-wrap').checked,
    compress:       $('opt-compress').checked,
    watermark:      $('opt-watermark').checked,
  };
}

// Presets
const PRESETS = {
  light:  { 'opt-rename':true,'opt-strings':true,'opt-comments':true,'opt-junk':false,'opt-numbers':false,'opt-flatten':false,'opt-roblox-wrap':true,'opt-compress':false,'opt-watermark':false, junk:2 },
  medium: { 'opt-rename':true,'opt-strings':true,'opt-comments':true,'opt-junk':true,'opt-numbers':false,'opt-flatten':false,'opt-roblox-wrap':true,'opt-compress':false,'opt-watermark':false, junk:5 },
  max:    { 'opt-rename':true,'opt-strings':true,'opt-comments':true,'opt-junk':true,'opt-numbers':true,'opt-flatten':true,'opt-roblox-wrap':true,'opt-compress':true,'opt-watermark':true, junk:9 },
};

function applyPreset(name) {
  const p = PRESETS[name];
  Object.keys(p).forEach(k => {
    if (k === 'junk') return;
    const el = $(k); if (el) el.checked = p[k];
  });
  $('junk-intensity').value = p.junk;
  updateIntensityLevels(p.junk);
  $a('.preset-btn').forEach(b => b.classList.toggle('active', b.id === 'preset-' + name));
}
$('preset-light').addEventListener('click',  () => applyPreset('light'));
$('preset-medium').addEventListener('click', () => applyPreset('medium'));
$('preset-max').addEventListener('click',    () => applyPreset('max'));

// Intensity level buttons
function updateIntensityLevels(val) {
  val = parseInt(val);
  $a('.il').forEach(il => {
    il.classList.toggle('active', parseInt(il.dataset.v) === val);
  });
}
$a('.il').forEach(il => {
  il.addEventListener('click', () => {
    $('junk-intensity').value = il.dataset.v;
    updateIntensityLevels(il.dataset.v);
    $a('.il').forEach(i => i.classList.toggle('active', i === il));
  });
});
$('junk-intensity').addEventListener('input', e => updateIntensityLevels(e.target.value));

// Obfuscate
btnObf.addEventListener('click', () => {
  const code = inputCode.value.trim();
  if (!code) { toast('Paste a Lua script first!', 'warn'); inputCode.focus(); return; }

  btnObf.classList.add('loading');
  resetRing(obfRingFill);

  animRing(obfRingFill, () => {
    setTimeout(() => {
      try {
        const result = LuaVoidEngine.obfuscate(code, getObfOptions());
        outputCode.value = result;
        updateLineNumbers(outputCode, lnOutput);
        updateStats(outputCode, outputStats);
        obfProtected.style.display = 'flex';
        toast('Script obfuscated!', 'success');
        resetRing(obfRingFill);
        btnObf.classList.remove('loading');
      } catch(e) {
        outputCode.value = '-- Error: ' + e.message;
        toast('Error: ' + e.message, 'error');
        btnObf.classList.remove('loading');
        resetRing(obfRingFill);
      }
    }, 80);
  });
});

// Ctrl+Enter shortcut
document.addEventListener('keydown', e => {
  // Ignorar se o main app ainda não estiver visível
  const app = $('main-app');
  if (!app || app.classList.contains('hidden') || !app.classList.contains('visible')) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const activePanel = $q('.panel.active');
    if (activePanel && activePanel.dataset.panel === 'obfuscator') {
      e.preventDefault(); btnObf.click();
    } else if (activePanel && activePanel.dataset.panel === 'deobfuscator') {
      e.preventDefault(); $('btn-deobfuscate').click();
    }
  }
});

btnCopy.addEventListener('click', () => {
  if (!outputCode.value.trim()) { toast('Nothing to copy!', 'warn'); return; }
  copyText(outputCode.value, 'Copied to clipboard!');
});
btnDownload.addEventListener('click', () => {
  if (!outputCode.value.trim()) { toast('Nothing to download!', 'warn'); return; }
  downloadLua(outputCode.value, 'obfuscated_luavoid.lua');
  toast('Downloaded!', 'info');
});
btnSample.addEventListener('click', () => {
  inputCode.value = SAMPLE;
  updateLineNumbers(inputCode, lnInput);
  updateStats(inputCode, inputStats);
  toast('Sample script loaded!', 'info');
});
btnClearIn.addEventListener('click', () => {
  inputCode.value = '';
  updateLineNumbers(inputCode, lnInput);
  updateStats(inputCode, inputStats);
  inputCode.focus();
});
btnSwap.addEventListener('click', () => {
  const tmp = inputCode.value;
  inputCode.value  = outputCode.value;
  outputCode.value = tmp;
  updateLineNumbers(inputCode, lnInput);
  updateLineNumbers(outputCode, lnOutput);
  updateStats(inputCode, inputStats);
  updateStats(outputCode, outputStats);
  toast('Swapped!', 'info');
});
btnSendHub.addEventListener('click', () => {
  const code = outputCode.value.trim();
  if (!code) { toast('Obfuscate a script first!', 'warn'); return; }
  $('hub-script').value = code;
  updateLineNumbers($('hub-script'), $('ln-hub'));
  updateStats($('hub-script'), $('hub-script-stats'));
  switchTab('scripthub');
  toast('Script sent to Hub!', 'success');
});


/* ══════════════════════════════════════════════
   DEOBFUSCATOR TAB
══════════════════════════════════════════════ */
const deobInput   = $('deob-input');
const deobOutput  = $('deob-output');
const lnDeobIn    = $('ln-deob-in');
const lnDeobOut   = $('ln-deob-out');
const deobInStats = $('deob-input-stats');
const deobOutStats= $('deob-output-stats');
const deobInfo    = $('deob-info');
const deobRingFill= $('deobf-ring-fill');

syncScroll(deobInput,  lnDeobIn);
syncScroll(deobOutput, lnDeobOut);

deobInput.addEventListener('input', () => {
  updateLineNumbers(deobInput, lnDeobIn);
  updateStats(deobInput, deobInStats);
});
deobInput.addEventListener('scroll', () => { lnDeobIn.scrollTop = deobInput.scrollTop; });
deobOutput.addEventListener('scroll', () => { lnDeobOut.scrollTop = deobOutput.scrollTop; });

function getDeobOptions() {
  return {
    decodeStrings: $('deob-strings').checked,
    simplifyExprs: $('deob-numbers').checked,
    removeJunk:    $('deob-junk').checked,
    reformat:      $('deob-format').checked,
  };
}

$('btn-deobfuscate').addEventListener('click', () => {
  const code = deobInput.value.trim();
  if (!code) { toast('Paste obfuscated code first!', 'warn'); deobInput.focus(); return; }

  $('btn-deobfuscate').classList.add('loading');
  resetRing(deobRingFill);

  animRing(deobRingFill, () => {
    setTimeout(() => {
      try {
        const result = LuaVoidEngine.deobfuscate(code, getDeobOptions());
        deobOutput.value = result;
        updateLineNumbers(deobOutput, lnDeobOut);
        updateStats(deobOutput, deobOutStats);
        deobInfo.style.display = 'flex';
        toast('Deobfuscation complete!', 'success');
        resetRing(deobRingFill);
        $('btn-deobfuscate').classList.remove('loading');
      } catch(e) {
        deobOutput.value = '-- Error: ' + e.message;
        toast('Error: ' + e.message, 'error');
        $('btn-deobfuscate').classList.remove('loading');
        resetRing(deobRingFill);
      }
    }, 60);
  });
});

$('btn-deob-clear').addEventListener('click', () => {
  deobInput.value  = '';
  deobOutput.value = '';
  updateLineNumbers(deobInput, lnDeobIn);
  updateLineNumbers(deobOutput, lnDeobOut);
  deobInfo.style.display = 'none';
  deobInput.focus();
});
$('btn-deob-copy').addEventListener('click', () => {
  if (!deobOutput.value.trim()) { toast('Nothing to copy!', 'warn'); return; }
  copyText(deobOutput.value, 'Copied to clipboard!');
});
$('btn-deob-download').addEventListener('click', () => {
  if (!deobOutput.value.trim()) { toast('Nothing to download!', 'warn'); return; }
  downloadLua(deobOutput.value, 'deobfuscated_luavoid.lua');
  toast('Downloaded!', 'info');
});


/* ══════════════════════════════════════════════
   SCRIPT HUB TAB
══════════════════════════════════════════════ */
const hubScript      = $('hub-script');
const lnHub          = $('ln-hub');
const hubScriptStats = $('hub-script-stats');
const hubEmpty       = $('hub-empty');
const hubResult      = $('hub-result');
const hubLsOutput    = $('hub-ls-output');
const hubUrlDisplay  = $('hub-url-display');
const hubPreviewTa   = $('hub-preview-ta');
const hubPreviewSize = $('hub-preview-size');

let currentBlobUrl = null;
let currentScript  = '';
let currentName    = '';

syncScroll(hubScript, lnHub);
hubScript.addEventListener('input', () => {
  updateLineNumbers(hubScript, lnHub);
  updateStats(hubScript, hubScriptStats);
});
hubScript.addEventListener('scroll', () => { lnHub.scrollTop = hubScript.scrollTop; });

// Load from obfuscator
$('hub-load-from-obf').addEventListener('click', () => {
  const code = outputCode.value.trim() || inputCode.value.trim();
  if (!code) { toast('No script in the Obfuscator!', 'warn'); switchTab('obfuscator'); return; }
  hubScript.value = code;
  updateLineNumbers(hubScript, lnHub);
  updateStats(hubScript, hubScriptStats);
  toast('Loaded from Obfuscator!', 'info');
});

$('hub-clear-script').addEventListener('click', () => {
  hubScript.value = '';
  updateLineNumbers(hubScript, lnHub);
  updateStats(hubScript, hubScriptStats);
  hubScript.focus();
});

// Generate loadstring
$('hub-generate').addEventListener('click', () => {
  const rawCode = hubScript.value.trim();
  if (!rawCode) { toast('Paste a script first!', 'warn'); hubScript.focus(); return; }

  const name     = $('hub-name').value.trim()   || 'MyScript';
  const author   = $('hub-author').value.trim() || 'LuaVoid';
  const doObf    = $('hub-obfuscate').checked;
  const doPcall  = $('hub-pcall').checked;

  currentName = name;

  // Process script
  let processed = rawCode;
  try {
    if (doObf) {
      processed = LuaVoidEngine.obfuscate(rawCode, {
        stripComments: true, renameVars: true, encryptStrings: true,
        injectJunk: true, junkIntensity: 4, robloxWrap: doPcall,
        watermark: false,
      });
    } else if (doPcall) {
      const ok = '_ok_' + Math.random().toString(36).slice(2, 7);
      const er = '_er_' + Math.random().toString(36).slice(2, 7);
      processed = `local ${ok},${er} = pcall(function()\n${rawCode}\nend)\nif not ${ok} then warn("[LuaVoid] "..tostring(${er})) end`;
    }
  } catch(e) {
    toast('Obfuscation error: ' + e.message, 'error');
    return;
  }

  // Add header comment
  const header = `--[[ ${name} | by ${author} | LuaVoid Hub ]]\n`;
  processed = header + processed;
  currentScript = processed;

  // Create blob URL
  if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
  const blob     = new Blob([processed], { type: 'text/plain' });
  currentBlobUrl = URL.createObjectURL(blob);

  // Fill UI
  const loadstring = `loadstring(game:HttpGet("${currentBlobUrl}"))()`;
  hubLsOutput.value   = loadstring;
  hubUrlDisplay.value = currentBlobUrl;

  const kb = (new Blob([processed]).size / 1024).toFixed(2);
  hubPreviewTa.value  = processed.slice(0, 1000) + (processed.length > 1000 ? '\n-- [truncated...]' : '');
  hubPreviewSize.textContent = `${kb} KB · ${processed.split('\n').length} lines`;
  $('hrb-title').textContent = `"${name}" is ready!`;

  // Show result
  hubEmpty.style.display  = 'none';
  hubResult.style.cssText = 'display:flex;flex-direction:column;gap:1rem';

  // Save
  saveScript({ name, author, code: processed, blobUrl: currentBlobUrl, loadstring, ts: Date.now() });
  renderSaved();

  toast(`"${name}" generated!`, 'success');
});

// Copy loadstring
$('hub-copy-ls').addEventListener('click', () => {
  if (!hubLsOutput.value) { toast('Generate a script first!', 'warn'); return; }
  copyText(hubLsOutput.value, 'loadstring copied! Paste it in your executor 🎮');
});

// Copy URL
$('hub-copy-url').addEventListener('click', () => {
  if (!hubUrlDisplay.value) return;
  copyText(hubUrlDisplay.value, 'URL copied!');
});

// Download script
$('hub-download-script').addEventListener('click', () => {
  if (!currentScript) { toast('Generate a script first!', 'warn'); return; }
  const safe = currentName.replace(/[^a-zA-Z0-9_\-]/g,'_') || 'script';
  downloadLua(currentScript, `${safe}_luavoid.lua`);
  toast('Downloaded! Upload to Gist or Pastebin for a permanent link.', 'info', 4000);
});

// Open Gist
$('hub-open-gist').addEventListener('click', () => {
  if (!currentScript) { toast('Generate a script first!', 'warn'); return; }
  copyText(currentScript, 'Script copied! Paste it in the Gist below.');
  setTimeout(() => window.open('https://gist.github.com/new', '_blank', 'noopener'), 500);
});

// New script
$('hub-new').addEventListener('click', () => {
  hubEmpty.style.display  = 'block';
  hubResult.style.display = 'none';
  hubScript.value = '';
  updateLineNumbers(hubScript, lnHub);
  updateStats(hubScript, hubScriptStats);
  if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }
  currentScript = '';
});

/* ── localStorage ── */
function getScripts() {
  try { return JSON.parse(localStorage.getItem('lv3_scripts') || '[]'); } catch { return []; }
}
function saveScript(entry) {
  const list = getScripts();
  list.unshift(entry);
  if (list.length > 25) list.pop();
  localStorage.setItem('lv3_scripts', JSON.stringify(list));
}
function deleteScript(i) {
  const list = getScripts();
  list.splice(i, 1);
  localStorage.setItem('lv3_scripts', JSON.stringify(list));
  renderSaved();
}

window.deleteScript = deleteScript;
window.loadScript   = function(i) {
  const list = getScripts();
  const s    = list[i];
  if (!s) return;
  hubScript.value = s.code;
  $('hub-name').value   = s.name   || '';
  $('hub-author').value = s.author || '';
  updateLineNumbers(hubScript, lnHub);
  updateStats(hubScript, hubScriptStats);
  toast(`"${s.name}" loaded!`, 'info');
};
window.regenScript = function(i) {
  window.loadScript(i);
  setTimeout(() => $('hub-generate').click(), 150);
};

function renderSaved() {
  const list  = getScripts();
  const el    = $('hub-saved-list');
  const count = $('saved-count');
  count.textContent = list.length;

  if (!list.length) {
    el.innerHTML = `<div class="hub-saved-empty"><i class="fa-solid fa-inbox"></i><p>No scripts saved yet</p></div>`;
    return;
  }
  el.innerHTML = list.map((s, i) => {
    const date = new Date(s.ts).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
    const kb   = s.code ? (new Blob([s.code]).size / 1024).toFixed(1) : '?';
    return `
      <div class="saved-item">
        <div class="si-icon"><i class="fa-solid fa-file-code"></i></div>
        <div class="si-info">
          <div class="si-name">${esc(s.name)}</div>
          <div class="si-meta">by ${esc(s.author)} · ${kb} KB · ${date}</div>
        </div>
        <div class="si-actions">
          <button class="si-btn" title="Load" onclick="loadScript(${i})"><i class="fa-solid fa-upload"></i></button>
          <button class="si-btn" title="Regenerate loadstring" onclick="regenScript(${i})"><i class="fa-solid fa-rotate"></i></button>
          <button class="si-btn del" title="Delete" onclick="deleteScript(${i})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
  }).join('');
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

$('hub-clear-all').addEventListener('click', () => {
  if (!confirm('Delete all saved scripts?')) return;
  localStorage.removeItem('lv3_scripts');
  renderSaved();
  toast('All saved scripts cleared.', 'warn');
});

// Init saved list on load
renderSaved();

/* ══════════════════════════════════════════════
   NAVBAR SCROLL
══════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  $('navbar').classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });


/* ══════════════════════════════════════════════
   AI SCRIPT GENERATOR TAB
══════════════════════════════════════════════ */

// ── API Key management ──
const aiApiKeyInput = $('ai-api-key');
const aiSaveKeyBtn  = $('ai-save-key');
const aiKeyStatus   = $('ai-key-status');
const aiKeyToggle   = $('ai-key-toggle-vis');

function loadApiKey() {
  const k = localStorage.getItem('lv3_openai_key') || '';
  if (k) {
    aiApiKeyInput.value = k;
    setKeyStatus('ok', '<i class="fa-solid fa-circle-check"></i> API key saved');
  }
}
function setKeyStatus(type, html) {
  aiKeyStatus.className = 'ai-key-status ' + type;
  aiKeyStatus.innerHTML = html;
}

aiSaveKeyBtn.addEventListener('click', () => {
  const key = aiApiKeyInput.value.trim();
  if (!key) { setKeyStatus('err', '<i class="fa-solid fa-circle-xmark"></i> Enter a key first'); return; }
  if (!key.startsWith('sk-')) { setKeyStatus('warn', '<i class="fa-solid fa-triangle-exclamation"></i> Key should start with sk-'); return; }
  localStorage.setItem('lv3_openai_key', key);
  setKeyStatus('ok', '<i class="fa-solid fa-circle-check"></i> Key saved!');
  toast('API key saved!', 'success');
});

aiKeyToggle.addEventListener('click', () => {
  const show = aiApiKeyInput.type === 'password';
  aiApiKeyInput.type = show ? 'text' : 'password';
  aiKeyToggle.innerHTML = show
    ? '<i class="fa-solid fa-eye-slash"></i> Hide'
    : '<i class="fa-solid fa-eye"></i> Show';
});

loadApiKey();

// ── Quick prompt buttons ──
document.querySelectorAll('.aqp-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $('ai-prompt').value = btn.dataset.prompt;
    $('ai-prompt').focus();
  });
});

$('ai-prompt-clear').addEventListener('click', () => {
  $('ai-prompt').value = '';
  $('ai-prompt').focus();
});

// ── Generate Script ──
const aiGenBtn     = $('ai-generate');
const aiThinking   = $('ai-thinking');
const aiEmpty      = $('ai-empty');
const aiResult     = $('ai-result');
const aiOutput     = $('ai-output');
const lnAiOut      = $('ln-ai-out');
const aiOutputStats= $('ai-output-stats');
const aiModelUsed  = $('ai-model-used');
const aiThinkingMsg= $('ai-thinking-msg');

const AI_THINKING_MSGS = [
  'Thinking about your script...',
  'Writing Lua code...',
  'Adding Roblox APIs...',
  'Optimizing the script...',
  'Almost done...',
];
let thinkingInterval;

function startThinking() {
  aiEmpty.style.display    = 'none';
  aiResult.style.display   = 'none';
  aiThinking.style.display = 'flex';
  aiGenBtn.disabled        = true;
  aiGenBtn.style.opacity   = '0.6';
  let mi = 0;
  thinkingInterval = setInterval(() => {
    mi = (mi + 1) % AI_THINKING_MSGS.length;
    aiThinkingMsg.textContent = AI_THINKING_MSGS[mi];
  }, 1800);
}

function stopThinking() {
  clearInterval(thinkingInterval);
  aiThinking.style.display = 'none';
  aiGenBtn.disabled        = false;
  aiGenBtn.style.opacity   = '1';
}

aiGenBtn.addEventListener('click', async () => {
  const prompt = $('ai-prompt').value.trim();
  if (!prompt) { toast('Describe what you want first!', 'warn'); $('ai-prompt').focus(); return; }

  const apiKey = localStorage.getItem('lv3_openai_key') || '';
  if (!apiKey) {
    toast('Save your OpenAI API key first!', 'error', 4000);
    $('ai-api-key').focus();
    setKeyStatus('err', '<i class="fa-solid fa-circle-xmark"></i> API key required');
    return;
  }

  const model = $('ai-model').value;
  startThinking();

  try {
    const code = await AIGenerator.callOpenAI(prompt, apiKey, model);

    if (!code || code.length < 10) throw new Error('Empty response from API');

    aiOutput.value = code;
    updateLineNumbers(aiOutput, lnAiOut);
    updateStats(aiOutput, aiOutputStats);
    aiModelUsed.textContent = 'via ' + model;
    $('air-title').textContent = 'Script generated!';

    stopThinking();
    aiResult.style.display = 'flex';
    aiResult.style.flexDirection = 'column';

    // Save to history
    saveAiHistory({ prompt: prompt.slice(0, 80), code, model, ts: Date.now() });
    renderAiHistory();
    toast('Script generated!', 'success');

  } catch(e) {
    stopThinking();
    aiEmpty.style.display = 'flex';
    const errMsg = e.message || 'Unknown error';
    if (errMsg.includes('401') || errMsg.includes('invalid')) {
      setKeyStatus('err', '<i class="fa-solid fa-circle-xmark"></i> Invalid API key');
      toast('Invalid API key!', 'error', 4000);
    } else if (errMsg.includes('429')) {
      toast('Rate limit reached. Wait a moment.', 'warn', 4000);
    } else if (errMsg.includes('insufficient_quota')) {
      toast('OpenAI quota exceeded. Check your plan.', 'error', 5000);
    } else {
      toast('Error: ' + errMsg, 'error', 4000);
    }
  }
});

// ── Output actions ──
$('ai-copy-result').addEventListener('click', () => {
  if (!aiOutput.value) return;
  copyText(aiOutput.value, 'Script copied!');
});
$('ai-download-result').addEventListener('click', () => {
  if (!aiOutput.value) return;
  downloadLua(aiOutput.value, 'luavoid_ai_script.lua');
  toast('Downloaded!', 'info');
});
$('ai-send-obf').addEventListener('click', () => {
  if (!aiOutput.value) return;
  inputCode.value = aiOutput.value;
  updateLineNumbers(inputCode, lnInput);
  updateStats(inputCode, inputStats);
  switchTab('obfuscator');
  toast('Sent to Obfuscator!', 'success');
});
$('ai-send-hub').addEventListener('click', () => {
  if (!aiOutput.value) return;
  hubScript.value = aiOutput.value;
  updateLineNumbers(hubScript, lnHub);
  updateStats(hubScript, hubScriptStats);
  switchTab('scripthub');
  toast('Sent to Script Hub!', 'success');
});

// ── History ──
function getAiHistory() {
  try { return JSON.parse(localStorage.getItem('lv3_ai_history') || '[]'); } catch { return []; }
}
function saveAiHistory(entry) {
  const list = getAiHistory();
  list.unshift(entry);
  if (list.length > 30) list.pop();
  localStorage.setItem('lv3_ai_history', JSON.stringify(list));
}
window.loadAiHistory = function(i) {
  const h = getAiHistory()[i];
  if (!h) return;
  aiOutput.value = h.code;
  updateLineNumbers(aiOutput, lnAiOut);
  updateStats(aiOutput, aiOutputStats);
  aiModelUsed.textContent = 'via ' + (h.model || '');
  $('ai-prompt').value = h.prompt;
  aiEmpty.style.display  = 'none';
  aiResult.style.display = 'flex';
  aiResult.style.flexDirection = 'column';
  toast('Loaded from history!', 'info');
};
window.deleteAiHistory = function(i) {
  const list = getAiHistory();
  list.splice(i, 1);
  localStorage.setItem('lv3_ai_history', JSON.stringify(list));
  renderAiHistory();
};

function renderAiHistory() {
  const list  = getAiHistory();
  const el    = $('ai-history-list');
  const count = $('ai-history-count');
  count.textContent = list.length;
  if (!list.length) {
    el.innerHTML = `<div class="hub-saved-empty"><i class="fa-solid fa-inbox"></i><p>No history yet</p></div>`;
    return;
  }
  el.innerHTML = list.map((h, i) => {
    const date = new Date(h.ts).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    const kb   = h.code ? (new Blob([h.code]).size / 1024).toFixed(1) : '?';
    return `
      <div class="saved-item">
        <div class="si-icon" style="background:rgba(168,85,247,.1);border-color:rgba(168,85,247,.2);color:#c084fc">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <div class="si-info">
          <div class="si-name">${esc(h.prompt)}</div>
          <div class="si-meta">${h.model || 'gpt'} · ${kb} KB · ${date}</div>
        </div>
        <div class="si-actions">
          <button class="si-btn" title="Load" onclick="loadAiHistory(${i})"><i class="fa-solid fa-upload"></i></button>
          <button class="si-btn del" title="Delete" onclick="deleteAiHistory(${i})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
  }).join('');
}

$('ai-clear-history').addEventListener('click', () => {
  if (!confirm('Clear all AI history?')) return;
  localStorage.removeItem('lv3_ai_history');
  renderAiHistory();
  toast('History cleared.', 'warn');
});

renderAiHistory();


/* ══════════════════════════════════════════════
   ANTI-CHEAT GENERATOR TAB
══════════════════════════════════════════════ */

// Select all toggle
$('ac-select-all').addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('#panel-anticheat input[type="checkbox"]');
  const allChecked = Array.from(checkboxes).every(c => c.checked);
  checkboxes.forEach(c => { c.checked = !allChecked; });
  $('ac-select-all').textContent = allChecked ? 'Select All' : 'Deselect All';
});

// Generate Anti-Cheat
$('ac-generate').addEventListener('click', () => {
  const cfg = {
    speed:       $('ac-speed').checked,
    fly:         $('ac-fly').checked,
    tp:          $('ac-tp').checked,
    jump:        $('ac-jump').checked,
    gravity:     $('ac-gravity').checked,
    aimbot:      $('ac-aimbot').checked,
    remotes:     $('ac-remotes').checked,
    god:         $('ac-god').checked,
    actionKick:  $('ac-action-kick').checked,
    actionLog:   $('ac-action-log').checked,
    actionWarn:  $('ac-action-warn').checked,
    actionReset: $('ac-action-reset').checked,
    maxSpeed:    parseInt($('ac-max-speed').value)  || 32,
    maxJump:     parseInt($('ac-max-jump').value)   || 75,
    tpThreshold: parseInt($('ac-tp-threshold').value) || 60,
    remoteRate:  parseInt($('ac-remote-rate').value) || 20,
    gameName:    $('ac-game-name').value.trim() || 'My Game',
  };

  const hasAny = cfg.speed || cfg.fly || cfg.tp || cfg.jump ||
                 cfg.gravity || cfg.aimbot || cfg.remotes || cfg.god;
  if (!hasAny) {
    toast('Select at least one detection module!', 'warn');
    return;
  }

  try {
    const code = AntiCheatGenerator.generate(cfg);
    const acOutput = $('ac-output');
    const lnAcOut  = $('ln-ac-out');
    acOutput.value = code;
    updateLineNumbers(acOutput, lnAcOut);
    updateStats(acOutput, $('ac-output-stats'));

    $('ac-output-card').style.display  = 'block';
    $('ac-instructions').style.display = 'block';

    // Scroll to output
    setTimeout(() => $('ac-output-card').scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    toast('Anti-Cheat generated!', 'success');
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  }
});

$('ac-copy').addEventListener('click', () => {
  const v = $('ac-output').value;
  if (!v) return;
  copyText(v, 'Anti-Cheat script copied!');
});

$('ac-download').addEventListener('click', () => {
  const v = $('ac-output').value;
  if (!v) return;
  const name = ($('ac-game-name').value.trim() || 'AntiCheat').replace(/[^a-zA-Z0-9_]/g, '_');
  downloadLua(v, name + '_AntiCheat.lua');
  toast('Downloaded!', 'info');
});

$('ac-obfuscate').addEventListener('click', () => {
  const v = $('ac-output').value;
  if (!v) return;
  inputCode.value = v;
  updateLineNumbers(inputCode, lnInput);
  updateStats(inputCode, inputStats);
  switchTab('obfuscator');
  toast('Sent to Obfuscator!', 'success');
});

// Scroll sync for AC output
const acOutputEl = $('ac-output');
const lnAcOutEl  = $('ln-ac-out');
if (acOutputEl && lnAcOutEl) {
  acOutputEl.addEventListener('scroll', () => { lnAcOutEl.scrollTop = acOutputEl.scrollTop; });
}


/* ══════════════════════════════════════════════
   CREDITS SYSTEM UI
══════════════════════════════════════════════ */
const creditsDisplay = $('credits-display');
const creditsCount   = $('credits-count');

function updateCreditsUI() {
  const c = Credits.get();
  creditsCount.textContent = c;
  creditsDisplay.classList.remove('low','empty');
  if (c <= 0)  creditsDisplay.classList.add('empty');
  else if (c <= 20) creditsDisplay.classList.add('low');
}
updateCreditsUI();

/* ══════════════════════════════════════════════
   PATCH: AI GENERATOR — swap to Groq + credits
══════════════════════════════════════════════ */

// Override the generate button from the original setup
const _origAiGen = aiGenBtn.onclick;
// Remove old listener by replacing the button clone
const newAiGenBtn = aiGenBtn.cloneNode(true);
aiGenBtn.parentNode.replaceChild(newAiGenBtn, aiGenBtn);

// Re-bind quick prompts (they might be attached to the old button)
document.querySelectorAll('.aqp-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $('ai-prompt').value = btn.dataset.prompt;
    $('ai-prompt').focus();
  });
});

newAiGenBtn.addEventListener('click', async () => {
  const prompt = $('ai-prompt').value.trim();
  if (!prompt) { toast('Describe what you want first!', 'warn'); $('ai-prompt').focus(); return; }

  if (!Credits.has()) {
    toast('No credits left! Credits reset daily.', 'error', 5000);
    updateCreditsUI();
    return;
  }

  const apiKey = localStorage.getItem('lv3_groq_key') || localStorage.getItem('lv3_openai_key') || '';
  if (!apiKey) {
    toast('Save your Groq API key first! (console.groq.com/keys — free)', 'error', 5000);
    $('ai-api-key').focus();
    setKeyStatus('err', '<i class="fa-solid fa-circle-xmark"></i> Groq API key required');
    return;
  }

  const model = $('ai-model').value;

  // Spend credit
  Credits.spend();
  updateCreditsUI();

  startThinking();
  try {
    const code = await AIGenerator.generate(prompt, apiKey, model);
    if (!code || code.length < 10) throw new Error('Empty response');

    $('ai-output').value = code;
    updateLineNumbers($('ai-output'), $('ln-ai-out'));
    updateStats($('ai-output'), $('ai-output-stats'));
    $('ai-model-used').textContent = 'via ' + AIGenerator.MODEL;
    $('air-title').textContent = 'Script generated!';

    stopThinking();
    $('ai-result').style.cssText = 'display:flex;flex-direction:column;gap:.75rem';
    $('ai-empty').style.display = 'none';

    saveAiHistory({ prompt: prompt.slice(0,80), code, model, ts: Date.now() });
    renderAiHistory();
    toast(`Script generated! ${Credits.remaining()} credits left.`, 'success');
  } catch(e) {
    stopThinking();
    Credits.MAX; // no refund on error
    $('ai-empty').style.display = 'flex';
    const msg = e.message || '';
    if (msg.includes('401') || msg.includes('invalid_api_key')) {
      setKeyStatus('err', '<i class="fa-solid fa-circle-xmark"></i> Invalid API key');
      toast('Invalid Groq API key!', 'error', 5000);
    } else if (msg.includes('429')) {
      toast('Rate limit hit. Wait a moment.', 'warn', 4000);
    } else {
      toast('Error: ' + msg, 'error', 4000);
    }
  }
});

// Update key save to use Groq key storage
const _origSave = $('ai-save-key');
if (_origSave) {
  const newSave = _origSave.cloneNode(true);
  _origSave.parentNode.replaceChild(newSave, _origSave);
  newSave.addEventListener('click', () => {
    const key = $('ai-api-key').value.trim();
    if (!key) { setKeyStatus('err', '<i class="fa-solid fa-circle-xmark"></i> Enter a key first'); return; }
    if (!key.startsWith('gsk_') && !key.startsWith('sk-')) {
      setKeyStatus('warn', '<i class="fa-solid fa-triangle-exclamation"></i> Groq keys start with gsk_');
    }
    localStorage.setItem('lv3_groq_key', key);
    setKeyStatus('ok', '<i class="fa-solid fa-circle-check"></i> Groq key saved! (' + Credits.remaining() + ' credits)');
    toast('Groq API key saved!', 'success');
    updateCreditsUI();
  });
  // Load existing key
  const k = localStorage.getItem('lv3_groq_key') || '';
  if (k) {
    $('ai-api-key').value = k;
    setKeyStatus('ok', '<i class="fa-solid fa-circle-check"></i> Groq key loaded · ' + Credits.remaining() + ' credits');
  }
}


/* ══════════════════════════════════════════════
   ANTI-CHEAT — Expanded options + bypass modal
══════════════════════════════════════════════ */

// Patch ac-generate to show bypass modal after generation
const _origAcGen = $('ac-generate');
if (_origAcGen) {
  const newAcGen = _origAcGen.cloneNode(true);
  _origAcGen.parentNode.replaceChild(newAcGen, _origAcGen);

  newAcGen.addEventListener('click', () => {
    const cfg = {
      speed:       $('ac-speed')?.checked,
      fly:         $('ac-fly')?.checked,
      tp:          $('ac-tp')?.checked,
      jump:        $('ac-jump')?.checked,
      gravity:     $('ac-gravity')?.checked,
      aimbot:      $('ac-aimbot')?.checked,
      remotes:     $('ac-remotes')?.checked,
      god:         $('ac-god')?.checked,
      noclip:      $('ac-noclip')?.checked  || false,
      scaffold:    false,
      inf_yield:   $('ac-inf-yield')?.checked || false,
      stat_manip:  $('ac-stat-manip')?.checked || false,
      hitbox:      $('ac-hitbox')?.checked   || false,
      actionKick:  $('ac-action-kick')?.checked,
      actionLog:   $('ac-action-log')?.checked,
      actionWarn:  $('ac-action-warn')?.checked,
      actionReset: $('ac-action-reset')?.checked,
      actionBan:   $('ac-action-ban')?.checked  || false,
      maxSpeed:    parseInt($('ac-max-speed')?.value)  || 32,
      maxJump:     parseInt($('ac-max-jump')?.value)   || 75,
      tpThreshold: parseInt($('ac-tp-threshold')?.value) || 60,
      remoteRate:  parseInt($('ac-remote-rate')?.value)  || 20,
      maxHitbox:   parseInt($('ac-max-hitbox')?.value)   || 6,
      gameName:    $('ac-game-name')?.value?.trim() || 'My Game',
      webhookUrl:  $('ac-webhook')?.value?.trim() || '',
    };

    const hasAny = cfg.speed||cfg.fly||cfg.tp||cfg.jump||cfg.gravity||cfg.aimbot||cfg.remotes||cfg.god;
    if (!hasAny) { toast('Select at least one detection!', 'warn'); return; }

    try {
      const code     = AntiCheatGenerator.generate(cfg);
      const acOutput = $('ac-output');
      const lnAcOut  = $('ln-ac-out');
      acOutput.value = code;
      updateLineNumbers(acOutput, lnAcOut);
      updateStats(acOutput, $('ac-output-stats'));
      $('ac-output-card').style.display  = 'block';
      $('ac-instructions').style.display = 'block';
      setTimeout(() => $('ac-output-card').scrollIntoView({ behavior:'smooth', block:'start' }), 100);
      toast('Anti-Cheat generated!', 'success');

      // Show bypass modal after 800ms
      setTimeout(() => openBypassModal(), 800);
    } catch(e) {
      toast('Error: ' + e.message, 'error');
    }
  });
}


/* ══════════════════════════════════════════════
   BYPASS MODAL
══════════════════════════════════════════════ */
const bypassModal = $('bypass-modal');

function openBypassModal() {
  if (bypassModal) bypassModal.classList.add('open');
}
function closeBypassModal() {
  if (bypassModal) bypassModal.classList.remove('open');
}

$('bypass-modal-close')?.addEventListener('click', closeBypassModal);
$('bypass-modal-skip')?.addEventListener('click',  closeBypassModal);
bypassModal?.addEventListener('click', e => { if (e.target === bypassModal) closeBypassModal(); });

$('bypass-modal-gen')?.addEventListener('click', async () => {
  const script = $('bypass-modal-script')?.value?.trim() || '';
  const desc   = $('bypass-modal-desc-input')?.value?.trim() || 'bypass speed, fly, teleport detection';
  closeBypassModal();

  const apiKey = localStorage.getItem('lv3_groq_key') || '';

  if (script && apiKey && Credits.has()) {
    // Use AI to inject bypass into the script
    Credits.spend();
    updateCreditsUI();
    toast('Generating bypass integration...', 'info', 3000);
    try {
      const result = await AIGenerator.injectBypass(script, desc, apiKey);
      switchTab('bypass');
      $('bp-output').value = result;
      updateLineNumbers($('bp-output'), $('ln-bp-out'));
      updateStats($('bp-output'), $('bp-stats'));
      $('bp-empty').style.display  = 'none';
      $('bp-result').style.display = 'flex';
      $('bp-result').style.flexDirection = 'column';
      toast('Bypass integrated with AI!', 'success');
    } catch(e) {
      toast('AI error: ' + e.message + ' — using local generator', 'warn');
      runLocalBypass(script, desc);
    }
  } else {
    // Use local bypass generator
    runLocalBypass(script, desc);
  }
});

function runLocalBypass(targetScript, desc) {
  const code = BypassGenerator.generate({
    metamethodHook: true, spoofHum: true, hookRemotes: true, antiDetect: true,
    speedBypass: true, flyBypass: true, tpBypass: true,
    godBypass: false, silentAim: false, infiniteAmmo: false,
    targetScript, gameName: desc || '',
  });
  switchTab('bypass');
  $('bp-output').value = code;
  updateLineNumbers($('bp-output'), $('ln-bp-out'));
  updateStats($('bp-output'), $('bp-stats'));
  $('bp-empty').style.display  = 'none';
  $('bp-result').style.display = 'flex';
  $('bp-result').style.flexDirection = 'column';
  toast('Bypass generated!', 'success');
}


/* ══════════════════════════════════════════════
   BYPASS GENERATOR TAB
══════════════════════════════════════════════ */
const bpOutput = $('bp-output');
const lnBpOut  = $('ln-bp-out');
const lnBpInj  = $('ln-bp-inject');
const bpInject = $('bp-target-script');

if (bpInject) {
  bpInject.addEventListener('input', () => updateLineNumbers(bpInject, lnBpInj));
  bpInject.addEventListener('scroll', () => { if(lnBpInj) lnBpInj.scrollTop = bpInject.scrollTop; });
}
if (bpOutput) {
  bpOutput.addEventListener('scroll', () => { if(lnBpOut) lnBpOut.scrollTop = bpOutput.scrollTop; });
}

$('bypass-select-all')?.addEventListener('click', () => {
  const checks = document.querySelectorAll('#panel-bypass input[type="checkbox"]');
  const all    = Array.from(checks).every(c => c.checked);
  checks.forEach(c => c.checked = !all);
  $('bypass-select-all').textContent = all ? 'All' : 'None';
});

$('bp-generate')?.addEventListener('click', () => {
  const cfg = {
    metamethodHook: $('bp-metamethod')?.checked,
    spoofHum:       $('bp-spoof-hum')?.checked,
    hookRemotes:    $('bp-hook-remotes')?.checked,
    antiDetect:     $('bp-anti-detect')?.checked,
    speedBypass:    $('bp-speed')?.checked,
    flyBypass:      $('bp-fly')?.checked,
    tpBypass:       $('bp-tp')?.checked,
    godBypass:      $('bp-god')?.checked,
    silentAim:      $('bp-silent-aim')?.checked,
    infiniteAmmo:   $('bp-inf-ammo')?.checked,
    targetScript:   $('bp-target-script')?.value?.trim() || '',
    gameName:       $('bp-game-name')?.value?.trim() || '',
  };

  const hasAny = Object.values(cfg).some(v => v === true);
  if (!hasAny) { toast('Select at least one bypass module!', 'warn'); return; }

  try {
    const code = BypassGenerator.generate(cfg);
    bpOutput.value = code;
    updateLineNumbers(bpOutput, lnBpOut);
    updateStats(bpOutput, $('bp-stats'));
    $('bp-empty').style.display  = 'none';
    $('bp-result').style.cssText = 'display:flex;flex-direction:column;gap:.75rem';
    setTimeout(() => bpOutput.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
    toast('Bypass generated!', 'success');
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  }
});

$('bp-copy')?.addEventListener('click', () => {
  if (!bpOutput?.value) return;
  copyText(bpOutput.value, 'Bypass copied!');
});
$('bp-download')?.addEventListener('click', () => {
  if (!bpOutput?.value) return;
  const name = ($('bp-game-name')?.value?.trim() || 'bypass').replace(/[^a-zA-Z0-9_]/g,'_');
  downloadLua(bpOutput.value, name + '_bypass.lua');
  toast('Downloaded!', 'info');
});
$('bp-obfuscate')?.addEventListener('click', () => {
  if (!bpOutput?.value) return;
  inputCode.value = bpOutput.value;
  updateLineNumbers(inputCode, lnInput);
  updateStats(inputCode, inputStats);
  switchTab('obfuscator');
  toast('Sent to Obfuscator!', 'success');
});
$('bp-send-hub')?.addEventListener('click', () => {
  if (!bpOutput?.value) return;
  hubScript.value = bpOutput.value;
  updateLineNumbers(hubScript, lnHub);
  updateStats(hubScript, hubScriptStats);
  switchTab('scripthub');
  toast('Sent to Hub!', 'success');
});


/* ══════════════════════════════════════════════
   ANTI-CHEAT AI ANALYZER
   Reads the selected game context, asks Groq to
   decide which detections are most relevant, then
   auto-checks/unchecks the toggles.
══════════════════════════════════════════════ */
document.getElementById('ac-ai-analyze')?.addEventListener('click', async function() {
  const gameCtx = window.getGameContext?.();
  const gameName = document.getElementById('ac-game-name')?.value?.trim();

  if (!gameCtx && !gameName) {
    toast('Select a game first using the Game Picker!', 'warn', 4000);
    return;
  }

  const apiKey = localStorage.getItem('lv3_groq_key') || '';
  if (!apiKey) {
    toast('Save your Groq API key in the AI Script tab first!', 'warn', 4000);
    return;
  }

  const btn = this;
  btn.classList.add('loading');
  btn.querySelector('span:first-of-type').textContent = 'Analyzing...';

  const prompt = gameCtx?.aiAntiCheatPrompt ||
    `You are LuaVoid AI. Analyze the Roblox game "${gameName}" and decide which executor-side cheat detections are most relevant.\nOutput ONLY a JSON object:\n{"speed":true,"fly":true,"tp":true,"god":false,"aimbot":true,"noclip":false,"hitbox":false,"remoteSpam":false,"reason":"<one sentence>"}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a Roblox anti-cheat expert. Output only valid JSON, no markdown.' },
          { role: 'user',   content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    let raw = data.choices?.[0]?.message?.content?.trim() || '';

    // Strip markdown fences if present
    raw = raw.replace(/^```(?:json)?\n?/i,'').replace(/\n?```$/i,'').trim();
    const analysis = JSON.parse(raw);

    // Apply to checkboxes
    const MAP = {
      speed:      'ac-speed',
      fly:        'ac-fly',
      tp:         'ac-tp',
      god:        'ac-god',
      aimbot:     'ac-aimbot',
      noclip:     'ac-noclip',
      hitbox:     'ac-hitbox',
      remoteSpam: 'ac-remotes',
      jump:       'ac-jump',
    };

    Object.entries(MAP).forEach(([key, elId]) => {
      const el = document.getElementById(elId);
      if (el && analysis[key] !== undefined) el.checked = !!analysis[key];
    });

    // Show reason
    const resultEl = document.getElementById('ac-ai-result');
    const reasonEl = document.getElementById('ac-ai-reason');
    if (resultEl && reasonEl) {
      reasonEl.textContent = analysis.reason || 'Detections auto-selected based on game genre.';
      resultEl.style.display = 'block';
    }

    toast('AI analyzed the game and updated detections!', 'success');
  } catch(e) {
    toast('AI analyze error: ' + (e.message || 'unknown'), 'error', 4000);
  } finally {
    btn.classList.remove('loading');
    btn.querySelector('span:first-of-type').textContent = 'AI Analyze Game';
  }
});
