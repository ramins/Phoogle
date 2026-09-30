import * as THREE from 'three';
import { clamp, rand } from './util.js';
import { CFG, COL } from './config.js';
import { C } from './state.js';
import { scene } from './render.js';
import { basic, Box, GEO, lam, share, Sph, tmpC, tmpM } from './assets.js';

/* instanced crowd, fx and projectile pools */
export const UM=[0,1,2].map(t=>{ const m=new THREE.InstancedMesh(GEO['u'+t], lam(COL.tier[t]), CFG.cap[t]+140); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled=false; m.count=0; scene.add(m); return m; });
function pool(geo, n, mat){ const m=new THREE.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled=false; for(let i=0;i<n;i++){ tmpM.makeScale(0,0,0); m.setMatrixAt(i,tmpM); m.setColorAt(i,tmpC.setHex(0xffffff)); } m.instanceColor.setUsage(THREE.DynamicDrawUsage); scene.add(m); return m; }
const FXN=700, fxMesh=pool(share(Box(.2,.2,.2)), FXN, lam(0xffffff)); const fx=[]; for(let i=0;i<FXN;i++) fx.push({life:0,max:1,x:0,y:0,z:0,vx:0,vy:0,vz:0}); let fxHead=0;
export const PJN=160, pjMesh=pool(share(Sph(.2,8)), PJN, basic(0xffffff)); export const shots=[];
export const ENN=60, enMesh=pool(share(Sph(.24,8)), ENN, basic(0xff5a3c)); export const arrows=[];

export function burst(x,y,z,color,n=6,spd=5,life=.7){
  tmpC.setHex(color);
  for(let k=0;k<n;k++){ const i=fxHead; fxHead=(fxHead+1)%FXN; const p=fx[i];
    p.x=x;p.y=y;p.z=z; p.vx=(rand()-.5)*spd; p.vy=rand()*spd*.8+2; p.vz=(rand()-.5)*spd+ (C.vz*.5); p.life=p.max=life*(.6+rand()*.6); fxMesh.setColorAt(i,tmpC); }
  fxMesh.instanceColor.needsUpdate=true;
}
export function updateFx(dt){
  for(let i=0;i<FXN;i++){ const p=fx[i]; if(p.life<=0){ continue; }
    p.life-=dt; p.vy-=22*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt; if(p.y<.1&&p.vy<0&&p.y>-1){ p.y=.1; p.vy*=-.3; p.vx*=.6; p.vz*=.6; }
    const s=p.life>0? clamp(p.life/p.max,0,1)*1.1 : 0; tmpM.makeScale(s,s,s); tmpM.setPosition(p.x,p.y,p.z); fxMesh.setMatrixAt(i,tmpM); }
  fxMesh.instanceMatrix.needsUpdate=true;
}
