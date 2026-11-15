// raw .glb -> web-ready .glb: true scale in metres, upright, sitting on the ground, simplified, meshopt-compressed
// usage: node post.mjs raw.glb out.glb [simplifyRatio=0.3]
import fs from 'node:fs';
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, simplifyPrimitive, dedup, prune, join, flatten, meshopt } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';

const [inPath, outPath, ratioArg, errArg] = process.argv.slice(2);
const ratio = Number(ratioArg || 0.3), maxErr = Number(errArg || 0.0008);
await MeshoptSimplifier.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(inPath);
const root = doc.getRoot(), scene = root.listScenes()[0];
const count = () => root.listMeshes().reduce((n, m) => n + m.listPrimitives().reduce((k, p) => k + (p.getIndices() ? p.getIndices().getCount() / 3 : 0), 0), 0);
const before = count();

// wrap everything in one node we can scale, rotate and move
let b = getBounds(scene);
const size = [0, 1, 2].map(k => b.max[k] - b.min[k]);
const unit = Math.max(...size) > 50 ? 0.001 : 1;             // mm vs m
const up = size.indexOf(Math.min(...size));                   // an aircraft is shortest top to bottom
const s = Math.SQRT1_2;
const wrap = doc.createNode('model');
for (const n of scene.listChildren()) { scene.removeChild(n); wrap.addChild(n); }
scene.addChild(wrap);
wrap.setScale([unit, unit, unit]);
if (up === 2) wrap.setRotation([-s, 0, 0, s]); else if (up === 0) wrap.setRotation([0, 0, s, s]);
b = getBounds(scene);                                         // re-measure after scale + rotation, then centre on the ground
wrap.setTranslation([-(b.min[0] + b.max[0]) / 2, -b.min[1], -(b.min[2] + b.max[2]) / 2]);

for (const m of root.listMaterials()) { m.setDoubleSided(true); m.setMetallicFactor(Math.min(m.getMetallicFactor(), 0.1)); m.setRoughnessFactor(Math.max(m.getRoughnessFactor(), 0.45)); }

/* very dense vendor parts (bought-in motors, cameras) get simplified much harder than the airframe */
await doc.transform(weld());
const HEAVY = 30000, HEAVY_TARGET = 6000;
for (const mesh of root.listMeshes()) {
  const tris = mesh.listPrimitives().reduce((k, p) => k + (p.getIndices() ? p.getIndices().getCount() / 3 : 0), 0);
  if (tris <= HEAVY) continue;
  for (const prim of mesh.listPrimitives()) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: HEAVY_TARGET / tris, error: 0.02 });
  const now = mesh.listPrimitives().reduce((k, p) => k + (p.getIndices() ? p.getIndices().getCount() / 3 : 0), 0);
  console.log(`  heavy part "${mesh.getName()}": ${tris} -> ${now} triangles`);
}
await doc.transform(
  simplify({ simplifier: MeshoptSimplifier, ratio, error: maxErr }),
  dedup(), flatten(), join(), prune(),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' })
);
await io.write(outPath, doc);
const fb = getBounds(doc.getRoot().listScenes()[0]);
console.log(`${outPath}: ${before} -> ${count()} triangles, ${(fs.statSync(outPath).size / 1e6).toFixed(2)} MB, ${root.listMaterials().length} materials, size m`,
  [0, 1, 2].map(k => (fb.max[k] - fb.min[k]).toFixed(2)).join(' x '), `(up was ${'XYZ'[up]})`);
