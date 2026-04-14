/**
 * banners/templates/horizontal-393.js
 * ★ 393×190 가로형 배너 템플릿
 *
 * 레이아웃 근거: Layout and spacing.svg 가이드
 *
 *  ┌────────────────────────────┬──────────────┐
 *  │  [로고 ~76×24]             │              │
 *  │                            │  상품이미지  │ 190px
 *  │  [헤드라인 (white 700)]    │  190 × 190   │
 *  │  [소구문구 (white 80%)]    │  (누끼 처리) │
 *  ├────────────────────────────┴──────────────┤
 *  │  [할인율]  [CTA 문구 ›]                    │ 36px
 *  └────────────────────────────────────────────┘
 *              393px 전체 너비
 *
 * 스펙 (Layout and spacing.svg):
 *   - bottom frame  : Vertical, Middle-left, padding 10/26, gap 10
 *   - CTA strip     : Horizontal, Middle-left, Hug×Hug, gap 6
 *   - 화살표 버튼   : Horizontal, gap 3
 *   - 광고문구 블록 : Vertical, Top-left, Hug×Fixed, gap 8
 */

/* ── 메타 ── */
export const meta = {
  id:          'horizontal-393',
  name:        '가로형 배너 (393 × 190)',
  width:       393,
  height:      190,
  fixedDesign: true, // 색상 고정 — 광고 배너.svg 기준
};

/* ── SVG 원본 고정 색상 (광고 배너.svg 기준, 변경 금지) ── */
export const DESIGN = {
  bgBase:  '#0E1011',              // 배경 베이스
  bgTop:   '#121212',              // 그라디언트 상단 (어두운 계열)
  bgBot:   '#6E5251',              // 그라디언트 하단 (웜 브라운)
  bgGrad:  'linear-gradient(180deg, #121212 0%, #6E5251 100%)', // ↓ 수직 그라디언트
  cta:     '#674D4C',              // CTA 스트립
};

/* ── 기본 상태 ── */
export const defaultState = {
  logo:           null,      // Data URL
  product:        null,      // Data URL (원본)
  productNuki:    null,      // Data URL (누끼 처리 후)
  productNaturalWidth:  null,   // 업로드 시 app.js가 저장
  productNaturalHeight: null,
  productScale:         1.0,    // 이미지 크기 배율 (0.5~2.0)
  adCopy:         '',        // 소구 문구
  bgColor:        DESIGN.bgTop, // 배경 상단색 (상품 업로드 시 자동 추출)
  gradColor:      DESIGN.bgBot, // 배경 하단색 (상품 업로드 시 자동 추출)
  ctaColor:       DESIGN.cta, // CTA 배경색 (상품 업로드 시 자동 추출)
  discount:       '최대 78%',
  discountImage:  null,      // Data URL (할인율 배지 이미지, 선택)
  discountColor:  '#ffffff', // 할인율 강조색 (텍스트일 때)
  ctaText:        '특가 바로가기',
};

/* ── 입력 필드 정의 ── */
export const fields = [
  { type: 'section',    label: '이미지' },
  { type: 'image',      id: 'logo',    label: '브랜드 로고',  hint: 'PNG · SVG 권장 (흰색 로고 추천)' },
  { type: 'image-nuki', id: 'product', label: '상품 이미지',  hint: '업로드 즉시 누끼 + 배경색 자동 추출' },
  { type: 'range', id: 'productScale', label: '이미지 크기',
    min: 0.5, max: 2.0, step: 0.05, defaultValue: 1.0 },
  { type: 'section',    label: '소구 문구' },
  { type: 'textarea',   id: 'adCopy', label: '소구 문구',
    placeholder: '예) 그립한의 라이브 단독혜택\n놓치지 마세요', rows: 3 },
  { type: 'section',    label: '배경 색상 조정' },
  { type: 'color',      id: 'bgColor',   label: '배경 상단색', defaultValue: DESIGN.bgTop },
  { type: 'color',      id: 'gradColor', label: '배경 하단색', defaultValue: DESIGN.bgBot },
  { type: 'color',      id: 'ctaColor',  label: 'CTA 색상',   defaultValue: DESIGN.cta  },
  { type: 'section',    label: 'CTA 영역' },
  { type: 'image',      id: 'discountImage', label: '할인율 이미지 (선택)', hint: '배지·스티커 이미지 (투명 PNG 권장)' },
  { type: 'text',       id: 'discount',      label: '할인율 텍스트',  placeholder: '최대 78%',     defaultValue: '최대 78%' },
  { type: 'color',      id: 'discountColor', label: '할인율 강조색', defaultValue: '#ffffff' },
  { type: 'text',       id: 'ctaText',       label: 'CTA 문구',      placeholder: '특가 바로가기', defaultValue: '특가 바로가기' },
];

