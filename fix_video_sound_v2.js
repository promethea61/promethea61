// ============================================================
// FIX VIDEO SOUND + PAUSE — Memory Viewer
// Paste sebagai <script> PALING BAWAH di index.html
// setelah semua script yang ada, sebelum </body>
// ============================================================

(function () {

  // ---------- PAUSE / RESUME musik saat buka/tutup memory ----------
  const _origOpenMemory = window.openMemory;
  window.openMemory = function (idx) {
    // Pause musik dulu sebelum buka — ini yang bikin browser izinkan suara video
    if (!audio.paused) {
      audio.pause();
      window._mvMusicWasPlaying = true;
    } else {
      window._mvMusicWasPlaying = false;
    }
    _origOpenMemory(idx);
  };

  const _origCloseMv = window.closeMv;
  window.closeMv = function () {
    _origCloseMv();
    // Resume musik kalau tadi lagi main
    if (window._mvMusicWasPlaying) {
      audio.play().catch(() => {});
      window._mvMusicWasPlaying = false;
    }
  };

  // ---------- Override mvShowPhoto ----------
  window.mvShowPhoto = function (idx, initial) {
    if (idx < 0 || idx >= mvImages.length) { closeMv(); return; }
    mvImgIdx = idx;
    const src = mvImages[idx], isVid = mvIsVideo(src);
    const imgEl = document.getElementById('mvImg');
    const vidEl = document.getElementById('mvVid');

    const doLoad = () => {
      if (isVid) {
        imgEl.style.display = 'none';
        vidEl.style.display = 'block';
        vidEl.src = src;
        vidEl.currentTime = 0;
        vidEl.muted = false;
        vidEl.volume = 1;

        vidEl.play().then(() => {
          vidEl.muted = false;
          vidEl.volume = 1;
          document.getElementById('mvVolBtn').textContent = '🔉';
          updateMvPauseBtn(false);
        }).catch(() => {
          // Masih di-block → muted play
          vidEl.muted = true;
          vidEl.play().catch(() => {});
          document.getElementById('mvVolBtn').textContent = '🔇';
          updateMvPauseBtn(false);
        });

        const startProg = () => mvStartProgress(idx, Math.max(3000, vidEl.duration * 1000));
        vidEl.readyState >= 1 ? startProg() : (vidEl.onloadedmetadata = startProg);

      } else {
        if (vidEl) { vidEl.pause(); vidEl.src = ''; vidEl.style.display = 'none'; }
        imgEl.style.display = 'block';
        imgEl.src = src;
        imgEl.style.opacity = '1';
        mvStartProgress(idx, mvDuration);
        updateMvPauseBtn(false);
      }
    };

    if (!initial) {
      imgEl.style.opacity = '0';
      vidEl.style.opacity = '0';
      setTimeout(() => {
        imgEl.style.opacity = '1';
        vidEl.style.opacity = '1';
        doLoad();
      }, 180);
    } else {
      doLoad();
    }

    document.getElementById('mvCounter').textContent = `${idx + 1} / ${mvImages.length}`;
  };

  // ---------- Override toggleMvMute ----------
  window.toggleMvMute = function () {
    const v = document.getElementById('mvVid');
    const btn = document.getElementById('mvVolBtn');
    if (v && v.style.display !== 'none') {
      v.muted = !v.muted;
      if (!v.muted) v.volume = 1;
      btn.textContent = v.muted ? '🔇' : '🔉';
    } else {
      toggleMute();
      btn.textContent = isMuted ? '🔇' : '🔉';
    }
  };

  // ---------- PAUSE BUTTON ----------
  function updateMvPauseBtn(paused) {
    const btn = document.getElementById('mvPausePlayBtn');
    if (btn) btn.textContent = paused ? '▶' : '⏸';
  }

  function mvTogglePause() {
    const v = document.getElementById('mvVid');
    const isVid = v && v.style.display !== 'none' && v.src;

    if (mvPaused) {
      // Resume
      mvPaused = false;
      if (isVid) {
        v.play().catch(() => {});
      }
      // Restart progress bar
      const fill = document.getElementById('mvBarFill_' + mvImgIdx);
      if (fill) fill.style.animationPlayState = 'running';
      // Restart auto-advance timer (approximate remaining)
      const dur = isVid ? Math.max(3000, (v.duration || 5) * 1000) : mvDuration;
      mvAutoTimer = setTimeout(() => mvNav(1), dur * 0.5);
      updateMvPauseBtn(false);

      // Flash play icon
      const flash = document.getElementById('mvPauseFlash');
      const icon = document.getElementById('mvPauseIcon');
      if (flash && icon) {
        icon.textContent = '▶';
        flash.classList.add('show');
        setTimeout(() => flash.classList.remove('show'), 600);
      }
    } else {
      // Pause
      mvPaused = true;
      if (isVid) v.pause();
      mvStopAuto();
      const fill = document.getElementById('mvBarFill_' + mvImgIdx);
      if (fill) fill.style.animationPlayState = 'paused';
      updateMvPauseBtn(true);

      // Flash pause icon
      const flash = document.getElementById('mvPauseFlash');
      const icon = document.getElementById('mvPauseIcon');
      if (flash && icon) {
        icon.textContent = '⏸';
        flash.classList.add('show');
        setTimeout(() => flash.classList.remove('show'), 600);
      }
    }
  }

  // ---------- Inject Pause Button UI ----------
  const PAUSE_BTN_STYLE = `
    #mvPausePlayBtn {
      position: absolute;
      bottom: 50%;
      left: 50%;
      transform: translate(-50%, 50%);
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      border: 2px solid rgba(255,255,255,0.4);
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 6;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: auto;
    }
    #memoryViewer:hover #mvPausePlayBtn {
      opacity: 1;
    }
    #mvPausePlayBtn:hover {
      background: rgba(0,0,0,0.7);
      border-color: rgba(255,255,255,0.8);
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = PAUSE_BTN_STYLE;
  document.head.appendChild(styleEl);

  // Add button to viewer DOM
  const viewer = document.getElementById('memoryViewer');
  if (viewer) {
    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'mvPausePlayBtn';
    pauseBtn.textContent = '⏸';
    pauseBtn.onclick = (e) => { e.stopPropagation(); mvTogglePause(); };
    viewer.appendChild(pauseBtn);

    // Also allow tap center area to pause (not left/right tap zones)
    viewer.addEventListener('click', (e) => {
      // Only if click is in center area (not tap zones, not buttons)
      const tag = e.target.tagName;
      if (tag === 'BUTTON' || tag === 'A') return;
      if (e.target.classList.contains('mv-tap-left') || e.target.classList.contains('mv-tap-right')) return;
      // Center 30% of screen
      const cx = e.clientX / window.innerWidth;
      if (cx > 0.35 && cx < 0.65) {
        mvTogglePause();
      }
    });
  }

  console.log('[Fix v2] Video sound + pause loaded ✓');
})();
