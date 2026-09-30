import { lerp, rand } from './util.js';
import { CFG, COL } from './config.js';
import { C, G, T } from './state.js';
import { tmpC, tmpM } from './assets.js';
import { arrows, burst, enMesh, ENN, pjMesh, PJN, shots } from './fx.js';
import { queueKill, takeDebt } from './crowd.js';
import { bossAI, bossDie } from './boss.js';
import { banner, popup } from './hud.js';

/* ---------- combat ---------- */
export function explode(b){ if(!b.alive) return; b.alive=false; b.g.visible=false; burst(b.x,1,b.z,0xff8a3c,26,11,.9); burst(b.x,1,b.z,0x333333,10,6,1.1); G.shake=Math.max(G.shake,.45);
  const r2=2.4*2.4; for(let t=0;t<3;t++) for(let i=0;i<C.units[t].length;i++){ const u=C.units[t][i]; const dx=u.wx-b.x, dz=u.wz-b.z; if(dx*dx+dz*dz<r2) queueKill(t,i,'hit'); }
  for(const w of T.walls) if(w.alive&&Math.abs(w.z-b.z)<5) damage(w,60);
  for(const o of T.barrels) if(o.alive&&o!==b&&Math.hypot(o.x-b.x,o.z-b.z)<3.4) setTimeout(()=>explode(o),120);
}
function meleeDPS(){ return C.n[0]*CFG.melee[0]+C.n[1]*CFG.melee[1]+C.n[2]*CFG.melee[2]; }
function targets(){
  const list=[]; const zmin=C.z+C.front*.3, zmax=C.z+CFG.range;
  const add=(o,prio)=>{ if(o&&o.alive&&o.z>zmin&&o.z<zmax) list.push([o,prio]); };
  for(const b of T.barrels) add(b,2); for(const w of T.walls) add(w,0);
  if(T.fort&&!T.fort.breached){ for(const a of T.fort.archers) add(a,1.4); add(T.fort.door,0); }
  if(T.boss&&T.boss.alive){ for(const w of T.boss.weak) add(w,1.2); add(T.boss,0); }
  return list;
}
function pickTarget(){ let best=null,bd=Infinity; for(const [o,p] of targets()){ const d=(o.z-C.z)-p*12+Math.abs(o.x-C.x)*.3; if(d<bd){ bd=d; best=o; } } return best; }
export function combat(dt){
  C.volleyT-=dt;
  if(C.volleyT<=0&&(C.n[1]+C.n[2])>0){ C.volleyT=CFG.volley; const tgt=pickTarget();
    if(tgt){ const u1=C.units[1], u2=C.units[2];
      const shots1=u1.length?Math.min(6,1+Math.floor(u1.length/8)):0, shots2=u2.length?Math.min(4,1+Math.floor(u2.length/5)):0;
      const d1=C.n[1]*CFG.ranged[1]*CFG.volley, d2=C.n[2]*CFG.ranged[2]*CFG.volley;
      for(let s=0;s<shots1;s++){ const u=u1[(rand()*u1.length)|0]; fire(u.wx,u.y+.8,u.wz,tgt,d1/shots1,false); }
      for(let s=0;s<shots2;s++){ const u=u2[(rand()*u2.length)|0]; fire(u.wx,u.y+1.2,u.wz,tgt,d2/shots2,true); } } }
  // melee on whatever is blocking the crowd
  if(C.engaged){ const d=meleeDPS()*dt; damage(C.engaged,d); if(rand()<dt*14) burst(C.x+(rand()-.5)*Math.min(C.radius*2,10),1+rand()*1.5,C.z+C.front+.3,0xffffff,2,4,.35); }
  // fortress archers
  const F=T.fort;
  if(F&&!F.breached&&F.z-C.z<52){ for(const a of F.archers){ if(!a.alive) continue; a.cd-=dt; if(a.cd<=0){ a.cd=1.3+rand()*1.3; enemyShot(a.x,a.y,a.z); } } }
  // boss
  const B=T.boss; if(B&&B.alive&&B.z-C.z<62) bossAI(B,dt);
  if(B&&B.alive&&C.engaged===B) takeDebt(2+B.lv*2.5,dt);
  updateShots(dt); updateArrows(dt);
}
function fire(x,y,z,tgt,dmg,splash){ if(shots.length>=PJN) return; shots.push({x,y,z,tgt,tx:tgt.x,ty:tgt.y,tz:tgt.z,dmg,splash,life:2}); }
export function updateShots(dt){
  for(let i=shots.length-1;i>=0;i--){ const s=shots[i]; if(s.tgt.alive){ s.tx=s.tgt.x; s.ty=s.tgt.y; s.tz=s.tgt.z; }
    const dx=s.tx-s.x, dy=s.ty-s.y, dz=s.tz-s.z, d=Math.hypot(dx,dy,dz), v=52*dt; s.life-=dt;
    if(d<=v+.3||s.life<=0){ if(s.tgt.alive&&s.life>0){ damage(s.tgt,s.dmg); if(s.splash){ burst(s.tx,s.ty,s.tz,0xffd23f,5,6,.5); for(const [o] of targets()){ if(o!==s.tgt&&Math.hypot(o.x-s.tx,o.z-s.tz)<CFG.splash) damage(o,s.dmg*.5); } } else if(rand()<.3) burst(s.tx,s.ty,s.tz,0x9ff5ea,2,3,.3); }
      shots.splice(i,1); continue; }
    s.x+=dx/d*v; s.y+=dy/d*v; s.z+=dz/d*v; }
  let k=0; for(const s of shots){ tmpM.makeScale(s.splash?1.6:1,s.splash?1.6:1,s.splash?1.6:1); tmpM.setPosition(s.x,s.y,s.z); pjMesh.setMatrixAt(k,tmpM); pjMesh.setColorAt(k,tmpC.setHex(s.splash?0xffd23f:0x7ff2e2)); k++; }
  for(let i=k;i<PJN;i++){ tmpM.makeScale(0,0,0); pjMesh.setMatrixAt(i,tmpM); } pjMesh.instanceMatrix.needsUpdate=true; if(pjMesh.instanceColor) pjMesh.instanceColor.needsUpdate=true;
}
function enemyShot(x,y,z){ if(arrows.length>=ENN) return; const all=C.units[0].length?C.units[0]:C.units[1].length?C.units[1]:C.units[2]; if(!all.length) return;
  const u=all[(rand()*all.length)|0]; const dur=1.0+rand()*.3; arrows.push({sx:x,sy:y,sz:z,tx:u.wx+(rand()-.5)*.8,tz:u.wz+C.vz*dur+(rand()-.5)*.8,t:0,dur,x,y,z}); }
