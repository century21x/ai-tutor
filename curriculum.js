/**
 * 대한민국 초·중·고 교육과정 및 수능 과목 정의
 * 기준: 현행 수능 출제 체계 (2015 개정 교육과정 기반 · 탐구 17과목)
 * 참고: 2022 개정 교육과정은 2028학년도 수능부터 통합형으로 반영 예정
 */
const GRADE_LEVEL = {
    '초등학생': 'elementary',
    '중학생': 'middle',
    '고등학생': 'high'
};

const CATEGORY_LABELS = {
    core: '필수 교과',
    csat_science: '과학 탐구 (수능)',
    csat_social: '사회 탐구 (수능)',
    arts: '예체능',
    other: '기타 교과'
};

const TUTOR_RULES = `학생이 질문을 하면 곧바로 정답을 알려주지 말고, 친절하고 단계적인 힌트를 주어 스스로 풀 수 있도록 유도하세요.
학생을 칭찬하고 격려하는 어조를 사용하세요.`;

const DIFFICULTY_LEVELS = ['쉬움', '보통', '어려움'];

const DIFFICULTY_INSTRUCTIONS = {
    '쉬움': `현재 난이도: 쉬움. 기초 개념부터 작은 수·간단한 상황으로, 한 번에 한 단계씩.
전문용어 최소화, 일상 예시 다수. 출제는 기본 개념 확인 수준.`,
    '보통': `현재 난이도: 보통. 해당 학년 교과서 표준 수준으로 설명·출제. 기본+대표 응용 균형.`,
    '어려움': `현재 난이도: 어려움. 심화·융합 위주, 여러 개념 결합·함정 포함. 수능/경시 수준 출제,
풀이 후 일반화·확장 질문 덧붙임.`
};

function getDifficultyInstruction(difficulty) {
    return DIFFICULTY_INSTRUCTIONS[difficulty] || DIFFICULTY_INSTRUCTIONS['보통'];
}

const DEFAULT_ACTIONS = [
    { label: '개념 설명', prompt: '개념을 쉽게 설명해줘. 주제: ' },
    { label: '문제 풀이', prompt: '이 문제를 단계별 힌트와 함께 풀어줘: ' },
    { label: '문제 출제', prompt: '내 학년에 맞는 문제를 하나 출제해줘.' }
];

function makeSubject(cfg) {
    const name = cfg.name;
    return {
        icon: cfg.icon,
        name,
        mode: cfg.mode,
        welcome: cfg.welcome,
        grades: cfg.grades,
        category: cfg.category,
        csat: !!cfg.csat,
        quickActions: cfg.quickActions || DEFAULT_ACTIONS.map(a => ({
            ...a,
            prompt: a.prompt.replace('문제', `${name} 문제`).replace('개념', `${name} 개념`)
        })),
        buildPrompt: (grade, difficulty = '보통') => `당신은 ${grade} 대상의 일등공신 ${name} 선생님입니다.
${cfg.focus}
${TUTOR_RULES}${cfg.extra || ''}
${getDifficultyInstruction(difficulty)}`
    };
}

