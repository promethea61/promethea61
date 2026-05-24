// ============================================================
// FIX VIDEO SOUND v5
// Satu-satunya cara yang beneran works untuk browser autoplay policy
// Hapus semua script fix sebelumnya, paste ini paling bawah
// ============================================================

(function () {

  const vidEl = document.getElementById('mvVid');

  // ---------- Override mvShowPhoto ----------
  window.mvShowPhoto = function (idx, initial) {
    if (idx < 0 || idx >= mvImages.length) { closeMv(); return; }
    mvImgIdx = idx;
    const src = mvImages[idx], isVid = mvIsVideo(src);
    const imgEl = document.getElementById('mvImg');

    const doLoad = () => {
      if (isVid) {
        imgEl.style.display = 'none';
        vidEl.style.display = 'block';
        vidEl.src = src;
        vidEl.currentTime = 0;
        vidEl.muted = true;
        vidEl.volume = 1;
        vidEl.play().catch(() => {});

        // Tampilkan tombol play besar — user harus klik ini
        showBigPlay(src);

        const startProg = () => mvStartProgress(idx, Math.max(3000, vidEl.duration * 1000));
        vidEl.readyState >= 1 ? startProg() : (vidEl.onloadedmetadata = startProg);

      } else {
        if (vidEl) { vidEl.pause(); vidEl.src = ''; vidEl.style.display = 'none'; }
        hideBigPlay();
        imgEl.style.display = 'block';
        imgEl.src = src;
        imgEl.style.opacity = '1';
        mvStartProgress(idx, mvDuration);
        mvPaused = false;
      }
    };

    if (!initial) {
      imgEl.style.opacity = '0';
      vidEl.style.opacity = '0';
      setTimeout(() => { imgEl.style.opacity = '1'; vidEl.style.opacity = '1'; doLoad(); }, 180);
    } else {
      doLoad();
    }

    document.getElementById('mvCounter').textContent = `${idx + 1} / ${mvImages.length}`;
  };

  // ---------- Big Play Button — klik ini = user gesture langsung ke video ----------
  function showBigPlay(src) {
    const bp = document.getElementById('mvBigPlay');
    if (!bp) return;
    bp.style.display = 'flex';
    bp._src = src;
  }

  function hideBigPlay() {
    const bp = document.getElementById('mvBigPlay');
    if (bp) bp.style.display = 'none';
  }

  function bigPlayClick(e) {
    e.stopPropagation();
    const bp = document.getElementById('mvBigPlay');

    // INI user gesture langsung — browser WAJIB allow suara
    vidEl.muted = false;
    vidEl.volume = 1;
    vidEl.play().then(() => {
      hideBigPlay();
      document.getElementById('mvVolBtn').textContent = '🔉';
      mvPaused = false;
    }).catch(() => {
      // Kalau masih block (sangat jarang) → tetap play muted
      vidEl.muted = true;
      vidEl.play().catch(() => {});
      hideBigPlay();
    });
  }

  // ---------- Override toggleMvMute ----------
  window.toggleMvMute = function () {
    const btn = document.getElementById('mvVolBtn');
    if (vidEl && vidEl.style.display !== 'none' && vidEl.src) {
      vidEl.muted = !vidEl.muted;
      if (!vidEl.muted) vidEl.volume = 1;
      btn.textContent = vidEl.muted ? '🔇' : '🔉';
    } else {
      isMuted = !isMuted;
      audio.muted = isMuted;
      btn.textContent = isMuted ? '🔇' : '🔉';
    }
  };

  // ---------- Pause ----------
  function mvTogglePause() {
    const isVidActive = vidEl && vidEl.style.display !== 'none' && vidEl.src;
    if (mvPaused) {
      mvPaused = false;
      if (isVidActive) vidEl.play().catch(() => {});
      const fill = document.getElementById('mvBarFill_' + mvImgIdx);
      if (fill) fill.style.animationPlayState = 'running';
      const dur = isVidActive ? Math.max(3000, (vidEl.duration || 5) * 1000) : mvDuration;
      mvAutoTimer = setTimeout(() => mvNav(1), dur * 0.5);
      flashMvIcon('▶');
    } else {
      mvPaused = true;
      if (isVidActive) vidEl.pause();
      mvStopAuto();
      const fill = document.getElementById('mvBarFill_' + mvImgIdx);
      if (fill) fill.style.animationPlayState = 'paused';
      flashMvIcon('⏸');
    }
  }

  function flashMvIcon(icon) {
    const flash = document.getElementById('mvPauseFlash');
    const ic = document.getElementById('mvPauseIcon');
    if (!flash || !ic) return;
    ic.textContent = icon;
    flash.classList.add('show');
    setTimeout(() => flash.classList.remove('show'), 600);
  }

  // ---------- Inject UI ----------
  const style = document.createElement('style');
  style.textContent = `
    #mvBigPlay {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 14px;
      cursor: pointer;
      background: rgba(0,0,0,0.35);
    }
    #mvBigPlay .bp-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(12px);
      border: 2.5px solid rgba(255,255,255,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: #fff;
      transition: transform 0.15s, background 0.15s;
    }
    #mvBigPlay:hover .bp-circle {
      transform: scale(1.08);
      background: rgba(29,185,84,0.5);
      border-color: #1DB954;
    }
    #mvBigPlay .bp-label {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: rgba(255,255,255,0.8);
      letter-spacing: 0.3px;
    }
  `;
  document.head.appendChild(style);

  const viewer = document.getElementById('memoryViewer');
  if (viewer) {
    // Big play button
    const bigPlay = document.createElement('div');
    bigPlay.id = 'mvBigPlay';
    bigPlay.innerHTML = `
      <div class="bp-circle">▶</div>
      <span class="bp-label">Tap untuk putar video</span>
    `;
    bigPlay.addEventListener('click', bigPlayClick);
    viewer.appendChild(bigPlay);

    // Klik tengah = pause (kalau video sudah main)
    viewer.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (e.target.closest('#mvBigPlay')) return;
      if (e.target.classList.contains('mv-tap-left') || e.target.classList.contains('mv-tap-right')) return;
      const cx = e.clientX / window.innerWidth;
      if (cx > 0.35 && cx < 0.65) {
        const bp = document.getElementById('mvBigPlay');
        if (bp && bp.style.display !== 'none') return;
        mvTogglePause();
      }
    });
  }

  console.log('[Fix v5] Big play button loaded ✓');
})();
