/**
 * engines/color.js
 * 이미지 대표 색상 추출 → 배너 배경 색상 자동 생성
 *
 * 사용 라이브러리: color-thief (index.html에서 CDN 로드)
 *   - Canvas API 기반, 서버 불필요
 *   - 데이터 URL 이미지에서 팔레트 추출
 */

/**
 * 이미지에서 배너용 색상 세트 추출
 * @param {string} dataUrl - 이미지 Data URL
 * @returns {Promise<{bg: string, grad: string, cta: string} | null>}
 */
export async function extractBannerColors(dataUrl) {
  const img = await loadImage(dataUrl);
  const colorThief = new ColorThief(); // CDN 전역 객체

  let palette;
  try {
    palette = colorThief.getPalette(img, 6);
  } catch {
    return null;
  }

  if (!palette || palette.length < 2) return null;

  const [dominant, secondary] = palette;

  return {
    bg:   toHex(darken(dominant, 0.30)),   // 배경 시작: 가장 어둡게
    grad: toHex(darken(secondary, 0.50)),  // 배경 끝: 두 번째 색 중간 어둡기
    cta:  toHex(darken(dominant, 0.42)),   // CTA 스트립: 배경보다 약간 밝게
  };
}

/* ── 유틸 ── */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = src;
  });
}

/** RGB 배열 → HEX 문자열 */
function toHex([r, g, b]) {
  return '#' + [r, g, b]
    .map(v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0'))
    .join('');
}

/** 색상 어둡게 (factor: 0~1) */
function darken([r, g, b], factor) {
  return [
    Math.floor(r * factor),
    Math.floor(g * factor),
    Math.floor(b * factor),
  ];
}
