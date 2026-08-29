export interface Grade {
  level: number;
  label: string;
}

// Elementary school (SD) grade levels. Extend this if you need SMP/SMA levels too.
export const grades: Grade[] = [
  { level: 1, label: 'Kelas 1' },
  { level: 2, label: 'Kelas 2' },
  { level: 3, label: 'Kelas 3' },
  { level: 4, label: 'Kelas 4' },
  { level: 5, label: 'Kelas 5' },
  { level: 6, label: 'Kelas 6' },
];

export const semesters = [
  { value: 1 as const, label: 'Semester 1', hint: 'Juli – Desember' },
  { value: 2 as const, label: 'Semester 2', hint: 'Januari – Juni' },
];
