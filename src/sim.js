import { clamp, lerp } from './util.js';
import { CFG } from './config.js';
import { C, G, input, T } from './state.js';
import { burst } from './fx.js';
import { H, laneAt, LR, OPS, segAt } from './track.js';
import { capUnits, computeSlots, hpPool, processKills, queueKill, removeHP, sync, takeDebt, total, unitY } from './crowd.js';
import { combat, explode } from './combat.js';
import { endlessStream } from './endless.js';
import { banner, popup, sectionHint } from './hud.js';

/* Per-tick simulation: movement, formation, gates, hazards, merging, end conditions. */
function blocker(){
  let best=null, bz=Infinity;
  for(const w of T.walls){ if(w.alive && w.z>C.z-2 && w.z-.7<bz){ bz=w.z-.7; best=w; } }
  if(T.fort && !T.fort.breached && T.fort.z-1.3<bz && T.fort.z>C.z-2){ bz=T.fort.z-1.3; best=T.fort.door; }
  if(T.boss && T.boss.alive && T.boss.z-3.4<bz){ bz=T.boss.z-3.4; best=T.boss; }
  return best?{o:best,bz}:null;
}

export function step(dt){
  const moving=G.state==='play';
  // ---- speed + steering
  let base=CFG.baseSpeed; if(G.mode==='endless') base=Math.min(CFG.baseSpeed+C.z/260,17);
  let tgt=base; if(input.up||input.sprint||input.padSpeed>.3) tgt=base+5; if(input.down||input.padSpeed<-.3) tgt=Math.max(CFG.minSpeed,base-3.5);
  C.speed=lerp(C.speed,tgt,1-Math.exp(-dt*4));
  let steer=(input.r?1:0)-(input.l?1:0)+input.padSteer;
  C.steerVis=lerp(C.steerVis,clamp(steer,-1,1)+clamp(input.drag*.05,-1,1),1-Math.exp(-dt*8));
  if(moving){ C.x-=steer*CFG.steer*dt; C.x-=input.drag; }
  input.drag=0;
  // ---- forward movement with blockers
  const blk=moving?blocker():null; let vz=moving?C.speed:0;
  C.engaged=null;
  if(blk){ const lim=blk.bz-C.front-.1; if(C.z+vz*dt>lim) vz=Math.max(0,(lim-C.z)/dt); if(C.z+C.front>=blk.bz-.45) C.engaged=blk.o; }
  if(G.state==='won') vz=0;
  C.vz=vz; C.prevZ=C.z; C.z+=vz*dt;
  // ---- jump clock
  if(C.jumpT!==null){ C.jumpT+=dt; if(C.jumpT>C.air+(C.jumpFront-C.back)/C.jumpVz+.05) C.jumpT=null; }
  // ---- formation + lane fitting
  const R=computeSlots(); C.radius=R;
  const seg=segAt(C.z); let railed=false, lx0=0, lx1=0;
  if(seg&&!seg.gone){ for(const l of seg.lanes){ laneAt(l,seg,C.z); if(l.rail&&C.x>=LR[0]-.8&&C.x<=LR[1]+.8){ railed=true; lx0=LR[0]; lx1=LR[1]; break; } } }
  // bridges without rails still squeeze the crowd to their width, but they do not hold the crowd in: steer off-centre and the edge falls
  let bridge=false;
  if(!railed&&seg&&!seg.gone){ for(const l of seg.lanes){ laneAt(l,seg,C.z); if(C.x>=LR[0]-.3&&C.x<=LR[1]+.3){ bridge=true; lx0=LR[0]; lx1=LR[1]; break; } } }
  let fx=1,fz=1,shift=0,back=0,Hh=Infinity;
  if(railed||bridge){ Hh=Math.max(.6,(lx1-lx0)/2-(railed?.35:.2)); if(R>Hh){ fx=Hh/R; fz=Math.min(R/Hh,2.6); back=(fz-1)*R*.6; } }
  if(railed){ C.x=clamp(C.x,lx0+.3,lx1-.3); const hw=Math.min(R,Hh); shift=(lx1-lx0<2*hw+.5)?(lx0+lx1)/2-C.x:clamp(C.x,lx0+hw+.2,lx1-hw-.2)-C.x; }
  else { const lim=(T.fort||T.boss)&&C.z>(T.fort?T.fort.z-60:1e9)?CFG.arenaHalf+.5:H+1.2; C.x=clamp(C.x,-lim,lim); }
  C.compress=(railed||bridge)?R/Hh:1;
  const k=1-Math.exp(-dt*9); let front=-99, bk=99, maxY=0;
  for(let t=0;t<3;t++){ const arr=C.units[t];
    for(let i=0;i<arr.length;i++){ const u=arr[i]; const tx=u.sx*fx+shift, tz=u.sz*fz-back;
      u.ox+=(tx-u.ox)*k; u.oz+=(tz-u.oz)*k; if(u.oz>front) front=u.oz; if(u.oz<bk) bk=u.oz; } }
  C.front=front>-99?front:0; C.back=bk<99?bk:0;
  // ---- per-unit height, rail clamp, support
  for(let t=0;t<3;t++){ const arr=C.units[t];
    for(let i=0;i<arr.length;i++){ const u=arr[i]; u.y=unitY(u); if(u.y>maxY) maxY=u.y;
      let wx=C.x+u.ox; const wz=C.z+u.oz; let sup=false; const s=segAt(wz);
      if(s&&!s.gone){ for(const l of s.lanes){ laneAt(l,s,wz);
          if(l.rail&&wx>LR[0]-.8&&wx<LR[1]+.8){ const cx=clamp(wx,LR[0]+.15,LR[1]-.15); if(cx!==wx){ wx=cx; u.ox=wx-C.x; } sup=true; break; }
          if(wx>=LR[0]&&wx<=LR[1]){ sup=true; if(s.crumble&&!s.fallAt&&u.y<.05&&moving) s.fallAt=G.time+CFG.crumbleDelay; break; } } }
      u.wx=wx; u.wz=wz;
      if(u.y>.05||!moving) sup=true;
      if(!sup){ u.off+=dt; if(u.off>CFG.grace) queueKill(t,i,'fall'); } else u.off=0; } }
  C.maxY=maxY;
  if(!moving){ processKills(); sync('hit'); return; }

  // ---- gates, checkpoints, sections
  for(const g of T.gates){ if(!g.used&&C.prevZ<g.z&&C.z>=g.z){ const row=T.gates.filter(o=>Math.abs(o.z-g.z)<.01);
      const hit=row.find(o=>C.x>=o.x0-.05&&C.x<=o.x1+.05); for(const o of row){ o.used=true; o.anim=hit===o?1:-1; } if(hit) applyGate(hit); } }
  for(const c of T.cps){ if(!c.passed&&C.z>=c.z){ c.passed=true; const n=C.n.slice(); const hp=n[0]+n[1]*5+n[2]*25; if(hp<12) n[0]+=12-hp; G.cp={z:c.z,n}; popup('Checkpoint saved','#16a99b',0); burst(C.x,2,C.z+C.front,0x16a99b,12,6); } }
  for(const s of T.sections){ if(!s.shown&&C.z>=s.z){ s.shown=true; G.section=s.name; banner(s.name, sectionHint(s.name)); } }
  // ---- hazards
  hazards(dt);
  // ---- combat
  combat(dt);
  // ---- merging in funnels
  const cs=segAt(C.z);
  // each funnel promotes one tier step: the lowest tier that had 5+ units on entry
  if(cs&&cs.funnel){ if(C.funnelSeg!==cs.fid){ C.funnelSeg=cs.fid; C.funnelTier=C.n[0]>=CFG.mergeN?0:C.n[1]>=CFG.mergeN?1:-1; } }
  if(cs&&cs.funnel&&C.compress>1.12&&C.funnelTier>=0){ C.mergeT-=dt; if(C.mergeT<=0){ C.mergeT=.1; let merged=0; const ft=C.funnelTier;
      const batches=Math.max(1,Math.floor(C.n[ft]/30));
      for(let b=0;b<batches;b++){ if(C.n[ft]>=CFG.mergeN){ C.n[ft]-=CFG.mergeN; C.n[ft+1]++; merged++; } }
      if(merged){ processKills(); sync('merge'); if(G.time-C.mergePop>.8){ C.mergePop=G.time; popup('Merge','#f2b929',1); } } } }
  processKills(); sync('hit');
  if(hpPool()>G.peakHP) G.peakHP=hpPool();
  // ---- endless stream
  if(G.mode==='endless') endlessStream();
  // ---- end conditions
  if(total()===0){ G.state='dying'; G.stateT=0; }
}

