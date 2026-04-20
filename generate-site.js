const fs = require('fs');
const path = require('path');

const talksData = require('./talks-data.json');

const eventStartTime = new Date();
eventStartTime.setHours(10, 0, 0, 0); // Event starts at 10:00 AM

const lunchBreakStartHour = 13; // 1 PM
const lunchBreakDurationMinutes = 60; // 1 hour

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function calculateSchedule() {
    let currentTime = new Date(eventStartTime);
    const schedule = [];
    let talkCounter = 0;

    for (let i = 0; i < talksData.length; i++) {
        const talk = talksData[i];
        
        // Check for lunch break
        if (currentTime.getHours() === lunchBreakStartHour && currentTime.getMinutes() === 0 && talkCounter === 2) {
            schedule.push({
                type: 'break',
                title: 'Lunch Break',
                startTime: formatTime(currentTime),
                endTime: formatTime(new Date(currentTime.getTime() + lunchBreakDurationMinutes * 60 * 1000)),
                duration_minutes: lunchBreakDurationMinutes
            });
            currentTime.setMinutes(currentTime.getMinutes() + lunchBreakDurationMinutes);
        }

        talkCounter++;
        const talkStartTime = new Date(currentTime);
        const talkEndTime = new Date(currentTime.getTime() + talk.duration_minutes * 60 * 1000);

        schedule.push({
            type: 'talk',
            ...talk,
            startTime: formatTime(talkStartTime),
            endTime: formatTime(talkEndTime),
        });
        currentTime.setMinutes(currentTime.getMinutes() + talk.duration_minutes);

        // Add transition time if not the last talk
        if (i < talksData.length - 1) {
            currentTime.setMinutes(currentTime.getMinutes() + 10); // 10 minute transition
        }
    }
    return schedule;
}

const schedule = calculateSchedule();

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tech Talks Event Schedule</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
            color: #333;
        }
        .container {
            max-width: 960px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #0056b3;
            text-align: center;
            margin-bottom: 30px;
        }
        .search-container {
            margin-bottom: 20px;
            text-align: center;
        }
        .search-container input {
            width: 80%;
            max-width: 400px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        .schedule-item {
            background-color: #e9ecef;
            border-left: 5px solid #007bff;
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 5px;
            transition: all 0.3s ease;
        }
        .schedule-item.break {
            border-left: 5px solid #ffc107;
            background-color: #fff3cd;
        }
        .schedule-item.hidden {
            display: none;
        }
        .talk-title {
            color: #0056b3;
            margin-top: 0;
            margin-bottom: 5px;
        }
        .talk-speakers {
            font-style: italic;
            color: #666;
            margin-bottom: 10px;
        }
        .talk-categories span {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 0.8em;
            margin-right: 5px;
            margin-bottom: 5px;
        }
        .talk-description {
            line-height: 1.6;
        }
        .time-slot {
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Tech Talks Event Schedule</h1>
        <div class="search-container">
            <input type="text" id="category-search" placeholder="Search by category...">
        </div>
        <div id="schedule-container">
            <!-- Schedule items will be injected here by JavaScript -->
        </div>
    </div>

    <script>
        const scheduleData = ${JSON.stringify(schedule, null, 2)};
        const scheduleContainer = document.getElementById('schedule-container');
        const categorySearchInput = document.getElementById('category-search');

        function renderSchedule(data) {
            scheduleContainer.innerHTML = ''; // Clear existing schedule
            data.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('schedule-item');
                
                let content = '';
                if (item.type === 'talk') {
                    itemDiv.dataset.categories = item.category.join(',').toLowerCase();
                    content = \`
                        <div class="time-slot">\${item.startTime} - \${item.endTime}</div>
                        <h2 class="talk-title">\${item.title}</h2>
                        <p class="talk-speakers">\${item.speakers.join(' and ')}</p>
                        <p class="talk-categories">
                            \${item.category.map(cat => \`<span>\${cat}</span>\`).join('')}
                        </p>
                        <p class="talk-description">\${item.description}</p>
                    \`;
                    } else if (item.type === 'break') {
                    itemDiv.classList.add('break');
                    content = \`
                        <div class="time-slot">\${item.startTime} - \${item.endTime}</div>
                        <h2 class="talk-title">\${item.title}</h2>
                        <p>Enjoy your \${item.duration_minutes}-minute break!</p>
                    \`;
                }
                itemDiv.innerHTML = content;
                scheduleContainer.appendChild(itemDiv);
            });
        }

        function filterSchedule() {
            const searchTerm = categorySearchInput.value.toLowerCase().trim();
            const items = document.querySelectorAll('.schedule-item[data-categories]');

            items.forEach(item => {
                const categories = item.dataset.categories;
                if (searchTerm === '' || categories.includes(searchTerm)) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        }

        // Initial render
        renderSchedule(scheduleData);

        // Event listener for search
        categorySearchInput.addEventListener('keyup', filterSchedule);
        categorySearchInput.addEventListener('change', filterSchedule); // For clearing input
    </script>
</body>
</html>
