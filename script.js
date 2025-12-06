// Main Application State
const state = {
    currentUser: null,
    currentArticle: 12,
    currentQuiz: 'comprehension',
    quizQuestions: [],
    currentQuestion: 0,
    userAnswers: [],
    timer: null,
    timeLeft: 900, // 15 minutes in seconds
    userProgress: JSON.parse(localStorage.getItem('userProgress')) || {},
    vocabulary: [],
    articles: Array.from({length: 20}, (_, i) => i + 1)
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeLogin();
    initializeMainMenu();
    initializeArticlePage();
    loadVocabulary();
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
});

// Login Functions
function initializeLogin() {
    const loginForm = document.getElementById('login-form');
    const currentTime = document.getElementById('current-time');
    
    // Set current time
    updateTimeDisplay();
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const surname = document.getElementById('surname').value;
        const group = document.getElementById('group').value;
        
        if (!name || !surname || !group) {
            showNotification('Please fill all fields', 'error');
            return;
        }
        
        state.currentUser = {
            name,
            surname,
            group,
            loginTime: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        
        // Switch to main menu
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('main-menu').classList.add('active');
        
        updateUserInfo();
        loadProgress();
        generateArticlesGrid();
        
        showNotification(`Welcome, ${name}!`, 'success');
    });
}

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

// Main Menu Functions
function initializeMainMenu() {
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Generate articles grid
    generateArticlesGrid();
    
    // Initialize general test buttons
    document.querySelectorAll('.btn-start-test').forEach(button => {
        button.addEventListener('click', function() {
            const level = this.closest('.level-card').dataset.level;
            startGeneralTest(level);
        });
    });
}

function generateArticlesGrid() {
    const grid = document.getElementById('articles-grid');
    grid.innerHTML = '';
    
    state.articles.forEach(articleNum => {
        const articleCard = document.createElement('div');
        articleCard.className = 'article-card';
        if (articleNum === state.currentArticle) {
            articleCard.classList.add('active');
        }
        
        articleCard.innerHTML = `
            <div class="article-number">${articleNum}</div>
            <div class="article-title">
                ${articleNum === 12 ? 'US Population' : 'Coming Soon'}
            </div>
            <div class="article-status">
                ${getArticleStatus(articleNum)}
            </div>
        `;
        
        if (articleNum === 12) {
            articleCard.addEventListener('click', () => openArticle(articleNum));
        }
        
        grid.appendChild(articleCard);
    });
}

function getArticleStatus(articleNum) {
    const progress = state.userProgress[articleNum];
    if (!progress) return '<span class="text-warning">Not Started</span>';
    
    const bestScore = Math.max(...Object.values(progress).map(q => q.score || 0));
    return `<span class="text-success">Best: ${Math.round(bestScore)}%</span>`;
}

function updateUserInfo() {
    if (!state.currentUser) return;
    
    document.getElementById('user-name').textContent = 
        `${state.currentUser.name} ${state.currentUser.surname}`;
    document.getElementById('user-group').textContent = 
        `Group: ${state.currentUser.group}`;
}

function loadProgress() {
    const progress = state.userProgress;
    const totalArticles = 20;
    const completedArticles = Object.keys(progress).length;
    const averageScore = calculateAverageScore();
    
    document.getElementById('completed-articles').textContent = 
        `${completedArticles}/${totalArticles}`;
    document.getElementById('average-score').textContent = 
        `${averageScore}%`;
    document.getElementById('overall-progress').textContent = 
        `${Math.round((completedArticles / totalArticles) * 100)}%`;
    
    // Update chart
    updateProgressChart();
}

function calculateAverageScore() {
    if (!state.userProgress || Object.keys(state.userProgress).length === 0) return 0;
    
    let totalScore = 0;
    let count = 0;
    
    Object.values(state.userProgress).forEach(articleProgress => {
        Object.values(articleProgress).forEach(quiz => {
            if (quiz.score) {
                totalScore += quiz.score;
                count++;
            }
        });
    });
    
    return count > 0 ? Math.round(totalScore / count) : 0;
}

