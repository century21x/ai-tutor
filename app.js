// DOM Elements
const themeToggleBtn = document.getElementById('themeToggleBtn');
const profileList = document.getElementById('profileList');
const addProfileBtn = document.getElementById('addProfileBtn');
const settingsBtn = document.getElementById('settingsBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const currentProfileName = document.getElementById('currentProfileName');

// Modals
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

// Initialize Theme
const savedTheme = localStorage.getItem('aiTutorTheme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// Initialize Marked.js with KaTeX
// In order to properly render markdown and math, we will render markdown first, then render math.
// Or wait, auto-render extension from KaTeX is loaded in index.html which renders math on DOM elements!

// Initialization
function init() {
    renderProfiles();
    if (currentProfileId) {
        selectProfile(currentProfileId);
    } else if (profiles.length > 0) {
        selectProfile(profiles[0].id);
    }
}

// --- Theme Management ---
themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('aiTutorTheme', newTheme);
});

// --- Profile Management ---
function renderProfiles() {
    profileList.innerHTML = '';
    profiles.forEach(profile => {
        const item = document.createElement('div');
        item.className = `profile-item ${profile.id === currentProfileId ? 'active' : ''}`;
        item.innerHTML = `
            <div class="profile-info">
                <span class="profile-name">${profile.name}</span>
                <span class="profile-grade">${profile.grade}</span>
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

function selectProfile(id) {
    currentProfileId = id;
    localStorage.setItem('aiTutorCurrentProfileId', id);
    const profile = profiles.find(p => p.id === id);
    
    if (profile) {
        currentProfileName.textContent = `${profile.name} (${profile.grade})`;
    }
    
    renderProfiles();
    renderChat();
}

function deleteProfile(id) {
    if(confirm('이 프로필과 관련된 모든 대화 기록이 삭제됩니다. 계속하시겠습니까?')) {
        profiles = profiles.filter(p => p.id !== id);
        delete chatHistory[id];
        
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
}

// Profile Modal Events
addProfileBtn.addEventListener('click', () => {
    newProfileName.value = '';
    profileModal.classList.add('active');
});

cancelProfileBtn.addEventListener('click', () => {
    profileModal.classList.remove('active');
});

saveProfileBtn.addEventListener('click', () => {
    const name = newProfileName.value.trim();
    const grade = newProfileGrade.value;
    
    if (name) {
        const newProfile = {
            id: Date.now().toString(),
            name,
            grade
        };
        profiles.push(newProfile);
        localStorage.setItem('aiTutorProfiles', JSON.stringify(profiles));
        
        // Init empty chat history
        chatHistory[newProfile.id] = [];
        localStorage.setItem('aiTutorChatHistory', JSON.stringify(chatHistory));
        
        selectProfile(newProfile.id);
        profileModal.classList.remove('active');
    }
});

// --- Settings Management ---
settingsBtn.addEventListener('click', () => {
    apiKeyInput.value = apiKey;
    settingsModal.classList.add('active');
});

cancelSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

saveSettingsBtn.addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem('aiTutorApiKey', apiKey);
    settingsModal.classList.remove('active');
    if(apiKey) {
        alert('API 키가 저장되었습니다!');
    }
});

// --- Chat Management ---
function renderChat() {
    chatBox.innerHTML = '';
    
    if (!currentProfileId) return;
    
    const history = chatHistory[currentProfileId] || [];
    
    if (history.length === 0) {
        chatBox.innerHTML = `
            <div class="welcome-message">
                <h3>환영합니다! 일등공신 수학 선생님입니다. 📐</h3>
                <p>문제를 풀어달라고 하거나, 비슷한 문제를 출제해달라고 말해보세요!</p>
            </div>
        `;
        return;
    }
    
    history.forEach(msg => {
        appendMessage(msg.role, msg.content, false);
    });
    
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendMessage(role, content, save = true) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    if (role === 'ai') {
        // Use marked.js for markdown parsing
        msgDiv.innerHTML = marked.parse(content);
        // Render Math with KaTeX
        renderMathInElement(msgDiv, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
        });
    } else {
        msgDiv.textContent = content;
    }
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    if (save && currentProfileId) {
        if (!chatHistory[currentProfileId]) chatHistory[currentProfileId] = [];
        chatHistory[currentProfileId].push({ role, content });
        localStorage.setItem('aiTutorChatHistory', JSON.stringify(chatHistory));
    }
}

clearChatBtn.addEventListener('click', () => {
    if (!currentProfileId) return;
    
    if (confirm('현재 프로필의 모든 대화 기록을 삭제하시겠습니까?')) {
        chatHistory[currentProfileId] = [];
        localStorage.setItem('aiTutorChatHistory', JSON.stringify(chatHistory));
        renderChat();
    }
});

// --- API Interaction (Gemini) ---
async function sendToGemini(userMessage) {
    if (!apiKey) {
        appendMessage('ai', '⚠️ Google Gemini API 키가 설정되지 않았습니다. 좌측 하단의 "API 설정"에서 키를 입력해주세요.');
        return;
    }
    
    const profile = profiles.find(p => p.id === currentProfileId);
    
    // Typing indicator
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
    
    // History context
    const history = chatHistory[currentProfileId] || [];
    const recentHistory = history.slice(-5).map(m => {
        return {
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }
    });

    // System prompt behavior (implemented as the first message or context)
    const systemPrompt = `당신은 ${profile.grade} 대상의 일등공신 수학 선생님입니다. 
학생이 질문을 하면 곧바로 정답을 알려주지 말고, 친절하고 단계적인 힌트를 주어 스스로 풀 수 있도록 유도하세요. 
수학 수식은 반드시 LaTeX 형식($ 또는 $$ 사용)으로 작성하세요. 
학생을 칭찬하고 격려하는 어조를 사용하세요.`;
    
    const requestBody = {
        contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "네, 저는 훌륭한 수학 선생님입니다. 준비되었습니다!" }] },
            ...recentHistory,
            { role: "user", parts: [{ text: userMessage }] }
        ],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        }
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        chatBox.removeChild(typingDiv); // remove typing indicator
        
        if (data.error) {
            appendMessage('ai', `⚠️ API 오류: ${data.error.message}`);
        } else if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            appendMessage('ai', aiText);
        } else {
            appendMessage('ai', '응답을 받지 못했습니다. 다시 시도해주세요.');
        }
        
    } catch (error) {
        chatBox.removeChild(typingDiv);
        appendMessage('ai', `⚠️ 네트워크 오류가 발생했습니다: ${error.message}`);
    }
}

// User Input Events
sendBtn.addEventListener('click', () => {
    if (!currentProfileId) {
        alert('먼저 프로필을 생성하거나 선택해주세요!');
        return;
    }
    
    const text = userInput.value.trim();
    if (text) {
        appendMessage('user', text);
        userInput.value = '';
        sendToGemini(text);
    }
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value === '') {
        this.style.height = '60px'; // reset
    }
});

// Start app
init();
