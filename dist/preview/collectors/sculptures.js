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
  ribbonBlue:material('#2379aa',.1,.37),ribbonGreen:material('#22644b',.1,.37),
  lipW:material('#4f2820',0,.52),lipB:material('#a66d58',0,.5),gem:material('#a72237',.35,.2),
 };
 const add=(p,g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o};
 const sphereGeo=new T.SphereGeometry(1,20,14);
 const ell=(p,x,y,z,rx,ry,rz,m)=>{const o=add(p,sphereGeo,m,x,y,z);o.scale.set(rx,ry,rz);return o};
 const box=(p,w,h,d,m,x=0,y=0,z=0)=>add(p,new T.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(p,rt,rb,h,m,x=0,y=0,z=0,n=40)=>add(p,new T.CylinderGeometry(rt,rb,h,n),m,x,y,z);
 const ring=(p,r,t,m,x=0,y=0,z=0)=>{const o=add(p,new T.TorusGeometry(r,t,7,48),m,x,y,z);o.rotation.x=Math.PI/2;return o};
 function line(p,points,r,m){const curve=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a)));return add(p,new T.TubeGeometry(curve,Math.max(8,points.length*5),r,6,false),m)}
 function limb(p,a,b,ra,rb,m){const av=new T.Vector3(...a),bv=new T.Vector3(...b),mid=av.clone().add(bv).multiplyScalar(.5),o=cyl(p,rb,ra,av.distanceTo(bv),m,...mid.toArray(),20);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o}
 function profile(p,rows,m,segments=48,flutes=0){
  const pos=[],uv=[],idx=[];
  for(let j=0;j<rows.length;j++){const [y,rx,rz,cz=0]=rows[j];for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,f=1+Math.cos(a*12)*flutes;pos.push(Math.sin(a)*rx*f,y,Math.cos(a)*rz*f+cz);uv.push(i/segments,j/(rows.length-1));}}
  for(let j=0;j<rows.length-1;j++)for(let i=0;i<segments;i++){const k=j*(segments+1)+i;idx.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return add(p,g,m);
 }
 function star(p,r,x,y,z,m=M.goldLight){const s=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5,rr=i%2?r*.43:r,xx=Math.sin(a)*rr,yy=Math.cos(a)*rr;i?s.lineTo(xx,yy):s.moveTo(xx,yy)}s.closePath();return add(p,new T.ExtrudeGeometry(s,{depth:.008,bevelEnabled:false}),m,x,y,z)}
 function text(p,words,w,h,x,y,z,ry=0){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#edd29a';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 88px Georgia';ctx.fillText(words,512,128,980);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const o=add(p,new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}),x,y,z);o.rotation.y=ry;return o}
 function anchor(p,x,y,z,scale=1){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);p.add(g);line(g,[[0,.13,0],[0,.03,0],[0,-.13,0]],.014,M.gold);line(g,[[-.12,-.04,0],[-.10,-.12,0],[0,-.17,0],[.10,-.12,0],[.12,-.04,0]],.012,M.gold);line(g,[[-.085,.07,0],[.085,.07,0]],.012,M.gold);const r=ring(g,.029,.009,M.gold,0,.15,0);r.rotation.x=0;return g}
 function insignia(p,x,y,z,scale=1){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);p.add(g);ell(g,0,0,0,.10,.10,.043,M.gold);const rr=ring(g,.10,.008,M.goldLight);rr.rotation.x=0;line(g,[[-.12,.10,0],[-.22,.16,0],[-.07,.12,.01],[0,.16,.025],[.07,.12,.01],[.22,.16,0],[.12,.10,0]],.015,M.gold);anchor(g,.015,-.015,-.015,1.1);return g}
 function bake(group){
  group.updateMatrixWorld(true);const byMaterial=new Map(),labels=[];
  group.traverse(o=>{if(!o.isMesh)return;if(o.material.transparent){const c=o.clone();c.applyMatrix4(o.parent.matrixWorld);labels.push(c);return}const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);const plain=geo.index?geo.toNonIndexed():geo;for(const key of Object.keys(plain.attributes))if(!['position','normal','uv'].includes(key))plain.deleteAttribute(key);if(!plain.attributes.uv)plain.setAttribute('uv',new T.BufferAttribute(new Float32Array(plain.attributes.position.count*2),2));if(!byMaterial.has(o.material))byMaterial.set(o.material,[]);byMaterial.get(o.material).push(plain)});
  const out=new T.Group();for(const [m,list] of byMaterial){const geo=mergeGeometries(list,false);if(!geo)throw Error('Could not merge sculpture geometry');const o=new T.Mesh(geo,m);o.castShadow=true;o.receiveShadow=true;out.add(o);for(const g of list)g.dispose()}for(const o of labels)out.add(o);return out;
 }
 function base(g,type){
  profile(g,[[0,0,0],[0,.405,.405],[.035,.435,.435],[.065,.435,.435],[.083,.4,.4],[.11,.4,.4],[.135,.38,.38],[.27,.38,.38],[.29,.41,.41],[.315,.41,.41],[.34,.36,.36],[.365,.36,.36],[.365,0,0]],M.navy,64);
  for(const [y,r,t] of [[.035,.429,.012],[.08,.411,.015],[.127,.386,.009],[.278,.397,.013],[.312,.405,.014],[.352,.356,.011]])ring(g,r,t,M.goldLight,0,y);
  cyl(g,.352,.352,.025,M.ivory,0,.365);
  for(let i=0;i<10;i++){const a=i*Math.PI/5,s=star(g,.037,Math.sin(a)*.384,.207,Math.cos(a)*.384);s.rotation.y=a}
  for(let j=0;j<20;j++){const a=j*Math.PI/10;ell(g,Math.sin(a)*.418,.302,Math.cos(a)*.418,.008,.008,.008,M.goldLight)}
  ring(g,.347,.004,M.goldLight,0,.368);
  const rank={p:'LCPL',n:'SGT',r:'MSGT',b:'2LT',q:'COL',k:'4★ GEN'}[type];
  // Large raised plaques on both sides, mounted beyond the curved pedestal.
  for(const a of [0,Math.PI]){
   const plaque=new T.Group();plaque.rotation.y=a;g.add(plaque);
   box(plaque,.69,.16,.028,M.black,0,.21,.414);
   box(plaque,.655,.13,.008,M.gold,0,.21,.432);
   box(plaque,.62,.105,.008,M.navy,0,.21,.439);
   text(plaque,rank,.58,.093,0,.21,.447);
  }
 }
 function face(g,skin,y,female=false){
  const head=new T.Group();head.position.y=y;g.add(head);
  profile(head,[[-.155,0,0,.003],[-.145,.05,.055,.015],[-.12,.087,.078,.014],[-.075,.108,.087,.009],[0,.113,.093,0],[.08,.105,.09,-.005],[.135,.075,.064,-.008],[.154,0,0,-.008]],skin,40);
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
 function marine(g,type,color){
  const u=color==='w'?M.ivory:M.navy,skin=color==='w'?M.skinW:M.skinB;
  const body=new T.Group();g.add(body);const senior=type!=='p';
  // Anatomical proportions: boots, shaped trouser legs, jacket waist and shoulders.
  for(const sign of [-1,1]){
   const x=sign*.094;
   ell(body,x,.409,.043,.077,.055,.145,M.shoe);
   const leg=profile(body,[[.44,.058,.06],[.53,.055,.057],[.73,.064,.067],[.86,.067,.07],[.97,.079,.083],[1.01,.077,.082]],u,28);leg.position.x=x;
   line(body,[[x+sign*.061,.46,.013],[x+sign*.065,.71,.005],[x+sign*.077,.96,0]],.008,color==='w'?M.gold:M.red);
   line(body,[[x,.50,.061],[x,.74,.072],[x,1.00,.085]],.003,u);
  }
  profile(body,[[.94,.155,.09],[.98,.16,.105],[1.07,.143,.099],[1.17,.168,.111],[1.31,.195,.113],[1.37,.191,.106],[1.40,.124,.078],[1.41,.066,.055]],u,40);
  cyl(body,.069,.065,.07,skin,0,1.44,0,32);
  // Standing collar, red piping, belt and a small raised buckle.
  profile(body,[[1.389,.075,.061],[1.447,.074,.060],[1.452,.07,.058]],u,32);
  line(body,[[-.06,1.447,.035],[0,1.447,.063],[.06,1.447,.035]],.005,color==='w'?M.gold:M.red);
  const belt=profile(body,[[1.035,.15,.106],[1.071,.149,.105]],M.black,40);
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
   // Distinct sleeve insignia: two chevrons, three chevrons, officer bar,
   // and four stars for the general. The pedestal gives the full rank.
   box(body,.109,.022,.055,M.gold,sign*.152,1.393,0);
   if(type==='p'||type==='n'){
    for(let j=0;j<(type==='p'?2:3);j++)line(body,[[sign*.276,1.29-j*.031,-.03],[sign*.285,1.266-j*.031,.008],[sign*.276,1.29-j*.031,.046]],.009,M.goldLight);
    if(type==='n')for(let j=0;j<2;j++)line(body,[[sign*.277,1.16+j*.025,-.025],[sign*.286,1.14+j*.025,.006],[sign*.278,1.16+j*.025,.043]],.006,M.gold);
   }else if(type==='b'){
    box(body,.017,.060,.065,M.goldLight,sign*.281,1.255,.005);
    line(body,[[sign*.292,1.25,-.035],[sign*.292,1.25,.043]],.004,M.black);
   }else if(type==='k'){
    for(let j=0;j<4;j++)star(body,.020,sign*.272,1.29-j*.043,.048,M.goldLight).rotation.y=sign*Math.PI/2;
   }
  }
  // Pockets, nameplate, ribbon racks and suspended miniature medals.
  for(const x of [-.092,.092]){box(body,.083,.057,.011,u,x,1.197,.111);line(body,[[x-.04,1.222,.121],[x,1.212,.127],[x+.04,1.222,.121]],.004,u)}
  const ribbons=[M.red,M.ribbonBlue,M.gold,M.ribbonGreen,M.white,M.red,M.gold,M.ribbonBlue,M.ribbonGreen];
  for(let j=0;j<(senior?9:6);j++)box(body,.021,.013,.008,ribbons[j],-.127+(j%3)*.025,1.30-Math.floor(j/3)*.016,.119);
  box(body,.069,.011,.009,M.gold,.095,1.292,.123);
  for(let i=0;i<(senior?3:1);i++){const x=-.118+i*.031;box(body,.015,.027,.007,M.ribbonBlue,x,1.224,.133);ell(body,x,1.202,.137,.014,.017,.005,M.gold)}
  const head=face(body,skin,1.607);
  // Peaked cover with elliptical crown, band, black brim and raised insignia.
  if(type==='b'){
   // A tall, narrow bishop's mitre replaces the Marine's peaked cap entirely.
   // Its split silhouette, scarlet band and gold spine are visible at board scale.
   profile(body,[[1.69,.128,.11],[1.73,.151,.125],[1.78,.133,.105],[1.86,.116,.083],[2.05,.111,.070],[2.28,.099,.055],[2.49,.076,.042],[2.62,.048,.029]],u,48);
   profile(body,[[1.725,.152,.126],[1.783,.143,.111]],M.red,48);
   for(const [y,rx,rz] of [[1.73,.152,.126],[1.79,.139,.108],[2.04,.112,.071],[2.47,.08,.046]])ring(body,rx,.010,M.goldLight,0,y).scale.z=rz/rx;
   for(const sign of [-1,1]){
    const x=sign*.053;
    profile(body,[[2.49,.045,.034],[2.57,.044,.03],[2.70,.026,.019],[2.81,.004,.005]],u,28).position.x=x;
    line(body,[[sign*.123,1.80,.057],[sign*.108,2.09,.062],[sign*.076,2.46,.046],[x,2.78,.012]],.010,M.gold);
    line(body,[[sign*.10,1.82,-.05],[sign*.095,2.14,-.048],[sign*.063,2.52,-.025]],.005,M.goldLight);
    ell(body,x,2.805,0,.024,.027,.024,M.goldLight);
   }
   line(body,[[0,1.80,.112],[0,2.12,.071],[0,2.45,.045],[0,2.58,.024]],.014,M.goldLight);
   line(body,[[-.075,2.12,.065],[0,2.19,.071],[.075,2.12,.065]],.009,M.gold);
   ell(body,0,1.968,.083,.028,.041,.013,M.gold);
   ell(body,0,1.968,.097,.014,.022,.007,M.gem);
  }else{
   const crown=profile(body,[[1.704,.117,.10],[1.719,.146,.129],[1.752,.15,.132],[1.777,.129,.115],[1.786,0,0]],u,48);
   profile(body,[[1.685,.12,.101],[1.718,.124,.105]],M.black,40);
   const brim=ell(body,0,1.684,.078,.134,.014,.096,M.shoe);
   line(body,[[-.106,1.702,.047],[0,1.696,.107],[.106,1.702,.047]],.006,M.gold);
   insignia(body,0,1.742,.131,.15);
  }
  if(type==='b'){
   // A narrow ceremonial stole with embroidered edges distinguishes the bishop's coat.
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
  // Fine raised seams, collar braid, cuff studs and polished boot caps.
  for(const sign of [-1,1]){
   line(body,[[sign*.175,1.36,.073],[sign*.149,1.287,.109],[sign*.123,1.095,.107]],.003,M.goldLight);
   ell(body,sign*.222,1.002,.081,.009,.009,.005,M.goldLight);
   line(body,[[sign*.055,.458,.155],[sign*.094,.449,.167],[sign*.144,.458,.15]],.005,M.gold);
  }
  for(const y of [1.398,1.417,1.439])line(body,[[-.055,y,.058],[0,y,.071],[.055,y,.058]],.0025,M.goldLight);
  // The bishop's taller hat is balanced by a slightly shorter coat, not an oversized base.
  const scale=type==='k'?1.10:type==='b'?1.13:.95;
  body.position.y=.38*(1-scale);body.scale.y=scale;
 }
 function queen(g,color){
  const u=color==='w'?M.ivory:M.navy,skin=color==='w'?M.skinW:M.skinB;
  const rows=[[.379,0,0],[.38,.326,.297],[.43,.326,.297],[.55,.3,.278],[.70,.27,.25],[.86,.23,.22],[1.03,.185,.185],[1.17,.129,.12],[1.24,.118,.104],[1.33,.149,.106],[1.40,.164,.107],[1.45,.14,.085],[1.48,.06,.048]];
  profile(g,rows,u,72,.014);
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
  // Tiara with individual arches and ruby cabochons.
  ring(g,.12,.011,M.gold,0,1.786).scale.z=.89;
  for(let j=0;j<9;j++){const a=(j-4)*.31,r=.12,h=.06+.028*(1-Math.abs(j-4)/4);line(g,[[Math.sin(a-.12)*r,1.79,Math.cos(a-.12)*r],[Math.sin(a)*r,1.79+h,Math.cos(a)*r],[Math.sin(a+.12)*r,1.79,Math.cos(a+.12)*r]],.007,M.gold);ell(g,Math.sin(a)*r,1.796+h,Math.cos(a)*r,.01,.016,.009,j%2?M.goldLight:M.gem)}
  ell(g,0,1.459,.092,.014,.02,.008,M.gem);
  // Colonel's raised eagle pin beneath the queen's neckline.
  line(g,[[-.09,1.405,.11],[-.04,1.434,.13],[0,1.412,.139],[.04,1.434,.13],[.09,1.405,.11]],.011,M.goldLight);
  ell(g,0,1.405,.141,.017,.025,.009,M.gold);
  // Three concentric embroidered hems, pendant stones and raised filigree.
  for(const [y,r] of [[.49,.311],[.57,.295],[.86,.23]])ring(g,r,.004,M.goldLight,0,y).scale.z=.94;
  for(let j=0;j<18;j++){const a=j*Math.PI/9;ell(g,Math.sin(a)*.306,.487,Math.cos(a)*.285,.009,.018,.009,j%3?M.goldLight:M.gem)}
  for(const sign of [-1,1])line(g,[[sign*.085,1.36,.104],[sign*.105,1.31,.115],[sign*.07,1.27,.116],[0,1.26,.122]],.005,M.goldLight);
 }
 function horse(g,color){
  const u=color==='w'?M.ivory:M.navy;
  // Four articulated legs, a muscular barrel, haunches, chest and a curved neck.
  ell(g,0,.923,-.018,.197,.22,.325,M.ivory);
  ell(g,0,.92,-.205,.205,.23,.188,M.ivory);
  ell(g,0,.969,.176,.18,.24,.16,M.ivory);
  for(const sign of [-1,1]){
   const x=sign*.13;
   limb(g,[x,.91,-.20],[x,.67,-.25],.073,.047,M.ivory);ell(g,x,.66,-.25,.05,.061,.051,M.ivory);
   limb(g,[x,.65,-.25],[x,.435,-.205],.039,.028,M.ivory);
   limb(g,[x,.956,.185],[x,.68,.205],.062,.038,M.ivory);ell(g,x,.68,.205,.043,.051,.045,M.ivory);
   limb(g,[x,.67,.205],[x,.433,.24],.033,.029,M.ivory);
   for(const z of [-.2,.245]){ell(g,x,.407,z,.052,.038,.073,M.gold);ell(g,x,.447,z-.006,.037,.036,.048,M.ivory)}
  }
  const neck=profile(g,[[.98,.154,.147,.18],[1.12,.141,.16,.17],[1.27,.112,.141,.14],[1.41,.085,.112,.12],[1.51,.07,.084,.16]],M.ivory,40);
  const head=ell(g,0,1.519,.218,.099,.15,.141,M.ivory);head.rotation.x=-.48;
  ell(g,0,1.431,.368,.083,.067,.118,M.ivory);
  ell(g,0,1.4,.401,.076,.043,.072,M.ivory);
  for(const sign of [-1,1]){
   ell(g,sign*.056,1.448,.422,.009,.016,.02,M.black);
   ell(g,sign*.092,1.54,.285,.012,.021,.028,M.gold);ell(g,sign*.103,1.54,.29,.008,.012,.013,M.black);
   const ear=ell(g,sign*.065,1.689,.148,.03,.091,.038,M.ivory);ear.rotation.z=-sign*.19;ell(g,sign*.065,1.69,.174,.014,.056,.011,M.gold);
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
  for(let j=0;j<13;j++){const y=1.60-j*.037,z=.103-(1.60-y)*.27;line(g,[[0,y,z],[.036,y-.045,z-.04],[.02,y-.083,z-.054]],.022,M.ivory)}
  for(let j=0;j<5;j++){const x=(j-2)*.019;line(g,[[x,.96,-.31],[x+.025,.77,-.386],[x+.052,.54,-.33],[x+.042,.42,-.29]],.017,M.ivory)}
  const blanket=ell(g,0,1.065,-.06,.208,.044,.208,u);
  line(g,[[-.202,1.039,.05],[-.198,1.037,-.20],[0,1.10,-.24],[.198,1.037,-.20],[.202,1.039,.05]],.009,M.gold);
  ell(g,0,1.10,-.065,.116,.039,.132,M.gold);
  line(g,[[-.168,1.01,.13],[0,.89,.3],[.168,1.01,.13]],.014,M.gold);
  for(const sign of [-1,1]){const medal=insignia(g,sign*.20,.923,-.07,.21);medal.rotation.y=sign*Math.PI/2;const stirrup=ring(g,.06,.009,M.gold,sign*.222,.84,-.045);stirrup.rotation.x=0;stirrup.rotation.y=Math.PI/2}
 }
 function tank(g,color){
  const armor=color==='w'?M.ivory:M.navy,trim=color==='w'?M.gold:M.red;
  // Low armored rook: its highest finial is below the king and queen.
  // The pointed prow and cannon face the opposing army with the other pieces.
  for(const sign of [-1,1]){
   const x=sign*.285;
   box(g,.155,.27,.71,M.black,x,.552,0);
   box(g,.166,.035,.74,M.gold,x,.70,0);
   for(let j=0;j<5;j++){
    const z=-.265+j*.132;
    const wheel=ell(g,sign*.367,.53,z,.018,.068,.068,M.gold);
    ell(g,sign*.385,.53,z,.008,.029,.029,M.black);
    ell(g,sign*.394,.53,z,.004,.010,.010,M.goldLight);
   }
   for(let j=0;j<9;j++)box(g,.174,.025,.078,M.shoe,x,.72,-.305+j*.076);
   for(let j=0;j<9;j++)box(g,.174,.024,.078,M.shoe,x,.389,-.305+j*.076);
   line(g,[[x,.7,-.36],[x,.745,-.29],[x,.745,.29],[x,.7,.36]],.009,M.goldLight);
  }
  // Angled armored hull and a sharp forward glacis.
  box(g,.57,.24,.66,armor,0,.64,-.025);
  box(g,.60,.032,.68,M.gold,0,.765,-.025);
  const prow=new T.Mesh(new T.ConeGeometry(.308,.36,4),armor);
  prow.rotation.x=Math.PI/2;prow.rotation.y=Math.PI/4;prow.position.set(0,.64,.325);g.add(prow);
  line(g,[[-.245,.762,.26],[0,.756,.50],[.245,.762,.26]],.012,M.goldLight);
  for(const sign of [-1,1]){
   box(g,.045,.19,.47,trim,sign*.272,.66,-.075);
   for(let j=0;j<4;j++)ell(g,sign*.246,.767,-.24+j*.13,.014,.006,.014,M.goldLight);
  }
  // Turret, raised hatch, pointed armored cupola and detailed cannon.
  cyl(g,.235,.265,.13,armor,0,.845,-.075,8);
  ring(g,.248,.012,M.goldLight,0,.782,-.075);
  cyl(g,.192,.23,.18,armor,0,.990,-.075,8);
  cyl(g,.19,.19,.018,M.goldLight,0,1.085,-.075,16);
  const roof=cyl(g,.014,.195,.18,armor,0,1.18,-.075,6);
  roof.rotation.y=Math.PI/6;
  ell(g,0,1.285,-.075,.026,.025,.026,M.goldLight);
  limb(g,[0,.974,.10],[0,.974,.48],.071,.051,M.black);
  limb(g,[0,.974,.12],[0,.974,.475],.046,.033,M.gold);
  const muzzle=cyl(g,.068,.060,.055,M.black,0,.974,.49,20);muzzle.rotation.x=Math.PI/2;
  const bore=cyl(g,.033,.033,.058,M.goldLight,0,.974,.52,20);bore.rotation.x=Math.PI/2;
  for(const z of [.16,.27,.39]){const collar=cyl(g,.056,.056,.018,M.goldLight,0,.974,z,20);collar.rotation.x=Math.PI/2}
  // Raised service panel, sight, hatches and subtle Marine insignia.
  box(g,.13,.016,.10,M.black,-.09,1.097,-.12);
  ring(g,.075,.008,M.goldLight,-.09,1.109,-.12);
  cyl(g,.024,.024,.11,M.black,.115,1.12,-.14);
  ell(g,.115,1.18,-.14,.024,.018,.024,M.goldLight);
  for(const sign of [-1,1]){
   box(g,.038,.10,.075,M.goldLight,sign*.197,.934,.005);
   ell(g,sign*.196,1.008,.005,.023,.014,.023,M.red);
  }
  insignia(g,0,.627,.357,.34);
 }
 function piece(type,color){const raw=new T.Group();base(raw,type);if(type==='r')tank(raw,color);else if(type==='n')horse(raw,color);else if(type==='q')queen(raw,color);else marine(raw,type,color);const out=bake(raw);if(color==='w')out.rotation.y=Math.PI;out.userData={type,color,sculpture:true};return out}
 return {M,material,add,ell,box,cyl,ring,line,profile,star,text,insignia,bake,piece};
}
