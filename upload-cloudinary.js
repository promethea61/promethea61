// ============================================================
// PROMETHEA UPLOAD FORM — Cloudinary Edition
// Cloud Name  : dm9qunbjl
// Upload Preset: promethea  (unsigned)
// Folder      : promethea/SEND
// ============================================================

(function () {

  // ============================================================
  // CONFIG
  // ============================================================
  const CLOUD_NAME    = 'dm9qunbji';
  const UPLOAD_PRESET = 'promethea';
  const FOLDER        = 'promethea/SEND';

  // ============================================================
  // STATE
  // ============================================================
  let selectedFiles = [];
  let hashtags      = ['#promethea'];
  let selectedG     = 'g1';
  let uploadedUrls  = [];   // Cloudinary secure_url hasil upload

  // ============================================================
  // OPEN / CLOSE
  // ============================================================
  window.openUploadForm = function () {
    const ov = document.getElementById('uploadOverlay');
    if (!ov) { console.warn('[Upload] modal belum ada'); return; }
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    // reset
    selectedFiles = [];
    hashtags      = ['#promethea'];
    uploadedUrls  = [];
    const ids = ['umTitle','umSub','umPreviewGrid','umProgressWrap','umResultBox'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === 'umTitle' || id === 'umSub') el.value = '';
      else if (id === 'umPreviewGrid') el.innerHTML = '';
      else if (id === 'umProgressWrap') { el.innerHTML = ''; el.style.display = 'none'; }
      else el.classList.remove('show');
    });
    const b = document.getElementById('umBtnSubmit');
    if (b) { b.disabled = true; b.textContent = '⬆ Upload'; }
    renderChips();
  };

  window.closeUploadForm = function () {
    const ov = document.getElementById('uploadOverlay');
    if (ov) ov.classList.remove('open');
    document.body.style.overflow = '';
  };

  // ============================================================
  // STYLES
  // ============================================================
  const style = document.createElement('style');
  style.textContent = `
    #uploadOverlay {
      display:none; position:fixed; inset:0; z-index:9999;
      background:rgba(0,0,0,.8); backdrop-filter:blur(14px);
      align-items:center; justify-content:center;
    }
    #uploadOverlay.open { display:flex; }

    #uploadModal {
      background:#181818; border-radius:18px;
      width:92%; max-width:500px; max-height:90vh;
      overflow-y:auto;
      box-shadow:0 32px 80px rgba(0,0,0,.8);
      border:1px solid rgba(255,255,255,.08);
      animation:umIn .25s cubic-bezier(0.23,1,0.32,1);
    }
    #uploadModal::-webkit-scrollbar{width:4px}
    #uploadModal::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
    @keyframes umIn {
      from{opacity:0;transform:translateY(20px) scale(.97)}
      to  {opacity:1;transform:translateY(0)    scale(1)}
    }

    .um-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:20px 24px 0;
    }
    .um-title { font-size:18px; font-weight:700; display:flex; align-items:center; gap:8px; }
    .um-close {
      width:32px;height:32px;border-radius:50%;
      background:rgba(255,255,255,.08);border:none;
      color:#fff;font-size:16px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      transition:background .15s;
    }
    .um-close:hover{background:rgba(255,255,255,.18)}
    .um-body{padding:20px 24px 24px}



    .um-dropzone {
      border:2px dashed rgba(255,255,255,.15); border-radius:12px;
      padding:28px 16px; text-align:center; cursor:pointer;
      transition:all .2s; margin-bottom:18px; position:relative;
    }
    .um-dropzone:hover,.um-dropzone.dragover{border-color:#3a77f7;background:rgba(58,119,247,.06)}
    .um-dropzone input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
    .um-drop-icon{font-size:36px;margin-bottom:8px}
    .um-drop-text{font-size:14px;font-weight:600;color:#fff;margin-bottom:3px}
    .um-drop-sub{font-size:12px;color:#b3b3b3}

    #umPreviewGrid{
      display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));
      gap:8px;margin-bottom:18px;
    }
    .um-preview-item{position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;background:#222}
    .um-preview-item img,.um-preview-item video{width:100%;height:100%;object-fit:cover}
    .um-remove{
      position:absolute;top:3px;right:3px;
      width:20px;height:20px;border-radius:50%;
      background:rgba(0,0,0,.7);border:none;
      color:#fff;font-size:11px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      transition:background .15s;
    }
    .um-remove:hover{background:#e22}
    .um-vid-badge{
      position:absolute;bottom:4px;left:4px;
      background:rgba(0,0,0,.6);border-radius:4px;
      padding:1px 5px;font-size:9px;font-weight:700;color:#fff;
    }

    .um-field{margin-bottom:15px}
    .um-label{
      display:block;font-size:11px;font-weight:700;
      color:#b3b3b3;text-transform:uppercase;
      letter-spacing:1px;margin-bottom:7px;
    }
    .um-input{
      width:100%;padding:11px 14px;
      background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.1);
      border-radius:8px;color:#fff;
      font-family:'DM Sans',sans-serif;font-size:14px;
      outline:none;transition:border-color .15s;
    }
    .um-input:focus{border-color:#3a77f7;background:rgba(255,255,255,.09)}
    .um-input::placeholder{color:#6a6a6a}

    #umHashtagWrap{
      display:flex;flex-wrap:wrap;gap:6px;
      padding:9px 12px;
      background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.1);
      border-radius:8px;min-height:42px;
      cursor:text;transition:border-color .15s;
    }
    #umHashtagWrap:focus-within{border-color:#3a77f7}
    .um-chip{
      display:flex;align-items:center;gap:4px;
      background:rgba(58,119,247,.18);
      border:1px solid rgba(58,119,247,.35);
      color:#6ba3ff;border-radius:20px;
      padding:3px 10px 3px 8px;
      font-size:13px;font-weight:600;
    }
    .um-chip-x{
      background:none;border:none;color:#6ba3ff;
      cursor:pointer;font-size:14px;padding:0;
      line-height:1;opacity:.7;transition:opacity .15s;
    }
    .um-chip-x:hover{opacity:1}
    #umHashtagInput{
      background:none;border:none;outline:none;
      color:#fff;font-family:'DM Sans',sans-serif;
      font-size:14px;min-width:100px;flex:1;
    }
    #umHashtagInput::placeholder{color:#6a6a6a}

    .um-color-grid{display:flex;gap:8px;flex-wrap:wrap}
    .um-color-opt{
      width:30px;height:30px;border-radius:50%;
      cursor:pointer;border:2px solid transparent;
      transition:all .15s;
    }
    .um-color-opt.selected{border-color:#fff;transform:scale(1.18)}

    /* PROGRESS */
    #umProgressWrap{display:none;margin-bottom:16px;}
    .um-prog-item{margin-bottom:10px}
    .um-prog-name{
      font-size:12px;color:#b3b3b3;
      margin-bottom:5px;white-space:nowrap;
      overflow:hidden;text-overflow:ellipsis;
    }
    .um-prog-bar-track{
      height:4px;background:rgba(255,255,255,.1);
      border-radius:2px;overflow:hidden;
    }
    .um-prog-bar-fill{
      height:100%;background:#3a77f7;border-radius:2px;
      width:0%;transition:width .2s;
    }
    .um-prog-status{font-size:11px;color:#b3b3b3;margin-top:3px}

    .um-footer{display:flex;gap:10px;margin-top:10px}
    #umBtnCancel{
      flex:1;padding:12px;
      background:rgba(255,255,255,.08);border:none;
      border-radius:8px;color:#fff;
      font-family:'DM Sans',sans-serif;
      font-size:14px;font-weight:600;
      cursor:pointer;transition:background .15s;
    }
    #umBtnCancel:hover{background:rgba(255,255,255,.14)}
    #umBtnSubmit{
      flex:2;padding:12px;
      background:#3a77f7;border:none;
      border-radius:8px;color:#fff;
      font-family:'DM Sans',sans-serif;
      font-size:14px;font-weight:700;
      cursor:pointer;transition:all .15s;
    }
    #umBtnSubmit:hover{background:#5a8ff8;transform:scale(1.02)}
    #umBtnSubmit:disabled{opacity:.4;cursor:not-allowed;transform:none}

    /* RESULT */
    #umResultBox{
      display:none;
      background:rgba(58,119,247,.08);
      border:1px solid rgba(58,119,247,.25);
      border-radius:10px;padding:16px;margin-top:14px;
    }
    #umResultBox.show{display:block}
    .um-result-label{font-size:13px;font-weight:700;color:#6ba3ff;margin-bottom:10px}
    .um-result-mem-card{
      background:rgba(255,255,255,.05);
      border-radius:8px;padding:12px;
      display:flex;align-items:center;gap:12px;
      margin-bottom:10px;
    }
    .um-result-thumb{
      width:52px;height:52px;border-radius:6px;
      object-fit:cover;flex-shrink:0;
    }
    .um-result-info{flex:1;min-width:0}
    .um-result-title{font-size:14px;font-weight:700;color:#fff;margin-bottom:2px}
    .um-result-count{font-size:12px;color:#b3b3b3}
    #umResultBox pre{
      font-size:10px;color:#6ba3ff;
      white-space:pre-wrap;word-break:break-all;
      font-family:'Space Mono',monospace;margin-top:8px;
      background:rgba(0,0,0,.3);padding:10px;border-radius:6px;
    }
    .um-result-btns{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
    .um-result-btn{
      padding:8px 14px;border-radius:6px;
      font-family:'DM Sans',sans-serif;
      font-size:13px;font-weight:700;
      cursor:pointer;border:none;transition:all .15s;
    }
    .um-result-btn.primary{background:#3a77f7;color:#fff}
    .um-result-btn.primary:hover{background:#5a8ff8}
    .um-result-btn.secondary{background:rgba(255,255,255,.1);color:#fff}
    .um-result-btn.secondary:hover{background:rgba(255,255,255,.18)}

    /* SIDEBAR TOMBOL + */
    #btnUploadMemory{
      width:32px!important;height:32px!important;padding:0!important;
      border-radius:50%!important;
      background:rgba(255,255,255,.08)!important;
      color:#b3b3b3!important;border:none!important;
      font-size:22px!important;font-weight:300!important;line-height:1!important;
      cursor:pointer!important;
      display:flex!important;align-items:center!important;justify-content:center!important;
      flex-shrink:0!important;box-shadow:none!important;
      transition:background .15s,color .15s,transform .15s!important;
    }
    #btnUploadMemory:hover{
      background:rgba(255,255,255,.16)!important;
      color:#fff!important;transform:scale(1.12)!important;
    }
    #btnUploadMemory:active{transform:scale(.95)!important}
  `;
  document.head.appendChild(style);

  // ============================================================
  // INJECT MODAL
  // ============================================================
  const overlay = document.createElement('div');
  overlay.id = 'uploadOverlay';
  overlay.innerHTML = `
    <div id="uploadModal">
      <div class="um-header">
        <div class="um-title">📸 Tambah Kenangan</div>
        <button class="um-close" id="umCloseBtn">✕</button>
      </div>

      <div class="um-body">
        <div class="um-dropzone" id="umDropzone">
          <input type="file" id="umFileInput" multiple accept="image/*,video/*">
          <div class="um-drop-icon">🖼️</div>
          <div class="um-drop-text">Klik atau drag foto & video ke sini</div>
          <div class="um-drop-sub">JPG, PNG, MP4, MOV</div>
        </div>
        <div id="umPreviewGrid"></div>
        <div class="um-field">
          <label class="um-label">Judul Kenangan</label>
          <input class="um-input" id="umTitle" type="text" placeholder="Title's here">
        </div>
        <div class="um-field">
          <label class="um-label">Sub / Tanggal</label>
          <input class="um-input" id="umSub" type="text" placeholder="Date's here">
        </div>
        <div class="um-field">
          <label class="um-label">Hashtag <span style="color:#6a6a6a;font-weight:400;text-transform:none">(Enter untuk tambah)</span></label>
          <div id="umHashtagWrap" onclick="document.getElementById('umHashtagInput').focus()">
            <input id="umHashtagInput" placeholder="#promethea ...">
          </div>
        </div>
        <div class="um-field">
          <label class="um-label">Warna Card</label>
          <div class="um-color-grid" id="umColorGrid"></div>
        </div>
        <div id="umProgressWrap"></div>
        <div id="umResultBox"></div>
        <div class="um-footer">
          <button id="umBtnCancel">Batal</button>
          <button id="umBtnSubmit" disabled>⬆ Upload</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // events modal
  overlay.addEventListener('click', e => { if (e.target === overlay) window.closeUploadForm(); });
  document.getElementById('umCloseBtn').addEventListener('click', window.closeUploadForm);
  document.getElementById('umBtnCancel').addEventListener('click', window.closeUploadForm);
  document.getElementById('umBtnSubmit').addEventListener('click', onSubmitClick);

  // ============================================================
  // WARNA
  // ============================================================
  const GRADIENTS = [
    {key:'g1',color:'#1DB954'},{key:'g2',color:'#7C3AED'},
    {key:'g3',color:'#F97316'},{key:'g4',color:'#EC4899'},
    {key:'g5',color:'#3B82F6'},{key:'g6',color:'#EAB308'},
    {key:'g7',color:'#14B8A6'},{key:'g8',color:'#EF4444'},
    {key:'g9',color:'#A855F7'},{key:'g10',color:'#06B6D4'},
    {key:'g11',color:'#84CC16'},{key:'g12',color:'#F43F5E'},
  ];
  const colorGrid = document.getElementById('umColorGrid');
  GRADIENTS.forEach(g => {
    const el = document.createElement('div');
    el.className = 'um-color-opt' + (g.key === 'g1' ? ' selected' : '');
    el.style.background = g.color;
    el.onclick = () => {
      document.querySelectorAll('.um-color-opt').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      selectedG = g.key;
    };
    colorGrid.appendChild(el);
  });

  // ============================================================
  // FILE HANDLING
  // ============================================================
  const dropzone  = document.getElementById('umDropzone');
  const fileInput = document.getElementById('umFileInput');

  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault(); dropzone.classList.remove('dragover');
    addFiles([...e.dataTransfer.files]);
  });
  fileInput.addEventListener('change', () => { addFiles([...fileInput.files]); fileInput.value = ''; });

  function addFiles(files) {
    files.forEach(f => {
      if (!selectedFiles.find(x => x.name === f.name && x.size === f.size)) selectedFiles.push(f);
    });
    renderPreviews();
  }

  function renderPreviews() {
    const grid = document.getElementById('umPreviewGrid');
    grid.innerHTML = '';
    selectedFiles.forEach((f, i) => {
      const item = document.createElement('div');
      item.className = 'um-preview-item';
      const url = URL.createObjectURL(f);
      item.innerHTML = f.type.startsWith('video/')
        ? `<video src="${url}" muted playsinline></video><span class="um-vid-badge">VIDEO</span>`
        : `<img src="${url}" alt="">`;
      const rm = document.createElement('button');
      rm.className = 'um-remove'; rm.textContent = '✕';
      rm.onclick = e => { e.stopPropagation(); selectedFiles.splice(i, 1); renderPreviews(); };
      item.appendChild(rm);
      grid.appendChild(item);
    });
    document.getElementById('umBtnSubmit').disabled = selectedFiles.length === 0;
  }

  // ============================================================
  // HASHTAG
  // ============================================================
  function renderChips() {
    const wrap  = document.getElementById('umHashtagWrap');
    const input = document.getElementById('umHashtagInput');
    if (!wrap || !input) return;
    wrap.querySelectorAll('.um-chip').forEach(c => c.remove());
    hashtags.forEach((tag, i) => {
      const chip = document.createElement('div');
      chip.className = 'um-chip';
      chip.innerHTML = `${tag}<button class="um-chip-x">×</button>`;
      chip.querySelector('.um-chip-x').onclick = () => { hashtags.splice(i,1); renderChips(); };
      wrap.insertBefore(chip, input);
    });
  }

  document.getElementById('umHashtagInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      let val = e.target.value.trim().replace(/,/g,'');
      if (!val) return;
      if (!val.startsWith('#')) val = '#' + val;
      if (!hashtags.includes(val)) hashtags.push(val);
      e.target.value = ''; renderChips();
    }
    if (e.key === 'Backspace' && !e.target.value && hashtags.length) {
      hashtags.pop(); renderChips();
    }
  });
  renderChips();

  // ============================================================
  // SUBMIT
  // ============================================================
  function onSubmitClick() {
    const title = document.getElementById('umTitle').value.trim();
    if (!title) { alert('Isi judul dulu ya!'); return; }
    if (!selectedFiles.length) { alert('Pilih foto/video dulu ya!'); return; }
    startUpload();
  }

  // ============================================================
  // UPLOAD KE CLOUDINARY — unsigned, no auth needed!
  // ============================================================
  async function startUpload() {
    const btn  = document.getElementById('umBtnSubmit');
    const prog = document.getElementById('umProgressWrap');
    btn.disabled    = true;
    btn.textContent = '⬆ Mengupload...';
    prog.style.display = 'block';
    prog.innerHTML  = '';
    uploadedUrls    = [];

    // Buat progress bar untuk tiap file
    for (let i = 0; i < selectedFiles.length; i++) {
      const f = selectedFiles[i];
      const item = document.createElement('div');
      item.className = 'um-prog-item';
      item.innerHTML = `
        <div class="um-prog-name">${f.name}</div>
        <div class="um-prog-bar-track"><div class="um-prog-bar-fill" id="pf_${i}"></div></div>
        <div class="um-prog-status" id="ps_${i}">Menunggu...</div>
      `;
      prog.appendChild(item);
    }

    for (let i = 0; i < selectedFiles.length; i++) {
      const f = selectedFiles[i];
      setProgStatus(i, 'Mengupload...');
      try {
        const url = await uploadToCloudinary(f, i);
        uploadedUrls.push(url);
        setProgFill(i, 100);
        setProgStatus(i, '✅ Selesai');
      } catch (err) {
        setProgStatus(i, '❌ Gagal: ' + err.message);
        console.error('[Cloudinary Upload Error]', err);
      }
    }

    btn.textContent = '✅ Upload Selesai';
    showToast('✅ Kenangan berhasil diupload!');
    setTimeout(() => window.closeUploadForm(), 1500);
  }

  function setProgFill(i, pct) {
    const el = document.getElementById('pf_' + i);
    if (el) el.style.width = pct + '%';
  }
  function setProgStatus(i, msg) {
    const el = document.getElementById('ps_' + i);
    if (el) el.textContent = msg;
  }

  // Core upload — pakai XHR biar bisa track progress
  function uploadToCloudinary(file, idx) {
    return new Promise((resolve, reject) => {
      // Tentukan resource_type berdasarkan tipe file
      const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      // Tambahkan tags dari hashtags (tanpa #)
      const tags = hashtags.map(t => t.replace(/^#/, '')).join(',');
      if (tags) fd.append('tags', tags);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) setProgFill(idx, Math.round(e.loaded / e.total * 95));
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          // Cloudinary langsung kasih secure_url — public by default!
          resolve(res.secure_url);
        } else {
          const errBody = JSON.parse(xhr.responseText || '{}');
          reject(new Error(errBody.error?.message || 'HTTP ' + xhr.status));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(fd);
    });
  }

  // ============================================================
  // TAMPILKAN RESULT
  // ============================================================
  function showResult() {
    const title    = document.getElementById('umTitle').value.trim();
    const sub      = document.getElementById('umSub').value.trim() || 'Promethea';
    const tagsList = hashtags.map(t => `"${t}"`).join(', ');
    const imgsList = uploadedUrls.map(u => `      "${u}"`).join(',\n');

    const code = `  {
    title: "${title}",
    sub: "${sub}",
    emoji: "📸",
    g: "${selectedG}",
    hashtags: [${tagsList}],
    imgs: [
${imgsList}
    ],
  },`;

    document.getElementById('umResultCode').textContent = code;
    document.getElementById('umResultTitle').textContent = title;
    document.getElementById('umResultCount').textContent = uploadedUrls.length + ' foto/video berhasil diupload';

    // Thumbnail dari file pertama
    const firstUrl = uploadedUrls[0];
    const thumb = document.getElementById('umResultThumb');
    if (firstUrl) { thumb.src = firstUrl; thumb.style.display = 'block'; }
    else thumb.style.display = 'none';

    document.getElementById('umResultBox').classList.add('show');
    setTimeout(() => document.getElementById('umResultBox').scrollIntoView({ behavior:'smooth', block:'nearest' }), 100);
  }

  function umCopyCode() {
    const code = document.getElementById('umResultCode').textContent;
    const btn  = document.getElementById('umCopyBtn');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = '✅ Tersalin!';
        setTimeout(() => btn.textContent = '📋 Copy Kode', 2000);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = code; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      btn.textContent = '✅ Tersalin!';
      setTimeout(() => btn.textContent = '📋 Copy Kode', 2000);
    }
  }

  // Tambah langsung ke array memories (live, tanpa reload)
  function umAddLive() {
    if (!uploadedUrls.length) return;
    const title  = document.getElementById('umTitle').value.trim() || 'Kenangan Baru';
    const sub    = document.getElementById('umSub').value.trim() || 'Promethea';
    const newMem = {
      title, sub, emoji: '📸', g: selectedG,
      hashtags: [...hashtags],
      imgs: [...uploadedUrls],
    };
    if (typeof memories !== 'undefined') {
      memories.push(newMem);
      if (typeof renderMemories === 'function') renderMemories();
      showToast('✅ ' + title + ' ditambahkan ke Memories!');
      window.closeUploadForm();
    } else {
      showToast('⚠️ Tidak bisa tambah live — refresh dan paste kode ke memories.js');
    }
  }

  function showToast(msg) {
    if (typeof toast === 'function') { toast(msg); return; }
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:110px;left:50%;transform:translateX(-50%);background:#282828;color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,.5)';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ============================================================
  // INJECT TOMBOL ＋ DI SIDEBAR
  // ============================================================
  function injectUploadBtn() {
    if (document.getElementById('btnUploadMemory')) return;
    const allNavItems = document.querySelectorAll('.sidebar .nav-item');
    let libItem = null;
    allNavItems.forEach(el => {
      if (el.textContent.includes('Library') || el.innerHTML.includes('📚')) libItem = el;
    });
    if (!libItem) return;

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:4px;';
    libItem.parentNode.insertBefore(row, libItem);
    row.appendChild(libItem);
    libItem.style.flex = '1';

    const btn = document.createElement('button');
    btn.id = 'btnUploadMemory';
    btn.innerHTML = '＋';
    btn.title = 'Tambah Kenangan';
    btn.onclick = e => { e.stopPropagation(); window.openUploadForm(); };
    row.appendChild(btn);
  }

  function tryInject() {
    injectUploadBtn();
    if (!document.getElementById('btnUploadMemory')) setTimeout(tryInject, 150);
  }

  // ============================================================
  // INIT
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryInject, 0));
  } else {
    setTimeout(tryInject, 0);
  }

  console.log('[Upload Form — Cloudinary Edition] Loaded ✓');
})();
