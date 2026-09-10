import { Chess } from './vendor/chess.js';
const $=id=>document.getElementById(id), game=new Chess();
const names={p:'Pawn',r:'Rook',n:'Knight',b:'Bishop',q:'Queen',k:'King'},ranks={p:'Private First Class',n:'Corporal',b:'Staff Sergeant',r:'Gunnery Sergeant',q:'Colonel',k:'General'},rankMarks={p:'PFC',n:'CPL',b:'SSGT',r:'GYSGT',q:'COL',k:'GEN'},glyph={p:'♟',r:'♜',n:'♞',b:'♝',q:'♛',k:'♚'};
let selected=null, flipped=false, flat=false, busy=false, timer=null, redraw3D=()=>{}, cameraReset=()=>{};
let audioContext=null;
function playMoveSound(capture=false){
 try{
  audioContext??=new (window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==='suspended')audioContext.resume();
  const now=audioContext.currentTime,master=audioContext.createGain();master.gain.setValueAtTime(.0001,now);master.gain.exponentialRampToValueAtTime(.23,now+.008);master.gain.exponentialRampToValueAtTime(.0001,now+(capture?.38:.22));master.connect(audioContext.destination);
  const knock=(freq,start,duration,volume)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='triangle';osc.frequency.setValueAtTime(freq,now+start);osc.frequency.exponentialRampToValueAtTime(freq*.46,now+start+duration);gain.gain.setValueAtTime(volume,now+start);gain.gain.exponentialRampToValueAtTime(.0001,now+start+duration);osc.connect(gain).connect(master);osc.start(now+start);osc.stop(now+start+duration)};
  knock(capture?165:245,0,.12,1);knock(capture?92:138,.045,capture?.26:.15,.72);
  if(capture)knock(62,.11,.25,.7);
 }catch(e){console.warn('Sound unavailable',e)}
}
const square=(r,c)=>'abcdefgh'[c]+(8-r);
function legal(){return selected?game.moves({square:selected,verbose:true}):[]}
function choose(s){
 if(busy||game.isGameOver())return;
 const p=game.get(s),moves=legal();
 if(selected&&moves.some(m=>m.to===s)){
  const move=moves.find(m=>m.to===s);game.move({from:selected,to:s,promotion:$('promotion').value});playMoveSound(Boolean(move.captured));selected=null;render();scheduleCPU();return;
 }
 selected=p&&p.color===game.turn()?(s===selected?null:s):null;render();
}
function render(){
 const team=game.turn()==='w'?'White':'Dress blues';
 $('status').textContent=game.isCheckmate()?`${game.turn()==='w'?'Dress blues':'White'} win`:game.isStalemate()?'Stalemate':game.isDraw()?'Draw':busy?'Computer thinking…':`${team} to move`;
 $('detail').textContent=game.isCheckmate()?'Checkmate. Start a new game for a rematch.':game.isDraw()?'The game has ended in a draw.':game.isCheck()?'Check — protect your king.':busy?'Dress blues are choosing their move.':selected?`${ranks[game.get(selected).type]} · ${names[game.get(selected).type]} on ${selected}. Choose a highlighted square.`:'Select a piece to see its legal moves.';
 $('undo').disabled=game.history().length===0;
 const hist=game.history();$('history').replaceChildren();for(let i=0;i<hist.length;i+=2){const li=document.createElement('li');li.textContent=hist[i].padEnd(9,' ')+(hist[i+1]||'');$('history').append(li)}$('history').scrollTop=$('history').scrollHeight;$('count').textContent=`${hist.length} half-moves`;
 const destinations=new Set(legal().map(m=>m.to)), last=game.history({verbose:true}).at(-1), focus=document.activeElement?.dataset.square;
 $('flat').replaceChildren();for(let i=0;i<64;i++){const r=flipped?7-Math.floor(i/8):Math.floor(i/8),c=flipped?7-i%8:i%8,s=square(r,c),p=game.get(s),b=document.createElement('button');b.className=`sq ${(r+c)%2?'dark':'light'}${s===selected?' selected':''}${destinations.has(s)?' legal':''}${last&&(last.from===s||last.to===s)?' last':''}`;b.dataset.square=s;b.setAttribute('aria-label',`${s}: ${p?`${p.color==='w'?'White':'Dress blue'} ${names[p.type]}`:'empty'}${destinations.has(s)?', legal move':''}`);b.setAttribute('aria-pressed',String(s===selected));if(p){const span=document.createElement('span');span.className=`piece ${p.color}`;span.textContent=glyph[p.type];b.append(span)}const caption=document.createElement('small');caption.textContent=s;b.append(caption);b.onclick=()=>choose(s);b.onkeydown=e=>{const d={ArrowRight:1,ArrowLeft:-1,ArrowDown:8,ArrowUp:-8}[e.key];if(d){e.preventDefault();$('flat').children[Math.max(0,Math.min(63,i+d))].focus()}};$('flat').append(b)}
 if(flat&&focus)$('flat').querySelector(`[data-square="${focus}"]`)?.focus();redraw3D();
}
const values={p:100,n:320,b:330,r:500,q:900,k:0};
function evaluate(){if(game.isCheckmate())return game.turn()==='w'?100000:-100000;if(game.isDraw())return 0;let n=0;game.board().forEach((row,r)=>row.forEach((p,c)=>{if(p)n+=(p.color==='b'?1:-1)*(values[p.type]+(p.type==='p'?(p.color==='b'?r:7-r)*5:0)+(3.5-Math.abs(c-3.5))*2)}));return n}
function search(depth,a,b){if(!depth||game.isGameOver())return evaluate();const max=game.turn()==='b';let best=max?-Infinity:Infinity;const moves=game.moves({verbose:true}).sort((x,y)=>(values[y.captured]||0)-(values[x.captured]||0));for(const m of moves){game.move(m);const v=search(depth-1,a,b);game.undo();best=max?Math.max(best,v):Math.min(best,v);if(max)a=Math.max(a,best);else b=Math.min(b,best);if(b<=a)break}return best}
function scheduleCPU(){if($('mode').value!=='cpu'||game.turn()!=='b'||game.isGameOver())return;busy=true;render();timer=setTimeout(()=>{try{let best=-Infinity,move=null;for(const m of game.moves({verbose:true})){game.move(m);const v=search(1,-Infinity,Infinity);game.undo();if(v>best){best=v;move=m}}if(move){game.move(move);playMoveSound(Boolean(move.captured))}}finally{busy=false;timer=null;render()}},420)}
function cancel(){clearTimeout(timer);timer=null;busy=false;selected=null}
function setView(){ $('canvas').hidden=flat;$('flat').hidden=!flat;$('view').textContent=flat?'Use 3D board':'Use 2D board';$('instructions').textContent=flat?'Select a piece, then a highlighted square. Arrow keys navigate the board.':'Select a piece, then a highlighted square. Drag to rotate the 3D board and scroll to zoom.';render() }
let has3D=false;
 $('view').onclick=()=>{if(has3D){flat=!flat;setView()}};
 $('new').onclick=()=>{if(game.history().length&&!confirm('Start a new game? The current match will be cleared.'))return;cancel();game.reset();render()};
 $('undo').onclick=()=>{cancel();game.undo();if($('mode').value==='cpu'&&game.turn()==='b')game.undo();render()};
 $('mode').onchange=()=>{cancel();render();scheduleCPU()};
 $('flip').onclick=()=>{flipped=!flipped;cameraReset();render()};$('reset-view').onclick=()=>cameraReset();
