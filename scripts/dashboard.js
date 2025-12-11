function checkAuthentication() {
    const isAuth = localStorage.getItem('studify_auth');
    if (isAuth !== 'true') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function loadUserInfo() {
    const user = StorageManager.getCurrentUser();
    if (user) {
        document.getElementById('user-name').textContent = user.firstName;
        document.getElementById('welcome-name').textContent = user.firstName;
    }
}

async function loadDailyQuote() {
    const quoteCard = document.getElementById('quote-card');
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');

    try {
        const result = await API.getDailyQuote();
        
        if (result.success) {
            quoteText.textContent = `"${result.quote}"`;
            quoteAuthor.textContent = `— ${result.author}`;
        } else {
            quoteText.textContent = `"${result.quote}"`;
            quoteAuthor.textContent = `— ${result.author}`;
        }
    } catch (error) {
        quoteText.textContent = '"Stay focused and keep learning!"';
        quoteAuthor.textContent = '— Studify';
    }
}

function loadTodaySessions() {
    const sessions = StorageManager.getAllSessions();
    const todaySessions = sessions.filter(session => {
        return Utils.isToday(session.date);
    });

    const container = document.getElementById('today-sessions');
    
    if (todaySessions.length === 0) {
        container.innerHTML = `
            <li class="empty-state">
                <div class="empty-state-icon">📚</div>
                <p>No sessions scheduled for today</p>
            </li>
        `;
        return;
    }

    container.innerHTML = todaySessions.map(session => `
        <li class="session-item">
            <div class="session-info">
                <h4>${Utils.sanitizeHTML(session.title)}</h4>
                <p>${Utils.sanitizeHTML(session.subject)} • ${session.duration} min</p>
            </div>
        </li>
    `).join('');
}

function loadStats() {
    const sessions = StorageManager.getAllSessions();
    const scores = StorageManager.getAllScores();
    
    const now = new Date();
    const completedSessions = sessions.filter(session => Utils.isPastDate(session.date));
    const upcomingSessions = sessions.filter(session => Utils.isFutureDate(session.date) || Utils.isToday(session.date));

    document.getElementById('stat-total-sessions').textContent = sessions.length;
    document.getElementById('stat-completed').textContent = completedSessions.length;
    document.getElementById('stat-upcoming').textContent = upcomingSessions.length;
    document.getElementById('stat-quizzes').textContent = scores.length;
}

function setupLogout() {
    document.getElementById('logout-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('studify_auth');
            localStorage.removeItem('studify_user');
            window.location.href = 'index.html';
        }
    });
}

function initDashboard() {
    if (!checkAuthentication()) return;

    loadUserInfo();
    loadDailyQuote();
    loadTodaySessions();
    loadStats();
    setupLogout();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}