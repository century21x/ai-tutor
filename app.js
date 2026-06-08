const GEMINI_MODEL = 'gemini-2.5-flash';
const CONTEXT_TURNS = 10;
const HANDWRITING_PROMPT = `학생이 손으로 쓴 질문 또는 문제입니다. 내용을 읽고 도와주세요.
글씨가 불분명하면 먼저 "이렇게 쓴 게 맞나요?"라고 추측한 내용을 짧게 확인한 뒤 진행하세요.
숫자와 수식은 특히 주의해서 읽으세요.`;

// DOM Elements
const themeToggleBtn = document.getElementById('themeToggleBtn');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebar = document.getElementById('sidebar');
const profileList = document.getElementById('profileList');
const addProfileBtn = document.getElementById('addProfileBtn');
const settingsBtn = document.getElementById('settingsBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const currentProfileName = document.getElementById('currentProfileName');
const currentSubjectMode = document.getElementById('currentSubjectMode');
const subjectList = document.getElementById('subjectList');
const subjectSearch = document.getElementById('subjectSearch');
const quickActions = document.getElementById('quickActions');
const quickChips = document.getElementById('quickChips');
const fontSizeBtn = document.getElementById('fontSizeBtn');
const voiceBtn = document.getElementById('voiceBtn');
const handwritingToggleBtn = document.getElementById('handwritingToggleBtn');
const handwritingPanel = document.getElementById('handwritingPanel');
const hwCanvas = document.getElementById('handwritingCanvas');

const profileModal = document.getElementById('profileModal');
const newProfileName = document.getElementById('newProfileName');
const newProfileGrade = document.getElementById('newProfileGrade');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');

const settingsModal = document.getElementById('settingsModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

// State
let profiles = JSON.parse(localStorage.getItem('aiTutorProfiles')) || [];
let currentProfileId = localStorage.getItem('aiTutorCurrentProfileId') || null;
let chatHistory = JSON.parse(localStorage.getItem('aiTutorChatHistory')) || {};
let apiKey = localStorage.getItem('aiTutorApiKey') || '';
let currentSubject = localStorage.getItem('aiTutorCurrentSubject') || 'math';
let currentDifficulty = localStorage.getItem('aiTutorDifficulty') || '보통';
let subjectSearchQuery = '';
let collapsedCategories = new Set(
    JSON.parse(localStorage.getItem('aiTutorCollapsedCategories') || '[]')
);
let isLoading = false;

if (!DIFFICULTY_LEVELS.includes(currentDifficulty)) {
    currentDifficulty = '보통';
}

const savedTheme = localStorage.getItem('aiTutorTheme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

let fontSize = localStorage.getItem('aiTutorFontSize') || 'normal';
document.documentElement.setAttribute('data-fontsize', fontSize);

function getCurrentProfile() {
    return profiles.find(p => p.id === currentProfileId) || null;
}

function getCurrentGrade() {
    return getCurrentProfile()?.grade || '중학생';
}

function init() {
    const grade = getCurrentGrade();
    currentSubject = ensureValidSubject(grade, currentSubject);
    localStorage.setItem('aiTutorCurrentSubject', currentSubject);

    renderSubjects();
    renderProfiles();
    renderQuickActions();
    renderDifficultyUI();
    updateSubjectUI();

    if (currentProfileId && getCurrentProfile()) {
        selectProfile(currentProfileId, { skipRender: true });
    } else if (profiles.length > 0) {
        selectProfile(profiles[0].id, { skipRender: true });
    }
}

// --- Theme ---
themeToggleBtn.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('aiTutorTheme', newTheme);
});

sidebarToggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !sidebarToggleBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// --- Difficulty ---
function updateDifficultySlider() {
    const segment = document.getElementById('difficultySegment');
    const slider = document.getElementById('difficultySlider');
    const active = segment?.querySelector('.difficulty-btn.active');
    if (!slider || !active || !segment) return;

    const segmentRect = segment.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    slider.style.width = `${activeRect.width}px`;
    slider.style.transform = `translateX(${activeRect.left - segmentRect.left}px)`;
}

function renderDifficultyUI() {
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        const level = btn.dataset.difficulty;
        btn.classList.toggle('active', level === currentDifficulty);
        btn.onclick = () => selectDifficulty(level);
    });
    requestAnimationFrame(updateDifficultySlider);
}

