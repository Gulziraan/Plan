(() => {
  'use strict';
  const C = window.BIRTHDAY_CONTENT || {};
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const STORAGE = 'hasan-chapter-23-progress';
  const ASSET_KEY = 'hasan-chapter-23-assets';
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
    if ($('#progressCount')) $('#progressCount').textContent = `${count} OF 5 OPENED`;
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
    $('#noteGrid').innerHTML=(C.notes||[]).map((n,i)=>`<button class="note-card note-${i+1}" data-note="${i}"><span class="note-tag">${n.tag||`NOTE / 0${i+1}`}</span><span class="note-stamp">${n.stamp||'I NOTICE'}</span><strong>${n.title}</strong><span class="note-open">OPEN NOTE ↗</span></button>`).join('');
    $('#reasonGrid').innerHTML=(C.reasons||[]).map((n,i)=>`<button class="reason-envelope" data-reason="${i}"><span class="envelope-number">0${i+1}</span><span class="envelope-seal">H</span><b>${n.title}</b><small>OPEN LETTER ↗</small></button>`).join('');
  }
  function fileControl(label, accept, key) { return `<label class="upload-control">＋ ${label}<input type="file" accept="${accept}" data-upload="${key}" hidden></label>`; }
  function photoHTML(key, className='memory-photo') {
    const idx=Number(key.split('-').pop()); const src=assetData[key] || (key.startsWith('sight-') ? (C.media?.sight||[])[idx] : '');
    return `<div class="${className}">${src ? `<img src="${src}" alt="Personal memory">` : `<div class="photo-placeholder"><span class="placeholder-mark">♡</span><small>YOUR PHOTO<br>GOES HERE</small></div>`}</div>`;
  }
  function renderSenses() {
    const root=$('#senseList'); if(!root)return;
    root.innerHTML=(C.senses||[]).map(s=>{
      const done=progress.has(s.id);
      let extra='';
      if(s.kind==='photos') extra=`<div class="memory-photo-grid">${s.memories.map((m,j)=>`<button class="memory-photo-item" data-memory="${s.id}-${j}">${photoHTML(`${s.id}-${j}`)}<span>${m.title}</span></button>`).join('')}</div>${fileControl('ADD A PHOTO','image/*',`${s.id}-upload`)}`;
      else if(s.kind==='audio') extra=`<div class="audio-station"><div class="vinyl" id="vinyl"><div class="vinyl-label">SIDE<br>A</div></div><div class="audio-info"><span class="eyebrow">A PERSONAL RECORDING</span><h4 id="audioName">A song that sounds like us</h4><audio id="personalAudio" controls ${assetData.audio||C.media?.audio ? `src="${assetData.audio||C.media.audio}"` : ''}></audio><p class="micro-hint">Your uploaded audio plays here.</p>${fileControl('UPLOAD AUDIO','audio/*','audio')}</div></div><div class="memory-text-grid">${s.memories.map(m=>`<button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}"><b>${m.title}</b><span>READ THE NOTE ↗</span></button>`).join('')}</div>`;
      else if(s.kind==='cards') extra=`<div class="taste-grid">${s.memories.map((m,j)=>`<button class="taste-card taste-${j+1}" data-memory-title="${m.title}" data-memory-text="${m.text}"><span class="taste-number">0${j+1}</span><span class="taste-ornament">${['✿','☕','❦'][j%3]}</span><b>${m.title}</b><small>OPEN MEMORY ↗</small></button>`).join('')}</div>`;
      else if(s.kind==='letter') extra=`<div class="touch-layout"><div class="fabric-note"><span class="handwritten">a little reminder</span><p>There are places that feel like home. And then there are people.</p><span class="fabric-heart">♡</span></div><div class="touch-notes">${s.memories.map(m=>`<button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}"><b>${m.title}</b><span>UNFOLD ↗</span></button>`).join('')}</div></div><div class="certificate"><span class="eyebrow">A CERTIFICATE FOR ONE VERY IMPORTANT PERSON</span><strong>One proper<br><em>massage.</em></strong><p>Redeemable whenever you need a little care.</p><span class="handwritten">with love, always</span></div>`;
      else extra=`<div class="scent-layout"><div class="perfume-illustration"><div class="perfume-cap"></div><div class="perfume-bottle"><span>№ 23</span></div><div class="scent-spark">✳</div></div><div class="scent-notes">${s.memories.map(m=>`<button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}"><b>${m.title}</b><span>REVEAL ↗</span></button>`).join('')}${fileControl('ADD PERFUME PHOTO','image/*','perfume')}${(assetData.perfume||C.media?.perfume)?`<img class="perfume-upload" src="${assetData.perfume||C.media.perfume}" alt="Perfume">`:''}</div></div>`;
      return `<article class="sense-chapter sense-${s.id}" id="chapter-${s.id}"><div class="sense-number">${s.number}</div><div class="sense-main"><div class="sense-heading"><div><p class="eyebrow">${s.theme}</p><h3>${s.name} <em>/ ${s.ru}</em></h3><p class="sense-tagline">${s.tagline}</p></div><span class="sense-symbol">${s.symbol}</span></div><p class="sense-description">${s.description}</p><div class="sense-content">${extra}</div><div class="sense-foot"><span>${s.prompt}</span><button class="complete-btn ${done?'completed':''}" data-complete="${s.id}">${done?'CHAPTER OPENED ✓':'MARK THIS CHAPTER OPENED ↗'}</button></div></div></article>`;
    }).join('')+`<div class="unlock-final"><div><p class="eyebrow">WHEN YOU ARE READY</p><h3>There is one last<br><em>thing.</em></h3><p>All five chapters lead to one final page.</p></div><button class="primary-btn" id="finalAccess" ${senseIds.every(id=>progress.has(id))?'':'disabled'}>OPEN THE LAST PAGE <span>↗</span></button></div>`;
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
    $('#quizArea').innerHTML=q.map((x,i)=>`<div class="quiz-question"><b>${i+1}. ${x.question}</b><div>${x.options.map((o,j)=>`<button class="quiz-option" data-quiz="${i}" data-answer="${j}">${o}</button>`).join('')}</div></div>`).join('')||'<p class="micro-hint">Add quiz questions in content.js.</p>';
    const mem=C.games?.memories||[];
    $('#memoryGame').innerHTML=mem.map((x,i)=>`<button class="memory-game-tile" data-match="${i}"><span>0${i+1}</span><b>${x.caption||'A memory'}</b></button>`).join('');
    $('#secretPrompt').textContent=C.games?.secret?.prompt||'Which detail is the most important in this little universe?';
    $('#secretOptions').innerHTML=(C.games?.secret?.options||['The little things','The big adventures','The person beside me']).map((x,i)=>`<button class="secret-option" data-secret="${i}">${x}</button>`).join('');
  }
  function updateAchievement() {
    const keys=['power','quiz','memory','secret'];
    const n=keys.filter(k=>progress.has(`mission-${k}`)).length;
    $('#achievementHint').textContent=n===4?'Achievement unlocked. A title well earned.':`${n} OF 4 MISSIONS COMPLETE · KEEP EXPLORING`;
    $('#achievementContinue').disabled=n!==4;
  }
  function reset(){if(confirm('Start this birthday story again? Your uploaded photos and audio will stay saved.')){progress.clear();localStorage.removeItem(STORAGE);showScene('welcome');}}
  $('#beginBtn').addEventListener('click',()=>showScene('profile'));
  $$('[data-next]').forEach(b=>b.addEventListener('click',()=>showScene(b.dataset.next)));
  $$('[data-home]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();showScene('welcome')}));
  $('#restartTop').addEventListener('click',reset); $('#restartFinal').addEventListener('click',reset);
  renderStats(); renderNotes(); renderCharacterExtras(); renderMissions();
  $('#liftHammer').addEventListener('click',()=>{$('#liftHammer').classList.add('lifted');document.body.classList.add('lightning-hit');$('#hammerResponse').textContent=C.hammerMessage||'The hammer chose him. I just agreed.';mark('hammer');setTimeout(()=>document.body.classList.remove('lightning-hit'),850);});
  $('#achievementContinue').addEventListener('click',()=>{if(['power','quiz','memory','secret'].every(k=>progress.has(`mission-${k}`)))showScene('transition');});
  $('#secretEnvelope').addEventListener('click',()=>{if(!$('#secretEnvelope').disabled)openModal('THE LAST ENVELOPE',C.finalReason?.title||'My favourite person',`<p class="modal-copy">${C.finalReason?.text||'You are my favourite person.'}</p>`);});
  document.addEventListener('click',e=>{
    const stat=e.target.closest('[data-stat]'); if(stat){const s=C.stats[+stat.dataset.stat];openModal('CHARACTER FILE',s.name,`<p class="modal-copy">${s.note||''}</p>`);}
    const note=e.target.closest('[data-note]'); if(note){const i=+note.dataset.note,n=C.notes[i];mark(`note-${i}`);openModal(n.tag||'A LITTLE NOTE',n.title,`<p class="modal-copy">${n.text}</p>`);updateProgress();}
    const reason=e.target.closest('[data-reason]');if(reason){const n=C.reasons[+reason.dataset.reason];openModal('A LITTLE TRUTH',n.title,`<p class="modal-copy">${n.text}</p>`);}
    const ability=e.target.closest('[data-ability]');if(ability){const a=C.abilities[+ability.dataset.ability];openModal('SPECIAL ABILITY',a.title,`<p class="modal-copy">${a.text}</p>`);}
    const memory=e.target.closest('[data-memory-title]');if(memory)openModal('A LITTLE MEMORY',memory.dataset.memoryTitle,`<p class="modal-copy">${memory.dataset.memoryText}</p>`);
    const photo=e.target.closest('[data-memory]');if(photo){const key=photo.dataset.memory;openModal('A MOMENT TO KEEP','A day worth keeping',`${photoHTML(key,'modal-photo')}<p class="modal-small">UPLOAD A PHOTO USING THE CONTROL BELOW THE COLLAGE.</p>`);}
    const complete=e.target.closest('[data-complete]');if(complete){mark(complete.dataset.complete);renderSenses();toast('Chapter saved.');}
    if(e.target.closest('#finalAccess')&&senseIds.every(id=>progress.has(id)))showScene('final');
    if(e.target.closest('[data-close]'))closeModal();
    if(e.target.closest('#openFinal'))$('#finalEnvelope').classList.toggle('opened');
    const power=e.target.closest('[data-power]');if(power){$$('[data-power]').forEach(x=>x.classList.remove('selected'));power.classList.add('selected');$('#powerResult').textContent=`Selected: ${C.games.powers[+power.dataset.power]}. A very Hasan choice.`;mark('mission-power');updateAchievement();}
    const quiz=e.target.closest('[data-quiz]');if(quiz){quiz.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));quiz.classList.add('selected');const qi=+quiz.dataset.quiz;const answered=$$('[data-quiz]').filter(x=>x.classList.contains('selected'));if(answered.length>=(C.games.quiz||[]).length){mark('mission-quiz');toast('Quiz complete.');updateAchievement();}}
    const match=e.target.closest('[data-match]');if(match){match.classList.toggle('matched');if($$('[data-match].matched').length===(C.games.memories||[]).length){mark('mission-memory');$('#memoryFeedback').textContent='All memories matched.';updateAchievement();}}
    const secret=e.target.closest('[data-secret]');if(secret){$$('[data-secret]').forEach(x=>x.classList.remove('selected'));secret.classList.add('selected');$('#secretResult').textContent=C.games.secret.result||'Correct answer: you. Always you.';mark('mission-secret');updateAchievement();}
  });
  $('#detailModal').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  document.addEventListener('change',e=>{
    const input=e.target.closest('[data-upload]');if(!input||!input.files?.[0])return;
    const file=input.files[0],key=input.dataset.upload;
    if(file.size>2.5*1024*1024){toast('Choose a file smaller than 2.5 MB.');input.value='';return;}
    const reader=new FileReader();reader.onload=()=>{assetData[key]=reader.result;try{localStorage.setItem(ASSET_KEY,JSON.stringify(assetData));}catch(_){toast('Storage is full. Use the assets folder for large media.');return;}
      if(key==='audio'){const a=$('#personalAudio');a.src=assetData[key];$('#audioName').textContent=file.name;a.load();}
      else if(key==='perfume'||key.endsWith('-upload')){if(key.endsWith('-upload'))assetData[`${key.replace('-upload','')}-0`]=reader.result;renderSenses();}
      else {const frame=$(`[data-photo="${key}"]`);if(frame){const old=frame.querySelector('.photo-placeholder,img');const img=document.createElement('img');img.src=reader.result;img.alt='Personal photograph';old?.replaceWith(img);} }
      toast('Saved in this browser.');
    };reader.readAsDataURL(file);
  });
  $$('[data-photo]').forEach(el=>{const key=el.dataset.photo,src=assetData[key]||C.media?.[key];if(src){const old=el.querySelector('.photo-placeholder,img');if(old){const img=document.createElement('img');img.src=src;img.alt='Personal photograph';old.replaceWith(img);}}});
  const letter=typeof C.finalLetter==='string'?{salutation:C.finalLetter,body:'',signature:'Always yours,'}:C.finalLetter||{};
  $('#finalLetterText').textContent=letter.salutation||'My love,';
  $('#finalLetterBody').textContent=letter.body||'';
  $('#finalLetterSignature').textContent=letter.signature||'Always yours,';
  updateProgress(); updateAchievement();
})();