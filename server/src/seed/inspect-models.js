'use strict';

const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../models');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
const only = process.argv.slice(2);

files.forEach((f) => {
  const name = f.replace('.js', '');
  if (only.length && !only.includes(name)) return;
  try {
    const Model = require(path.join(dir, f));
    if (!Model || !Model.schema) return;
    const required = [];
    const enums = [];
    Model.schema.eachPath((p, type) => {
      if (type.isRequired) required.push(p);
      if (type.enumValues && type.enumValues.length) enums.push(`${p}: [${type.enumValues.join(', ')}]`);
    });
    console.log(`\n== ${name}`);
    console.log('  required:', required.join(', ') || '(none)');
    if (enums.length) console.log('  enums:', enums.join(' | '));
  } catch (e) {
    console.log(`\n== ${name} -> could not load: ${e.message}`);
  }
});
process.exit(0);
