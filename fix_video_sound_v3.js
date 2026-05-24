// ============================================================
// FIX VIDEO SOUND v3 + PAUSE — Memory Viewer
// Paste sebagai <script> PALING BAWAH di index.html
// sebelum </body>, hapus script fix sebelumnya kalau ada
// ============================================================

(function () {

  const vidEl = document.getElementById('mvVid');

  // ---------- UNLOCK VIDEO dengan user gesture ----------
  // Saat user klik kartu memory (itu user gesture),
  // langsung unlock video element supaya browser izinkan suara
  let videoUnlocked = false;

  function unlockVideo() {
    if (videoUnlocked) return;
    vidEl.muted = false;
    vidEl.volume = 1;
    const silentPlay = vidEl.play();
    if (silentPlay) {
      silentPlay.then(() => {
        vidEl.pause();
        vidEl.currentTime = 0;
        videoUnlocked = true;
      }).catch(() => {
        // tetap coba, mungkin berhasil nanti
      });
    }
  }

  // Hook ke kartu memory — unlock saat diklik (sebelum openMemory)
  document.getElementById('memoriesGrid')?.addEventListener('click', unlockVideo, { capture: true });

  // Juga unlock saat tab memories aktif pertama kali
  const _origSwitchTab = window.switchTab;
  window.switchTab = function (tab) {
    _origSwitchTab(tab);
    if (tab === 'memories') {
      document.getElementById('memoriesGrid')?.addEventListener('click', unlockVideo, { capture: true, once: true });
    }
  };

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
        vidEl.muted = false;
        vidEl.volume = 1;

        vidEl.play().then(() => {
          vidEl.muted = false;
          vidEl.volume = 1;
          document.getElementById('mvVolBtn').textContent = '🔉';
          updateMvPauseBtn(false);
          mvPaused = false;
        }).catch(() => {
          // Masih di-block → muted
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
        mvPaused = false;
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
    const btn = document.getElementById('mvVolBtn');
    if (vidEl && vidEl.style.display !== 'none' && vidEl.src) {
      vidEl.muted = !vidEl.muted;
      if (!vidEl.muted) vidEl.volume = 1;
      btn.textContent = vidEl.muted ? '🔇' : '🔉';
    } else {
      // Lagi di foto, toggle mute musik
      isMuted = !isMuted;
      audio.muted = isMuted;
      btn.textContent = isMuted ? '🔇' : '🔉';
    }
  };

  // ---------- PAUSE BUTTON ----------
  function updateMvPauseBtn(paused) {
    const btn = document.getElementById('mvPausePlayBtn');
    if (btn) btn.textContent = paused ? '▶' : '⏸';
  }

  function mvTogglePause() {
    const isVidActive = vidEl && vidEl.style.display !== 'none' && vidEl.src;

    if (mvPaused) {
      mvPaused = false;
      if (isVidActive) vidEl.play().catch(() => {});
      const fill = document.getElementById('mvBarFill_' + mvImgIdx);
      if (fill) fill.style.animationPlayState = 'running';
      const dur = isVidActive ? Math.max(3000, (vidEl.duration || 5) * 1000) : mvDuration;
      mvAutoTimer = setTimeout(() => mvNav(1), dur * 0.5);
      updateMvPauseBtn(false);
      flashMvIcon('▶');
    } else {
      mvPaused = true;
      if (isVidActive) vidEl.pause();
      mvStopAuto();
      const fill = document.getElementById('mvBarFill_' + mvImgIdx);
      if (fill) fill.style.animationPlayState = 'paused';
      updateMvPauseBtn(true);
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

  // ---------- Inject Pause Button UI ----------
  const style = document.createElement('style');
  style.textContent = `
    #mvPausePlayBtn {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 52px; height: 52px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      border: 2px solid rgba(255,255,255,0.4);
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      z-index: 6;
      opacity: 0;
      transition: opacity 0.2s;
    }
    #memoryViewer:hover #mvPausePlayBtn { opacity: 1; }
    #mvPausePlayBtn:hover {
      background: rgba(0,0,0,0.7);
      border-color: rgba(255,255,255,0.8);
    }
  `;
  document.head.appendChild(style);

  const viewer = document.getElementById('memoryViewer');
  if (viewer) {
    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'mvPausePlayBtn';
    pauseBtn.textContent = '⏸';
    pauseBtn.onclick = (e) => { e.stopPropagation(); mvTogglePause(); };
    viewer.appendChild(pauseBtn);

    // Klik tengah layar juga pause
    viewer.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (e.target.classList.contains('mv-tap-left') || e.target.classList.contains('mv-tap-right')) return;
      const cx = e.clientX / window.innerWidth;
      if (cx > 0.35 && cx < 0.65) mvTogglePause();
    });
  }

  console.log('[Fix v3] Video sound unlock + pause loaded ✓');
})();
