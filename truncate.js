const fs = require('fs');
const path = 'c:/Users/black/GAME/public/js/game.js';
const lines = fs.readFileSync(path, 'utf8').split('\n');
// Truncate at line 1912 (which is index 1912 in 0-based array? No, line 1 is index 0. Line 1912 is index 1911.)
// So we keep 1912 elements.
const newLines = lines.slice(0, 1912);
fs.writeFileSync(path, newLines.join('\n'));
console.log("Truncated game.js to 1912 lines.");
