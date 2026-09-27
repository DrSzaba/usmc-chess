import { Chess } from '../../vendor/chess.js';
const $=id=>document.getElementById(id), game=new Chess();
const names={p:'Pawn',r:'Rook',n:'Knight',b:'Bishop',q:'Queen',k:'King'},ranks={p:'Private First Class',n:'First Lieutenant',b:'Captain',r:'Master Sergeant',q:'Colonel',k:'Four-Star General'},rankMarks={p:'PFC',n:'1ST LT',b:'CAPT',r:'MSGT',q:'COL',k:'4★ GEN'},glyph={p:'♟',r:'♜',n:'♞',b:'♝',q:'♛',k:'♚'};
let selected=null, flipped=false, flat=false, busy=false, timer=null, aiWorker=null, aiJob=0, redraw3D=()=>{}, cameraReset=()=>{};
function sizeFlatBoard(){const stage=$('stage'),sideSpace=stage.clientWidth<650?82:158,size=Math.max(228,Math.floor(Math.min(stage.clientWidth-sideSpace,stage.clientHeight-105,650)));$('flat').style.width=`${size}px`;$('flat').style.height=`${size}px`}
new ResizeObserver(sizeFlatBoard).observe($('stage'));sizeFlatBoard();
let audioContext=null,soundEnabled=true;
const soundButton=$('sound'),testButton=$('sound-test'),soundState=$('sound-state');
const marineTerms=[
 'Semper Fi','Semper Fidelis','Oorah','Devil Dog','Leatherneck','The Few, The Proud','Honor, Courage, Commitment','First to fight',
 'Every Marine a rifleman','Adapt and overcome','Improvise, adapt, overcome','No Marine left behind','Esprit de corps','Tun Tavern','Chesty Puller','The Crucible',
 'Parris Island','Camp Lejeune','Quantico','Marine Corps birthday','The fleet','Field day','Firewatch','Scuttlebutt',
 'Quarterdeck','Guidon','Colors','Formation','Inspection','Reveille','Taps','Boot camp',
 'Stand fast','Move out','Hold the line','On the double','Eyes front','Sound off','Carry on','Fall in',
 'Fall out','At ease','Attention','Present arms','Forward march','About face','Left face','Right face',
 'Dress right, dress','Parade rest','Report in','Aye aye','Roger that','Outstanding','Good to go','Mission accomplished',
 'Combat ready','Secure the area','Field exercise','Watch your six','Cover and move','Unit cohesion','Dress blues','Dress whites'
];
let phraseDeck=[],lastPhrase='';
function nextMarineTerm(){
 if(!phraseDeck.length){phraseDeck=[...marineTerms];for(let i=phraseDeck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[phraseDeck[i],phraseDeck[j]]=[phraseDeck[j],phraseDeck[i]]}if(phraseDeck.at(-1)===lastPhrase)[phraseDeck[0],phraseDeck[phraseDeck.length-1]]=[phraseDeck.at(-1),phraseDeck[0]]}
 return lastPhrase=phraseDeck.pop();
}
const volumeControl=$('volume');
function volume(){return Number(volumeControl.value)/100}
volumeControl.oninput=()=>{$('volume-value').textContent=`${volumeControl.value}%`;if(volume()===0&&'speechSynthesis' in window)speechSynthesis.cancel()};
function speak(message){
 if(!soundEnabled||!volume())return;
 if(!('speechSynthesis' in window)){soundState.textContent='Spoken callouts are unavailable in this browser.';return}
 try{
  speechSynthesis.cancel();
  const call=new SpeechSynthesisUtterance(message);
  const voices=speechSynthesis.getVoices();call.voice=voices.find(v=>v.lang?.toLowerCase().startsWith('en-us'))||voices.find(v=>v.lang?.toLowerCase().startsWith('en'))||null;
  call.lang='en-US';call.rate=.94;call.pitch=.93;call.volume=volume();
  call.onerror=()=>{soundState.textContent='Speech was blocked. Check browser speech and device volume.'};
  speechSynthesis.speak(call);
  soundState.textContent=`Speaking: ${message}`;
 }catch(e){soundState.textContent='Spoken callouts are unavailable on this device.';console.warn('Speech unavailable',e)}
}
function announceCapture(piece){const term=nextMarineTerm();soundBanner(`${names[piece]} CAPTURE · “${term}”`);speak(term)}
function soundBanner(message){$('sound-event').textContent=message;$('sound-banner').classList.remove('pulse');void $('sound-banner').offsetWidth;$('sound-banner').classList.add('pulse')}
async function unlockAudio(){
 try{
  audioContext??=new (window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state!=='running')await audioContext.resume();
  if(audioContext.state!=='running')throw Error('Audio is suspended');
  soundState.textContent='Audio ready';
  return audioContext;
 }catch(e){
  soundState.textContent='Audio blocked. Check this tab and system volume.';
  console.warn('Audio unavailable',e);
  return null;
 }
}
document.addEventListener('pointerdown',()=>{if(soundEnabled)unlockAudio()},{once:true});
soundButton.onclick=async()=>{
 soundEnabled=!soundEnabled;
 soundButton.textContent=soundEnabled?'Sound on':'Sound off';
 soundButton.setAttribute('aria-pressed',String(soundEnabled));
 soundState.textContent=soundEnabled?'Starting audio…':'Sound muted';
 soundBanner(soundEnabled?'SOUND ON · Wooden moves, spoken Marine captures':'SOUND OFF · Press Sound on to hear the pieces');
 if(!soundEnabled&&'speechSynthesis' in window)speechSynthesis.cancel();
 if(soundEnabled){await unlockAudio();playCue('move')}
};
testButton.onclick=()=>{if(!soundEnabled){soundEnabled=true;soundButton.textContent='Sound on';soundButton.setAttribute('aria-pressed','true')}const choice=$('sound-preview').value,action=$('sound-action').value;if(choice==='mate'){soundBanner('CHECKMATE · Reveille');playCue('mate')}else if(action==='capture')announceCapture(choice);else{soundBanner(`${names[choice]} MOVE · Wooden cue`);playCue('move',choice)}};
$('board-tone').onchange=()=>{const label=$('board-tone').selectedOptions[0].textContent;soundBanner(`BOARD SOUND · ${label}`);playCue('move','p')};
let woodNoise=null;
function noiseFor(ctx){
 if(woodNoise&&woodNoise.sampleRate===ctx.sampleRate)return woodNoise;
 const length=Math.ceil(ctx.sampleRate*1.2);
 woodNoise=ctx.createBuffer(1,length,ctx.sampleRate);
 const data=woodNoise.getChannelData(0);
 for(let i=0;i<length;i++)data[i]=(Math.random()*2-1);
 return woodNoise;
}
async function playCue(kind,piece='p'){
 if(!soundEnabled)return;
 const ctx=await unlockAudio();if(!ctx)return;
 const start=ctx.currentTime+.012,noise=noiseFor(ctx),master=ctx.createDynamicsCompressor(),level=ctx.createGain();
 master.threshold.value=-20;master.knee.value=20;master.ratio.value=3;master.attack.value=.003;master.release.value=.18;level.gain.value=volume();master.connect(level).connect(ctx.destination);
 function woodenClack(delay=0,weight=1,depth=1){
  const tone=$('board-tone').value;
  depth*=tone==='mahogany'?1.42:tone==='parade'?.66:1;
  weight*=tone==='mahogany'?1.12:tone==='parade'?.82:1;
  const at=start+delay;
  // A very short filtered impact resembles hardwood meeting hardwood.
  const strike=ctx.createBufferSource(),band=ctx.createBiquadFilter(),low=ctx.createBiquadFilter(),impact=ctx.createGain();
  strike.buffer=noise;band.type='bandpass';band.frequency.value=720/depth;band.Q.value=.64;
  low.type='lowpass';low.frequency.value=1850/depth;
  impact.gain.setValueAtTime(.0001,at);
  impact.gain.exponentialRampToValueAtTime(.30*weight,at+.003);
  impact.gain.exponentialRampToValueAtTime(.0001,at+.105*depth);
  strike.connect(band).connect(low).connect(impact).connect(master);
  strike.start(at);strike.stop(at+.13*depth);
  // Brief, damped body resonance: pitch falls instead of beeping.
  for(const [freq,volume,decay] of [[155,.15,.16],[288,.09,.09],[470,.032,.055]]){
   const osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type='sine';osc.frequency.setValueAtTime(freq/depth,at);
   osc.frequency.exponentialRampToValueAtTime(freq*.70/depth,at+decay);
   gain.gain.setValueAtTime(.0001,at);
   gain.gain.exponentialRampToValueAtTime(volume*weight,at+.003);
   gain.gain.exponentialRampToValueAtTime(.0001,at+decay);
   osc.connect(gain).connect(master);
   osc.start(at);osc.stop(at+decay+.01);
  }
 }
 function drum(delay=0,weight=1){
  const at=start+delay,osc=ctx.createOscillator(),tone=ctx.createGain(),strike=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),hiss=ctx.createGain();
  osc.type='triangle';osc.frequency.setValueAtTime(185,at);osc.frequency.exponentialRampToValueAtTime(76,at+.12);
  tone.gain.setValueAtTime(.0001,at);tone.gain.exponentialRampToValueAtTime(.22*weight,at+.004);tone.gain.exponentialRampToValueAtTime(.0001,at+.18);
  osc.connect(tone).connect(master);osc.start(at);osc.stop(at+.19);
  strike.buffer=noise;filter.type='bandpass';filter.frequency.value=1700;hiss.gain.setValueAtTime(.14*weight,at);hiss.gain.exponentialRampToValueAtTime(.0001,at+.075);
  strike.connect(filter).connect(hiss).connect(master);strike.start(at);strike.stop(at+.09);
 }
 function burst(delay,duration,volume,frequency,q=.7){
  const at=start+delay,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=noise;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=q;
  gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+.004);
  gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  source.connect(filter).connect(gain).connect(master);source.start(at);source.stop(at+duration+.01);
 }
 function metal(delay=0,weight=1){
  const at=start+delay;
  for(const [frequency,level] of [[780,.042],[1170,.035],[1830,.026],[2510,.014]]){
   const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=frequency;
   gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(level*weight,at+.003);
   gain.gain.exponentialRampToValueAtTime(.0001,at+.23);
   osc.connect(gain).connect(master);osc.start(at);osc.stop(at+.24);
  }
 }
 function cannon(delay=0){
  burst(delay,.14,.45,105,.55);burst(delay+.02,.45,.25,290,.4);drum(delay,.9);
 }
 function bugle(freq,delay,duration=.18,volume=.22){
  const at=start+delay,osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  osc.type='sawtooth';osc.frequency.setValueAtTime(freq*.982,at);osc.frequency.linearRampToValueAtTime(freq,at+.035);
  filter.type='lowpass';filter.frequency.setValueAtTime(1150,at);filter.frequency.linearRampToValueAtTime(2600,at+.05);
  gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+.035);gain.gain.setValueAtTime(volume*.84,at+Math.max(.045,duration-.055));gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  osc.connect(filter).connect(gain).connect(master);osc.start(at);osc.stop(at+duration+.015);
 }
 function reveille(offset=0){
  // Short bugle arrangement of the opening Reveille call; notes use the bugle's harmonic series.
  const G=392,C=523.25,E=659.25,highG=783.99;
  const notes=[[G,0,.16],[C,.18,.16],[E,.36,.17],[highG,.55,.31],[E,.9,.16],[C,1.08,.16],[G,1.26,.26],
   [C,1.6,.12],[E,1.74,.12],[highG,1.88,.32],[E,2.24,.13],[C,2.39,.13],[G,2.54,.28],
   [G,2.91,.15],[C,3.08,.15],[E,3.25,.16],[highG,3.43,.49]];
  notes.forEach(([f,t,d])=>bugle(f,t+offset,d,.19));drum(3.94+offset,.55);
 }
 if(kind==='select'){woodenClack(0,.35,.72);return}
 if(kind==='move'||kind==='check'){
  // Movement has its own short signature for every rank, even without a capture.
  if(piece==='p'){woodenClack(0,.72,.73);woodenClack(.11,.35,.58)}
  else if(piece==='n'){woodenClack(0,.8,.67);woodenClack(.13,.63,.72);woodenClack(.27,.72,.68)}
  else if(piece==='b'){woodenClack(0,.64,.85);woodenClack(.16,.52,.95)}
  else if(piece==='r'){woodenClack(0,1.05,1.48);woodenClack(.22,.6,1.3)}
  else if(piece==='q'){woodenClack(0,.56,.72);woodenClack(.09,.65,.78);woodenClack(.18,.82,.85)}
  else {woodenClack(0,.95,1.15);woodenClack(.22,.95,1.15);woodenClack(.44,.95,1.15)}
  if(kind==='check'){woodenClack(.58,1.12,.9);woodenClack(.74,1.12,.9)}
  return;
 }
 if(kind==='capture'){
  // Six distinct field and ceremonial effects. Bugle notes belong to checkmate only.
  if(piece==='p'){
   woodenClack(0,.7,.7);woodenClack(.09,.9,.68);burst(.19,.085,.23,2400,1.1);metal(.205,.4); // rifle action
  }else if(piece==='n'){
   for(const [t,w] of [[0,.85],[.14,.62],[.27,.95],[.43,.75]])woodenClack(t,w,.75); // hoof cadence
   metal(.5,.55);
  }else if(piece==='b'){
   drum(0,.62);drum(.105,.55);drum(.205,.9);woodenClack(.35,1,.85); // captain's snare command
  }else if(piece==='r'){
   burst(0,.55,.19,115,.42);woodenClack(.07,1.05,1.55);cannon(.2); // tank tread and cannon
  }else if(piece==='q'){
   for(let i=0;i<6;i++)drum(i*.065,.36+i*.11);burst(.49,.32,.13,3900,.6);metal(.5,.7); // parade roll and cymbal
  }else{
   drum(0,1.05);drum(.2,.9);drum(.4,1.16);metal(.52,1.1);woodenClack(.68,1.2,1.35); // general's salute
  }
  return;
 }
 if(kind==='check'){
  woodenClack(0,1,1.12);woodenClack(.21,1.15,1.27);return;
 }
 if(kind==='mate'){
  drum(0,1.2);drum(.22,1.35);drum(.44,1.5);reveille(.83);return;
 }
}
function soundForMove(move){
 // Let the final position determine the cue, even for the computer's move.
 if(game.isCheckmate()){
  soundBanner('CHECKMATE · Reveille · Winner announced');
  playCue('mate');
  speak(`Checkmate. ${game.turn()==='w'?'Dress blues':'White'} wins.`);
 }
 else if(move.captured)announceCapture(move.piece);
 else if(game.isCheck()){soundBanner(`${names[move.piece]} CHECK · Wooden cue`);playCue('check',move.piece)}
 else {soundBanner(`${names[move.piece]} MOVE · Wooden cue`);playCue('move',move.piece)}
}
const square=(r,c)=>'abcdefgh'[c]+(8-r);
function legal(){return selected?game.moves({square:selected,verbose:true}):[]}
function choose(s){
 if(busy||game.isGameOver())return;
 const p=game.get(s),moves=legal();
 if(selected&&moves.some(m=>m.to===s)){
  const move=moves.find(m=>m.to===s);game.move({from:selected,to:s,promotion:$('promotion').value});soundForMove(move);selected=null;render();scheduleCPU();return;
 }
 selected=p&&p.color===game.turn()?(s===selected?null:s):null;if(selected)playCue('select');render();
}
function render(){
 const team=game.turn()==='w'?'White':'Dress blues';
 const winner=game.turn()==='w'?'Dress blues':'White';
 $('status').textContent=game.isCheckmate()?`CHECKMATE — ${winner} wins`:game.isStalemate()?'Stalemate':game.isDraw()?'Draw':busy?'Computer thinking…':`${team} to move`;
 $('end-banner').hidden=!game.isCheckmate();$('end-winner').textContent=game.isCheckmate()?`${winner.toUpperCase()} WINS`:'';
 $('detail').textContent=game.isCheckmate()?'Checkmate. Start a new game for a rematch.':game.isDraw()?'The game has ended in a draw.':game.isCheck()?'Check — protect your king.':busy?`Dress blues are choosing a move at level ${$('level').value}.`:selected?`${ranks[game.get(selected).type]} · ${names[game.get(selected).type]} on ${selected}. Choose a highlighted square.`:'Select a piece to see its legal moves.';
 const featured=selected&&game.get(selected),showPortrait=flat&&featured&&['q','k'].includes(featured.type);
 $('portrait-card').hidden=!showPortrait;
 if(showPortrait){const role=featured.type==='k'?'general':'queen',side=featured.color==='w'?'white':'blue';$('portrait-image').src=`./${role}-${side}.svg?v=regalia-24`;$('portrait-image').alt=`${side} ${role} Marine portrait`;$('portrait-title').textContent=featured.type==='k'?'Four-Star General':'Colonel Queen';$('portrait-caption').textContent=`${side==='white'?'Dress whites':'Dress blues'} · ${selected}`}
 $('undo').disabled=game.history().length===0;
 const hist=game.history();$('history').replaceChildren();for(let i=0;i<hist.length;i+=2){const li=document.createElement('li');li.textContent=hist[i].padEnd(9,' ')+(hist[i+1]||'');$('history').append(li)}$('history').scrollTop=$('history').scrollHeight;$('count').textContent=`${hist.length} half-moves`;
 const destinations=new Set(legal().map(m=>m.to)), last=game.history({verbose:true}).at(-1), focus=document.activeElement?.dataset.square;
 $('flat').replaceChildren();for(let i=0;i<64;i++){const r=flipped?7-Math.floor(i/8):Math.floor(i/8),c=flipped?7-i%8:i%8,s=square(r,c),p=game.get(s),b=document.createElement('button');b.className=`sq ${(r+c)%2?'dark':'light'}${s===selected?' selected':''}${destinations.has(s)?' legal':''}${last&&(last.from===s||last.to===s)?' last':''}`;b.dataset.square=s;b.setAttribute('aria-label',`${s}: ${p?`${p.color==='w'?'White':'Dress blue'} ${names[p.type]}, ${ranks[p.type]}`:'empty'}${destinations.has(s)?', legal move':''}`);b.setAttribute('aria-pressed',String(s===selected));if(p){const span=document.createElement('span');span.className=`piece ${p.color} type-${p.type}`;const silhouette=document.createElement('span');silhouette.className='silhouette';silhouette.textContent=glyph[p.type];const rank=document.createElement('span');rank.className='rank';rank.textContent=rankMarks[p.type];span.append(silhouette,rank);b.append(span)}const caption=document.createElement('small');caption.textContent=s;b.append(caption);b.onclick=()=>choose(s);b.onkeydown=e=>{const d={ArrowRight:1,ArrowLeft:-1,ArrowDown:8,ArrowUp:-8}[e.key];if(d){e.preventDefault();$('flat').children[Math.max(0,Math.min(63,i+d))].focus()}};$('flat').append(b)}
 if(flat&&focus)$('flat').querySelector(`[data-square="${focus}"]`)?.focus();redraw3D();
}
function scheduleCPU(){
 if($('mode').value!=='cpu'||game.turn()!=='b'||game.isGameOver())return;
 busy=true;render();const id=++aiJob;
 timer=setTimeout(()=>{
  timer=null;const fallback=()=>game.moves({verbose:true})[0];
  const finish=choice=>{if(id!==aiJob)return;aiWorker?.terminate();aiWorker=null;busy=false;
   if(game.turn()==='b'&&!game.isGameOver()){const candidate=choice||fallback();if(candidate){const move=game.move({from:candidate.from,to:candidate.to,promotion:candidate.promotion||'q'});soundForMove(move)}}render()};
  try{const worker=new Worker('./ai-worker.mjs?v=levels-1',{type:'module'});aiWorker=worker;
   worker.onmessage=e=>{if(e.data.id!==id)return;if(e.data.error)console.warn('Computer search:',e.data.error);finish(e.data.move)};
   worker.onerror=e=>{console.warn('Computer search unavailable',e);finish(null)};
   worker.postMessage({id,fen:game.fen(),level:Number($('level').value)});
  }catch(e){console.warn('Computer worker unavailable',e);finish(null)}
 },240);
}
function cancel(){clearTimeout(timer);timer=null;aiJob++;aiWorker?.terminate();aiWorker=null;busy=false;selected=null;if('speechSynthesis' in window)speechSynthesis.cancel()}
function setView(){ $('canvas').hidden=flat;$('flat').hidden=!flat;$('stage').classList.toggle('flat-mode',flat);$('view').textContent=flat?'Use 3D board':'Use 2D board';$('instructions').textContent=flat?'Select a piece, then a highlighted square. Arrow keys navigate the board.':'Select a piece, then a highlighted square. Drag to rotate the 3D board and scroll to zoom.';sizeFlatBoard();render() }
let has3D=false;
 $('view').onclick=()=>{if(has3D){flat=!flat;setView()}};
 $('new').onclick=()=>{if(game.history().length&&!confirm('Start a new game? The current match will be cleared.'))return;cancel();game.reset();render()};
 $('undo').onclick=()=>{cancel();game.undo();if($('mode').value==='cpu'&&game.turn()==='b')game.undo();render()};
 $('mode').onchange=()=>{cancel();$('level').disabled=$('mode').value!=='cpu';render();scheduleCPU()};
 $('level').onchange=()=>{cancel();render();scheduleCPU()};
 $('flip').onclick=()=>{flipped=!flipped;cameraReset();render()};$('reset-view').onclick=()=>cameraReset();
render();
try {
 const { createPresentation } = await import('./presentation.js?v=uniform-15');
 const view3D = await createPresentation({ stage: $('stage'), host: $('canvas'), game, choose, legal, selection:()=>selected, isFlat:()=>flat, isFlipped:()=>flipped, ranks, rankMarks });
 redraw3D=view3D.redraw; cameraReset=view3D.reset;
 for (const [id,fn] of Object.entries({'showcase':view3D.showcase,'overhead':view3D.overhead,'zoom-in':()=>view3D.zoom(.82),'zoom-out':()=>view3D.zoom(1.22),'inspect':()=>view3D.inspect(selected)})) $(id).onclick=fn;
 has3D=true;$('loading').hidden=true;render();
} catch(e) {
 console.error('3D board unavailable',e);flat=true;$('loading').hidden=true;$('view').disabled=true;$('reset-view').disabled=true;setView();$('instructions').textContent='3D is unavailable on this device. The full game works on this 2D board.';
}