function selectDifficulty(level) {
    if (!DIFFICULTY_LEVELS.includes(level)) return;
    currentDifficulty = level;
    localStorage.setItem('aiTutorDifficulty', level);
    renderDifficultyUI();
}

window.addEventListener('resize', updateDifficultySlider);

// --- Subjects ---
function toggleAccordionCategory(category) {
    if (collapsedCategories.has(category)) {
        collapsedCategories.delete(category);
    } else {
        collapsedCategories.add(category);
    }
    localStorage.setItem(
        'aiTutorCollapsedCategories',
        JSON.stringify([...collapsedCategories])
    );
    renderSubjects();
}

function renderSubjects() {
    subjectList.innerHTML = '';
    const grade = getCurrentGrade();
    const groups = getSubjectsByCategory(grade);
    const query = subjectSearchQuery.trim().toLowerCase();

    if (groups.length === 0) {
        subjectList.innerHTML = '<p class="subject-hint">프로필을 선택하면 과목이 표시됩니다.</p>';
        return;
    }

    let hasResults = false;

    groups.forEach(group => {
        const filtered = group.subjects.filter(([, subject]) => {
            if (!query) return true;
            return (
                subject.name.toLowerCase().includes(query) ||
                group.label.toLowerCase().includes(query)
            );
        });
        if (filtered.length === 0) return;

        hasResults = true;
        const isOpen = query ? true : !collapsedCategories.has(group.category);

        const item = document.createElement('div');
        item.className = `accordion-item${isOpen ? ' open' : ''}`;

        const header = document.createElement('button');
        header.type = 'button';
        header.className = 'accordion-header';
        header.setAttribute('aria-expanded', String(isOpen));
        header.innerHTML = `<span>${group.label}</span><span class="accordion-chevron">${isOpen ? '▼' : '▶'}</span>`;
        header.addEventListener('click', () => toggleAccordionCategory(group.category));

        const panel = document.createElement('div');
        panel.className = `accordion-panel${isOpen ? '' : ' collapsed'}`;

        const inner = document.createElement('div');
        inner.className = 'accordion-panel-inner';

        filtered.forEach(([key, subject]) => {
            const el = document.createElement('div');
            el.className = `subject-selector ${key === currentSubject ? 'active' : ''}`;
            el.dataset.subject = key;
            const csatBadge = subject.csat ? '<span class="csat-badge">수능</span>' : '';
            el.innerHTML = `<span class="icon">${subject.icon}</span><span class="subject-name">${escapeHtml(subject.name)}</span>${csatBadge}`;
            el.addEventListener('click', () => selectSubject(key));
            inner.appendChild(el);
        });

        panel.appendChild(inner);
        item.appendChild(header);
        item.appendChild(panel);
        subjectList.appendChild(item);
    });

    if (!hasResults) {
        subjectList.innerHTML = '<p class="subject-hint">검색 결과가 없습니다.</p>';
    }
}

if (subjectSearch) {
    subjectSearch.addEventListener('input', (e) => {
        subjectSearchQuery = e.target.value;
        renderSubjects();
    });
}

function selectSubject(key) {
    currentSubject = key;
    localStorage.setItem('aiTutorCurrentSubject', key);
    renderSubjects();
    updateSubjectUI();
    renderQuickActions();
    renderChat();
}

function updateSubjectUI() {
    const subject = SUBJECTS[currentSubject];
    if (!subject) return;
    currentSubjectMode.textContent = subject.mode;
    document.title = `일등공신 선생님 - ${subject.name}`;
}

function renderQuickActions() {
    const subject = SUBJECTS[currentSubject];
    if (!subject) return;
    quickActions.innerHTML = '';

    subject.quickActions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'quick-action-btn';
        btn.textContent = action.label;
        btn.addEventListener('click', () => {
            if (!currentProfileId) {
                alert('먼저 프로필을 생성하거나 선택해주세요!');
                return;
            }
            if (action.prompt.endsWith(': ') || action.prompt.endsWith(' ')) {
                userInput.value = action.prompt;
                userInput.focus();
            } else {
                sendMessage(action.prompt);
            }
        });
        quickActions.appendChild(btn);
    });
}

