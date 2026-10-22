// Projects Natural Earth (world-atlas 10m) for the map scene -> proj/assets/js/map-data.js
import fs from 'fs'; import path from 'path';
import { createRequire } from 'module';
const here = path.dirname(new URL(import.meta.url).pathname);
const require = createRequire(here + '/geo/');
const topo = require('topojson-client'); const d3 = await import(here + '/geo/node_modules/d3-geo/src/index.js');
const land = JSON.parse(fs.readFileSync(here + '/geo/node_modules/world-atlas/land-50m.json'));
const ctry = JSON.parse(fs.readFileSync(here + '/geo/node_modules/world-atlas/countries-50m.json'));
const W = 2560, H = 1440;
const proj = d3.geoConicConformal().parallels([46, 60]).rotate([-40, 0]).center([0, 53]);
// fit lon 14..66, lat 41..64
const fitObj = { type: 'MultiPoint', coordinates: [[14, 41], [66, 41], [14, 64], [66, 64], [40, 40], [40, 65]] };
proj.fitExtent([[0, 0], [W, H]], fitObj);
proj.clipExtent([[-200, -200], [W + 200, H + 200]]);
const p = d3.geoPath(proj); p.digits && p.digits(1);
const landF = topo.feature(land, land.objects.land);
const borders = topo.mesh(ctry, ctry.objects.countries, (a, b) => a !== b);
const r1 = (v) => Math.round(v * 10) / 10;
const pt = (lon, lat) => proj([lon, lat]).map(r1);
const out = {
  W, H, land: p(landF), borders: p(borders),
  cs: pt(23.63, 48.03), perm: pt(56.25, 58.01), budapest: pt(19.04, 47.5),
  ural: [[59.2, 51.6], [58.7, 53.6], [59.3, 55.6], [59.6, 57.4], [59.3, 59.2], [59.4, 61.0], [59.9, 62.8], [60.6, 64.4]].map(([a, b]) => pt(a, b)),
  names: { 'Венгрия': pt(19.4, 46.9), 'Украина': pt(31.5, 49.0), 'Польша': pt(19.8, 52.3), 'Беларусь': pt(28.0, 53.5), 'Румыния': pt(24.6, 45.7), 'Россия': pt(42.5, 55.2), 'Словакия': pt(19.5, 48.75) },
  carp: [[18.6, 49.5], [20.4, 49.3], [22.3, 49.1], [23.6, 48.7], [24.6, 48.2], [25.4, 47.5], [25.8, 46.6], [25.6, 45.8], [24.4, 45.5], [23.0, 45.4], [22.0, 45.2]].map(([a, b]) => pt(a, b)),
};
fs.writeFileSync(path.resolve(here, '../proj/assets/js/map-data.js'), 'window.MAP_DATA=' + JSON.stringify(out) + ';\n');
console.log('land', out.land.length, 'borders', out.borders.length, 'cs', out.cs, 'perm', out.perm, 'bud', out.budapest);
