const GEMINI_MODEL = 'gemini-2.0-flash';
const CONTEXT_TURNS = 10;

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
const quickActions = document.getElementById('quickActions');

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
let isLoading = false;

const savedTheme = localStorage.getItem('aiTutorTheme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

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

// --- Subjects ---
function renderSubjects() {
    subjectList.innerHTML = '';
    const grade = getCurrentGrade();
    const groups = getSubjectsByCategory(grade);

    if (groups.length === 0) {
        subjectList.innerHTML = '<p class="subject-hint">프로필을 선택하면 과목이 표시됩니다.</p>';
        return;
    }

    groups.forEach(group => {
        const label = document.createElement('div');
        label.className = 'subject-category-label';
        label.textContent = group.label;
        subjectList.appendChild(label);

        group.subjects.forEach(([key, subject]) => {
            const el = document.createElement('div');
            el.className = `subject-selector ${key === currentSubject ? 'active' : ''}`;
            el.dataset.subject = key;
            const csatBadge = subject.csat ? '<span class="csat-badge">수능</span>' : '';
            el.innerHTML = `<span class="icon">${subject.icon}</span><span class="subject-name">${subject.name}</span>${csatBadge}`;
            el.addEventListener('click', () => selectSubject(key));
            subjectList.appendChild(el);
        });
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

    history.forEach(msg => appendMessage(msg.role, msg.content, false));
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendMessage(role, content, save = true) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    if (role === 'ai') {
        msgDiv.innerHTML = marked.parse(content);
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
    } else {
        msgDiv.textContent = content;
    }

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (save && currentProfileId) {
        const key = getChatKey();
        if (!chatHistory[key]) chatHistory[key] = [];
        chatHistory[key].push({ role, content });
        localStorage.setItem('aiTutorChatHistory', JSON.stringify(chatHistory));
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
async function sendToGemini(userMessage) {
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

    const requestBody = {
        systemInstruction: {
            parts: [{ text: subject.buildPrompt(profile.grade) }]
        },
        contents: [
            ...recentHistory,
            { role: 'user', parts: [{ text: userMessage }] }
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

init();
