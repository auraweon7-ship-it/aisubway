# 🚇 서울 지하철 실시간 대시보드

> 서울시 열린데이터광장 실시간 지하철 API를 활용한 인터랙티브 대시보드  
> Real-time Seoul Metro Dashboard powered by Seoul Open Data Plaza API

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet&logoColor=white)](https://leafletjs.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📸 스크린샷

```
┌─────────────────────────────────────────────────────────┐
│  🚇 서울 지하철 실시간 대시보드          LIVE  00:00:00 │
├─────────────────────────────────────────────────────────┤
│  [역명 검색...]  [1호선][2호선][3호선]...               │
├──────────┬──────────┬──────────┬──────────┤
│  조회역  │ 도착예정 │ 최단도착 │  운행중  │
├─────────────────────────────────────────────────────────┤
│  📊 실시간 혼잡도 분석  [호선별][시간대][현재역]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│           🗺️  서울 지하철 노선도 (Leaflet)             │
│                  (1~9호선 실시간 표시)                  │
│                                                         │
├───────────────────────────┬─────────────────────────────┤
│  실시간 도착 정보 테이블  │  역 정보 / 빠른 검색        │
└───────────────────────────┴─────────────────────────────┘
```

---

## ✨ 주요 기능

### 🗺️ 인터랙티브 지하철 노선도
- **1~9호선 전 노선** 실제 GPS 좌표 기반 지도 표시
- 호선별 공식 색상 폴리라인 + 역명 레이블
- 역 마커 클릭 → 팝업에서 실시간 도착 정보 즉시 조회
- 호선 버튼으로 노선 개별 표시/숨김 제어
- 역 검색 시 지도 자동 이동 및 하이라이트

### 🚉 실시간 도착 정보
- 서울시 실시간 지하철 API 연동 (30초 자동 갱신)
- 도착 예정 시간 색상 구분 (🔴 1분 이내 / 🟡 2분 이내 / 🟢 여유)
- 운행 상태 배지 (운행중 / 진입 / 도착 / 출발)
- 행선지·현재 위치·열차 편성 정보 표시

### 📊 실시간 혼잡도 분석
- **호선별 탭**: 1~9호선 전체 혼잡도 카드 (프로그레스 바 + 수치)
- **시간대 탭**: 오늘 05~24시 혼잡도 막대 차트 (현재 시간 강조)
- **현재 역 탭**: 원형 게이지 + 혼잡 단계·열차 간격·예측 정보
- 60초 자동 갱신

### 🔍 검색 및 빠른 접근
- 역명 실시간 검색 (Enter 키 지원)
- 인기 역 8개 원클릭 빠른 검색
- 검색 시 지도 자동 포커스

---

## 🏗️ 프로젝트 구조

```
aisubway/
├── server.js          # Express CORS 프록시 서버
├── package.json       # 의존성 및 npm 스크립트
├── railway.json       # Railway 배포 설정
├── .gitignore
└── public/
    └── index.html     # 대시보드 단일 HTML 파일
```

---

## 🛠️ 기술 스택

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **런타임** | Node.js | 22.x | 서버 실행 환경 |
| **서버** | Express | 5.x | HTTP 서버 / 정적 파일 서빙 |
| **프록시** | http-proxy-middleware | 3.x | CORS 우회 프록시 |
| **지도** | Leaflet.js | 1.9.4 | 인터랙티브 노선도 |
| **폰트** | Noto Sans KR / DM Mono | — | UI 타이포그래피 |
| **지도 타일** | OpenStreetMap | — | 배경 지도 |
| **API** | 서울 열린데이터광장 | — | 실시간 지하철 정보 |

---

## ⚙️ API 정보

### 서울 열린데이터광장 실시간 지하철 API

| 항목 | 내용 |
|------|------|
| 제공처 | 서울특별시 교통정보과 |
| 도메인 | `http://swopenapi.seoul.go.kr` |
| 인증 | 실시간 지하철 인증키 필요 |
| 호출 형식 | `GET /api/subway/{KEY}/json/realtimeStationArrival/{start}/{end}/{역명}` |
| 응답 형식 | JSON |
| 호출 한도 | 1회 최대 1,000건 / 하루 최대 1,000회 |

**인증키 발급**: [서울 열린데이터광장](https://data.seoul.go.kr) → 회원가입 → 실시간 지하철 인증키 신청

### CORS 우회 구조

```
브라우저 → localhost:3000/api/subway/...
                ↓ (server.js 프록시)
         swopenapi.seoul.go.kr/api/subway/...
```

브라우저는 동일 출처(`localhost:3000`)로만 요청하므로 CORS 정책 우회가 가능합니다.

---

## 🚀 로컬 실행

### 사전 요구사항

- Node.js 18.x 이상
- npm 9.x 이상

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/auraweon7-ship-it/aisubway.git
cd aisubway

# 2. 의존성 설치
npm install

# 3. 서버 실행
npm start
```

### 접속

```
http://localhost:3000
```

> ⚠️ `public/index.html`을 직접 더블클릭하면 CORS 오류가 발생합니다.  
> 반드시 `http://localhost:3000`으로 접속하세요.

---

## ☁️ Railway 배포

### 1단계 — Railway 연결

1. [railway.app](https://railway.app) 접속 → GitHub 로그인
2. **New Project** → **Deploy from GitHub repo**
3. `aisubway` 저장소 선택 → **Deploy Now**

### 2단계 — 도메인 발급

```
프로젝트 → Settings → Networking → Generate Domain
→ https://aisubway-xxxx.up.railway.app 발급
```

### 3단계 — 접속 확인

발급된 URL로 접속하면 즉시 작동합니다. `BASE_URL`이 환경을 자동 감지하므로 별도 설정이 필요 없습니다.

```javascript
// index.html 내 자동 감지 로직
const BASE_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api/subway'   // 로컬
  : `${location.origin}/api/subway`;    // 배포 환경
```

### Railway 무료 플랜 한도

| 항목 | 무료 한도 |
|------|-----------|
| 실행 시간 | 월 500시간 |
| 메모리 | 512MB |
| 네트워크 | 1GB/월 |
| 슬립 모드 | 없음 (항상 켜짐) |

---

## 📡 API 엔드포인트

서버 실행 후 사용 가능한 엔드포인트입니다.

### 실시간 도착 정보 조회

```
GET /api/subway/{인증키}/json/realtimeStationArrival/{start}/{end}/{역명}
```

**예시:**
```bash
curl http://localhost:3000/api/subway/YOUR_KEY/json/realtimeStationArrival/0/20/강남
```

**응답 예시:**
```json
{
  "realtimeArrivalList": [
    {
      "subwayId": "1002",
      "subwayNm": "수도권 2호선",
      "statnNm": "강남",
      "bstatnNm": "성수",
      "barvlDt": "180",
      "arvlCd": "0",
      "arvlMsg2": "역삼 - 강남 사이",
      "trainLineNm": "성수행"
    }
  ]
}
```

### 응답 필드 설명

| 필드 | 설명 |
|------|------|
| `subwayId` | 호선 ID (`1001`=1호선, `1002`=2호선, ...) |
| `statnNm` | 현재 역명 |
| `bstatnNm` | 행선지(종착역) |
| `barvlDt` | 도착 예정 시간 (초 단위) |
| `arvlCd` | 도착 코드 (`0`=운행중, `1`=진입, `2`=도착, `3`=출발) |
| `arvlMsg2` | 현재 위치 메시지 |
| `trainLineNm` | 열차 노선명 |

---

## 🗺️ 지원 노선

| 호선 | 색상 | 주요 구간 |
|------|------|-----------|
| 1호선 | 🔵 `#263c96` | 소요산 ↔ 천안·신창 |
| 2호선 | 🟢 `#3a9c3b` | 순환선 (시청 기준) |
| 3호선 | 🟠 `#f5771a` | 대화 ↔ 오금 |
| 4호선 | 🔷 `#3a71c1` | 당고개 ↔ 오이도 |
| 5호선 | 🟣 `#8b50a4` | 방화 ↔ 마천·하남검단산 |
| 6호선 | 🟤 `#c55c1d` | 응암 ↔ 신내 |
| 7호선 | 🫒 `#747f00` | 장암 ↔ 석남 |
| 8호선 | 🔴 `#e31c58` | 암사 ↔ 모란 |
| 9호선 | 🟡 `#bfa100` | 개화 ↔ 중앙보훈병원 |

---

## 🔧 환경 변수

| 변수명 | 기본값 | 설명 |
|--------|--------|------|
| `PORT` | `3000` | 서버 포트 (Railway 자동 설정) |

---

## 📁 주요 파일 설명

### `server.js`

Express 기반 CORS 프록시 서버입니다.

```javascript
// 실시간 지하철 API 프록시 경로
app.use('/api/subway', createProxyMiddleware({
  target: 'http://swopenapi.seoul.go.kr',
  changeOrigin: true
}));

// 일반 Open API 프록시 경로
app.use('/api/general', createProxyMiddleware({
  target: 'http://openapi.seoul.go.kr',
  changeOrigin: true
}));
```

### `public/index.html`

단일 파일 대시보드입니다. 외부 의존성은 CDN으로 로드합니다.

- **Leaflet.js** — 지도 렌더링
- **Noto Sans KR / DM Mono** — Google Fonts
- **OpenStreetMap** — 배경 지도 타일

---

## 🐛 트러블슈팅

### API 호출 오류 (CORS)

```
원인: HTML 파일을 직접 열거나 서버 없이 실행
해결: npm start 후 http://localhost:3000 으로 접속
```

### 역 정보가 표시되지 않음

```
원인: 잘못된 역명 입력 (예: "강남역" → "강남" 으로 입력)
해결: 역명에서 "역" 제외하고 검색
```

### Railway 배포 후 접속 안 됨

```
원인: PORT 환경변수 미설정
해결: server.js에서 process.env.PORT || 3000 확인
```

### 지도가 로드되지 않음

```
원인: CDN 차단 또는 네트워크 문제
해결: Leaflet CDN 접근 가능 여부 확인
      https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js
```

---

## 🔄 업데이트 방법

```bash
# 코드 수정 후 GitHub push → Railway 자동 재배포
git add .
git commit -m "업데이트 내용"
git push origin main
```

Railway는 `main` 브랜치 push를 감지해 자동으로 빌드·배포합니다.

---

## 📄 라이선스

MIT License — 자유롭게 사용, 수정, 배포 가능합니다.

---

## 🙏 참고 및 출처

- [서울 열린데이터광장](https://data.seoul.go.kr) — 실시간 지하철 API 제공
- [Leaflet.js](https://leafletjs.com) — 오픈소스 지도 라이브러리
- [OpenStreetMap](https://www.openstreetmap.org) — 오픈소스 지도 데이터
- [Railway](https://railway.app) — 배포 플랫폼

---

<div align="center">

**서울 지하철 실시간 대시보드** · Made with ❤️ by [auraweon7-ship-it](https://github.com/auraweon7-ship-it)

</div>
