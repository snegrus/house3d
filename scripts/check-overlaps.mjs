import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const repoRoot = process.cwd();
const sampleHousePath = path.join(repoRoot, "src", "sampleHouse.ts");
const source = fs.readFileSync(sampleHousePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: sampleHousePath,
}).outputText;

const module = { exports: {} };
const context = vm.createContext({
  module,
  exports: module.exports,
  require: () => {
    throw new Error("Runtime imports are not supported in this checker.");
  },
  __dirname: path.dirname(sampleHousePath),
  __filename: sampleHousePath,
  console,
});
new vm.Script(transpiled, { filename: sampleHousePath }).runInContext(context);
const { sampleHouse } = module.exports;

const floor = sampleHouse.floors.find((item) => item.id === "ground-floor");
if (!floor) throw new Error("Ground floor not found.");

const pillars = floor.objects.filter((object) => /^p\d+$/.test(object.id));
const walls = floor.walls;

const tol = 1e-6;
const issues = [];

for (const wall of walls) {
  if (wall.thickness !== 30) continue;
  const horizontal = Math.abs(wall.from.y - wall.to.y) < tol;
  const vertical = Math.abs(wall.from.x - wall.to.x) < tol;
  if (!horizontal && !vertical) continue;

  for (const pillar of pillars) {
    const pillarMinX = pillar.position.x - pillar.size.x / 2;
    const pillarMaxX = pillar.position.x + pillar.size.x / 2;
    const pillarMinY = pillar.position.y - pillar.size.y / 2;
    const pillarMaxY = pillar.position.y + pillar.size.y / 2;

    if (horizontal) {
      const wallMinX = Math.min(wall.from.x, wall.to.x);
      const wallMaxX = Math.max(wall.from.x, wall.to.x);
      const wallMinY = wall.from.y - wall.thickness / 2;
      const wallMaxY = wall.from.y + wall.thickness / 2;
      const overlapX = Math.min(wallMaxX, pillarMaxX) - Math.max(wallMinX, pillarMinX);
      const overlapY = Math.min(wallMaxY, pillarMaxY) - Math.max(wallMinY, pillarMinY);
      if (overlapX > tol && overlapY > tol) {
        const touchesAtFace =
          Math.abs(wallMinX - pillarMaxX) < tol || Math.abs(wallMaxX - pillarMinX) < tol;
        if (!touchesAtFace) {
          issues.push(
            `wall-pillar overlap: ${wall.id} intersects ${pillar.id} by ${overlapX.toFixed(2)} x ${overlapY.toFixed(2)} at y=${wall.from.y}`,
          );
        }
      }
    }

    if (vertical) {
      const wallMinX = wall.from.x - wall.thickness / 2;
      const wallMaxX = wall.from.x + wall.thickness / 2;
      const wallMinY = Math.min(wall.from.y, wall.to.y);
      const wallMaxY = Math.max(wall.from.y, wall.to.y);
      const overlapX = Math.min(wallMaxX, pillarMaxX) - Math.max(wallMinX, pillarMinX);
      const overlapY = Math.min(wallMaxY, pillarMaxY) - Math.max(wallMinY, pillarMinY);
      if (overlapX > tol && overlapY > tol) {
        const touchesAtFace =
          Math.abs(wallMinY - pillarMaxY) < tol || Math.abs(wallMaxY - pillarMinY) < tol;
        if (!touchesAtFace) {
          issues.push(
            `wall-pillar overlap: ${wall.id} intersects ${pillar.id} by ${overlapX.toFixed(2)} x ${overlapY.toFixed(2)} at x=${wall.from.x}`,
          );
        }
      }
    }
  }
}

for (let i = 0; i < walls.length; i += 1) {
  for (let j = i + 1; j < walls.length; j += 1) {
    const a = walls[i];
    const b = walls[j];
    if (a.thickness !== 30 || b.thickness !== 30) continue;
    const ah = Math.abs(a.from.y - a.to.y) < tol;
    const av = Math.abs(a.from.x - a.to.x) < tol;
    const bh = Math.abs(b.from.y - b.to.y) < tol;
    const bv = Math.abs(b.from.x - b.to.x) < tol;
    if ((ah && bh) || (av && bv) || !(ah || av) || !(bh || bv)) continue;

    const h = ah ? a : b;
    const v = av ? a : b;
    const hMinX = Math.min(h.from.x, h.to.x);
    const hMaxX = Math.max(h.from.x, h.to.x);
    const vMinY = Math.min(v.from.y, v.to.y);
    const vMaxY = Math.max(v.from.y, v.to.y);
    const hBandMinY = h.from.y - h.thickness / 2;
    const hBandMaxY = h.from.y + h.thickness / 2;
    const vBandMinX = v.from.x - v.thickness / 2;
    const vBandMaxX = v.from.x + v.thickness / 2;
    const overlapX = Math.min(hMaxX, vBandMaxX) - Math.max(hMinX, vBandMinX);
    const overlapY = Math.min(vMaxY, hBandMaxY) - Math.max(vMinY, hBandMinY);

    if (overlapX > tol && overlapY > tol) {
      const pillar = pillars.find((item) => Math.abs(item.position.x - v.from.x) < tol && Math.abs(item.position.y - h.from.y) < tol);
      if (!pillar) {
        issues.push(
          `wall-wall overlap without pillar: ${a.id} x ${b.id} overlap ${overlapX.toFixed(2)} x ${overlapY.toFixed(2)}`,
        );
      }
    }
  }
}

if (issues.length === 0) {
  console.log("No wall/pillar overlap issues found.");
} else {
  console.log(issues.join("\n"));
  process.exitCode = 1;
}
