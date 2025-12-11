const StorageManager = {
    KEYS: {
        USER: 'studify_user',
        SESSIONS: 'studify_sessions',
        SCORES: 'studify_scores',
        PREFERENCES: 'studify_preferences',
        AUTH: 'studify_auth'
    },

    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },

    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    },

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },

    getCurrentUser() {
        return this.getItem(this.KEYS.USER);
    },

    setCurrentUser(user) {
        return this.setItem(this.KEYS.USER, user);
    },

    isAuthenticated() {
        return this.getItem(this.KEYS.AUTH) === true;
    },

    setAuthenticated(status) {
        return this.setItem(this.KEYS.AUTH, status);
    },

    getAllSessions() {
        return this.getItem(this.KEYS.SESSIONS) || [];
    },

    saveSessions(sessions) {
        return this.setItem(this.KEYS.SESSIONS, sessions);
    },

    addSession(session) {
        const sessions = this.getAllSessions();
        session.id = Date.now().toString();
        sessions.push(session);
        return this.saveSessions(sessions);
    },

    updateSession(id, updatedSession) {
        const sessions = this.getAllSessions();
        const index = sessions.findIndex(s => s.id === id);
        if (index !== -1) {
            sessions[index] = { ...sessions[index], ...updatedSession };
            return this.saveSessions(sessions);
        }
        return false;
    },

    deleteSession(id) {
        const sessions = this.getAllSessions();
        const filtered = sessions.filter(s => s.id !== id);
        return this.saveSessions(filtered);
    },

    getAllScores() {
        return this.getItem(this.KEYS.SCORES) || [];
    },

    saveScore(score) {
        const scores = this.getAllScores();
        scores.push({
            ...score,
            id: Date.now().toString(),
            date: new Date().toISOString()
        });
        return this.setItem(this.KEYS.SCORES, scores);
    },

    getPreferences() {
        return this.getItem(this.KEYS.PREFERENCES) || {
            theme: 'light',
            notifications: true,
            dailyGoal: 120
        };
    },

    savePreferences(preferences) {
        return this.setItem(this.KEYS.PREFERENCES, preferences);
    },

    exportData() {
        return {
            sessions: this.getAllSessions(),
            scores: this.getAllScores(),
            preferences: this.getPreferences(),
            exportDate: new Date().toISOString()
        };
    },

    importData(data) {
        try {
            if (data.sessions) this.saveSessions(data.sessions);
            if (data.scores) this.setItem(this.KEYS.SCORES, data.scores);
            if (data.preferences) this.savePreferences(data.preferences);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },

    clearAllData() {
        Object.values(this.KEYS).forEach(key => {
            this.removeItem(key);
        });
    }
};