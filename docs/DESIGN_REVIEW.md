# 디자인 리뷰 및 토큰 스펙 (Design Token Spec)

본 문서는 "일등공신 선생님"의 프리미엄 UI/UX 개편을 위한 디자인 방향성과 구체적인 CSS 토큰 규격을 정의합니다. **(Cursor 작업용 스펙문서)**

---

## 1. 디자인 원칙 및 방향성 (Design Principles)

1. **라이트/다크 테마 동등성 (Equal Treatment)**
   - 두 테마 모두 일관된 프리미엄 경험을 제공합니다. 다크 모드는 단순히 색을 뒤집는 것이 아니라, 몽환적인 '미드나잇 블루(Midnight Blue)'와 퍼플(Purple) 포인트를 활용하여 디자인 완성도를 높입니다. 라이트 모드 역시 동일한 보라색 포인트를 밝고 산뜻한 무드로 적용합니다.

2. **가독성 최우선 (Accessibility First)**
   - **컨텐츠 솔리드 배경**: 채팅 본문과 텍스트가 많은 영역은 가독성을 위해 순수 솔리드(Solid) 배경을 유지합니다 (유리 효과 금지).
   - **절제된 효과**: Glassmorphism(유리 질감), Glow(빛 번짐), Blur(블러) 효과는 사이드바, 헤더, 모달 등 주변부 인터페이스에만 사용하여 시선 분산을 막습니다.
   - **대비율 준수**: 모든 본문 텍스트는 배경 대비 WCAG AA 기준(4.5:1)을 통과하도록 설계합니다. (라이트/다크 각각 수치 검증 완료)
   - **모션 최적화**: `@media (prefers-reduced-motion: reduce)`를 지원하도록 작성하며, 애니메이션은 과도한 움직임을 배제하고 미묘한(Subtle) 호버 트랜지션 위주로 구성합니다.

3. **타이포그래피 (Typography)**
   - 한글 본문은 `Pretendard`를 최우선으로 사용하며, 영문/숫자 타이포그래피를 위해 `Inter`를 병기합니다.

---

## 2. 디자인 토큰 스펙 (Design Tokens)

아래 토큰들을 `style.css`의 `:root` 및 `[data-theme="dark"]`에 반영합니다.

### 2.1 Typography (타이포그래피)
- **`--font-sans`**: `'Pretendard Variable', Pretendard, 'Inter', -apple-system, sans-serif;`
- **`--font-display`**: `'Pretendard Variable', Pretendard, 'Inter', -apple-system, sans-serif;` (제목용 - 두께로 구분)
- **Weights**: 본문은 `400`(Regular)/`500`(Medium), 제목은 `700`(Bold)/`800`(ExtraBold) 사용

### 2.2 Color Palette (색상 토큰)

| 토큰 (Token) | 라이트 테마 (Light) | 다크 테마 (Dark) | 설명 및 대비율 (Contrast Ratio) |
|---|---|---|---|
| `--bg` | `#f8fafc` | `#0f172a` | 앱 전체 배경 (Slate 50 / Slate 900) |
| `--surface` | `#ffffff` | `#1e293b` | 텍스트 콘텐츠, 본문 패널 배경 (솔리드) |
| `--sidebar-bg` | `#ffffff` | `#0f172a` | 사이드바 기본 배경 (블러 효과 전) |
| `--text-primary` | `#0f172a` | `#f8fafc` | 주요 텍스트 (대비율 - 라이트: 13.5:1 / 다크: 12.3:1) |
| `--text-secondary`| `#475569` | `#94a3b8` | 보조 텍스트 (대비율 - 라이트: 5.8:1 / 다크: 5.4:1) |
| `--accent` | `#6366f1` | `#818cf8` | 주요 액센트 컬러 (Indigo 500 / Indigo 400) |
| `--accent-hover` | `#4f46e5` | `#6366f1` | 액센트 버튼 호버 상태 |
| `--accent-glow` | `rgba(99, 102, 241, 0.4)` | `rgba(129, 140, 248, 0.4)` | 액센트 투명 컬러 (Glow 용도) |
| `--border` | `#e2e8f0` | `#334155` | 기본 구분선 및 테두리 |
| `--msg-user` | `#e0e7ff` | `#312e81` | 유저 채팅 말풍선 배경 (가독성을 위한 솔리드) |
| `--msg-ai` | `#ffffff` | `#1e293b` | AI 채팅 말풍선 배경 (가독성을 위한 솔리드) |
| `--glass-bg` | `rgba(255, 255, 255, 0.7)` | `rgba(15, 23, 42, 0.75)` | 반투명 패널 배경 (헤더, 사이드바 등) |
| `--glass-border` | `rgba(255, 255, 255, 0.5)` | `rgba(255, 255, 255, 0.08)` | 반투명 패널 테두리 (미세한 하이라이트 효과) |