function updateProgressChart() {
    const ctx = document.getElementById('progress-chart').getContext('2d');
    
    const labels = ['Comprehension', 'Vocabulary', 'Grammar', 'Listening', 'Speaking'];
    const data = [85, 78, 92, 65, 70]; // Sample data
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Your Skills',
                data: data,
                backgroundColor: 'rgba(67, 97, 238, 0.2)',
                borderColor: 'rgba(67, 97, 238, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(67, 97, 238, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Article Page Functions
function initializeArticlePage() {
    document.getElementById('back-to-menu').addEventListener('click', backToMenu);
    
    // Quiz tab switching
    document.querySelectorAll('.quiz-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.quiz-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const quizType = this.dataset.quiz;
            state.currentQuiz = quizType;
            loadQuiz(quizType);
        });
    });
    
    // Quiz navigation
    document.getElementById('prev-question').addEventListener('click', previousQuestion);
    document.getElementById('next-question').addEventListener('click', nextQuestion);
    document.getElementById('submit-quiz').addEventListener('click', submitQuiz);
    
    // Results actions
    document.getElementById('try-again').addEventListener('click', resetQuiz);
    document.getElementById('next-quiz').addEventListener('click', nextQuiz);
}

function openArticle(articleNum) {
    document.getElementById('main-menu').classList.remove('active');
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('article-page').classList.remove('hidden');
    document.getElementById('article-page').classList.add('active');
    
    loadArticleContent();
    loadVocabularyCards();
    loadQuiz('comprehension');
}

function backToMenu() {
    document.getElementById('article-page').classList.remove('active');
    document.getElementById('article-page').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('main-menu').classList.add('active');
}

function loadArticleContent() {
    const passage = document.getElementById('reading-passage');
    
    // This would normally come from an API or database
    const articleContent = `
        <h2>US Population Reaches 300 Million</h2>
        <p>This week the population of the USA reached 300 million for the first time. The 300 millionth American was possibly the child of a Latin American immigrant, perhaps in Los Angeles. In 1967 Life magazine identified the 200 millionth American as Robert Ken Woo, a fourth-generation Chinese-American from Atlanta. That was just a guess but America has reached an important point in its population growth and people are thinking about this in the same way they think about important birthdays or other important dates in their lives.</p>
        
        <p>The US census office believes that one American is born every seven seconds, one dies every 13 seconds, and an immigrant arrives every 31 seconds. Add those figures together and the population increases by one person every 11 seconds. In the last 100 years the US has seen the largest increase in its population in its history. And this will probably continue through the 21st century, although the rate of increase of the population will probably stop rising around the year 2070. The population increased from 200 to 300 million in just 39 years and it will probably reach 400 million in just 37 years time.</p>
        
        <h3>Population Distribution Changes</h3>
        <p>Apart from the increase in population, the make-up of America and its culture and lifestyle are changing dramatically. The first major change is where Americans live. The main population centres are slowly moving from the northeast to the south and west. The fastest-growing states are Nevada, Arizona and Texas. More than half the population of America lives in 10 of the 50 states, most of them along the coasts.</p>
        
        <p>William Frey, a population expert at the Brookings Institution in Washington, said people are now moving towards a new sunbelt outside Florida, Texas and California. "As the coastal areas become crowded, people have started to move further inland to places like Arizona, Nevada, Georgia and Tennessee." At the same time the Great Plains, the cultural symbol of cowboy America, is becoming a myth. People are leaving the mid-western states and moving to the big cities. In the past 100 years the number of Americans living in urban and suburban areas has increased from 40% to 80%. The idea of the 'frontier' and living under an open sky still exists in movies, but fewer and fewer people live in such places.</p>
        
        <h3>Environmental Impact</h3>
        <p>Population change is also having an effect on the environment. According to the Centre for Environment and Population, many cities are changing because Americans believe that bigger means better. "When I travel abroad and come back, I'm always shocked by what I see here. Cars are bigger, people travel further distances, they build bigger houses," the centre's director, Victoria Markham, said. It is often said that the US has 5% of the world's population but uses 25% of the world's energy. Not many people know that each American now occupies about 20% more land for housing, schools, shops, roads and so on than he or she did 20 years ago. Almost 1,214 hectares of farmland are lost every day.</p>
        
        <h3>Ethnic Composition Changes</h3>
        <p>The most controversial change is in the ethnic composition of America and the role of immigration. In 1970 5% of Americans were new immigrants. Today the figure is 12.1% and it is rising. The largest single national group of immigrants is Mexican, and the largest ethnic group Hispanic (people from Spanish-speaking countries). By 2050 the census office believes that the number of non-Hispanic whites will fall from 69% in 2000 to about 50%, the number of Hispanics will double to 24%, the number of Asians will also double to 8%, and the number of African-Americans will increase slightly to 14%. Mr Frey thinks the increase the Hispanic community, with their younger average ages and higher birthrates, will help to stop the fall in the number of white Americans.</p>
        
        <p>Roy Beck, president of an immigration research group believes the long-term increase is the result of immigration. "If we had no immigration, the population would not be 300 million but about 245 million today." The result, he says, is that the country is more crowded and there is less freedom and space. In short, America is becoming like Europe.</p>
    `;
    
    passage.innerHTML = articleContent;
}

