import type { Module } from '../../types/storyboard';

export const figurativeLanguage: Module = {
  id: 'mengenal-majas',
  subjectId: 'bahasa-indonesia',
  grade: 6,
  semester: 1,
  title: 'Mengenal Majas',
  subtitle: 'Modul interaktif — memperkaya tulisan dengan gaya bahasa',
  summary:
    'Kenali majas metafora, personifikasi, hiperbola, dan simile lewat contoh kalimat, video, drag & drop, dan kuis.',
  estimatedMinutes: '10-12 menit',
  accent: '#C1443C',
  frames: [
    {
      id: 'b1',
      kind: 'text',
      panel: '5.1',
      title: 'Bahasa yang Lebih Hidup',
      note: 'Panel pembuka — tunjukkan bahwa majas ada di sekitar kita',
      body:
        'Majas adalah gaya bahasa yang digunakan untuk membuat kalimat lebih hidup dan bermakna, bukan sekadar penyampaian fakta datar. Penulis dan penyair sering menggunakan majas untuk melukiskan perasaan atau membuat gambaran yang lebih kuat di benak pembaca.',
      imageAlt: 'Buku puisi terbuka dengan pena',
      imageQuery: 'open poetry book pen writing',
    },
    {
      id: 'b2',
      kind: 'video',
      panel: '5.2',
      title: 'Video: Contoh-Contoh Majas',
      note: 'Interactive video — satu jeda untuk menebak jenis majas',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      poster:
        'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80',
      markers: [
        {
          id: 'bm1',
          timeSec: 6,
          question: {
            id: 'bm1q',
            prompt: 'Kalimat "Angin berbisik lembut di telinga malam" menggunakan majas?',
            options: ['Hiperbola', 'Personifikasi', 'Simile', 'Metafora'],
            correctIndex: 1,
            explanation:
              'Personifikasi memberi sifat manusia (berbisik) pada benda mati/alam (angin), sehingga tergolong personifikasi.',
          },
        },
      ],
    },
    {
      id: 'b3',
      kind: 'dragdrop',
      panel: '5.3',
      title: 'Kelompokkan Kalimat sesuai Jenis Majas',
      note: 'Drag & drop — cocokkan contoh kalimat dengan jenis majasnya',
      instructions: 'Seret setiap kalimat ke kelompok jenis majas yang sesuai.',
      items: [
        { id: 'bi1', label: '"Dia secepat kilat berlari"', zoneId: 'zb1' },
        { id: 'bi2', label: '"Bagaikan pinang dibelah dua"', zoneId: 'zb1' },
        { id: 'bi3', label: '"Hatinya sekeras batu"', zoneId: 'zb2' },
        { id: 'bi4', label: '"Dia adalah bintang kelas"', zoneId: 'zb2' },
        { id: 'bi5', label: '"Air matanya membanjiri ruangan"', zoneId: 'zb3' },
        { id: 'bi6', label: '"Suaranya menggelegar sekeras petir"', zoneId: 'zb3' },
      ],
      zones: [
        { id: 'zb1', label: 'Simile', hint: 'Perbandingan eksplisit — pakai kata "bagai", "seperti", "secepat"' },
        { id: 'zb2', label: 'Metafora', hint: 'Perbandingan langsung tanpa kata penghubung' },
        { id: 'zb3', label: 'Hiperbola', hint: 'Melebih-lebihkan sesuatu' },
      ],
    },
    {
      id: 'b4',
      kind: 'quiz',
      panel: '5.4',
      title: 'Kuis Akhir: Uji Pemahamanmu',
      note: 'Kuis penutup modul — 3 soal pilihan ganda',
      questions: [
        {
          id: 'bq1',
          prompt: 'Majas yang memberi sifat manusia pada benda mati disebut?',
          options: ['Metafora', 'Personifikasi', 'Simile', 'Ironi'],
          correctIndex: 1,
          explanation: 'Personifikasi adalah majas yang memberikan sifat atau perilaku manusia pada benda mati.',
        },
        {
          id: 'bq2',
          prompt: 'Kalimat "Suaranya merdu bagai buluh perindu" adalah contoh majas?',
          options: ['Hiperbola', 'Personifikasi', 'Simile', 'Metafora'],
          correctIndex: 2,
          explanation: 'Kalimat ini memakai kata "bagai" untuk membandingkan secara eksplisit, ciri khas simile.',
        },
        {
          id: 'bq3',
          prompt: 'Ciri utama majas hiperbola adalah?',
          options: [
            'Membandingkan dua hal secara langsung',
            'Melebih-lebihkan suatu keadaan',
            'Memberi sifat manusia pada benda',
            'Menggunakan kata "bagai" atau "seperti"',
          ],
          correctIndex: 1,
          explanation: 'Hiperbola digunakan untuk melebih-lebihkan sesuatu agar kesannya lebih kuat/dramatis.',
        },
      ],
    },
  ],
};
