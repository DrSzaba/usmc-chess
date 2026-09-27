import { Chess } from '../../vendor/chess.js';

const VALUE={p:100,n:320,b:340,r:510,q:930,k:0};
const SETTINGS={
 1:{depth:0,time:100},2:{depth:1,time:120},3:{depth:1,time:180},4:{depth:2,time:300},
 5:{depth:2,time:450},6:{depth:3,time:650},7:{depth:3,time:900},8:{depth:4,time:1400},
 9:{depth:4,time:1900},10:{depth:5,time:2800}
};
const ABORT=Symbol('search time');
export function chooseMove(fen,level=4){
 const game=new Chess(fen),setting=SETTINGS[Math.max(1,Math.min(10,Number(level)||4))];
 const all=game.moves({verbose:true});if(!all.length)return null;
 if(level===1)return compact(all[Math.floor(Math.random()*all.length)]);
 const deadline=Date.now()+setting.time,opening=Number(fen.split(' ')[5]||1)<16;let nodes=0,best=all[0],completed=0;
 function scorePosition(){
  let score=0;
  game.board().forEach((row,r)=>row.forEach((p,c)=>{if(!p)return;
   let v=VALUE[p.type],center=3.5-Math.abs(c-3.5),advance=p.color==='w'?6-r:r-1;
   if(level>=5){
    if(p.type==='p')v+=advance*5+center*3;
    if(p.type==='n'||p.type==='b')v+=center*9+(3.5-Math.abs(r-3.5))*5;
    if(p.type==='r')v+=advance*2;
    if(p.type==='q')v+=center*2;
    if(p.type==='k'&&opening)v-=center*7;
   }else if(p.type==='p')v+=advance*2;
   score+=(p.color==='b'?1:-1)*v;
  }));
  return game.turn()==='b'?score:-score;
 }
 function ordered(moves){return moves.sort((a,b)=>{
  const priority=m=>(m.captured?10*VALUE[m.captured]-VALUE[m.piece]:0)+(m.promotion?VALUE[m.promotion]:0)+(m.san.includes('+')?70:0);
  return priority(b)-priority(a);
 })}
 function quiesce(alpha,beta,left){
  if((++nodes&127)===0&&Date.now()>deadline)throw ABORT;
  if(game.isCheckmate())return -100000;
  if(game.isDraw())return 0;
  const checked=game.isCheck(),stand=scorePosition();if(left<=-2||left<=0&&!checked)return stand;
  if(!checked){if(stand>=beta)return beta;alpha=Math.max(alpha,stand)}
  for(const m of ordered(game.moves({verbose:true}).filter(m=>checked||m.captured||m.promotion))){
   game.move(m);let value;try{value=-quiesce(-beta,-alpha,left-1)}finally{game.undo()}
   if(value>=beta)return beta;alpha=Math.max(alpha,value);
  }
  return alpha;
 }
 function search(depth,alpha,beta,ply){
  if((++nodes&127)===0&&Date.now()>deadline)throw ABORT;
  if(game.isCheckmate())return -100000+ply;
  if(game.isDraw())return 0;
  if(depth===0)return level>=7?quiesce(alpha,beta,2):scorePosition();
  for(const m of ordered(game.moves({verbose:true}))){
   game.move(m);let value;try{value=-search(depth-1,-beta,-alpha,ply+1)}finally{game.undo()}
   if(value>=beta)return beta;alpha=Math.max(alpha,value);
  }
  return alpha;
 }
 for(let depth=1;depth<=setting.depth;depth++){
  let top=-Infinity,candidate=best;
  try{
   const moves=ordered([...all]);if(depth>1)moves.sort((a,b)=>a.from===best.from&&a.to===best.to?-1:b.from===best.from&&b.to===best.to?1:0);
   for(const m of moves){
    if(Date.now()>deadline)throw ABORT;
    game.move(m);let value;try{value=-search(depth-1,-Infinity,-top,1)}finally{game.undo()}
    // The easier levels sometimes favor a reasonable, less accurate move.
    if(level<=3)value+=(Math.random()-.5)*(level===2?140:35);
    if(value>top){top=value;candidate=m}
   }
   best=candidate;completed=depth;
  }catch(e){if(e!==ABORT)throw e;break}
 }
 return {...compact(best),searchedDepth:completed,nodes};
}
function compact(move){return {from:move.from,to:move.to,promotion:move.promotion||'q'}}
if(typeof self!=='undefined')self.onmessage=e=>{
 const {fen,level,id}=e.data;
 try{self.postMessage({id,move:chooseMove(fen,level)})}
 catch(error){self.postMessage({id,error:String(error)})}
};
