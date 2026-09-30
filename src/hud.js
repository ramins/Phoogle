import { $, clamp, IS_TOUCH } from './util.js';
import { C, G, T } from './state.js';
import { camera } from './render.js';
import { tmpV } from './assets.js';
import { hpPool, total } from './crowd.js';

/* ================= HUD ================= */
export const hud=$('#hud'), badge=$('#badge'), bannerEl=$('#banner'), popsEl=$('#popups'), hintEl=$('#hint');
export const hudCache={};
export function setText(id,v){ if(hudCache[id]!==v){ hudCache[id]=v; $('#'+id).textContent=v; } }
export const fmt=n=>n>=10000?(n/1000).toFixed(1)+'k':String(n);
let bannerTimer=0, hintTimer=0;
export function banner(title,sub){ bannerEl.innerHTML=''; bannerEl.append(title); if(sub){ const s=document.createElement('small'); s.textContent=sub; bannerEl.append(s); } bannerEl.classList.add('show'); bannerTimer=2.4; }
export function clearBanners(){ bannerTimer=0; hintTimer=0; bannerEl.classList.remove('show'); hintEl.classList.remove('show'); for(const p of pops){ p.life=0; p.el.style.opacity=0; } }
export function hint(text){ hintEl.textContent=text; hintEl.classList.add('show'); hintTimer=4.5; }
export function sectionHint(name){ const kb=!IS_TOUCH;
  if(name==='Crowd build') return kb?'Steer with A / D into the blue gates':'Drag to steer into the blue gates';
  if(name==='Hazard course'||name==='The sawmill'||name==='Gauntlet') return kb?'Space jumps gaps. Funnels merge 5 units into 1 stronger one':'Tap Jump for gaps. Funnels merge 5 units into 1';
  if(name==='Branching paths') return 'Left lane: big multipliers, no rails. Right lane: safe';
  if(name==='Final assault') return 'Gunners and Titans shoot. Everyone pushes the gate';
  return ''; }
const pops=[]; for(let i=0;i<10;i++){ const d=document.createElement('div'); d.className='pop'; d.style.opacity=0; popsEl.append(d); pops.push({el:d,life:0,x:0,y:0,z:0}); } let popHead=0;
export function popup(text,color,big){ const p=pops[popHead]; popHead=(popHead+1)%pops.length; p.el.textContent=text; p.el.style.color=color||'#fff'; p.el.style.fontSize=big?'30px':'22px'; p.life=1.3; p.x=C.x; p.y=C.maxY+3.5+C.radius*.2; p.z=C.z+C.front+1; }
function project(x,y,z){ tmpV.set(x,y,z).project(camera); return [(tmpV.x*.5+.5)*innerWidth,(-tmpV.y*.5+.5)*innerHeight,tmpV.z<1]; }
export function updateHud(dt){
  if(bannerTimer>0){ bannerTimer-=dt; if(bannerTimer<=0) bannerEl.classList.remove('show'); }
  if(hintTimer>0){ hintTimer-=dt; if(hintTimer<=0) hintEl.classList.remove('show'); }
  for(const p of pops){ if(p.life<=0) continue; p.life-=dt; p.y+=dt*1.6; const [sx,sy,ok]=project(p.x,p.y,p.z); p.el.style.opacity=ok?clamp(p.life/.5,0,1):0; p.el.style.transform=`translate(${sx}px,${sy}px) translate(-50%,-50%)`; }
  if(G.state==='menu'||G.state==='boot'){ badge.style.opacity=0; return; }
  const tt=total(); setText('n0',fmt(C.n[0])); setText('n1',fmt(C.n[1])); setText('n2',fmt(C.n[2])); setText('hp',fmt(hpPool()));
  badge.textContent=fmt(tt); badge.classList.toggle('low',tt<10);
  const [bx,by,ok]=project(C.x,C.maxY+2.2+Math.min(C.radius,8)*.12,C.z+Math.max(0,C.front*.35)); badge.style.opacity=ok&&tt>0?1:0; badge.style.transform=`translate(${bx}px,${by}px) translate(-50%,-100%)`;
  // progress
  if(G.mode==='campaign'&&T.boss){ const end=T.boss.z-4; $('#progFill').style.width=clamp(C.z/end*100,0,100)+'%'; setText('section',G.section); }
  else { $('#progFill').style.width='0%'; setText('section',Math.floor(C.z)+' m   best '+G.endlessBest+' m'); }
  // target bar
  let tg=null; const F=T.fort, B=T.boss;
  if(C.engaged) tg=C.engaged; else if(B&&B.alive&&B.z-C.z<60) tg=B; else if(F&&!F.breached&&F.z-C.z<55) tg=F.door; else { for(const w of T.walls){ if(w.alive&&w.z>C.z&&w.z-C.z<35){ tg=w; break; } } }
  const tEl=$('#target'); if(tg&&tg.max){ tEl.hidden=false; setText('targetName',tg.name||''); $('#targetFill').style.width=clamp(tg.hp/tg.max*100,0,100)+'%'; } else tEl.hidden=true;
}
export function buildMarks(){ const el=$('#progMarks'); el.innerHTML=''; if(G.mode!=='campaign'||!T.boss) return; const end=T.boss.z-4;
  for(const s of T.sections){ const d=document.createElement('div'); d.className='mark'; d.style.left=clamp(s.z/end*100,0,100)+'%'; el.append(d); }
  for(const c of T.cps){ const d=document.createElement('div'); d.className='mark cp'; d.style.left=clamp(c.z/end*100,0,100)+'%'; el.append(d); } }
