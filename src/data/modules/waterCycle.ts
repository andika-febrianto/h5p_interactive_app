import type { Module } from '../../types/storyboard';

export const waterCycle: Module = {
  id: 'siklus-air',
  subjectId: 'ipas',
  grade: 5,
  semester: 1,
  title: 'Siklus Air',
  subtitle: 'Modul interaktif — perjalanan air dari laut ke langit dan kembali',
  summary:
    'Ikuti perjalanan setetes air lewat evaporasi, kondensasi, presipitasi, hingga infiltrasi lewat video, drag & drop, dan kuis.',
  estimatedMinutes: '10-12 menit',
  accent: '#2F80ED',
  frames: [
    {
      id: 'w1',
      kind: 'text',
      panel: '2.1',
      title: 'Air yang Tak Pernah Habis',
      note: 'Panel pembuka — bangun rasa ingin tahu tentang siklus tertutup',
      body:
        'Air yang kamu minum hari ini bisa jadi pernah menjadi bagian dari lautan purba jutaan tahun lalu. Air terus bersirkulasi lewat siklus tertutup: menguap, berkumpul jadi awan, jatuh sebagai hujan, lalu mengalir kembali ke laut. Mari telusuri setiap tahapnya.',
      imageAlt: 'Ilustrasi siklus air dari laut ke awan',
      imageQuery: 'water cycle diagram clouds ocean',
    },
    {
      id: 'w2',
      kind: 'video',
      panel: '2.2',
      title: 'Video: Tahapan Siklus Air',
      note: 'Interactive video — dua jeda untuk memeriksa pemahaman tahapan',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      poster:
        'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&q=80',
      markers: [
        {
          id: 'wm1',
          timeSec: 8,
          question: {
            id: 'wm1q',
            prompt: 'Proses berubahnya air menjadi uap air karena panas matahari disebut?',
            options: ['Kondensasi', 'Evaporasi', 'Presipitasi', 'Infiltrasi'],
            correctIndex: 1,
            explanation:
              'Evaporasi adalah proses air di permukaan (laut, sungai, danau) berubah menjadi uap air akibat panas matahari.',
          },
        },
        {
          id: 'wm2',
          timeSec: 20,
          question: {
            id: 'wm2q',
            prompt: 'Uap air yang mendingin di atmosfer dan membentuk awan mengalami proses?',
            options: ['Evaporasi', 'Transpirasi', 'Kondensasi', 'Limpasan'],
            correctIndex: 2,
            explanation:
              'Kondensasi terjadi saat uap air mendingin dan berubah kembali menjadi tetesan air kecil yang membentuk awan.',
          },
        },
      ],
    },
    {
      id: 'w3',
      kind: 'dragdrop',
      panel: '2.3',
      title: 'Susun Urutan Tahapan Siklus Air',
      note: 'Drag & drop — cocokkan istilah dengan definisinya',
      instructions: 'Seret setiap istilah ke kelompok tahapan siklus air yang sesuai.',
      items: [
        { id: 'wi1', label: '☀️ Air laut menguap', zoneId: 'zw1' },
        { id: 'wi2', label: '💨 Tanaman melepas uap air (transpirasi)', zoneId: 'zw1' },
        { id: 'wi3', label: '☁️ Uap air membentuk awan', zoneId: 'zw2' },
        { id: 'wi4', label: '🌧️ Hujan turun ke daratan', zoneId: 'zw3' },
        { id: 'wi5', label: '🏞️ Air meresap ke tanah', zoneId: 'zw3' },
        { id: 'wi6', label: '🌊 Air mengalir kembali ke laut', zoneId: 'zw3' },
      ],
      zones: [
        { id: 'zw1', label: 'Penguapan', hint: 'Air berubah jadi uap' },
        { id: 'zw2', label: 'Kondensasi', hint: 'Uap air berkumpul jadi awan' },
        { id: 'zw3', label: 'Presipitasi & Aliran', hint: 'Air jatuh dan mengalir kembali' },
      ],
    },
    {
      id: 'w4',
      kind: 'text',
      panel: '2.4',
      title: 'Mengapa Siklus Air Penting?',
      note: 'Konten penguatan sebelum kuis akhir',
      body:
        'Siklus air menjaga ketersediaan air tawar bagi makhluk hidup, mengatur suhu bumi, dan mendukung pertanian. Perubahan iklim dapat mempercepat penguapan dan mengubah pola curah hujan, menyebabkan kekeringan di satu wilayah dan banjir di wilayah lain.',
      imageAlt: 'Sungai mengalir melalui hutan hijau',
      imageQuery: 'river flowing through green forest',
    },
    {
      id: 'w5',
      kind: 'quiz',
      panel: '2.5',
      title: 'Kuis Akhir: Uji Pemahamanmu',
      note: 'Kuis penutup modul — 3 soal pilihan ganda',
      questions: [
        {
          id: 'wq1',
          prompt: 'Urutan tahapan siklus air yang benar adalah?',
          options: [
            'Presipitasi → Evaporasi → Kondensasi',
            'Evaporasi → Kondensasi → Presipitasi',
            'Kondensasi → Presipitasi → Evaporasi',
            'Infiltrasi → Evaporasi → Presipitasi',
          ],
          correctIndex: 1,
          explanation:
            'Air menguap (evaporasi), uap berkumpul membentuk awan (kondensasi), lalu jatuh sebagai hujan (presipitasi).',
        },
        {
          id: 'wq2',
          prompt: 'Apa yang menyebabkan perubahan iklim memengaruhi siklus air?',
          options: [
            'Mempercepat rotasi bumi',
            'Mengubah pola penguapan dan curah hujan',
            'Menghentikan aliran sungai',
            'Mengurangi jumlah lautan',
          ],
          correctIndex: 1,
          explanation:
            'Kenaikan suhu global mempercepat penguapan dan mengubah pola curah hujan, memicu kekeringan atau banjir ekstrem.',
        },
        {
          id: 'wq3',
          prompt: 'Proses air meresap ke dalam tanah disebut?',
          options: ['Transpirasi', 'Infiltrasi', 'Sublimasi', 'Kondensasi'],
          correctIndex: 1,
          explanation:
            'Infiltrasi adalah proses air hujan meresap ke dalam tanah dan menjadi bagian dari air tanah.',
        },
      ],
    },
  ],
};
