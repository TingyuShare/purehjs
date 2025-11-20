document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date-input');
    const nowBtn = document.getElementById('now-btn');
    const outputContainer = document.getElementById('output-container');

    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }

    function renderResults(date) {
        outputContainer.innerHTML = '';

        if (isNaN(date.getTime())) {
            outputContainer.innerHTML = '<p>Invalid date. Please try a different format (e.g., "2023-01-01", "1672531200", "next tuesday").</p>';
            return;
        }

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // --- Common Formats ---
        const formatsCard = document.createElement('div');
        formatsCard.className = 'output-card';
        formatsCard.innerHTML = `
            <h3>Common Formats</h3>
            <p><span>ISO 8601 (UTC)</span> <span>${date.toISOString()}</span></p>
            <p><span>RFC 2822</span> <span>${date.toUTCString()}</span></p>
            <p><span>Short (en-US)</span> <span>${date.toLocaleDateString('en-US')}</span></p>
            <p><span>Long (en-US)</span> <span>${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
            <p><span>Full (Local)</span> <span>${date.toString()}</span></p>
        `;
        outputContainer.appendChild(formatsCard);

        // --- Timestamps ---
        const timestampsCard = document.createElement('div');
        timestampsCard.className = 'output-card';
        timestampsCard.innerHTML = `
            <h3>Timestamps</h3>
            <p><span>Unix (seconds)</span> <span>${Math.floor(date.getTime() / 1000)}</span></p>
            <p><span>Unix (milliseconds)</span> <span>${date.getTime()}</span></p>
        `;
        outputContainer.appendChild(timestampsCard);

        // --- Date Components ---
        const componentsCard = document.createElement('div');
        componentsCard.className = 'output-card';
        componentsCard.innerHTML = `
            <h3>Date Components (UTC)</h3>
            <p><span>Year</span> <span>${date.getUTCFullYear()}</span></p>
            <p><span>Month</span> <span>${date.getUTCMonth() + 1}</span></p>
            <p><span>Day of Month</span> <span>${date.getUTCDate()}</span></p>
            <p><span>Day of Week</span> <span>${date.getUTCDay()} (${dayNames[date.getUTCDay()]})</span></p>
            <p><span>Day of Year</span> <span>${Math.floor((date - new Date(date.getUTCFullYear(), 0, 0)) / 86400000)}</span></p>
            <p><span>Week of Year</span> <span>${getWeekNumber(date)}</span></p>
            <p><span>Hour</span> <span>${date.getUTCHours()}</span></p>
            <p><span>Minute</span> <span>${date.getUTCMinutes()}</span></p>
            <p><span>Second</span> <span>${date.getUTCSeconds()}</span></p>
        `;
        outputContainer.appendChild(componentsCard);
    }

    function updateDateTime() {
        const value = dateInput.value.trim();
        let date;

        if (value === '') {
            date = new Date();
        } else if (!isNaN(value) && value.length >= 10) {
            // Treat as timestamp. If 10 digits, it's likely seconds.
            const numValue = Number(value);
            date = new Date(numValue * (value.length === 10 ? 1000 : 1));
        } else {
            date = new Date(value);
        }
        renderResults(date);
    }

    nowBtn.addEventListener('click', () => {
        dateInput.value = '';
        updateDateTime();
    });

    dateInput.addEventListener('input', updateDateTime);

    // Initial render
    updateDateTime();
});
