// Application State
const AppState = {
    currentUser: null,
    currentArticle: 12,
    currentQuiz: 'comprehension',
    currentQuestion: 0,
    userAnswers: [],
    timer: null,
    timeLeft: 600, // 10 minutes
    quizData: null,
    userProgress: JSON.parse(localStorage.getItem('userProgress')) || {},
    articles: Array.from({length: 20}, (_, i) => ({
        id: i + 1,
        title: i + 1 === 12 ? 'US Population' : `Article ${i + 1}`,
        status: i + 1 === 12 ? 'available' : 'coming-soon',
        score: null
    }))
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeLogin();
    initializeMainMenu();
    initializeArticlePage();
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        AppState.currentUser = JSON.parse(savedUser);
        showPage('main-menu');
        updateUserInfo();
        loadProgress();
        generateArticlesGrid();
    }
});

// Time Display
function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const timeDisplay = document.getElementById('current-time');
    if (timeDisplay) {
        timeDisplay.textContent = `${dateString} | ${timeString}`;
    }
}

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.classList.add('hidden');
    });
    
    // Show requested page
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.remove('hidden');
        page.classList.add('active');
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Login Functions
function initializeLogin() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const surname = document.getElementById('surname').value.trim();
        const group = document.getElementById('group').value;
        
        if (!name || !surname || !group) {
            showNotification('Please fill all fields', 'error');
            return;
        }
        
        // Create user object
        AppState.currentUser = {
            name,
            surname,
            group,
            loginTime: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(AppState.currentUser));
        
        // Navigate to main menu
        showPage('main-menu');
        updateUserInfo();
        loadProgress();
        generateArticlesGrid();
        
        showNotification(`Welcome, ${name}!`, 'success');
    });
}

// Main Menu Functions
function initializeMainMenu() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Test buttons
    document.querySelectorAll('.btn-start-test').forEach(btn => {
        btn.addEventListener('click', function() {
            const level = this.dataset.level;
            startGeneralTest(level);
        });
    });
}

function updateUserInfo() {
    if (!AppState.currentUser) return;
    
    const nameEl = document.getElementById('user-name');
    const groupEl = document.getElementById('user-group');
    
    if (nameEl) {
        nameEl.textContent = `${AppState.currentUser.name} ${AppState.currentUser.surname}`;
    }
    
    if (groupEl) {
        groupEl.textContent = `Group: ${AppState.currentUser.group}`;
    }
}

function loadProgress() {
    // Load from localStorage
    AppState.userProgress = JSON.parse(localStorage.getItem('userProgress')) || {};
    
    // Calculate statistics
    const articles = Object.keys(AppState.userProgress).length;
    const totalArticles = 20;
    const percentage = Math.round((articles / totalArticles) * 100);
    
    // Update UI
    document.getElementById('progress-percent').textContent = `${percentage}%`;
    document.getElementById('completed-count').textContent = `${articles} articles`;
    
    // Calculate average score
    let totalScore = 0;
    let scoreCount = 0;
    
    Object.values(AppState.userProgress).forEach(article => {
        Object.values(article).forEach(quiz => {
            if (quiz.score) {
                totalScore += quiz.score;
                scoreCount++;
            }
        });
    });
    
    const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
    document.getElementById('average-score').textContent = `${avgScore}%`;
    
    // Update chart
    updateProgressChart();
}

function updateProgressChart() {
    const ctx = document.getElementById('progress-chart');
    if (!ctx) return;
    
    // Simple progress chart
    const chart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Quiz Scores',
                data: [65, 75, 80, 90],
                backgroundColor: [
                    'rgba(67, 97, 238, 0.7)',
                    'rgba(67, 97, 238, 0.7)',
                    'rgba(67, 97, 238, 0.7)',
                    'rgba(67, 97, 238, 0.7)'
                ],
                borderColor: [
                    'rgb(67, 97, 238)',
                    'rgb(67, 97, 238)',
                    'rgb(67, 97, 238)',
                    'rgb(67, 97, 238)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function generateArticlesGrid() {
    const grid = document.getElementById('articles-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    AppState.articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'article-card';
        if (article.id === AppState.currentArticle) {
            card.classList.add('active');
        }
        
        card.innerHTML = `
            <div class="number">${article.id}</div>
            <div class="title">${article.title}</div>
            <div class="status">
                ${article.status === 'coming-soon' ? 'Coming Soon' : 'Available'}
            </div>
        `;
        
        if (article.status === 'available') {
            card.addEventListener('click', () => openArticle(article.id));
        }
        
        grid.appendChild(card);
    });
}

