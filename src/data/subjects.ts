import type { Subject } from '../types/storyboard';

// To add a new mata pelajaran: add an entry here, then set `subjectId`
// on any module in src/data/modules/*.ts to this subject's `id`.
export const subjects: Subject[] = [
  {
    id: 'ipas',
    name: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
    shortName: 'IPAS',
    description: 'Ekosistem, siklus alam, dan fenomena di sekitar kita.',
    icon: '🔬',
    accent: '#FF6F59',
  },
  {
    id: 'matematika',
    name: 'Matematika',
    shortName: 'Matematika',
    description: 'Bilangan, pola, dan pemecahan masalah lewat latihan interaktif.',
    icon: '➗',
    accent: '#5B5FEF',
  },
  {
    id: 'bahasa-indonesia',
    name: 'Bahasa Indonesia',
    shortName: 'B. Indonesia',
    description: 'Teks, kosakata, dan gaya bahasa lewat contoh dan latihan.',
    icon: '📖',
    accent: '#C1443C',
  },
  {
    id: 'pai',
    name: 'Pendidikan Agama Islam (PAI)',
    shortName: 'PAI',
    description: 'Rukun, akhlak, dan kisah teladan dalam ajaran Islam.',
    icon: '🕌',
    accent: '#0E7C61',
  },
];

export function getSubjectById(id: string | undefined): Subject | undefined {
  return subjects.find((s) => s.id === id);
}
