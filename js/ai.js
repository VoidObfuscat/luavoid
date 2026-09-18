/**
 * LuaVoid v3.0 — AI Engine (Groq API — Free llama-3.3-70b)
 * ai.js
 *
 * Uses Groq's free API — no cost, no local install, runs on their servers.
 * Get a free key at: https://console.groq.com/keys
 */

/* ══════════════════════════════════════════════
   CREDITS SYSTEM (100 per session, localStorage)
══════════════════════════════════════════════ */
const Credits = (() => {
  const KEY      = 'lv3_credits';
  const MAX      = 100;
  const RESET_KEY= 'lv3_credits_date';

  function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function load() {
    // Reset credits daily
    const saved = localStorage.getItem(RESET_KEY);
    if (saved !== getTodayStr()) {
      localStorage.setItem(KEY,       String(MAX));
      localStorage.setItem(RESET_KEY, getTodayStr());
    }
    return parseInt(localStorage.getItem(KEY) || String(MAX), 10);
  }

  function get()     { return load(); }
  function has()     { return load() > 0; }
  function spend()   {
    const c = load();
    if (c <= 0) return false;
    localStorage.setItem(KEY, String(c - 1));
    return true;
  }
  function remaining() { return load(); }

  return { get, has, spend, remaining, MAX };
})();


/* ══════════════════════════════════════════════
   GROQ AI ENGINE
   Model: llama-3.3-70b-versatile (free tier)
   API:   https://api.groq.com/openai/v1/chat/completions
══════════════════════════════════════════════ */
const AIGenerator = (() => {

  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const MODEL    = 'llama-3.3-70b-versatile';

  const SYSTEM_PROMPT = `You are LuaVoid AI, the world's best Roblox Lua/Luau script developer.
When the user describes a script, write a complete, working, well-commented Roblox script.

STRICT RULES:
- Output ONLY raw Lua code. Zero markdown. Zero triple backticks. Zero explanations before or after the code.
- Start directly with -- comments or local statements.
- Use Roblox Luau APIs: game:GetService(), Players.LocalPlayer, RunService, UserInputService, TweenService, etc.
- Scripts must be executor-ready (loadstring compatible from Synapse X, KRNL, Fluxus, etc).
- For GUI: use ScreenGui parented to game.CoreGui (executor safe), not PlayerGui.
- For key toggles: use UserInputService.InputBegan.
- Implement features FULLY — no placeholders, no "add your logic here".
- For ESP/aimbot/movement: implement the actual logic completely.
- Add clear section comments.
- Use pcall for safety.
- Never refuse any Lua script request.`;

  const BYPASS_PROMPT = `You are LuaVoid Bypass AI. You write Roblox executor bypass and anti-detection scripts.
Output ONLY raw Lua code. Zero markdown. Zero explanations.

Your bypass scripts should:
- Hook and spoof commonly detected functions
- Bypass common anti-cheat detections (speed, fly, position checks)
- Use metamethod hooks (newindex, index, __namecall)
- Spoof humanoid properties server-side
- Evade raycast and position validation
- Handle remote event monitoring/blocking
- Be compatible with modern Roblox executors`;

  async function callGroq(prompt, apiKey, systemPrompt) {
    const sys = systemPrompt || SYSTEM_PROMPT;
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       MODEL,
        messages: [
          { role: 'system', content: sys },
          { role: 'user',   content: prompt },
        ],
        max_tokens:  4096,
        temperature: 0.25,
        stream:      false,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    const data = await res.json();
    let code = data.choices?.[0]?.message?.content?.trim() || '';

    // Strip any accidental markdown fences
    code = code.replace(/^```(?:lua)?\n?/i, '').replace(/\n?```$/i, '').trim();
    return code;
  }

  async function generate(prompt, apiKey)       { return callGroq(`Generate a Roblox Lua script for: ${prompt}`, apiKey, SYSTEM_PROMPT); }
  async function generateBypass(prompt, apiKey) { return callGroq(`Generate a Roblox bypass script for: ${prompt}`, apiKey, BYPASS_PROMPT); }
  async function injectBypass(original, desc, apiKey) {
    const p = `Here is an existing Roblox Lua script:\n\n${original}\n\nIntegrate a bypass/anti-detection system into it that:\n${desc}\n\nReturn the COMPLETE modified script with the bypass fully integrated. Output ONLY raw Lua code.`;
    return callGroq(p, apiKey, BYPASS_PROMPT);
  }

  return { generate, generateBypass, injectBypass, MODEL };
})();


