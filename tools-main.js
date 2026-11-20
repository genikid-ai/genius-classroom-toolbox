/* ==========================================================================
   tools-main.js — 工具 1~4：幸運轉盤、抽座號、快樂分組、視覺計時器
   ========================================================================== */
(function () {
  /* ========================================================================
     工具 1：幸運轉盤 (Lucky Spinner — 支援修改與新增自訂主題)
     ======================================================================== */
  function initSpinner() {
    const SLICE_COLORS = [
      "#FF7A7A", "#FFB84D", "#FFD95A", "#68D391",
      "#4FD1C5", "#63B3ED", "#9F8FEF", "#F687B3",
      "#FFA06B", "#7BC96F", "#56CCF2", "#B794F4"
    ];

    const DEFAULT_THEMES = [
      { id: "helper", name: "🧹 小幫手", items: ["擦桌子", "發點心", "收玩具", "排椅子", "關電燈", "澆花小幫手"] },
      { id: "corner", name: "🎨 學習區", items: ["積木區", "美勞區", "益智區", "語文區", "扮演區", "科學探索區"] },
      { id: "reward", name: "🎁 小獎勵", items: ["貼紙一張", "蓋小印章", "選故事書", "當小排頭", "愛的抱抱", "全班掌聲"] },
      { id: "action", name: "🐸 動一動", items: ["學青蛙跳3下", "學大象走路", "原地轉3圈", "拍手5下", "學小鳥飛", "金雞獨立5秒"] }
    ];

    const st = window.Toolbox.state;
    if (!Array.isArray(st.wheelThemes) || st.wheelThemes.length === 0) {
      st.wheelThemes = DEFAULT_THEMES.map((t) => ({ id: t.id, name: t.name, items: [...t.items] }));
      window.Toolbox.saveState();
    }

    let currentThemeId = st.wheelThemes[0].id; // or "__roster__"
    let allItems = [...st.wheelThemes[0].items];
    let activeItems = [...allItems];
    let rotation = 0;
    let spinning = false;
    let lastSliceIdx = -1;

    const canvas = document.getElementById("wheel-canvas");
    const ctx = canvas.getContext("2d");
    const pointerEl = document.getElementById("wheel-pointer");
    const presetsWrap = document.getElementById("wheel-presets");
    const themeNameInput = document.getElementById("input-wheel-theme-name");
    const themeBannerEl = document.getElementById("wheel-current-theme-banner");
    const btnNewTheme = document.getElementById("btn-wheel-new-theme");
    const btnDelTheme = document.getElementById("btn-wheel-del-theme");
    const listEl = document.getElementById("wheel-item-list");
    const countLabel = document.getElementById("wheel-count-label");
    const inputEl = document.getElementById("input-wheel-item");
    const chkRemove = document.getElementById("chk-spin-remove");
    const btnRestore = document.getElementById("btn-spin-restore");
    const btnSpin = document.getElementById("btn-spin");
    const btnCenter = document.getElementById("btn-spin-center");

    function getCurrentTheme() {
      if (currentThemeId === "__roster__") return null;
      return st.wheelThemes.find((t) => t.id === currentThemeId) || st.wheelThemes[0];
    }

    function getCurrentThemeTitle() {
      if (currentThemeId === "__roster__") {
        const cname = (st.className || "").trim();
        return cname ? `👧 ${cname}全班名單` : "👧 全班名單";
      }
      const t = getCurrentTheme();
      return t ? t.name : "幸運轉盤";
    }

    function syncThemeToStorage() {
      const t = getCurrentTheme();
      if (t) {
        t.items = [...allItems];
        window.Toolbox.saveState();
      }
    }

    function getPointerSliceIndex(rot, count) {
      if (count <= 0) return -1;
      const twoPi = Math.PI * 2;
      const sliceAngle = twoPi / count;
      const rel = (((-Math.PI / 2 - rot) % twoPi) + twoPi) % twoPi;
      return Math.floor(rel / sliceAngle) % count;
    }

    function drawWheel() {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = 236;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 12, 0, Math.PI * 2);
      ctx.fillStyle = "#FFF4DC";
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#F0B85A";
      ctx.stroke();
      ctx.restore();

      const count = activeItems.length;
      if (count === 0) {
        ctx.fillStyle = "#F5EDE0";
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#755C48";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("請先加入選項喔！", cx, cy);
        return;
      }

      const sliceAngle = (Math.PI * 2) / count;
      for (let i = 0; i < count; i++) {
        const start = rotation + i * sliceAngle;
        const end = start + sliceAngle;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length];
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();

        ctx.translate(cx, cy);
        ctx.rotate(start + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#3B281B";
        const fontSize = count > 18 ? 14 : count > 10 ? 18 : 23;
        ctx.font = `900 ${fontSize}px "PingFang TC", "Microsoft JhengHei", sans-serif`;
        const label = activeItems[i].length > 9 ? activeItems[i].slice(0, 8) + "…" : activeItems[i];
        ctx.fillText(label, radius - 22, 0);
        ctx.restore();
      }

      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const dx = cx + Math.cos(a) * (radius + 6);
        const dy = cy + Math.sin(a) * (radius + 6);
        ctx.beginPath();
        ctx.arc(dx, dy, 4, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? "#FFFFFF" : "#FFE082";
        ctx.fill();
      }
    }

    function renderThemeChips() {
      presetsWrap.innerHTML = "";
      st.wheelThemes.forEach((theme) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `chip-btn ${currentThemeId === theme.id ? "active" : ""}`;
        btn.textContent = theme.name;
        btn.addEventListener("click", () => {
          if (spinning) return;
          selectTheme(theme.id);
        });
        presetsWrap.appendChild(btn);
      });

      const rosterBtn = document.createElement("button");
      rosterBtn.type = "button";
      rosterBtn.className = `chip-btn ${currentThemeId === "__roster__" ? "active" : ""}`;
      rosterBtn.textContent = "👧 帶入全班";
      rosterBtn.addEventListener("click", () => {
        if (spinning) return;
        const present = window.Toolbox.getPresentStudents();
        if (present.length < 2) {
          window.Toolbox.showToast("出席小朋友不足 2 人，請先檢查名單");
          return;
        }
        currentThemeId = "__roster__";
        allItems = present.map((s) => window.Toolbox.getStudentLabel(s));
        activeItems = [...allItems];
        window.SoundFX.click();
        updateThemeControls();
        renderList();
        drawWheel();
      });
      presetsWrap.appendChild(rosterBtn);
    }

    function updateThemeControls() {
      const isRoster = currentThemeId === "__roster__";
      const title = getCurrentThemeTitle();
      themeBannerEl.textContent = `🎡 目前主題：${title}`;
      themeNameInput.disabled = isRoster;
      themeNameInput.value = isRoster ? title : (getCurrentTheme()?.name || "");
      btnDelTheme.disabled = isRoster || st.wheelThemes.length <= 1;
      renderThemeChips();
    }

    function selectTheme(themeId) {
      const found = st.wheelThemes.find((t) => t.id === themeId) || st.wheelThemes[0];
      currentThemeId = found.id;
      allItems = [...found.items];
      activeItems = [...allItems];
      window.SoundFX.click();
      updateThemeControls();
      renderList();
      drawWheel();
    }

    function renderList() {
      countLabel.textContent = `${activeItems.length} 項`;
      btnRestore.style.display = activeItems.length < allItems.length ? "inline-flex" : "none";
      listEl.innerHTML = "";
      activeItems.forEach((txt, idx) => {
        const row = document.createElement("div");
        row.className = "wheel-item-row";
        row.innerHTML = `
          <span class="wheel-color-dot" style="background:${SLICE_COLORS[idx % SLICE_COLORS.length]}"></span>
          <span class="wheel-item-text">${window.Toolbox.escapeHtml(txt)}</span>
          <button class="wheel-item-del" type="button" data-idx="${idx}" title="移除">✕</button>
        `;
        listEl.appendChild(row);
      });

      listEl.querySelectorAll(".wheel-item-del").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          if (spinning) return;
          const idx = Number(e.currentTarget.dataset.idx);
          const removed = activeItems.splice(idx, 1)[0];
          const allIdx = allItems.indexOf(removed);
          if (allIdx !== -1) allItems.splice(allIdx, 1);
          syncThemeToStorage();
          window.SoundFX.click();
          renderList();
          drawWheel();
        });
      });
    }

    function spin() {
      if (spinning) return;
      if (activeItems.length < 2) {
        window.Toolbox.showToast("至少需要 2 個選項才能轉動轉盤喔！");
        return;
      }
      spinning = true;
      btnSpin.disabled = true;
      btnCenter.disabled = true;

      const startRot = rotation;
      const extraSpins = 5 + Math.random() * 3;
      const targetRot = startRot + extraSpins * Math.PI * 2 + Math.random() * Math.PI * 2;
      const duration = 4200;
      const startTime = performance.now();
      lastSliceIdx = getPointerSliceIndex(rotation, activeItems.length);

      function animate(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        rotation = startRot + (targetRot - startRot) * eased;
        drawWheel();

        const currentIdx = getPointerSliceIndex(rotation, activeItems.length);
        if (currentIdx !== lastSliceIdx) {
          lastSliceIdx = currentIdx;
          window.SoundFX.tick();
          pointerEl.classList.add("tick-kick");
          setTimeout(() => pointerEl.classList.remove("tick-kick"), 70);
        }

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          rotation = rotation % (Math.PI * 2);
          spinning = false;
          btnSpin.disabled = false;
          btnCenter.disabled = false;
          const winnerIdx = getPointerSliceIndex(rotation, activeItems.length);
          const winner = activeItems[winnerIdx];
          window.Toolbox.showCelebrate(`🎡 ${getCurrentThemeTitle()}・揭曉！`, winner, "太棒了！大家一起拍拍手 👏");

          if (chkRemove.checked && activeItems.length > 1) {
            activeItems.splice(winnerIdx, 1);
            renderList();
            drawWheel();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    btnSpin.addEventListener("click", spin);
    btnCenter.addEventListener("click", spin);

    // 修改主題名稱
    themeNameInput.addEventListener("input", () => {
      const t = getCurrentTheme();
      if (!t) return;
      const val = themeNameInput.value.trim() || "未命名主題";
      t.name = val;
      window.Toolbox.saveState();
      themeBannerEl.textContent = `🎡 目前主題：${val}`;
      renderThemeChips();
    });

    // 新增自訂主題
    btnNewTheme.addEventListener("click", () => {
      if (spinning) return;
      const newTheme = {
        id: "custom_" + Date.now(),
        name: `✨ 自訂主題 ${st.wheelThemes.length + 1}`,
        items: ["選項 1", "選項 2", "選項 3", "選項 4"]
      };
      st.wheelThemes.push(newTheme);
      window.Toolbox.saveState();
      selectTheme(newTheme.id);
      window.SoundFX.pop();
      window.Toolbox.showToast("已新增主題！可直接修改名稱與選項");
      themeNameInput.focus();
      themeNameInput.select();
    });

    // 刪除目前主題
    btnDelTheme.addEventListener("click", () => {
      if (spinning || currentThemeId === "__roster__" || st.wheelThemes.length <= 1) return;
      const idx = st.wheelThemes.findIndex((t) => t.id === currentThemeId);
      if (idx === -1) return;
      st.wheelThemes.splice(idx, 1);
      window.Toolbox.saveState();
      selectTheme(st.wheelThemes[Math.max(0, idx - 1)].id);
      window.Toolbox.showToast("已刪除該主題");
    });

    document.getElementById("btn-wheel-add").addEventListener("click", () => {
      const val = inputEl.value.trim();
      if (!val || spinning) return;
      allItems.push(val);
      activeItems.push(val);
      syncThemeToStorage();
      inputEl.value = "";
      window.SoundFX.pop();
      renderList();
      drawWheel();
    });

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("btn-wheel-add").click();
    });

    btnRestore.addEventListener("click", () => {
      if (spinning) return;
      activeItems = [...allItems];
      window.SoundFX.pop();
      renderList();
      drawWheel();
      window.Toolbox.showToast("已恢復全部選項！");
    });

    updateThemeControls();
    renderList();
    drawWheel();
  }

  /* ========================================================================
     工具 2：抽座號點名 (Seat Number Picker — 班級名稱預設空白)
     ======================================================================== */
  function initSeatPicker() {
    let drawCount = 1;
    let pickedIds = new Set();
    let drawing = false;

    const stageEl = document.getElementById("seat-reveal-stage");
    const gridEl = document.getElementById("seat-mini-grid");
    const remLabel = document.getElementById("seat-remaining-label");
    const chkUnique = document.getElementById("chk-seat-unique");
    const seatClassInp = document.getElementById("input-seat-classname");
    const btnDraw = document.getElementById("btn-seat-draw");
    const btnReset = document.getElementById("btn-seat-reset");

    seatClassInp.value = window.Toolbox.state.className || "";
    seatClassInp.addEventListener("input", () => {
      window.Toolbox.setClassName(seatClassInp.value);
    });

    function getAvailablePool() {
      const present = window.Toolbox.getPresentStudents();
      if (chkUnique.checked) {
        return present.filter((s) => !pickedIds.has(s.id));
      }
      return present;
    }

    function renderGrid() {
      const students = window.Toolbox.state.students;
      const pool = getAvailablePool();
      remLabel.textContent = chkUnique.checked ? `剩餘 ${pool.length} 人` : `共 ${pool.length} 人出席`;
      gridEl.innerHTML = "";
      students.forEach((st) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "seat-chip";
        if (st.absent) chip.classList.add("is-absent");
        else if (pickedIds.has(st.id)) chip.classList.add("is-picked");
        chip.innerHTML = `
          <strong>${window.Toolbox.formatSeatNum(st.id)}</strong>
          <small>${st.absent ? "請假" : window.Toolbox.escapeHtml(st.name || "號")}</small>
        `;
        chip.addEventListener("click", () => {
          if (drawing) return;
          window.SoundFX.click();
          window.Toolbox.toggleStudentAbsent(st.id);
        });
        gridEl.appendChild(chip);
      });
    }

    function renderCards(students, stateClass) {
      const modeClass =
        students.length === 1 ? "single-mode" : students.length >= 5 ? "compact-mode" : "";
      stageEl.innerHTML = "";
      students.forEach((st) => {
        const card = document.createElement("div");
        card.className = `seat-winner-card ${modeClass} ${stateClass}`;
        card.innerHTML = `
          <div class="winner-avatar">${window.Toolbox.getAvatar(st.id)}</div>
          <div class="winner-num">${window.Toolbox.formatSeatNum(st.id)} 號</div>
          <div class="winner-name">${window.Toolbox.escapeHtml(st.name || "幸運小朋友")}</div>
        `;
        stageEl.appendChild(card);
      });
    }

    function pickRandom(pool, n) {
      const copy = [...pool];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy.slice(0, n);
    }

    function startDraw() {
      if (drawing) return;
      const pool = getAvailablePool();
      if (pool.length === 0) {
        window.Toolbox.showToast("所有出席的小朋友都抽過囉！請按「重新洗牌」");
        window.SoundFX.softAlert();
        return;
      }

      const actualCount = Math.min(drawCount, pool.length);
      drawing = true;
      btnDraw.disabled = true;

      let steps = 0;
      const maxSteps = 14;
      const timer = setInterval(() => {
        steps++;
        const preview = pickRandom(pool, actualCount);
        renderCards(preview, "rolling");
        window.SoundFX.tick();
        if (steps >= maxSteps) {
          clearInterval(timer);
          const winners = pickRandom(pool, actualCount);
          if (chkUnique.checked) {
            winners.forEach((w) => pickedIds.add(w.id));
          }
          renderCards(winners, "pop-in");
          renderGrid();
          window.SoundFX.fanfare();
          window.Toolbox.launchConfetti(85);
          drawing = false;
          btnDraw.disabled = false;
        }
      }, 75);
    }

    document.querySelectorAll("[data-draw-count]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-draw-count]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        drawCount = Number(btn.dataset.drawCount);
        window.SoundFX.click();
      });
    });

    chkUnique.addEventListener("change", () => {
      window.SoundFX.click();
      renderGrid();
    });

    btnDraw.addEventListener("click", startDraw);

    btnReset.addEventListener("click", () => {
      if (drawing) return;
      pickedIds.clear();
      renderGrid();
      stageEl.innerHTML = `
        <div class="seat-placeholder">
          <div class="big-mascot">🎁</div>
          <div class="placeholder-title">重新洗牌完成！</div>
          <div class="placeholder-sub">按下「開始抽籤」揭曉下一位幸運小朋友！</div>
        </div>
      `;
      window.SoundFX.pop();
      window.Toolbox.showToast("已清空抽籤紀錄");
    });

    window.Toolbox.on("roster", renderGrid);
    renderGrid();
  }

  /* ========================================================================
     工具 3：快樂分組 (支援數字/動物/水果/顏色類別 + 可改組名 + 連動集點)
     ======================================================================== */
  function initGroupMaker() {
    const GROUP_PALETTES = [
      { bg: "#FFF2E2", border: "#F4B36C", titleColor: "#A65300", btn: "btn-amber" },
      { bg: "#FFF0F4", border: "#F7A1B8", titleColor: "#B3365B", btn: "btn-coral" },
      { bg: "#EDFBF2", border: "#7FD89E", titleColor: "#1E8245", btn: "btn-mint" },
      { bg: "#EAF8FF", border: "#84C5F4", titleColor: "#1D6DA8", btn: "btn-sky" },
      { bg: "#F4F0FF", border: "#B7A0F7", titleColor: "#5C3EB5", btn: "btn-violet" },
      { bg: "#FFF1EA", border: "#F7A479", titleColor: "#BA4A16", btn: "btn-peach" },
      { bg: "#FFFBE2", border: "#F0CF57", titleColor: "#9B7400", btn: "btn-gold" },
      { bg: "#E9FAF7", border: "#7ADDD0", titleColor: "#157B70", btn: "btn-mint" }
    ];

    const CATEGORY_PRESETS = {
      number: [
        { icon: "1️⃣", name: "第 1 組" }, { icon: "2️⃣", name: "第 2 組" },
        { icon: "3️⃣", name: "第 3 組" }, { icon: "4️⃣", name: "第 4 組" },
        { icon: "5️⃣", name: "第 5 組" }, { icon: "6️⃣", name: "第 6 組" },
        { icon: "7️⃣", name: "第 7 組" }, { icon: "8️⃣", name: "第 8 組" }
      ],
      animal: [
        { icon: "🐻", name: "小熊組" }, { icon: "🐰", name: "小兔組" },
        { icon: "🐱", name: "小貓組" }, { icon: "🐶", name: "小狗組" },
        { icon: "🐼", name: "熊貓組" }, { icon: "🦊", name: "狐狸組" },
        { icon: "🦁", name: "獅子組" }, { icon: "🐸", name: "青蛙組" }
      ],
      fruit: [
        { icon: "🍎", name: "蘋果組" }, { icon: "🍌", name: "香蕉組" },
        { icon: "🍓", name: "草莓組" }, { icon: "🍇", name: "葡萄組" },
        { icon: "🍊", name: "橘子組" }, { icon: "🍉", name: "西瓜組" },
        { icon: "🍑", name: "水蜜桃組" }, { icon: "🥝", name: "奇異果組" }
      ],
      color: [
        { icon: "🔴", name: "紅隊", bg: "#FFEFEF", border: "#FF9B9B", titleColor: "#C0392B", btn: "btn-coral" },
        { icon: "🟠", name: "橘隊", bg: "#FFF3E8", border: "#FFB070", titleColor: "#C85A17", btn: "btn-peach" },
        { icon: "🟡", name: "黃隊", bg: "#FFFBE2", border: "#F2CE54", titleColor: "#9E7600", btn: "btn-gold" },
        { icon: "🟢", name: "綠隊", bg: "#ECFBF0", border: "#7AD696", titleColor: "#1E8449", btn: "btn-mint" },
        { icon: "🔵", name: "藍隊", bg: "#EAF6FF", border: "#7EC2F5", titleColor: "#1F6FA8", btn: "btn-sky" },
        { icon: "🟣", name: "紫隊", bg: "#F4EFFF", border: "#B79EF7", titleColor: "#613EB5", btn: "btn-violet" },
        { icon: "🩷", name: "粉紅隊", bg: "#FFF0F7", border: "#F7A3CC", titleColor: "#B83B78", btn: "btn-coral" },
        { icon: "🤎", name: "咖啡隊", bg: "#F5EDE6", border: "#C99F78", titleColor: "#6E4726", btn: "btn-amber" }
      ]
    };

    const st = window.Toolbox.state;
    let mode = "teams";
    let param = 4;
    let category = st.groupCategory || "animal";
    let groups = []; // [{ icon, name, bg, border, titleColor, btn, members: [] }]
    let swapFirst = null;

    const boardEl = document.getElementById("groups-board");
    const displayEl = document.getElementById("group-param-display");
    const hintEl = document.getElementById("group-swap-hint");
    const chkLeader = document.getElementById("chk-group-leader");
    const btnModeTeams = document.getElementById("btn-group-mode-teams");
    const btnModeSize = document.getElementById("btn-group-mode-size");

    function getMetaForIndex(cat, idx) {
      const list = CATEGORY_PRESETS[cat] || CATEGORY_PRESETS.animal;
      const item = list[idx % list.length];
      const pal = GROUP_PALETTES[idx % GROUP_PALETTES.length];
      return {
        icon: item.icon,
        name: item.name,
        bg: item.bg || pal.bg,
        border: item.border || pal.border,
        titleColor: item.titleColor || pal.titleColor,
        btn: item.btn || pal.btn
      };
    }

    function syncActiveGroups() {
      st.groupCategory = category;
      st.activeGroups = groups.map((g) => ({
        icon: g.icon,
        name: g.name,
        bg: g.bg,
        border: g.border,
        titleColor: g.titleColor,
        btn: g.btn,
        members: g.members.map((m) => ({ id: m.id, name: m.name }))
      }));
      window.Toolbox.saveState();
      window.Toolbox.emit("groupsChanged", st.activeGroups);
    }

    function updateParamText() {
      displayEl.textContent = mode === "teams" ? `分成 ${param} 組` : `每組 ${param} 人`;
    }

    function updateCategoryChips() {
      document.querySelectorAll("#group-category-chips .chip-btn").forEach((chip) => {
        chip.classList.toggle("active", chip.dataset.groupCat === category);
      });
    }

    function generateGroups(withFx = false) {
      swapFirst = null;
      updateSwapHint();
      const present = [...window.Toolbox.getPresentStudents()];
      if (present.length === 0) {
        groups = [];
        syncActiveGroups();
        boardEl.innerHTML = `<div class="seat-placeholder"><div class="big-mascot">🏫</div><div class="placeholder-title">目前沒有出席的小朋友喔！</div></div>`;
        return;
      }

      for (let i = present.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [present[i], present[j]] = [present[j], present[i]];
      }

      let numGroups = mode === "teams" ? param : Math.max(1, Math.ceil(present.length / param));
      numGroups = Math.min(8, Math.max(1, Math.min(numGroups, present.length)));

      groups = Array.from({ length: numGroups }, (_, idx) => {
        const meta = getMetaForIndex(category, idx);
        return {
          ...meta,
          members: []
        };
      });

      present.forEach((student, idx) => {
        groups[idx % numGroups].members.push(student);
      });

      syncActiveGroups();
      renderGroups();
      if (withFx) {
        window.SoundFX.fanfare();
        window.Toolbox.launchConfetti(60);
      }
    }

    function applyCategoryToCurrentGroups(newCat) {
      category = newCat;
      updateCategoryChips();
      groups.forEach((g, idx) => {
        const meta = getMetaForIndex(category, idx);
        g.icon = meta.icon;
        g.name = meta.name;
        g.bg = meta.bg;
        g.border = meta.border;
        g.titleColor = meta.titleColor;
        g.btn = meta.btn;
      });
      syncActiveGroups();
      renderGroups();
    }

    function updateSwapHint() {
      if (swapFirst) {
        const student = groups[swapFirst.gIdx]?.members[swapFirst.mIdx];
        const lbl = student ? window.Toolbox.getStudentLabel(student) : "";
        hintEl.textContent = `🔄 已選取「${lbl}」，請再點另一位小朋友互換組別`;
        hintEl.classList.add("is-selecting");
      } else {
        hintEl.textContent = "💡 點擊任兩位小朋友即可互換組別";
        hintEl.classList.remove("is-selecting");
      }
    }

    function renderGroups() {
      const count = groups.length;
      if (count === 0) return;
      const cols = count <= 2 ? 2 : count === 3 ? 3 : count === 4 ? 2 : count <= 6 ? 3 : 4;
      const rows = Math.ceil(count / cols);
      const maxMembers = Math.max(0, ...groups.map((g) => g.members.length));

      boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      boardEl.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
      boardEl.classList.remove("density-compact", "density-dense");
      if ((rows >= 2 && maxMembers >= 7) || (cols >= 4 && maxMembers >= 5) || maxMembers >= 14) {
        boardEl.classList.add("density-dense");
      } else if ((rows >= 2 && maxMembers >= 5) || maxMembers >= 10) {
        boardEl.classList.add("density-compact");
      }

      boardEl.innerHTML = "";

      groups.forEach((grp, gIdx) => {
        const card = document.createElement("div");
        card.className = "group-card";
        card.style.background = grp.bg;
        card.style.borderColor = grp.border;

        const membersHtml = grp.members
          .map((student, mIdx) => {
            const isLeader = chkLeader.checked && mIdx === 0;
            const isSel = swapFirst && swapFirst.gIdx === gIdx && swapFirst.mIdx === mIdx;
            const label = window.Toolbox.getStudentLabel(student);
            return `
              <button class="member-pill ${isLeader ? "is-leader" : ""} ${isSel ? "swap-selected" : ""}"
                type="button" data-g="${gIdx}" data-m="${mIdx}">
                <span>${isLeader ? "⭐" : window.Toolbox.getAvatar(student.id)}</span>
                <span>${window.Toolbox.escapeHtml(label)}</span>
              </button>
            `;
          })
          .join("");

        card.innerHTML = `
          <div class="group-card-head">
            <div class="group-title">
              <span class="group-title-icon">${grp.icon}</span>
              <span class="group-title-text" style="color:${grp.titleColor}">${window.Toolbox.escapeHtml(grp.name)}</span>
            </div>
            <span class="group-count-tag">${grp.members.length} 人</span>
          </div>
          <div class="group-members">${membersHtml}</div>
        `;
        boardEl.appendChild(card);
      });

      // 點擊任兩位小朋友互換組別
      boardEl.querySelectorAll(".member-pill").forEach((pill) => {
        pill.addEventListener("click", (e) => {
          const gIdx = Number(e.currentTarget.dataset.g);
          const mIdx = Number(e.currentTarget.dataset.m);
          if (!swapFirst) {
            swapFirst = { gIdx, mIdx };
            window.SoundFX.click();
            updateSwapHint();
            renderGroups();
          } else if (swapFirst.gIdx === gIdx && swapFirst.mIdx === mIdx) {
            swapFirst = null;
            window.SoundFX.click();
            updateSwapHint();
            renderGroups();
          } else {
            const tmp = groups[swapFirst.gIdx].members[swapFirst.mIdx];
            groups[swapFirst.gIdx].members[swapFirst.mIdx] = groups[gIdx].members[mIdx];
            groups[gIdx].members[mIdx] = tmp;
            swapFirst = null;
            window.SoundFX.pop();
            syncActiveGroups();
            updateSwapHint();
            renderGroups();
            window.Toolbox.showToast("✅ 已互換組別並同步至集點板！");
          }
        });
      });
    }

    btnModeTeams.addEventListener("click", () => {
      mode = "teams";
      param = Math.min(8, Math.max(2, param));
      btnModeTeams.classList.add("active");
      btnModeSize.classList.remove("active");
      window.SoundFX.click();
      updateParamText();
      generateGroups(false);
    });

    btnModeSize.addEventListener("click", () => {
      mode = "size";
      param = Math.min(8, Math.max(2, param));
      btnModeSize.classList.add("active");
      btnModeTeams.classList.remove("active");
      window.SoundFX.click();
      updateParamText();
      generateGroups(false);
    });

    document.getElementById("btn-group-minus").addEventListener("click", () => {
      if (param <= 2) return;
      param--;
      window.SoundFX.click();
      updateParamText();
      generateGroups(false);
    });

    document.getElementById("btn-group-plus").addEventListener("click", () => {
      if (param >= 8) return;
      param++;
      window.SoundFX.click();
      updateParamText();
      generateGroups(false);
    });

    document.querySelectorAll("#group-category-chips .chip-btn").forEach((chip) => {
      chip.addEventListener("click", () => {
        window.SoundFX.click();
        applyCategoryToCurrentGroups(chip.dataset.groupCat);
      });
    });

    chkLeader.addEventListener("change", () => {
      window.SoundFX.click();
      renderGroups();
    });

    document.getElementById("btn-group-shuffle").addEventListener("click", () => generateGroups(true));

    // 一鍵前往分組集點
    document.getElementById("btn-group-to-stars").addEventListener("click", () => {
      syncActiveGroups();
      window.Toolbox.switchTool("stars");
      window.Toolbox.emit("openStarTeams");
    });

    window.Toolbox.on("roster", () => generateGroups(false));

    updateParamText();
    updateCategoryChips();
    if (Array.isArray(st.activeGroups) && st.activeGroups.length > 0) {
      groups = st.activeGroups.map((g, idx) => ({
        ...getMetaForIndex(category, idx),
        members: [...(g.members || [])]
      }));
      param = Math.min(8, Math.max(2, groups.length));
      updateParamText();
      syncActiveGroups();
      renderGroups();
    } else {
      generateGroups(false);
    }
  }

  /* ========================================================================
     工具 4：視覺計時器 (活動名稱可新增修改、不預設時間、大型醒目活動標示)
     ======================================================================== */
  function initTimer() {
    const RING_CIRCUMFERENCE = 2 * Math.PI * 142;
    const DEFAULT_ACTIVITIES = [
      { id: "quiet", icon: "🤫", name: "安靜一下" },
      { id: "brush", icon: "🪥", name: "洗手刷牙" },
      { id: "tidy", icon: "🧹", name: "收玩具" },
      { id: "book", icon: "📖", name: "繪本時間" },
      { id: "snack", icon: "🍎", name: "吃點心" },
      { id: "corner", icon: "🎨", name: "學習區" }
    ];

    const st = window.Toolbox.state;
    if (!Array.isArray(st.timerActivities) || st.timerActivities.length === 0) {
      st.timerActivities = DEFAULT_ACTIVITIES.map((a) => ({ ...a }));
      window.Toolbox.saveState();
    }

    let mode = "countdown";
    let totalSec = 0;
    let remainingSec = 0;
    let elapsedSec = 0;
    let running = false;
    let intervalId = null;
    let alarmKind = "chime";
    let currentActIdx = Math.min(2, st.timerActivities.length - 1);
    let draftActivities = [];
    let activeIconEditIdx = 0;

    const pieEl = document.getElementById("timer-pie");
    const ringEl = document.getElementById("timer-progress-ring");
    const digitsEl = document.getElementById("timer-digits");
    const mascotEl = document.getElementById("timer-mascot");
    const subtextEl = document.getElementById("timer-subtext");
    const badgeIconEl = document.getElementById("timer-badge-icon");
    const badgeTextEl = document.getElementById("timer-badge-text");
    const presetsGrid = document.getElementById("timer-presets");
    const btnToggle = document.getElementById("btn-timer-toggle");
    const btnReset = document.getElementById("btn-timer-reset");
    const btnCountdown = document.getElementById("btn-timer-countdown");
    const btnStopwatch = document.getElementById("btn-timer-stopwatch");
    const inputMin = document.getElementById("input-timer-min");
    const inputSec = document.getElementById("input-timer-sec");

    function updateActivityBadge() {
      if (mode === "stopwatch") {
        badgeIconEl.textContent = "⏱️";
        badgeTextEl.textContent = "碼表計時";
        return;
      }
      const act = st.timerActivities[currentActIdx] || st.timerActivities[0];
      if (act) {
        badgeIconEl.textContent = act.icon || "⏰";
        badgeTextEl.textContent = act.name || "活動計時";
      }
    }

    function renderActivityTiles() {
      if (currentActIdx >= st.timerActivities.length) {
        currentActIdx = Math.max(0, st.timerActivities.length - 1);
      }
      presetsGrid.classList.toggle("is-many", st.timerActivities.length > 6);
      presetsGrid.innerHTML = "";
      st.timerActivities.forEach((act, idx) => {
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = `preset-tile ${idx === currentActIdx ? "active" : ""}`;
        tile.innerHTML = `
          <span class="pt-icon">${window.Toolbox.escapeHtml(act.icon)}</span>
          <strong>${window.Toolbox.escapeHtml(act.name)}</strong>
        `;
        tile.addEventListener("click", () => {
          if (mode !== "countdown") switchToCountdown();
          currentActIdx = idx;
          window.SoundFX.pop();
          renderActivityTiles();
          updateActivityBadge();
        });
        presetsGrid.appendChild(tile);
      });
      updateActivityBadge();
    }

    // 計時活動編輯彈窗（含預設圖案選擇盤）
    function renderTimerEditModal() {
      const list = document.getElementById("timer-edit-list");
      const pickerGrid = document.getElementById("timer-emoji-picker");
      const targetLbl = document.getElementById("timer-picker-target-lbl");
      if (activeIconEditIdx >= draftActivities.length) {
        activeIconEditIdx = Math.max(0, draftActivities.length - 1);
      }

      list.innerHTML = "";
      draftActivities.forEach((act, idx) => {
        const row = document.createElement("div");
        row.className = "vote-edit-row";
        row.innerHTML = `
          <button class="emoji-row-btn ${idx === activeIconEditIdx ? "is-active" : ""}" type="button" data-tpick="${idx}" title="點擊選擇圖案">
            <span>${window.Toolbox.escapeHtml(act.icon)}</span><span class="emoji-caret">▾</span>
          </button>
          <input class="text-input" type="text" maxlength="12" value="${window.Toolbox.escapeHtml(act.name)}" data-tname="${idx}" placeholder="輸入活動名稱" />
          <button class="wheel-item-del" type="button" data-tdel="${idx}" ${draftActivities.length <= 1 ? "disabled" : ""}>✕</button>
        `;
        list.appendChild(row);
      });

      list.querySelectorAll("[data-tpick]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          activeIconEditIdx = Number(e.currentTarget.dataset.tpick);
          window.SoundFX.click();
          renderTimerEditModal();
        });
      });

      list.querySelectorAll("[data-tname]").forEach((inp) => {
        inp.addEventListener("input", (e) => {
          draftActivities[Number(e.target.dataset.tname)].name = e.target.value;
        });
      });

      list.querySelectorAll("[data-tdel]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          if (draftActivities.length <= 1) return;
          draftActivities.splice(Number(e.currentTarget.dataset.tdel), 1);
          window.SoundFX.click();
          renderTimerEditModal();
        });
      });

      const activeAct = draftActivities[activeIconEditIdx];
      targetLbl.textContent = `目前設定：第 ${activeIconEditIdx + 1} 項（${activeAct?.name || "活動"}）`;

      pickerGrid.innerHTML = "";
      window.Toolbox.PRESET_ICONS.forEach((icon) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `emoji-pick-btn ${activeAct && activeAct.icon === icon ? "is-current" : ""}`;
        b.textContent = icon;
        b.addEventListener("click", () => {
          if (!draftActivities[activeIconEditIdx]) return;
          draftActivities[activeIconEditIdx].icon = icon;
          window.SoundFX.pop();
          renderTimerEditModal();
        });
        pickerGrid.appendChild(b);
      });
    }

    document.getElementById("btn-timer-edit-acts").addEventListener("click", () => {
      draftActivities = st.timerActivities.map((a) => ({ ...a }));
      activeIconEditIdx = currentActIdx;
      window.SoundFX.click();
      renderTimerEditModal();
      window.Toolbox.openModal("modal-timer-edit");
    });

    document.getElementById("btn-timer-add-act").addEventListener("click", () => {
      if (draftActivities.length >= 9) {
        window.Toolbox.showToast("最多可設定 9 個常用活動喔");
        return;
      }
      const icons = window.Toolbox.PRESET_ICONS;
      draftActivities.push({
        id: "act_" + Date.now(),
        icon: icons[draftActivities.length % icons.length],
        name: `新活動 ${draftActivities.length + 1}`
      });
      activeIconEditIdx = draftActivities.length - 1;
      window.SoundFX.click();
      renderTimerEditModal();
    });

    document.getElementById("btn-timer-save-edit").addEventListener("click", () => {
      st.timerActivities = draftActivities.map((a, idx) => ({
        id: a.id || "act_" + idx,
        icon: a.icon || "⏰",
        name: a.name.trim() || `活動 ${idx + 1}`
      }));
      window.Toolbox.saveState();
      window.Toolbox.closeModal("modal-timer-edit");
      window.SoundFX.pop();
      renderActivityTiles();
      window.Toolbox.showToast("✅ 已更新計時活動名稱！");
    });

    function formatMMSS(sec) {
      const s = Math.max(0, Math.floor(sec));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    }

    function syncTimeInputs() {
      const m = Math.floor(remainingSec / 60);
      const s = remainingSec % 60;
      if (document.activeElement !== inputMin) inputMin.value = m;
      if (document.activeElement !== inputSec) inputSec.value = s;
    }

    function describePie(ratio) {
      const r = 132;
      const cx = 160;
      const cy = 160;
      if (ratio <= 0.001) return "";
      if (ratio >= 0.999) {
        return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
      }
      const angle = ratio * Math.PI * 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      const largeArc = ratio > 0.5 ? 1 : 0;
      return `M ${cx} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y} Z`;
    }

    function renderTimer() {
      if (mode === "countdown") {
        digitsEl.textContent = formatMMSS(remainingSec);
        syncTimeInputs();
        const ratio = totalSec > 0 ? remainingSec / totalSec : 0;
        ringEl.style.strokeDasharray = RING_CIRCUMFERENCE.toFixed(1);
        ringEl.style.strokeDashoffset = (RING_CIRCUMFERENCE * (1 - ratio)).toFixed(1);
        pieEl.setAttribute("d", describePie(ratio));

        if (totalSec === 0) {
          ringEl.style.stroke = "#C8DCEB";
          pieEl.style.fill = "rgba(78, 168, 222, 0.12)";
          mascotEl.textContent = "🐰";
          subtextEl.textContent = "請先於右側設定倒數時間";
        } else if (remainingSec === 0) {
          ringEl.style.stroke = "#FF6B6B";
          pieEl.style.fill = "rgba(255, 107, 107, 0.22)";
          mascotEl.textContent = "🎉";
          subtextEl.textContent = "時間到囉！大家都好棒！";
        } else if (ratio <= 0.2) {
          ringEl.style.stroke = "#FF6B6B";
          pieEl.style.fill = "rgba(255, 107, 107, 0.2)";
          mascotEl.textContent = "⏰";
          subtextEl.textContent = running ? "快要時間到囉，加油！" : "已暫停";
        } else if (ratio <= 0.45) {
          ringEl.style.stroke = "#FFB830";
          pieEl.style.fill = "rgba(255, 184, 48, 0.2)";
          mascotEl.textContent = "🐥";
          subtextEl.textContent = running ? "時間進行中，表現好棒！" : "已暫停";
        } else {
          ringEl.style.stroke = "#2EC4B6";
          pieEl.style.fill = "rgba(46, 196, 182, 0.18)";
          mascotEl.textContent = "🐰";
          subtextEl.textContent = running ? "計時進行中..." : "時間已設定，按開始計時！";
        }
      } else {
        digitsEl.textContent = formatMMSS(elapsedSec);
        const secRatio = (elapsedSec % 60) / 60;
        ringEl.style.strokeDasharray = RING_CIRCUMFERENCE.toFixed(1);
        ringEl.style.strokeDashoffset = (RING_CIRCUMFERENCE * (1 - secRatio)).toFixed(1);
        pieEl.setAttribute("d", describePie(secRatio));
        ringEl.style.stroke = "#4EA8DE";
        pieEl.style.fill = "rgba(78, 168, 222, 0.18)";
        mascotEl.textContent = running ? "🏃" : "⏱️";
        subtextEl.textContent = running ? "正數計時中..." : "碼表已就緒";
      }

      btnToggle.textContent = running ? "⏸️ 暫停" : "▶️ 開始計時";
    }

    function setCustomDuration(sec) {
      const clamped = Math.max(0, Math.min(3600, Math.floor(sec)));
      remainingSec = clamped;
      totalSec = clamped;
      renderTimer();
    }

    function applyInputsToDuration() {
      if (mode !== "countdown") switchToCountdown();
      stopTimer();
      const m = Math.max(0, Math.min(60, parseInt(inputMin.value, 10) || 0));
      const s = Math.max(0, Math.min(59, parseInt(inputSec.value, 10) || 0));
      setCustomDuration(m * 60 + s);
    }

    function stopTimer() {
      running = false;
      clearInterval(intervalId);
      intervalId = null;
      renderTimer();
    }

    function switchToCountdown() {
      stopTimer();
      mode = "countdown";
      btnCountdown.classList.add("active");
      btnStopwatch.classList.remove("active");
      updateActivityBadge();
      renderTimer();
    }

    function toggleTimer() {
      if (running) {
        window.SoundFX.click();
        stopTimer();
        return;
      }
      if (mode === "countdown") {
        if (remainingSec <= 0) {
          if (totalSec > 0) {
            remainingSec = totalSec;
          } else {
            window.Toolbox.showToast("請先在右側設定倒數時間喔！");
            window.SoundFX.softAlert();
            return;
          }
        }
      }
      window.SoundFX.pop();
      running = true;
      renderTimer();
      intervalId = setInterval(() => {
        if (mode === "countdown") {
          remainingSec--;
          if (remainingSec <= 3 && remainingSec > 0) {
            window.SoundFX.tick();
          }
          if (remainingSec <= 0) {
            remainingSec = 0;
            stopTimer();
            window.SoundFX.alarm(alarmKind);
            window.Toolbox.launchConfetti(100);
            const act = st.timerActivities[currentActIdx] || { icon: "⏰", name: "活動" };
            window.Toolbox.showCelebrate("⏰ 時間到囉！", `${act.icon} ${act.name}`, "小朋友完成得真棒，給自己拍拍手 👏");
          } else {
            renderTimer();
          }
        } else {
          elapsedSec++;
          renderTimer();
        }
      }, 1000);
    }

    btnToggle.addEventListener("click", toggleTimer);

    btnReset.addEventListener("click", () => {
      window.SoundFX.click();
      stopTimer();
      remainingSec = totalSec;
      elapsedSec = 0;
      renderTimer();
    });

    btnCountdown.addEventListener("click", () => {
      window.SoundFX.click();
      switchToCountdown();
    });

    btnStopwatch.addEventListener("click", () => {
      stopTimer();
      mode = "stopwatch";
      btnStopwatch.classList.add("active");
      btnCountdown.classList.remove("active");
      updateActivityBadge();
      window.SoundFX.click();
      renderTimer();
    });

    inputMin.addEventListener("input", applyInputsToDuration);
    inputSec.addEventListener("input", applyInputsToDuration);

    document.getElementById("btn-min-minus").addEventListener("click", () => {
      if (mode !== "countdown") switchToCountdown();
      stopTimer();
      window.SoundFX.click();
      setCustomDuration(Math.max(0, remainingSec - 60));
    });
    document.getElementById("btn-min-plus").addEventListener("click", () => {
      if (mode !== "countdown") switchToCountdown();
      stopTimer();
      window.SoundFX.click();
      setCustomDuration(Math.min(3600, remainingSec + 60));
    });
    document.getElementById("btn-sec-minus").addEventListener("click", () => {
      if (mode !== "countdown") switchToCountdown();
      stopTimer();
      window.SoundFX.click();
      setCustomDuration(Math.max(0, remainingSec - 10));
    });
    document.getElementById("btn-sec-plus").addEventListener("click", () => {
      if (mode !== "countdown") switchToCountdown();
      stopTimer();
      window.SoundFX.click();
      setCustomDuration(Math.min(3600, remainingSec + 10));
    });

    document.querySelectorAll("[data-adj]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (mode !== "countdown") switchToCountdown();
        const delta = Number(btn.dataset.adj);
        remainingSec = Math.max(0, Math.min(3600, remainingSec + delta));
        if (!running || remainingSec > totalSec) {
          totalSec = remainingSec;
        }
        window.SoundFX.click();
        renderTimer();
      });
    });

    document.getElementById("btn-timer-clear").addEventListener("click", () => {
      stopTimer();
      window.SoundFX.click();
      setCustomDuration(0);
    });

    document.querySelectorAll("#timer-sound-choices .chip-btn").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.querySelectorAll("#timer-sound-choices .chip-btn").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        alarmKind = chip.dataset.alarm;
        window.SoundFX.alarm(alarmKind);
      });
    });

    renderActivityTiles();
    renderTimer();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initSpinner();
    initSeatPicker();
    initGroupMaker();
    initTimer();
  });
})();
