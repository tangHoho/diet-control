/* ============================================================
   初次設定四步驟與目標計算
   ============================================================ */
/* ---------- 模式：login / onboard / app ---------- */
let mode='login';
function setMode(m){
  mode=m; document.body.classList.toggle('gate',m!=='app');
  if(m==='login'){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('on',p.id==='page-login'));}
  else if(m==='onboard'){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('on',p.id==='page-onboard'));}
  else{const h=(location.hash||'').replace('#','');showTab(['calc','lib','log','help'].includes(h)?h:'calc');}
  window.scrollTo(0,0);
}
function enterLocalMode(){user=null;localMode=true;onAuthChanged(null);}

/* ---------- 初次設定（目標計算） ---------- */
const OB={meals:2,sex:'',act:0,ex:-1,pace:500};
function segInit(id,key,cast){const box=document.getElementById(id);box.querySelectorAll('button').forEach(b=>{b.onclick=()=>{box.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');OB[key]=cast?cast(b.dataset.v):b.dataset.v;};});}
function obInit(pref){
  document.getElementById('obMeals').innerHTML=[1,2,3,4,5,6].map(n=>`<button data-v="${n}" class="${n===OB.meals?'on':''}">${n} 餐</button>`).join('');
  segInit('obMeals','meals',Number);segInit('obSex','sex');segInit('obAct','act',Number);segInit('obEx','ex',Number);segInit('obPace','pace',Number);
  if(pref){ ['Age','H','W','T'].forEach(k=>{const v=pref[k.toLowerCase()==='age'?'age':k==='H'?'height':k==='W'?'weight':'target'];if(v)document.getElementById('ob'+k).value=v;});
    const setSeg=(id,v)=>{document.querySelectorAll('#'+id+' button').forEach(b=>b.classList.toggle('on',String(b.dataset.v)===String(v)));};
    if(pref.sex){OB.sex=pref.sex;setSeg('obSex',pref.sex);} if(pref.act){OB.act=pref.act;setSeg('obAct',pref.act);} if(pref.ex!=null){OB.ex=pref.ex;setSeg('obEx',pref.ex);} if(pref.pace){OB.pace=pref.pace;setSeg('obPace',pref.pace);} if(pref.meals){OB.meals=pref.meals;setSeg('obMeals',pref.meals);} }
  else{ setTimeout(()=>{const b=document.querySelector('#obPace [data-v="500"]');if(b)b.click();},0); }
  obGo(1);
}
let obCur=1;
function obGo(n){obCur=n;for(let i=1;i<=4;i++){document.getElementById('obs'+i).style.display=i===n?'block':'none';document.getElementById('dot'+i).classList.toggle('on',i<=n);}
  document.getElementById('obPrev').style.display=n===1?'none':'block';document.getElementById('obNext').textContent=n===4?'開始使用':(n===3?'計算目標':'下一步');document.getElementById('obErr').textContent='';window.scrollTo(0,0);}
function obStep(dir){
  if(dir<0){obGo(Math.max(1,obCur-1));return;}
  const err=document.getElementById('obErr');
  if(obCur===1){const age=+document.getElementById('obAge').value;if(!OB.sex||!age){err.textContent='請選擇性別並填年齡。';return;}obGo(2);}
  else if(obCur===2){const h=+document.getElementById('obH').value,w=+document.getElementById('obW').value;if(!h||!w){err.textContent='請填身高和目前體重。';return;}obGo(3);}
  else if(obCur===3){if(!OB.act||OB.ex<0){err.textContent='請選擇活動量和運動次數。';return;}obCalc();obGo(4);}
  else obFinish();
}
function startOnboard(fromSettings){obInit(fromSettings?SET:null);setMode('onboard');}
function obCalc(){
  const age=+document.getElementById('obAge').value,h=+document.getElementById('obH').value,w=+document.getElementById('obW').value,t=+document.getElementById('obT').value||w;
  // Mifflin-St Jeor 基礎代謝
  const bmr=10*w+6.25*h-5*age+(OB.sex==='m'?5:-161);
  const exFactor=[0,0.05,0.12,0.2][OB.ex];
  const tdee=bmr*(OB.act+exFactor);
  const goal=t<w-0.5?'lose':(t>w+0.5?'gain':'keep');
  let kcal=goal==='lose'?tdee-OB.pace:(goal==='gain'?tdee+300:tdee);
  const floor=OB.sex==='m'?1500:1200; if(kcal<floor)kcal=floor; if(goal==='lose'&&kcal<bmr*0.9)kcal=Math.round(bmr*0.9);
  kcal=Math.round(kcal/10)*10;
  // 蛋白質：減重期以目標體重 2.0 g/kg，維持 1.6，增重 1.8；下限 1.2 g/kg 現體重
  const pro=Math.max(Math.round(t*(goal==='lose'?2.0:goal==='gain'?1.8:1.6)),Math.round(w*1.2));
  Object.assign(OB,{age,height:h,weight:w,target:t,bmr:Math.round(bmr),tdee:Math.round(tdee),goal});
  document.getElementById('obKcalIn').value=kcal;document.getElementById('obProIn').value=pro;
  document.getElementById('obExplain').textContent=`基礎代謝約 ${Math.round(bmr)} kcal，加上活動量每日消耗約 ${Math.round(tdee)} kcal。`+(goal==='lose'?`目標減到 ${t} kg，每日少吃 ${OB.pace} kcal，約每週減 ${(OB.pace*7/7700).toFixed(1)} kg。`:goal==='gain'?`目標增到 ${t} kg，每日多吃 300 kcal。`:'以維持目前體重為目標。');
  document.getElementById('obNote').innerHTML=goal==='lose'?'<b>提醒</b>：熱量不建議長期低於基礎代謝的九成，蛋白質吃夠才能在減脂時保住肌肉。每 8–10 週可安排一週吃到維持量。':'<b>提醒</b>：蛋白質分散到每一餐吸收效率較好，每餐至少 25–30g。';
  obRecalcPer();
}
function obRecalcPer(){const k=+document.getElementById('obKcalIn').value||0,p=+document.getElementById('obProIn').value||0;document.getElementById('obKcal').textContent=k.toLocaleString();document.getElementById('obPro').textContent=p+'g';document.getElementById('obPer').textContent=Math.round(k/OB.meals)+' / '+Math.round(p/OB.meals)+'g';}
function obFinish(){
  SET.meals=OB.meals;SET.kcal=+document.getElementById('obKcalIn').value||1600;SET.pro=+document.getElementById('obProIn').value||115;
  Object.assign(SET,{sex:OB.sex,age:OB.age,height:OB.height,weight:OB.weight,target:OB.target,act:OB.act,ex:OB.ex,pace:OB.pace,onboarded:true});
  try{localStorage.setItem(KEY_SET,JSON.stringify(SET));}catch(e){}
  if(user) FB.saveSettings(SET).catch(()=>{});
  loadSettingsUI();applySettings();setMode('app');toast('設定完成，開始紀錄吧');
}
