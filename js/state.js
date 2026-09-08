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
function applySettings(){
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
let toastT; function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2200);}
