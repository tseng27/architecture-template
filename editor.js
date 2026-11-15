/* 線上填寫頁：自動儲存在這台電腦的瀏覽器，完成後下載成一個網頁檔。 */
(function () {
  var C = window.CONFIG, esc = Core.esc, has = Core.has;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var P = Core.blank(C);

  /* ── 儲存（IndexedDB） ── */
  var DB = null;
  function db() {
    if (DB) return DB;
    DB = new Promise(function (ok, no) {
      try { var r = indexedDB.open('arch-template', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; }
      catch (e) { no(e); }
    });
    return DB;
  }
  function idb(mode, fn) { return db().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction('kv', mode), st = t.objectStore('kv'), r = fn(st); t.oncomplete = function () { ok(r && r.result); }; t.onerror = function () { no(t.error); }; }); }); }
  var saveT = null;
  function save() {
    status('儲存中…');
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      idb('readwrite', function (s) { return s.put(JSON.parse(JSON.stringify(P)), 'project'); })
        .then(function () { var d = new Date(); status('已自動儲存 ' + d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2)); })
        .catch(function () { status('無法自動儲存（可能是無痕模式）。請記得下載網頁備份！', true); });
      updateProgress();
    }, 500);
  }
  function status(t, bad) { var s = $('#save-status'); s.textContent = t; s.classList.toggle('bad', !!bad); }

  /* 把舊資料補成最新的欄位結構 */
  function merge(base, src) {
    if (Array.isArray(base)) return Array.isArray(src) ? src : base;
    if (base && typeof base === 'object') { var o = {}; Object.keys(base).forEach(function (k) { o[k] = merge(base[k], src ? src[k] : undefined); }); return o; }
    return src == null ? base : src;
  }

  /* ── 路徑存取 ── */
  function get(path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, P); }
  function set(path, v) { var ks = path.split('.'), o = P; for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; }

  /* ── 圖片壓縮 ── */
  function compress(file, maxW, maxH, qual) {
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s = Math.min(1, maxW / im.naturalWidth, maxH / im.naturalHeight), w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
        var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
        URL.revokeObjectURL(url); ok({ data: c.toDataURL('image/jpeg', qual), w: im.naturalWidth, h: im.naturalHeight });
      };
      im.onerror = function () { no(new Error('讀不到這張圖')); }; im.src = url;
    });
  }

  /* ── 表單 ── */
  function ta(path, label, hint, rows) {
    return '<label class="f"><span class="f-l">' + esc(label) + '</span><textarea data-p="' + path + '" rows="' + (rows || 2) + '" placeholder="' + esc(hint) + '">' + esc(get(path)) + '</textarea></label>';
  }
  function inp(path, label, hint) {
    return '<label class="f"><span class="f-l">' + esc(label) + '</span><input type="text" data-p="' + path + '" value="' + esc(get(path)) + '" placeholder="' + esc(hint) + '"></label>';
  }
  function imgSlot(path, label, hint, kind) {
    var v = get(path);
    return '<div class="f img-slot"><span class="f-l">' + esc(label) + '</span><div class="slot">' + (v ? '<img src="' + v + '" alt="">' : '<span class="empty">' + esc(hint) + '</span>') +
      '<div class="slot-btns"><label class="btn-s">' + (v ? '換一張' : '選擇圖片') + '<input type="file" accept="image/*" data-img="' + path + '" data-kind="' + (kind || 'img') + '" hidden></label>' + (v ? '<button type="button" class="btn-s ghost" data-clear="' + path + '">移除</button>' : '') + '</div></div></div>';
  }
  var DEC = [['considered', '我考慮過', '列出至少兩個你想過的做法'], ['chosen', '最後決定', '你選了哪一個'], ['why', '為什麼', '為什麼選它、不選其他的？'], ['lens', '連到課本', '這個決定跟你選的透鏡有什麼關係']];
  var AI = [['tool', '工具', '你用了哪個 AI 工具'], ['prompt', '我的指令（摘要）', '你給 AI 的主要指令，要寫自己的'], ['problem', '不滿意的地方', 'AI 第一次給的結果哪裡不對？'], ['fix', '我怎麼改', '你怎麼修改指令或自己修正']];
  var TYPES = { hand: '手繪', ai: 'AI 生成', photo: '照片' };

  function basicsForm() {
    return '<div class="grid2">' + inp('title', '作品名稱', '例如：山林中的極簡靜居') + inp('subtitle', '副標（可省略）', '例如：一個人與自然的對話') + '</div>' +
      ta('oneline', '一句話說明你的設計', '例如：在熱鬧的街角蓋一棟對外安靜、對內打開的房子。', 2) +
      '<div class="grid2"><label class="f"><span class="f-l">課本透鏡（選一個）</span><select data-p="lens"><option value="">請選擇</option>' + C.lenses.map(function (l) { return '<option' + (P.lens === l ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></label>' +
      inp('author', '署名', '可以用暱稱，不要寫全名和座號') + '</div>' + imgSlot('cover', '封面圖', '放你最滿意的一張外觀圖');
  }

  function stageForm(s, i) {
    var d = P[s.id], b = '';
    b += '<p class="qline">思考：' + esc(s.q) + '</p>';
    if (s.note) b += '<p class="rule">' + esc(s.note) + '</p>';
    b += ta(s.id + '.answer', '我的回答', s.hint, 5);
    s.fields.forEach(function (f) { b += ta(s.id + '.' + f[0], f[1], f[2], 2); });
    if (s.tour) b += '<div class="sub"><h4>360° 導覽</h4><div id="tour-editor"></div></div>';
    if (d.images) {
      b += '<div class="sub"><h4>圖片</h4><div class="imgs">';
      d.images.forEach(function (im, k) {
        var p = s.id + '.images.' + k, h = (s.images && s.images[k] && s.images[k][1]) || '上傳圖片';
        b += '<div class="imgrow">' + imgSlot(p + '.file', '圖 ' + (k + 1), h) +
          '<div class="imgmeta">' + inp(p + '.caption', '圖說', '這張圖要讓人看到什麼？') +
          '<label class="f"><span class="f-l">類型</span><select data-p="' + p + '.type">' + Object.keys(TYPES).map(function (t) { return '<option value="' + t + '"' + (im.type === t ? ' selected' : '') + '>' + TYPES[t] + '</option>'; }).join('') + '</select></label>' +
          '<button type="button" class="btn-s ghost" data-delimg="' + s.id + '.' + k + '">刪除這張</button></div></div>';
      });
      b += '</div><button type="button" class="btn-s" data-addimg="' + s.id + '">＋ 再加一張圖</button></div>';
    }
    if (s.poster) b += imgSlot(s.id + '.poster', '成果海報', '上傳你的 A3 海報圖檔');
    if (s.ai) b += '<div class="sub"><h4>AI 生成紀錄</h4>' + AI.map(function (f) { return ta(s.id + '.ai.' + f[0], f[1], f[2], 2); }).join('') + '</div>';
    b += '<div class="sub"><h4>決策紀錄</h4>' + DEC.map(function (f) { return ta(s.id + '.decision.' + f[0], f[1], f[2], 2); }).join('') + '</div>';
    return b;
  }

  function build() {
    var h = '<details class="card-f" open><summary><b>0</b>作品基本資料<i data-pg="basic"></i></summary><div class="body">' + basicsForm() + '</div></details>';
    C.stages.forEach(function (s, i) {
      h += '<details class="card-f" id="f-' + s.id + '"' + (i === 0 ? ' open' : '') + '><summary><b>' + (i + 1) + '</b>' + esc(s.name) + '<i data-pg="' + s.id + '"></i></summary><div class="body" data-stage="' + s.id + '">' + stageForm(s, i) + '</div></details>';
    });
    $('#form').innerHTML = h;
    var vr = C.stages.filter(function (s) { return s.tour; })[0];
    if (vr) tourEditor(vr.id);
    updateProgress();
  }
  function rebuildStage(id) {
    var s = C.stages.filter(function (x) { return x.id === id; })[0], el = $('[data-stage="' + id + '"]');
    if (id === 'basic') { $('#form .card-f .body').innerHTML = basicsForm(); return; }
    if (s.tour && TE) { TE.destroy(); TE = null; }
    el.innerHTML = stageForm(s); if (s.tour) tourEditor(id);
  }

  /* ── 360° 導覽編輯 ── */
  var TE = null, selRoom = null;
  function tourEditor(id) {
    var d = P[id], box = $('#tour-editor');
    var scenes = d.scenes;
    if (!selRoom || !scenes.some(function (r) { return r.id === selRoom; })) selRoom = scenes[0] ? scenes[0].id : null;
    var h = '<p class="fine">每個房間上傳一張 360° 全景圖（寬是高的 2 倍，例如 4096×2048）。做法：用 Skybox AI 的 Remix 上傳你的室內圖來生成。至少做兩個房間，再用熱點把它們連起來。</p>';
    h += '<div class="rooms">' + scenes.map(function (r, k) {
      return '<button type="button" class="room' + (r.id === selRoom ? ' on' : '') + '" data-room="' + r.id + '">' + (r.image ? '<img src="' + r.image + '" alt="">' : '') + '<span>' + esc(r.title || '房間 ' + (k + 1)) + '</span></button>';
    }).join('') + '<label class="room add">＋ 新增房間<input type="file" accept="image/*" data-newroom="' + id + '" hidden></label></div>';
    var r = scenes.filter(function (x) { return x.id === selRoom; })[0];
    if (r) {
      var k = scenes.indexOf(r), p = id + '.scenes.' + k;
      h += '<div class="room-edit"><div class="grid2">' + inp(p + '.title', '房間名稱', '例如：客廳') +
        '<div class="f"><span class="f-l">全景圖</span><div class="slot-btns"><label class="btn-s">換一張全景<input type="file" accept="image/*" data-img="' + p + '.image" data-kind="pano" hidden></label><button type="button" class="btn-s ghost" data-delroom="' + id + '.' + k + '">刪除這個房間</button></div></div></div>' +
        '<div class="tour ed-tour"></div>' +
        '<h5>熱點：從「' + esc(r.title || '這個房間') + '」可以走到哪裡</h5>' +
        (r.links || []).map(function (l, j) {
          var lp = p + '.links.' + j;
          return '<div class="hotrow"><label class="f"><span class="f-l">走到</span><select data-p="' + lp + '.to"><option value="">選房間</option>' + scenes.filter(function (x) { return x !== r; }).map(function (x) { return '<option value="' + x.id + '"' + (l.to === x.id ? ' selected' : '') + '>' + esc(x.title || '（未命名）') + '</option>'; }).join('') + '</select></label>' +
            '<label class="f"><span class="f-l">熱點文字</span><input type="text" data-p="' + lp + '.label" value="' + esc(l.label) + '" placeholder="例如：進入臥室"></label>' +
            '<span class="f"><span class="f-l">位置</span><span class="pos">左右 ' + l.yaw + '°・上下 ' + l.pitch + '°</span></span>' +
            '<button type="button" class="btn-s" data-pick="' + lp + '">在全景上點位置</button><button type="button" class="btn-s ghost" data-delhot="' + p + '.' + j + '">刪除</button></div>';
        }).join('') +
        (scenes.length > 1 ? '<button type="button" class="btn-s" data-addhot="' + p + '">＋ 新增熱點</button>' : '<p class="fine">再新增一個房間，就可以加熱點了。</p>') + '</div>';
    }
    if (TE) { TE.destroy(); TE = null; }
    box.innerHTML = h;
    var tv = $('.ed-tour', box);
    if (tv && r) TE = Core.createTour(tv, { scenes: scenes, start: r.id }, { onScene: function (sid) { selRoom = sid; tourEditor(id); } });
  }

  /* ── 事件 ── */
  var form = $('#form');
  form.addEventListener('input', function (e) {
    var p = e.target.dataset.p; if (!p) return;
    set(p, e.target.value); save();
    if (/\.scenes\.\d+\.links\.\d+\.label$/.test(p) && TE) { var vr = p.split('.')[0]; TE.setTour({ scenes: P[vr].scenes }, selRoom); }
    if (/\.scenes\.\d+\.title$/.test(p)) { var b = $('.room.on span'); if (b) b.textContent = e.target.value || '（未命名）'; }
  });
  form.addEventListener('change', function (e) {
    var t = e.target, p = t.dataset.p;
    if (p && t.tagName === 'SELECT') { set(p, t.value); save(); if (/\.links\.\d+\.to$/.test(p)) { var vr = p.split('.')[0]; tourEditor(vr); } }
    if (t.dataset.img && t.files[0]) {
      var pano = t.dataset.kind === 'pano';
      compress(t.files[0], pano ? 4096 : 1800, pano ? 2048 : 1800, pano ? 0.85 : 0.82).then(function (r) {
        set(t.dataset.img, r.data); save();
        if (pano && Math.abs(r.w / r.h - 2) > 0.1) alertMsg('這張圖的比例不是 2:1，在導覽裡會變形。請用 360° 全景圖。');
        var st = t.dataset.img.split('.')[0]; rebuildStage(P[st] && st !== 'cover' ? st : 'basic');
      }).catch(function (er) { alertMsg(er.message); });
    }
    if (t.dataset.newroom && t.files[0]) {
      var id = t.dataset.newroom;
      compress(t.files[0], 4096, 2048, 0.85).then(function (r) {
        var rid = 'r' + Date.now().toString(36);
        P[id].scenes.push({ id: rid, title: '', image: r.data, yaw: 0, links: [] }); selRoom = rid; save();
        if (Math.abs(r.w / r.h - 2) > 0.1) alertMsg('這張圖的比例不是 2:1，在導覽裡會變形。請用 360° 全景圖。');
        tourEditor(id);
      }).catch(function (er) { alertMsg(er.message); });
    }
  });
  form.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return; var ds = t.dataset, a;
    if (ds.clear) { set(ds.clear, ''); save(); var st = ds.clear.split('.')[0]; rebuildStage(P[st] && typeof P[st] === 'object' ? st : 'basic'); }
    if (ds.addimg) { P[ds.addimg].images.push({ file: '', caption: '', type: 'ai' }); save(); rebuildStage(ds.addimg); }
    if (ds.delimg) { a = ds.delimg.split('.'); P[a[0]].images.splice(+a[1], 1); save(); rebuildStage(a[0]); }
    if (ds.room) { selRoom = ds.room; tourEditor(t.closest('[data-stage]').dataset.stage); }
    if (ds.delroom) {
      a = ds.delroom.split('.'); var sc = P[a[0]].scenes, gone = sc[+a[1]].id; sc.splice(+a[1], 1);
      sc.forEach(function (r) { r.links = (r.links || []).filter(function (l) { return l.to !== gone; }); }); save(); tourEditor(a[0]);
    }
    if (ds.addhot) { get(ds.addhot).links.push({ to: '', label: '', yaw: 0, pitch: 0 }); save(); tourEditor(ds.addhot.split('.')[0]); }
    if (ds.delhot) { a = ds.delhot.split('.'); var j = +a.pop(); get(a.join('.')).links.splice(j, 1); save(); tourEditor(a[0]); }
    if (ds.pick && TE) {
      var lp = ds.pick; TE.pick(function (y, p) { set(lp + '.yaw', y); set(lp + '.pitch', p); save(); tourEditor(lp.split('.')[0]); });
    }
  });

  function updateProgress() {
    var g = Core.progress(P, C), pct = Math.round(g.done / g.total * 100);
    $('#pg-bar').style.width = pct + '%'; $('#pg-text').textContent = '完成 ' + pct + '%';
    Object.keys(g.per).forEach(function (k) { var el = $('[data-pg="' + k + '"]'), v = g.per[k]; if (el) { el.textContent = v[0] === v[1] ? '完成' : v[0] + ' / ' + v[1]; el.className = v[0] === v[1] ? 'ok' : ''; } });
    var bb = ['title', 'oneline', 'lens', 'cover'].filter(function (k) { return has(P[k]); }).length, be = $('[data-pg="basic"]');
    if (be) { be.textContent = bb === 4 ? '完成' : bb + ' / 4'; be.className = bb === 4 ? 'ok' : ''; }
  }

  /* ── 預覽 ── */
  var tab = 'form';
  function setTab(t) {
    tab = t; $('#form').hidden = t !== 'form'; $('#preview').hidden = t !== 'preview';
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); });
    if (t === 'preview') { if (TE) { TE.destroy(); TE = null; } Core.mount($('#preview'), P, C, { hints: true }); }
    else { Core.unmount(); $('#preview').innerHTML = ''; var vr = C.stages.filter(function (s) { return s.tour; })[0]; if (vr && $('#tour-editor')) tourEditor(vr.id); }
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { setTab(b.dataset.tab); }); });

  /* ── 下載與載入 ── */
  function fetchText(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.text(); }); }
  $('#btn-download').addEventListener('click', function () {
    var btn = this; btn.disabled = true; btn.textContent = '產生中…';
    Promise.all(['style.css', 'vendor/three.min.js', 'core.js'].map(fetchText)).then(function (t) {
      var safe = function (s) { return s.replace(/<\/(script)/gi, '<\\/$1'); };
      var title = has(P.title) ? P.title : '我的建築專題';
      var html = '<!doctype html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>' + esc(title) + '</title>\n' +
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@500;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap">\n<style>' + t[0] + '</style>\n</head>\n<body class="final">\n' +
        '<main id="main"></main>\n<div class="lightbox" id="lightbox" hidden><button class="lb-close" type="button" aria-label="關閉">×</button><img alt=""></div>\n' +
        '<script id="project-data" type="application/json">' + safe(JSON.stringify(P)) + '</script>\n' +
        '<script>window.CONFIG=' + safe(JSON.stringify(C)) + ';</script>\n<script>' + safe(t[1]) + '</script>\n<script>' + safe(t[2]) + '</script>\n' +
        '<script>Core.mount(document.getElementById("main"),JSON.parse(document.getElementById("project-data").textContent),window.CONFIG,{});Core.lightbox();</script>\n' +
        '<!-- 這個檔案可以拖回填寫頁的「載入」繼續修改 -->\n</body>\n</html>\n';
      var blob = new Blob([html], { type: 'text/html' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = title.replace(/[\\/:*?"<>|]/g, '') + '.html'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      alertMsg('已下載「' + a.download + '」（' + (blob.size / 1048576).toFixed(1) + ' MB）。換電腦時，把這個檔案用「載入」打開就能繼續改。');
    }).catch(function () { alertMsg('下載失敗，請重新整理頁面再試一次。'); })
      .then(function () { btn.disabled = false; btn.textContent = '下載我的網頁'; });
  });
  $('#file-load').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return; var rd = new FileReader();
    rd.onload = function () {
      try {
        var txt = rd.result, data;
        if (/^\s*[{[]/.test(txt)) data = JSON.parse(txt);
        else { var doc = new DOMParser().parseFromString(txt, 'text/html'), el = doc.getElementById('project-data'); if (!el) throw 0; data = JSON.parse(el.textContent); }
        P = merge(Core.blank(C), data); save(); build(); if (tab === 'preview') setTab('preview'); alertMsg('已載入，可以繼續修改。');
      } catch (e) { alertMsg('這個檔案不是從這裡下載的作品網頁，無法載入。'); }
    };
    rd.readAsText(f); this.value = '';
  });
  var armed = false;
  $('#btn-reset').addEventListener('click', function () {
    if (!armed) { armed = true; this.textContent = '確定要清除？再按一次'; var b = this; setTimeout(function () { armed = false; b.textContent = '清除全部'; }, 4000); return; }
    armed = false; this.textContent = '清除全部'; P = Core.blank(C); save(); build();
  });

  var mT;
  function alertMsg(t) { var m = $('#toast'); m.textContent = t; m.hidden = false; clearTimeout(mT); mT = setTimeout(function () { m.hidden = true; }, 6000); }

  /* ── 開始 ── */
  var top = $('.ed-top'); function setTb() { document.documentElement.style.setProperty('--tb', top.offsetHeight + 'px'); } setTb(); window.addEventListener('resize', setTb);
  $('#course').textContent = C.course;
  $('#rules').innerHTML = C.rules.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + (C.submitNote ? '<li>' + esc(C.submitNote) + '</li>' : '');
  if (C.exampleUrl) { var ex = $('#example-link'); ex.href = C.exampleUrl; ex.hidden = false; }
  Core.lightbox();
  idb('readonly', function (s) { return s.get('project'); }).then(function (d) { if (d) P = merge(Core.blank(C), d); build(); status(d ? '已載入上次的進度' : '還沒有填寫'); })
    .catch(function () { build(); status('這個瀏覽器無法自動儲存，請記得常下載備份', true); });
})();