function loadVocabulary() {
    // Sample vocabulary data - in production, this would come from an API
    state.vocabulary = [
        {
            word: "census",
            definition: "an official count or survey of a population",
            uzbek: "aholini ro'yxatga olish",
            example: "The US census is conducted every 10 years."
        },
        {
            word: "immigrant",
            definition: "a person who comes to live permanently in a foreign country",
            uzbek: "immigrant, muhojir",
            example: "Many immigrants come to the US for better opportunities."
        },
        {
            word: "composition",
            definition: "the nature of something's ingredients or constituents",
            uzbek: "tarkib, tuzilish",
            example: "The ethnic composition of America is changing rapidly."
        },
        {
            word: "controversial",
            definition: "giving rise or likely to give rise to public disagreement",
            uzbek: "bahsli, munozarali",
            example: "Immigration is a controversial topic in many countries."
        },
        {
            word: "suburban",
            definition: "relating to or characteristic of a suburb",
            uzbek: "shahar atrofi, suburban",
            example: "Many Americans prefer suburban living for its space."
        },
        {
            word: "frontier",
            definition: "a line or border separating two countries",
            uzbek: "chegarа, chegara",
            example: "The American frontier was constantly moving westward."
        },
        {
            word: "hectare",
            definition: "a metric unit of square measure, equal to 100 ares",
            uzbek: "gektar",
            example: "1214 hectares of farmland are lost daily in the US."
        },
        {
            word: "urbanization",
            definition: "the process of making an area more urban",
            uzbek: "urbanizatsiya, shaharlashuv",
            example: "Urbanization has changed American living patterns."
        }
    ];
}

function loadVocabularyCards() {
    const container = document.getElementById('vocabulary-cards');
    container.innerHTML = '';
    
    state.vocabulary.forEach(vocab => {
        const card = document.createElement('div');
        card.className = 'vocab-card';
        card.innerHTML = `
            <h4>${vocab.word}</h4>
            <p><strong>Definition:</strong> ${vocab.definition}</p>
            <p><strong>Uzbek:</strong> ${vocab.uzbek}</p>
            <p><em>${vocab.example}</em></p>
        `;
        container.appendChild(card);
    });
}

// Quiz Functions
function loadQuiz(quizType) {
    state.currentQuiz = quizType;
    state.currentQuestion = 0;
    state.userAnswers = [];
    state.timeLeft = 900;
    
    // Generate quiz questions based on type
    state.quizQuestions = generateQuizQuestions(quizType);
    
    // Update UI
    document.getElementById('quiz-title').textContent = getQuizTitle(quizType);
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('results-container').classList.add('hidden');
    document.getElementById('submit-quiz').classList.add('hidden');
    
    startTimer();
    displayQuestion();
}

