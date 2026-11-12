(() => {
  "use strict";
  const intro = document.getElementById("letterIntro");
  const openButton = document.getElementById("letterIntroOpen");
  if (!intro || !openButton) {
    document.documentElement.classList.remove("letter-gate-pending");
    return;
  }

  let opening = false;
  document.body.style.overflow = "hidden";
  document.documentElement.classList.add("letter-gate-pending");
  const artImage = intro.querySelector(".letter-intro-art img");
  artImage?.addEventListener("error", () => {
    intro.classList.add("image-failed");
    const fallback = intro.querySelector(".letter-intro-fallback");
    if (fallback) fallback.hidden = false;
  }, { once: true });

  function openLetter() {
    if (opening) return;
    opening = true;
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

  openButton.addEventListener("click", openLetter, { once: true });
})();