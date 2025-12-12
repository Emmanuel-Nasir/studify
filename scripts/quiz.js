// Quiz.js - Main Quiz Logic
// Make sure Utils, API, and StorageManager are loaded BEFORE this file

let categories = [];
let currentQuiz = null;
let currentQuestionIndex = 0;
let score = 0;
let quizSettings = {};

const fallbackCategories = [
    { id: 9, name: "General Knowledge" },
    { id: 17, name: "Science & Nature" },
    { id: 18, name: "Science: Computers" },
    { id: 19, name: "Science: Mathematics" },
    { id: 21, name: "Sports" },
    { id: 22, name: "Geography" },
    { id: 23, name: "History" },
    { id: 27, name: "Animals" }
];

function checkAuthentication() {
    const isAuth = localStorage.getItem('studify_auth');
    if (isAuth !== 'true') {
        console.warn('⚠️ Not authenticated, but continuing for demo purposes');
        // Uncomment below to enable authentication redirect:
        // window.location.href = 'index.html';
        // return false;
    }
    return true;
}

function loadUserInfo() {
    const user = StorageManager.getCurrentUser();
    if (user) {
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) {
            userNameEl.textContent = user.firstName;
        }
    }
}

async function loadCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) {
        console.error('ERROR: categories-grid element not found in HTML!');
        return;
    }
    
    container.innerHTML = `
        <div style="grid-column: 1/-1;" class="loading">
            <div class="spinner"></div>
            <p>Loading categories...</p>
        </div>
    `;
    
    try {
        const result = await API.getQuizCategories();
        
        if (result.success && result.categories.length > 0) {
            categories = result.categories;
            console.log('✅ Successfully loaded', categories.length, 'categories');
        } else {
            throw new Error('Failed to load categories');
        }
    } catch (error) {
        console.log('⚠️ Using fallback categories due to error:', error);
        categories = fallbackCategories;
    } finally {
        populateCategoryDropdown();
        displayCategoriesGrid();
        
        if (categories === fallbackCategories) {
            container.innerHTML += `
                <div style="grid-column: 1/-1; text-align: center; padding: 12px; background: #FEF3C7; border-radius: 12px; margin-top: 12px;">
                    <p style="margin: 0; color: #92400E; font-size: 0.875rem;">⚠️ Using offline categories. Some may have limited questions.</p>
                </div>
            `;
        }
    }
}

function populateCategoryDropdown() {
    const select = document.getElementById('quiz-category');
    if (!select) {
        console.error('ERROR: quiz-category element not found in HTML!');
        return;
    }
    
    select.innerHTML = '<option value="">Any Category</option>';
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
    });
}

