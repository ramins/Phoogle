import * as THREE from 'three';
import { clamp, lerp, rng } from './util.js';
import { CFG, COL } from './config.js';
import { T } from './state.js';
import { scene } from './render.js';
import { basic, GEO, MAT, mesh, SHARED, tmpV, UPV } from './assets.js';

/* ================= track ================= */
export const H=CFG.half;
export function disposeTree(o){ o.traverse(n=>{ if(n.geometry && !SHARED.has(n.geometry)) n.geometry.dispose(); if(n.material && n.material.userData && n.material.userData.own){ if(n.material.map) n.material.map.dispose(); n.material.dispose(); } }); }
export function resetTrack(seed){
  if(T.group){ scene.remove(T.group); disposeTree(T.group); }
  Object.assign(T,{ group:new THREE.Group(), segs:[], gates:[], saws:[], pends:[], barrels:[], walls:[], cps:[], sections:[], crumbles:[], chunks:[],
    fort:null, boss:null, Z:0, endZ:0, fids:0, rnd:rng(seed||1), cur:null });
  scene.add(T.group);
}
export function chunk(fn){ const g=new THREE.Group(); T.group.add(g); T.cur={g, z0:T.Z}; fn(); T.cur.z1=T.Z; T.chunks.push(T.cur); }
export function L(x0,x1,rail=true,x0b=x0,x1b=x1){ return {a0:x0,a1:x1,b0:x0b,b1:x1b,rail}; }
function slab(z0,z1,x0a,x1a,x0b,x1b,mat,th=1.2){
  const g=new THREE.BoxGeometry(1,1,1), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ const x=p.getX(i)+.5, y=p.getY(i), z=p.getZ(i)+.5; const xl=lerp(x0a,x0b,z), xr=lerp(x1a,x1b,z); p.setXYZ(i, lerp(xl,xr,x), y*th-th/2, z0+(z1-z0)*z); }
  g.computeVertexNormals(); const m=new THREE.Mesh(g,mat); T.cur.g.add(m); return m;
}
function rail(za,xa,zb,xb){ const len=Math.hypot(zb-za,xb-xa); const m=mesh(GEO.box,MAT.rail,(xa+xb)/2,.27,(za+zb)/2,.3,.55,len); m.rotation.y=Math.atan2(xb-xa,zb-za); }
export function addSeg(z0,z1,lanes,f={}){
  const s={z0,z1,lanes,funnel:!!f.funnel,fid:f.fid||0,crumble:!!f.crumble,fallAt:0,gone:false,meshes:[],fallV:0};
  T.segs.push(s);
  for(const l of lanes){
    if(f.crumble){ const m=slab(z0,z1-.12,l.a0,l.a1,l.b0,l.b1,MAT.crumble,.7); s.meshes.push(m); }
    else { let z=z0; while(z<z1-1e-6){ const ze=Math.min(z1,(Math.floor(z/8+1e-6)+1)*8); const t0=(z-z0)/(z1-z0), t1=(ze-z0)/(z1-z0);
        const mat=f.funnel?MAT.funnel:(Math.floor(z/8+1e-6)%2?MAT.stoneA:MAT.stoneB);
        slab(z,ze,lerp(l.a0,l.b0,t0),lerp(l.a1,l.b1,t0),lerp(l.a0,l.b0,t1),lerp(l.a1,l.b1,t1),mat); z=ze; } }
    if(l.rail && !f.crumble){ rail(z0,l.a0-.15,z1,l.b0-.15); rail(z0,l.a1+.15,z1,l.b1+.15); }
  }
  if(f.crumble) T.crumbles.push(s);
  return s;
}
export function segAt(z){ const a=T.segs; let lo=0,hi=a.length-1; while(lo<=hi){ const m=(lo+hi)>>1; if(a[m].z1<=z) lo=m+1; else if(a[m].z0>z) hi=m-1; else return a[m]; } return null; }
export const LR=[0,0];
export function laneAt(l,s,z){ const t=clamp((z-s.z0)/(s.z1-s.z0),0,1); LR[0]=l.a0+(l.b0-l.a0)*t; LR[1]=l.a1+(l.b1-l.a1)*t; return LR; }

