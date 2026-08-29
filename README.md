# Modul Interaktif — Perpustakaan Belajar per Kelas & Semester

Web app pembelajaran interaktif full-stack:
**React + TypeScript + Vite** (frontend) + **Node.js + Express + Prisma +
PostgreSQL** (backend, folder `backend/`).

Alur belajarnya:

**Pilih Kelas → Pilih Semester → Pilih Mata Pelajaran → Pilih Modul → Kerjakan Modul**

Setiap modul di-drive oleh data storyboard dan berisi 5 tipe aktivitas:
**Materi (teks)**, **Kuis**, **Drag & Drop**, **Interactive Video** (video
dengan jeda otomatis untuk pertanyaan), **Isian Singkat/Angka**, dan
**Dokumen PDF inline**.

## Menjalankan seluruh aplikasi (frontend + backend)

Backend harus jalan lebih dulu (frontend memanggil API-nya):

```bash
# 1) Backend — lihat backend/README.md untuk detail lengkap
cd backend
cp .env.example .env
docker compose up -d          # Postgres lokal
npm install
npx prisma migrate dev --name init
npm run seed                   # isi database dari konten yang sudah diverifikasi
npm run dev                    # API di http://localhost:4000

# 2) Frontend (di terminal terpisah, dari folder root proyek ini)
npm install
npm run dev                    # App di http://localhost:5173
```

Konten (mata pelajaran/kelas/modul/panel) dan progres belajar murid **kini
disimpan di PostgreSQL** lewat backend — bukan lagi file statis atau
`localStorage`. Detail arsitektur, skema database, dan referensi API ada di
`backend/README.md` (termasuk catatan jujur soal bagaimana backend ini
diverifikasi — lihat bagian "Catatan tentang lingkungan pengembangan ini").

## Peta rute (frontend)

```
"/"                                                  → Landing page (tentang aplikasi, publik)
"/harga"                                              → Halaman harga & paket (publik)
"/masuk", "/daftar"                                   → Login / Daftar akun (guru & murid)
"/kelas"                                              → Pilih Kelas (1-6) — perlu login
"/kelas/:grade"                                       → Pilih Semester (1 atau 2) — perlu login
"/kelas/:grade/semester/:semester"                    → Pilih Mata Pelajaran — perlu login
"/kelas/:grade/semester/:semester/mapel/:subjectId"   → Pilih Modul — perlu login
"/modul/:moduleId"                                    → Menjalankan modul interaktif — perlu login
"/guru"                                               → Dashboard Kelola Konten (guru)
"/guru/mapel"                                         → Kelola Mata Pelajaran (guru)
"/guru/modul", "/guru/modul/:moduleId"                → Kelola Modul & Panel (guru)
"/guru/laporan"                                       → Laporan Progres Murid (guru)
"/akun/sesi"                                           → Kelola sesi login (guru & murid)
"/akun/langganan"                                       → Status langganan & pembayaran (guru & murid)
```

Sejak versi ini, **beranda (`/`) adalah landing page publik** yang menjelaskan
aplikasi (bukan langsung memilih kelas) — pemilihan kelas dipindah ke
`/kelas` dan **mewajibkan login** (baik sebagai guru maupun murid). Ini
diterapkan lewat komponen `RequireAuth` (`src/components/RequireAuth.tsx`),
berbeda dari `RequireRole` yang mengharuskan peran spesifik (dipakai untuk
halaman `/guru/*`) — `RequireAuth` menerima peran apa pun asal sudah login.

## Konten contoh yang tersedia

| Kelas | Semester | Mapel | Modul |
|---|---|---|---|
| 1 | 1 | 🕌 PAI | Rukun Islam |
| 3 | 1 | ➗ Matematika | **Bilangan Cacah sampai 1.000** (dari Buku Siswa Kemdikbud) |
| 5 | 1 | 🔬 IPAS | Siklus Air, Rantai Makanan |
| 5 | 1 | ➗ Matematika | Pecahan dan Desimal |
| 5 | 2 | 🔬 IPAS | Ekosistem Terumbu Karang |
| 6 | 1 | 📖 Bahasa Indonesia | Mengenal Majas |