// --- Profiles ---
function renderProfiles() {
    profileList.innerHTML = '';
    profiles.forEach(profile => {
        const item = document.createElement('div');
        item.className = `profile-item ${profile.id === currentProfileId ? 'active' : ''}`;
        item.innerHTML = `
            <div class="profile-info">
                <span class="profile-name">${escapeHtml(profile.name)}</span>
                <span class="profile-grade">${escapeHtml(profile.grade)}</span>
            </div>
            <button class="delete-profile-btn" data-id="${profile.id}">×</button>
        `;

        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-profile-btn')) {
                selectProfile(profile.id);
            }
        });

        item.querySelector('.delete-profile-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteProfile(profile.id);
        });

        profileList.appendChild(item);
    });
}

function selectProfile(id, options = {}) {
    currentProfileId = id;
    localStorage.setItem('aiTutorCurrentProfileId', id);
    const profile = getCurrentProfile();

    if (profile) {
        currentProfileName.textContent = `${profile.name} (${profile.grade})`;
        currentSubject = ensureValidSubject(profile.grade, currentSubject);
        localStorage.setItem('aiTutorCurrentSubject', currentSubject);
    }

    renderProfiles();
    renderSubjects();
    renderQuickActions();
    updateSubjectUI();
    if (!options.skipRender) renderChat();

    if (window.innerWidth <= 768) sidebar.classList.remove('open');
}

function deleteProfileChatHistory(profileId) {
    Object.keys(chatHistory).forEach(key => {
        if (key.startsWith(`${profileId}_`)) delete chatHistory[key];
    });
}

function deleteProfile(id) {
    if (!confirm('이 프로필과 관련된 모든 대화 기록이 삭제됩니다. 계속하시겠습니까?')) return;

    profiles = profiles.filter(p => p.id !== id);
    deleteProfileChatHistory(id);

    localStorage.setItem('aiTutorProfiles', JSON.stringify(profiles));
    localStorage.setItem('aiTutorChatHistory', JSON.stringify(chatHistory));

    if (currentProfileId === id) {
        currentProfileId = null;
        localStorage.removeItem('aiTutorCurrentProfileId');
        currentProfileName.textContent = '프로필을 선택해주세요';
        chatBox.innerHTML = '';
    }

    init();
}

addProfileBtn.addEventListener('click', () => {
    newProfileName.value = '';
    profileModal.classList.add('active');
});

cancelProfileBtn.addEventListener('click', () => profileModal.classList.remove('active'));

saveProfileBtn.addEventListener('click', () => {
    const name = newProfileName.value.trim();
    const grade = newProfileGrade.value;
    if (!name) return;

    const newProfile = { id: Date.now().toString(), name, grade };
    profiles.push(newProfile);
    localStorage.setItem('aiTutorProfiles', JSON.stringify(profiles));

    selectProfile(newProfile.id);
    profileModal.classList.remove('active');
});

// --- Settings ---
settingsBtn.addEventListener('click', () => {
    apiKeyInput.value = apiKey;
    settingsModal.classList.add('active');
});

cancelSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('active'));

saveSettingsBtn.addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem('aiTutorApiKey', apiKey);
    settingsModal.classList.remove('active');
    if (apiKey) alert('API 키가 저장되었습니다!');
});

// --- Chat ---
function getChatKey() {
    return `${currentProfileId}_${currentSubject}`;
}

