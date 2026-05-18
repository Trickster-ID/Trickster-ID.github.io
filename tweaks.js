/* ==========================================================
   TWEAKS — Palette / Intensity / Type Voice
   ========================================================== */

(() => {
  const DEFAULTS = window.TWEAK_DEFAULTS || {
    palette: 'emerald',
    intensity: 'balanced',
    type_voice: 'editorial',
  };
  let state = { ...DEFAULTS };

  const PALETTES = [
    { id: 'emerald',  label: 'Emerald',  swatch: ['#10b981', '#5eead4', '#0a1411'] },
    { id: 'magenta',  label: 'Magenta',  swatch: ['#ec4899', '#c084fc', '#110a1a'] },
    { id: 'amber',    label: 'Sodium',   swatch: ['#f59e0b', '#fde68a', '#14110a'] },
    { id: 'ice',      label: 'Ice',      swatch: ['#38bdf8', '#a5f3fc', '#0a1320'] },
    { id: 'mono',     label: 'Mono',     swatch: ['#d4d4d8', '#f4f4f5', '#0c0d10'] },
  ];
  const INTENSITIES = [
    { id: 'subtle',   label: 'Subtle' },
    { id: 'balanced', label: 'Balanced' },
    { id: 'maximal',  label: 'Maximal' },
  ];
  const VOICES = [
    { id: 'editorial', label: 'Editorial', hint: 'Aa', font: "'Instrument Serif', serif", italic: true },
    { id: 'technical', label: 'Technical', hint: 'Aa', font: "'Space Grotesk', sans-serif", italic: false },
    { id: 'terminal',  label: 'Terminal',  hint: 'AA', font: "'JetBrains Mono', monospace", italic: false },
  ];

  /* ---------- Apply state ---------- */
  function apply() {
    document.body.classList.forEach((c) => {
      if (c.startsWith('palette-') || c.startsWith('intensity-') || c.startsWith('type-')) {
        document.body.classList.remove(c);
      }
    });
    document.body.classList.add('palette-' + state.palette);
    document.body.classList.add('intensity-' + state.intensity);
    document.body.classList.add('type-' + state.type_voice);

    /* Repaint Three.js scene */
    if (typeof window.__sceneApplyPalette === 'function') {
      const cs = getComputedStyle(document.body);
      window.__sceneApplyPalette({
        primary:   cs.getPropertyValue('--emerald').trim(),
        soft:      cs.getPropertyValue('--emerald-soft').trim(),
        secondary: cs.getPropertyValue('--cyan').trim(),
      });
    }
  }
  apply();

  /* ---------- Persistence ---------- */
  function persist() {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: state }, '*');
  }

  /* ---------- Panel UI ---------- */
  let panel = null;

  function buildPanel() {
    const el = document.createElement('div');
    el.className = 'tweaks-panel';
    el.innerHTML = `
      <div class="tw-head">
        <span class="tw-title"><span class="dot"></span> Tweaks</span>
        <button class="tw-close" aria-label="Close">✕</button>
      </div>

      <div class="tw-section">
        <div class="tw-label">Palette mood</div>
        <div class="tw-palettes">
          ${PALETTES.map(p => `
            <button class="tw-swatch" data-key="palette" data-val="${p.id}" title="${p.label}">
              <span class="sw-stack">
                <span class="sw a" style="background:${p.swatch[0]}"></span>
                <span class="sw b" style="background:${p.swatch[1]}"></span>
                <span class="sw c" style="background:${p.swatch[2]}"></span>
              </span>
              <span class="sw-label">${p.label}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="tw-section">
        <div class="tw-label">Intensity</div>
        <div class="tw-seg">
          ${INTENSITIES.map(i => `
            <button class="tw-seg-btn" data-key="intensity" data-val="${i.id}">${i.label}</button>
          `).join('')}
        </div>
      </div>

      <div class="tw-section">
        <div class="tw-label">Type voice</div>
        <div class="tw-voices">
          ${VOICES.map(v => `
            <button class="tw-voice" data-key="type_voice" data-val="${v.id}">
              <span class="vo-glyph" style="font-family:${v.font}; font-style:${v.italic ? 'italic' : 'normal'}">${v.hint}</span>
              <span class="vo-label">${v.label}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="tw-foot">
        <span class="tw-hint">Mix freely. Try Magenta · Maximal · Terminal.</span>
      </div>
    `;
    document.body.appendChild(el);

    /* Selection state */
    function refreshSelected() {
      el.querySelectorAll('[data-key]').forEach((btn) => {
        const k = btn.dataset.key, v = btn.dataset.val;
        btn.classList.toggle('is-on', state[k] === v);
      });
    }
    refreshSelected();

    el.querySelectorAll('[data-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.key, v = btn.dataset.val;
        if (state[k] === v) return;
        state[k] = v;
        apply();
        refreshSelected();
        persist();
      });
    });

    el.querySelector('.tw-close').addEventListener('click', () => {
      hidePanel();
      window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
    });

    /* Drag */
    const head = el.querySelector('.tw-head');
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    head.addEventListener('mousedown', (e) => {
      if (e.target.closest('.tw-close')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      const r = el.getBoundingClientRect();
      ox = r.left; oy = r.top;
      el.style.transition = 'none';
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      el.style.left = (ox + e.clientX - sx) + 'px';
      el.style.top  = (oy + e.clientY - sy) + 'px';
      el.style.right = 'auto'; el.style.bottom = 'auto';
    });
    window.addEventListener('mouseup', () => { dragging = false; });

    return el;
  }

  function showPanel() {
    if (!panel) panel = buildPanel();
    panel.classList.add('is-open');
  }
  function hidePanel() {
    if (panel) panel.classList.remove('is-open');
  }

  /* ---------- Host protocol ---------- */
  window.addEventListener('message', (e) => {
    if (!e.data || !e.data.type) return;
    if (e.data.type === '__activate_edit_mode') showPanel();
    if (e.data.type === '__deactivate_edit_mode') hidePanel();
  });
  window.parent.postMessage({ type: '__edit_mode_available' }, '*');
})();
