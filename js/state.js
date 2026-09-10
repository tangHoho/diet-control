/* ============================================================
   全域狀態、設定、localStorage、共用工具
   ============================================================ */
const CFG = window.APP_CONFIG || {};
const ESTIMATE_URL = CFG.estimateUrl || CFG.cloudUrl || '';   // Apps Script：AI 估算（需登入 token）
const LEGACY_URL   = CFG.legacySheetUrl || CFG.cloudUrl || ''; // 舊試算表（只用來一次性匯入）
/* ---------- 設定（餐數、每日目標） ---------- */
const KEY_SET='hoho_settings_v1';
let SET=Object.assign({meals:2,kcal:1600,pro:115},(function(){try{return JSON.parse(localStorage.getItem(KEY_SET))||{};}catch(e){return {};}})());
function mealKcal(){return Math.round(SET.kcal/SET.meals);}
function mealPro(){return Math.round(SET.pro/SET.meals);}
function slotNames(){return Array.from({length:SET.meals},(_,i)=>'第'+'一二三四五六'[i]+'餐');}
function kcalBand(){return [Math.round(SET.kcal*0.875/10)*10,Math.round(SET.kcal*1.0625/10)*10];}
function loadSettingsUI(){document.getElementById('setMeals').value=SET.meals;document.getElementById('setKcal').value=SET.kcal;document.getElementById('setPro').value=SET.pro;document.getElementById('setPerMeal').textContent=mealKcal()+' kcal / '+mealPro()+'g';}
function saveSettings(){
  SET.meals=Math.min(6,Math.max(1,parseInt(document.getElementById('setMeals').value)||2));
  SET.kcal=Math.max(500,parseInt(document.getElementById('setKcal').value)||1600);
  SET.pro=Math.max(20,parseInt(document.getElementById('setPro').value)||115);
  try{localStorage.setItem(KEY_SET,JSON.stringify(SET));}catch(e){}
  if(user) FB.saveSettings(SET).catch(()=>{});
  loadSettingsUI();applySettings();toast('設定已更新');
}
/* 每餐骨架：依每餐熱量/蛋白質目標，套 211 餐盤換算 */
function mealSkeleton(){
  const K=mealKcal(), P=mealPro();
  const mainP=Math.round(P*0.65), subP=P-mainP;
  const meatG=Math.round(mainP/0.27/10)*10;          // 熟肉/魚平均每 100g 約 27g 蛋白
  const vegK=60, vegCb=10;                             // 兩拳頭蔬菜約 200g
  const fatK=Math.round(K*0.28), fatG=Math.round(fatK/9);
  let cb=Math.round((K-P*4-fatK-vegK)/4); if(cb<20) cb=20;
  const rice=(cb/43).toFixed(1), sweet=Math.round(cb/21*100/10)*10, oat=Math.round(cb/66*100/5)*5;
  const addedOil=Math.max(0,Math.round((fatG-14)/5));  // 肉蛋自帶約 14g 脂肪，其餘用油補
  return {K,P,mainP,subP,meatG,vegK,vegCb,fatG,cb,rice,sweet,oat,addedOil};
}
function renderSkeleton(){
  const s=mealSkeleton(); const el=id=>document.getElementById(id); if(!el('skRows')) return;
  el('skHead').textContent=`依你的目標：每餐 ${s.K} kcal、蛋白質 ${s.P}g。盤子一半蔬菜、四分之一蛋白、四分之一澱粉，份量如下。`;
  el('skLegend').innerHTML=`<b>蔬菜</b> 兩拳頭，約 200g<br><b>蛋白</b> 一掌心厚，約 ${s.meatG}g 肉/魚 + 副蛋白<br><b>澱粉</b> 一拳頭，約 ${s.cb}g 碳水`;
  el('skRows').innerHTML=`
    <div class="kv"><div>主蛋白（動物性）<small>雞胸、雞腿（去皮）、豬里肌、鱸魚、鯖魚、白蝦</small></div><em>${s.meatG}g ≈ ${s.mainP}g 蛋白</em></div>
    <div class="kv"><div>副蛋白 擇一<small>${s.subP<=12?'雞蛋 1 顆 + 豆漿 200ml / 希臘優格 100g':s.subP<=20?'雞蛋 2 顆 / 豆腐半盒 / 希臘優格 150g / 毛豆 1 碗':'雞蛋 2 顆 + 豆腐半盒 / 大豆蛋白 1 勺'}</small></div><em>≈ ${s.subP}g 蛋白</em></div>
    <div class="kv"><div>澱粉 一拳頭<small>糙米飯 ${s.rice} 碗 / 地瓜 ${s.sweet}g / 燕麥 ${s.oat}g 乾</small></div><em>${s.cb}g 碳水</em></div>
    <div class="kv"><div>蔬菜 兩拳頭<small>葉菜、十字花科、冷凍蔬菜，約 200g</small></div><em>約 ${s.vegK} kcal</em></div>
    <div class="kv"><div>油脂<small>肉蛋自帶約 14g，其餘用油補：${s.addedOil?'約 '+s.addedOil+' 小匙':'不用另外加油'}</small></div><em>${s.fatG}g</em></div>`;
  el('skNote').innerHTML='<b>蛋白質不夠時</b>：用無糖豆漿 400ml（約 14g）、毛豆 1 碗（約 13g）、雞蛋 1 顆（約 7g）或大豆蛋白 1 勺（約 25g）補足，優先選原型食物。';
}
function applySettings(){
  renderSkeleton();
  document.querySelector('#mKcal span').textContent='kcal / '+mealKcal();
  document.querySelector('#mPro span').textContent='蛋白 / '+mealPro()+'g';
  document.getElementById('logSlot').innerHTML=slotNames().map(n=>`<option value="${n}">${n}</option>`).join('')+'<option value="加餐">加餐</option>';
  const b=kcalBand();document.getElementById('chartNote').textContent=`橘色帶 ${b[0].toLocaleString()}–${b[1].toLocaleString()} kcal 為目標；虛線 ${SET.pro}g 為蛋白底線；白線為 7 天平均。點長條可看那天的明細。`;
  renderMeal();renderToday();renderLog();
}

