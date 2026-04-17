/**
 * banners/templates/square-400.js
 * 정사각형 배너 500×500
 */

/* ── 메타 ── */
export const meta = {
  id:     'square-500',
  name:   '정사각형 (500×500)',
  width:  500,
  height: 500,
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

/* ── 입력 필드 정의 ── */
export const fields = [
  { type: 'section',    label: '이미지' },
  { type: 'image-nuki', id: 'product', label: '상품 이미지', hint: '업로드 즉시 누끼 + 배경색 자동 추출' },
  { type: 'range',      id: 'productScale', label: '이미지 크기',
    min: 0.5, max: 2.5, step: 0.05, defaultValue: 1.0, suffix: '×' },
  { type: 'section',    label: '문구' },
  { type: 'font-loader' },
  {
    type:             'text-with-font',
    id:               'subtitle',
    label:            '서브타이틀',
    placeholder:      '봄 캠핑 필수템',
    defaultValue:     '',
    fontFamilyId:     'subtitleFontFamily',
    fontFamilyDefault:'Pretendard',
    fontSizeId:       'subtitleFontSize',
    fontSizeDefault:  31,
    fontWeightId:     'subtitleFontWeight',
    fontWeightDefault:'400',
  },
  {
    type:             'text-with-font',
    id:               'title',
    label:            '타이틀',
    placeholder:      '오늘만 90%할인',
    multiline:        true,
    defaultValue:     '',
    fontFamilyId:     'titleFontFamily',
    fontFamilyDefault:'Sandoll Nemony 02 Oblique',
    fontSizeId:       'titleFontSize',
    fontSizeDefault:  44,
    fontWeightId:     'titleFontWeight',
    fontWeightDefault:'400',
  },
  { type: 'section',    label: '배경' },
  { type: 'color',      id: 'bgColor',  label: '배경색', defaultValue: '#73253d' },
];

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
  const subSize   = state.subtitleFontSize   ?? 31;
  const subWeight = state.subtitleFontWeight ?? '400';
  const ttlFamily = state.titleFontFamily    ?? 'Sandoll Nemony 02 Oblique';
  const ttlSize   = state.titleFontSize      ?? 44;
  const ttlWeight = state.titleFontWeight    ?? '400';

  const PROD_W = 400, PROD_H = 400;
  const imgStyle = computeImgStyle(
    state.productNaturalWidth, state.productNaturalHeight,
    state.productScale ?? 1.0,
    state.productPanX  ?? 0,
    state.productPanY  ?? 0,
    PROD_W, PROD_H
  );

  container.innerHTML = `
    <div class="bsq500" style="background:${bgColor}">

      <!-- 텍스트 (상단 중앙) -->
      <div class="bsq500__text">
        <p class="bsq500__subtitle"
           style="font-size:${subSize}px;font-weight:${subWeight};font-family:'${subFamily}',sans-serif">${esc(state.subtitle || '서브타이틀')}</p>
        <p class="bsq500__title"
           style="font-size:${ttlSize}px;font-weight:${ttlWeight};font-family:'${ttlFamily}',serif">${esc(state.title || '타이틀')}</p>
      </div>

      <!-- 상품 이미지 (드래그 가능) -->
      <div class="bsq500__product-wrap">
        ${imgSrc
          ? `<img class="bsq500__product-img" src="${imgSrc}" style="${imgStyle}" alt="상품이미지" draggable="false">`
          : `<div class="bsq500__product-ph">
               <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1">
                 <rect x="3" y="3" width="18" height="18" rx="2"/>
                 <circle cx="8.5" cy="8.5" r="1.5"/>
                 <polyline points="21 15 16 10 5 21"/>
               </svg>
             </div>`
        }
      </div>

    </div>
  `;
}

/* ── 드래그 인터랙션 ── */
export function bindInteractions(container, state, onDrag) {
  const wrap = container.querySelector('.bsq500__product-wrap');
  const img  = container.querySelector('.bsq500__product-img');
  if (!wrap || !img) return;

  const PROD_W = 400, PROD_H = 400;
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
/* ===== 정사각형 배너 500×500 ===== */
.bsq500 {
  position: relative;
  width:  500px;
  height: 500px;
  overflow: hidden;
  font-family: 'Pretendard', sans-serif;
}

.bsq500__text {
  position: absolute;
  top:   50px;
  left:  50px;
  width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 2;
  text-align: center;
}

.bsq500__subtitle {
  color: #ffffff;
  font-family: 'Pretendard', sans-serif;
  letter-spacing: 0.5px;
  line-height: 1.26;
  word-break: break-all;
  margin: 0;
}

.bsq500__title {
  color: #ffffff;
  letter-spacing: 0.7px;
  line-height: 1.26;
  word-break: break-all;
  margin: 0;
}

.bsq500__product-wrap {
  position: absolute;
  left:   50px;
  top:    157px;
  width:  400px;
  height: 400px;
  overflow: hidden;
  z-index: 1;
  cursor: grab;
}
.bsq500__product-wrap:active { cursor: grabbing; }

.bsq500__product-img {
  position: absolute;
  user-select: none;
  -webkit-user-drag: none;
}

.bsq500__product-ph {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bsq500__product-ph svg { width: 80px; height: 80px; }
`;
