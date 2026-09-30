import { $, IS_TOUCH } from './util.js';
import { C, G, T } from './state.js';
import { arrows, shots } from './fx.js';
import { resetTrack } from './track.js';
import { P } from './patterns.js';
import { LEVELS } from './levels.js';
import { resetCrowd } from './crowd.js';
import { camPos } from './visuals.js';
import { buildMarks, clearBanners, hint, hud, hudCache, setText } from './hud.js';
import { boardScreen, helpScreen, hide, menuScreen, screen } from './screens.js';

/* ================= flow ================= */
export function startLevel(i,fromCp){ clearBanners();
  G.mode='campaign'; G.level=i; resetTrack(LEVELS[i].seed); LEVELS[i].build(); shots.length=0; arrows.length=0;
  if(fromCp&&G.cp){ resetCrowd(G.cp.n,G.cp.z); for(const g of T.gates) if(g.z<G.cp.z){ g.used=true; g.g.visible=false; } for(const c of T.cps) if(c.z<=G.cp.z) c.passed=true; for(const s of T.sections) if(s.z<G.cp.z){ s.shown=true; G.section=s.name; } for(const b of T.barrels) if(b.z<G.cp.z){ b.alive=false; b.g.visible=false; } for(const w of T.walls) if(w.z<G.cp.z){ w.alive=false; w.g.visible=false; } }
  else { G.cp=null; G.section=''; resetCrowd(LEVELS[i].start,5); G.startTime=G.time; G.peakHP=0; }
  setText('lvlName',(i+1)+'. '+LEVELS[i].name); buildMarks(); begin();
}
export function startEndless(){ clearBanners(); G.mode='endless'; G.cp=null; G.lastKind=''; resetTrack((Math.random()*1e9)|0); P.run(30); P.gates('+10','x2'); resetCrowd([16,0,0],5); shots.length=0; arrows.length=0; G.section=''; G.startTime=G.time; G.peakHP=0;
  setText('lvlName','Endless run'); buildMarks(); begin(); }
function begin(){ hide(); hud.hidden=false; $('#touch').hidden=!IS_TOUCH; G.state='play'; camPos.set(C.x,14,C.z-22); for(const k in hudCache) delete hudCache[k]; if(G.mode==='endless') hint(IS_TOUCH?'Drag to steer, tap Jump over gaps':'A / D steer, Space jumps, W sprints'); }
screen.addEventListener('click',e=>{ const b=e.target.closest('button[data-act]'); if(!b||b.disabled) return; const a=b.dataset.act;
  if(a==='level') startLevel(+b.dataset.i); else if(a==='endless') startEndless(); else if(a==='help') helpScreen(); else if(a==='board') boardScreen();
  else if(a==='menu') menuScreen(); else if(a==='resume'){ hide(); G.state='play'; } else if(a==='restart'){ G.mode==='endless'?startEndless():startLevel(G.level); }
  else if(a==='checkpoint') startLevel(G.level,true); else if(a==='next') startLevel(G.level+1); });
