import type { Module } from '../../types/storyboard';
import { coralReef } from './coralReef';
import { waterCycle } from './waterCycle';
import { foodChain } from './foodChain';
import { fractionsDecimals } from './fractionsDecimals';
import { figurativeLanguage } from './figurativeLanguage';
import { pillarsOfIslam } from './pillarsOfIslam';
import { bilanganCacah1000 } from './bilanganCacah1000';

// Registry of all learning modules available in the app, across all
// kelas/semester/mata pelajaran combinations.
// To add a new module: create a file in this folder following the `Module`
// shape (see src/types/storyboard.ts) — set `grade`, `semester`, and
// `subjectId` correctly — then add it to this array.
export const modules: Module[] = [
  coralReef,
  waterCycle,
  foodChain,
  fractionsDecimals,
  figurativeLanguage,
  pillarsOfIslam,
  bilanganCacah1000,
];

export function getModuleById(id: string | undefined): Module | undefined {
  return modules.find((m) => m.id === id);
}

/** Distinct grade levels that have at least one module, sorted ascending. */
export function getAvailableGrades(): number[] {
  return Array.from(new Set(modules.map((m) => m.grade))).sort((a, b) => a - b);
}

export function getModulesByGrade(grade: number): Module[] {
  return modules.filter((m) => m.grade === grade);
}

export function getModulesByGradeSemester(grade: number, semester: number): Module[] {
  return modules.filter((m) => m.grade === grade && m.semester === semester);
}

export function getModulesByGradeSemesterSubject(
  grade: number,
  semester: number,
  subjectId: string
): Module[] {
  return modules.filter(
    (m) => m.grade === grade && m.semester === semester && m.subjectId === subjectId
  );
}
