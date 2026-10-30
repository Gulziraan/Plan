(() => {
  'use strict';
  const C = window.BIRTHDAY_CONTENT;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const STORAGE = 'hasan-chapter-23-progress';
  const ASSET_KEY = 'hasan-chapter-23-assets';
  const safeRead = key => { try { const v=JSON.parse(localStorage.getItem(key)||'[]'); return v; } catch (_) { return []; } };
  let progress = new Set(safeRead(STORAGE));
  let assetData = {}; try { assetData = JSON.parse(localStorage.getItem(ASSET_KEY)||'{}'); } catch (_) {}
  let quizIndex = progress.has('game-quiz') ? C.games.quiz.length : 0, quizAnswers = [], memoryOpen = [], memoryMatched = new Set(), memoryBusy = false;
  if (progress.has('game-memory')) memoryMatched = new Set(C.games.memories.map(m=>m.id));
  const scenes = ['welcome','profile','admire','reasons','missions','achievement','transition','senses','final'];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function saveProgress(){ localStorage.setItem(STORAGE, JSON.stringify([...progress])); updateProgress(); }
  function mark(id){ if(!progress.has(id)){progress.add(id);saveProgress();updateAchievement();} }
  function showScene(id){
    if(!scenes.includes(id)) return;
    $$('.scene').forEach(s=>s.classList.toggle('active',s.id===id));
    window.scrollTo({top:0,behavior:reducedMotion()?'auto':'smooth'});
    if(id==='profile') mark('profile-viewed');
    if(id==='senses') renderSenses();
    if(id==='achievement') updateAchievement();
  }
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}
  function openModal(kicker,title,body){$('#modalKicker').textContent=kicker;$('#modalTitle').textContent=title;$('#modalBody').innerHTML=body;$('#detailModal').classList.add('visible');$('#detailModal').setAttribute('aria-hidden','false');}
  function closeModal(){$('#detailModal').classList.remove('visible');$('#detailModal').setAttribute('aria-hidden','true');}

  function renderStats(){
    const character=C.character||{};
    $('#stats').innerHTML=(character.stats||C.stats||[]).map((s,i)=>`<button class="stat-row" data-stat="${i}"><span class="stat-name">${escapeHTML(s.name)}</span><span class="stat-meter"><i style="--level:${Math.max(0,Math.min(100,Number(s.value)||0))}%"></i></span><span class="stat-value">${escapeHTML(s.value)}</span><span class="stat-plus">+</span></button>`).join('');
    $('#abilityList').innerHTML=(character.abilities||[]).map((a,i)=>`<button class="ability-chip" data-ability="${i}"><span>${escapeHTML(a.icon)}</span><b>${escapeHTML(a.name)}</b><i>＋</i></button>`).join('');
    $('#passiveSkills').innerHTML=(character.passives||[]).map(x=>`<span>◇ ${escapeHTML(x)}</span>`).join('');
    $('#weaknessText').textContent=character.weakness||'CLASSIFIED';
    $('#superpowerText').textContent=character.superpower||'TO BE DISCOVERED';
    $('.character-description').textContent=character.description||'';
    $('.character-rank span:nth-child(2)').textContent=character.rarity||'LEGENDARY';
    $('.character-rank span:last-child').textContent=`CLASS: ${character.className||'THE STRATEGIST'}`;
  }
  function renderNotes(){
    $('#noteGrid').innerHTML=C.notes.map((n,i)=>`<button class="note-card note-${i+1}" data-note="${i}"><span class="note-tag">${escapeHTML(n.tag)}</span><span class="note-stamp">${escapeHTML(n.stamp)}</span>${n.image?`<img class="note-image" src="${escapeHTML(n.image)}" alt="">`:''}<strong>${escapeHTML(n.title)}</strong><span class="note-open">OPEN NOTE ↗</span></button>`).join('');
  }
  function renderReasons(){
    $('#reasonGrid').innerHTML=C.reasons.map((r,i)=>`<button class="reason-envelope ${progress.has(`reason-${i}`)?'opened':''}" data-reason="${i}" aria-label="Open envelope ${i+1}"><span class="envelope-number">0${i+1}</span><span class="envelope-title">${escapeHTML(r.title)}</span><span class="envelope-seal">${progress.has(`reason-${i}`)?'✓':'H ♥'}</span><small>${progress.has(`reason-${i}`)?'OPENED':'CLICK TO OPEN'}</small></button>`).join('');
    const count=C.reasons.filter((_,i)=>progress.has(`reason-${i}`)).length;
    $('#reasonCount').textContent=`${count} / ${C.reasons.length}`;
    $('#reasonFill').style.width=`${count/C.reasons.length*100}%`;
    const unlocked=count===C.reasons.length;
    $('#secretEnvelope').disabled=!unlocked;
    $('#secretEnvelope').classList.toggle('unlocked',unlocked);
    $('#secretEnvelope').classList.toggle('opened',progress.has('reason-final'));
    $('#secretEnvelope').querySelector('b').textContent=progress.has('reason-final')?'THE LAST NOTE IS OPEN':'THE LAST ENVELOPE';
  }
  function renderPower(){
    $('#powerGrid').innerHTML=C.games.powers.map((p,i)=>`<button class="power-card ${progress.has('game-power')&&localStorage.getItem('hasan-selected-power')===p.id?'selected':''}" data-power="${i}"><span class="power-icon">${escapeHTML(p.icon)}</span><b>${escapeHTML(p.title)}</b><small>SELECT POWER ↗</small></button>`).join('');
    if(progress.has('game-power')){
      const id=localStorage.getItem('hasan-selected-power');const choice=C.games.powers.find(p=>p.id===id);
      if(choice) $('#powerResult').innerHTML=`<p>${escapeHTML(choice.reaction)}</p><span>POWER SELECTED ✓</span>`;
      setStatus('power',true);
    }
  }
  function setStatus(id,done){const el=$(`[data-status="${id}"]`);if(el){el.textContent=done?'COMPLETED ✓':'NOT STARTED';el.classList.toggle('done',done);}}
  function renderQuiz(){
    const q=C.games.quiz[quizIndex];
    if(!q){$('#quizArea').innerHTML=`<div class="quiz-complete"><span>✓</span><b>MISSION COMPLETE</b><p>Three answers. Zero judgement. A very good player.</p><button class="text-btn" data-quiz-restart>PLAY AGAIN ↗</button></div>`;setStatus('quiz',true);return;}
    $('#quizArea').innerHTML=`<div class="quiz-progress">QUESTION 0${quizIndex+1} / 0${C.games.quiz.length}</div><h4 class="quiz-question">${escapeHTML(q.question)}</h4><div class="quiz-options">${q.answers.map((a,i)=>`<button data-answer="${i}">${escapeHTML(a)} <span>↗</span></button>`).join('')}</div>`;
  }
  function renderMemory(){
    const cards=[];
    C.games.memories.forEach((m,i)=>{cards.push({id:m.id,type:'photo',index:i});cards.push({id:m.id,type:'caption',index:i});});
    const shuffled=cards.sort((a,b)=>((a.id.charCodeAt(0)*7+(a.type==='photo'?2:5))%11)-((b.id.charCodeAt(0)*7+(b.type==='photo'?2:5))%11));
    $('#memoryGame').innerHTML=shuffled.map((c,i)=>{
      const m=C.games.memories[c.index],key=`memory-${m.id}`,src=assetData[key]||m.image;
      const isOpen=memoryOpen.includes(i)||memoryMatched.has(c.id);
      const face=c.type==='photo'?(src?`<img src="${escapeHTML(src)}" alt="Memory photo">`:`<span class="memory-placeholder">PHOTO<br>0${c.index+1}</span>`):`<span class="memory-caption">${escapeHTML(m.caption)}</span>`;
      return `<button class="memory-tile ${isOpen?'revealed':''} ${memoryMatched.has(c.id)?'matched':''}" data-memory-tile="${i}" data-pair="${c.id}" data-kind="${c.type}"><span class="memory-tile-back">H.</span><span class="memory-tile-face">${face}</span></button>`;
    }).join('')+C.games.memories.map(m=>`<label class="upload-control memory-upload">＋ PHOTO 0${C.games.memories.indexOf(m)+1}<input type="file" accept="image/*" data-upload="memory-${m.id}" hidden></label>`).join('');
    if(memoryMatched.size===C.games.memories.length){$('#memoryFeedback').textContent='All pairs found. Every photograph has its little story.';mark('game-memory');setStatus('memory',true);}
  }
  function renderSecret(){
    const s=C.games.secret;$('#secretPrompt').textContent=s.prompt;
    $('#secretOptions').innerHTML=s.options.map((o,i)=>`<button data-secret-answer="${i}">${escapeHTML(o)}</button>`).join('');
    if(progress.has('game-secret')){$('#secretResult').innerHTML=`<p>${escapeHTML(s.success)}</p><span>SECRET UNLOCKED ✓</span>`;setStatus('secret',true);}
  }
  function updateAchievement(){
    const notesDone=C.notes.every((_,i)=>progress.has(`note-${i}`));
    const done=['profile-viewed','game-power','game-quiz','game-memory','game-secret','reason-final'].every(x=>progress.has(x)) && notesDone;
    $('#achievementContinue').disabled=!done;
    const missionCount=['game-power','game-quiz','game-memory','game-secret'].filter(x=>progress.has(x)).length;
    const noteCount=C.notes.filter((_,i)=>progress.has(`note-${i}`)).length;
    const reasonCount=C.reasons.filter((_,i)=>progress.has(`reason-${i}`)).length;
    $('#achievementHint').textContent=done?'ACHIEVEMENT UNLOCKED · READY FOR THE NEXT CHAPTER':`PROFILE ${progress.has('profile-viewed')?'✓':'—'} · NOTES ${noteCount}/${C.notes.length} · LETTERS ${reasonCount}/${C.reasons.length} · MISSIONS ${missionCount}/4`;
    $('#achievementTitle').classList.toggle('earned',done);
  }

  function fileControl(label,accept,key){return `<label class="upload-control">＋ ${label}<input type="file" accept="${accept}" data-upload="${key}" hidden></label>`;}
  function photoHTML(key,className='memory-photo'){
    const index=Number(key.split('-').pop());const src=assetData[key]||(key.startsWith('sight-')?C.media.sight[index]:'');
    return `<div class="${className}">${src?`<img src="${escapeHTML(src)}" alt="Personal memory">`:`<div class="photo-placeholder"><span class="placeholder-mark">♡</span><small>YOUR PHOTO<br>GOES HERE</small></div>`}</div>`;
  }
  function renderSenses(){
    const root=$('#senseList');
    root.innerHTML=C.senses.map(s=>{
      const done=progress.has(s.id);
      const extra=s.kind==='photos'?`<div class="memory-photo-grid">${s.memories.map((m,j)=>`<button class="memory-photo-item" data-memory="${s.id}-${j}">${photoHTML(`${s.id}-${j}`)}<span>${escapeHTML(m.title)}</span></button>`).join('')}</div>${fileControl('ADD A PHOTO','image/*',`${s.id}-upload`)}`
      :s.kind==='audio'?`<div class="audio-station"><div class="vinyl" id="vinyl"><div class="vinyl-label">SIDE<br>A</div></div><div class="audio-info"><span class="eyebrow">A PERSONAL RECORDING</span><h4 id="audioName">A song that sounds like us</h4><audio id="personalAudio" controls ${(assetData.audio||C.media.audio)?`src="${escapeHTML(assetData.audio||C.media.audio)}"`:''}></audio><p class="micro-hint">Only your uploaded audio will play here.</p>${fileControl('UPLOAD AUDIO','audio/*','audio')}</div></div><div class="memory-text-grid">${s.memories.map(m=>`<button class="memory-text-card" data-memory-title="${escapeHTML(m.title)}" data-memory-text="${escapeHTML(m.text)}"><b>${escapeHTML(m.title)}</b><span>READ THE NOTE ↗</span></button>`).join('')}</div>`
      :s.kind==='cards'?`<div class="taste-grid">${s.memories.map((m,j)=>`<button class="taste-card taste-${j+1}" data-memory-title="${escapeHTML(m.title)}" data-memory-text="${escapeHTML(m.text)}"><span class="taste-number">0${j+1}</span><span class="taste-ornament">${['✿','☕','❦'][j%3]}</span><b>${escapeHTML(m.title)}</b><small>OPEN MEMORY ↗</small></button>`).join('')}</div>`
      :s.kind==='letter'?`<div class="touch-layout"><div class="fabric-note"><span class="handwritten">a little reminder</span><p>There are places that feel like home. And then there are people.</p><span class="fabric-heart">♡</span></div><div class="touch-notes">${s.memories.map(m=>`<button class="memory-text-card" data-memory-title="${escapeHTML(m.title)}" data-memory-text="${escapeHTML(m.text)}"><b>${escapeHTML(m.title)}</b><span>UNFOLD ↗</span></button>`).join('')}</div></div><div class="certificate"><span class="eyebrow">A CERTIFICATE FOR ONE VERY IMPORTANT PERSON</span><strong>One proper<br><em>massage.</em></strong><p>Redeemable whenever you need a little care.</p><span class="handwritten">with love, always</span></div>`
      :`<div class="scent-layout"><div class="perfume-illustration"><div class="perfume-cap"></div><div class="perfume-bottle"><span>№ 23</span></div><div class="scent-spark">✳</div></div><div class="scent-notes">${s.memories.map(m=>`<button class="memory-text-card" data-memory-title="${escapeHTML(m.title)}" data-memory-text="${escapeHTML(m.text)}"><b>${escapeHTML(m.title)}</b><span>REVEAL ↗</span></button>`).join('')}${fileControl('ADD PERFUME PHOTO','image/*','perfume')}${(assetData.perfume||C.media.perfume)?`<img class="perfume-upload" src="${escapeHTML(assetData.perfume||C.media.perfume)}" alt="Perfume">`:''}</div></div>`;
      return `<article class="sense-chapter sense-${s.id}" id="chapter-${s.id}"><div class="sense-number">${s.number}</div><div class="sense-main"><div class="sense-heading"><div><p class="eyebrow">${escapeHTML(s.theme)}</p><h3>${escapeHTML(s.name)} <em>/ ${escapeHTML(s.ru)}</em></h3><p class="sense-tagline">${escapeHTML(s.tagline)}</p></div><span class="sense-symbol">${escapeHTML(s.symbol)}</span></div><p class="sense-description">${escapeHTML(s.description)}</p><div class="sense-content">${extra}</div><div class="sense-foot"><span>${escapeHTML(s.prompt)}</span><button class="complete-btn ${done?'completed':''}" data-complete="${s.id}">${done?'CHAPTER OPENED ✓':'MARK THIS CHAPTER OPENED ↗'}</button></div></div></article>`;
    }).join('')+`<div class="unlock-final"><div><p class="eyebrow">WHEN YOU ARE READY</p><h3>There is one last<br><em>thing.</em></h3><p>All five chapters lead to one final page.</p></div><button class="primary-btn" id="finalAccess" ${C.senses.every(s=>progress.has(s.id))?'':'disabled'}>OPEN THE LAST PAGE <span>↗</span></button></div>`;
    const audio=$('#personalAudio');if(audio){audio.addEventListener('play',()=>$('#vinyl')?.classList.add('playing'));audio.addEventListener('pause',()=>$('#vinyl')?.classList.remove('playing'));audio.addEventListener('ended',()=>$('#vinyl')?.classList.remove('playing'));}
    updateProgress();
  }
  function updateProgress(){
    const count=C.senses.filter(s=>progress.has(s.id)).length;
    const countEl=$('#progressCount');if(countEl)countEl.textContent=`${count} OF 5 OPENED`;
    const fill=$('#progressFill');if(fill)fill.style.width=`${count*20}%`;
    $$('#progressSymbols span').forEach((el,i)=>el.classList.toggle('done',progress.has(C.senses[i].id)));
    const finalButton=$('#finalAccess');if(finalButton)finalButton.disabled=count!==5;
  }

  // Navigation and global interactions.
  $('#beginBtn').addEventListener('click',()=>showScene('profile'));
  $$('[data-next]').forEach(b=>b.addEventListener('click',()=>showScene(b.dataset.next)));
  $$('[data-home]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();showScene('welcome');}));
  $('#restartTop').addEventListener('click',reset);$('#restartFinal').addEventListener('click',reset);
  $('#achievementContinue').addEventListener('click',()=>{if(!$('#achievementContinue').disabled)showScene('transition');});
  function reset(){if(confirm('Start this birthday story again? Your uploaded photos and audio will stay saved.')){progress.clear();localStorage.removeItem(STORAGE);localStorage.removeItem('hasan-selected-power');quizIndex=0;quizAnswers=[];memoryOpen=[];memoryMatched.clear();memoryBusy=false;renderReasons();renderPower();renderQuiz();renderMemory();renderSecret();updateAchievement();showScene('welcome');}}

  document.addEventListener('click',e=>{
    const stat=e.target.closest('[data-stat]');if(stat){const s=(C.character.stats||[])[+stat.dataset.stat];openModal('CHARACTER FILE · ATTRIBUTE',s.name,`<p class="modal-copy">${escapeHTML(s.note)}</p><p class="modal-small">EDIT THIS NOTE IN content.js</p>`);}
    const ability=e.target.closest('[data-ability]');if(ability){const a=C.character.abilities[+ability.dataset.ability];openModal('SPECIAL ABILITY',a.name,`<p class="modal-copy">${escapeHTML(a.detail)}</p><p class="modal-small">EDIT THIS ABILITY IN content.js</p>`);}
    const note=e.target.closest('[data-note]');if(note){const n=C.notes[+note.dataset.note];mark(`note-${+note.dataset.note}`);openModal(n.tag,n.title,`<p class="modal-copy">${escapeHTML(n.text)}</p><p class="modal-small">PERSONALISE THIS NOTE IN content.js</p>`);}
    const reason=e.target.closest('[data-reason]');if(reason){const i=+reason.dataset.reason,r=C.reasons[i];mark(`reason-${i}`);renderReasons();updateAchievement();openModal('A REASON I LOVE YOU',r.title,`<p class="modal-copy">${escapeHTML(r.text)}</p><p class="modal-small">REPLACE THE PLACEHOLDER IN content.js</p>`);}
    if(e.target.closest('#secretEnvelope')&&!$('#secretEnvelope').disabled){mark('reason-final');renderReasons();updateAchievement();openModal('THE LAST ENVELOPE','One last thing.',`<p class="modal-copy">${escapeHTML(C.reasons[5].text)}</p><p class="modal-small">A NOTE THAT WAS SAVED FOR LAST.</p>`);}
    const power=e.target.closest('[data-power]');if(power){const p=C.games.powers[+power.dataset.power];localStorage.setItem('hasan-selected-power',p.id);mark('game-power');renderPower();$('#powerResult').innerHTML=`<p>${escapeHTML(p.reaction)}</p><span>POWER SELECTED ✓</span>`;updateAchievement();}
    const answer=e.target.closest('[data-answer]');if(answer){const q=C.games.quiz[quizIndex],idx=+answer.dataset.answer;quizAnswers.push(idx);openModal(`QUESTION 0${quizIndex+1} · YOUR ANSWER`,q.answers[idx],`<p class="modal-copy">${escapeHTML(q.reactions[idx]||'A perfectly valid choice.')}</p><button class="primary-btn quiz-next" id="quizNext">${quizIndex===C.games.quiz.length-1?'FINISH QUIZ':'NEXT QUESTION'} <span>↗</span></button>`);}
    if(e.target.closest('#quizNext')){closeModal();quizIndex++;if(quizIndex>=C.games.quiz.length){mark('game-quiz');setStatus('quiz',true);}renderQuiz();updateAchievement();}
    if(e.target.closest('[data-quiz-restart]')){quizIndex=0;quizAnswers=[];renderQuiz();}
    const tile=e.target.closest('[data-memory-tile]');if(tile&&!memoryBusy&&!tile.classList.contains('matched')&&memoryOpen.length<2&&!memoryOpen.includes(+tile.dataset.memoryTile)){
      const idx=+tile.dataset.memoryTile;memoryOpen.push(idx);tile.classList.add('revealed');
      if(memoryOpen.length===2){memoryBusy=true;const selected=memoryOpen.map(n=>$(`[data-memory-tile="${n}"]`));
        if(selected[0].dataset.pair===selected[1].dataset.pair&&selected[0].dataset.kind!==selected[1].dataset.kind){const id=selected[0].dataset.pair;memoryMatched.add(id);selected.forEach(x=>x.classList.add('matched'));const m=C.games.memories.find(x=>x.id===id);$('#memoryFeedback').textContent=m.message;openModal('A MEMORY FOUND',m.caption,`<p class="modal-copy">${escapeHTML(m.message)}</p><p class="modal-small">PERSONALISE THIS MEMORY IN content.js</p>`);}
        else {$('#memoryFeedback').textContent='Not quite — try another pair.';setTimeout(()=>{$$('.memory-tile').forEach((x,i)=>{if(memoryOpen.includes(i)&&!memoryMatched.has(x.dataset.pair))x.classList.remove('revealed');});},700);}
        memoryOpen=[];setTimeout(()=>{renderMemory();updateAchievement();memoryBusy=false;},750);
      }
    }
    const secret=e.target.closest('[data-secret-answer]');if(secret){const correct=+secret.dataset.secretAnswer===C.games.secret.answer;if(correct){mark('game-secret');$('#secretResult').innerHTML=`<p>${escapeHTML(C.games.secret.success)}</p><span>SECRET UNLOCKED ✓</span>`;setStatus('secret',true);updateAchievement();}else{$('#secretResult').innerHTML='<p>Not this time. A small clue: check the birthday edition number.</p>';}}
    const memory=e.target.closest('[data-memory-title]');if(memory)openModal('A LITTLE MEMORY',memory.dataset.memoryTitle,`<p class="modal-copy">${escapeHTML(memory.dataset.memoryText)}</p><p class="modal-small">REPLACE THIS DEMO TEXT IN content.js</p>`);
    const photo=e.target.closest('[data-memory]');if(photo){const key=photo.dataset.memory;openModal('A MOMENT TO KEEP','A day worth keeping',`${photoHTML(key,'modal-photo')}<p class="modal-small">UPLOAD A PHOTO USING THE CONTROL BELOW THIS COLLAGE.</p>`);}
    const complete=e.target.closest('[data-complete]');if(complete){mark(complete.dataset.complete);renderSenses();toast('A little piece of this story is now yours.');}
    if(e.target.closest('#finalAccess')&&C.senses.every(s=>progress.has(s.id)))showScene('final');
    if(e.target.closest('[data-close]'))closeModal();
    if(e.target.closest('#openFinal'))$('#finalEnvelope').classList.toggle('opened');
  });
  $('#detailModal').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

  document.addEventListener('change',e=>{
    const input=e.target.closest('[data-upload]');if(!input||!input.files?.[0])return;
    const file=input.files[0],key=input.dataset.upload;
    if(file.size>3*1024*1024){toast('Please choose a file smaller than 3 MB.');input.value='';return;}
    const reader=new FileReader();reader.onload=()=>{
      assetData[key]=reader.result;
      try{localStorage.setItem(ASSET_KEY,JSON.stringify(assetData));}catch(_){toast('This file is too large for browser storage. Use the assets folder instead.');return;}
      if(key==='audio'){const audio=$('#personalAudio');if(audio){audio.src=reader.result;$('#audioName').textContent=file.name;audio.load();}}
      else if(key==='perfume'||key.startsWith('sight-')||key.startsWith('memory-')||key.endsWith('-upload')){if(key.endsWith('-upload')){const chapter=key.replace('-upload','');assetData[`${chapter}-0`]=reader.result;try{localStorage.setItem(ASSET_KEY,JSON.stringify(assetData));}catch(_){} }renderSenses();renderMemory();}
      else {$$(`[data-photo="${key}"]`).forEach(el=>{const old=el.querySelector('.photo-placeholder,img');if(old){const img=document.createElement('img');img.src=reader.result;img.alt='Uploaded personal photo';old.replaceWith(img);}});}
      toast('Saved in this browser.');
    };reader.readAsDataURL(file);
  });

  // Restore fixed photos, final letter and all progress-aware sections.
  $$('[data-photo]').forEach(el=>{const key=el.dataset.photo,src=assetData[key]||C.media[key];if(src){const old=el.querySelector('.photo-placeholder,img');if(old){const img=document.createElement('img');img.src=src;img.alt='Personal photograph';old.replaceWith(img);}}});
  $('#finalLetterText').textContent=C.finalLetter.salutation;
  $('#finalLetterBody').textContent=C.finalLetter.body;
  $('#finalLetterSignature').textContent=C.finalLetter.signature;
  renderStats();renderNotes();renderReasons();renderPower();renderQuiz();renderMemory();renderSecret();updateProgress();updateAchievement();
})();