/* ── CSS 주입 (템플릿별 스타일, 1회만) ── */
let _injected = false;
export function injectStyles() {
  if (_injected) return;
  _injected = true;
  const style = document.createElement('style');
  style.textContent = BANNER_CSS;
  document.head.appendChild(style);
}

/* ── 렌더 ── */
/**
 * 배너 HTML을 container에 렌더링
 * @param {HTMLElement} container
 * @param {object}      state
 */
export function render(container, state) {
  const imgSrc   = state.productNuki || state.product;
  const ctaColor = state.ctaColor  ?? DESIGN.cta;
  const bgColor  = state.bgColor   ?? '#121212';
  const gradColor = state.gradColor ?? '#6E5251';

  // 상품 이미지: contain + scale 계산 (html2canvas 호환, object-fit 미사용)
  const PROD_W = 190, PROD_H = 190;
  const imgStyle = computeImgStyle(
    state.productNaturalWidth, state.productNaturalHeight,
    state.productScale ?? 1.0, PROD_W, PROD_H
  );

  container.innerHTML = `
    <div class="bh393">

      <!-- 배경 레이어 1: 베이스 단색 (SVG: #0E1011) -->
      <div class="bh393__bg-base"></div>
      <!-- 배경 레이어 2: 수직 그라디언트 (SVG: 위 #121212 → 아래 #6E5251) -->
      <div class="bh393__bg" style="background: linear-gradient(180deg, ${bgColor} 0%, ${gradColor} 100%)"></div>

      <!-- 상품 이미지: contain + scale (크롭 없음, 슬라이더로 크기 조절) -->
      <div class="bh393__product-wrap">
        ${imgSrc
          ? `<img class="bh393__product-img" src="${imgSrc}" style="${imgStyle}" alt="상품이미지">`
          : `<div class="bh393__product-ph">
               <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1">
                 <rect x="3" y="3" width="18" height="18" rx="2"/>
                 <circle cx="8.5" cy="8.5" r="1.5"/>
                 <polyline points="21 15 16 10 5 21"/>
               </svg>
             </div>`
        }
      </div>

      <!-- 좌측 콘텐츠 (로고 + 광고문구) -->
      <div class="bh393__content">

        <!-- 브랜드 로고 — 업로드 시 canvas로 84×26 리사이즈됨 -->
        ${state.logo
          ? `<img class="bh393__logo" src="${state.logo}" alt="로고">`
          : `<div class="bh393__logo-ph">LOGO</div>`
        }

        <!-- 소구 문구 -->
        <div class="bh393__copy">
          <div class="bh393__headline">${esc(state.adCopy || '소구 문구를 입력하세요')}</div>
        </div>

      </div>

      <!-- CTA 스트립 (하단 36px, 전체 너비) -->
      <div class="bh393__cta" style="background:${ctaColor}">
        ${state.discountImage
          ? `<img class="bh393__discount-img" src="${state.discountImage}" alt="할인율">`
          : `<span class="bh393__discount" style="color:${state.discountColor}">${esc(state.discount)}</span>`
        }
        <div class="bh393__cta-btn">
          <span>${esc(state.ctaText)}</span>
          <span class="bh393__arrow">›</span>
        </div>
      </div>

    </div>
  `;
}