function generateQuizQuestions(quizType) {
    const questions = [];
    const questionCount = 15;
    
    for (let i = 0; i < questionCount; i++) {
        let question;
        
        switch(quizType) {
            case 'comprehension':
                question = generateComprehensionQuestion(i);
                break;
            case 'vocabulary-en-uz':
                question = generateVocabularyQuestion(i, 'en-uz');
                break;
            case 'vocabulary-uz-en':
                question = generateVocabularyQuestion(i, 'uz-en');
                break;
            case 'vocabulary-en-en':
                question = generateVocabularyQuestion(i, 'en-en');
                break;
            case 'gap-filling':
                question = generateGapFillingQuestion(i);
                break;
        }
        
        if (question) questions.push(question);
    }
    
    return questions;
}

function generateComprehensionQuestion(index) {
    const questions = [
        {
            question: "What was the population of the USA when this article was written?",
            options: ["200 million", "250 million", "300 million", "350 million"],
            correctAnswer: 2,
            explanation: "The article states that the US population reached 300 million."
        },
        {
            question: "How often does the US population increase by one person according to the census office?",
            options: ["Every 7 seconds", "Every 11 seconds", "Every 13 seconds", "Every 31 seconds"],
            correctAnswer: 1,
            explanation: "The article mentions that population increases by one person every 11 seconds."
        },
        {
            question: "Which states are mentioned as the fastest-growing?",
            options: ["California, Texas, Florida", "Nevada, Arizona, Texas", "New York, New Jersey, Pennsylvania", "Ohio, Michigan, Illinois"],
            correctAnswer: 1,
            explanation: "Nevada, Arizona and Texas are mentioned as the fastest-growing states."
        },
        {
            question: "What percentage of Americans lived in urban and suburban areas in the past 100 years?",
            options: ["Increased from 20% to 60%", "Increased from 40% to 80%", "Decreased from 80% to 40%", "Remained at 50%"],
            correctAnswer: 1,
            explanation: "The article states it increased from 40% to 80%."
        },
        {
            question: "How much of the world's energy does the US use according to the article?",
            options: ["5%", "10%", "25%", "50%"],
            correctAnswer: 2,
            explanation: "The US has 5% of the world's population but uses 25% of the world's energy."
        }
    ];
    
    return questions[index % questions.length];
}

function generateVocabularyQuestion(index, type) {
    const vocab = state.vocabulary[index % state.vocabulary.length];
    
    if (type === 'en-uz') {
        return {
            question: `What is the Uzbek meaning of "${vocab.word}"?`,
            options: [
                vocab.uzbek,
                getRandomVocab().uzbek,
                getRandomVocab().uzbek,
                getRandomVocab().uzbek
            ],
            correctAnswer: 0,
            explanation: `"${vocab.word}" means "${vocab.uzbek}" in Uzbek.`
        };
    } else if (type === 'uz-en') {
        return {
            question: `What is the English word for "${vocab.uzbek}"?`,
            options: [
                vocab.word,
                getRandomVocab().word,
                getRandomVocab().word,
                getRandomVocab().word
            ],
            correctAnswer: 0,
            explanation: `"${vocab.uzbek}" means "${vocab.word}" in English.`
        };
    } else {
        return {
            question: `What is the definition of "${vocab.word}"?`,
            options: [
                vocab.definition,
                getRandomVocab().definition,
                getRandomVocab().definition,
                getRandomVocab().definition
            ],
            correctAnswer: 0,
            explanation: `"${vocab.word}" means: ${vocab.definition}`
        };
    }
}

function getRandomVocab() {
    return state.vocabulary[Math.floor(Math.random() * state.vocabulary.length)];
}

