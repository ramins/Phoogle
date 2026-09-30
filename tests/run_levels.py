"""Balance check: bot plays every campaign level, prints a trace. Usage: python tests/run_levels.py [--with-pendulums]"""
import asyncio, sys
from playwright.async_api import async_playwright
from harness import open_game

async def main():
    keep_pends = "--with-pendulums" in sys.argv
    async with async_playwright() as p:
        b, pg, errs = await open_game(p)
        n = await pg.evaluate("UCR.LEVELS.length")
        for lvl in range(n):
            await pg.evaluate(f"UCR.startLevel({lvl})")
            if not keep_pends:
                await pg.evaluate("()=>{UCR.T.pends.length=0;}")
            trace = []
            for i in range(900):
                r = await pg.evaluate("()=>{ for(let k=0;k<30;k++){ bot(); UCR.sim(1/60); if(UCR.state!=='play') break; }"
                    " const C=UCR.C,T=UCR.T; return [Math.round(C.z), C.n.slice(), UCR.state, UCR.G.section,"
                    " T.fort?Math.round(T.fort.door.hp):null, T.boss?Math.round(T.boss.hp):null]; }")
                if i % 20 == 0 or r[2] != "play":
                    trace.append([i * 0.5] + r)
                if r[2] != "play":
                    break
            name = await pg.evaluate(f"UCR.LEVELS[{lvl}].name")
            print(f"LEVEL {lvl} {name}: {trace[-1][3]} at z={trace[-1][1]}")
            for t in trace: print("   ", t)
        print("ERRORS", errs[:10] or "none")
        await b.close()
        sys.exit(1 if errs else 0)

asyncio.run(main())
