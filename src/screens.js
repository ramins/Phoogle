import { $, IS_TOUCH, store } from './util.js';
import { C, G } from './state.js';
import { resetTrack } from './track.js';
import { LEVELS } from './levels.js';
import { hpPool, resetCrowd, total } from './crowd.js';
import { fmt, hud } from './hud.js';
import { renderBoard, submitScore } from './leaderboard.js';

/* ================= screens ================= */
export const screen=$('#screen'), panel=$('#panel');
function show(html,cls){ panel.className='panel'+(cls?' '+cls:''); panel.innerHTML=html; screen.hidden=false; const b=panel.querySelector('button:not([disabled])'); if(b&&!IS_TOUCH) b.focus({preventScroll:true}); }
export function hide(){ screen.hidden=true; }
const starStr=n=>'\u2605'.repeat(n)+'\u2606'.repeat(3-n);
export function menuScreen(){
  G.state='menu'; hud.hidden=true; attract();
  const pr=G.progress;
  const lv=LEVELS.map((l,i)=>`<button class="lvlbtn" data-act="level" data-i="${i}" ${i<pr.unlocked?'':'disabled'}><span class="num">${i+1}</span><span>${l.name}<span class="meta">${i<pr.unlocked?(pr.stars[i]?'Best: '+pr.stars[i]+' of 3 stars':'Not cleared yet'):'Clear level '+i+' to unlock'}</span></span><span class="stars" aria-label="${pr.stars[i]} stars">${starStr(pr.stars[i]||0)}</span></button>`).join('');
  show(`<h1 class="title">Crowd<span class="row2">Runner</span></h1>
    <p class="sub">Grow the squad through gates, squeeze it through funnels to merge heavier units, then break the keep and its Warden.</p>
    <div class="levels">${lv}</div>
    <div class="btns"><button class="btn primary" data-act="endless">Endless run</button><button class="btn" data-act="board">Leaderboard</button><button class="btn" data-act="help">How to play</button></div>`,'menu');
}
export function helpScreen(){ show(`<h2>How to play</h2>
  <dl class="keys">
    <dt><kbd>A</kbd> <kbd>D</kbd> or arrows</dt><dd>Steer the squad (on a phone, drag anywhere)</dd>
    <dt><kbd>Space</kbd></dt><dd>Jump. The whole squad jumps at the same spot, front to back</dd>
    <dt><kbd>W</kbd> <kbd>S</kbd></dt><dd>Sprint or slow down (Sprint button on a phone)</dd>
    <dt><kbd>Esc</kbd></dt><dd>Pause. Gamepads work too: stick, A to jump, Start to pause</dd>
  </dl>
  <p>Blue gates add or multiply your squad, red gates take units away. Walled funnels squeeze the crowd and merge 5 Infantry into 1 Gunner, and 5 Gunners into 1 Titan. Gunners shoot, Titans shoot with splash, and every unit pushes when you hit a wall.</p>
  <p>Your unit count is your health. Checkpoints save your squad, so a wipe sends you back to the last flag instead of the start.</p>
  <div class="btns"><button class="btn primary" data-act="menu">Back</button></div>`); }
export function pauseScreen(){ G.state='pause'; show(`<h2>Paused</h2><p>${G.mode==='campaign'?LEVELS[G.level].name+', '+G.section:'Endless run, '+Math.floor(C.z)+' m'}</p>
  <div class="btns"><button class="btn primary" data-act="resume">Resume</button><button class="btn" data-act="restart">Restart</button><button class="btn" data-act="menu">Main menu</button></div>`); }
export function deadScreen(){ hud.hidden=true;
  if(G.mode==='endless'){ return endlessOver(); }
  show(`<h2>Squad wiped out</h2><p>You fell in ${G.section||'the opening stretch'}.${G.cp?' Your last checkpoint kept '+fmt(G.cp.n[0]+G.cp.n[1]*5+G.cp.n[2]*25)+' HP of squad.':''}</p>
  <div class="btns">${G.cp?'<button class="btn primary" data-act="checkpoint">Restart from checkpoint</button>':''}<button class="btn ${G.cp?'':'primary'}" data-act="restart">Restart level</button><button class="btn" data-act="menu">Main menu</button></div>`); }
export function winScreen(){ hud.hidden=true; const lv=LEVELS[G.level], hp=hpPool(); const stars=hp>=lv.par?3:hp>=lv.par*.4?2:1;
  const pr=G.progress; pr.stars[G.level]=Math.max(pr.stars[G.level]||0,stars); pr.unlocked=Math.max(pr.unlocked,Math.min(LEVELS.length,G.level+2)); store.set('progress',pr);
  const secs=Math.round(G.time-G.startTime);
  show(`<h2>Keep taken</h2><div class="bigstars" aria-label="${stars} of 3 stars">${starStr(stars)}</div>
  <dl class="stats"><dt>Units left</dt><dd>${fmt(total())}</dd><dt>HP left</dt><dd>${fmt(hp)}</dd><dt>Three-star target</dt><dd>${lv.par} HP</dd><dt>Peak squad HP</dt><dd>${fmt(G.peakHP)}</dd><dt>Time</dt><dd>${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}</dd></dl>
  <div class="btns">${G.level+1<LEVELS.length?'<button class="btn primary" data-act="next">Next level</button>':''}<button class="btn ${G.level+1<LEVELS.length?'':'primary'}" data-act="restart">Replay</button><button class="btn" data-act="menu">Main menu</button></div>`); }
async function endlessOver(){ const score=Math.floor(C.z); const isBest=score>G.endlessBest; if(isBest){ G.endlessBest=score; store.set('endlessBest',score); }
  const local=store.get('localRuns',[]); local.push(score); local.sort((a,b)=>b-a); store.set('localRuns',local.slice(0,10));
  show(`<h2>Run over</h2><dl class="stats"><dt>Distance</dt><dd>${score} m</dd><dt>Your best</dt><dd>${G.endlessBest} m</dd></dl><div id="lb"><p class="note">Loading scores...</p></div>
  <div class="btns"><button class="btn primary" data-act="endless">Run again</button><button class="btn" data-act="menu">Main menu</button></div>`);
  const saved=await submitScore(G.endlessBest); renderBoard($('#lb'),saved); }
export async function boardScreen(){ show(`<h2>Endless leaderboard</h2><div id="lb"><p class="note">Loading scores...</p></div><div class="btns"><button class="btn primary" data-act="menu">Back</button></div>`); renderBoard($('#lb')); }
function attract(){ resetTrack(LEVELS[0].seed); LEVELS[0].build(); resetCrowd([26,4,1],8); G.mode='campaign'; }
