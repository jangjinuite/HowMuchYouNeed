# How Much You Need

"얼마를 받으면 하시겠어요?" - 재미있는 질문과 답변 게임

## 프로젝트 구조

```
HowMuchYouNeed/
├── frontend/
│   ├── index.html          # 메인 게임 페이지
│   ├── admin.html          # 관리자 대시보드
│   ├── style.css           # 스타일
│   ├── app.js              # 프론트엔드 로직
│   └── robots.txt          # SEO 설정
├── backend/
│   ├── server.js           # Express 서버
│   ├── routes/             # API 라우트
│   ├── middleware/         # 미들웨어
│   ├── utils/              # 유틸리티
│   ├── schema.sql          # DB 스키마
│   └── package.json
└── README.md
```

## 기술 스택

**Frontend:**
- Vanilla HTML/CSS/JavaScript
- Fetch API

**Backend:**
- Node.js + Express
- Supabase (PostgreSQL)
- Rate Limiting (스팸 방지)

**배포:**
- Frontend: Vercel (무료)
- Backend: Render (무료)
- Database: Supabase (무료)

## 로컬 실행

### 1. 백엔드
```bash
cd backend
npm install
cp .env.example .env
# .env 파일 수정 (Supabase 정보 입력)
npm start
```

### 2. 프론트엔드
`index.html`을 브라우저로 열기

## 배포 가이드

### 1. Supabase 설정
1. https://supabase.com 가입
2. 새 프로젝트 생성
3. SQL Editor에서 `backend/schema.sql` 실행
4. API URL과 anon key 복사

### 2. Render에 백엔드 배포
1. https://render.com 가입
2. "New Web Service" 생성
3. GitHub 저장소 연결
4. 환경변수 설정:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `ADMIN_PASSWORD`
   - `NODE_ENV=production`
5. Build Command: `cd backend && npm install`
6. Start Command: `node backend/server.js`

### 3. Vercel에 프론트엔드 배포
1. https://vercel.com 가입
2. "New Project" 생성
3. GitHub 저장소 연결
4. Root Directory: 루트 (.)
5. 자동 배포

### 4. 프론트엔드 API URL 업데이트
`app.js`와 `admin.html`에서:
```javascript
const API_URL = 'https://your-render-url.onrender.com';
```

## 관리자 페이지

`/admin.html`로 접근 (링크는 숨겨져 있음)

## 무료 Tier 제한

- Vercel: 100GB 대역폭/월
- Supabase: 500MB DB, 2GB 전송/월
- Render: 750시간/월, 15분 비활성시 sleep

## 라이선스

MIT
