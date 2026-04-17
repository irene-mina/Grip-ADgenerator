/**
 * app.js
 * 메인 오케스트레이터
 *
 * 두 배너(정사각형 · 직사각형)를 동시에 렌더링
 *
 * - 공유 필드: product, productNuki, productNaturalWidth/Height,
 *              productScale, subtitle, title, bgColor
 * - 템플릿 전용 필드: productPanX, productPanY (드래그 위치는 각 배너 독립)
 */

import { TEMPLATES }              from './banners/index.js';
import { removeBackground,
         getApiKey, saveApiKey }  from './engines/nuki.js';
import { extractBannerColors }    from './engines/color.js';
import { exportToPng }            from './engines/export.js';

/* ============================================================
 * 1. 상태 — 템플릿별 state 객체
 * ============================================================ */

// 공유 필드: 한 쪽에서 바꾸면 모든 배너에 반영
// title/subtitle은 프리뷰 직접 편집으로 배너별 독립 관리
const SHARED_FIELDS = new Set([
  'product', 'productNuki',
  'productNaturalWidth', 'productNaturalHeight',
  'productScale',
  'bgColor',
  'subtitleFontFamily', 'subtitleFontSize', 'subtitleFontWeight',
  'titleFontFamily',    'titleFontSize',    'titleFontWeight',
]);

// 프리뷰에서 텍스트 직접 편집 중인 템플릿 ID 추적
const editingTemplates = new Set();

// 배너별 텍스트 요소 셀렉터
const TEXT_SELECTORS = {
  'square-500':      [
    { sel: '.bsq500__subtitle',    field: 'subtitle' },
    { sel: '.bsq500__title',       field: 'title'    },
  ],
  'horizontal-1200': [
    { sel: '.brect1200__subtitle', field: 'subtitle' },
    { sel: '.brect1200__title',    field: 'title'    },
  ],
};

// 각 템플릿의 state (panX/Y는 독립)
const states = {};

// 폰트 목록 (기본값 + 로컬 로드 후 확장)
let availableFonts = ['Pretendard', 'Sandoll Nemony 02 Oblique'];

// 배너별 내보내기 배수 (기본 2×)
const exportScales = {};

function initStates() {
  for (const t of TEMPLATES) {
    states[t.meta.id] = JSON.parse(JSON.stringify(t.defaultState));
    t.injectStyles();
  }
}

/**
 * 공유 필드 설정 → 모든 템플릿 state에 반영
 * 비공유 필드(pan 등)는 해당 template state에만 씀
 */
function setField(id, value, templateId = null) {
  if (SHARED_FIELDS.has(id)) {
    for (const t of TEMPLATES) states[t.meta.id][id] = value;
  } else if (templateId) {
    states[templateId][id] = value;
  }
}

/* ============================================================
 * 2. 로딩 UI
 * ============================================================ */
