import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';

(() => {
  'use strict';
  const C = window.BIRTHDAY_CONTENT;
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const RIDDLE_ORDER = ['sight','sound','taste','touch','scent'];
  const LETTERS = { sight:'Ч', sound:'О', taste:'В', touch:'Е', scent:'Н' };
  const FINAL_CODE = 'ВЕЧНО';
  const STORAGE = 'hasan-main-character-progress-v1';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(STORAGE)||'{}'); } catch {}
  const state = { solved:new Set(Array.isArray(saved.solved)?saved.solved.filter(x=>RIDDLE_ORDER.includes(x)):[]), hammer:!!saved.hammer, final:!!saved.final, scene:'opening', sense:'sight', quality:0, memory:0, found:new Set(Array.isArray(saved.found)?saved.found.filter(n=>[1,2,3].includes(n)):[]), lift:false };
  const persist = () => { try { localStorage.setItem(STORAGE, JSON.stringify({solved:[...state.solved],found:[...state.found],hammer:state.hammer,final:state.final})); } catch {} updateProgress(); };
  const toast = (msg) => { const el=$('#toast'); el.textContent=msg; el.classList.add('show'); };
  $('#toast').addEventListener('click',()=>$('#toast').classList.remove('show'));
  const sceneIds=['opening','hero','character','memories','senses','finale'];
  const sceneLabels=['OPENING CREDITS','THE HERO','CHARACTER STUDY','THE MEMORIES','FIVE SENSES','FINAL SCENE'];
  let sceneIndex=0; let activeTransition=null;
  function updateProgress(){ const idx=sceneIds.indexOf(state.scene); $('#navScene').textContent=`${String(Math.max(0,idx)+1).padStart(2,'0')} / 06`; $('#chapterLabel').textContent=sceneLabels[Math.max(0,idx)]; }
  function go(id, replay=false){
    if(!sceneIds.includes(id)) return;
    if(id==='finale'&&!state.final){toast('Финальная сцена откроется после правильного кода.');return;}
    const from=state.scene; state.scene=id; sceneIndex=sceneIds.indexOf(id);
    const next=$('#'+id), prev=$('.scene.active');
    if(prev===next && !replay) return;
    const transition=$('#flashTransition');
    const reveal=()=>{ $$('.scene').forEach(s=>s.classList.toggle('active',s===next)); window.scrollTo(0,0); updateProgress(); onScene(id); };
    if(reduced){reveal();return;}
    if(activeTransition){activeTransition.progress(1).kill();activeTransition=null;}
    gsap.killTweensOf(transition);
    const modes={hero:{background:'#e9e5dd',scaleX:1,scaleY:1,transformOrigin:'center'},character:{background:'#6c263d',scaleX:1,scaleY:1,transformOrigin:'left'},memories:{background:'#e8e4dc',scaleX:1,scaleY:1,transformOrigin:'center'},senses:{background:'#b7a0a7',scaleX:1,scaleY:1,transformOrigin:'bottom'},finale:{background:'#eeeae2',scaleX:1,scaleY:1,transformOrigin:'top'}};
    const mode=modes[id]||modes.hero;transition.style.background=mode.background;
    activeTransition=gsap.timeline().set(transition,{scaleX:id==='memories'?0:1,scaleY:id==='memories'?1:0,transformOrigin:mode.transformOrigin}).to(transition,{scaleX:mode.scaleX,scaleY:mode.scaleY,duration:id==='memories'?.5:.38,ease:'power3.in'}).add(reveal).set(transition,{transformOrigin:id==='memories'?'right':'top'}).to(transition,{scaleX:0,scaleY:0,duration:id==='finale'?.95:.72,ease:'power4.out'});
  }
  function onScene(id){
    $('#threeStage').classList.toggle('active',id==='hero'||(id==='senses'&&state.sense==='scent'));
    if(id==='character') renderQuality(); if(id==='memories') renderMemory(); if(id==='senses') renderSense(state.sense); if(id==='finale') renderLetter();
    if(id==='hero') { state.lift=false; $('#hammerVictory').hidden=!state.hammer; $('#liftHammer').disabled=state.hammer; }
  }
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
  $('#filmNav [data-back]').addEventListener('click',()=>go(sceneIds[Math.max(0,sceneIds.indexOf(state.scene)-1)]));
  $('#filmNav [data-forward]').addEventListener('click',()=>go(sceneIds[Math.min(sceneIds.length-1,sceneIds.indexOf(state.scene)+1)]));
  $('.wordmark').addEventListener('click',()=>go('opening'));
  $('#replayScene').addEventListener('click',()=>{ if(state.scene==='hero'){hammerGroup.rotation.set(.05,0,0);camera.position.set(0,1.2,7.5);camera.lookAt(0,0,0);} else if(state.scene==='memories') {state.memory=0;renderMemory();} else if(state.scene==='character'){state.quality=0;renderQuality();} else if(state.scene==='senses')renderSense(state.sense); else go(state.scene,true); });
  $('#skipMotion').addEventListener('click',()=>{if(activeTransition){activeTransition.progress(1).kill();activeTransition=null;}$('#flashTransition').style.transform='scale(0,0)';toast('Анимация пропущена. Нажми на это сообщение, чтобы закрыть.');});

  // CHARACTER STUDY — редакционная последовательность, без карточек и отдельного блока причин любви.
  function renderQuality(){const q=C.qualities[state.quality];$('#qualityStage').className=`quality-stage quality-${state.quality+1}`;$('#qualityCount').textContent=`${String(state.quality+1).padStart(2,'0')} / 05`;$('#qualityTag').textContent=q.tag;$('#qualityTitle').textContent=q.title;$('#qualityText').textContent=q.text;$('#qualityCaption').textContent=q.caption;$('#qualityImage').src=q.photo;$('#qualityProgress').innerHTML=C.qualities.map((_,i)=>`<i class="${i===state.quality?'active':''}"></i>`).join('');}
  function changeQuality(d){state.quality=(state.quality+d+C.qualities.length)%C.qualities.length; if(!reduced)gsap.fromTo('.quality-image img',{opacity:.25,x:d>0?30:-30},{opacity:1,x:0,duration:.55,ease:'power3.out'});renderQuality();}
  $('#qualityPrev').addEventListener('click',()=>changeQuality(-1));$('#qualityNext').addEventListener('click',()=>changeQuality(1));

  // MEMORIES — оригинальные файлы из assets, без подмены и придуманных подписей.
  function renderMemory(){const p=C.galleryPhotos[state.memory];$('#memoryImage').src=p.src;$('#memoryImage').alt=p.alt;$('#memoryCaption').textContent=`${String(state.memory+1).padStart(2,'0')} / ${String(C.galleryPhotos.length).padStart(2,'0')}`;$('#memoryRail').innerHTML=C.galleryPhotos.map((x,i)=>`<button class="${i===state.memory?'active':''}" data-memory-index="${i}" aria-label="Открыть кадр ${i+1}"><img src="${x.src}" alt=""></button>`).join('');$$('[data-memory-index]').forEach(b=>b.addEventListener('click',()=>{state.memory=Number(b.dataset.memoryIndex);renderMemory();}));}
  function moveMemory(d){state.memory=(state.memory+d+C.galleryPhotos.length)%C.galleryPhotos.length;renderMemory();}
  $('#memoryPrev').addEventListener('click',()=>moveMemory(-1));$('#memoryNext').addEventListener('click',()=>moveMemory(1));$('#memoryImage').addEventListener('click',()=>{$('#lightboxImage').src=C.galleryPhotos[state.memory].src;$('#memoryLightbox').hidden=false;});$('#closeLightbox').addEventListener('click',()=>$('#memoryLightbox').hidden=true);$('#memoryLightbox').addEventListener('click',e=>{if(e.target.id==='memoryLightbox')e.currentTarget.hidden=true;});

  let audioContext=null;
  function playMorse(){try{const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;audioContext=audioContext||new AudioCtx();audioContext.resume();const unit=.16;let t=audioContext.currentTime+.05;[3,0,1,0,1].forEach((duration)=>{if(duration){const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=620;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.11,t+.018);gain.gain.setValueAtTime(.11,t+duration*unit-.025);gain.gain.exponentialRampToValueAtTime(.0001,t+duration*unit);osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+duration*unit);}t+=(duration||1)*unit;});}catch(e){console.warn('Morse audio unavailable',e);}}
  // FIVE SENSES — исходные загадки и координаты поиска отличий сохранены.
  const question={taste:'Какой едой я угостила тебя впервые?',scent:'Какой запах у меня ассоциируется с тобой?',sound:'Что означает сигнал Морзе «− · ·»?',touch:'В шрифте Брайля точки 1, 3 и 5 образуют одну букву. Какую?'};
  const hints={taste:'Москва',scent:'То, что ты проспорил мне 😏',sound:'Это буква из азбуки Морзе. Вспомни русский алфавит.',touch:'Это русская буква. Представь точки в ячейке Брайля: слева сверху вниз 1–2–3, справа 4–5–6.'};
  const answers={taste:['бургер','бургеры'],scent:['кофе'],sound:['д','де'],touch:['о']};
  const success={taste:'Ты вспомнил. Буква найдена.',scent:'Композиция собрана. Пятая буква найдена.',sound:'Ты услышал правильный ответ. Вторая буква твоя.',touch:'Ты разгадал тактильный код. Четвёртая буква найдена.'};
  function updateSenseProgress(){const n=state.solved.size;$('#senseProgress').textContent=`${n} / 5 ОТКРЫТО`;$('#earnedLetters').innerHTML=RIDDLE_ORDER.filter(k=>state.solved.has(k)).map(k=>`<span title="${k}">${LETTERS[k]}</span>`).join('');$('#codePanel').hidden=n!==5;}
  function solve(id){if(state.solved.has(id))return;state.solved.add(id);persist();toast(`Буква ${LETTERS[id]} открыта.`);renderSense(id);}
  function senseTabs(){ $$('#senseTabs button').forEach(b=>b.classList.toggle('active',b.dataset.sense===state.sense)); }
  function renderSense(id){state.sense=id;$('#senseStage').dataset.senseCurrent=id;senseTabs();$('#threeStage').classList.toggle('active',state.scene==='senses'&&id==='scent');const s=C.senses.find(x=>x.id===id);let html='';
    if(id==='sight'){
      const done=state.solved.has('sight');html=`<div class="sense-content sight-content"><p class="micro">01 / ЗРЕНИЕ · НАЙДИ ТРИ ОТЛИЧИЯ</p><h3>${s.theme}</h3><p>${s.description.replaceAll('\n\n','<br><br>')}</p><p class="sense-prompt">${s.prompt||''}</p><p>Найди три небольших изменения на второй версии фотографии.</p><div class="sight-pair"><figure><figcaption>ОРИГИНАЛ</figcaption><img src="assets/O1.jpg" alt="Оригинальная фотография"></figure><figure><figcaption>НАЙДИ ОТЛИЧИЯ</figcaption><div class="spot-wrap"><img src="assets/O2.jpg" alt="Фотография с тремя отличиями">${[[1,'39.2%','40.9%'],[2,'84.1%','3.6%'],[3,'4.4%','57.5%']].map(([n,x,y])=>`<button class="spot-hit ${done||state.found.has(n)?'found':''}" data-difference="${n}" style="--x:${x};--y:${y}" aria-label="Отличие ${n}" ${done||state.found.has(n)?'disabled':''}></button>`).join('')}</div></figure></div><div class="sight-strip" aria-label="Фотографии из исходного проекта"><img src="assets/F1.PNG" alt="Фотография"><img src="assets/F2.PNG" alt="Фотография"><img src="assets/F3.PNG" alt="Фотография"></div><div class="spot-counter">НАЙДЕНО: <b>${done?3:state.found.size}/3</b></div><p class="sense-feedback">${done?('Все три отличия найдены. '+(s.reaction||'')):'Нажимай на сами отличия на нижнем снимке.'}</p>${done?`<p class="micro">ТВОЯ БУКВА · Ч</p>`:''}</div>`;
    } else if(id==='sound'){
      html=`<div class="sense-content"><p class="micro">02 / СЛУХ · MORSE CODE</p><h3>${s.theme}</h3><p>${s.description.replaceAll('\n\n','<br><br>')}</p><div class="wave-art" aria-label="Сигнал азбуки Морзе">${Array.from({length:31},(_,i)=>`<i style="--h:${[10,14,32,10,10,10,10,32,10,10,32,10,10,10,10,10,32,10,32,10,10,10,32,10,10,10,10,32,10,10,14][i]}px"></i>`).join('')}</div><button class="morse-play" id="playMorse">▶ ПРОСЛУШАТЬ СИГНАЛ</button><p class="sense-prompt">${s.prompt||''}</p><p class="sense-question">${question.sound}</p><form class="sense-form" data-answer="sound"><input name="answer" autocomplete="off" placeholder="ТВОЙ ОТВЕТ" aria-label="Ответ на загадку слуха" ${state.solved.has(id)?'disabled':''}><button ${state.solved.has(id)?'disabled':''}>ОТВЕТИТЬ ↗</button></form><p class="sense-feedback">${state.solved.has(id)?(success.sound+' '+(s.reaction||'')):''}</p><p class="sense-hint">ПОДСКАЗКА: ${hints.sound}</p>${state.solved.has(id)?'<p class="micro">ТВОЯ БУКВА · О</p>':''}</div>`;
    } else if(id==='taste'){
      html=`<div class="sense-content taste-content"><div class="taste-art" aria-hidden="true"><span class="taste-art-word">FIRST<br><em>BITE</em></span><div class="taste-plate"></div><div class="taste-napkin"></div><div class="taste-cutlery">✳</div><span class="taste-edition">A MEMORY, NOT A MENU</span></div><p class="micro">03 / ВКУС · A MEMORY OF TASTE</p><h3>${s.theme}</h3><p>${s.description.replaceAll('\n\n','<br><br>')}</p><p class="sense-prompt">${s.prompt||''}</p><p class="sense-question">${question.taste}</p><form class="sense-form" data-answer="taste"><input name="answer" autocomplete="off" placeholder="ВВЕДИ ОТВЕТ" aria-label="Ответ на загадку вкуса" ${state.solved.has(id)?'disabled':''}><button ${state.solved.has(id)?'disabled':''}>ПРОВЕРИТЬ ↗</button></form><p class="sense-hint">ПОДСКАЗКА: ${hints.taste}</p><p class="sense-feedback">${state.solved.has(id)?(success.taste+' '+(s.reaction||'')):''}</p>${state.solved.has(id)?'<p class="micro">ТВОЯ БУКВА · В</p>':''}</div>`;
    } else if(id==='touch'){
      html=`<div class="sense-content"><p class="micro">04 / ПРИКОСНОВЕНИЕ · BRAILLE</p><h3>${s.theme}</h3><p>${s.description.replaceAll('\n\n','<br><br>')}</p><div class="braille-art" aria-label="Точки Брайля 1, 3 и 5">${[1,4,2,5,3,6].map(n=>`<i class="${[1,3,5].includes(n)?'on':''}"></i>`).join('')}</div><p class="sense-prompt">${s.prompt||''}</p><p class="sense-question">${question.touch}</p><form class="sense-form" data-answer="touch"><input name="answer" autocomplete="off" placeholder="ВВЕДИ БУКВУ" aria-label="Ответ на загадку прикосновения" ${state.solved.has(id)?'disabled':''}><button ${state.solved.has(id)?'disabled':''}>ПРОВЕРИТЬ ↗</button></form><p class="sense-hint">ПОДСКАЗКА: ${hints.touch}</p><p class="sense-feedback">${state.solved.has(id)?(success.touch+' '+(s.reaction||'')):''}</p>${state.solved.has(id)?'<p class="micro">ТВОЯ БУКВА · Е</p>':''}</div>`;
    } else {
      html=`<div class="sense-content scent-content"><div class="coffee-scene"><div class="coffee-steam"></div><div class="coffee-cup"></div></div><p class="micro">05 / ЗАПАХ · SCENT MEMORY</p><h3>${s.theme}</h3><p>${s.description.replaceAll('\n\n','<br><br>')}</p><p class="sense-prompt">${s.prompt||''}</p><p class="sense-question">${question.scent}</p><form class="sense-form" data-answer="scent"><input name="answer" autocomplete="off" placeholder="ВВЕДИ ОТВЕТ" aria-label="Ответ на загадку запаха" ${state.solved.has(id)?'disabled':''}><button ${state.solved.has(id)?'disabled':''}>ПРОВЕРИТЬ ↗</button></form><p class="sense-hint">ПОДСКАЗКА: ${hints.scent}</p><p class="sense-feedback">${state.solved.has(id)?(success.scent+' '+(s.reaction||'')):''}</p>${state.solved.has(id)?'<p class="micro">ТВОЯ БУКВА · Н</p>':''}</div>`;
    }
    $('#senseStage').innerHTML=html;updateSenseProgress();$('#playMorse')?.addEventListener('click',playMorse);
    $$('[data-answer]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const key=form.dataset.answer;const value=form.elements.answer.value.trim().toLocaleLowerCase('ru').replaceAll('ё','е');if(answers[key].includes(value.replace(/[.,!?\s]+$/g,''))){solve(key);}else{const f=$('.sense-feedback',form.parentElement);f.textContent='Пока не совпало. Попробуй ещё раз.';form.elements.answer.focus();}}));
    $$('[data-difference]').forEach(btn=>btn.addEventListener('click',()=>{const n=Number(btn.dataset.difference);if(state.found.has(n)||state.solved.has('sight'))return;state.found.add(n);persist();btn.classList.add('found');btn.disabled=true;const counter=$('.spot-counter b');counter.textContent=`${state.found.size}/3`;if(state.found.size===3)solve('sight');}));
  }
  $$('#senseTabs button').forEach(b=>b.addEventListener('click',()=>renderSense(b.dataset.sense)));
  $('#finalCodeForm').addEventListener('submit',e=>{e.preventDefault();const value=$('#finalCodeInput').value.trim().toLocaleUpperCase('ru').replaceAll('Ё','Е');if(value===FINAL_CODE){state.final=true;persist();$('#codeFeedback').textContent='КОД ПРИНЯТ.';toast('Последняя сцена открыта.');go('finale');}else{$('#codeFeedback').textContent='Код не подходит. Проверь порядок букв.';}});
  function renderLetter(){const l=C.personalLetter||{};$('#letterSalutation').textContent=l.salutation||'';$('#letterBody').textContent=l.body||'';$('#letterSignature').textContent=l.signature||'';$('#letterPaper').hidden=true;$('#openLetter').hidden=false;}
  $('#openLetter').addEventListener('click',()=>{$('#letterPaper').hidden=false;$('#openLetter').hidden=true;});

  // Mjolnir 3D + genuine mesh interactions.
  const canvas=$('#threeCanvas');const renderer=new THREE.WebGLRenderer({canvas,antialias:!matchMedia('(max-width:760px)').matches,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(max-width:760px)').matches?1.25:1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,.1,100);camera.position.set(0,1.15,7.5);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xbec6d2,0x171016,1.55));const keyLight=new THREE.DirectionalLight(0xe5e1d8,3.5);keyLight.position.set(-4,6,6);scene.add(keyLight);const rim=new THREE.PointLight(0x9a405c,42,14);rim.position.set(4,1,-3);scene.add(rim);const silver=new THREE.PointLight(0xa8c5d5,26,14);silver.position.set(-4,2,2);scene.add(silver);
  const metal=new THREE.MeshStandardMaterial({color:0x9ba6b2,metalness:.92,roughness:.24});const edge=new THREE.MeshStandardMaterial({color:0xc2b6a8,metalness:.84,roughness:.3});const darkMetal=new THREE.MeshStandardMaterial({color:0x34343c,metalness:.75,roughness:.32});const ruby=new THREE.MeshStandardMaterial({color:0x63233c,metalness:.55,roughness:.18,emissive:0x250611,emissiveIntensity:.7});
  const hammerGroup=new THREE.Group();scene.add(hammerGroup);
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(.115,.15,2.6,24),darkMetal);handle.position.y=-.55;hammerGroup.add(handle);
  for(let i=0;i<9;i++){const band=new THREE.Mesh(new THREE.TorusGeometry(.145,.022,8,32),edge);band.rotation.x=Math.PI/2;band.position.y=-1.65+i*.27;hammerGroup.add(band);}
  const shape=new THREE.Shape();shape.moveTo(-.92,-.57);shape.quadraticCurveTo(-1.08,-.57,-1.08,-.39);shape.lineTo(-1.08,.42);shape.quadraticCurveTo(-1.08,.61,-.9,.61);shape.lineTo(.9,.61);shape.quadraticCurveTo(1.08,.61,1.08,.42);shape.lineTo(1.08,-.39);shape.quadraticCurveTo(1.08,-.57,.92,-.57);shape.closePath();
  const headGeo=new THREE.ExtrudeGeometry(shape,{depth:.9,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:.09,bevelThickness:.1,curveSegments:12});headGeo.translate(0,0,-.45);const head=new THREE.Mesh(headGeo,metal);head.position.y=.92;hammerGroup.add(head);
  const face=new THREE.Mesh(new THREE.BoxGeometry(1.88,.9,.025),darkMetal);face.position.set(0,.92,.51);hammerGroup.add(face);
  const bevel=new THREE.Mesh(new THREE.BoxGeometry(2.12,.11,1.12),edge);bevel.position.y=1.51;hammerGroup.add(bevel);
  const jewel=new THREE.Mesh(new THREE.OctahedronGeometry(.19,1),ruby);jewel.position.set(0,.93,.56);hammerGroup.add(jewel);
  for(const x of [-.67,.67]){const rune=new THREE.Mesh(new THREE.TorusGeometry(.14,.026,8,24),edge);rune.position.set(x,.93,.55);hammerGroup.add(rune);}
  for(let i=0;i<5;i++){const groove=new THREE.Mesh(new THREE.BoxGeometry(.025,.52,.012),edge);groove.position.set(-.34+i*.17,.92,.55);groove.rotation.z=(i-2)*.12;hammerGroup.add(groove);}
  // Engraved rune-like relief and forged corner details on the front plate.
  const runePaths=[
    [[-.72,.58,.54],[-.56,.75,.56],[-.72,.92,.56],[-.54,1.09,.56],[-.7,1.25,.54]],
    [[.72,.58,.54],[.56,.75,.56],[.72,.92,.56],[.54,1.09,.56],[.7,1.25,.54]],
    [[-.22,.67,.56],[0,.82,.57],[.22,.67,.56]],
    [[-.22,1.18,.56],[0,1.03,.57],[.22,1.18,.56]]
  ];
  runePaths.forEach(points=>{const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mark=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.018,8,false),edge);hammerGroup.add(mark);});
  for(const x of [-.94,.94]){const cap=new THREE.Mesh(new THREE.BoxGeometry(.12,.72,.96),edge);cap.position.set(x,.92,0);hammerGroup.add(cap);for(const y of [.62,1.22]){const rivet=new THREE.Mesh(new THREE.SphereGeometry(.035,12,10),ruby);rivet.position.set(x,y,.51);hammerGroup.add(rivet);}}
  const pommel=new THREE.Mesh(new THREE.SphereGeometry(.17,24,16),edge);pommel.position.set(0,-1.95,0);hammerGroup.add(pommel);

  hammerGroup.rotation.set(.08,-.3,.08);hammerGroup.position.set(.55,.05,0);hammerGroup.scale.setScalar(1.12);
  const floorGlow=new THREE.Mesh(new THREE.CircleGeometry(2.6,64),new THREE.MeshBasicMaterial({color:0x632a40,transparent:true,opacity:.12,depthWrite:false}));floorGlow.rotation.x=-Math.PI/2;floorGlow.position.y=-2.1;scene.add(floorGlow);
  // A separate, modeled ceramic coffee cup for the scent sequence.
  const coffeeGroup=new THREE.Group();scene.add(coffeeGroup);coffeeGroup.position.set(2.35,-.35,0);coffeeGroup.visible=false;
  const ceramic=new THREE.MeshStandardMaterial({color:0xd7d0c5,metalness:.12,roughness:.24});const coffeeMat=new THREE.MeshStandardMaterial({color:0x29140f,roughness:.18,metalness:.08});
  const cupProfile=[new THREE.Vector2(.42,-.58),new THREE.Vector2(.48,-.48),new THREE.Vector2(.57,.18),new THREE.Vector2(.64,.52),new THREE.Vector2(.6,.58),new THREE.Vector2(.52,.5),new THREE.Vector2(.46,-.35),new THREE.Vector2(.4,-.48)];
  const cup=new THREE.Mesh(new THREE.LatheGeometry(cupProfile,64),ceramic);coffeeGroup.add(cup);
  const coffeeSurface=new THREE.Mesh(new THREE.CircleGeometry(.54,64),coffeeMat);coffeeSurface.rotation.x=-Math.PI/2;coffeeSurface.position.y=.44;coffeeGroup.add(coffeeSurface);
  const cupHandle=new THREE.Mesh(new THREE.TorusGeometry(.32,.075,16,48,Math.PI*1.65),ceramic);cupHandle.position.set(.62,-.03,0);cupHandle.rotation.z=-Math.PI/2;coffeeGroup.add(cupHandle);
  const saucer=new THREE.Mesh(new THREE.CylinderGeometry(.83,.86,.07,64),ceramic);saucer.position.y=-.64;coffeeGroup.add(saucer);
  const steamMat=new THREE.MeshBasicMaterial({color:0xe8ded4,transparent:true,opacity:.24});const steamCurves=[];
  for(let j=0;j<3;j++){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.2+j*.2,.55,0),new THREE.Vector3(-.3+j*.2,.9,.02),new THREE.Vector3(-.08+j*.2,1.22,0),new THREE.Vector3(-.22+j*.2,1.55,.03)]);const steam=new THREE.Mesh(new THREE.TubeGeometry(curve,28,.018,6,false),steamMat);coffeeGroup.add(steam);steamCurves.push(steam);}
  coffeeGroup.scale.setScalar(1.35);
  const particlesN=180;const particlePositions=new Float32Array(particlesN*3);for(let i=0;i<particlesN;i++){particlePositions[i*3]=(Math.random()-.5)*5;particlePositions[i*3+1]=(Math.random()-.5)*5;particlePositions[i*3+2]=(Math.random()-.5)*2;}const particleGeo=new THREE.BufferGeometry();particleGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));const particleMat=new THREE.PointsMaterial({color:0xc8aeb7,size:.025,transparent:true,opacity:.6,depthWrite:false});const particles=new THREE.Points(particleGeo,particleMat);particles.visible=false;scene.add(particles);
  let dragging=false,lastX=0,lastY=0,zoom=7.5,targetYaw=-.3,targetPitch=.08;
  canvas.style.pointerEvents='auto';canvas.style.touchAction='none';const activePointers=new Map();let pinchStart=0,pinchZoom=zoom;canvas.addEventListener('pointerdown',e=>{if(state.scene!=='hero')return;activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);if(activePointers.size===1){dragging=true;lastX=e.clientX;lastY=e.clientY;}else if(activePointers.size===2){const pts=[...activePointers.values()];pinchStart=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);pinchZoom=zoom;dragging=false;}});canvas.addEventListener('pointermove',e=>{if(!activePointers.has(e.pointerId)||state.scene!=='hero')return;activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(activePointers.size===2){const pts=[...activePointers.values()];const dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);zoom=Math.max(4.4,Math.min(10,pinchZoom-(dist-pinchStart)*.012));return;}if(!dragging)return;targetYaw+=(e.clientX-lastX)*.009;targetPitch=Math.max(-.8,Math.min(.8,targetPitch+(e.clientY-lastY)*.006));lastX=e.clientX;lastY=e.clientY;});['pointerup','pointercancel','lostpointercapture'].forEach(n=>canvas.addEventListener(n,e=>{activePointers.delete(e.pointerId);dragging=activePointers.size===1;if(dragging){const p=[...activePointers.values()][0];lastX=p.x;lastY=p.y;}}));canvas.addEventListener('wheel',e=>{if(state.scene!=='hero')return;e.preventDefault();zoom=Math.max(4.4,Math.min(10,zoom+Math.sign(e.deltaY)*.35));},{passive:false});
  $('#resetHammer').addEventListener('click',()=>{targetYaw=-.3;targetPitch=.08;zoom=7.5;});
  function playLiftSound(){try{const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;audioContext=audioContext||new AudioCtx();audioContext.resume();const now=audioContext.currentTime;const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='triangle';osc.frequency.setValueAtTime(58,now);osc.frequency.exponentialRampToValueAtTime(310,now+.85);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.12,now+.12);gain.gain.exponentialRampToValueAtTime(.0001,now+1.35);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now);osc.stop(now+1.4);}catch(e){console.warn('Lift sound unavailable',e);}}
  $('#liftHammer').addEventListener('click',()=>{if(state.hammer){$('#hammerVictory').hidden=false;return;}state.lift=true;particles.visible=true;playLiftSound();const tl=gsap.timeline();tl.to(hammerGroup.position,{y:1.15,duration:1.2,ease:'power3.out'}).to(hammerGroup.rotation,{z:-.12,duration:.6},'<').to(rim,{intensity:100,duration:.8},'<').to(particleMat,{opacity:1,duration:.8},'<').to(hammerGroup.scale,{x:1.2,y:1.2,z:1.2,duration:.8},'<').add(()=>{state.hammer=true;persist();$('#hammerVictory').hidden=false;$('#liftHammer').disabled=true;toast('Мьёльнир поднят.');}).to(hammerGroup.position,{y:1.05,duration:.45});});
  function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(max-width:760px)').matches?1.25:1.7));}addEventListener('resize',resize);
  const clock=new THREE.Clock();function render3d(){requestAnimationFrame(render3d);const t=clock.getElapsedTime();if(state.scene==='hero'){hammerGroup.visible=true;coffeeGroup.visible=false;camera.position.x+=(0-camera.position.x)*.06;hammerGroup.rotation.y+=(targetYaw-hammerGroup.rotation.y)*.08;hammerGroup.rotation.x+=(targetPitch-hammerGroup.rotation.x)*.08;camera.position.z+=(zoom-camera.position.z)*.08;camera.lookAt(0,0,0);if(!dragging&&!reduced&&!state.lift)hammerGroup.rotation.y+=.0007;particles.rotation.y=t*.08;}else if(state.scene==='senses'&&state.sense==='scent'){hammerGroup.visible=false;coffeeGroup.visible=true;camera.position.x+=(2.35-camera.position.x)*.06;camera.position.z+=(7.5-camera.position.z)*.06;camera.lookAt(2.35,0,0);if(!reduced){coffeeGroup.rotation.y=Math.sin(t*.22)*.06;steamCurves.forEach((m,i)=>{m.position.x=Math.sin(t*.8+i)*.035;m.position.y=Math.sin(t*1.1+i)*.025;});}}else{hammerGroup.visible=false;coffeeGroup.visible=false;}renderer.render(scene,camera);}render3d();

  // Touch swipe support for editorial sequences; no automatic scene changes.
  let touchStart=null;document.addEventListener('touchstart',e=>{if(e.touches.length===1)touchStart=[e.touches[0].clientX,e.touches[0].clientY];},{passive:true});document.addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart[0],dy=e.changedTouches[0].clientY-touchStart[1];touchStart=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)){if(state.scene==='character')changeQuality(dx<0?1:-1);if(state.scene==='memories')moveMemory(dx<0?1:-1);if(state.scene==='senses'){const i=RIDDLE_ORDER.indexOf(state.sense);renderSense(RIDDLE_ORDER[(i+(dx<0?1:4))%5]);}}},{passive:true});
  // Restore persisted solved state and initial content.
  updateProgress();updateSenseProgress();renderQuality();renderMemory();renderSense('sight');
})();
