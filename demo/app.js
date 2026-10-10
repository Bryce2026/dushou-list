const STORAGE_ITEMS = "dushou.items.v1";
const STORAGE_SETTINGS = "dushou.settings.v1";
const STORAGE_ONBOARD = "dushou.onboarded.v1";
const DAY_MS = 86400000;

const QUESTIONS = [
  {
    title: "不买会出事吗？",
    options: ["会", "能绕过去", "只是不爽", "没区别"],
    values: [20, 12, 5, 0],
  },
  {
    title: "手头有替代吗？",
    options: ["没有", "不太顺手", "高度重叠", "只是想换新"],
    values: [20, 12, 5, 0],
  },
  {
    title: "三个月每周用几次？",
    options: ["≥3", "1–2", "偶尔", "会吃灰"],
    values: [20, 13, 6, 0],
  },
  {
    title: "说得出场景吗？",
    options: ["能", "大概", "就是想买", "说不上"],
    values: [15, 9, 4, 0],
  },
  {
    title: "涨价 30% 还买吗？",
    options: ["还买", "会犹豫", "降价才心动", "只为促销"],
    values: [15, 10, 5, 0],
  },
];

function evaluate(answers) {
  let score = 0;
  answers.forEach((a, i) => {
    const v = QUESTIONS[i]?.values;
    if (v && a >= 0) score += v[a];
  });
  let coolDays;
  if (score >= 86) coolDays = 3;
  else if (score >= 66) coolDays = 7;
  else if (score >= 46) coolDays = 14;
  else if (score >= 26) coolDays = 21;
  else coolDays = 30;
  return { score, coolDays };
}

const FILTERS = [
  { key: null, label: "全部" },
  { key: "cooling", label: "冷却" },
  { key: "ready", label: "可剁" },
  { key: "bought", label: "已剁" },
  { key: "dropped", label: "反剁" },
];

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const state = {
  items: loadJSON(STORAGE_ITEMS, []),
  settings: loadJSON(STORAGE_SETTINGS, { hourlyWage: 80 }),
  filter: null,
  wizard: null,
  detailId: null,
};

function persist() {
  saveJSON(STORAGE_ITEMS, state.items);
  saveJSON(STORAGE_SETTINGS, state.settings);
}

function refreshStatuses() {
  let changed = false;
  const now = Date.now();
  state.items.forEach((item) => {
    if (item.status === "cooling") {
      const until = new Date(item.addedAt).getTime() + item.coolDays * DAY_MS;
      if (now >= until) {
        item.status = "ready";
        changed = true;
      }
    }
  });
  if (changed) persist();
}

function itemMeta(item) {
  const added = new Date(item.addedAt).getTime();
  const until = added + item.coolDays * DAY_MS;
  const now = Date.now();
  const daysLeft = Math.max(0, Math.ceil((until - now) / DAY_MS));
  const isCooled = now >= until;
  const canChop = item.status === "ready" || (item.status === "cooling" && isCooled);
  return { daysLeft, isCooled, canChop };
}

function formatPrice(p) {
  if (!p || p <= 0) return "—";
  return `¥${Math.round(p).toLocaleString("zh-CN")}`;
}

function hoursOf(price) {
  const w = Number(state.settings.hourlyWage) || 0;
  if (!w || !price || price <= 0) return null;
  const h = price / w;
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 10) return `${h.toFixed(1)}h`;
  return `${Math.round(h)}h`;
}

function badge(item) {
  const m = itemMeta(item);
  if (item.status === "cooling") return String(m.daysLeft);
  if (item.status === "ready") return "GO";
  if (item.status === "bought") return "OK";
  return "NO";
}

function uid() {
  return crypto.randomUUID();
}

function maybeSeed() {
  if (state.items.length) return;
  const now = Date.now();
  state.items = [
    {
      id: uid(),
      name: "索尼 WH-1000XM5",
      price: 2299,
      note: "",
      addedAt: new Date(now - 2 * DAY_MS).toISOString(),
      coolDays: 7,
      score: 58,
      status: "cooling",
    },
    {
      id: uid(),
      name: "Keychron Q1",
      price: 899,
      note: "",
      addedAt: new Date(now - 10 * DAY_MS).toISOString(),
      coolDays: 7,
      score: 72,
      status: "ready",
    },
    {
      id: uid(),
      name: "露营桌",
      price: 468,
      note: "",
      addedAt: new Date(now - 40 * DAY_MS).toISOString(),
      coolDays: 21,
      score: 31,
      status: "dropped",
    },
  ];
  persist();
}

const $ = (sel) => document.querySelector(sel);