export function updateArrows(dt){
  for(let i=arrows.length-1;i>=0;i--){ const a=arrows[i]; a.t+=dt; const p=Math.min(1,a.t/a.dur);
    a.x=lerp(a.sx,a.tx,p); a.z=lerp(a.sz,a.tz,p); a.y=lerp(a.sy,.3,p)+Math.sin(p*Math.PI)*4;
    if(p>=1){ burst(a.x,.4,a.z,0xff5a3c,5,4,.4); const r2=1.1*1.1;
      for(let t=0;t<3;t++) for(let j=0;j<C.units[t].length;j++){ const u=C.units[t][j]; if(u.y>1) continue; const dx=u.wx-a.x, dz=u.wz-a.z; if(dx*dx+dz*dz<r2) queueKill(t,j,'hit'); }
      arrows.splice(i,1); } }
  let k=0; for(const a of arrows){ tmpM.makeTranslation(a.x,a.y,a.z); enMesh.setMatrixAt(k++,tmpM); }
  for(let i=k;i<ENN;i++){ tmpM.makeScale(0,0,0); enMesh.setMatrixAt(i,tmpM); } enMesh.instanceMatrix.needsUpdate=true;
}
function damage(o,d){
  if(!o||!o.alive||d<=0) return;
  switch(o.kind){
    case 'barrel': o.hp-=d; if(o.hp<=0) explode(o); break;
    case 'wall': o.hp-=d; o.flash=.12; if(o.hp<=0){ o.alive=false; o.g.visible=false; burst(o.x,1.5,o.z,0x8a7866,40,12,1); burst(o.x,1.5,o.z,0x5d646f,14,8,1); G.shake=.4; popup('Wall down','#fff',1); } break;
    case 'archer': o.hp-=d; if(o.hp<=0){ o.alive=false; o.fall=.01; burst(o.x,o.y,o.z,COL.enemy,10,6); } break;
    case 'door': o.hp-=d; if(o.hp<=0){ o.alive=false; breach(); } break;
    case 'weak': { const B=T.boss; o.hp-=d*2; B.hp-=d*.6; B.flash=.1; if(o.hp<=0){ o.alive=false; o.m.visible=false; B.hp-=B.max*.12; B.cd+=1.6; burst(o.x,o.y,o.z,0xffd23f,30,10,1); G.shake=.5; popup('Weak point broken','#ffd23f',1); } break; }
    case 'boss': o.hp-=d; o.flash=.08; break;
  }
  if(T.boss&&T.boss.alive&&T.boss.hp<=0) bossDie();
}
function breach(){ const F=T.fort; F.breached=true; F.sink=.001; for(const a of F.archers){ if(a.alive){ a.alive=false; a.fall=.01; } }
  burst(0,2,F.z,0x6b4a2e,50,14,1.2); burst(0,3,F.z,0x9d8f80,40,12,1.2); G.shake=.8; banner('Gate breached','Now take down the Warden'); }
