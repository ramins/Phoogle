import * as THREE from 'three';
import { clamp, IS_TOUCH, lerp, rand } from './util.js';
import { C, G, T } from './state.js';
import { basic } from './assets.js';
import { burst } from './fx.js';
import { queueKill } from './crowd.js';
import { banner, hint } from './hud.js';

/* ---------- boss ---------- */
export function bossAI(B,dt){
  B.cd-=dt;
  for(const w of B.weak){ w.x=B.g.position.x+w.ox; w.y=w.oy+B.body.position.y; w.z=B.z+w.oz; }
  if(!B.atk&&B.cd<=0){ const kind=(B.lastAtk==='slam'&&rand()<.7)||rand()<.35?'wave':'slam'; B.lastAtk=kind;
    if(kind==='slam'){ const r=3+B.lv*.3; const ring=new THREE.Mesh(new THREE.RingGeometry(r-.35,r,40),basic(0xe0483f,{transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false}));
      ring.material.userData.own=true; ring.rotation.x=-Math.PI/2; const fill=new THREE.Mesh(new THREE.CircleGeometry(r,40),basic(0xe0483f,{transparent:true,opacity:.12,depthWrite:false})); fill.material.userData.own=true; fill.rotation.x=-Math.PI/2;
      const tx=clamp(C.x+(rand()-.5)*3,-10,10), tz=Math.min(C.z+C.front*.3+(rand()-.3)*2,B.z-5);
      ring.position.set(tx,.06,tz); fill.position.set(tx,.05,tz); T.group.add(ring); T.group.add(fill);
      B.atk={kind,t:0,x:tx,z:tz,r,ring,fill,dur:1.25-B.lv*.08}; }
    else { const ring=new THREE.Mesh(new THREE.RingGeometry(.1,1,64),basic(0xffd23f,{transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false})); ring.material.userData.own=true; ring.rotation.x=-Math.PI/2; ring.visible=false; ring.position.set(0,.08,B.z); T.group.add(ring);
      B.atk={kind,t:0,R:0,prevR:0,ring,wind:.85}; if(!G.hintShown.wave){ G.hintShown.wave=1; hint(IS_TOUCH?'Shockwave: tap Jump as the ring reaches your squad':'Shockwave: press Space as the ring reaches your squad'); } } }
  const A=B.atk; if(!A) return;
  A.t+=dt;
  if(A.kind==='slam'){ const p=A.t/A.dur; A.ring.material.opacity=.25+.6*p; A.fill.material.opacity=.1+.25*p; const s=.3+.7*Math.min(1,p*1.4); A.fill.scale.set(s,s,s);
    const arm=B.arms[A.x<0?1:0]; arm.rotation.x=-lerp(0,2.2,Math.min(1,p*1.3));
    if(A.t>=A.dur){ const r2=A.r*A.r; for(let t=0;t<3;t++) for(let i=0;i<C.units[t].length;i++){ const u=C.units[t][i]; const dx=u.wx-A.x, dz=u.wz-A.z; if(dx*dx+dz*dz<r2) queueKill(t,i,'hit'); }
      burst(A.x,.5,A.z,0x8a7866,30,12,1); G.shake=.7; arm.rotation.x=0; endAtk(B); } }
  else { if(A.t<A.wind){ B.body.position.y=-Math.sin(A.t/A.wind*Math.PI)*.8; return; } B.body.position.y=0; A.ring.visible=true;
    A.prevR=A.R; A.R+=(15+B.lv*1.5)*dt; const R=A.R; A.ring.scale.set(R,R,1); A.ring.geometry.dispose(); A.ring.geometry=new THREE.RingGeometry(Math.max(.01,1-.9/R),1,64);
    for(let t=0;t<3;t++) for(let i=0;i<C.units[t].length;i++){ const u=C.units[t][i]; if(u.y>.45) continue; const d=Math.hypot(u.wx-B.x,u.wz-B.z); if(d>A.prevR-.3&&d<=R+.3) queueKill(t,i,'hit'); }
    if(R>45) endAtk(B); }
}
function endAtk(B){ const A=B.atk; for(const m of [A.ring,A.fill]) if(m){ T.group.remove(m); m.geometry.dispose(); m.material.dispose(); } B.atk=null; B.cd=Math.max(1.4,3.4-B.lv*.45)+rand()*1.2; }
export function bossDie(){ const B=T.boss; if(!B.alive) return; B.alive=false; B.dead=.001; if(B.atk) endAtk(B); for(let i=0;i<5;i++) burst((rand()-.5)*6,4+rand()*6,B.z,i%2?0xffd23f:0x5b4d66,30,14,1.4); G.shake=1.1; G.state='won'; G.stateT=0; banner('Keep taken','The Warden has fallen'); }