function renderFilters() {
  const counts = { all: state.items.length, cooling: 0, ready: 0, bought: 0, dropped: 0 };
  state.items.forEach((i) => {
    counts[i.status] += 1;
  });
  $("#filters").innerHTML = FILTERS.map((f) => {
    const n = f.key == null ? counts.all : counts[f.key];
    const key = f.key ?? "all";
    const active = state.filter === f.key ? "active" : "";
    return `<button type="button" class="tile ${active}" data-filter="${key}">
      <span class="n">${n}</span>
      <span class="l">${f.label}</span>
    </button>`;
  }).join("");
  $("#filters").querySelectorAll(".tile").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter === "all" ? null : btn.dataset.filter;
      render();
    });
  });
}

/** 列表排序：先状态，再组内规则 */
const STATUS_ORDER = { ready: 0, cooling: 1, bought: 2, dropped: 3 };

function sortItems(list) {
  return [...list].sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 9;
    const sb = STATUS_ORDER[b.status] ?? 9;
    if (sa !== sb) return sa - sb;

    // 同状态
    if (a.status === "cooling") {
      // 剩得少的靠前（快到期先看）
      const da = itemMeta(a).daysLeft;
      const db = itemMeta(b).daysLeft;
      if (da !== db) return da - db;
    }
    // 可剁 / 已剁 / 反剁：新建的靠前
    return new Date(b.addedAt) - new Date(a.addedAt);
  });
}

function renderList() {
  const area = $("#listArea");
  let items = state.items;
  if (state.filter) items = items.filter((i) => i.status === state.filter);
  items = sortItems(items);

  if (!items.length) {
    area.innerHTML = `<div class="empty">${state.items.length ? "—" : "空"}</div>`;
    return;
  }

  area.innerHTML = items
    .map(
      (item) => `<button type="button" class="card ${item.status}" data-id="${item.id}">
        <h3 class="name">${escapeHtml(item.name)}</h3>
        <div class="price">${formatPrice(item.price)}</div>
        <div class="badge">${badge(item)}</div>
      </button>`
    )
    .join("");

  area.querySelectorAll(".card").forEach((row) => {
    row.addEventListener("click", () => openDetail(row.dataset.id));
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render() {
  refreshStatuses();
  renderFilters();
  renderList();
}

function statsSummary() {
  let dropped = 0;
  let cooling = 0;
  let saved = 0;
  state.items.forEach((i) => {
    if (i.status === "dropped") {
      dropped += 1;
      if (i.price > 0) saved += i.price;
    }
    if (i.status === "cooling") cooling += 1;
  });
  return { dropped, cooling, saved };
}

const COOL_TABLE = [
  { score: "86–100", days: 3, tone: "t3" },
  { score: "66–85", days: 7, tone: "t7" },
  { score: "46–65", days: 14, tone: "t14" },
  { score: "26–45", days: 21, tone: "t21" },
  { score: "0–25", days: 30, tone: "t30" },
];

function paintSettings() {
  const s = statsSummary();
  const wage = state.settings.hourlyWage || 80;
  $("#settingsBody").innerHTML = `
    <div class="settings-head">
      <h2 class="settings-title">设置</h2>
      <button type="button" class="help-btn" id="btnHelp" aria-label="冷却怎么算">?</button>
    </div>

    <section class="settings-sec">
      <div class="settings-label">概况</div>
      <div class="settings-stats">
        <div class="settings-stat dropped"><b>${s.dropped}</b><span>反剁</span></div>
        <div class="settings-stat saved"><b>${s.saved ? `¥${Math.round(s.saved).toLocaleString("zh-CN")}` : "—"}</b><span>省下</span></div>
        <div class="settings-stat cooling"><b>${s.cooling}</b><span>冷却中</span></div>
      </div>
    </section>

    <section class="settings-sec">
      <div class="settings-label">我的</div>
      <div class="settings-row">
        <div class="k">时薪</div>
        <input id="hourlyWage" type="number" min="1" step="1" value="${wage}" />
      </div>
    </section>
  `;
  $("#settingsFoot").innerHTML = `<button type="button" class="btn primary" id="settingsSave">好</button>`;
  $("#settingsSave").addEventListener("click", saveSettings);
  $("#btnHelp").addEventListener("click", paintHelp);
  $("#hourlyWage").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveSettings();
    }
  });
}

function paintHelp() {
  $("#settingsBody").innerHTML = `
    <h2 class="settings-title">冷却怎么算</h2>
    <p class="help-lead">答题得分越高，等得越短。</p>
    <div class="cool-rows">
      ${COOL_TABLE.map(
        (r) => `<div class="cool-row ${r.tone}">
          <span class="cool-score">${r.score}</span>
          <span class="cool-days">${r.days}<small>天</small></span>
        </div>`
      ).join("")}
    </div>
  `;
  $("#settingsFoot").innerHTML = `<button type="button" class="btn" id="btnHelpBack">返回</button>`;
  $("#btnHelpBack").addEventListener("click", paintSettings);
}

