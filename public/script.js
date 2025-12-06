// Application State
const AppState = {
    currentUser: null,
    currentArticle: 12,
    currentQuiz: 'comprehension',
    currentQuestion: 0,
    userAnswers: [],
    timer: null,
    timeLeft: 600,
    quizData: null,
    userProgress: JSON.parse(localStorage.getItem('userProgress')) || {
        12: {
            comprehension: { score: 85, date: new Date().toISOString(), correct: 4, total: 5 },
            'english-uzbek': { score: 90, date: new Date().toISOString(), correct: 5, total: 5 }
        }
    },
    articles: Array.from({length: 20}, (_, i) => ({
        id: i + 1,
        title: i + 1 === 12 ? 'US Population Reaches 300 Million' : `Article ${i + 1}`,
        description: i + 1 === 12 ? 'Learn about population changes in the USA' : 'Coming soon',
        level: i < 7 ? 'Beginner' : i < 14 ? 'Intermediate' : 'Advanced',
        readingTime: Math.floor(Math.random() * 10) + 3,
        status: i + 1 === 12 ? 'available' : 'coming-soon',
        completed: i + 1 === 12,
        score: i + 1 === 12 ? 85 : null
    }))
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen after 1.5 seconds
    setTimeout(() => {
        document.getElementById('loading-screen').classList.remove('active');
        document.getElementById('loading-screen').classList.add('hidden');
        
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            AppState.currentUser = JSON.parse(savedUser);
            showPage('main-menu');
            updateUserInfo();
            loadProgress();
            generateArticlesGrid();
            initializeNavigation();
        } else {
            showPage('login-page');
        }
        
        initializeLogin();
        updateTimeDisplay();
        setInterval(updateTimeDisplay, 1000);
        initializeBackToTop();
        
        // Show welcome notification
        setTimeout(() => {
            showNotification('Welcome to Reading Platform!', 'info');
        }, 1000);
    }, 1500);
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
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Initialize Login
function initializeLogin() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    
    // Add floating label functionality
    const inputs = loginForm.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Check if input has value on load
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const surname = document.getElementById('surname').value.trim();
        let group = document.getElementById('group').value.trim().toUpperCase();
        
        // Validation
        if (!name || !surname || !group) {
            showNotification('Please fill all required fields', 'error');
            return;
        }
        
        // Validate group format
        const validGroups = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        if (!validGroups.includes(group)) {
            showNotification('Group should be A1, A2, B1, B2, C1, or C2', 'warning');
            return;
        }
        
        // Create user object
        AppState.currentUser = {
            name,
            surname,
            group,
            loginTime: new Date().toISOString(),
            streak: 7,
            level: 'Intermediate',
            totalTime: 765 // minutes
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(AppState.currentUser));
        
        // Show loading state
        const submitBtn = loginForm.querySelector('.btn-login');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        submitBtn.querySelector('.btn-text').textContent = 'Entering...';
        submitBtn.disabled = true;
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Navigate to main menu
        showPage('main-menu');
        updateUserInfo();
        loadProgress();
        generateArticlesGrid();
        initializeNavigation();
        
        // Show welcome notification
        showNotification(`Welcome back, ${name}! Ready to learn?`, 'success');
        
        // Reset button
        submitBtn.querySelector('.btn-text').textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Update User Info
function updateUserInfo() {
    if (!AppState.currentUser) return;
    
    const nameEl = document.getElementById('user-name');
    const groupEl = document.getElementById('user-group');
    const welcomeName = document.getElementById('welcome-name');
    
    if (nameEl) nameEl.textContent = `${AppState.currentUser.name} ${AppState.currentUser.surname}`;
    if (groupEl) groupEl.textContent = `Group: ${AppState.currentUser.group}`;
    if (welcomeName) welcomeName.textContent = AppState.currentUser.name;
}

// Load Progress
function loadProgress() {
    // Update stats
    const completed = AppState.articles.filter(a => a.completed).length;
    const total = AppState.articles.length;
    
    document.getElementById('completed-count').textContent = `${completed}/${total} Articles`;
    document.getElementById('average-score').textContent = '85%';
    document.getElementById('time-spent').textContent = formatTime(AppState.currentUser?.totalTime || 0);
    document.getElementById('user-level').textContent = AppState.currentUser?.level || 'Beginner';
    
    // Update progress chart
    updateProgressChart();
}

