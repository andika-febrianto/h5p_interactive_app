import type { Module } from '../../types/storyboard';

export const pillarsOfIslam: Module = {
  id: 'rukun-islam',
  subjectId: 'pai',
  grade: 1,
  semester: 1,
  title: 'Rukun Islam',
  subtitle: 'Modul interaktif — mengenal lima pondasi utama dalam Islam',
  summary:
    'Pelajari lima rukun Islam dan maknanya lewat video, drag & drop urutan, dan kuis pemahaman.',
  estimatedMinutes: '10-12 menit',
  accent: '#0E7C61',
  frames: [
    {
      id: 'p1',
      kind: 'text',
      panel: '6.1',
      title: 'Lima Pondasi Keislaman',
      note: 'Panel pembuka — perkenalkan konsep rukun sebagai fondasi',
      body:
        'Rukun Islam adalah lima pondasi utama yang menjadi dasar praktik keislaman seorang muslim: syahadat, salat, zakat, puasa, dan haji. Kelimanya berperan seperti tiang penyangga sebuah bangunan — masing-masing memiliki peran penting untuk menguatkan keimanan dan ketakwaan.',
      imageAlt: 'Masjid dengan kubah dan menara saat senja',
      imageQuery: 'mosque dome minaret sunset',
    },
    {
      id: 'p2',
      kind: 'video',
      panel: '6.2',
      title: 'Video: Penjelasan Rukun Islam',
      note: 'Interactive video — satu jeda untuk cek pemahaman urutan',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      poster:
        'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80',
      markers: [
        {
          id: 'pm1',
          timeSec: 6,
          question: {
            id: 'pm1q',
            prompt: 'Rukun Islam yang pertama dan menjadi dasar keimanan adalah?',
            options: ['Salat', 'Syahadat', 'Zakat', 'Puasa'],
            correctIndex: 1,
            explanation:
              'Syahadat, yaitu ikrar kesaksian atas keesaan Allah dan kerasulan Nabi Muhammad SAW, adalah rukun Islam pertama dan pondasi bagi rukun lainnya.',
          },
        },
      ],
    },
    {
      id: 'p3',
      kind: 'dragdrop',
      panel: '6.3',
      title: 'Cocokkan Rukun Islam dengan Maknanya',
      note: 'Drag & drop — pasangkan setiap rukun dengan penjelasannya',
      instructions: 'Seret setiap rukun Islam ke penjelasan yang paling sesuai.',
      items: [
        { id: 'pi1', label: 'Syahadat', zoneId: 'zp1' },
        { id: 'pi2', label: 'Salat', zoneId: 'zp2' },
        { id: 'pi3', label: 'Zakat', zoneId: 'zp3' },
        { id: 'pi4', label: 'Puasa Ramadan', zoneId: 'zp4' },
        { id: 'pi5', label: 'Haji', zoneId: 'zp5' },
      ],
      zones: [
        { id: 'zp1', label: 'Ikrar keimanan', hint: 'Kesaksian atas keesaan Allah' },
        { id: 'zp2', label: 'Ibadah lima waktu', hint: 'Penghubung hamba dengan Allah setiap hari' },
        { id: 'zp3', label: 'Berbagi harta', hint: 'Membersihkan harta & membantu sesama' },
        { id: 'zp4', label: 'Menahan diri sebulan penuh', hint: 'Melatih kesabaran dan pengendalian diri' },
        { id: 'zp5', label: 'Ibadah ke Baitullah', hint: 'Bagi yang mampu, sekali seumur hidup' },
      ],
    },
    {
      id: 'p4',
      kind: 'quiz',
      panel: '6.4',
      title: 'Kuis Akhir: Uji Pemahamanmu',
      note: 'Kuis penutup modul — 3 soal pilihan ganda',
      questions: [
        {
          id: 'pq1',
          prompt: 'Berapa jumlah rukun Islam?',
          options: ['3', '4', '5', '6'],
          correctIndex: 2,
          explanation: 'Rukun Islam berjumlah lima: syahadat, salat, zakat, puasa, dan haji.',
        },
        {
          id: 'pq2',
          prompt: 'Ibadah puasa Ramadan bertujuan utama untuk melatih?',
          options: ['Kekuatan fisik', 'Kesabaran dan pengendalian diri', 'Kemampuan berhitung', 'Keterampilan berbicara'],
          correctIndex: 1,
          explanation: 'Puasa melatih menahan diri dari makan, minum, dan hawa nafsu, sehingga menguatkan kesabaran dan pengendalian diri.',
        },
        {
          id: 'pq3',
          prompt: 'Ibadah haji wajib dilakukan oleh?',
          options: [
            'Semua muslim tanpa terkecuali',
            'Muslim yang mampu secara fisik dan finansial',
            'Hanya laki-laki dewasa',
            'Hanya penduduk Arab Saudi',
          ],
          correctIndex: 1,
          explanation: 'Haji wajib bagi muslim yang telah mampu (istitha’ah) secara fisik, finansial, dan keamanan.',
        },
      ],
    },
  ],
};
