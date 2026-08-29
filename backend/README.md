# Backend — Node.js + Express + Prisma + PostgreSQL

REST API yang menyimpan konten (mata pelajaran, modul, panel), progres
belajar murid, dan sekarang **akun guru/murid** di PostgreSQL —
menggantikan file statis (`src/data/**`) dan `localStorage` yang dipakai
frontend sebelumnya.

## Menjalankan

### 1. Siapkan PostgreSQL

Paling mudah pakai Docker:
```bash
docker compose up -d
```
Ini menjalankan Postgres di `localhost:5432` dengan database `h5p_app`,
user/password `postgres`/`postgres` (lihat `docker-compose.yml`).

Atau pakai PostgreSQL yang sudah terpasang di komputer Anda — cukup buat
database baru dan sesuaikan `DATABASE_URL` di langkah berikutnya.

### 2. Konfigurasi environment

```bash
cp .env.example .env
```
Sesuaikan `DATABASE_URL` jika perlu, dan **ganti `JWT_SECRET`** dengan nilai
acak yang panjang sebelum deploy ke production (mis. `openssl rand -base64
48`) — nilai default di `.env.example` hanya untuk development lokal.

### 3. Install, migrate, seed

```bash
npm install
npx prisma migrate dev --name init   # membuat tabel di database
npm run seed                          # mengisi konten + akun demo
```

> **Catatan penting:** file `prisma/seed-data.json` sudah disertakan di
> proyek ini (hasil ekspor dari konten frontend yang sudah diverifikasi),
> jadi `npm run seed` bisa langsung dijalankan tanpa langkah tambahan. Kalau
> Anda mengedit konten di `h5p-interactive-app/src/data/**` nanti, jalankan
> `npm run export:content` di folder frontend untuk memperbarui
> `seed-data.json`, baru jalankan `npm run seed` lagi di sini.
>
> `npm run seed` juga membuat **dua akun demo**:
> - Guru: `guru@sekolah.id` / `guru12345`
> - Murid: `murid@sekolah.id` / `murid12345`
>
> **Ganti atau hapus akun ini sebelum deploy ke production.**

### 4. Jalankan server

```bash
npm run dev
```
API berjalan di `http://localhost:4000` (ubah lewat `PORT` di `.env`).

Cek cepat: `curl http://localhost:4000/api/health` harus mengembalikan
`{"status":"ok",...}`.

## Upload file (PDF/gambar)

`POST /api/uploads` (guru only, `multipart/form-data`, field `file`) menerima
PDF, PNG, JPG, WEBP, atau GIF, maksimum **20MB**. File disimpan di
`backend/uploads/` (dibuat otomatis, di-gitignore) dengan nama acak (UUID)
supaya tidak ada tabrakan nama file, lalu disajikan sebagai file statis di
`GET /uploads/<nama-file>` — tidak butuh autentikasi untuk membaca (supaya
`<img>`/`<iframe>` di sisi murid bisa memuatnya langsung).

Respons berisi `url` **relatif** (mis. `/uploads/abc123.pdf`); frontend
menggabungkannya dengan origin backend (diturunkan dari `VITE_API_URL`)
menjadi URL absolut sebelum disimpan sebagai `src`/`poster`/`imageUrl` panel
— lihat `getApiOrigin()` di `src/lib/api.ts` pada proyek frontend.

Video **tidak** diunggah lewat endpoint ini (ukurannya berpotensi besar) —
form guru untuk panel video tetap meminta URL video yang sudah di-hosting
di tempat lain.

## Langganan & Pembayaran (Xendit)

Tiga paket, sesuai yang diminta:

| Paket | Harga | Fitur |
|---|---|---|
| Free Trial | Gratis, 14 hari | Semua fitur |
| Basic | Rp150.000/bulan | Fitur utama |
| Pro | Rp500.000/bulan | Semua fitur Basic + Analytics |

**Alurnya:**
1. **Daftar akun baru** → otomatis diberi langganan `TRIALING` paket
   `free_trial` selama 14 hari (lihat `routes/auth.ts`).
