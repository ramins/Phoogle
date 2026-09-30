# Ultimate Crowd Runner

3D crowd-runner. Current state: a working single-file web prototype (three.js r128) built from the
Game Design Document. Long-term targets: PC (Steam), Android, iOS. **Current phase: Phase 1, WebGL
build on itch.io.**

The full GDD should live in `docs/GDD.md` (the owner will add it). Summary of GDD pillars is below.

## Working conventions
- No em dashes in any user-facing text or docs.
- Run `python tests/flow_test.py` after any gameplay change; it must exit 0 (no page errors).
- Run `python tests/run_levels.py` after any balance change and compare traces before/after.
- Balance numbers live in `CFG`; level layouts live in `LEVELS`. Change data before changing code.
- Keep the game runnable offline from `game/` (no network-only dependencies except optional fonts).

## Layout
```
game/index.html          the whole game (HTML + CSS + JS, ~870 lines)
game/vendor/three.min.js three.js r128 (MIT, license alongside). Loaded locally, no CDN.
tests/harness.py         Playwright harness: offline load, bot injection, run_until()
tests/bot.js             scripted player used for balance runs
tests/run_levels.py      bot plays every campaign level, prints trace
tests/flow_test.py       smoke test of every screen/phase, screenshots to tests/out/
scripts/build_itch.sh    zips game/ into dist/ucr-web.zip with index.html at the root
```
Test setup: `pip install playwright && playwright install chromium`. Set `CHROME_PATH` to use a
specific browser binary. Tests use software GL (swiftshader) so real-time phases (death screen
delay, banners) are slow in headless; that is expected.

## Code map (game/index.html, in order of the section comments)
- `CFG`: every balance number (lane half-width, speeds, jump, gravity, tier HP [1,5,25], merge 5,
  render caps [420,140,60], melee/ranged damage, splash, crumble delay, max units 6000).
- renderer/scene, geometry+materials.
- **track**: `resetTrack`, `chunk`, lanes (`L`), slabs. `T` holds all track objects
  (segs, gates, saws, pends, barrels, walls, cps, sections, crumbles, chunks, fort, boss).
- **patterns `P`**: the level-design vocabulary. `run(len)`, `gates(left,right)` e.g. `'+10','x2','-8','/2'`,
  `saws`, `pend`, `barrels`, `wall(hp)`, `funnel(width)`, `jump(gap)`, `crumble(len,w)`,
  `branch(riskGates,safeGates,len,riskSaw)`, `cp()`, `section(name)`, `fortress(gateHP,nArchers)`, `boss(hp,lv)`.
- **LEVELS**: 3 campaign levels as sequences of pattern calls, each with 4 sections
  (Crowd build, Hazard course, Branching paths, Final assault) plus checkpoints. `par` = HP for 3 stars.
- **crowd `C`**: counts per tier `C.n` are the truth; rendered units are a capped InstancedMesh subset
  (golden-angle packing, lane fitting). Damage demotes tiers (Titan->3 Gunners, Gunner->3 Infantry).
  Funnels merge one tier step per pass.
- **game state `G`**, combat (volleys target barrels/archers/weak points/walls/door/boss; titans splash),
  boss "The Warden" (3 weak points, telegraphed slam, jumpable shockwave), endless (weighted
  procedural patterns, speed ramp, chunk cleanup, score = metres).
- visuals, HUD, screens (menu, how to play, pause, dead + checkpoint restart, win + stars, endless over).
- **leaderboard**: uses claude.ai artifact `db`/`user` capabilities when present, else localStorage
  (`ucr:` keys). On itch.io this is per-device only. Replace in Phase 1 (see below).
- flow, input (keyboard, gamepad, touch), main loop.
- Coordinates: camera looks down +z; screen-left is world +x.
- Debug hooks: `window.UCR = {C,T,G,CFG,LEVELS,P,startLevel,startEndless,tryJump,input,sim,state}`.
  `UCR.sim(seconds)` fast-forwards the simulation without rendering.

## Known issues / honest status
- Levels last about 1.5 to 2.5 min; GDD target is 3 to 5. Extend via pattern lines in `LEVELS`.
- Balance is bot-tuned only. **The bot runs with pendulums removed** (it cannot dodge them), and it
  mostly dies to saws. Bot results are a smoke signal, not a difficulty measurement.
- No audio. No settings menu. No real physics (hand-rolled collision).
- Big popups can overlap the section banner during the boss.
- Single 870-line file: fine for a prototype, should be split into modules (see Phase 1).
- Fonts load from Google Fonts; fallbacks exist but the look degrades offline.

## Phase 1: WebGL build on itch.io
Goal: a public, playable browser build that collects real player feedback.
1. Repo hygiene: split `index.html` into ES modules with a bundler (Vite suggested), keep a
   single-file production build. Vendor or self-host fonts.
2. Build script output must be a zip with `index.html` at its root (itch requirement).
3. Audio: SFX for gates, merges, hits, jump, boss, plus one music loop. Mute toggle.
4. Settings: volume, quality (render caps, shadows, pixel ratio), reduced motion, key remap.
5. Leaderboard: replace the claude.ai `db` path with a real backend (e.g. a small serverless
   function + KV/DB, or a hosted service like PlayFab or LootLocker). Basic anti-cheat: server
   validates plausible distance per run time.
6. Level length and difficulty toward GDD targets; playtest with humans, not just the bot.
7. Performance pass on low-end hardware and mobile browsers; add an FPS/quality auto-scaler.
8. Analytics (opt-in): where players die, gate choices, branch choices, session length.
9. itch.io page: embed size (e.g. 1280x720), fullscreen button, mobile friendly, screenshots, GIF.

## Later phases (from the GDD)
Engine port (Unity or UE5) using `CFG`/`LEVELS` as data assets, instanced crowd rendering,
platform leaderboards (Steamworks, Google Play Games, Game Center), campaign expansion.
