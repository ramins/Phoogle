import './fonts.css';
import './style.css';
import { CFG } from './config.js';
import { C, G, input, T } from './state.js';
import { camera, renderer, scene } from './render.js';
import { updateFx } from './fx.js';
import { P } from './patterns.js';
import { LEVELS } from './levels.js';
import { tryJump } from './crowd.js';
import { step } from './sim.js';
import { updateArrows, updateShots } from './combat.js';
import { animateWorld, renderCrowd, updateCamera } from './visuals.js';
import { updateHud } from './hud.js';
import { deadScreen, menuScreen, winScreen } from './screens.js';
import { startEndless, startLevel } from './flow.js';
import { pollPad } from './input.js';

/* ================= loop ================= */
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min(.05,(now-last)/1000); last=now;
  pollPad();
  if(G.state==='pause'){ renderer.render(scene,camera); return; }
  G.time+=dt;
  step(dt);
  if(G.state==='dying'){ G.stateT+=dt; if(G.stateT>1.1){ G.state='dead'; deadScreen(); } }
  if(G.state==='won'){ G.stateT+=dt; if(G.stateT>2.2){ G.state='done'; winScreen(); } }
  animateWorld(dt); renderCrowd(dt); updateFx(dt); if(G.state!=='play'){ updateShots(dt); updateArrows(dt); }
  updateCamera(dt); updateHud(dt);
  renderer.render(scene,camera);
}
// Console hooks for tuning: UCR.CFG holds every balance number; UCR.sim(seconds) fast-forwards the simulation without rendering.
function sim(sec,h=1/60){ for(let t=0;t<sec&&(G.state==='play');t+=h){ G.time+=h; step(h); animateWorld(h); } }
window.UCR={C,T,G,CFG,LEVELS,P,startLevel,startEndless,tryJump,input,sim,get state(){return G.state;}};

const fontReady=document.fonts&&document.fonts.load?Promise.race([document.fonts.load('68px "Bowlby One"'),new Promise(r=>setTimeout(r,1500))]):Promise.resolve();
fontReady.catch(()=>{}).then(()=>{ menuScreen(); requestAnimationFrame(t=>{ last=t; frame(t); }); });
