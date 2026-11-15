/* 把 my-project.js 的內容排成網頁。學生不需要改這個檔案。 */
(function () {
  var P = window.PROJECT;
  var main = document.getElementById('main');
  if (!P) {
    main.innerHTML = '<div class="err"><h2>my-project.js 讀不到</h2><p>通常是少了反引號 ` 、逗號或大括號。請打開 my-project.js，檢查你最後修改的那幾行，和原本的格式比對一下。</p></div>';
    return;
  }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var has = function (s) { return s != null && String(s).trim() !== ''; };
  var paras = function (s) { return String(s).trim().split(/\n\s*\n|\n/).map(function (p) { return '<p>' + esc(p.trim()) + '</p>'; }).join(''); };
  var TAG = { hand: '手繪', ai: 'AI 生成', photo: '照片' };

  var DEC = [['considered', '我考慮過', '列出至少兩個你想過的做法'], ['chosen', '最後決定', '你選了哪一個'], ['why', '為什麼', '為什麼選它、不選其他的？說出具體理由'], ['lens', '連到課本', '這個決定跟你選的透鏡（文化脈絡／綠色永續／通用與友善）有什麼關係']];
  var AI = [['tool', '工具', '你用了哪個 AI 工具'], ['prompt', '我的指令（摘要）', '你給 AI 的主要指令。要寫自己的，不要照抄範例'], ['problem', '不滿意的地方', 'AI 第一次給的結果哪裡不對？（跟草圖不一樣、比例怪、文字錯字……）'], ['fix', '我怎麼改', '你怎麼修改指令或自己動手修正']];

  var STAGES = [
    { id: 'site', name: '真實基地選擇', task: '選擇地點、觀察環境、分析優勢與限制', q: '我為什麼選擇這裡？',
      answerHint: '寫出你選這個地方的理由：你在這裡會看到、聽到、感覺到什麼？這裡有什麼吸引你？（至少 80 字）',
      fields: [['location', '基地位置', '在哪裡？可以是設定的，但要具體（例如：台東縣某處面海的緩坡）'], ['advantages', '優勢', '例如：視野、日照、通風、安靜、交通、文化'], ['limits', '限制', '例如：坡度、颱風、西曬、噪音、隱私、面積'], ['response', '我的回應', '你打算用什麼設計方式回應這些優勢與限制']],
      imgHint: { photo: '基地實景照片，或 Google 地圖／街景截圖', hand: '基地分析圖：標出方位、日照、風向、景觀、動線' } },
    { id: 'concept', name: '建築概念草圖', task: '決定住宅造型、用途、風格與特色', q: '我希望在這裡過什麼生活？',
      answerHint: '描述你在這棟房子裡的一天：早上、白天、晚上各在做什麼？這些生活需要什麼樣的空間？',
      fields: [['form', '造型', '例如：一條水平長盒子、兩個錯開的方塊、圍著中庭的 L 型'], ['use', '用途', '誰住？要做哪些事？'], ['style', '風格', '例如：現代極簡、部落傳統、日式、工業風'], ['feature', '特色', '這棟房子最特別、最想讓人看到的地方']],
      note: '手繪草圖要先給老師蓋章，才能開始用 AI。AI 只能幫你整理草圖，不能替你想造型。',
      imgHint: { hand: '手繪草圖（老師蓋章後拍照上傳）', ai: 'AI 整理後的草圖（可省略）' } },
    { id: 'exterior', name: '建築外觀設計', task: '產生模型、多視角圖與寫實建築影像', q: '這棟住宅如何適應環境？',
      answerHint: '說明建築怎麼回應第 1 關的基地：怎麼面對陽光、風、雨、地形、景觀？至少舉兩個具體的設計。',
      fields: [['materials', '主要材料', '用了哪些材料？為什麼適合這個基地？'], ['views', '多視角', '做了哪些角度（俯視、側面、入口……），各想檢查什麼']],
      imgHint: { ai: '模型圖、多視角圖或寫實建築影像' } },
    { id: 'interior', name: '內部空間設計', task: '規劃平面格局、房間功能、動線與室內設計', q: '住進這棟房子會舒服嗎？',
      answerHint: '從入口走進去，一路說明會經過哪些空間、感覺如何。再誠實檢查：缺了什麼房間？哪裡不方便？你怎麼改？',
      fields: [['rooms', '房間與功能', '列出每個房間、位置和用途（記得臥室、浴廁、廚房）'], ['circulation', '動線', '從入口開始，依序經過哪些空間']],
      imgHint: { hand: '平面圖（建議手繪，標出房間名稱與入口）', ai: '室內設計圖' } },
    { id: 'vr', name: '360° VR 虛擬導覽', task: '生成全景照片，串聯客廳、臥室與特色空間', q: '我的空間設計是否前後一致？',
      answerHint: '照導覽路線走一遍，對照你的平面圖、外觀圖和室內圖。說明你怎麼檢查、發現了什麼。',
      fields: [['inconsistent', '發現的不一致', '例如：窗戶位置不同、材料顏色不同、某張圖多了一面牆、AI 畫錯的文字']],
      tour: true },
    { id: 'web', name: '互動成果網頁', task: '整合所有作品、決策紀錄與 VR 導覽，發布 GitHub Pages', q: '我如何向別人說明自己的設計？',
      answerHint: '如果只能用三句話介紹你的設計給沒看過的人，你會怎麼說？你希望看的人記住哪一點？',
      fields: [], poster: true },
  ];

  function hintBox(hint) { return '<div class="todo"><span class="todo-tag">待填寫</span>' + esc(hint) + '</div>'; }
  var total = 0, done = 0;
  function count(v) { total++; if (has(v)) done++; return has(v); }

  function kv(rows, obj) {
    return '<dl class="kv">' + rows.map(function (r) {
      var v = obj ? obj[r[0]] : '';
      return '<div><dt>' + esc(r[1]) + '</dt><dd>' + (count(v) ? paras(v) : '<span class="todo-inline">' + esc(r[2]) + '</span>') + '</dd></div>';
    }).join('') + '</dl>';
  }

  function figs(list, hints) {
    list = list || [];
    var out = list.map(function (im) {
      var t = TAG[im.type] ? '<span class="tag tag-' + im.type + '">' + TAG[im.type] + '</span>' : '';
      if (count(im.file)) {
        return '<figure class="fig"><button class="zoom" data-src="' + esc(im.file) + '" type="button"><img src="' + esc(im.file) + '" alt="' + esc(im.caption) + '" loading="lazy"></button><figcaption>' + t + (has(im.caption) ? esc(im.caption) : '<span class="todo-inline">補上圖說：這張圖要讓人看到什麼？</span>') + '</figcaption></figure>';
      }
      var h = (hints && hints[im.type]) || '上傳圖片到 img 資料夾，再把檔名填進 file';
      return '<figure class="fig ph"><div class="ph-box"><span>' + esc(h) + '</span></div><figcaption>' + t + '<span class="todo-inline">在 my-project.js 填入 file，例如 img/xxx.jpg</span></figcaption></figure>';
    });
    return out.length ? '<div class="figs">' + out.join('') + '</div>' : '';
  }

  var title = has(P.title) ? P.title : '（作品名稱）';
  document.title = has(P.title) ? P.title : '我的建築專題';
  var html = '<header class="ex-head"><p class="eyebrow">建築專題實作' + (has(P.lens) ? ' · 透鏡：' + esc(P.lens) : '') + (has(P.author) ? ' · ' + esc(P.author) : '') + '</p>';
  html += '<h1>' + esc(title) + (has(P.subtitle) ? '<small>' + esc(P.subtitle) + '</small>' : '') + '</h1>';
  count(P.title); count(P.lens);
  html += count(P.oneline) ? '<p class="oneline">' + esc(P.oneline) + '</p>' : hintBox('在 oneline 用一句話說明你的設計，例如：「在熱鬧的街角蓋一棟對外安靜、對內打開的房子。」');
  if (!has(P.lens)) html += hintBox('在 lens 選一個課本透鏡：文化脈絡、綠色永續、通用與友善');
  html += count(P.cover) ? '<img class="ex-cover" src="' + esc(P.cover) + '" alt="封面">' : '<div class="ph-box cover-ph"><span>封面圖：在 cover 填入你最滿意的一張外觀圖</span></div>';
  html += '<div id="progress"></div></header>';
  html += '<nav class="stage-nav" aria-label="六個階段">' + STAGES.map(function (s, i) { return '<a href="#' + s.id + '"><b>' + (i + 1) + '</b>' + s.name + '<i data-st="' + s.id + '"></i></a>'; }).join('') + '</nav>';

  var stageDone = {};
  STAGES.forEach(function (s, i) {
    var d = P[s.id] || {}, t0 = total, d0 = done;
    var b = '<section class="stage" id="' + s.id + '"><div class="titleblock"><span class="no">圖號 ' + ('0' + (i + 1)) + '</span><h2>' + s.name + '</h2><span class="task">' + s.task + '</span></div>';
    b += '<div class="q"><span>思考</span><p>' + s.q + '</p></div>';
    b += count(d.answer) ? '<div class="answer">' + paras(d.answer) + '</div>' : hintBox(s.answerHint);
    if (s.note) b += '<p class="rule">' + esc(s.note) + '</p>';
    if (s.fields.length) b += kv(s.fields, d);
    if (s.tour) b += '<div class="vr-cta"><a class="btn" href="vr.html">開啟 360° 導覽（可用 Cardboard／Meta Quest）→</a></div><p class="fine">全景圖放在 <code>pano</code> 資料夾，房間和熱點在 <code>tours.js</code> 設定。做法見下方「怎麼做 360° 全景」。</p>';
    if (s.imgHint) b += figs(d.images, s.imgHint);
    if (s.poster) b += count(d.poster) ? '<div class="figs"><figure class="fig"><button class="zoom" data-src="' + esc(d.poster) + '" type="button"><img src="' + esc(d.poster) + '" alt="成果海報"></button><figcaption>成果海報</figcaption></figure></div>' : '<div class="figs"><figure class="fig ph"><div class="ph-box"><span>成果海報：上傳到 img 資料夾，在 web 的 poster 填入檔名</span></div></figure></div>';
    if (d.ai) b += '<div class="record ai-rec"><h3>AI 生成紀錄</h3>' + kv(AI, d.ai) + '</div>';
    b += '<div class="record"><h3>決策紀錄</h3>' + kv(DEC, d.decision) + '</div></section>';
    stageDone[s.id] = [done - d0, total - t0];
    html += b;
  });

  html += document.getElementById('guide-tpl').innerHTML;
  main.innerHTML = html;

  var pct = Math.round(done / total * 100);
  document.getElementById('progress').innerHTML = '<div class="prog"><div class="prog-bar"><span style="width:' + pct + '%"></span></div><p>已完成 ' + done + ' / ' + total + ' 個欄位（' + pct + '%）。標示「待填寫」的地方就是還沒完成的部分。</p></div>';
  Object.keys(stageDone).forEach(function (k) {
    var el = document.querySelector('[data-st="' + k + '"]'), v = stageDone[k];
    el.textContent = v[0] === v[1] ? ' ✓' : ' ' + v[0] + '/' + v[1];
    if (v[0] === v[1]) el.className = 'ok';
  });

  var lb = document.getElementById('lightbox'), lbImg = lb.querySelector('img');
  document.addEventListener('click', function (e) {
    var z = e.target.closest('.zoom');
    if (z) { lbImg.src = z.dataset.src; lb.hidden = false; return; }
    if (!lb.hidden && (e.target === lb || e.target.closest('.lb-close'))) lb.hidden = true;
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.hidden = true; });
  var tb = document.querySelector('.topbar');
  function setTb() { document.documentElement.style.setProperty('--tb', tb.offsetHeight + 'px'); }
  setTb(); window.addEventListener('resize', setTb);
  if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
})();