function showLoading(msg = '처리 중...') {
  document.getElementById('loadingText').textContent = msg;
  document.getElementById('loading').classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

/* ============================================================
 * 3. 로컬 폰트 로더
 * ============================================================ */
function updateFontDatalist() {
  let dl = document.getElementById('font-families-list');
  if (!dl) {
    dl = document.createElement('datalist');
    dl.id = 'font-families-list';
    document.body.appendChild(dl);
  }
  dl.innerHTML = availableFonts.map((f) => `<option value="${f}">`).join('');
}

function setFontLoadStatus(msg, color = '') {
  const el = document.getElementById('fontLoadStatus');
  if (el) { el.textContent = msg; el.style.color = color; }
}

async function loadLocalFonts() {
  const btn = document.getElementById('btnLoadFonts');
  if (btn) btn.disabled = true;

  if (!('queryLocalFonts' in window)) {
    setFontLoadStatus('Chrome 103+ 이상에서만 지원됩니다', 'var(--font-hint)');
    if (btn) btn.disabled = false;
    return;
  }

  setFontLoadStatus('불러오는 중…', 'var(--font-caption)');
  try {
    const fontData = await window.queryLocalFonts();
    const families = [...new Set(fontData.map((f) => f.family))].sort((a, b) =>
      a.localeCompare(b, 'ko')
    );
    const preferred = ['Pretendard', 'Sandoll Nemony 02 Oblique'];
    const rest = families.filter((f) => !preferred.includes(f));
    availableFonts = [...preferred, ...rest];
    updateFontDatalist();
    setFontLoadStatus(`✓ ${families.length}개 폰트 로드됨`, 'var(--brand)');
    if (btn) { btn.disabled = false; btn.textContent = '↺ 새로고침'; }
  } catch (err) {
    const msg = err.name === 'NotAllowedError' ? '권한이 거부되었습니다' : err.message;
    setFontLoadStatus('❌ ' + msg, '#dc2626');
    if (btn) btn.disabled = false;
  }
}

/* ============================================================
 * 4. 입력 패널 (공통 — 첫 번째 템플릿의 fields 사용)
 * ============================================================ */
function buildInputPanel() {
  const panel = document.getElementById('inputPanel');
  panel.innerHTML = '';
  panel.appendChild(buildApiKeySection());

  for (const field of TEMPLATES[0].fields) {
    panel.appendChild(createFieldElement(field));
  }

  updateFontDatalist(); // 기본 폰트로 datalist 초기화
}

/** remove.bg API 키 섹션 */
function buildApiKeySection() {
  const saved = getApiKey();
  const wrap  = document.createElement('div');
  wrap.id = 'apiKeySection';
  wrap.innerHTML = `
    <div class="field-section-title" style="border-top:none;margin-top:0;padding-top:0">
      remove.bg API 키
    </div>
    <div class="field-group">
      <div class="apikey-row">
        <input type="password" id="apiKeyInput"
               placeholder="API 키를 입력하세요"
               value="${attr(saved)}" autocomplete="off">
        <button id="apiKeySaveBtn" class="btn-apikey-save">저장</button>
      </div>
      <div class="apikey-status" id="apiKeyStatus">
        ${saved
          ? '✓ API 키 저장됨'
          : '<a href="https://www.remove.bg/api" target="_blank">remove.bg</a>에서 무료 API 키를 발급받으세요. (50장/월 무료)'}
      </div>
    </div>
  `;
  wrap.querySelector('#apiKeySaveBtn').addEventListener('click', () => {
    const val = wrap.querySelector('#apiKeyInput').value.trim();
    if (!val) { setApiKeyStatus('❌ API 키를 입력해주세요.', 'error'); return; }
    saveApiKey(val);
    setApiKeyStatus('✓ 저장 완료!', 'ok');
  });
  wrap.querySelector('#apiKeyInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') wrap.querySelector('#apiKeySaveBtn').click();
  });
  return wrap;
}

function setApiKeyStatus(msg, type = 'ok') {
  const el = document.getElementById('apiKeyStatus');
  if (!el) return;
  el.textContent = msg;
  el.style.color = type === 'error' ? '#dc2626' : '#16a34a';
}