render();
try{
 const THREE=await import('three'),{OrbitControls}=await import('./vendor/OrbitControls.js');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#171e28');scene.fog=new THREE.Fog('#171e28',27,55);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;renderer.outputColorSpace=THREE.SRGBColorSpace;$('canvas').append(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(39,1,.1,100),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=9;controls.maxDistance=26;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI/2-.13;controls.enablePan=false;controls.target.set(0,.15,0);
 controls.enableRotate=true;controls.rotateSpeed=.65;controls.zoomSpeed=.85;
 cameraReset=()=>{camera.position.set(flipped?-13:13,17,0);controls.target.set(0,.15,0);controls.update()};cameraReset();
 scene.add(new THREE.HemisphereLight(0xe6efff,0x614531,3));const sun=new THREE.DirectionalLight(0xffe6be,4);sun.position.set(-5,13,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7});sun.shadow.bias=-.0004;scene.add(sun);const fill=new THREE.DirectionalLight(0xaec8ff,2);fill.position.set(7,5,-7);scene.add(fill);
 const mat=(color,metalness=0,roughness=.4)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const gold=mat('#d9a441',.88,.18),brightGold=mat('#f1ca70',.92,.12),black=mat('#07111c',.5,.16),ivory=mat('#fff3dc',.05,.29),navy=mat('#052954',.18,.27),red=mat('#b3262d',.08,.35),skinWhite=mat('#d89a70',0,.48),skinBlack=mat('#633923',0,.48),shoe=mat('#090b0e',.5,.16),leather=mat('#35160e',.15,.3),hair=mat('#17100d',0,.65),silver=mat('#d6dde2',.85,.16);
 function mesh(parent,geo,material,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 const box=(p,w,h,d,m,x=0,y=0,z=0)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(p,rt,rb,h,m,x=0,y=0,z=0,n=24)=>mesh(p,new THREE.CylinderGeometry(rt,rb,h,n),m,x,y,z);
 const ball=(p,r,m,x=0,y=0,z=0)=>mesh(p,new THREE.SphereGeometry(r,24,18),m,x,y,z);
 const torus=(p,r,t,m,x=0,y=0,z=0)=>mesh(p,new THREE.TorusGeometry(r,t,10,32),m,x,y,z);
 function label(text,w,h,color='#eac16d',bg=null){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256)}ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='52px Georgia';ctx.fillText(text,512,128);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:!bg,side:THREE.DoubleSide}))}
 // A small repeatable burl texture gives the board its lacquered red wood surface.
 const texCanvas=document.createElement('canvas');texCanvas.width=texCanvas.height=512;const ctx=texCanvas.getContext('2d'),data=ctx.createImageData(512,512);for(let y=0;y<512;y++)for(let x=0;x<512;x++){const grain=Math.sin(x*.055+Math.sin(y*.021)*7)*.5+Math.sin(x*.15+y*.008)*.24+Math.random()*.12,v=.48+grain*.34,i=(y*512+x)*4;data.data[i]=62+v*112;data.data[i+1]=18+v*39;data.data[i+2]=10+v*25;data.data[i+3]=255}ctx.putImageData(data,0,0);const tex=new THREE.CanvasTexture(texCanvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(3,3);const wood=new THREE.MeshPhysicalMaterial({map:tex,roughness:.18,metalness:.08,clearcoat:1,clearcoatRoughness:.12});
 box(scene,9.55,.62,9.55,wood,0,-.53,0);box(scene,9.32,.07,9.32,brightGold,0,-.185,0);box(scene,9.14,.14,9.14,black,0,-.11,0);box(scene,8.35,.045,8.35,brightGold,0,-.025,0);
 // Brass gallery rails, corner finials, and layered feet make the board feel hand-built.
 for(const z of [-4.48,4.48]){box(scene,8.38,.09,.055,brightGold,0,.005,z);for(const x of [-4.48,4.48])cyl(scene,.105,.14,.22,brightGold,x,.03,z,20)}
 for(const x of [-4.48,4.48])box(scene,.055,.09,8.38,brightGold,x,.005,0);
 for(const x of [-4.3,4.3])for(const z of [-4.3,4.3]){cyl(scene,.24,.31,.38,leather,x,-.75,z,28);cyl(scene,.18,.24,.08,gold,x,-.52,z,28);ball(scene,.075,brightGold,x,-.44,z)}
 const floor=box(scene,200,.1,200,mat('#17202c',.1,.75),0,-.84,0);floor.castShadow=false;
 const plaque=label('S E M P E R   F I D E L I S',6,.45,'#f3c875','#101720');plaque.position.set(0,-.48,4.783);scene.add(plaque);
 const tiles=[],pieces=new THREE.Group(),highlights=new THREE.Group();scene.add(pieces,highlights);
 const paleTile=new THREE.MeshPhysicalMaterial({color:'#d7b67d',roughness:.22,clearcoat:.7,clearcoatRoughness:.15}),darkTile=new THREE.MeshPhysicalMaterial({color:'#111b28',metalness:.28,roughness:.2,clearcoat:.85,clearcoatRoughness:.12});
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){const s=square(r,c),tile=box(scene,.965,.085,.965,(r+c)%2?darkTile:wood,c-3.5,.01,r-3.5);tile.geometry.translate(0,.01,0);tile.userData.square=s;tiles.push(tile);box(scene,.91,.012,.91,(r+c)%2?darkTile:wood,c-3.5,.06,r-3.5)}
 for(let i=0;i<8;i++){for(const side of [-1,1]){const l=label('abcdefgh'[i],.35,.16);l.rotation.x=-Math.PI/2;l.position.set(i-3.5,-.035,side*4.25);scene.add(l);const n=label(String(8-i),.35,.16);n.rotation.x=-Math.PI/2;n.position.set(side*4.25,-.035,i-3.5);scene.add(n)}}
 const atlas=await new THREE.TextureLoader().loadAsync('./marine-atlas.png');
 atlas.colorSpace=THREE.SRGBColorSpace;
 const hitCanvas=document.createElement('canvas');hitCanvas.width=atlas.image.width;hitCanvas.height=atlas.image.height;
 const hitContext=hitCanvas.getContext('2d',{willReadFrequently:true});hitContext.drawImage(atlas.image,0,0);
 function visibleHit(hit){
  if(!hit.object.userData.square)return false;
  if(!hit.object.isSprite)return true;
  const map=hit.object.material.map;map.updateMatrix();const uv=map.transformUv(hit.uv.clone());
  const pixel=hitContext.getImageData(Math.min(hitCanvas.width-1,Math.max(0,Math.floor(uv.x*hitCanvas.width))),Math.min(hitCanvas.height-1,Math.max(0,Math.floor(uv.y*hitCanvas.height))),1,1).data;
  return Math.min(pixel[0],pixel[2])-pixel[1]<46;
 }
 const models={};
 for(const flip of [false,true])for(const color of ['w','b'])for(const [column,type] of ['p','n','b','r','q','k'].entries()){
  const texture=atlas.clone();texture.repeat.set((flip?-1:1)/6,.5);texture.offset.set((column+(flip?1:0))/6,color==='w'?.5:0);texture.needsUpdate=true;
  const material=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.5,depthWrite:true,toneMapped:false});
  material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   // Chroma-key the production atlas at render time; retain white fabric and gold.
   float key = min(diffuseColor.r, diffuseColor.b) - diffuseColor.g;
   if (key > 0.18) discard;
  `)};
  const g=new THREE.Group(),figure=new THREE.Sprite(material);figure.center.set(.5,.035);const height=type==='p'?1.42:1.62;figure.scale.set(height,height,1);g.add(figure);
  const plate=label(rankMarks[type],.42,.13,'#fff0bd','#101820');plate.quaternion.copy(camera.quaternion);plate.position.y=.12;plate.userData.rankLabel=true;g.add(plate);
  models[`${flip}${color}${type}`]=g;
 }
 function disposeHighlights(){for(const obj of [...highlights.children]){obj.geometry.dispose();obj.material.dispose();highlights.remove(obj)}}
 redraw3D=()=>{pieces.clear();disposeHighlights();game.board().forEach((row,r)=>row.forEach((p,c)=>{if(p){const g=models[`${flipped}${p.color}${p.type}`].clone();g.position.set(c-3.5,.085,r-3.5);g.children[1].quaternion.copy(camera.quaternion);g.traverse(m=>m.userData.square=square(r,c));pieces.add(g)}}));const add=(s,color,opacity)=>{const c=s.charCodeAt(0)-97,r=8-Number(s[1]);const h=new THREE.Mesh(new THREE.PlaneGeometry(.9,.9),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false}));h.rotation.x=-Math.PI/2;h.position.set(c-3.5,.085,r-3.5);highlights.add(h)};const last=game.history({verbose:true}).at(-1);if(last){add(last.from,0x66a4b4,.28);add(last.to,0x66a4b4,.28)}if(selected)add(selected,0xffd36e,.55);for(const m of legal())add(m.to,0xffdc76,.43)};
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>7)return;down=null;const b=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects([...tiles,...pieces.children],true).find(visibleHit);if(hit)choose(hit.object.userData.square)});
 function resize(){const w=$('stage').clientWidth,h=$('stage').clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe($('stage'));resize();has3D=true;$('loading').hidden=true;render();renderer.setAnimationLoop(()=>{if(!flat){controls.update();pieces.traverse(object=>{if(object.userData.rankLabel)object.quaternion.copy(camera.quaternion)});renderer.render(scene,camera)}});
}catch(e){console.error('3D board unavailable',e);flat=true;$('loading').hidden=true;$('view').disabled=true;$('reset-view').disabled=true;setView();$('instructions').textContent='3D is unavailable on this device. The full game works on this 2D board.'}