function generateGapFillingQuestion(index) {
    const sentences = [
        "The US population ______ 300 million for the first time.",
        "One American is born every seven ______.",
        "The fastest-growing states are Nevada, Arizona and ______.",
        "The US uses 25% of the world's ______.",
        "Immigration is changing the ethnic ______ of America."
    ];
    
    const answers = [
        ["reached", "achieved", "attained", "hit"],
        ["seconds", "minutes", "hours", "days"],
        ["Texas", "California", "Florida", "Georgia"],
        ["energy", "resources", "power", "electricity"],
        ["composition", "structure", "makeup", "formation"]
    ];
    
    return {
        question: sentences[index % sentences.length],
        options: answers[index % answers.length],
        correctAnswer: 0,
        explanation: `The correct word is "${answers[index % answers.length][0]}"`
    };
}

function getQuizTitle(quizType) {
    const titles = {
        'comprehension': 'Comprehension Quiz',
        'vocabulary-en-uz': 'English-Uzbek Vocabulary',
        'vocabulary-uz-en': 'Uzbek-English Vocabulary',
        'vocabulary-en-en': 'English Definitions',
        'gap-filling': 'Gap Filling Exercise'
    };
    return titles[quizType] || 'Quiz';
}

function displayQuestion() {
    const question = state.quizQuestions[state.currentQuestion];
    const container = document.getElementById('quiz-questions');
    
    container.innerHTML = `
        <div class="question-container">
            <div class="question-text">
                ${state.currentQuestion + 1}. ${question.question}
            </div>
            <div class="options-container">
                ${question.options.map((option, index) => `
                    <div class="option ${state.userAnswers[state.currentQuestion] === index ? 'selected' : ''}" 
                         data-index="${index}">
                        <input type="radio" 
                               name="answer" 
                               value="${index}" 
                               ${state.userAnswers[state.currentQuestion] === index ? 'checked' : ''}
                               id="option-${index}">
                        <label for="option-${index}">${option}</label>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Add event listeners to options
    container.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            selectAnswer(index);
        });
    });
    
    // Update progress
    document.getElementById('quiz-progress').textContent = 
        `Question ${state.currentQuestion + 1}/${state.quizQuestions.length}`;
    
    // Update navigation buttons
    document.getElementById('prev-question').disabled = state.currentQuestion === 0;
    
    if (state.currentQuestion === state.quizQuestions.length - 1) {
        document.getElementById('next-question').classList.add('hidden');
        document.getElementById('submit-quiz').classList.remove('hidden');
    } else {
        document.getElementById('next-question').classList.remove('hidden');
        document.getElementById('submit-quiz').classList.add('hidden');
    }
}

function selectAnswer(answerIndex) {
    state.userAnswers[state.currentQuestion] = answerIndex;
    displayQuestion(); // Refresh to show selection
}

function previousQuestion() {
    if (state.currentQuestion > 0) {
        state.currentQuestion--;
        displayQuestion();
    }
}

function nextQuestion() {
    if (state.currentQuestion < state.quizQuestions.length - 1) {
        state.currentQuestion++;
        displayQuestion();
    }
}

