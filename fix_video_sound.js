// ============================================================
// FIX SUARA VIDEO DI MEMORY VIEWER
// Paste isi file ini sebagai <script> paling BAWAH di index.html
// tepat sebelum </body>, setelah semua script yang ada
// ============================================================

(function() {

  // Override mvShowPhoto — fix video muted
  window.mvShowPhoto = function(idx, initial) {
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

        // Coba unmute — kalau browser block, fallback ke muted
        vidEl.muted = false;
        vidEl.volume = 1;

        const tryPlay = vidEl.play();
        if (tryPlay !== undefined) {
          tryPlay.then(() => {
            vidEl.muted = false;
            vidEl.volume = 1;
            document.getElementById('mvVolBtn').textContent = '🔉';
          }).catch(() => {
            // Browser block autoplay bersuara → fallback muted
            vidEl.muted = true;
            vidEl.play().catch(() => {});
            document.getElementById('mvVolBtn').textContent = '🔇';
          });
        }

        const startProg = () => mvStartProgress(idx, Math.max(3000, vidEl.duration * 1000));
        vidEl.readyState >= 1 ? startProg() : (vidEl.onloadedmetadata = startProg);

      } else {
        if (vidEl) { vidEl.pause(); vidEl.src = ''; vidEl.style.display = 'none'; }
        imgEl.style.display = 'block';
        imgEl.src = src;
        imgEl.style.opacity = '1';
        mvStartProgress(idx, mvDuration);
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

  // Override toggleMvMute — tombol 🔉 di story viewer
  window.toggleMvMute = function() {
    const v = document.getElementById('mvVid');
    const btn = document.getElementById('mvVolBtn');

    // Toggle mute hanya untuk video story, tidak ganggu audio musik
    if (v && v.style.display !== 'none') {
      v.muted = !v.muted;
      btn.textContent = v.muted ? '🔇' : '🔉';
    } else {
      // Kalau lagi foto (bukan video), toggle mute musik
      toggleMute();
      btn.textContent = isMuted ? '🔇' : '🔉';
    }
  };

  // Saat openMemory dipanggil, pastikan video siap unmuted
  const _origOpenMemory = window.openMemory;
  window.openMemory = function(idx) {
    _origOpenMemory(idx);
    // Setelah viewer terbuka, coba unmute video
    setTimeout(() => {
      const v = document.getElementById('mvVid');
      if (v && v.style.display !== 'none') {
        v.muted = false;
        v.volume = 1;
        document.getElementById('mvVolBtn').textContent = '🔉';
      }
    }, 300);
  };

  console.log('[Fix] Video sound patch loaded ✓');
})();
