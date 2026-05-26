// ============================================================
// PROMETHEA — Hero Background Photo + Green Gradient
// ============================================================
(function () {
  const style = document.createElement('style');
  style.textContent = `
    .main {
      background: none !important;
      position: relative;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    }

    .main::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 450px;
      background-image: url('DSC09814.jpg');
      background-size: cover;
      background-position: center 110%;
      background-repeat: no-repeat;
      filter: blur(0px) brightness(1) saturate(0.8);
      -webkit-filter: blur(0px) brightness(0.6) saturate(0.8);
      z-index: 0;
      pointer-events: none;
    }

    .main::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 470px;
      background: linear-gradient(
        to bottom,
        rgba(28, 73, 35, 0.5) 0%,
        rgba(10, 35, 12, 0.4) 20%,
        rgba(13, 13, 13, 1) 80%,
        var(--bg) 100%
      );
      z-index: 1;
      pointer-events: none;
    }

    .topbar,
    .hero,
    .controls-bar,
    .tabs,
    .tab-content {
      position: relative;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);
  console.log('[Hero BG] Loaded ✓');
})();
