# 建築專題實作：線上填寫範本

學生直接在網頁上填六個階段（基地、概念草圖、外觀、室內、360° VR 導覽、成果網頁），上傳圖片和全景圖。填完後下載成一個 `.html` 檔交給老師。不用寫程式，也不需要 GitHub 帳號。

- 學生填寫頁：`https://<帳號>.github.io/<repository>/edit.html`
- 本範本的線上版本：https://tseng27.github.io/architecture-template/
- 範例作品：https://tseng27.github.io/architecture-examples/

## 給其他學校的老師

1. 按右上角綠色的 **Use this template** → **Create a new repository**，選 **Public**。
2. 編輯 `config.js`：課程名稱、範例網址、透鏡、規則、繳交方式，以及六個階段的題目與提示。
3. **Settings → Pages → Deploy from a branch → `main` / `/ (root)` → Save**。
4. 把 `網址/edit.html` 發給學生。

## 運作方式

- 學生的資料只存在自己的瀏覽器（IndexedDB），不會上傳到任何伺服器。
- 「下載我的網頁」會產生一個 `.html` 檔，裡面包含所有文字、圖片和 360° 導覽，離線也能打開。這個檔案也能用「載入」拖回填寫頁繼續修改，所以換電腦時用它來搬資料。
- 360° 導覽支援電腦拖曳、手機陀螺儀、Google Cardboard 分屏，以及 Meta Quest 瀏覽器的「進入 VR」。

| 檔案 | 用途 |
|---|---|
| `config.js` | 老師設定（唯一需要改的檔案） |
| `edit.html`、`editor.js` | 學生填寫頁 |
| `index.html` | 首頁 |
| `core.js`、`style.css` | 作品頁排版與 360° 導覽 |
| `vendor/three.min.js` | [three.js](https://threejs.org/)（MIT 授權） |
