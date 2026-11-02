(() => {
  'use strict';
  const C = window.BIRTHDAY_CONTENT || {};
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const STORAGE = 'hasan-chapter-24-progress';
  const ASSET_KEY = 'hasan-chapter-24-assets';
  const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (_) { return fallback; } };
  let progress = new Set(safeRead(STORAGE, []));
  let assetData = safeRead(ASSET_KEY, {});
  const scenes = ['welcome','profile','admire','reasons','missions','achievement','transition','senses','final'];
  const senseIds = (C.senses || []).map(s => s.id);
  function showScene(id) {
    if (!scenes.includes(id)) return;
    $$('.scene').forEach(s => s.classList.toggle('active', s.id === id));
    window.scrollTo({top:0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    if (id === 'senses') renderSenses();
    if (id === 'achievement') updateAchievement();
    updateProgress();
  }
  function mark(id) { progress.add(id); try { localStorage.setItem(STORAGE, JSON.stringify([...progress])); } catch (_) {} updateProgress(); }
  function updateProgress() {
    const count = senseIds.filter(id => progress.has(id)).length;
    if ($('#progressCount')) $('#progressCount').textContent = `ОТКРЫТО: ${count} ИЗ 5`;
    if ($('#progressFill')) $('#progressFill').style.width = `${count*20}%`;
    $$('#progressSymbols span').forEach((el,i) => el.classList.toggle('done', progress.has(senseIds[i])));
    if ($('#finalAccess')) $('#finalAccess').disabled = count !== 5;
    const reasonCount = (C.notes || []).filter((_,i)=>progress.has(`note-${i}`)).length;
    if ($('#reasonCount')) $('#reasonCount').textContent = `${reasonCount} / ${(C.notes||[]).length}`;
    if ($('#reasonFill')) $('#reasonFill').style.width = `${(C.notes||[]).length ? reasonCount/(C.notes||[]).length*100 : 0}%`;
    if ($('#secretEnvelope')) $('#secretEnvelope').disabled = reasonCount !== (C.notes||[]).length;
  }
  function openModal(kicker,title,body) {
    $('#modalKicker').textContent=kicker; $('#modalTitle').textContent=title; $('#modalBody').innerHTML=body;
    $('#detailModal').classList.add('visible'); $('#detailModal').setAttribute('aria-hidden','false');
  }
  function closeModal() { $('#detailModal').classList.remove('visible'); $('#detailModal').setAttribute('aria-hidden','true'); }
  function toast(msg) { const t=$('#toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2400); }
  function renderStats() {
    $('#stats').innerHTML=(C.stats||[]).map((s,i)=>`<button class="stat-row" data-stat="${i}"><span class="stat-name">${s.name}</span><span class="stat-meter"><i style="--level:${Math.max(0,Math.min(100,Number(s.value)||0))}%"></i></span><span class="stat-value">${s.value ?? '—'}</span><span class="stat-plus">↗</span></button>`).join('');
  }
  function renderNotes() {
    $('#noteGrid').innerHTML=(C.notes||[]).map((n,i)=>`<button class="note-card note-${i+1}" data-note="${i}"><span class="note-tag">${n.tag||`ЗАМЕТКА / 0${i+1}`}</span><span class="note-stamp">${n.stamp||'Я ЗАМЕЧАЮ'}</span><strong>${n.title}</strong><span class="note-open">ОТКРЫТЬ ЗАМЕТКУ ↗</span></button>`).join('');
    renderReasonCarousel();
  }

  let reasonIndex = 0, reasonFlipped = false, carouselStartX = 0;
  function reasonImage(i) {
    const src = assetData[`reason-${i}`] || (C.media?.reasons || [])[i] || '';
    return src ? `<img src="${src}" alt="Личная фотография" style="object-position:${(C.reasonImagePositions||[])[i]||'50% 50%'}">`
      : `<div class="reason-photo-placeholder"><span>H.</span><small>ДОБАВЬ ФОТО<br>К ЭТОМУ ВОСПОМИНАНИЮ</small></div>`;
  }
  function renderReasonCarousel() {
    const stage = $('#reasonStage'); if (!stage) return;
    const items = C.reasons || []; if (!items.length) return;
    const total = items.length;
    const cardAt = (offset) => (reasonIndex + offset + total) % total;
    stage.innerHTML = [-1,0,1].map(offset => {
      const i = cardAt(offset), item = items[i], isCenter = offset === 0;
      return `<button class="reason-flip-card ${isCenter?'is-center':''} ${offset<0?'is-left':''} ${offset>0?'is-right':''} ${isCenter&&reasonFlipped?'is-flipped':''}" data-reason-card="${offset}" aria-label="${isCenter?'Перевернуть воспоминание':`Показать: ${item.title}`}">
        <span class="reason-card-inner">
          <span class="reason-card-front">${reasonImage(i)}<span class="reason-photo-caption">0${i+1} <b>${item.title}</b></span></span>
          <span class="reason-card-back"><small>ОДНА ИЗ ПРИЧИН</small><strong>${item.title}</strong><span>${item.text}</span><i>С ЛЮБОВЬЮ · Х.</i></span>
        </span>
      </button>`;
    }).join('');
    $('#reasonCounter').textContent = `${String(reasonIndex+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
    $('#reasonProgress').style.width = `${((reasonIndex+1)/total)*100}%`;
  }
  function shiftReason(direction) {
    const total = (C.reasons||[]).length;
    if (!total) return;
    reasonIndex = (reasonIndex + direction + total) % total;
    reasonFlipped = false;
    renderReasonCarousel();
  }
  $('#reasonPrev')?.addEventListener('click',()=>shiftReason(-1));
  $('#reasonNext')?.addEventListener('click',()=>shiftReason(1));
  $('#reasonStage')?.addEventListener('click', e => {
    const card = e.target.closest('[data-reason-card]'); if (!card) return;
    const offset = Number(card.dataset.reasonCard);
    if (offset !== 0) { shiftReason(offset); return; }
    reasonFlipped = !reasonFlipped; renderReasonCarousel();
  });
  $('#reasonStage')?.addEventListener('touchstart', e => { carouselStartX=e.changedTouches[0].clientX; }, {passive:true});
  $('#reasonStage')?.addEventListener('touchend', e => {
    const delta=e.changedTouches[0].clientX-carouselStartX;
    if (Math.abs(delta)>45) shiftReason(delta<0?1:-1);
  }, {passive:true});
  $('#reasonPhotoUpload')?.addEventListener('change', e => {
    const files=[...(e.target.files||[])];
    files.slice(0,6).forEach((file, offset) => {
      const index=(reasonIndex+offset)%(C.reasons||[]).length;
      if (!file.type.startsWith('image/')) return;
      const reader=new FileReader();
      reader.onload=()=>{
        assetData[`reason-${index}`]=reader.result;
        try { localStorage.setItem(ASSET_KEY,JSON.stringify(assetData)); renderReasonCarousel(); }
        catch (_) { toast('Фотография слишком большая для памяти браузера. Добавь её в папку assets/ и укажи путь в content.js.'); }
      };
      reader.readAsDataURL(file);
    });
    e.target.value='';
  });

  function fileControl(label, accept, key) { return `<label class="upload-control">＋ ${label}<input type="file" accept="${accept}" data-upload="${key}" hidden></label>`; }
  function photoHTML(key, className='memory-photo') {
    const idx=Number(key.split('-').pop()); const src=assetData[key] || (key.startsWith('sight-') ? (C.media?.sight||[])[idx] : '');
    return `<div class="${className}">${src ? `<img src="${src}" alt="Личное воспоминание">` : `<div class="photo-placeholder"><span class="placeholder-mark">♡</span><small>ЗДЕСЬ БУДЕТ<br>ТВОЁ ФОТО</small></div>`}</div>`;
  }
  function renderSenses() {
    const root=$('#senseList'); if(!root)return;
    root.innerHTML=(C.senses||[]).map(s=>{
      const done=progress.has(s.id);
      let extra='';
      if(s.kind==='photos') extra=`<div class="memory-photo-grid">${s.memories.map((m,j)=>`<button class="memory-photo-item" data-memory="${s.id}-${j}">${photoHTML(`${s.id}-${j}`)}<span>${m.title}</span></button>`).join('')}</div>${fileControl('ДОБАВИТЬ ФОТО','image/*',`${s.id}-upload`)}`;
      else if(s.kind==='audio') extra=`<div class="audio-station"><div class="vinyl" id="vinyl"><div class="vinyl-label">СТОРОНА<br>А</div></div><div class="audio-info"><span class="eyebrow">ЛИЧНАЯ ЗАПИСЬ</span><h4 id="audioName">Песня, которая звучит как мы</h4><audio id="personalAudio" controls ${assetData.audio||C.media?.audio ? `src="${assetData.audio||C.media.audio}"` : ''}></audio><p class="micro-hint">Здесь будет звучать загруженное аудио.</p>${fileControl('UPLOAD AUDIO','audio/*','audio')}</div></div><div class="memory-text-grid">${s.memories.map(m=>`<button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}"><b>${m.title}</b><span>READ THE NOTE ↗</span></button>`).join('')}</div>`;
      else if(s.kind==='cards') extra=`<div class="taste-grid">${s.memories.map((m,j)=>`<button class="taste-card taste-${j+1}" data-memory-title="${m.title}" data-memory-text="${m.text}"><span class="taste-number">0${j+1}</span><span class="taste-ornament">${['✿','☕','❦'][j%3]}</span><b>${m.title}</b><small>ОТКРЫТЬ ВОСПОМИНАНИЕ ↗</small></button>`).join('')}</div>`;
      else if(s.kind==='letter') extra=`<div class="touch-layout"><div class="fabric-note"><span class="handwritten">маленькое напоминание</span><p>Есть места, в которых чувствуешь себя как дома. А есть люди.</p><span class="fabric-heart">♡</span></div><div class="touch-notes">${s.memories.map(m=>`<button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}"><b>${m.title}</b><span>РАЗВЕРНУТЬ ↗</span></button>`).join('')}</div></div><div class="certificate"><span class="eyebrow">СЕРТИФИКАТ ДЛЯ ОЧЕНЬ ВАЖНОГО ЧЕЛОВЕКА</span><strong>Один полноценный<br><em>массаж.</em></strong><p>Redeemable whenever you need a little care.</p><span class="handwritten">всегда с любовью</span></div>`;
      else extra=`<div class="scent-layout"><div class="perfume-illustration"><div class="perfume-cap"></div><div class="perfume-bottle"><span>№ 23</span></div><div class="scent-spark">✳</div></div><div class="scent-notes">${s.memories.map(m=>`<button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}"><b>${m.title}</b><span>ОТКРЫТЬ ↗</span></button>`).join('')}${fileControl('ADD PERFUME PHOTO','image/*','perfume')}${(assetData.perfume||C.media?.perfume)?`<img class="perfume-upload" src="${assetData.perfume||C.media.perfume}" alt="Perfume">`:''}</div></div>`;
      return `<article class="sense-chapter sense-${s.id}" id="chapter-${s.id}"><div class="sense-number">${s.number}</div><div class="sense-main"><div class="sense-heading"><div><p class="eyebrow">${s.theme}</p><h3>${s.name} <em>/ ${s.ru}</em></h3><p class="sense-tagline">${s.tagline}</p></div><span class="sense-symbol">${s.symbol}</span></div><p class="sense-description">${s.description}</p><div class="sense-content">${extra}</div><div class="sense-foot"><span>${s.prompt}</span><button class="complete-btn ${done?'completed':''}" data-complete="${s.id}">${done?'CHAPTER ОТКРЫТО ✓':'ОТМЕТИТЬ ЭТУ ГЛАВУ ОТКРЫТО ↗'}</button></div></div></article>`;
    }).join('')+`<div class="unlock-final"><div><p class="eyebrow">КОГДА БУДЕШЬ ГОТОВ</p><h3>Осталось ещё<br><em>кое-что.</em></h3><p>Все пять глав ведут к одной последней странице.</p></div><button class="primary-btn" id="finalAccess" ${senseIds.every(id=>progress.has(id))?'':'disabled'}>ОТКРЫТЬ ПОСЛЕДНЮЮ СТРАНИЦУ <span>↗</span></button></div>`;
    const audio=$('#personalAudio'); if(audio){audio.addEventListener('play',()=>$('#vinyl')?.classList.add('playing'));audio.addEventListener('pause',()=>$('#vinyl')?.classList.remove('playing'));}
  }
  function renderCharacterExtras() {
    const abilities=C.abilities||[];
    $('#abilityList').innerHTML=abilities.map((x,i)=>`<button class="ability-item" data-ability="${i}"><span>0${i+1}</span><b>${x.title}</b><i>↗</i></button>`).join('');
    $('#passiveSkills').innerHTML=(C.passives||[]).map(x=>`<span>${x}</span>`).join('');
    $('#weaknessText').textContent=C.weakness||'A soft spot for the people he loves.';
    $('#superpowerText').textContent=C.signaturePower||'Making everything feel manageable.';
    $('#heroPowers').innerHTML=(C.superpowers||[]).map((x,i)=>`<p><span>0${i+1}</span>${x}</p>`).join('');
  }
  function renderMissions() {
    const powers=C.games?.powers||['Teleportation','Time control','Reading minds'];
    $('#powerGrid').innerHTML=powers.map((x,i)=>`<button class="power-option" data-power="${i}">${x}</button>`).join('');
    const q=C.games?.quiz||[];
    $('#quizArea').innerHTML=q.map((x,i)=>`<div class="quiz-question"><b>${i+1}. ${x.question}</b><div>${x.options.map((o,j)=>`<button class="quiz-option" data-quiz="${i}" data-answer="${j}">${o}</button>`).join('')}</div></div>`).join('')||'<p class="micro-hint">Добавь вопросы викторины в content.js.</p>';
    const mem=C.games?.memories||[];
    $('#memoryGame').innerHTML=mem.map((x,i)=>`<button class="memory-game-tile" data-match="${i}"><span>0${i+1}</span><b>${x.caption||'Воспоминание'}</b></button>`).join('');
    $('#secretPrompt').textContent=C.games?.secret?.prompt||'Какая деталь в этой маленькой вселенной самая важная?';
    $('#secretOptions').innerHTML=(C.games?.secret?.options||['Маленькие детали','Большие приключения','Человек рядом со мной']).map((x,i)=>`<button class="secret-option" data-secret="${i}">${x}</button>`).join('');
  }
  function updateAchievement() {
    const keys=['power','quiz','memory','secret'];
    const n=keys.filter(k=>progress.has(`mission-${k}`)).length;
    $('#achievementHint').textContent=n===4?'Достижение открыто. Титул заслужен.':`ВЫПОЛНЕНО ЗАДАНИЙ: ${n} ИЗ 4 · ПРОДОЛЖАЙ ИССЛЕДОВАТЬ`;
    $('#achievementContinue').disabled=n!==4;
  }
  function reset(){if(confirm('Начать эту историю заново? Загруженные фотографии и аудио останутся сохранены.')){progress.clear();localStorage.removeItem(STORAGE);showScene('welcome');}}
  $('#beginBtn').addEventListener('click',()=>showScene('profile'));
  $$('[data-next]').forEach(b=>b.addEventListener('click',()=>showScene(b.dataset.next)));
  $$('[data-home]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();showScene('welcome')}));
  $('#restartTop').addEventListener('click',reset); $('#restartFinal').addEventListener('click',reset);
  renderStats(); renderNotes(); renderReasonCarousel(); renderCharacterExtras(); renderMissions();
  $('#liftHammer').addEventListener('click',()=>{$('#liftHammer').classList.add('lifted');document.body.classList.add('lightning-hit');$('#hammerResponse').textContent=C.hammerMessage||'Молот выбрал его. Я просто согласилась.';mark('hammer');setTimeout(()=>document.body.classList.remove('lightning-hit'),850);});
  $('#achievementContinue').addEventListener('click',()=>{if(['power','quiz','memory','secret'].every(k=>progress.has(`mission-${k}`)))showScene('transition');});
  $('#secretEnvelope').addEventListener('click',()=>{if(!$('#secretEnvelope').disabled)openModal('ПОСЛЕДНЯЯ ГЛАВА',C.finalReason?.title||'My favourite person',`<p class="modal-copy">${C.finalReason?.text||'You are my favourite person.'}</p>`);});
  document.addEventListener('click',e=>{
    const stat=e.target.closest('[data-stat]'); if(stat){const s=C.stats[+stat.dataset.stat];openModal('ДОСЬЕ ПЕРСОНАЖА',s.name,`<p class="modal-copy">${s.note||''}</p>`);}
    const note=e.target.closest('[data-note]'); if(note){const i=+note.dataset.note,n=C.notes[i];mark(`note-${i}`);openModal(n.tag||'НЕБОЛЬШАЯ ЗАМЕТКА',n.title,`<p class="modal-copy">${n.text}</p>`);updateProgress();}

    const ability=e.target.closest('[data-ability]');if(ability){const a=C.abilities[+ability.dataset.ability];openModal('ОСОБАЯ СПОСОБНОСТЬ',a.title,`<p class="modal-copy">${a.text}</p>`);}
    const memory=e.target.closest('[data-memory-title]');if(memory)openModal('МАЛЕНЬКОЕ ВОСПОМИНАНИЕ',memory.dataset.memoryTitle,`<p class="modal-copy">${memory.dataset.memoryText}</p>`);
    const photo=e.target.closest('[data-memory]');if(photo){const key=photo.dataset.memory;openModal('МОМЕНТ, КОТОРЫЙ ХОЧЕТСЯ СОХРАНИТЬ','День, который хочется сохранить',`${photoHTML(key,'modal-photo')}<p class="modal-small">ЗАГРУЗИ ФОТО С ПОМОЩЬЮ КНОПКИ ПОД ГАЛЕРЕЕЙ.</p>`);}
    const complete=e.target.closest('[data-complete]');if(complete){mark(complete.dataset.complete);renderSenses();toast('Глава сохранена.');}
    if(e.target.closest('#finalAccess')&&senseIds.every(id=>progress.has(id)))showScene('final');
    if(e.target.closest('[data-close]'))closeModal();
    if(e.target.closest('#openFinal'))$('#finalEnvelope').classList.toggle('opened');
    const power=e.target.closest('[data-power]');if(power){$$('[data-power]').forEach(x=>x.classList.remove('selected'));power.classList.add('selected');$('#powerResult').textContent=`Выбрано: ${C.games.powers[+power.dataset.power]}. Очень по-хасановски.`;mark('mission-power');updateAchievement();}
    const quiz=e.target.closest('[data-quiz]');if(quiz){quiz.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));quiz.classList.add('selected');const qi=+quiz.dataset.quiz;const answered=$$('[data-quiz]').filter(x=>x.classList.contains('selected'));if(answered.length>=(C.games.quiz||[]).length){mark('mission-quiz');toast('Quiz complete.');updateAchievement();}}
    const match=e.target.closest('[data-match]');if(match){match.classList.toggle('matched');if($$('[data-match].matched').length===(C.games.memories||[]).length){mark('mission-memory');$('#memoryFeedback').textContent='Все воспоминания найдены.';updateAchievement();}}
    const secret=e.target.closest('[data-secret]');if(secret){$$('[data-secret]').forEach(x=>x.classList.remove('selected'));secret.classList.add('selected');$('#secretResult').textContent=C.games.secret.result||'Правильный ответ: ты. Всегда ты.';mark('mission-secret');updateAchievement();}
  });
  $('#detailModal').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  document.addEventListener('change',e=>{
    const input=e.target.closest('[data-upload]');if(!input||!input.files?.[0])return;
    const file=input.files[0],key=input.dataset.upload;
    if(file.size>2.5*1024*1024){toast('Выбери файл размером меньше 2,5 МБ.');input.value='';return;}
    const reader=new FileReader();reader.onload=()=>{assetData[key]=reader.result;try{localStorage.setItem(ASSET_KEY,JSON.stringify(assetData));}catch(_){toast('Память заполнена. Для больших файлов используй папку assets.');return;}
      if(key==='audio'){const a=$('#personalAudio');a.src=assetData[key];$('#audioName').textContent=file.name;a.load();}
      else if(key==='perfume'||key.endsWith('-upload')){if(key.endsWith('-upload'))assetData[`${key.replace('-upload','')}-0`]=reader.result;renderSenses();}
      else {const frame=$(`[data-photo="${key}"]`);if(frame){const old=frame.querySelector('.photo-placeholder,img');const img=document.createElement('img');img.src=reader.result;img.alt='Личная фотография';old?.replaceWith(img);} }
      toast('Сохранено в этом браузере.');
    };reader.readAsDataURL(file);
  });
  $$('[data-photo]').forEach(el=>{const key=el.dataset.photo,src=assetData[key]||C.media?.[key];if(src){const old=el.querySelector('.photo-placeholder,img');if(old){const img=document.createElement('img');img.src=src;img.alt='Личная фотография';old.replaceWith(img);}}});
  const letter=typeof C.finalLetter==='string'?{salutation:C.finalLetter,body:'',signature:'Always yours,'}:C.finalLetter||{};
  $('#finalLetterText').textContent=letter.salutation||'My love,';
  $('#finalLetterBody').textContent=letter.body||'';
  $('#finalLetterSignature').textContent=letter.signature||'Always yours,';
  updateProgress(); updateAchievement();
})();