/** field 정의 → DOM 요소 */
function createFieldElement(field) {
  if (field.type === 'section') {
    const el = document.createElement('div');
    el.className = 'field-section-title';
    el.textContent = field.label;
    return el;
  }

  const wrap = document.createElement('div');
  wrap.className = 'field-group';

  if (field.type === 'image' || field.type === 'image-nuki') {
    wrap.appendChild(buildImageField(field));
    return wrap;
  }

  if (field.type === 'textarea') {
    wrap.innerHTML = `
      <label for="field_${field.id}">${field.label}</label>
      <textarea id="field_${field.id}"
                placeholder="${attr(field.placeholder ?? '')}"
                rows="${field.rows ?? 2}"></textarea>
    `;
    wrap.querySelector('textarea').addEventListener('input', (e) => {
      setField(field.id, e.target.value);
      renderAll();
    });
    return wrap;
  }

  if (field.type === 'color') {
    const defVal = field.defaultValue ?? '#ffffff';
    setField(field.id, defVal);
    wrap.innerHTML = `
      <label for="field_${field.id}">${field.label}</label>
      <div class="color-picker-row">
        <input type="color" id="field_${field.id}" value="${attr(defVal)}">
        <span class="color-picker-value" id="colorval_${field.id}">${defVal}</span>
        <button class="color-picker-reset"
                data-default="${attr(defVal)}"
                data-target="field_${field.id}">초기화</button>
      </div>
    `;
    const picker = wrap.querySelector('input[type="color"]');
    const label  = wrap.querySelector(`#colorval_${field.id}`);
    picker.addEventListener('input', (e) => {
      setField(field.id, e.target.value);
      label.textContent = e.target.value;
      renderAll();
    });
    wrap.querySelector('.color-picker-reset').addEventListener('click', (e) => {
      const def = e.currentTarget.dataset.default;
      picker.value = def;
      setField(field.id, def);
      label.textContent = def;
      renderAll();
    });
    return wrap;
  }

  if (field.type === 'range') {
    const defVal = field.defaultValue ?? 1;
    const suffix = field.suffix ?? '×';
    const isInt  = field.step >= 1;
    const fmt    = (v) => isInt ? String(Math.round(v)) + suffix : Number(v).toFixed(1) + suffix;
    setField(field.id, defVal);
    wrap.innerHTML = `
      <label for="field_${field.id}">${field.label}</label>
      <div class="range-row">
        <input type="range" id="field_${field.id}"
               min="${field.min ?? 0}" max="${field.max ?? 2}"
               step="${field.step ?? 0.1}" value="${defVal}">
        <span class="range-value" id="rangeval_${field.id}">${fmt(defVal)}</span>
      </div>
    `;
    wrap.querySelector('input[type="range"]').addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      setField(field.id, v);
      document.getElementById(`rangeval_${field.id}`).textContent = fmt(v);
      renderAll();
    });
    return wrap;
  }

  if (field.type === 'select') {
    const defVal = field.defaultValue ?? field.options[0]?.value ?? '';
    setField(field.id, defVal);
    const optionsHtml = field.options
      .map((opt) => `<option value="${attr(opt.value)}"${opt.value === defVal ? ' selected' : ''}>${opt.label}</option>`)
      .join('');
    wrap.innerHTML = `
      <label for="field_${field.id}">${field.label}</label>
      <select id="field_${field.id}">${optionsHtml}</select>
    `;
    wrap.querySelector('select').addEventListener('change', (e) => {
      setField(field.id, e.target.value);
      renderAll();
    });
    return wrap;
  }

  if (field.type === 'font-loader') {
    wrap.innerHTML = `
      <div class="font-loader-row">
        <button id="btnLoadFonts" class="btn-load-fonts">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          로컬 폰트 불러오기
        </button>
        <span class="font-load-status" id="fontLoadStatus">설치된 폰트 전체를 불러옵니다</span>
      </div>
    `;
    wrap.querySelector('#btnLoadFonts').addEventListener('click', loadLocalFonts);
    return wrap;
  }

  if (field.type === 'text-with-font') {
    const textDef   = field.defaultValue      ?? '';
    const famDef    = field.fontFamilyDefault  ?? 'Pretendard';
    const sizeDef   = field.fontSizeDefault    ?? 30;
    const wgtDef    = field.fontWeightDefault  ?? '400';
    setField(field.id,           textDef);
    setField(field.fontFamilyId, famDef);
    setField(field.fontSizeId,   sizeDef);
    setField(field.fontWeightId, wgtDef);

    const wgtOpts = [
      { value: '300', label: 'Light' },
      { value: '400', label: 'Regular' },
      { value: '500', label: 'Medium' },
      { value: '600', label: 'SemiBold' },
      { value: '700', label: 'Bold' },
    ].map((o) => `<option value="${attr(o.value)}"${o.value === wgtDef ? ' selected' : ''}>${o.label}</option>`).join('');

    const safeText = String(textDef).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const textInputHtml = field.multiline
      ? `<textarea id="field_${field.id}" class="title-textarea" rows="2"
                   placeholder="${attr(field.placeholder ?? '')}">${safeText}</textarea>`
      : `<input type="text" id="field_${field.id}"
               placeholder="${attr(field.placeholder ?? '')}"
               value="${attr(textDef)}">`;

    const charlimitHtml = field.multiline ? `
      <div class="charlimit-row">
        <label class="charlimit-label" for="charlimit_${field.id}">줄당 글자수</label>
        <input type="number" class="charlimit-input" id="charlimit_${field.id}"
               min="1" max="50" placeholder="제한없음">
      </div>` : '';

    wrap.innerHTML = `
      <label>${field.label}</label>
      ${textInputHtml}
      ${charlimitHtml}
      <div class="font-ctrl-row">
        <input type="text" class="font-ctrl-input" id="fontfam_${field.id}"
               list="font-families-list" value="${attr(famDef)}"
               autocomplete="off" spellcheck="false" placeholder="폰트명">
        <div class="font-ctrl-size-wrap">
          <input type="number" class="font-ctrl-size" id="fontsize_${field.id}"
                 min="8" max="150" step="1" value="${sizeDef}">
          <span class="font-ctrl-unit">px</span>
        </div>
        <select class="font-ctrl-select" id="fontwgt_${field.id}">${wgtOpts}</select>
      </div>
    `;

    wrap.querySelector(`#field_${field.id}`).addEventListener('input', (e) => {
      if (field.multiline) {
        const ta    = e.target;
        const limit = parseInt(wrap.querySelector(`#charlimit_${field.id}`)?.value, 10);

        if (limit > 0) {
          const cursor = ta.selectionStart;
          const raw    = ta.value;

          function wrapAtLimit(str) {
            return str.split('\n').map(line => {
              if (line.length <= limit) return line;
              const chunks = [];
              for (let i = 0; i < line.length; i += limit) chunks.push(line.slice(i, i + limit));
              return chunks.join('\n');
            }).join('\n');
          }

          const newValue = wrapAtLimit(raw);
          if (newValue !== raw) {
            const newCursor = wrapAtLimit(raw.slice(0, cursor)).length;
            ta.value = newValue;
            ta.selectionStart = ta.selectionEnd = newCursor;
          }
        }
      }
      // title/subtitle은 SHARED_FIELDS에서 제외 — 사이드바에서 타이핑 시 모든 배너에 동시 반영
      if (field.id === 'title' || field.id === 'subtitle') {
        for (const t of TEMPLATES) states[t.meta.id][field.id] = e.target.value;
      } else {
        setField(field.id, e.target.value);
      }
      renderAll();
    });

    // 폰트 패밀리 인풋: 포커스 시 값 비워서 전체 목록 표시 → 선택/타이핑 후 확정
    const famInput = wrap.querySelector(`#fontfam_${field.id}`);
    let prevFamValue = famDef;
    famInput.addEventListener('focus', () => {
      prevFamValue = famInput.value;
      famInput.value = '';
      // Chrome: 빈 값으로 datalist 전체 펼치기
      try { famInput.showPicker?.(); } catch (_) {}
    });
    famInput.addEventListener('input', (e) => {
      // datalist 옵션 선택 시 즉시 반영
      const v = e.target.value;
      if (availableFonts.includes(v)) {
        prevFamValue = v;
        setField(field.fontFamilyId, v);
        renderAll();
      }
    });
    famInput.addEventListener('blur', (e) => {
      const v = e.target.value.trim();
      if (v) {
        prevFamValue = v;
        setField(field.fontFamilyId, v);
        renderAll();
      } else {
        // 아무것도 선택 안 했으면 이전 값 복원
        famInput.value = prevFamValue;
      }
    });

    wrap.querySelector(`#fontsize_${field.id}`).addEventListener('change', (e) => {
      const v = parseInt(e.target.value, 10);
      if (!isNaN(v) && v >= 8 && v <= 150) { setField(field.fontSizeId, v); renderAll(); }
    });
    wrap.querySelector(`#fontwgt_${field.id}`).addEventListener('change', (e) => {
      setField(field.fontWeightId, e.target.value);
      renderAll();
    });
    return wrap;
  }

  // text input
  const defVal = field.defaultValue ?? '';
  setField(field.id, defVal);
  wrap.innerHTML = `
    <label for="field_${field.id}">${field.label}</label>
    <input type="text" id="field_${field.id}"
           placeholder="${attr(field.placeholder ?? '')}"
           value="${attr(defVal)}">
  `;
  wrap.querySelector('input').addEventListener('input', (e) => {
    setField(field.id, e.target.value);
    renderAll();
  });
  return wrap;
}

