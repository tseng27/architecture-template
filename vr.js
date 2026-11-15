/* 360° 導覽檢視器：電腦拖曳、手機陀螺儀、Google Cardboard 分屏、Meta Quest（WebXR）
   需要先載入 three.min.js 和 tours.js（window.VRTOURS） */
(function () {
  var T = window.THREE, TOURS = window.VRTOURS || {};
  var $ = function (s) { return document.querySelector(s); };
  var keys = Object.keys(TOURS);
  var hash = decodeURIComponent((location.hash || '').slice(1));
  var tourKey = TOURS[hash] ? hash : keys[0];
  var tour = TOURS[tourKey];
  if (!tour) { $('#vr-title').textContent = '找不到導覽資料，請檢查 tours.js'; return; }
  var backLink = $('#vr-back');
  if (backLink && tour.back) backLink.href = tour.back;
  $('#vr-title').textContent = tour.title;
  document.title = tour.title + '｜360° 導覽';

  var D2R = Math.PI / 180;
  var stage = $('#vr-stage');
  var renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.xr.enabled = true;
  stage.appendChild(renderer.domElement);
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(75, 1, 0.1, 1000);
  scene.add(camera);

  // 全景球
  var geo = new T.SphereGeometry(50, 64, 32); geo.scale(-1, 1, 1);
  var mat = new T.MeshBasicMaterial({ color: 0xffffff });
  var sphere = new T.Mesh(geo, mat); sphere.rotation.y = -Math.PI / 2;
  scene.add(sphere);
  var loader = new T.TextureLoader();

  // 準星（Cardboard 與 Quest 用）
  var reticle = new T.Mesh(new T.RingGeometry(0.02, 0.032, 32), new T.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: .9 }));
  reticle.position.z = -1.5; reticle.renderOrder = 10; camera.add(reticle); reticle.visible = false;
  var fill = new T.Mesh(new T.CircleGeometry(0.032, 32, 0, 0.0001), new T.MeshBasicMaterial({ color: 0x86bba7, depthTest: false, transparent: true }));
  fill.position.z = -1.49; fill.renderOrder = 11; camera.add(fill);

  function dirFrom(yaw, pitch, r) {
    return new T.Vector3(Math.sin(yaw * D2R) * Math.cos(pitch * D2R), Math.sin(pitch * D2R), -Math.cos(yaw * D2R) * Math.cos(pitch * D2R)).multiplyScalar(r);
  }
  function label(text) {
    var c = document.createElement('canvas'), x = c.getContext('2d');
    var fs = 44; x.font = '500 ' + fs + 'px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
    var w = Math.ceil(x.measureText(text).width) + 150; c.width = w; c.height = 96;
    x.font = '500 ' + fs + 'px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
    x.fillStyle = 'rgba(20,24,22,.78)'; x.beginPath(); x.roundRect(0, 0, w, 96, 48); x.fill();
    x.fillStyle = '#86bba7'; x.beginPath(); x.arc(48, 48, 26, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#141816'; x.lineWidth = 7; x.beginPath(); x.moveTo(40, 34); x.lineTo(56, 48); x.lineTo(40, 62); x.stroke();
    x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText(text, 92, 50);
    var tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    var s = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    s.scale.set(w / 96 * 1.6, 1.6, 1); s.renderOrder = 5;
    return s;
  }

  var hotspots = [], current = null, lon = 0, lat = 0;
  function show(id) {
    var sc = tour.scenes.find(function (s) { return s.id === id; }) || tour.scenes[0];
    current = sc;
    $('#vr-scene').textContent = sc.title;
    $('#vr-loading').hidden = false;
    loader.load(sc.image, function (tex) {
      tex.colorSpace = T.SRGBColorSpace;
      if (mat.map) mat.map.dispose();
      mat.map = tex; mat.needsUpdate = true;
      $('#vr-loading').hidden = true;
    }, undefined, function () { $('#vr-loading').textContent = '圖片載入失敗：' + sc.image; });
    hotspots.forEach(function (h) { scene.remove(h); });
    hotspots = (sc.links || []).map(function (l) {
      var s = label(l.label || '前往'); s.position.copy(dirFrom(l.yaw, l.pitch || 0, 20)); s.userData.to = l.to; scene.add(s); return s;
    });
    lon = sc.yaw || 0; lat = 0; orientOffset = null;
    renderList();
  }
  function renderList() {
    var ul = $('#vr-list'); ul.innerHTML = '';
    tour.scenes.forEach(function (s) {
      var b = document.createElement('button'); b.textContent = s.title; b.className = s === current ? 'on' : '';
      b.onclick = function () { show(s.id); }; ul.appendChild(b);
    });
  }

  // 電腦與手機拖曳
  var drag = null;
  stage.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, lon: lon, lat: lat, moved: false }; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', function (e) {
    if (!drag) return; var f = camera.fov / stage.clientHeight;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    lon = drag.lon - dx * f; lat = Math.max(-85, Math.min(85, drag.lat + dy * f));
  });
  stage.addEventListener('pointerup', function (e) {
    if (drag && !drag.moved) {
      if (cardboard) { exitCardboard(); } else { pick(e); }
    }
    drag = null;
  });
  stage.addEventListener('wheel', function (e) { e.preventDefault(); camera.fov = Math.max(35, Math.min(95, camera.fov + e.deltaY * 0.05)); camera.updateProjectionMatrix(); }, { passive: false });
  var ray = new T.Raycaster(), ndc = new T.Vector2();
  function pick(e) {
    var r = renderer.domElement.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var hit = ray.intersectObjects(hotspots)[0]; if (hit) show(hit.object.userData.to);
  }

  // 陀螺儀
  var orient = null, orientOn = false, orientOffset = null, screenAngle = 0;
  var qTmp = new T.Quaternion(), q1 = new T.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), zee = new T.Vector3(0, 0, 1), eul = new T.Euler(), q0 = new T.Quaternion(), qy = new T.Quaternion(), yAxis = new T.Vector3(0, 1, 0);
  window.addEventListener('deviceorientation', function (e) { if (e.alpha !== null) orient = e; });
  function screenOri() { screenAngle = (screen.orientation && screen.orientation.angle) || window.orientation || 0; }
  window.addEventListener('orientationchange', screenOri); screenOri();
  function enableOrient() {
    var p = window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission;
    var go = function () { orientOn = true; orientOffset = null; $('#btn-gyro').classList.add('on'); };
    if (p) return DeviceOrientationEvent.requestPermission().then(function (r) { if (r === 'granted') go(); else alertMsg('需要允許「動作與方向」才能用陀螺儀'); }).catch(function () { alertMsg('這台裝置不支援陀螺儀'); });
    go(); return Promise.resolve();
  }
  function applyOrient() {
    eul.set(orient.beta * D2R, orient.alpha * D2R, -orient.gamma * D2R, 'YXZ');
    qTmp.setFromEuler(eul); qTmp.multiply(q1); qTmp.multiply(q0.setFromAxisAngle(zee, -screenAngle * D2R));
    if (orientOffset === null) {
      var f = new T.Vector3(0, 0, -1).applyQuaternion(qTmp); var h = Math.atan2(f.x, -f.z);
      orientOffset = h - lon * D2R;
    }
    qy.setFromAxisAngle(yAxis, orientOffset);
    camera.quaternion.copy(qy).multiply(qTmp);
  }

  // Cardboard 分屏
  var cardboard = false, gazeTarget = null, gazeStart = 0;
  function enterCardboard() {
    enableOrient().then(function () {
      cardboard = true; document.body.classList.add('cardboard'); reticle.visible = true;
      var el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().then(function () { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); }).catch(function () {});
      resize();
    });
  }
  function exitCardboard() {
    cardboard = false; document.body.classList.remove('cardboard'); reticle.visible = false; fill.visible = false;
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    resize();
  }
  document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && cardboard) exitCardboard(); });

  // 準星注視選取（Cardboard 與沒有手把的 VR）
  var center = new T.Vector2(0, 0);
  function gaze(cam) {
    ray.setFromCamera(center, cam);
    var hit = ray.intersectObjects(hotspots)[0], now = performance.now();
    var t = hit ? hit.object : null;
    if (t !== gazeTarget) { gazeTarget = t; gazeStart = now; }
    var p = t ? Math.min(1, (now - gazeStart) / 1500) : 0;
    fill.visible = p > 0; fill.geometry.dispose(); fill.geometry = new T.CircleGeometry(0.032, 32, Math.PI / 2, -Math.max(0.0001, p) * Math.PI * 2);
    if (p >= 1) { gazeTarget = null; show(t.userData.to); }
  }

  // Meta Quest：WebXR
  var xrBtn = $('#btn-xr');
  if (navigator.xr && navigator.xr.isSessionSupported) {
    navigator.xr.isSessionSupported('immersive-vr').then(function (ok) { if (ok) xrBtn.hidden = false; }).catch(function () {});
  }
  var xrSession = null;
  xrBtn.addEventListener('click', function () {
    if (xrSession) { xrSession.end(); return; }
    navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] }).then(function (s) {
      xrSession = s; renderer.xr.setSession(s); reticle.visible = true; xrBtn.textContent = '離開 VR';
      s.addEventListener('end', function () { xrSession = null; reticle.visible = false; fill.visible = false; xrBtn.textContent = '進入 VR（Quest）'; });
    }).catch(function () { alertMsg('無法進入 VR，請確認是在頭盔的瀏覽器中開啟'); });
  });
  // Quest 手把：扳機選取
  var tmpM = new T.Matrix4();
  [0, 1].forEach(function (i) {
    var c = renderer.xr.getController(i); scene.add(c);
    var line = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3(0, 0, -30)]), new T.LineBasicMaterial({ color: 0x86bba7 }));
    c.add(line);
    c.addEventListener('select', function () {
      tmpM.identity().extractRotation(c.matrixWorld);
      ray.ray.origin.setFromMatrixPosition(c.matrixWorld); ray.ray.direction.set(0, 0, -1).applyMatrix4(tmpM);
      var hit = ray.intersectObjects(hotspots)[0]; if (hit) show(hit.object.userData.to);
    });
  });

  // 角度讀數（學生設定熱點位置用）
  var angleOn = false;
  $('#btn-angle').addEventListener('click', function () { angleOn = !angleOn; this.classList.toggle('on', angleOn); $('#vr-angle').hidden = !angleOn; });
  $('#btn-gyro').addEventListener('click', function () { if (orientOn) { orientOn = false; this.classList.remove('on'); } else enableOrient(); });
  $('#btn-cardboard').addEventListener('click', enterCardboard);
  $('#vr-exit').addEventListener('click', exitCardboard);

  var msgT;
  function alertMsg(t) { var m = $('#vr-msg'); m.textContent = t; m.hidden = false; clearTimeout(msgT); msgT = setTimeout(function () { m.hidden = true; }, 3500); }

  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h); camera.aspect = cardboard ? (w / 2) / h : w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  var fwd = new T.Vector3();
  renderer.setAnimationLoop(function () {
    if (renderer.xr.isPresenting) {
      gaze(renderer.xr.getCamera());
      renderer.render(scene, camera); return;
    }
    if (orientOn && orient) applyOrient();
    else { camera.rotation.set(lat * D2R, -lon * D2R, 0, 'YXZ'); }
    if (angleOn) {
      camera.getWorldDirection(fwd);
      var y = Math.round(Math.atan2(fwd.x, -fwd.z) / D2R), p = Math.round(Math.asin(fwd.y) / D2R);
      $('#vr-angle').textContent = 'yaw ' + y + '°　pitch ' + p + '°';
    }
    var w = stage.clientWidth, h = stage.clientHeight;
    if (cardboard) {
      gaze(camera);
      renderer.setScissorTest(true);
      renderer.setViewport(0, 0, w / 2, h); renderer.setScissor(0, 0, w / 2, h); renderer.render(scene, camera);
      renderer.setViewport(w / 2, 0, w / 2, h); renderer.setScissor(w / 2, 0, w / 2, h); renderer.render(scene, camera);
      renderer.setScissorTest(false);
    } else {
      renderer.setViewport(0, 0, w, h); renderer.render(scene, camera);
    }
  });

  show(tour.start || tour.scenes[0].id);
})();
