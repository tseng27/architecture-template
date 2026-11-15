/* ================================================================
   360° 導覽設定　── 每個房間一張 2:1 全景圖（寬是高的 2 倍）
   ----------------------------------------------------------------
   1. 把全景圖上傳到 pano 資料夾，例如 pano/living.jpg
   2. 每個房間寫一段 { id, title, image, links }
      id：房間代號（英文，不要空格）  title：房間名稱  image：全景圖檔名
   3. links 是熱點：to 要去哪個房間的 id，label 熱點上的字，
      yaw 左右角度（0 是正前方，往右是正數），pitch 上下角度（往上是正數）。
      在導覽頁按「顯示角度」，把畫面中心對準門口，讀出的數字就是 yaw 和 pitch。
   4. start 填第一個要看的房間 id。
   下面兩個房間是範例圖，請換成你自己的。
   ================================================================ */
window.VRTOURS = {
  myhouse: {
    title: "我的 360° 導覽",
    back: "index.html#vr",
    start: "living",
    scenes: [
      { id: "living", title: "客廳（範例圖，請換掉）", image: "pano/sample-living.jpg", yaw: 0,
        links: [{ to: "deck", label: "走到平台", yaw: 30, pitch: 0 }] },
      { id: "deck", title: "平台（範例圖，請換掉）", image: "pano/sample-deck.jpg", yaw: 0,
        links: [{ to: "living", label: "回到客廳", yaw: 30, pitch: 0 }] }
    ]
  }
};
