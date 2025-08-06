# Auth Client

KRGeobuk 생태계의 독립적인 인증 클라이언트입니다. auth.krgeobuk.com에서 서비스되며, SSO 허브 역할을 담당합니다.

## 🚀 주요 기능

- **일반 로그인/회원가입**: 이메일 기반 사용자 인증
- **OAuth 로그인**: Google, Naver 소셜 로그인 지원  
- **SSO 허브**: 모든 krgeobuk 서비스의 중앙 인증
- **비밀번호 관리**: 찾기/재설정 기능
- **보안**: Rate limiting, Honeypot, 입력 검증

## 🛠 기술 스택

- Next.js 15 (App Router)
- TypeScript 
- Tailwind CSS
- Redux Toolkit
- Axios

## 🚀 시작하기

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 시작 (포트 3001)
npm run dev
```

## 🌐 SSO 통합

auth-client는 krgeobuk 생태계의 중앙 인증 서비스입니다:

1. 다른 서비스 접근 시 auth.krgeobuk.com으로 리다이렉트
2. 인증 완료 후 원래 서비스로 자동 복귀
3. 도메인 쿠키를 통한 자동 인증 상태 동기화

## 📁 주요 구조

```
src/
├── app/
│   ├── login/              # 로그인 페이지
│   ├── register/           # 회원가입
│   ├── forgot-password/    # 비밀번호 찾기
│   └── oauth/             # OAuth 콜백
├── services/
│   ├── authService.ts     # 인증 서비스
│   └── ssoService.ts      # SSO 관리
└── store/                 # Redux 상태
```

## 🔄 OAuth 흐름

1. 사용자가 OAuth 로그인 클릭
2. auth-server OAuth 엔드포인트로 리다이렉트
3. 제공자(Google/Naver) 인증 완료
4. OAuth 콜백 페이지에서 토큰 처리
5. SSO 쿠키 설정 후 서비스 복귀

## 🐳 Docker

```bash
# 빌드
docker build -t auth-client .

# 실행
docker run -p 3001:3000 --env-file .env.local auth-client
```

---

© 2024 KRGeobuk