function startGeneralTest(level) {
    const questions = {
        amateur: 25,
        master: 35,
        epic: 45,
        titan: 60
    };
    
    showNotification(`Starting ${level} test with ${questions[level]} questions`, 'info');
    
    // In a real app, you would navigate to test page
    // For now, we'll just show a notification
    setTimeout(() => {
        showNotification(`Test completed! Check your progress.`, 'success');
    }, 2000);
}

// Article Page Functions
function initializeArticlePage() {
    // Back button
    const backBtn = document.getElementById('back-to-menu');
    if (backBtn) {
        backBtn.addEventListener('click', () => showPage('main-menu'));
    }
    
    // Quiz tabs
    document.querySelectorAll('.quiz-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.quiz-tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            const quizType = this.dataset.quiz;
            AppState.currentQuiz = quizType;
            loadQuiz(quizType);
        });
    });
    
    // Quiz navigation
    document.getElementById('prev-btn')?.addEventListener('click', previousQuestion);
    document.getElementById('next-btn')?.addEventListener('click', nextQuestion);
    document.getElementById('submit-quiz-btn')?.addEventListener('click', submitQuiz);
    
    // Results actions
    document.getElementById('review-btn')?.addEventListener('click', reviewAnswers);
    document.getElementById('try-again-btn')?.addEventListener('click', resetQuiz);
    document.getElementById('send-to-telegram')?.addEventListener('click', sendToTelegram);
}

function openArticle(articleId) {
    AppState.currentArticle = articleId;
    showPage('article-page');
    loadArticleContent();
    loadVocabulary();
    loadQuiz('comprehension');
}

function loadArticleContent() {
    const container = document.getElementById('reading-text');
    if (!container) return;
    
    const articleContent = `
        <h3>US Population Reaches 300 Million</h3>
        <p>This week the population of the USA reached 300 million for the first time. The 300 millionth American was possibly the child of a Latin American immigrant, perhaps in Los Angeles. In 1967 Life magazine identified the 200 millionth American as Robert Ken Woo, a fourth-generation Chinese-American from Atlanta. That was just a guess but America has reached an important point in its population growth and people are thinking about this in the same way they think about important birthdays or other important dates in their lives.</p>
        
        <p>The US census office believes that one American is born every seven seconds, one dies every 13 seconds, and an immigrant arrives every 31 seconds. Add those figures together and the population increases by one person every 11 seconds. In the last 100 years the US has seen the largest increase in its population in its history. And this will probably continue through the 21st century, although the rate of increase of the population will probably stop rising around the year 2070. The population increased from 200 to 300 million in just 39 years and it will probably reach 400 million in just 37 years time.</p>
        
        <h3>Population Distribution Changes</h3>
        <p>Apart from the increase in population, the make-up of America and its culture and lifestyle are changing dramatically. The first major change is where Americans live. The main population centres are slowly moving from the northeast to the south and west. The fastest-growing states are Nevada, Arizona and Texas. More than half the population of America lives in 10 of the 50 states, most of them along the coasts.</p>
        
        <h3>Environmental Impact</h3>
        <p>Population change is also having an effect on the environment. According to the Centre for Environment and Population, many cities are changing because Americans believe that bigger means better. "When I travel abroad and come back, I'm always shocked by what I see here. Cars are bigger, people travel further distances, they build bigger houses," the centre's director, Victoria Markham, said. It is often said that the US has 5% of the world's population but uses 25% of the world's energy. Not many people know that each American now occupies about 20% more land for housing, schools, shops, roads and so on than he or she did 20 years ago. Almost 1,214 hectares of farmland are lost every day.</p>
        
        <h3>Ethnic Composition Changes</h3>
        <p>The most controversial change is in the ethnic composition of America and the role of immigration. In 1970 5% of Americans were new immigrants. Today the figure is 12.1% and it is rising. The largest single national group of immigrants is Mexican, and the largest ethnic group Hispanic (people from Spanish-speaking countries). By 2050 the census office believes that the number of non-Hispanic whites will fall from 69% in 2000 to about 50%, the number of Hispanics will double to 24%, the number of Asians will also double to 8%, and the number of African-Americans will increase slightly to 14%. Mr Frey thinks the increase the Hispanic community, with their younger average ages and higher birthrates, will help to stop the fall in the number of white Americans.</p>
    `;
    
    container.innerHTML = articleContent;
}

