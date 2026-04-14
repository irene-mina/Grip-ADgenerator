/**
 * engines/export.js
 * 배너 DOM 요소 → PNG 파일 내보내기
 *
 * scale 1× / 2× / 3× 선택 가능
 *   - 정사각형 500×500 기준: 500 / 1000 / 1500 px
 *   - 직사각형 1200×600 기준: 1200×600 / 2400×1200 / 3600×1800 px
 */

export async function exportToPng(element, filename = `banner_${Date.now()}.png`, scale = 2) {
  const canvas = await html2canvas(element, {
    scale:           scale,
    useCORS:         true,
    allowTaint:      true,
    backgroundColor: null,
    width:           element.offsetWidth,
    height:          element.offsetHeight,
    logging:         false,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
