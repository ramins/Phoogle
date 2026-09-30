import { store } from './util.js';

/* ---------- leaderboard (shared when the page is published with db, else this device only) ---------- */
const LB={db:null,user:null};
if(window.claude&&typeof window.claude.use==='function'){ Promise.all([window.claude.use('db'),window.claude.use('user')]).then(([db,user])=>{ LB.db=db; LB.user=user; }).catch(()=>{}); }
export async function submitScore(best){ if(!LB.db||!LB.user||best<=0) return false;
  try{ const id=await LB.user.id(); if(!id) return false; const ref=LB.db.collection('scores').doc(id); const snap=await ref.get(); const prev=snap.exists?(snap.data().best||0):0;
    if(best>prev) await ref.set({best,at:Date.now()}); return true; }catch(e){ return false; } }
export async function renderBoard(el,justSaved){ if(!el) return;
  if(LB.db&&LB.user){ try{ const q=await LB.db.collection('scores').orderBy('best','desc').limit(10).get(); const ids=q.docs.map(d=>d.id); const me=await LB.user.id();
      const prof=ids.length?await LB.user.profiles(ids):{};
      if(!document.body.contains(el)) return;
      if(!ids.length){ el.innerHTML='<p class="note">No shared scores yet. Finish an endless run to set the first one.</p>'; return; }
      const ol=document.createElement('ol'); ol.className='board';
      q.docs.forEach(d=>{ const li=document.createElement('li'); if(d.id===me) li.className='me'; const n=document.createElement('span'); n.textContent=(prof[d.id]&&prof[d.id].name)||(d.id===me?'You':'Someone'); const b=document.createElement('b'); b.textContent=(d.data().best||0)+' m'; li.append(n,b); ol.append(li); });
      el.innerHTML=''; el.append(ol); return; }catch(e){ /* fall through to local */ } }
  const runs=store.get('localRuns',[]); if(!document.body.contains(el)) return;
  if(!runs.length){ el.innerHTML='<p class="note">No runs on this device yet. Scores are shared with everyone who opens this page when it is published with the leaderboard enabled.</p>'; return; }
  el.innerHTML='<ol class="board">'+runs.map(r=>`<li><span>This device</span><b>${r} m</b></li>`).join('')+'</ol><p class="note">Scores from this device only.</p>'; }
