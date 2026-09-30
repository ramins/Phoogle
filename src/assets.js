import * as THREE from 'three';
import { COL } from './config.js';
import { T } from './state.js';

/* ================= geometry + materials ================= */
export const SHARED=new Set();
export function share(g){ SHARED.add(g); return g; }
function part(g,x=0,y=0,z=0,rx=0,ry=0,rz=0){ const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)), new THREE.Vector3(1,1,1)); return [g,m]; }
function merge(parts){
  const pos=[], nor=[];
  for(const [g,m] of parts){ const gg=(g.index?g.toNonIndexed():g.clone()); gg.applyMatrix4(m);
    const p=gg.attributes.position.array, n=gg.attributes.normal.array; for(let i=0;i<p.length;i++){ pos.push(p[i]); nor.push(n[i]); } }
  const out=new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos,3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor,3)); return share(out);
}
export const Box=(a,b,c)=>new THREE.BoxGeometry(a,b,c), Cyl=(a,b,h,s=10)=>new THREE.CylinderGeometry(a,b,h,s), Sph=(r,s=10)=>new THREE.SphereGeometry(r,s,Math.max(6,s-2));
export const GEO={
  u0: merge([part(Cyl(.17,.22,.5,8),0,.45,0), part(Sph(.17,8),0,.86,0), part(Box(.09,.09,.34),.19,.52,.15), part(Box(.12,.3,.14),-.09,.12,0), part(Box(.12,.3,.14),.09,.12,0)]),
  u1: merge([part(Box(.54,.56,.4),0,.64,0), part(Sph(.21,10),0,1.12,0), part(Box(.15,.15,.74),.32,.74,.3), part(Box(.2,.36,.22),-.14,.18,0), part(Box(.2,.36,.22),.14,.18,0), part(Box(.62,.12,.44),0,.95,0)]),
  u2: merge([part(Cyl(.46,.56,.95,12),0,1.0,0), part(Sph(.3,12),0,1.72,0), part(Sph(.28,10),-.6,1.38,0), part(Sph(.28,10),.6,1.38,0),
             part(Cyl(.15,.15,1.1,10),.66,1.15,.42,Math.PI/2,0,0), part(Box(.3,.6,.32),-.24,.3,0), part(Box(.3,.6,.32),.24,.3,0)]),
  box: share(Box(1,1,1)), sph: share(Sph(1,14)), cyl: share(Cyl(1,1,1,16)), cone: share(new THREE.ConeGeometry(1,1,8)),
  saw: share(Cyl(1.25,1.25,.16,24)), plane: share(new THREE.PlaneGeometry(1,1)),
};
export const lam=c=>new THREE.MeshLambertMaterial({color:c}), basic=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}));
export const MAT={
  stoneA:lam(0xd2bd8f), stoneB:lam(0xc2aa7a), funnel:lam(0xaebfd4), crumble:lam(0xb08f63), rail:lam(0x6a5540), warn:lam(0xe0483f),
  wall:lam(0x8a7866), spike:lam(0x5d646f), fort:lam(0x9d8f80), fortDark:lam(0x7b6e62), door:lam(0x6b4a2e), metal:lam(0x98a2ae), hub:lam(0xe0483f),
  groove:lam(0x3a3f48), barrel:lam(0xd9433b), band:lam(0xf3f3f3), enemy:lam(COL.enemy), boss:lam(0x5b4d66), bossDark:lam(0x3b3244),
  weak:basic(0xffd23f), eye:basic(0xffe27a), flag:lam(0x16a99b), post:lam(0x33405a), wood:lam(0x7a5a3a),
};
export const UPV=new THREE.Vector3(0,1,0), tmpM=new THREE.Matrix4(), tmpC=new THREE.Color(), tmpV=new THREE.Vector3(), tmpQ=new THREE.Quaternion(), tmpS=new THREE.Vector3(), tmpE=new THREE.Euler();
export function mesh(geo,mat,x,y,z,sx=1,sy=1,sz=1,parent){ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.scale.set(sx,sy,sz); (parent||T.cur.g).add(m); return m; }
