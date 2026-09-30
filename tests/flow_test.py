"""Smoke test: plays level 1 through fortress/boss, checkpoint restart, endless + endless-over screen.
Saves screenshots to tests/out/. Exit code 1 on any page error."""
import asyncio, sys, pathlib
from playwright.async_api import async_playwright
from harness import open_game, run_until

OUT = pathlib.Path(__file__).resolve().parent / "out"
OUT.mkdir(exist_ok=True)

async def main():
    async with async_playwright() as p:
        b, pg, errs = await open_game(p)
        shot = lambda n: pg.screenshot(path=str(OUT / f"{n}.png"))
        await shot("menu")
        await pg.evaluate("UCR.startLevel(0)")
        print("hazard", await run_until(pg, "UCR.C.z>250")); await pg.wait_for_timeout(1200); await shot("hazard")
        print("branch", await run_until(pg, "UCR.C.z>470")); await pg.wait_for_timeout(1200); await shot("branch")
        print("fort", await run_until(pg, "UCR.T.fort && UCR.C.z>UCR.T.fort.z-12")); await pg.wait_for_timeout(1500); await shot("fort")
        print("boss", await run_until(pg, "UCR.T.boss && UCR.C.z>UCR.T.boss.z-12 && UCR.T.boss.atk")); await pg.wait_for_timeout(700); await shot("boss")
        print("end", await run_until(pg)); await pg.wait_for_timeout(8000); await shot("end")
        btn = await pg.query_selector('button[data-act="checkpoint"]')
        if btn:
            await btn.click(); await pg.wait_for_timeout(1500)
            print("checkpoint restart", await pg.evaluate("[UCR.state, Math.round(UCR.C.z), UCR.C.n]")); await shot("checkpoint")
        await pg.evaluate("UCR.startEndless()")
        print("endless", await run_until(pg, "UCR.C.z>1500", 400)); await pg.wait_for_timeout(1500); await shot("endless")
        print("endless end", await run_until(pg, "false", 400)); await pg.wait_for_timeout(12000); await shot("endless_over")
        print("ERRORS", errs[:10] or "none")
        await b.close()
        sys.exit(1 if errs else 0)

asyncio.run(main())