function loadVocabulary() {
    const container = document.getElementById('vocabulary-list');
    if (!container) return;
    
    const vocabulary = [
        { word: "census", meaning: "aholini ro'yxatga olish", example: "The US census is conducted every 10 years." },
        { word: "immigrant", meaning: "immigrant, muhojir", example: "Many immigrants come to America for better opportunities." },
        { word: "composition", meaning: "tarkib, tuzilish", example: "The ethnic composition of America is changing." },
        { word: "controversial", meaning: "bahsli, munozarali", example: "Immigration is a controversial topic." },
        { word: "suburban", meaning: "shahar atrofi", example: "Many Americans live in suburban areas." }
    ];
    
    container.innerHTML = vocabulary.map(vocab => `
        <div class="vocab-item">
            <strong>${vocab.word}</strong>
            <p>${vocab.meaning}</p>
            <small><em>${vocab.example}</em></small>
        </div>
    `).join('');
}

function loadQuiz(quizType) {
    AppState.currentQuiz = quizType;
    AppState.currentQuestion = 0;
    AppState.userAnswers = [];
    AppState.timeLeft = 600;
    
    // Generate quiz questions
    AppState.quizData = generateQuizData(quizType);
    
    // Update UI
    document.getElementById('quiz-title').textContent = getQuizTitle(quizType);
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('results-container').classList.add('hidden');
    
    startTimer();
    displayQuestion();
}

function generateQuizData(quizType) {
    // Sample quiz questions
    const questions = {
        comprehension: [
            {
                question: "What was the US population when this article was written?",
                options: ["200 million", "250 million", "300 million", "350 million"],
                correct: 2,
                explanation: "The article states the population reached 300 million."
            },
            {
                question: "How often does the US population increase by one person?",
                options: ["Every 7 seconds", "Every 11 seconds", "Every 13 seconds", "Every 31 seconds"],
                correct: 1,
                explanation: "Population increases by one person every 11 seconds."
            },
            {
                question: "Which states are the fastest-growing?",
                options: ["California, Florida, Texas", "New York, New Jersey, Pennsylvania", "Nevada, Arizona, Texas", "Ohio, Michigan, Illinois"],
                correct: 2,
                explanation: "Nevada, Arizona and Texas are the fastest-growing."
            },
            {
                question: "What percentage of world's energy does the US use?",
                options: ["5%", "10%", "25%", "50%"],
                correct: 2,
                explanation: "The US uses 25% of the world's energy."
            },
            {
                question: "How many hectares of farmland are lost daily in the US?",
                options: ["500 hectares", "1,214 hectares", "2,000 hectares", "3,500 hectares"],
                correct: 1,
                explanation: "1,214 hectares of farmland are lost every day."
            }
        ],
        'english-uzbek': [
            {
                question: "What is 'census' in Uzbek?",
                options: ["tarkib", "aholini ro'yxatga olish", "immigrant", "bahsli"],
                correct: 1,
                explanation: "'census' means 'aholini ro'yxatga olish'"
            },
            {
                question: "What is 'immigrant' in Uzbek?",
                options: ["muhojir", "shahar atrofi", "tarkib", "bahsli"],
                correct: 0,
                explanation: "'immigrant' means 'muhojir'"
            }
        ]
    };
    
    return questions[quizType] || questions.comprehension;
}

function getQuizTitle(quizType) {
    const titles = {
        'comprehension': 'Comprehension Quiz',
        'english-uzbek': 'English-Uzbek Translation',
        'uzbek-english': 'Uzbek-English Translation',
        'gap-filling': 'Gap Filling Exercise'
    };
    return titles[quizType] || 'Quiz';
}

function displayQuestion() {
    const container = document.getElementById('question-container');
    if (!container || !AppState.quizData) return;
    
    const question = AppState.quizData[AppState.currentQuestion];
    
    container.innerHTML = `
        <div class="question-text">
            ${AppState.currentQuestion + 1}. ${question.question}
        </div>
        <div class="options-list">
            ${question.options.map((option, index) => `
                <div class="option ${AppState.userAnswers[AppState.currentQuestion] === index ? 'selected' : ''}" 
                     data-index="${index}">
                    <input type="radio" name="answer" value="${index}" 
                           ${AppState.userAnswers[AppState.currentQuestion] === index ? 'checked' : ''}>
                    <label>${option}</label>
                </div>
            `).join('')}
        </div>
    `;
    
    // Add event listeners to options
    container.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            selectAnswer(index);
        });
    });
    
    // Update counters
    document.getElementById('question-counter').textContent = 
        `Question ${AppState.currentQuestion + 1}/${AppState.quizData.length}`;
    
    // Update navigation buttons
    document.getElementById('prev-btn').disabled = AppState.currentQuestion === 0;
    
    if (AppState.currentQuestion === AppState.quizData.length - 1) {
        document.getElementById('next-btn').classList.add('hidden');
        document.getElementById('submit-quiz-btn').classList.remove('hidden');
    } else {
        document.getElementById('next-btn').classList.remove('hidden');
        document.getElementById('submit-quiz-btn').classList.add('hidden');
    }
}

