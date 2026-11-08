/* THE WORTHY ARCHIVE — procedural 3D environment. Three.js is loaded as a small CDN module;
   the original HTML experience remains available if WebGL or the CDN is unavailable. */
const canvas = document.querySelector('#worldCanvas');
const root = document.querySelector('#worldRoot');
if (canvas && root) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPower = matchMedia('(max-width: 700px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1.25 : 1.7));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = !lowPower;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#09090d');
    scene.fog = new THREE.FogExp2('#0b0a10', 0.035);
    const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 90);
    camera.position.set(0, 3.3, 11.5);
    const ambient = new THREE.HemisphereLight('#a8a6b8', '#171016', 1.15); scene.add(ambient);
    const key = new THREE.DirectionalLight('#e5d8c8', 3.2); key.position.set(-5, 9, 7); key.castShadow = !lowPower; scene.add(key);
    const burgundy = new THREE.PointLight('#8e2945', 30, 18); burgundy.position.set(-5, 3, -2); scene.add(burgundy);
    const silver = new THREE.PointLight('#a9c4d4', 36, 20); silver.position.set(5, 4, -4); scene.add(silver);
    const world = new THREE.Group(); scene.add(world);

    const mat = (color, metalness=0, roughness=.7, extra={}) => new THREE.MeshStandardMaterial({color, metalness, roughness, ...extra});
    const stone = mat('#29252b', .28, .82), dark = mat('#111116', .22, .8), metal = mat('#87919b', .88, .25), trim = mat('#b7a58e', .72, .31), portalMat = new THREE.MeshStandardMaterial({color:'#8d314b', emissive:'#65162e', emissiveIntensity:1.8, metalness:.45, roughness:.24});

    // Architecture: dark stone floor, monumental ribs, columns and five portals.
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60,60), stone); floor.rotation.x=-Math.PI/2; floor.position.y=-.12; floor.receiveShadow=true; world.add(floor);
    const floorInset = new THREE.Mesh(new THREE.CircleGeometry(6.8,80), mat('#17151b',.42,.55)); floorInset.rotation.x=-Math.PI/2; floorInset.position.y=-.105; world.add(floorInset);
    for(let i=0;i<28;i++){
      const a=i/28*Math.PI*2, r=6.3; const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.24,.34,5.8,8), stone);
      pillar.position.set(Math.cos(a)*r,2.8,Math.sin(a)*r); pillar.castShadow=true; world.add(pillar);
      const capital=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.22,8),trim); capital.position.set(pillar.position.x,5.72,pillar.position.z); world.add(capital);
    }
    const ceiling = new THREE.Mesh(new THREE.TorusGeometry(6.35,.12,8,96),trim); ceiling.position.y=5.8; ceiling.rotation.x=Math.PI/2; world.add(ceiling);
    const floorRing = new THREE.Mesh(new THREE.TorusGeometry(4.4,.025,6,100),trim); floorRing.rotation.x=Math.PI/2; floorRing.position.y=-.08; world.add(floorRing);
    const center = new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.65,.55,12), dark); center.position.y=.18; center.castShadow=true; world.add(center);
    const centerTop = new THREE.Mesh(new THREE.CylinderGeometry(1.18,1.3,.12,12), trim); centerTop.position.y=.51; world.add(centerTop);

    const portalGroups=[];
    const portalPositions=[[-4.6,0,-2.7],[-2.35,0,-5.0],[2.35,0,-5.0],[4.6,0,-2.7],[-4.2,0,1.6],[4.2,0,1.6]];
    portalPositions.forEach((pos,i)=>{
      const g=new THREE.Group(); g.position.set(...pos); world.add(g);
      const arch=new THREE.Mesh(new THREE.TorusGeometry(1.18,.105,12,48,Math.PI),trim); arch.position.y=1.65; arch.rotation.z=Math.PI; g.add(arch);
      const legs=new THREE.Mesh(new THREE.BoxGeometry(.18,1.65,.22),stone); [-1.13,1.13].forEach(x=>{const leg=legs.clone();leg.position.set(x,.82,0);g.add(leg)});
      const panel=new THREE.Mesh(new THREE.PlaneGeometry(1.95,2.75),portalMat.clone()); panel.position.set(0,1.45,-.12); g.add(panel);
      const halo=new THREE.PointLight(i===0?'#b6d2e0':'#8b3049',9,5);halo.position.set(0,2,0);g.add(halo);
      portalGroups.push(g);
    });

    // Floating dust — intentionally sparse for mobile GPUs.
    const count=lowPower?180:420, positions=new Float32Array(count*3), speeds=new Float32Array(count);
    for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*24;positions[i*3+1]=Math.random()*7;positions[i*3+2]=(Math.random()-.5)*22;speeds[i]=.15+Math.random()*.35;}
    const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#b9a9a2',size:.025,transparent:true,opacity:.56,depthWrite:false}));world.add(dust);

    // A proper procedural Mjölnir model, used in the Worthy chamber.
    const hammerGroup=new THREE.Group();
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(.13,.18,2.8,16),mat('#5d5147',.78,.32)); handle.position.y=-.15; handle.castShadow=true; hammerGroup.add(handle);
    for(let j=0;j<7;j++){const band=new THREE.Mesh(new THREE.TorusGeometry(.16,.025,8,24),trim);band.rotation.x=Math.PI/2;band.position.y=-1.12+j*.29;hammerGroup.add(band)}
    const headShape=new THREE.Shape();
    headShape.moveTo(-.92,-.62);headShape.quadraticCurveTo(-1.08,-.62,-1.08,-.44);headShape.lineTo(-1.08,.43);headShape.quadraticCurveTo(-1.08,.62,-.9,.62);headShape.lineTo(.9,.62);headShape.quadraticCurveTo(1.08,.62,1.08,.43);headShape.lineTo(1.08,-.44);headShape.quadraticCurveTo(1.08,-.62,.9,-.62);headShape.closePath();
    const headGeo=new THREE.ExtrudeGeometry(headShape,{depth:1.02,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.09,bevelThickness:.1,curveSegments:8});headGeo.translate(0,0,-.51);
    const head=new THREE.Mesh(headGeo,metal);head.position.y=1.28;head.castShadow=true;head.receiveShadow=true;hammerGroup.add(head);
    const bevelA=new THREE.Mesh(new THREE.BoxGeometry(2.28,.12,1.3),trim);bevelA.position.y=1.9;hammerGroup.add(bevelA);
    const jewel=new THREE.Mesh(new THREE.OctahedronGeometry(.24,1),mat('#6d1e36',.62,.18,{emissive:'#3c091a',emissiveIntensity:.7}));jewel.position.set(0,1.3,.63);hammerGroup.add(jewel);
    for(let side of [-1,1]){const rune=new THREE.Mesh(new THREE.TorusGeometry(.22,.035,8,24),trim);rune.position.set(side*.72,1.3,.63);hammerGroup.add(rune)}
    const runeCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.42,1.05,.625),new THREE.Vector3(-.28,1.22,.625),new THREE.Vector3(-.42,1.43,.625),new THREE.Vector3(-.25,1.56,.625)]);
    const runeLine=new THREE.Mesh(new THREE.TubeGeometry(runeCurve,24,.018,6,false),trim);hammerGroup.add(runeLine);
    const runeCurve2=new THREE.CatmullRomCurve3([new THREE.Vector3(.42,1.05,.625),new THREE.Vector3(.28,1.22,.625),new THREE.Vector3(.42,1.43,.625),new THREE.Vector3(.25,1.56,.625)]);
    hammerGroup.add(new THREE.Mesh(new THREE.TubeGeometry(runeCurve2,24,.018,6,false),trim));
    hammerGroup.scale.setScalar(1.05);hammerGroup.position.set(0,1.6,0);
    let active='welcome', targetYaw=0, drag=false, lastX=0, hammerReady=false;
    const roomObserver=new MutationObserver(()=>{
      const current=document.querySelector('.scene.active'); const next=current?.id||'welcome';
      if(next!==active){active=next; root.classList.toggle('world-visible',next==='archiveHub'||next==='hammer'); root.classList.toggle('world-hammer',next==='hammer');
        world.visible=next==='archiveHub';
        if(next==='hammer'){world.visible=false;scene.background=new THREE.Color('#080a10');scene.fog=new THREE.FogExp2('#080a10',.045);scene.add(hammerGroup);hammerGroup.position.set(0,1.4,0);camera.position.set(0,2.8,7.8);camera.lookAt(0,1.2,0);}
        else {scene.remove(hammerGroup);scene.background=new THREE.Color('#09090d');scene.fog=new THREE.FogExp2('#0b0a10',.035);camera.position.set(0,3.3,11.5);camera.lookAt(0,1.8,0);}
      }
    });
    roomObserver.observe(document.querySelector('main'),{subtree:true,attributes:true,attributeFilter:['class']});

    canvas.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;canvas.setPointerCapture?.(e.pointerId)});
    canvas.addEventListener('pointermove',e=>{if(drag){targetYaw+=(e.clientX-lastX)*.008;lastX=e.clientX;}});
    canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);
    const hammerControl=document.querySelector('#mjolnirControl');
    let hammerDragX=0;
    hammerControl?.addEventListener('pointerdown',e=>{hammerReady=true;hammerDragX=e.clientX;hammerControl.setPointerCapture?.(e.pointerId)});
    hammerControl?.addEventListener('pointermove',e=>{if(e.buttons){targetYaw+=(e.clientX-hammerDragX)*.012;hammerDragX=e.clientX;}});
    document.querySelector('#mjolnirControl')?.addEventListener('click',()=>{hammerGroup.rotation.z=.08;setTimeout(()=>hammerGroup.rotation.z=0,450)});

    const clock=new THREE.Clock();
    function render(){
      const t=clock.getElapsedTime();
      if(active==='archiveHub'){
        world.rotation.y=reduced?0:Math.sin(t*.08)*.035;
        portalGroups.forEach((g,i)=>{const m=g.children.find(c=>c.material===portalMat || c.material?.emissive);if(m)m.material.emissiveIntensity=1.3+Math.sin(t*1.25+i)*.32;});
        camera.position.x+=(Math.sin(t*.12)*.22-camera.position.x)*.012;camera.lookAt(0,1.8,-1.2);
      } else if(active==='hammer'){
        hammerGroup.rotation.y+=(targetYaw-hammerGroup.rotation.y)*.08;
        if(!drag&&!reduced)hammerGroup.rotation.y+=Math.sin(t*.6)*.0008;
        hammerGroup.position.y=1.4+(reduced?0:Math.sin(t*1.25)*.035);
        silver.intensity=active==='hammer'?42:36;
      }
      if(!reduced){const a=dust.geometry.attributes.position;for(let i=0;i<count;i++){a.array[i*3+1]+=speeds[i]*.002;if(a.array[i*3+1]>7)a.array[i*3+1]=0;}a.needsUpdate=true;}
      renderer.render(scene,camera);requestAnimationFrame(render);
    }
    function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
    addEventListener('resize',resize);render();
  } catch(error) {
    console.warn('3D archive fallback enabled:',error);
    root.classList.add('world-fallback');
  }
}
