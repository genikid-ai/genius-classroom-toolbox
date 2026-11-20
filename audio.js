/* ==========================================================================
   audio.js — 幼兒園教室工具箱 Web Audio 合成音效引擎（100% 離線可用）
   ========================================================================== */
(function () {
  let ctx = null;
  let enabled = true;

  function ensureContext() {
    if (!enabled) return null;
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function tone(freq, duration, type = "sine", volume = 0.18, delay = 0, slideTo = null) {
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  const SoundFX = {
    isEnabled() {
      return enabled;
    },
    setEnabled(val) {
      enabled = !!val;
    },
    click() {
      tone(660, 0.07, "triangle", 0.14, 0, 880);
    },
    pop() {
      tone(420, 0.09, "sine", 0.18, 0, 740);
    },
    tick() {
      tone(980, 0.035, "triangle", 0.12, 0, 620);
    },
    diceRattle() {
      for (let i = 0; i < 6; i++) {
        tone(260 + Math.random() * 440, 0.045, "square", 0.05, i * 0.065);
      }
    },
    star() {
      tone(784, 0.14, "sine", 0.16, 0);
      tone(1046.5, 0.22, "triangle", 0.16, 0.08);
    },
    vote() {
      tone(523.25, 0.09, "sine", 0.16, 0);
      tone(783.99, 0.15, "sine", 0.16, 0.07);
    },
    fanfare() {
      const notes = [
        [523.25, 0.12, 0],
        [659.25, 0.12, 0.11],
        [783.99, 0.14, 0.22],
        [1046.5, 0.36, 0.34]
      ];
      notes.forEach(([f, d, t]) => tone(f, d, "triangle", 0.2, t));
    },
    bell() {
      // 清脆手搖鈴兩連響
      [0, 0.24].forEach((offset) => {
        tone(1174.66, 0.55, "sine", 0.2, offset);
        tone(2349.32, 0.45, "sine", 0.08, offset);
        tone(1760, 0.3, "triangle", 0.07, offset + 0.02);
      });
    },
    softAlert() {
      tone(440, 0.16, "sine", 0.15, 0);
      tone(349.23, 0.24, "sine", 0.15, 0.17);
    },
    alarm(kind) {
      if (kind === "musicbox") {
        // 小星星片段
        const seq = [523.25, 523.25, 783.99, 783.99, 880, 880, 783.99];
        seq.forEach((f, i) => tone(f, i === 6 ? 0.45 : 0.22, "sine", 0.18, i * 0.24));
      } else if (kind === "bird") {
        // 可愛小鳥啁啾
        [0, 0.28, 0.62].forEach((t) => {
          tone(1600, 0.11, "sine", 0.14, t, 2400);
          tone(2300, 0.12, "sine", 0.12, t + 0.12, 1500);
        });
      } else {
        // 溫柔風鈴
        const notes = [659.25, 783.99, 1046.5, 1318.5, 1046.5];
        notes.forEach((f, i) => tone(f, 0.5, "sine", 0.16, i * 0.16));
      }
    }
  };

  window.SoundFX = SoundFX;
})();
