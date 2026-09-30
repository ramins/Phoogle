// Headless test bot. Evaluated in the page; defines window.bot(), called once per sim tick.
// Steers to best gate, dodges barrels/boss slam, jumps gaps/saws/shockwaves, sprints on crumbling bridges.
// Known gap: does not dodge pendulums (run_levels.py removes them by default).
(()=>{ window.bot=()=>{ const C=UCR.C,T=UCR.T; let tx=0;
          const g=T.gates.filter(g=>!g.used&&g.z>C.z).sort((a,b)=>a.z-b.z);
          if(g.length&&g[0].z-C.z<40){ const row=g.filter(o=>Math.abs(o.z-g[0].z)<.1); const score=o=>o.op==='x'?o.val*100:o.op==='+'?o.val:-o.val*10; row.sort((a,b)=>score(b)-score(a)); tx=(row[0].x0+row[0].x1)/2; }
          
          for(const b of T.barrels){ if(b.alive&&b.z>C.z&&b.z-C.z<14&&Math.abs(b.x-C.x)<3.5){ tx = b.x>0? b.x-4.5 : b.x+4.5; } }
          for(const s of T.segs){ if(s.lanes.length===0 && s.z0>C.z+C.front && s.z0-(C.z+C.front)<1.5) UCR.tryJump(); }
          for(const sw of T.saws){ const dz=sw.z-(C.z+C.front); if(dz>0&&dz<1.2&&Math.abs(sw.x-C.x)<3) UCR.tryJump(); } const bs=T.boss; if(bs&&bs.atk&&bs.atk.kind==='wave'&&bs.atk.R>0&&Math.abs((bs.z-bs.atk.R)-(C.z+C.front))<1.5) UCR.tryJump();
          if(bs&&bs.atk&&bs.atk.kind==='slam') tx = bs.atk.x>C.x? bs.atk.x-9 : bs.atk.x+9;
          UCR.input.up = !!T.crumbles.find(s=>Math.abs(s.z0-C.z)<25);
          UCR.input.l = C.x < tx-0.4; UCR.input.r = C.x > tx+0.4; }; })();
