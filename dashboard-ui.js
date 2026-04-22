import { supabase, getUserDisplayName } from "./supabase-config.js";
import { initMobileNav, markActiveNav, setCurrentYear } from "./platform-common.js";

const planLimits = {
  Free: { api: 100, chats: 30 },
  Pro: { api: 1000, chats: 500 },
  Premium: { api: 10000, chats: 5000 }
};

const els = {
  dashboardRoot: document.getElementById("dashboardRoot"),
  dashboardSkeleton: document.getElementById("dashboardSkeleton"),
  dashboardContent: document.getElementById("dashboardContent"),
  globalError: document.getElementById("globalError"),
  sessionChip: document.getElementById("sessionChip"),
  accountStatusChip: document.getElementById("accountStatusChip"),
  overviewName: document.getElementById("overviewName"),
  overviewEmail: document.getElementById("overviewEmail"),
  overviewPlan: document.getElementById("overviewPlan"),
  overviewJoinDate: document.getElementById("overviewJoinDate"),
  subscriptionPlan: document.getElementById("subscriptionPlan"),
  subscriptionCycle: document.getElementById("subscriptionCycle"),
  subscriptionNextBilling: document.getElementById("subscriptionNextBilling"),
  apiUsageLabel: document.getElementById("apiUsageLabel"),
  apiUsageBar: document.getElementById("apiUsageBar"),
  chatUsageLabel: document.getElementById("chatUsageLabel"),
  chatUsageBar: document.getElementById("chatUsageBar"),
  usageInsight: document.getElementById("usageInsight"),
  supabaseStatus: document.getElementById("supabaseStatus"),
  hfStatus: document.getElementById("hfStatus"),
  razorpayStatus: document.getElementById("razorpayStatus"),
  recentChatsList: document.getElementById("recentChatsList"),
  recentActionsList: document.getElementById("recentActionsList"),
  logsList: document.getElementById("logsList"),
  recentChatsEmpty: document.getElementById("recentChatsEmpty"),
  recentActionsEmpty: document.getElementById("recentActionsEmpty"),
  logsEmpty: document.getElementById("logsEmpty"),
  settingsStatus: document.getElementById("settingsStatus"),
  settingsName: document.getElementById("settingsName"),
  settingsEmail: document.getElementById("settingsEmail"),
  profileForm: document.getElementById("profileForm"),
  passwordForm: document.getElementById("passwordForm"),
  newPassword: document.getElementById("newPassword"),
  confirmPassword: document.getElementById("confirmPassword"),
  refreshDashboardBtn: document.getElementById("refreshDashboardBtn"),
  copySupportLinkBtn: document.getElementById("copySupportLinkBtn"),
  headerLogoutBtn: document.getElementById("headerLogoutBtn"),
  settingsLogoutBtn: document.getElementById("settingsLogoutBtn")
};

let currentUser = null;

function setLoading(loading) {
  els.dashboardSkeleton.hidden = !loading;
  els.dashboardContent.hidden = loading;
}

function setGlobalError(message = "") {
  if (!message) {
    els.globalError.hidden = true;
    els.globalError.textContent = "";
    return;
  }

  els.globalError.hidden = false;
  els.globalError.textContent = message;
}

