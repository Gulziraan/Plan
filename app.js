
(() => {
  "use strict";

  const C = window.BIRTHDAY_CONTENT;
  if (!C) {
    document.body.innerHTML = "<p>Не удалось загрузить content.js. Проверь, что файл находится рядом с index.html.</p>";
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const PROGRESS_KEY = "hasan-chapter-24-progress";
  const ASSET_KEY = "hasan-chapter-24-assets";

  let progress = new Set();
  let assets = {};
  let currentScene = "welcome";
  let activeQuality = 0;

  try { progress = new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]")); } catch (_) {}
  try { assets = JSON.parse(localStorage.getItem(ASSET_KEY) || "{}"); } catch (_) {}

  const scenes = ["welcome", "profile", "hammer", "admire", "transition", "senses", "final"];

  function saveAssets() {
    try {
      localStorage.setItem(ASSET_KEY, JSON.stringify(assets));
      return true;
    } catch (_) {
      toast("Не хватило места в памяти браузера. Попробуй изображение меньшего размера.");
      return false;
    }
  }

  function showScene(id) {
    if (!scenes.includes(id)) return;
    currentScene = id;
    $$(".scene").forEach(scene => scene.classList.toggle("active", scene.id === id));
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    if (id === "senses") renderSenses();
    if (id === "final") updateProgress();
  }

  function toast(message) {
    const element = $("#toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove("show"), 2800);
  }

  function markProgress(id) {
    progress.add(id);
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify([...progress])); } catch (_) {}
    updateProgress();
  }

  function updateProgress() {
    const count = C.senses.filter(s => progress.has(s.id)).length;
    const countEl = $("#progressCount");
    const fill = $("#progressFill");
    if (countEl) countEl.textContent = `${count} ИЗ 5 ОТКРЫТО`;
    if (fill) fill.style.width = `${count * 20}%`;
    $$("#progressSymbols span").forEach((el, i) => {
      el.classList.toggle("done", !!C.senses[i] && progress.has(C.senses[i].id));
    });
    const finalButton = $("#finalAccess");
    if (finalButton) finalButton.disabled = count !== 5;
  }

  function openModal(kicker, title, body) {
    $("#modalKicker").textContent = kicker || "";
    $("#modalTitle").textContent = title || "";
    $("#modalBody").innerHTML = body || "";
    $("#detailModal").classList.add("visible");
    $("#detailModal").setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    $("#detailModal").classList.remove("visible");
    $("#detailModal").setAttribute("aria-hidden", "true");
  }

  function photoMarkup(key, className = "memory-photo") {
    const src = assets[key] || C.media?.[key] || "";
    if (src) {
      return `<div class="${className}"><img src="${src}" alt="Фотография Хасана"></div>`;
    }
    return `<div class="${className}"><div class="photo-placeholder"><b>♡</b><span>МЕСТО ДЛЯ ФОТО</span></div></div>`;
  }

  function uploadControl(label, accept, key) {
    return `<label class="upload-control">${label}<input type="file" accept="${accept}" data-upload="${key}" hidden></label>`;
  }

  function renderStats() {
    const root = $("#stats");
    if (!root) return;
    root.innerHTML = C.stats.map((s, i) => `
      <button class="stat-row" data-stat="${i}" type="button">
        <span class="stat-name">${s.name}</span>
        <span class="stat-meter"><i style="--level:${s.value}%"></i></span>
        <span class="stat-value">${s.value}</span>
      </button>`).join("");
  }

  function renderQualities() {
    const root = $("#noteGrid");
    if (!root) return;
    root.innerHTML = C.qualities.map((q, i) => `
      <article class="quality-card">
        <div class="quality-photo">${photoMarkup(q.photo, "quality-image")}</div>
        <div class="quality-copy">
          <span class="quality-index">${String(i + 1).padStart(2, "0")} / 05</span>
          <p class="eyebrow">${q.tag}</p>
          <h3>${q.title}</h3>
          <p>${q.text}</p>
          <p class="quality-caption">${q.caption}</p>
          ${uploadControl("＋ ДОБАВИТЬ ФОТО", "image/*", q.photo)}
        </div>
      </article>`).join("");
  }

  function renderSenses() {
    const root = $("#senseList");
    if (!root) return;

    root.innerHTML = C.senses.map(s => {
      const done = progress.has(s.id);
      let content = "";

      if (s.kind === "photos") {
        content = `
          <div class="memory-photo-grid">
            ${s.memories.map((m, i) => `
              <button class="memory-photo-item" data-memory="${s.id}-${i}" type="button">
                ${photoMarkup(`${s.id}-${i}`)}
                <span>${m.title}</span>
              </button>`).join("")}
          </div>
          ${uploadControl("＋ ДОБАВИТЬ ФОТО", "image/*", `${s.id}-upload`)}`;
      }

      if (s.kind === "audio") {
        const audioSource = assets.audio || C.media.audio || "";
        content = `
          <div class="audio-station">
            <div class="vinyl" id="vinyl"><div class="vinyl-label">НАША<br>МУЗЫКА</div></div>
            <div class="audio-info">
              <p class="eyebrow">НАША МУЗЫКА</p>
              <h4 id="audioName">${assets.audioName || "Песня, которая напоминает о нас"}</h4>
              <audio id="personalAudio" controls ${audioSource ? `src="${audioSource}"` : ""}></audio>
              ${uploadControl("＋ ЗАГРУЗИТЬ АУДИО", "audio/*", "audio")}
            </div>
          </div>
          <div class="memory-text-grid">
            ${s.memories.map(m => `
              <button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}">
                <b>${m.title}</b><span>ОТКРЫТЬ ↗</span>
              </button>`).join("")}
          </div>`;
      }

      if (s.kind === "cards") {
        content = `<div class="taste-grid">${s.memories.map((m, i) => `
          <button class="taste-card" data-memory-title="${m.title}" data-memory-text="${m.text}">
            <span class="taste-number">0${i + 1}</span>
            <span class="taste-ornament">${["✿", "☕", "❦"][i]}</span>
            <b>${m.title}</b><small>ОТКРЫТЬ ВОСПОМИНАНИЕ ↗</small>
          </button>`).join("")}</div>`;
      }

      if (s.kind === "letter") {
        content = `
          <div class="touch-layout">
            <div class="fabric-note">
              <span class="handwritten">маленькое напоминание</span>
              <p>Есть места, в которых чувствуешь себя дома. А есть люди.</p>
              <span>♡</span>
            </div>
            <div class="memory-text-grid">
              ${s.memories.map(m => `
                <button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}">
                  <b>${m.title}</b><span>ОТКРЫТЬ ↗</span>
                </button>`).join("")}
            </div>
          </div>
          <div class="certificate">
            <p class="eyebrow">СЕРТИФИКАТ ДЛЯ ОЧЕНЬ ВАЖНОГО ЧЕЛОВЕКА</p>
            <strong>Один полноценный<br><em>массаж.</em></strong>
            <p>Можно использовать в любой день, когда захочется немного заботы и отдыха.</p>
            <span class="handwritten">с любовью, всегда</span>
          </div>`;
      }

      if (s.kind === "scent") {
        content = `
          <div class="scent-layout">
            <div class="perfume-illustration">
              <div class="perfume-cap"></div><div class="perfume-bottle">№ 24</div>
            </div>
            <div class="scent-notes">
              ${s.memories.map(m => `
                <button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}">
                  <b>${m.title}</b><span>ОТКРЫТЬ ↗</span>
                </button>`).join("")}
              ${uploadControl("＋ ДОБАВИТЬ ФОТО АРОМАТА", "image/*", "perfume")}
              ${assets.perfume ? `<img class="perfume-upload" src="${assets.perfume}" alt="Фотография парфюма">` : ""}
            </div>
          </div>`;
      }

      return `
        <article class="sense-chapter sense-${s.id}">
          <div class="sense-number">${s.number}</div>
          <div class="sense-main">
            <div class="sense-heading">
              <div><p class="eyebrow">${s.theme}</p><h3>${s.name}</h3><p class="sense-tagline">${s.tagline}</p></div>
              <span class="sense-symbol">${s.symbol}</span>
            </div>
            <p class="sense-description">${s.description}</p>
            <div class="sense-content">${content}</div>
            <div class="sense-foot">
              <span>${s.prompt}</span>
              <button class="complete-btn ${done ? "completed" : ""}" data-complete="${s.id}">
                ${done ? "ГЛАВА ОТКРЫТА ✓" : "ОТМЕТИТЬ ГЛАВУ ОТКРЫТОЙ ↗"}
              </button>
            </div>
          </div>
        </article>`;
    }).join("") + `
      <div class="unlock-final">
        <p class="eyebrow">КОГДА БУДЕШЬ ГОТОВ</p>
        <h3>ОСТАЛОСЬ<br><em>КОЕ-ЧТО ЕЩЁ.</em></h3>
        <button class="button button-light" id="finalAccess" ${C.senses.every(s => progress.has(s.id)) ? "" : "disabled"}>
          ОТКРЫТЬ ПОСЛЕДНЮЮ ГЛАВУ ↗
        </button>
      </div>`;

    const audio = $("#personalAudio");
    if (audio) {
      audio.addEventListener("play", () => $("#vinyl")?.classList.add("playing"));
      ["pause", "ended"].forEach(eventName => {
        audio.addEventListener(eventName, () => $("#vinyl")?.classList.remove("playing"));
      });
    }
  }

  function compressImage(file, maxSide = 1500, quality = 0.78) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image();
        image.onerror = reject;
        image.onload = () => {
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleUpload(input) {
    const file = input.files?.[0];
    if (!file) return;
    const key = input.dataset.upload;

    try {
      if (file.type.startsWith("image/")) {
        const data = await compressImage(file);
        if (key.endsWith("-upload")) {
          const chapter = key.replace("-upload", "");
          const oldIndex = Object.keys(assets).filter(k => k.startsWith(`${chapter}-`) && k !== key);
          const nextIndex = oldIndex.length;
          assets[`${chapter}-${Math.min(nextIndex, 2)}`] = data;
        } else {
          assets[key] = data;
        }
      } else if (file.type.startsWith("audio/")) {
        if (file.size > 8 * 1024 * 1024) {
          toast("Аудиофайл слишком большой. Выбери файл до 8 МБ.");
          return;
        }
        assets.audio = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        assets.audioName = file.name;
      } else {
        toast("Этот формат файла не поддерживается.");
        return;
      }

      if (!saveAssets()) return;

      if (key === "audio") {
        renderSenses();
      } else if (currentScene === "senses") {
        renderSenses();
      } else if (currentScene === "admire") {
        renderQualities();
      } else {
        applyFixedPhotos();
      }
      toast("Материал сохранён в этом браузере.");
    } catch (error) {
      console.error(error);
      toast("Не удалось загрузить файл. Попробуй другой.");
    } finally {
      input.value = "";
    }
  }

  function applyFixedPhotos() {
    $$("[data-photo]").forEach(element => {
      const key = element.dataset.photo;
      const src = assets[key] || C.media?.[key] || "";
      if (src) element.innerHTML = `<img src="${src}" alt="Фотография Хасана">`;
    });
  }

  function reset() {
    if (!confirm("Начать историю сначала? Загруженные фотографии и аудио останутся сохранёнными.")) return;
    progress.clear();
    localStorage.removeItem(PROGRESS_KEY);
    showScene("welcome");
    updateProgress();
  }

  // Основные кнопки и навигация
  $("#beginBtn")?.addEventListener("click", () => showScene("profile"));
  $$("[data-next]").forEach(button => {
    button.addEventListener("click", () => showScene(button.dataset.next));
  });
  $$("[data-home]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      showScene("welcome");
    });
  });
  $("#restartTop")?.addEventListener("click", reset);
  $("#restartFinal")?.addEventListener("click", reset);

  // Интерактивная сцена Мьёльнира: удержание или три коротких касания.
  (() => {
    const control = $("#mjolnirControl");
    if (!control) return;
    const arena = $("#hammerArena");
    const fill = $("#chargeFill");
    const caption = $("#chargeCaption");
    const instruction = $("#hammerInstruction");
    const victory = $("#hammerVictory");
    const letter = $("#hammerLetter");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let holdTimer = null, holdStarted = 0, taps = 0, tapReset = null, completed = false, isHolding = false;
    const duration = reduced.matches ? 900 : 2350;
    function setCharge(value) {
      const amount = Math.max(0, Math.min(100, value));
      fill.style.width = `${amount}%`;
      arena.style.setProperty("--charge", amount / 100);
      caption.textContent = amount < 30 ? "ЭНЕРГИЯ МОЛОТА · ПРОБУЖДЕНИЕ" : amount < 70 ? "ЭНЕРГИЯ МОЛОТА · НАРАСТАЕТ" : "ЭНЕРГИЯ МОЛОТА · НА ПРЕДЕЛЕ";
    }
    function win() {
      if (completed) return;
      completed = true; clearInterval(holdTimer); clearTimeout(tapReset);
      control.classList.add("lifted"); arena.classList.add("released");
      setCharge(100); instruction.hidden = true;
      markProgress("mjolnir-lifted");
      setTimeout(() => { victory.hidden = false; victory.classList.add("revealed"); }, reduced.matches ? 50 : 700);
      toast("МЬЁЛЬНИР ПОДНЯТ ⚡");
    }
    function registerTap() {
      taps += 1; setCharge(Math.min(90, taps * 30));
      caption.textContent = `ЭНЕРГИЯ МОЛОТА · ${taps} / 3`;
      clearTimeout(tapReset);
      tapReset = setTimeout(() => { taps = 0; setCharge(0); caption.textContent = "ЭНЕРГИЯ МОЛОТА · ОЖИДАНИЕ"; }, 1800);
      if (taps >= 3) win();
    }
    function startHold(event) {
      if (completed || (event.button !== undefined && event.button !== 0)) return;
      event.preventDefault();
      holdStarted = Date.now();
      isHolding = true;
      control.classList.add("charging");
      if (control.setPointerCapture && event.pointerId !== undefined) control.setPointerCapture(event.pointerId);
      holdTimer = setInterval(() => {
        const value = Math.min(100, ((Date.now() - holdStarted) / duration) * 100);
        setCharge(value);
        arena.classList.toggle("surging", value > 24);
        if (value >= 100) win();
      }, 30);
    }
    function endHold() {
      if (completed || !isHolding) return;
      isHolding = false;
      const elapsed = Date.now() - holdStarted;
      clearInterval(holdTimer); control.classList.remove("charging"); arena.classList.remove("surging");
      if (elapsed < duration) registerTap();
    }
    control.addEventListener("click", event => { if (event.detail === 0 && !completed) registerTap(); });
    control.addEventListener("pointerdown", startHold);
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(name => control.addEventListener(name, endHold));
    control.addEventListener("contextmenu", e => e.preventDefault());
    $("#revealHammerLetter")?.addEventListener("click", () => {
      victory.classList.remove("revealed");
      setTimeout(() => { victory.hidden = true; letter.hidden = false; letter.classList.add("revealed"); $("#hammer").classList.add("personal-mode"); }, reduced.matches ? 0 : 450);
    });
    $("#replayHammer")?.addEventListener("click", () => {
      completed = false; taps = 0; setCharge(0);
      control.classList.remove("charging", "lifted"); arena.classList.remove("released", "surging");
      victory.hidden = true; victory.classList.remove("revealed");
      letter.hidden = true; letter.classList.remove("revealed");
      instruction.hidden = false; caption.textContent = "ЭНЕРГИЯ МОЛОТА · ОЖИДАНИЕ"; $("#hammer").classList.remove("personal-mode");
    });
  })();

  // Модальные окна
  document.addEventListener("click", event => {
    const stat = event.target.closest("[data-stat]");
    if (stat) {
      const item = C.stats[Number(stat.dataset.stat)];
      openModal("ХАРАКТЕРИСТИКА ПЕРСОНАЖА", item.name,
        `<p>${item.note}</p><p class="modal-note">ОЦЕНКА: ${item.value} / 100</p>`);
    }

    const memory = event.target.closest("[data-memory-title]");
    if (memory) openModal("МАЛЕНЬКОЕ ВОСПОМИНАНИЕ", memory.dataset.memoryTitle,
      `<p>${memory.dataset.memoryText}</p>`);

    const photo = event.target.closest("[data-memory]");
    if (photo) {
      const [chapter, index] = photo.dataset.memory.split("-");
      const item = C.senses.find(s => s.id === chapter)?.memories[Number(index)];
      if (item) openModal("МОМЕНТ, КОТОРЫЙ ХОЧЕТСЯ СОХРАНИТЬ", item.title, `<p>${item.text}</p>`);
    }

    const complete = event.target.closest("[data-complete]");
    if (complete) {
      markProgress(complete.dataset.complete);
      renderSenses();
      toast("Эта глава теперь часть нашей истории.");
    }

    if (event.target.closest("#finalAccess")) {
      if (C.senses.every(s => progress.has(s.id))) showScene("final");
    }

    if (event.target.closest("[data-close]")) closeModal();
    if (event.target.closest("#openFinal")) $("#finalEnvelope")?.classList.toggle("opened");
  });

  $("#detailModal")?.addEventListener("click", event => {
    if (event.target.classList.contains("modal-backdrop")) closeModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });

  // Загрузка файлов
  document.addEventListener("change", event => {
    const input = event.target.closest("[data-upload]");
    if (input) handleUpload(input);
  });

  // Письмо
  $("#finalLetterText").textContent = C.finalLetter.salutation;
  $("#finalLetterBody").textContent = C.finalLetter.body;
  $("#finalLetterSignature").textContent = C.finalLetter.signature;

  // Начальная отрисовка
  renderStats();
  renderQualities();
  applyFixedPhotos();
  updateProgress();
})();
