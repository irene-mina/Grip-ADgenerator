/**
 * banners/index.js
 * 배너 템플릿 레지스트리
 *
 * ★ 새 디자인 추가 방법:
 *   1. banners/templates/ 에 새 파일 작성 (square-400.js 참고)
 *   2. 아래 import 한 줄 + TEMPLATES 배열에 추가
 *   → 앱 드롭다운에 자동으로 나타남
 */

import * as Square400     from './templates/square-400.js';
import * as Horizontal800 from './templates/horizontal-800.js';

// ─── 등록된 템플릿 목록 ───────────────────────────────────────
export const TEMPLATES = [
  Square400,      // 정사각형 400×400
  Horizontal800,  // 직사각형 800×400
];

// ─── 유틸 ─────────────────────────────────────────────────────
export function getTemplate(id) {
  return TEMPLATES.find((t) => t.meta.id === id) ?? TEMPLATES[0];
}
