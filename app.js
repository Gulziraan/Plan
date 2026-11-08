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
  localStorage.removeItem(ASSET_KEY);
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

  // В пользовательском маршруте оставлены только главы новой истории.
  // Старые экраны профиля, Мьёльнира и карусели не удаляем из исходников,
  // но они больше не входят в последовательность прохождения.
  const scenes = [
    "welcome",
    "profile",
    "hammer",
    "admire",
    "transition",
    "senses",
    "letter"
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
  return true;
}
  function showScene(id) {
    if (!scenes.includes(id)) return;

    if (id === "letter" && !riddleState.unlocked) {
      toast("Сначала нужно разгадать финальный шифр.");
      return;
    }

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

    if (id === "letter") {
      renderPersonalLetter();
      renderMemoryGallery();
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
    // Поддерживаем оба варианта:
    // 1) ключи загруженных в браузере файлов (например, "sight-0");
    // 2) прямые пути к изображениям в папке проекта (например, "assets/11.jpg").
    const isFilePath = typeof key === "string" &&
      /^(assets\/|\.\/|https?:\/\/)/i.test(key);
    const src = assets[key] || (isFilePath ? key : C.media?.[key]) || "";

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

  // Корректно формируем адрес фотографии
  // с учётом GitHub Pages и вложенности репозитория.
  const appScript = Array.from(document.scripts).find(script => {
  if (!script.src) return false;

  return new URL(script.src, window.location.href)
    .pathname.endsWith("/app.js");
});

const siteRoot = appScript
  ? new URL(".", appScript.src)
  : new URL("./", window.location.href);

const resolveImagePath = (path) => {
  if (!path || typeof path !== "string") return "";

  if (/^(data:|blob:|https?:\/\/)/i.test(path)) {
    return path;
  }

  return new URL(path.replace(/^\/+/, ""), siteRoot).href;
};

  stage.innerHTML = [-1, 0, 1].map(offset => {
    const index = (loveIndex + offset + total) % total;
    const item = items[index] || {};

    const number = String(index + 1);
    const padded = number.padStart(2, "0");

    // Путь из content.js — основной источник фотографии.
    const configuredImage = item.image || "";

    // Альтернативные пути, если основной файл не найден.
    const extensions = ["jpg", "jpeg", "png", "webp"];

    const alternatives = extensions.flatMap(ext => [
      `assets/${number}.${ext}`,
      `assets/${padded}.${ext}`
    ]);

    // Загруженная через браузер фотография — последний вариант.
    const uploadedImage = assets[`love-${index}`] || "";

    const rawCandidates = [
      configuredImage,
      ...alternatives,
      uploadedImage
    ].filter(Boolean);

    const imageCandidates = [...new Set(rawCandidates)]
      .map(resolveImagePath)
      .filter(Boolean);

    const image = imageCandidates[0] || "";

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
          : `Перейти к причине: ${escapeHTML(item.title || "")}`}"
        ${center ? "" : "tabindex=-1"}
      >
        <span class="love-card-inner">

          <span class="love-front">
            ${
              image
                ? `
                  <img
                    src="${escapeHTML(image)}"
                    data-love-sources="${escapeHTML(JSON.stringify(imageCandidates.slice(1)))}"
                    alt="Фотография ${index + 1}"
                    style="object-position:${escapeHTML(pos)}"
                  >
                  <span class="love-photo-placeholder" hidden>
                    <b>H.</b>
                    <small>ВАШ ФОТОКАДР</small>
                    <i>ДОБАВЬ СЮДА ФОТОГРАФИЮ</i>
                  </span>
                `
                : `
                  <span class="love-photo-placeholder">
                    <b>H.</b>
                    <small>ВАШ ФОТОКАДР</small>
                    <i>ДОБАВЬ СЮДА ФОТОГРАФИЮ</i>
                  </span>
                `
            }

            <span class="love-front-meta">
              <small>ЛИЧНОЕ / ${String(index + 1).padStart(2, "0")}</small>
              <b>ПЕРЕВЕРНИ МЕНЯ <span>↗</span></b>
            </span>
          </span>

          <span class="love-back">
            <span class="love-back-index">
              ${String(index + 1).padStart(2, "0")}
              <i>—</i>
              ${String(total).padStart(2, "0")}
            </span>

            <small>ЗА ЧТО Я ТЕБЯ ЛЮБЛЮ</small>

            <strong>${escapeHTML(item.title || "")}</strong>

            <span class="love-reason-text">
              ${escapeHTML(item.text || "")}
            </span>

            ${
              item.caption
                ? `<i class="love-caption">${escapeHTML(item.caption)}</i>`
                : ""
            }

            <span class="love-back-sign">МОЁ ЛЮБИМОЕ — ТЫ.</span>
          </span>

        </span>
      </button>
    `;
  }).join("");

  // Если фотография не найдена, пробуем следующие варианты.
  stage.querySelectorAll(".love-front img[data-love-sources]").forEach(img => {
    let fallbacks = [];

    try {
      fallbacks = JSON.parse(img.dataset.loveSources || "[]");
    } catch (_) {}

    let next = 0;

    img.addEventListener("error", () => {
      if (next < fallbacks.length) {
        img.src = fallbacks[next++];
        return;
      }

      img.hidden = true;

      const placeholder = img.nextElementSibling;
      if (placeholder) {
        placeholder.hidden = false;
      }
    });
  });

  // Счётчик карточек
  const counter = $("#loveCounter");

  if (counter) {
    counter.textContent =
      `${String(loveIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  }

  // Индикатор прогресса
  const progressBar = $("#loveProgress");

  if (progressBar) {
    progressBar.style.width =
      `${((loveIndex + 1) / total) * 100}%`;
  }

  // Подсказка
  const hint = $("#lovePhotoHint");

  if (hint) {
    hint.textContent =
      `ФОТОГРАФИЯ ДЛЯ ПРИЧИНЫ ${String(loveIndex + 1).padStart(2, "0")}`;
  }

  // Загрузка фотографии через браузер
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

  function fingerprintSvg(side) {
    // Графика построена из органичных линий папиллярного узора:
    // не эллипсы и не пунктир, а непрерывные дуги с естественными окончаниями.
    const ridges = [];
    for (let i = 0; i < 17; i++) {
      const inset = i * 4.15;
      const left = 24 + inset * 0.72;
      const right = 176 - inset * 0.72;
      const top = 18 + inset * 0.78;
      const bottom = 208 - inset * 0.58;
      const crown = 8 + inset * 0.92;
      const wobble = (i % 3 - 1) * 1.6;
      // Каждая гряда — открытая арка с мягко загнутыми концами.
      ridges.push(`<path d="M ${left + 5} ${bottom - 8}
        C ${left - 2} ${bottom - 48}, ${left + 1 + wobble} ${top + 44}, 100 ${crown}
        C ${right - 1 + wobble} ${top + 42}, ${right + 3} ${bottom - 50}, ${right - 5} ${bottom - 8}" />`);
    }
    // Центральный завиток и короткие разветвляющиеся гряды делают рисунок
    // похожим на реальный петлевой отпечаток, а не на набор концентрических овалов.
    const core = [
      'M 68 139 C 57 111 68 77 96 67 C 124 58 146 79 145 105 C 144 128 126 145 105 143 C 87 141 79 126 84 111 C 88 99 102 94 113 101',
      'M 59 151 C 43 112 62 66 96 54 C 135 41 160 72 157 108 C 155 139 132 160 104 157',
      'M 78 153 C 65 130 69 103 86 88 C 105 71 132 81 137 103 C 141 121 128 137 111 137',
      'M 45 130 C 38 91 59 48 94 39',
      'M 155 145 C 174 119 174 83 159 59',
      'M 34 164 C 22 126 25 91 42 65',
      'M 166 166 C 184 137 185 103 177 79'
    ];
    const ink = '#29272a';
    const highlight = '#494449';
    const ridgeMarkup = ridges.map((d, i) => `<path d="${d.replace(/\s+/g, ' ')}" stroke="${i % 4 === 0 ? highlight : ink}" stroke-width="${i % 5 === 0 ? 2.15 : 1.75}"/>`).join('');
    const coreMarkup = core.map((d, i) => `<path d="${d}" stroke="${i % 3 === 0 ? highlight : ink}" stroke-width="1.8"/>`).join('');
    return `<svg class="fingerprint-svg" viewBox="0 0 200 230" aria-hidden="true" focusable="false">
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">${ridgeMarkup}${coreMarkup}
        <path d="M 52 176 C 42 188 42 199 49 207 M 148 176 C 158 188 158 199 151 207" stroke="${ink}" stroke-width="1.7"/>
      </g>
    </svg>`;
  }

  function renderSenses() {
    const root = $("#senseList");
    if (!root) return;

    const audioTracks = C.audioTracks || [
      { id: "hasan", title: "ТВОЁ ПЕРВОЕ ГОЛОСОВОЕ", description: "Одно из первых сообщений, которое я до сих пор хочу сохранить.", src: "assets/audio/hasan-first-voice.mp3", tone: "plum" },
      { id: "mine", title: "МОЁ ПЕРВОЕ ГОЛОСОВОЕ", description: "Мой голос из того времени, когда мы только начинали узнавать друг друга.", src: "assets/audio/my-first-voice.mp3", tone: "rose" },
      { id: "song", title: "НАША ПЕСНЯ", description: "Музыка, которая теперь ассоциируется у меня с нами.", src: "assets/audio/our-song.mp3", tone: "record" }
    ];

    root.innerHTML = C.senses.map(s => {
      let content = "";

      if (s.kind === "photos") {
        const photos = [
          { src: "assets/F1.PNG", title: s.memories[0]?.title || "01", cls: "is-featured" },
          { src: "assets/F2.PNG", title: s.memories[1]?.title || "02", cls: "" },
          { src: "assets/F3.PNG", title: s.memories[2]?.title || "03", cls: "" }
        ];
        content = `<div class="sight-editorial-gallery">${photos.map(photo => `
          <figure class="sight-photo ${photo.cls}"><img src="${photo.src}" alt="${photo.title}" loading="lazy"><figcaption>${photo.title}</figcaption></figure>
        `).join("")}</div>`;
      }

      if (s.kind === "audio") {
        content = `
          <div class="audio-story-heading"><span>ЗВУКОВОЙ АРХИВ · 01—03</span><h4>ТРИ ГОЛОСА НАШЕЙ ИСТОРИИ</h4></div>
          <div class="audio-story-list">${audioTracks.map((track, i) => `
            <article class="audio-story-track tone-${track.tone}" data-audio-track="${track.id}">
              <div class="audio-track-art" aria-hidden="true">${track.id === "song" ? '<div class="audio-record"><i></i></div>' : `<div class="audio-wave wave-${i + 1}">${Array.from({length: 27}, (_, n) => `<i style="--bar:${18 + ((n * 17 + i * 11) % 65)}%"></i>`).join("")}</div>`}</div>
              <div class="audio-track-copy"><span class="audio-track-index">0${i + 1} / AUDIO MEMORY</span><b>${track.title}</b><p>${track.description}</p>
                <div class="audio-player-controls">
                  <button type="button" class="audio-play" data-audio-toggle="${track.id}" aria-label="Воспроизвести" disabled>▶</button>
                  <div class="audio-timeline"><input type="range" min="0" max="100" value="0" step="0.1" data-audio-seek="${track.id}" aria-label="Позиция воспроизведения" disabled><div><span data-audio-current="${track.id}">00:00</span><span data-audio-duration="${track.id}">АУДИОЗАПИСЬ СКОРО ПОЯВИТСЯ</span></div></div>
                </div>
                <audio preload="metadata" data-audio-element="${track.id}" src="${track.src}"></audio>
                <p class="audio-missing" data-audio-missing="${track.id}">Аудиозапись скоро появится</p>
              </div>
            </article>`).join("")}</div>`;
      }

      if (s.kind === "cards") {
        content = `
          <div class="cafe-scene">
            <div class="cafe-photo-art" aria-hidden="true"><div class="cafe-window-light"></div><div class="cafe-table"></div><div class="cafe-cup"><i></i></div><div class="cafe-dessert"><i></i><b></b></div><span class="cafe-caption">A SLOW MOMENT, JUST FOR US</span></div>
            <div class="cafe-scene-title"><span>МАЛЕНЬКАЯ ИСТОРИЯ О ЗАБОТЕ</span><h4>НАШ МАЛЕНЬКИЙ ЗАКАЗ</h4></div>
          </div>`;
      }

      if (s.kind === "letter") {
        content = `
          <div class="touch-experience" data-touch-experience>
            <div class="touch-art-stage" data-touch-surface role="button" tabindex="0" aria-label="Нажми и удерживай отпечаток пальца">
              <div class="touch-art-kicker">ОДНО ПРИКОСНОВЕНИЕ</div>
              <div class="fingerprint-pair"><div class="fingerprint-print print-left">${fingerprintSvg('left')}</div><div class="fingerprint-print print-right">${fingerprintSvg('right')}</div></div>
              <div class="touch-art-instruction">Прикоснись к отпечатку и немного задержи палец.</div>
              <div class="touch-art-hint">Иногда даже самое маленькое прикосновение может оставить большое чувство.</div>
              <div class="touch-progress"><i></i></div>
              <div class="touch-reveal-copy" hidden><p>Помню наше первое свидание и то случайное прикосновение. Возможно, для тебя это был совсем обычный момент, но я до сих пор помню, какое приятное волнение тогда почувствовала.</p><p>И сейчас мне нравится мысль, что из таких маленьких моментов постепенно складывается что-то настолько большое и важное для меня.</p></div>
            </div>
          </div>
`;
      }

      if (s.kind === "scent") {
        content = `
          <div class="scent-sensory-scene" data-scent-scene>
            <div class="scent-veil veil-one"></div><div class="scent-veil veil-two"></div><div class="scent-veil veil-three"></div>
            <div class="scent-light-core"></div><div class="scent-particles" aria-hidden="true"></div>
            <div class="scent-scene-copy"><span>АРОМАТ, КОТОРЫЙ НАПОМИНАЕТ О ТЕБЕ</span><p>Некоторые воспоминания невозможно увидеть. Но иногда достаточно одного знакомого ощущения.</p><button type="button" data-scent-reveal>ПРИКОСНУТЬСЯ К ВОСПОМИНАНИЮ</button><strong data-scent-message hidden>ТЕПЕРЬ ЭТОТ АРОМАТ АССОЦИИРУЕТСЯ У МЕНЯ С ТОБОЙ</strong></div>
            <div class="scent-trail" aria-hidden="true"></div>
          </div>`;
      }

      const solved = riddleState.solved.includes(s.id);
      const riddle = RIDDLES[s.id];
      const tasteReceipt = s.id === "taste" ? `
        <div class="cafe-receipt">
          <div class="receipt-top"><b>OUR LITTLE CAFÉ</b><span>МАЛЕНЬКИЕ РАДОСТИ · ОСОБЕННЫЙ ЗАКАЗ</span></div>
          <div class="receipt-rule"></div>
          <div class="receipt-row"><span>Кофе + десерт</span><b>10</b></div><div class="receipt-row"><span>Десерт + чай</span><b>8</b></div><div class="receipt-row"><span>Кофе + чай</span><b>6</b></div>
          <div class="receipt-rule receipt-dashed"></div><h4>А СКОЛЬКО СТОИТ ДЕСЕРТ?</h4><p>Найди ответ в нашем маленьком чеке.</p>
          ${renderRiddleControl(s.id, solved)}
          <button class="riddle-hint" type="button" data-hint="taste">ПОЛУЧИТЬ ПОДСКАЗКУ</button>
          <p class="riddle-feedback" id="feedback-taste" aria-live="polite">${solved ? RIDDLES.taste.success : ""}</p>
          ${solved ? `<div class="earned-letter receipt-earned"><span>ТВОЯ БУКВА</span><strong>${RIDDLE_LETTERS.taste}</strong></div><div class="receipt-stamp">ОПЛАЧЕНО · ✓</div><p class="receipt-after">Кажется, у этого заказа есть кое-что поважнее цены. Мне всегда нравилось, что ты умел радовать меня такими простыми вещами.</p>` : ''}
        </div>` : "";
      const standardRiddle = s.id === "taste" ? "" : `
        ${s.id === "touch" ? '<div class="touch-braille-label">МАЛЕНЬКОЕ ИСПЫТАНИЕ · ШРИФТ БРАЙЛЯ</div>' : ''}
        <section class="riddle-panel ${solved ? "is-solved" : ""}" data-riddle="${s.id}">
          <div class="riddle-panel-top"><span class="riddle-index">СЕКРЕТНЫЙ УРОВЕНЬ</span><span class="riddle-status">${solved ? "РАЗГАДАНО ✓" : "ОЖИДАЕТ РЕШЕНИЯ"}</span></div>
          <p class="eyebrow">${riddle.title}</p><p class="riddle-intro">${riddle.intro}</p><h4 class="riddle-question">${riddle.question}</h4>
          ${renderRiddleControl(s.id, solved)}
          <button class="riddle-hint" type="button" data-hint="${s.id}">ПОЛУЧИТЬ ПОДСКАЗКУ</button>
          <p class="riddle-feedback" id="feedback-${s.id}" aria-live="polite">${solved ? riddle.success : ""}</p>
          ${solved ? `<div class="earned-letter"><span>ТВОЯ БУКВА</span><strong>${RIDDLE_LETTERS[s.id]}</strong></div>` : ""}
        </section>`;

      return `
        <article class="sense-chapter sense-${s.id}" id="chapter-${s.id}">
          <div class="sense-number">${s.number}</div><div class="sense-main">
            <div class="sense-heading"><div><p class="eyebrow">${s.theme}</p><h3>${s.name}</h3>${s.tagline ? `<p class="sense-tagline">${s.tagline}</p>` : ""}</div><span class="sense-symbol">${s.symbol}</span></div>
            <p class="sense-description">${s.description}</p><div class="sense-content">${content}</div>
            ${tasteReceipt}${standardRiddle}
            ${s.id === "touch" ? `<div class="certificate certificate-quiet"><p class="eyebrow">СЕРТИФИКАТ ДЛЯ ОЧЕНЬ ВАЖНОГО ЧЕЛОВЕКА</p><strong>Один полноценный<br><em>массаж.</em></strong><p>Можно использовать в любой день, когда захочется немного заботы и отдыха.</p><span class="handwritten">с любовью, всегда</span></div>` : ""}
          </div>
        </article>`;
    }).join("") + `
      <div class="unlock-final"><p class="eyebrow">КОГДА БУДУТ СОБРАНЫ ВСЕ ПЯТЬ БУКВ</p><h3>ОСТАЛОСЬ<br><em>КОЕ-ЧТО ЕЩЁ.</em></h3><button class="button button-light" id="finalAccess" ${riddleState.solved.length === 5 ? "" : "disabled"}>ПЕРЕЙТИ К ШИФРУ ↗</button></div>`;

    setupAudioPlayers();
    setupTouchScene();
    setupScentScene();
    updateProgress();
  }

  function formatAudioTime(seconds) {
    if (!Number.isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function setupAudioPlayers() {
    const tracks = $$('[data-audio-element]');
    tracks.forEach(audio => {
      const id = audio.dataset.audioElement;
      const play = $(`[data-audio-toggle="${id}"]`);
      const seek = $(`[data-audio-seek="${id}"]`);
      const current = $(`[data-audio-current="${id}"]`);
      const duration = $(`[data-audio-duration="${id}"]`);
      const missing = $(`[data-audio-missing="${id}"]`);
      const ready = () => {
        if (!Number.isNaN(audio.duration) && audio.duration > 0) {
          play.disabled = false; seek.disabled = false;
          duration.textContent = formatAudioTime(audio.duration);
          missing.hidden = true;
        }
      };
      audio.addEventListener("loadedmetadata", ready);
      audio.addEventListener("durationchange", ready);
      audio.addEventListener("timeupdate", () => {
        current.textContent = formatAudioTime(audio.currentTime);
        if (Number.isFinite(audio.duration) && audio.duration > 0) seek.value = (audio.currentTime / audio.duration) * 100;
      });
      audio.addEventListener("play", () => { play.textContent = "Ⅱ"; play.setAttribute("aria-label", "Пауза"); audio.closest(".audio-story-track").classList.add("is-playing"); });
      const stop = () => { play.textContent = "▶"; play.setAttribute("aria-label", "Воспроизвести"); audio.closest(".audio-story-track").classList.remove("is-playing"); };
      audio.addEventListener("pause", stop); audio.addEventListener("ended", stop);
      audio.addEventListener("error", () => { play.disabled = true; seek.disabled = true; missing.hidden = false; });
      if (audio.readyState >= 1) ready();
      if (audio.error || !audio.currentSrc) missing.hidden = false;
      play.addEventListener("click", async () => {
        if (audio.paused) {
          tracks.forEach(other => { if (other !== audio) other.pause(); });
          try { await audio.play(); } catch (_) { missing.hidden = false; }
        } else audio.pause();
      });
      seek.addEventListener("input", () => { if (Number.isFinite(audio.duration)) audio.currentTime = (Number(seek.value) / 100) * audio.duration; });
    });
  }

  function setupTouchScene() {
    const surface = $("[data-touch-surface]");
    if (!surface) return;
    let timer = null;
    let started = 0;
    let completed = false;
    const progress = $(".touch-progress i", surface);
    const cancel = () => { if (timer) clearTimeout(timer); timer = null; if (!completed) surface.classList.remove("is-charging"); };
    const finish = () => {
      if (completed) return;
      completed = true;
      surface.classList.remove("is-charging"); surface.classList.add("is-awakening");
      if (navigator.vibrate) { try { navigator.vibrate(35); } catch (_) {} }
      window.setTimeout(() => surface.classList.add("is-joined"), 250);
      window.setTimeout(() => {
        surface.classList.add("is-complete");
        const copy = $(".touch-reveal-copy", surface); if (copy) copy.hidden = false;
        const instruction = $(".touch-art-instruction", surface); if (instruction) instruction.textContent = "ДВА ПРИКОСНОВЕНИЯ. ОДНО ОБЩЕЕ ЧУВСТВО.";
      }, 2350);
    };
    const start = event => {
      if (completed || event.button > 0) return;
      started = Date.now(); surface.classList.add("is-charging");
      if (progress) progress.style.transform = "scaleX(0)";
      timer = window.setTimeout(finish, 1150);
    };
    surface.addEventListener("pointerdown", start);
    surface.addEventListener("pointerup", cancel);
    surface.addEventListener("pointercancel", cancel);
    surface.addEventListener("pointerleave", cancel);
    surface.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); start({button:0}); timer = window.setTimeout(finish, 1150); } });
    surface.addEventListener("contextmenu", event => event.preventDefault());
  }

  function setupScentScene() {
    const scene = $("[data-scent-scene]");
    if (!scene) return;
    const trail = $(".scent-trail", scene);
    scene.addEventListener("pointermove", event => {
      const rect = scene.getBoundingClientRect();
      scene.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
      scene.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
      scene.classList.add("is-stirred");
      if (trail) { trail.style.left = `${event.clientX - rect.left}px`; trail.style.top = `${event.clientY - rect.top}px`; }
    });
    scene.addEventListener("pointerleave", () => scene.classList.remove("is-stirred"));
    $("[data-scent-reveal]", scene)?.addEventListener("click", () => {
      scene.classList.add("is-revealed");
      const message = $("[data-scent-message]", scene); if (message) message.hidden = false;
    });
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
          <p class="eyebrow">ПЯТЬ ЧУВСТВ · ОДНА ИСТОРИЯ</p>
          <div class="secret-senses-mark" aria-hidden="true"><span>◉</span><span>∿</span><span>✳</span><span>⌁</span><span>✧</span></div>
          <h2>ТЫ СТАЛ<br><em>МОИМ САМЫМ РОДНЫМ</em></h2>
          <div class="secret-lead">
            <p>Знаешь, сейчас мне так приятно вспоминать, с чего всё начиналось.</p>
            <p>Тогда я только узнавала тебя, а теперь ты стал для меня настолько родным и любимым.</p>
            <p>Я люблю всё, что связано с тобой. И мне хочется ещё много раз переживать с тобой самые обычные моменты, потому что именно они становятся такими дорогими, когда мы вместе.</p>
            <p>Я очень счастлива, что однажды наши пути пересеклись. И ещё счастливее от того, что теперь у меня есть ты.</p>
          </div>
          <div class="secret-message">
            <span>ПЯТЬ ЧУВСТВ · ПЯТЬ ЧАСТЕЙ НАШЕЙ ИСТОРИИ</span>
            <h3>Я ЛЮБЛЮ ТЕБЯ.</h3>
            <p class="handwritten">А теперь я хочу сказать тебе кое-что лично.</p>
          </div>
          <button class="button button-light" type="button" id="secretContinue">
            ОТКРЫТЬ МОЁ ПИСЬМО <span>↗</span>
          </button>
        </div>
      `;

      $("#senses")?.appendChild(secret);

      $("#secretContinue")?.addEventListener("click", () => {
        showScene("letter");
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

      toast(key.startsWith("love-") ? "Фото добавлено в этом браузере. Для переноса помести его в assets/love/ и укажи путь в content.js." : "Материал сохранён в этом браузере.");
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

    if (beginButton) {
      beginButton.innerHTML = 'ОТКРЫТЬ ИСТОРИЮ <span>↗</span>';
    }

    $("#riddleCipher")?.remove();
    $("#secretChapter")?.remove();

    showScene("welcome");
    updateProgress();
  }

  // ОСНОВНЫЕ КНОПКИ И НАВИГАЦИЯ

  const beginButton = $("#beginBtn");
  if (beginButton && riddleState.unlocked) {
    beginButton.innerHTML = 'ПЕРЕЙТИ К ПИСЬМУ <span>↗</span>';
  }
  beginButton?.addEventListener("click", () => {
    showScene(riddleState.unlocked ? "letter" : "profile");
  });

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
    const sensesScroll = event.target.closest("[data-scroll-senses]");
    if (sensesScroll) {
      document.getElementById(sensesScroll.dataset.scrollSenses)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    }

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

  // ЛИЧНОЕ ПИСЬМО: текст редактируется в content.js, случайное письмо не подставляется.
  function renderPersonalLetter() {
    const letter = C.personalLetter || {};
    const salutation = $("#personalLetterSalutation");
    const body = $("#personalLetterBody");
    const signature = $("#personalLetterSignature");

    if (salutation) salutation.textContent = letter.salutation || "";
    if (signature) signature.textContent = letter.signature || "";

    if (body) {
      const paragraphs = String(letter.body || "")
        .split(/\n\s*\n/)
        .map(value => value.trim())
        .filter(Boolean);

      body.innerHTML = paragraphs.length
        ? paragraphs.map(value => `<p>${escapeHTML(value).replace(/\n/g, "<br>")}</p>`).join("")
        : `<p class="letter-empty-hint">ЗДЕСЬ БУДЕТ ТВОЁ ПИСЬМО<br><small>Добавь текст в объект personalLetter файла content.js</small></p>`;
    }
  }

  // Фотографии галереи задаются массивом galleryPhotos в content.js.
  // Чтобы добавить кадр: положи файл в assets/ и добавь его путь в массив.
  function renderMemoryGallery() {
    const grid = $("#memoryGalleryGrid");
    if (!grid) return;

    const photos = Array.isArray(C.galleryPhotos) ? C.galleryPhotos : [];
    const available = photos.filter(item => item && item.src);

    grid.innerHTML = available.map((item, index) => `
      <figure class="memory-gallery-item gallery-shape-${(index % 6) + 1}">
        <img
          src="${escapeHTML(item.src)}"
          alt="${escapeHTML(item.alt || `Наш момент ${index + 1}`)}"
          loading="lazy"
          decoding="async"
        >
      </figure>
    `).join("");

    grid.querySelectorAll("img").forEach(img => {
      img.addEventListener("error", () => {
        img.closest(".memory-gallery-item")?.remove();
      }, { once: true });
    });
  }

  // НАЧАЛЬНАЯ ОТРИСОВКА

  renderStats();
  renderQualities();
  renderLoveReasons();
  renderSenses();
  renderPersonalLetter();
  renderMemoryGallery();
  applyFixedPhotos();
  updateProgress();
  restoreRiddleState();
})();
