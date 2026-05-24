// ============================================================
// KEN BURNS — Memory Story Viewer
// Foto perlahan zoom in selama ditampilkan sebelum pindah
// Tambahkan di HTML: <script src="fix_kb_viewer.js"></script>
// (setelah semua script lain)
// ============================================================
(function() {

  // ---------- Inject CSS ----------
  const s = document.createElement('style');
  s.textContent = `
    @keyframes mvKenBurns {
      0%   { transform: scale(1.00) translate(  0px,  0px); }
      100% { transform: scale(1.05) translate( -4px, -3px); }
    }
    @keyframes mvKenBurns2 {
      0%   { transform: scale(1.00) translate(  0px,  0px); }
      100% { transform: scale(1.04) translate(  3px, -3px); }
    }
    @keyframes mvKenBurns3 {
      0%   { transform: scale(1.00) translate(  0px,  0px); }
      100% { transform: scale(1.05) translate( -3px,  3px); }
    }
    @keyframes mvKenBurns4 {
      0%   { transform: scale(1.00) translate(  0px,  0px); }
      100% { transform: scale(1.04) translate(  3px,  2px); }
    }

    #mvImg {
      transform-origin: center center;
      will-change: transform;
    }

    #mvImg.kb-active {
      animation: var(--mvKbAnim, mvKenBurns) var(--mvKbDur, 5s) ease-out forwards;
    }
  `;
  document.head.appendChild(s);

  // ---------- Variasi arah Ken Burns ----------
  const KB_ANIMS = [
    'mvKenBurns',
    'mvKenBurns2',
    'mvKenBurns3',
    'mvKenBurns4',
  ];

  // ---------- Apply Ken Burns ke foto aktif ----------
  function applyKB(idx) {
    const img = document.getElementById('mvImg');
    if (!img || img.style.display === 'none') return;

    // Reset animasi dulu
    img.classList.remove('kb-active');
    void img.offsetWidth; // force reflow biar animation restart

    // Pilih variasi arah bergantian biar tidak monoton
    const anim = KB_ANIMS[idx % KB_ANIMS.length];
    const dur  = (typeof mvDuration !== 'undefined' ? mvDuration : 5000) / 1000;

    img.style.setProperty('--mvKbAnim', anim);
    img.style.setProperty('--mvKbDur',  dur + 's');
    img.classList.add('kb-active');
  }

  // ---------- Hook mvShowPhoto ----------
  // Tunggu sampai mvShowPhoto sudah di-define oleh script lain
  function hookWhenReady(attempts) {
    if (typeof window.mvShowPhoto !== 'function') {
      if (attempts > 0) setTimeout(() => hookWhenReady(attempts - 1), 100);
      else console.warn('[KB Viewer] mvShowPhoto tidak ditemukan.');
      return;
    }

    const _orig = window.mvShowPhoto;

    window.mvShowPhoto = function(idx, initial) {
      // Reset KB dulu sebelum foto baru muncul
      const img = document.getElementById('mvImg');
      if (img) {
        img.classList.remove('kb-active');
        void img.offsetWidth;
      }

      // Panggil fungsi asli
      _orig(idx, initial);

      // Terapkan KB setelah foto di-set (beri jeda kecil untuk load/fade)
      setTimeout(() => applyKB(idx), 60);
    };

    console.log('[KB Viewer] Ken Burns Memory Viewer loaded ✓');
  }

  // Mulai hook setelah DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => hookWhenReady(20));
  } else {
    hookWhenReady(20);
  }

})();
