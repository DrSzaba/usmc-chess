import * as T from 'three';
import { mergeGeometries } from '../../vendor/BufferGeometryUtils.js';

// All silhouettes are closed, volumetric meshes. Textures are confined to lettering
// and surface finishes; no figure billboards or camera-facing sprites are used.
export function makeWorkshop(environment) {
 const material=(color,metalness=0,roughness=.4,extra={})=>new T.MeshPhysicalMaterial({color,metalness,roughness,envMap:environment,...extra});
 const M={
  gold:material('#c89438',.86,.22),goldLight:material('#eac36e',.82,.18),
  ivory:material('#f4eee0',.05,.28,{clearcoat:.55,clearcoatRoughness:.2}),
  navy:material('#082348',.12,.31,{clearcoat:.4}),black:material('#09131f',.25,.26),
  red:material('#a5222b',.05,.38),skinW:material('#603722',0,.51),skinB:material('#d09a75',0,.51),
  hair:material('#21160f',0,.64),shoe:material('#070a0e',.2,.2,{clearcoat:1}),
  white:material('#fff9e9',.02,.48),silver:material('#c5d4dc',.87,.19),
  trouserRed:material('#bf192c',.08,.34),trouserWhite:material('#f8f5e9',.03,.39),
  stripeBlue:material('#164c81',.12,.32),stripeWhite:material('#fefbf1',.02,.32),
  ribbonBlue:material('#2379aa',.1,.37),ribbonGreen:material('#22644b',.1,.37),
  lipW:material('#4f2820',0,.52),lipB:material('#a66d58',0,.5),gem:material('#a72237',.35,.2),
 };
 const add=(p,g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o};
 // Extra tessellation keeps faces, hands, covers and curved uniform details
 // round when a player uses the close inspection camera.
 const sphereGeo=new T.SphereGeometry(1,24,16);
 const ell=(p,x,y,z,rx,ry,rz,m)=>{const o=add(p,sphereGeo,m,x,y,z);o.scale.set(rx,ry,rz);return o};
 const box=(p,w,h,d,m,x=0,y=0,z=0)=>add(p,new T.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(p,rt,rb,h,m,x=0,y=0,z=0,n=64)=>add(p,new T.CylinderGeometry(rt,rb,h,n),m,x,y,z);
 const ring=(p,r,t,m,x=0,y=0,z=0)=>{const o=add(p,new T.TorusGeometry(r,t,12,72),m,x,y,z);o.rotation.x=Math.PI/2;return o};
 function line(p,points,r,m){const curve=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a)));return add(p,new T.TubeGeometry(curve,Math.max(8,points.length*5),r,8,false),m)}
 function limb(p,a,b,ra,rb,m){const av=new T.Vector3(...a),bv=new T.Vector3(...b),mid=av.clone().add(bv).multiplyScalar(.5),o=cyl(p,rb,ra,av.distanceTo(bv),m,...mid.toArray(),40);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o}
 function profile(p,rows,m,segments=72,flutes=0){
  const pos=[],uv=[],idx=[];
  for(let j=0;j<rows.length;j++){const [y,rx,rz,cz=0]=rows[j];for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,f=1+Math.cos(a*12)*flutes;pos.push(Math.sin(a)*rx*f,y,Math.cos(a)*rz*f+cz);uv.push(i/segments,j/(rows.length-1));}}
  for(let j=0;j<rows.length-1;j++)for(let i=0;i<segments;i++){const k=j*(segments+1)+i;idx.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return add(p,g,m);
 }
 function star(p,r,x,y,z,m=M.goldLight){const s=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,rr=i%2?r*.43:r,xx=Math.sin(a)*rr,yy=Math.cos(a)*rr;i?s.lineTo(xx,yy):s.moveTo(xx,yy)}s.closePath();return add(p,new T.ExtrudeGeometry(s,{depth:.008,bevelEnabled:false}),m,x,y,z)}
 function text(p,words,w,h,x,y,z,ry=0){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#edd29a';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 174px Georgia';ctx.fillText(words,512,128,980);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const o=add(p,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}),x,y,z);o.rotation.y=ry;return o}
 function anchor(p,x,y,z,scale=1){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);p.add(g);line(g,[[0,.13,0],[0,.03,0],[0,-.13,0]],.014,M.gold);line(g,[[-.12,-.04,0],[-.10,-.12,0],[0,-.17,0],[.10,-.12,0],[.12,-.04,0]],.012,M.gold);line(g,[[-.085,.07,0],[.085,.07,0]],.012,M.gold);const r=ring(g,.029,.009,M.gold,0,.15,0);r.rotation.x=0;return g}
 function insignia(p,x,y,z,scale=1){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);p.add(g);ell(g,0,0,0,.10,.10,.043,M.gold);const rr=ring(g,.10,.008,M.goldLight);rr.rotation.x=0;line(g,[[-.12,.10,0],[-.22,.16,0],[-.07,.12,.01],[0,.16,.025],[.07,.12,.01],[.22,.16,0],[.12,.10,0]],.015,M.gold);anchor(g,.015,-.015,-.015,1.1);return g}
 function bake(group){
  group.updateMatrixWorld(true);const byMaterial=new Map(),labels=[];
  group.traverse(o=>{if(!o.isMesh)return;if(o.material.transparent){const c=o.clone();c.applyMatrix4(o.parent.matrixWorld);labels.push(c);return}const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);const plain=geo.index?geo.toNonIndexed():geo;for(const key of Object.keys(plain.attributes))if(!['position','normal','uv'].includes(key))plain.deleteAttribute(key);if(!plain.attributes.uv)plain.setAttribute('uv',new T.BufferAttribute(new Float32Array(plain.attributes.position.count*2),2));if(!byMaterial.has(o.material))byMaterial.set(o.material,[]);byMaterial.get(o.material).push(plain)});
  const out=new T.Group();for(const [m,list] of byMaterial){const geo=mergeGeometries(list,false);if(!geo)throw Error('Could not merge sculpture geometry');const o=new T.Mesh(geo,m);o.castShadow=true;o.receiveShadow=true;out.add(o);for(const g of list)g.dispose()}for(const o of labels)out.add(o);return out;
 }
 function marble(white){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  ctx.fillStyle=white?'#e9e6de':'#102542';ctx.fillRect(0,0,512,512);
  let seed=1775;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<42;i++){ctx.beginPath();let x=rand()*512,y=rand()*512;ctx.moveTo(x,y);for(let j=0;j<9;j++){x+=rand()*80-30;y+=rand()*80-15;ctx.lineTo(x,y)}ctx.strokeStyle=white?'rgba(94,94,101,.16)':'rgba(202,216,233,.23)';ctx.lineWidth=rand()*1.7+.3;ctx.stroke()}
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;return material(white?'#ffffff':'#c8d6ee',.15,.24,{map,clearcoat:.85});
 }
 const marbleWhite=marble(true),marbleBlue=marble(false);
 function base(g,type,color){
  const stone=color==='w'?marbleWhite:marbleBlue;
  profile(g,[[0,0,0],[0,.40,.40],[.025,.425,.425],[.058,.425,.425],[.078,.405,.405],[.12,.38,.38],[.25,.375,.375],[.285,.397,.397],[.31,.401,.401],[.335,.37,.37],[.355,.36,.36],[.365,0,0]],stone);
  for(const [y,r,t] of [[.027,.422,.012],[.065,.411,.008],[.315,.395,.012],[.35,.36,.009]])ring(g,r,t,M.goldLight,0,y);
  cyl(g,.356,.356,.018,stone,0,.359);
  insignia(g,0,.19,.386,.64);
  const rank={p:'PFC',n:'1ST LT',r:'MSGT',b:'CAPT',q:'COL',k:'4★ GEN'}[type];
  text(g,rank,.34,.075,0,.19,-.39,Math.PI);
 }
 // Smoothly fitted cloth surfaces, rather than spheres attached to a torso.
 function tailored(p,rows,m){
  const pts=rows.map(r=>new T.Vector4(r[0],r[1],r[2],r[3]||0));const out=[];
  for(let i=0;i<pts.length-1;i++)for(let j=0;j<5;j++){
   const t=j/5,a=pts[Math.max(0,i-1)],b=pts[i],c=pts[i+1],d=pts[Math.min(pts.length-1,i+2)];
   const v=(k)=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t);
   out.push([b.x+(c.x-b.x)*t,Math.max(.001,v('y')),Math.max(.001,v('z')),v('w')]);
  }out.push(rows.at(-1));return profile(p,out,m,56);
 }
 function cover(g,y,z=0){
  profile(g,[[y,.112,.097,z],[y+.033,.12,.103,z]],M.black,48);
  profile(g,[[y+.028,.123,.104,z],[y+.06,.156,.127,z-.012],[y+.095,.154,.129,z-.012],[y+.112,.122,.102,z-.01],[y+.116,0,0,z-.01]],M.white,64);
  ell(g,0,y+.007,z+.075,.133,.012,.095,M.shoe);
  line(g,[[-.11,y+.027,z+.05],[0,y+.026,z+.108],[.11,y+.027,z+.05]],.005,M.goldLight);
  insignia(g,0,y+.073,z+.117,.145);
 }
 function rifle(g,diagonal=false){
  const gun=new T.Group();g.add(gun);gun.position.set(diagonal?-.17:0,.46,.20);if(diagonal)gun.rotation.z=-.31;
  tailored(gun,[[0,.036,.027],[.09,.037,.03],[.25,.026,.028],[.34,.023,.024],[.62,.018,.023]],M.hair);
  limb(gun,[0,.24,0],[0,.90,0],.014,.009,M.black);
  limb(gun,[.012,.33,.018],[.012,.95,.018],.009,.007,M.silver);
  for(const y of [.34,.55,.76])box(gun,.045,.016,.052,M.black,0,y,0);
  box(gun,.027,.065,.02,M.black,.015,.46,.024);
  line(gun,[[.019,.30,0],[.055,.34,0],[.055,.41,0],[.02,.44,0]],.005,M.black);
  if(diagonal){limb(gun,[.012,.95,.018],[.012,1.22,.018],.012,.001,M.goldLight);box(gun,.078,.014,.022,M.gold,.01,.95,.018)}
 }
 function face(g,skin,y,female=false){
  const head=new T.Group();head.position.y=y;g.add(head);
  profile(head,[[-.155,0,0,.003],[-.145,.05,.055,.015],[-.12,.087,.078,.014],[-.075,.108,.087,.009],[0,.113,.093,0],[.08,.105,.09,-.005],[.135,.075,.064,-.008],[.154,0,0,-.008]],skin,72);
  ell(head,0,.059,-.044,.109,.105,.064,M.hair);
  // Brow ridges, inset eyes, bridge, nostrils, lips and ears remain dimensional.
  for(const sign of [-1,1]){
   ell(head,sign*.111,-.01,-.007,.017,.034,.018,skin);
   ell(head,sign*.044,.016,.087,.024,.009,.010,M.white);
   ell(head,sign*.044,.016,.097,.008,.008,.004,M.hair);
   line(head,[[sign*.018,.035,.087],[sign*.044,.041,.093],[sign*.073,.033,.081]],.007,M.hair);
   line(head,[[sign*.015,.022,.09],[sign*.044,.029,.101],[sign*.073,.02,.085]],.004,skin);
   // Smooth cheeks: avoid separate round pads that looked like spots.
   ell(head,sign*.021,-.049,.105,.010,.006,.009,skin);
  }
  ell(head,0,-.014,.101,.018,.041,.022,skin);ell(head,0,-.044,.119,.023,.017,.021,skin);
  const lip=skin===M.skinW?M.lipW:M.lipB;
  line(head,[[-.034,-.087,.083],[0,-.084,.099],[.034,-.087,.083]],female?.007:.0045,lip);
  ell(head,0,-.10,.085,.026,.008,.009,lip);
  if(female){ell(head,0,.025,-.09,.12,.13,.052,M.hair);ell(head,0,-.025,-.14,.075,.078,.063,M.hair);for(const sign of [-1,1]){ell(head,sign*.11,-.077,.012,.009,.019,.009,M.goldLight)}}
  return head;
 }
 function marine(g,type,color,female=false){
  const u=color==='w'?M.ivory:M.black,pants=color==='w'?M.trouserWhite:M.navy,skin=color==='w'?M.skinW:M.skinB;
  const body=new T.Group();g.add(body);const queen=type==='q',officer=type!=='p';
  // Full trousered silhouettes: long legs, tapered knees and a continuous fitted jacket.
  for(const sign of [-1,1]){
   const x=sign*(female?.079:.087),leg=new T.Group();body.add(leg);leg.position.x=x;
   tailored(leg,female?[[.42,.043,.052],[.53,.045,.053],[.70,.053,.055],[.85,.058,.065],[1.01,.087,.103],[1.10,.093,.11]]:[[.42,.051,.06],[.56,.051,.059],[.77,.056,.064],[.96,.069,.083],[1.08,.077,.09]],pants);
   ell(body,x,.405,.043,.056,.04,.104,M.shoe);
   line(body,[[x+sign*.048,.45,0],[x+sign*.055,.77,0],[x+sign*(female?.091:.075),1.05,0]],.006,M.red);
   line(body,[[x,.47,.054],[x,.73,.06],[x,1.0,.087]],.0018,pants);
  }
  const rows=female?[[.99,.168,.105,-.007],[1.045,queen?.187:.17,.114,-.006],[1.10,.145,.103],[1.20,.108,.077],[1.29,.122,.095,.007],[1.37,.157,queen?.143:.118,.025],[1.43,.162,.099],[1.47,.131,.073],[1.485,.060,.048]]:[[1.0,.151,.097],[1.10,.148,.097],[1.20,.137,.09],[1.33,.164,.105],[1.43,.185,.107],[1.47,.146,.084],[1.485,.06,.05]];
  tailored(body,rows,u);
  // Center seam and jacket skirt, with raised piping kept subtle.
  line(body,[[0,1.02,.106],[0,1.18,.084],[0,1.32,female?.132:.11],[0,1.455,.086]],.0025,color==='w'?M.gold:M.red);
  for(const sign of [-1,1])line(body,[[sign*.145,1.035,.047],[sign*.103,1.09,.089],[sign*.026,1.19,.088]],.0025,u);
  profile(body,[[1.175,female?.111:.139,.085],[1.211,female?.112:.14,.086]],type==='k'?M.gold:color==='w'?M.gold:M.shoe,56);
  box(body,.048,.035,.011,M.goldLight,0,1.194,.092);
  for(let j=0;j<4;j++)ell(body,0,1.255+j*.054,female?.135:.113,.008,.008,.005,M.goldLight);
  cyl(body,.051,.055,.064,skin,0,1.51);
  profile(body,[[1.466,.061,.052],[1.529,.061,.052]],u,40);
  line(body,[[-.049,1.526,.034],[0,1.526,.055],[.049,1.526,.034]],.003,M.goldLight);
  if(female){
   for(const sign of [-1,1]){const lapel=new T.Shape();lapel.moveTo(sign*.043,1.51);lapel.lineTo(sign*.096,1.421);lapel.lineTo(sign*.027,1.346);lapel.lineTo(0,1.412);lapel.closePath();add(body,new T.ExtrudeGeometry(lapel,{depth:.006,bevelEnabled:false}),u,0,0,.129)}
  }
  // Reference poses: queens' hands at their waists; other Marines holding a weapon.
  for(const sign of [-1,1]){
   const shoulder=[sign*.17,1.438,0],elbow=queen?[sign*.26,1.28,.018]:[sign*.203,1.24,.034],wrist=queen?[sign*.132,1.205,.116]:[sign*.035,1.12+(sign===1?.03:0),.218];
   limb(body,shoulder,elbow,.053,.042,u);ell(body,...elbow,.042,.043,.041,u);limb(body,elbow,wrist,.042,.03,u);
   ell(body,...wrist,.034,.042,.022,M.white);
   for(let f=0;f<4;f++)line(body,[[wrist[0]-.02+f*.012,wrist[1]+.01,wrist[2]+.022],[wrist[0]-.015+f*.012,wrist[1]-.025,wrist[2]+.024]],.0016,M.ivory);
   const cuff=wrist.map((v,i)=>v+(elbow[i]-v)*.18);ell(body,...cuff,.035,.015,.033,officer?M.gold:u);
   for(let j=0;j<3;j++)ell(body,elbow[0],elbow[1]-.022*j,elbow[2]+.04,.004,.004,.003,M.goldLight);
   box(body,.091,.013,.051,officer?M.gold:u,sign*.143,1.473,0);
   if(type==='p'){
    const rank=new T.Group();rank.position.set(sign*.206,1.365,.008);rank.rotation.y=sign*Math.PI/2;body.add(rank);
    line(rank,[[-.035,-.018,0],[0,.02,0],[.035,-.018,0]],.013,M.red);line(rank,[[-.033,-.016,.009],[0,.018,.009],[.033,-.016,.009]],.006,M.goldLight);
   }
   if(type==='b')for(const x of [-.022,.022])box(body,.012,.009,.035,M.silver,sign*.14+x,1.484,.008);
   if(type==='k')for(let j=0;j<4;j++){const st=star(body,.014,sign*.145+(j-1.5)*.021,1.485,.015,M.silver);st.rotation.x=-Math.PI/2;}
  }
  // Pocket flaps, ribbon bars, medals and collar insignia.
  for(const sign of [-1,1]){
   const z=female?.145:.109;
   box(body,.062,.037,.007,u,sign*.087,1.332,z);
   line(body,[[sign*.087-.031,1.351,z+.006],[sign*.087,1.342,z+.01],[sign*.087+.031,1.351,z+.006]],.002,u);
   insignia(body,sign*.038,1.496,.05,.065);
  }
  const ribbons=[M.red,M.ribbonBlue,M.gold,M.ribbonGreen,M.white,M.red,M.gold,M.ribbonBlue,M.ribbonGreen];
  for(let j=0;j<(officer?9:3);j++)box(body,.019,.009,.008,ribbons[j],-.113+(j%3)*.022,1.402-Math.floor(j/3)*.012,female?.133:.113);
  for(let j=0;j<(officer?3:0);j++){const x=-.108+j*.025;box(body,.015,.024,.006,M.ribbonBlue,x,1.343,.124);ell(body,x,1.322,.129,.012,.015,.004,M.gold)}
  box(body,.052,.008,.007,M.gold,.083,1.391,female?.14:.112);
  const head=face(body,skin,1.653,female);head.scale.set(.88,.94,.91);
  cover(body,1.746);
  // Rear rank plate follows the jacket, preserving the requested back identification.
  const rank={p:'PFC',b:'CAPT',q:'COL',k:'4★ GEN'}[type];text(body,rank,.16,.054,0,1.365,-.114,Math.PI);
  for(const sign of [-1,1])line(body,[[sign*.096,1.445,-.081],[sign*.076,1.30,-.1],[sign*.068,1.205,-.085],[sign*.127,1.04,-.078]],.0018,u);
  if(type==='q'){
   for(const sign of [-1,1]){line(body,[[sign*.025,1.459,.139],[sign*.05,1.468,.139],[sign*.08,1.457,.139]],.004,M.silver);ell(body,sign*.05,1.455,.141,.009,.013,.004,M.silver);}
  }else if(type==='k'){
   limb(body,[0,.4,.22],[0,1.12,.22],.008,.011,M.silver);limb(body,[0,1.11,.22],[0,1.23,.22],.013,.013,M.gold);
   line(body,[[-.051,1.13,.22],[-.049,1.23,.22],[0,1.247,.22],[.049,1.23,.22],[.051,1.13,.22]],.006,M.gold);
   for(let j=0;j<3;j++)line(body,[[.14,1.467,.058],[.192,1.40,.096],[.163,1.29-j*.018,.133],[.055,1.315-j*.018,.138],[.06,1.436,.115]],.0045,M.goldLight);
  }else rifle(body,type==='b');
  if(type==='b'){
   // Draped open cape behind the arms, with fine vertical cloth folds.
   const pos=[],idx=[],N=36,H=24;
   for(let j=0;j<=H;j++){const t=j/H,y=1.455-t*.70,r=.175+t*.13;for(let i=0;i<=N;i++){const a=.92+i/N*(Math.PI*2-1.84);const fold=Math.sin(i/N*Math.PI*18)*.011*t;pos.push(Math.sin(a)*(r+fold),y,Math.cos(a)*(r*.69+fold)-.035)}}
   for(let j=0;j<H;j++)for(let i=0;i<N;i++){const k=j*(N+1)+i;idx.push(k,k+1,k+N+1,k+1,k+N+2,k+N+1)}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const cloth=u.clone();cloth.side=T.DoubleSide;add(body,geo,cloth);
  }
  const scale=type==='k'?1.12:type==='q'?1.06:type==='b'?1.025:.93;body.scale.y=scale;body.position.y=.37*(1-scale);
 }
 function queen(g,color){marine(g,'q',color,true)}
 function horse(g,color,female=false){
  const u=color==='w'?M.ivory:M.black;
  const pants=color==='w'?M.trouserWhite:M.navy;
  const coat=color==='w'?M.ivory:M.shoe;
  // Four articulated legs, a muscular barrel, haunches, chest and a curved neck.
  ell(g,0,.923,-.018,.197,.22,.325,coat);
  ell(g,0,.92,-.205,.205,.23,.188,coat);
  ell(g,0,.969,.176,.18,.24,.16,coat);
  for(const sign of [-1,1]){
   const x=sign*.13;
   limb(g,[x,.91,-.20],[x,.67,-.25],.073,.047,coat);ell(g,x,.66,-.25,.05,.061,.051,coat);
   limb(g,[x,.65,-.25],[x,.435,-.205],.039,.028,coat);
   limb(g,[x,.956,.185],[x,.68,.205],.062,.038,coat);ell(g,x,.68,.205,.043,.051,.045,coat);
   limb(g,[x,.67,.205],[x,.433,.24],.033,.029,coat);
   for(const z of [-.2,.245]){ell(g,x,.407,z,.052,.038,.073,M.shoe);ell(g,x,.447,z-.006,.037,.036,.048,coat)}
  }
  const neck=profile(g,[[.98,.154,.147,.18],[1.12,.141,.16,.17],[1.27,.112,.141,.14],[1.41,.085,.112,.12],[1.51,.07,.084,.16]],coat,40);
  const head=ell(g,0,1.519,.218,.099,.15,.141,coat);head.rotation.x=-.48;
  ell(g,0,1.431,.368,.083,.067,.118,coat);
  ell(g,0,1.4,.401,.076,.043,.072,coat);
  for(const sign of [-1,1]){
   ell(g,sign*.056,1.448,.422,.009,.016,.02,M.black);
   ell(g,sign*.092,1.54,.285,.012,.021,.028,M.gold);ell(g,sign*.103,1.54,.29,.008,.012,.013,M.black);
   const ear=ell(g,sign*.065,1.689,.148,.03,.091,.038,coat);ear.rotation.z=-sign*.19;ell(g,sign*.065,1.69,.174,.014,.056,.011,M.gold);
   line(g,[[sign*.082,1.44,.4],[sign*.092,1.50,.30],[sign*.075,1.617,.15]],.009,M.gold);
   line(g,[[sign*.086,1.45,.39],[sign*.18,1.23,.17],[sign*.17,1.03,-.08]],.007,M.gold);
  }
  line(g,[[-.074,1.435,.391],[0,1.411,.447],[.074,1.435,.391]],.01,M.gold);
  // Braided bridle rings, stitched blanket edging and raised harness fittings.
  for(const sign of [-1,1]){
   for(let j=0;j<5;j++)ell(g,sign*.097,1.51-j*.038,.307-j*.026,.007,.007,.006,M.goldLight);
   ell(g,sign*.092,1.465,.389,.017,.017,.008,M.goldLight);
  }
  // Individually curved mane locks and flowing tail.
  for(let j=0;j<13;j++){const y=1.60-j*.037,z=.103-(1.60-y)*.27;line(g,[[0,y,z],[.036,y-.045,z-.04],[.02,y-.083,z-.054]],.022,coat)}
  for(let j=0;j<5;j++){const x=(j-2)*.019;line(g,[[x,.96,-.31],[x+.025,.77,-.386],[x+.052,.54,-.33],[x+.042,.42,-.29]],.017,coat)}
  const blanket=ell(g,0,1.065,-.06,.208,.044,.208,u);
  line(g,[[-.202,1.039,.05],[-.198,1.037,-.20],[0,1.10,-.24],[.198,1.037,-.20],[.202,1.039,.05]],.009,M.gold);
  ell(g,0,1.10,-.065,.116,.039,.132,M.gold);
  line(g,[[-.168,1.01,.13],[0,.89,.3],[.168,1.01,.13]],.014,M.gold);
  for(const sign of [-1,1]){const medal=insignia(g,sign*.20,.923,-.07,.21);medal.rotation.y=sign*Math.PI/2;const stirrup=ring(g,.06,.009,M.gold,sign*.222,.84,-.045);stirrup.rotation.x=0;stirrup.rotation.y=Math.PI/2}
  // Mounted First Lieutenant: boots straddle the horse; hands hold the reins.
  const skin=color==='w'?M.skinW:M.skinB;
  for(const sign of [-1,1]){
   limb(g,[sign*.09,1.18,-.115],[sign*.22,1.055,.005],.068,.055,pants);
   limb(g,[sign*.22,1.055,.005],[sign*.21,.825,.075],.052,.038,pants);
   line(g,[[sign*.133,1.152,-.08],[sign*.234,1.05,.025],[sign*.24,.84,.091]],.007,color==='w'?M.stripeBlue:M.red);
   if(color==='w')line(g,[[sign*.143,1.15,-.08],[sign*.243,1.05,.027],[sign*.249,.84,.091]],.003,M.stripeWhite);
   ell(g,sign*.21,.807,.09,.055,.047,.095,M.shoe);
   limb(g,[sign*.145,1.55,-.06],[sign*.205,1.37,.045],.061,.045,u);
   limb(g,[sign*.205,1.37,.045],[sign*.135,1.23,.16],.045,.031,u);
   ell(g,sign*.135,1.215,.16,.036,.045,.034,M.white);
   box(g,.018,.083,.026,M.silver,sign*.235,1.468,.052);
  }
  profile(g,[[1.16,.10,.08,-.10],[1.24,.16,.095,-.10],[1.39,.155,.10,-.10],[1.52,.16,.10,-.10],[1.61,.115,.07,-.10]],u,36);
  box(g,.25,.033,.18,M.black,0,1.27,-.10);
  box(g,.045,.037,.016,M.goldLight,0,1.27,.005);
  cyl(g,.055,.055,.05,skin,0,1.63,-.10,24);
  const riderFace=face(g,skin,1.78,female);
  riderFace.position.z=-.10;
  cover(g,1.875,-.10);
  box(g,.17,.09,.018,M.navy,0,1.44,.005);
  text(g,'1ST LT',.15,.06,0,1.44,-.208,Math.PI);
  for(let j=0;j<4;j++)ell(g,0,1.33+j*.057,.008,.008,.008,.005,M.goldLight);
  for(let j=0;j<6;j++)box(g,.018,.01,.009,[M.red,M.gold,M.ribbonBlue][j%3],-.105+j%3*.023,1.54-Math.floor(j/3)*.014,.01);
  for(const sign of [-1,1])line(g,[[sign*.13,1.22,.16],[sign*.04,1.18,.33],[sign*.085,1.46,.38]],.006,M.gold);
  for(const sign of [-1,1])for(let j=0;j<5;j++)ell(g,sign*.188,1.04-j*.025,-.19,.004,.004,.004,M.goldLight);
 }
 function tank(g,color){
  const armor=color==='w'?material('#b69a70',.22,.52):material('#464b35',.3,.5),shadow=M.black,trim=color==='w'?material('#a88a60',.25,.5):material('#62694d',.3,.48);
  // Compact armored rook, with a low silhouette and a clear tank profile.
  for(const sign of [-1,1]){
   const x=sign*.285;
   box(g,.16,.255,.70,M.black,x,.55,0);
   box(g,.175,.035,.73,shadow,x,.704,0);
   box(g,.175,.035,.73,shadow,x,.397,0);
   for(let j=0;j<6;j++){
    const z=-.29+j*.116;
    ell(g,sign*.375,.54,z,.018,.059,.059,armor);
    ell(g,sign*.389,.54,z,.008,.032,.032,M.black);
    ell(g,sign*.398,.54,z,.004,.012,.012,M.goldLight);
   }
   for(let j=0;j<11;j++){
    const z=-.33+j*.066;
    box(g,.178,.035,.056,M.shoe,x,.736,z);
    box(g,.178,.035,.056,M.shoe,x,.376,z);
    box(g,.01,.007,.039,trim,sign*.383,.755,z);
   }
   box(g,.025,.13,.47,armor,sign*.20,.65,-.02);
   for(let j=0;j<5;j++)box(g,.009,.006,.057,trim,sign*.215,.705,-.21+j*.105);
  }
  // Armored hull, pointed glacis, and inset lamps.
  box(g,.55,.22,.65,armor,0,.65,-.025);
  box(g,.57,.027,.67,trim,0,.764,-.025);
  const prow=new T.Mesh(new T.ConeGeometry(.30,.33,4),armor);
  prow.rotation.x=Math.PI/2;prow.rotation.y=Math.PI/4;prow.position.set(0,.65,.325);g.add(prow);
  line(g,[[-.25,.763,.26],[0,.755,.49],[.25,.763,.26]],.011,M.goldLight);
  for(const sign of [-1,1]){
   ell(g,sign*.205,.685,.38,.05,.04,.012,M.black);
   ell(g,sign*.205,.685,.394,.032,.025,.006,M.goldLight);
   for(let j=0;j<5;j++)ell(g,sign*.265,.766,-.29+j*.145,.008,.007,.008,trim);
  }
  // Faceted turret, flush hatch, observation slits, and vented roof.
  cyl(g,.248,.263,.075,shadow,0,.813,-.08,10);
  cyl(g,.211,.245,.15,armor,0,.916,-.08,10);
  cyl(g,.18,.206,.04,armor,0,1.012,-.08,10);
  ring(g,.212,.011,trim,0,.991,-.08);
  cyl(g,.09,.09,.012,M.black,-.08,1.04,-.13,24);
  ring(g,.086,.008,M.goldLight,-.08,1.05,-.13);
  for(const sign of [-1,1]){
   box(g,.068,.033,.015,M.black,sign*.129,.955,.083);
   box(g,.048,.008,.017,M.goldLight,sign*.129,.966,.093);
   for(let j=0;j<4;j++){
    box(g,.009,.004,.038,M.black,sign*.145,1.034,-.24+j*.047);
    ell(g,sign*.201,.91,-.18+j*.077,.007,.007,.007,trim);
   }
  }
  // Tapered cannon, recoil jacket, metallic rings, and dark muzzle bore.
  limb(g,[0,.932,.09],[0,.932,.47],.07,.044,shadow);
  limb(g,[0,.932,.16],[0,.932,.458],.047,.031,armor);
  for(const z of [.18,.32,.43]){
   const collar=cyl(g,.052,.052,.013,trim,0,.932,z,24);collar.rotation.x=Math.PI/2;
  }
  const muzzle=cyl(g,.059,.059,.042,M.goldLight,0,.932,.488,24);muzzle.rotation.x=Math.PI/2;
  const bore=cyl(g,.033,.033,.044,M.black,0,.932,.51,24);bore.rotation.x=Math.PI/2;
  insignia(g,0,.638,.407,.24);
  for(const sign of [-1,1]){
   limb(g,[sign*.16,1.02,-.20],[sign*.16,1.63,-.22],.003,.0018,shadow);
   for(let j=0;j<4;j++)box(g,.027,.10,.12,armor,sign*.28,.76,-.23+j*.145);
  }
  box(g,.13,.105,.15,armor,.085,1.10,-.08);
  limb(g,[.085,1.12,-.01],[.085,1.12,.22],.012,.008,shadow);
  text(g,'1775',.17,.065,0,.705,.407);
  // Marine Master Sergeant: three upright chevrons, crossed rifles, three rockers.
  for(const sign of [-1,1]){
   const plate=new T.Group();plate.rotation.y=sign*Math.PI/2;g.add(plate);
   box(plate,.30,.235,.014,M.black,0,.623,.389);
   for(let j=0;j<3;j++){
    const y=.710-j*.029;
    line(plate,[[-.113,y-.028,.402],[0,y,.402],[.113,y-.028,.402]],.007,M.goldLight);
   }
   line(plate,[[-.077,.576,.404],[.071,.628,.404]],.006,M.goldLight);
   line(plate,[[.077,.576,.406],[-.071,.628,.406]],.006,M.goldLight);
   for(let j=0;j<3;j++){
    const y=.555-j*.018;
    line(plate,[[-.105,y+.013,.402],[0,y,.402],[.105,y+.013,.402]],.006,M.goldLight);
   }
  }
 }
 function piece(type,color,female=false){const raw=new T.Group();base(raw,type,color);if(type==='r'){const raised=new T.Group();raw.add(raised);tank(raised,color);raised.scale.y=1.13;raised.position.y=-.365*.13;}else if(type==='n')horse(raw,color,female);else if(type==='q')queen(raw,color);else marine(raw,type,color,female);const out=bake(raw);if(color==='w')out.rotation.y=Math.PI;out.userData={type,color,female,sculpture:true};return out}
 return {M,material,add,ell,box,cyl,ring,line,profile,star,text,insignia,bake,piece};
}
