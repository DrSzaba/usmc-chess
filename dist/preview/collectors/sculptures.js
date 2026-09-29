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
  olive:material('#464a38',.28,.46),sand:material('#baa27c',.21,.47),
 };
 const add=(p,g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o};
 // Extra tessellation keeps faces, hands, covers and curved uniform details
 // round when a player uses the close inspection camera.
 const sphereGeo=new T.SphereGeometry(1,48,32);
 const ell=(p,x,y,z,rx,ry,rz,m)=>{const o=add(p,sphereGeo,m,x,y,z);o.scale.set(rx,ry,rz);return o};
 const box=(p,w,h,d,m,x=0,y=0,z=0)=>add(p,new T.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(p,rt,rb,h,m,x=0,y=0,z=0,n=64)=>add(p,new T.CylinderGeometry(rt,rb,h,n),m,x,y,z);
 const ring=(p,r,t,m,x=0,y=0,z=0)=>{const o=add(p,new T.TorusGeometry(r,t,12,72),m,x,y,z);o.rotation.x=Math.PI/2;return o};
 function line(p,points,r,m){const curve=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a)));return add(p,new T.TubeGeometry(curve,Math.max(12,points.length*8),r,10,false),m)}
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
 function base(g,type,color){
  const stone=color==='w'?M.ivory:M.navy;
  if(type==='r'){
   // The armored rook sits on a broad square plinth that supports both tracks.
   for(const [size,height,y,mat] of [[.92,.035,.018,M.goldLight],[.88,.038,.054,M.black],[.86,.205,.175,stone],[.90,.026,.291,M.gold],[.84,.057,.333,stone],[.80,.019,.371,M.goldLight],[.78,.014,.388,stone]])box(g,size,height,size,mat,0,y,0);
   for(const sign of [-1,1])for(const v of [-.28,.28]){
    box(g,.012,.105,.012,M.gold,sign*.434,.176,v);
    box(g,.012,.105,.012,M.gold,v,.176,sign*.434);
   }
  }else{
  profile(g,[[0,0,0],[0,.405,.405],[.035,.435,.435],[.065,.435,.435],[.083,.4,.4],[.11,.4,.4],[.135,.38,.38],[.27,.38,.38],[.29,.41,.41],[.315,.41,.41],[.34,.36,.36],[.365,.36,.36],[.365,0,0]],stone,64);
  for(const [y,r,t] of [[.035,.429,.012],[.08,.411,.015],[.127,.386,.009],[.278,.397,.013],[.312,.405,.014],[.352,.356,.011]])ring(g,r,t,M.goldLight,0,y);
  cyl(g,.352,.352,.025,M.ivory,0,.365);
  for(let i=0;i<10;i++){const a=i*Math.PI/5,s=star(g,.037,Math.sin(a)*.384,.207,Math.cos(a)*.384);s.rotation.y=a}
  for(let j=0;j<20;j++){const a=j*Math.PI/10;ell(g,Math.sin(a)*.418,.302,Math.cos(a)*.418,.008,.008,.008,M.goldLight)}
  for(let j=0;j<32;j++){const a=j*Math.PI/16;ell(g,Math.sin(a)*.382,.134,Math.cos(a)*.382,.006,.009,.006,j%4?M.gold:M.red)}
  ring(g,.347,.004,M.goldLight,0,.368);
  }
  const rank={p:'PFC',n:'1ST LT',r:'MASTER SGT',b:'CAPTAIN',q:'COLONEL',k:'4-STAR GEN'}[type];
  // Front emblem and rear rank remain readable when a player rotates the piece.
  for(const a of [0,Math.PI]){
   const plaque=new T.Group();plaque.rotation.y=a;g.add(plaque);
   const face=type==='r'?.46:.414;
   box(plaque,.74,.20,.028,M.black,0,.21,face);
   box(plaque,.70,.17,.008,M.gold,0,.21,face+.018);
   box(plaque,.66,.145,.008,M.navy,0,.21,face+.025);
   if(a===0)insignia(plaque,0,.205,face+.048,.42);
   else text(plaque,rank,.63,.132,0,.21,face+.038);
  }
 }
 function face(g,skin,y,female=false){
  const head=new T.Group();head.position.y=y;g.add(head);
  profile(head,[[-.155,0,0,.003],[-.145,.05,.055,.015],[-.12,.087,.078,.014],[-.075,.108,.087,.009],[0,.113,.093,0],[.08,.105,.09,-.005],[.135,.075,.064,-.008],[.154,0,0,-.008]],skin,72);
  ell(head,0,.059,-.044,.109,.105,.064,M.hair);
  // Brow ridges, inset eyes, bridge, nostrils, lips and ears remain dimensional.
  for(const sign of [-1,1]){
   ell(head,sign*.111,-.01,-.007,.026,.045,.025,skin);
   ell(head,sign*.044,.016,.087,.032,.013,.014,M.white);
   ell(head,sign*.044,.016,.099,.010,.011,.004,M.hair);
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
  const u=color==='w'?M.ivory:M.navy,skin=color==='w'?M.skinW:M.skinB;
  const pants=color==='w'?M.ivory:M.navy;
  const body=new T.Group();g.add(body);const senior=type!=='p';
  // Anatomical proportions: boots, shaped trouser legs, jacket waist and shoulders.
  for(const sign of [-1,1]){
   const x=sign*(female?.115:.094);
   ell(body,x,.409,.043,.077,.055,.145,M.shoe);
   const leg=profile(body,female?[[.44,.058,.06],[.53,.059,.06],[.73,.075,.076],[.86,.099,.095],[.97,.112,.11],[1.01,.101,.10]]:[[.44,.058,.06],[.53,.055,.057],[.73,.064,.067],[.86,.067,.07],[.97,.079,.083],[1.01,.077,.082]],pants,64);leg.position.x=x;
   if(color==='w'){
    line(body,[[x+sign*.059,.46,.01],[x+sign*.063,.71,.005],[x+sign*.076,.96,0]],.009,M.stripeBlue);
    line(body,[[x+sign*.069,.46,.01],[x+sign*.073,.71,.005],[x+sign*.086,.96,0]],.004,M.stripeWhite);
   }else{
    line(body,[[x+sign*.06,.46,.01],[x+sign*.065,.71,.005],[x+sign*.078,.96,0]],.011,M.red);
    line(body,[[x+sign*.069,.46,.01],[x+sign*.074,.71,.005],[x+sign*.087,.96,0]],.003,M.gold);
   }
   line(body,[[x,.50,.061],[x,.74,.072],[x,1.00,.085]],.003,color==='w'?M.red:M.trouserWhite);
   ring(body,.07,.004,M.goldLight,x,.468);
  }
  profile(body,female?[[.88,.165,.12],[.94,.195,.135],[.98,.19,.135],[1.07,.115,.09],[1.17,.125,.10],[1.31,.175,.125],[1.37,.17,.115],[1.40,.115,.08],[1.41,.066,.055]]:[[.94,.155,.09],[.98,.16,.105],[1.07,.143,.099],[1.17,.168,.111],[1.31,.195,.113],[1.37,.191,.106],[1.40,.124,.078],[1.41,.066,.055]],u,72);
  if(female){
   // Tailored female PFC silhouette follows the supplied full-length reference.
   for(const sign of [-1,1]){
    ell(body,sign*.092,1.29,.105,.083,.082,.068,u);
    ell(body,sign*.135,.942,.0,.078,.08,.105,u);
   }
   profile(body,[[.855,.188,.126],[.94,.191,.135],[1.018,.157,.112],[1.09,.115,.09]],u,48);
  }
  cyl(body,.069,.065,.07,skin,0,1.44,0,32);
  // Standing collar, red piping, belt and a small raised buckle.
  profile(body,[[1.389,.075,.061],[1.447,.074,.060],[1.452,.07,.058]],u,32);
  line(body,[[-.06,1.447,.035],[0,1.447,.063],[.06,1.447,.035]],.005,color==='w'?M.gold:M.red);
  const belt=profile(body,female?[[1.035,.13,.098],[1.071,.128,.097]]:[[1.035,.15,.106],[1.071,.149,.105]],M.black,40);
  box(body,.055,.038,.02,M.goldLight,0,1.054,.113);
  for(let i=0;i<5;i++)ell(body,0,1.10+i*.061,.118,.012,.012,.006,M.goldLight);
  for(const sign of [-1,1]){
   ell(body,sign*.188,1.335,0,.07,.081,.082,u);
   limb(body,[sign*.204,1.335,0],[sign*.235,1.13,.012],.065,.048,u);
   ell(body,sign*.235,1.126,.012,.049,.044,.049,u);
   limb(body,[sign*.235,1.13,.012],[sign*.221,.972,.041],.048,.039,u);
   const cuff=ring(body,.042,.008,M.gold,sign*.222,.992,.04);cuff.scale.z=.9;
   ell(body,sign*.222,.926,.047,.042,.058,.03,M.white);
   for(let f=0;f<3;f++)line(body,[[sign*.208+f*.009,.933,.074],[sign*.208+f*.009,.903,.072]],.002,u);
   // Distinct sleeve insignia: one PFC chevron, three sergeant chevrons, officer bars,
   // and four stars for the general. The pedestal gives the full rank.
   box(body,.109,.022,.055,M.gold,sign*.152,1.393,0);
   if(type==='p'){
    // PFC: single upward chevron; no crossed rifles or rocker.
    box(body,.009,.105,.112,M.red,sign*.276,1.269,.008);
    line(body,[[sign*.286,1.239,-.038],[sign*.293,1.285,.008],[sign*.286,1.239,.054]],.011,M.goldLight);
   }else if(type==='b'){
    // Captain's paired silver bars on each shoulder, above the red cuff braid.
    for(const z of [-.029,.029])box(body,.018,.066,.014,M.silver,sign*.283,1.266,z);
    box(body,.008,.012,.068,M.silver,sign*.295,1.267,0);
    for(const y of [1.015,1.035])line(body,[[sign*.267,y,-.002],[sign*.274,y,.07]],.006,M.goldLight);
   }else if(type==='k'){
    for(let j=0;j<4;j++)star(body,.020,sign*.272,1.29-j*.043,.048,M.silver).rotation.y=sign*Math.PI/2;
   }
  }
  // Pockets, nameplate, ribbon racks and suspended miniature medals.
  for(const x of [-.092,.092]){box(body,.083,.057,.011,u,x,1.197,.111);line(body,[[x-.04,1.222,.121],[x,1.212,.127],[x+.04,1.222,.121]],.004,u)}
  const ribbons=[M.red,M.ribbonBlue,M.gold,M.ribbonGreen,M.white,M.red,M.gold,M.ribbonBlue,M.ribbonGreen];
  for(let j=0;j<(senior?9:6);j++)box(body,.021,.013,.008,ribbons[j],-.127+(j%3)*.025,1.30-Math.floor(j/3)*.016,.119);
  box(body,.069,.011,.009,M.gold,.095,1.292,.123);
  for(let i=0;i<(senior?3:1);i++){const x=-.118+i*.031;box(body,.015,.027,.007,M.ribbonBlue,x,1.224,.133);ell(body,x,1.202,.137,.014,.017,.005,M.gold)}
  const head=face(body,skin,1.607,female);
  if(female){
   ell(body,0,1.595,-.135,.10,.115,.055,M.hair);
   ell(body,0,1.50,-.168,.072,.09,.048,M.hair);
  }
  // A readable raised rank plate sits on the back of the uniform as well as the pedestal.
  const backRank={p:'PFC',b:'CAPT',k:'4★ GEN'}[type];
  if(backRank){
   box(body,.225,.11,.015,M.gold,0,1.255,-.125);
   box(body,.211,.096,.018,M.navy,0,1.255,-.136);
   text(body,backRank,.195,.081,0,1.255,-.149,Math.PI);
  }
  // Dress covers follow the newly supplied full-length piece photographs.
  profile(body,[[1.704,.117,.10],[1.719,.146,.129],[1.752,.15,.132],[1.777,.129,.115],[1.786,0,0]],M.white,48);
   profile(body,[[1.685,.12,.101],[1.718,.124,.105]],M.black,40);
   const brim=ell(body,0,1.684,.078,.134,.014,.096,M.shoe);
   line(body,[[-.106,1.702,.047],[0,1.696,.107],[.106,1.702,.047]],.006,M.gold);
   insignia(body,0,1.742,.131,.15);
  if(type==='b'){
   // Ceremonial officer braid follows the captain's tailored coat.
   for(const sign of [-1,1]){
    line(body,[[sign*.058,1.388,.086],[sign*.072,1.29,.126],[sign*.079,1.12,.12],[sign*.085,.99,.096]],.012,M.gold);
    line(body,[[sign*.045,1.382,.09],[sign*.056,1.29,.131],[sign*.063,1.12,.126]],.004,M.goldLight);
    for(let j=0;j<4;j++)ell(body,sign*.077,1.25-j*.072,.133,.007,.009,.005,M.goldLight);
   }
  }
  if(senior){
   for(let j=0;j<2;j++)line(body,[[.158,1.373,.086],[.188+j*.007,1.291,.124],[.151,1.173-j*.014,.146],[.078,1.157-j*.014,.143],[.033,1.26,.133],[.032,1.341,.118]],.009,M.gold);
   for(let j=0;j<3;j++)line(body,[[.15+j*.008,1.365,.085],[.17+j*.008,1.24,.12],[.18+j*.008,1.18,.1]],.005,M.goldLight);
   // Dress sword and scabbard along the officer's left hip.
   limb(body,[-.27,.995,.06],[-.30,.43,.10],.019,.011,M.black);
   limb(body,[-.268,1.10,.055],[-.27,.995,.06],.014,.014,M.gold);
   line(body,[[-.31,1.01,.06],[-.27,.993,.082],[-.23,1.01,.06]],.009,M.gold);
   if(type==='k'){for(let j=0;j<4;j++)star(body,.022,-.09+j*.058,1.405,.093);for(let j=0;j<3;j++)ring(body,.019,.004,M.goldLight,.27,1.08+j*.04,.042)}
  }
  if(type==='k'){
   // The four-star general carries a wider gold shoulder braid, sash and medals.
   for(const sign of [-1,1]){
    box(body,.13,.026,.078,M.goldLight,sign*.158,1.41,.005);
    for(let j=0;j<4;j++)star(body,.023,sign*.12+(j-1.5)*.028,1.43,.052,M.silver);
    for(let j=0;j<4;j++)line(body,[[sign*.21,1.38,.02],[sign*(.22+j*.012),1.28,.10],[sign*(.13+j*.011),1.10,.144]],.005,M.goldLight);
   }
   line(body,[[-.16,1.37,.08],[.14,1.04,.17]],.022,M.gold);
   line(body,[[-.16,1.37,.09],[.14,1.04,.18]],.007,M.goldLight);
   for(let j=0;j<5;j++)ell(body,-.11+j*.035,1.175,.146,.013,.022,.008,j%2?M.ribbonBlue:M.goldLight);
   // The supplied general wears the Marine dress cover with four-star detail.
   for(let j=0;j<4;j++)star(body,.019,(j-1.5)*.046,1.765,.139,M.silver);
   // The general in the reference rests both gloved hands on a dress sword.
   // A raised guard, tapered steel blade and pointed tip read from any angle.
   limb(body,[0,.51,.255],[0,1.002,.255],.014,.019,M.silver);
   const tip=add(body,new T.ConeGeometry(.019,.11,24),M.silver,0,.46,.255);tip.rotation.z=Math.PI;
   limb(body,[0,1.01,.255],[0,1.19,.255],.022,.013,M.goldLight);
   const guard=ring(body,.075,.009,M.goldLight,0,1.075,.255);guard.rotation.x=0;
   line(body,[[-.085,1.075,.255],[0,1.027,.263],[.085,1.075,.255]],.013,M.gold);
   ell(body,-.043,1.175,.258,.057,.036,.04,M.white);
   ell(body,.043,1.16,.27,.057,.036,.04,M.white);
  }
  // Fine raised seams, collar braid, cuff studs and polished boot caps.
  for(const sign of [-1,1]){
   line(body,[[sign*.175,1.36,.073],[sign*.149,1.287,.109],[sign*.123,1.095,.107]],.003,M.goldLight);
   ell(body,sign*.222,1.002,.081,.009,.009,.005,M.goldLight);
   line(body,[[sign*.055,.458,.155],[sign*.094,.449,.167],[sign*.144,.458,.15]],.005,M.gold);
  }
  for(const y of [1.398,1.417,1.439])line(body,[[-.055,y,.058],[0,y,.071],[.055,y,.058]],.0025,M.goldLight);
  // Raised stitching and fastening are visible from all angles at inspection zoom.
  for(const sign of [-1,1]){
   for(let j=0;j<7;j++){
    const y=1.108+j*.039;
    line(body,[[sign*.125,y,.113],[sign*.144,y+.009,.108]],.002,M.goldLight);
   }
   for(let j=0;j<4;j++)ell(body,sign*.232,1.009+j*.017,.073,.004,.004,.003,M.goldLight);
   line(body,[[sign*.191,1.34,-.06],[sign*.197,1.25,-.077],[sign*.219,1.13,-.045]],.003,M.gold);
  }
  if(type==='b'){
   // Ceremonial long rifle; green leaf finial echoes the Tyrolean feather.
   const x=-.315,z=.075;
   limb(body,[x,.61,z],[x,1.72,z],.016,.011,M.black);
   limb(body,[x,.93,z],[x,1.83,z],.011,.009,M.silver);
   box(body,.065,.30,.065,M.hair,x,.61,z);
   box(body,.063,.12,.035,M.gold,x,.91,z);
   box(body,.045,.055,.042,M.black,x,1.13,z);
   line(body,[[x,.99,z+.026],[x+.08,1.035,z+.052],[x+.09,1.10,z+.053]],.010,M.goldLight);
   const leaf=ell(body,x,1.93,z,.025,.105,.012,M.ribbonGreen);
   leaf.rotation.z=-.22;
   line(body,[[x,1.84,z+.013],[x,1.98,z+.013]],.003,M.goldLight);
  }
  // The bishop's taller hat is balanced by a slightly shorter coat, not an oversized base.
  const scale=type==='k'?1.10:type==='b'?.98:.95;
  body.position.y=.38*(1-scale);body.scale.y=scale;
 }
 function queen(g,color){
  const u=color==='w'?M.ivory:M.navy,skin=color==='w'?M.skinW:M.skinB;
  const rows=[[.379,0,0],[.38,.35,.317],[.43,.35,.317],[.55,.32,.29],[.70,.28,.26],[.86,.23,.22],[1.03,.165,.16],[1.17,.108,.105],[1.24,.105,.09],[1.33,.18,.13],[1.40,.218,.14],[1.45,.17,.10],[1.48,.06,.048]];
  profile(g,rows,u,72,.014);
  // Tailored officer bodice with a distinctly fuller bust and narrow waist.
  // Uniform fabric covers the contours; piping follows the raised seam.
  for(const sign of [-1,1]){
   ell(g,sign*.103,1.344,.128,.119,.115,.123,u);
   ell(g,sign*.104,1.349,.212,.096,.091,.044,u);
   line(g,[[sign*.014,1.452,.126],[sign*.104,1.438,.226],[sign*.216,1.37,.146]],.009,M.goldLight);
   line(g,[[sign*.216,1.324,.154],[sign*.123,1.256,.133],[sign*.025,1.222,.104]],.007,M.gold);
  }
  // Gold brocade follows the gown's volume, rather than floating in front of it.
  for(let j=0;j<14;j++){const a=j*Math.PI*2/14,points=rows.slice(1,10).map(([y,rx,rz])=>[Math.sin(a)*(rx+.005),y,Math.cos(a)*(rz+.005)]);line(g,points,j%2?.0035:.006,M.gold);
   for(let k=0;k<6;k++){const y=.46+k*.103,r=.326-(y-.43)*.25;const pts=[];for(let t=0;t<=16;t++){const b=t/16*Math.PI*2,aa=a+Math.sin(b)*.038;pts.push([Math.sin(aa)*(r+.005),y+Math.cos(b)*.032,Math.cos(aa)*(r*.93+.006)])}line(g,pts,.003,M.goldLight)}
  }
  ring(g,.321,.014,M.gold,0,.401).scale.z=.92;
  ring(g,.314,.005,M.goldLight,0,.448).scale.z=.92;
  line(g,[[-.12,1.432,.061],[-.07,1.408,.103],[0,1.398,.112],[.07,1.408,.103],[.12,1.432,.061]],.011,M.gold);
  for(const sign of [-1,1]){
   ell(g,sign*.16,1.404,0,.053,.065,.067,u);
   limb(g,[sign*.174,1.399,0],[sign*.195,1.195,.019],.049,.035,u);
   limb(g,[sign*.195,1.195,.019],[sign*.177,1.04,.044],.035,.029,u);
   ell(g,sign*.177,1.01,.044,.03,.052,.027,skin);
   line(g,[[sign*.18,1.39,.055],[sign*.209,1.2,.052],[sign*.19,1.064,.07]],.005,M.gold);
  }
  cyl(g,.047,.052,.093,skin,0,1.507);
  face(g,skin,1.668,true);
  // Queen's open coronet with layered circlets, jeweled arches and ruby crest.
  profile(g,[[1.77,.119,.106],[1.799,.127,.113],[1.813,.13,.117]],M.gold,48);
  for(const y of [1.792,1.817])ring(g,.129,.009,M.goldLight,0,y).scale.z=.9;
  for(let j=0;j<9;j++){
   const a=j*Math.PI*2/9,x=Math.sin(a)*.122,z=Math.cos(a)*.108,high=j===0?1.955:1.89+(j%2)*.035;
   line(g,[[x,1.808,z],[x*1.14,high-.02,z*1.14],[x*.56,1.835,z*.56]],.011,M.goldLight);
   ell(g,x*1.14,high,z*1.14,.017,.024,.015,j%2?M.gem:M.goldLight);
   ell(g,x,1.804,z,.012,.014,.009,j%2?M.goldLight:M.gem);
  }
  for(const sign of [-1,1])line(g,[[sign*.12,1.82,.03],[sign*.065,1.93,.035],[0,1.967,0]],.009,M.gold);
  ell(g,0,1.977,0,.031,.035,.031,M.gem);
  ell(g,0,1.459,.092,.014,.02,.008,M.gem);
  // Colonel's raised eagle pin beneath the queen's neckline.
  line(g,[[-.09,1.405,.11],[-.04,1.434,.13],[0,1.412,.139],[.04,1.434,.13],[.09,1.405,.11]],.011,M.silver);
  ell(g,0,1.405,.141,.017,.025,.009,M.silver);
  // A raised full-bird colonel eagle on front and rear, with sculpted
  // wings, layered feathers, head, beak, tail, and talons. Rank text stays
  // on the pedestal tag.
  for(const a of [0,Math.PI]){
   const eagle=new T.Group();eagle.rotation.y=a;g.add(eagle);
   box(eagle,.42,.24,.018,M.navy,0,1.035,.235);
   box(eagle,.40,.22,.008,M.silver,0,1.035,.249);
   box(eagle,.37,.19,.008,M.navy,0,1.035,.256);
   ell(eagle,0,1.046,.275,.029,.055,.012,M.silver);
   for(const sign of [-1,1]){
    const wing=ell(eagle,sign*.105,1.088,.275,.10,.032,.012,M.silver);wing.rotation.z=sign*.13;
    for(let f=0;f<5;f++)ell(eagle,sign*(.06+f*.027),1.067-f*.011,.284,.015,.039-f*.004,.006,M.silver);
   }
   ell(eagle,.015,1.11,.274,.025,.025,.014,M.silver);
   const beak=ell(eagle,.046,1.104,.276,.022,.008,.008,M.silver);
   for(const sign of [-1,1]){
    line(eagle,[[0,1.075,.278],[sign*.08,1.112,.28],[sign*.18,1.094,.278]],.014,M.silver);
    for(let j=0;j<4;j++)line(eagle,[[sign*(.052+j*.03),1.108-j*.004,.281],[sign*(.089+j*.029),1.025-j*.014,.281]],.008,M.silver);
    line(eagle,[[sign*.014,1.015,.28],[sign*.046,.979,.28],[sign*.061,.971,.28]],.007,M.silver);
   }
   for(let j=-2;j<=2;j++)line(eagle,[[j*.006,1.014,.279],[j*.018,.967,.279]],.007,M.silver);
  }
  // Three concentric embroidered hems, pendant stones and raised filigree.
  for(const [y,r] of [[.49,.311],[.57,.295],[.86,.23]])ring(g,r,.004,M.goldLight,0,y).scale.z=.94;
  for(let j=0;j<18;j++){const a=j*Math.PI/9;ell(g,Math.sin(a)*.306,.487,Math.cos(a)*.285,.009,.018,.009,j%3?M.goldLight:M.gem)}
  for(let j=0;j<12;j++){const a=j*Math.PI/6;ell(g,Math.sin(a)*.27,.70,Math.cos(a)*.25,.008,.014,.008,j%3?M.goldLight:M.gem)}
  for(let j=0;j<9;j++)ell(g,-.095+j*.024,1.35,.112,.004,.004,.004,j%2?M.gem:M.goldLight);
  for(const sign of [-1,1])line(g,[[sign*.085,1.36,.104],[sign*.105,1.31,.115],[sign*.07,1.27,.116],[0,1.26,.122]],.005,M.goldLight);
 }
 function horse(g,color,female=false){
  const horseMaterial=color==='w'?M.ivory:M.black;
  const u=color==='w'?M.ivory:M.navy;
  const pants=u;
  // Four articulated legs, a muscular barrel, haunches, chest and a curved neck.
  ell(g,0,.923,-.018,.197,.22,.325,horseMaterial);
  ell(g,0,.92,-.205,.205,.23,.188,horseMaterial);
  ell(g,0,.969,.176,.18,.24,.16,horseMaterial);
  for(const sign of [-1,1]){
   const x=sign*.13;
   limb(g,[x,.91,-.20],[x,.67,-.25],.073,.047,horseMaterial);ell(g,x,.66,-.25,.05,.061,.051,horseMaterial);
   limb(g,[x,.65,-.25],[x,.435,-.205],.039,.028,horseMaterial);
   limb(g,[x,.956,.185],[x,.68,.205],.062,.038,horseMaterial);ell(g,x,.68,.205,.043,.051,.045,horseMaterial);
   limb(g,[x,.67,.205],[x,.433,.24],.033,.029,horseMaterial);
   for(const z of [-.2,.245]){ell(g,x,.407,z,.052,.038,.073,M.gold);ell(g,x,.447,z-.006,.037,.036,.048,horseMaterial)}
  }
  const neck=profile(g,[[.98,.154,.147,.18],[1.12,.141,.16,.17],[1.27,.112,.141,.14],[1.41,.085,.112,.12],[1.51,.07,.084,.16]],horseMaterial,40);
  const head=ell(g,0,1.519,.218,.099,.15,.141,horseMaterial);head.rotation.x=-.48;
  ell(g,0,1.431,.368,.083,.067,.118,horseMaterial);
  ell(g,0,1.4,.401,.076,.043,.072,horseMaterial);
  for(const sign of [-1,1]){
   ell(g,sign*.056,1.448,.422,.009,.016,.02,M.black);
   ell(g,sign*.092,1.54,.285,.012,.021,.028,M.gold);ell(g,sign*.103,1.54,.29,.008,.012,.013,M.black);
   const ear=ell(g,sign*.065,1.689,.148,.03,.091,.038,horseMaterial);ear.rotation.z=-sign*.19;ell(g,sign*.065,1.69,.174,.014,.056,.011,M.gold);
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
  for(let j=0;j<13;j++){const y=1.60-j*.037,z=.103-(1.60-y)*.27;line(g,[[0,y,z],[.036,y-.045,z-.04],[.02,y-.083,z-.054]],.022,horseMaterial)}
  for(let j=0;j<5;j++){const x=(j-2)*.019;line(g,[[x,.96,-.31],[x+.025,.77,-.386],[x+.052,.54,-.33],[x+.042,.42,-.29]],.017,horseMaterial)}
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
  const riderCap=profile(g,[[1.875,.10,.085,-.10],[1.89,.13,.11,-.10],[1.925,.135,.11,-.10],[1.95,.10,.083,-.10],[1.965,0,0,-.10]],u,36);
  ell(g,0,1.875,.015,.13,.013,.085,M.black);
  line(g,[[-.08,1.91,-.01],[0,1.91,.025],[.08,1.91,-.01]],.006,M.goldLight);
  insignia(g,0,1.933,.015,.12);
   box(g,.018,.065,.012,M.silver,0,1.927,.035);
  box(g,.17,.09,.018,M.navy,0,1.44,.005);
  text(g,'1ST LT',.15,.075,0,1.44,.017);
  for(const sign of [-1,1])line(g,[[sign*.13,1.22,.16],[sign*.04,1.18,.33],[sign*.085,1.46,.38]],.006,M.gold);
  for(const sign of [-1,1])for(let j=0;j<5;j++)ell(g,sign*.188,1.04-j*.025,-.19,.004,.004,.004,M.goldLight);
 }
 function tank(g,color){
  const armor=color==='w'?M.sand:M.olive,shadow=color==='w'?M.silver:M.black,trim=color==='w'?M.gold:M.goldLight;
  // Compact armored rook, with a low silhouette and a clear tank profile.
  for(const sign of [-1,1]){
   const x=sign*.285;
   box(g,.16,.255,.70,M.black,x,.55,0);
   box(g,.175,.035,.73,shadow,x,.704,0);
   box(g,.175,.035,.73,shadow,x,.397,0);
   for(let j=0;j<6;j++){
    const z=-.29+j*.116;
    ell(g,sign*.375,.54,z,.018,.059,.059,M.gold);
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
 // The approved queen wears a fitted jacket and trousers, not the old gown.
 // Keep the front and rear silhouettes continuous so the inspection camera
 // reveals the same figure and the rank plaque on the back of the pedestal.
 function queenReference(g,color){
  const u=color==='w'?M.ivory:M.navy,skin=color==='w'?M.skinW:M.skinB;
  for(const sign of [-1,1]){
   const x=sign*.125;
   ell(g,x,.414,.038,.073,.045,.122,M.shoe);
   const leg=profile(g,[[.445,.063,.069],[.67,.069,.073],[.86,.093,.102],[.99,.108,.115],[1.025,.097,.101]],u,64);leg.position.x=x;
   line(g,[[x+sign*.066,.46,.012],[x+sign*.073,.71,.012],[x+sign*.092,.98,.005]],.009,color==='w'?M.red:M.red);
  }
  profile(g,[[.91,.215,.145],[.98,.238,.157],[1.07,.165,.118],[1.15,.126,.098],[1.26,.156,.114],[1.355,.196,.139],[1.415,.174,.115],[1.45,.079,.06]],u,72);
  for(const sign of [-1,1]){
   ell(g,sign*.108,1.319,.129,.091,.096,.077,u);
   ell(g,sign*.19,1.365,0,.058,.067,.069,u);
   limb(g,[sign*.201,1.361,0],[sign*.243,1.188,.046],.051,.039,u);
   limb(g,[sign*.243,1.188,.046],[sign*.178,1.079,.112],.039,.031,u);
   ell(g,sign*.166,1.075,.125,.034,.041,.033,M.white);
   line(g,[[sign*.195,1.393,.097],[sign*.146,1.307,.176],[sign*.072,1.145,.122]],.006,M.goldLight);
   // Sculpted shoulder epaulets and a continuous breast seam add relief to
   // the tailored coat without changing the photographic silhouette.
   ell(g,sign*.173,1.416,.015,.062,.017,.068,M.gold);
   line(g,[[sign*.052,1.392,.163],[sign*.11,1.305,.204],[sign*.169,1.272,.134]],.004,M.goldLight);
  }
  profile(g,[[1.055,.132,.102],[1.081,.132,.102]],M.black,48);
  box(g,.055,.043,.024,M.goldLight,0,1.069,.113);
  for(let i=0;i<5;i++)ell(g,0,1.135+i*.061,.132,.009,.009,.005,M.goldLight);
  for(let i=0;i<9;i++)box(g,.019,.012,.008,[M.red,M.ribbonBlue,M.gold][i%3],-.132+(i%3)*.023,1.365-Math.floor(i/3)*.015,.126);
  for(const sign of [-1,1]){
   line(g,[[sign*.194,1.03,.09],[sign*.16,.86,.108],[sign*.15,.65,.08]],.003,M.goldLight);
   for(let j=0;j<3;j++)ell(g,sign*.17,1.422,.025+(j-1)*.027,.006,.006,.006,M.goldLight);
  }
  cyl(g,.055,.053,.065,skin,0,1.474,0,32);
  face(g,skin,1.633,true);
  // Flat white dress cover, black band and gold Marine emblem match both views.
  profile(g,[[1.727,.105,.092],[1.744,.153,.137],[1.77,.155,.139],[1.783,.124,.114],[1.793,.10,.09]],M.white,64);
  profile(g,[[1.718,.125,.104],[1.745,.129,.108]],M.black,48);
  ell(g,0,1.72,.079,.133,.012,.094,M.shoe);
  insignia(g,0,1.759,.142,.14);
  // Full bird Colonel rank, also visible from behind the uniform.
  for(const a of [0,Math.PI]){const mark=new T.Group();mark.rotation.y=a;g.add(mark);line(mark,[[-.06,1.374,.15],[-.025,1.401,.155],[0,1.381,.157],[.025,1.401,.155],[.06,1.374,.15]],.008,M.silver);ell(mark,0,1.377,.157,.01,.016,.007,M.silver)}
 }
 function piece(type,color,female=false){const raw=new T.Group();base(raw,type,color);if(type==='r'){const raised=new T.Group();raw.add(raised);tank(raised,color);raised.scale.y=1.8;raised.position.y=-.365*.8;}else if(type==='n')horse(raw,color,female);else if(type==='q')queenReference(raw,color);else marine(raw,type,color,female);const out=bake(raw);if(color==='w')out.rotation.y=Math.PI;out.userData={type,color,female,sculpture:true};return out}
 return {M,material,add,ell,box,cyl,ring,line,profile,star,text,insignia,bake,piece};
}
