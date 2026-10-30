(() => {
  const C = window.BIRTHDAY_CONTENT;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const STORAGE = 'hasan-chapter-23-progress';
  const ASSET_KEY = 'hasan-chapter-23-assets';
  let progress = new Set(JSON.parse(localStorage.getItem(STORAGE) || '[]'));
  let activeScene = 'welcome';
  let assetData = {};
  try { assetData = JSON.parse(localStorage.getItem(ASSET_KEY) || '{}'); } catch (_) {}

  const scenes = ['welcome','profile','admire','transition','senses','final'];
  function showScene(id) {
    if (!scenes.includes(id)) return;
    activeScene = id;
    $$('.scene').forEach(s => s.classList.toggle('active', s.id === id));
    window.scrollTo({top:0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    if (id === 'senses') renderSenses();
    if (id === 'final') updateProgress();
  }
  function mark(id) { progress.add(id); localStorage.setItem(STORAGE, JSON.stringify([...progress])); updateProgress(); }
  function updateProgress() {
    const count = C.senses.filter(s => progress.has(s.id)).length;
    $('#progressCount').textContent = `${count} OF 5 OPENED`;
    $('#progressFill').style.width = `${count*20}%`;
    $$('#progressSymbols span').forEach((el,i) => el.classList.toggle('done', progress.has(C.senses[i].id)));
    const finalButton = $('#finalAccess');
    if (finalButton) finalButton.disabled = count !== 5;
  }
  function renderStats() {
    $('#stats').innerHTML = C.stats.map((s,i)=>`<button class="stat-row" data-stat="${i}"><span class="stat-name">${s.name}</span><span class="stat-meter"><i style="--level:${s.value}%"></i></span><span class="stat-value">${s.value}</span><span class="stat-plus">+</span></button>`).join('');
  }
  function renderNotes() {
    $('#noteGrid').innerHTML = C.notes.map((n,i)=>`<button class="note-card note-${i+1}" data-note="${i}"><span class="note-tag">${n.tag}</span><span class="note-stamp">${n.stamp}</span><strong>${n.title}</strong><span class="note-open">OPEN NOTE ↗</span></button>`).join('');
  }
  function openModal(kicker,title,body) {
    $('#modalKicker').textContent=kicker; $('#modalTitle').textContent=title; $('#modalBody').innerHTML=body;
    $('#detailModal').classList.add('visible'); $('#detailModal').setAttribute('aria-hidden','false');
  }
  function closeModal() { $('#detailModal').classList.remove('visible'); $('#detailModal').setAttribute('aria-hidden','true'); }
  function toast(msg) { const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }

  function fileControl(label, accept, key, target) {
    return `<label class="upload-control">＋ ${label}<input type="file" accept="${accept}" data-upload="${key}" data-target="${target}" hidden></label>`;
  }
  function photoHTML(key, className='memory-photo') {
    const index=Number(key.split('-').pop());
    const src=assetData[key] || (key.startsWith('sight-') ? C.media.sight[index] : '');
    return `<div class="${className}">${src ? `<img src="${src}" alt="Personal memory">` : `<div class="photo-placeholder"><span class="placeholder-mark">♡</span><small>YOUR PHOTO<br>GOES HERE</small></div>`}</div>`;
  }
  function renderSenses() {
    const root=$('#senseList');
    root.innerHTML=C.senses.map((s,i)=>{
      const done=progress.has(s.id);
      const extra = s.kind==='photos' ? `<div class="memory-photo-grid">${s.memories.map((m,j)=>`<button class="memory-photo-item" data-memory="${s.id}-${j}">${photoHTML(`${s.id}-${j}`)}<span>${m.title}</span></button>`).join('')}</div>${fileControl('ADD A PHOTO','image/*',`${s.id}-upload`,s.id)}`
      : s.kind==='audio' ? `<div class="audio-station"><div class="vinyl" id="vinyl"><div class="vinyl-label">SIDE<br>A</div></div><div class="audio-info"><span class="eyebrow">A PERSONAL RECORDING</span><h4 id="audioName">A song that sounds like us</h4><audio id="personalAudio" controls ${(assetData.audio || C.media.audio) ? `src="${assetData.audio || C.media.audio}"` : ''}></audio><p class="micro-hint">Only your uploaded audio will play here.</p>${fileControl('UPLOAD AUDIO','audio/*','audio','sound-audio')}</div></div><div class="memory-text-grid">${s.memories.map(m=>`<button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}"><b>${m.title}</b><span>READ THE NOTE ↗</span></button>`).join('')}</div>`
      : s.kind==='cards' ? `<div class="taste-grid">${s.memories.map((m,j)=>`<button class="taste-card taste-${j+1}" data-memory-title="${m.title}" data-memory-text="${m.text}"><span class="taste-number">0${j+1}</span><span class="taste-ornament">${j===0?'✿':j===1?'☕':'❦'}</span><b>${m.title}</b><small>OPEN MEMORY ↗</small></button>`).join('')}</div>`
      : s.kind==='letter' ? `<div class="touch-layout"><div class="fabric-note"><span class="handwritten">a little reminder</span><p>There are places that feel like home. And then there are people.</p><span class="fabric-heart">♡</span></div><div class="touch-notes">${s.memories.map(m=>`<button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}"><b>${m.title}</b><span>UNFOLD ↗</span></button>`).join('')}</div></div><div class="certificate"><span class="eyebrow">A CERTIFICATE FOR ONE VERY IMPORTANT PERSON</span><strong>One proper<br><em>massage.</em></strong><p>Redeemable whenever you need a little care.</p><span class="handwritten">with love, always</span></div>`
      : `<div class="scent-layout"><div class="perfume-illustration"><div class="perfume-cap"></div><div class="perfume-bottle"><span>№ 23</span></div><div class="scent-spark">✳</div></div><div class="scent-notes">${s.memories.map(m=>`<button class="memory-text-card" data-memory-title="${m.title}" data-memory-text="${m.text}"><b>${m.title}</b><span>REVEAL ↗</span></button>`).join('')}${fileControl('ADD PERFUME PHOTO','image/*','perfume','scent-photo')}${(assetData.perfume || C.media.perfume) ? `<img class="perfume-upload" src="${assetData.perfume || C.media.perfume}" alt="Perfume">`:''}</div></div>`;
      return `<article class="sense-chapter sense-${s.id}" id="chapter-${s.id}"><div class="sense-number">${s.number}</div><div class="sense-main"><div class="sense-heading"><div><p class="eyebrow">${s.theme}</p><h3>${s.name} <em> / ${s.ru}</em></h3><p class="sense-tagline">${s.tagline}</p></div><span class="sense-symbol">${s.symbol}</span></div><p class="sense-description">${s.description}</p><div class="sense-content">${extra}</div><div class="sense-foot"><span>${s.prompt}</span><button class="complete-btn ${done?'completed':''}" data-complete="${s.id}">${done?'CHAPTER OPENED ✓':'MARK THIS CHAPTER OPENED ↗'}</button></div></div></article>`;
    }).join('') + `<div class="unlock-final"><div><p class="eyebrow">WHEN YOU ARE READY</p><h3>There is one last<br><em>thing.</em></h3><p>All five chapters lead to one final page.</p></div><button class="primary-btn" id="finalAccess" ${C.senses.every(s=>progress.has(s.id))?'':'disabled'}>OPEN THE LAST PAGE <span>↗</span></button></div>`;
    const audioEl = $('#personalAudio');
    audioEl.addEventListener('play', () => $('#vinyl')?.classList.add('playing'));
    audioEl.addEventListener('pause', () => $('#vinyl')?.classList.remove('playing'));
    audioEl.addEventListener('ended', () => $('#vinyl')?.classList.remove('playing'));
  }

  $('#beginBtn').addEventListener('click',()=>showScene('profile'));
  $$('[data-next]').forEach(b=>b.addEventListener('click',()=>showScene(b.dataset.next)));
  $$('[data-home]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();showScene('welcome')}));
  $('#restartTop').addEventListener('click',reset); $('#restartFinal').addEventListener('click',reset);
  function reset(){if(confirm('Start this birthday story again? Your uploaded photos and audio will stay saved.')){progress.clear();localStorage.removeItem(STORAGE);showScene('welcome');}}
  renderStats(); renderNotes();
  document.addEventListener('click',e=>{
    const stat=e.target.closest('[data-stat]'); if(stat){const s=C.stats[+stat.dataset.stat];openModal('CHARACTER FILE',s.name,`<p class="modal-copy">${s.note}</p><p class="modal-small">DEMO COMMENT — REPLACE WITH YOUR OWN WORDS</p>`);}
    const note=e.target.closest('[data-note]'); if(note){const n=C.notes[+note.dataset.note];openModal(n.tag,n.title,`<p class="modal-copy">${n.text}</p><p class="modal-small">DEMO TEXT — PERSONALISE THIS NOTE IN content.js</p>`);}
    const memory=e.target.closest('[data-memory-title]'); if(memory){openModal('A LITTLE MEMORY',memory.dataset.memoryTitle,`<p class="modal-copy">${memory.dataset.memoryText}</p><p class="modal-small">DEMO TEXT — REPLACE WITH YOUR OWN MEMORY</p>`);}
    const photo=e.target.closest('[data-memory]'); if(photo){const key=photo.dataset.memory;openModal('A MOMENT TO KEEP',key.split('-').pop()==='0'?'The look':'A day worth keeping',`${photoHTML(key,'modal-photo')}<p class="modal-small">UPLOAD A PHOTO USING THE CONTROL BELOW THIS COLLAGE.</p>`);}
    const complete=e.target.closest('[data-complete]'); if(complete){mark(complete.dataset.complete);renderSenses();toast('A little piece of this story is now yours.');}
    if(e.target.closest('#finalAccess')){if(C.senses.every(s=>progress.has(s.id)))showScene('final');}
    if(e.target.closest('[data-close]'))closeModal();
    if(e.target.closest('#openFinal')){$('#finalEnvelope').classList.toggle('opened');}
  });
  $('#detailModal').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  document.addEventListener('change',e=>{
    const input=e.target.closest('[data-upload]'); if(!input || !input.files?.[0])return;
    const file=input.files[0], key=input.dataset.upload;
    if(file.size>3*1024*1024){toast('Please choose a file smaller than 3 MB.');input.value='';return;}
    const reader=new FileReader(); reader.onload=()=>{
      const data=reader.result; assetData[key]=data;
      try{localStorage.setItem(ASSET_KEY,JSON.stringify(assetData));}catch(_){toast('This file is too large for browser storage. Use the assets folder instead.');return;}
      if(key==='audio'){const audio=$('#personalAudio');audio.src=data;$('#audioName').textContent=file.name;audio.load();}
      else if(key==='perfume'){renderSenses();}
      else if(key.endsWith('-upload')){const chapter=key.replace('-upload','');assetData[`${chapter}-0`]=data;try{localStorage.setItem(ASSET_KEY,JSON.stringify(assetData));}catch(_){}renderSenses();}
      else {document.querySelectorAll(`[data-photo="${key}"]`).forEach(el=>{const old=el.querySelector('.photo-placeholder, img');if(old){const img=document.createElement('img');img.src=data;img.alt='Uploaded personal photo';old.replaceWith(img);}});renderSenses();}
      toast('Saved in this browser.');
    }; reader.readAsDataURL(file);
  });
  // Hydrate uploaded images in fixed photo frames.
  $$('[data-photo]').forEach(el=>{const key=el.dataset.photo;const src=assetData[key] || C.media[key];if(src){const old=el.querySelector('.photo-placeholder, img');if(old){const img=document.createElement('img');img.src=src;img.alt='Personal photograph';old.replaceWith(img);}}});
  $('#finalLetterText').textContent=C.finalLetter.salutation;
  $('#finalLetterBody').textContent=C.finalLetter.body;
  $('#finalLetterSignature').textContent=C.finalLetter.signature;
  updateProgress();
})();
