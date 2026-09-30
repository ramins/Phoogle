import { rand } from './util.js';
import { CFG, COL } from './config.js';
import { C, G } from './state.js';
import { burst } from './fx.js';

/* ================= crowd ================= */
function newUnit(ox,oz){ return {ox,oz,sx:0,sz:0,y:0,off:0,dead:false,ph:rand()*6.28,yaw:(rand()-.5)*.25,wx:0,wz:0}; }
export const total=()=>C.n[0]+C.n[1]+C.n[2];
export const hpPool=()=>C.n[0]+C.n[1]*CFG.tierHP[1]+C.n[2]*CFG.tierHP[2];
export function resetCrowd(n,z){ C.n=n.slice(); C.units=[[],[],[]]; C.fallers=[[],[],[]]; C.x=0; C.z=z; C.prevZ=z; C.vz=0; C.jumpT=null; C.engaged=null; C.hpDebt=0; C.speed=CFG.baseSpeed; sync('none'); for(const a of C.units) for(const u of a){ u.ox=(rand()-.5)*2; u.oz=(rand()-.5)*2; } }
export function sync(mode){
  for(let t=0;t<3;t++){ const arr=C.units[t], target=Math.min(C.n[t],CFG.cap[t]);
    while(arr.length>target){ const u=arr.pop(); if(mode==='merge'){ if(rand()<.35) burst(C.x+u.ox,.8,C.z+u.oz,0xffe066,2,3,.5); } else if(mode!=='none') burst(C.x+u.ox,.6+u.y,C.z+u.oz,COL.tier[t],3,4); }
    while(arr.length<target){ arr.push(newUnit(C.spawnOX+(rand()-.5)*1.4, C.spawnOZ+(rand()-.5)*1.4)); } }
}
export function removeHP(a){ a=Math.round(a); let guard=0;
  while(a>0 && total()>0 && guard++<100000){ if(C.n[0]>0){ const k=Math.min(C.n[0],a); C.n[0]-=k; a-=k; } else if(C.n[1]>0){ C.n[1]--; C.n[0]+=CFG.mergeN; } else if(C.n[2]>0){ C.n[2]--; C.n[1]+=CFG.mergeN; } } }
export function capUnits(){ const tt=total(); if(tt>CFG.maxUnits){ const f=CFG.maxUnits/tt; for(let t=0;t<3;t++) C.n[t]=Math.floor(C.n[t]*f); } }
const KQ=[[],[],[]];
export function queueKill(t,i,mode){ const u=C.units[t][i]; if(!u||u.dead) return; u.dead=true; KQ[t].push({i,mode}); }
export function processKills(){
  for(let t=2;t>=0;t--){ const q=KQ[t]; if(!q.length) continue; q.sort((a,b)=>b.i-a.i);
    for(const k of q) killUnit(t,k.i,k.mode); q.length=0; }
}
function killUnit(t,i,mode){
  const arr=C.units[t], u=arr[i]; if(!u) return;
  const n=C.n[t]; if(n<=0){ return; }
  const w=Math.min(n,Math.max(1,Math.round(n/Math.max(1,arr.length))));
  C.n[t]-=w; if(mode==='hit'&&t>0) C.n[t-1]+=3*w;
  const wx=C.x+u.ox, wz=C.z+u.oz;
  if(mode==='fall'){ const f=C.fallers[t]; if(f.length<100) f.push({x:wx,y:u.y,z:wz,vy:0,r:0,life:1.4}); }
  else burst(wx,.6+u.y,wz,COL.tier[t],t===0?5:10,5);
  if(Math.min(C.n[t],CFG.cap[t])<arr.length){ arr[i]=arr[arr.length-1]; arr.pop();
    if(mode==='hit'&&t>0){ const a2=C.units[t-1]; for(let j=0;j<3&&a2.length<Math.min(C.n[t-1],CFG.cap[t-1]);j++) a2.push(newUnit(u.ox+(rand()-.5)*.7,u.oz+(rand()-.5)*.7)); } }
  else { u.dead=false; u.off=0; if(mode==='fall'){ u.ox=u.sx; u.oz=u.sz; } }
}
const GOLDEN=Math.PI*(3-Math.sqrt(5));
export function computeSlots(){ let k=0,cum=0;
  for(let t=2;t>=0;t--){ const arr=C.units[t], a=CFG.tierArea[t];
    for(let i=0;i<arr.length;i++){ const r=CFG.packC*Math.sqrt(cum+a*.5), th=k*GOLDEN; arr[i].sx=Math.cos(th)*r; arr[i].sz=Math.sin(th)*r; cum+=a; k++; } }
  return CFG.packC*Math.sqrt(cum)+.35;
}
export function unitY(u){ if(C.jumpT===null) return 0; const tau=C.jumpT-(C.jumpFront-u.oz)/C.jumpVz; if(tau<=0||tau>=C.air) return 0; return CFG.jumpV*tau-.5*CFG.gravity*tau*tau; }
export function tryJump(){ if(G.state!=='play'||C.jumpT!==null) return; C.jumpT=0; C.jumpFront=C.front; C.jumpVz=Math.max(C.vz,3); }
export function takeDebt(rate,dt){ C.hpDebt+=rate*dt; if(C.hpDebt>=1){ const k=Math.floor(C.hpDebt); C.hpDebt-=k; removeHP(k); } }
