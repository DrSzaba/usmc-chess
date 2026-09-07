import { Chess } from './vendor/chess.js';
const $=id=>document.getElementById(id), game=new Chess();
const names={p:'Pawn',r:'Rook',n:'Knight',b:'Bishop',q:'Queen',k:'King'},glyph={p:'♟',r:'♜',n:'♞',b:'♝',q:'♛',k:'♚'};
let selected=null, flipped=false, flat=false, busy=false, timer=null, redraw3D=()=>{}, cameraReset=()=>{};
const square=(r,c)=>'abcdefgh'[c]+(8-r);
function legal(){return selected?game.moves({square:selected,verbose:true}):[]}
function choose(s){
 if(busy||game.isGameOver())return;
 const p=game.get(s),moves=legal();
 if(selected&&moves.some(m=>m.to===s)){
  game.move({from:selected,to:s,promotion:$('promotion').value});selected=null;render();scheduleCPU();return;
 }
 selected=p&&p.color===game.turn()?(s===selected?null:s):null;render();
}
function render(){
 const team=game.turn()==='w'?'White':'Dress blues';
 $('status').textContent=game.isCheckmate()?`${game.turn()==='w'?'Dress blues':'White'} win`:game.isStalemate()?'Stalemate':game.isDraw()?'Draw':busy?'Computer thinking…':`${team} to move`;
 $('detail').textContent=game.isCheckmate()?'Checkmate. Start a new game for a rematch.':game.isDraw()?'The game has ended in a draw.':game.isCheck()?'Check — protect your king.':busy?'Dress blues are choosing their move.':selected?`${names[game.get(selected).type]} on ${selected}. Choose a highlighted square.`:'Select a piece to see its legal moves.';
 $('undo').disabled=game.history().length===0;
 const hist=game.history();$('history').replaceChildren();for(let i=0;i<hist.length;i+=2){const li=document.createElement('li');li.textContent=hist[i].padEnd(9,' ')+(hist[i+1]||'');$('history').append(li)}$('history').scrollTop=$('history').scrollHeight;$('count').textContent=`${hist.length} half-moves`;
 const destinations=new Set(legal().map(m=>m.to)), last=game.history({verbose:true}).at(-1), focus=document.activeElement?.dataset.square;
 $('flat').replaceChildren();for(let i=0;i<64;i++){const r=flipped?7-Math.floor(i/8):Math.floor(i/8),c=flipped?7-i%8:i%8,s=square(r,c),p=game.get(s),b=document.createElement('button');b.className=`sq ${(r+c)%2?'dark':'light'}${s===selected?' selected':''}${destinations.has(s)?' legal':''}${last&&(last.from===s||last.to===s)?' last':''}`;b.dataset.square=s;b.setAttribute('aria-label',`${s}: ${p?`${p.color==='w'?'White':'Dress blue'} ${names[p.type]}`:'empty'}${destinations.has(s)?', legal move':''}`);b.setAttribute('aria-pressed',String(s===selected));if(p){const span=document.createElement('span');span.className=`piece ${p.color}`;span.textContent=glyph[p.type];b.append(span)}const caption=document.createElement('small');caption.textContent=s;b.append(caption);b.onclick=()=>choose(s);b.onkeydown=e=>{const d={ArrowRight:1,ArrowLeft:-1,ArrowDown:8,ArrowUp:-8}[e.key];if(d){e.preventDefault();$('flat').children[Math.max(0,Math.min(63,i+d))].focus()}};$('flat').append(b)}
 if(flat&&focus)$('flat').querySelector(`[data-square="${focus}"]`)?.focus();redraw3D();
}
const values={p:100,n:320,b:330,r:500,q:900,k:0};
function evaluate(){if(game.isCheckmate())return game.turn()==='w'?100000:-100000;if(game.isDraw())return 0;let n=0;game.board().forEach((row,r)=>row.forEach((p,c)=>{if(p)n+=(p.color==='b'?1:-1)*(values[p.type]+(p.type==='p'?(p.color==='b'?r:7-r)*5:0)+(3.5-Math.abs(c-3.5))*2)}));return n}
function search(depth,a,b){if(!depth||game.isGameOver())return evaluate();const max=game.turn()==='b';let best=max?-Infinity:Infinity;const moves=game.moves({verbose:true}).sort((x,y)=>(values[y.captured]||0)-(values[x.captured]||0));for(const m of moves){game.move(m);const v=search(depth-1,a,b);game.undo();best=max?Math.max(best,v):Math.min(best,v);if(max)a=Math.max(a,best);else b=Math.min(b,best);if(b<=a)break}return best}
function scheduleCPU(){if($('mode').value!=='cpu'||game.turn()!=='b'||game.isGameOver())return;busy=true;render();timer=setTimeout(()=>{try{let best=-Infinity,move=null;for(const m of game.moves({verbose:true})){game.move(m);const v=search(1,-Infinity,Infinity);game.undo();if(v>best){best=v;move=m}}if(move)game.move(move)}finally{busy=false;timer=null;render()}},300)}
function cancel(){clearTimeout(timer);timer=null;busy=false;selected=null}
function setView(){ $('canvas').hidden=flat;$('flat').hidden=!flat;$('view').textContent=flat?'Use 3D board':'Use 2D board';$('instructions').textContent=flat?'Select a piece, then a highlighted square. Arrow keys navigate the board.':'Select a piece, then a highlighted square. Drag to rotate; scroll to zoom.';render() }
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
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;$('canvas').append(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(39,1,.1,100),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=9;controls.maxDistance=26;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI/2-.13;controls.enablePan=false;controls.target.set(0,.15,0);
 cameraReset=()=>{camera.position.set(flipped?-9:9,12.5,flipped?-12:12);controls.target.set(0,.15,0);controls.update()};cameraReset();
 scene.add(new THREE.HemisphereLight(0xe6efff,0x614531,3));const sun=new THREE.DirectionalLight(0xffe6be,4);sun.position.set(-5,13,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7});sun.shadow.bias=-.0004;scene.add(sun);const fill=new THREE.DirectionalLight(0xaec8ff,2);fill.position.set(7,5,-7);scene.add(fill);
 const mat=(color,metalness=0,roughness=.4)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const gold=mat('#d8a13e',.8,.23),black=mat('#0d1722',.45,.2),ivory=mat('#fff2d7',.08,.32),navy=mat('#09284e',.15,.33),red=mat('#ad2924'),skinWhite=mat('#dca079'),skinBlack=mat('#603722'),shoe=mat('#111316',.2,.25);
 function mesh(parent,geo,material,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 const box=(p,w,h,d,m,x=0,y=0,z=0)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(p,rt,rb,h,m,x=0,y=0,z=0,n=24)=>mesh(p,new THREE.CylinderGeometry(rt,rb,h,n),m,x,y,z);
 const ball=(p,r,m,x=0,y=0,z=0)=>mesh(p,new THREE.SphereGeometry(r,16,12),m,x,y,z);
 function label(text,w,h,color='#eac16d',bg=null){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256)}ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='52px Georgia';ctx.fillText(text,512,128);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:!bg,side:THREE.DoubleSide}))}
 // A small repeatable burl texture gives the board its lacquered red wood surface.
 const texCanvas=document.createElement('canvas');texCanvas.width=texCanvas.height=256;const ctx=texCanvas.getContext('2d'),data=ctx.createImageData(256,256);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const v=(Math.sin(x*.11+Math.sin(y*.09)*4)+Math.sin(y*.17+x*.04)+2)/4,i=(y*256+x)*4;data.data[i]=65+v*88;data.data[i+1]=19+v*23;data.data[i+2]=13+v*16;data.data[i+3]=255}ctx.putImageData(data,0,0);const tex=new THREE.CanvasTexture(texCanvas);tex.colorSpace=THREE.SRGBColorSpace;const wood=new THREE.MeshStandardMaterial({map:tex,roughness:.22,metalness:.15});
 box(scene,9.25,.55,9.25,wood,0,-.5,0);box(scene,9.03,.055,9.03,gold,0,-.195,0);box(scene,8.9,.11,8.9,black,0,-.12,0);box(scene,8.15,.035,8.15,gold,0,-.045,0);
 const floor=box(scene,200,.1,200,mat('#17202c',.1,.75),0,-.84,0);floor.castShadow=false;
 const plaque=label('S E M P E R   F I D E L I S',6,.45,'#f3c875','#101720');plaque.position.set(0,-.48,4.634);scene.add(plaque);
 const tiles=[],pieces=new THREE.Group(),highlights=new THREE.Group();scene.add(pieces,highlights);
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){const s=square(r,c),tile=box(scene,.986,.075,.986,(r+c)%2?black:wood,c-3.5,0,r-3.5);tile.userData.square=s;tiles.push(tile)}
 for(let i=0;i<8;i++){for(const side of [-1,1]){const l=label('abcdefgh'[i],.35,.16);l.rotation.x=-Math.PI/2;l.position.set(i-3.5,-.035,side*4.25);scene.add(l);const n=label(String(8-i),.35,.16);n.rotation.x=-Math.PI/2;n.position.set(side*4.25,-.035,i-3.5);scene.add(n)}}
 function piece(type,color){const g=new THREE.Group(),uniform=color==='w'?ivory:navy,skin=color==='w'?skinBlack:skinWhite;
  cyl(g,.32,.36,.11,gold,0,.10);cyl(g,.32,.32,.13,navy,0,.21);cyl(g,.30,.33,.04,gold,0,.295);cyl(g,.29,.29,.025,ivory,0,.327);
  for(let j=0;j<8;j++){const angle=j*Math.PI/4;ball(g,.023,gold,Math.sin(angle)*.325,.21,Math.cos(angle)*.325)}
  if(type==='r'){box(g,.36,.69,.36,uniform,0,.70);for(const x of [-.19,.19])for(const z of [-.19,.19])box(g,.028,.75,.028,gold,x,.72,z);box(g,.46,.07,.46,gold,0,1.085);cyl(g,.025,.35,.23,uniform,0,1.235,0,4);ball(g,.055,gold,0,1.39);const l=label('⚓',.26,.24);l.position.set(0,.72,.184);g.add(l)}
  else if(type==='n'){
   const neck=cyl(g,.105,.23,.57,ivory,0,.69);neck.rotation.z=-.27;const head=box(g,.23,.23,.40,ivory,-.10,1.02,.06);head.rotation.x=-.3;box(g,.20,.18,.22,ivory,-.10,.97,.28);for(const x of [-.19,-.02]){const ear=cyl(g,.008,.048,.19,ivory,x,1.21,-.07,8);ear.rotation.x=-.15}for(const x of [-.224,.025])ball(g,.026,shoe,x,1.07,.13);for(let j=0;j<7;j++)ball(g,.065,gold,.07,.57+j*.078,-.17);box(g,.255,.035,.30,gold,-.10,.98,.24);cyl(g,.235,.235,.045,gold,0,.47);}
  else if(type==='q'){
   cyl(g,.11,.30,.72,uniform,0,.71);cyl(g,.13,.10,.22,uniform,0,1.12);cyl(g,.31,.31,.025,gold,0,.36);for(let j=0;j<8;j++){const a=j*Math.PI/4;const trim=cyl(g,.008,.012,.67,gold,Math.sin(a)*.18,.69,Math.cos(a)*.18);trim.rotation.z=Math.sin(a)*.25;trim.rotation.x=-Math.cos(a)*.25}ball(g,.128,skin,0,1.37);ball(g,.14,mat('#211711'),0,1.38,-.06);ball(g,.119,skin,0,1.37,.03);cyl(g,.14,.14,.06,gold,0,1.49);for(let j=0;j<7;j++){const a=j*Math.PI*2/7;cyl(g,0,.028,.11,gold,Math.sin(a)*.125,1.565,Math.cos(a)*.125,6)}for(const x of [-.18,.18]){const arm=cyl(g,.055,.044,.4,uniform,x,1.0);arm.rotation.z=x>0?-.18:.18;ball(g,.045,skin,x,.8)}
  }else{
   const royal=type==='k',officer=type==='b',h=royal?1.14:officer?1.04:.90;
   for(const x of [-.085,.085]){cyl(g,.065,.06,.32,uniform,x,.51);box(g,.125,.08,.19,shoe,x,.37,.035)}
   cyl(g,.18,.14,.35,uniform,0,.80);cyl(g,.153,.153,.045,ivory,0,.66);box(g,.047,.05,.024,gold,0,.66,.157);
   for(const x of [-.205,.205]){const arm=cyl(g,.067,.045,.35,uniform,x,.79);arm.rotation.z=x>0?-.12:.12;ball(g,.049,ivory,x,.59);box(g,.052,.045,.095,gold,x,.96)}
   cyl(g,.056,.06,.065,skin,0,1.0);ball(g,.115,skin,0,1.105);cyl(g,.15,.135,.06,uniform,0,1.22);cyl(g,.15,.15,.018,gold,0,1.185);box(g,.19,.018,.135,shoe,0,1.18,.075);ball(g,.02,gold,0,1.226,.15);
   for(let j=0;j<4;j++)ball(g,.014,gold,0,.73+j*.06,.16);for(let j=0;j<6;j++)box(g,.032,.018,.014,j%3===0?red:j%3===1?gold:navy,-.08+(j%3)*.032,.87-Math.floor(j/3)*.023,.155);
   if(royal||officer){const cord=new THREE.Mesh(new THREE.TorusGeometry(.15,.014,8,32,Math.PI),gold);cord.rotation.z=Math.PI;cord.position.set(.01,.9,.16);g.add(cord);box(g,.018,.42,.025,gold,.28,.70);if(royal){cyl(g,.14,.14,.045,gold,0,1.28);for(let j=0;j<5;j++)cyl(g,0,.024,.09,gold,Math.sin(j*1.257)*.12,1.34,Math.cos(j*1.257)*.12,6)}}
   g.scale.y=h;
  }
  const id=label(type.toUpperCase(),.18,.11,'#fff4ce');id.position.set(0,.21,.329);g.add(id);if(color==='b')g.rotation.y=Math.PI;return g;
 }
 const models={};for(const color of ['w','b'])for(const type of Object.keys(names))models[color+type]=piece(type,color);
 function disposeHighlights(){for(const obj of [...highlights.children]){obj.geometry.dispose();obj.material.dispose();highlights.remove(obj)}}
 redraw3D=()=>{pieces.clear();disposeHighlights();game.board().forEach((row,r)=>row.forEach((p,c)=>{if(p){const g=models[p.color+p.type].clone();g.position.set(c-3.5,.045,r-3.5);g.traverse(m=>m.userData.square=square(r,c));pieces.add(g)}}));const add=(s,color,opacity)=>{const c=s.charCodeAt(0)-97,r=8-Number(s[1]);const h=new THREE.Mesh(new THREE.PlaneGeometry(.9,.9),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false}));h.rotation.x=-Math.PI/2;h.position.set(c-3.5,.043,r-3.5);highlights.add(h)};const last=game.history({verbose:true}).at(-1);if(last){add(last.from,0x66a4b4,.28);add(last.to,0x66a4b4,.28)}if(selected)add(selected,0xffd36e,.55);for(const m of legal())add(m.to,0xffdc76,.43)};
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>7)return;down=null;const b=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects([...tiles,...pieces.children],true).find(x=>x.object.userData.square);if(hit)choose(hit.object.userData.square)});
 function resize(){const w=$('stage').clientWidth,h=$('stage').clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe($('stage'));resize();has3D=true;$('loading').hidden=true;render();renderer.setAnimationLoop(()=>{if(!flat){controls.update();renderer.render(scene,camera)}});
}catch(e){console.error('3D board unavailable',e);flat=true;$('loading').hidden=true;$('view').disabled=true;$('reset-view').disabled=true;setView();$('instructions').textContent='3D is unavailable on this device. The full game works on this 2D board.'}
