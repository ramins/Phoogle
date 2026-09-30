/* Small shared helpers: DOM lookup, device flags, storage, RNG and math. */
export const $ = s => document.querySelector(s);
export const IS_TOUCH = matchMedia('(pointer: coarse)').matches;
export const DARK = matchMedia('(prefers-color-scheme: dark)').matches;
export const store = {
  get(k,d){ try{ const v=localStorage.getItem('ucr:'+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem('ucr:'+k, JSON.stringify(v)); }catch(e){} }
};
export function rng(seed){ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
export const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, rand=Math.random;