/* ── HTML 이스케이프 ── */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

/**
 * contain + scale 계산 → inline style 문자열 반환
 * - scale=1: 컨테이너 안에 이미지 전체가 보임 (contain, 크롭 없음)
 * - scale>1: 중앙 기준으로 확대 (경계 크롭됨)
 */
function computeImgStyle(nw, nh, scale, cw, ch) {
  if (!nw || !nh) {
    // 자연 크기 미확인: 컨테이너 크기로 채움
    return `width:${cw}px;height:${ch}px;left:0;top:0;`;
  }
  const ratio = nw / nh;
  const cRatio = cw / ch;
  // contain fit
  let fitW, fitH;
  if (ratio > cRatio) { fitW = cw;   fitH = cw / ratio; }
  else                 { fitH = ch;  fitW = ch * ratio;  }
  // apply scale
  const dw = fitW * scale;
  const dh = fitH * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;
  return `width:${dw.toFixed(1)}px;height:${dh.toFixed(1)}px;left:${dx.toFixed(1)}px;top:${dy.toFixed(1)}px;`;
}

/* ── 배너 전용 CSS ── */
const BANNER_CSS = `
/* ===== 가로형 배너 393×190 ===== */
.bh393 {
  position: relative;
  width:  393px;
  height: 190px;
  overflow: hidden;
  font-family: 'Pretendard', 'HGGGothicssi', sans-serif;
}

/* 배경 레이어 1: 베이스 단색 #0E1011 (SVG 원본 동일) */
.bh393__bg-base {
  position: absolute;
  inset: 0;
  background: #0E1011;
}

/* 배경 레이어 2: 수직 그라디언트 오버레이 (↓ 위→아래) */
.bh393__bg {
  position: absolute;
  inset: 0;
  /* background는 render()에서 inline style로 주입 */
}

/* 상품 이미지 래퍼: 클리핑 컨테이너 */
.bh393__product-wrap {
  position: absolute;
  right: 0;
  top: 0;
  width:  190px;
  height: 190px;
  overflow: hidden;
  z-index: 10;
}
/* 상품 이미지: 크기/위치는 render()에서 inline style로 계산 */
.bh393__product-img {
  position: absolute;
}

/* 플레이스홀더도 wrap 안에 위치 */
.bh393__product-ph {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bh393__product-ph svg {
  width: 52px;
  height: 52px;
}

/* 좌측 콘텐츠 영역 */
.bh393__content {
  position: absolute;
  top: 0;
  left: 0;
  width:  213px;
  height: 154px;
  padding: 10px 8px 10px 26px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  z-index: 5;
}

/* 브랜드 로고 — SVG 실측 76×30 (228×90 ÷ 3) */
.bh393__logo {
  display: block;
  max-height: 30px;
  max-width: 76px;
  object-fit: contain;
  object-position: left center;
}
.bh393__logo-ph {
  height: 22px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.25);
  font-size: 10px;
  letter-spacing: 1.5px;
}

/* 소구 문구 블록 */
.bh393__copy { display: flex; flex-direction: column; gap: 8px; }
.bh393__headline {
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  word-break: keep-all;
}

/* CTA 스트립: SVG 원본 고정색 #674D4C */
.bh393__cta {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 393px;
  height: 36px;
  /* background는 render()에서 inline style로 주입 */
  display: flex;
  align-items: center;
  padding-left: 26px;
  gap: 6px;
  z-index: 5;
}

/* 할인율 텍스트: 강조색 변수로 관리 */
.bh393__discount {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--bh393-accent, #ffffff);
}

/* 할인율 이미지 배지 */
.bh393__discount-img {
  height: 24px;
  width: auto;
  object-fit: contain;
}

/* CTA 버튼 텍스트 + 화살표 */
.bh393__cta-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.bh393__arrow { font-size: 15px; line-height: 1; margin-top: -1px; }
`;
