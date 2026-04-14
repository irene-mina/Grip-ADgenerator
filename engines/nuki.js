/**
 * engines/nuki.js
 * 배경 제거 (누끼) 엔진 — remove.bg API 버전
 *
 * API 문서: https://www.remove.bg/api
 *
 * - API 키는 앱 UI에서 입력 → localStorage 저장
 * - 무료 플랜: 50장/월
 * - 응답: PNG 바이너리 (배경 제거됨, 고품질)
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
 * 이미지 배경 제거
 * @param {string}   dataUrl    - 원본 이미지 Data URL
 * @param {function} onProgress - 진행률 콜백 (0~100, remove.bg는 단계별 시뮬레이션)
 * @returns {Promise<string>}   배경 제거된 이미지 Data URL (PNG)
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
  form.append('size', 'auto'); // auto: 최대 해상도 자동 선택

  const response = await fetch(ENDPOINT, {
    method:  'POST',
    headers: { 'X-Api-Key': apiKey },
    body:    form,
  });

  if (onProgress) onProgress(80);

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    const msg  = json?.errors?.[0]?.title ?? `HTTP ${response.status}`;

    // 자주 발생하는 에러 한국어 안내
    if (response.status === 402) {
      throw new Error('remove.bg 크레딧이 소진됐습니다. remove.bg에서 플랜을 확인하세요.');
    }
    if (response.status === 403) {
      throw new Error('API 키가 올바르지 않습니다. 키를 다시 확인해주세요.');
    }
    throw new Error(`remove.bg 오류: ${msg}`);
  }

  const resultBlob = await response.blob();
  if (onProgress) onProgress(100);

  return blobToDataUrl(resultBlob);
}

/** Blob → Data URL */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
