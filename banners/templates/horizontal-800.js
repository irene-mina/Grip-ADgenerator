/**
 * banners/templates/horizontal-800.js
 * 직사각형 배너 1200×600 (2:1)
 */

/* ── 메타 ── */
export const meta = {
  id:     'horizontal-1200',
  name:   '직사각형 (1200×600)',
  width:  1200,
  height: 600,
};

/* ── 기본 상태 ── */
export const defaultState = {
  product:              null,
  productNuki:          null,
  productNaturalWidth:  null,
  productNaturalHeight: null,
  productScale:         1.0,
  productPanX:          0,
  productPanY:          0,
  subtitle:             '',
  title:                '',
  bgColor:              '#73253d',
  subtitleFontFamily:   'Pretendard',
  subtitleFontSize:     31,
  subtitleFontWeight:   '400',
  titleFontFamily:      'Sandoll Nemony 02 Oblique',
  titleFontSize:        44,
  titleFontWeight:      '400',
};

/* ── 입력 필드 정의 (참조용 — 패널은 TEMPLATES[0].fields 사용) ── */
export const fields = [];

/* ── CSS 주입 (1회) ── */
let _injected = false;
export function injectStyles() {
  if (_injected) return;
  _injected = true;
  const style = document.createElement('style');
  style.textContent = BANNER_CSS;
  document.head.appendChild(style);
}

/* ── 렌더 ── */
export function render(container, state) {
  const imgSrc   = state.productNuki || state.product;
  const bgColor  = state.bgColor ?? '#73253d';

  const subFamily = state.subtitleFontFamily ?? 'Pretendard';
  const subSize   = Math.round((state.subtitleFontSize ?? 31) * 1.5);
  const subWeight = state.subtitleFontWeight ?? '400';
  const ttlFamily = state.titleFontFamily    ?? 'Sandoll Nemony 02 Oblique';
  const ttlSize   = Math.round((state.titleFontSize    ?? 44) * 1.5);
  const ttlWeight = state.titleFontWeight    ?? '400';

  const PROD_W = 600, PROD_H = 600;
  const imgStyle = computeImgStyle(
    state.productNaturalWidth, state.productNaturalHeight,
    state.productScale ?? 1.0,
    state.productPanX  ?? 0,
    state.productPanY  ?? 0,
    PROD_W, PROD_H
  );

  container.innerHTML = `
    <div class="brect1200" style="background:${bgColor}">

      <!-- 상품 이미지 (우측, 드래그 가능) -->
      <div class="brect1200__product-wrap">
        ${imgSrc
          ? `<img class="brect1200__product-img" src="${imgSrc}" style="${imgStyle}" alt="상품이미지" draggable="false">`
          : `<div class="brect1200__product-ph">
               <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1">
                 <rect x="3" y="3" width="18" height="18" rx="2"/>
                 <circle cx="8.5" cy="8.5" r="1.5"/>
                 <polyline points="21 15 16 10 5 21"/>
               </svg>
             </div>`
        }
      </div>

      <!-- 텍스트 (좌측 중앙) -->
      <div class="brect1200__text">
        <p class="brect1200__subtitle"
           style="font-size:${subSize}px;font-weight:${subWeight};font-family:'${subFamily}',sans-serif">${esc(state.subtitle || '서브타이틀')}</p>
        <p class="brect1200__title"
           style="font-size:${ttlSize}px;font-weight:${ttlWeight};font-family:'${ttlFamily}',serif">${esc(state.title || '타이틀')}</p>
      </div>

    </div>
  `;
}

/* ── 드래그 인터랙션 ── */
export function bindInteractions(container, state, onDrag) {
  const wrap = container.querySelector('.brect1200__product-wrap');
  const img  = container.querySelector('.brect1200__product-img');
  if (!wrap || !img) return;

  const PROD_W = 600, PROD_H = 600;
  let dragging = false;
  let startX = 0, startY = 0, startPanX = 0, startPanY = 0;

  wrap.addEventListener('pointerdown', (e) => {
    dragging  = true;
    startX    = e.clientX;
    startY    = e.clientY;
    startPanX = state.productPanX ?? 0;
    startPanY = state.productPanY ?? 0;
    wrap.style.cursor = 'grabbing';
    wrap.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  wrap.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    state.productPanX = startPanX + (e.clientX - startX);
    state.productPanY = startPanY + (e.clientY - startY);
    const s = computeImgStyle(
      state.productNaturalWidth, state.productNaturalHeight,
      state.productScale ?? 1.0,
      state.productPanX, state.productPanY,
      PROD_W, PROD_H
    );
    img.style.cssText = s + 'position:absolute;';
    if (onDrag) onDrag();
  });

  wrap.addEventListener('pointerup', () => {
    dragging = false;
    wrap.style.cursor = 'grab';
  });

  wrap.addEventListener('pointercancel', () => {
    dragging = false;
    wrap.style.cursor = 'grab';
  });
}

/* ── 유틸 ── */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function computeImgStyle(nw, nh, scale, panX, panY, cw, ch) {
  if (!nw || !nh) {
    return `width:${cw}px;height:${ch}px;left:${panX}px;top:${panY}px;`;
  }
  const ratio  = nw / nh;
  const cRatio = cw / ch;
  let fitW, fitH;
  if (ratio > cRatio) { fitW = cw;  fitH = cw / ratio; }
  else                { fitH = ch;  fitW = ch * ratio;  }
  const dw = fitW * scale;
  const dh = fitH * scale;
  const dx = (cw - dw) / 2 + panX;
  const dy = (ch - dh) / 2 + panY;
  return `width:${dw.toFixed(1)}px;height:${dh.toFixed(1)}px;left:${dx.toFixed(1)}px;top:${dy.toFixed(1)}px;`;
}

/* ── 배너 전용 CSS ── */
const BANNER_CSS = `
/* ===== 직사각형 배너 1200×600 ===== */
.brect1200 {
  position: relative;
  width:  1200px;
  height: 600px;
  overflow: hidden;
  font-family: 'Pretendard', sans-serif;
}

.brect1200__product-wrap {
  position: absolute;
  right:  0;
  top:    0;
  width:  600px;
  height: 600px;
  overflow: hidden;
  z-index: 1;
  cursor: grab;
}
.brect1200__product-wrap:active { cursor: grabbing; }

.brect1200__product-img {
  position: absolute;
  user-select: none;
  -webkit-user-drag: none;
}

.brect1200__product-ph {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brect1200__product-ph svg { width: 96px; height: 96px; }

.brect1200__text {
  position: absolute;
  left:      113px;
  top:       50%;
  transform: translateY(-50%);
  width:     480px;
  display:   flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  z-index: 2;
  text-align: center;
}

.brect1200__subtitle {
  color: #ffffff;
  font-family: 'Pretendard', sans-serif;
  letter-spacing: 0.8px;
  line-height: 1.26;
  white-space: nowrap;
  margin: 0;
}

.brect1200__title {
  color: #ffffff;
  letter-spacing: 0.9px;
  line-height: 1.26;
  white-space: nowrap;
  margin: 0;
}
`;
