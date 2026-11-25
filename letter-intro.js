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
  const lines = Array.from(intro.querySelectorAll(".typewriter-line"));
  const caret = intro.querySelector(".typewriter-caret");
  const text = [
    "Сегодня очень особенный день.",
    "Эти несколько страниц — для тебя.",
    "Просто нажми, когда будешь готов."
  ];

  document.body.style.overflow = "hidden";
  document.documentElement.classList.add("letter-gate-pending");

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
      lines[lineIndex].textContent += current[charIndex++];
      const ch = current[charIndex - 1];
      const delay = ch === "." ? 390 : ch === "—" ? 220 : 58 + Math.random() * 34;
      timer = window.setTimeout(typeCharacter, delay);
    } else {
      lineIndex++;
      charIndex = 0;
      timer = window.setTimeout(typeCharacter, lineIndex < text.length ? 850 : 250);
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
    }, delay);
  }

  function activate(event) {
    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    if (event.type === "keydown") event.preventDefault();
    if (opening) return;
    if (typing) {
      finishTyping();
      return;
    }
    if (!finished) {
      finishTyping();
      return;
    }
    openLetter();
  }

  openButton.addEventListener("click", activate);
  openButton.addEventListener("keydown", activate);
  caret?.classList.add("is-visible");
  typeCharacter();
})();
