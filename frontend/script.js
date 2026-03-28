document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeToggleBtn = document.getElementById('theme-toggle');
    const inputTextArea = document.getElementById('input-text');
    const fileUpload = document.getElementById('file-upload');
    const clearBtn = document.getElementById('clear-btn');
    const summarizeBtn = document.getElementById('summarize-btn');
    const lengthSelect = document.getElementById('length-select');
    const toneSelect = document.getElementById('tone-select');
    
    const resultContainer = document.getElementById('result-container');
    const emptyState = document.querySelector('.empty-state');
    const loader = document.getElementById('loader');
    const summaryContent = document.getElementById('summary-content');
    
    const copyBtn = document.getElementById('copy-btn');
    const exportBtn = document.getElementById('export-btn');
    
    const historyContainer = document.getElementById('history-container');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // State
    const API_URL = '/summarize'; // Relative URL assuming frontend is served via backend on same port

    // Theme Management
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    };

    const updateThemeIcon = (theme) => {
        const icon = theme === 'dark' ? 'sun' : 'moon';
        themeToggleBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
        lucide.createIcons();
    };

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    initTheme();

    // History Management
    const loadHistory = () => {
        const history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
        historyContainer.innerHTML = '';
        
        if(history.length === 0) {
            historyContainer.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">No history found. Generate some summaries!</p>';
            return;
        }

        history.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div class="history-meta">
                    <span>${new Date(item.date).toLocaleDateString()}</span>
                    <div class="history-tags">
                        <span class="tag">${item.length}</span>
                        <span class="tag">${item.tone}</span>
                    </div>
                </div>
                <div class="history-preview">${item.summary}</div>
            `;
            // Clicking a history card restores it
            card.addEventListener('click', () => {
                inputTextArea.value = item.original;
                showSummaryContent(item.summary);
                lengthSelect.value = item.length;
                toneSelect.value = item.tone;
                // scroll up to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            historyContainer.appendChild(card);
        });
    };

    const saveToHistory = (original, summary, length, tone) => {
        const history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
        const newItem = {
            id: Date.now(),
            date: new Date().toISOString(),
            original,
            summary,
            length,
            tone
        };
        // Keep last 10
        history.unshift(newItem);
        if(history.length > 10) history.pop();
        
        localStorage.setItem('summaryHistory', JSON.stringify(history));
        loadHistory();
    };

    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('summaryHistory');
        loadHistory();
    });

    loadHistory();

    // Input Actions
    clearBtn.addEventListener('click', () => {
        inputTextArea.value = '';
    });

    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            inputTextArea.value = e.target.result;
        };
        reader.readAsText(file);
        // Reset file input
        fileUpload.value = '';
    });

    // Summarize Action
    const showLoadingState = () => {
        resultContainer.classList.remove('empty');
        emptyState.classList.add('hidden');
        summaryContent.classList.add('hidden');
        loader.classList.remove('hidden');
        summarizeBtn.disabled = true;
        summarizeBtn.innerHTML = '<i class="lucide-loader" data-lucide="loader-2" style="animation: spin 1s linear infinite;"></i> <span>Processing...</span>';
        lucide.createIcons();
    };

    const showSummaryContent = (text) => {
        resultContainer.classList.remove('empty');
        loader.classList.add('hidden');
        emptyState.classList.add('hidden');
        
        // Render content (use marked if markdown, else innerText for security against XSS)
        // Gemini often returns bullet points or bold text, so simple replace \n with <br> and ** with strong could work, 
        // but for simplicity and safety, we will just use HTML encoding and format simple Markdown.
        let formattedText = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
            
        // Basic Markdown bold replacement
        formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Basic newlines
        formattedText = formattedText.replace(/\n/g, '<br>');

        summaryContent.innerHTML = formattedText;
        summaryContent.classList.remove('hidden');
        
        summarizeBtn.disabled = false;
        summarizeBtn.innerHTML = '<i data-lucide="zap"></i> <span>Generate Summary</span>';
        lucide.createIcons();

        // Enable action buttons
        copyBtn.disabled = false;
        exportBtn.disabled = false;
    };

    const triggerSummarize = async () => {
        const text = inputTextArea.value.trim();
        if(!text) {
            alert("Please enter some text to summarize.");
            return;
        }

        const length = lengthSelect.value;
        const tone = toneSelect.value;

        showLoadingState();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text, length, tone })
            });

            if(!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const summary = data.summary;

            showSummaryContent(summary);
            saveToHistory(text, summary, length, tone);

        } catch (error) {
            console.error("Error generating summary:", error);
            alert("Failed to generate summary. Make sure the backend is running and API keys are set.");
            
            // Reset state
            summarizeBtn.disabled = false;
            summarizeBtn.innerHTML = '<i data-lucide="zap"></i> <span>Generate Summary</span>';
            lucide.createIcons();
            
            emptyState.classList.remove('hidden');
            loader.classList.add('hidden');
            resultContainer.classList.add('empty');
        }
    };

    summarizeBtn.addEventListener('click', triggerSummarize);

    // Export & Copy Actions
    copyBtn.addEventListener('click', () => {
        const textToCopy = summaryContent.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i data-lucide="check" style="color: #22c55e;"></i>';
            lucide.createIcons();
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
            }, 2000);
        });
    });

    exportBtn.addEventListener('click', () => {
        const textToExport = summaryContent.innerText;
        const blob = new Blob([textToExport], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Summary_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });

});
