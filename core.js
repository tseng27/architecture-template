/* 作品頁排版與 360° 導覽（填寫頁和下載的網頁共用）。需要 three.min.js。 */
window.Core = (function () {
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var has = function (s) { return s != null && String(s).trim() !== ''; };
  var paras = function (s) { return String(s).trim().split(/\n+/).map(function (p) { return '<p>' + esc(p.trim()) + '</p>'; }).join(''); };
  var TAG = { hand: '手繪', ai: 'AI 生成', photo: '照片' };
  var DEC = [['considered', '我考慮過', '列出至少兩個你想過的做法'], ['chosen', '最後決定', '你選了哪一個'], ['why', '為什麼', '為什麼選它、不選其他的？說出具體理由'], ['lens', '連到課本', '這個決定跟你選的透鏡有什麼關係']];
  var AI = [['tool', '工具', '你用了哪個 AI 工具'], ['prompt', '我的指令（摘要）', '你給 AI 的主要指令，要寫自己的，不要照抄範例'], ['problem', '不滿意的地方', 'AI 第一次給的結果哪裡不對？'], ['fix', '我怎麼改', '你怎麼修改指令或自己動手修正']];

  function blank(C) {
    var P = { title: '', subtitle: '', oneline: '', lens: '', author: '', cover: '' };
    C.stages.forEach(function (s) {
      var d = P[s.id] = { answer: '', decision: { considered: '', chosen: '', why: '', lens: '' } };
      s.fields.forEach(function (f) { d[f[0]] = ''; });
      if (s.images) d.images = s.images.map(function (im) { return { file: '', caption: '', type: im[0] }; });
      if (s.ai) d.ai = { tool: '', prompt: '', problem: '', fix: '' };
      if (s.tour) d.scenes = [];
      if (s.poster) d.poster = '';
    });
    return P;
  }

  function progress(P, C) {
    var total = 0, done = 0, per = {};
    function c(v) { total++; if (has(v)) done++; }
    ['title', 'oneline', 'lens', 'cover'].forEach(function (k) { c(P[k]); });
    C.stages.forEach(function (s) {
      var t0 = total, d0 = done, d = P[s.id] || {};
      c(d.answer); s.fields.forEach(function (f) { c(d[f[0]]); });
      (d.images || []).forEach(function (im) { c(im.file); });
      if (s.ai) AI.forEach(function (f) { c((d.ai || {})[f[0]]); });
      DEC.forEach(function (f) { c((d.decision || {})[f[0]]); });
      if (s.tour) c((d.scenes || []).length ? 'x' : '');
      if (s.poster) c(d.poster);
      per[s.id] = [done - d0, total - t0];
    });
    return { total: total, done: done, per: per };
  }

  function render(P, C, opt) {
    opt = opt || {};
    var H = opt.hints;
    function todo(h) { return H ? '<div class="todo"><span class="todo-tag">待填寫</span>' + esc(h) + '</div>' : ''; }
    function kv(rows, obj) {
      var r = rows.map(function (f) {
        var v = obj ? obj[f[0]] : '';
        if (has(v)) return '<div><dt>' + esc(f[1]) + '</dt><dd>' + paras(v) + '</dd></div>';
        return H ? '<div><dt>' + esc(f[1]) + '</dt><dd><span class="todo-inline">' + esc(f[2]) + '</span></dd></div>' : '';
      }).join('');
      return r ? '<dl class="kv">' + r + '</dl>' : '';
    }
    function figs(list, hints) {
      var out = (list || []).map(function (im, i) {
        var t = TAG[im.type] ? '<span class="tag tag-' + im.type + '">' + TAG[im.type] + '</span>' : '';
        if (has(im.file)) return '<figure class="fig"><button class="zoom" type="button" data-src="' + esc(im.file) + '"><img src="' + esc(im.file) + '" alt="' + esc(im.caption) + '"></button><figcaption>' + t + esc(im.caption) + '</figcaption></figure>';
        if (!H) return '';
        var h = (hints && hints[i] && hints[i][1]) || '上傳圖片';
        return '<figure class="fig ph"><div class="ph-box"><span>' + esc(h) + '</span></div><figcaption>' + t + '<span class="todo-inline">還沒上傳</span></figcaption></figure>';
      }).join('');
      return out ? '<div class="figs">' + out + '</div>' : '';
    }
    var h = '<header class="ex-head"><p class="eyebrow">' + esc(C.course) + (has(P.lens) ? ' · 透鏡：' + esc(P.lens) : '') + (has(P.author) ? ' · ' + esc(P.author) : '') + '</p>';
    h += '<h1>' + esc(has(P.title) ? P.title : (H ? '（作品名稱）' : '我的建築專題')) + (has(P.subtitle) ? '<small>' + esc(P.subtitle) + '</small>' : '') + '</h1>';
    h += has(P.oneline) ? '<p class="oneline">' + esc(P.oneline) + '</p>' : todo('用一句話說明你的設計');
    if (!has(P.lens)) h += todo('選一個課本透鏡：' + C.lenses.join('、'));
    h += has(P.cover) ? '<img class="ex-cover" src="' + esc(P.cover) + '" alt="封面">' : (H ? '<div class="ph-box cover-ph"><span>封面圖：放你最滿意的一張外觀圖</span></div>' : '');
    h += '</header><nav class="stage-nav" aria-label="六個階段">' + C.stages.map(function (s, i) { return '<a href="#st-' + s.id + '"><b>' + (i + 1) + '</b>' + esc(s.name) + '</a>'; }).join('') + '</nav>';
    C.stages.forEach(function (s, i) {
      var d = P[s.id] || {};
      var b = '<section class="stage" id="st-' + s.id + '"><div class="titleblock"><span class="no">圖號 ' + ('0' + (i + 1)).slice(-2) + '</span><h2>' + esc(s.name) + '</h2><span class="task">' + esc(s.task) + '</span></div>';
      b += '<div class="q"><span>思考</span><p>' + esc(s.q) + '</p></div>';
      b += has(d.answer) ? '<div class="answer">' + paras(d.answer) + '</div>' : todo(s.hint);
      if (s.fields.length) b += kv(s.fields, d);
      if (s.tour) {
        if ((d.scenes || []).length) b += '<div class="tour" data-tour="' + s.id + '"></div>';
        else b += todo('上傳至少兩個房間的 360° 全景圖，並用熱點把它們串起來');
      }
      if (d.images) b += figs(d.images, s.images);
      if (s.poster) b += has(d.poster) ? '<div class="figs"><figure class="fig"><button class="zoom" type="button" data-src="' + esc(d.poster) + '"><img src="' + esc(d.poster) + '" alt="成果海報"></button><figcaption>成果海報</figcaption></figure></div>' : todo('上傳成果海報');
      if (s.ai) { var a = kv(AI, d.ai); if (a) b += '<div class="record ai-rec"><h3>AI 生成紀錄</h3>' + a + '</div>'; }
      var dk = kv(DEC, d.decision); if (dk) b += '<div class="record"><h3>決策紀錄</h3>' + dk + '</div>';
      b += '</section>';
      h += b;
    });
    return h;
  }

  var tours = [];
  function unmount() { tours.forEach(function (t) { t.destroy(); }); tours = []; }
  function mount(root, P, C, opt) {
    tours.forEach(function (t) { t.destroy(); }); tours = [];
    root.innerHTML = render(P, C, opt);
    root.querySelectorAll('.tour').forEach(function (el) {
      var d = P[el.dataset.tour];
      tours.push(createTour(el, { scenes: d.scenes, start: d.scenes[0].id }, {}));
    });
  }

  function lightbox() {
    var lb = document.getElementById('lightbox'); if (!lb || lb.dataset.on) return; lb.dataset.on = 1;
    var img = lb.querySelector('img');
    document.addEventListener('click', function (e) {
      var z = e.target.closest && e.target.closest('.zoom');
      if (z) { img.src = z.dataset.src; lb.hidden = false; return; }
      if (!lb.hidden && (e.target === lb || e.target.closest('.lb-close'))) lb.hidden = true;
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.hidden = true; });
  }

  /* ───── 360° 導覽 ───── */
  var D2R = Math.PI / 180;
  function createTour(box, tour, opts) {
    var T = window.THREE; opts = opts || {};
    box.classList.add('tourbox');
    box.innerHTML = '<div class="t-stage"></div><div class="t-top"><span class="t-name"></span><span class="t-angle" hidden></span></div>' +
      '<div class="t-bar"><div class="t-list"></div><div class="t-tools"><button type="button" data-a="full">全螢幕</button><button type="button" data-a="gyro">陀螺儀</button><button type="button" data-a="cb">Cardboard</button><button type="button" data-a="xr" class="primary" hidden>進入 VR</button>' + (opts.angle === false ? '' : '<button type="button" data-a="angle">角度</button>') + '</div></div>' +
      '<div class="t-msg" hidden></div><button type="button" class="t-exit">離開 Cardboard</button><div class="t-aim" hidden></div>';
    var q = function (s) { return box.querySelector(s); };
    var stage = q('.t-stage');
    var renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.xr.enabled = true;
    stage.appendChild(renderer.domElement);
    var scene = new T.Scene(), camera = new T.PerspectiveCamera(75, 1, 0.1, 1000); scene.add(camera);
    var geo = new T.SphereGeometry(50, 64, 32); geo.scale(-1, 1, 1);
    var mat = new T.MeshBasicMaterial({ color: 0xffffff }), sphere = new T.Mesh(geo, mat); sphere.rotation.y = -Math.PI / 2; scene.add(sphere);
    var reticle = new T.Mesh(new T.RingGeometry(0.02, 0.032, 32), new T.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true }));
    reticle.position.z = -1.5; reticle.renderOrder = 10; reticle.visible = false; camera.add(reticle);
    var fill = new T.Mesh(new T.CircleGeometry(0.032, 32, 0, 0.0001), new T.MeshBasicMaterial({ color: 0x86bba7, depthTest: false, transparent: true }));
    fill.position.z = -1.49; fill.renderOrder = 11; fill.visible = false; camera.add(fill);
    var loader = new T.TextureLoader(), hot = [], cur = null, lon = 0, lat = 0, alive = true;

    function dirFrom(y, p, r) { return new T.Vector3(Math.sin(y * D2R) * Math.cos(p * D2R), Math.sin(p * D2R), -Math.cos(y * D2R) * Math.cos(p * D2R)).multiplyScalar(r); }
    function label(text) {
      var c = document.createElement('canvas'), x = c.getContext('2d'), F = '500 44px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
      x.font = F; var w = Math.ceil(x.measureText(text).width) + 150; c.width = w; c.height = 96; x.font = F;
      x.fillStyle = 'rgba(20,24,22,.8)'; x.beginPath(); if (x.roundRect) x.roundRect(0, 0, w, 96, 48); else x.rect(0, 0, w, 96); x.fill();
      x.fillStyle = '#86bba7'; x.beginPath(); x.arc(48, 48, 26, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#141816'; x.lineWidth = 7; x.beginPath(); x.moveTo(40, 34); x.lineTo(56, 48); x.lineTo(40, 62); x.stroke();
      x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText(text, 92, 50);
      var tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
      var s = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); s.scale.set(w / 96 * 1.6, 1.6, 1); s.renderOrder = 5; return s;
    }
    function show(id, keepView) {
      var sc = tour.scenes.filter(function (s) { return s.id === id; })[0] || tour.scenes[0]; if (!sc) return;
      var changed = cur !== sc; cur = sc;
      q('.t-name').textContent = sc.title || '';
      if (changed || !mat.map || mat.map.userData.src !== sc.image) {
        loader.load(sc.image, function (tex) { if (!alive) return; tex.colorSpace = T.SRGBColorSpace; tex.userData.src = sc.image; if (mat.map) mat.map.dispose(); mat.map = tex; mat.needsUpdate = true; });
      }
      hot.forEach(function (h) { scene.remove(h); h.material.map.dispose(); });
      hot = (sc.links || []).filter(function (l) { return l.to; }).map(function (l) { var s = label(l.label || '前往'); s.position.copy(dirFrom(+l.yaw || 0, +l.pitch || 0, 20)); s.userData.to = l.to; scene.add(s); return s; });
      if (!keepView) { lon = +sc.yaw || 0; lat = 0; offset = null; }
      var list = q('.t-list'); list.innerHTML = '';
      tour.scenes.forEach(function (s) { var b = document.createElement('button'); b.type = 'button'; b.textContent = s.title || '（未命名）'; if (s === cur) b.className = 'on'; b.onclick = function () { go(s.id); }; list.appendChild(b); });
    }
    function go(id) { show(id); if (opts.onScene) opts.onScene(id); }

    var drag = null, ray = new T.Raycaster(), ndc = new T.Vector2(), pickCb = null;
    stage.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, lon: lon, lat: lat, m: false }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', function (e) {
      if (!drag) return; var f = camera.fov / stage.clientHeight, dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.m = true; if (orientOn) return;
      lon = drag.lon - dx * f; lat = Math.max(-85, Math.min(85, drag.lat + dy * f));
    });
    stage.addEventListener('pointerup', function (e) {
      if (drag && !drag.m) {
        if (cb) exitCb();
        else {
          var r = renderer.domElement.getBoundingClientRect();
          ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
          if (pickCb) { var d = ray.ray.direction; var fn = pickCb; pickCb = null; box.classList.remove('picking'); fn(Math.round(Math.atan2(d.x, -d.z) / D2R), Math.round(Math.asin(d.y) / D2R)); }
          else { var hit = ray.intersectObjects(hot)[0]; if (hit) go(hit.object.userData.to); }
        }
      }
      drag = null;
    });
    stage.addEventListener('wheel', function (e) { e.preventDefault(); camera.fov = Math.max(35, Math.min(95, camera.fov + e.deltaY * 0.05)); camera.updateProjectionMatrix(); }, { passive: false });

    var orient = null, orientOn = false, offset = null;
    var qT = new T.Quaternion(), q1 = new T.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), zee = new T.Vector3(0, 0, 1), eul = new T.Euler(), q0 = new T.Quaternion(), qy = new T.Quaternion(), yA = new T.Vector3(0, 1, 0);
    function onOri(e) { if (e.alpha !== null) orient = e; }
    window.addEventListener('deviceorientation', onOri);
    function msg(t) { var m = q('.t-msg'); m.textContent = t; m.hidden = false; clearTimeout(msg.t); msg.t = setTimeout(function () { m.hidden = true; }, 3500); }
    function gyro() {
      var go2 = function () { orientOn = true; offset = null; q('[data-a=gyro]').classList.add('on'); };
      if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission)
        return DeviceOrientationEvent.requestPermission().then(function (r) { if (r === 'granted') go2(); else msg('需要允許「動作與方向」才能用陀螺儀'); }).catch(function () { msg('這台裝置不支援陀螺儀'); });
      go2(); return Promise.resolve();
    }
    function applyOri() {
      var sa = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
      eul.set(orient.beta * D2R, orient.alpha * D2R, -orient.gamma * D2R, 'YXZ'); qT.setFromEuler(eul); qT.multiply(q1); qT.multiply(q0.setFromAxisAngle(zee, -sa * D2R));
      if (offset === null) { var f = new T.Vector3(0, 0, -1).applyQuaternion(qT); offset = Math.atan2(f.x, -f.z) - lon * D2R; }
      qy.setFromAxisAngle(yA, offset); camera.quaternion.copy(qy).multiply(qT);
    }
    function fs(on) {
      var el = box;
      if (on && el.requestFullscreen) return el.requestFullscreen().catch(function () {});
      if (on && el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); return Promise.resolve(); }
      if (!on && document.fullscreenElement) return document.exitFullscreen().catch(function () {});
      return Promise.resolve();
    }
    var cb = false, gT = null, gS = 0;
    function enterCb() {
      gyro().then(function () {
        cb = true; box.classList.add('cardboard'); reticle.visible = true;
        fs(true).then(function () { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); }); resize();
      });
    }
    function exitCb() { cb = false; box.classList.remove('cardboard'); reticle.visible = false; fill.visible = false; fs(false); resize(); }
    function onFs() { if (!document.fullscreenElement && cb) exitCb(); setTimeout(resize, 50); }
    document.addEventListener('fullscreenchange', onFs);
    var center = new T.Vector2();
    function gaze(cam) {
      ray.setFromCamera(center, cam); var hit = ray.intersectObjects(hot)[0], now = performance.now(), t = hit ? hit.object : null;
      if (t !== gT) { gT = t; gS = now; }
      var p = t ? Math.min(1, (now - gS) / 1500) : 0; fill.visible = p > 0;
      fill.geometry.dispose(); fill.geometry = new T.CircleGeometry(0.032, 32, Math.PI / 2, -Math.max(0.0001, p) * Math.PI * 2);
      if (p >= 1) { gT = null; go(t.userData.to); }
    }
    var xrS = null, xrB = q('[data-a=xr]');
    if (navigator.xr && navigator.xr.isSessionSupported) navigator.xr.isSessionSupported('immersive-vr').then(function (ok) { if (ok) xrB.hidden = false; }).catch(function () {});
    var tm = new T.Matrix4();
    [0, 1].forEach(function (i) {
      var c = renderer.xr.getController(i); scene.add(c);
      c.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3(0, 0, -30)]), new T.LineBasicMaterial({ color: 0x86bba7 })));
      c.addEventListener('select', function () { tm.identity().extractRotation(c.matrixWorld); ray.ray.origin.setFromMatrixPosition(c.matrixWorld); ray.ray.direction.set(0, 0, -1).applyMatrix4(tm); var hit = ray.intersectObjects(hot)[0]; if (hit) go(hit.object.userData.to); });
    });
    var angleOn = false;
    box.querySelector('.t-tools').addEventListener('click', function (e) {
      var a = e.target.dataset && e.target.dataset.a; if (!a) return;
      if (a === 'full') fs(!document.fullscreenElement);
      if (a === 'gyro') { if (orientOn) { orientOn = false; e.target.classList.remove('on'); } else gyro(); }
      if (a === 'cb') enterCb();
      if (a === 'angle') { angleOn = !angleOn; e.target.classList.toggle('on', angleOn); q('.t-angle').hidden = !angleOn; q('.t-aim').hidden = !angleOn; }
      if (a === 'xr') {
        if (xrS) { xrS.end(); return; }
        navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] }).then(function (s) {
          xrS = s; renderer.xr.setSession(s); reticle.visible = true; xrB.textContent = '離開 VR';
          s.addEventListener('end', function () { xrS = null; reticle.visible = false; fill.visible = false; xrB.textContent = '進入 VR'; });
        }).catch(function () { msg('無法進入 VR，請在頭盔的瀏覽器中開啟'); });
      }
    });
    q('.t-exit').addEventListener('click', exitCb);
    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h); camera.aspect = cb ? (w / 2) / h : w / h; camera.updateProjectionMatrix();
    }
    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null; if (ro) ro.observe(stage); else window.addEventListener('resize', resize); resize();
    var fwd = new T.Vector3();
    renderer.setAnimationLoop(function () {
      if (renderer.xr.isPresenting) { gaze(renderer.xr.getCamera()); renderer.render(scene, camera); return; }
      if (orientOn && orient) applyOri(); else camera.rotation.set(lat * D2R, -lon * D2R, 0, 'YXZ');
      if (angleOn) { camera.getWorldDirection(fwd); q('.t-angle').textContent = 'yaw ' + Math.round(Math.atan2(fwd.x, -fwd.z) / D2R) + '°  pitch ' + Math.round(Math.asin(fwd.y) / D2R) + '°'; }
      var w = stage.clientWidth, h = stage.clientHeight;
      if (cb) {
        gaze(camera); renderer.setScissorTest(true);
        renderer.setViewport(0, 0, w / 2, h); renderer.setScissor(0, 0, w / 2, h); renderer.render(scene, camera);
        renderer.setViewport(w / 2, 0, w / 2, h); renderer.setScissor(w / 2, 0, w / 2, h); renderer.render(scene, camera);
        renderer.setScissorTest(false);
      } else { renderer.setViewport(0, 0, w, h); renderer.render(scene, camera); }
    });
    show(tour.start || (tour.scenes[0] && tour.scenes[0].id));
    return {
      show: show,
      setTour: function (t, id) { tour = t; show(id || (cur && cur.id), true); },
      pick: function (fn) { pickCb = fn; box.classList.add('picking'); msg('在畫面上點一下要放熱點的位置'); },
      current: function () { return cur && cur.id; },
      destroy: function () {
        alive = false; renderer.setAnimationLoop(null); if (ro) ro.disconnect(); window.removeEventListener('deviceorientation', onOri);
        document.removeEventListener('fullscreenchange', onFs); if (mat.map) mat.map.dispose(); renderer.dispose(); box.innerHTML = '';
      }
    };
  }

  return { unmount: unmount, esc: esc, has: has, blank: blank, progress: progress, render: render, mount: mount, lightbox: lightbox, createTour: createTour };
})();
