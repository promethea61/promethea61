// ============================================================
// PROMETHEA — Visitor Counter + Memory Views
// ============================================================
(function () {
  'use strict';

  const SUPABASE_URL = 'https://pamblvfygoeqksxfcefx.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_vA9Im8QxW26kyhdi5Q0aUg_9pNuksqs';
  const HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Prefer': 'return=representation'
  };

  async function db(path, opts) {
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: HEADERS, ...opts });
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    } catch (e) { return null; }
  }

  // ── VISITOR COUNTER ────────────────────────────────────────

  function getUID() {
    let uid = localStorage.getItem('prome_uid');
    if (!uid) {
      uid = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('prome_uid', uid);
    }
    return uid;
  }

  async function trackVisitor() {
    const uid = getUID();
    const existing = await db(`visitors?uid=eq.${uid}&select=id,visits`);
    if (existing && existing.length > 0) {
      await db(`visitors?uid=eq.${uid}`, {
        method: 'PATCH',
        body: JSON.stringify({ last_seen: new Date().toISOString(), visits: existing[0].visits + 1 })
      });
    } else {
      await db('visitors', {
        method: 'POST',
        body: JSON.stringify({ uid, first_seen: new Date().toISOString(), last_seen: new Date().toISOString(), visits: 1 })
      });
    }
    const total = await db('visitors?select=id');
    if (total) renderVisitorBadge(total.length);
  }

  function renderVisitorBadge(count) {
    if (document.getElementById('visitorBadge')) {
      document.getElementById('visitorBadge').innerHTML = '👁 ' + count.toLocaleString('id-ID') + ' pengunjung';
      const statNum = document.getElementById('visitorStatNum');
      if (statNum) statNum.textContent = count.toLocaleString('id-ID');
      return;
    }
    const badge = document.createElement('span');
    badge.id = 'visitorBadge';
    badge.style.cssText = [
      'display:inline-flex', 'align-items:center', 'gap:5px',
      'background:rgba(29,185,84,.12)', 'border:1px solid rgba(29,185,84,.3)',
      'color:#1DB954', 'border-radius:20px', 'padding:3px 10px',
      'font-size:12px', 'font-weight:600', 'margin-left:8px',
      'font-family:"DM Sans",sans-serif', 'vertical-align:middle'
    ].join(';');
    badge.innerHTML = '👁 ' + count.toLocaleString('id-ID') + ' pengunjung';

    const meta = document.querySelector('.hero-meta');
    if (meta) {
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.textContent = '•';
      meta.appendChild(dot);
      meta.appendChild(badge);
    }

    addVisitorStat(count);
  }

  function addVisitorStat(count) {
    const statsGrid = document.querySelector('.stats-grid');
    if (!statsGrid || document.getElementById('visitorStatCard')) return;
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.id = 'visitorStatCard';
    card.innerHTML = `<div class="stat-n" id="visitorStatNum">${count.toLocaleString('id-ID')}</div><div class="stat-l">Visitors</div>`;
    statsGrid.appendChild(card);
  }

  // ── MEMORY VIEWS ───────────────────────────────────────────

  const memoryViewCache = {};

  async function loadAllMemoryViews() {
    const rows = await db('memory_views?select=memory_title,views');
    if (rows) rows.forEach(r => { memoryViewCache[r.memory_title] = r.views; });
    renderMemoryViewBadges();
  }

  async function incrementMemoryView(title) {
    const current = memoryViewCache[title] || 0;
    const existing = await db(`memory_views?memory_title=eq.${encodeURIComponent(title)}&select=id`);
    if (existing && existing.length > 0) {
      await db(`memory_views?memory_title=eq.${encodeURIComponent(title)}`, {
        method: 'PATCH',
        body: JSON.stringify({ views: current + 1 })
      });
    } else {
      await db('memory_views', {
        method: 'POST',
        body: JSON.stringify({ memory_title: title, views: 1 })
      });
    }
    memoryViewCache[title] = current + 1;
  }

  function renderMemoryViewBadges() {
    document.querySelectorAll('#memoriesGrid .mem-card').forEach((card, i) => {
      if (typeof memories === 'undefined' || !memories[i]) return;
      const title = memories[i].title;
      const views = memoryViewCache[title] || 0;
      if (views === 0) return;

      let badge = card.querySelector('.mem-view-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'mem-view-badge';
        badge.style.cssText = [
          'position:absolute', 'top:8px', 'left:8px',
          'background:rgba(0,0,0,.65)', 'backdrop-filter:blur(6px)',
          'border-radius:20px', 'padding:2px 8px',
          'font-size:11px', 'font-weight:600', 'color:rgba(255,255,255,.85)',
          'font-family:"DM Sans",sans-serif', 'z-index:4',
          'display:flex', 'align-items:center', 'gap:4px'
        ].join(';');
        card.style.position = 'relative';
        card.appendChild(badge);
      }
      badge.innerHTML = '👁 ' + (views >= 1000 ? (views / 1000).toFixed(1) + 'k' : views);
    });
  }

  // ── HOOK ke openMemory ─────────────────────────────────────

  const _origOpenMemory = window.openMemory;
  window.openMemory = function (idx) {
    _origOpenMemory(idx);
    if (typeof memories !== 'undefined' && memories[idx]) {
      const title = memories[idx].title;
      incrementMemoryView(title).then(() => renderMemoryViewBadges());
    }
  };

  // ── HOOK ke renderMemories ─────────────────────────────────

  const _origRenderMemories = window.renderMemories;
  window.renderMemories = function () {
    _origRenderMemories();
    setTimeout(renderMemoryViewBadges, 100);
  };

  // ── INIT ───────────────────────────────────────────────────

  function init() {
    trackVisitor();
    loadAllMemoryViews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

  console.log('[Visitor & Views] Loaded ✓');
})();
