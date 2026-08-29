import type { Module } from '../../types/storyboard';

// Contoh modul: ganti file ini (atau muat dari API/CMS) untuk memasukkan
// konten storyboard Anda sendiri. Struktur data mengikuti tipe di
// src/types/storyboard.ts — satu "Frame" = satu panel pada dokumen storyboard.
export const coralReef: Module = {
  id: 'terumbu-karang',
  subjectId: 'ipas',
  grade: 5,
  semester: 2,
  title: 'Ekosistem Terumbu Karang',
  subtitle: 'Modul interaktif — mengenal kehidupan bawah laut Indonesia',
  summary: 'Jelajahi struktur terumbu karang, penghuninya, dan ancaman yang dihadapinya lewat video, drag & drop, dan kuis.',
  estimatedMinutes: '12-15 menit',
  accent: '#FF6F59',
  frames: [
    {
      id: 'f1',
      kind: 'text',
      panel: '1.1',
      title: 'Selamat Datang di Bawah Laut',
      note: 'Panel pembuka — tone eksploratif, ajak siswa "menyelam"',
      body:
        'Terumbu karang menutupi kurang dari 1% dasar laut, tetapi menjadi rumah bagi hampir 25% seluruh spesies laut. Di modul ini kamu akan menjelajahi struktur terumbu karang, mengenal penghuninya, dan menguji pemahamanmu lewat beberapa aktivitas interaktif.',
      imageAlt: 'Terumbu karang berwarna-warni dengan ikan tropis',
      imageQuery: 'coral reef underwater tropical fish',
    },
    {
      id: 'f2',
      kind: 'video',
      panel: '1.2',
      title: 'Video: Anatomi Terumbu Karang',
      note: 'Interactive video — jeda otomatis pada dua penanda untuk cek pemahaman',
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      poster:
        'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=80',
      markers: [
        {
          id: 'm1',
          timeSec: 8,
          question: {
            id: 'm1q',
            prompt: 'Apa yang membangun struktur keras terumbu karang?',
            options: [
              'Rangka kalsium karbonat polip karang',
              'Pasir yang mengeras',
              'Karang lunak',
              'Rumput laut',
            ],
            correctIndex: 0,
            explanation:
              'Polip karang mengeluarkan kalsium karbonat yang perlahan membentuk struktur terumbu yang keras.',
          },
        },
        {
          id: 'm2',
          timeSec: 20,
          question: {
            id: 'm2q',
            prompt: 'Alga simbiotik yang hidup di jaringan karang disebut?',
            options: ['Plankton', 'Zooxanthellae', 'Diatom', 'Fitoplankton'],
            correctIndex: 1,
            explanation:
              'Zooxanthellae adalah alga mikroskopis yang hidup bersimbiosis dengan polip karang dan memberi warna serta energi lewat fotosintesis.',
          },
        },
      ],
    },
    {
      id: 'f3',
      kind: 'dragdrop',
      panel: '1.3',
      title: 'Cocokkan Penghuni dengan Zona Terumbu',
      note: 'Drag & drop — tarik setiap organisme ke zona habitatnya yang tepat',
      instructions:
        'Seret setiap makhluk laut ke zona terumbu karang tempat ia biasa ditemukan.',
      items: [
        { id: 'i1', label: '🐢 Penyu Hijau', zoneId: 'z2' },
        { id: 'i2', label: '🐠 Ikan Badut', zoneId: 'z1' },
        { id: 'i3', label: '🦈 Hiu Karang', zoneId: 'z3' },
        { id: 'i4', label: '🐙 Gurita Karang', zoneId: 'z1' },
        { id: 'i5', label: '⭐ Bintang Laut', zoneId: 'z1' },
        { id: 'i6', label: '🐬 Lumba-lumba', zoneId: 'z3' },
      ],
      zones: [
        { id: 'z1', label: 'Rataan Terumbu (dangkal)', hint: 'Area penuh celah & anemon' },
        { id: 'z2', label: 'Padang Lamun Sekitar', hint: 'Vegetasi laut dangkal' },
        { id: 'z3', label: 'Laut Terbuka di Tepi Terumbu', hint: 'Perairan lebih dalam & terbuka' },
      ],
    },
    {
      id: 'f4',
      kind: 'text',
      panel: '1.4',
      title: 'Ancaman bagi Terumbu Karang',
      note: 'Konten penguatan sebelum kuis akhir',
      body:
        'Pemanasan suhu air laut dapat menyebabkan pemutihan karang (coral bleaching) — karang mengeluarkan zooxanthellae dan kehilangan warna serta sumber energinya. Faktor lain seperti polusi, penangkapan ikan merusak, dan pengasaman laut turut mempercepat kerusakan ekosistem ini.',
      imageAlt: 'Karang yang mengalami pemutihan',
      imageQuery: 'coral bleaching white reef',
    },
    {
      id: 'f5',
      kind: 'quiz',
      panel: '1.5',
      title: 'Kuis Akhir: Uji Pemahamanmu',
      note: 'Kuis penutup modul — 3 soal pilihan ganda',
      questions: [
        {
          id: 'q1',
          prompt: 'Penyebab utama pemutihan karang (coral bleaching) adalah?',
          options: [
            'Suhu air laut yang meningkat',
            'Terlalu banyak ikan',
            'Air laut yang terlalu dingin',
            'Cahaya bulan purnama',
          ],
          correctIndex: 0,
          explanation:
            'Kenaikan suhu air laut memicu stres pada karang sehingga melepaskan zooxanthellae, menyebabkan warnanya memudar.',
        },
        {
          id: 'q2',
          prompt: 'Berapa persen spesies laut yang bergantung pada terumbu karang?',
          options: ['5%', '10%', 'Sekitar 25%', '90%'],
          correctIndex: 2,
          explanation:
            'Meski hanya menutupi kurang dari 1% dasar laut, terumbu karang menopang sekitar 25% spesies laut.',
        },
        {
          id: 'q3',
          prompt: 'Zooxanthellae memberi manfaat apa bagi karang?',
          options: [
            'Perlindungan dari predator',
            'Energi lewat fotosintesis dan warna',
            'Membantu reproduksi',
            'Menjaga suhu air',
          ],
          correctIndex: 1,
          explanation:
            'Lewat fotosintesis, zooxanthellae menyuplai sebagian besar energi karang sekaligus memberi warna alaminya.',
        },
      ],
    },
  ],
};