function applyGate(g){
  const hp0=hpPool(); C.spawnOX=0; C.spawnOZ=C.front*.7;
  if(g.op==='+') C.n[0]+=g.val;
  else if(g.op==='-') removeHP(g.val);
  else if(g.op==='x') for(let t=0;t<3;t++) C.n[t]=Math.round(C.n[t]*g.val);
  else if(g.op==='/') removeHP(hp0-Math.ceil(hp0/g.val));
  capUnits(); sync(g.good?'none':'hit'); C.spawnOX=0; C.spawnOZ=0;
  popup(OPS[g.op]+g.val, g.good?'#ffffff':'#ffd0cc', 1);
  if(!G.hintShown.gate&&G.mode==='campaign'){ G.hintShown.gate=1; }
}

function hazards(dt){
  const us=C.units;
  for(const s of T.saws){ if(Math.abs(s.z-C.z)>C.radius*3.6+4) continue; s.cd-=dt; if(s.cd>0) continue; s.cd=.05; const rr=(s.r+.25)*(s.r+.25);
    for(let t=0;t<3;t++) for(let i=0;i<us[t].length;i++){ const u=us[t][i]; if(u.y>.9) continue; const dx=u.wx-s.x, dz=u.wz-s.z; if(dx*dx+dz*dz<rr) queueKill(t,i,'hit'); } }
  for(const p of T.pends){ if(Math.abs(p.z-C.z)>C.radius*3.6+4) continue; if(p.by>3) continue; const rr=(p.r+.3)*(p.r+.3);
    for(let t=0;t<3;t++) for(let i=0;i<us[t].length;i++){ const u=us[t][i]; if(p.by-p.r>u.y+1.1) continue; const dx=u.wx-p.bx, dz=u.wz-p.z; if(dx*dx+dz*dz<rr) queueKill(t,i,'hit'); } }
  for(const b of T.barrels){ if(!b.alive||Math.abs(b.z-C.z)>C.radius*3.6+3) continue; let touched=false;
    for(let t=0;t<3&&!touched;t++) for(const u of us[t]){ const dx=u.wx-b.x, dz=u.wz-b.z; if(dx*dx+dz*dz<1.1){ touched=true; break; } }
    if(touched) explode(b); }
  if(C.engaged&&C.engaged.kind==='wall') takeDebt(CFG.wallBite,dt);
}