function displayCategoriesGrid() {
    const container = document.getElementById('categories-grid');
    if (!container) return;
    
    if (!categories || categories.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="color: var(--text-muted);">No categories available</p>
            </div>
        `;
        return;
    }
    
    const categoriesToShow = categories.slice(0, 12);
    
    container.innerHTML = categoriesToShow.map(cat => `
        <div class="category-card" data-id="${cat.id}" style="padding: 16px; background: var(--muted); border-radius: 12px; cursor: pointer; transition: all 0.2s; text-align: center; border: 2px solid transparent;">
            <p style="margin: 0; font-weight: 600; font-size: 0.9rem; color: var(--text);">${Utils.sanitizeHTML(cat.name)}</p>
        </div>
    `).join('');

    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-id');
            document.getElementById('quiz-category').value = categoryId;
            
            document.querySelectorAll('.category-card').forEach(c => {
                c.style.background = 'var(--muted)';
                c.style.borderColor = 'transparent';
            });
            
            this.style.background = 'white';
            this.style.borderColor = 'var(--primary)';
        });

        card.addEventListener('mouseenter', function() {
            if (this.style.borderColor !== 'rgb(99, 102, 241)') {
                this.style.background = 'white';
                this.style.transform = 'scale(1.05)';
            }
        });

        card.addEventListener('mouseleave', function() {
            if (this.style.borderColor !== 'rgb(99, 102, 241)') {
                this.style.background = 'var(--muted)';
                this.style.transform = 'scale(1)';
            }
        });
    });
    
    console.log('✅ Displayed', categoriesToShow.length, 'category cards');
}

async function startQuiz() {
    const category = document.getElementById('quiz-category').value;
    const difficulty = document.getElementById('quiz-difficulty').value;
    const amount = document.getElementById('quiz-amount').value;

    quizSettings = { category, difficulty, amount };

    const startBtn = document.getElementById('start-quiz-btn');
    if (!startBtn) {
        console.error('ERROR: start-quiz-btn element not found!');
        return;
    }
    
    const originalText = startBtn.textContent;
    startBtn.textContent = '⏳ Loading Questions...';
    startBtn.disabled = true;

    console.log('🔄 Requesting quiz with settings:', quizSettings);

    try {
        const result = await API.getQuizQuestions({
            amount: parseInt(amount),
            category,
            difficulty
        });

        console.log('📦 Quiz API result:', result);

        if (result.success && result.questions.length > 0) {
            currentQuiz = result.questions;
            currentQuestionIndex = 0;
            score = 0;

            currentQuiz.forEach(question => {
                const allAnswers = [...question.incorrect_answers, question.correct_answer];
                question.shuffledAnswers = Utils.shuffleArray(allAnswers);
            });

            console.log('✅ Quiz loaded successfully! Showing quiz view...');
            showQuizView();
            displayQuestion();
        } else {
            throw new Error(result.error || 'No questions available');
        }
    } catch (error) {
        console.error('❌ Quiz error:', error);
        Utils.showToast('Failed to load quiz. Please check your connection and try again.', 'error');
        
        const setupView = document.getElementById('setup-view');
        if (setupView) {
            const existingError = setupView.querySelector('.network-error');
            if (existingError) existingError.remove();
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'network-error';
            errorDiv.style.cssText = 'background: #FEE2E2; border: 2px solid #FCA5A5; border-radius: 16px; padding: 20px; margin: 20px auto; max-width: 600px; text-align: center;';
            errorDiv.innerHTML = `
                <h3 style="margin: 0 0 12px 0; color: #991B1B; font-size: 1.125rem;">⚠️ Unable to Load Quiz</h3>
                <p style="margin: 0 0 16px 0; color: #7F1D1D; font-size: 0.9375rem;">
                    We couldn't connect to the quiz server. This could be due to:
                </p>
                <ul style="text-align: left; color: #7F1D1D; margin: 0 0 16px 0; padding-left: 24px;">
                    <li>Network connection issues</li>
                    <li>The quiz API being temporarily unavailable</li>
                    <li>No questions available for this category/difficulty combination</li>
                </ul>
                <p style="margin: 0; color: #7F1D1D; font-size: 0.875rem; font-weight: 600;">
                    💡 Try: Selecting a different category or difficulty level
                </p>
            `;
            
            setupView.insertBefore(errorDiv, setupView.firstChild);
        }
    } finally {
        startBtn.textContent = originalText;
        startBtn.disabled = false;
    }
}

function showQuizView() {
    console.log('🎯 showQuizView() called');
    
    const setupView = document.getElementById('setup-view');
    const quizView = document.getElementById('quiz-view');
    const resultsView = document.getElementById('results-view');
    
    if (!quizView) {
        console.error('❌ ERROR: quiz-view element not found in HTML!');
        console.log('Make sure your HTML has: <div id="quiz-view">');
        return;
    }
    
    // Add hidden class to setup and results
    if (setupView) {
        setupView.classList.add('hidden');
        console.log('✅ Hidden setup-view');
    }
    
    // Remove hidden class from quiz view
    quizView.classList.remove('hidden');
    console.log('✅ Showing quiz-view');
    
    if (resultsView) {
        resultsView.classList.add('hidden');
    }
}

function showResultsView() {
    const setupView = document.getElementById('setup-view');
    const quizView = document.getElementById('quiz-view');
    const resultsView = document.getElementById('results-view');
    
    if (setupView) setupView.classList.add('hidden');
    if (quizView) quizView.classList.add('hidden');
    if (resultsView) resultsView.classList.remove('hidden');
}

function showSetupView() {
    const setupView = document.getElementById('setup-view');
    const quizView = document.getElementById('quiz-view');
    const resultsView = document.getElementById('results-view');
    
    if (setupView) setupView.classList.remove('hidden');
    if (quizView) quizView.classList.add('hidden');
    if (resultsView) resultsView.classList.add('hidden');
    
    const existingError = document.querySelector('.network-error');
    if (existingError) existingError.remove();
}

function displayQuestion() {
    console.log('📝 Displaying question', currentQuestionIndex + 1);
    
    const question = currentQuiz[currentQuestionIndex];
    const container = document.getElementById('question-container');
    
    if (!container) {
        console.error('❌ ERROR: question-container element not found in HTML!');
        return;
    }

    const currentQuestionEl = document.getElementById('current-question');
    const totalQuestionsEl = document.getElementById('total-questions');
    const currentScoreEl = document.getElementById('current-score');
    const progressEl = document.getElementById('quiz-progress');
    
    if (currentQuestionEl) currentQuestionEl.textContent = currentQuestionIndex + 1;
    if (totalQuestionsEl) totalQuestionsEl.textContent = currentQuiz.length;
    if (currentScoreEl) currentScoreEl.textContent = score;

    const progress = ((currentQuestionIndex + 1) / currentQuiz.length) * 100;
    if (progressEl) progressEl.style.width = progress + '%';

    const difficultyColors = {
        easy: '#10B981',
        medium: '#F59E0B',
        hard: '#EF4444'
    };

    container.innerHTML = `
        <div class="quiz-question">
            <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
                ${question.difficulty ? `<span style="display: inline-block; padding: 4px 12px; background: ${difficultyColors[question.difficulty] || '#6366F1'}; color: white; border-radius: 8px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">${question.difficulty}</span>` : ''}
                ${question.category ? `<span style="display: inline-block; padding: 4px 12px; background: var(--muted); color: var(--text-muted); border-radius: 8px; font-size: 0.75rem; font-weight: 600;">${Utils.sanitizeHTML(question.category)}</span>` : ''}
            </div>
            <h3 style="margin: 0 0 24px 0; font-size: 1.375rem; line-height: 1.5;">${Utils.decodeHTML(question.question)}</h3>
            <div class="quiz-options">
                ${question.shuffledAnswers.map((answer, index) => `
                    <button class="quiz-option" data-answer="${Utils.sanitizeHTML(answer)}">
                        ${Utils.decodeHTML(answer)}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', function() {
            handleAnswer(this);
        });
    });
    
    console.log('✅ Question displayed successfully');
}

function handleAnswer(button) {
    const selectedAnswer = button.getAttribute('data-answer');
    const correctAnswer = currentQuiz[currentQuestionIndex].correct_answer;
    const allButtons = document.querySelectorAll('.quiz-option');

    allButtons.forEach(btn => {
        btn.disabled = true;
        const btnAnswer = btn.getAttribute('data-answer');
        
        if (btnAnswer === correctAnswer) {
            btn.classList.add('correct');
        } else if (btn === button && btnAnswer !== correctAnswer) {
            btn.classList.add('incorrect');
        }
    });

    if (selectedAnswer === correctAnswer) {
        score++;
        const currentScoreEl = document.getElementById('current-score');
        if (currentScoreEl) currentScoreEl.textContent = score;
    }

    setTimeout(() => {
        currentQuestionIndex++;
        
        if (currentQuestionIndex < currentQuiz.length) {
            displayQuestion();
        } else {
            showResults();
        }
    }, 1500);
}

function showResults() {
    const totalQuestions = currentQuiz.length;
    const percentage = Utils.calculatePercentage(score, totalQuestions);

    const finalScoreEl = document.getElementById('final-score');
    const finalTotalEl = document.getElementById('final-total');
    const percentageEl = document.getElementById('percentage');
    const emojiEl = document.getElementById('results-emoji');
    
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (finalTotalEl) finalTotalEl.textContent = totalQuestions;
    if (percentageEl) percentageEl.textContent = percentage;

    let emoji = '🎉';
    if (percentage === 100) emoji = '🏆';
    else if (percentage >= 80) emoji = '🌟';
    else if (percentage >= 60) emoji = '👍';
    else if (percentage >= 40) emoji = '📚';
    else emoji = '💪';

    if (emojiEl) emojiEl.textContent = emoji;

    StorageManager.saveScore({
        score,
        total: totalQuestions,
        percentage,
        category: quizSettings.category,
        difficulty: quizSettings.difficulty
    });

    showResultsView();
}

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    const startBtn = document.getElementById('start-quiz-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startQuiz);
        console.log('✅ start-quiz-btn listener added');
    } else {
        console.error('❌ start-quiz-btn not found!');
    }
    
    const retryBtn = document.getElementById('retry-quiz-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', async () => {
            const btn = document.getElementById('retry-quiz-btn');
            btn.textContent = '⏳ Loading...';
            btn.disabled = true;
            
            try {
                const result = await API.getQuizQuestions({
                    amount: parseInt(quizSettings.amount),
                    category: quizSettings.category,
                    difficulty: quizSettings.difficulty
                });
                
                if (result.success && result.questions.length > 0) {
                    currentQuiz = result.questions;
                    currentQuestionIndex = 0;
                    score = 0;

                    currentQuiz.forEach(question => {
                        const allAnswers = [...question.incorrect_answers, question.correct_answer];
                        question.shuffledAnswers = Utils.shuffleArray(allAnswers);
                    });

                    showQuizView();
                    displayQuestion();
                } else {
                    throw new Error('Failed to load quiz');
                }
            } catch (error) {
                Utils.showToast('Failed to load quiz. Please try again.', 'error');
            } finally {
                btn.textContent = 'Try Again';
                btn.disabled = false;
            }
        });
    }

    const newQuizBtn = document.getElementById('new-quiz-btn');
    if (newQuizBtn) {
        newQuizBtn.addEventListener('click', () => {
            showSetupView();
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('studify_auth');
                localStorage.removeItem('studify_user');
                window.location.href = 'index.html';
            }
        });
    }
}

async function initQuiz() {
    console.log('🚀 Initializing quiz...');
    
    if (!checkAuthentication()) {
        console.log('❌ Authentication failed, redirecting...');
        return;
    }

    loadUserInfo();
    await loadCategories();
    setupEventListeners();
    
    console.log('✅ Quiz initialized successfully!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuiz);
} else {
    initQuiz();
}