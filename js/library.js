/* ============================================================
   食材庫九宮格、五天菜單
   ============================================================ */
/* ---------- 食材庫 ---------- */
const BUILTIN_CATS=new Set(FOODS.map(f=>f.c));
function renderLibTabs(){
  const cats=['全部',...new Set(allFoods().map(f=>f.c).filter(c=>c&&c!=='自訂'))];
  if(!cats.includes(curCat)) curCat='全部';
  document.getElementById('libTabs').innerHTML=cats.map(c=>{
    const custom=c!=='全部'&&!BUILTIN_CATS.has(c);
    return `<button class="chip ${c===curCat?'on':''} ${custom?'custom':''}" onclick="setCat('${c}')">${c}${custom&&c===curCat?`<span class="cdel" onclick="event.stopPropagation();delCategory('${c}')">×</span>`:''}</button>`;}).join('');
}
/* 只有使用者新增的分類可以刪除；內建分類不行 */
function delCategory(c){
  if(BUILTIN_CATS.has(c)) return;
  const inCat=USER_FOODS.filter(f=>f.c===c);
  askConfirm('刪除分類',`刪除「${c}」？裡面的 ${inCat.length} 個食材會一起刪除，已紀錄的餐不受影響。`,()=>{
    USER_FOODS=USER_FOODS.filter(f=>f.c!==c); persistFoods(); curCat='全部'; renderLibTabs(); renderLib(); toast('已刪除分類 '+c);
  },'刪除');
}
function setCat(c){curCat=c;renderLibTabs();renderLib();}
function renderLib(){
  const q=document.getElementById('libSearch').value.trim();
  const list=allFoods().filter(f=>(curCat==='全部'||f.c===curCat)&&(!q||f.n.includes(q)||(f.note||'').includes(q)));
  document.getElementById('libCount').textContent=list.length+' 項';
  document.getElementById('libList').innerHTML=list.map(f=>{const n=nut(f,f.d);return `<button class="tile ${f.custom?'custom':''}" onclick='addFood(${JSON.stringify(f.id)},true)' title="${f.note||''}"><span class="plus">＋</span>${f.custom?`<span class="tdel" title="編輯" onclick="event.stopPropagation();editUserFood('${f.id}')">✎</span><span class="tdel trm" title="刪除" onclick="event.stopPropagation();delUserFood('${f.id}')">×</span>`:''}<span class="tn">${dnTile(f.n)}</span><span class="ta">${fmtAmt(f,f.d)}</span><span class="tk">${Math.round(n.k)} <small style="font-size:10px;font-weight:400">kcal</small></span><span class="tp">蛋白 ${n.p.toFixed(0)}g・碳水 ${n.cb.toFixed(0)}g</span></button>`;}).join('')||'<div class="empty" style="grid-column:1/-1">找不到</div>';
}
function renderDays(){
  document.getElementById('daysList').innerHTML=DAYS.map((d,di)=>`<details><summary><span>第 ${di+1} 天・${d.t}</span><span class="muted" style="font-weight:400;font-size:12px;margin-right:8px">${d.tag}</span></summary><div class="body">${d.meals.map((m,mi)=>{const items=m.map(([n,a])=>({id:byName(n).id,amt:a}));const t=totals(items);
    return `<div class="item"><div class="info"><div class="name"><span class="tag">第${mi?'二':'一'}餐</span>${m.map(([n,a])=>dn(n)).join('、')}</div><div class="sub">${Math.round(t.k)} kcal・蛋白 ${t.p.toFixed(0)}g・碳水 ${t.cb.toFixed(0)}g</div></div><button class="btn sm sec" onclick="loadDay(${di},${mi})">載入</button></div>`;}).join('')}</div></details>`).join('');
}
function loadDay(di,mi){meal=DAYS[di].meals[mi].map(([n,a])=>({id:byName(n).id,amt:a}));setMealName(`第${di+1}天 第${mi?'二':'一'}餐`);renderMeal();showTab('calc');toast('已載入到計算');}

