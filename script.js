
        const generateButton = document.getElementById('generateButton');
        const progressBar = document.getElementById('progressBar');
        const progress = document.getElementById('progress');
        const consoleElement = document.getElementById('console');

        generateButton.addEventListener('click', generateAnimeCalendar);

        function logToConsole(message) {
            consoleElement.innerHTML += message + '<br>';
            consoleElement.scrollTop = consoleElement.scrollHeight; // Auto-scroll to the bottom
        }

        function updateProgress(percent) {
            progress.style.width = percent + '%';
            progress.innerText = Math.round(percent) + '%';
        }

        function getUserTimezone() {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        }

        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function fetchAnimeSchedules(day) {
            const response = await fetch(`https://api.jikan.moe/v4/schedules?filter=${day}`);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data.data;
        }

        function getNextAiringDate(weekday, today) {
            const daysUntilNext = (7 + weekday - today.getDay()) % 7;
            return new Date(today.getFullYear(), today.getMonth(), today.getDate() + (daysUntilNext || 7), 0, 0, 0);
        }

        async function generateAnimeCalendar() {
            consoleElement.innerHTML = '';  // Clear the console
            const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const timezone = getUserTimezone();  // Detect user's timezone
            logToConsole(`Detected timezone: ${timezone}`);
            let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AnimeSchedule//EN\n`;

            const today = new Date();

            for (let i = 0; i < daysOfWeek.length; i++) {
                const day = daysOfWeek[i];
                try {
                    const animeList = await fetchAnimeSchedules(day);  // Fetch anime schedule for the day

                    animeList.forEach(anime => {
                        const title = anime.title;
                        const airingTime = anime.broadcast.time;  // Example: "01:00"

                        // If airingTime is available, use it; else skip this anime
                        if (airingTime) {
                            const animeDate = getNextAiringDate(i, today);
                            animeDate.setHours(parseInt(airingTime.split(':')[0]), parseInt(airingTime.split(':')[1]));

                            const icsDate = `${animeDate.getFullYear()}${pad(animeDate.getMonth() + 1)}${pad(animeDate.getDate())}T${pad(animeDate.getHours())}${pad(animeDate.getMinutes())}00`;

                            icsContent += `BEGIN:VEVENT\nSUMMARY:${title}\nDTSTART;TZID=${timezone}:${icsDate}\nDESCRIPTION:Airing at ${airingTime} (${timezone})\nEND:VEVENT\n`;
                        }
                    });

                    logToConsole(`Successfully fetched schedule for: ${day}`);
                } catch (error) {
                    logToConsole(`Failed to fetch schedule for: ${day}. ${error.message}`);
                }

                updateProgress(((i + 1) / daysOfWeek.length) * 100);
                await delay(2000);  // Introduce a delay of 2 seconds between requests
            }

            icsContent += `END:VCALENDAR`;

            const blob = new Blob([icsContent], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'anime_schedule.ics';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            updateProgress(0);
            logToConsole('Anime calendar successfully generated and downloaded.');
        }

        function pad(num) {
            return num < 10 ? '0' + num : num;
        }
    
