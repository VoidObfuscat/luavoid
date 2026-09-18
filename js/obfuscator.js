/**
 * LuaVoid v3.0 — Obfuscator + Deobfuscator Engine
 * obfuscator.js
 * Roblox Executor Compatible (Luau / Lua 5.1)
 */
const LuaVoidEngine = (() => {

  /* ─── Utilities ───────────────────────────────── */
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  const ID_START = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
  const ID_REST  = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789';

  function rndId(min, max) {
    min = min || 8; max = max || 16;
    let s = ID_START[rand(0, ID_START.length - 1)];
    for (let i = 1, n = rand(min, max); i < n; i++)
      s += ID_REST[rand(0, ID_REST.length - 1)];
    return s;
  }

  function makeNames() {
    const reserved = new Set([
      'and','break','do','else','elseif','end','false','for','function',
      'goto','if','in','local','nil','not','or','repeat','return','then',
      'true','until','while',
      // Roblox/Luau globals — never rename
      'game','workspace','script','wait','tick','time','delay','spawn','task',
      'print','warn','error','assert','type','pairs','ipairs','next','select',
      'unpack','rawget','rawset','rawequal','rawlen','tostring','tonumber',
      'setmetatable','getmetatable','pcall','xpcall','coroutine','table',
      'string','math','bit32','utf8','require','loadstring','collectgarbage',
      'Instance','Vector3','Vector2','CFrame','Color3','BrickColor','UDim',
      'UDim2','Enum','Axes','Faces','Region3','Ray','NumberSequence',
      'ColorSequence','NumberRange','PhysicalProperties','Rect',
      'Players','LocalPlayer','Character','Humanoid','HumanoidRootPart',
      'RunService','UserInputService','TweenService','HttpService',
      'ReplicatedStorage','ServerStorage','ServerScriptService',
      'StarterGui','StarterPack','StarterPlayer','Lighting',
      '_G','_ENV','shared',
    ]);
    const map = new Map();
    return {
      get(name) {
        if (map.has(name)) return map.get(name);
        let n; do { n = rndId(); } while (reserved.has(n));
        reserved.add(n); map.set(name, n); return n;
      }
    };
  }

  const KEYWORDS = new Set([
    'and','break','do','else','elseif','end','false','for','function',
    'goto','if','in','local','nil','not','or','repeat','return','then',
    'true','until','while'
  ]);
  const BUILTINS = new Set([
    'print','warn','error','assert','type','pairs','ipairs','next','select',
    'unpack','rawget','rawset','rawequal','rawlen','tostring','tonumber',
    'setmetatable','getmetatable','pcall','xpcall','coroutine','table',
    'string','math','bit32','utf8','require','loadstring','collectgarbage',
    'game','workspace','script','wait','tick','time','delay','spawn','task',
    'Instance','Vector3','Vector2','CFrame','Color3','BrickColor','UDim',
    'UDim2','Enum','Axes','Faces','Region3','Ray','NumberSequence',
    'ColorSequence','NumberRange','PhysicalProperties','Rect',
    'Players','LocalPlayer','Character','Humanoid','HumanoidRootPart',
    'RunService','UserInputService','TweenService','HttpService',
    'ReplicatedStorage','ServerStorage','ServerScriptService',
    'StarterGui','StarterPack','StarterPlayer','Lighting',
    '_G','_ENV','shared',
  ]);

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* ─── OBFUSCATION STEPS ───────────────────────── */

  // 1. Strip comments
  function stripComments(code) {
    code = code.replace(/--\[\[[\s\S]*?\]\]/g, '');
    return code.split('\n').map(line => {
      let inS = false, sc = '', i = 0;
      while (i < line.length) {
        const c = line[i];
        if (!inS && (c === '"' || c === "'")) { inS = true; sc = c; i++; continue; }
        if (inS && c === sc && (i === 0 || line[i-1] !== '\\')) { inS = false; i++; continue; }
        if (!inS && c === '-' && line[i+1] === '-') return line.slice(0, i);
        i++;
      }
      return line;
    }).join('\n');
  }

  // 2. Rename local variables
  function renameVars(code) {
    const names = makeNames();
    const toRename = new Set();
    const patterns = [
      /\blocal\s+(?:function\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /\bfunction\s*(?:[a-zA-Z_][a-zA-Z0-9_.]*\s*)?\(([^)]*)\)/g,
      /\bfor\s+([a-zA-Z_][a-zA-Z0-9_,\s]*)\s+(?:in|=)/g,
    ];
    patterns.forEach((re, idx) => {
      let m;
      while ((m = re.exec(code)) !== null) {
        const part = m[1];
        if (idx === 0) {
          if (!KEYWORDS.has(part) && !BUILTINS.has(part)) toRename.add(part);
        } else {
          part.split(',').map(s => s.trim()).filter(Boolean).forEach(p => {
            if (!KEYWORDS.has(p) && !BUILTINS.has(p)) toRename.add(p);
          });
        }
      }
    });
    toRename.forEach(name => {
      code = code.replace(new RegExp('\\b' + esc(name) + '\\b', 'g'), names.get(name));
    });
    return code;
  }

  // 3. Encrypt strings → string.char(...)
  function encryptStrings(code) {
    function encode(str) {
      const bytes = [];
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '\\' && i + 1 < str.length) {
          i++;
          switch (str[i]) {
            case 'n': bytes.push(10); break;
            case 't': bytes.push(9);  break;
            case 'r': bytes.push(13); break;
            case '\\': bytes.push(92); break;
            case '"': bytes.push(34); break;
            case "'": bytes.push(39); break;
            default:
              if (/\d/.test(str[i])) {
                let n = str[i];
                if (/\d/.test(str[i+1])) n += str[++i];
                if (/\d/.test(str[i+1])) n += str[++i];
                bytes.push(parseInt(n, 10) & 0xFF);
              } else bytes.push(str.charCodeAt(i) & 0xFF);
          }
        } else {
          const cc = str.charCodeAt(i);
          bytes.push(cc > 0 && cc < 256 ? cc : 63);
        }
      }
      return 'string.char(' + bytes.join(',') + ')';
    }
    code = code.replace(/"((?:[^"\\]|\\.)*)"/g, (m, s) => s.length ? encode(s) : m);
    code = code.replace(/'((?:[^'\\]|\\.)*)'/g,  (m, s) => s.length ? encode(s) : m);
    return code;
  }

  // 4. Encode numbers
  function encodeNums(code) {
    return code.replace(/(?<![.\w\d])(\d+)(?![.\w\d])/g, (m, num) => {
      const n = parseInt(num, 10);
      if (isNaN(n) || n <= 1) return m;
      const opts = [`(${n+1}-1)`, `(${n-1}+1)`];
      for (let a = 2; a <= Math.min(Math.sqrt(n), 40); a++) {
        if (n % a === 0) { opts.push(`(${a}*${n/a})`); break; }
      }
      return opts[rand(0, opts.length - 1)];
    });
  }

  // 5. Junk code injection — only Roblox-safe APIs
  const JUNK = [
    () => `local ${rndId()} = math.floor(${rand(10,999)})`,
    () => `local ${rndId()} = math.max(${rand(1,50)},${rand(51,99)})`,
    () => `local ${rndId()} = math.abs(${rand(-100,-1)})`,
    () => `local ${rndId()} = string.len(string.char(${rand(65,90)},${rand(97,122)}))`,
    () => `local ${rndId()} = type(nil)`,
    () => `local ${rndId()} = tostring(${rand(1,9999)})`,
    () => {
      const v = rndId(), v2 = rndId();
      return `local ${v} = {}\nfor ${v2} = 1,${rand(1,2)} do\n  ${v}[${v2}] = ${v2}\nend`;
    },
    () => `if ${rand(1,4)} > ${rand(10,50)} then local ${rndId()} = nil end`,
    () => { const fn = rndId(); return `local function ${fn}()\n  return ${rand(0,999)}\nend`; },
    () => {
      const a = rndId(), b = rndId();
      return `local ${a},${b} = pcall(function() return ${rand(1,100)} end)`;
    },
    () => `local ${rndId()} = math.pi * ${rand(1,10)}`,
    () => `local ${rndId()} = string.rep(string.char(${rand(65,90)}),${rand(1,3)})`,
  ];

  function injectJunk(code, level) {
    level = Math.max(1, Math.min(10, level || 5));
    const lines = code.split('\n'), out = [];
    for (const line of lines) {
      out.push(line);
      if (Math.random() < level / 13) {
        const n = rand(1, Math.max(1, Math.floor(level / 3)));
        for (let i = 0; i < n; i++) out.push(JUNK[rand(0, JUNK.length-1)]());
      }
    }
    return out.join('\n');
  }

  // 6. Control flow flatten
  function flattenFlow(code) {
    const blocks = code.split(/\n\s*\n/).filter(b => b.trim());
    if (blocks.length < 2) return code;
    const sv = rndId(), rv = rndId();
    const order = blocks.map((_,i) => i).sort(() => Math.random()-0.5);
    let out = `local ${sv} = 0\nlocal ${rv} = true\nwhile ${rv} do\n`;
    order.forEach((bi, di) => {
      const last = di === order.length - 1;
      out += `  ${di===0?'if':'elseif'} ${sv} == ${di} then\n`;
      blocks[bi].split('\n').forEach(l => { out += `    ${l}\n`; });
      out += last ? `    ${rv} = false\n` : `    ${sv} = ${di+1}\n`;
    });
    return out + '  end\nend\n';
  }

  // 7. pcall wrap for Roblox safety
  function pcallWrap(code) {
    const ok = rndId(), er = rndId();
    const tag = 'string.char(91,76,117,97,86,111,105,100,93,32)';
    return `local ${ok},${er} = pcall(function()\n`
      + code.split('\n').map(l => '  ' + l).join('\n')
      + `\nend)\nif not ${ok} then\n  warn(${tag}..tostring(${er}))\nend\n`;
  }

  // 8. Minify
  function minify(code) {
    return code.split('\n').map(l => l.trim()).filter(l => l).join(' ');
  }

  // 9. Watermark
  function watermark(code) {
    return `--[[ Obfuscated by LuaVoid v3.0 | ${new Date().toISOString()} ]]\n` + code;
  }

  /* ─── MAIN OBFUSCATE ──────────────────────────── */
  function obfuscate(code, opts = {}) {
    const {
      stripComments: doComments  = true,
      renameVars:    doRename    = true,
      encryptStrings:doStrings   = true,
      encodeNumbers: doNumbers   = false,
      injectJunk:    doJunk      = true,
      junkIntensity: junkLevel   = 5,
      flattenFlow:   doFlatten   = false,
      robloxWrap:    doWrap      = true,
      compress:      doMinify    = false,
      watermark:     doWatermark = false,
    } = opts;
    let r = code;
    if (doComments) r = stripComments(r);
    if (doRename)   r = renameVars(r);
    if (doStrings)  r = encryptStrings(r);
    if (doNumbers)  r = encodeNums(r);
    if (doJunk)     r = injectJunk(r, junkLevel);
    if (doFlatten)  r = flattenFlow(r);
    if (doWrap)     r = pcallWrap(r);
    if (doMinify)   r = minify(r);
    if (doWatermark)r = watermark(r);
    return r;
  }

  /* ═══════════════════════════════════════════════
     DEOBFUSCATOR
  ═══════════════════════════════════════════════ */

  // Decode string.char(...) back to string literals
  function decodeStringChar(code) {
    return code.replace(/string\.char\(([\d,\s]+)\)/g, (_, args) => {
      try {
        const bytes = args.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (!bytes.length) return _;
        const str = bytes.map(b => String.fromCharCode(b)).join('');
        // Re-escape for Lua string
        const escaped = str.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t');
        return `"${escaped}"`;
      } catch { return _; }
    });
  }

  // Simplify basic math expressions like (43-1), (6*7), (0*1)
  function simplifyExprs(code) {
    // (a op b) where op is + - *
    return code.replace(/\((\d+)\s*([+\-*])\s*(\d+)\)/g, (m, a, op, b) => {
      const na = parseInt(a), nb = parseInt(b);
      try {
        let res;
        if (op === '+') res = na + nb;
        else if (op === '-') res = na - nb;
        else if (op === '*') res = na * nb;
        return (res !== undefined && Number.isFinite(res)) ? String(res) : m;
      } catch { return m; }
    });
  }

  // Remove obvious junk: dead if blocks, useless pcall results, pure local math
  function removeJunk(code) {
    const lines = code.split('\n');
    const out   = [];
    let skip = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Dead if: "if <num> > <num> then" ... "end"
      if (/^if\s+\d+\s*>\s*\d+\s+then$/.test(line)) { skip++; continue; }
      if (skip > 0 && /^end$/.test(line)) { skip--; continue; }
      if (skip > 0) continue;
      // Pure junk locals: "local x = math.floor(n)", "local x = type(nil)" etc.
      if (/^local\s+[a-zA-Z_]\w*\s*=\s*(math\.(floor|max|abs|pi)|type\(nil\)|tostring\(\d+\)|string\.len\(|string\.rep\()/.test(line)) continue;
      // Junk multi-assign from pcall with no use
      if (/^local\s+[a-zA-Z_]\w*\s*,\s*[a-zA-Z_]\w*\s*=\s*pcall\(function\(\)\s*return\s*\d+\s*end\)/.test(line)) continue;
      out.push(lines[i]);
    }
    return out.join('\n');
  }

  // Basic reformatter: add newlines after end/do/then, indent
  function reformat(code) {
    // Split by semicolons and then by known tokens
    const keywords = ['end','do','then','else','elseif','until','repeat'];
    let result = '';
    let indent = 0;
    const lines = code.split('\n');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { result += '\n'; continue; }
      // Decrease indent before end/else/elseif/until
      if (/^(end|else|elseif|until)\b/.test(line)) indent = Math.max(0, indent - 1);
      result += '  '.repeat(indent) + line + '\n';
      // Increase indent after do/then/else/repeat/function body open
      if (/\b(do|then|else|repeat|function\b.*\))[\s]*$/.test(line) && !/\bend\b/.test(line)) indent++;
    }
    return result;
  }

  function deobfuscate(code, opts = {}) {
    const {
      decodeStrings: doStrings = true,
      simplifyExprs: doExprs   = true,
      removeJunk:    doJunk    = true,
      reformat:      doFormat  = true,
    } = opts;
    let r = code;
    if (doStrings) r = decodeStringChar(r);
    if (doExprs)   r = simplifyExprs(r);
    if (doJunk)    r = removeJunk(r);
    if (doFormat)  r = reformat(r);
    return r;
  }

  return { obfuscate, deobfuscate };
})();