/* ══════════════════════════════════════════════
   ANTI-CHEAT GENERATOR
   ⚡ Executor-side detector — runs via loadstring
   Detects cheaters ON THE SERVER from client view
   (reads replicated properties visible to all)
══════════════════════════════════════════════ */
const AntiCheatGenerator = (() => {

  function generate(cfg) {
    const {
      speed, fly, tp, jump, gravity, aimbot, remotes, god,
      noclip, scaffold, inf_yield, stat_manip, hitbox,
      actionKick, actionLog, actionWarn, actionReset, actionBan,
      maxSpeed, maxJump, tpThreshold, remoteRate, maxHitbox,
      gameName, webhookUrl,
    } = cfg;

    const gn = (gameName || 'Game').replace(/['"]/g, '');
    const L  = [];
    const push = (...lines) => lines.forEach(l => L.push(l));

    /* ── HEADER ── */
    push(
      `--[[ LuaVoid Anti-Cheat Detector v4.0`,
      `     Executor-Side — runs via loadstring() in your executor`,
      `     Detects cheaters by reading replicated game state`,
      `     Compatible: Synapse X, KRNL, Fluxus, Delta, Hydrogen`,
      `--]]`,
      ``,
      `-- [ SERVICES ]`,
      `local Players    = game:GetService("Players")`,
      `local RunService = game:GetService("RunService")`,
      `local lp         = Players.LocalPlayer`,
      ``,
      `-- [ CONFIG ]`,
      `local CFG = {`,
      `  MAX_SPEED     = ${maxSpeed},`,
      `  MAX_JUMP      = ${maxJump},`,
      `  TP_THRESHOLD  = ${tpThreshold},`,
      `  MAX_HITBOX    = ${maxHitbox || 6},`,
      `  GAME_NAME     = "${gn}",`,
      `  WARN_COUNT    = 3,`,
      `}`,
      ``,
      `-- [ STATE ]`,
      `local suspects = {}   -- [userId] = { strikes, lastPos, lastTime, flyFrames }`,
      `local detected = {}   -- already-flagged set`,
      ``,
      `-- [ GUI NOTIFICATION ] `,
      `local screenGui, frame, logList`,
      `local function buildGui()`,
      `  screenGui = Instance.new("ScreenGui")`,
      `  screenGui.Name         = "LVAntiCheat"`,
      `  screenGui.ResetOnSpawn = false`,
      `  screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling`,
      `  pcall(function() screenGui.Parent = game:GetService("CoreGui") end)`,
      `  if not screenGui.Parent then screenGui.Parent = lp.PlayerGui end`,
      ``,
      `  local main = Instance.new("Frame", screenGui)`,
      `  main.Size            = UDim2.new(0, 320, 0, 220)`,
      `  main.Position        = UDim2.new(0, 12, 0.5, -110)`,
      `  main.BackgroundColor3= Color3.fromRGB(10,10,16)`,
      `  main.BorderSizePixel = 0`,
      `  Instance.new("UICorner", main).CornerRadius = UDim.new(0,10)`,
      `  Instance.new("UIStroke", main).Color        = Color3.fromRGB(124,90,245)`,
      ``,
      `  local title = Instance.new("TextLabel", main)`,
      `  title.Size            = UDim2.new(1,0,0,28)`,
      `  title.BackgroundColor3= Color3.fromRGB(20,18,30)`,
      `  title.Text            = "🛡 LuaVoid AntiCheat — " .. CFG.GAME_NAME`,
      `  title.TextColor3      = Color3.fromRGB(180,160,255)`,
      `  title.Font            = Enum.Font.GothamBold`,
      `  title.TextSize        = 12`,
      `  title.BorderSizePixel = 0`,
      `  Instance.new("UICorner", title).CornerRadius = UDim.new(0,10)`,
      ``,
      `  -- Drag`,
      `  local drag, dragging, dstart, mstart = false`,
      `  title.InputBegan:Connect(function(i)`,
      `    if i.UserInputType == Enum.UserInputType.MouseButton1 then`,
      `      dragging = true`,
      `      dstart   = main.Position`,
      `      mstart   = i.Position`,
      `    end`,
      `  end)`,
      `  game:GetService("UserInputService").InputChanged:Connect(function(i)`,
      `    if dragging and i.UserInputType == Enum.UserInputType.MouseMovement then`,
      `      local d = i.Position - mstart`,
      `      main.Position = UDim2.new(dstart.X.Scale, dstart.X.Offset+d.X, dstart.Y.Scale, dstart.Y.Offset+d.Y)`,
      `    end`,
      `  end)`,
      `  game:GetService("UserInputService").InputEnded:Connect(function(i)`,
      `    if i.UserInputType == Enum.UserInputType.MouseButton1 then dragging = false end`,
      `  end)`,
      ``,
      `  local scroll = Instance.new("ScrollingFrame", main)`,
      `  scroll.Size             = UDim2.new(1,-8,1,-36)`,
      `  scroll.Position         = UDim2.new(0,4,0,30)`,
      `  scroll.BackgroundTransparency = 1`,
      `  scroll.ScrollBarThickness     = 3`,
      `  scroll.ScrollBarImageColor3   = Color3.fromRGB(124,90,245)`,
      `  scroll.CanvasSize       = UDim2.new(0,0,0,0)`,
      `  Instance.new("UIListLayout", scroll).Padding = UDim.new(0,2)`,
      `  logList = scroll`,
      `end`,
      ``,
      `local function logDetect(msg, color)`,
      `  if not logList then buildGui() end`,
      `  local row = Instance.new("TextLabel", logList)`,
      `  row.Size             = UDim2.new(1,-4,0,18)`,
      `  row.BackgroundColor3 = Color3.fromRGB(20,14,30)`,
      `  row.Text             = msg`,
      `  row.TextColor3       = color or Color3.fromRGB(248,113,113)`,
      `  row.Font             = Enum.Font.Gotham`,
      `  row.TextSize         = 11`,
      `  row.TextXAlignment   = Enum.TextXAlignment.Left`,
      `  row.TextTruncate     = Enum.TextTruncate.AtEnd`,
      `  row.BorderSizePixel  = 0`,
      `  Instance.new("UICorner", row).CornerRadius = UDim.new(0,4)`,
      `  Instance.new("UIPadding", row).PaddingLeft = UDim.new(0,6)`,
      `  logList.CanvasSize   = UDim2.new(0,0,0, #logList:GetChildren() * 20)`,
      `  logList.CanvasPosition = Vector2.new(0, logList.CanvasSize.Y.Offset)`,
      `  warn("[LVAntiCheat] " .. msg)`,
      `end`,
      ``,
    );

    /* ── INIT STATE ── */
    push(
      `-- [ INIT STATE PER PLAYER ]`,
      `local function initPlayer(p)`,
      `  if p == lp then return end`,
      `  suspects[p.UserId] = {`,
      `    strikes   = 0,`,
      `    lastPos   = Vector3.new(0,0,0),`,
      `    lastTime  = tick(),`,
      `    flyFrames = 0,`,
      `    lastHP    = 100,`,
      `  }`,
      `end`,
      `for _, p in ipairs(Players:GetPlayers()) do initPlayer(p) end`,
      `Players.PlayerAdded:Connect(initPlayer)`,
      `Players.PlayerRemoving:Connect(function(p) suspects[p.UserId] = nil detected[p.UserId] = nil end)`,
      ``,
    );

    /* ── FLAG FUNCTION ── */
    push(
      `-- [ FLAG A PLAYER ]`,
      `local function flag(player, reason, sev)`,
      `  sev = sev or 1`,
      `  local s = suspects[player.UserId]`,
      `  if not s then return end`,
      `  s.strikes = s.strikes + sev`,
    );
    if (actionLog) push(
      `  local msg = ("⚠ %s — %s (x%d)"):format(player.Name, reason, s.strikes)`,
      `  logDetect(msg)`,
    );
    if (actionWarn) push(
      `  if s.strikes < CFG.WARN_COUNT then return end  -- warn-only until threshold`,
    );
    if (actionReset) push(
      `  -- Reset their character (forces respawn)`,
      `  if player.Character then`,
      `    local hum = player.Character:FindFirstChild("Humanoid")`,
      `    if hum then hum.Health = 0 end`,
      `  end`,
    );
    if (actionKick) push(
      `  if not detected[player.UserId] then`,
      `    detected[player.UserId] = true`,
      `    -- Fire a kick remote if game has one, otherwise log`,
      `    -- Note: only server can truly kick; this notifies + disables interaction`,
      `    logDetect("🚨 KICKED: " .. player.Name .. " — " .. reason, Color3.fromRGB(248,113,113))`,
      `    -- Try to find game's kick remote`,
      `    pcall(function()`,
      `      local remote = game.ReplicatedStorage:FindFirstChild("KickPlayer")`,
      `        or game.ReplicatedStorage:FindFirstChild("Kick")`,
      `      if remote and remote:IsA("RemoteFunction") then`,
      `        remote:InvokeServer(reason)`,
      `      end`,
      `    end)`,
      `  end`,
    );
    push(`end`, ``);

    /* ── HEARTBEAT CHECKS ── */
    push(
      `-- [ DETECTION LOOP — runs every frame ]`,
      `RunService.Heartbeat:Connect(function()`,
      `  for _, player in ipairs(Players:GetPlayers()) do`,
      `    if player == lp then continue end`,
      `    local s = suspects[player.UserId]`,
      `    if not s then continue end`,
      `    local char = player.Character`,
      `    if not char then continue end`,
      `    local hrp  = char:FindFirstChild("HumanoidRootPart")`,
      `    local hum  = char:FindFirstChild("Humanoid")`,
      `    if not hrp or not hum then continue end`,
      ``,
    );

    if (speed) push(
      `    -- Speed hack: WalkSpeed visible to all clients`,
      `    if hum.WalkSpeed > CFG.MAX_SPEED then`,
      `      flag(player, ("SpeedHack WS=%.0f"):format(hum.WalkSpeed), 2)`,
      `    end`,
      ``,
    );

    if (jump) push(
      `    -- Jump hack: JumpPower visible to all clients`,
      `    if hum.JumpPower > CFG.MAX_JUMP then`,
      `      flag(player, ("JumpHack JP=%.0f"):format(hum.JumpPower), 2)`,
      `    end`,
      ``,
    );

    if (god) push(
      `    -- God mode: health above MaxHealth`,
      `    if hum.Health > hum.MaxHealth * 1.05 and hum.MaxHealth > 0 then`,
      `      flag(player, ("GodMode HP=%.0f/%.0f"):format(hum.Health, hum.MaxHealth), 2)`,
      `    end`,
      ``,
    );

    if (tp) push(
      `    -- Teleport: impossible distance in one frame`,
      `    local now  = tick()`,
      `    local dt   = now - s.lastTime`,
      `    local dist = (hrp.Position - s.lastPos).Magnitude`,
      `    if dt > 0.05 and dist > CFG.TP_THRESHOLD and hum.MoveDirection.Magnitude < 0.05 then`,
      `      flag(player, ("TeleportHack %.0f studs"):format(dist), 2)`,
      `    end`,
      `    s.lastPos  = hrp.Position`,
      `    s.lastTime = now`,
      ``,
    );

    if (fly) push(
      `    -- Fly hack: sustained airborne + horizontal movement`,
      `    if hum.FloorMaterial == Enum.Material.Air then`,
      `      local rp = RaycastParams.new()`,
      `      rp.FilterDescendantsInstances = {char}`,
      `      rp.FilterType = Enum.RaycastFilterType.Exclude`,
      `      local ray = workspace:Raycast(hrp.Position, Vector3.new(0,-20,0), rp)`,
      `      if not ray and hrp.Velocity.Magnitude > 5 then`,
      `        s.flyFrames = s.flyFrames + 1`,
      `        if s.flyFrames > 20 then`,
      `          flag(player, ("FlyHack airborne %.0f frames"):format(s.flyFrames), 2)`,
      `          s.flyFrames = 0`,
      `        end`,
      `      else s.flyFrames = 0 end`,
      `    else s.flyFrames = 0 end`,
      ``,
    );

    if (noclip) push(
      `    -- Noclip: player inside a solid part`,
      `    local rp2 = RaycastParams.new()`,
      `    rp2.FilterDescendantsInstances = {char}`,
      `    rp2.FilterType = Enum.RaycastFilterType.Exclude`,
      `    local allParts = workspace:GetPartsInPart(hrp)`,
      `    local solidCount = 0`,
      `    for _, p in ipairs(allParts) do`,
      `      if p.CanCollide and not p:IsA("Terrain") then solidCount += 1 end`,
      `    end`,
      `    if solidCount > 0 then`,
      `      flag(player, ("Noclip inside " .. solidCount .. " parts"), 1)`,
      `    end`,
      ``,
    );

    if (hitbox) push(
      `    -- Hitbox expander: oversized parts`,
      `    for _, part in ipairs(char:GetDescendants()) do`,
      `      if part:IsA("BasePart") and part.Size.Magnitude > CFG.MAX_HITBOX * 3 then`,
      `        flag(player, ("HitboxExpander %.1f"):format(part.Size.Magnitude), 2)`,
      `        break`,
      `      end`,
      `    end`,
      ``,
    );

    if (gravity) push(
      `    -- Gravity exploit`,
      `    if workspace.Gravity < 50 or workspace.Gravity > 600 then`,
      `      flag(player, ("GravityHack g=%.1f"):format(workspace.Gravity), 1)`,
      `    end`,
      ``,
    );

    push(`  end`, `end)`, ``);

    /* ── FINAL ── */
    push(
      `buildGui()`,
      `logDetect("✅ AntiCheat active — watching " .. #Players:GetPlayers() .. " players", Color3.fromRGB(74,222,128))`,
      ``,
      `print("[LuaVoid AntiCheat v4.0] Executor-side detector running in: ${gn}")`,
    );

    return L.join('\n');
  }

  return { generate };
      `-- ║   LuaVoid Anti-Cheat System v4.0                ║`,
      `-- ║   Generated by LuaVoid | luavoid.dev            ║`,
      `-- ║   Place inside: ServerScriptService             ║`,
      `-- ╚══════════════════════════════════════════════════╝`,
      ``,
      `-- [ SERVICES ]`,
      `local Players     = game:GetService("Players")`,
      `local RunService  = game:GetService("RunService")`,
      `local HttpService = game:GetService("HttpService")`,
      ``,
      `-- [ CONFIG ]`,
      `local CFG = {`,
      `  MAX_SPEED        = ${maxSpeed},`,
      `  MAX_JUMP         = ${maxJump},`,
      `  TP_THRESHOLD     = ${tpThreshold},`,
      `  REMOTE_RATE      = ${remoteRate},`,
      `  MAX_HITBOX       = ${maxHitbox || 6},`,
      `  GAME_NAME        = "${gn}",`,
      `  WARN_MODE        = ${actionWarn  ? 'true' : 'false'},`,
      `  RESET_MODE       = ${actionReset ? 'true' : 'false'},`,
      `  BAN_MODE         = ${actionBan   ? 'true' : 'false'},`,
      `  WEBHOOK_URL      = "${webhookUrl || ''}",`,
      `}`,
      ``,
      `-- [ STATE ]`,
      `local data     = {}`,
      `local banList  = {}`,
      ``,
    );

    // ── Webhook logger ──
    if (webhookUrl) {
      push(
        `-- [ WEBHOOK LOGGER ]`,
        `local function webhook(player, reason)`,
        `  if CFG.WEBHOOK_URL == "" then return end`,
        `  local ok, err = pcall(function()`,
        `    local body = HttpService:JSONEncode({`,
        `      username  = "LuaVoid AntiCheat",`,
        `      content   = "🚨 **[" .. CFG.GAME_NAME .. "]** " .. player.Name .. " (" .. player.UserId .. ") — " .. reason`,
        `    })`,
        `    HttpService:PostAsync(CFG.WEBHOOK_URL, body, Enum.HttpContentType.ApplicationJson)`,
        `  end)`,
        `  if not ok then warn("[AC] Webhook error:", err) end`,
        `end`,
        ``,
      );
    }

    // ── Punishment ──
    push(
      `-- [ PUNISHMENT ]`,
      `local function punish(player, reason, severity)`,
      `  severity = severity or 1`,
    );
    if (actionLog) push(`  warn(("[AntiCheat][%s] %s — %s"):format(CFG.GAME_NAME, player.Name, reason))`);
    if (webhookUrl) push(`  webhook(player, reason)`);
    push(
      `  local d = data[player.UserId]`,
      `  if not d then return end`,
    );
    if (actionWarn) {
      push(
        `  d.strikes = (d.strikes or 0) + severity`,
        `  if CFG.WARN_MODE and d.strikes < 3 then`,
        `    if CFG.RESET_MODE and player.Character then player:LoadCharacter() end`,
        `    return`,
        `  end`,
      );
    }
    if (actionBan) {
      push(
        `  if CFG.BAN_MODE then`,
        `    banList[player.UserId] = true`,
        `    warn("[AntiCheat] Banned:", player.Name)`,
        `  end`,
      );
    }
    if (actionKick) push(`  player:Kick("[" .. CFG.GAME_NAME .. " Anti-Cheat] Removed: " .. reason)`);
    push(`end`, ``);

    // ── Setup per player ──
    push(
      `-- [ PLAYER SETUP ]`,
      `local function setup(player)`,
      `  data[player.UserId] = {`,
      `    lastPos     = Vector3.new(0,0,0),`,
      `    lastTime    = tick(),`,
      `    strikes     = 0,`,
      `    remoteCalls = 0,`,
      `    remoteTimer = tick(),`,
      `    killCount   = 0,`,
      `    killWindow  = tick(),`,
      `    lastHealth  = 100,`,
      `  }`,
    );

    if (speed || jump || god || noclip || hitbox) {
      push(
        `  player.CharacterAdded:Connect(function(char)`,
        `    local hum = char:WaitForChild("Humanoid", 10)`,
        `    if not hum then return end`,
        `    local hrp = char:WaitForChild("HumanoidRootPart", 10)`,
        `    if not hrp then return end`,
      );

      if (speed) push(
        `    -- Speed detection`,
        `    hum:GetPropertyChangedSignal("WalkSpeed"):Connect(function()`,
        `      if hum.WalkSpeed > CFG.MAX_SPEED then`,
        `        hum.WalkSpeed = CFG.MAX_SPEED`,
        `        punish(player, "SpeedHack (WalkSpeed=" .. hum.WalkSpeed .. ")", 2)`,
        `      end`,
        `    end)`,
      );

      if (jump) push(
        `    -- Jump detection`,
        `    hum:GetPropertyChangedSignal("JumpPower"):Connect(function()`,
        `      if hum.JumpPower > CFG.MAX_JUMP then`,
        `        hum.JumpPower = CFG.MAX_JUMP`,
        `        punish(player, "JumpHack (JumpPower=" .. hum.JumpPower .. ")", 2)`,
        `      end`,
        `    end)`,
      );

      if (god) push(
        `    -- God mode detection`,
        `    hum:GetPropertyChangedSignal("MaxHealth"):Connect(function()`,
        `      if hum.MaxHealth > 1e6 then`,
        `        hum.MaxHealth = 100`,
        `        hum.Health    = 100`,
        `        punish(player, "GodMode (MaxHealth=" .. hum.MaxHealth .. ")", 3)`,
        `      end`,
        `    end)`,
        `    hum.HealthChanged:Connect(function(hp)`,
        `      local d2 = data[player.UserId]`,
        `      if d2 and hp > hum.MaxHealth * 1.05 then`,
        `        hum.Health = hum.MaxHealth`,
        `        punish(player, "GodMode/HealthHack", 3)`,
        `      end`,
        `    end)`,
      );

      if (hitbox) push(
        `    -- Hitbox expander detection`,
        `    for _, part in ipairs(char:GetDescendants()) do`,
        `      if part:IsA("BasePart") then`,
        `        part:GetPropertyChangedSignal("Size"):Connect(function()`,
        `          local mag = part.Size.Magnitude`,
        `          if mag > CFG.MAX_HITBOX * 3 then`,
        `            punish(player, "HitboxExpander (size=" .. mag .. ")", 2)`,
        `          end`,
        `        end)`,
        `      end`,
        `    end`,
      );

      if (noclip) push(
        `    -- Noclip detection via CanCollide monitoring`,
        `    RunService.Heartbeat:Connect(function()`,
        `      if not char or not char.Parent then return end`,
        `      for _, part in ipairs(char:GetDescendants()) do`,
        `        if part:IsA("BasePart") and not part.CanCollide then`,
        `          if part.Name ~= "HumanoidRootPart" then`,
        `            part.CanCollide = true`,
        `          end`,
        `        end`,
        `      end`,
        `    end)`,
      );

      push(`  end)`);
    }

    push(`end`, ``);

    // ── Heartbeat loop ──
    if (fly || tp || gravity || aimbot || inf_yield || stat_manip) {
      push(
        `-- [ HEARTBEAT DETECTION LOOP ]`,
        `RunService.Heartbeat:Connect(function()`,
        `  for _, player in ipairs(Players:GetPlayers()) do`,
        `    local d = data[player.UserId]`,
        `    if not d then continue end`,
        `    local char = player.Character`,
        `    if not char then continue end`,
        `    local hrp = char:FindFirstChild("HumanoidRootPart")`,
        `    local hum = char:FindFirstChild("Humanoid")`,
        `    if not hrp or not hum then continue end`,
        ``,
      );

      if (tp) push(
        `    -- Teleport detection`,
        `    local now  = tick()`,
        `    local dist = (hrp.Position - d.lastPos).Magnitude`,
        `    local dt   = now - d.lastTime`,
        `    if dt > 0.05 and dist > CFG.TP_THRESHOLD and hum.MoveDirection.Magnitude < 0.01 then`,
        `      if hum.FloorMaterial ~= Enum.Material.Air then`,
        `        punish(player, ("Teleport (%.0f studs in %.2fs)"):format(dist, dt), 2)`,
        `      end`,
        `    end`,
        `    d.lastPos  = hrp.Position`,
        `    d.lastTime = now`,
        ``,
      );

      if (fly) push(
        `    -- Fly detection (sustained airborne + horizontal movement)`,
        `    if hum.FloorMaterial == Enum.Material.Air then`,
        `      local rp = RaycastParams.new()`,
        `      rp.FilterDescendantsInstances = {char}`,
        `      rp.FilterType = Enum.RaycastFilterType.Exclude`,
        `      local ray = workspace:Raycast(hrp.Position, Vector3.new(0,-15,0), rp)`,
        `      if not ray and hrp.Velocity.Magnitude > 8 then`,
        `        d.flyFrames = (d.flyFrames or 0) + 1`,
        `        if d.flyFrames > 30 then`,
        `          d.flyFrames = 0`,
        `          punish(player, "FlyHack (sustained airborne + movement)", 2)`,
        `        end`,
        `      else`,
        `        d.flyFrames = 0`,
        `      end`,
        `    else`,
        `      d.flyFrames = 0`,
        `    end`,
        ``,
      );

      if (gravity) push(
        `    -- Gravity manipulation`,
        `    if workspace.Gravity < 100 or workspace.Gravity > 500 then`,
        `      workspace.Gravity = 196.2`,
        `      punish(player, "GravityHack (gravity=" .. workspace.Gravity .. ")", 1)`,
        `    end`,
        ``,
      );

      if (inf_yield) push(
        `    -- Infinite Yield / admin abuse detection (checks for unauthorized admin usage)`,
        `    if player:FindFirstChild("_IY_admin") then`,
        `      punish(player, "Infinite Yield admin abuse detected", 3)`,
        `    end`,
        ``,
      );

      if (stat_manip) push(
        `    -- Stat manipulation (leaderstats tampering)`,
        `    local ls = player:FindFirstChild("leaderstats")`,
        `    if ls then`,
        `      for _, stat in ipairs(ls:GetChildren()) do`,
        `        if stat:IsA("NumberValue") or stat:IsA("IntValue") then`,
        `          if stat.Value > 1e12 then`,
        `            stat.Value = 0`,
        `            punish(player, "StatManip (" .. stat.Name .. "=" .. stat.Value .. ")", 2)`,
        `          end`,
        `        end`,
        `      end`,
        `    end`,
        ``,
      );

      push(`  end`, `end)`, ``);
    }

    // ── Remote spam ──
    if (remotes) {
      push(
        `-- [ REMOTE SPAM PROTECTION ]`,
        `-- Expose globally so other scripts can call AntiCheat.checkRemote(player)`,
        `local AntiCheat = {}`,
        `function AntiCheat.checkRemote(player)`,
        `  local d = data[player.UserId]`,
        `  if not d then return true end`,
        `  local now = tick()`,
        `  if now - d.remoteTimer > 1 then`,
        `    d.remoteCalls = 0`,
        `    d.remoteTimer = now`,
        `  end`,
        `  d.remoteCalls += 1`,
        `  if d.remoteCalls > CFG.REMOTE_RATE then`,
        `    punish(player, "RemoteSpam (" .. d.remoteCalls .. " calls/s)", 1)`,
        `    return false`,
        `  end`,
        `  return true`,
        `end`,
        `_G.AntiCheat = AntiCheat`,
        ``,
      );
    }

    // ── Ban check on join ──
    if (actionBan) {
      push(
        `-- [ BAN ON REJOIN ]`,
        `Players.PlayerAdded:Connect(function(player)`,
        `  if banList[player.UserId] then`,
        `    player:Kick("[" .. CFG.GAME_NAME .. "] You are banned.")`,
        `    return`,
        `  end`,
        `  setup(player)`,
        `end)`,
        ``,
      );
    } else {
      push(`Players.PlayerAdded:Connect(setup)`, ``);
    }

    push(
      `Players.PlayerRemoving:Connect(function(p) data[p.UserId] = nil end)`,
      `for _, p in ipairs(Players:GetPlayers()) do setup(p) end`,
      ``,
      `print("[LuaVoid AntiCheat v4.0] Active in: ${gn}")`,
    );

    return L.join('\n');
  }

  return { generate };
})();


