# 일등공신 AI 튜터 — 협업 가이드

## 역할 분담

| 역할 | 담당 | 작업 범위 |
|------|------|-----------|
| **총괄·기능** | Claude | 과목 확장, 프롬프트 설계, UI/UX 개선 |
| **구현·디버깅** | Cursor | 코드 리팩터, API 연동, 반응형·버그 수정 |
| **기획·테스트** | 사용자 | 실제 학습 시나리오 테스트, 피드백 |

## ⚠️ Git 구조 주의 (Claude·Cursor 공통)

| 항목 | 실제 위치 |
|------|-----------|
| **Git 루트** | `D:\Fill` (ai-tutor 폴더가 아님!) |
| **추적 중인 파일** | `D:\Fill\app.js`, `index.html`, `style.css` |
| **워크스페이스** | `D:\Fill\ai-tutor` (Cursor가 여는 폴더) |
| **미러 복사본** | `D:\Fill\ai-tutor\` 아래에도 동일 파일 존재 (git 미추적) |

`D:\Fill\ai-tutor`에서 `git ls-files`를 실행하면 **0건**이 나옵니다.  
Git 명령은 반드시 `git -C "D:\Fill"` 로 실행하세요.

```powershell
# 올바른 예
git -C "D:\Fill" status
git -C "D:\Fill" diff

# 잘못된 예 (ai-tutor 폴더에서 실행)
cd D:\Fill\ai-tutor && git status   # 빈 저장소처럼 보임
```

> **권장 정리**: 추후 `ai-tutor` 폴더만 독립 git 저장소로 분리하면 혼란이 줄어듭니다.

## 파일 구조

```
D:\Fill\                    # ← git 루트 (origin: century21x/ai-tutor)
├── app.js                  # UI 핵심 로직 (최신)
├── index.html
├── style.css
├── README.md
├── docs/
│   ├── COLLABORATION.md
│   └── ROADMAP.md
└── ai-tutor/               # Cursor 워크스페이스 (미러, git 미추적)
    ├── app.js
    ├── index.html
    └── ...
```

## 작업 흐름

1. **ROADMAP.md**에서 우선순위 확인
2. Claude가 기능·프롬프트 설계 → Cursor가 코드 반영
3. `index.html`을 브라우저로 열어 수동 테스트
4. 이슈는 ROADMAP 체크리스트에 기록

## 로컬 실행

```powershell
cd D:\Fill
python -m http.server 8080
# http://localhost:8080 접속
```

> `file://`로 열어도 동작하지만, CORS 이슈 방지를 위해 로컬 서버 권장

## API 키

[Google AI Studio](https://aistudio.google.com/apikey)에서 Gemini API 키 발급 후 앱 설정에 입력
