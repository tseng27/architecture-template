/* ================================================================
   我的建築專題　── 只要改這個檔案，網站就會自動更新
   ----------------------------------------------------------------
   填寫規則：
   1. 只改兩個反引號 ` ` 中間的文字，不要刪掉反引號、逗號和大括號。
   2. 文字裡不要再打反引號 ` 。要換段落就直接按 Enter。
   3. 圖片先上傳到 img 資料夾，再把檔名填進 file，例如 `img/sketch.jpg`。
      檔名請用英文或數字，不要有空格。
   4. 還沒寫的欄位留空就好，網站會在那裡顯示提示。
   5. 不要寫全名、座號或放自己的照片。
   6. 改完按「Commit changes」，等 1～2 分鐘再重新整理網頁。
   範例網站：https://tseng27.github.io/architecture-examples/
   ================================================================ */
window.PROJECT = {
  title: ``,      // 作品名稱，例如：山林中的極簡靜居
  subtitle: ``,   // 副標，例如：一個人與自然的對話
  oneline: ``,    // 用一句話說明你的設計
  lens: ``,       // 選一個課本透鏡：文化脈絡／綠色永續／通用與友善
  author: ``,     // 署名：可以用暱稱或英文名
  cover: ``,      // 封面圖，例如 img/cover.jpg

  /* ── 第 1 關　真實基地選擇 ── */
  site: {
    answer: ``,       // 我為什麼選擇這裡？
    location: ``,     // 基地在哪裡（可以是設定的）
    advantages: ``,   // 優勢
    limits: ``,       // 限制
    response: ``,     // 我的設計怎麼回應這些優勢和限制
    images: [
      { file: ``, caption: ``, type: `photo` },   // 基地實景照片或地圖截圖
      { file: ``, caption: ``, type: `hand` },    // 基地分析圖（可以手繪）
    ],
    decision: { considered: ``, chosen: ``, why: ``, lens: `` },
  },

  /* ── 第 2 關　建築概念草圖 ── */
  concept: {
    answer: ``,   // 我希望在這裡過什麼生活？
    form: ``,     // 造型
    use: ``,      // 用途
    style: ``,    // 風格
    feature: ``,  // 特色
    images: [
      { file: ``, caption: ``, type: `hand` },    // 手繪草圖（老師蓋章後拍照）
      { file: ``, caption: ``, type: `ai` },      // AI 整理後的草圖（可省略）
    ],
    decision: { considered: ``, chosen: ``, why: ``, lens: `` },
  },

  /* ── 第 3 關　建築外觀設計 ── */
  exterior: {
    answer: ``,     // 這棟住宅如何適應環境？
    materials: ``,  // 主要材料
    views: ``,      // 你做了哪些視角，各想看什麼
    images: [
      { file: ``, caption: ``, type: `ai` },      // 模型圖
      { file: ``, caption: ``, type: `ai` },      // 多視角圖
      { file: ``, caption: ``, type: `ai` },      // 寫實建築影像
    ],
    decision: { considered: ``, chosen: ``, why: ``, lens: `` },
    ai: { tool: ``, prompt: ``, problem: ``, fix: `` },
  },

  /* ── 第 4 關　內部空間設計 ── */
  interior: {
    answer: ``,       // 住進這棟房子會舒服嗎？
    rooms: ``,        // 有哪些房間、各在哪裡
    circulation: ``,  // 動線：從入口走進來會依序經過哪裡
    images: [
      { file: ``, caption: ``, type: `hand` },    // 平面圖（建議手繪）
      { file: ``, caption: ``, type: `ai` },      // 室內設計圖
      { file: ``, caption: ``, type: `ai` },      // 室內設計圖
    ],
    decision: { considered: ``, chosen: ``, why: ``, lens: `` },
    ai: { tool: ``, prompt: ``, problem: ``, fix: `` },
  },

  /* ── 第 5 關　360° VR 虛擬導覽（全景圖放在 pano 資料夾，房間設定在 tours.js） ── */
  vr: {
    answer: ``,         // 我的空間設計是否前後一致？
    inconsistent: ``,   // 走一遍導覽後，發現哪些地方前後不一致
    decision: { considered: ``, chosen: ``, why: ``, lens: `` },
    ai: { tool: ``, prompt: ``, problem: ``, fix: `` },
  },

  /* ── 第 6 關　互動成果網頁 ── */
  web: {
    answer: ``,    // 我如何向別人說明自己的設計？
    poster: ``,    // 成果海報，例如 img/poster.jpg
    decision: { considered: ``, chosen: ``, why: ``, lens: `` },
  },
};
