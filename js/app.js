/* ============================================================
   分頁切換與啟動流程
   ============================================================ */
/* ---------- 分頁 ---------- */
function showTab(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('on',p.id==='page-'+id));
  document.querySelectorAll('.tabbar button').forEach(b=>b.classList.toggle('on',b.dataset.tab===id));
  const m=document.querySelector('.pages'); if(m) m.scrollTop=0; try{history.replaceState(null,'','#'+id);}catch(e){}
}
function openSheet(id){
  document.getElementById('sheetBg').classList.add('on');
  document.querySelectorAll('.sheet').forEach(s=>s.classList.toggle('on',s.id==='sheet-'+id));
  if(id==='recipes') renderRecipes();
  if(id==='log'){const t=totals(meal); if(!meal.length){closeSheet();toast('這一餐還沒有食材');return;}
    document.getElementById('logDate').value=todayStr();
    const used=new Set(log.filter(l=>l.date===todayStr()).map(l=>l.slot)); const next=slotNames().find(n=>!used.has(n)); document.getElementById('logSlot').value=next||'加餐';
    document.getElementById('logPreview').textContent=`${Math.round(t.k)} kcal・蛋白 ${t.p.toFixed(0)}g・碳水 ${t.cb.toFixed(0)}g`+(t.pending?`（${t.pending} 項待估算未計入）`:'');}
}
function closeSheet(){document.getElementById('sheetBg').classList.remove('on');document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('on'));}

/* ---------- 啟動 ---------- */
renderLibTabs();renderLib();renderDays();loadSettingsUI();applySettings();
const h=(location.hash||'').replace('#','');if(['calc','lib','log','help'].includes(h))showTab(h);
document.querySelectorAll('.ver').forEach(e=>e.textContent='DailyControl v'+APP_VERSION);
setAuthUI();
/* 啟動：先停在只有 logo 的啟動畫面，等 Firebase 回報登入狀態後才決定顯示登入頁或直接進入，重新整理不會閃登入頁 */
if(CFG.firebase&&CFG.firebase.apiKey){
  setMode('splash');
  const fallback=setTimeout(()=>{setMode('login');document.getElementById('loginStatus').textContent='連線較慢，可直接登入';},8000);
  window.addEventListener('fb-ready',()=>{FB.onAuth(u=>{clearTimeout(fallback);onAuthChanged(u);});});
  window.addEventListener('fb-error',e=>{clearTimeout(fallback);setMode('login');setStatus('Firebase 初始化失敗：'+e.detail);document.getElementById('loginStatus').textContent='雲端連線失敗：'+e.detail;document.getElementById('localModeBtn').style.display='block';});
}else{
  setMode('login');
  document.getElementById('loginStatus').textContent='尚未設定雲端帳號服務（config.js）'; document.getElementById('googleBtn').style.opacity='.4'; document.getElementById('localModeBtn').style.display='block';
  setStatus('未設定 Firebase（config.js），本機模式');
}
window.addEventListener('online',()=>{resolvePending();});
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){navigator.serviceWorker.register('sw.js').catch(()=>{});}