function renderChat() {
    chatBox.innerHTML = '';

    if (!currentProfileId) {
        chatBox.innerHTML = `
            <div class="welcome-message">
                <h3>환영합니다! 일등공신 AI 튜터입니다. 🎓</h3>
                <p>좌측에서 프로필을 추가한 뒤 학습을 시작하세요.</p>
            </div>
        `;
        return;
    }

    const history = chatHistory[getChatKey()] || [];
    const subject = SUBJECTS[currentSubject];

    if (!subject || history.length === 0) {
        const count = getSubjectsForGrade(getCurrentGrade()).length;
        chatBox.innerHTML = `
            <div class="welcome-message">
                <h3>${subject?.icon || '🎓'} ${subject?.name || ''} 선생님입니다!</h3>
                <p>${subject?.welcome || ''}</p>
                <p class="welcome-sub">${getCurrentGrade()} · ${count}개 과목 지원</p>
            </div>
        `;
        return;
    }

    history.forEach(msg => appendMessage(msg.role, msg.content, false, msg.image));
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendMessage(role, content, save = true, image = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    if (role === 'ai') {
        const parsed = marked.parse(content);
        msgDiv.innerHTML = typeof DOMPurify !== 'undefined'
            ? DOMPurify.sanitize(parsed)
            : parsed;
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(msgDiv, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        }
        msgDiv.appendChild(createReadAloudBtn(content));
    } else if (image) {
        const img = document.createElement('img');
        img.src = image;
        img.className = 'handwriting-img';
        img.alt = '손글씨 질문';
        msgDiv.appendChild(img);
    } else {
        msgDiv.textContent = content;
    }

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (save && currentProfileId) {
        const key = getChatKey();
        if (!chatHistory[key]) chatHistory[key] = [];
        const entry = { role, content };
        if (image) entry.image = image;
        chatHistory[key].push(entry);
        try {
            localStorage.setItem('aiTutorChatHistory', JSON.stringify(chatHistory));
        } catch (err) {
            if (entry.image) {
                delete entry.image;
                localStorage.setItem('aiTutorChatHistory', JSON.stringify(chatHistory));
            }
        }
    }
}

clearChatBtn.addEventListener('click', () => {
    if (!currentProfileId) return;
    if (!confirm('현재 과목의 대화 기록을 삭제하시겠습니까?')) return;

    chatHistory[getChatKey()] = [];
    localStorage.setItem('aiTutorChatHistory', JSON.stringify(chatHistory));
    renderChat();
});

function setLoading(loading) {
    isLoading = loading;
    sendBtn.disabled = loading;
    userInput.disabled = loading;
    sendBtn.classList.toggle('loading', loading);
}

// --- Gemini API ---
async function sendToGemini(userMessage, imageBase64 = null) {
    if (!apiKey) {
        appendMessage('ai', '⚠️ Google Gemini API 키가 설정되지 않았습니다. 좌측 하단의 "API 설정"에서 키를 입력해주세요.');
        return;
    }

    const profile = getCurrentProfile();
    const subject = SUBJECTS[currentSubject];
    if (!profile || !subject) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    const history = chatHistory[getChatKey()] || [];
    const recentHistory = history.slice(-CONTEXT_TURNS).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    const userParts = imageBase64
        ? [{ text: HANDWRITING_PROMPT }, { inlineData: { mimeType: 'image/png', data: imageBase64 } }]
        : [{ text: userMessage }];

    const requestBody = {
        systemInstruction: {
            parts: [{ text: subject.buildPrompt(profile.grade, currentDifficulty) }]
        },
        contents: [
            ...recentHistory,
            { role: 'user', parts: userParts }
        ],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
        }
    };

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );

        const data = await response.json();
        chatBox.removeChild(typingDiv);

        if (data.error) {
            appendMessage('ai', `⚠️ API 오류: ${data.error.message}`);
        } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            appendMessage('ai', data.candidates[0].content.parts[0].text);
        } else {
            appendMessage('ai', '응답을 받지 못했습니다. 다시 시도해주세요.');
        }
    } catch (error) {
        if (typingDiv.parentNode) chatBox.removeChild(typingDiv);
        appendMessage('ai', `⚠️ 네트워크 오류가 발생했습니다: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

function sendMessage(text) {
    if (!currentProfileId) {
        alert('먼저 프로필을 생성하거나 선택해주세요!');
        return;
    }
    if (!text || isLoading) return;

    const welcome = chatBox.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    setLoading(true);
    appendMessage('user', text);
    userInput.value = '';
    userInput.style.height = '60px';
    sendToGemini(text);
}

sendBtn.addEventListener('click', () => sendMessage(userInput.value.trim()));

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
    if (this.value === '') this.style.height = '60px';
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ── 접근성: 큰 글씨 ──
if (fontSizeBtn) {
    fontSizeBtn.classList.toggle('active', fontSize === 'large');
    fontSizeBtn.addEventListener('click', () => {
        fontSize = fontSize === 'large' ? 'normal' : 'large';
        document.documentElement.setAttribute('data-fontsize', fontSize);
        localStorage.setItem('aiTutorFontSize', fontSize);
        fontSizeBtn.classList.toggle('active', fontSize === 'large');
    });
}

// ── 빠른 입력 칩 ──
const QUICK_CHIPS = ['쉽게 설명해줘', '예시 들어줘', '다시 설명해줘', '힌트 줘'];
function renderQuickChips() {
    if (!quickChips) return;
    quickChips.innerHTML = '';
    QUICK_CHIPS.forEach(text => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'quick-chip';
        chip.textContent = text;
        chip.addEventListener('click', () => sendMessage(text));
        quickChips.appendChild(chip);
    });
}
renderQuickChips();

// ── 읽어주기 (TTS) ──
function createReadAloudBtn(content) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'read-aloud-btn';
    btn.title = '읽어주기';
    btn.textContent = '🔊';
    btn.addEventListener('click', () => toggleReadAloud(content, btn));
    return btn;
}
function toggleReadAloud(content, btn) {
    if (!('speechSynthesis' in window)) {
        alert('이 브라우저는 읽어주기를 지원하지 않습니다.');
        return;
    }
    const wasSpeaking = btn.classList.contains('speaking');
    speechSynthesis.cancel();
    document.querySelectorAll('.read-aloud-btn.speaking').forEach(b => b.classList.remove('speaking'));
    if (wasSpeaking) return;

    const plain = content.replace(/[#*`_>~]/g, '').replace(/\$+/g, ' ');
    const utter = new SpeechSynthesisUtterance(plain);
    utter.lang = 'ko-KR';
    utter.onend = () => btn.classList.remove('speaking');
    utter.onerror = () => btn.classList.remove('speaking');
    btn.classList.add('speaking');
    speechSynthesis.speak(utter);
}

