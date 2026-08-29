import type { Module } from '../../types/storyboard';

export const foodChain: Module = {
  id: 'rantai-makanan',
  subjectId: 'ipas',
  grade: 5,
  semester: 1,
  title: 'Rantai Makanan',
  subtitle: 'Modul interaktif — aliran energi dari produsen hingga pengurai',
  summary:
    'Pelajari peran produsen, konsumen, dan pengurai dalam ekosistem, lalu susun rantai makanan lewat aktivitas drag & drop.',
  estimatedMinutes: '8-10 menit',
  accent: '#2E9E5B',
  frames: [
    {
      id: 'c1',
      kind: 'text',
      panel: '3.1',
      title: 'Siapa Makan Siapa?',
      note: 'Panel pembuka — kaitkan dengan pengalaman siswa mengamati alam',
      body:
        'Setiap makhluk hidup membutuhkan energi untuk bertahan hidup, dan energi itu berpindah dari satu organisme ke organisme lain lewat rantai makanan. Semuanya dimulai dari matahari, mengalir ke tumbuhan, lalu ke hewan pemakan tumbuhan, hingga hewan pemangsa di puncak rantai.',
      imageAlt: 'Padang rumput dengan berbagai hewan',
      imageQuery: 'savanna grassland animals ecosystem',
    },
    {
      id: 'c2',
      kind: 'dragdrop',
      panel: '3.2',
      title: 'Kelompokkan Peran dalam Ekosistem',
      note: 'Drag & drop — kelompokkan organisme sesuai perannya',
      instructions: 'Seret setiap organisme ke kelompok peran ekosistemnya yang tepat.',
      items: [
        { id: 'ci1', label: '🌾 Rumput', zoneId: 'zc1' },
        { id: 'ci2', label: '🌳 Pohon', zoneId: 'zc1' },
        { id: 'ci3', label: '🐇 Kelinci', zoneId: 'zc2' },
        { id: 'ci4', label: '🦌 Rusa', zoneId: 'zc2' },
        { id: 'ci5', label: '🦁 Singa', zoneId: 'zc3' },
        { id: 'ci6', label: '🍄 Jamur', zoneId: 'zc4' },
      ],
      zones: [
        { id: 'zc1', label: 'Produsen', hint: 'Menghasilkan makanan sendiri lewat fotosintesis' },
        { id: 'zc2', label: 'Konsumen Primer', hint: 'Pemakan tumbuhan (herbivora)' },
        { id: 'zc3', label: 'Konsumen Puncak', hint: 'Pemangsa di puncak rantai (karnivora)' },
        { id: 'zc4', label: 'Pengurai', hint: 'Menguraikan sisa organisme mati' },
      ],
    },
    {
      id: 'c3',
      kind: 'video',
      panel: '3.3',
      title: 'Video: Aliran Energi dalam Ekosistem',
      note: 'Interactive video — satu jeda untuk memeriksa pemahaman piramida energi',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      poster:
        'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200&q=80',
      markers: [
        {
          id: 'cm1',
          timeSec: 6,
          question: {
            id: 'cm1q',
            prompt: 'Mengapa jumlah energi berkurang di setiap tingkat rantai makanan?',
            options: [
              'Karena hewan di tingkat atas makan lebih sedikit',
              'Sebagian energi hilang sebagai panas di setiap perpindahan',
              'Karena tumbuhan menyimpan semua energi',
              'Energi bertambah di setiap tingkat',
            ],
            correctIndex: 1,
            explanation:
              'Setiap kali energi berpindah dari satu tingkat trofik ke tingkat berikutnya, sebagian besar terbuang sebagai panas melalui aktivitas metabolisme, sehingga jumlah energi yang tersedia semakin berkurang.',
          },
        },
      ],
    },
    {
      id: 'c4',
      kind: 'quiz',
      panel: '3.4',
      title: 'Kuis Akhir: Uji Pemahamanmu',
      note: 'Kuis penutup modul — 3 soal pilihan ganda',
      questions: [
        {
          id: 'cq1',
          prompt: 'Organisme yang menghasilkan makanannya sendiri disebut?',
          options: ['Konsumen', 'Produsen', 'Pengurai', 'Predator'],
          correctIndex: 1,
          explanation:
            'Produsen, seperti tumbuhan dan alga, menghasilkan makanan sendiri lewat fotosintesis menggunakan energi matahari.',
        },
        {
          id: 'cq2',
          prompt: 'Apa peran jamur dan bakteri dalam rantai makanan?',
          options: [
            'Sebagai konsumen puncak',
            'Sebagai produsen',
            'Menguraikan organisme mati menjadi nutrisi',
            'Menghasilkan oksigen utama',
          ],
          correctIndex: 2,
          explanation:
            'Pengurai seperti jamur dan bakteri memecah sisa organisme mati menjadi nutrisi yang kembali menyuburkan tanah.',
        },
        {
          id: 'cq3',
          prompt: 'Herbivora dalam rantai makanan berperan sebagai?',
          options: [
            'Produsen',
            'Konsumen primer',
            'Konsumen puncak',
            'Pengurai',
          ],
          correctIndex: 1,
          explanation:
            'Herbivora memakan tumbuhan secara langsung, sehingga disebut konsumen primer (tingkat trofik kedua).',
        },
      ],
    },
  ],
};