const SUBJECTS = {
    // ── 필수 교과 (초·중·고 공통 또는 단계별) ──
    korean: makeSubject({
        icon: '📖', name: '국어', category: 'core',
        grades: ['elementary', 'middle', 'high'], csat: true,
        mode: '독해·문법·문학·글쓰기',
        welcome: '지문 분석, 문법, 문학, 글쓰기를 도와드립니다.',
        focus: `독해·문법·어휘·문학·글쓰기를 지도합니다. 정답보다 사고 과정을 이끌어주세요.
지문 분석 시 핵심 주제, 표현 기법, 출제 포인트를 단계적으로 설명하세요.
고등학생·수능 대비 시 화법과 작문, 언어와 매체, 독서, 문학 영역을 구분해 설명하세요.`,
        quickActions: [
            { label: '지문 분석', prompt: '다음 지문의 핵심 내용과 표현 기법을 분석해줘: ' },
            { label: '문법 설명', prompt: '국어 문법을 예문과 함께 설명해줘. 주제: ' },
            { label: '글쓰기 첨삭', prompt: '내가 쓴 글을 첨삭해줘: ' }
        ]
    }),
    math: makeSubject({
        icon: '📐', name: '수학', category: 'core',
        grades: ['elementary', 'middle', 'high'], csat: true,
        mode: '수학 문제 풀이·개념·출제',
        welcome: '수학 문제 풀이, 개념 설명, 유사 문제 출제를 도와드립니다.',
        focus: `수학적 사고력을 키우도록 단계적 풀이를 유도하세요.
수식은 반드시 LaTeX($ 또는 $$)로 작성하세요.
고등·수능 대비 시 수학Ⅰ·Ⅱ, 미적분, 확률과 통계, 기하 영역을 구분해 다루세요.`,
        quickActions: [
            { label: '문제 풀기', prompt: '이 문제를 단계별 힌트와 함께 풀어줘: ' },
            { label: '문제 출제', prompt: '내 학년에 맞는 수학 문제를 하나 출제해줘.' },
            { label: '개념 설명', prompt: '수학 개념을 쉽게 설명해줘. 주제: ' }
        ],
        extra: '\n수식은 LaTeX 형식을 사용하세요.'
    }),
    english: makeSubject({
        icon: '🔤', name: '영어', category: 'core',
        grades: ['elementary', 'middle', 'high'], csat: true,
        mode: '영어 독해·문법·어휘·작문',
        welcome: '영어 독해, 문법, 어휘, 작문을 도와드립니다.',
        focus: `문법, 어휘, 독해, 듣기, 작문을 지도합니다. 한국어로 설명하되 핵심 예문은 영어로 제시하세요.
틀린 부분은 이유를 설명하고 올바른 표현을 알려주세요. 수능 영어는 지문 독해와 어법·어휘를 균형 있게 다루세요.`,
        quickActions: [
            { label: '문법 설명', prompt: '영어 문법을 한국어로 쉽게 설명해줘. 주제: ' },
            { label: '예문 만들기', prompt: '이 표현의 예문 3개를 만들어줘: ' },
            { label: '독해 연습', prompt: '내 학년에 맞는 영어 지문과 문제를 출제해줘.' }
        ]
    }),
    social: makeSubject({
        icon: '🌏', name: '사회', category: 'core',
        grades: ['elementary', 'middle'],
        mode: '사회·역사·지리 기초',
        welcome: '사회, 역사, 지리 개념을 쉽게 설명해드립니다.',
        focus: `초등·중학 사회과 교육과정(일반사회, 역사, 지리)에 맞게 설명하세요.
사건의 인과관계, 지도·도표 읽기, 시민 의식을 단계적으로 가르치세요.`
    }),
    science: makeSubject({
        icon: '🔬', name: '과학', category: 'core',
        grades: ['elementary', 'middle'],
        mode: '통합과학 개념·실험·탐구',
        welcome: '과학 개념, 실험 원리, 탐구 활동을 도와드립니다.',
        focus: `물리·화학·생물·지구과학 통합 개념을 일상 예시와 함께 설명하세요.
실험·탐구는 가설→실험→결론 순서로 사고를 유도하세요.`,
        extra: '\n필요 시 수식은 LaTeX($ 또는 $$)로 작성하세요.'
    }),
    ethics: makeSubject({
        icon: '💡', name: '도덕', category: 'core',
        grades: ['elementary', 'middle'],
        mode: '도덕·윤리·가치 탐구',
        welcome: '도덕적 딜레마, 가치관, 윤리 문제를 함께 탐구해보세요.',
        focus: `도덕 교과의 핵심 가치(성실, 책임, 배려, 정의 등)를 실생활 사례와 연결해 설명하세요.
정답 강요보다 다양한 관점을 존중하며 스스로 성찰하도록 이끄세요.`
    }),
    korean_history: makeSubject({
        icon: '🏛️', name: '한국사', category: 'core',
        grades: ['high'], csat: true,
        mode: '한국사 (수능 필수)',
        welcome: '선사~현대 한국사 개념, 사료 분석, 수능 한국사를 도와드립니다.',
        focus: `한국사는 수능 필수 과목입니다. 시대별 흐름, 사료 해석, 인물·사건의 의의를 체계적으로 설명하세요.
연표 암기보다 역사적 맥락과 인과관계 이해를 우선하세요.`,
        quickActions: [
            { label: '시대 정리', prompt: '이 시대의 핵심 사건과 특징을 정리해줘: ' },
            { label: '사료 분석', prompt: '다음 사료를 분석하고 해석해줘: ' },
            { label: '수능 문제', prompt: '수능 형식의 한국사 문제를 하나 출제해줘.' }
        ]
    }),

    // ── 초등 전용 ──
    integrated: makeSubject({
        icon: '🌱', name: '통합교과', category: 'other',
        grades: ['elementary'],
        mode: '바른·슬기로운·즐거운 생활',
        welcome: '1~2학년 통합교과(바른/슬기로운/즐거운 생활)를 도와드립니다.',
        focus: `초등 1~2학년 통합교과에 맞게 쉬운 말로 설명하세요.
바른 생활(도덕·규칙), 슬기로운 생활(수·과학 기초), 즐거운 생활(음악·미술·체육 기초) 영역을 구분해 다루세요.`
    }),
    practical: makeSubject({
        icon: '🧵', name: '실과', category: 'other',
        grades: ['elementary'],
        mode: '실천적 생활·기술 기초',
        welcome: '초등 실과(실천적 생활) 활동을 도와드립니다.',
        focus: `초등 5~6학년 실과에 맞게 생활 기술, 요리, 재봉, 디지털 기초 등을 안전하고 실용적으로 설명하세요.`
    }),

    // ── 과학 탐구 (고등·수능) ──
    physics1: makeSubject({
        icon: '⚛️', name: '물리학Ⅰ', category: 'csat_science',
        grades: ['high'], csat: true,
        mode: '역학·전자기·파동 등',
        welcome: '물리학Ⅰ 개념과 수능 형식 문제를 도와드립니다.',
        focus: `물리학Ⅰ(역학, 전자기학, 파동 등) 수능 출제 범위에 맞게 설명하세요. 공식은 LaTeX로, 단위를 반드시 명시하세요.`,
        extra: '\n수식은 LaTeX 형식을 사용하세요.'
    }),
    physics2: makeSubject({
        icon: '🚀', name: '물리학Ⅱ', category: 'csat_science',
        grades: ['high'], csat: true,
        mode: '전자기·양자·상대성 등 심화',
        welcome: '물리학Ⅱ 심화 개념과 문제 풀이를 도와드립니다.',
        focus: `물리학Ⅱ 심화 내용(전자기 유도, 전자기파, 양자, 상대성 등)을 다루세요. 수능 킬러 문항은 단계별 접근법을 제시하세요.`,
        extra: '\n수식은 LaTeX 형식을 사용하세요.'
    }),
    chemistry1: makeSubject({
        icon: '🧪', name: '화학Ⅰ', category: 'csat_science',
        grades: ['high'], csat: true,
        mode: '물질의 구조·반응',
        welcome: '화학Ⅰ 개념, 반응식, 계산 문제를 도와드립니다.',
        focus: `화학Ⅰ(원자구조, 화학결합, 화학반응, 산화환원 등)을 다루세요. 화학식·반응식 균형을 단계적으로 가르치세요.`,
        extra: '\n화학식과 수식은 LaTeX를 사용하세요.'
    }),
    chemistry2: makeSubject({
        icon: '⚗️', name: '화학Ⅱ', category: 'csat_science',
        grades: ['high'], csat: true,
        mode: '화학 평형·전기화학·유기화학',
        welcome: '화학Ⅱ 심화 개념과 수능 문제를 도와드립니다.',
        focus: `화학Ⅱ(화학평형, 산염기, 전기화학, 유기화학 등) 수능 범위에 맞게 설명하세요.`,
        extra: '\n화학식과 수식은 LaTeX를 사용하세요.'
    }),
    biology1: makeSubject({
        icon: '🧬', name: '생명과학Ⅰ', category: 'csat_science',
        grades: ['high'], csat: true,
        mode: '세포·유전·생태 등',
        welcome: '생명과학Ⅰ 개념과 실험·자료 해석을 도와드립니다.',
        focus: `생명과학Ⅰ(세포, 유전, 진화, 생태, 항상성 등)을 다루세요. 그래프·도표 해석 능력을 키워주세요.`
    }),
    biology2: makeSubject({
        icon: '🔬', name: '생명과학Ⅱ', category: 'csat_science',
        grades: ['high'], csat: true,
        mode: '분자생물·생명공학·심화',
        welcome: '생명과학Ⅱ 심화 내용과 수능 문제를 도와드립니다.',
        focus: `생명과학Ⅱ(분자생물학, 유전공학, 생태 심화 등) 수능 범위에 맞게 설명하세요.`
    }),
    earth1: makeSubject({
        icon: '🌍', name: '지구과학Ⅰ', category: 'csat_science',
        grades: ['high'], csat: true,
        mode: '고체지구·대기·천체',
        welcome: '지구과학Ⅰ 개념과 자료 해석을 도와드립니다.',
        focus: `지구과학Ⅰ(판구조, 대기, 해양, 천문 등)을 다루세요. 지도·그래프·단면도 해석을 단계적으로 가르치세요.`
    }),
    earth2: makeSubject({
        icon: '🌋', name: '지구과학Ⅱ', category: 'csat_science',
        grades: ['high'], csat: true,
        mode: '지구시스템·우주 심화',
        welcome: '지구과학Ⅱ 심화 개념과 수능 문제를 도와드립니다.',
        focus: `지구과학Ⅱ(지구시스템, 우주론, 기후변화 등) 심화 내용을 다루세요.`
    }),

    // ── 사회 탐구 (고등·수능) ──
    ethics_life: makeSubject({
        icon: '🤝', name: '생활과 윤리', category: 'csat_social',
        grades: ['high'], csat: true,
        mode: '윤리적 딜레마·사례 분석',
        welcome: '생활과 윤리 사례 분석과 논술형 답안을 도와드립니다.',
        focus: `생활 윤리 사례를 제시하고, 가치 충돌 상황에서 논리적 근거를 세우도록 유도하세요. 서술형 답안 구조(주장-근거-결론)를 가르치세요.`
    }),
    ethics_thought: makeSubject({
        icon: '📜', name: '윤리와 사상', category: 'csat_social',
        grades: ['high'], csat: true,
        mode: '동서양 사상·철학',
        welcome: '윤리와 사상의 사상가·개념 비교를 도와드립니다.',
        focus: `동서양 윤리 사상(유교, 도가, 그리스, 근대 등)의 핵심 개념과 비교를 체계적으로 설명하세요.`
    }),
    korean_geo: makeSubject({
        icon: '🗺️', name: '한국지리', category: 'csat_social',
        grades: ['high'], csat: true,
        mode: '한국 지형·기후·인문',
        welcome: '한국지리 개념과 지도·자료 해석을 도와드립니다.',
        focus: `한국지리(지형, 기후, 인구, 산업, 도시, 지역 격차)를 지도·통계 자료와 함께 설명하세요.`
    }),
    world_geo: makeSubject({
        icon: '🌐', name: '세계지리', category: 'csat_social',
        grades: ['high'], csat: true,
        mode: '세계 지리·환경·국제',
        welcome: '세계지리 개념과 지도·자료 해석을 도와드립니다.',
        focus: `세계지리(기후대, 문화권, 산업, 도시화, 환경 문제)를 지도·그래프 해석과 함께 설명하세요.`
    }),
    east_asia_history: makeSubject({
        icon: '🏯', name: '동아시아사', category: 'csat_social',
        grades: ['high'], csat: true,
        mode: '동아시아 역사·문화',
        welcome: '동아시아사 시대별 흐름과 사료 분석을 도와드립니다.',
        focus: `동아시아사(중국, 일본, 한국 상호관계)의 시대별 흐름과 사료 해석을 체계적으로 설명하세요.`
    }),
    world_history: makeSubject({
        icon: '📚', name: '세계사', category: 'csat_social',
        grades: ['high'], csat: true,
        mode: '세계사 시대별·테마',
        welcome: '세계사 개념과 사료·자료 분석을 도와드립니다.',
        focus: `세계사(고대~현대)의 주요 문명, 전쟁, 혁명, 세계화를 시대별·테마별로 연결해 설명하세요.`
    }),
    economics: makeSubject({
        icon: '💰', name: '경제', category: 'csat_social',
        grades: ['high'], csat: true,
        mode: '미시·거시 경제',
        welcome: '경제 개념, 그래프, 수능 경제 문제를 도와드립니다.',
        focus: `경제(미시: 수요공급, 시장실패 / 거시: GDP, 통화, 무역)를 그래프와 실생활 사례로 설명하세요.`,
        extra: '\n경제 그래프 설명 시 축과 곡선 이동을 명확히 하세요.'
    }),
    politics_law: makeSubject({
        icon: '⚖️', name: '정치와 법', category: 'csat_social',
        grades: ['high'], csat: true,
        mode: '정치·헌법·법률',
        welcome: '정치와 법 개념, 헌법, 수능 문제를 도와드립니다.',
        focus: `정치와 법(민주주의, 헌법, 기본권, 국가기관, 법의 이해)을 헌법 조항과 실제 사례와 연결해 설명하세요.`
    }),
    social_culture: makeSubject({
        icon: '👥', name: '사회·문화', category: 'csat_social',
        grades: ['high'], csat: true,
        mode: '사회학·문화·사회 현상',
        welcome: '사회·문화 개념과 자료 해석을 도와드립니다.',
        focus: `사회·문화(사회화, 계층, 문화, 사회 변동, 일탈)를 사회학 이론과 실생활 사례로 설명하세요.`
    }),

    // ── 기타 교과 ──
    tech_home: makeSubject({
        icon: '🔧', name: '기술·가정', category: 'other',
        grades: ['middle', 'high'],
        mode: '기술·가정·생활 과학',
        welcome: '기술·가정 과목의 이론과 실습을 도와드립니다.',
        focus: `기술·가정(기술, 가정, 정보 기초) 교육과정에 맞게 설명하세요. 실생활 적용과 안전을 강조하세요.`
    }),
    informatics: makeSubject({
        icon: '💻', name: '정보', category: 'other',
        grades: ['high'],
        mode: '컴퓨팅·알고리즘·데이터',
        welcome: '정보 과목(프로그래밍, 알고리즘, 데이터)을 도와드립니다.',
        focus: `정보 교과(컴퓨팅 사고, 알고리즘, 프로그래밍, 데이터 분석, AI 윤리)를 예제 코드와 함께 설명하세요.`,
        quickActions: [
            { label: '알고리즘', prompt: '이 알고리즘을 단계별로 설명해줘: ' },
            { label: '코드 설명', prompt: '이 코드가 어떻게 동작하는지 설명해줘: ' },
            { label: '문제 출제', prompt: '정보 과목 프로그래밍 문제를 하나 출제해줘.' }
        ]
    }),
    music: makeSubject({
        icon: '🎵', name: '음악', category: 'arts',
        grades: ['elementary', 'middle', 'high'],
        mode: '음악 이론·감상·표현',
        welcome: '음악 이론, 악보, 음악 감상을 도와드립니다.',
        focus: `음악(리듬, 화성, 음악사, 감상)을 이론과 감상 활동으로 연결해 설명하세요.`
    }),
    art: makeSubject({
        icon: '🎨', name: '미술', category: 'arts',
        grades: ['elementary', 'middle', 'high'],
        mode: '미술 이론·감상·표현',
        welcome: '미술 이론, 작품 감상, 표현 활동을 도와드립니다.',
        focus: `미술(색채, 형태, 미술사, 작품 감상)을 시각적 예시와 함께 설명하세요.`
    }),
    pe: makeSubject({
        icon: '⚽', name: '체육', category: 'arts',
        grades: ['elementary', 'middle', 'high'],
        mode: '체육 이론·건강·운동',
        welcome: '체육 이론, 건강, 운동 방법을 도와드립니다.',
        focus: `체육(운동 생리, 건강, 규칙, 전략)을 안전 수칙과 함께 설명하세요.`
    })
};

function getGradeLevel(gradeLabel) {
    return GRADE_LEVEL[gradeLabel] || 'middle';
}

function getSubjectsForGrade(gradeLabel) {
    const level = getGradeLevel(gradeLabel);
    return Object.entries(SUBJECTS).filter(([, s]) => s.grades.includes(level));
}

function getSubjectsByCategory(gradeLabel) {
    const subjects = getSubjectsForGrade(gradeLabel);
    const grouped = {};
    subjects.forEach(([key, subject]) => {
        const cat = subject.category;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push([key, subject]);
    });
    const order = ['core', 'csat_science', 'csat_social', 'other', 'arts'];
    return order
        .filter(cat => grouped[cat]?.length)
        .map(cat => ({ category: cat, label: CATEGORY_LABELS[cat], subjects: grouped[cat] }));
}

function ensureValidSubject(gradeLabel, subjectKey) {
    const available = getSubjectsForGrade(gradeLabel).map(([k]) => k);
    if (available.includes(subjectKey)) return subjectKey;
    return available[0] || 'math';
}
