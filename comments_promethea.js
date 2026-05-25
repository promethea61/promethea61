// ============================================================
// PROMETHEA COMMENTS — v3.0 (SUPABASE ONLINE)
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

  async function dbFetch(path, opts) {
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: HEADERS, ...opts });
      if (!res.ok) { console.error('[Comments] DB error', res.status, await res.text()); return null; }
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    } catch (e) { console.error('[Comments] Network error', e); return null; }
  }

  async function loadComments() {
    const rows = await dbFetch('comments?select=*&order=ts.asc');
    if (!rows) return [];
    const parents = rows.filter(r => !r.parent_id);
    const replies  = rows.filter(r =>  r.parent_id);
    return parents.map(p => ({
      ...p, liked: false,
      replies: replies.filter(r => r.parent_id === p.id).map(r => ({ ...r, liked: false }))
    }));
  }

  async function insertComment(author, avatar, text, parentId) {
    return await dbFetch('comments', {
      method: 'POST',
      body: JSON.stringify({ author, avatar, text, likes: 0, parent_id: parentId || null, ts: Date.now() })
    });
  }

  async function updateLikes(id, likes) {
    return await dbFetch('comments?id=eq.' + id, {
      method: 'PATCH',
      body: JSON.stringify({ likes })
    });
  }

  // SEED DATA
  const SEED = [  ];

  async function seedIfEmpty() {
    const existing = await dbFetch('comments?select=id&limit=1');
    if (existing && existing.length > 0) return;
    for (const s of SEED) {
      const inserted = await dbFetch('comments', {
        method: 'POST',
        body: JSON.stringify({ author: s.author, avatar: s.avatar, text: s.text, likes: s.likes, parent_id: null, ts: s.ts })
      });
      if (inserted && inserted[0] && s.replies.length) {
        for (const r of s.replies) {
          await dbFetch('comments', {
            method: 'POST',
            body: JSON.stringify({ author: r.author, avatar: r.avatar, text: r.text, likes: r.likes, parent_id: inserted[0].id, ts: r.ts })
          });
        }
      }
    }
  }

  let comments = [];
  let replyingTo = null;
  let cmSortMode = 'top';
  let isLoading = true;

  async function initComments() {
    isLoading = true;
    renderComments();
    await seedIfEmpty();
    comments = await loadComments();
    isLoading = false;
    renderComments();
  }

  const style = document.createElement('style');
  style.textContent = `
    #tab-comments{padding:0 32px 40px}
    .cm-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:10px}
    .cm-title{font-size:22px;font-weight:700;display:flex;align-items:center;gap:10px}
    .cm-count{background:rgba(29,185,84,.15);color:#1DB954;border:1px solid rgba(29,185,84,.3);border-radius:20px;padding:3px 12px;font-size:13px;font-weight:700}
    .cm-online-badge{display:flex;align-items:center;gap:5px;font-size:12px;color:#1DB954;font-weight:600}
    .cm-online-dot{width:7px;height:7px;border-radius:50%;background:#1DB954;animation:cmPulse 2s ease-in-out infinite}
    @keyframes cmPulse{0%,100%{opacity:1}50%{opacity:.35}}
    .cm-sort{display:flex;gap:6px}
    .cm-sort-btn{padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid rgba(255,255,255,.12);background:none;color:var(--text-2);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
    .cm-sort-btn:hover{background:var(--bg-hl);color:var(--text)}
    .cm-sort-btn.active{background:var(--text);color:#000;border-color:transparent}
    .cm-compose{background:var(--bg-card);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;margin-bottom:28px;transition:border-color .2s}
    .cm-compose:focus-within{border-color:rgba(29,185,84,.4)}
    .cm-compose-row{display:flex;gap:12px;align-items:flex-start}
    .cm-my-avatar{width:38px;height:38px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#1DB954,#0a5c27);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;overflow:hidden}
    .cm-my-avatar img{width:100%;height:100%;object-fit:cover}
    .cm-textarea-wrap{flex:1}
    .cm-name-input{width:100%;background:none;border:none;outline:none;color:var(--text);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;padding:0 0 6px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:8px;caret-color:#1DB954;transition:border-color .15s}
    .cm-name-input:focus{border-bottom-color:rgba(29,185,84,.5)}
    .cm-name-input::placeholder{color:var(--text-3);font-weight:400}
    .cm-textarea{width:100%;background:none;border:none;outline:none;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;resize:none;line-height:1.6;min-height:20px;caret-color:#1DB954;overflow:hidden}
    .cm-textarea::placeholder{color:var(--text-3)}
    .cm-compose-footer{display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)}
    .cm-emoji-row{display:flex;gap:8px}
    .cm-emoji-btn{font-size:18px;cursor:pointer;padding:2px 4px;border-radius:4px;transition:transform .15s;background:none;border:none}
    .cm-emoji-btn:hover{transform:scale(1.3)}
    .cm-actions{display:flex;gap:8px;align-items:center}
    .cm-char-count{font-size:11px;color:var(--text-3);font-family:'Space Mono',monospace}
    .cm-char-count.warn{color:#F97316}
    .cm-char-count.over{color:#EF4444}
    .cm-send-btn{padding:9px 20px;border-radius:20px;background:var(--green);border:none;color:#000;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px}
    .cm-send-btn:hover{background:var(--green-b);transform:scale(1.04)}
    .cm-send-btn:disabled{opacity:.35;cursor:not-allowed;transform:none}
    .cm-reply-hint{font-size:12px;color:#1DB954;font-weight:600;display:flex;align-items:center;gap:6px;margin-bottom:8px}
    .cm-reply-cancel{background:none;border:none;color:var(--text-3);font-size:12px;cursor:pointer;text-decoration:underline;font-family:'DM Sans',sans-serif}
    .cm-reply-cancel:hover{color:var(--text-2)}
    #cmList{display:flex;flex-direction:column;gap:2px}
    .cm-card{display:flex;gap:12px;padding:14px 12px;border-radius:10px;transition:background .15s;animation:cmSlideIn .35s cubic-bezier(0.23,1,0.32,1) both}
    .cm-card:hover{background:rgba(255,255,255,.03)}
    @keyframes cmSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    .cm-avatar{width:38px;height:38px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;margin-top:2px}
    .cm-body{flex:1;min-width:0}
    .cm-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}
    .cm-author{font-size:13px;font-weight:700;color:var(--text)}
    .cm-time{font-size:11px;color:var(--text-3)}
    .cm-badge{font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:1px 7px;border-radius:20px;background:rgba(29,185,84,.15);color:#1DB954;border:1px solid rgba(29,185,84,.25)}
    .cm-text{font-size:14px;color:var(--text-2);line-height:1.65;margin-bottom:8px}
    .cm-actions-row{display:flex;align-items:center;gap:14px}
    .cm-like-btn{display:flex;align-items:center;gap:5px;background:none;border:none;color:var(--text-3);font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;padding:4px 8px;border-radius:6px;transition:all .15s}
    .cm-like-btn:hover{background:rgba(255,255,255,.07);color:var(--text-2)}
    .cm-like-btn.liked{color:#EC4899}
    .cm-like-btn.liked .cm-heart{animation:cmHeartPop .3s cubic-bezier(0.175,.885,.32,1.275)}
    @keyframes cmHeartPop{0%,100%{transform:scale(1)}50%{transform:scale(1.5)}}
    .cm-heart{font-size:14px;display:inline-block}
    .cm-reply-btn{background:none;border:none;color:var(--text-3);font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;padding:4px 8px;border-radius:6px;display:flex;align-items:center;gap:5px;transition:all .15s}
    .cm-reply-btn:hover{background:rgba(255,255,255,.07);color:var(--text-2)}
    .cm-replies-wrap{margin-top:10px;padding-left:4px;position:relative}
    .cm-replies-wrap::before{content:'';position:absolute;left:-24px;top:0;bottom:12px;width:2px;background:linear-gradient(to bottom,rgba(29,185,84,.3) 0%,transparent 100%);border-radius:1px}
    .cm-reply-card{display:flex;gap:10px;padding:10px 10px 10px 0;border-radius:8px;transition:background .15s}
    .cm-reply-card:hover{background:rgba(255,255,255,.03)}
    .cm-reply-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff}
    .cm-show-replies{background:none;border:none;color:#1DB954;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:6px;margin-top:6px;transition:background .15s}
    .cm-show-replies:hover{background:rgba(29,185,84,.1)}
    .cm-loading{text-align:center;padding:40px 16px;color:var(--text-3)}
    .cm-loading-spinner{display:inline-block;width:24px;height:24px;border:3px solid rgba(29,185,84,.2);border-top-color:#1DB954;border-radius:50%;animation:cmSpin .7s linear infinite;margin-bottom:10px}
    @keyframes cmSpin{to{transform:rotate(360deg)}}
    .cm-empty{text-align:center;padding:48px 16px;color:var(--text-3);animation:cmSlideIn .4s ease both}
    .cm-empty-icon{font-size:56px;margin-bottom:12px}
    .cm-divider{text-align:center;font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:1.5px;margin:8px 0;display:flex;align-items:center;gap:10px}
    .cm-divider::before,.cm-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.07)}
    @media(max-width:768px){#tab-comments{padding:0 16px 24px}.cm-emoji-row{display:none}}
  `;
  document.head.appendChild(style);

  function injectTab() {
    const membersTab = document.getElementById('tabBtn-members');
    if (!membersTab || document.getElementById('tabBtn-comments')) return;
    const tabBtn = document.createElement('button');
    tabBtn.className = 'tab';
    tabBtn.id = 'tabBtn-comments';
    tabBtn.textContent = '💬 Comments';
    tabBtn.onclick = () => switchTab('comments');
    membersTab.insertAdjacentElement('afterend', tabBtn);

    const membersContent = document.getElementById('tab-members');
    if (!membersContent || document.getElementById('tab-comments')) return;
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content content-sec';
    tabContent.id = 'tab-comments';
    tabContent.innerHTML = `
      <div class="cm-header">
        <div class="cm-title">💬 Comments<span class="cm-count" id="cmCount">...</span></div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div class="cm-online-badge"><div class="cm-online-dot"></div>Online</div>
          <div class="cm-sort">
            <button class="cm-sort-btn active" id="sortTop" onclick="cmSort('top')">🔥 Top</button>
            <button class="cm-sort-btn" id="sortNew" onclick="cmSort('new')">✨ Terbaru</button>
          </div>
        </div>
      </div>
      <div class="cm-compose" id="cmCompose">
        <div class="cm-reply-hint" id="cmReplyHint" style="display:none">
          <span>↩ Membalas <span id="cmReplyTarget">—</span></span>
          <button class="cm-reply-cancel" onclick="cancelReply()">Batal</button>
        </div>
        <div class="cm-compose-row">
          <div class="cm-my-avatar"><img src="logoprome.jpeg" alt="P" onerror="this.style.display='none';this.parentElement.textContent='🔥'"></div>
          <div class="cm-textarea-wrap">
            <input class="cm-name-input" id="cmNameInput" type="text" placeholder="Nama kamu..." maxlength="40">
            <textarea class="cm-textarea" id="cmTextInput" placeholder="Tulis kenangan, pesan, atau apapun buat Promethea... 💚" rows="1" maxlength="500"></textarea>
          </div>
        </div>
        <div class="cm-compose-footer">
          <div class="cm-emoji-row">
            <button class="cm-emoji-btn" onclick="cmInsertEmoji('💚')">💚</button>
            <button class="cm-emoji-btn" onclick="cmInsertEmoji('🥹')">🥹</button>
            <button class="cm-emoji-btn" onclick="cmInsertEmoji('🔥')">🔥</button>
            <button class="cm-emoji-btn" onclick="cmInsertEmoji('✨')">✨</button>
            <button class="cm-emoji-btn" onclick="cmInsertEmoji('😭')">😭</button>
            <button class="cm-emoji-btn" onclick="cmInsertEmoji('🫶')">🫶</button>
          </div>
          <div class="cm-actions">
            <span class="cm-char-count" id="cmCharCount">0/500</span>
            <button class="cm-send-btn" id="cmSendBtn" onclick="cmSubmit()" disabled>
              <span>Kirim</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div id="cmList"></div>
    `;
    membersContent.insertAdjacentElement('afterend', tabContent);

    const ta   = document.getElementById('cmTextInput');
    const name = document.getElementById('cmNameInput');
    const send = document.getElementById('cmSendBtn');
    const cc   = document.getElementById('cmCharCount');
    function updateSend() {
      const len = ta.value.length;
      cc.textContent = len + '/500';
      cc.classList.toggle('warn', len > 400 && len <= 480);
      cc.classList.toggle('over', len > 480);
      send.disabled = !ta.value.trim() || !name.value.trim() || len > 500;
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
    }
    ta.addEventListener('input', updateSend);
    name.addEventListener('input', updateSend);
    ta.addEventListener('keydown', e => { if (e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();cmSubmit();} });
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now()-ts)/1000);
    if (s<60) return 'baru saja';
    if (s<3600) return Math.floor(s/60)+' menit lalu';
    if (s<86400) return Math.floor(s/3600)+' jam lalu';
    return Math.floor(s/86400)+' hari lalu';
  }

  function gradColor(g) {
    return {g1:'#1DB954',g2:'#7C3AED',g3:'#F97316',g4:'#EC4899',g5:'#3B82F6',g6:'#EAB308',g7:'#14B8A6',g8:'#EF4444',g9:'#A855F7',g10:'#06B6D4',g11:'#84CC16',g12:'#F43F5E'}[g]||'#1DB954';
  }

  function avatarEl(g, size, initials) {
    const c=gradColor(g), dim=size==='sm'?28:38;
    return `<div class="${size==='sm'?'cm-reply-avatar':'cm-avatar'}" style="background:linear-gradient(135deg,${c},${c}88);width:${dim}px;height:${dim}px;">${initials}</div>`;
  }

  function nameInitial(n) { return n?n[0].toUpperCase():'?'; }
  function totalCount() { return comments.reduce((a,c)=>a+1+(c.replies||[]).length,0); }
  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\n/g,'<br>'); }
  function escAttr(s) { return String(s).replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

  function renderComments() {
    const list=document.getElementById('cmList'), countEl=document.getElementById('cmCount');
    if (!list) return;
    if (isLoading) { list.innerHTML='<div class="cm-loading"><div class="cm-loading-spinner"></div><div>Memuat komentar...</div></div>'; return; }
    const total=totalCount();
    if (countEl) countEl.textContent=total;
    if (!comments.length) { list.innerHTML='<div class="cm-empty"><div class="cm-empty-icon">💬</div><p>Belum ada komentar.<br>Jadilah yang pertama!</p></div>'; return; }
    const sorted=[...comments].sort((a,b)=>cmSortMode==='top'?b.likes-a.likes:b.ts-a.ts);
    let html='';
    sorted.forEach((c,i)=>{
      const isNew=(Date.now()-c.ts)<1000*60*5;
      html+=`<div class="cm-card">${avatarEl(c.avatar,'lg',nameInitial(c.author))}<div class="cm-body"><div class="cm-meta"><span class="cm-author">${escHtml(c.author)}</span>${isNew?'<span class="cm-badge">Baru</span>':''}<span class="cm-time">${timeAgo(c.ts)}</span></div><div class="cm-text">${escHtml(c.text)}</div><div class="cm-actions-row"><button class="cm-like-btn ${c.liked?'liked':''}" onclick="cmLike(${c.id})"><span class="cm-heart">${c.liked?'♥':'♡'}</span><span>${c.likes}</span></button><button class="cm-reply-btn" onclick="startReply(${c.id},'${escAttr(c.author)}')">↩ Balas</button></div>${renderReplies(c)}</div></div>`;
      if (i===0&&cmSortMode==='new'&&total>5) html+='<div class="cm-divider">sebelumnya</div>';
    });
    list.innerHTML=html;
  }

  function renderReplies(c) {
    if (!c.replies||!c.replies.length) return '';
    const show=c._showReplies||c.replies.length<=2;
    let html='<div class="cm-replies-wrap">';
    if (show) c.replies.forEach(r=>{
      html+=`<div class="cm-reply-card">${avatarEl(r.avatar,'sm',nameInitial(r.author))}<div class="cm-body"><div class="cm-meta"><span class="cm-author" style="font-size:12px">${escHtml(r.author)}</span><span class="cm-time">${timeAgo(r.ts)}</span></div><div class="cm-text" style="font-size:13px">${escHtml(r.text)}</div><div class="cm-actions-row"><button class="cm-like-btn ${r.liked?'liked':''}" onclick="cmLikeReply(${c.id},${r.id})" style="font-size:12px"><span class="cm-heart">${r.liked?'♥':'♡'}</span><span>${r.likes}</span></button></div></div></div>`;
    });
    if (!show) html+=`<button class="cm-show-replies" onclick="cmToggleReplies(${c.id})">▾ Lihat ${c.replies.length} balasan</button>`;
    else if (c.replies.length>2) html+=`<button class="cm-show-replies" onclick="cmToggleReplies(${c.id})">▴ Sembunyikan</button>`;
    return html+'</div>';
  }

  window.cmLike = async function(id) {
    const c=comments.find(x=>x.id===id); if(!c) return;
    c.liked=!c.liked; c.likes+=c.liked?1:-1;
    renderComments(); if(c.liked) showHeartBurst();
    await updateLikes(id, c.likes);
  };

  window.cmLikeReply = async function(cid, rid) {
    const c=comments.find(x=>x.id===cid); if(!c) return;
    const r=(c.replies||[]).find(x=>x.id===rid); if(!r) return;
    r.liked=!r.liked; r.likes+=r.liked?1:-1;
    renderComments(); if(r.liked) showHeartBurst();
    await updateLikes(rid, r.likes);
  };

  window.cmToggleReplies = function(id) {
    const c=comments.find(x=>x.id===id); if(!c) return;
    c._showReplies=!c._showReplies; renderComments();
  };

  window.startReply = function(id, authorName) {
    replyingTo=id;
    const hint=document.getElementById('cmReplyHint'), target=document.getElementById('cmReplyTarget');
    if(hint) hint.style.display='flex'; if(target) target.textContent=authorName;
    const ta=document.getElementById('cmTextInput');
    if(ta){ta.focus();ta.placeholder='Balas ke '+authorName+'...';}
    document.getElementById('cmCompose')?.scrollIntoView({behavior:'smooth',block:'nearest'});
  };

  window.cancelReply = function() {
    replyingTo=null;
    const hint=document.getElementById('cmReplyHint'), ta=document.getElementById('cmTextInput');
    if(hint) hint.style.display='none';
    if(ta) ta.placeholder='Tulis kenangan, pesan, atau apapun buat Promethea... 💚';
  };

  window.cmSubmit = async function() {
    const name=document.getElementById('cmNameInput').value.trim();
    const text=document.getElementById('cmTextInput').value.trim();
    if(!name||!text||text.length>500) return;
    const AVATARS=['g1','g2','g3','g4','g5','g6','g7','g8','g9','g10','g11','g12'];
    const randG=AVATARS[Math.floor(Math.random()*AVATARS.length)];
    const sendBtn=document.getElementById('cmSendBtn');
    sendBtn.disabled=true; sendBtn.querySelector('span').textContent='Menyimpan...';
    const inserted=await insertComment(name,randG,text,replyingTo);
    if(inserted&&inserted[0]){
      const newEntry={...inserted[0],liked:false,replies:[]};
      if(replyingTo){
        const parent=comments.find(x=>x.id===replyingTo);
        if(parent){parent.replies.push(newEntry);parent._showReplies=true;}
        cancelReply();
        if(typeof toast==='function') toast('↩ Balasan terkirim!');
      } else {
        comments.unshift(newEntry);
        cmSortMode='new';
        document.getElementById('sortTop')?.classList.remove('active');
        document.getElementById('sortNew')?.classList.add('active');
        if(typeof toast==='function') toast('💚 Komentar terkirim!');
      }
      showHeartBurst(); renderComments();
    } else {
      if(typeof toast==='function') toast('❌ Gagal kirim, coba lagi!');
    }
    document.getElementById('cmTextInput').value='';
    document.getElementById('cmTextInput').style.height='auto';
    document.getElementById('cmCharCount').textContent='0/500';
    document.getElementById('cmTextInput').placeholder='Tulis kenangan, pesan, atau apapun buat Promethea... 💚';
    sendBtn.disabled=true; sendBtn.querySelector('span').textContent='Kirim';
  };

  window.cmInsertEmoji = function(emoji) {
    const ta=document.getElementById('cmTextInput'); if(!ta) return;
    const s=ta.selectionStart,e=ta.selectionEnd;
    ta.value=ta.value.slice(0,s)+emoji+ta.value.slice(e);
    ta.selectionStart=ta.selectionEnd=s+emoji.length;
    ta.dispatchEvent(new Event('input')); ta.focus();
  };

  window.cmSort = function(mode) {
    cmSortMode=mode;
    document.getElementById('sortTop')?.classList.toggle('active',mode==='top');
    document.getElementById('sortNew')?.classList.toggle('active',mode==='new');
    renderComments();
  };

  function showHeartBurst() {
    const el=document.createElement('div');
    el.style.cssText='position:fixed;pointer-events:none;z-index:9999;font-size:28px;left:'+( Math.random()*60+20)+'vw;top:'+(Math.random()*40+30)+'vh;animation:cmHeartFloat 1s ease forwards;';
    el.textContent=['💚','🥹','♥','✨'][Math.floor(Math.random()*4)];
    document.body.appendChild(el); setTimeout(()=>el.remove(),1100);
    if(!document.getElementById('cmHeartAnim')){
      const s=document.createElement('style'); s.id='cmHeartAnim';
      s.textContent='@keyframes cmHeartFloat{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(-60px) scale(1.6)}}';
      document.head.appendChild(s);
    }
  }

  const _origSwitchTab=window.switchTab;
  window.switchTab=function(tab){
    _origSwitchTab(tab);
    if(tab==='comments'){
      isLoading=true; renderComments();
      loadComments().then(data=>{comments=data;isLoading=false;renderComments();});
    }
  };

  function start(){injectTab();setTimeout(initComments,150);}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',start);}
  else{setTimeout(start,100);}

  console.log('[Comments v3.0] Supabase online loaded ✓');
})();