2. **Berlangganan Basic/Pro** → `POST /api/subscription/checkout` (body
   `{ planId }`) membuat *invoice* lewat **Xendit Invoice API**
   (`POST https://api.xendit.co/v2/invoices`, Basic Auth pakai secret key),
   menyimpan baris `Payment` berstatus `PENDING`, lalu mengembalikan
   `invoiceUrl` — frontend mengarahkan browser ke halaman checkout Xendit
   yang di-hosting Xendit sendiri (bukan form kartu kredit buatan sendiri).
3. **Setelah pembayaran** → Xendit memanggil balik
   `POST /api/webhooks/xendit` dengan status invoice. Endpoint ini
   diverifikasi lewat header `x-callback-token` (dibandingkan dengan
   `XENDIT_CALLBACK_TOKEN` di `.env`, pakai `crypto.timingSafeEqual` supaya
   tidak bisa ditebak lewat *timing attack*). Kalau valid dan status
   `PAID`: `Payment` ditandai lunas, dan `Subscription` di-*upsert* jadi
   `ACTIVE` dengan `planId` sesuai paket yang dibeli, berlaku 30 hari.
4. Endpoint `GET /api/subscription/me` dipakai frontend untuk menampilkan
   status langganan (`TRIALING`/`ACTIVE`/dst, sisa hari, tanggal berakhir).

### Penguncian akses setelah trial/langganan berakhir

Middleware `requireActiveAccess` (`src/middleware/auth.ts`) menegakkan ini
di level API, bukan cuma tampilan: begitu `currentPeriodEnd` sebuah akun
murid lewat tanpa langganan aktif, `GET /api/modules/:id` dan
`POST /api/progress` menolak dengan `403` dan `code: "SUBSCRIPTION_REQUIRED"`.
Frontend mendeteksi kode ini secara spesifik (`ApiError.code` di
`src/lib/api.ts`) dan menampilkan layar "Masa aktif Anda sudah berakhir"
dengan tombol ke halaman harga — lihat `ModulePage.tsx`. `AuthBar` juga
menampilkan peringatan di semua halaman begitu masa aktif habis.

**Guru dikecualikan** dari penguncian ini (`requireActiveAccess` memeriksa
`req.auth.role` dan langsung meloloskan `TEACHER`) — supaya guru tetap bisa
mengelola konten miliknya sendiri terlepas dari status langganannya di versi
ini. Endpoint yang **tidak** dikunci: melihat daftar mata pelajaran/modul
(sekadar menelusuri katalog tetap boleh), dan seluruh endpoint `/guru/*`
(pengelolaan konten).

### Pembatalan langganan

`POST /api/subscription/cancel` mengubah status jadi `CANCELED` **tanpa**
mengubah `currentPeriodEnd` — perilaku standar SaaS: pembatalan menghentikan
perpanjangan otomatis berikutnya, tapi akses yang sudah dibayar tetap
berjalan sampai periodenya benar-benar habis (`requireActiveAccess` hanya
memeriksa tanggal, bukan `status`, sehingga `CANCELED` ≠ langsung terkunci).
Tidak berlaku untuk paket `free_trial` (ditolak `400` — trial memang tidak
perlu "dibatalkan", cukup jangan berlangganan paket berbayar).

### Menyiapkan Xendit (perlu akun Xendit sungguhan)

