/* ==========================================================================
   tools-extra.js — 工具 5~8：快樂投票、音量紅綠燈、星星集點板、趣味大骰子
   ========================================================================== */
(function () {
  /* ========================================================================
     工具 5：快樂投票 (預設隱藏票數、支援新增與修改自訂主題)
     ======================================================================== */
  function initVoting() {
    const BAR_COLORS = ["#FF6B6B", "#FFB830", "#2EC4B6", "#4EA8DE", "#8B6FF0", "#FF8C5A"];
    const DEFAULT_VOTE_THEMES = [
      {
        id: "story",
        topic: "今天故事時間想聽哪一本？",
        options: [
          { emoji: "🐷", title: "三隻小豬", votes: 0 },
          { emoji: "🧣", title: "小紅帽", votes: 0 },
          { emoji: "🐛", title: "好餓毛毛蟲", votes: 0 },
          { emoji: "🐰", title: "猜猜我有多愛你", votes: 0 }
        ]
      },
      {
        id: "song",
        topic: "律動時間想跳哪一首歌？",
        options: [
          { emoji: "⭐", title: "小星星", votes: 0 },
          { emoji: "🐯", title: "兩隻老虎", votes: 0 },
          { emoji: "🦋", title: "蝴蝶飛呀飛", votes: 0 },
          { emoji: "🚜", title: "王老先生有塊地", votes: 0 }
        ]
      },
      {
        id: "mood",
        topic: "小朋友，今天的心情如何呢？",
        options: [
          { emoji: "😄", title: "超級開心", votes: 0 },
          { emoji: "😊", title: "平靜舒服", votes: 0 },
          { emoji: "😴", title: "有點想睡", votes: 0 },
          { emoji: "🤗", title: "想要抱抱", votes: 0 }
        ]
      },
      {
        id: "snack",
        topic: "最喜歡的點心是哪一樣？",
        options: [
          { emoji: "🍎", title: "脆脆蘋果", votes: 0 },
          { emoji: "🍌", title: "香甜香蕉", votes: 0 },
          { emoji: "🍪", title: "奶油餅乾", votes: 0 },
          { emoji: "🥛", title: "鮮奶牛奶", votes: 0 }
        ]
      },
      {
        id: "yesno",
        topic: "這個提議大家贊成嗎？",
        options: [
          { emoji: "👍", title: "我贊成！", votes: 0 },
          { emoji: "🤔", title: "再想想看", votes: 0 }
        ]
      }
    ];

    const st = window.Toolbox.state;
    if (!Array.isArray(st.voteThemes) || st.voteThemes.length === 0) {
      st.voteThemes = DEFAULT_VOTE_THEMES.map((t) => ({
        id: t.id,
        topic: t.topic,
        options: t.options.map((o) => ({ ...o }))
      }));
      window.Toolbox.saveState();
    }

    let currentTopicId = st.voteThemes[0].id;
    let blindMode = true; // 預設先隱藏票數
    let crowned = false;
    let draftOptions = [];

    const topicInput = document.getElementById("input-vote-topic");
    const chipsWrap = document.getElementById("vote-theme-chips");
    const boardEl = document.getElementById("vote-board");
    const totalEl = document.getElementById("vote-total-text");
    const btnBlind = document.getElementById("btn-vote-blind");
    const btnNewTopic = document.getElementById("btn-vote-new-topic");
    const btnDelTopic = document.getElementById("btn-vote-del-topic");

    function getCurrentTopic() {
      return st.voteThemes.find((t) => t.id === currentTopicId) || st.voteThemes[0];
    }

    function syncBlindButton() {
      btnBlind.classList.toggle("active-toggle", blindMode);
      btnBlind.textContent = blindMode ? "👁️ 顯示票數" : "👁️ 隱藏票數";
    }

    function renderThemeChips() {
      chipsWrap.innerHTML = "";
      st.voteThemes.forEach((theme) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = `chip-btn ${theme.id === currentTopicId ? "active" : ""}`;
        const shortLabel = theme.topic.length > 10 ? theme.topic.slice(0, 10) + "…" : theme.topic;
        chip.textContent = shortLabel || "未命名主題";
        chip.title = theme.topic;
        chip.addEventListener("click", () => {
          currentTopicId = theme.id;
          crowned = false;
          blindMode = true;
          syncBlindButton();
          topicInput.value = theme.topic;
          window.SoundFX.click();
          renderThemeChips();
          renderBoard();
        });
        chipsWrap.appendChild(chip);
      });
      btnDelTopic.disabled = st.voteThemes.length <= 1;
    }

    function renderBoard() {
      const cur = getCurrentTopic();
      const options = cur.options;
      if (document.activeElement !== topicInput) {
        topicInput.value = cur.topic;
      }

      const total = options.reduce((sum, o) => sum + o.votes, 0);
      const maxVotes = Math.max(0, ...options.map((o) => o.votes));
      totalEl.textContent = blindMode ? `總投票數：${total} 票（票數隱藏中）` : `總投票數：${total} 票`;

      boardEl.innerHTML = "";
      options.forEach((opt, idx) => {
        const color = BAR_COLORS[idx % BAR_COLORS.length];
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        const barHeight = blindMode ? 12 : maxVotes > 0 ? Math.max(10, Math.round((opt.votes / maxVotes) * 100)) : 8;
        const isWinner = crowned && !blindMode && maxVotes > 0 && opt.votes === maxVotes;

        const card = document.createElement("div");
        card.className = `vote-card ${isWinner ? "is-winner" : ""}`;
        card.innerHTML = `
          ${isWinner ? '<div class="vote-crown">👑</div>' : ""}
          <div class="vote-bar-area">
            <div class="vote-num-badge">
              ${blindMode ? "？" : opt.votes}
              ${!blindMode ? `<span class="vote-pct">${pct}%</span>` : ""}
            </div>
            <div class="vote-bar-track">
              <div class="vote-bar-fill" style="height:${barHeight}%;background:${blindMode ? "#D6C9B8" : color}"></div>
            </div>
          </div>
          <div class="vote-label-area">
            <div class="vote-opt-emoji">${window.Toolbox.escapeHtml(opt.emoji)}</div>
            <div class="vote-opt-title">${window.Toolbox.escapeHtml(opt.title)}</div>
          </div>
          <div class="vote-tap-row">
            <button class="vote-plus-btn" style="background:${color}" data-vote-add="${idx}" type="button">＋1 票</button>
            <button class="vote-minus-btn" data-vote-sub="${idx}" type="button" title="減一票">－</button>
          </div>
        `;
        boardEl.appendChild(card);
      });

      boardEl.querySelectorAll("[data-vote-add]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const i = Number(e.currentTarget.dataset.voteAdd);
          cur.options[i].votes++;
          crowned = false;
          window.Toolbox.saveState();
          window.SoundFX.vote();
          renderBoard();
        });
      });

      boardEl.querySelectorAll("[data-vote-sub]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const i = Number(e.currentTarget.dataset.voteSub);
          if (cur.options[i].votes > 0) {
            cur.options[i].votes--;
            crowned = false;
            window.Toolbox.saveState();
            window.SoundFX.click();
            renderBoard();
          }
        });
      });
    }

    // 修改目前投票主題名稱
    topicInput.addEventListener("input", () => {
      const cur = getCurrentTopic();
      cur.topic = topicInput.value.trim() || "未命名投票主題";
      window.Toolbox.saveState();
      renderThemeChips();
    });

    // 新增投票主題
    btnNewTopic.addEventListener("click", () => {
      const newTopic = {
        id: "vote_" + Date.now(),
        topic: `自訂投票主題 ${st.voteThemes.length + 1}`,
        options: [
          { emoji: "🌟", title: "選項 1", votes: 0 },
          { emoji: "🌈", title: "選項 2", votes: 0 },
          { emoji: "🎈", title: "選項 3", votes: 0 }
        ]
      };
      st.voteThemes.push(newTopic);
      currentTopicId = newTopic.id;
      crowned = false;
      blindMode = true;
      window.Toolbox.saveState();
      syncBlindButton();
      renderThemeChips();
      renderBoard();
      window.SoundFX.pop();
      window.Toolbox.showToast("已新增投票主題！可直接修改名稱與選項");
      topicInput.focus();
      topicInput.select();
    });

    // 刪除目前投票主題
    btnDelTopic.addEventListener("click", () => {
      if (st.voteThemes.length <= 1) return;
      const idx = st.voteThemes.findIndex((t) => t.id === currentTopicId);
      if (idx === -1) return;
      st.voteThemes.splice(idx, 1);
      currentTopicId = st.voteThemes[Math.max(0, idx - 1)].id;
      crowned = false;
      blindMode = true;
      window.Toolbox.saveState();
      syncBlindButton();
      renderThemeChips();
      renderBoard();
      window.SoundFX.click();
      window.Toolbox.showToast("已刪除該投票主題");
    });

    btnBlind.addEventListener("click", () => {
      blindMode = !blindMode;
      syncBlindButton();
      window.SoundFX.click();
      renderBoard();
    });

    document.getElementById("btn-vote-crown").addEventListener("click", () => {
      const options = getCurrentTopic().options;
      const total = options.reduce((sum, o) => sum + o.votes, 0);
      if (total === 0) {
        window.Toolbox.showToast("還沒有小朋友投票喔！");
        return;
      }
      blindMode = false;
      syncBlindButton();
      crowned = true;
      renderBoard();

      const maxVotes = Math.max(...options.map((o) => o.votes));
      const winners = options.filter((o) => o.votes === maxVotes);
      const winText = winners.map((w) => `${w.emoji} ${w.title}`).join(" & ");
      window.Toolbox.showCelebrate("👑 人氣最高票揭曉！", winText, `獲得 ${maxVotes} 票！大家拍拍手 👏`);
    });

    document.getElementById("btn-vote-reset").addEventListener("click", () => {
      const cur = getCurrentTopic();
      cur.options.forEach((o) => (o.votes = 0));
      crowned = false;
      window.Toolbox.saveState();
      window.SoundFX.click();
      renderBoard();
      window.Toolbox.showToast("票數已歸零");
    });

    let activeVoteEmojiIdx = 0;

    function renderEditModal() {
      const list = document.getElementById("vote-edit-list");
      const pickerGrid = document.getElementById("vote-emoji-picker");
      const targetLbl = document.getElementById("vote-picker-target-lbl");
      if (activeVoteEmojiIdx >= draftOptions.length) {
        activeVoteEmojiIdx = Math.max(0, draftOptions.length - 1);
      }

      list.innerHTML = "";
      draftOptions.forEach((opt, idx) => {
        const row = document.createElement("div");
        row.className = "vote-edit-row";
        row.innerHTML = `
          <button class="emoji-row-btn ${idx === activeVoteEmojiIdx ? "is-active" : ""}" type="button" data-eidx="${idx}" title="點擊選擇圖案">
            <span>${window.Toolbox.escapeHtml(opt.emoji)}</span><span class="emoji-caret">▾</span>
          </button>
          <input class="text-input" type="text" maxlength="16" value="${window.Toolbox.escapeHtml(opt.title)}" data-tidx="${idx}" placeholder="選項名稱" />
          <button class="wheel-item-del" type="button" data-didx="${idx}" ${draftOptions.length <= 2 ? "disabled" : ""}>✕</button>
        `;
        list.appendChild(row);
      });

      list.querySelectorAll("[data-eidx]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          activeVoteEmojiIdx = Number(e.currentTarget.dataset.eidx);
          window.SoundFX.click();
          renderEditModal();
        });
      });
      list.querySelectorAll("[data-tidx]").forEach((inp) => {
        inp.addEventListener("input", (e) => {
          draftOptions[Number(e.target.dataset.tidx)].title = e.target.value;
        });
      });
      list.querySelectorAll("[data-didx]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          if (draftOptions.length <= 2) return;
          draftOptions.splice(Number(e.currentTarget.dataset.didx), 1);
          window.SoundFX.click();
          renderEditModal();
        });
      });

      const activeOpt = draftOptions[activeVoteEmojiIdx];
      targetLbl.textContent = `目前設定：第 ${activeVoteEmojiIdx + 1} 項（${activeOpt?.title || "選項"}）`;

      pickerGrid.innerHTML = "";
      window.Toolbox.PRESET_ICONS.forEach((icon) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `emoji-pick-btn ${activeOpt && activeOpt.emoji === icon ? "is-current" : ""}`;
        b.textContent = icon;
        b.addEventListener("click", () => {
          if (!draftOptions[activeVoteEmojiIdx]) return;
          draftOptions[activeVoteEmojiIdx].emoji = icon;
          window.SoundFX.pop();
          renderEditModal();
        });
        pickerGrid.appendChild(b);
      });
    }

    document.getElementById("btn-vote-edit").addEventListener("click", () => {
      draftOptions = getCurrentTopic().options.map((o) => ({ ...o }));
      activeVoteEmojiIdx = 0;
      renderEditModal();
      window.Toolbox.openModal("modal-vote-edit");
    });

    document.getElementById("btn-vote-add-opt").addEventListener("click", () => {
      if (draftOptions.length >= 6) {
        window.Toolbox.showToast("最多可設定 6 個投票選項喔");
        return;
      }
      const emojis = ["🌈", "🎈", "🍓", "🧸", "🎨", "🎵"];
      draftOptions.push({ emoji: emojis[draftOptions.length % emojis.length], title: `選項 ${draftOptions.length + 1}`, votes: 0 });
      activeVoteEmojiIdx = draftOptions.length - 1;
      window.SoundFX.click();
      renderEditModal();
    });

    document.getElementById("btn-vote-save-edit").addEventListener("click", () => {
      const cur = getCurrentTopic();
      cur.options = draftOptions.map((o, idx) => ({
        emoji: o.emoji.trim() || "⭐",
        title: o.title.trim() || `選項 ${idx + 1}`,
        votes: o.votes || 0
      }));
      crowned = false;
      window.Toolbox.saveState();
      window.Toolbox.closeModal("modal-vote-edit");
      window.SoundFX.pop();
      renderBoard();
    });

    syncBlindButton();
    renderThemeChips();
    renderBoard();
  }

  /* ========================================================================
     工具 6：音量紅綠燈 (老師手動三段模式 ＋ 擬真動態波形)
     ======================================================================== */
  function initNoiseMeter() {
    const LEVELS = {
      green: {
        emoji: "🌿",
        headline: "輕聲細語・好棒喔！",
        desc: "現在的聲音像微風一樣溫柔，大家都能專心聽故事～",
        badge: "🌿 溫柔微風",
        waveHint: "平穩柔和波動中",
        minH: 14,
        amp: 20,
        speed: 2.2,
        gradient: "linear-gradient(180deg, #6EE798 0%, #2EB85C 100%)"
      },
      yellow: {
        emoji: "🐝",
        headline: "小小聲討論時間",
        desc: "像小蜜蜂一樣嗡嗡嗡，只有隔壁的小朋友聽得到喔！",
        badge: "🐝 輕快討論",
        waveHint: "適中活潑跳動中",
        minH: 28,
        amp: 36,
        speed: 4.5,
        gradient: "linear-gradient(180deg, #FFE066 0%, #F5A623 100%)"
      },
      red: {
        emoji: "🤫",
        headline: "聲音太大囉！深呼吸～",
        desc: "小耳朵有點累了，我們一起數一二三，回到好聲音吧！",
        badge: "📢 音量過高",
        waveHint: "強烈高波警示中！",
        minH: 48,
        amp: 48,
        speed: 8.2,
        gradient: "linear-gradient(180deg, #FF9494 0%, #E84545 100%)"
      }
    };

    let currentLevel = "green";
    let waveRaf = null;
    let phase = 0;

    const panelEl = document.querySelector(".noise-light-panel");
    const emojiEl = document.getElementById("noise-emoji");
    const headlineEl = document.getElementById("noise-headline");
    const descEl = document.getElementById("noise-desc");
    const barsWrap = document.getElementById("noise-meter-bars");
    const dbText = document.getElementById("noise-db-text");
    const waveHint = document.getElementById("noise-wave-hint");

    // 建立 20 條流暢動態音量條，各自帶不同頻率偏移讓波形自然生動
    const BAR_COUNT = 20;
    const bars = [];
    const barSeeds = [];
    for (let i = 0; i < BAR_COUNT; i++) {
      const b = document.createElement("div");
      b.className = "meter-bar";
      barsWrap.appendChild(b);
      bars.push(b);
      barSeeds.push({
        freq1: 0.55 + (i % 5) * 0.19,
        freq2: 1.15 + ((i * 3) % 7) * 0.14,
        offset: i * 0.48
      });
    }

    function renderWaveFrame() {
      const cfg = LEVELS[currentLevel];
      phase += 0.016 * cfg.speed;

      for (let i = 0; i < BAR_COUNT; i++) {
        const s = barSeeds[i];
        // 中間略高、兩側漸低的山丘包絡線
        const envelope = 0.58 + 0.42 * Math.sin((i / (BAR_COUNT - 1)) * Math.PI);
        const w1 = Math.sin(phase * s.freq1 + s.offset);
        const w2 = Math.sin(phase * s.freq2 - s.offset * 0.7) * 0.55;
        const w3 = Math.cos(phase * 1.8 + i * 0.85) * 0.3;
        const norm = (w1 + w2 + w3 + 1.85) / 3.7; // 約落在 0 ~ 1
        const heightPct = Math.max(10, Math.min(98, cfg.minH + norm * cfg.amp * envelope));
        bars[i].style.height = `${heightPct.toFixed(1)}%`;
      }

      if (window.Toolbox.getCurrentTool() === "noise") {
        waveRaf = requestAnimationFrame(renderWaveFrame);
      } else {
        waveRaf = null;
      }
    }

    function ensureWaveRunning() {
      if (!waveRaf && window.Toolbox.getCurrentTool() === "noise") {
        waveRaf = requestAnimationFrame(renderWaveFrame);
      }
    }

    function setLevel(level) {
      currentLevel = level;
      panelEl.classList.remove("state-green", "state-yellow", "state-red");
      panelEl.classList.add(`state-${level}`);

      ["red", "yellow", "green"].forEach((lv) => {
        document.getElementById(`bulb-${lv}`).classList.toggle("active", lv === level);
      });
      document.querySelectorAll(".noise-quick-btn").forEach((btn) => {
        btn.classList.toggle("active-level", btn.dataset.level === level);
      });

      const info = LEVELS[level];
      emojiEl.textContent = info.emoji;
      headlineEl.textContent = info.headline;
      descEl.textContent = info.desc;
      dbText.textContent = info.badge;
      waveHint.textContent = info.waveHint;

      bars.forEach((bar) => {
        bar.style.background = info.gradient;
      });
      ensureWaveRunning();
    }

    document.querySelectorAll("[data-level]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lv = btn.dataset.level;
        if (lv === "red") window.SoundFX.softAlert();
        else window.SoundFX.pop();
        setLevel(lv);
      });
    });

    window.Toolbox.on("toolChange", (toolId) => {
      if (toolId === "noise") {
        ensureWaveRunning();
      } else if (waveRaf) {
        cancelAnimationFrame(waveRaf);
        waveRaf = null;
      }
    });

    setLevel("green");
  }

  /* ========================================================================
     工具 7：星星集點板 (預設先顯示分組集點、放大圖示與醒目王冠)
     ======================================================================== */
  function initStarRewards() {
    const FALLBACK_TEAMS = [
      { name: "小熊組", icon: "🐻", bg: "#FFF2E2", border: "#F4B36C", titleColor: "#A65300", btn: "btn-amber", members: [] },
      { name: "小兔組", icon: "🐰", bg: "#FFF0F4", border: "#F7A1B8", titleColor: "#B3365B", btn: "btn-coral", members: [] },
      { name: "小貓組", icon: "🐱", bg: "#EDFBF2", border: "#7FD89E", titleColor: "#1E8245", btn: "btn-mint", members: [] },
      { name: "小狗組", icon: "🐶", bg: "#EAF8FF", border: "#84C5F4", titleColor: "#1D6DA8", btn: "btn-sky", members: [] }
    ];

    const st = window.Toolbox.state;
    if (typeof st.jarStars !== "number") st.jarStars = 5;
    if (typeof st.jarGoal !== "number") st.jarGoal = 20;
    if (!Array.isArray(st.teamScores) || st.teamScores.length < 8) {
      st.teamScores = [0, 0, 0, 0, 0, 0, 0, 0];
    }

    const jarFill = document.getElementById("jar-fill-level");
    const jarField = document.getElementById("jar-stars-field");
    const jarCurrent = document.getElementById("jar-current-num");
    const jarGoalNum = document.getElementById("jar-goal-num");
    const jarBar = document.getElementById("jar-progress-bar");
    const jarEncourage = document.getElementById("jar-encourage");
    const teamGrid = document.getElementById("team-score-grid");
    const syncBadge = document.getElementById("stars-sync-badge");

    const tabJar = document.getElementById("btn-stars-tab-jar");
    const tabTeams = document.getElementById("btn-stars-tab-teams");
    const subJar = document.getElementById("subview-jar");
    const subTeams = document.getElementById("subview-teams");
    const ctrlJar = document.getElementById("stars-jar-controls");
    const ctrlTeams = document.getElementById("stars-team-controls");

    function showJarTab() {
      tabJar.classList.add("active");
      tabTeams.classList.remove("active");
      subJar.classList.add("active");
      subTeams.classList.remove("active");
      ctrlJar.style.display = "flex";
      ctrlTeams.style.display = "none";
    }

    function showTeamsTab() {
      tabTeams.classList.add("active");
      tabJar.classList.remove("active");
      subTeams.classList.add("active");
      subJar.classList.remove("active");
      ctrlTeams.style.display = "flex";
      ctrlJar.style.display = "none";
      renderTeamScores();
    }

    function renderJar() {
      const pct = Math.min(100, Math.round((st.jarStars / st.jarGoal) * 100));
      jarCurrent.textContent = st.jarStars;
      jarGoalNum.textContent = st.jarGoal;
      jarFill.style.height = `${pct}%`;
      jarBar.style.width = `${pct}%`;

      const visualCount = Math.min(36, st.jarStars);
      jarField.innerHTML = "";
      for (let i = 0; i < visualCount; i++) {
        const sp = document.createElement("span");
        sp.className = "jar-star-item";
        sp.textContent = i % 5 === 4 ? "🌟" : "⭐";
        jarField.appendChild(sp);
      }

      if (st.jarStars >= st.jarGoal) {
        jarEncourage.textContent = "🎉 許願罐集滿囉！全班超厲害！";
      } else if (pct >= 70) {
        jarEncourage.textContent = `只差 ${st.jarGoal - st.jarStars} 顆就集滿囉，加油加油！`;
      } else if (st.jarStars > 0) {
        jarEncourage.textContent = "好棒的表現，繼續收集閃亮星星吧！";
      } else {
        jarEncourage.textContent = "全班一起收集閃亮亮的星星吧！";
      }

      document.querySelectorAll("[data-jar-goal]").forEach((btn) => {
        btn.classList.toggle("active", Number(btn.dataset.jarGoal) === st.jarGoal);
      });
    }

    function addJarStars(delta) {
      const prev = st.jarStars;
      st.jarStars = Math.max(0, Math.min(99, st.jarStars + delta));
      window.Toolbox.saveState();
      renderJar();

      if (delta > 0) {
        window.SoundFX.star();
        if (prev < st.jarGoal && st.jarStars >= st.jarGoal) {
          window.Toolbox.showCelebrate("🌟 星星許願罐集滿啦！", `${st.jarGoal} 顆星星達成！`, "全班小朋友都超棒，可以獲得神秘大獎勵喔！🎉");
        }
      } else {
        window.SoundFX.click();
      }
    }

    function renderTeamScores() {
      const linkedGroups =
        Array.isArray(st.activeGroups) && st.activeGroups.length > 0
          ? st.activeGroups
          : FALLBACK_TEAMS;

      const count = linkedGroups.length;
      const activeScores = linkedGroups.map((_, i) => st.teamScores[i] || 0);
      const maxScore = Math.max(0, ...activeScores);

      if (syncBadge) {
        syncBadge.textContent = `🔗 已連動「快樂分組」共 ${count} 組`;
      }

      const cols = count <= 4 ? count : count <= 6 ? 3 : 4;
      teamGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      teamGrid.classList.toggle("is-multi-row", count > 4);
      teamGrid.innerHTML = "";

      linkedGroups.forEach((grp, i) => {
        const pts = st.teamScores[i] || 0;
        const isLead = maxScore > 0 && pts === maxScore;
        const starsStr = pts > 0 ? "⭐".repeat(Math.min(12, pts)) + (pts > 12 ? ` +${pts - 12}` : "") : "準備出發！";

        const members = grp.members || [];
        const memberSummary =
          members.length > 0
            ? members
                .slice(0, 4)
                .map((m) => (m.name ? m.name : window.Toolbox.formatSeatNum(m.id) + "號"))
                .join("、") + (members.length > 4 ? ` 等${members.length}人` : ` (${members.length}人)`)
            : "尚未分配成員";

        const card = document.createElement("div");
        card.className = `team-score-card ${isLead ? "is-leading" : ""}`;
        card.style.background = grp.bg || "#FFF8EC";
        card.style.borderColor = isLead ? "#F5B700" : grp.border || "#EBDAC3";
        card.innerHTML = `
          ${isLead ? '<div class="team-crown" aria-label="領先王冠">👑</div>' : ""}
          <div class="team-mascot-big">${grp.icon || "⭐"}</div>
          <div class="team-name-big" style="color:${grp.titleColor || "var(--ink)"}">${window.Toolbox.escapeHtml(grp.name)}</div>
          <div class="team-members-preview" title="${window.Toolbox.escapeHtml(memberSummary)}">${window.Toolbox.escapeHtml(memberSummary)}</div>
          <div class="team-pts-big">${pts}</div>
          <div class="team-stars-visual">${starsStr}</div>
          <div class="team-btn-row">
            <button class="btn-primary ${grp.btn || "btn-amber"}" data-team-add="${i}" type="button">⭐ ＋1</button>
            <button class="btn-soft" data-team-sub="${i}" type="button">－</button>
          </div>
        `;
        teamGrid.appendChild(card);
      });

      teamGrid.querySelectorAll("[data-team-add]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const i = Number(e.currentTarget.dataset.teamAdd);
          st.teamScores[i] = (st.teamScores[i] || 0) + 1;
          window.Toolbox.saveState();
          window.SoundFX.star();
          renderTeamScores();
        });
      });

      teamGrid.querySelectorAll("[data-team-sub]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const i = Number(e.currentTarget.dataset.teamSub);
          if ((st.teamScores[i] || 0) > 0) {
            st.teamScores[i]--;
            window.Toolbox.saveState();
            window.SoundFX.click();
            renderTeamScores();
          }
        });
      });
    }

    tabJar.addEventListener("click", () => {
      window.SoundFX.click();
      showJarTab();
    });

    tabTeams.addEventListener("click", () => {
      window.SoundFX.click();
      showTeamsTab();
    });

    document.getElementById("btn-jar-add1").addEventListener("click", () => addJarStars(1));
    document.getElementById("btn-jar-add5").addEventListener("click", () => addJarStars(5));
    document.getElementById("btn-jar-sub1").addEventListener("click", () => addJarStars(-1));

    document.getElementById("btn-jar-reset").addEventListener("click", () => {
      st.jarStars = 0;
      window.Toolbox.saveState();
      window.SoundFX.click();
      renderJar();
      window.Toolbox.showToast("已清空星星罐");
    });

    document.querySelectorAll("[data-jar-goal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        st.jarGoal = Number(btn.dataset.jarGoal);
        window.Toolbox.saveState();
        window.SoundFX.click();
        renderJar();
      });
    });

    document.getElementById("btn-stars-back-group").addEventListener("click", () => {
      window.Toolbox.switchTool("group");
    });

    document.getElementById("btn-teams-reset").addEventListener("click", () => {
      st.teamScores = [0, 0, 0, 0, 0, 0, 0, 0];
      window.Toolbox.saveState();
      window.SoundFX.click();
      renderTeamScores();
      window.Toolbox.showToast("分組星星分數已全部歸零");
    });

    window.Toolbox.on("groupsChanged", renderTeamScores);
    window.Toolbox.on("openStarTeams", showTeamsTab);

    renderJar();
    showTeamsTab(); // 預設先顯示分組集點
  }

  /* ========================================================================
     工具 8：趣味大骰子 (單顆大骰子・數字/顏色/注音符號/結合韻/英文大小寫)
     ======================================================================== */
  function initDice() {
    const PIP_MAP = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };

    const CARD_PALETTES = [
      { bg: "#FFF1F1", border: "#FF9B9B" },
      { bg: "#FFF5E6", border: "#FFB866" },
      { bg: "#FFFCE6", border: "#F2CF57" },
      { bg: "#EBFAF0", border: "#7AD69B" },
      { bg: "#EAF6FF", border: "#7DC0F5" },
      { bg: "#F4EEFF", border: "#B79EF7" }
    ];

    const ZHUYIN_37 = [
      "ㄅ", "ㄆ", "ㄇ", "ㄈ", "ㄉ", "ㄊ", "ㄋ", "ㄌ",
      "ㄍ", "ㄎ", "ㄏ", "ㄐ", "ㄑ", "ㄒ", "ㄓ", "ㄔ",
      "ㄕ", "ㄖ", "ㄗ", "ㄘ", "ㄙ", "ㄧ", "ㄨ", "ㄩ",
      "ㄚ", "ㄛ", "ㄜ", "ㄝ", "ㄞ", "ㄟ", "ㄠ", "ㄡ",
      "ㄢ", "ㄣ", "ㄤ", "ㄥ", "ㄦ"
    ];

    const COMPOUND_22 = [
      "ㄧㄚ", "ㄧㄛ", "ㄧㄝ", "ㄧㄞ", "ㄧㄠ", "ㄧㄡ", "ㄧㄢ", "ㄧㄣ", "ㄧㄤ", "ㄧㄥ",
      "ㄨㄚ", "ㄨㄛ", "ㄨㄞ", "ㄨㄟ", "ㄨㄢ", "ㄨㄣ", "ㄨㄤ", "ㄨㄥ",
      "ㄩㄝ", "ㄩㄢ", "ㄩㄣ", "ㄩㄥ"
    ];

    const UPPER_26 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const LOWER_26 = "abcdefghijklmnopqrstuvwxyz".split("");

    const MODES = {
      number: [1, 2, 3, 4, 5, 6],
      color: [
        { emoji: "❤️", label: "紅色", bg: "#FFE5E5", border: "#FF7A7A" },
        { emoji: "🧡", label: "橘色", bg: "#FFF0E0", border: "#FFA057" },
        { emoji: "💛", label: "黃色", bg: "#FFFBE0", border: "#F7C948" },
        { emoji: "💚", label: "綠色", bg: "#E6FAF0", border: "#52C98A" },
        { emoji: "💙", label: "藍色", bg: "#E5F3FF", border: "#5AA9E6" },
        { emoji: "💜", label: "紫色", bg: "#F2EBFF", border: "#9E7CF5" }
      ],
      zhuyin: ZHUYIN_37,
      compound: COMPOUND_22,
      upper: UPPER_26,
      lower: LOWER_26
    };

    const LITERACY_PROMPTS = {
      number: [
        "🎲 大家一起數一數，上面有幾個點點呢？",
        "👀 眼睛看一看，用手指頭比出點數吧！",
        "👏 數好了嗎？大聲說出答案吧！"
      ],
      zhuyin: [
        "📣 大聲唸出這個注音，想想看可以造什麼詞？",
        "🗣️ 跟著老師一起大聲唸出來吧！",
        "🌟 誰知道哪個字有這個注音呢？舉手說說看！"
      ],
      compound: [
        "📣 大家一起拼拼看，大聲唸出來！",
        "🗣️ 唸唸看這個結合韻，想想有哪些語詞？",
        "👏 聲音響亮最厲害，一起大聲唸一遍！"
      ],
      upper: [
        "📣 大聲唸出這個大寫英文字母吧！",
        "🗣️ 想想看它的發音和小寫好朋友長怎樣？",
        "🌟 誰能說出這個字母開頭的英文單字呢？"
      ],
      lower: [
        "📣 大聲唸出這個小寫英文字母吧！",
        "🗣️ 找找看它的大寫好朋友是誰呢？",
        "👏 一起大聲唸出來，唸對了拍拍手！"
      ]
    };

    let mode = "number";
    let faceValue = 0;
    let rolling = false;
    let promptCursor = 0;

    const stageRow = document.getElementById("dice-stage-row");
    const bannerEl = document.getElementById("dice-result-banner");
    const btnRoll = document.getElementById("btn-dice-roll");

    function randomIndexForMode() {
      return Math.floor(Math.random() * MODES[mode].length);
    }

    function buildDieHtml(faceIdx) {
      const list = MODES[mode];
      const safeIdx = faceIdx % list.length;

      if (mode === "number") {
        const num = list[safeIdx];
        const pips = PIP_MAP[num];
        const isRed = num === 1 || num === 4;
        let cells = "";
        for (let i = 0; i < 9; i++) {
          cells += pips.includes(i) ? `<span class="pip ${isRed ? "is-red" : ""}"></span>` : "<span></span>";
        }
        return `<div class="die-pips">${cells}</div>`;
      }

      if (mode === "color") {
        const face = list[safeIdx];
        return `
          <div class="die-face-emoji">${face.emoji}</div>
          <div class="die-face-label">${face.label}</div>
        `;
      }

      if (mode === "compound") {
        const str = list[safeIdx];
        return `
          <div class="die-face-compound">
            <span>${str[0]}</span>
            <span>${str[1]}</span>
          </div>
        `;
      }

      const ch = list[safeIdx];
      return `<div class="die-face-char">${ch}</div>`;
    }

    function renderDice(isRolling = false) {
      const list = MODES[mode];
      const safeIdx = faceValue % list.length;
      stageRow.innerHTML = "";

      const die = document.createElement("div");
      die.className = `big-die ${isRolling ? "rolling" : ""}`;

      if (mode === "color") {
        const face = list[safeIdx];
        die.style.background = face.bg;
        die.style.borderColor = face.border;
      } else if (mode !== "number") {
        const pal = CARD_PALETTES[safeIdx % CARD_PALETTES.length];
        die.style.background = pal.bg;
        die.style.borderColor = pal.border;
      }

      die.innerHTML = buildDieHtml(safeIdx);
      die.addEventListener("click", rollDice);
      stageRow.appendChild(die);
    }

    function updateBanner() {
      const list = MODES[mode];
      if (mode === "color") {
        const f = list[faceValue % list.length];
        bannerEl.textContent = `🎨 找找看，教室裡哪裡有「${f.label}」呢？`;
        return;
      }

      const prompts = LITERACY_PROMPTS[mode];
      bannerEl.textContent = prompts[promptCursor % prompts.length];
      promptCursor++;
    }

    function rollDice() {
      if (rolling) return;
      rolling = true;
      btnRoll.disabled = true;
      bannerEl.textContent = "🎲 骰子滾動中⋯⋯";
      window.SoundFX.diceRattle();

      let step = 0;
      const timer = setInterval(() => {
        step++;
        faceValue = randomIndexForMode();
        renderDice(true);
        if (step >= 10) {
          clearInterval(timer);
          faceValue = randomIndexForMode();
          renderDice(false);
          updateBanner();
          window.SoundFX.pop();
          rolling = false;
          btnRoll.disabled = false;
        }
      }, 65);
    }

    document.querySelectorAll("#dice-mode-chips .chip-btn").forEach((chip) => {
      chip.addEventListener("click", () => {
        if (rolling) return;
        document.querySelectorAll("#dice-mode-chips .chip-btn").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        mode = chip.dataset.diceMode;
        faceValue = randomIndexForMode();
        window.SoundFX.click();
        renderDice(false);
        bannerEl.textContent = "點擊骰子或下方按鈕，開始擲大骰子吧！";
      });
    });

    btnRoll.addEventListener("click", rollDice);
    renderDice(false);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initVoting();
    initNoiseMeter();
    initStarRewards();
    initDice();
  });
})();
