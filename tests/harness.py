"""Shared headless-browser harness. Loads game/index.html from disk, blocks network (fonts fall back),
injects the bot, and exposes run_until(). Requires: pip install playwright && playwright install chromium"""
import asyncio, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAME = (ROOT / "game" / "index.html").as_uri()
BOT = (ROOT / "tests" / "bot.js").read_text()
# Software GL so it runs on CI boxes with no GPU.
GL_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]

async def open_game(p, width=1100, height=700):
    import os
    exe = os.environ.get('CHROME_PATH')
    b = await p.chromium.launch(args=GL_ARGS, **({'executable_path': exe} if exe else {}))
    pg = await b.new_page(viewport={"width": width, "height": height})
    errs = []
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "Failed to load" not in m.text else None)
    await pg.route("http*://**/*", lambda r: r.abort())  # game must run fully offline
    await pg.goto(GAME)
    await pg.wait_for_timeout(2500)
    await pg.evaluate(BOT)
    return b, pg, errs

async def run_until(pg, cond="false", max_s=200):
    """Advance sim with the bot in 0.5 s slices until cond (JS expr) is truthy or state leaves 'play'.
    Returns [cond_met, state, z, [infantry, gunners, titans]]."""
    js = ("()=>{ for(let k=0;k<30;k++){ bot(); UCR.sim(1/60); if(UCR.state!=='play') break; }"
          " return [!!(" + cond + "), UCR.state, Math.round(UCR.C.z), UCR.C.n.slice()]; }")
    r = None
    for _ in range(max_s * 2):
        r = await pg.evaluate(js)
        if r[0] or r[1] != "play":
            return r
    return r