// ── 음성 입력 (Web Speech API) ──
(function setupVoice() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec || !voiceBtn) {
        if (voiceBtn) voiceBtn.style.display = 'none';
        return;
    }
    const recognition = new SpeechRec();
    recognition.lang = 'ko-KR';
    recognition.interimResults = true;
    recognition.continuous = false;
    let recognizing = false;
    let baseText = '';
    recognition.onstart = () => { recognizing = true; voiceBtn.classList.add('listening'); };
    recognition.onend = () => { recognizing = false; voiceBtn.classList.remove('listening'); };
    recognition.onerror = (e) => {
        recognizing = false;
        voiceBtn.classList.remove('listening');
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            alert('마이크 권한이 필요합니다. 브라우저 설정에서 허용해주세요.');
        }
    };
    recognition.onresult = (e) => {
        let txt = '';
        for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
        userInput.value = (baseText + txt).trim();
        userInput.dispatchEvent(new Event('input'));
    };
    voiceBtn.addEventListener('click', () => {
        if (recognizing) { recognition.stop(); return; }
        baseText = userInput.value ? userInput.value.trim() + ' ' : '';
        try { recognition.start(); } catch (_) {}
    });
})();

// ── 손글씨 입력 (canvas → Gemini 멀티모달) ──
const hwCtx = hwCanvas ? hwCanvas.getContext('2d') : null;
let hwStrokes = [];
let hwCurrentStroke = null;
let hwDrawing = false;

function hwSetup() {
    if (!hwCanvas || !hwCtx) return;
    const rect = hwCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    hwCanvas.width = Math.round(rect.width * dpr);
    hwCanvas.height = Math.round(rect.height * dpr);
    hwCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hwRedraw();
}
function hwRedraw() {
    if (!hwCtx) return;
    const rect = hwCanvas.getBoundingClientRect();
    hwCtx.clearRect(0, 0, rect.width, rect.height);
    hwCtx.fillStyle = '#ffffff';
    hwCtx.fillRect(0, 0, rect.width, rect.height);
    hwCtx.strokeStyle = '#1f2937';
    hwCtx.lineCap = 'round';
    hwCtx.lineJoin = 'round';
    hwStrokes.forEach(stroke => {
        for (let i = 1; i < stroke.length; i++) {
            hwCtx.beginPath();
            hwCtx.lineWidth = stroke[i].w;
            hwCtx.moveTo(stroke[i - 1].x, stroke[i - 1].y);
            hwCtx.lineTo(stroke[i].x, stroke[i].y);
            hwCtx.stroke();
        }
    });
}
function hwLineWidth(e) {
    if (e.pointerType === 'pen' && e.pressure > 0) return 1.5 + e.pressure * 4.5;
    return 3;
}
function hwPos(e) {
    const rect = hwCanvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}
