# DailyControl（PWA）

計算 / 食材庫 / 飲控紀錄 / 幫助。登入後資料存在 Firebase（每人一份），未登入只存本機。

## 檔案結構
```
index.html          畫面骨架（各分頁 HTML）
config.js           你的設定（更新時不要覆蓋）
css/app.css         全部樣式
js/data.js          內建食材庫 FOODS、五天菜單 DAYS
js/state.js         全域狀態、設定 SET、localStorage、自訂食材 USER_FOODS、共用工具
js/firebase.js      登入、Firestore 讀寫（ES module）
js/onboard.js       登入/設定/App 模式切換、初次設定四步驟與目標計算
js/calc.js          計算頁：這一餐、搜尋、今日摘要、食譜、額外攝取
js/library.js       食材庫九宮格、五天菜單、自訂食材新增/刪除
js/log.js           飲控紀錄、趨勢圖、明細、備份
js/auth.js          帳號 UI、匯入本機/舊試算表、AI 估算呼叫
js/app.js           分頁切換與啟動
sw.js               離線快取（更新時 VERSION 加 1）
```

## 一次性設定：Firebase
1. https://console.firebase.google.com → 新增專案。
2. Authentication → 登入方式啟用「Google」；設定 → 授權網域加 `tanghoho.github.io`。
3. Firestore Database → 建立（正式模式，asia-east1）→ 規則貼 `firestore.rules` → 發布。
4. 專案設定 → 你的應用程式 → 新增網頁應用程式 → apiKey / authDomain / projectId / appId 填進 `config.js`。

## Apps Script（AI 估算）
- 用最新 `飲控紀錄_AppsScript.gs` 覆蓋並重新部署新版本。
- 指令碼屬性：`GEMINI_API_KEY`、`GEMINI_MODEL`、`FIREBASE_WEB_API_KEY`（= 上面的 apiKey）。
- `config.js` 的 `estimateUrl` 填 /exec 網址；`legacySheetUrl` 填同一個可把舊紀錄匯入帳號。

## 更新
覆蓋有變動的檔案，把 `sw.js` 的 VERSION 加 1，並同步更新 index.html 與 sw.js 裡的 `?v=` 版本號。config.js 不覆蓋。
