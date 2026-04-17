/**
 * engines/nuki.js
 * 배경 제거 (누끼) 엔진 — remove.bg API 버전
 *
 * API 문서: https://www.remove.bg/api
 *
 * - API 키는 앱 UI에서 입력 → localStorage 저장
 * - 무료 플랜: 50장/월
 * - 응답: PNG 바이너리 (배경 제거됨)
 * - 고해상도 유지: remove.bg 결과의 알파 마스크를 원본 해상도에 합성
 */

const ENDPOINT = 'https://api.remove.bg/v1.0/removebg';

/** localStorage 키 */
const STORAGE_KEY = 'removebg_api_key';

/* ── API 키 관리 ── */

export function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

export function saveApiKey(key) {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

/**
 * 이미지 배경 제거 — 원본 해상도 유지
 * @param {string}   dataUrl    - 원본 이미지 Data URL
 * @param {function} onProgress - 진행률 콜백 (0~100)
 * @returns {Promise<string>}   배경 제거된 이미지 Data URL (PNG, 원본 해상도)
 */
export async function removeBackground(dataUrl, onProgress) {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      'remove.bg API 키가 없습니다.\n' +
      '좌측 패널 상단의 [API 키 설정]에 입력해주세요.\n' +
      '발급: https://www.remove.bg/api'
    );
  }

  if (onProgress) onProgress(10);

  // Data URL → Blob → File
  const res  = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], 'image.png', { type: blob.type || 'image/png' });

  if (onProgress) onProgress(30);

  // multipart/form-data 전송
  const form = new FormData();
  form.append('image_file', file);
  form.append('size', 'auto'); // 최대 해상도 자동 선택

  const response = await fetch(ENDPOINT, {
    method:  'POST',
    headers: { 'X-Api-Key': apiKey },
    body:    form,
  });

  if (onProgress) onProgress(80);

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    const msg  = json?.errors?.[0]?.title ?? `HTTP ${response.status}`;

    if (response.status === 402) {
      throw new Error('remove.bg 크레딧이 소진됐습니다. remove.bg에서 플랜을 확인하세요.');
    }
    if (response.status === 403) {
      throw new Error('API 키가 올바르지 않습니다. 키를 다시 확인해주세요.');
    }
    throw new Error(`remove.bg 오류: ${msg}`);
  }

  const nukiBlob = await response.blob();
  if (onProgress) onProgress(95);

  // remove.bg 결과의 알파 마스크를 원본 해상도 이미지에 합성
  const result = await compositeHighRes(dataUrl, nukiBlob);
  if (onProgress) onProgress(100);

  return result;
}

/**
 * 원본 고해상도 이미지 + 누끼 알파 마스크 → 고해상도 누끼 이미지
 * remove.bg가 저해상도 결과를 반환하더라도 원본 화질을 유지
 */
async function compositeHighRes(originalDataUrl, nukiBlob) {
  const nukiUrl = URL.createObjectURL(nukiBlob);

  try {
    const [origImg, nukiImg] = await Promise.all([
      loadImage(originalDataUrl),
      loadImage(nukiUrl),
    ]);

    const W = origImg.naturalWidth;
    const H = origImg.naturalHeight;

    // 누끼 이미지 알파 마스크 추출 (원본 해상도로 스케일업)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width  = W;
    maskCanvas.height = H;
    const mctx = maskCanvas.getContext('2d');
    mctx.drawImage(nukiImg, 0, 0, W, H);
    const maskData = mctx.getImageData(0, 0, W, H);

    // 원본 이미지 픽셀에 알파 마스크 적용
    const outCanvas = document.createElement('canvas');
    outCanvas.width  = W;
    outCanvas.height = H;
    const ctx = outCanvas.getContext('2d');
    ctx.drawImage(origImg, 0, 0, W, H);
    const imgData = ctx.getImageData(0, 0, W, H);

    // 알파 채널만 교체 (RGB는 원본 유지)
    for (let i = 3; i < imgData.data.length; i += 4) {
      imgData.data[i] = maskData.data[i];
    }

    ctx.putImageData(imgData, 0, 0);
    return outCanvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(nukiUrl);
  }
}

/** 이미지 로드 헬퍼 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = src;
  });
}
