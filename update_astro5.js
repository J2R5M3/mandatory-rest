const fs = require('fs');

const path = 'src/pages/s/[id].astro';
let content = fs.readFileSync(path, 'utf8');

// Replace the static server-side rendered string with a span that the JS can target
content = content.replace(
  '<p class="text-xs text-gray-400 mb-4">> LINK CREATED: {new Date(session.created_at).toLocaleString()}</p>',
  '<p class="text-xs text-gray-400 mb-4">> LINK CREATED: <span id="creation-time" data-created="{session.created_at}"></span></p>'
);

// Update the script to handle localization of that time
content = content.replace(
  "                updateTimer();",
  `
                // Localize creation time
                const creationSpan = document.getElementById('creation-time');
                const createdDate = new Date(creationSpan.getAttribute('data-created') + 'Z'); // Z forces UTC parse if missing
                creationSpan.innerText = createdDate.toLocaleString();

                updateTimer();`
);

fs.writeFileSync(path, content);
