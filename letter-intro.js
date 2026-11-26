(() => {
  "use strict";
  const intro = document.getElementById("letterIntro");
  const openButton = document.getElementById("letterIntroOpen");
  if (!intro || !openButton) {
    document.documentElement.classList.remove("letter-gate-pending");
    return;
  }

  let opening = false;
  let typing = true;
  let finished = false;
  let timer = null;
  let lineIndex = 0;
  let charIndex = 0;
  let audioContext = null;
  let audioUnlocked = false;
  const lines = Array.from(intro.querySelectorAll(".typewriter-line"));
  const caret = intro.querySelector(".typewriter-caret");
  const text = [
    "Приветик, Хасан",
    "Сегодня особенный день,",
    "и я приготовила для тебя кое-что интересное)",
    "Начнем?"
  ];

  document.body.style.overflow = "hidden";
  document.documentElement.classList.add("letter-gate-pending");

  // Мягкий механический щелчок клавиши. Звук синтезируется локально,
  // поэтому отдельный аудиофайл и сетевое подключение не нужны.
  function unlockAudio() {
    if (audioUnlocked) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      audioContext = new AudioContextClass();
      audioContext.resume().then(() => { audioUnlocked = audioContext.state === "running"; }).catch(() => {});
    } catch (_) {}
  }

  function keyClick(when = 0) {
    if (!audioContext || audioContext.state !== "running") return;
    const now = audioContext.currentTime + when;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(920 + Math.random() * 420, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.022);
    filter.type = "highpass";
    filter.frequency.setValueAtTime(500, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  function playShortTypingBurst() {
    if (!audioContext || audioContext.state !== "running") return;
    for (let i = 0; i < 14; i++) keyClick(i * (0.075 + Math.random() * 0.025));
  }

  function finishTyping() {
    if (timer) window.clearTimeout(timer);
    timer = null;
    lines.forEach((line, index) => { line.textContent = text[index]; });
    lineIndex = text.length;
    charIndex = 0;
    typing = false;
    finished = true;
    caret?.classList.remove("is-visible");
    caret?.classList.add("is-fading");
    intro.classList.add("is-complete");
  }

  function typeCharacter() {
    if (!typing || opening) return;
    if (lineIndex >= text.length) {
      typing = false;
      finished = true;
      caret?.classList.remove("is-visible");
      caret?.classList.add("is-fading");
      intro.classList.add("is-complete");
      return;
    }
    const current = text[lineIndex];
    if (charIndex < current.length) {
      const character = current[charIndex++];
      lines[lineIndex].textContent += character;
      keyClick();
      const delay = character === "." || character === "?" ? 470 : character === "—" ? 230 : 72 + Math.random() * 38;
      timer = window.setTimeout(typeCharacter, delay);
    } else {
      lineIndex++;
      charIndex = 0;
      timer = window.setTimeout(typeCharacter, lineIndex < text.length ? 900 : 280);
    }
  }

  function openLetter() {
    if (opening) return;
    opening = true;
    if (timer) window.clearTimeout(timer);
    openButton.disabled = true;
    openButton.setAttribute("aria-busy", "true");
    intro.classList.add("is-opening");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduceMotion ? 80 : 1250;

    window.setTimeout(() => {
      intro.remove();
      document.documentElement.classList.remove("letter-gate-pending");
      document.body.style.overflow = "";
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.getElementById("welcome")?.focus?.({ preventScroll: true });
      if (audioContext && audioContext.state !== "closed") audioContext.close().catch(() => {});
    }, delay);
  }

  function activate(event) {
    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    if (event.type === "keydown") event.preventDefault();
    if (opening) return;
    unlockAudio();
    if (typing) {
      // If autoplay was blocked by the browser, this gesture unlocks sound.
      // The typewriter keeps printing in sync; the tap does not skip the text.
      return;
    }
    openLetter();
  }

  openButton.addEventListener("pointerdown", unlockAudio, { passive: true });
  openButton.addEventListener("click", activate);
  openButton.addEventListener("keydown", activate);
  caret?.classList.add("is-visible");
  // Attempt autoplay immediately so the keystrokes begin with the first glyph.
  // Browsers that block audible autoplay will resume on the first user gesture.
  unlockAudio();
  typeCharacter();
})();