function selectAnswer(index) {
    AppState.userAnswers[AppState.currentQuestion] = index;
    displayQuestion();
}

function previousQuestion() {
    if (AppState.currentQuestion > 0) {
        AppState.currentQuestion--;
        displayQuestion();
    }
}

function nextQuestion() {
    if (AppState.currentQuestion < AppState.quizData.length - 1) {
        AppState.currentQuestion++;
        displayQuestion();
    }
}

function startTimer() {
    clearInterval(AppState.timer);
    
    AppState.timer = setInterval(() => {
        AppState.timeLeft--;
        
        const minutes = Math.floor(AppState.timeLeft / 60);
        const seconds = AppState.timeLeft % 60;
        
        const timerEl = document.getElementById('quiz-timer');
        if (timerEl) {
            timerEl.innerHTML = `<i class="fas fa-clock"></i> ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (AppState.timeLeft <= 0) {
            clearInterval(AppState.timer);
            submitQuiz();
        }
    }, 1000);
}

function submitQuiz() {
    clearInterval(AppState.timer);
    
    // Calculate score
    let correct = 0;
    AppState.quizData.forEach((question, index) => {
        if (AppState.userAnswers[index] === question.correct) {
            correct++;
        }
    });
    
    const score = Math.round((correct / AppState.quizData.length) * 100);
    
    // Save progress
    if (!AppState.userProgress[AppState.currentArticle]) {
        AppState.userProgress[AppState.currentArticle] = {};
    }
    
    AppState.userProgress[AppState.currentArticle][AppState.currentQuiz] = {
        score: score,
        date: new Date().toISOString(),
        correct: correct,
        total: AppState.quizData.length
    };
    
    localStorage.setItem('userProgress', JSON.stringify(AppState.userProgress));
    
    // Show results
    showResults(correct);
}

function showResults(correct) {
    const total = AppState.quizData.length;
    const percentage = Math.round((correct / total) * 100);
    
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('results-container').classList.remove('hidden');
    
    document.getElementById('final-score').textContent = correct;
    document.getElementById('correct-count').textContent = correct;
    document.getElementById('wrong-count').textContent = total - correct;
    document.getElementById('score-percent').textContent = `${percentage}%`;
    
    // Update article score
    const articleScore = document.getElementById('article-score');
    if (articleScore) {
        articleScore.textContent = `${percentage}%`;
    }
    
    // Add celebration for good scores
    if (percentage >= 80) {
        showNotification('Excellent score! 🎉', 'success');
    }
}

function reviewAnswers() {
    // Go back to first question
    AppState.currentQuestion = 0;
    document.getElementById('results-container').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    displayQuestion();
}

function resetQuiz() {
    loadQuiz(AppState.currentQuiz);
}

async function sendToTelegram() {
    if (!AppState.currentUser) return;
    
    const quizData = AppState.quizData;
    const userAnswers = AppState.userAnswers;
    
    let correct = 0;
    quizData.forEach((question, index) => {
        if (userAnswers[index] === question.correct) {
            correct++;
        }
    });
    
    const score = Math.round((correct / quizData.length) * 100);
    
    const data = {
        name: AppState.currentUser.name,
        surname: AppState.currentUser.surname,
        group: AppState.currentUser.group,
        article: AppState.currentArticle,
        quizType: AppState.currentQuiz,
        score: score,
        correctAnswers: correct,
        totalQuestions: quizData.length,
        timestamp: new Date().toISOString()
    };
    
    try {
        // Show loading
        showNotification('Sending results to teacher...', 'info');
        
        // Send to API
        const response = await fetch('/api/telegram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Results sent successfully! ✅', 'success');
        } else {
            showNotification('Failed to send results', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Connection error. Results saved locally.', 'warning');
    }
}

function logout() {
    AppState.currentUser = null;
    localStorage.removeItem('currentUser');
    showPage('login-page');
    showNotification('Logged out successfully', 'info');
}
