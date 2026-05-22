# 화순전남대학교병원 폐암 정밀의료 대시보드

Vite + React + TypeScript + Tailwind CSS 기반 4기 폐암 환자 맞춤 시뮬레이션 대시보드.
Google Gemini API를 사용해 정밀 의학 소견, 생활 가이드, 실시간 Q&A 챗봇, TTS 음성 소견을 제공한다.

## 로컬 실행

```bash
npm install
cp .env.example .env   # 키 입력
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

## 환경 변수

| 변수 | 설명 |
| --- | --- |
| `VITE_GEMINI_API_KEY` | Google Gemini API 키 |

> Vite는 `VITE_` 접두사가 붙은 변수만 클라이언트 번들에 노출한다.

## 주요 스크립트

```bash
npm run dev        # 개발 서버
npm run build      # 타입 체크 + 프로덕션 빌드 (dist/)
npm run preview    # 빌드 결과 미리보기
npm run typecheck  # 타입만 검증
npm run lint       # ESLint
```

## Vercel 배포

이 레포는 Vercel 배포가 바로 가능하도록 구성돼 있다.

1. GitHub에 push.
2. [vercel.com](https://vercel.com) → **Add New Project** → 레포 선택.
3. Framework 자동 인식 (Vite).
4. **Environment Variables**에 `VITE_GEMINI_API_KEY` 추가.
5. Deploy.

또는 CLI:

```bash
npm i -g vercel
vercel
vercel --prod
```

`vercel.json`이 SPA fallback rewrite와 빌드 설정을 명시한다.

## 디스클레이머

본 대시보드의 모든 수치/소견은 AI 보조 정보이며 실제 진료 계획은 전문의 소견을 우선한다.