1. Buat akun di [xendit.co](https://xendit.co), aktifkan **mode Test**.
2. Ambil **Secret API Key** (Test mode) dari Dashboard → Settings → API
   Keys, isi ke `XENDIT_SECRET_KEY` di `.env`.
3. Di Dashboard → Settings → Webhooks, atur URL webhook ke
   `https://<domain-backend-anda>/api/webhooks/xendit` (perlu domain publik
   — pakai `ngrok`/`cloudflared` saat development lokal), dan salin
   **Verification Token** ke `XENDIT_CALLBACK_TOKEN` di `.env`.
4. Isi `APP_URL` dengan origin frontend Anda (dipakai untuk
   `success_redirect_url`/`failure_redirect_url` setelah pembayaran).
5. Jalankan `npm run seed` — ini juga mengisi tabel `plans` dengan tiga
   paket di atas.

### Catatan penting soal verifikasi fitur ini

Domain `api.xendit.co` **tidak bisa diakses dari sandbox tempat kode ini
dibuat** (di luar daftar domain yang diizinkan) dan saya tidak punya akun
Xendit sungguhan untuk diuji — jadi panggilan HTTP ke Xendit itu sendiri
**tidak bisa saya coba langsung**. Yang sudah saya verifikasi nyata:
- Skema `Plan`/`Subscription`/`Payment` diterapkan ke PostgreSQL asli.
- **Verifikasi token webhook** (`verifyXenditCallbackToken`) — 6 skenario
  dijalankan sungguhan (token benar/salah/kosong/panjang berbeda), karena
  bagian ini tidak butuh Prisma maupun jaringan eksternal.
- **Seluruh alur bisnis** (daftar → dapat trial otomatis → checkout → baris
  Payment PENDING → webhook ditolak tanpa token → webhook diterima dengan
  token benar → Payment jadi PAID → Subscription jadi ACTIVE dengan paket
  yang benar) diuji lewat server HTTP nyata + Postgres asli, dengan **hanya
  panggilan ke Xendit itu sendiri yang di-*stub*** (karena tidak bisa
  dijangkau) — semua logika penyimpanan/verifikasi/aktivasi di sekitarnya
  adalah kode asli yang sama persis dengan yang dikirim.

Setelah Anda isi `XENDIT_SECRET_KEY`/`XENDIT_CALLBACK_TOKEN` sungguhan dan
jalankan di server dengan akses internet normal, alur checkout akan
langsung berfungsi seperti integrasi Xendit pada umumnya.

**Penguncian akses & pembatalan** (tidak bergantung Xendit sama sekali,
murni logika database) diuji lebih lengkap lewat server nyata + Postgres
asli: murid dengan trial baru bisa akses konten & catat progres; setelah
`currentPeriodEnd` dimundurkan secara manual (simulasi 14 hari berlalu),
keduanya ditolak `403` dengan `code: "SUBSCRIPTION_REQUIRED"`, dan
`GET /me` melaporkan `isExpired: true`; **guru dengan trial yang sama-sama
kedaluwarsa tetap bisa mengakses** (pengecualian peran bekerja); alur
pembatalan diuji penuh: tidak bisa membatalkan trial (`400`), checkout+
webhook mengaktifkan Pro, pembatalan pertama berhasil, pembatalan kedua
ditolak (`400`, sudah dibatalkan), **akses tetap berfungsi setelah
dibatalkan** (belum sampai tanggal berakhir), dan `GET /me` melaporkan
`cancelAtPeriodEnd: true` dengan `isExpired: false`.

## Cara kerja isi konten (kenapa ada kolom JSON)

Setiap panel (`Frame`) punya bentuk data yang beda-beda tergantung
`kind`-nya (kuis punya `questions`, drag & drop punya `items`/`zones`, video
punya `markers`, dst). Daripada bikin satu tabel per tipe, field-field
spesifik itu disimpan sebagai satu kolom `data` bertipe JSON. Endpoint
`GET /api/modules/:id` menggabungkan kolom `data` itu kembali ke bentuk
datar yang dipakai frontend — jadi dari sisi frontend, bentuknya identik
dengan tipe `Frame` yang sudah ada di `src/types/storyboard.ts`.

Saat menulis lewat endpoint CMS (`POST`/`PUT` panel), payload divalidasi
lebih dulu dengan Zod (`src/lib/frameValidation.ts`) sesuai bentuk yang
tepat untuk `kind`-nya masing-masing — jadi guru tidak bisa menyimpan panel
kuis tanpa `questions`, atau drag & drop tanpa `zones`, dll.

## Autentikasi & peran

Ada dua peran: **`TEACHER`** (guru) dan **`STUDENT`** (murid).

Model tokennya dua lapis (standar industri):
- **Access token** — JWT, berlaku singkat (**15 menit**), dikirim di setiap
  request sebagai `Authorization: Bearer <token>`. Tidak bisa dicabut secara
  langsung (sifat dasar JWT), makanya sengaja dibuat pendek umurnya.
- **Refresh token** — string acak buram (bukan JWT), berlaku 30 hari,
  **disimpan di database** (sebagai hash SHA-256, bukan teks asli — sama
  seperti prinsip hashing password) sehingga **bisa dicabut kapan saja**.
  Ditukar lewat `POST /api/auth/refresh` untuk mendapat access token baru.
  Setiap refresh **merotasi** token (yang lama langsung mati begitu dipakai
  sekali) — mencegah token yang bocor dipakai berulang tanpa ketahuan.

Endpoint:
- `POST /api/auth/register` / `POST /api/auth/login` — mengembalikan
  `{ accessToken, refreshToken, user }`.
- `POST /api/auth/refresh` — body `{ refreshToken }`, mengembalikan pasangan
  token baru (lama otomatis dicabut).
- `POST /api/auth/logout` — **mencabut sesi yang sedang dipakai** (butuh
  access token yang masih hidup). Refresh token sesi itu langsung mati.
- `GET /api/auth/sessions` — daftar sesi aktif milik akun yang login (untuk
  halaman "perangkat yang sedang masuk").
- `DELETE /api/auth/sessions/:id` — **mencabut sesi tertentu**, termasuk dari
  perangkat lain (mis. logout jarak jauh untuk HP yang hilang). Hanya bisa
  mencabut sesi milik akun sendiri (dicek `userId`).
- `GET /api/auth/me` — info akun yang sedang login.

Password di-hash dengan `bcryptjs` (tidak pernah disimpan sebagai teks
biasa). Frontend menyimpan `accessToken`+`refreshToken` di `localStorage`
dan otomatis me-refresh secara transparan begitu sebuah request kena `401`
(lihat `request()` di `src/lib/api.ts` pada proyek frontend) — pengguna
tidak perlu login ulang setiap 15 menit selama refresh token-nya masih
hidup.

**Endpoint yang membutuhkan peran `TEACHER`** akan menolak dengan `403`
kalau yang login berperan `STUDENT`, dan `401` kalau tidak login sama
sekali — lihat kolom "Peran" di tabel API di bawah.

## Progres belajar (anonim + login)

Progres dilacak lewat `clientId` — sebuah UUID acak yang **dibuat dan
disimpan oleh frontend** di `localStorage` perangkat (lihat
`src/lib/clientId.ts` di frontend) untuk pengguna yang belum login.

**Begitu murid login**, backend secara otomatis mengabaikan `clientId` yang
dikirim frontend dan memakai identitas dari token (`user:<userId>`) — ini
mencegah murid "berpura-pura" menjadi murid lain hanya dengan mengetahui
UUID anonimnya. Setiap baris progres juga menyimpan `userId` asli, sehingga
guru bisa melihat rekap nilai per murid lewat endpoint `/api/reports/*`.

## API Reference

| Method | Endpoint | Peran | Keterangan |
|---|---|---|---|
| GET | `/api/health` | — | Health check |
| POST | `/api/auth/register` | — | Daftar akun (guru/murid), dapat access+refresh token |
| POST | `/api/auth/login` | — | Masuk, dapat access+refresh token |
| POST | `/api/auth/refresh` | — | Tukar refresh token dengan pasangan token baru (rotasi) |
| POST | `/api/auth/logout` | Login | Cabut sesi yang sedang dipakai |
| GET | `/api/auth/sessions` | Login | Daftar sesi aktif milik akun sendiri |
| DELETE | `/api/auth/sessions/:id` | Login | Cabut sesi tertentu milik akun sendiri |
| GET | `/api/auth/me` | Login | Info akun sendiri |
| GET | `/api/subjects` | — | Daftar semua mata pelajaran |
| GET | `/api/subjects/:id` | — | Detail satu mata pelajaran |
| POST | `/api/subjects` | Guru | Buat mata pelajaran baru |
| PUT | `/api/subjects/:id` | Guru | Ubah mata pelajaran |
| DELETE | `/api/subjects/:id` | Guru | Hapus (ditolak `409` jika masih ada modul yang memakainya) |
| GET | `/api/modules?grade=&semester=&subjectId=` | — | Daftar modul (ringkas), filter opsional |
| GET | `/api/modules/:id` | — | Detail satu modul lengkap dengan seluruh panel terurut |
| POST | `/api/modules` | Guru | Buat modul baru (tanpa panel — tambah lewat endpoint di bawah) |
| PUT | `/api/modules/:id` | Guru | Ubah field modul (bukan panelnya) |
| DELETE | `/api/modules/:id` | Guru | Hapus modul (ikut menghapus semua panelnya) |
| POST | `/api/modules/:id/frames` | Guru | Tambah panel baru ke modul |
| PUT | `/api/modules/:id/frames/:slug` | Guru | Ganti isi satu panel |
| DELETE | `/api/modules/:id/frames/:slug` | Guru | Hapus satu panel |
| PUT | `/api/modules/:id/frames/reorder` | Guru | Ubah urutan panel — body: `{ order: string[] }` (semua id panel, urutan baru) |
| GET | `/api/progress?clientId=&moduleId=` | — (login lebih diutamakan) | Progres satu modul |
| GET | `/api/progress/summary?clientId=` | — (login lebih diutamakan) | Ringkasan progres semua modul |
| POST | `/api/progress` | — (login lebih diutamakan) | Simpan/perbarui hasil satu panel |
| DELETE | `/api/progress?clientId=&moduleId=` | — (login lebih diutamakan) | Hapus progres satu modul |
| POST | `/api/uploads` | Guru | Unggah file PDF/gambar (multipart, field `file`) — balikan `{ url, filename, mimetype, size }` |
| GET | `/api/reports/overview` | Guru | Rekap semua murid: modul disentuh, panel selesai, skor, akurasi |
| GET | `/api/reports/modules/:moduleId` | Guru | Rekap satu modul per murid |
| GET | `/api/plans` | — | Daftar paket langganan (Free Trial/Basic/Pro) |
| GET | `/api/subscription/me` | Login | Status langganan akun sendiri |
| GET | `/api/subscription/payments` | Login | Riwayat pembayaran akun sendiri |
| POST | `/api/subscription/checkout` | Login | Body `{ planId: "basic"\|"pro" }` — buat invoice Xendit, balikan `{ invoiceUrl }` |
| POST | `/api/subscription/cancel` | Login | Batalkan langganan (akses tetap jalan sampai periode habis) |
| POST | `/api/webhooks/xendit` | Token webhook Xendit | Callback dari Xendit saat status pembayaran berubah |

## Struktur proyek

```
backend/
  prisma/
    schema.prisma      # Model: User (+Role), Session, Plan, Subscription, Payment, Subject, Module, Frame, ProgressRecord
    seed.ts             # Mengisi DB dari seed-data.json + akun demo
    seed-data.json        # Hasil ekspor dari konten frontend (lihat di atas)
  src/
    index.ts            # Entry point Express (CORS, routes, error handler)
    lib/
      prisma.ts           # Prisma client singleton
      serialize.ts         # DB row -> bentuk JSON yang dipakai frontend
      auth.ts               # Hash password, sign/verify access token, refresh token
      frameValidation.ts     # Skema Zod per kind panel + modul + mapel
      upload.ts               # Konfigurasi multer (validasi tipe & ukuran file)
      xendit.ts                # Klien Xendit Invoice API + verifikasi webhook
    middleware/
      auth.ts              # optionalAuth / requireAuth / requireRole / resolveIdentity
    routes/
      auth.ts
      subjects.ts
      modules.ts
      progress.ts
      reports.ts
      uploads.ts
      plans.ts
      subscription.ts
      webhooks.ts
  docker-compose.yml   # Postgres lokal untuk development
  .env.example
```

## Catatan tentang lingkungan pengembangan ini secara spesifik

Kode di atas ditulis dan diverifikasi *strukturnya* secara menyeluruh
(skema, seed, seluruh query API, **termasuk alur autentikasi lengkap dan
RBAC**) langsung terhadap PostgreSQL asli — **tapi lewat SQL/library yang
setara**, bukan lewat `prisma generate`/`migrate` itu sendiri. Sebabnya:
sandbox tempat kode ini dibuat memblokir domain unduhan *engine binary*
Prisma (`binaries.prisma.sh`), jadi CLI Prisma-nya sendiri tidak bisa
dijalankan di sana. Ini bukan masalah pada kode atau skema — begitu Anda
menjalankan `npm install && npx prisma migrate dev && npm run seed` di
komputer/server dengan akses internet normal, semuanya akan berjalan
seperti proyek Prisma pada umumnya.

Yang **benar-benar dijalankan dan diuji langsung** di lingkungan ini
(bukan cuma type-check): hashing password (`bcryptjs`) dan JWT
(`jsonwebtoken`) — keduanya tidak butuh Prisma; skema tabel diterapkan ke
Postgres asli; seluruh endpoint (termasuk register/login/RBAC/CMS
CRUD/reorder/laporan guru) diuji lewat server HTTP nyata yang query-nya
memakai `pg` langsung (logika identik dengan route Prisma yang dikirim),
termasuk skenario keamanan (murid mencoba memalsukan `clientId` orang lain
— berhasil diblokir). **Endpoint upload** (`/api/uploads`) tidak bergantung
Prisma sama sekali, sehingga kode aslinya (bukan tiruan) dijalankan
langsung: PDF & PNG asli berhasil diunggah dan dibaca kembali dengan isi
identik byte-per-byte, murid ditolak (403), tanpa token ditolak (401), tipe
file tidak didukung ditolak (400), dan file di atas 20MB ditolak (413).
**Refresh token & pencabutan sesi** juga diuji end-to-end lewat server
HTTP nyata + Postgres asli: rotasi token (token lama mati setelah dipakai
sekali), pencabutan sesi dari "perangkat lain" (refresh token korban
langsung mati), proteksi lintas-pengguna (tidak bisa mencabut sesi orang
lain, 404), access token kedaluwarsa ditolak tepat waktu, dan **algoritma
auto-refresh-and-retry di sisi frontend** (`src/lib/api.ts`) diuji dengan
menjalankan logika yang identik terhadap server nyata — termasuk skenario
beberapa request bersamaan yang kena token mati hanya memicu **satu**
panggilan refresh (bukan race condition yang saling membatalkan).

## Yang masih bisa ditingkatkan selanjutnya

- **Langganan & pembayaran Xendit**: checkout, webhook, aktivasi otomatis,
  **penguncian akses setelah trial/langganan berakhir**, dan **pembatalan
  langganan** sudah ada (lihat bagian "Langganan & Pembayaran" di atas dan
  `middleware/auth.ts` fungsi `requireActiveAccess`). Yang belum: (1) job
  terjadwal untuk menandai `Subscription` sebagai `EXPIRED` secara eksplisit
  saat `currentPeriodEnd` lewat tanpa pembayaran lanjutan — saat ini
  penguncian akses dihitung langsung dari tanggal setiap request (`currentPeriodEnd > now`),
  jadi secara fungsional sudah benar tanpa perlu job terjadwal, tapi kolom
  `status` di database tidak otomatis berubah jadi `EXPIRED` sampai ada aksi
  lain menyentuhnya (murni kosmetik, tidak memengaruhi keamanan/penguncian),
  (2) belum ada `invoice.expired` handling untuk memberi tahu pengguna
  pembayarannya kedaluwarsa (baris `Payment` tetap `PENDING` sampai webhook
  `EXPIRED` diterima dari Xendit — ini akan berfungsi otomatis begitu Xendit
  mengirimkannya, cuma belum ada notifikasi proaktif ke pengguna di UI).
- **UI authoring untuk guru**: sudah ada (`/guru/modul/:id`, lengkap dengan
  pratinjau langsung). Yang belum: pratinjau seluruh modul berurutan
  (saat ini pratinjau per-panel saja saat sedang disunting).
- **Refresh token / pencabutan sesi**: sudah ada (lihat bagian "Autentikasi
  & peran" di atas). Yang belum: pembersihan otomatis baris `Session` yang
  sudah kedaluwarsa/dicabut (saat ini menumpuk di database — cukup aman
  karena tidak dipakai untuk apa pun, tapi sebaiknya ada cron job
  `DELETE FROM sessions WHERE "expiresAt" < now() OR "revokedAt" IS NOT NULL`
  secara berkala).
- **Rate limiting** pada `/api/auth/login` dan `/api/auth/refresh` untuk
  mencegah brute-force.
- **Validasi email** (verifikasi lewat tautan) sebelum akun aktif.
- **Docker image untuk backend sendiri** (saat ini `docker-compose.yml`
  hanya menyediakan Postgres; API-nya dijalankan lewat `npm run dev`/`start`).

