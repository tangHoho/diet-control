# DailyControl（PWA）

計算 / 食材庫 / 飲控紀錄 / 幫助。登入後資料存在 Firebase，每個人各自一份；未登入則只存本機。

## 一次性設定：Firebase
1. https://console.firebase.google.com → 新增專案（Analytics 可關）。
2. 建構 → Authentication → 開始使用 → 登入方式啟用「Google」。
3. Authentication → 設定 → 授權網域 → 新增 `tanghoho.github.io`。
4. 建構 → Firestore Database → 建立資料庫（正式模式，地區選 asia-east1）。
5. Firestore → 規則 → 貼上 `firestore.rules` 的內容 → 發布。
6. 專案設定（齒輪）→ 一般 → 你的應用程式 → 新增網頁應用程式 → 複製 apiKey / authDomain / projectId / appId 填進 `config.js`。

## Apps Script（AI 估算）
- 用最新的 `飲控紀錄_AppsScript.gs` 覆蓋並重新部署新版本。
- 指令碼屬性新增 `FIREBASE_WEB_API_KEY` = 上面的 apiKey。設了以後只有登入的使用者能呼叫估算。
- `config.js` 的 `estimateUrl` 填 /exec 網址；`legacySheetUrl` 填同一個網址可把舊紀錄匯入帳號。

## 部署
檔案放 repo 根目錄 → Settings → Pages → main / root。更新時覆蓋 index.html 與 sw.js（VERSION 加 1），config.js 不覆蓋。