function labelTex(text){
  const c=document.createElement('canvas'); c.width=256; c.height=128; const x=c.getContext('2d');
  x.font='68px "Bowlby One","Arial Black",sans-serif'; x.textAlign='center'; x.textBaseline='middle';
  x.lineWidth=12; x.lineJoin='round'; x.strokeStyle='rgba(18,24,36,.9)'; x.strokeText(text,128,70); x.fillStyle='#fff'; x.fillText(text,128,70);
  const t=new THREE.CanvasTexture(c); t.anisotropy=4; return t;
}
export const OPS={'+':'+','-':'\u2212','x':'\u00d7','/':'\u00f7'};
export function addGate(z,x0,x1,label){
  const op=label[0], val=parseFloat(label.slice(1)); const good=(op==='+'||op==='x');
  const g=new THREE.Group(); g.position.set((x0+x1)/2,0,z); T.cur.g.add(g);
  const w=x1-x0-.3;
  const pm=basic(good?COL.pos:COL.neg,{transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false}); pm.userData.own=true;
  const panel=mesh(GEO.plane,pm,0,1.55,0,w,2.7,1,g); panel.rotation.y=Math.PI;
  mesh(GEO.box,MAT.post,-w/2,1.6,0,.28,3.2,.28,g); mesh(GEO.box,MAT.post,w/2,1.6,0,.28,3.2,.28,g); mesh(GEO.box,MAT.post,0,3.2,0,w+.28,.28,.28,g);
  const lm=basic(0xffffff,{map:labelTex(OPS[op]+val),transparent:true,depthWrite:false}); lm.userData.own=true;
  const lab=mesh(GEO.plane,lm,0,1.7,-.05,Math.min(w*.95,3.4),Math.min(w*.95,3.4)/2,1,g); lab.rotation.y=Math.PI;
  T.gates.push({z,x0,x1,op,val,good,used:false,g,pm,lab,anim:0});
}
export function addSaw(z,cx,amp,spd,ph){
  mesh(GEO.box,MAT.groove,cx,.02,z,amp*2+2.8,.06,.5);
  const g=new THREE.Group(); g.position.set(cx,.55,z); T.cur.g.add(g);
  const d=mesh(GEO.saw,MAT.metal,0,0,0,1,1,1,g); d.rotation.x=Math.PI/2;
  const hub=mesh(GEO.cyl,MAT.hub,0,0,0,.35,.3,.35,g); hub.rotation.x=Math.PI/2;
  for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; const t=mesh(GEO.cone,MAT.metal,Math.cos(a)*1.32,0,Math.sin(a)*1.32,.16,.35,.1,d); t.quaternion.setFromUnitVectors(UPV,tmpV.set(Math.cos(a),0,Math.sin(a))); }
  T.saws.push({z,cx,amp,spd,ph,x:cx,r:1.25,g,d,cd:0});
}
export function addPend(z,spd,ph,cx=0,span=H){
  const top=10;
  mesh(GEO.box,MAT.post,cx-span-.7,top/2,z,.5,top,.5); mesh(GEO.box,MAT.post,cx+span+.7,top/2,z,.5,top,.5); mesh(GEO.box,MAT.post,cx,top,z,span*2+1.9,.5,.5);
  const piv=new THREE.Group(); piv.position.set(cx,top-.3,z); T.cur.g.add(piv);
  mesh(GEO.box,MAT.metal,0,-4,0,.18,8,.18,piv); const ball=mesh(GEO.sph,MAT.spike,0,-8.2,0,1.35,1.35,1.35,piv);
  for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; const s=mesh(GEO.cone,MAT.spike,Math.cos(a),0,Math.sin(a),.35,.9,.35,ball); s.quaternion.setFromUnitVectors(UPV,tmpV.set(Math.cos(a),0,Math.sin(a))); }
  for(const sy of [-1,1]){ const s=mesh(GEO.cone,MAT.spike,0,sy,0,.35,.9,.35,ball); if(sy<0) s.rotation.x=Math.PI; }
  T.pends.push({z,cx,spd,ph,piv,len:8.2,top:top-.3,r:1.35,bx:0,by:0,cd:0,amp:Math.min(1.05,Math.asin(Math.min(.99,(span-.3)/8.2)))});
}
export function addBarrel(x,z){
  const g=new THREE.Group(); g.position.set(x,0,z); T.cur.g.add(g);
  mesh(GEO.cyl,MAT.barrel,0,.6,0,.6,1.2,.6,g); mesh(GEO.cyl,MAT.band,0,.62,0,.62,.18,.62,g); mesh(GEO.cyl,MAT.band,0,1.05,0,.62,.1,.62,g);
  T.barrels.push({kind:'barrel',x,y:.7,z,hp:5,alive:true,g});
}
export function addWall(z,x0,x1,hp){
  const g=new THREE.Group(); T.cur.g.add(g);
  mesh(GEO.box,MAT.wall,(x0+x1)/2,1.4,z,x1-x0,2.8,1.1,g);
  for(let x=x0+.5;x<x1;x+=1){ const s=mesh(GEO.cone,MAT.spike,x,.9,z-.8,.22,.8,.22,g); s.rotation.x=-Math.PI/2; const s2=mesh(GEO.cone,MAT.spike,x+.5,1.9,z-.8,.18,.7,.18,g); s2.rotation.x=-Math.PI/2; }
  T.walls.push({kind:'wall',x:(x0+x1)/2,y:1.5,z,hp,max:hp,alive:true,g,name:'Spiked wall'});
}