function setSettingsStatus(message, isError = false) {
  els.settingsStatus.textContent = message;
  els.settingsStatus.style.color = isError ? "#c0392b" : "#1f8f4d";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getCurrentMonthKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getApiUsageKey() {
  return `growzoneApiUsage:${getCurrentMonthKey()}`;
}

function getActionsKey(userId) {
  return `growzoneActions:${userId}`;
}

function getLocalChatKey(userId) {
  return userId ? `growzoneChatHistory:${userId}` : "growzoneChatHistory";
}

function clampPercent(value, total) {
  if (total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function createActivityItem(title, meta) {
  const li = document.createElement("li");
  const strong = document.createElement("strong");
  strong.textContent = title;
  const span = document.createElement("span");
  span.textContent = meta;
  li.appendChild(strong);
  li.appendChild(span);
  return li;
}

function renderList(listEl, emptyEl, rows) {
  listEl.innerHTML = "";
  if (!rows.length) {
    emptyEl.hidden = false;
    return;
  }

  emptyEl.hidden = true;
  rows.forEach((row) => listEl.appendChild(row));
}

function deriveAccountStatus(user) {
  const statusRaw = (user.user_metadata?.account_status || "").toString().toLowerCase();
  if (statusRaw === "trial") {
    return "Trial";
  }
  if (statusRaw === "expired") {
    return "Expired";
  }

  const trialEndRaw = user.user_metadata?.trial_end;
  if (trialEndRaw) {
    const trialEnd = new Date(trialEndRaw);
    if (!Number.isNaN(trialEnd.getTime())) {
      return trialEnd > new Date() ? "Trial" : "Expired";
    }
  }

  return "Active";
}

function derivePlan(user) {
  const planRaw = (user.user_metadata?.plan || "Free").toString().toLowerCase();
  if (planRaw === "pro") {
    return "Pro";
  }
  if (planRaw === "premium") {
    return "Premium";
  }
  return "Free";
}

function deriveBillingCycle(user) {
  const cycleRaw = (user.user_metadata?.billing_cycle || "monthly").toString().toLowerCase();
  return cycleRaw === "yearly" ? "Yearly" : "Monthly";
}

function deriveNextBilling(user, cycle) {
  const custom = user.user_metadata?.next_billing_date;
  if (custom) {
    return formatDate(custom);
  }

  const base = new Date(user.created_at || Date.now());
  const next = new Date(base);
  if (cycle === "Yearly") {
    next.setFullYear(base.getFullYear() + 1);
  } else {
    next.setMonth(base.getMonth() + 1);
  }
  return formatDate(next.toISOString());
}

function mapStatusColor(el, status) {
  if (status === "Expired") {
    el.style.color = "#c0392b";
    return;
  }
  if (status === "Trial") {
    el.style.color = "#b7791f";
    return;
  }
  el.style.color = "#1f8f4d";
}

function saveAction(userId, title) {
  const key = getActionsKey(userId);
  const action = { title, time: new Date().toLocaleString() };
  const current = JSON.parse(localStorage.getItem(key) || "[]");
  const next = [action, ...current].slice(0, 12);
  localStorage.setItem(key, JSON.stringify(next));
}

function readActions(userId) {
  const key = getActionsKey(userId);
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

async function loadChatHistory(userId) {
  try {
    const { data, error } = await supabase
      .from("chat_history")
      .select("history, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && Array.isArray(data?.history)) {
      return { history: data.history, updatedAt: data.updated_at || null };
    }
  } catch {
    // Fallback handled below.
  }

  try {
    const saved = localStorage.getItem(getLocalChatKey(userId));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return { history: parsed, updatedAt: null };
      }
    }
  } catch {
    return { history: [], updatedAt: null };
  }

  return { history: [], updatedAt: null };
}

function renderUsage(plan, userMessageCount) {
  const limits = planLimits[plan] || planLimits.Free;
  const apiUsageStored = Number(localStorage.getItem(getApiUsageKey()) || userMessageCount * 2);

  els.apiUsageLabel.textContent = `${apiUsageStored} / ${limits.api}`;
  els.chatUsageLabel.textContent = `${userMessageCount} / ${limits.chats}`;

  els.apiUsageBar.style.width = `${clampPercent(apiUsageStored, limits.api)}%`;
  els.chatUsageBar.style.width = `${clampPercent(userMessageCount, limits.chats)}%`;

  const remainingChats = Math.max(0, limits.chats - userMessageCount);
  els.usageInsight.textContent = `${remainingChats} chats remaining in your ${plan} monthly limit.`;
}

function renderActivity(history, updatedAt, userId) {
  const userPrompts = history.filter((item) => item.role === "user");
  const recentChats = userPrompts.slice(-5).reverse().map((item) => {
    const text = (item.text || "Untitled chat").toString();
    return createActivityItem(text.slice(0, 90), item.time || "Recent");
  });

  renderList(els.recentChatsList, els.recentChatsEmpty, recentChats);

  const actions = readActions(userId).slice(0, 6).map((item) => createActivityItem(item.title, item.time));
  renderList(els.recentActionsList, els.recentActionsEmpty, actions);

  const logs = [];
  logs.push(createActivityItem("Session authenticated", new Date().toLocaleString()));
  if (updatedAt) {
    logs.push(createActivityItem("Chat history synced", formatDate(updatedAt)));
  }
  logs.push(createActivityItem("Dashboard rendered", new Date().toLocaleTimeString()));
  renderList(els.logsList, els.logsEmpty, logs);

  return userPrompts.length;
}

async function checkIntegrations() {
  els.supabaseStatus.textContent = "Connected";
  els.supabaseStatus.style.color = "#1f8f4d";

  try {
    const started = performance.now();
    const response = await fetch("/health", { method: "GET" });
    const duration = Math.round(performance.now() - started);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const health = await response.json();
    if (!health.hf_ready) {
      els.hfStatus.textContent = "Not ready";
      els.hfStatus.style.color = "#c0392b";
      return;
    }

    els.hfStatus.textContent = `Connected (${duration}ms)`;
    els.hfStatus.style.color = "#1f8f4d";
  } catch {
    els.hfStatus.textContent = "Unavailable";
    els.hfStatus.style.color = "#c0392b";
  }

  try {
    const response = await fetch("/api/razorpay/config", { method: "GET" });
    if (!response.ok) {
      throw new Error("Config unavailable");
    }

    const config = await response.json();
    if (config.enabled) {
      els.razorpayStatus.textContent = "Connected";
      els.razorpayStatus.style.color = "#1f8f4d";
    } else {
      els.razorpayStatus.textContent = "Not ready";
      els.razorpayStatus.style.color = "#c0392b";
    }
  } catch {
    els.razorpayStatus.textContent = "Unavailable";
    els.razorpayStatus.style.color = "#c0392b";
  }
}

function hydrateUserCards(user) {
  const displayName = getUserDisplayName(user);
  const plan = derivePlan(user);
  const cycle = deriveBillingCycle(user);
  const accountStatus = deriveAccountStatus(user);

  els.overviewName.textContent = displayName;
  els.overviewEmail.textContent = user.email || "-";
  els.overviewPlan.textContent = plan;
  els.overviewJoinDate.textContent = formatDate(user.created_at);

  els.subscriptionPlan.textContent = plan;
  els.subscriptionCycle.textContent = cycle;
  els.subscriptionNextBilling.textContent = deriveNextBilling(user, cycle);

  els.accountStatusChip.textContent = accountStatus;
  mapStatusColor(els.accountStatusChip, accountStatus);

  els.settingsName.value = displayName;
  els.settingsEmail.value = user.email || "";
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "login.html";
}

function wireSettings() {
  els.profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const displayName = els.settingsName.value.trim();
    if (!displayName) {
      setSettingsStatus("Display name cannot be empty.", true);
      return;
    }

    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
    if (error) {
      setSettingsStatus(error.message, true);
      return;
    }

    els.overviewName.textContent = displayName;
    setSettingsStatus("Profile updated successfully.");
    saveAction(currentUser.id, "Updated profile settings");
  });

  els.passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = els.newPassword.value;
    const confirm = els.confirmPassword.value;

    if (password !== confirm) {
      setSettingsStatus("Passwords do not match.", true);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSettingsStatus(error.message, true);
      return;
    }

    els.newPassword.value = "";
    els.confirmPassword.value = "";
    setSettingsStatus("Password updated successfully.");
    saveAction(currentUser.id, "Updated account password");
  });

  els.copySupportLinkBtn.addEventListener("click", async () => {
    const supportUrl = `${window.location.origin}/contact.html`;
    try {
      await navigator.clipboard.writeText(supportUrl);
      setSettingsStatus("Support URL copied to clipboard.");
    } catch {
      setSettingsStatus("Unable to copy automatically. Use /contact.html", true);
    }
  });

  els.headerLogoutBtn.addEventListener("click", logout);
  els.settingsLogoutBtn.addEventListener("click", logout);
}

async function refreshDashboard() {
  if (!currentUser) {
    return;
  }

  setGlobalError("");
  const chatData = await loadChatHistory(currentUser.id);
  const userMessageCount = renderActivity(chatData.history, chatData.updatedAt, currentUser.id);
  const plan = derivePlan(currentUser);
  renderUsage(plan, userMessageCount);
  await checkIntegrations();
}

async function initializeDashboard() {
  setLoading(true);
  setGlobalError("");

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = data.user;
  els.sessionChip.textContent = "Session Active";

  hydrateUserCards(currentUser);
  saveAction(currentUser.id, "Viewed dashboard");

  await refreshDashboard();

  setLoading(false);
  wireSettings();

  els.refreshDashboardBtn.addEventListener("click", refreshDashboard);
}

supabase.auth.onAuthStateChange((_event, session) => {
  if (!session?.user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = session.user;
});

initMobileNav();
markActiveNav("dashboard");
setCurrentYear();
initializeDashboard().catch((err) => {
  setLoading(false);
  setGlobalError(`Failed to load dashboard: ${err?.message || "Unknown error"}`);
});
