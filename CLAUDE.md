# Ultimate Crowd Runner

3D crowd-runner. Current state: a working web prototype (three.js r128, ES modules, Vite) built from the
Game Design Document. Long-term targets: PC (Steam), Android, iOS. **Current phase: Phase 1, WebGL
build on itch.io.**

The full GDD should live in `docs/GDD.md` (the owner will add it). Summary of GDD pillars is below.

## Working conventions
- No em dashes in any user-facing text or docs.
- Run `npm run lint` after any code change; it must be clean (it catches missing imports).
- Run `python tests/flow_test.py` after any gameplay change; it must exit 0 (no page errors).
- Run `python tests/run_levels.py` after any balance change and compare traces before/after.
- Balance numbers live in `CFG`; level layouts live in `LEVELS`. Change data before changing code.
- Keep the production build a single self-contained `dist/web/index.html` that runs offline from
  `file://` (no CDN, no network-only dependencies). Add dependencies through npm so Vite inlines them.
- Shared mutable state lives in objects in `src/state.js` (`G`, `C`, `T`, `input`). ES module imports are
  read-only bindings, so never export a `let` that other modules need to reassign; put it on `G`.

## Layout
```
index.html               page shell: HUD and screen markup, loads src/main.js
src/*.js                 the game, one ES module per section (see code map)
src/style.css            all UI styles
src/fonts.css            self-hosted fonts (Fontsource woff2, latin subset)
vite.config.js           single-file build (vite-plugin-singlefile) + THIRD_PARTY_LICENSES.txt
dist/web/index.html      build output: the whole game in one file (gitignored)
tests/harness.py         Playwright harness: builds, loads dist/web offline, injects bot, run_until()
tests/bot.js             scripted player used for balance runs
tests/run_levels.py      bot plays every campaign level, prints trace
tests/flow_test.py       smoke test of every screen/phase, screenshots to tests/out/
scripts/build_itch.sh    builds, then zips dist/web into dist/ucr-web.zip with index.html at the root
```
Setup: `npm ci`, then `pip install playwright && playwright install chromium`. Set `CHROME_PATH` to use a
specific browser binary.
- `npm run dev`: Vite dev server with hot reload. `npm run build`: single-file build to `dist/web/`.
- `npm run itch`: itch.io zip. `npm run lint`: ESLint (`no-undef`, `no-unused-vars`).
- The Python tests run `npm run build` first so they never test a stale bundle (`UCR_SKIP_BUILD=1` skips it).
Tests use software GL (swiftshader) so real-time phases (death screen delay, banners) are slow in
headless; that is expected.

## Code map (src/, roughly in dependency order)
- `util.js`: `$`, `IS_TOUCH`, `DARK`, `store` (localStorage, `ucr:` keys), `rng`, `clamp`, `lerp`.
- `config.js`: `CFG`, every balance number (lane half-width, speeds, jump, gravity, tier HP [1,5,25],
  merge 5, render caps [420,140,60], melee/ranged damage, splash, crumble delay, max units 6000). `COL`.
- `state.js`: `G` (game state incl. `G.state`, `G.time`, `G.stateT`), `C` (crowd), `T` (track), `input`.
- `render.js`: renderer, scene, camera, lights. `assets.js`: shared geometry `GEO`, materials `MAT`, `mesh()`.
- `fx.js`: instanced crowd meshes `UM`, particle/projectile pools, `burst()`.
- `track.js`: `resetTrack`, `chunk`, lanes (`L`), slabs, `addSeg`/`addGate`/`addSaw`/... `T` holds all
  track objects (segs, gates, saws, pends, barrels, walls, cps, sections, crumbles, chunks, fort, boss).
- `patterns.js` (`P`): the level-design vocabulary. `run(len)`, `gates(left,right)` e.g. `'+10','x2','-8','/2'`,
  `saws`, `pend`, `barrels`, `wall(hp)`, `funnel(width)`, `jump(gap)`, `crumble(len,w)`,
  `branch(riskGates,safeGates,len,riskSaw)`, `cp()`, `section(name)`, `fortress(gateHP,nArchers)`, `boss(hp,lv)`.
- `levels.js` (`LEVELS`): 3 campaign levels as sequences of pattern calls, each with 4 sections
  (Crowd build, Hazard course, Branching paths, Final assault) plus checkpoints. `par` = HP for 3 stars.
- `crowd.js`: counts per tier `C.n` are the truth; rendered units are a capped InstancedMesh subset
  (golden-angle packing, lane fitting). Damage demotes tiers (Titan->3 Gunners, Gunner->3 Infantry).
- `sim.js` (`step`): movement, formation, gates, checkpoints, hazards, funnel merging (one tier step
  per pass), end conditions.
- `combat.js`: volleys target barrels/archers/weak points/walls/door/boss; titans splash; `damage()`.
- `boss.js`: "The Warden" (3 weak points, telegraphed slam, jumpable shockwave).
- `endless.js`: weighted procedural patterns, speed ramp, chunk cleanup, score = metres.
- `visuals.js`: world animation, crowd rendering, camera. `hud.js`: HUD, banners, popups.
- `screens.js`: menu, how to play, pause, dead + checkpoint restart, win + stars, endless over.
- `leaderboard.js`: uses claude.ai artifact `db`/`user` capabilities when present, else localStorage.
  On itch.io this is per-device only, so the menu says "Your best runs" instead of "Leaderboard"
  (`sharedBoard()`). Replace in Phase 1 (see below).
- `flow.js`: start level / endless / checkpoint, menu button routing. `input.js`: keyboard, gamepad, touch, and the
  "Click to play" gate shown only when embedded in an iframe (itch) without focus.
- `main.js`: main loop, debug hooks, boot.
- Coordinates: camera looks down +z; screen-left is world +x.
- Debug hooks: `window.UCR = {C,T,G,CFG,LEVELS,P,startLevel,startEndless,tryJump,input,sim,state}`.
  `UCR.sim(seconds)` fast-forwards the simulation without rendering.

## Known issues / honest status
- Levels last about 1.5 to 2.5 min; GDD target is 3 to 5. Extend via pattern lines in `LEVELS`.
- Balance is bot-tuned only. **The bot runs with pendulums removed** (it cannot dodge them), and it
  mostly dies to saws. Bot results are a smoke signal, not a difficulty measurement.
- No audio. No settings menu. No real physics (hand-rolled collision).
- Big popups can overlap the section banner during the boss.
- Bot runs are not reproducible: the game uses unseeded `Math.random` and the real-time render loop
  keeps ticking between bot steps. Compare traces for trends, not exact numbers.

## Phase 1: WebGL build on itch.io
Goal: a public, playable browser build that collects real player feedback.
1. ~~Repo hygiene: split into ES modules with Vite, single-file production build, self-host fonts.~~ Done.
2. ~~Build script output must be a zip with `index.html` at its root (itch requirement).~~ Done.
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
