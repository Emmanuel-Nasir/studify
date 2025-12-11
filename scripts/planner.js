let currentEditId = null;
let allSessions = [];

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
    }
}

function loadSessions(filter = 'all', searchTerm = '') {
    allSessions = StorageManager.getAllSessions();
    
    let filteredSessions = allSessions;

    if (filter === 'upcoming') {
        filteredSessions = allSessions.filter(s => Utils.isFutureDate(s.date) || Utils.isToday(s.date));
    } else if (filter === 'today') {
        filteredSessions = allSessions.filter(s => Utils.isToday(s.date));
    } else if (filter === 'past') {
        filteredSessions = allSessions.filter(s => Utils.isPastDate(s.date));
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredSessions = filteredSessions.filter(s => 
            s.title.toLowerCase().includes(term) || 
            s.subject.toLowerCase().includes(term)
        );
    }

    filteredSessions.sort((a, b) => new Date(a.date) - new Date(b.date));

    displaySessions(filteredSessions);
}

function displaySessions(sessions) {
    const container = document.getElementById('sessions-list');

    if (sessions.length === 0) {
        container.innerHTML = `
            <li class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>No sessions found</p>
            </li>
        `;
        return;
    }

    container.innerHTML = sessions.map(session => {
        const dateObj = new Date(session.date);
        const isPast = Utils.isPastDate(session.date);
        const isToday = Utils.isToday(session.date);
        
        let dateLabel = Utils.formatDate(session.date);
        if (isToday) dateLabel = '🔥 Today';
        else if (Utils.getDaysUntil(session.date) === 1) dateLabel = 'Tomorrow';

        return `
            <li class="session-item ${isPast ? 'past-session' : ''}">
                <div class="session-info">
                    <h4>${Utils.sanitizeHTML(session.title)}</h4>
                    <p>${Utils.sanitizeHTML(session.subject)} • ${session.duration} min • ${dateLabel}</p>
                    ${session.notes ? `<p style="font-size: 0.8rem; color: #999; margin-top: 4px;">${Utils.sanitizeHTML(session.notes)}</p>` : ''}
                </div>
                <div class="session-actions">
                    <button class="btn-icon edit-btn" data-id="${session.id}" title="Edit">✏️</button>
                    <button class="btn-icon delete-btn" data-id="${session.id}" title="Delete">🗑️</button>
                </div>
            </li>
        `;
    }).join('');

    attachSessionEventListeners();
}

function attachSessionEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editSession(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteSession(id);
        });
    });
}

function openModal(session = null) {
    const modal = document.getElementById('session-modal');
    const form = document.getElementById('session-form');
    const title = document.getElementById('modal-title');

    if (session) {
        title.textContent = 'Edit Study Session';
        currentEditId = session.id;
        
        document.getElementById('session-title').value = session.title;
        document.getElementById('session-subject').value = session.subject;
        document.getElementById('session-date').value = session.date.split('T')[0];
        document.getElementById('session-time').value = session.time || '09:00';
        document.getElementById('session-duration').value = session.duration;
        document.getElementById('session-notes').value = session.notes || '';
    } else {
        title.textContent = 'Add Study Session';
        currentEditId = null;
        form.reset();
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('session-date').value = today;
    }

    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('session-modal');
    modal.classList.remove('show');
    currentEditId = null;
}

function editSession(id) {
    const session = allSessions.find(s => s.id === id);
    if (session) {
        openModal(session);
    }
}

function deleteSession(id) {
    if (confirm('Are you sure you want to delete this session?')) {
        StorageManager.deleteSession(id);
        Utils.showToast('Session deleted successfully', 'success');
        loadSessions();
    }
}

function setupEventListeners() {
    document.getElementById('add-session-btn').addEventListener('click', () => openModal());
    
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);

    document.getElementById('session-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    document.getElementById('session-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const sessionData = {
            title: document.getElementById('session-title').value.trim(),
            subject: document.getElementById('session-subject').value.trim(),
            date: document.getElementById('session-date').value + 'T' + document.getElementById('session-time').value,
            time: document.getElementById('session-time').value,
            duration: parseInt(document.getElementById('session-duration').value),
            notes: document.getElementById('session-notes').value.trim()
        };

        if (currentEditId) {
            StorageManager.updateSession(currentEditId, sessionData);
            Utils.showToast('Session updated successfully!', 'success');
        } else {
            StorageManager.addSession(sessionData);
            Utils.showToast('Session added successfully!', 'success');
        }

        closeModal();
        loadSessions();
    });

    const searchInput = document.getElementById('search-sessions');
    const debouncedSearch = Utils.debounce(function() {
        const filter = document.getElementById('filter-sessions').value;
        loadSessions(filter, searchInput.value);
    }, 300);

    searchInput.addEventListener('input', debouncedSearch);

    document.getElementById('filter-sessions').addEventListener('change', function() {
        const searchTerm = document.getElementById('search-sessions').value;
        loadSessions(this.value, searchTerm);
    });

    document.getElementById('export-btn').addEventListener('click', exportSessions);
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', importSessions);

    document.getElementById('logout-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('studify_auth');
            localStorage.removeItem('studify_user');
            window.location.href = 'index.html';
        }
    });
}

function exportSessions() {
    const data = StorageManager.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studify-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Utils.showToast('Data exported successfully!', 'success');
}

function importSessions(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            if (confirm('This will import the data. Continue?')) {
                StorageManager.importData(data);
                Utils.showToast('Data imported successfully!', 'success');
                loadSessions();
            }
        } catch (error) {
            Utils.showToast('Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function initPlanner() {
    if (!checkAuthentication()) return;

    loadUserInfo();
    loadSessions();
    setupEventListeners();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlanner);
} else {
    initPlanner();
}