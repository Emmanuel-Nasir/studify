const USERS_KEY = 'studify_users';

function getAllUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
}

function saveUser(user) {
    const users = getAllUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUserByEmail(email) {
    const users = getAllUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showMessage(message, type = 'error') {
    const existingMsg = document.querySelector('.message');
    if (existingMsg) existingMsg.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `message message-${type}`;
    msgDiv.textContent = message;
    
    const form = document.querySelector('form');
    form.parentNode.insertBefore(msgDiv, form);

    setTimeout(() => msgDiv.remove(), 4000);
}

if (document.getElementById('signup-form')) {
    document.getElementById('signup-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const firstName = document.getElementById('signup-fname').value.trim();
        const lastName = document.getElementById('signup-lname').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;

        if (!firstName || !lastName) {
            showMessage('Please enter your full name');
            return;
        }

        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address');
            return;
        }

        if (!validatePassword(password)) {
            showMessage('Password must be at least 6 characters');
            return;
        }

        if (findUserByEmail(email)) {
            showMessage('An account with this email already exists');
            return;
        }

        const user = {
            id: Date.now().toString(),
            firstName,
            lastName,
            email,
            password,
            createdAt: new Date().toISOString()
        };

        saveUser(user);

        localStorage.setItem('studify_user', JSON.stringify({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        }));
        localStorage.setItem('studify_auth', 'true');

        showMessage('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    });
}

if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!validateEmail(email)) {
            showMessage('Please enter a valid email address');
            return;
        }

        if (!password) {
            showMessage('Please enter your password');
            return;
        }

        const user = findUserByEmail(email);

        if (!user) {
            showMessage('No account found with this email');
            return;
        }

        if (user.password !== password) {
            showMessage('Incorrect password');
            return;
        }

        localStorage.setItem('studify_user', JSON.stringify({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        }));
        localStorage.setItem('studify_auth', 'true');

        showMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    });
}

function checkAuth() {
    const isAuth = localStorage.getItem('studify_auth');
    const currentPage = window.location.pathname;
    
    if (isAuth === 'true' && (currentPage.includes('index.html') || currentPage.endsWith('/'))) {
        window.location.href = 'dashboard.html';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
} else {
    checkAuth();
}