// Exports subjects, grades, semesters, and modules (with frames) from the
// existing TypeScript content files into a single JSON file that the
// backend's Prisma seed script consumes. Run this after editing any content
// in src/data/**, so the database seed stays in sync with the verified
// content.
//
// Usage: npx tsx scripts/export-content.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { subjects } from '../src/data/subjects';
import { grades, semesters } from '../src/data/grades';
import { modules } from '../src/data/modules';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const payload = {
  exportedAt: new Date().toISOString(),
  subjects,
  grades,
  semesters,
  modules,
};

const outPath = path.resolve(__dirname, '../backend/prisma/seed-data.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

const frameCount = modules.reduce((sum, m) => sum + m.frames.length, 0);
console.log(
  `Exported ${subjects.length} subjects, ${modules.length} modules, ${frameCount} frames -> ${outPath}`
);