function openSettings() {
  paintSettings();
  $("#settings").showModal();
  $("#hourlyWage")?.focus();
}

function saveSettings() {
  const input = $("#hourlyWage");
  const v = Number(input?.value);
  state.settings.hourlyWage = Number.isFinite(v) && v > 0 ? v : 80;
  persist();
  $("#settings").close();
  render();
}

function setTone(el, tone) {
  el.dataset.tone = tone;
}

function openWizard() {
  state.wizard = {
    step: "info",
    qi: 0,
    name: "",
    price: "",
    note: "",
    answers: QUESTIONS.map(() => -1),
    result: null,
  };
  paintWizard();
  $("#wizard").showModal();
}

function paintWizard() {
  const w = state.wizard;
  const dlg = $("#wizard");
  const body = $("#wizardBody");
  const foot = $("#wizardFoot");

  if (w.step === "info") {
    setTone(dlg, "info");
    body.innerHTML = `
      <div class="field"><input id="wName" placeholder="名称" value="${escapeHtml(w.name)}" /></div>
      <div class="field"><input id="wPrice" type="number" min="0" placeholder="价格" value="${escapeHtml(w.price)}" /></div>
      <div class="field"><input id="wNote" placeholder="备注" value="${escapeHtml(w.note)}" /></div>`;
    foot.innerHTML = `<button type="button" class="btn primary" id="wNext">开始</button>`;
    $("#wNext").addEventListener("click", () => {
      const name = $("#wName").value.trim();
      if (!name) {
        $("#wName").focus();
        return;
      }
      w.name = name;
      w.price = $("#wPrice").value;
      w.note = $("#wNote").value.trim();
      w.step = "quiz";
      w.qi = 0;
      paintWizard();
    });
  } else if (w.step === "quiz") {
    setTone(dlg, "quiz");
    const q = QUESTIONS[w.qi];
    body.innerHTML = `
      <div class="q-index">${w.qi + 1} / ${QUESTIONS.length}</div>
      <h2 class="q-title">${q.title}</h2>
      <div class="opts">
        ${q.options
          .map(
            (o, oi) =>
              `<button type="button" class="opt ${w.answers[w.qi] === oi ? "picked" : ""}" data-oi="${oi}">${o}</button>`
          )
          .join("")}
      </div>`;
    body.querySelectorAll(".opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        w.answers[w.qi] = Number(btn.dataset.oi);
        if (w.qi < QUESTIONS.length - 1) {
          w.qi += 1;
        } else {
          w.result = evaluate(w.answers);
          w.step = "done";
        }
        paintWizard();
      });
    });
    foot.innerHTML = w.qi > 0 ? `<button type="button" class="btn" id="wBack">上一题</button>` : "";
    $("#wBack")?.addEventListener("click", () => {
      w.qi -= 1;
      paintWizard();
    });
  } else {
    setTone(dlg, "done");
    const r = w.result;
    body.innerHTML = `
      <div class="result-num">${r.score}</div>
      <div class="result-days">${r.coolDays} 天</div>`;
    foot.innerHTML = `<button type="button" class="btn primary" id="wCommit">关进冷却</button>`;
    $("#wCommit").addEventListener("click", commitWizard);
  }
}

function commitWizard() {
  const w = state.wizard;
  const price = Number(w.price);
  state.items.unshift({
    id: uid(),
    name: w.name,
    price: Number.isFinite(price) && price > 0 ? price : 0,
    note: w.note || "",
    addedAt: new Date().toISOString(),
    coolDays: w.result.coolDays,
    score: w.result.score,
    status: "cooling",
  });
  persist();
  $("#wizard").close();
  state.filter = "cooling";
  render();
}

function openDetail(id) {
  state.detailId = id;
  paintDetail();
  $("#detail").showModal();
}