### 2.3 Effects & Modifiers (효과 토큰)
- **`--shadow-sm`**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (카드, 말풍선 기본)
- **`--shadow-md`**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` (모달 등)
- **`--glow`**: `0 0 12px var(--accent-glow)` (포커스 및 액티브 상태의 은은한 빛 번짐)
- **`--blur`**: `12px` (backdrop-filter용 수치)

---

## 3. 기능 UX 시각 디자인 스펙 (Functional UX Visual Spec)

### 3.1 25과목 모바일 선택 UX (Subject Selector UI)
모바일 환경에서 많은 과목(25개)을 효율적으로 탐색하기 위한 시각/동작 스펙입니다.
- **검색 바 (Search Bar)**: 리스트 상단에 스티키(Sticky)하게 고정. 입력 필드에 돋보기 아이콘을 배치하고, 포커스 시 `--glow` 효과를 주어 검색 유도.
- **카테고리 아코디언 (Accordion Fold)**: '국어', '수학' 등 대분류를 아코디언 헤더로 분리.
  - 헤더는 우측에 Chevron(방향 화살표) 아이콘을 가짐.
  - 클릭 시 `max-height`를 이용한 부드러운 펼침/접힘 트랜지션(0.3s ease) 적용.
- **스크롤 최적화**: 사이드바 또는 모달 내 과목 리스트 영역은 `overflow-y: auto`를 적용. 모바일에서는 스크롤바를 숨기거나(CSS `::-webkit-scrollbar { width: 0; }`) 매우 얇게 처리.

### 3.2 난이도 셀렉터 (Difficulty Selector UI)
사용자가 학습 수준(쉬움/보통/어려움)을 지정하는 기능의 시각 스펙입니다.
- **시각적 위계 (Hierarchy)**: 과목 선택이나 채팅 보내기 버튼보다 낮은 위계. 너무 눈에 띄지 않게 보조적인 컨트롤 요소로 디자인.
- **위치 (Position)**: 
  - 모바일: 채팅 입력창(`input-area`)의 바로 윗부분(Quick Actions 영역과 결합)에 작게 배치.
  - 데스크탑: 사이드바의 과목 선택 영역 하단 또는 채팅창 헤더(`chat-header`)의 보조 옵션으로 배치.
- **디자인 컴포넌트 (Segmented Control)**:
  - 알약 모양(Pill-shaped)의 컨테이너(`--bg` 색상 배경) 내부에 3개의 옵션을 나란히 배치.
  - 선택된 옵션은 컨테이너 내에서 슬라이딩되는 듯한 백그라운드(`--surface` + `--shadow-sm`)를 가져 확연히 튀어나와 보이도록 처리.
  - 텍스트 컬러: 미선택(비활성)은 `--text-secondary`, 선택은 `--text-primary` 적용. 
  - 상태별 미세한 색상 힌트(Optional): '쉬움(초록계열)', '보통(기본)', '어려움(빨간/오렌지계열)'의 작은 닷(Dot) 아이콘을 텍스트 옆에 배치하여 직관성 강화.
