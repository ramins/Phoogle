import { C, G, T } from './state.js';
import { disposeTree } from './track.js';
import { P } from './patterns.js';
import { hpPool } from './crowd.js';

/* ---------- endless ---------- */
const POOL=[['run',3],['gates',6],['saws',3],['pend',2],['barrels',2],['wall',2],['funnel',2],['jump',2],['crumble',1.5],['branch',1.5]];
export function endlessStream(){
  while(T.Z<C.z+230){ const d=C.z/700; let r=T.rnd()*POOL.reduce((a,p)=>a+p[1],0), kind='run'; for(const [k,w] of POOL){ r-=w; if(r<=0){ kind=k; break; } }
    if(kind===G.lastKind&&kind!=='gates') kind='gates'; G.lastKind=kind; const R=T.rnd;
    const good=()=>R()<.35?'x'+(R()<.7?2:3):'+'+(5+Math.floor(R()*(12+d*10))), bad=()=>R()<.3?'/2':'-'+(6+Math.floor(R()*(12+d*25)));
    switch(kind){
      case 'run': P.run(10+R()*10); break;
      case 'gates': R()<.5?P.gates(good(),bad()):P.gates(bad(),good()); if(R()<.3) P.gates(good(),good()); break;
      case 'saws': P.saws(1+Math.min(3,Math.floor(R()*(1+d))),1+d*.25); break;
      case 'pend': P.pend(1+Math.min(2,Math.floor(R()*(1+d))),1.4+d*.2); break;
      case 'barrels': P.barrels(3+Math.floor(R()*3)); break;
      case 'wall': P.wall(Math.round(60+hpPool()*.35+d*80)); break;
      case 'funnel': P.funnel(2.6+R()*1.2); break;
      case 'jump': P.jump(3.5+Math.min(2,d*.6)+R()); break;
      case 'crumble': P.crumble(16+R()*14,Math.max(4,6.5-d*.6)); break;
      case 'branch': P.branch(['x'+(2+Math.floor(R()*2))],['+'+(10+Math.floor(R()*15))],50+R()*20,d>1.2&&R()<.5); break; } }
  const cut=C.z-45; let removed=false;
  while(T.chunks.length&&T.chunks[0].z1<cut){ const ch=T.chunks.shift(); T.group.remove(ch.g); disposeTree(ch.g); removed=true; }
  if(removed){ const keep=o=>o.z>cut; T.segs=T.segs.filter(s=>s.z1>=cut); T.gates=T.gates.filter(keep); T.saws=T.saws.filter(keep); T.pends=T.pends.filter(keep); T.barrels=T.barrels.filter(keep); T.walls=T.walls.filter(keep); T.crumbles=T.crumbles.filter(s=>s.z1>=cut); }
}