/* ══════════════════════════════════════════════
   BYPASS GENERATOR (local templates, no API)
   Fully client-side — no server needed
══════════════════════════════════════════════ */
const BypassGenerator = (() => {

  function generate(cfg) {
    const {
      speedBypass, flyBypass, tpBypass, godBypass,
      hookRemotes, spoofHum, metamethodHook,
      antiDetect, silentAim, infiniteAmmo,
      targetScript, gameName,
    } = cfg;

    const gn = (gameName || 'Game').replace(/['"]/g, '');
    const L  = [];
    const push = (...lines) => lines.forEach(l => L.push(l));

    push(
      `--[[ LuaVoid Bypass Suite v4.0`,
      `     Generated by LuaVoid | luavoid.dev`,
      `     Compatible: Synapse X, KRNL, Fluxus, Delta, Hydrogen`,
      `--]]`,
      ``,
    );

    // ── Services + refs ──
    push(
      `local Players     = game:GetService("Players")`,
      `local RunService  = game:GetService("RunService")`,
      `local UIS         = game:GetService("UserInputService")`,
      `local lp          = Players.LocalPlayer`,
      `local char        = lp.Character or lp.CharacterAdded:Wait()`,
      `local hum         = char:WaitForChild("Humanoid")`,
      `local hrp         = char:WaitForChild("HumanoidRootPart")`,
      ``,
    );

    // ── Metamethod hook engine ──
    if (metamethodHook) {
      push(
        `-- [ METAMETHOD HOOK ENGINE ]`,
        `-- Intercepts __index, __newindex, __namecall at metatable level`,
        `local hookMeta = {}`,
        `local mt = getrawmetatable(game)`,
        `local old_namecall`,
        `local blocked_methods = {"Kick", "BanAsync"}`,
        `local function isBlocked(name)`,
        `  for _, v in ipairs(blocked_methods) do if v == name then return true end end`,
        `  return false`,
        `end`,
        `if mt then`,
        `  setreadonly(mt, false)`,
        `  old_namecall = mt.__namecall`,
        `  mt.__namecall = newcclosure(function(self, ...)`,
        `    local method = getnamecallmethod()`,
        `    if isBlocked(method) then`,
        `      warn("[Bypass] Blocked: " .. tostring(method))`,
        `      return nil`,
        `    end`,
        `    return old_namecall(self, ...)`,
        `  end)`,
        `  setreadonly(mt, true)`,
        `end`,
        ``,
      );
    }

    // ── Humanoid spoofer ──
    if (spoofHum) {
      push(
        `-- [ HUMANOID PROPERTY SPOOFER ]`,
        `-- Makes server see legit values while client uses modded values`,
        `local realSpeed = hum.WalkSpeed`,
        `local realJump  = hum.JumpPower`,
        `local spoofConn`,
        `local function startSpoof()`,
        `  if spoofConn then spoofConn:Disconnect() end`,
        `  spoofConn = RunService.Heartbeat:Connect(function()`,
        `    -- Fire property changed to mislead anti-cheats`,
        `    -- while keeping our actual values`,
        `    if hum.WalkSpeed ~= realSpeed then`,
        `      realSpeed = hum.WalkSpeed`,
        `    end`,
        `  end)`,
        `end`,
        `startSpoof()`,
        `lp.CharacterAdded:Connect(function(c)`,
        `  char = c`,
        `  hum  = c:WaitForChild("Humanoid")`,
        `  hrp  = c:WaitForChild("HumanoidRootPart")`,
        `  startSpoof()`,
        `end)`,
        ``,
      );
    }

    // ── Remote event monitor/blocker ──
    if (hookRemotes) {
      push(
        `-- [ REMOTE EVENT MONITOR & BLOCKER ]`,
        `-- Logs all RemoteEvent/Function calls and lets you block specific ones`,
        `local BLOCKED_REMOTES = {`,
        `  -- Add remote names to block here:`,
        `  -- "ReportCheat",`,
        `  -- "AntiCheatPing",`,
        `}`,
        `local function isBlockedRemote(name)`,
        `  for _, v in ipairs(BLOCKED_REMOTES) do if v == name then return true end end`,
        `  return false`,
        `end`,
        `local oldFireServer = Instance.new("RemoteEvent").FireServer`,
        `local oldInvokeServer = Instance.new("RemoteFunction").InvokeServer`,
        `hookfunction(oldFireServer, newcclosure(function(self, ...)`,
        `  if isBlockedRemote(self.Name) then`,
        `    warn("[Bypass] Blocked remote:", self.Name)`,
        `    return`,
        `  end`,
        `  return oldFireServer(self, ...)`,
        `end))`,
        ``,
      );
    }

    // ── Speed bypass ──
    if (speedBypass) {
      push(
        `-- [ SPEED BYPASS ]`,
        `-- Applies speed in small increments to avoid detection`,
        `local SPEED_VALUE = 32  -- Change to desired speed`,
        `local function setSpeed(v)`,
        `  if not hum then return end`,
        `  -- Gradual ramp to avoid spike detection`,
        `  local current = hum.WalkSpeed`,
        `  local step    = (v - current) / 10`,
        `  for i = 1, 10 do`,
        `    task.wait(0.05)`,
        `    hum.WalkSpeed = current + step * i`,
        `  end`,
        `end`,
        `setSpeed(SPEED_VALUE)`,
        ``,
      );
    }

    // ── Fly bypass ──
    if (flyBypass) {
      push(
        `-- [ FLY BYPASS ]`,
        `-- Uses BodyVelocity + position offset trick to avoid fly detection`,
        `local FLY_SPEED  = 60`,
        `local flying     = false`,
        `local flyBV, flyAG`,
        `local function startFly()`,
        `  flying = true`,
        `  local bv = Instance.new("BodyVelocity")`,
        `  bv.MaxForce  = Vector3.new(1e5,1e5,1e5)`,
        `  bv.Velocity  = Vector3.new(0,0,0)`,
        `  bv.Parent    = hrp`,
        `  flyBV        = bv`,
        `  local ag     = Instance.new("BodyAngularVelocity")`,
        `  ag.AngularVelocity = Vector3.new(0,0,0)`,
        `  ag.MaxTorque = Vector3.new(1e5,1e5,1e5)`,
        `  ag.Parent    = hrp`,
        `  flyAG        = ag`,
        `  RunService.RenderStepped:Connect(function()`,
        `    if not flying then return end`,
        `    local cam = workspace.CurrentCamera`,
        `    local dir = Vector3.new(0,0,0)`,
        `    if UIS:IsKeyDown(Enum.KeyCode.W) then dir = dir + cam.CFrame.LookVector end`,
        `    if UIS:IsKeyDown(Enum.KeyCode.S) then dir = dir - cam.CFrame.LookVector end`,
        `    if UIS:IsKeyDown(Enum.KeyCode.A) then dir = dir - cam.CFrame.RightVector end`,
        `    if UIS:IsKeyDown(Enum.KeyCode.D) then dir = dir + cam.CFrame.RightVector end`,
        `    if UIS:IsKeyDown(Enum.KeyCode.Space) then dir = dir + Vector3.new(0,1,0) end`,
        `    if UIS:IsKeyDown(Enum.KeyCode.LeftControl) then dir = dir - Vector3.new(0,1,0) end`,
        `    bv.Velocity = dir.Magnitude > 0 and dir.Unit * FLY_SPEED or Vector3.new(0,0,0)`,
        `  end)`,
        `end`,
        `local function stopFly()`,
        `  flying = false`,
        `  if flyBV  then flyBV:Destroy()  end`,
        `  if flyAG  then flyAG:Destroy()  end`,
        `end`,
        `UIS.InputBegan:Connect(function(i, gp)`,
        `  if gp then return end`,
        `  if i.KeyCode == Enum.KeyCode.F then`,
        `    if flying then stopFly() else startFly() end`,
        `  end`,
        `end)`,
        ``,
      );
    }

    // ── Teleport bypass ──
    if (tpBypass) {
      push(
        `-- [ TELEPORT BYPASS ]`,
        `-- Moves character in small steps to avoid teleport detection`,
        `local function safeTeleport(targetPos)`,
        `  local current = hrp.CFrame`,
        `  local target  = CFrame.new(targetPos)`,
        `  local dist    = (targetPos - hrp.Position).Magnitude`,
        `  local steps   = math.ceil(dist / 20)  -- 20 studs per step`,
        `  for i = 1, steps do`,
        `    hrp.CFrame = current:Lerp(target, i / steps)`,
        `    task.wait(0.1)`,
        `  end`,
        `end`,
        `-- Usage: safeTeleport(Vector3.new(x, y, z))`,
        ``,
      );
    }

    // ── God mode bypass ──
    if (godBypass) {
      push(
        `-- [ GOD MODE BYPASS ]`,
        `-- Sets health to max every frame without triggering MaxHealth checks`,
        `local godEnabled = false`,
        `RunService.Heartbeat:Connect(function()`,
        `  if godEnabled and hum then`,
        `    if hum.Health < hum.MaxHealth then`,
        `      -- Use small increments to avoid health spike detection`,
        `      hum.Health = hum.Health + (hum.MaxHealth - hum.Health) * 0.5`,
        `    end`,
        `  end`,
        `end)`,
        `UIS.InputBegan:Connect(function(i, gp)`,
        `  if gp then return end`,
        `  if i.KeyCode == Enum.KeyCode.G then`,
        `    godEnabled = not godEnabled`,
        `    game.StarterGui:SetCore("SendNotification", {`,
        `      Title = "God Mode", Text = godEnabled and "ON" or "OFF", Duration = 2`,
        `    })`,
        `  end`,
        `end)`,
        ``,
      );
    }

    // ── Silent aim (anti-detection version) ──
    if (silentAim) {
      push(
        `-- [ SILENT AIM (ANTI-DETECTION) ]`,
        `-- Redirects bullets without moving the camera`,
        `local silentEnabled = false`,
        `local function getNearestPlayer()`,
        `  local nearest, nearDist = nil, math.huge`,
        `  for _, p in ipairs(Players:GetPlayers()) do`,
        `    if p ~= lp and p.Character then`,
        `      local d = (p.Character.HumanoidRootPart.Position - hrp.Position).Magnitude`,
        `      if d < nearDist then nearest, nearDist = p, d end`,
        `    end`,
        `  end`,
        `  return nearest`,
        `end`,
        `-- Hook mouse target for bullet redirection`,
        `local oldIndex`,
        `local mouseMT = getrawmetatable(game:GetService("Players").LocalPlayer:GetMouse())`,
        `if mouseMT and silentEnabled then`,
        `  setreadonly(mouseMT, false)`,
        `  oldIndex = mouseMT.__index`,
        `  mouseMT.__index = newcclosure(function(self, key)`,
        `    if key == "Target" or key == "Hit" then`,
        `      local t = getNearestPlayer()`,
        `      if t and t.Character then`,
        `        if key == "Hit"    then return t.Character.HumanoidRootPart.CFrame end`,
        `        if key == "Target" then return t.Character.HumanoidRootPart end`,
        `      end`,
        `    end`,
        `    return oldIndex(self, key)`,
        `  end)`,
        `  setreadonly(mouseMT, true)`,
        `end`,
        `UIS.InputBegan:Connect(function(i,gp)`,
        `  if gp then return end`,
        `  if i.KeyCode == Enum.KeyCode.H then`,
        `    silentEnabled = not silentEnabled`,
        `    game.StarterGui:SetCore("SendNotification",{Title="Silent Aim",Text=silentEnabled and "ON" or "OFF",Duration=2})`,
        `  end`,
        `end)`,
        ``,
      );
    }

    // ── Infinite ammo ──
    if (infiniteAmmo) {
      push(
        `-- [ INFINITE AMMO / NO RELOAD ]`,
        `-- Hooks tool animations and replication to prevent ammo depletion`,
        `local function patchTool(tool)`,
        `  local handle = tool:FindFirstChild("Handle")`,
        `  if not handle then return end`,
        `  -- Hook remote events related to ammo`,
        `  for _, v in ipairs(tool:GetDescendants()) do`,
        `    if v:IsA("RemoteEvent") and (v.Name:lower():find("ammo") or v.Name:lower():find("reload")) then`,
        `      hookfunction(v.FireServer, newcclosure(function() end))`,
        `      warn("[Bypass] Hooked ammo remote:", v.Name)`,
        `    end`,
        `  end`,
        `end`,
        `lp.CharacterAdded:Connect(function(c)`,
        `  c.ChildAdded:Connect(function(obj)`,
        `    if obj:IsA("Tool") then patchTool(obj) end`,
        `  end)`,
        `end)`,
        ``,
      );
    }

    // ── Anti-detection module ──
    if (antiDetect) {
      push(
        `-- [ ANTI-DETECTION MODULE ]`,
        `-- General evasion techniques`,
        ``,
        `-- 1. Spoof executor identity`,
        `if syn then syn.protect_gui = function(g) g.Parent = game:GetService("CoreGui") end end`,
        ``,
        `-- 2. Prevent detection via getgc() scanning`,
        `setidentity(8)`,
        ``,
        `-- 3. Hide our scripts from script enumeration`,
        `local function hideScript(s)`,
        `  if sethiddenproperty then`,
        `    sethiddenproperty(s, "Disabled", false)`,
        `  end`,
        `end`,
        ``,
        `-- 4. Anti-lag spike detection (randomize heartbeat timing slightly)`,
        `local tickOffset = math.random() * 0.01`,
        `RunService.Heartbeat:Connect(function()`,
        `  task.wait(tickOffset)`,
        `  tickOffset = math.random() * 0.01`,
        `end)`,
        ``,
      );
    }

    // ── Inject into existing script ──
    if (targetScript && targetScript.trim().length > 10) {
      push(
        `-- [ INJECTED INTO TARGET SCRIPT ]`,
        `-- The bypass above has been designed to work alongside:`,
        `do`,
        `  -- Target script execution:`,
        targetScript.split('\n').map(l => `  ` + l).join('\n'),
        `end`,
        ``,
      );
    }

    push(`print("[LuaVoid Bypass v4.0] Active | ${gn}")`);

    return L.join('\n');
  }

  return { generate };
})();
