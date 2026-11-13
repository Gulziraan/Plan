(() => {
  "use strict";

  const C = window.BIRTHDAY_CONTENT;
  if (!C) {
    document.body.innerHTML = "<p>Не удалось загрузить content.js. Проверь, что файл находится рядом с index.html.</p>";
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const STATE_KEY = "hasan-birthday-experience-v2";
  const LEGACY_PROGRESS_KEY = "hasan-chapter-24-progress";
  const LEGACY_RIDDLE_KEY = "hasan-chapter-24-riddle-progress";
  const ASSET_KEY = "hasan-chapter-24-assets";

  const RIDDLE_ORDER = ["sight", "sound", "taste", "touch", "scent"];
  // Порядок прохождения заданий не меняется. Для финального слова буквы
  // собираются в отдельном порядке: В-Е-Ч-Н-О.
  const CODE_ORDER = ["taste", "touch", "sight", "scent", "sound"];
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
      title: "НАЙДИ ТРИ ОТЛИЧИЯ",
      intro: "Сравни две версии нашей фотографии и найди все три изменения.",
      question: "Нажми на каждое отличие на нижней фотографии.",
      hint: "Присмотрись к деталям фона и одежды.",
      answer: [],
      success: "Все три отличия найдены. Буква открыта."
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
      title: "ВОСПОМИНАНИЕ ОБ УГОЩЕНИИ",
      intro: "Какой едой я угостила тебя впервые?",
      question: "Какой едой я угостила тебя впервые?",
      hint: "Москва",
      answer: ["бургер", "бургеры"],
      success: "Ты вспомнил. Буква найдена."
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
      title: "ЛИЧНАЯ АССОЦИАЦИЯ",
      intro: "Какой запах у меня ассоциируется с тобой?",
      question: "Какой запах у меня ассоциируется с тобой?",
      hint: "То, что ты проспорил мне 😏",
      answer: ["кофе"],
      success: "Композиция собрана. Пятая буква найдена."
    }
  };

  let assets = {};
  let riddleState = {
    solved: [],
    sightFound: [],
    sensesOpened: false,
    unlocked: false,
    hammerDone: false
  };
  let currentScene = "welcome";

  // Восстанавливаем состояние до первой отрисовки. Старые ключи читаются
  // только для миграции; далее используется один версионируемый ключ.
  try {
    const current = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
    if (current && current.version === 2) {
      riddleState = {
        solved: Array.isArray(current.solved)
          ? RIDDLE_ORDER.filter(id => current.solved.includes(id))
          : [],
        sightFound: Array.isArray(current.sightFound)
          ? [1, 2, 3].filter(n => current.sightFound.includes(n))
          : [],
        sensesOpened: current.sensesOpened === true,
        unlocked: current.unlocked === true,
        hammerDone: current.hammerDone === true
      };
    } else {
      const legacyRiddles = JSON.parse(localStorage.getItem(LEGACY_RIDDLE_KEY) || "{}");
      const legacyProgress = JSON.parse(localStorage.getItem(LEGACY_PROGRESS_KEY) || "[]");
      const legacySolved = Array.isArray(legacyRiddles.solved) ? legacyRiddles.solved : [];
      const legacySet = new Set([...legacySolved, ...(Array.isArray(legacyProgress) ? legacyProgress : [])]);
      riddleState = {
        solved: RIDDLE_ORDER.filter(id => legacySet.has(id)),
        sightFound: legacySet.has("sight") ? [1, 2, 3] : [],
        sensesOpened: legacyRiddles.unlocked === true || legacySet.size > 0,
        unlocked: legacyRiddles.unlocked === true,
        hammerDone: legacySet.has("mjolnir-lifted")
      };
      if (current || (legacyRiddles && Array.isArray(legacyRiddles.solved) && legacyRiddles.solved.length) || (Array.isArray(legacyProgress) && legacyProgress.length)) {
        // Миграция выполняется только после успешного чтения старых данных.
        localStorage.setItem(STATE_KEY, JSON.stringify({
          version: 2,
          ...riddleState
        }));
      }
    }
  } catch (error) {
    console.warn("Не удалось прочитать сохранённый прогресс. Запускаем чистое состояние.", error);
    riddleState = {
      solved: [],
      sightFound: [],
      sensesOpened: false,
      unlocked: false,
      hammerDone: false
    };
  }

  // Испытание Мьёльнира начинается заново при каждой новой загрузке сайта.
  // Прогресс остальных загадок при этом сохраняется.
  riddleState.hammerDone = false;
  // Write the reset immediately, so no old v2/legacy completion flag can
  // make the next visit look completed. Other puzzle progress is preserved.
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      version: 2,
      solved: RIDDLE_ORDER.filter(id => riddleState.solved.includes(id)),
      letters: RIDDLE_ORDER.filter(id => riddleState.solved.includes(id)).map(id => RIDDLE_LETTERS[id]),
      sightFound: [1, 2, 3].filter(n => riddleState.sightFound.includes(n)),
      sensesOpened: riddleState.sensesOpened === true,
      unlocked: riddleState.unlocked === true,
      hammerDone: false
    }));
  } catch (_) {}

  // Единая вертикальная страница: следующие разделы открываются только действием пользователя.
  const scenes = ["welcome", "profile", "admire", "hammer", "style", "belief", "transition", "senses", "letter"];

  function persistState() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({
        version: 2,
        solved: RIDDLE_ORDER.filter(id => riddleState.solved.includes(id)),
        letters: RIDDLE_ORDER.filter(id => riddleState.solved.includes(id)).map(id => RIDDLE_LETTERS[id]),
        sightFound: [1, 2, 3].filter(n => riddleState.sightFound.includes(n)),
        sensesOpened: riddleState.sensesOpened === true,
        unlocked: riddleState.unlocked === true,
        hammerDone: riddleState.hammerDone === true
      }));
    } catch (error) {
      console.error("Не удалось сохранить прогресс в localStorage.", error);
      toast("Не удалось сохранить прогресс. Проверь настройки браузера.");
    }
    updateProgress();
  }

  function saveRiddles() {
    persistState();
  }

  function saveAssets() {
    // Пользовательские загрузки не должны перезаписывать исходные материалы.
    return true;
  }

  function showScene(id) {
    const targetIndex = scenes.indexOf(id);
    if (targetIndex < 0) return;

    if (id === "senses") {
      riddleState.sensesOpened = true;
      persistState();
      const sensesSection = document.getElementById("senses");
      if (sensesSection) {
        sensesSection.hidden = false;
        sensesSection.classList.add("is-unlocked");
      }
      renderSenses();
    }

    if (id === "letter" && (!riddleState.unlocked || riddleState.solved.length !== 5)) {
      toast("Сначала нужно разгадать финальный шифр.");
      return;
    }

    if (id === "letter") {
      const finalSection = document.getElementById("letter");
      if (finalSection && riddleState.unlocked && riddleState.solved.length === 5) {
        finalSection.hidden = false;
        finalSection.classList.add("is-unlocked");
      }
      renderPersonalLetter();
      renderMemoryGallery();
    }

    currentScene = id;
    const target = document.getElementById(id);
    if (target) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
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
    if (finalButton) finalButton.disabled = count !== 5;
    if (count === 5) renderCipher();
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
      <button class="stat-row" data-stat="${i}" type="button" aria-label="${s.name}: подробнее">
        <span class="stat-name">${s.name}</span>
        <span class="stat-meter" aria-hidden="true"><i style="--level:100%"></i></span>
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

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));

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

    // Не позволяем одной повреждённой главе оборвать отрисовку всего раздела.
    // Данные проверяем отдельно, чтобы ошибка была видна в консоли, а не превращалась
    // в пустой экран после вводной части.
    const senseItems = Array.isArray(C.senses) ? C.senses : [];
    if (!senseItems.length) {
      console.error("Не удалось отрисовать «Пять чувств»: content.js не содержит массив senses.", C);
      root.innerHTML = '<p class="sense-render-error">Не удалось загрузить главы. Обнови страницу и проверь файл content.js.</p>';
      return;
    }

    root.innerHTML = senseItems.map(s => {
      try {
      // Состояние главы вычисляется до построения её визуального содержимого.
      // Это необходимо, в частности, для шаблона игры «Найди три отличия».
      const solved = riddleState.solved.includes(s.id);
      let content = "";

      if (s.kind === "photos") {
        const photos = [
          { src: "assets/F2.PNG", title: s.memories[0]?.title || "01", cls: "is-featured" },
          { src: "assets/F1.PNG", title: s.memories[1]?.title || "02", cls: "" },
          { src: "assets/F3.PNG", title: s.memories[2]?.title || "03", cls: "" }
        ];
        content = `<div class="sight-editorial-gallery">${photos.map(photo => `
          <figure class="sight-photo ${photo.cls}"><img src="${photo.src}" alt="${photo.title}" loading="lazy"><figcaption>${photo.title}</figcaption></figure>
        `).join("")}</div>
        <section class="spot-difference" data-spot-game>
          <div class="spot-difference-heading"><span>МАЛЕНЬКАЯ ПРОВЕРКА ВНИМАНИЯ</span><h4>НАЙДИ ТРИ ОТЛИЧИЯ</h4><p>В одной из версий фотографии спрятаны три небольших изменения. Нажимай на них на нижнем снимке.</p></div>
          <div class="spot-difference-pair">
            <figure><figcaption>ОРИГИНАЛ</figcaption><img src="assets/O1.jpg" alt="Оригинальная фотография" loading="lazy"></figure>
            <figure class="spot-target"><figcaption>НАЙДИ ОТЛИЧИЯ</figcaption><div class="spot-image-wrap"><img src="assets/O2.jpg" alt="Изменённая версия фотографии" loading="lazy">
              <button type="button" class="spot-hit ${riddleState.sightFound.includes(1) ? "is-found" : ""}" data-difference="1" style="--x:39.2%;--y:40.9%" aria-label="Найти первое отличие" ${riddleState.sightFound.includes(1) ? "disabled" : ""}></button>
              <button type="button" class="spot-hit ${riddleState.sightFound.includes(2) ? "is-found" : ""}" data-difference="2" style="--x:84.1%;--y:3.6%" aria-label="Найти второе отличие" ${riddleState.sightFound.includes(2) ? "disabled" : ""}></button>
              <button type="button" class="spot-hit ${riddleState.sightFound.includes(3) ? "is-found" : ""}" data-difference="3" style="--x:4.4%;--y:57.5%" aria-label="Найти третье отличие" ${riddleState.sightFound.includes(3) ? "disabled" : ""}></button>
            </div></figure>
          </div>
          <div class="spot-progress"><span>НАЙДЕНО</span><strong data-spot-count>${riddleState.sightFound.length}/3</strong></div>
          <p class="spot-feedback" data-spot-feedback aria-live="polite">${riddleState.solved.includes("sight") ? "Все три отличия найдены!" : riddleState.sightFound.length ? "Отличия сохранены. Продолжай искать." : "Найди все три отличия."}</p>
          ${solved ? `<div class="earned-letter"><span>ТВОЯ БУКВА</span><strong>${RIDDLE_LETTERS.sight}</strong></div>` : ''}
        </section>`;
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

      const riddle = RIDDLES[s.id];
      const tasteReceipt = s.id === "taste" ? `
        <div class="cafe-receipt">
          <div class="receipt-top"><b>OUR LITTLE CAFÉ</b><span>МАЛЕНЬКИЕ РАДОСТИ · ОСОБЕННЫЙ ЗАКАЗ</span></div>
          <div class="receipt-rule"></div>
          <div class="receipt-rule receipt-dashed"></div><h4>КАКОЙ ЕДОЙ Я УГОСТИЛА ТЕБЯ ВПЕРВЫЕ?</h4>
          ${renderRiddleControl(s.id, solved)}
          <button class="riddle-hint" type="button" data-hint="taste">ПОДСКАЗКА</button>
          <p class="riddle-feedback" id="feedback-taste" aria-live="polite">${solved ? RIDDLES.taste.success : ""}</p>
          ${solved ? `<div class="earned-letter receipt-earned"><span>ТВОЯ БУКВА</span><strong>${RIDDLE_LETTERS.taste}</strong></div><div class="receipt-stamp">ОПЛАЧЕНО · ✓</div><p class="receipt-after">Кажется, у этого заказа есть кое-что поважнее цены. Мне всегда нравилось, что ты умел радовать меня такими простыми вещами.</p>` : ''}
        </div>` : "";
      const standardRiddle = ["taste", "sight"].includes(s.id) ? "" : `
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
      } catch (error) {
        console.error(`Ошибка при отрисовке главы «${s?.id || "без id"}»:`, error);
        return `<article class="sense-chapter sense-render-error"><div class="sense-number">${s?.number || "—"}</div><div class="sense-main"><div class="sense-heading"><h3>${s?.name || "Глава"}</h3></div><p>Не удалось отобразить эту главу. Остальные задания доступны ниже.</p></div></article>`;
      }
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

    const placeholders = {
      sound: "ВВЕДИ БУКВУ",
      taste: "ВВЕДИ ОТВЕТ",
      touch: "ВВЕДИ БУКВУ",
      scent: "ВВЕДИ ОТВЕТ"
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
        ${CODE_ORDER.map((id, index) => `
          <div class="cipher-letter">
            <span>0${index + 1}</span>
            <b>${RIDDLE_LETTERS[id]}</b>
          </div>
        `).join("")}
      </div>
      <div class="cipher-inputs" aria-label="Поле для пяти букв">
        ${CODE_ORDER.map((_, index) => `
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
      riddleState.sensesOpened = true;
      saveRiddles();
      const finalSection = document.getElementById("letter");
      if (finalSection) {
        finalSection.hidden = false;
        finalSection.classList.add("is-unlocked");
      }
      renderPersonalLetter();
      renderMemoryGallery();
      document.getElementById("letter")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    } else {
      feedback.textContent = "Пока не получилось. Проверь порядок букв.";
      feedback.className = "riddle-feedback is-wrong";
    }
  }

  function openSecretChapter(shouldScroll = true) {
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
    if (shouldScroll) {
      secret.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
      toast("Шифр разгадан. Открыта последняя глава.");
    }
  }

  function restoreRiddleState() {
    if (riddleState.sensesOpened || riddleState.solved.length) {
      riddleState.sensesOpened = true;
      const sensesSection = document.getElementById("senses");
      if (sensesSection) {
        sensesSection.hidden = false;
        sensesSection.classList.add("is-unlocked");
      }
      renderSenses();
    }
    if (riddleState.solved.length === 5) renderCipher();
    if (riddleState.unlocked && riddleState.solved.length === 5) {
      const finalSection = document.getElementById("letter");
      if (finalSection) {
        finalSection.hidden = false;
        finalSection.classList.add("is-unlocked");
      }
      renderPersonalLetter();
      renderMemoryGallery();
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

    riddleState = {
      solved: [],
      sightFound: [],
      sensesOpened: false,
      unlocked: false,
      hammerDone: false
    };
    scentSequences.clear();

    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(LEGACY_PROGRESS_KEY);
    localStorage.removeItem(LEGACY_RIDDLE_KEY);

    if (beginButton) {
      beginButton.innerHTML = 'ЭТА ИСТОРИЯ О ТЕБЕ <span>↓</span>';
    }

    $("#riddleCipher")?.remove();
    $("#secretChapter")?.remove();

    scenes.forEach((sceneId, index) => {
      const section = document.getElementById(sceneId);
      if (!section) return;
      section.classList.remove("locked", "opened", "active", "is-unlocked");
    });
    const sensesSection = document.getElementById("senses");
    const finalSection = document.getElementById("letter");
    if (sensesSection) sensesSection.hidden = true;
    if (finalSection) finalSection.hidden = true;
    window.location.reload();
  }

  // ОСНОВНЫЕ КНОПКИ И НАВИГАЦИЯ

  const beginButton = $("#beginBtn");
  beginButton?.addEventListener("click", () => showScene("profile"));

  $$("[data-next]").forEach(button => {
    button.addEventListener("click", () => showScene(button.dataset.next));
  });

  $$("[data-home]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      showScene("welcome");
    });
  });

  $("#openSensesButton")?.addEventListener("click", () => showScene("senses"));

  $("#restartTop")?.addEventListener("click", reset);
  $("#restartFinal")?.addEventListener("click", reset);

  // Вступительные главы всегда видны в одном вертикальном документе.
  // Закрыты только «Пять чувств» и финал — они раскрываются по условиям.
  const sensesSectionInitial = document.getElementById("senses");
  if (sensesSectionInitial) {
    const sensesVisible = riddleState.sensesOpened || riddleState.solved.length > 0;
    sensesSectionInitial.hidden = !sensesVisible;
    sensesSectionInitial.classList.toggle("is-unlocked", sensesVisible);
  }
  const finalSectionInitial = document.getElementById("letter");
  if (finalSectionInitial) {
    const finalVisible = riddleState.unlocked && riddleState.solved.length === 5;
    finalSectionInitial.hidden = !finalVisible;
    finalSectionInitial.classList.toggle("is-unlocked", finalVisible);
  }

  // Ненавязчивое появление крупных элементов при обычной прокрутке.
  const revealTargets = $$(".scene h2, .scene h3, .scene .profile-hero, .scene .stats-section, .scene .quality-list, .scene .sense-chapter, .scene .personal-letter, .scene .letter-opening");
  revealTargets.forEach(element => element.classList.add("scroll-reveal"));
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    revealTargets.forEach(element => revealObserver.observe(element));
  } else {
    revealTargets.forEach(element => element.classList.add("is-visible"));
  }

  // МЬЁЛЬНИР: удержание, непрерывный shared-element переход и сохранённое состояние.
  (() => {
    const control = $("#mjolnirControl");
    if (!control) return;

    const arena = $("#hammerArena");
    const fill = $("#chargeFill");
    const caption = $("#chargeCaption");
    const instruction = $("#hammerInstruction");
    const styleScene = $("#style");
    const stylePerson = $("#style .style-person");
    const styleImage = $("#style .style-person img");
    const initialPortraitSrc = "assets/hasan-thor-before-hammer.PNG";
    const landedPortraitSrc = "assets/hasan-thor-cutout.png";
    const highlights = $("#creatorHighlights");
    if (styleImage) {
      styleImage.src = initialPortraitSrc;
      styleImage.alt = "Хасан в образе Тора без Мьёльнира";
      styleImage.classList.remove("portrait-changing", "portrait-landed");
      stylePerson?.classList.remove("mjolnir-landed");
    }
    const highlightsToggle = $("#creatorHighlightsToggle");
    const highlightsContent = $("#creatorHighlightsContent");
    const letter = $("#hammerLetter");
    const replayButton = $("#replayHammerFlight");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const HOLD_DURATION = 1350;
    let holdStarted = 0;
    let holdFrame = 0;
    let isHolding = false;
    let transitioning = false;
    let flightFrame = 0;
    let flightNode = null;
    let activePointerId = null;
    let completed = riddleState.hammerDone === true;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const easeInOut = value => value < .5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

    function setCharge(value) {
      const amount = clamp(value, 0, 100);
      if (fill) fill.style.width = `${amount}%`;
      arena?.style.setProperty("--charge", amount / 100);
      if (caption) caption.textContent = amount < 30
        ? "ЭНЕРГИЯ МОЛОТА · ПРОБУЖДЕНИЕ"
        : amount < 70 ? "ЭНЕРГИЯ МОЛОТА · НАРАСТАЕТ" : "ЭНЕРГИЯ МОЛОТА · НА ПРЕДЕЛЕ";
    }

    function persistHammerCompletion() {
      riddleState.hammerDone = true;
      persistState();
    }

    function setHighlightsReady() {
      if (replayButton) replayButton.hidden = false;
      if (highlights) highlights.classList.add("is-unlocked");
      if (highlightsToggle) highlightsToggle.disabled = false;
    }

    if (completed) {
      control.classList.add("already-completed");
      control.setAttribute("aria-label", "Мьёльнир уже поднят. Можно повторить анимацию на следующем экране.");
      setCharge(100);
      if (caption) caption.textContent = "ИСПЫТАНИЕ ПРОЙДЕНО";
      if (instruction) instruction.hidden = true;
      setHighlightsReady();
    }

    function cancelHold(reset = true) {
      if (!isHolding) return;
      const pointerId = activePointerId;
      isHolding = false;
      activePointerId = null;
      cancelAnimationFrame(holdFrame);
      control.classList.remove("charging");
      arena?.classList.remove("surging");
      try {
        if (pointerId !== null && control.hasPointerCapture?.(pointerId)) control.releasePointerCapture(pointerId);
      } catch (_) {}
      if (reset && !completed) {
        setCharge(0);
        if (caption) caption.textContent = "ЭНЕРГИЯ МОЛОТА · ОЖИДАНИЕ";
      }
    }

    function updateHold() {
      if (!isHolding || completed || transitioning) return;
      const amount = clamp(((performance.now() - holdStarted) / HOLD_DURATION) * 100, 0, 100);
      setCharge(amount);
      arena?.classList.toggle("surging", amount >= 22);
      if (amount >= 100) {
        isHolding = false;
        cancelAnimationFrame(holdFrame);
        control.classList.remove("charging");
        beginFlight({ saveProgress: true });
        return;
      }
      holdFrame = requestAnimationFrame(updateHold);
    }

    function startHold(event) {
      if (completed || transitioning || isHolding) return;
      if (event.type === "pointerdown" && event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      isHolding = true;
      activePointerId = event.pointerId ?? null;
      holdStarted = performance.now();
      control.classList.add("charging");
      try { if (event.pointerId !== undefined) control.setPointerCapture(event.pointerId); } catch (_) {}
      holdFrame = requestAnimationFrame(updateHold);
    }

    function finishHold(event, cancelled = false) {
      if (!isHolding) return;
      if (event?.pointerId !== undefined && activePointerId !== null && event.pointerId !== activePointerId) return;
      const elapsed = performance.now() - holdStarted;
      cancelHold(false);
      if (!cancelled && elapsed >= HOLD_DURATION && !completed) beginFlight({ saveProgress: true });
      else if (!completed) {
        setCharge(0);
        if (caption) caption.textContent = "ЭНЕРГИЯ МОЛОТА · ОЖИДАНИЕ";
      }
    }

    function getStickyHeaderHeight() {
      const header = $(".site-header, header[role='banner'], header");
      if (!header) return 0;
      const style = getComputedStyle(header);
      return style.position === "sticky" || style.position === "fixed" ? header.getBoundingClientRect().height : 0;
    }

    function createFlightElement(startRect) {
      const clone = control.cloneNode(true);
      clone.removeAttribute("id");
      clone.removeAttribute("aria-label");
      clone.setAttribute("aria-hidden", "true");
      clone.className = "mjolnir-flight-clone";
      Object.assign(clone.style, {
        position: "fixed", left: `${startRect.left}px`, top: `${startRect.top}px`,
        width: `${startRect.width}px`, height: `${startRect.height}px`,
        margin: "0", padding: "0", border: "0", background: "transparent",
        display: "grid", placeItems: "center", zIndex: "99999", pointerEvents: "none",
        transform: "none", transformOrigin: "50% 85%", filter: "drop-shadow(0 18px 18px rgba(0,0,0,.48))",
        willChange: "left, top, width, height, transform, opacity"
      });
      clone.querySelector("svg")?.setAttribute("focusable", "false");
      document.body.appendChild(clone);
      return clone;
    }

    function addLandingImpact(x, y) {
      const impact = document.createElement("span");
      impact.className = "mjolnir-landing-impact";
      impact.setAttribute("aria-hidden", "true");
      Object.assign(impact.style, { position: "fixed", left: `${x}px`, top: `${y}px`, zIndex: "99998", pointerEvents: "none" });
      document.body.appendChild(impact);
      impact.addEventListener("animationend", () => impact.remove(), { once: true });
      setTimeout(() => impact.remove(), 1300);
    }

    function animateFlight() {
      return new Promise(resolve => {
        const sourceRect = control.getBoundingClientRect();
        const imageRect = styleImage?.getBoundingClientRect();
        if (!styleImage || !imageRect || !imageRect.width || !imageRect.height) {
          styleScene?.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
          setTimeout(resolve, reduced.matches ? 0 : 850);
          return;
        }

        const startScroll = window.scrollY;
        const headerHeight = getStickyHeaderHeight();
        const styleTop = styleScene.getBoundingClientRect().top + window.scrollY;
        const targetScroll = Math.max(0, styleTop - headerHeight - 8);
        const targetDocX = imageRect.left + window.scrollX + imageRect.width * .515;
        const targetDocY = imageRect.top + window.scrollY + imageRect.height * .485;
        const endWidth = clamp(imageRect.width * .19, 46, 104);
        const endHeight = endWidth * 1.5;
        const endX = targetDocX - endWidth / 2;
        const endY = targetDocY - endHeight / 2;
        const startX = sourceRect.left;
        const startY = sourceRect.top;
        const startW = sourceRect.width;
        const startH = sourceRect.height;
        const startTime = performance.now();
        const duration = reduced.matches ? 1 : 1450;
        flightNode = createFlightElement(sourceRect);
        control.style.visibility = "hidden";
        document.body.classList.add("mjolnir-flight-running");
        document.documentElement.classList.add("mjolnir-flight-running");

        if (reduced.matches) {
          window.scrollTo(0, targetScroll);
          Object.assign(flightNode.style, { left: `${endX}px`, top: `${endY}px`, width: `${endWidth}px`, height: `${endHeight}px`, transform: "rotate(42deg)" });
          finishFlight(targetDocX, targetDocY - targetScroll);
          resolve();
          return;
        }

        const tick = now => {
          const progress = clamp((now - startTime) / duration, 0, 1);
          const eased = easeInOut(progress);
          const scrollY = startScroll + (targetScroll - startScroll) * eased;
          window.scrollTo(0, scrollY);
          const viewportTargetY = targetDocY - scrollY;
          const x = startX + (endX - startX) * eased;
          const y = startY + (viewportTargetY - startY) * eased;
          const w = startW + (endWidth - startW) * eased;
          const h = startH + (endHeight - startH) * eased;
          flightNode.style.left = `${x}px`;
          flightNode.style.top = `${y}px`;
          flightNode.style.width = `${w}px`;
          flightNode.style.height = `${h}px`;
          flightNode.style.transform = `rotate(${42 * eased}deg)`;
          if (progress < 1) flightFrame = requestAnimationFrame(tick);
          else {
            finishFlight(targetDocX, targetDocY - targetScroll);
            resolve();
          }
        };
        flightFrame = requestAnimationFrame(tick);
      });
    }

    function finishFlight(x, y) {
      cancelAnimationFrame(flightFrame);
      flightNode?.remove();
      flightNode = null;
      control.style.visibility = "";
      document.body.classList.remove("mjolnir-flight-running");
      document.documentElement.classList.remove("mjolnir-flight-running");
      control.classList.add("already-completed");
      arena?.classList.add("released");
      if (caption) caption.textContent = "МЬЁЛЬНИР ПРИЗЕМЛИЛСЯ";
      if (stylePerson) {
        stylePerson.classList.add("mjolnir-landed");
        if (styleImage) {
          styleImage.classList.remove("portrait-landed");
          styleImage.classList.add("portrait-changing");
          styleImage.alt = "Хасан в образе Тора с Мьёльниром";
          const finishPortraitSwap = () => {
            styleImage.classList.remove("portrait-changing");
            styleImage.classList.add("portrait-landed");
          };
          styleImage.addEventListener("load", finishPortraitSwap, { once: true });
          styleImage.addEventListener("error", () => {
            styleImage.classList.remove("portrait-changing");
            console.error("Не удалось загрузить изображение Хасана с Мьёльниром:", landedPortraitSrc);
          }, { once: true });
          styleImage.src = landedPortraitSrc;
          if (styleImage.complete && styleImage.naturalWidth > 0) finishPortraitSwap();
        }
        const spark = document.createElement("span");
        spark.className = "mjolnir-hand-spark";
        spark.setAttribute("aria-hidden", "true");
        stylePerson.appendChild(spark);
        spark.addEventListener("animationend", () => spark.remove(), { once: true });
        setTimeout(() => spark.remove(), 1500);
      }
      addLandingImpact(x, y);
      setHighlightsReady();
      transitioning = false;
    }

    async function beginFlight({ saveProgress = false } = {}) {
      if (transitioning) return;
      transitioning = true;
      completed = true;
      if (saveProgress) persistHammerCompletion();
      if (instruction) instruction.hidden = true;
      if (styleImage && styleImage.getAttribute("src") !== initialPortraitSrc) {
        styleImage.src = initialPortraitSrc;
        styleImage.alt = "Хасан в образе Тора без Мьёльнира";
        styleImage.classList.remove("portrait-changing", "portrait-landed");
      }
      stylePerson?.classList.remove("mjolnir-landed");
      setCharge(100);
      control.classList.add("lifted");
      arena?.classList.add("released");
      if (caption) caption.textContent = "ЭНЕРГИЯ МОЛОТА · ВЫСВОБОЖДЕНА";
      await new Promise(resolve => setTimeout(resolve, reduced.matches ? 0 : 180));
      await animateFlight();
    }

    control.addEventListener("pointerdown", startHold);
    control.addEventListener("pointerup", event => finishHold(event, false));
    control.addEventListener("pointercancel", event => finishHold(event, true));
    control.addEventListener("lostpointercapture", event => finishHold(event, true));
    control.addEventListener("contextmenu", event => event.preventDefault());
    control.addEventListener("dragstart", event => event.preventDefault());
    control.addEventListener("keydown", event => {
      if ((event.key === " " || event.key === "Enter") && !event.repeat) startHold({ ...event, type: "keyboard", preventDefault: () => event.preventDefault() });
    });
    control.addEventListener("keyup", event => {
      if (event.key === " " || event.key === "Enter") finishHold(null, false);
    });
    control.addEventListener("blur", () => finishHold(null, true));
    window.addEventListener("blur", () => finishHold(null, true));
    document.addEventListener("visibilitychange", () => { if (document.hidden) finishHold(null, true); });
    window.addEventListener("pagehide", () => finishHold(null, true));

    highlightsToggle?.addEventListener("click", () => {
      const expanded = highlightsToggle.getAttribute("aria-expanded") === "true";
      highlightsToggle.setAttribute("aria-expanded", String(!expanded));
      highlightsContent.hidden = expanded;
      highlights?.classList.toggle("is-expanded", !expanded);
    });

    replayButton?.addEventListener("click", async () => {
      if (transitioning) return;
      const hammerTop = $("#hammer").getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, hammerTop - getStickyHeaderHeight()), behavior: reduced.matches ? "auto" : "smooth" });
      await new Promise(resolve => setTimeout(resolve, reduced.matches ? 0 : 850));
      arena?.classList.remove("released", "surging");
      control.classList.remove("lifted");
      if (styleImage) {
        styleImage.src = initialPortraitSrc;
        styleImage.alt = "Хасан в образе Тора без Мьёльнира";
        styleImage.classList.remove("portrait-changing", "portrait-landed");
      }
      stylePerson?.classList.remove("mjolnir-landed");
      await beginFlight({ saveProgress: false });
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

    const difference = event.target.closest("[data-difference]");
    if (difference) {
      const game = difference.closest("[data-spot-game]");
      if (game && !difference.classList.contains("is-found")) {
        difference.classList.add("is-found");
        difference.disabled = true;
        const differenceNumber = Number(difference.dataset.difference);
        if ([1, 2, 3].includes(differenceNumber) && !riddleState.sightFound.includes(differenceNumber)) {
          riddleState.sightFound.push(differenceNumber);
          riddleState.sightFound.sort((a, b) => a - b);
          persistState();
        }
        const found = riddleState.sightFound.length;
        const count = game.querySelector("[data-spot-count]");
        const feedback = game.querySelector("[data-spot-feedback]");
        if (count) count.textContent = `${found}/3`;
        if (feedback) feedback.textContent = found === 3 ? "Все три отличия найдены!" : "Есть! Продолжай искать.";
        if (found === 3 && !riddleState.solved.includes("sight")) solveRiddle("sight");
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
        : "";
    }
  }

  // Галерея реальных фотографий из массива galleryPhotos в content.js.
  function renderMemoryGallery() {
    const grid = $("#memoryGalleryGrid");
    if (!grid) return;

    const photos = Array.isArray(C.galleryPhotos) ? C.galleryPhotos : [];
    const available = photos.filter(item => item && item.src);

    grid.innerHTML = available.map((item, index) => `
      <figure class="memory-gallery-item gallery-shape-${(index % 6) + 1}">
        <img src="${escapeHTML(item.src)}" alt="${escapeHTML(item.alt || `Наш момент ${index + 1}`)}" loading="lazy" decoding="async">
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
  renderSenses();
  renderPersonalLetter();
  renderMemoryGallery();
  applyFixedPhotos();
  updateProgress();
  restoreRiddleState();
})();
