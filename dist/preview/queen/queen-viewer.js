import * as T from '../../vendor/three.module.js';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { RoomEnvironment } from '../../vendor/RoomEnvironment.js';
import { makeWorkshop } from '../collectors/sculptures.js?v=queen-inspection-1';

const host=document.getElementById('viewer');
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2.25));
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.16;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
host.append(renderer.domElement);

const scene=new T.Scene();
scene.background=new T.Color('#e7e4de');

const pmrem=new T.PMREMGenerator(renderer);
const room=new RoomEnvironment();
const env=pmrem.fromScene(room,.04).texture;
scene.environment=env;
room.dispose();
pmrem.dispose();

scene.add(new T.HemisphereLight(0xffffff,0x7f7468,1.55));
const key=new T.DirectionalLight(0xfff1dc,3.5);
key.position.set(-5,9,7);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);
const fill=new T.DirectionalLight(0xdcecff,1.55);fill.position.set(6,6,-6);scene.add(fill);
const rim=new T.DirectionalLight(0xffffff,1.7);rim.position.set(-4,5,-8);scene.add(rim);

const W=makeWorkshop(env);
const floor=new T.Mesh(new T.CircleGeometry(4.2,96),new T.MeshPhysicalMaterial({color:'#d6d0c6',roughness:.7,metalness:0}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.01;floor.receiveShadow=true;scene.add(floor);

const camera=new T.PerspectiveCamera(30,1,.05,50);
camera.position.set(2.55,2.1,3.65);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.08;
controls.enablePan=true;
controls.minDistance=1.8;
controls.maxDistance=8;
controls.minPolarAngle=.12;
controls.maxPolarAngle=Math.PI-.12;
controls.target.set(0,1.0,0);
controls.update();

let queen=null;
function loadQueen(color){
  if(queen)scene.remove(queen);
  queen=W.piece('q',color);
  queen.position.y=.02;
  queen.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  scene.add(queen);
}
loadQueen('w');

function look(x,y,z,tx=0,ty=1.0,tz=0){
  camera.position.set(x,y,z);
  controls.target.set(tx,ty,tz);
  controls.update();
}
document.getElementById('front').addEventListener('click',()=>look(0,2.0,3.55));
document.getElementById('back').addEventListener('click',()=>look(0,2.0,-3.55));
document.getElementById('left').addEventListener('click',()=>look(-3.55,2.0,0));
document.getElementById('right').addEventListener('click',()=>look(3.55,2.0,0));
document.getElementById('reset').addEventListener('click',()=>look(2.55,2.1,3.65));
document.getElementById('side').addEventListener('change',e=>loadQueen(e.target.value));

let auto=false;
document.getElementById('auto').addEventListener('click',e=>{
  auto=!auto;
  e.currentTarget.setAttribute('aria-pressed',String(auto));
  e.currentTarget.textContent=auto?'Stop rotation':'Auto rotate';
});

function resize(){
  const w=host.clientWidth,h=Math.max(460,host.clientHeight);
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);
resize();

renderer.setAnimationLoop(()=>{
  controls.autoRotate=auto;
  controls.autoRotateSpeed=.65;
  controls.update();
  renderer.render(scene,camera);
});