/* ---------- 自訂食材 ---------- */
function fillCatSelect(selected){
  const sel=document.getElementById('ufCat');
  const cats=[...new Set(allFoods().map(f=>f.c).filter(c=>c&&c!=='自訂'))];
  sel.innerHTML=cats.map(c=>`<option value="${c}">${c}</option>`).join('')+'<option value="__new">＋ 新增分類</option>';
  sel.value=(selected&&cats.includes(selected))?selected:(selected==='__new'?'__new':cats[0]);
  ufCatChanged();
}
/* 選到「新增分類」就顯示輸入框讓使用者自己填 */
function ufCatChanged(){
  const isNew=document.getElementById('ufCat').value==='__new';
  const inp=document.getElementById('ufNewCat'); inp.style.display=isNew?'block':'none';
  if(isNew) setTimeout(()=>inp.focus(),50);
}
/* pref：從額外攝取帶入 {n,k,p,cb,u} 時預填 */
let editingFoodId=null;
function openFoodSheet(pref,editId){
  editingFoodId=editId||null;
  document.getElementById('ufTitle').textContent=editId?'編輯食材':'新增食材';
  document.getElementById('ufDelBtn').style.display=editId?'block':'none';
  ['ufName','ufK','ufP','ufCb','ufD','ufNote','ufNewCat'].forEach(id=>document.getElementById(id).value='');
  fillCatSelect(pref?(pref.c||'__new'):null);
  document.getElementById('ufUnit').value=(pref&&pref.u)?'份':'g';
  ufUnitChanged();
  if(pref){
    document.getElementById('ufName').value=pref.n||'';
    document.getElementById('ufK').value=pref.k?Math.round(pref.k):''; document.getElementById('ufP').value=pref.p?+pref.p.toFixed(1):''; document.getElementById('ufCb').value=pref.cb?+pref.cb.toFixed(1):'';
    document.getElementById('ufD').value=pref.d||1; document.getElementById('ufUnitName').value=pref.u||'份'; document.getElementById('ufNote').value=pref.note||'';
  }
  openSheet('food');
}
function ufUnitChanged(){
  const g=document.getElementById('ufUnit').value==='g';
  document.getElementById('ufPerLabel').textContent=g?'每 100g 的營養':'每 1 份的營養';
  document.getElementById('ufD').placeholder=g?'預設份量 g（例 150）':'預設份數（例 1）';
  document.getElementById('ufUnitName').style.display=g?'none':'block';
}
function saveUserFood(){
  const n=document.getElementById('ufName').value.trim();
  const k=+document.getElementById('ufK').value,p=+document.getElementById('ufP').value||0,cb=+document.getElementById('ufCb').value||0;
  const unitG=document.getElementById('ufUnit').value==='g';
  const d=+document.getElementById('ufD').value||(unitG?100:1);
  if(!n||!k){toast('請填名稱和熱量');return;}
  let cat=document.getElementById('ufCat').value;
  if(cat==='__new'){ cat=document.getElementById('ufNewCat').value.trim(); if(!cat){toast('請輸入分類名稱');document.getElementById('ufNewCat').focus();return;} }
  const f={id:editingFoodId||('u'+Date.now()),c:cat,n,k,p,cb,d,note:document.getElementById('ufNote').value.trim(),custom:true};
  if(!unitG) f.u=document.getElementById('ufUnitName').value.trim()||'份';
  if(editingFoodId){ const i=USER_FOODS.findIndex(x=>x.id===editingFoodId); if(i>=0) USER_FOODS[i]=f; else USER_FOODS.push(f); }
  else USER_FOODS.push(f);
  persistFoods(); editingFoodId=null;
  renderLibTabs(); renderLib(); closeSheet(); toast((editingFoodId?'已更新 ':'已儲存 ')+n);
}
function editUserFood(id){
  const f=foodById(id); if(!f||!f.custom) return;
  const perUnit=!!f.u;
  openFoodSheet({n:f.n,c:f.c==='自訂'?'':f.c,k:f.k,p:f.p,cb:f.cb,d:f.d,u:perUnit?f.u:null,note:f.note},id);
  if(!perUnit){ document.getElementById('ufUnit').value='g'; ufUnitChanged(); document.getElementById('ufD').value=f.d; document.getElementById('ufK').value=f.k; document.getElementById('ufP').value=f.p; document.getElementById('ufCb').value=f.cb; }
}
function delUserFood(id){
  const f=foodById(id||editingFoodId); if(!f) return;
  askConfirm('刪除食材','刪除「'+f.n+'」？已紀錄的餐不受影響。',()=>{
    USER_FOODS=USER_FOODS.filter(x=>x.id!==f.id); persistFoods(); editingFoodId=null; renderLibTabs(); renderLib(); toast('已刪除 '+f.n);
  },'刪除');
}
