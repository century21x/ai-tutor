# 일등공신 선생님 — AI 스터디 비서

초·중·고 학생을 위한 AI 과외 선생님 웹앱입니다. Google Gemini API로 수학, 국어, 영어, 과학 학습을 도와줍니다.

## 기능

- **4과목 지원**: 수학, 국어, 영어, 과학
- **프로필 관리**: 학생별 이름·학년 설정, 과목별 대화 기록 분리
- **힌트 중심 학습**: 정답보다 단계적 사고 유도
- **수식 렌더링**: KaTeX로 LaTeX 수식 표시
- **빠른 액션**: 문제 풀이, 출제, 개념 설명 원클릭
- **다크 모드** 지원

## 실행 방법

```powershell
cd D:\Fill
python -m http.server 8080
```

브라우저에서 http://localhost:8080 접속

## API 키 설정

1. [Google AI Studio](https://aistudio.google.com/apikey)에서 API 키 발급
2. 앱 좌측 하단 **API 설정**에서 키 입력
3. 키는 브라우저 localStorage에만 저장됩니다

## 협업

Claude + Cursor 협업 가이드는 [docs/COLLABORATION.md](docs/COLLABORATION.md)를 참고하세요.

## 기술 스택

- Vanilla HTML / CSS / JavaScript
- Google Gemini 2.0 Flash
- marked.js, KaTeX (CDN)
