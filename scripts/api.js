const API = {
    TRIVIA_BASE_URL: 'https://opentdb.com',
    QUOTES_BASE_URL: 'https://api.allorigins.win/raw?url=',

    async fetchWithTimeout(url, timeout = 8000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please try again');
            }
            throw error;
        }
    },

    async getQuizCategories() {
        try {
            const url = `${this.TRIVIA_BASE_URL}/api_category.php`;
            const data = await this.fetchWithTimeout(url);
            return {
                success: true,
                categories: data.trivia_categories || []
            };
        } catch (error) {
            console.error('Error fetching categories:', error);
            return {
                success: false,
                error: error.message,
                categories: []
            };
        }
    },

    async getQuizQuestions(options = {}) {
        try {
            const {
                amount = 10,
                category = '',
                difficulty = '',
                type = ''
            } = options;

            let url = `${this.TRIVIA_BASE_URL}/api.php?amount=${amount}`;
            
            if (category) url += `&category=${category}`;
            if (difficulty) url += `&difficulty=${difficulty}`;
            if (type) url += `&type=${type}`;

            const data = await this.fetchWithTimeout(url);

            if (data.response_code !== 0) {
                throw new Error('No questions available for these settings');
            }

            return {
                success: true,
                questions: data.results || []
            };
        } catch (error) {
            console.error('Error fetching questions:', error);
            return {
                success: false,
                error: error.message,
                questions: []
            };
        }
    },

    async getDailyQuote() {
        try {
            const zenQuotesUrl = encodeURIComponent('https://zenquotes.io/api/today');
            const url = `${this.QUOTES_BASE_URL}${zenQuotesUrl}`;
            const data = await this.fetchWithTimeout(url);

            if (data && data.length > 0) {
                return {
                    success: true,
                    quote: data[0].q,
                    author: data[0].a
                };
            }

            throw new Error('No quote available');
        } catch (error) {
            console.error('Error fetching daily quote:', error);
            return {
                success: false,
                error: error.message,
                quote: 'Stay focused and keep learning!',
                author: 'Studify'
            };
        }
    },

    async getRandomQuotes(count = 5) {
        try {
            const quotableUrl = `https://api.quotable.io/quotes/random?limit=${count}&tags=education|wisdom|inspirational`;
            const data = await this.fetchWithTimeout(quotableUrl);

            if (data && data.length > 0) {
                return {
                    success: true,
                    quotes: data.map(q => ({
                        text: q.content,
                        author: q.author
                    }))
                };
            }

            throw new Error('No quotes available');
        } catch (error) {
            console.error('Error fetching random quotes:', error);
            return {
                success: false,
                error: error.message,
                quotes: []
            };
        }
    }
};