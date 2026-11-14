const fs = require('fs');
const path = require('path');

const root = __dirname;
const skip = new Set(['node_modules', '.git', 'dist', 'uploads']);
const showEmpty = process.argv.includes('--empty');

const walk = (d, out = []) => {
  for (const n of fs.readdirSync(d)) {
    if (skip.has(n)) continue;
    const p = path.join(d, n);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push({ p, size: s.size });
  }
  return out;
};

const EXT = ['', '.js', '.jsx', '/index.js', '/index.jsx'];
const resolveFile = (from, spec) => {
  const base = path.resolve(path.dirname(from), spec);
  for (const e of EXT) {
    const c = base + e;
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
};

let problems = 0;

for (const side of ['client/src', 'server/src']) {
  const dir = path.join(root, side);
  if (!fs.existsSync(dir)) continue;
  const files = walk(dir).filter((f) => /\.(js|jsx|css)$/.test(f.p));
  const filled = files.filter((f) => f.size > 0);
  const empty = files.filter((f) => f.size === 0);

  console.log(`\n=== ${side}: ${filled.length} files with code, ${empty.length} empty`);
  console.log('--- FILES WITH CODE');
  filled.forEach((f) => console.log('  ', path.relative(root, f.p), `(${f.size} bytes)`));
  if (showEmpty) {
    console.log('--- EMPTY FILES');
    empty.forEach((f) => console.log('  ', path.relative(root, f.p)));
  }

  const crlf = filled.filter((f) => fs.readFileSync(f.p, 'utf8').includes('\r'));
  if (crlf.length) {
    problems += crlf.length;
    console.log(`--- ${crlf.length} files still have CRLF line endings (re-run the sed command)`);
  }

  console.log('--- BROKEN IMPORTS (missing or empty target)');
  let found = 0;
  for (const f of filled.filter((x) => /\.(js|jsx)$/.test(x.p))) {
    const src = fs.readFileSync(f.p, 'utf8');
    const specs = [];
    const re = /(?:from\s+|import\(\s*|require\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
    let m;
    while ((m = re.exec(src)) !== null) specs.push(m[1]);
    for (const s of specs) {
      if (/\.(css|svg|png|jpg)$/.test(s)) continue;
      const target = resolveFile(f.p, s);
      if (target === null) {
        found++; problems++;
        console.log(`  MISSING  ${path.relative(root, f.p)}  ->  ${s}`);
      } else if (fs.statSync(target).size === 0) {
        found++; problems++;
        console.log(`  EMPTY    ${path.relative(root, f.p)}  ->  ${s}`);
      }
    }
  }
  if (found === 0) console.log('  none');
}

console.log(`\nTotal problems found: ${problems}`);
