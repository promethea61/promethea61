// ============================================================
// PROMETHEA — Now Playing Sidebar (desktop only)
// ============================================================
(function () {
  'use strict';

  // Mobile: skip semua, biarkan tampilan awal
  if (window.innerWidth <= 768) return;

  // Sembunyikan Song Canvas lama
  const oldCanvas = document.getElementById('songCanvas');
  if (oldCanvas) oldCanvas.style.display = 'none';

  const style = document.createElement('style');
  style.textContent = `
    body {
      grid-template-columns: var(--sidebar) 1fr var(--np-width, 0px) !important;
      grid-template-areas: "sidebar main np" "player player player" !important;
      transition: grid-template-columns 0.35s cubic-bezier(0.23,1,0.32,1);
    }
    body.np-open { --np-width: 280px; }

    #npSidebar {
      grid-area: np;
      background: #000;
      border-left: 1px solid #1a1a1a;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      width: 0;
      opacity: 0;
      transition: width 0.35s cubic-bezier(0.23,1,0.32,1), opacity 0.35s ease;
      z-index: 10;
    }
    body.np-open #npSidebar { width: 280px; opacity: 1; }

    #npToggleBtn {
      background: none; border: none; color: var(--text-2);
      cursor: pointer; padding: 4px 8px; border-radius: 4px;
      transition: all .15s; display: flex; align-items: center; gap: 6px;
      font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    }
    #npToggleBtn:hover { color: var(--text); }
    #npToggleBtn.active { color: var(--green); }

    #npCoverWrap {
      position: relative; width: 100%; height: 340px;
      background: #111; overflow: hidden; flex-shrink: 0;
    }
    .np-cover-img {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; opacity: 0; transition: opacity 0.6s ease;
    }
    .np-cover-img.active { opacity: 1; }
    #npCoverWrap::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0;
      height: 55%; background: linear-gradient(to top, #000 0%, transparent 100%);
      pointer-events: none; z-index: 2;
    }

    #npProgressBars {
      position: absolute; top: 0; left: 0; right: 0;
      display: flex; gap: 3px; padding: 10px 10px 0; z-index: 3;
    }
    .np-pb { flex: 1; height: 2px; background: rgba(255,255,255,.2); border-radius: 1px; overflow: hidden; }
    .np-pb-fill { height: 100%; background: #fff; border-radius: 1px; width: 0%; }
    .np-pb.done .np-pb-fill { width: 100%; }
    .np-pb.active .np-pb-fill { animation: npBarAnim var(--np-dur, 4s) linear forwards; }
    @keyframes npBarAnim { from{width:0%} to{width:100%} }

    #npCounter {
      position: absolute; top: 10px; right: 10px;
      background: rgba(0,0,0,.55); backdrop-filter: blur(6px);
      border-radius: 20px; padding: 2px 8px;
      font-size: 10px; font-weight: 700; color: rgba(255,255,255,.7);
      z-index: 3; font-family: 'Space Mono', monospace; letter-spacing: .5px;
    }

    #npDots {
      position: absolute; bottom: 48px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 5px; z-index: 3;
      flex-wrap: wrap; max-width: 240px; justify-content: center;
    }
    .np-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,.3); transition: all .3s; flex-shrink: 0; }
    .np-dot.on { background: #fff; transform: scale(1.35); }

    #npInfo { padding: 14px 16px 10px; flex-shrink: 0; border-bottom: 1px solid #1a1a1a; }
    #npSongName { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #npAlbumName { font-size: 13px; color: var(--text-2); display: flex; align-items: center; gap: 6px; }
    .np-green-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); animation: npPulse 1.8s ease-in-out infinite; flex-shrink: 0; }
    @keyframes npPulse { 0%,100%{opacity:1}50%{opacity:.35} }

    #npQueue { flex: 1; overflow-y: auto; padding-bottom: 16px; }
    #npQueue::-webkit-scrollbar { width: 3px; }
    #npQueue::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    .np-queue-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 1px; padding: 12px 16px 8px; }
    .np-queue-item { display: flex; align-items: center; gap: 10px; padding: 8px 16px; cursor: pointer; border-radius: 4px; transition: background .12s; }
    .np-queue-item:hover { background: rgba(255,255,255,.06); }
    .np-queue-item.current { background: rgba(29,185,84,.1); }
    .np-q-thumb { width: 36px; height: 36px; border-radius: 4px; flex-shrink: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .np-q-thumb img { width:100%; height:100%; object-fit:cover; }
    .np-q-name { font-size: 13px; font-weight: 500; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
    .np-queue-item.current .np-q-name { color: var(--green); }
    .np-q-dur { font-size: 11px; color: var(--text-3); font-family: 'Space Mono', monospace; flex-shrink: 0; }
  `;
  document.head.appendChild(style);

  const sidebar = document.createElement('div');
  sidebar.id = 'npSidebar';
  sidebar.innerHTML = `
    <div id="npCoverWrap">
      <div id="npProgressBars"></div>
      <div id="npCounter">1/1</div>
      <div id="npPhotos"></div>
      <div id="npDots"></div>
    </div>
    <div id="npInfo">
      <div id="npSongName">—</div>
      <div id="npAlbumName"><span class="np-green-dot"></span><span id="npAlbumText">Promethea</span></div>
    </div>
    <div id="npQueue">
      <div class="np-queue-label">Antrian</div>
      <div id="npQueueList"></div>
    </div>
  `;

  const player = document.querySelector('.player');
  if (player) player.insertAdjacentElement('beforebegin', sidebar);
  else document.body.appendChild(sidebar);

  const playerRight = document.querySelector('.player-right');
  if (playerRight) {
    const btn = document.createElement('button');
    btn.id = 'npToggleBtn';
    btn.innerHTML = '◧ Now Playing';
    btn.title = 'Toggle Now Playing';
    btn.onclick = toggleNP;
    playerRight.appendChild(btn);
  }

  let npOpen = false;
  function toggleNP() {
    npOpen = !npOpen;
    document.body.classList.toggle('np-open', npOpen);
    const btn = document.getElementById('npToggleBtn');
    if (btn) btn.classList.toggle('active', npOpen);
  }

  let npPhotos = [], npIdx = 0, npTimer = null, npDur = 4000;

  function npGetPhotos(trackIdx) {
    if (typeof members === 'undefined') return [];
    const mem = members[trackIdx];
    return mem ? (mem.photos || []).slice(0, 24) : [];
  }

  function npBuild(photos) {
    const wrap = document.getElementById('npPhotos');
    const prog = document.getElementById('npProgressBars');
    const dots = document.getElementById('npDots');
    wrap.innerHTML = ''; prog.innerHTML = ''; dots.innerHTML = '';
    photos.forEach((src, i) => {
      const img = document.createElement('img');
      img.className = 'np-cover-img'; img.src = src; img.alt = '';
      wrap.appendChild(img);
      const pb = document.createElement('div');
      pb.className = 'np-pb';
      pb.innerHTML = '<div class="np-pb-fill"></div>';
      prog.appendChild(pb);
      const d = document.createElement('div');
      d.className = 'np-dot';
      dots.appendChild(d);
    });
  }

  function npShowPhoto(idx) {
    if (!npPhotos.length) return;
    if (idx < 0 || idx >= npPhotos.length) idx = 0;
    npIdx = idx;
    document.querySelectorAll('#npPhotos .np-cover-img').forEach((el, i) =>
      el.classList.toggle('active', i === idx));
    document.querySelectorAll('#npProgressBars .np-pb').forEach((pb, i) => {
      pb.classList.remove('done', 'active');
      const fill = pb.querySelector('.np-pb-fill');
      fill.style.animation = 'none';
      fill.style.width = i < idx ? '100%' : '0%';
      if (i < idx) pb.classList.add('done');
      if (i === idx) { void fill.offsetWidth; pb.classList.add('active'); fill.style.setProperty('--np-dur', npDur + 'ms'); }
    });
    document.querySelectorAll('#npDots .np-dot').forEach((d, i) =>
      d.classList.toggle('on', i === idx));
    document.getElementById('npCounter').textContent = `${idx + 1}/${npPhotos.length}`;
    clearTimeout(npTimer);
    npTimer = setTimeout(() => npShowPhoto((npIdx + 1) % npPhotos.length), npDur);
  }

  function npLoad(trackIdx) {
    const photos = npGetPhotos(trackIdx);
    npPhotos = photos;
    if (!photos.length) return;
    npBuild(photos);
    npShowPhoto(0);
  }

  function renderQueue(currentIdx) {
    const list = document.getElementById('npQueueList');
    if (!list || typeof tracks === 'undefined') return;
    list.innerHTML = tracks.map((t, i) => `
      <div class="np-queue-item ${i === currentIdx ? 'current' : ''}" onclick="playTrack(${i})">
        <div class="np-q-thumb ${t.g}">
          <img src="${t.img}" alt="${t.name}" onerror="this.style.display='none'">
        </div>
        <div class="np-q-name">${t.name}</div>
        <div class="np-q-dur">${t.dur}</div>
      </div>`).join('');
    setTimeout(() => {
      const cur = list.querySelector('.current');
      if (cur) cur.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 100);
  }

  const _orig = window.playTrack;
  window.playTrack = function (idx) {
    _orig(idx);
    const t = tracks[idx];
    if (t) {
      document.getElementById('npSongName').textContent = t.name;
      document.getElementById('npAlbumText').textContent = t.album;
    }
    npLoad(idx);
    renderQueue(idx);
    if (!npOpen) toggleNP();
  };

  setTimeout(() => {
    if (typeof cur !== 'undefined' && cur >= 0 && typeof tracks !== 'undefined') {
      const t = tracks[cur];
      if (t) {
        document.getElementById('npSongName').textContent = t.name;
        document.getElementById('npAlbumText').textContent = t.album;
      }
      npLoad(cur);
      renderQueue(cur);
    }
  }, 500);

  console.log('[Now Playing Sidebar v4 — desktop only] Loaded ✓');
})();
