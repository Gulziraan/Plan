
(() => {
  "use strict";

  const C = window.BIRTHDAY_CONTENT;
  if (!C) {
    document.body.textContent = "Не удалось загрузить content.js. Проверь расположение файлов.";
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const PROGRESS_KEY = "hasan-chapter-24-progress";
  const ASSET_KEY = "hasan-chapter-24-assets";

  const scenes = [
    "welcome", "profile", "admire",
    "standard", "unfiltered", "love",
    "transition", "senses", "final"
  ];

  let progress = new Set();
  let assets = {};
  let currentScene = "welcome";
  let loveIndex = 0;
  let touchStartX = 0;

  try {
    progress = new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]"));
  } catch (_) {}

  try {
    assets = JSON.parse(localStorage.getItem(ASSET_KEY) || "{}");
  } catch (_) {}

  function toast(message) {
    const element = $("#toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove("show"), 2800);
  }

  function showScene(id) {
    if (!scenes.includes(id)) return;

    currentScene = id;

    $$(".scene").forEach(scene => {
      scene.classList.toggle("active", scene.id === id);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (id === "senses") renderSenses();
    if (id === "standard") renderStandard();
    if (id === "unfiltered") renderUnfiltered();
    if (id === "love") renderLoveCarousel();
    if (id === "final") updateProgress();
  }

  function saveProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify([...progress]));
    } catch (_) {
      toast("Не удалось сохранить прогресс.");
    }
  }

  function markProgress(id) {
    progress.add(id);
    saveProgress();
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
    const modal = $("#detailModal");
    if (!modal) return;

    $("#modalKicker").textContent = kicker || "";
    $("#modalTitle").textContent = title || "";
    $("#modalBody").innerHTML = body || "";

    modal.classList.add("visible");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    const modal = $("#detailModal");
    if (!modal) return;
    modal.classList.remove("visible");
    modal.setAttribute("aria-hidden", "true");
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function photoMarkup(key, className = "memory-photo") {
    const src = assets[key] || C.media?.[key] || "";

    if (src) {
      return `<div class="${className}"><img src="${src}" alt="Фотография Хасана"></div>`;
    }

    return `
      <div class="${className}">
        <div class="photo-placeholder">
          <b>♡</b>
          <span>МЕСТО ДЛЯ ФОТО</span>
        </div>
      </div>`;
  }

  function uploadControl(label, accept, key, className = "") {
    return `
      <label class="upload-control ${className}">
        ${label}
        <input type="file" accept="${accept}" data-upload="${escapeHTML(key)}" hidden>
      </label>`;
  }

  function renderStats() {
    const root = $("#stats");
    if (!root) return;

    root.innerHTML = C.stats.map((s, i) => `
      <button class="stat-row" data-stat="${i}" type="button">
        <span class="stat-name">${escapeHTML(s.name)}</span>
        <span class="stat-meter"><i style="--level:${Number(s.value)}%"></i></span>
        <span class="stat-value">${Number(s.value)}</span>
      </button>
    `).join("");
  }

  function renderQualities() {
    const root = $("#noteGrid");
    if (!root) return;

    root.innerHTML = C.qualities.map((q, i) => `
      <article class="quality-card">
        <div class="quality-photo">
          ${photoMarkup(q.photo, "quality-image")}
        </div>
        <div class="quality-copy">
          <span class="quality-index">${String(i + 1).padStart(2, "0")} / ${String(C.qualities.length).padStart(2, "0")}</span>
          <p class="eyebrow">${escapeHTML(q.tag)}</p>
          <h3>${escapeHTML(q.title)}</h3>
          <p>${escapeHTML(q.text)}</p>
          <p class="quality-caption">${escapeHTML(q.caption)}</p>
          ${uploadControl("＋ ДОБАВИТЬ ФОТО", "image/*", q.photo)}
        </div>
      </article>
    `).join("");
  }

  // Глава 3 — Твоя планка
  function renderStandard() {
    const root = $("#standardScenes");
    if (!root) return;

    root.innerHTML = C.standard.map((item, index) => `
      <article class="standard-scene">
        <span class="standard-number">${escapeHTML(item.number || String(index + 1).padStart(2, "0"))}</span>

        <div class="standard-image">
          ${photoMarkup(item.photo, "standard-image-inner")}
        </div>

        <div class="standard-copy">
          <p class="eyebrow">${escapeHTML(item.tag)}</p>
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.text)}</p>
          <p class="standard-caption">${escapeHTML(item.caption || "")}</p>
          ${uploadControl("＋ ДОБАВИТЬ ФОТО", "image/*", item.photo, "standard-upload")}
        </div>
      </article>
    `).join("");
  }

  // Глава 4 — Без фильтров
  function renderUnfiltered() {
    const root = $("#unfilteredGrid");
    if (!root) return;

    root.innerHTML = C.unfiltered.map((item, index) => `
      <article class="unfiltered-card">
        <p class="eyebrow">${escapeHTML(item.tag)}</p>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.text)}</p>
        <button type="button" data-unfiltered="${index}">
          ${escapeHTML(item.button || "ОТКРЫТЬ ↗")}
        </button>
      </article>
    `).join("");
  }

  // Глава 5 — карусель
  function renderLoveCarousel() {
    const track = $("#loveTrack");
    const dots = $("#loveDots");
    if (!track || !dots) return;

    if (!Array.isArray(C.loveCards) || C.loveCards.length === 0) {
      track.innerHTML = "<p>Добавь карточки в массив loveCards в content.js.</p>";
      dots.innerHTML = "";
      return;
    }

    loveIndex = Math.max(0, Math.min(loveIndex, C.loveCards.length - 1));

    track.innerHTML = C.loveCards.map((card, index) => {
      const active = index === loveIndex;
      const src = assets[card.photo] || "";

      return `
        <article class="love-card ${active ? "is-active" : ""}" data-love-card="${index}">
          <div class="love-card-inner" role="button" tabindex="0" aria-label="Перевернуть карточку">
            <div class="love-card-front">
              ${src
                ? `<img src="${src}" alt="Фотография для причины ${index + 1}">`
                : `<div class="photo-placeholder"><b>♥</b><span>ДОБАВЬ ФОТО</span></div>`
              }
              <span class="love-photo-caption">${escapeHTML(card.caption || `ПРИЧИНА № ${index + 1}`)}</span>
            </div>

            <div class="love-card-back">
              <h3>${escapeHTML(card.title)}</h3>
              <p>${escapeHTML(card.text)}</p>
              <small>С ЛЮБОВЬЮ · Х.</small>
            </div>
          </div>

          <label class="upload-control" onclick="event.stopPropagation()">
            ＋ ЗАМЕНИТЬ ФОТО
            <input type="file" accept="image/*" data-upload="${escapeHTML(card.photo)}" hidden>
          </label>
        </article>
      `;
    }).join("");

    dots.innerHTML = C.loveCards.map((_, index) => `
      <button class="love-dot ${index === loveIndex ? "active" : ""}"
        data-love-dot="${index}" aria-label="Перейти к карточке ${index + 1}">
      </button>
    `).join("");

    const counter = $("#loveCounter");
    if (counter) {
      counter.textContent =
        `${String(loveIndex + 1).padStart(2, "0")} / ${String(C.loveCards.length).padStart(2, "0")}`;
    }

    $("#lovePrev").disabled = C.loveCards.length < 2;
    $("#loveNext").disabled = C.loveCards.length < 2;

    // Центрируем выбранную карточку, боковые остаются видимыми.
    const activeCard = track.querySelector(".love-card.is-active");
    if (activeCard) {
      const offset = activeCard.offsetLeft + activeCard.offsetWidth / 2 - track.parentElement.clientWidth / 2;
      track.style.transform = `translateX(${-offset}px)`;
    }
  }

  function moveLove(direction) {
    if (!C.loveCards.length) return;
    loveIndex = (loveIndex + direction + C.loveCards.length) % C.loveCards.length;
    renderLoveCarousel();
  }

  function toggleLoveCard(card) {
    if (!card) return;
    card.classList.toggle("is-flipped");
  }

  // Пять чувств и миссии
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
                <span>${escapeHTML(m.title)}</span>
              </button>
            `).join("")}
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
              <h4 id="audioName">${escapeHTML(assets.audioName || "Песня, которая напоминает о нас")}</h4>
              <audio id="personalAudio" controls ${audioSource ? `src="${audioSource}"` : ""}></audio>
              ${uploadControl("＋ ЗАГРУЗИТЬ АУДИО", "audio/*", "audio")}
            </div>
          </div>
          <div class="memory-text-grid">
            ${s.memories.map(m => `
              <button class="memory-text-card" data-memory-title="${escapeHTML(m.title)}" data-memory-text="${escapeHTML(m.text)}">
                <b>${escapeHTML(m.title)}</b><span>ОТКРЫТЬ ↗</span>
              </button>
            `).join("")}
          </div>`;
      }

      if (s.kind === "cards") {
        content = `
          <div class="taste-grid">
            ${s.memories.map((m, i) => `
              <button class="taste-card" data-memory-title="${escapeHTML(m.title)}" data-memory-text="${escapeHTML(m.text)}">
                <span class="taste-number">0${i + 1}</span>
                <span class="taste-ornament">${["✿", "☕", "❦"][i % 3]}</span>
                <b>${escapeHTML(m.title)}</b>
                <small>ОТКРЫТЬ ВОСПОМИНАНИЕ ↗</small>
              </button>
            `).join("")}
          </div>`;
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
                <button class="memory-text-card" data-memory-title="${escapeHTML(m.title)}" data-memory-text="${escapeHTML(m.text)}">
                  <b>${escapeHTML(m.title)}</b><span>ОТКРЫТЬ ↗</span>
                </button>
              `).join("")}
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
                <button class="memory-text-card" data-memory-title="${escapeHTML(m.title)}" data-memory-text="${escapeHTML(m.text)}">
                  <b>${escapeHTML(m.title)}</b><span>ОТКРЫТЬ ↗</span>
                </button>
              `).join("")}
              ${uploadControl("＋ ДОБАВИТЬ ФОТО АРОМАТА", "image/*", "perfume")}
              ${assets.perfume ? `<img class="perfume-upload" src="${assets.perfume}" alt="Фотография парфюма">` : ""}
            </div>
          </div>`;
      }

      return `
        <article class="sense-chapter sense-${s.id}">
          <div class="sense-number">${escapeHTML(s.number)}</div>
          <div class="sense-main">
            <div class="sense-heading">
              <div>
                <p class="eyebrow">${escapeHTML(s.theme)}</p>
                <h3>${escapeHTML(s.name)}</h3>
                <p class="sense-tagline">${escapeHTML(s.tagline)}</p>
              </div>
              <span class="sense-symbol">${escapeHTML(s.symbol)}</span>
            </div>
            <p class="sense-description">${escapeHTML(s.description)}</p>
            <div class="sense-content">${content}</div>
            <div class="sense-foot">
              <span>${escapeHTML(s.prompt)}</span>
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
        <button class="button button-light" id="finalAccess"
          ${C.senses.every(s => progress.has(s.id)) ? "" : "disabled"}>
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

    updateProgress();
  }

  // Загрузка и сжатие изображений
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

          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);

          resolve(canvas.toDataURL("image/jpeg", quality));
        };

        image.src = reader.result;
      };

      reader.readAsDataURL(file);
    });
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function saveAssets() {
    try {
      localStorage.setItem(ASSET_KEY, JSON.stringify(assets));
      return true;
    } catch (_) {
      toast("Не хватило места в памяти браузера. Выбери файл меньшего размера.");
      return false;
    }
  }

  async function handleUpload(input) {
    const file = input.files?.[0];
    if (!file) return;

    const key = input.dataset.upload;

    try {
      if (file.type.startsWith("image/")) {
        assets[key] = await compressImage(file);
      } else if (file.type.startsWith("audio/")) {
        if (file.size > 5 * 1024 * 1024) {
          toast("Аудиофайл слишком большой. Выбери файл до 5 МБ.");
          return;
        }
        assets.audio = await readFileAsDataURL(file);
        assets.audioName = file.name;
      } else {
        toast("Этот формат файла не поддерживается.");
        return;
      }

      if (!saveAssets()) return;

      if (currentScene === "admire") renderQualities();
      if (currentScene === "standard") renderStandard();
      if (currentScene === "unfiltered") renderUnfiltered();
      if (currentScene === "love") renderLoveCarousel();
      if (currentScene === "senses") renderSenses();

      applyFixedPhotos();
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
      if (!src) return;
      element.innerHTML = `<img src="${src}" alt="Фотография Хасана">`;
    });
  }

  function reset() {
    if (!confirm("Начать историю сначала? Загруженные фотографии и аудио останутся сохранёнными.")) return;
    progress.clear();
    saveProgress();
    showScene("welcome");
    updateProgress();
  }

  // Навигация
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

  // Молот
  function liftHammer() {
    $("#hammerArt")?.classList.add("lifted");
    const result = $("#hammerResult");
    if (result) result.textContent = "Молот выбрал его. Я просто согласилась.";
    toast("ДОСТОЙНЫЙ НАЙДЕН ⚡");
  }

  $("#hammerBtn")?.addEventListener("click", liftHammer);
  $("#hammerArt")?.addEventListener("click", liftHammer);

  // Стрелки карусели
  $("#lovePrev")?.addEventListener("click", () => moveLove(-1));
  $("#loveNext")?.addEventListener("click", () => moveLove(1));

  // Клавиатура для карусели
  document.addEventListener("keydown", event => {
    if (currentScene !== "love") return;
    if (event.key === "ArrowLeft") moveLove(-1);
    if (event.key === "ArrowRight") moveLove(1);
  });

  // Свайпы на мобильных
  const carousel = $("#loveCarousel");
  carousel?.addEventListener("touchstart", event => {
    touchStartX = event.changedTouches[0].screenX;
  }, { passive: true });

  carousel?.addEventListener("touchend", event => {
    const delta = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(delta) < 45) return;
    moveLove(delta < 0 ? 1 : -1);
  }, { passive: true });

  // Делегирование интерактивных элементов
  document.addEventListener("click", event => {
    const stat = event.target.closest("[data-stat]");
    if (stat) {
      const item = C.stats[Number(stat.dataset.stat)];
      if (item) {
        openModal(
          "ХАРАКТЕРИСТИКА ПЕРСОНАЖА",
          item.name,
          `<p>${escapeHTML(item.note)}</p><p class="modal-note">ОЦЕНКА: ${Number(item.value)} / 100</p>`
        );
      }
    }

    const memory = event.target.closest("[data-memory-title]");
    if (memory) {
      openModal(
        "МАЛЕНЬКОЕ ВОСПОМИНАНИЕ",
        memory.dataset.memoryTitle,
        `<p>${escapeHTML(memory.dataset.memoryText)}</p>`
      );
    }

    const photo = event.target.closest("[data-memory]");
    if (photo) {
      const [chapter, index] = photo.dataset.memory.split("-");
      const item = C.senses.find(s => s.id === chapter)?.memories[Number(index)];
      if (item) {
        openModal(
          "МОМЕНТ, КОТОРЫЙ ХОЧЕТСЯ СОХРАНИТЬ",
          item.title,
          `<p>${escapeHTML(item.text)}</p>`
        );
      }
    }

    const unfiltered = event.target.closest("[data-unfiltered]");
    if (unfiltered) {
      const item = C.unfiltered[Number(unfiltered.dataset.unfiltered)];
      if (item) {
        openModal(
          "БЕЗ ФИЛЬТРОВ",
          item.detailTitle || item.title,
          `<p>${escapeHTML(item.detail)}</p>`
        );
      }
    }

    const loveDot = event.target.closest("[data-love-dot]");
    if (loveDot) {
      loveIndex = Number(loveDot.dataset.loveDot);
      renderLoveCarousel();
    }

    const loveCard = event.target.closest("[data-love-card]");
    if (loveCard && !event.target.closest("[data-upload]")) {
      const index = Number(loveCard.dataset.loveCard);

      if (index !== loveIndex) {
        loveIndex = index;
        renderLoveCarousel();
      } else {
        toggleLoveCard(loveCard);
      }
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
    if (event.target.closest("#openFinal")) {
      $("#finalEnvelope")?.classList.toggle("opened");
    }
  });

  // Переворот карточки клавиатурой
  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const inner = event.target.closest(".love-card-inner");
    if (!inner) return;
    event.preventDefault();
    toggleLoveCard(inner.closest(".love-card"));
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

  // Финальное письмо
  const letter = C.finalLetter || {};
  if ($("#finalLetterText")) $("#finalLetterText").textContent = letter.salutation || "";
  if ($("#finalLetterBody")) $("#finalLetterBody").textContent = letter.body || "";
  if ($("#finalLetterSignature")) $("#finalLetterSignature").textContent = letter.signature || "";

  // Первичная отрисовка
  renderStats();
  renderQualities();
  renderStandard();
  renderUnfiltered();
  renderLoveCarousel();
  applyFixedPhotos();
  updateProgress();
})();
