const fs = require('fs');
const path = require('path');

function getAllFiles(dir) {
  let files = [];
  try {
    fs.readdirSync(dir).forEach(f => {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) files = files.concat(getAllFiles(full));
      else if (f.endsWith('.js')) files.push(full);
    });
  } catch(e) {}
  return files;
}

const builtins = new Set(require('module').builtinModules);
const pkgJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const installed = new Set([
  ...Object.keys(pkgJson.dependencies || {}),
  ...Object.keys(pkgJson.devDependencies || {}),
]);

const missing = new Set();
getAllFiles('./src').forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const re = /require\(['"]([^.\/'][^'"]*)['"]\)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const pkg = m[1].split('/')[0].replace(/^@[^/]+\/[^/]+/, m[1].startsWith('@') ? m[1].split('/').slice(0,2).join('/') : m[1].split('/')[0]);
    if (!builtins.has(pkg) && !installed.has(pkg)) {
      missing.add(pkg);
    }
  }
});

if (missing.size === 0) {
  console.log('All packages are installed!');
} else {
  console.log('Missing packages:');
  missing.forEach(p => console.log(' -', p));
  console.log('\nInstall with:');
  console.log('npm install ' + [...missing].join(' '));
}
