import type { Module } from '../../types/storyboard';

export const fractionsDecimals: Module = {
  id: 'pecahan-desimal',
  subjectId: 'matematika',
  grade: 5,
  semester: 1,
  title: 'Pecahan dan Desimal',
  subtitle: 'Modul interaktif — mengubah pecahan menjadi bentuk desimal',
  summary:
    'Pahami hubungan pecahan dan desimal, lalu latihan mengonversi keduanya lewat video, drag & drop, dan kuis.',
  estimatedMinutes: '10-12 menit',
  accent: '#5B5FEF',
  frames: [
    {
      id: 'm1',
      kind: 'text',
      panel: '4.1',
      title: 'Dua Cara Menulis Bilangan yang Sama',
      note: 'Panel pembuka — hubungkan pecahan dengan pembagian',
      body:
        'Pecahan seperti 1/2 dan desimal seperti 0,5 sebenarnya menunjukkan nilai yang sama, hanya ditulis dengan cara berbeda. Pecahan bisa diubah menjadi desimal dengan cara membagi pembilang (angka atas) dengan penyebut (angka bawah).',
      imageAlt: 'Papan tulis dengan pecahan dan desimal',
      imageQuery: 'math fractions decimals chalkboard',
    },
    {
      id: 'm2',
      kind: 'video',
      panel: '4.2',
      title: 'Video: Mengubah Pecahan ke Desimal',
      note: 'Interactive video — satu jeda untuk cek pemahaman cara pembagian',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      poster:
        'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&q=80',
      markers: [
        {
          id: 'mm1',
          timeSec: 7,
          question: {
            id: 'mm1q',
            prompt: 'Hasil dari 3/4 jika diubah menjadi desimal adalah?',
            options: ['0,34', '0,75', '0,43', '1,33'],
            correctIndex: 1,
            explanation: '3 dibagi 4 menghasilkan 0,75. Ingat: pembilang dibagi penyebut.',
          },
        },
      ],
    },
    {
      id: 'm3',
      kind: 'dragdrop',
      panel: '4.3',
      title: 'Cocokkan Pecahan dengan Desimalnya',
      note: 'Drag & drop — pasangkan pecahan dengan nilai desimal yang setara',
      instructions: 'Seret setiap pecahan ke kelompok nilai desimal yang sama besar.',
      items: [
        { id: 'mi1', label: '1/2', zoneId: 'zm1' },
        { id: 'mi2', label: '2/4', zoneId: 'zm1' },
        { id: 'mi3', label: '1/4', zoneId: 'zm2' },
        { id: 'mi4', label: '25/100', zoneId: 'zm2' },
        { id: 'mi5', label: '3/4', zoneId: 'zm3' },
        { id: 'mi6', label: '75/100', zoneId: 'zm3' },
      ],
      zones: [
        { id: 'zm1', label: '0,5', hint: 'Setengah' },
        { id: 'zm2', label: '0,25', hint: 'Seperempat' },
        { id: 'zm3', label: '0,75', hint: 'Tiga perempat' },
      ],
    },
    {
      id: 'm4',
      kind: 'quiz',
      panel: '4.4',
      title: 'Kuis Akhir: Uji Pemahamanmu',
      note: 'Kuis penutup modul — 3 soal pilihan ganda',
      questions: [
        {
          id: 'mq1',
          prompt: 'Bentuk desimal dari 1/5 adalah?',
          options: ['0,15', '0,2', '0,5', '0,25'],
          correctIndex: 1,
          explanation: '1 dibagi 5 sama dengan 0,2.',
        },
        {
          id: 'mq2',
          prompt: 'Pecahan manakah yang senilai dengan 0,4?',
          options: ['1/4', '2/5', '4/10 dan 2/5', '3/4'],
          correctIndex: 2,
          explanation: '4/10 dapat disederhanakan menjadi 2/5, keduanya sama dengan 0,4.',
        },
        {
          id: 'mq3',
          prompt: 'Untuk mengubah pecahan menjadi desimal, kita perlu?',
          options: [
            'Mengalikan pembilang dan penyebut',
            'Membagi pembilang dengan penyebut',
            'Menjumlahkan pembilang dan penyebut',
            'Mengurangi penyebut dari pembilang',
          ],
          correctIndex: 1,
          explanation: 'Nilai desimal suatu pecahan diperoleh dengan membagi pembilang dengan penyebutnya.',
        },
      ],
    },
  ],
};
