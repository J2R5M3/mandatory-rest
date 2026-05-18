const fs = require('fs');

const path = 'src/pages/s/[id].astro';
let content = fs.readFileSync(path, 'utf8');

// The user asked: "every page following configuration should have the generated shareable link prominently displayed in centre of the page with the reminder to share the link with anyone you want to involve in the configured event."
// I will add a script to construct the URL dynamically or inject it via Astro.url

content = content.replace(
  '<div class="mb-8">\n            <h3 class="text-xs font-bold uppercase text-gray-400 mb-4 border-b-2 border-gray-800 pb-2">Locked In [{participants.results.length}]:</h3>',
  `<div class="mb-8 p-4 border-2 border-dashed border-blue-600 bg-blue-950/20 text-center">
            <p class="text-xs text-blue-400 font-bold uppercase mb-2">Share This Link To Involve Others</p>
            <div class="bg-black border border-blue-800 p-3 flex items-center justify-between">
                <code class="text-sm text-blue-300 break-all" id="share-link">...</code>
                <button onclick="navigator.clipboard.writeText(document.getElementById('share-link').innerText); this.innerText='[COPIED!]'; setTimeout(() => this.innerText='[COPY]', 2000);" class="ml-4 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-3 transition-colors uppercase">
                    [Copy]
                </button>
            </div>
            <script>
                document.getElementById('share-link').innerText = window.location.href;
            </script>
        </div>

        <div class="mb-8">
            <h3 class="text-xs font-bold uppercase text-gray-400 mb-4 border-b-2 border-gray-800 pb-2">Locked In [{participants.results.length}]:</h3>`
);

fs.writeFileSync(path, content);