/** 이미지 업로드 필드 */
function buildImageField(field) {
  const isNuki = field.type === 'image-nuki';
  const wrap   = document.createElement('div');
  wrap.innerHTML = `
    <label>${field.label}</label>
    <div class="upload-zone" id="zone_${field.id}">
      <input type="file" id="file_${field.id}" accept="image/*">
      <div class="upload-label" id="zlabel_${field.id}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span>${field.label} 업로드</span>
        <span class="hint">${field.hint ?? ''}</span>
      </div>
    </div>
    ${isNuki
      ? `<div class="nuki-status" id="nuki_status">이미지를 업로드하면 자동으로 배경이 제거됩니다.</div>`
      : ''}
  `;
  wrap.querySelector(`#file_${field.id}`)
      .addEventListener('change', (e) => handleImageUpload(e, field));
  return wrap;
}

/* ============================================================
 * 4. 이미지 업로드 핸들러
 * ============================================================ */
async function handleImageUpload(e, field) {
  const file = e.target.files[0];
  if (!file) return;

  const rawUrl = await fileToDataUrl(file);
  setField(field.id, rawUrl);

  // 썸네일 갱신
  const label = document.getElementById(`zlabel_${field.id}`);
  const zone  = document.getElementById(`zone_${field.id}`);
  label.innerHTML = `<img src="${rawUrl}" style="max-height:64px;max-width:100%;object-fit:contain;border-radius:4px">`;
  zone.classList.add('has-image');

  if (field.type === 'image-nuki') {
    // pan 초기화 (모든 템플릿)
    for (const t of TEMPLATES) {
      states[t.meta.id].productPanX = 0;
      states[t.meta.id].productPanY = 0;
    }
    setField('productNuki', null);
    const dims = await getImageDimensions(rawUrl);
    setField('productNaturalWidth',  dims.w);
    setField('productNaturalHeight', dims.h);
    renderAll();
    await handleNuki();
    await runColorExtraction();
    return;
  }

  renderAll();
}