### Tentang modul "Bilangan Cacah sampai 1.000" (Kelas 3, Semester 1)

Modul ini dibangun dari PDF **Buku Siswa Matematika untuk SD/MI Kelas III**
(Kemdikbud, Susanto dkk., 2022) — 240 halaman, 5 bab. Modul ini mencakup
**Bab 1** secara menyeluruh (membaca/menulis bilangan, nilai tempat,
membandingkan/mengurutkan, dan operasi hitung penjumlahan-pengurangan-
perkalian-pembagian sampai 1.000). Semua soal drag & drop dan kuis
**diambil langsung dari latihan & asesmen asli buku ini** (bagian "Ayo
Berlatih" dan "Asesmen"), lalu ditulis ulang dengan kalimat sendiri untuk
antarmuka interaktif — bukan soal karangan. Setiap jawaban benar sudah
diverifikasi ulang secara terpisah (lihat proses build), sehingga akurat
sesuai buku.

**Penting — perbedaan antara panel PDF dan panel video:**
- **Panel PDF** (`kind: 'pdf'`) menampilkan **potongan PDF asli** Bab 1
  (halaman 11–84 dari buku sumber, dipisah jadi file tersendiri di
  `public/materi/bab1-bilangan-cacah-1000.pdf` agar ringan) langsung di
  dalam modul — murid bisa membaca, membuka di tab baru, atau mengunduhnya.
  Ini yang membuat murid **bisa membaca PDF dari dalam aplikasi**, bukan
  cuma link keluar.
- **Panel video** (`kind: 'video'`) masih menggunakan video contoh generik
  yang **tidak diekstrak dari PDF** — PDF tidak berisi video, jadi video ini
  hanya demonstrasi fitur "interactive video". Pertanyaan overlay-nya sudah
  disesuaikan dengan materi buku, tapi rekaman videonya sendiri perlu diganti
  dengan video penjelasan guru yang sesungguhnya bila Anda punya.
- **Panel Isian Singkat / Angka** (`kind: 'shortanswer'`) — murid **mengetik**
  jawabannya sendiri (bukan memilih dari opsi), cocok untuk soal "isilah
  titik-titik" yang banyak muncul di buku Matematika. Dua panel jenis ini
  sudah ditambahkan, memakai soal isian asli dari Ayo Berlatih bagian B
  nomor 5 (penguraian nilai tempat) dan Asesmen akhir bab nomor 4 (operasi
  hitung campuran).

**Bab 2-5 dari buku ini belum diimplementasikan** (Kalimat Matematika;
Pengukuran Panjang dan Berat; Unsur-Unsur Bangun Datar; Penyajian Data
dalam Tabel) — bab-bab ini juga termasuk materi semester 1 & 2 Kelas III
dan bisa ditambahkan sebagai modul terpisah lewat proses yang sama
(baca PDF → ekstrak soal asli → susun jadi `Module` baru).

Kombinasi kelas/semester/mapel lain akan menampilkan status "Segera hadir" /
"Belum ada modul" — ini bukan bug, melainkan tampilan wajar untuk konten yang
belum diisi. Tinggal tambahkan modul baru dengan `grade`/`semester` yang
sesuai agar otomatis terisi.

## Menjalankan proyek (frontend saja)

> Backend harus sudah jalan dulu (lihat bagian di atas) — kalau tidak,
> halaman akan menampilkan pesan "Tidak bisa terhubung ke server".

```bash
npm install
npm run dev       # dev server, biasanya di http://localhost:5173
npm run build      # build produksi ke folder dist/
npm run preview    # preview hasil build
npm run export:content  # ekspor src/data/** -> backend/prisma/seed-data.json
```

Requirement: Node.js 18+.

## Struktur proyek

```
h5p-interactive-app/
  backend/                        # API — lihat backend/README.md
    prisma/schema.prisma            # Model: Subject, Module, Frame, ProgressRecord
    prisma/seed.ts                   # Isi DB dari seed-data.json
    src/                               # Express app (routes, prisma client, serializer)
  scripts/
    export-content.ts             # src/data/** -> backend/prisma/seed-data.json
  src/
    types/storyboard.ts          # Tipe data: Subject, Module (grade, semester, subjectId), Frame
    lib/
      api.ts                        # Klien HTTP ke backend (fetch wrappers)
      clientId.ts                    # UUID anonim untuk melacak progres (localStorage)
    data/                         # SUMBER KONTEN — diedit di sini, lalu di-export+seed ke DB
      grades.ts                    # Daftar kelas (1-6) & semester (1-2) — konstanta UI, bukan dari DB
      subjects.ts                  # Registry mata pelajaran (IPAS, Matematika, dst)
      modules/
        coralReef.ts                 # Kelas 5, Semester 2, IPAS
        waterCycle.ts                  # Kelas 5, Semester 1, IPAS
        foodChain.ts                    # Kelas 5, Semester 1, IPAS
        fractionsDecimals.ts             # Kelas 5, Semester 1, Matematika
        figurativeLanguage.ts             # Kelas 6, Semester 1, Bahasa Indonesia
        pillarsOfIslam.ts                  # Kelas 1, Semester 1, PAI
        bilanganCacah1000.ts               # Kelas 3, Semester 1, Matematika (dari PDF Kemdikbud)
        index.ts                            # Registry + helper filter (grade/semester/subject)
    context/
      ProgressContext.tsx          # Progres per modul — fetch/simpan lewat API backend (mode disableApi untuk pratinjau)
      AuthContext.tsx               # User login, access/refresh token, register/login/logout
    pages/
      Landing.tsx                    # Beranda publik — tentang aplikasi (route "/")
      GradeSelect.tsx                  # Langkah 1: pilih kelas (route "/kelas", perlu login)
      SemesterSelect.tsx                # Langkah 2: pilih semester (route "/kelas/:grade")
      SubjectSelect.tsx                  # Langkah 3: pilih mapel (route ".../semester/:semester")
      ModuleList.tsx                      # Langkah 4: pilih modul (route ".../mapel/:subjectId")
      ModulePage.tsx                        # Langkah 5: jalankan modul (route "/modul/:moduleId")
      Login.tsx, Register.tsx        # Form masuk/daftar
      SessionManager.tsx              # Kelola sesi login (route "/akun/sesi")
      TeacherReport.tsx                # Laporan progres murid (route "/guru/laporan")
      teacher/                          # Dashboard, kelola mapel/modul (lihat bagian CMS di atas)
    components/
      RequireAuth.tsx                # Guard: perlu login (peran apa saja) — dipakai alur belajar
      RequireRole.tsx                 # Guard: perlu peran spesifik — dipakai halaman /guru/*
      AuthBar.tsx                      # Status login + tautan cepat, tampil di tiap halaman alur belajar
      Sidebar.tsx                    # Navigasi panel storyboard dalam satu modul
      ScenePlayer.tsx                 # Dispatcher: merender komponen sesuai frame.kind
      SummaryScreen.tsx               # Ringkasan skor di akhir modul
      scenes/
        TextScene.tsx                  # Panel materi/narasi
        QuizScene.tsx                   # Kuis pilihan ganda multi-soal
        DragDropScene.tsx               # Aktivitas drag & drop (pakai @dnd-kit, keyboard-accessible)
        VideoScene.tsx                   # Interactive video dengan penanda waktu
        ShortAnswerScene.tsx             # Isian singkat/angka (murid mengetik jawaban)
        PdfScene.tsx                      # Panel PDF inline
    App.tsx                        # Routing (react-router-dom), 5 level di atas
    index.css                      # Design system (token warna, tipografi, komponen)
```

## Alur konten: dari file TS ke database

Konten (`src/data/**`) tetap ditulis sebagai file TypeScript — ini
memudahkan menulis/mengedit modul dengan bantuan tipe & autocomplete. Untuk
membuatnya muncul di aplikasi (yang sekarang membaca dari database lewat
API), jalankan:

```bash
npm run export:content        # di folder root proyek ini (frontend)
cd backend && npm run seed    # lalu di folder backend
```

`export:content` mengubah semua modul di `src/data/modules/**` jadi satu
file `backend/prisma/seed-data.json`, lalu `npm run seed` di backend mengisi
ulang database dengan isi file itu.

## Menambahkan modul belajar baru

1. Buat file baru di `src/data/modules/`, mis. `sistemPencernaan.ts`, dengan
   bentuk yang sama seperti modul lain (lihat tipe `Module` di
   `src/types/storyboard.ts`). Isi:
   - `id` — unik, dipakai di URL `/modul/:id`
   - `subjectId` — harus cocok dengan salah satu `id` di `src/data/subjects.ts`
   - `grade` — angka kelas, mis. `4`
   - `semester` — `1` atau `2`
   - `title`, `subtitle`, `summary`, `estimatedMinutes`, `accent`, `frames`
2. Import dan tambahkan ke array `modules` di `src/data/modules/index.ts`.
3. Jalankan `npm run export:content` lalu `cd backend && npm run seed`
   (lihat bagian "Alur konten" di atas).
4. Selesai — modul otomatis muncul di jalur
   `/kelas/{grade}/semester/{semester}/mapel/{subjectId}`. Tidak perlu
   mengubah komponen atau halaman lain.

### Menambahkan kelas atau mata pelajaran baru

- **Kelas baru** (mis. jenjang SMP kelas 7-9): tambahkan entri di array
  `grades` pada `src/data/grades.ts`. (Kelas/semester adalah konstanta UI,
  tidak disimpan di database.)
- **Mata pelajaran baru**: tambahkan entri di `src/data/subjects.ts` (`id`,
  `name`, `shortName`, `description`, `icon`, `accent`), lalu jalankan
  `export:content` + `seed` seperti di atas.

### Bentuk tiap tipe panel (frame)

**Teks**
```ts
{ id: 'f1', kind: 'text', panel: '1.1', title: 'Judul', body: 'Isi materi...' }
```

**Kuis**
```ts
{
  id: 'f5', kind: 'quiz', panel: '1.5', title: 'Kuis Akhir',
  questions: [
    { id: 'q1', prompt: 'Pertanyaan...', options: ['A', 'B', 'C', 'D'],
      correctIndex: 0, explanation: 'Penjelasan jawaban benar...' },
  ],
}
```

**Drag & Drop**
```ts
{
  id: 'f3', kind: 'dragdrop', panel: '1.3', title: 'Cocokkan Item',
  instructions: 'Seret setiap item ke zona yang tepat.',
  items: [{ id: 'i1', label: 'Item A', zoneId: 'z1' }],
  zones: [{ id: 'z1', label: 'Zona 1', hint: 'Keterangan opsional' }],
}
```

**Interactive Video**
```ts
{
  id: 'f2', kind: 'video', panel: '1.2', title: 'Video Materi',
  src: 'https://url-video-anda.mp4',      // ganti dengan video Anda (mp4/webm)
  poster: 'https://url-gambar-poster.jpg',
  markers: [
    { id: 'm1', timeSec: 8,               // video otomatis pause di detik ke-8
      question: { id: 'm1q', prompt: 'Pertanyaan saat video jeda...',
        options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Penjelasan...' } },
  ],
}
```

**Isian Singkat / Angka**
```ts
{
  id: 'f7', kind: 'shortanswer', panel: '1.5', title: 'Isian Singkat',
  instructions: 'Ketik jawabannya.',
  items: [
    { id: 'i1', prompt: '28 + 57 = ⬜', acceptedAnswers: ['85'], inputType: 'number',
      explanation: '28 + 57 = 85.' },
    // acceptedAnswers menerima array — bisa isi beberapa variasi jawaban yang benar,
    // mis. acceptedAnswers: ['jakarta', 'dki jakarta'] untuk isian teks.
    // inputType: 'number' membandingkan sebagai angka (toleran spasi/nol di depan);
    // 'text' (default) membandingkan teks tanpa peduli huruf besar/kecil & spasi ganda.
  ],
}
```

**Dokumen PDF (inline)**
```ts
{
  id: 'f6', kind: 'pdf', panel: '1.0', title: 'Baca Buku Aslinya (Opsional)',
  description: 'Deskripsi singkat isi dokumen ini...',
  src: '/materi/nama-file-anda.pdf',   // taruh file di public/materi/, lalu referensikan dari root "/"
}
```
Cara menambahkan PDF Anda sendiri:
1. Taruh file PDF di `public/materi/` (bikin foldernya jika belum ada).
2. Kalau PDF sumber Anda besar/berisi banyak bab, potong dulu bagian yang
   relevan (lihat `src/data/modules/bilanganCacah1000.ts` sebagai contoh —
   Bab 1 dipisah dari buku 240 halaman jadi file tersendiri berukuran ~5MB
   agar cepat dimuat), memakai `qpdf input.pdf --pages . START-END -- output.pdf`.
3. Referensikan path-nya di `src` diawali `/materi/...` (path relatif ke
   folder `public/`, bukan path absolut di komputer Anda).

Urutan array `frames` menentukan urutan tampil dan urutan di sidebar navigasi.

## Perbaikan & fitur yang sudah diterapkan (changelog)

- **Penguncian akses setelah trial/langganan berakhir + pembatalan
  langganan** — begitu masa aktif murid habis, membuka modul atau mencatat
  progres ditolak di level API (bukan cuma disembunyikan di tampilan), dan
  ModulePage menampilkan layar "Masa aktif Anda sudah berakhir" dengan
  tombol ke halaman harga. Guru dikecualikan dari penguncian ini agar tetap
  bisa mengelola kontennya. Guru/murid juga bisa **membatalkan langganan**
  dari `/akun/langganan` — akses tetap jalan sampai periode yang sudah
  dibayar habis (tidak langsung dicabut), sesuai perilaku SaaS pada
  umumnya. Detail lengkap ada di `backend/README.md`.

- **Langganan & Pembayaran (Xendit)** — tiga paket: **Free Trial** (14 hari,
  semua fitur, otomatis didapat saat daftar), **Basic** (Rp150.000/bulan,
  fitur utama), **Pro** (Rp500.000/bulan, fitur utama + Analytics). Halaman
  publik **`/harga`** menampilkan ketiganya; tombol berlangganan mengarah ke
  halaman pembayaran ter-hosting Xendit. Setelah Xendit mengonfirmasi
  pembayaran (lewat webhook), langganan otomatis aktif — status & riwayat
  pembayaran bisa dilihat di **`/akun/langganan`**. Laporan guru
  (`/guru/laporan`) sekarang punya bagian **Analytics** yang hanya terbuka
  untuk paket Pro. Detail alur & cara setup akun Xendit ada di
  `backend/README.md` bagian "Langganan & Pembayaran".

- **Landing page didesain ulang** — navbar sticky dengan efek blur, hero
  berlapis (gradient blob + grid pattern dekoratif, badge, statistik
  ringkas), kartu fitur dengan efek hover terangkat, alur "cara kerja"
  bergaya timeline bernomor, serta bagian CTA penutup dan footer yang lebih
  lengkap — semuanya tetap konsisten dengan design system aplikasi (token
  warna & tipografi yang sama), bukan tempelan gaya baru.
- **Pencarian & paging di Kelola Modul** — kolom pencarian (judul, mapel,
  id) dan navigasi halaman muncul otomatis begitu jumlah modul melebihi satu
  halaman (8 modul/halaman).
- **Paging pada daftar Panel di Sunting Modul** — 5 panel per halaman;
  menambah panel baru otomatis melompat ke halaman terakhir agar guru
  langsung melihat hasilnya, dan menghapus panel di halaman terakhir tidak
  meninggalkan halaman kosong.

- **Landing page publik + alur belajar wajib login** — beranda (`/`)
  sekarang halaman perkenalan aplikasi (hero, daftar fitur, cara kerja),
  bukan langsung ke pemilihan kelas. Pemilihan kelas pindah ke **`/kelas`**
  dan mewajibkan login (guru atau murid) lewat komponen `RequireAuth`.
  Pengguna yang sudah login dan membuka `/` akan melihat tombol "Lanjut ke
  Pilihan Kelas" alih-alih tombol Masuk/Daftar.

- **Pratinjau langsung di form guru** — panel `FrameForm` sekarang
  menampilkan pratinjau di sebelah form, memakai **komponen `ScenePlayer`
  yang sama persis** dengan yang dilihat murid (bukan tiruan terpisah), jadi
  guru tidak perlu lagi buka `/modul/:id` di tab lain untuk cek hasilnya.
  Pratinjau bersifat lokal sepenuhnya (mode `disableApi` di
  `ProgressContext`) — tidak mengirim apa pun ke backend, aman dicoba-coba.
- **Refresh token + pencabutan sesi** — access token sekarang berumur
  pendek (15 menit) dan refresh token (30 hari, tersimpan ter-hash di
  database) dipakai untuk memperpanjang sesi secara transparan di latar
  belakang. Ada halaman **`/akun/sesi`** (untuk guru maupun murid) yang
  menampilkan semua perangkat yang sedang login, dengan tombol "Cabut" —
  bisa dipakai untuk logout paksa dari perangkat yang hilang/dicurigai.
  Detail model keamanannya ada di `backend/README.md`.

- **Upload PDF/gambar langsung dari form guru** — panel PDF, gambar materi
  (teks), dan gambar poster video sekarang punya tombol "⬆ Unggah" di form
  guru: pilih file dari komputer, otomatis ter-upload ke backend
  (`POST /api/uploads`, guru only, maks 20MB) dan URL-nya terisi sendiri.
  URL manual tetap bisa dipakai sebagai alternatif (mis. link gambar/PDF
  eksternal). Video tetap lewat URL saja (ukurannya berpotensi besar).
- **Antarmuka Kelola Konten untuk guru** (`/guru`, `/guru/mapel`, `/guru/modul`,
  `/guru/modul/:id`) — guru sekarang bisa membuat mata pelajaran, membuat/
  menghapus modul, dan menambah/menyunting/menghapus/mengurutkan panel
  (materi, kuis, drag & drop, video, PDF, isian singkat) **lewat form di
  browser, tanpa menyentuh kode**. Setiap tipe panel punya editor
  dinamisnya sendiri (mis. kuis punya editor pertanyaan + opsi + penanda
  jawaban benar; drag & drop punya editor zona + item dengan pemilihan zona
  lewat dropdown, bukan mengetik id manual).
- **Autentikasi guru/murid + endpoint tulis konten (CMS API)** — login/daftar
  (`/masuk`, `/daftar`), JWT, dan proteksi peran (`TEACHER`/`STUDENT`) di
  backend. Progres murid yang login otomatis tertaut ke akun mereka
  (bukan cuma `clientId` anonim), sehingga guru bisa melihat **rekap nilai
  per murid** di halaman `/guru/laporan`.
- **Backend Node.js + Express + Prisma + PostgreSQL** (`backend/`) — konten
  (mata pelajaran/modul/panel) dan progres belajar murid kini disimpan di
  database sungguhan, menggantikan file statis & `localStorage` sebagai
  sumber data runtime. Lihat `backend/README.md` untuk skema, referensi API,
  dan cara menjalankannya.
- **Panel Isian Singkat / Angka** (`kind: 'shortanswer'`) — murid mengetik
  jawaban sendiri (teks atau angka), bukan memilih dari opsi. Perbandingan
  jawaban toleran terhadap spasi, huruf besar/kecil, dan nol di depan untuk
  angka. Lihat `src/components/scenes/ShortAnswerScene.tsx`. **Drag & drop
  dan kuis pilihan ganda tidak diubah sama sekali** — keduanya tetap seperti
  semula, ini murni tambahan tipe baru di sampingnya.
- **Panel PDF inline** (`kind: 'pdf'`) — murid bisa membaca PDF sumber
  langsung di dalam modul (embed, buka tab baru, atau unduh), bukan cuma
  link keluar aplikasi. Lihat `src/components/scenes/PdfScene.tsx`.
- **Hierarki Kelas → Semester → Mapel → Modul** — routing 5-level lewat
  `react-router-dom`, dengan breadcrumb di setiap halaman dan tombol kembali.
- **Status "Segera hadir"** — kombinasi kelas/semester/mapel yang belum punya
  modul tetap ditampilkan (tidak disembunyikan) agar struktur kurikulum tetap
  terlihat lengkap, namun kartunya dinonaktifkan.
- **Registry terpusat** — modul cukup didaftarkan sekali di
  `src/data/modules/index.ts`, otomatis terfilter ke jalur yang tepat lewat
  API setelah di-seed ke database.
- **Progres tersimpan di database, resume otomatis** — pindah perangkat atau
  hapus `localStorage` tidak lagi menghapus progres (hanya `clientId`-nya
  yang disimpan lokal); kembali ke modul yang belum selesai langsung
  melanjutkan dari panel terakhir.
- **Drag & drop bisa diakses via keyboard** — `KeyboardSensor` dari
  `@dnd-kit/core`.
- **Logika kunci navigasi sidebar** berbasis `furthestIndex` (jumlah panel
  yang sudah pernah diselesaikan), dilengkapi ikon gembok pada panel yang
  masih terkunci.
- **Tombol "Ulangi Modul"** memanggil `resetProgress()`, yang menghapus
  progres di database lewat API — bukan `window.location.reload()`.
- **Indikator benar/salah** tidak hanya mengandalkan warna — ditambahkan
  simbol ✓/✕ eksplisit (aksesibilitas buta warna).

## Yang masih bisa ditingkatkan selanjutnya

- **Video asli**: `src` video pada tiap modul masih memakai video contoh
  publik yang tidak relevan secara konten — ganti dengan video materi Anda.
  (Video sengaja tidak bisa diunggah lewat form — ukurannya berpotensi
  besar, lihat catatan di `backend/README.md`.)
- **Rendering PDF di mobile**: beberapa browser mobile (terutama Safari iOS)
  kadang memaksa unduh alih-alih menampilkan PDF inline di `<iframe>`.
  Tombol "Buka di tab baru" dan "Unduh PDF" di panel PDF adalah jalan pintas
  untuk kasus ini.
- **Autentikasi/multi-pengguna & peran guru**: sudah ada (lihat entri
  changelog di atas) — login guru/murid, access+refresh token, pencabutan
  sesi, `/guru/laporan`, `/guru/modul`. Yang belum: verifikasi email dan
  rate limiting pada endpoint login/refresh (lihat `backend/README.md`
  bagian "Yang masih bisa ditingkatkan").
- **Jenjang di atas SD**: `grades.ts` saat ini hanya berisi kelas 1-6 (SD).
  Tambahkan entri baru bila perlu mendukung SMP/SMA.
- **Bank soal acak**: urutan soal & opsi jawaban saat ini tetap; bisa
  ditambah pengacakan untuk mengurangi contekan antar siswa.

## Teknologi

**Frontend**
- React 19 + TypeScript + Vite
- `react-router-dom` untuk navigasi kelas → semester → mapel → modul
- `@dnd-kit/core` untuk drag & drop (accessible: pointer, touch, dan keyboard)
- Tanpa dependency CSS framework — design system custom di `index.css`

**Backend** (`backend/`)
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- Lihat `backend/README.md` untuk detail lengkap
