// ============================================================
// PROMETHEA — Memories Tab Pulse Attention
// ============================================================
(function () {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes tabPulse {
      0%, 100% { 
        box-shadow: 0 0 0 0 rgba(29,185,84,0); 
        background: var(--bg-card); 
        color: var(--text-2); 
      }
      50% { 
        box-shadow: 0 0 0 6px rgba(29,185,84,0.25); 
        background: rgba(29,185,84,0.15); 
        color: #1DB954; 
      }
    }

    @keyframes badgeBounce {
      from { transform: scale(0.85) rotate(-10deg); }
      to   { transform: scale(1.15) rotate(10deg); }
    }

    #tabBtn-memories.pulse-attention {
      animation: tabPulse 1.2s ease-in-out infinite;
      border: 1px solid rgba(29,185,84,0.4) !important;
      position: relative;
    }

    #tabBtn-memories.pulse-attention::after {
      content: '📸';
      position: absolute;
      top: -9px;
      right: -9px;
      font-size: 14px;
      animation: badgeBounce 0.8s ease-in-out infinite alternate;
      filter: drop-shadow(0 0 4px rgba(29,185,84,0.6));
    }
  `;
  document.head.appendChild(style);

  function startPulse() {
    const btn = document.getElementById('tabBtn-memories');
    if (!btn) return;

    btn.classList.add('pulse-attention');

    btn.addEventListener('click', function stopPulse() {
      btn.classList.remove('pulse-attention');
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(startPulse, 800));
  } else {
    setTimeout(startPulse, 800);
  }

  console.log('[Memories Pulse] Loaded ✓');
})();