/* ============================================================
 * 5. 누끼 처리
 * ============================================================ */
async function handleNuki() {
  const product = states[TEMPLATES[0].meta.id].product;
  if (!product) return;

  showLoading('배경 제거 중…');
  setNukiStatus('배경 제거 중…');
  try {
    const nuki = await removeBackground(product, (pct) => {
      showLoading(`배경 제거 중… ${pct}%`);
    });
    setField('productNuki', nuki);
    setNukiStatus('✓ 배경 제거 완료');
    renderAll();
  } catch (err) {
    setNukiStatus('❌ 실패: ' + err.message);
    console.error('[Nuki]', err);
  } finally {
    hideLoading();
  }
}

function setNukiStatus(msg) {
  const el = document.getElementById('nuki_status');
  if (el) el.textContent = msg;
}

/* ============================================================
 * 6. 배경색 자동 추출
 * ============================================================ */
async function runColorExtraction() {
  const product = states[TEMPLATES[0].meta.id].product;
  try {
    const colors = await extractBannerColors(product);
    if (colors) {
      setField('bgColor', colors.bg);
      syncColorPicker('bgColor', colors.bg);
      renderAll();
    }
  } catch (err) {
    console.warn('[Color]', err);
  }
}

function syncColorPicker(fieldId, value) {
  const picker = document.getElementById(`field_${fieldId}`);
  const label  = document.getElementById(`colorval_${fieldId}`);
  if (picker) picker.value = value;
  if (label)  label.textContent = value;
}

/* ============================================================
 * 7. 전체 렌더링
 * ============================================================ */
