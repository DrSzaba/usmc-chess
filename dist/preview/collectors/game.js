import { Chess } from '../../vendor/chess.js';
const $=id=>document.getElementById(id), game=new Chess();
const names={p:'Pawn',r:'Rook',n:'Knight',b:'Bishop',q:'Queen',k:'King'},ranks={p:'Lance Corporal',n:'Sergeant',b:'Second Lieutenant',r:'Master Sergeant',q:'Colonel',k:'Four-Star General'},rankMarks={p:'LCPL',n:'SGT',b:'2LT',r:'MSGT',q:'COL',k:'4★ GEN'},glyph={p:'♟',r:'♜',n:'♞',b:'♝',q:'♛',k:'♚'};
let selected=null, flipped=false, flat=false, busy=false, timer=null, redraw3D=()=>{}, cameraReset=()=>{};
let audioContext=null,soundEnabled=true;
const soundButton=$('sound'),testButton=$('sound-test'),soundState=$('sound-state');
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
 if(soundEnabled){await unlockAudio();playCue('test')}
};
testButton.onclick=()=>{if(!soundEnabled){soundEnabled=true;soundButton.textContent='Sound on';soundButton.setAttribute('aria-pressed','true')}playCue('test')};
async function playCue(kind){
 if(!soundEnabled)return;
 const ctx=await unlockAudio();if(!ctx)return;
 const now=ctx.currentTime+.012;
 const tone=(freq,at,duration,level=.20,wave='triangle')=>{
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=wave;osc.frequency.setValueAtTime(freq,now+at);
  gain.gain.setValueAtTime(.0001,now+at);
  gain.gain.exponentialRampToValueAtTime(level,now+at+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,now+at+duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now+at);osc.stop(now+at+duration+.015);
 };
 if(kind==='test'){tone(523,0,.25,.24);tone(659,.27,.25,.24);tone(784,.54,.35,.25);return}
 if(kind==='select'){tone(520,0,.09,.12);return}
 if(kind==='move'){tone(285,0,.15,.22);tone(175,.06,.18,.15);return}
 if(kind==='capture'){tone(180,0,.24,.24,'sawtooth');tone(100,.07,.3,.20);tone(510,.14,.12,.11);return}
 if(kind==='check'){tone(260,0,.22,.22,'sawtooth');tone(390,.18,.26,.22);tone(520,.36,.32,.24);return}
 if(kind==='mate'){tone(196,0,.40,.23,'sawtooth');tone(294,.23,.45,.24);tone(392,.45,.55,.25);tone(588,.70,.75,.24)}
}
function soundForMove(move){
 // Let the final position determine the cue, even for the computer's move.
 if(game.isCheckmate())playCue('mate');
 else if(game.isCheck())playCue('check');
 else playCue(move.captured?'capture':'move');
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
function scheduleCPU(){if($('mode').value!=='cpu'||game.turn()!=='b'||game.isGameOver())return;busy=true;render();timer=setTimeout(()=>{try{let best=-Infinity,move=null;for(const m of game.moves({verbose:true})){game.move(m);const v=search(1,-Infinity,Infinity);game.undo();if(v>best){best=v;move=m}}if(move){game.move(move);soundForMove(move)}}finally{busy=false;timer=null;render()}},420)}
function cancel(){clearTimeout(timer);timer=null;busy=false;selected=null}
function setView(){ $('canvas').hidden=flat;$('flat').hidden=!flat;$('view').textContent=flat?'Use 3D board':'Use 2D board';$('instructions').textContent=flat?'Select a piece, then a highlighted square. Arrow keys navigate the board.':'Select a piece, then a highlighted square. Drag to rotate the 3D board and scroll to zoom.';render() }
let has3D=false;
 $('view').onclick=()=>{if(has3D){flat=!flat;setView()}};
 $('new').onclick=()=>{if(game.history().length&&!confirm('Start a new game? The current match will be cleared.'))return;cancel();game.reset();render()};
 $('undo').onclick=()=>{cancel();game.undo();if($('mode').value==='cpu'&&game.turn()==='b')game.undo();render()};
 $('mode').onchange=()=>{cancel();render();scheduleCPU()};
 $('flip').onclick=()=>{flipped=!flipped;cameraReset();render()};$('reset-view').onclick=()=>cameraReset();
render();
try {
 const { createPresentation } = await import('./presentation.js?v=tyrol-8');
 const view3D = await createPresentation({ stage: $('stage'), host: $('canvas'), game, choose, legal, selection:()=>selected, isFlat:()=>flat, isFlipped:()=>flipped, ranks, rankMarks });
 redraw3D=view3D.redraw; cameraReset=view3D.reset;
 for (const [id,fn] of Object.entries({'showcase':view3D.showcase,'overhead':view3D.overhead,'zoom-in':()=>view3D.zoom(.82),'zoom-out':()=>view3D.zoom(1.22),'inspect':()=>view3D.inspect(selected)})) $(id).onclick=fn;
 has3D=true;$('loading').hidden=true;render();
} catch(e) {
 console.error('3D board unavailable',e);flat=true;$('loading').hidden=true;$('view').disabled=true;$('reset-view').disabled=true;setView();$('instructions').textContent='3D is unavailable on this device. The full game works on this 2D board.';
}
