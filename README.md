# GripPay 배너 생성기

상품 이미지를 업로드하면 자동으로 배경을 제거하고, 정사각형(500×500)과 직사각형(1200×600) 배너를 동시에 생성하는 웹 툴입니다.

![배너 생성기 미리보기](assets/logo.svg)

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🖼 자동 누끼 | remove.bg API로 상품 이미지 배경 자동 제거 |
| 🎨 배경색 자동 추출 | 상품 이미지에서 대표 색상 추출해 배경 자동 설정 |
| ✍️ 폰트 제어 | 폰트 패밀리 · 크기 · 굵기 인라인 조절 |
| 🔤 로컬 폰트 | 컴퓨터에 설치된 모든 폰트 불러와 사용 가능 (Chrome 전용) |
| 🖱 이미지 드래그 | 배너 내 이미지 위치를 마우스로 드래그해 미세 조정 |
| 📐 두 가지 비율 | 정사각형 1:1 · 직사각형 2:1 동시 렌더링 |
| 📤 해상도 선택 | 1× · 2× · 3× 배율로 PNG 내보내기 |

---

## 시작하기

### 사전 준비 — remove.bg API 키

배경 자동 제거를 사용하려면 무료 API 키가 필요합니다.

1. [remove.bg](https://www.remove.bg/api) 접속 → 회원가입
2. API 키 발급 (무료: 월 50장)
3. 앱 좌측 패널 상단 **"remove.bg API 키"** 입력란에 붙여넣기 → **저장**

---

## 사용 방법

### 1. 이미지 업로드
- 좌측 패널 **"상품 이미지 업로드"** 클릭 → 이미지 선택
- 업로드 즉시 배경 제거 + 배경색 자동 추출 실행

### 2. 문구 입력
- **서브타이틀**: 한 줄 텍스트 입력
- **타이틀**: 두 줄까지 가능 — `Enter` 키로 줄바꿈

### 3. 폰트 설정 (텍스트 인풋 하단 컨트롤 행)
```
[폰트명     ] [44 px] [Bold ▼]
```
- **폰트명**: 클릭하면 목록이 펼쳐지며 타이핑으로 검색 가능
- **로컬 폰트 불러오기** 버튼 클릭 시 컴퓨터에 설치된 폰트 전체 로드 (Chrome 103+)
- **크기**: 숫자 입력 또는 클릭 후 수정
- **굵기**: Light / Regular / Medium / SemiBold / Bold

### 4. 이미지 위치 조정
- 배너 이미지 영역을 **드래그**해 위치 조정
- 정사각형 / 직사각형 배너 각각 독립 조정 가능

### 5. 배경색
- 좌측 패널 하단 **"배경색"** 컬러피커에서 직접 변경
- 이미지 업로드 시 자동 추출된 색상으로 덮어씌워짐

### 6. PNG 내보내기
- 배너 하단 **1× · 2× · 3×** 버튼으로 해상도 선택
- **PNG 내보내기** 클릭

| 배율 | 정사각형 | 직사각형 |
|------|----------|----------|
| 1× | 500 × 500 px | 1200 × 600 px |
| 2× | 1000 × 1000 px | 2400 × 1200 px |
| 3× | 1500 × 1500 px | 3600 × 1800 px |

---

## 로컬에서 실행하기

GitHub Pages 배포 버전 외에 로컬에서 직접 실행할 수 있습니다.  
ES Modules 사용으로 **반드시 로컬 서버** 경유 실행이 필요합니다 (파일 직접 열기 불가).

### Mac

```bash
# 방법 1 — Python (기본 내장)
cd ad-banner-generator
python3 -m http.server 3000
# 브라우저: http://localhost:3000

# 방법 2 — Node.js
npx http-server . -p 3000
# 브라우저: http://localhost:3000
```

### Windows

```cmd
:: 방법 1 — Python
cd ad-banner-generator
python -m http.server 3000
:: 브라우저: http://localhost:3000

:: 방법 2 — Node.js (PowerShell)
npx http-server . -p 3000
:: 브라우저: http://localhost:3000
```

### VS Code 사용 시 (Mac / Windows 공통)
1. [Live Server 확장 설치](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. `index.html` 우클릭 → **"Open with Live Server"**

---

## 폰트 안내

| 폰트 | 사용처 | 비고 |
|------|--------|------|
| Pretendard | 서브타이틀 기본 · 타이틀 선택 가능 | CDN 자동 로드 |
| Sandoll Nemony 02 Oblique | 타이틀 기본 | 로컬 설치 필요 |
| 시스템 폰트 전체 | "로컬 폰트 불러오기" 후 선택 가능 | Chrome 103+ |

> Sandoll Nemony는 유료 폰트로, 해당 폰트가 설치된 컴퓨터에서만 정상 표시됩니다.  
> 미설치 환경에서는 serif 계열 폰트로 대체됩니다.

---

## 브라우저 호환성

| 기능 | Chrome | Edge | Firefox | Safari |
|------|--------|------|---------|--------|
| 배너 생성 · 내보내기 | ✅ | ✅ | ✅ | ✅ |
| 로컬 폰트 불러오기 | ✅ 103+ | ✅ 103+ | ❌ | ❌ |

---

## 기술 스택

- Vanilla JS (ES Modules)
- [html2canvas](https://html2canvas.hertzen.com/) — DOM → PNG 변환
- [ColorThief](https://lokeshdhakar.com/projects/color-thief/) — 배경색 자동 추출
- [remove.bg API](https://www.remove.bg/api) — AI 배경 제거
- [Pretendard](https://github.com/orioncactus/pretendard) — 한글 폰트

---

## 라이선스

내부 업무용 도구입니다.
