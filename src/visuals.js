import * as THREE from 'three';
import { lerp, rand } from './util.js';
import { C, G, T } from './state.js';
import { camera, sun, voidMesh } from './render.js';
import { tmpE, tmpM, tmpQ, tmpS, tmpV } from './assets.js';
import { burst, UM } from './fx.js';

/* ================= visuals ================= */
export function animateWorld(dt){
  for(const s of T.saws){ s.x=s.cx+Math.sin(G.time*s.spd+s.ph)*s.amp; s.g.position.x=s.x; s.d.rotation.y+=dt*14; }
  for(const p of T.pends){ const a=Math.sin(G.time*p.spd+p.ph)*p.amp; p.piv.rotation.z=a; p.bx=p.cx+Math.sin(a)*p.len; p.by=p.top-Math.cos(a)*p.len; }
  for(const s of T.crumbles){ if(s.fallAt&&!s.gone&&G.time>=s.fallAt){ s.gone=true; burst(0,-.2,(s.z0+s.z1)/2,0xb08f63,6,4,.6); }
    if(s.gone&&s.meshes.length){ s.fallV+=30*dt; for(const m of s.meshes){ m.position.y-=s.fallV*dt; m.rotation.x+=dt*.6; } if(s.meshes[0].position.y<-40){ for(const m of s.meshes) m.visible=false; s.meshes=[]; } }
    else if(s.fallAt&&!s.gone){ const w=Math.sin(G.time*60)*.04; for(const m of s.meshes) m.position.x=w; } }
  for(const g of T.gates){ if(g.anim>0){ g.anim=Math.max(0,g.anim-dt*2); g.pm.opacity=.42*g.anim; g.lab.scale.setScalar(1+(1-g.anim)*.6); g.lab.material.opacity=g.anim; if(g.anim===0) g.g.visible=false; }
    else if(g.anim<0){ g.anim=Math.min(0,g.anim+dt*2); g.pm.opacity=.14; g.lab.material.opacity=.35; } }
  for(const w of T.walls){ if(w.flash>0){ w.flash-=dt; w.g.position.x=(rand()-.5)*.12; } else w.g.position.x=0; }
  const F=T.fort; if(F){ for(const a of F.archers){ if(a.fall>0&&a.m.visible){ a.fall+=dt; a.m.rotation.x-=dt*3; a.m.position.y-=dt*a.fall*14; a.m.position.z+=dt*2; if(a.m.position.y<-4) a.m.visible=false; } else if(a.alive){ a.m.position.y=5.2+Math.abs(Math.sin(G.time*3+a.x))*.1; } }
    if(F.sink>0&&F.wg.position.y>-8){ F.sink+=dt; F.wg.position.y-=dt*F.sink*3; F.wg.position.x=(rand()-.5)*.15; } }
  const B=T.boss; if(B){ if(B.alive){ B.head.rotation.y=Math.sin(G.time*.8)*.15; B.g.position.x=Math.sin(G.time*.5)*.6; if(!B.atk){ B.arms[0].rotation.x=Math.sin(G.time*1.6)*.12; B.arms[1].rotation.x=-Math.sin(G.time*1.6)*.12; }
      B.x=B.g.position.x; if(B.flash>0){ B.flash-=dt; B.body.position.x=(rand()-.5)*.2; } else B.body.position.x=0;
      for(const w of B.weak){ if(w.alive){ const s=.7+Math.sin(G.time*6+w.ox)*.08; w.m.scale.setScalar(s); } } }
    else if(B.dead>0&&B.g.position.y>-20){ B.dead+=dt; B.g.position.y-=dt*B.dead*2.4; B.g.rotation.x-=dt*.35; } }
}
export function renderCrowd(dt){
  const run=C.vz>.5, cheer=G.state==='won';
  for(let t=0;t<3;t++){ const m=UM[t], arr=C.units[t]; let k=0; const lean=-C.steerVis*.25;
    for(const u of arr){ let y=u.y; if(run&&y===0) y+=Math.abs(Math.sin(G.time*13+u.ph))*.13; if(cheer) y+=Math.max(0,Math.sin(G.time*9+u.ph))*.6;
      tmpE.set(run?.08:0,u.yaw,lean); tmpQ.setFromEuler(tmpE); tmpV.set(C.x+u.ox,y,C.z+u.oz); tmpS.set(1,1,1); tmpM.compose(tmpV,tmpQ,tmpS); m.setMatrixAt(k++,tmpM); }
    const fl=C.fallers[t];
    for(let i=fl.length-1;i>=0;i--){ const f=fl[i]; f.life-=dt; f.vy-=26*dt; f.y+=f.vy*dt; f.r+=dt*4; if(f.life<=0){ fl.splice(i,1); continue; } }
    for(const f of fl){ if(k>=m.instanceMatrix.count) break; tmpE.set(f.r,0,f.r*.4); tmpQ.setFromEuler(tmpE); tmpV.set(f.x,f.y,f.z); tmpS.set(1,1,1); tmpM.compose(tmpV,tmpQ,tmpS); m.setMatrixAt(k++,tmpM); }
    m.count=k; m.instanceMatrix.needsUpdate=true; }
}
export const camPos=new THREE.Vector3(0,14,-16), camLook=new THREE.Vector3();
export function updateCamera(dt){
  let px,py,pz,lx,ly,lz;
  if(G.state==='menu'||G.state==='boot'){ const a=G.time*.15; px=C.x+Math.sin(a)*16; pz=C.z+Math.cos(a)*16-2; py=9; lx=C.x; ly=1; lz=C.z+3; }
  else { const R=Math.min(C.radius,14); const arena=(T.fort&&C.z>T.fort.z-70)||(T.boss&&C.z>T.boss.z-80); const bossNear=T.boss&&C.z>T.boss.z-60;
    const back=12+R*1.15+(arena?5:0), up=9+R*.85+(arena?4:0)+(bossNear?3:0);
    px=C.x*.55; py=up; pz=C.z+C.back*.2-back; lx=C.x*.35; ly=bossNear?3.5:.5; lz=C.z+11+(arena?6:0); }
  const k=1-Math.exp(-dt*(G.state==='menu'?2:5)); camPos.x=lerp(camPos.x,px,k); camPos.y=lerp(camPos.y,py,k); camPos.z=lerp(camPos.z,pz,k);
  camLook.x=lerp(camLook.x,lx,k); camLook.y=lerp(camLook.y,ly,k); camLook.z=lerp(camLook.z,lz,k);
  camera.position.copy(camPos); if(G.shake>0){ const s=G.shake*.6; camera.position.x+=(rand()-.5)*s; camera.position.y+=(rand()-.5)*s; G.shake=Math.max(0,G.shake-dt*1.8); }
  camera.lookAt(camLook); voidMesh.position.z=C.z; voidMesh.position.x=C.x; sun.position.set(C.x-20,40,C.z-12); sun.target.position.set(C.x,0,C.z); sun.target.updateMatrixWorld();
}
