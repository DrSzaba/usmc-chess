import * as T from 'three';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { RoomEnvironment } from '../../vendor/RoomEnvironment.js';
import { Reflector } from '../../vendor/Reflector.js';
import { makeWorkshop } from './sculptures.js?v=tank-4';

const CELL=1.15;
const coords=s=>[(s.charCodeAt(0)-97-3.5)*CELL,(8-Number(s[1])-3.5)*CELL];

export async function createPresentation(api){
 const {stage,host,game,choose,legal,selection,isFlat,isFlipped}=api;
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','Rotatable sculpted Marine chessboard');
 const scene=new T.Scene();scene.background=new T.Color('#e5e3df');scene.fog=new T.Fog('#e5e3df',36,70);
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04).texture;
 scene.environment=env;room.dispose();pmrem.dispose();
 const W=makeWorkshop(env),{M,material,add,ell,box,cyl,ring,line,text,insignia,bake}=W;
 const camera=new T.PerspectiveCamera(36,1,.08,110);
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.dampingFactor=.09;controls.enablePan=true;controls.panSpeed=.5;
 controls.minDistance=2.4;controls.maxDistance=40;controls.maxPolarAngle=Math.PI/2-.05;controls.minPolarAngle=.08;controls.rotateSpeed=.65;controls.zoomSpeed=.8;
 const hemi=new T.HemisphereLight(0xffffff,0x8c7a67,1.45);scene.add(hemi);
 const key=new T.DirectionalLight(0xfff1dc,3.2);key.position.set(-7,14,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:34});key.shadow.normalBias=.018;key.shadow.bias=-.0002;key.shadow.radius=3;scene.add(key);
 const fill=new T.DirectionalLight(0xdbeaff,1.45);fill.position.set(8,8,-8);scene.add(fill);
 const rim=new T.DirectionalLight(0xffffff,1.5);rim.position.set(-3,6,-9);scene.add(rim);

 // Deterministic multiscale burl grain: only a finish on a dimensional board.
 function woodTexture(){const c=document.createElement('canvas');c.width=c.height=768;const ctx=c.getContext('2d'),im=ctx.createImageData(768,768);
  const hash=(x,y)=>{const a=Math.sin(x*127.1+y*311.7)*43758.5453;return a-Math.floor(a)};
  function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,s=u*u*(3-2*u),t=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),s),T.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),s),t)}
  for(let y=0;y<768;y++)for(let x=0;x<768;x++){const xx=x/768,yy=y/768,n=noise(xx*9,yy*9),n2=noise(xx*32+n*2,yy*32+n*3),swirl=Math.sin(xx*55+n*19+Math.sin(yy*18)*3),v=T.MathUtils.clamp(.28+n*.43+n2*.24+swirl*.09,0,1),i=(y*768+x)*4;im.data[i]=40+v*118;im.data[i+1]=9+v*39;im.data[i+2]=7+v*23;im.data[i+3]=255}ctx.putImageData(im,0,0);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=renderer.capabilities.getMaxAnisotropy();return tx;
 }
 const grain=woodTexture();const wood=new T.MeshPhysicalMaterial({map:grain,color:'#efb394',roughness:.24,metalness:.03,clearcoat:1,clearcoatRoughness:.14,envMap:env});
 const dark=material('#111820',.22,.18,{clearcoat:1,transparent:true,opacity:.86,depthWrite:false});
 const frame=new T.Group();
 box(frame,11.06,.70,11.06,wood,0,-.44);box(frame,11.12,.055,11.12,M.gold,0,-.81);
 box(frame,10.93,.08,10.93,M.black,0,-.857);box(frame,11.12,.052,11.12,M.goldLight,0,-.064);
 box(frame,10.98,.12,10.98,wood,0,.014);box(frame,9.76,.053,9.76,M.gold,0,.092);
 box(frame,9.69,.026,9.69,M.black,0,.116);
 for(const a of [-1,1]){
  box(frame,10.65,.026,.025,M.goldLight,0,.083,a*5.325);box(frame,.025,.026,10.65,M.goldLight,a*5.325,.083,0);
  box(frame,9.36,.012,.018,M.goldLight,0,.14,a*4.68);box(frame,.018,.012,9.36,M.goldLight,a*4.68,.14,0);
 }
 // Running brass braid around the board gallery.
 for(let side=0;side<4;side++){
  const edge=new T.Group();edge.rotation.y=side*Math.PI/2;frame.add(edge);
  for(let j=0;j<68;j++){const x=-5.12+j*.153;const r=ring(edge,.048,.009,M.goldLight,x,.101,5.135);r.scale.x=1.36;r.rotation.z=.4;
   ell(edge,x,.117,5.135,.012,.008,.012,M.gold);
  }
  // A front panel with moulding and rivets, rather than an image of a case.
  box(edge,9.87,.47,.023,M.black,0,-.43,5.541);
  for(const y of [-.671,-.197])box(edge,9.94,.024,.032,M.goldLight,0,y,5.563);
  for(const x of [-4.965,4.965])box(edge,.024,.496,.032,M.goldLight,x,-.434,5.563);
  for(const x of [-1.01,1.01])box(edge,.025,.447,.036,M.gold,x,-.433,5.566);
  for(let j=0;j<65;j++)for(const y of [-.629,-.239])ell(edge,-4.85+j*.151,y,5.564,.012,.012,.009,M.goldLight);
  const badge=insignia(edge,0,-.43,5.584,1.16);
  text(edge,'SEMPER FIDELIS',3.38,.21,-2.97,-.373,5.579);
  text(edge,'UNITED STATES MARINE CORPS',3.39,.115,-2.97,-.542,5.579);
  text(edge,'HONOR  •  COURAGE',3.35,.17,2.98,-.36,5.579);
  text(edge,'COMMITMENT',2.75,.14,2.98,-.535,5.579);
 }
 for(const x of [-4.9,4.9])for(const z of [-4.9,4.9]){cyl(frame,.27,.32,.13,M.black,x,-.954,z);cyl(frame,.30,.31,.04,M.gold,x,-.90,z)}
 // Thin continuous grid inlays remain visible beneath legal-move markers.
 for(let i=0;i<=8;i++){const a=(i-4)*CELL;box(frame,9.21,.011,.009,M.goldLight,0,.145,a);box(frame,.009,.011,9.21,M.goldLight,a,.145,0)}
 scene.add(bake(frame));
 const tiles=[];
 const mirror=new Reflector(new T.PlaneGeometry(9.18,9.18),{color:0xaaa9a4,textureWidth:1024,textureHeight:1024,clipBias:.003});mirror.rotation.x=-Math.PI/2;mirror.position.y=.132;scene.add(mirror);
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){
  const x=(c-3.5)*CELL,z=(r-3.5)*CELL;
  const tile=add(scene,new T.PlaneGeometry(CELL-.012,CELL-.012),(r+c)%2?dark:wood,x,.139,z);tile.rotation.x=-Math.PI/2;tile.receiveShadow=true;tile.userData.square='abcdefgh'[c]+(8-r);tiles.push(tile);
 }
 for(let i=0;i<8;i++)for(const sign of [-1,1]){
  const a=text(scene,'ABCDEFGH'[i],.27,.15,(i-3.5)*CELL,.145,sign*4.87);a.rotation.x=-Math.PI/2;if(sign===-1)a.rotation.z=Math.PI;
  const b=text(scene,String(8-i),.27,.15,sign*4.87,.145,(i-3.5)*CELL);b.rotation.x=-Math.PI/2;b.rotation.z=sign*Math.PI/2;
 }
 const floor=add(scene,new T.PlaneGeometry(160,160),material('#d9d7d2',0,.78),0,-1.023);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
 const pieceGroup=new T.Group();scene.add(pieceGroup);const prototypes={};
 for(const color of ['w','b'])for(const type of ['p','n','b','r','q','k'])prototypes[color+type]=W.piece(type,color);
 const marks=new T.Group();scene.add(marks);const markerGeos=[];
 const ray=new T.Raycaster(),pointer=new T.Vector2();let down=null,auto=false,transition=null,lastFen='',currentPieces=new Map();
 function cameraTo(pos,target){transition={from:camera.position.clone(),to:new T.Vector3(...pos),start:controls.target.clone(),target:new T.Vector3(...target),time:performance.now()};auto=false;document.getElementById('showcase').setAttribute('aria-pressed','false')}
 function reset(){const d=camera.aspect<.85?1.33:camera.aspect<1.15?1.12:1;const sign=isFlipped()?-1:1;cameraTo([sign*11*d,12*d,sign*15.5*d],[0,.45,0])}
 camera.position.set(11,12,15.5);controls.target.set(0,.45,0);controls.update();
 function redraw(){
  const fen=game.fen(),now=performance.now(),old=currentPieces,next=new Map();
  if(fen!==lastFen){
   const last=game.history({verbose:true}).at(-1),used=new Set();
   game.board().forEach((row,r)=>row.forEach((p,c)=>{if(!p)return;const s='abcdefgh'[c]+(8-r),key=p.color+p.type;let item=old.get(s);if(item?.key!==key)item=null;
    if(!item&&last?.to===s){const candidate=old.get(last.from);if(candidate?.key===key)item=candidate}
    if(item&&used.has(item))item=null;
    if(!item){const model=prototypes[key].clone(true);pieceGroup.add(model);item={model,key};item.model.position.set((c-3.5)*CELL,.151,(r-3.5)*CELL)}
    const target=new T.Vector3((c-3.5)*CELL,.151,(r-3.5)*CELL);
    if(item.model.position.distanceTo(target)>.01)item.motion={from:item.model.position.clone(),target,time:now};
    item.model.traverse(o=>o.userData.square=s);item.square=s;next.set(s,item);used.add(item);
   }));
   for(const item of old.values())if(!used.has(item))pieceGroup.remove(item.model);
   currentPieces=next;lastFen=fen;
  }
  while(marks.children.length){const m=marks.children[0];marks.remove(m);m.geometry.dispose();m.material.dispose()}
  function mark(s,color,full=false){const [x,z]=coords(s);const geo=full?new T.RingGeometry(.43,.50,48):new T.CircleGeometry(.105,32);const o=add(marks,geo,new T.MeshBasicMaterial({color,transparent:true,opacity:full?.93:.8,depthWrite:false}),x,.157,z);o.rotation.x=-Math.PI/2;}
  const last=game.history({verbose:true}).at(-1);if(last){mark(last.from,'#558b9c',true);mark(last.to,'#558b9c',true)}if(selection())mark(selection(),'#f6c34c',true);
  for(const m of legal())mark(m.to,m.captured?'#c75c40':'#dcc176',!!m.captured);
  const inspect=document.getElementById('inspect');inspect.textContent=selection()?'Inspect selected piece':'Inspect a Marine';
 }
 renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY,e.button];auto=false;transition=null;document.getElementById('showcase').setAttribute('aria-pressed','false')});
 renderer.domElement.addEventListener('pointerup',e=>{const start=down;down=null;if(!start||start[2]!==0||Math.hypot(e.clientX-start[0],e.clientY-start[1])>6)return;const b=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects([...pieceGroup.children,...tiles],true);const hit=hits.find(x=>x.object.userData.square);if(hit)choose(hit.object.userData.square)});
 renderer.domElement.addEventListener('pointercancel',()=>{down=null});
 renderer.domElement.addEventListener('wheel',()=>{transition=null;auto=false},{passive:true});
 function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);resize();reset();
 document.addEventListener('visibilitychange',()=>{if(document.hidden)auto=false});
 renderer.setAnimationLoop(now=>{
  if(isFlat()||document.hidden)return;
  if(transition){const t=Math.min(1,(now-transition.time)/650),s=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,s);controls.target.lerpVectors(transition.start,transition.target,s);if(t===1)transition=null}
  for(const item of currentPieces.values())if(item.motion){const m=item.motion,t=Math.min(1,(now-m.time)/360),s=t*t*(3-2*t);item.model.position.lerpVectors(m.from,m.target,s);item.model.position.y+=Math.sin(t*Math.PI)*.20;if(t===1)delete item.motion}
  controls.autoRotate=auto;controls.autoRotateSpeed=.55;controls.update();renderer.render(scene,camera);
 });
 return {redraw,reset,showcase(){auto=!auto;transition=null;document.getElementById('showcase').setAttribute('aria-pressed',String(auto))},overhead(){cameraTo([0,22,.01],[0,0,0])},zoom(f){const offset=camera.position.clone().sub(controls.target).multiplyScalar(f);const length=T.MathUtils.clamp(offset.length(),2.4,40);offset.setLength(length);cameraTo(controls.target.clone().add(offset).toArray(),controls.target.toArray())},inspect(s){const targetSquare=s||'e1',p=currentPieces.get(targetSquare);if(!p)return;const [x,z]=coords(targetSquare),f=game.get(targetSquare).color==='w'?-1:1;cameraTo([x+2.1,2.75,z+f*3.15],[x,1.0,z])}};
}