function paintDetail() {
  const item = state.items.find((i) => i.id === state.detailId);
  const body = $("#detailBody");
  const foot = $("#detailFoot");
  const dlg = $("#detail");
  if (!item) {
    body.innerHTML = "";
    foot.innerHTML = "";
    return;
  }
  setTone(dlg, item.status);
  const m = itemMeta(item);
  const hours = hoursOf(item.price);
  body.innerHTML = `
    <h2 class="detail-name">${escapeHtml(item.name)}</h2>
    <div class="blocks">
      <div class="block"><b>${formatPrice(item.price)}</b><span>${hours ?? "—"}</span></div>
      <div class="block"><b>${item.score}</b><span>分</span></div>
      <div class="block"><b>${item.status === "cooling" ? m.daysLeft : item.coolDays}</b><span>${item.status === "cooling" ? "天剩" : "天"}</span></div>
    </div>
    ${item.note ? `<p class="note">${escapeHtml(item.note)}</p>` : ""}
  `;

  // 一排按钮；「剁了」首位，「删除」最右
  // 冷却中 → 反剁 | 删除
  // 可剁   → 剁了 · 反剁 · 再冷静 | 删除
  // 已剁   → 删除
  // 反剁   → 再冷静 | 删除
  const buttons = [];
  if (item.status === "cooling") {
    buttons.push(`<button type="button" class="btn" data-act="drop">反剁</button>`);
  } else if (item.status === "ready") {
    buttons.push(`<button type="button" class="btn buy" data-act="buy">剁了</button>`);
    buttons.push(`<button type="button" class="btn" data-act="drop">反剁</button>`);
    buttons.push(`<button type="button" class="btn" data-act="refreeze">再冷静</button>`);
  } else if (item.status === "dropped") {
    buttons.push(`<button type="button" class="btn" data-act="refreeze">再冷静</button>`);
  }
  buttons.push(`<button type="button" class="btn" data-act="delete">删除</button>`);
  foot.innerHTML = `<div class="detail-actions">${buttons.join("")}</div>`;

  foot.querySelectorAll("[data-act]").forEach((btn) => {
    btn.addEventListener("click", () => askConfirm(btn.dataset.act, item.id));
  });
}

const CONFIRM_COPY = {
  buy: { text: "确定剁了？", ok: "剁了" },
  delete: { text: "确定删除？", ok: "删除" },
  refreeze: { text: "重新冷静一轮？", ok: "再冷静" },
};

function askConfirm(act, itemId) {
  // 反剁误触成本低，直接执行；其余三次确认
  if (act === "drop") {
    applyAction(act, itemId);
    return;
  }
  const copy = CONFIRM_COPY[act];
  if (!copy) return;

  $("#confirmText").textContent = copy.text;
  $("#confirmOk").textContent = copy.ok;
  const dlg = $("#confirm");

  const onOk = () => {
    cleanup();
    applyAction(act, itemId);
  };
  const onCancel = () => {
    cleanup();
    dlg.close();
  };
  const cleanup = () => {
    $("#confirmOk").removeEventListener("click", onOk);
    $("#confirmCancel").removeEventListener("click", onCancel);
  };

  $("#confirmOk").addEventListener("click", onOk);
  $("#confirmCancel").addEventListener("click", onCancel);
  dlg.showModal();
}

function applyAction(act, itemId) {
  const idx = state.items.findIndex((i) => i.id === itemId);
  if (idx < 0) return;
  if (act === "buy") state.items[idx].status = "bought";
  if (act === "drop") state.items[idx].status = "dropped";
  if (act === "refreeze") {
    state.items[idx].addedAt = new Date().toISOString();
    state.items[idx].status = "cooling";
  }
  if (act === "delete") state.items.splice(idx, 1);
  persist();
  $("#confirm").close();
  $("#detail").close();
  render();
}

function paintOnboard() {
  $("#onboardBody").innerHTML = `
    <h2 class="settings-title">剁手清单</h2>
    <p class="onboard-lead">想买先别付钱，关进来冷静几天。</p>
    <div class="onboard-cards">
      <div class="onboard-card c1">
        <b>加一条</b>
        <span>点右上角 +，记下想买的东西</span>
      </div>
      <div class="onboard-card c2">
        <b>答 5 题</b>
        <span>算出真实度，分数越低冻越久</span>
      </div>
      <div class="onboard-card c3">
        <b>熬过冷却</b>
        <span>到期变绿色，再决定剁不剁</span>
      </div>
      <div class="onboard-card c4">
        <b>反剁也行</b>
        <span>不想买就放弃，省下的看得见</span>
      </div>
    </div>
  `;
  $("#onboardFoot").innerHTML = `<button type="button" class="btn primary" id="onboardGo">开始用</button>`;
  $("#onboardGo").addEventListener("click", finishOnboard);
}

function finishOnboard() {
  localStorage.setItem(STORAGE_ONBOARD, "1");
  $("#onboard").close();
}

function maybeOnboard() {
  if (localStorage.getItem(STORAGE_ONBOARD)) return;
  paintOnboard();
  $("#onboard").showModal();
}

function bind() {
  $("#btnAdd").addEventListener("click", openWizard);
  $("#btnSettings").addEventListener("click", openSettings);
  $("#settingsClose").addEventListener("click", () => $("#settings").close());
  $("#wizardClose").addEventListener("click", () => $("#wizard").close());
  $("#detailClose").addEventListener("click", () => $("#detail").close());
  $("#wizardForm").addEventListener("submit", (e) => e.preventDefault());
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
      e.preventDefault();
      if (!$("#wizard").open && !$("#onboard").open) openWizard();
    }
  });
}

maybeSeed();
bind();
render();
maybeOnboard();
