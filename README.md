# 카드뉴스 메이커

React(Vite) + Vercel 서버리스 함수. AI 문구 생성은 Google Gemini를 씁니다.

## 구조

```
index.html            진입 HTML
src/main.jsx          React 마운트
src/CardNewsMaker.jsx 앱 본체 (askAI() 로 /api/generate 호출)
api/generate.js       Vercel 서버리스 함수 → Gemini 호출 (키는 여기서만 사용)
```

API 키는 브라우저에 절대 내려가지 않습니다. 클라이언트는 `/api/generate` 만 부르고,
실제 Gemini 호출은 서버에서 `GEMINI_API_KEY` 환경변수로 이뤄집니다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 키 채워넣기
npx vercel dev               # 프런트 + /api 함께 실행
```

`npm run dev`(Vite 단독)는 `/api` 를 서빙하지 않아 AI 기능이 동작하지 않습니다.
로컬에서 AI까지 확인하려면 `vercel dev` 를 쓰세요.

## 배포

1. GitHub 저장소로 push
2. [vercel.com/new](https://vercel.com/new) 에서 저장소 import (Vite 자동 감지)
3. **Settings → Environment Variables** 에 추가:
   - Name: `GEMINI_API_KEY`
   - Value: 발급받은 키
   - Environments: Production / Preview / Development 전부 체크
4. Deploy. (환경변수를 배포 후에 추가했다면 Deployments 에서 **Redeploy**)

## 모델 변경

기본은 `gemini-2.5-flash`. 바꾸려면 환경변수 `GEMINI_MODEL` 을 추가하세요.

## 참고

루트의 `CardNewsMaker.html` / `CardNewsMaker.jsx` 는 원본(Claude 아티팩트용) 파일이라
배포에 쓰이지 않습니다. 실제 코드는 `src/CardNewsMaker.jsx` 입니다.
