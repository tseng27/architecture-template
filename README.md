# 建築專題實作：學生範本

這是高三藝術生活「為自己設計一棟房子」的網站範本。照下面的步驟，每個人複製一份，填完六關就是你的成果網頁。

老師的完整範例：https://tseng27.github.io/architecture-examples/

## 開始（只要做一次）

1. 登入 GitHub，在這個頁面上方按綠色的 **Use this template** → **Create a new repository**。
2. Repository name 用英文，例如 `my-house`，選 **Public**，按 **Create repository**。
3. 進到你的新 repository，點 **Settings** → 左邊的 **Pages**。Source 選 **Deploy from a branch**，Branch 選 `main`、資料夾選 `/ (root)`，按 **Save**。
4. 等 1～2 分鐘，網址會出現在同一頁上方：`https://你的帳號.github.io/my-house/`。打開後會看到一個空白的作品頁，每一關都有提示。

## 填寫

| 要改什麼 | 改哪個檔案 |
|---|---|
| 六關的文字、決策紀錄、AI 生成紀錄、圖片檔名 | `my-project.js` |
| 圖片（草圖、平面圖、AI 圖、海報） | 上傳到 `img` 資料夾 |
| 360° 全景圖 | 上傳到 `pano` 資料夾 |
| 導覽的房間和熱點 | `tours.js` |

其他檔案（`index.html`、`render.js`、`vr.html`、`vr.js`、`style.css`、`vendor`）不用動。

## 360° 導覽

全景圖用 AI（例如 Skybox AI 的 Remix）從你自己的室內圖生成，比例要 2:1。導覽頁可以在電腦、手機、Google Cardboard 和 Meta Quest 瀏覽器上觀看，詳細步驟寫在網站最下方。

360° 導覽使用 [three.js](https://threejs.org/)（MIT 授權）。
