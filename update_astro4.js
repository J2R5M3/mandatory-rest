const fs = require('fs');

const path = 'src/pages/s/[id].astro';
let content = fs.readFileSync(path, 'utf8');

// Replace the existing timer box
content = content.replace(
  '<div class="my-8 p-6 border-4 border-red-900 bg-red-950/20 text-center">\n            <p class="text-xs uppercase tracking-widest text-red-400 mb-2 animate-pulse">Ticking Down To Execution</p>\n            <p class="text-2xl font-bold text-white tracking-widest">{session.timer_deadline}</p>\n        </div>',
  `<div class="my-8 p-6 border-4 border-red-900 bg-red-950/20 text-center">
            <p class="text-xs text-gray-400 mb-4">> LINK CREATED: {new Date(session.created_at).toLocaleString()}</p>
            <p class="text-xs uppercase tracking-widest text-red-400 mb-2 animate-pulse">Ticking Down To Execution</p>
            <p class="text-3xl font-bold text-white tracking-widest" id="countdown-timer" data-deadline={session.timer_deadline}>
                --:--:--
            </p>
            <script>
                function updateTimer() {
                    const el = document.getElementById('countdown-timer');
                    const deadline = new Date(el.getAttribute('data-deadline')).getTime();
                    const now = new Date().getTime();
                    const distance = deadline - now;

                    if (distance < 0) {
                        el.innerText = "EXECUTING...";
                        return;
                    }

                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    const pad = (n) => n.toString().padStart(2, '0');
                    el.innerText = \`\${days > 0 ? days + 'd ' : ''}\${pad(hours)}:\${pad(minutes)}:\${pad(seconds)}\`;
                }

                updateTimer();
                setInterval(updateTimer, 1000);
            </script>
        </div>`
);

fs.writeFileSync(path, content);