/* ---------- 狀態與儲存 ---------- */
let meal=[], saved=[], log=[], curCat='主蛋白', chartRange=0, logShow=7;
const KEY_LOG='hoho_meal_log_v1', KEY_RECIPES='hoho_recipes_v1';
let user=null;               // 登入中的使用者（Firebase）
let editingTs=null;          // 正在編輯的紀錄（ts），null 表示新增
/* 食材兩層：內建 FOODS（id 為數字）+ 自訂 USER_FOODS（id 為 'u…' 字串） */
const KEY_FOODS='hoho_user_foods_v1';
let USER_FOODS=load(KEY_FOODS,[]);
function allFoods(){return FOODS.concat(USER_FOODS);}
function foodById(id){ if(typeof id==='number') return FOODS[id]; return USER_FOODS.find(f=>f.id===id); }
function foodExists(id){return !!foodById(id);}
function persistFoods(){ if(user) FB.saveFoods(USER_FOODS).catch(()=>{}); else store(KEY_FOODS,USER_FOODS); }
let localLogBackup=null;     // 登入後暫存的本機紀錄（供匯入）
/* 寫入層：登入 → Firestore（自帶離線快取）；未登入 → localStorage */
const persist={
  log(){ if(!user) store(KEY_LOG,log); },
  addLog(e){ if(user) FB.setLog(e).catch(err=>setStatus('上傳失敗：'+err.message)); else store(KEY_LOG,log); },
  updLog(e){ if(user) FB.setLog(e).catch(()=>{}); else store(KEY_LOG,log); },
  delLog(ts){ if(user) FB.delLog(ts).catch(()=>{}); else store(KEY_LOG,log); },
  recipes(){ if(user) FB.saveRecipes(saved).catch(()=>{}); else store(KEY_RECIPES,saved); },
};
function store(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
function load(k,def){try{const v=localStorage.getItem(k);return v?JSON.parse(v):def;}catch(e){return def;}}
saved=load(KEY_RECIPES,[]).filter(r=>r.items&&r.items.every(it=>it.id==null||foodExists(it.id)));
log=load(KEY_LOG,[]);
function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function normDate(d){const str=String(d).trim();const m=str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');const dt=new Date(str);if(!isNaN(dt))return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');return str;}
function normalizeLog(){log.forEach(l=>{l.date=normDate(l.date);l.k=Number(l.k)||0;l.p=Number(l.p)||0;l.cb=Number(l.cb)||0;l.ts=Number(l.ts);});}
/* App 內建確認框（取代瀏覽器 confirm） */
function askConfirm(title,msg,onOk,okText){
  document.getElementById('cfTitle').textContent=title; document.getElementById('cfMsg').textContent=msg||'';
  const ok=document.getElementById('cfOk'); ok.textContent=okText||'確定';
  ok.onclick=()=>{closeSheet();onOk();};
  openSheet('confirm');
}
let toastT; function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2200);}
