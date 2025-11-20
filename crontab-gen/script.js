document.addEventListener('DOMContentLoaded', () => {
    const inputs = {
        minute: document.getElementById('minute'),
        hour: document.getElementById('hour'),
        dayMonth: document.getElementById('day-month'),
        month: document.getElementById('month'),
        dayWeek: document.getElementById('day-week'),
        command: document.getElementById('command')
    };

    const cronStringOutput = document.getElementById('cron-string');
    const cronExplanationOutput = document.getElementById('cron-explanation');
    const cronTimesOutput = document.getElementById('cron-times');

    function parseCronPart(value, min, max) {
        const results = new Set();
        if (value === '*') {
            for (let i = min; i <= max; i++) results.add(i);
            return results;
        }

        const parts = value.split(',');
        for (const part of parts) {
            if (part.startsWith('*/')) {
                const step = parseInt(part.substring(2), 10);
                for (let i = min; i <= max; i += step) results.add(i);
            } else if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                for (let i = start; i <= end; i++) results.add(i);
            } else {
                results.add(parseInt(part, 10));
            }
        }
        return results;
    }

    function getNextDates(cronParts, count) {
        const schedule = {
            minute: parseCronPart(cronParts.minute, 0, 59),
            hour: parseCronPart(cronParts.hour, 0, 23),
            dayOfMonth: parseCronPart(cronParts.dayMonth, 1, 31),
            month: parseCronPart(cronParts.month, 1, 12),
            dayOfWeek: parseCronPart(cronParts.dayWeek, 0, 6)
        };
        // Cron standard: 7 is also Sunday
        if (schedule.dayOfWeek.has(7)) schedule.dayOfWeek.add(0);

        const results = [];
        let date = new Date();
        date.setSeconds(0, 0);

        for (let i = 0; i < 100000 && results.length < count; i++) {
            date.setMinutes(date.getMinutes() + 1);

            if (!schedule.month.has(date.getMonth() + 1)) continue;
            if (!schedule.hour.has(date.getHours())) continue;
            if (!schedule.minute.has(date.getMinutes())) continue;

            const dayOfMonthMatch = schedule.dayOfMonth.has(date.getDate());
            const dayOfWeekMatch = schedule.dayOfWeek.has(date.getDay());

            if (cronParts.dayMonth === '*' || cronParts.dayWeek === '*') {
                if (!dayOfMonthMatch || !dayOfWeekMatch) continue;
            } else {
                if (!dayOfMonthMatch && !dayOfWeekMatch) continue;
            }

            results.push(new Date(date));
        }
        return results;
    }

    function getPartExplanation(value, singular, plural) {
        if (value === '*') return `every ${singular}`;
        if (value.startsWith('*/')) return `every ${value.substring(2)} ${plural}`;
        if (value.includes(',')) return `at ${singular}(s) ${value}`;
        if (value.includes('-')) {
            const [start, end] = value.split('-');
            return `from ${singular} ${start} through ${end}`;
        }
        return `at ${singular} ${value}`;
    }

    function generateCron() {
        const cronParts = {
            minute: inputs.minute.value || '*',
            hour: inputs.hour.value || '*',
            dayMonth: inputs.dayMonth.value || '*',
            month: inputs.month.value || '*',
            dayWeek: inputs.dayWeek.value || '*',
            command: inputs.command.value || ''
        };

        // Generate Cron String
        cronStringOutput.textContent = `${cronParts.minute} ${cronParts.hour} ${cronParts.dayMonth} ${cronParts.month} ${cronParts.dayWeek} ${cronParts.command}`;

        // Generate Explanation
        let explanation = 'At ';
        explanation += getPartExplanation(cronParts.minute, 'minute', 'minutes');
        explanation += (cronParts.hour !== '*') ? ' past ' : ', ';
        explanation += getPartExplanation(cronParts.hour, 'hour', 'hours');

        if (cronParts.dayMonth !== '*' && cronParts.dayWeek !== '*') {
             explanation += `, on day-of-month ${cronParts.dayMonth}, and on day-of-week ${cronParts.dayWeek}`;
        } else if (cronParts.dayMonth !== '*') {
            explanation += `, on day-of-month ${cronParts.dayMonth}`;
        } else if (cronParts.dayWeek !== '*') {
            explanation += `, only on ${getPartExplanation(cronParts.dayWeek, 'day-of-week', 'days-of-week')}`;
        }

        if (cronParts.month !== '*') {
            explanation += `, in ${getPartExplanation(cronParts.month, 'month', 'months')}`;
        }
        
        cronExplanationOutput.textContent = explanation + '.';

        // Calculate and display next 5 times
        try {
            const nextDates = getNextDates(cronParts, 5);
            cronTimesOutput.innerHTML = nextDates.map(d => `<div>${d.toLocaleString()}</div>`).join('');
        } catch (e) {
            cronTimesOutput.textContent = 'Could not calculate next run times from this expression.';
        }
    }

    for (const key in inputs) {
        inputs[key].addEventListener('input', generateCron);
    }

    generateCron();
});