function renderAll() {
  for (const t of TEMPLATES) {
    if (editingTemplates.has(t.meta.id)) continue; // 직접 편집 중이면 스킵
    const container = document.getElementById(`banner_${t.meta.id}`);
    if (!container) continue;
    t.render(container, states[t.meta.id]);
    if (typeof t.bindInteractions === 'function') {
      t.bindInteractions(container, states[t.meta.id], null);
    }
    bindContentEditable(container, t.meta.id);
  }
}

/* 프리뷰 텍스트 직접 편집 — 배너별 독립 줄 바꿈 */
function bindContentEditable(container, templateId) {
  const entries = TEXT_SELECTORS[templateId];
  if (!entries) return;

  for (const { sel, field } of entries) {
    const el = container.querySelector(sel);
    if (!el) continue;

    el.contentEditable = 'true';
    el.spellcheck      = false;
    el.style.cursor    = 'text';
    el.style.borderRadius = '3px';
    el.style.transition   = 'background 0.15s';

    el.addEventListener('mouseover', () => {
      if (document.activeElement !== el) el.style.background = 'rgba(255,255,255,0.12)';
    });
    el.addEventListener('mouseout', () => {
      if (document.activeElement !== el) el.style.background = '';
    });

    // Enter → <br> 삽입 (div/p 생성 방지)
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const sel2 = window.getSelection();
        if (!sel2.rangeCount) return;
        const range = sel2.getRangeAt(0);
        range.deleteContents();
        const br = document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);
        range.setEndAfter(br);
        sel2.removeAllRanges();
        sel2.addRange(range);
      }
    });

    el.addEventListener('focus', () => {
      editingTemplates.add(templateId);
      el.style.background = 'rgba(255,255,255,0.18)';
    });

    el.addEventListener('input', () => {
      states[templateId][field] = readEditable(el);
    });

    el.addEventListener('blur', () => {
      editingTemplates.delete(templateId);
      el.style.background = '';
      states[templateId][field] = readEditable(el);
      // 이 배너만 재렌더
      const c = document.getElementById(`banner_${templateId}`);
      if (!c) return;
      const t = TEMPLATES.find(t => t.meta.id === templateId);
      if (!t) return;
      t.render(c, states[templateId]);
      t.bindInteractions?.(c, states[templateId], null);
      bindContentEditable(c, templateId);
    });
  }
}

/* contenteditable 내용 → 순수 텍스트(\n 포함) */
function readEditable(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  return clone.textContent;
}


/* ============================================================
 * 10. PNG 내보내기
 * ============================================================ */
function bindExportButtons() {
  for (const t of TEMPLATES) {
    const tid = t.meta.id;
    exportScales[tid] = 2; // 기본 2×

    // scale 버튼 토글
    const picker = document.getElementById(`scalepicker_${tid}`);
    if (picker) {
      picker.querySelectorAll('.scale-btn').forEach((sbtn) => {
        sbtn.addEventListener('click', () => {
          picker.querySelectorAll('.scale-btn').forEach((b) => b.classList.remove('active'));
          sbtn.classList.add('active');
          exportScales[tid] = parseInt(sbtn.dataset.scale, 10);
        });
      });
    }

    const btn = document.getElementById(`btnExport_${tid}`);
    if (!btn) continue;
    btn.addEventListener('click', async () => {
      showLoading('PNG 생성 중…');
      try {
        const banner = document.getElementById(`banner_${tid}`).firstElementChild;
        if (!banner) throw new Error('배너가 없습니다.');
        const scale = exportScales[tid] ?? 2;
        await exportToPng(banner, `banner_${tid}_${Date.now()}.png`, scale);
      } catch (err) {
        alert('내보내기 실패: ' + err.message);
        console.error('[Export]', err);
      } finally {
        hideLoading();
      }
    });
  }
}

/* ============================================================
 * 11. 초기화
 * ============================================================ */
function init() {
  initStates();
  buildInputPanel();
  bindExportButtons();
  renderAll();
}

init();

/* ============================================================
 * 유틸
 * ============================================================ */
function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = dataUrl;
  });
}

function attr(str) {
  return String(str).replace(/"/g, '&quot;');
}
