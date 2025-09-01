const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'lib', 'translations.ts');
const s = fs.readFileSync(file, 'utf8');

function findObjectContent(src, marker) {
  const idx = src.indexOf(marker);
  if (idx === -1) return null;
  const start = src.indexOf('{', idx);
  let i = start + 1;
  let depth = 1;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth === 0) break;
    i++;
  }
  return src.slice(start + 1, i);
}

function extractKeys(objContent) {
  const keys = new Set();
  const lines = objContent.split(/\n/);
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    // match key: or key: `... or key: '...
    const m = line.match(/^([a-zA-Z0-9_]+)\s*:/);
    if (m) keys.add(m[1]);
  }
  return keys;
}

const arContent = findObjectContent(s, 'const arabicTranslations');
const kuContent = findObjectContent(s, 'const kurdishTranslations');
if (!arContent || !kuContent) {
  console.error('Could not find translations objects in file.');
  process.exit(2);
}
const arKeys = extractKeys(arContent);
const kuKeys = extractKeys(kuContent);

const missingInKu = [...arKeys].filter(k => !kuKeys.has(k)).sort();
const extraInKu = [...kuKeys].filter(k => !arKeys.has(k)).sort();

console.log('Arabic keys count:', arKeys.size);
console.log('Kurdish keys count:', kuKeys.size);
console.log('Missing in Kurdish:', missingInKu.length ? missingInKu.join(', ') : '(none)');
console.log('Extra in Kurdish:', extraInKu.length ? extraInKu.join(', ') : '(none)');

if (missingInKu.length) process.exit(1);
process.exit(0);