// Format time (minutes to hours and minutes)
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

// Update Progress Chart
function updateProgressChart() {
    const ctx = document.getElementById('progress-chart');
    if (!ctx) return;
    
    // Destroy existing chart if any
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    ctx.chart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Daily Score',
                data: [65, 75, 80, 85, 82, 88, 90],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4361ee',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 6
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                }
            }
        }
    });
}

// Generate Articles Grid
function generateArticlesGrid() {
    const grid = document.getElementById('articles-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    AppState.articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'article-card';
        
        card.innerHTML = `
            <div class="article-image">
                <i class="fas fa-newspaper"></i>
            </div>
            <div class="article-content">
                <div class="article-meta">
                    <span><i class="fas fa-clock"></i> ${article.readingTime} min</span>
                    <span><i class="fas fa-chart-line"></i> ${article.level}</span>
                    ${article.completed ? '<span><i class="fas fa-check"></i> Completed</span>' : ''}
                </div>
                <h3 class="article-title">${article.id}. ${article.title}</h3>
                <p class="article-desc">${article.description}</p>
                <div class="article-footer">
                    <div class="article-difficulty">
                        ${[1,2,3,4,5].map(i => 
                            `<span class="difficulty-dot ${i <= (article.level === 'Beginner' ? 2 : article.level === 'Intermediate' ? 4 : 5) ? 'filled' : ''}"></span>`
                        ).join('')}
                        <span style="margin-left: 8px; font-size: 12px; color: #6c757d;">${article.level}</span>
                    </div>
                    ${article.status === 'available' ? 
                        `<button class="btn-read" onclick="openArticle(${article.id})">
                            ${article.completed ? 'Review' : 'Read'}
                        </button>` :
                        '<span style="color: #6c757d; font-size: 14px;">Coming Soon</span>'
                    }
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Initialize Navigation
function initializeNavigation() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            
            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show corresponding section
            document.querySelectorAll('.page-section').forEach(section => {
                section.classList.remove('active');
                section.classList.add('hidden');
            });
            
            const targetSection = document.getElementById(page);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('active');
            }
        });
    });
    
    // Logout button
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    
    // Test buttons
    document.querySelectorAll('.btn-start-test').forEach(btn => {
        btn.addEventListener('click', function() {
            const level = this.dataset.level;
            startGeneralTest(level);
        });
    });
}

// Open Article
function openArticle(articleId) {
    AppState.currentArticle = articleId;
    
    // For now, just show a notification since we haven't built the full article page
    if (articleId === 12) {
        showNotification('Opening Article 12: US Population Reaches 300 Million', 'info');
        // In a full implementation, you would:
        // 1. Load article content
        // 2. Show article page
        // 3. Initialize quizzes
    } else {
        showNotification('This article will be available soon!', 'info');
    }
}

// Start General Test
function startGeneralTest(level) {
    const testInfo = {
        amateur: { questions: 25, time: 30 },
        master: { questions: 35, time: 45 },
        epic: { questions: 45, time: 60 },
        titan: { questions: 60, time: 90 }
    };
    
    const info = testInfo[level];
    showNotification(`Starting ${level} test: ${info.questions} questions, ${info.time} minutes`, 'info');
    
    // In a full implementation, you would navigate to the test page
    setTimeout(() => {
        showNotification('Test completed! Check your results.', 'success');
    }, 2000);
}

// Quick Actions
function startQuickQuiz() {
    showNotification('Starting Quick Quiz: 5 questions, 5 minutes', 'info');
}

function reviewVocabulary() {
    showNotification('Opening Today\'s Vocabulary Review', 'info');
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
        <div>
            <p style="margin: 0; font-weight: 500;">${message}</p>
            <small style="color: #6c757d; font-size: 12px;">Just now</small>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Back to Top Button
function initializeBackToTop() {
    const backToTop = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Logout
function logout() {
    AppState.currentUser = null;
    localStorage.removeItem('currentUser');
    showPage('login-page');
    showNotification('Logged out successfully', 'info');
}

// Initialize form inputs on load
document.querySelectorAll('.form-input').forEach(input => {
    if (input.value) {
        input.parentElement.classList.add('focused');
    }
});