function startTimer() {
    clearInterval(state.timer);
    
    state.timer = setInterval(() => {
        state.timeLeft--;
        
        const minutes = Math.floor(state.timeLeft / 60);
        const seconds = state.timeLeft % 60;
        
        document.getElementById('quiz-timer').innerHTML = 
            `<i class="fas fa-clock"></i> ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            submitQuiz();
        }
    }, 1000);
}

async function submitQuiz() {
    clearInterval(state.timer);
    
    // Calculate score
    let correct = 0;
    const results = [];
    
    state.quizQuestions.forEach((question, index) => {
        const isCorrect = state.userAnswers[index] === question.correctAnswer;
        if (isCorrect) correct++;
        
        results.push({
            question: question.question,
            studentAnswer: question.options[state.userAnswers[index]] || 'Not answered',
            correctAnswer: question.options[question.correctAnswer],
            isCorrect: isCorrect,
            explanation: question.explanation
        });
    });
    
    const score = Math.round((correct / state.quizQuestions.length) * 100);
    
    // Save progress
    if (!state.userProgress[state.currentArticle]) {
        state.userProgress[state.currentArticle] = {};
    }
    
    state.userProgress[state.currentArticle][state.currentQuiz] = {
        score: score,
        date: new Date().toISOString(),
        correctAnswers: correct,
        totalQuestions: state.quizQuestions.length
    };
    
    localStorage.setItem('userProgress', JSON.stringify(state.userProgress));
    
    // Send to Telegram
    await sendResultsToTelegram(score, results);
    
    // Show results
    showResults(correct, results);
}

function showResults(correct, results) {
    const total = state.quizQuestions.length;
    const percentage = Math.round((correct / total) * 100);
    
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('results-container').classList.remove('hidden');
    
    document.getElementById('final-score').textContent = correct;
    document.getElementById('correct-answers').textContent = correct;
    document.getElementById('incorrect-answers').textContent = total - correct;
    document.getElementById('percentage').textContent = `${percentage}%`;
    
    // Update score circle color based on performance
    const scoreCircle = document.querySelector('.score-circle');
    if (percentage >= 80) {
        scoreCircle.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    } else if (percentage >= 60) {
        scoreCircle.style.background = 'linear-gradient(135deg, #FF9800, #F57C00)';
    } else {
        scoreCircle.style.background = 'linear-gradient(135deg, #F44336, #D32F2F)';
    }
    
    // Add confetti for good scores
    if (percentage >= 80) {
        createConfetti();
    }
}

function resetQuiz() {
    loadQuiz(state.currentQuiz);
}

function nextQuiz() {
    const quizTypes = ['comprehension', 'vocabulary-en-uz', 'vocabulary-uz-en', 'vocabulary-en-en', 'gap-filling'];
    const currentIndex = quizTypes.indexOf(state.currentQuiz);
    const nextIndex = (currentIndex + 1) % quizTypes.length;
    
    loadQuiz(quizTypes[nextIndex]);
}

// Telegram Integration
async function sendResultsToTelegram(score, results) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user) return;
    
    const data = {
        studentName: user.name,
        surname: user.surname,
        group: user.group,
        articleId: state.currentArticle,
        quizType: state.currentQuiz,
        score: score,
        answers: results,
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await fetch('/api/telegram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showNotification('Results sent to teacher successfully!', 'success');
        }
    } catch (error) {
        console.error('Failed to send results:', error);
        showNotification('Failed to send results to teacher', 'error');
    }
}

// General Test Functions
function startGeneralTest(level) {
    const questionsCount = {
        amateur: 25,
        master: 35,
        epic: 45,
        titan: 60
    }[level];
    
    showNotification(`Starting ${level} test with ${questionsCount} questions`, 'info');
    
    // In a real implementation, this would load questions from all articles
    // and navigate to a special test interface
}

// Utility Functions
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    }[type];
    
    notification.innerHTML = `
        <i class="fas ${icon} text-${type}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function logout() {
    state.currentUser = null;
    localStorage.removeItem('currentUser');
    
    document.getElementById('main-menu').classList.remove('active');
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('login-page').classList.add('active');
    
    // Reset login form
    document.getElementById('login-form').reset();
    
    showNotification('Logged out successfully', 'info');
}

function createConfetti() {
    const confettiCount = 100;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = getRandomColor();
        confetti.style.borderRadius = '50%';
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.top = '-10px';
        
        container.appendChild(confetti);
        
        // Animation
        const animation = confetti.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 2000,
            easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
        });
        
        animation.onfinish = () => confetti.remove();
    }
    
    document.body.appendChild(container);
    
    setTimeout(() => container.remove(), 3000);
}

function getRandomColor() {
    const colors = ['#4361ee', '#3a0ca3', '#4cc9f0', '#f72585', '#7209b7', '#f8961e'];
    return colors[Math.floor(Math.random() * colors.length)];
}
