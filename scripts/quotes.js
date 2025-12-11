const fallbackQuotes = [
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "Intelligence plus character—that is the goal of true education.", author: "Martin Luther King Jr." },
    { text: "Study while others are sleeping; work while others are loafing.", author: "William A. Ward" },
    { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
    { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
    { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
    { text: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.", author: "Abigail Adams" },
    { text: "Your attitude, not your aptitude, will determine your altitude.", author: "Zig Ziglar" },
    { text: "The only way to learn mathematics is to do mathematics.", author: "Paul Halmos" },
    { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Strive for progress, not perfection.", author: "Unknown" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" }
];

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

function getRandomFallbackQuotes(count = 6) {
    const shuffled = [...fallbackQuotes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

async function loadDailyQuote() {
    const textEl = document.getElementById('daily-quote-text');
    const authorEl = document.getElementById('daily-quote-author');

    const cachedQuote = localStorage.getItem('studify_daily_quote');
    const cachedDate = localStorage.getItem('studify_daily_quote_date');
    const today = new Date().toDateString();

    if (cachedQuote && cachedDate === today) {
        const quote = JSON.parse(cachedQuote);
        textEl.textContent = `"${quote.text}"`;
        authorEl.textContent = `— ${quote.author}`;
        return;
    }

    try {
        const result = await API.getDailyQuote();
        
        if (result.success) {
            textEl.textContent = `"${result.quote}"`;
            authorEl.textContent = `— ${result.author}`;
            
            localStorage.setItem('studify_daily_quote', JSON.stringify({
                text: result.quote,
                author: result.author
            }));
            localStorage.setItem('studify_daily_quote_date', today);
        } else {
            throw new Error('API failed');
        }
    } catch (error) {
        const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        textEl.textContent = `"${randomQuote.text}"`;
        authorEl.textContent = `— ${randomQuote.author}`;
        
        localStorage.setItem('studify_daily_quote', JSON.stringify(randomQuote));
        localStorage.setItem('studify_daily_quote_date', today);
    }
}

async function loadRandomQuotes() {
    const container = document.getElementById('quotes-grid');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading quotes...</p>
        </div>
    `;

    try {
        const result = await API.getRandomQuotes(6);
        
        if (result.success && result.quotes.length > 0) {
            displayQuotes(result.quotes);
        } else {
            throw new Error('API failed');
        }
    } catch (error) {
        console.log('Using fallback quotes');
        const quotes = getRandomFallbackQuotes(6);
        displayQuotes(quotes);
    }
}

function displayQuotes(quotes) {
    const container = document.getElementById('quotes-grid');
    
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    ];

    container.innerHTML = quotes.map((quote, index) => `
        <div class="card quote-display-card" style="background: ${colors[index % colors.length]}; color: white; cursor: default; transition: transform 0.3s, box-shadow 0.3s;" 
             onmouseover="this.style.transform='translateY(-5px) scale(1.02)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.2)'" 
             onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
            <p style="font-size: 1.05rem; font-style: italic; line-height: 1.6; margin-bottom: 16px; min-height: 80px; display: flex; align-items: center;">
                "${Utils.sanitizeHTML(quote.text)}"
            </p>
            <p style="text-align: right; opacity: 0.9; margin: 0; font-weight: 600;">
                — ${Utils.sanitizeHTML(quote.author)}
            </p>
        </div>
    `).join('');
}

function setupEventListeners() {
    document.getElementById('refresh-quotes-btn').addEventListener('click', async () => {
        const btn = document.getElementById('refresh-quotes-btn');
        const originalText = btn.textContent;
        btn.textContent = '🔄 Loading...';
        btn.disabled = true;

        await loadRandomQuotes();
        
        btn.textContent = originalText;
        btn.disabled = false;
        Utils.showToast('Quotes refreshed!', 'success');
    });

    document.getElementById('logout-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('studify_auth');
            localStorage.removeItem('studify_user');
            window.location.href = 'index.html';
        }
    });
}

async function initQuotes() {
    if (!checkAuthentication()) return;

    loadUserInfo();
    await loadDailyQuote();
    await loadRandomQuotes();
    setupEventListeners();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuotes);
} else {
    initQuotes();
}