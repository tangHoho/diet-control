/* ============================================================
   登入、帳號 UI、匯入本機／舊試算表、AI 估算呼叫
   ============================================================ */
/* ---------- 帳號與雲端（Firebase） ---------- */
function setStatus(t){document.getElementById('cloudStatus').textContent=t;document.getElementById('cloudStatus2').textContent=t;}
function setAuthUI(){
  const on=!!user;
  document.getElementById('authName').textContent=on?(user.displayName||user.email||'已登入'):'尚未登入';
  document.getElementById('authHint').textContent=on?(user.email||''):'登入後紀錄會存到你自己的雲端帳號，多裝置自動同步。';
  document.getElementById('authBtn').textContent=on?'登出':'使用 Google 登入';
  document.getElementById('authBtn').className='btn'+(on?' sec':'');
  document.getElementById('authBtnTop').textContent=on?'已登入':'登入';
  document.getElementById('loginBanner').style.display=on?'none':'block';
  document.getElementById('legacyBox').style.display=(on&&LEGACY_URL)?'block':'none';
}
async function authAction(){
  if(!window.FB||!FB.ready){toast('雲端服務未設定（config.js）');document.getElementById('localModeBtn').style.display='block';return;}
  if(user){ if(confirm('要登出嗎？雲端紀錄會保留在你的帳號。')){ localMode=false; await FB.signOut(); } return; }
  manualLogin=true; document.getElementById('loginStatus').textContent='開啟 Google 登入…';
  try{ await FB.signIn(); }catch(e){ toast('登入失敗：'+(e.code||e.message)); document.getElementById('loginStatus').textContent='登入失敗：'+(e.code||e.message); }
}
/* 登入狀態改變：切換資料來源 */
let localMode=false, manualLogin=false;
function onAuthChanged(u){
  user=u; setAuthUI();
  if(u){
    localMode=false;
    localLogBackup=load(KEY_LOG,[]);
    log=[]; saved=[]; renderLog(); renderToday();
    setStatus('已登入，同步中…'); document.getElementById('loginStatus').textContent='登入成功，載入中…';
    if(manualLogin){ manualLogin=false; toast('以 '+(u.displayName||u.email||'已登入帳號')+' 登入'); }
    let decided=false;
    const decide=st=>{ if(decided) return; decided=true; clearTimeout(waitTimer); if(st&&st.onboarded) setMode('app'); else startOnboard(false); };
    // 快取說「沒有設定」不算數，最多等伺服器 8 秒；有設定（不論來源）就直接決定
    const waitTimer=setTimeout(()=>decide(null),8000);
    FB.listenSettings((st,fromCache)=>{
      if(st){ Object.assign(SET,st); try{localStorage.setItem(KEY_SET,JSON.stringify(SET));}catch(e){} loadSettingsUI(); applySettings(); }
      if(st||!fromCache) decide(st);
    });
    FB.listenLogs(rows=>{ log=rows; normalizeLog(); renderLog(); renderToday(); setStatus('已同步（'+log.length+' 筆）'); checkMigrate(); });
    FB.listenRecipes(r=>{ saved=r; });
    FB.listenFoods(f=>{ USER_FOODS=f; renderLibTabs(); renderLib(); });
  }else{
    log=load(KEY_LOG,[]); saved=load(KEY_RECIPES,[]); USER_FOODS=load(KEY_FOODS,[]); renderLibTabs(); renderLib();
    renderLog(); renderToday(); setStatus('本機模式（未登入）');
    document.getElementById('migrateBox').style.display='none';
    if(localMode){ if(SET.onboarded) setMode('app'); else startOnboard(false); }
    else setMode('login');
  }
}
function checkMigrate(){
  const cloudTs=new Set(log.map(l=>l.ts));
  const pending=(localLogBackup||[]).filter(l=>!cloudTs.has(Number(l.ts)));
  document.getElementById('localCount').textContent=pending.length;
  document.getElementById('migrateBox').style.display=pending.length?'block':'none';
}
async function migrateLocal(){
  const cloudTs=new Set(log.map(l=>l.ts));
  const pending=(localLogBackup||[]).filter(l=>!cloudTs.has(Number(l.ts)));
  let n=0; for(const l of pending){ l.ts=Number(l.ts); l.date=normDate(l.date); await FB.setLog(l); n++; }
  const r=load(KEY_RECIPES,[]); if(r.length&&!saved.length){ saved=r; await FB.saveRecipes(saved); }
  localLogBackup=[]; document.getElementById('migrateBox').style.display='none'; toast('已匯入 '+n+' 筆');
}
function dismissMigrate(){document.getElementById('migrateBox').style.display='none';}
async function importLegacySheet(){
  if(!LEGACY_URL||!user) return;
  setStatus('讀取舊試算表…');
  try{ const r=await fetch(LEGACY_URL,{redirect:'follow'}); const d=await r.json(); if(!d.ok) throw new Error(d.error||'讀取失敗');
    const have=new Set(log.map(l=>l.ts)); let n=0;
    for(const l of d.log){ l.ts=Number(l.ts); l.date=normDate(l.date); if(!have.has(l.ts)){ await FB.setLog(l); n++; } }
    toast('已從試算表匯入 '+n+' 筆'); setStatus('已同步');
  }catch(e){ setStatus('匯入失敗：'+e.message); }
}
/* AI 估算：帶登入 token 給 Apps Script 驗證 */
async function estimatePost(text){
  const idToken=await FB.idToken();
  const r=await fetch(ESTIMATE_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'estimate',text,idToken}),redirect:'follow'});
  return r.json();
}
