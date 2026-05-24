// ============================================================
// PROMETHEA — Ken Burns Patch v3 (aman untuk hover video)
// Letakkan setelah upgrade_promethea.js
// ============================================================

(function () {

  const style = document.createElement('style');
  style.textContent = `
    .mem-img {
      overflow: hidden !important;
      position: relative;
    }

    /* Ken Burns hanya pada img cover, bukan video hover */
    .mem-img > img:not(.mem-hover-vid) {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform-origin: center center;
      will-change: transform;
      animation: kenBurns 14s ease-in-out infinite alternate !important;
      transition: none !important;
    }

    @keyframes kenBurns {
      0%   { transform: scale(1.00) translate(  0px,  0px); }
      25%  { transform: scale(1.07) translate( -6px, -4px); }
      50%  { transform: scale(1.12) translate(  5px, -8px); }
      75%  { transform: scale(1.07) translate( -4px,  3px); }
      100% { transform: scale(1.04) translate(  3px, -3px); }
    }

    /* Stagger tiap kartu */
    #memoriesGrid .mem-card:nth-child(1)  .mem-img > img { animation-delay:   0s   !important; }
    #memoriesGrid .mem-card:nth-child(2)  .mem-img > img { animation-delay:  -3s   !important; }
    #memoriesGrid .mem-card:nth-child(3)  .mem-img > img { animation-delay:  -6s   !important; }
    #memoriesGrid .mem-card:nth-child(4)  .mem-img > img { animation-delay:  -9s   !important; }
    #memoriesGrid .mem-card:nth-child(5)  .mem-img > img { animation-delay:  -1.5s !important; }
    #memoriesGrid .mem-card:nth-child(6)  .mem-img > img { animation-delay:  -4.5s !important; }
    #memoriesGrid .mem-card:nth-child(7)  .mem-img > img { animation-delay:  -7.5s !important; }
    #memoriesGrid .mem-card:nth-child(8)  .mem-img > img { animation-delay: -11s   !important; }
    #memoriesGrid .mem-card:nth-child(9)  .mem-img > img { animation-delay:  -2s   !important; }
    #memoriesGrid .mem-card:nth-child(10) .mem-img > img { animation-delay:  -5s   !important; }
    #memoriesGrid .mem-card:nth-child(11) .mem-img > img { animation-delay:  -8s   !important; }
    #memoriesGrid .mem-card:nth-child(12) .mem-img > img { animation-delay: -12s   !important; }

    /* Hover: pause Ken Burns pada img cover saja */
    .mem-card:hover .mem-img > img {
      animation-play-state: paused !important;
    }

    /* Video hover dari upgrade_promethea.js — jangan disentuh animasinya */
    .mem-hover-vid {
      animation: none !important;
      transform: none !important;
    }
  `;
  document.head.appendChild(style);

  // Wrap renderMemories — tapi TIDAK memanggil patchMemoryCards lagi
  // karena upgrade_promethea.js sudah handle card._upgraded
  // Kita hanya perlu CSS di atas, tidak perlu re-patch DOM
  console.log('[Ken Burns Patch v3] Loaded ✓');
})();
