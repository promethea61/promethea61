// ============================================================
// PROMETHEA UPGRADE PATCH — v3 (Ken Burns fixed + hover video + Song Canvas)
// ============================================================

(function() {
  'use strict';

  function isDriveUrl(src) {
    return typeof src === 'string' && src.includes('drive.google.com');
  }

  function getDriveDirectUrl(src, isVideo) {
    let fileId = null;
    const matchFile = src.match(/\/file\/d\/([^/\?&]+)/);
    const matchUc   = src.match(/[?&]id=([^&]+)/);
    if (matchFile) fileId = matchFile[1];
    else if (matchUc) fileId = matchUc[1];
    if (!fileId) return src;
    if (isVideo) return `https://drive.google.com/file/d/${fileId}/preview`;
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // ==========================================================
  // 1. MEMORIES — Ken Burns + hover video
  // ==========================================================

  const MEM_STYLE = `
    .mem-card { overflow: hidden; position: relative; }
    .mem-img { overflow: hidden; position: relative; }

    @keyframes kenBurns {
      0%   { transform: scale(1.00) translate(  0px,  0px); }
      25%  { transform: scale(1.07) translate( -6px, -4px); }
      50%  { transform: scale(1.12) translate(  5px, -8px); }
      75%  { transform: scale(1.07) translate( -4px,  3px); }
      100% { transform: scale(1.04) translate(  3px, -3px); }
    }

    .mem-hover-vid {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: inherit;
      opacity: 0;
      pointer-events: none;
      z-index: 1;
      transform: scale(1.09);
      transition: opacity 0.35s ease;
      animation: none !important;
    }
    .mem-hover-iframe {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: none;
      border-radius: inherit;
      opacity: 0;
      pointer-events: none;
      z-index: 1;
      transform: scale(1.09);
      transition: opacity 0.35s ease;
    }
    .mem-card:hover .mem-hover-vid,
    .mem-card:hover .mem-hover-iframe { opacity: 1; }

    .mem-img .mem-emoji { z-index: 2; position: relative; }
    .mem-img .mem-play-btn { z-index: 3; }

    .mem-card {
      transition: transform 0.3s cubic-bezier(0.23,1,0.32,1),
                  box-shadow 0.3s ease;
    }
    .mem-card:hover {
      transform: translateY(-6px) scale(1.02) !important;
      box-shadow: 0 20px 40px rgba(29,185,84,.18), 0 8px 16px rgba(0,0,0,.5) !important;
    }
    .mem-card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 8px;
      border: 1px solid transparent;
      transition: border-color 0.3s;
      pointer-events: none;
    }
    .mem-card:hover::after { border-color: rgba(29,185,84,.35); }
  `;

  // delay per index
  const KB_DELAYS = [0, -3, -6, -9, -1.5, -4.5, -7.5, -11, -2, -5, -8, -12];

  function injectStyle(css) {
    const el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  }

  injectStyle(MEM_STYLE);

  function isVideoSrc(src) {
    return /\.(mp4|mov|webm|ogg)(\?.*)?$/i.test(src);
  }

  // Set Ken Burns langsung ke elemen img via inline style
  function applyKenBurns(img, idx) {
    if (!img || img._kb) return;
    img._kb = true;
    const delay = (KB_DELAYS[idx] !== undefined ? KB_DELAYS[idx] : 0) + 's';
    img.style.cssText = [
      'position:absolute',
      'inset:0',
      'width:100%',
      'height:100%',
      'object-fit:cover',
      'border-radius:inherit',
      'transform-origin:center center',
      'will-change:transform',
      `animation:kenBurns 14s ease-in-out ${delay} infinite alternate`,
    ].join(';');

    // Pause saat hover card, resume saat leave
    const card = img.closest('.mem-card');
    if (card && !card._kbHover) {
      card._kbHover = true;
      card.addEventListener('mouseenter', () => { img.style.animationPlayState = 'paused'; });
      card.addEventListener('mouseleave', () => { img.style.animationPlayState = 'running'; });
    }
  }

  function patchMemoryCards() {
    document.querySelectorAll('#memoriesGrid .mem-card').forEach((card, i) => {
      if (card._upgraded) return;
      card._upgraded = true;

      const mem = typeof memories !== 'undefined' ? memories[i] : null;
      if (!mem) return;

      const vidSrc = (mem.imgs || []).find(s => isVideoSrc(s));
      const imgSrc = (mem.imgs || []).find(s => !isVideoSrc(s));
      const imgWrap = card.querySelector('.mem-img');
      if (!imgWrap) return;

      let coverImg = imgWrap.querySelector('img:not(.mem-hover-vid)');

      // Fix Drive URL
      if (coverImg && isDriveUrl(coverImg.src)) {
        coverImg.src = getDriveDirectUrl(coverImg.src, false);
      }

      // Buat coverImg baru kalau belum ada
      if (!coverImg && imgSrc) {
        coverImg = document.createElement('img');
        coverImg.src = isDriveUrl(imgSrc) ? getDriveDirectUrl(imgSrc, false) : imgSrc;
        imgWrap.insertBefore(coverImg, imgWrap.firstChild);
      }

      // Apply Ken Burns ke cover img
      if (coverImg) applyKenBurns(coverImg, i);

      // Hover video inject
      if (vidSrc && !imgWrap.querySelector('.mem-hover-vid') && !imgWrap.querySelector('.mem-hover-iframe')) {
        if (isDriveUrl(vidSrc)) {
          const iframe = document.createElement('iframe');
          iframe.className = 'mem-hover-iframe';
          iframe.src = '';
          iframe.allow = 'autoplay';
          imgWrap.appendChild(iframe);
          card.addEventListener('mouseenter', () => {
            if (!iframe.src || iframe.src === window.location.href)
              iframe.src = getDriveDirectUrl(vidSrc, true);
          });
          card.addEventListener('mouseleave', () => { iframe.src = ''; });
        } else {
          const vid = document.createElement('video');
          vid.className = 'mem-hover-vid';
          vid.src = vidSrc;
          vid.muted = true;
          vid.loop = true;
          vid.playsInline = true;
          vid.preload = 'none';
          imgWrap.appendChild(vid);
          card.addEventListener('mouseenter', () => {
            vid.load();
            const p = vid.play();
            if (p) p.catch(() => { vid.play().catch(() => {}); });
          });
          card.addEventListener('mouseleave', () => { vid.pause(); vid.currentTime = 0; });
        }
      }

      // Parallax tilt
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width/2)  / (rect.width/2);
        const dy = (e.clientY - rect.top  - rect.height/2) / (rect.height/2);
        card.style.transform = `translateY(-6px) scale(1.02) perspective(600px) rotateY(${dx*4}deg) rotateX(${-dy*4}deg)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  let memPollCount = 0;
  const memPoll = setInterval(() => {
    const grid = document.getElementById('memoriesGrid');
    if (grid && grid.children.length > 0) { patchMemoryCards(); clearInterval(memPoll); }
    if (++memPollCount > 40) clearInterval(memPoll);
  }, 200);

  const origSwitchTab = window.switchTab;
  if (origSwitchTab) {
    window.switchTab = function(tab) {
      origSwitchTab(tab);
      if (tab === 'memories') setTimeout(patchMemoryCards, 100);
    };
  }

  // ==========================================================
  // 2. SONG CANVAS POPUP
  // ==========================================================

  const CANVAS_STYLE = `
    #songCanvas {
      position: fixed; right: 24px; bottom: calc(90px + 16px);
      width: 220px; border-radius: 16px; overflow: hidden;
      background: #111;
      box-shadow: 0 24px 60px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.07);
      z-index: 50; transform: translateY(20px) scale(0.95); opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s cubic-bezier(0.23,1,0.32,1), transform 0.4s cubic-bezier(0.23,1,0.32,1);
    }
    #songCanvas.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
    #songCanvas .sc-frame { position: relative; width: 220px; height: 330px; }
    #songCanvas .sc-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.7s ease; }
    #songCanvas .sc-photo.active { opacity: 1; }
    #songCanvas .sc-grad { position: absolute; bottom: 0; left: 0; right: 0; height: 60%; background: linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 100%); pointer-events: none; }
    #songCanvas .sc-info { position: absolute; bottom: 12px; left: 12px; right: 12px; }
    #songCanvas .sc-song { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; text-shadow: 0 1px 6px rgba(0,0,0,.6); }
    #songCanvas .sc-class { font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(255,255,255,.7); display: flex; align-items: center; gap: 6px; }
    #songCanvas .sc-dot { width: 6px; height: 6px; border-radius: 50%; background: #1DB954; animation: scPulse 1.5s ease-in-out infinite; flex-shrink: 0; }
    @keyframes scPulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: .7; } }
    #songCanvas .sc-progress { position: absolute; top: 0; left: 0; right: 0; display: flex; gap: 3px; padding: 8px 10px 0; }
    #songCanvas .sc-pb { flex: 1; height: 2px; background: rgba(255,255,255,.25); border-radius: 1px; overflow: hidden; }
    #songCanvas .sc-pb-fill { height: 100%; background: #fff; border-radius: 1px; width: 0%; }
    #songCanvas .sc-pb.done .sc-pb-fill { width: 100%; }
    #songCanvas .sc-pb.active .sc-pb-fill { animation: scBarAnim var(--sc-dur, 4s) linear forwards; }
    @keyframes scBarAnim { from { width: 0% } to { width: 100% } }
    #songCanvas .sc-close { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,.45); backdrop-filter: blur(6px); border: none; color: rgba(255,255,255,.8); font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s; z-index: 2; }
    #songCanvas .sc-close:hover { background: rgba(255,255,255,.2); }
    #songCanvas .sc-counter { position: absolute; top: 36px; right: 10px; font-size: 10px; font-weight: 700; color: rgba(255,255,255,.55); letter-spacing: .5px; font-family: 'Space Mono', monospace; }
    #songCanvas .sc-dots { position: absolute; bottom: 44px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; max-width: 190px; flex-wrap: wrap; justify-content: center; }
    #songCanvas .sc-d { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,.3); transition: background .3s, transform .3s; flex-shrink: 0; }
    #songCanvas .sc-d.on { background: #fff; transform: scale(1.4); }
    @media(max-width:768px) { #songCanvas { right: 12px; width: 160px; bottom: calc(90px + 12px); } #songCanvas .sc-frame { width: 160px; height: 240px; } }
  `;

  injectStyle(CANVAS_STYLE);

  const canvasEl = document.createElement('div');
  canvasEl.id = 'songCanvas';
  canvasEl.innerHTML = `
    <div class="sc-frame">
      <div class="sc-progress" id="scProgress"></div>
      <div id="scPhotos"></div>
      <div class="sc-grad"></div>
      <div class="sc-counter" id="scCounter"></div>
      <div class="sc-dots" id="scDots"></div>
      <div class="sc-info">
        <div class="sc-song" id="scSong">—</div>
        <div class="sc-class"><span class="sc-dot"></span><span id="scClass">Promethea</span></div>
      </div>
      <button class="sc-close" id="scClose">✕</button>
    </div>
  `;
  document.body.appendChild(canvasEl);

  let scPhotos = [], scIdx = 0, scTimer = null, scDuration = 4000;
  let scDismissed = false, scCurrentTrack = 0;

  document.getElementById('scClose').addEventListener('click', () => {
    scDismissed = true; canvasEl.classList.remove('visible'); clearTimeout(scTimer);
  });

  function scGetPhotos(trackIdx) {
    if (typeof members === 'undefined') return [];
    const mem = members[trackIdx];
    if (!mem) return [];
    return (mem.photos || []).slice(0, 20);
  }

  function scBuild(photos) {
    const pw = document.getElementById('scPhotos');
    const prog = document.getElementById('scProgress');
    const dots = document.getElementById('scDots');
    pw.innerHTML = ''; prog.innerHTML = ''; dots.innerHTML = '';
    photos.forEach((src, i) => {
      const img = document.createElement('img');
      img.className = 'sc-photo';
      img.src = isDriveUrl(src) ? getDriveDirectUrl(src, false) : src;
      img.alt = '';
      pw.appendChild(img);
      const pb = document.createElement('div');
      pb.className = 'sc-pb';
      pb.innerHTML = '<div class="sc-pb-fill"></div>';
      prog.appendChild(pb);
      const d = document.createElement('div');
      d.className = 'sc-d';
      dots.appendChild(d);
    });
  }

  function scShow(idx) {
    if (idx < 0 || idx >= scPhotos.length) { scIdx = 0; idx = 0; }
    scIdx = idx;
    document.querySelectorAll('#scPhotos .sc-photo').forEach((el, i) => el.classList.toggle('active', i === idx));
    document.querySelectorAll('#scProgress .sc-pb').forEach((pb, i) => {
      pb.classList.remove('done', 'active');
      const fill = pb.querySelector('.sc-pb-fill');
      fill.style.animation = 'none';
      fill.style.width = i < idx ? '100%' : '0%';
      if (i < idx) pb.classList.add('done');
      if (i === idx) { void fill.offsetWidth; pb.classList.add('active'); fill.style.setProperty('--sc-dur', scDuration + 'ms'); }
    });
    document.querySelectorAll('#scDots .sc-d').forEach((d, i) => d.classList.toggle('on', i === idx));
    document.getElementById('scCounter').textContent = `${idx+1}/${scPhotos.length}`;
    clearTimeout(scTimer);
    scTimer = setTimeout(() => scShow((scIdx + 1) % scPhotos.length), scDuration);
  }

  function scOpen(trackIdx) {
    if (scDismissed && scCurrentTrack === trackIdx) return;
    scDismissed = false; scCurrentTrack = trackIdx;
    const t = (typeof tracks !== 'undefined') ? tracks[trackIdx] : null;
    if (t) { document.getElementById('scSong').textContent = t.name; document.getElementById('scClass').textContent = t.album; }
    const photos = scGetPhotos(trackIdx);
    if (!photos.length) { canvasEl.classList.remove('visible'); return; }
    scPhotos = photos; scBuild(photos); canvasEl.classList.add('visible'); scShow(0);
  }

  const _origPlayTrack = window.playTrack;
  window.playTrack = function(idx) {
    _origPlayTrack(idx);
    if (scCurrentTrack !== idx) scDismissed = false;
    setTimeout(() => {
      const audioEl = document.getElementById('audioEl');
      if (audioEl && !audioEl.paused) { scOpen(idx); }
      else if (audioEl) {
        const onPlay = () => { scOpen(idx); audioEl.removeEventListener('play', onPlay); };
        audioEl.addEventListener('play', onPlay);
      }
    }, 200);
  };

  const audioEl = document.getElementById('audioEl');
  if (audioEl) {
    audioEl.addEventListener('play', () => { if (scCurrentTrack >= 0 && !scDismissed) scOpen(scCurrentTrack); });
    audioEl.addEventListener('pause', () => {
      document.querySelectorAll('#scProgress .sc-pb.active .sc-pb-fill').forEach(f => f.style.animationPlayState = 'paused');
      clearTimeout(scTimer);
    });
  }

  console.log('[Promethea Upgrade v3] Ken Burns inline + hover video + Song Canvas ✓');
})();
