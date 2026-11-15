const fs = require('fs');
const path = require('path');

const srv = path.join(__dirname, 'server', 'src');
const filter = process.argv[2] || '';
const app = fs.readFileSync(path.join(srv, 'app.js'), 'utf8');

const mounts = {};
const mountRe = /app\.use\(\s*'(\/api\/[^']+)'\s*,\s*require\('\.\/routes\/([^']+)'\)/g;
let m;
while ((m = mountRe.exec(app)) !== null) {
  mounts[m[2]] = m[1];
}

const squash = (s) => s.replace(/\s+/g, ' ').trim();
let out = '';
const log = (s) => {
  out += s + '\n';
};

for (const [file, prefix] of Object.entries(mounts)) {
  if (filter && !prefix.includes(filter)) {
    continue;
  }
  const routePath = path.join(srv, 'routes', file + '.js');
  if (!fs.existsSync(routePath)) {
    log('MISSING ROUTE FILE ' + file);
    continue;
  }
  const routeSrc = fs.readFileSync(routePath, 'utf8');
  log('\n##### ' + prefix + '   (' + file + '.js)');

  const ctrlMatch = routeSrc.match(/require\('\.\.\/controllers\/([^']+)'\)/);
  const ctrlName = ctrlMatch ? ctrlMatch[1] : null;
  const ctrlPath = ctrlName ? path.join(srv, 'controllers', ctrlName + '.js') : null;
  const ctrlSrc = ctrlPath && fs.existsSync(ctrlPath) ? fs.readFileSync(ctrlPath, 'utf8') : '';

  const chunks = {};
  ctrlSrc
    .split(/\nexports\./)
    .slice(1)
    .forEach((p) => {
      chunks[p.split(/\s|=/)[0]] = p;
    });

  const routeRe = /router\.(get|post|put|patch|delete)\(\s*'([^']*)'([\s\S]*?)\n?\);/g;
  let r;
  while ((r = routeRe.exec(routeSrc)) !== null) {
    const args = r[3];
    const rolesMatch = args.match(/authorizeRoles\(([^)]*)\)/);
    const roles = rolesMatch ? rolesMatch[1] : null;
    const fns = [...args.matchAll(/([A-Za-z]+)\.([A-Za-z]+)(?=\s*,|\s*$|\s*\))/g)].map((x) => x[2]);
    const fn = fns[fns.length - 1];

    log(
      '\n' +
        r[1].toUpperCase() +
        ' ' +
        prefix +
        (r[2] === '/' ? '' : r[2]) +
        (roles ? '   roles: ' + squash(roles) : '')
    );

    const body = chunks[fn];
    if (!body) {
      log('   handler: ' + fn + '  (not found in controller)');
      continue;
    }

    const queryNames = [...body.matchAll(/req\.query\.(\w+)/g)].map((x) => x[1]);
    const queryDestr = body.match(/const\s*\{([^}]*)\}\s*=\s*req\.query/);
    const bodyDestr = body.match(/const\s*\{([^}]*)\}\s*=\s*req\.body/);
    const bodyNames = [...body.matchAll(/req\.body\.(\w+)/g)].map((x) => x[1]);

    if (queryDestr) {
      log('   query: ' + squash(queryDestr[1]));
    } else if (queryNames.length) {
      log('   query: ' + [...new Set(queryNames)].join(', '));
    }
    if (bodyDestr) {
      log('   body: ' + squash(bodyDestr[1]));
    } else if (bodyNames.length) {
      log('   body: ' + [...new Set(bodyNames)].join(', '));
    }

    const lastJson = body.lastIndexOf('.json(');
    if (lastJson > -1) {
      log('   returns: ' + squash(body.slice(lastJson, lastJson + 420)));
    }
    if (/pagination|paginatedResponse|buildPaginationMeta/.test(body)) {
      log('   (paginated)');
    }
  }
}

const outFile = path.join(__dirname, 'api-map' + (filter ? '-' + filter : '') + '.txt');
fs.writeFileSync(outFile, out);
console.log(out);
