import { $ } from './util.js';
import { G, input } from './state.js';
import { canvas } from './render.js';
import { tryJump } from './crowd.js';
import { hide, pauseScreen } from './screens.js';

/* ================= input ================= */
const KEYS={KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r',KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down'};
addEventListener('keydown',e=>{ if(KEYS[e.code]){ input[KEYS[e.code]]=true; e.preventDefault(); }
  if(e.code==='Space'){ e.preventDefault(); if(!e.repeat) tryJump(); }
  if((e.code==='Escape'||e.code==='KeyP')&&!e.repeat){ if(G.state==='play') pauseScreen(); else if(G.state==='pause'){ hide(); G.state='play'; } } });
addEventListener('keyup',e=>{ if(KEYS[e.code]) input[KEYS[e.code]]=false; });
addEventListener('blur',()=>{ for(const k of ['l','r','up','down','sprint']) input[k]=false; if(G.state==='play') pauseScreen(); });
let drag=null;
canvas.addEventListener('pointerdown',e=>{ if(G.state!=='play') return; drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),jumped:false}; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove',e=>{ if(!drag||e.pointerId!==drag.id) return; const dx=e.clientX-drag.x; drag.x=e.clientX; input.drag+=dx*(16/Math.min(innerWidth,900));
  if(!drag.jumped&&drag.y-e.clientY>60&&performance.now()-drag.t<300){ drag.jumped=true; tryJump(); } });
const endDrag=e=>{ if(drag&&e.pointerId===drag.id) drag=null; }; canvas.addEventListener('pointerup',endDrag); canvas.addEventListener('pointercancel',endDrag);
$('#jumpBtn').addEventListener('pointerdown',e=>{ e.preventDefault(); tryJump(); });
const sb=$('#sprintBtn'); sb.addEventListener('pointerdown',e=>{ e.preventDefault(); input.sprint=true; sb.classList.add('on'); });
for(const ev of ['pointerup','pointercancel','pointerleave']) sb.addEventListener(ev,()=>{ input.sprint=false; sb.classList.remove('on'); });
$('#pauseBtn').addEventListener('click',()=>{ if(G.state==='play') pauseScreen(); });
let padJump=false, padStart=false;
export function pollPad(){ const pads=navigator.getGamepads?navigator.getGamepads():[]; let p=null; for(const g of pads) if(g){ p=g; break; } if(!p){ input.padSteer=0; input.padSpeed=0; return; }
  const ax=p.axes[0]||0, ay=p.axes[1]||0; input.padSteer=Math.abs(ax)>.2?ax:0; input.padSpeed=Math.abs(ay)>.3?-ay:0;
  if(p.buttons[14]&&p.buttons[14].pressed) input.padSteer=-1; if(p.buttons[15]&&p.buttons[15].pressed) input.padSteer=1;
  const j=p.buttons[0]&&p.buttons[0].pressed; if(j&&!padJump) tryJump(); padJump=j;
  const s=p.buttons[9]&&p.buttons[9].pressed; if(s&&!padStart){ if(G.state==='play') pauseScreen(); else if(G.state==='pause'){ hide(); G.state='play'; } } padStart=s; }
