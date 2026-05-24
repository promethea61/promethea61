// ============================================================
// FIX VIDEO SOUND v4 — Firefox compatible
// Ganti fix_video_sound_v3.js dengan file ini
// ============================================================

(function () {

  const vidEl = document.getElementById('mvVid');
  let videoUnlocked = false;

  // ---------- UNLOCK: simpan gesture user lalu apply ke video ----------
  // Firefox butuh video.play() dipanggil LANGSUNG di dalam event handler,
  // bukan di setTimeout/Promise chain. Jadi kita pre-play dulu pas ada klik.

  function unlockVideo(e) {
    if (videoUnlocked) return;
    // Mute dulu biar pasti bisa play (bypass autoplay block)
    vidEl.muted = true;
    vidEl.volume = 1;
    const p = vidEl.play();
    if (p) {
      p.then(() => {
        vidEl.pause();
        vidEl.currentTime = 0;
        vidEl.muted = false;
        videoUnlocked = true;
        console.log('[Fix v4] Video unlocked ✓');
      }).catch(err => {
        console.warn('[Fix v4] unlock gagal:', err);
      });
    }
  }

  // Hook ke klik di memories grid (user gesture)
  document.addEventListener('click', function onFirstClick(e) {
    unlockVideo(e);
    // Setelah unlock, tetap listen supaya retry kalau gagal pertama
    if (videoUnlocked) document.removeEventListener('click', onFirstClick);
  }, true);

  // ---------- Override mvShowPhoto ----------
  window.mvShowPhoto = function (idx, initial) {
    if (idx < 0 || idx >= mvImages.length) { closeMv(); return; }
    mvImgIdx = idx;
    const src = mvImages[idx];
    const isVid = mvIsVideo(src);
    const imgEl = document.getElementById('mvImg');

    const doLoad = () => {
      if (isVid) {
        imgEl.style.display = 'none';
        vidEl.style.display = 'block';
        vidEl.src = src;
        vidEl.currentTime = 0;

        // Firefox: set muted false SEBELUM play
        vidEl.muted = false;
        vidEl.volume = 1;

        const tryPlay = () => {
          const p = vidEl.play();
          if (p) {
            p.then(() => {
              // Berhasil play — pastikan unmuted
              vidEl.muted = false;
              vidEl.volume = 1;
              document.getElementById('mvVolBtn').textContent = '🔉';
              mvPaused = false;
              updateMvPauseBtn(false);
            }).catch(() => {
              // Gagal → coba muted (fallback)
              vidEl.muted = true;
              vidEl.play().catch(() => {});
              document.getElementById('mvVolBtn').textContent = '🔇';
              // Kasih tau user buat klik unmute
              setTimeout(() => {
                const btn = document.getElementById('mvVolBtn');
                if (btn) {
                  btn.style.animation = 'mvBtnPulse 0.6s ease 3';
                  btn.title = 'Klik untuk unmute';
                }
              }, 500);
            });
          }
        };

        // Tunggu metadata kalau belum ready
        if (vidEl.readyState >= 1) {
          tryPlay();
          mvStartProgress(idx, Math.max(3000, vidEl.duration * 1000));
        } else {
          vidEl.onloadedmetadata = () => {
            tryPlay();
            mvStartProgress(idx, Math.max(3000, vidEl.duration * 1000));
          };
        }

      } else {
        if (vidEl) { vidEl.pause(); vidEl.src = ''; vidEl.style.display = 'none'; }
        imgEl.style.display = 'block';
        imgEl.src = src;
        imgEl.style.opacity = '1';
        mvStartProgress(idx, mvDuration);
        mvPaused = false;
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

  // ---------- Override toggleMvMute — tombol 🔉 di viewer ----------
  window.toggleMvMute = function () {
    const btn = document.getElementById('mvVolBtn');
    if (vidEl && vidEl.style.display !== 'none' && vidEl.src) {
      if (vidEl.muted) {
        // User minta unmute — ini user gesture, langsung apply
        vidEl.muted = false;
        vidEl.volume = 1;
        // Kalau video lagi pause karena muted-block, play ulang
        if (vidEl.paused) vidEl.play().catch(() => {});
        btn.textContent = '🔉';
      } else {
        vidEl.muted = true;
        btn.textContent = '🔇';
      }
    } else {
      // Lagi di foto, toggle audio musik
      isMuted = !isMuted;
      document.getElementById('audioEl').muted = isMuted;
      btn.textContent = isMuted ? '🔇' : '🔉';
    }
  };

  // ---------- Pulse animation buat vol button hint ----------
  const hintStyle = document.createElement('style');
  hintStyle.textContent = `
    @keyframes mvBtnPulse {
      0%,100% { transform: scale(1); background: rgba(0,0,0,.4); }
      50% { transform: scale(1.3); background: rgba(29,185,84,.6); }
    }
  `;
  document.head.appendChild(hintStyle);

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
  const pauseStyle = document.createElement('style');
  pauseStyle.textContent = `
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
  document.head.appendChild(pauseStyle);

  const viewer = document.getElementById('memoryViewer');
  if (viewer) {
    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'mvPausePlayBtn';
    pauseBtn.textContent = '⏸';
    pauseBtn.onclick = (e) => { e.stopPropagation(); mvTogglePause(); };
    viewer.appendChild(pauseBtn);

    viewer.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (e.target.classList.contains('mv-tap-left') || e.target.classList.contains('mv-tap-right')) return;
      const cx = e.clientX / window.innerWidth;
      if (cx > 0.35 && cx < 0.65) mvTogglePause();
    });
  }

  console.log('[Fix v4] Firefox video sound fix loaded ✓');
})();

// ============================================================
// MEMORY SCRUBBER — slider buat lompat ke foto manapun
// ============================================================
(function() {
  const scrubStyle = document.createElement('style');
  scrubStyle.textContent = `
    #mvScrubWrap {
      position: absolute;
      bottom: 220px;
      left: 16px; right: 16px;
      z-index: 6;
      opacity: 0;
      transition: opacity 0.25s;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #memoryViewer:hover #mvScrubWrap,
    #mvScrubWrap.dragging { opacity: 1; }

    #mvScrubTrack {
      flex: 1;
      height: 4px;
      background: rgba(255,255,255,0.25);
      border-radius: 2px;
      position: relative;
      cursor: pointer;
    }
    #mvScrubFill {
      height: 100%;
      background: #fff;
      border-radius: 2px;
      pointer-events: none;
      transition: width 0.1s;
    }
    #mvScrubThumb {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      cursor: grab;
      transition: transform 0.1s, width 0.1s, height 0.1s;
      pointer-events: none;
    }
    #mvScrubTrack:hover #mvScrubThumb,
    #mvScrubWrap.dragging #mvScrubThumb {
      width: 18px; height: 18px;
    }
    #mvScrubWrap.dragging #mvScrubThumb { cursor: grabbing; }

    #mvScrubLabel {
      font-size: 11px;
      font-weight: 700;
      color: rgba(255,255,255,0.7);
      font-family: 'Space Mono', monospace;
      min-width: 48px;
      text-align: right;
      white-space: nowrap;
      letter-spacing: 0.5px;
    }

    /* Thumbnail preview bubble pas drag */
    #mvScrubPreview {
      position: absolute;
      bottom: 20px;
      transform: translateX(-50%);
      width: 64px; height: 64px;
      border-radius: 8px;
      overflow: hidden;
      background: #222;
      border: 2px solid rgba(255,255,255,0.6);
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s;
    }
    #mvScrubPreview.show { opacity: 1; }
    #mvScrubPreview img {
      width: 100%; height: 100%;
      object-fit: cover;
    }
    #mvScrubPreviewNum {
      position: absolute;
      bottom: 2px; left: 0; right: 0;
      text-align: center;
      font-size: 9px;
      font-weight: 700;
      color: #fff;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
      font-family: 'Space Mono', monospace;
    }
  `;
  document.head.appendChild(scrubStyle);

  // Inject HTML ke memoryViewer
  const viewer = document.getElementById('memoryViewer');
  if (!viewer) return;

  const scrubWrap = document.createElement('div');
  scrubWrap.id = 'mvScrubWrap';
  scrubWrap.innerHTML = `
    <div id="mvScrubTrack">
      <div id="mvScrubFill"></div>
      <div id="mvScrubThumb"></div>
      <div id="mvScrubPreview">
        <img id="mvScrubPreviewImg" src="" alt="">
        <div id="mvScrubPreviewNum"></div>
      </div>
    </div>
    <div id="mvScrubLabel">1 / 1</div>
  `;
  viewer.appendChild(scrubWrap);

  const track   = document.getElementById('mvScrubTrack');
  const fill    = document.getElementById('mvScrubFill');
  const thumb   = document.getElementById('mvScrubThumb');
  const label   = document.getElementById('mvScrubLabel');
  const preview = document.getElementById('mvScrubPreview');
  const prevImg = document.getElementById('mvScrubPreviewImg');
  const prevNum = document.getElementById('mvScrubPreviewNum');

  let isDragging = false;

  function updateScrubUI(idx, total) {
    const pct = total <= 1 ? 0 : (idx / (total - 1)) * 100;
    fill.style.width = pct + '%';
    thumb.style.left = pct + '%';
    label.textContent = `${idx + 1} / ${total}`;
  }

  function getIdxFromEvent(e) {
    const rect = track.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const total = (typeof mvImages !== 'undefined') ? mvImages.length : 1;
    return Math.round(ratio * (total - 1));
  }

  function showPreview(e) {
    const idx = getIdxFromEvent(e);
    const total = (typeof mvImages !== 'undefined') ? mvImages.length : 1;
    const pct = total <= 1 ? 0 : (idx / (total - 1)) * 100;

    // Posisi bubble
    preview.style.left = pct + '%';
    prevNum.textContent = idx + 1;

    // Tampilkan preview gambar (skip video)
    const src = mvImages[idx];
    if (src && !/\.(mp4|mov|webm|ogg)/i.test(src)) {
      prevImg.src = src;
      preview.classList.add('show');
    } else {
      prevImg.src = '';
      preview.classList.remove('show');
    }
  }

  // Mouse events
  track.addEventListener('mousedown', (e) => {
    isDragging = true;
    scrubWrap.classList.add('dragging');
    const idx = getIdxFromEvent(e);
    updateScrubUI(idx, mvImages.length);
    showPreview(e);
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const idx = getIdxFromEvent(e);
    updateScrubUI(idx, mvImages.length);
    showPreview(e);
  });

  document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    scrubWrap.classList.remove('dragging');
    preview.classList.remove('show');
    const idx = getIdxFromEvent(e);
    mvShowPhoto(idx, false);
  });

  // Touch events
  track.addEventListener('touchstart', (e) => {
    isDragging = true;
    scrubWrap.classList.add('dragging');
    showPreview(e);
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const idx = getIdxFromEvent(e);
    updateScrubUI(idx, mvImages.length);
    showPreview(e);
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    scrubWrap.classList.remove('dragging');
    preview.classList.remove('show');
    const idx = getIdxFromEvent(e);
    mvShowPhoto(idx, false);
  });

  // Click langsung (tanpa drag)
  track.addEventListener('click', (e) => {
    if (isDragging) return;
    const idx = getIdxFromEvent(e);
    mvShowPhoto(idx, false);
  });

  // Sync scrubber setiap kali foto ganti
  const _origMvShowPhoto = window.mvShowPhoto;
  window.mvShowPhoto = function(idx, initial) {
    _origMvShowPhoto(idx, initial);
    const total = (typeof mvImages !== 'undefined') ? mvImages.length : 1;
    updateScrubUI(typeof mvImgIdx !== 'undefined' ? mvImgIdx : idx, total);
  };

  // Reset scrubber saat memory dibuka
  const _origOpenMemory = window.openMemory;
  window.openMemory = function(idx) {
    _origOpenMemory(idx);
    setTimeout(() => {
      const total = (typeof mvImages !== 'undefined') ? mvImages.length : 1;
      updateScrubUI(0, total);
    }, 50);
  };

  console.log('[Scrubber] Memory slider loaded ✓');
})();