if (hwCanvas && hwCtx) {
    hwCanvas.addEventListener('pointerdown', (e) => {
        hwDrawing = true;
        try { hwCanvas.setPointerCapture(e.pointerId); } catch (_) {}
        const p = hwPos(e);
        hwCurrentStroke = [{ x: p.x, y: p.y, w: hwLineWidth(e) }];
        hwStrokes.push(hwCurrentStroke);
        e.preventDefault();
    });
    hwCanvas.addEventListener('pointermove', (e) => {
        if (!hwDrawing || !hwCurrentStroke) return;
        const p = hwPos(e);
        const w = hwLineWidth(e);
        const last = hwCurrentStroke[hwCurrentStroke.length - 1];
        hwCurrentStroke.push({ x: p.x, y: p.y, w });
        hwCtx.strokeStyle = '#1f2937';
        hwCtx.lineCap = 'round';
        hwCtx.lineJoin = 'round';
        hwCtx.beginPath();
        hwCtx.lineWidth = w;
        hwCtx.moveTo(last.x, last.y);
        hwCtx.lineTo(p.x, p.y);
        hwCtx.stroke();
        e.preventDefault();
    });
    const hwEnd = () => { hwDrawing = false; hwCurrentStroke = null; };
    hwCanvas.addEventListener('pointerup', hwEnd);
    hwCanvas.addEventListener('pointercancel', hwEnd);
    hwCanvas.addEventListener('pointerleave', hwEnd);
}
function hwOpen() {
    if (!handwritingPanel) return;
    handwritingPanel.classList.remove('hidden');
    requestAnimationFrame(hwSetup);
}
function hwClose() { if (handwritingPanel) handwritingPanel.classList.add('hidden'); }
function hwClear() { hwStrokes = []; hwRedraw(); }
function hwUndo() { hwStrokes.pop(); hwRedraw(); }
function hwExport() {
    const maxW = 800;
    const scale = Math.min(1, maxW / hwCanvas.width);
    const off = document.createElement('canvas');
    off.width = Math.round(hwCanvas.width * scale);
    off.height = Math.round(hwCanvas.height * scale);
    const octx = off.getContext('2d');
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, off.width, off.height);
    octx.drawImage(hwCanvas, 0, 0, off.width, off.height);
    return off.toDataURL('image/png');
}
function sendHandwriting(dataUrl) {
    const welcome = chatBox.querySelector('.welcome-message');
    if (welcome) welcome.remove();
    setLoading(true);
    appendMessage('user', '✏️ 손글씨 질문', true, dataUrl);
    sendToGemini('✏️ 손글씨 질문', dataUrl.split(',')[1]);
}
function hwSubmit() {
    if (hwStrokes.length === 0) { alert('먼저 손으로 써주세요 ✏️'); return; }
    if (!currentProfileId) { alert('먼저 프로필을 생성하거나 선택해주세요!'); return; }
    if (isLoading) return;
    const dataUrl = hwExport();
    hwClear();
    hwClose();
    sendHandwriting(dataUrl);
}
if (handwritingToggleBtn) {
    handwritingToggleBtn.addEventListener('click', () => {
        if (!currentProfileId) { alert('먼저 프로필을 생성하거나 선택해주세요!'); return; }
        if (handwritingPanel.classList.contains('hidden')) hwOpen(); else hwClose();
    });
}
document.getElementById('hwUndoBtn')?.addEventListener('click', hwUndo);
document.getElementById('hwClearBtn')?.addEventListener('click', hwClear);
document.getElementById('hwCloseBtn')?.addEventListener('click', hwClose);
document.getElementById('hwSendBtn')?.addEventListener('click', hwSubmit);

init();
