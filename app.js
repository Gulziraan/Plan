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
  const RIDDLE_KEY = "hasan-chapter-24-riddle-progress";

  const RIDDLE_ORDER = ["sight", "sound", "taste", "touch", "scent"];
  const RIDDLE_LETTERS = {
    sight: "Ч",
    sound: "О",
    taste: "В",
    touch: "Е",
    scent: "Н"
  };
  const FINAL_CODE = "ВЕЧНО";

  const RIDDLES = {
    sight: {
      title: "ЗАГАДКА ЗРЕНИЯ",
      intro: "Посмотри внимательно. Иногда важнее не то, что изображено, а то, что повторяется.",
      question: "Продолжи последовательность: треугольник → круг → треугольник → ?",
      hint: "Фигуры чередуются.",
      answer: ["круг", "окружность"],
      success: "Ты заметил закономерность. Первая буква найдена."
    },
    sound: {
      title: "ЗАГАДКА СЛУХА",
      intro: "У каждого сигнала есть свой ритм. Попробуй расшифровать короткое сообщение.",
      question: "Что означает сигнал Морзе «− · ·»?",
      hint: "Это буква из азбуки Морзе. Вспомни русский алфавит.",
      answer: ["д", "де"],
      success: "Ты услышал правильный ответ. Вторая буква твоя."
    },
    taste: {
      title: "ЗАГАДКА ВКУСА",
      intro: "Три вкуса, три неизвестных. Найди значение среднего элемента.",
      question: "Кофе + десерт = 10. Десерт + чай = 8. Кофе + чай = 6. Сколько стоит десерт?",
      hint: "Сложи первые два равенства и вычти третье. Получишь удвоенное значение десерта.",
      answer: ["6", "шесть"],
      success: "Расчёт верный. Третья буква найдена."
    },
    touch: {
      title: "ЗАГАДКА ПРИКОСНОВЕНИЯ",
      intro: "Не всё можно прочитать глазами. Иногда нужно почувствовать структуру.",
      question: "В шрифте Брайля точки 1, 3 и 5 образуют одну букву. Какую?",
      hint: "Это русская буква. Представь точки в ячейке Брайля: слева сверху вниз 1–2–3, справа 4–5–6.",
      answer: ["о"],
      success: "Ты разгадал тактильный код. Четвёртая буква найдена."
    },
    scent: {
      title: "ЗАГАДКА АРОМАТА",
      intro: "У каждого аромата есть своя композиция. Собери её в правильном порядке.",
      question: "Расположи ноты от самого лёгкого впечатления к самому глубокому: цитрус, цветы, древесина.",
      hint: "Сначала свежесть, затем сердце аромата, в конце — база.",
      answer: [],
      success: "Композиция собрана. Пятая буква найдена."
    }
  };

  let progress = new Set();
  let assets = {};
  let riddleState = {
    solved: [],
    unlocked: false
  };
  let currentScene = "welcome";

  try {
    progress = new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]"));
  } catch (_) {}

  try {
    assets = JSON.parse(localStorage.getItem(ASSET_KEY) || "{}");
  } catch (_) {}

  try {
    const stored = JSON.parse(localStorage.getItem(RIDDLE_KEY) || "{}");
    riddleState = {
      solved: Array.isArray(stored.solved)
        ? stored.solved.filter(id => RIDDLE_ORDER.includes(id))
        : [],
      unlocked: stored.unlocked === true
    };
  } catch (_) {}

  const scenes = [
    "welcome",
    "profile",
    "hammer",
    "admire",
    "love",
    "transition",
    "senses",
    "final"
  ];

  function saveProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify([...progress]));
    } catch (_) {}
    updateProgress();
  }

  function saveRiddles() {
    try {
      localStorage.setItem(RIDDLE_KEY, JSON.stringify(riddleState));
    } catch (_) {}
  }

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
    $$(".scene").forEach(scene => {
      scene.classList.toggle("active", scene.id === id);
    });

    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth"
    });

    if (id === "senses") {
      renderSenses();
    }

    if (id === "love") {
      renderLoveReasons();
    }

    if (id === "final") {
      updateProgress();
    }
  }

  function toast(message) {
    const element = $("#toast");
    if (!element) return;

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      element.classList.remove("show");
    }, 2800);
  }

  function updateProgress() {
    const count = RIDDLE_ORDER.filter(id => riddleState.solved.includes(id)).length;
    const countEl = $("#progressCount");
    const fill = $("#progressFill");

    if (countEl) {
      countEl.textContent = `${count} ИЗ 5 РАЗГАДАНО`;
    }

    if (fill) {
      fill.style.width = `${count * 20}%`;
    }

    $$("#progressSymbols span").forEach((el, i) => {
      el.classList.toggle(
        "done",
        !!RIDDLE_ORDER[i] && riddleState.solved.includes(RIDDLE_ORDER[i])
      );
    });

    const finalButton = $("#finalAccess");
    if (finalButton) {
      finalButton.disabled = count !== 5;
    }
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

    return `
      <div class="${className}">
        <div class="photo-placeholder">
          <b>♡</b>
          <span>МЕСТО ДЛЯ ФОТО</span>
        </div>
      </div>`;
  }

  function uploadControl(label, accept, key) {
    return `
      <label class="upload-control">
        ${label}
        <input type="file" accept="${accept}" data-upload="${key}" hidden>
      </label>`;
  }

  function renderStats() {
    const root = $("#stats");
    if (!root) return;

    root.innerHTML = C.stats.map((s, i) => `
      <button class="stat-row" data-stat="${i}" type="button">
        <span class="stat-name">${s.name}</span>
        <span class="stat-meter"><i style="--level:${s.value}%"></i></span>
        <span class="stat-value">${s.value}</span>
      </button>
    `).join("");
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
      </article>
    `).join("");
  }

  // ГАЛЕРЕЯ ПРИЧИН, ЗА КОТОРЫЕ Я ТЕБЯ ЛЮБЛЮ

  let loveIndex = 0;
  let loveFlipped = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerDragging = false;
  let pointerMoved = false;

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));

  function renderLoveReasons() {
    const stage = $("#loveStage");
    if (!stage || !Array.isArray(C.loveReasons) || !C.loveReasons.length) return;

    const items = C.loveReasons;
    const total = items.length;
    loveIndex = ((loveIndex % total) + total) % total;

    stage.innerHTML = [-1, 0, 1].map(offset => {
      const index = (loveIndex + offset + total) % total;
      const item = items[index];
      const image = assets[`love-${index}`] || "";
      const pos = (C.loveImagePositions || [])[index] || "50% 50%";
      const center = offset === 0;

      return `
        <button
          class="love-card ${center ? "center" : offset < 0 ? "left" : "right"} ${center && loveFlipped ? "flipped" : ""}"
          data-love-offset="${offset}"
          data-love-index="${index}"
          type="button"
          aria-label="${center
            ? (loveFlipped ? "Вернуться к фотографии" : "Перевернуть карточку и прочитать")
            : `Перейти к причине: ${escapeHTML(item.title)}`}"
          ${center ? "" : "tabindex=-1"}
        >
          <span class="love-card-inner">
            <span class="love-front">
              ${image
                ? `<img src="${image}" alt="Фотография для причины ${index + 1}" style="object-position:${pos}">`
                : `<span class="love-photo-placeholder"><b>H.</b><small>ВАШ ФОТОКАДР</small><i>ДОБАВЬ СЮДА ФОТОГРАФИЮ</i></span>`
              }
              <span class="love-front-meta">
                <small>ЛИЧНОЕ / ${String(index + 1).padStart(2, "0")}</small>
                <b>ПЕРЕВЕРНИ МЕНЯ <span>↗</span></b>
              </span>
            </span>
            <span class="love-back">
              <span class="love-back-index">${String(index + 1).padStart(2, "0")} <i>—</i> ${String(total).padStart(2, "0")}</span>
              <small>ЗА ЧТО Я ТЕБЯ ЛЮБЛЮ</small>
              <strong>${escapeHTML(item.title)}</strong>
              <span class="love-reason-text">${escapeHTML(item.text)}</span>
              ${item.caption ? `<i class="love-caption">${escapeHTML(item.caption)}</i>` : ""}
              <span class="love-back-sign">МОЁ ЛЮБИМОЕ — ТЫ.</span>
            </span>
          </span>
        </button>`;
    }).join("");

    const counter = $("#loveCounter");
    if (counter) {
      counter.textContent = `${String(loveIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    }

    const progressBar = $("#loveProgress");
    if (progressBar) {
      progressBar.style.width = `${((loveIndex + 1) / total) * 100}%`;
    }

    const hint = $("#lovePhotoHint");
    if (hint) {
      hint.textContent = `ФОТОГРАФИЯ ДЛЯ ПРИЧИНЫ ${String(loveIndex + 1).padStart(2, "0")}`;
    }

    const upload = $("#lovePhotoUpload");
    if (upload) {
      upload.dataset.upload = `love-${loveIndex}`;
    }
  }

  function shiftLove(direction) {
    const total = (C.loveReasons || []).length;
    if (!total) return;

    loveIndex = (loveIndex + direction + total) % total;
    loveFlipped = false;
    renderLoveReasons();
  }

  $("#loveStage")?.addEventListener("click", event => {
    if (pointerMoved) {
      pointerMoved = false;
      return;
    }

    const card = event.target.closest("[data-love-offset]");
    if (!card) return;

    const offset = Number(card.dataset.loveOffset);

    if (offset) {
      shiftLove(offset);
    } else {
      loveFlipped = !loveFlipped;
      renderLoveReasons();
    }
  });

  // Свайп и перетаскивание мышью работают на всей площади галереи.
  const loveStage = $("#loveStage");

  loveStage?.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    pointerDragging = true;
    pointerMoved = false;
  });

  loveStage?.addEventListener("pointerup", event => {
    if (!pointerDragging) return;

    pointerDragging = false;

    const deltaX = event.clientX - pointerStartX;
    const deltaY = event.clientY - pointerStartY;

    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      pointerMoved = true;
      shiftLove(deltaX < 0 ? 1 : -1);
    }
  });

  loveStage?.addEventListener("pointercancel", () => {
    pointerDragging = false;
  });

  document.addEventListener("keydown", event => {
    if (currentScene !== "love" || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      shiftLove(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      shiftLove(1);
    }

    if (
      (event.key === "Enter" || event.key === " ") &&
      document.activeElement?.closest?.("#loveStage .love-card.center")
    ) {
      event.preventDefault();
      loveFlipped = !loveFlipped;
      renderLoveReasons();
    }
  });

  // ПЯТЬ ГЛАВ И ИХ ИСХОДНЫЙ КОНТЕНТ

  function renderSenses() {
    const root = $("#senseList");
    if (!root) return;

    root.innerHTML = C.senses.map(s => {
      let content = "";

      if (s.kind === "photos") {
        content = `
          <div class="memory-photo-grid">
            ${s.memories.map((m, i) => `
              <button class="memory-photo-item" data-memory="${s.id}-${i}" type="button">
                ${photoMarkup(`${s.id}-${i}`)}
                <span>${m.title}</span>
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
              <h4 id="audioName">${assets.audioName || "Песня, которая напоминает о нас"}</h4>
              <audio id="personalAudio" controls ${audioSource ? `src="${audioSource}"` : ""}></audio>
              ${uploadControl("＋ ЗАГРУЗИТЬ АУДИО", "audio/*", "audio")}
            </div>
          </div>
          <div class="memory-text-grid">
            ${s.memories.map(m => `
              <button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}">
                <b>${m.title}</b><span>ОТКРЫТЬ ↗</span>
              </button>
            `).join("")}
          </div>`;
      }

      if (s.kind === "cards") {
        content = `
          <div class="taste-grid">
            ${s.memories.map((m, i) => `
              <button class="taste-card" data-memory-title="${m.title}" data-memory-text="${m.text}">
                <span class="taste-number">0${i + 1}</span>
                <span class="taste-ornament">${["✿", "☕", "❦"][i]}</span>
                <b>${m.title}</b>
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
                <button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}">
                  <b>${m.title}</b><span>ОТКРЫТЬ ↗</span>
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
              <div class="perfume-cap"></div>
              <div class="perfume-bottle">№ 24</div>
            </div>
            <div class="scent-notes">
              ${s.memories.map(m => `
                <button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}">
                  <b>${m.title}</b><span>ОТКРЫТЬ ↗</span>
                </button>
              `).join("")}
              ${uploadControl("＋ ДОБАВИТЬ ФОТО АРОМАТА", "image/*", "perfume")}
              ${assets.perfume ? `<img class="perfume-upload" src="${assets.perfume}" alt="Фотография парфюма">` : ""}
            </div>
          </div>`;
      }

      const solved = riddleState.solved.includes(s.id);
      const riddle = RIDDLES[s.id];

      return `
        <article class="sense-chapter sense-${s.id}" id="chapter-${s.id}">
          <div class="sense-number">${s.number}</div>
          <div class="sense-main">
            <div class="sense-heading">
              <div>
                <p class="eyebrow">${s.theme}</p>
                <h3>${s.name}</h3>
                <p class="sense-tagline">${s.tagline}</p>
              </div>
              <span class="sense-symbol">${s.symbol}</span>
            </div>

            <p class="sense-description">${s.description}</p>
            <div class="sense-content">${content}</div>

            <section class="riddle-panel ${solved ? "is-solved" : ""}" data-riddle="${s.id}">
              <div class="riddle-panel-top">
                <span class="riddle-index">СЕКРЕТНЫЙ УРОВЕНЬ</span>
                <span class="riddle-status">${solved ? "РАЗГАДАНО ✓" : "ОЖИДАЕТ РЕШЕНИЯ"}</span>
              </div>
              <p class="eyebrow">${riddle.title}</p>
              <p class="riddle-intro">${riddle.intro}</p>
              <h4 class="riddle-question">${riddle.question}</h4>
              ${renderRiddleControl(s.id, solved)}
              <button class="riddle-hint" type="button" data-hint="${s.id}">ПОЛУЧИТЬ ПОДСКАЗКУ</button>
              <p class="riddle-feedback" id="feedback-${s.id}" aria-live="polite">
                ${solved ? riddle.success : ""}
              </p>
              ${solved ? `
                <div class="earned-letter">
                  <span>ТВОЯ БУКВА</span>
                  <strong>${RIDDLE_LETTERS[s.id]}</strong>
                </div>
              ` : ""}
            </section>
          </div>
        </article>`;
    }).join("") + `
      <div class="unlock-final">
        <p class="eyebrow">КОГДА БУДУТ СОБРАНЫ ВСЕ ПЯТЬ БУКВ</p>
        <h3>ОСТАЛОСЬ<br><em>КОЕ-ЧТО ЕЩЁ.</em></h3>
        <button class="button button-light" id="finalAccess" ${riddleState.solved.length === 5 ? "" : "disabled"}>
          ПЕРЕЙТИ К ШИФРУ ↗
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

  function renderRiddleControl(id, solved) {
    if (solved) {
      return `<p class="riddle-already-solved">ЭТА ЗАГАДКА УЖЕ РАЗГАДАНА. БУКВА СОХРАНЕНА.</p>`;
    }

    if (id === "scent") {
      return `
        <div class="scent-sequence" data-scent-sequence>
          <button type="button" data-scent-note="citrus">ЦИТРУС</button>
          <button type="button" data-scent-note="floral">ЦВЕТЫ</button>
          <button type="button" data-scent-note="wood">ДРЕВЕСИНА</button>
        </div>
        <p class="scent-selected" id="scentSelected">ВЫБРАНО: —</p>
        <button class="riddle-submit" type="button" data-scent-check>ПРОВЕРИТЬ ПОРЯДОК ↗</button>
        <button class="riddle-reset" type="button" data-scent-reset>НАЧАТЬ ЗАНОВО</button>`;
    }

    const placeholders = {
      sight: "ТВОЙ ОТВЕТ",
      sound: "ВВЕДИ БУКВУ",
      taste: "ЧИСЛО ИЛИ СЛОВО",
      touch: "ВВЕДИ БУКВУ"
    };

    return `
      <div class="riddle-answer-row">
        <input
          class="riddle-input"
          type="text"
          maxlength="30"
          autocomplete="off"
          spellcheck="false"
          placeholder="${placeholders[id]}"
          data-riddle-answer="${id}"
        >
        <button class="riddle-submit" type="button" data-riddle-check="${id}">ПРОВЕРИТЬ ↗</button>
      </div>`;
  }

  function normalizeAnswer(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase("ru-RU")
      .replace(/ё/g, "е")
      .replace(/\s+/g, " ");
  }

  function solveRiddle(id) {
    if (!RIDDLE_ORDER.includes(id) || riddleState.solved.includes(id)) return;

    riddleState.solved.push(id);
    saveRiddles();

    // Сохраняем совместимость с прежней системой прогресса.
    progress.add(id);
    saveProgress();

    renderSenses();
    toast(`Буква «${RIDDLE_LETTERS[id]}» найдена.`);
  }

  function checkTextAnswer(id) {
    const input = $(`[data-riddle-answer="${id}"]`);
    const feedback = $(`#feedback-${id}`);
    if (!input || !feedback) return;

    const value = normalizeAnswer(input.value);
    const correct = RIDDLES[id].answer.some(answer => normalizeAnswer(answer) === value);

    if (!value) {
      feedback.textContent = "Сначала введи ответ.";
      feedback.className = "riddle-feedback is-wrong";
      return;
    }

    if (correct) {
      solveRiddle(id);
    } else {
      feedback.textContent = "Пока неверно. Попробуй ещё раз или воспользуйся подсказкой.";
      feedback.className = "riddle-feedback is-wrong";
    }
  }

  const scentSequences = new Map();

  function checkScentSequence() {
    const sequence = scentSequences.get("scent") || [];
    const feedback = $("#feedback-scent");

    if (sequence.length !== 3) {
      if (feedback) {
        feedback.textContent = "Нужно выбрать все три ноты.";
        feedback.className = "riddle-feedback is-wrong";
      }
      return;
    }

    const correct = ["citrus", "floral", "wood"];
    const isCorrect = sequence.every((value, index) => value === correct[index]);

    if (isCorrect) {
      solveRiddle("scent");
    } else if (feedback) {
      feedback.textContent = "Композиция не складывается. Попробуй другой порядок.";
      feedback.className = "riddle-feedback is-wrong";
    }
  }

  function renderCipher() {
    if (riddleState.solved.length !== 5) return;

    const root = $("#senses");
    if (!root) return;

    let cipher = $("#riddleCipher");
    if (cipher) return;

    cipher = document.createElement("section");
    cipher.className = "riddle-cipher";
    cipher.id = "riddleCipher";

    cipher.innerHTML = `
      <p class="eyebrow">ПОСЛЕДНЕЕ ИСПЫТАНИЕ</p>
      <h2>СОБЕРИ <em>СООБЩЕНИЕ.</em></h2>
      <p class="cipher-description">
        Пять глав — пять букв. Вспомни порядок, в котором ты проходил чувства,
        и собери слово.
      </p>
      <div class="cipher-letters" aria-label="Пять букв">
        ${RIDDLE_ORDER.map((id, index) => `
          <div class="cipher-letter">
            <span>0${index + 1}</span>
            <b>${RIDDLE_LETTERS[id]}</b>
          </div>
        `).join("")}
      </div>
      <div class="cipher-inputs" aria-label="Поле для пяти букв">
        ${RIDDLE_ORDER.map((_, index) => `
          <input
            class="cipher-input"
            type="text"
            maxlength="1"
            autocomplete="off"
            autocapitalize="characters"
            aria-label="Буква ${index + 1}"
            data-cipher-index="${index}"
          >
        `).join("")}
      </div>
      <button class="riddle-submit cipher-submit" type="button" id="checkCipher">РАСШИФРОВАТЬ ↗</button>
      <p class="riddle-feedback" id="cipherFeedback" aria-live="polite"></p>
    `;

    root.appendChild(cipher);
  }

  function checkCipher() {
    const inputs = $$(".cipher-input");
    const entered = inputs.map(input => normalizeAnswer(input.value).toUpperCase()).join("");
    const feedback = $("#cipherFeedback");

    if (entered.length !== 5) {
      feedback.textContent = "Заполни все пять ячеек.";
      feedback.className = "riddle-feedback is-wrong";
      return;
    }

    if (entered === FINAL_CODE) {
      riddleState.unlocked = true;
      saveRiddles();
      openSecretChapter();
    } else {
      feedback.textContent = "Пока не получилось. Проверь порядок букв.";
      feedback.className = "riddle-feedback is-wrong";
    }
  }

  function openSecretChapter() {
    let secret = $("#secretChapter");

    if (!secret) {
      secret = document.createElement("section");
      secret.className = "secret-chapter";
      secret.id = "secretChapter";

      secret.innerHTML = `
        <div class="secret-inner">
          <p class="eyebrow">ДОСТУП ПОДТВЕРЖДЁН</p>
          <span class="secret-symbol">∞</span>
          <h2>ЭТО СЛОВО —<br><em>НЕ ПРОСТО ОТВЕТ.</em></h2>
          <p class="secret-lead">
            Все пять букв сложились в одно слово. Но на самом деле
            оно было здесь с самого начала.
          </p>
          <div class="secret-message">
            <span>В · Е · Ч · Н · О</span>
            <h3>Я ЛЮБЛЮ ТЕБЯ.</h3>
            <p>
              За то, какой ты. За то, как я чувствую себя рядом с тобой.
              За наши моменты, привычки, разговоры, смех и даже за самые
              обычные дни. Мне хочется проживать с тобой ещё очень много
              таких дней — и всё, что будет между ними.
            </p>
            <p class="handwritten">С днём рождения, мой любимый человек.</p>
          </div>
          <button class="button button-light" type="button" id="secretContinue">
            ПРОЧИТАТЬ ПОСЛЕДНЮЮ ГЛАВУ ↗
          </button>
        </div>
      `;

      $("#senses")?.appendChild(secret);

      $("#secretContinue")?.addEventListener("click", () => {
        showScene("final");
      });
    }

    secret.classList.add("visible");
    secret.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });

    toast("Шифр разгадан. Открыта последняя глава.");
  }

  function restoreRiddleState() {
    if (riddleState.solved.length === 5) {
      renderCipher();
    }

    if (riddleState.unlocked && riddleState.solved.length === 5) {
      openSecretChapter();
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
          const oldIndex = Object.keys(assets).filter(
            k => k.startsWith(`${chapter}-`) && k !== key
          );
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

      if (key === "audio" || currentScene === "senses") {
        renderSenses();
      } else if (currentScene === "admire") {
        renderQualities();
      } else if (key.startsWith("love-")) {
        renderLoveReasons();
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

      if (src) {
        element.innerHTML = `<img src="${src}" alt="Фотография Хасана">`;
      }
    });
  }

  function reset() {
    if (!confirm("Начать историю сначала? Загруженные фотографии и аудио останутся сохранёнными.")) {
      return;
    }

    progress.clear();
    riddleState = { solved: [], unlocked: false };
    scentSequences.clear();

    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(RIDDLE_KEY);

    $("#riddleCipher")?.remove();
    $("#secretChapter")?.remove();

    showScene("welcome");
    updateProgress();
  }

  // ОСНОВНЫЕ КНОПКИ И НАВИГАЦИЯ

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

  // ИНТЕРАКТИВНАЯ СЦЕНА МЬЁЛЬНИРА

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

    let holdTimer = null;
    let holdStarted = 0;
    let taps = 0;
    let tapReset = null;
    let completed = false;
    let isHolding = false;

    const duration = reduced.matches ? 900 : 2350;

    function setCharge(value) {
      const amount = Math.max(0, Math.min(100, value));

      fill.style.width = `${amount}%`;
      arena.style.setProperty("--charge", amount / 100);

      caption.textContent = amount < 30
        ? "ЭНЕРГИЯ МОЛОТА · ПРОБУЖДЕНИЕ"
        : amount < 70
          ? "ЭНЕРГИЯ МОЛОТА · НАРАСТАЕТ"
          : "ЭНЕРГИЯ МОЛОТА · НА ПРЕДЕЛЕ";
    }

    function win() {
      if (completed) return;

      completed = true;
      clearInterval(holdTimer);
      clearTimeout(tapReset);

      control.classList.add("lifted");
      arena.classList.add("released");

      setCharge(100);
      instruction.hidden = true;

      markHammerProgress();

      setTimeout(() => {
        victory.hidden = false;
        victory.classList.add("revealed");
      }, reduced.matches ? 50 : 700);

      toast("МЬЁЛЬНИР ПОДНЯТ ⚡");
    }

    function markHammerProgress() {
      try {
        progress.add("mjolnir-lifted");
        localStorage.setItem(PROGRESS_KEY, JSON.stringify([...progress]));
      } catch (_) {}
    }

    function registerTap() {
      taps += 1;
      setCharge(Math.min(90, taps * 30));
      caption.textContent = `ЭНЕРГИЯ МОЛОТА · ${taps} / 3`;

      clearTimeout(tapReset);

      tapReset = setTimeout(() => {
        taps = 0;
        setCharge(0);
        caption.textContent = "ЭНЕРГИЯ МОЛОТА · ОЖИДАНИЕ";
      }, 1800);

      if (taps >= 3) win();
    }

    function startHold(event) {
      if (completed || (event.button !== undefined && event.button !== 0)) return;

      event.preventDefault();
      holdStarted = Date.now();
      isHolding = true;

      control.classList.add("charging");

      if (control.setPointerCapture && event.pointerId !== undefined) {
        control.setPointerCapture(event.pointerId);
      }

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

      clearInterval(holdTimer);
      control.classList.remove("charging");
      arena.classList.remove("surging");

      if (elapsed < duration) registerTap();
    }

    control.addEventListener("click", event => {
      if (event.detail === 0 && !completed) registerTap();
    });

    control.addEventListener("pointerdown", startHold);

    ["pointerup", "pointercancel", "lostpointercapture"].forEach(name => {
      control.addEventListener(name, endHold);
    });

    control.addEventListener("contextmenu", event => event.preventDefault());

    $("#revealHammerLetter")?.addEventListener("click", () => {
      victory.classList.remove("revealed");

      setTimeout(() => {
        victory.hidden = true;
        letter.hidden = false;
        letter.classList.add("revealed");
        $("#hammer").classList.add("personal-mode");
      }, reduced.matches ? 0 : 450);
    });

    $("#replayHammer")?.addEventListener("click", () => {
      completed = false;
      taps = 0;
      setCharge(0);

      control.classList.remove("charging", "lifted");
      arena.classList.remove("released", "surging");

      victory.hidden = true;
      victory.classList.remove("revealed");

      letter.hidden = true;
      letter.classList.remove("revealed");

      instruction.hidden = false;
      caption.textContent = "ЭНЕРГИЯ МОЛОТА · ОЖИДАНИЕ";

      $("#hammer").classList.remove("personal-mode");
    });
  })();

  // МОДАЛЬНЫЕ ОКНА И ДЕЙСТВИЯ

  document.addEventListener("click", event => {
    const stat = event.target.closest("[data-stat]");

    if (stat) {
      const item = C.stats[Number(stat.dataset.stat)];

      if (item) {
        openModal(
          "ХАРАКТЕРИСТИКА ПЕРСОНАЖА",
          item.name,
          `<p>${item.note}</p><p class="modal-note">ОЦЕНКА: ${item.value} / 100</p>`
        );
      }
    }

    const memory = event.target.closest("[data-memory-title]");

    if (memory) {
      openModal(
        "МАЛЕНЬКОЕ ВОСПОМИНАНИЕ",
        memory.dataset.memoryTitle,
        `<p>${memory.dataset.memoryText}</p>`
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
          `<p>${item.text}</p>`
        );
      }
    }

    const riddleCheck = event.target.closest("[data-riddle-check]");

    if (riddleCheck) {
      checkTextAnswer(riddleCheck.dataset.riddleCheck);
    }

    const hint = event.target.closest("[data-hint]");

    if (hint) {
      const id = hint.dataset.hint;
      const feedback = $(`#feedback-${id}`);

      if (feedback) {
        feedback.textContent = RIDDLES[id].hint;
        feedback.className = "riddle-feedback is-hint";
      }
    }

    const scentNote = event.target.closest("[data-scent-note]");

    if (scentNote) {
      const sequence = scentSequences.get("scent") || [];

      if (sequence.length >= 3) return;

      const value = scentNote.dataset.scentNote;
      sequence.push(value);
      scentSequences.set("scent", sequence);

      scentNote.classList.add("selected");
      scentNote.disabled = true;

      const labels = {
        citrus: "ЦИТРУС",
        floral: "ЦВЕТЫ",
        wood: "ДРЕВЕСИНА"
      };

      const selected = $("#scentSelected");

      if (selected) {
        selected.textContent = `ВЫБРАНО: ${sequence.map(item => labels[item]).join(" → ")}`;
      }
    }

    if (event.target.closest("[data-scent-check]")) {
      checkScentSequence();
    }

    if (event.target.closest("[data-scent-reset]")) {
      scentSequences.set("scent", []);

      $$("[data-scent-note]").forEach(button => {
        button.disabled = false;
        button.classList.remove("selected");
      });

      const selected = $("#scentSelected");
      if (selected) selected.textContent = "ВЫБРАНО: —";

      const feedback = $("#feedback-scent");
      if (feedback) {
        feedback.textContent = "";
        feedback.className = "riddle-feedback";
      }
    }

    if (event.target.closest("#checkCipher")) {
      checkCipher();
    }

    if (event.target.closest("#finalAccess")) {
      if (riddleState.solved.length === 5) {
        renderCipher();
        $("#riddleCipher")?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    }

    if (event.target.closest("[data-close]")) {
      closeModal();
    }

    if (event.target.closest("#openFinal")) {
      $("#finalEnvelope")?.classList.toggle("opened");
    }
  });

  // ВВОД БУКВ В ШИФРЕ

  document.addEventListener("input", event => {
    const input = event.target.closest("[data-cipher-index]");
    if (!input) return;

    input.value = input.value
      .replace(/[^а-яА-ЯёЁ]/g, "")
      .slice(0, 1)
      .toLocaleUpperCase("ru-RU");

    const index = Number(input.dataset.cipherIndex);

    if (input.value && index < 4) {
      $(`[data-cipher-index="${index + 1}"]`)?.focus();
    }
  });

  document.addEventListener("keydown", event => {
    const input = event.target.closest("[data-cipher-index]");
    if (!input) return;

    const index = Number(input.dataset.cipherIndex);

    if (event.key === "Backspace" && !input.value && index > 0) {
      $(`[data-cipher-index="${index - 1}"]`)?.focus();
    }

    if (event.key === "Enter") {
      checkCipher();
    }
  });

  document.addEventListener("paste", event => {
    const input = event.target.closest("[data-cipher-index]");
    if (!input) return;

    const pasted = event.clipboardData?.getData("text") || "";
    const letters = pasted
      .toLocaleUpperCase("ru-RU")
      .replace(/[^А-ЯЁ]/g, "")
      .slice(0, 5);

    if (letters.length > 1) {
      event.preventDefault();

      $$(".cipher-input").forEach((field, index) => {
        field.value = letters[index] || "";
      });

      $$(".cipher-input").at(-1)?.focus();
    }
  });

  $("#detailModal")?.addEventListener("click", event => {
    if (event.target.classList.contains("modal-backdrop")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });

  // ЗАГРУЗКА ФАЙЛОВ

  document.addEventListener("change", event => {
    const input = event.target.closest("[data-upload]");
    if (input) handleUpload(input);
  });

  // ПИСЬМО

  $("#finalLetterText").textContent = C.finalLetter.salutation;
  $("#finalLetterBody").textContent = C.finalLetter.body;
  $("#finalLetterSignature").textContent = C.finalLetter.signature;

  // НАЧАЛЬНАЯ ОТРИСОВКА

  renderStats();
  renderQualities();
  renderLoveReasons();
  renderSenses();
  applyFixedPhotos();
  updateProgress();
  restoreRiddleState();
})();