/* ==========================================================================
   core.js — 16:9 舞台縮放、共用班級狀態、localStorage、彩帶慶祝、導覽與彈窗
   ========================================================================== */
(function () {
  const STORAGE_KEY = "genius_classroom_toolbox_v2";

  const ANIMAL_AVATARS = [
    "🐻", "🐰", "🐱", "🐶", "🐼", "🦊", "🦁", "🐸",
    "🐨", "🐯", "🐥", "🐧", "🐷", "🐮", "🐵", "🦄",
    "🐝", "🦋", "🐳", "🐢", "🦒", "🦘", "🦔", "🦦",
    "🐹", "🐑", "🦆", "🦉", "🦖", "🐙", "🦀", "🐞",
    "🐬", "🦓", "🦌", "🐿️"
  ];

  function createDefaultStudents(count) {
    const list = [];
    for (let i = 1; i <= count; i++) {
      list.push({ id: i, name: "", absent: false });
    }
    return list;
  }

  function loadSavedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.students) && parsed.students.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
    return {
      className: "",
      students: createDefaultStudents(20),
      soundEnabled: true,
      jarStars: 5,
      jarGoal: 20,
      groupCategory: "animal",
      activeGroups: [],
      teamScores: [0, 0, 0, 0, 0, 0, 0, 0],
      wheelThemes: null,
      voteThemes: null,
      timerActivities: null
    };
  }

  const state = loadSavedState();
  const listeners = { roster: [], toolChange: [], groupsChanged: [], openStarTeams: [] };

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function formatSeatNum(id) {
    return String(id).padStart(2, "0");
  }

  function getStudentLabel(student) {
    const num = formatSeatNum(student.id) + "號";
    return student.name && student.name.trim() ? `${num} ${student.name.trim()}` : num;
  }

  function getAvatar(id) {
    return ANIMAL_AVATARS[(id - 1) % ANIMAL_AVATARS.length];
  }

  function getPresentStudents() {
    return state.students.filter((s) => !s.absent);
  }

  function emit(event, payload) {
    (listeners[event] || []).forEach((fn) => fn(payload));
  }

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  }

  /* ==================== 16:9 舞台自動縮放 ==================== */
  function fitStage() {
    const stage = document.getElementById("stage");
    if (!stage) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / 1280, vh / 720);
    stage.style.transform = `scale(${scale})`;
    const isExact = Math.abs(vw / vh - 16 / 9) < 0.02 || !!document.fullscreenElement;
    stage.classList.toggle("is-exact-fit", isExact);
  }

  /* ==================== 即時時鐘 ==================== */
  function updateClock() {
    const el = document.getElementById("live-clock");
    if (!el) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    el.textContent = `${hh}:${mm}`;
  }

  /* ==================== Toast 輕提示 ==================== */
  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  /* ==================== 慶祝彩帶引擎 ==================== */
  let confettiParticles = [];
  let confettiRaf = null;
  function launchConfetti(count = 95) {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const colors = ["#FF6B6B", "#FFD166", "#2EC4B6", "#4EA8DE", "#A78BFA", "#FF9F68", "#4CC36A"];
    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: 640 + (Math.random() - 0.5) * 420,
        y: 260 + (Math.random() - 0.5) * 140,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 3,
        size: 7 + Math.random() * 7,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.25,
        color: colors[i % colors.length],
        life: 1
      });
    }
    if (confettiRaf) return;
    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confettiParticles = confettiParticles.filter((p) => p.life > 0.02 && p.y < 760);
      confettiParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.32;
        p.vx *= 0.99;
        p.rot += p.vrot;
        p.life -= 0.011;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
        ctx.restore();
      });
      if (confettiParticles.length > 0) {
        confettiRaf = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiRaf = null;
      }
    }
    confettiRaf = requestAnimationFrame(step);
  }

  /* ==================== 彈窗控制 ==================== */
  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
  }

  function showCelebrate(badge, mainText, subText) {
    document.getElementById("celebrate-badge").textContent = badge;
    document.getElementById("celebrate-main").textContent = mainText;
    document.getElementById("celebrate-sub").textContent = subText;
    openModal("modal-celebrate");
    launchConfetti(110);
    window.SoundFX.fanfare();
  }

  /* ==================== 導覽切換 ==================== */
  let currentTool = "home";
  function switchTool(toolId) {
    currentTool = toolId;
    document.querySelectorAll(".tool-view").forEach((sec) => {
      sec.classList.toggle("active", sec.id === `view-${toolId}`);
    });
    document.querySelectorAll(".nav-pill").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tool === toolId);
    });
    window.SoundFX.click();
    emit("toolChange", toolId);
  }

  /* ==================== 班級名單管理 ==================== */
  let draftStudents = [];

  function syncRosterSummaryUI() {
    const total = state.students.length;
    const present = getPresentStudents().length;
    const cname = (state.className || "").trim();

    const badge = document.getElementById("roster-count-badge");
    const nameEl = document.getElementById("home-class-name");
    const sumEl = document.getElementById("home-class-summary");
    const seatClassInp = document.getElementById("input-seat-classname");
    const seatHeading = document.getElementById("seat-list-heading");

    if (badge) badge.textContent = `${present}人`;
    if (nameEl) nameEl.textContent = cname || "班級名單設定";
    if (sumEl) sumEl.textContent = `出席 ${present} / ${total} 人・點我設定名單`;
    if (seatClassInp && document.activeElement !== seatClassInp) {
      seatClassInp.value = cname;
    }
    if (seatHeading) {
      seatHeading.textContent = cname ? `📋 ${cname}・座號總覽` : "📋 座號總覽";
    }
  }

  function setClassName(name) {
    state.className = String(name || "").trim();
    saveState();
    syncRosterSummaryUI();
  }

  function renderRosterModalEditor() {
    const grid = document.getElementById("roster-editor-grid");
    const sizeVal = document.getElementById("roster-size-val");
    sizeVal.textContent = `${draftStudents.length} 人`;
    grid.innerHTML = "";
    draftStudents.forEach((st, idx) => {
      const row = document.createElement("div");
      row.className = "roster-row";
      row.innerHTML = `
        <span class="roster-num-tag">${formatSeatNum(st.id)}</span>
        <input class="roster-name-input" type="text" placeholder="姓名（可留空）" maxlength="10" value="${escapeHtml(st.name)}" data-idx="${idx}" />
        <button class="roster-absent-btn ${st.absent ? "is-absent" : ""}" type="button" data-idx="${idx}">
          ${st.absent ? "請假" : "出席"}
        </button>
      `;
      grid.appendChild(row);
    });

    grid.querySelectorAll(".roster-name-input").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        const i = Number(e.target.dataset.idx);
        draftStudents[i].name = e.target.value;
      });
    });

    grid.querySelectorAll(".roster-absent-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const i = Number(e.currentTarget.dataset.idx);
        draftStudents[i].absent = !draftStudents[i].absent;
        window.SoundFX.click();
        renderRosterModalEditor();
      });
    });
  }

  function openRosterModal() {
    document.getElementById("input-class-name").value = state.className || "";
    draftStudents = state.students.map((s) => ({ ...s }));
    renderRosterModalEditor();
    openModal("modal-roster");
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toggleStudentAbsent(id) {
    const target = state.students.find((s) => s.id === id);
    if (!target) return;
    target.absent = !target.absent;
    saveState();
    syncRosterSummaryUI();
    emit("roster", state.students);
  }

  /* ==================== 初始化綁定 ==================== */
  function initCore() {
    fitStage();
    window.addEventListener("resize", fitStage);
    document.addEventListener("fullscreenchange", fitStage);

    updateClock();
    setInterval(updateClock, 10000);

    // 音效開關
    window.SoundFX.setEnabled(state.soundEnabled !== false);
    const soundIcon = document.getElementById("sound-icon");
    soundIcon.textContent = window.SoundFX.isEnabled() ? "🔊" : "🔇";

    document.getElementById("btn-sound").addEventListener("click", () => {
      const next = !window.SoundFX.isEnabled();
      window.SoundFX.setEnabled(next);
      state.soundEnabled = next;
      saveState();
      soundIcon.textContent = next ? "🔊" : "🔇";
      if (next) window.SoundFX.pop();
      showToast(next ? "🔊 音效已開啟" : "🔇 已切換為靜音");
    });

    // 全螢幕
    document.getElementById("btn-fullscreen").addEventListener("click", () => {
      window.SoundFX.click();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {
          showToast("請按 F11 鍵切換全螢幕模式");
        });
      } else {
        document.exitFullscreen?.();
      }
    });

    // 頂部導覽與首頁卡片
    document.getElementById("btn-home").addEventListener("click", () => switchTool("home"));
    document.querySelectorAll(".nav-pill").forEach((btn) => {
      btn.addEventListener("click", () => switchTool(btn.dataset.tool));
    });
    document.querySelectorAll("[data-open-tool]").forEach((card) => {
      card.addEventListener("click", () => switchTool(card.dataset.openTool));
    });

    // 搖鈴專注提醒
    const overlayAttention = document.getElementById("overlay-attention");
    document.getElementById("btn-attention").addEventListener("click", () => {
      window.SoundFX.bell();
      overlayAttention.classList.add("open");
      overlayAttention.setAttribute("aria-hidden", "false");
    });
    document.getElementById("btn-close-attention").addEventListener("click", () => {
      window.SoundFX.pop();
      overlayAttention.classList.remove("open");
      overlayAttention.setAttribute("aria-hidden", "true");
    });
    overlayAttention.addEventListener("click", (e) => {
      if (e.target === overlayAttention) {
        overlayAttention.classList.remove("open");
        overlayAttention.setAttribute("aria-hidden", "true");
      }
    });

    // 班級名單彈窗
    document.getElementById("btn-roster").addEventListener("click", () => {
      window.SoundFX.click();
      openRosterModal();
    });
    document.getElementById("home-roster-card").addEventListener("click", () => {
      window.SoundFX.click();
      openRosterModal();
    });

    document.getElementById("btn-roster-minus").addEventListener("click", () => {
      if (draftStudents.length <= 2) return;
      draftStudents.pop();
      window.SoundFX.click();
      renderRosterModalEditor();
    });

    document.getElementById("btn-roster-plus").addEventListener("click", () => {
      if (draftStudents.length >= 36) return;
      draftStudents.push({ id: draftStudents.length + 1, name: "", absent: false });
      window.SoundFX.click();
      renderRosterModalEditor();
    });

    document.getElementById("btn-roster-all-present").addEventListener("click", () => {
      draftStudents.forEach((s) => (s.absent = false));
      window.SoundFX.click();
      renderRosterModalEditor();
    });

    document.getElementById("btn-roster-clear-names").addEventListener("click", () => {
      draftStudents.forEach((s) => (s.name = ""));
      window.SoundFX.click();
      renderRosterModalEditor();
    });

    document.getElementById("btn-roster-save").addEventListener("click", () => {
      const cname = document.getElementById("input-class-name").value.trim();
      state.className = cname;
      state.students = draftStudents.map((s, idx) => ({
        id: idx + 1,
        name: s.name.trim(),
        absent: !!s.absent
      }));
      saveState();
      syncRosterSummaryUI();
      emit("roster", state.students);
      closeModal("modal-roster");
      window.SoundFX.pop();
      const label = cname ? `「${cname}」` : "班級";
      showToast(`✅ 已儲存${label}名單（共 ${state.students.length} 人）`);
    });

    // 通用彈窗關閉按鈕與點擊遮罩關閉
    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.SoundFX.click();
        closeModal(btn.dataset.closeModal);
      });
    });
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          closeModal(backdrop.id);
        }
      });
    });

    syncRosterSummaryUI();
  }

  const PRESET_ICONS = [
    "🤫", "🪥", "🧹", "📖", "🍎", "🎨", "🎵", "🧩", "🏃", "🛝", "🍱", "😴",
    "⭐", "🌈", "🎈", "🎁", "🏆", "👍", "😄", "😊", "🤗", "🤔", "❤️", "✨",
    "🐷", "🐰", "🐻", "🐱", "🐶", "🦋", "🐛", "🐯", "🍌", "🍓", "🍪", "🥛"
  ];

  window.Toolbox = {
    state,
    PRESET_ICONS,
    saveState,
    on,
    emit,
    formatSeatNum,
    getStudentLabel,
    getAvatar,
    getPresentStudents,
    toggleStudentAbsent,
    setClassName,
    switchTool,
    openModal,
    closeModal,
    showCelebrate,
    launchConfetti,
    showToast,
    escapeHtml,
    getCurrentTool: () => currentTool
  };

  document.addEventListener("DOMContentLoaded", initCore);
})();
