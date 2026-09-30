import * as THREE from 'three';
import { rand } from './util.js';
import { CFG } from './config.js';
import { T } from './state.js';
import { GEO, MAT, mesh } from './assets.js';
import { addBarrel, addGate, addPend, addSaw, addSeg, addWall, chunk, H, L } from './track.js';

/* ---------- patterns (the level-design vocabulary) ---------- */
export const P={
  run(len){ chunk(()=>{ addSeg(T.Z,T.Z+len,[L(-H,H)]); T.Z+=len; }); },
  // a = gate on the player's left, b = gate on the right (omit b for one full-width gate)
  gates(a,b){ chunk(()=>{ const z0=T.Z; addSeg(z0,z0+26,[L(-H,H)]); if(b===undefined) addGate(z0+14,-H,H,a); else { addGate(z0+14,0,H,a); addGate(z0+14,-H,0,b); } T.Z+=26; }); },
  saws(n,spd=1){ chunk(()=>{ const z0=T.Z, len=12*n+10; addSeg(z0,z0+len,[L(-H,H)]); for(let i=0;i<n;i++) addSaw(z0+8+i*12,0,H-1.4,spd*(1+(i%2)*.3),i*1.9+T.rnd()*2); T.Z+=len; }); },
  pend(n,spd=1.5){ chunk(()=>{ const z0=T.Z, len=16*n+8; addSeg(z0,z0+len,[L(-H,H)]); for(let i=0;i<n;i++) addPend(z0+9+i*16,spd*(1+(i%2)*.2),i*1.4+T.rnd()); T.Z+=len; }); },
  barrels(n){ chunk(()=>{ const z0=T.Z; addSeg(z0,z0+30,[L(-H,H)]); for(let i=0;i<n;i++) addBarrel((T.rnd()*2-1)*(H-1.2), z0+7+i*(20/Math.max(1,n))+T.rnd()*3); T.Z+=30; }); },
  wall(hp){ chunk(()=>{ const z0=T.Z; addSeg(z0,z0+30,[L(-H,H)]); addWall(z0+18,-H,H,hp); T.Z+=30; }); },
  funnel(w){ chunk(()=>{ const z0=T.Z;
    const fid=++T.fids; addSeg(z0,z0+14,[L(-H,H,true,-w/2,w/2)],{funnel:true,fid}); addSeg(z0+14,z0+34,[L(-w/2,w/2)],{funnel:true,fid}); addSeg(z0+34,z0+46,[L(-w/2,w/2,true,-H,H)]);
    T.Z+=46; }); },
  jump(gap){ chunk(()=>{ const z0=T.Z; addSeg(z0,z0+12,[L(-H,H)]); for(let i=0;i<6;i++) mesh(GEO.box,i%2?MAT.warn:MAT.post,-H+1+i*2,.02,z0+11.4,2,.05,1.1);
    addSeg(z0+12,z0+12+gap,[]); addSeg(z0+12+gap,z0+24+gap,[L(-H,H)]); T.Z+=24+gap; }); },
  crumble(len,w,x=0){ chunk(()=>{ const z0=T.Z; addSeg(z0,z0+6,[L(-H,H)]); let z=z0+6; const end=z0+6+len;
    while(z<end){ const ze=Math.min(end,z+2.4); addSeg(z,ze,[L(x-w/2,x+w/2,false)],{crumble:true}); z=ze; }
    addSeg(end,end+8,[L(-H,H)]); T.Z=end+8; }); },
  // risky lane on the left: narrow, no rails, big multipliers. safe lane on the right: railed, small adds.
  branch(risk,safe,len=64,riskSaw=true){ chunk(()=>{ const z0=T.Z; addSeg(z0,z0+8,[L(-H,H)]);
    const R0=2.2, S1=-1.0; addSeg(z0+8,z0+8+len,[L(R0,H,false),L(-H,S1,true)]);
    risk.forEach((g,i)=>addGate(z0+8+(i+1)*len/(risk.length+1), R0, H, g));
    safe.forEach((g,i)=>addGate(z0+8+(i+1)*len/(safe.length+1), -H, S1, g));
    if(riskSaw) addSaw(z0+8+len*(risk.length>1?.5:.72),(R0+H)/2,(H-R0)/2-.4,1.8,0);
    addSeg(z0+8+len,z0+len+16,[L(-H,H)]); T.Z=z0+len+16; }); },
  cp(){ chunk(()=>{ const z0=T.Z; addSeg(z0,z0+10,[L(-H,H)]);
    mesh(GEO.box,MAT.post,-H-.4,2,z0+5,.35,4,.35); mesh(GEO.box,MAT.post,H+.4,2,z0+5,.35,4,.35); mesh(GEO.box,MAT.flag,0,3.9,z0+5,H*2+1,.6,.2);
    T.cps.push({z:z0+5,passed:false}); T.Z+=10; }); },
  section(name){ T.sections.push({z:T.Z,name,shown:false}); },
  fortress(gateHP,nArch){ chunk(()=>{ const z0=T.Z, A=CFG.arenaHalf;
    addSeg(z0,z0+14,[L(-H,H,true,-A,A)]); addSeg(z0+14,z0+62,[L(-A,A)]);
    const wz=z0+46; const wg=new THREE.Group(); T.cur.g.add(wg);
    mesh(GEO.box,MAT.fort,-(A+3)/2-.5,2.6,wz,A-3+1,5.2,2.2,wg); mesh(GEO.box,MAT.fort,(A+3)/2+.5,2.6,wz,A-3+1,5.2,2.2,wg);
    mesh(GEO.box,MAT.fortDark,0,4.7,wz,6.2,1.2,2.2,wg);
    for(let x=-A;x<=A;x+=1.6){ mesh(GEO.box,MAT.fort,x,5.6,wz-.6,.8,.8,.8,wg); }
    for(const sx of [-1,1]){ mesh(GEO.cyl,MAT.fortDark,sx*(A+.6),3.6,wz,1.6,7.2,1.6,wg); mesh(GEO.cone,MAT.hub,sx*(A+.6),8.1,wz,1.9,1.8,1.9,wg); }
    const door=mesh(GEO.box,MAT.door,0,2,wz-.2,6,4,1.6,wg);
    for(let i=-2;i<=2;i++) mesh(GEO.box,MAT.metal,i*1.2,2,wz-1.05,.14,4,.1,wg);
    const archers=[]; for(let i=0;i<nArch;i++){ const x=((i+.5)/nArch*2-1)*(A-1.5); const ax=Math.abs(x)<3.4? (x<0?-4:4)+x*.2 : x;
      const m=new THREE.Mesh(GEO.u0,MAT.enemy); m.scale.setScalar(1.25); m.position.set(ax,5.2,wz-.2); m.rotation.y=Math.PI; wg.add(m);
      archers.push({kind:'archer',x:ax,y:6,z:wz-.3,hp:22,alive:true,m,cd:1+rand()*1.5,fall:0}); }
    T.fort={z:wz,door:{kind:'door',x:0,y:2,z:wz-1,hp:gateHP,max:gateHP,alive:true,name:'Fortress gate'},archers,wg,doorMesh:door,breached:false,sink:0};
    T.Z=z0+62; }); },
  boss(hp,lv=1){ chunk(()=>{ const z0=T.Z, A=CFG.arenaHalf; addSeg(z0,z0+60,[L(-A,A)]);
    mesh(GEO.box,MAT.fortDark,0,3,z0+60.5,A*2+1,6,1);
    const bz=z0+40, g=new THREE.Group(); g.position.set(0,0,bz); T.cur.g.add(g);
    const body=new THREE.Group(); g.add(body);
    mesh(GEO.box,MAT.bossDark,-1.5,2,0,1.7,4,1.8,body); mesh(GEO.box,MAT.bossDark,1.5,2,0,1.7,4,1.8,body);
    mesh(GEO.box,MAT.boss,0,6.3,0,5.2,4.6,3.2,body); mesh(GEO.box,MAT.bossDark,0,4.1,0,4.4,.8,3.3,body);
    const head=new THREE.Group(); head.position.set(0,9.5,0); body.add(head);
    mesh(GEO.box,MAT.boss,0,0,0,2.5,2.1,2.3,head); mesh(GEO.box,MAT.eye,-.55,.2,-1.17,.5,.25,.05,head); mesh(GEO.box,MAT.eye,.55,.2,-1.17,.5,.25,.05,head);
    const h1=mesh(GEO.cone,MAT.bossDark,-1.1,1.5,0,.35,1.3,.35,head); h1.rotation.z=.4; const h2=mesh(GEO.cone,MAT.bossDark,1.1,1.5,0,.35,1.3,.35,head); h2.rotation.z=-.4;
    const arms=[]; for(const sx of [-1,1]){ const a=new THREE.Group(); a.position.set(sx*3.3,8,0); body.add(a); mesh(GEO.box,MAT.boss,0,-2.4,0,1.4,4.8,1.4,a); mesh(GEO.box,MAT.bossDark,0,-5.1,0,1.9,1.5,1.9,a); arms.push(a); }
    const weak=[]; const wp=[[0,6.6,-1.7],[-3.3,8.4,-.85],[3.3,8.4,-.85]];
    for(const [x,y,z] of wp){ const m=mesh(GEO.sph,MAT.weak,x,y,z,.7,.7,.7,body); weak.push({kind:'weak',ox:x,oy:y,oz:z,x,y,z:bz+z,hp:hp*.07,max:hp*.07,alive:true,m}); }
    T.boss={kind:'boss',x:0,y:6,z:bz,hp,max:hp,alive:true,weak,g,body,arms,head,atk:null,cd:3,lv,flash:0,dead:0,name:'The Warden'};
    T.Z=z0+61; T.endZ=T.Z; }); },
};
