--
-- PostgreSQL database dump
--

\restrict 19E88cCjuFoU3NpHd2wpYyvbKF8Vwp1LGcJBQ4anpDvOMRmqpkV5DAP7Chu2KXn

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: prisma_postgres; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS prisma_postgres WITH SCHEMA public;


--
-- Name: EXTENSION prisma_postgres; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION prisma_postgres IS 'prisma_postgres';


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: prisma_migration
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'EXPIRED',
    'FAILED'
);


ALTER TYPE public."PaymentStatus" OWNER TO prisma_migration;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: prisma_migration
--

CREATE TYPE public."Role" AS ENUM (
    'TEACHER',
    'STUDENT',
    'PARENT'
);


ALTER TYPE public."Role" OWNER TO prisma_migration;

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: prisma_migration
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'TRIALING',
    'ACTIVE',
    'PAST_DUE',
    'CANCELED',
    'EXPIRED'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO prisma_migration;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO prisma_migration;

--
-- Name: assignment_progress; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.assignment_progress (
    "assignmentId" text NOT NULL,
    "frameSlug" text NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    correct integer DEFAULT 0 NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.assignment_progress OWNER TO prisma_migration;

--
-- Name: frames; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.frames (
    "moduleId" text NOT NULL,
    slug text NOT NULL,
    kind text NOT NULL,
    panel text NOT NULL,
    title text NOT NULL,
    note text,
    "order" integer NOT NULL,
    data jsonb NOT NULL
);


ALTER TABLE public.frames OWNER TO prisma_migration;

--
-- Name: modules; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.modules (
    id text NOT NULL,
    "subjectId" text NOT NULL,
    grade integer NOT NULL,
    semester integer NOT NULL,
    title text NOT NULL,
    subtitle text NOT NULL,
    summary text NOT NULL,
    "estimatedMinutes" text NOT NULL,
    accent text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.modules OWNER TO prisma_migration;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "assignmentId" text,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO prisma_migration;

--
-- Name: parent_assignments; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.parent_assignments (
    id text NOT NULL,
    "parentId" text NOT NULL,
    "childId" text NOT NULL,
    title text NOT NULL,
    description text,
    "materialId" text,
    "dueDate" timestamp(3) without time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "selectedFrames" jsonb
);


ALTER TABLE public.parent_assignments OWNER TO prisma_migration;

--
-- Name: parent_children; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.parent_children (
    id text NOT NULL,
    "parentId" text NOT NULL,
    "childId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.parent_children OWNER TO prisma_migration;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "userId" text NOT NULL,
    "planId" text NOT NULL,
    amount integer NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "xenditInvoiceId" text NOT NULL,
    "xenditInvoiceUrl" text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payments OWNER TO prisma_migration;

--
-- Name: plans; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.plans (
    id text NOT NULL,
    name text NOT NULL,
    "priceIdr" integer NOT NULL,
    "interval" text NOT NULL,
    "trialDays" integer,
    features jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.plans OWNER TO prisma_migration;

--
-- Name: progress_records; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.progress_records (
    "clientId" text NOT NULL,
    "moduleId" text NOT NULL,
    "frameSlug" text NOT NULL,
    "userId" text,
    completed boolean DEFAULT false NOT NULL,
    correct integer DEFAULT 0 NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.progress_records OWNER TO prisma_migration;

--
-- Name: questions; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.questions (
    id text NOT NULL,
    "assignmentId" text NOT NULL,
    "childId" text NOT NULL,
    "parentId" text NOT NULL,
    question text NOT NULL,
    reply text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "repliedAt" timestamp(3) without time zone
);


ALTER TABLE public.questions OWNER TO prisma_migration;

--
-- Name: reading_progress; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.reading_progress (
    id text NOT NULL,
    "childId" text NOT NULL,
    "materialId" text NOT NULL,
    "materialType" text NOT NULL,
    title text NOT NULL,
    "totalPages" integer DEFAULT 0 NOT NULL,
    "currentPage" integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'in_progress'::text NOT NULL,
    "lastReadAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reading_progress OWNER TO prisma_migration;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "refreshTokenHash" text NOT NULL,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone
);


ALTER TABLE public.sessions OWNER TO prisma_migration;

--
-- Name: subjects; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.subjects (
    id text NOT NULL,
    name text NOT NULL,
    "shortName" text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    accent text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subjects OWNER TO prisma_migration;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.subscriptions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "planId" text NOT NULL,
    status public."SubscriptionStatus" NOT NULL,
    "currentPeriodEnd" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO prisma_migration;

--
-- Name: users; Type: TABLE; Schema: public; Owner: prisma_migration
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    grade integer,
    semester integer,
    "birthDate" timestamp(3) without time zone,
    gender text,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.users OWNER TO prisma_migration;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
bd56149d-d9eb-47c9-8d6b-88b433c3903d	7676a60ce6857c80bac8bfb568c3a4a7cbadb5f76a8b1aa8e33e2f0bbce9b792	2026-08-13 04:23:06.933796+00	20260812084206_h5p_app	\N	\N	2026-08-13 04:23:05.440439+00	1
\.


--
-- Data for Name: assignment_progress; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.assignment_progress ("assignmentId", "frameSlug", completed, correct, total, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: frames; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.frames ("moduleId", slug, kind, panel, title, note, "order", data) FROM stdin;
terumbu-karang	f1	text	1.1	Selamat Datang di Bawah Laut	Panel pembuka — tone eksploratif, ajak siswa "menyelam"	0	{"body": "Terumbu karang menutupi kurang dari 1% dasar laut, tetapi menjadi rumah bagi hampir 25% seluruh spesies laut. Di modul ini kamu akan menjelajahi struktur terumbu karang, mengenal penghuninya, dan menguji pemahamanmu lewat beberapa aktivitas interaktif.", "imageAlt": "Terumbu karang berwarna-warni dengan ikan tropis", "imageQuery": "coral reef underwater tropical fish"}
terumbu-karang	f2	video	1.2	Video: Anatomi Terumbu Karang	Interactive video — jeda otomatis pada dua penanda untuk cek pemahaman	1	{"src": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "poster": "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=80", "markers": [{"id": "m1", "timeSec": 8, "question": {"id": "m1q", "prompt": "Apa yang membangun struktur keras terumbu karang?", "options": ["Rangka kalsium karbonat polip karang", "Pasir yang mengeras", "Karang lunak", "Rumput laut"], "explanation": "Polip karang mengeluarkan kalsium karbonat yang perlahan membentuk struktur terumbu yang keras.", "correctIndex": 0}}, {"id": "m2", "timeSec": 20, "question": {"id": "m2q", "prompt": "Alga simbiotik yang hidup di jaringan karang disebut?", "options": ["Plankton", "Zooxanthellae", "Diatom", "Fitoplankton"], "explanation": "Zooxanthellae adalah alga mikroskopis yang hidup bersimbiosis dengan polip karang dan memberi warna serta energi lewat fotosintesis.", "correctIndex": 1}}]}
terumbu-karang	f3	dragdrop	1.3	Cocokkan Penghuni dengan Zona Terumbu	Drag & drop — tarik setiap organisme ke zona habitatnya yang tepat	2	{"items": [{"id": "i1", "label": "🐢 Penyu Hijau", "zoneId": "z2"}, {"id": "i2", "label": "🐠 Ikan Badut", "zoneId": "z1"}, {"id": "i3", "label": "🦈 Hiu Karang", "zoneId": "z3"}, {"id": "i4", "label": "🐙 Gurita Karang", "zoneId": "z1"}, {"id": "i5", "label": "⭐ Bintang Laut", "zoneId": "z1"}, {"id": "i6", "label": "🐬 Lumba-lumba", "zoneId": "z3"}], "zones": [{"id": "z1", "hint": "Area penuh celah & anemon", "label": "Rataan Terumbu (dangkal)"}, {"id": "z2", "hint": "Vegetasi laut dangkal", "label": "Padang Lamun Sekitar"}, {"id": "z3", "hint": "Perairan lebih dalam & terbuka", "label": "Laut Terbuka di Tepi Terumbu"}], "instructions": "Seret setiap makhluk laut ke zona terumbu karang tempat ia biasa ditemukan."}
terumbu-karang	f4	text	1.4	Ancaman bagi Terumbu Karang	Konten penguatan sebelum kuis akhir	3	{"body": "Pemanasan suhu air laut dapat menyebabkan pemutihan karang (coral bleaching) — karang mengeluarkan zooxanthellae dan kehilangan warna serta sumber energinya. Faktor lain seperti polusi, penangkapan ikan merusak, dan pengasaman laut turut mempercepat kerusakan ekosistem ini.", "imageAlt": "Karang yang mengalami pemutihan", "imageQuery": "coral bleaching white reef"}
terumbu-karang	f5	quiz	1.5	Kuis Akhir: Uji Pemahamanmu	Kuis penutup modul — 3 soal pilihan ganda	4	{"questions": [{"id": "q1", "prompt": "Penyebab utama pemutihan karang (coral bleaching) adalah?", "options": ["Suhu air laut yang meningkat", "Terlalu banyak ikan", "Air laut yang terlalu dingin", "Cahaya bulan purnama"], "explanation": "Kenaikan suhu air laut memicu stres pada karang sehingga melepaskan zooxanthellae, menyebabkan warnanya memudar.", "correctIndex": 0}, {"id": "q2", "prompt": "Berapa persen spesies laut yang bergantung pada terumbu karang?", "options": ["5%", "10%", "Sekitar 25%", "90%"], "explanation": "Meski hanya menutupi kurang dari 1% dasar laut, terumbu karang menopang sekitar 25% spesies laut.", "correctIndex": 2}, {"id": "q3", "prompt": "Zooxanthellae memberi manfaat apa bagi karang?", "options": ["Perlindungan dari predator", "Energi lewat fotosintesis dan warna", "Membantu reproduksi", "Menjaga suhu air"], "explanation": "Lewat fotosintesis, zooxanthellae menyuplai sebagian besar energi karang sekaligus memberi warna alaminya.", "correctIndex": 1}]}
siklus-air	w1	text	2.1	Air yang Tak Pernah Habis	Panel pembuka — bangun rasa ingin tahu tentang siklus tertutup	0	{"body": "Air yang kamu minum hari ini bisa jadi pernah menjadi bagian dari lautan purba jutaan tahun lalu. Air terus bersirkulasi lewat siklus tertutup: menguap, berkumpul jadi awan, jatuh sebagai hujan, lalu mengalir kembali ke laut. Mari telusuri setiap tahapnya.", "imageAlt": "Ilustrasi siklus air dari laut ke awan", "imageQuery": "water cycle diagram clouds ocean"}
siklus-air	w2	video	2.2	Video: Tahapan Siklus Air	Interactive video — dua jeda untuk memeriksa pemahaman tahapan	1	{"src": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", "poster": "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&q=80", "markers": [{"id": "wm1", "timeSec": 8, "question": {"id": "wm1q", "prompt": "Proses berubahnya air menjadi uap air karena panas matahari disebut?", "options": ["Kondensasi", "Evaporasi", "Presipitasi", "Infiltrasi"], "explanation": "Evaporasi adalah proses air di permukaan (laut, sungai, danau) berubah menjadi uap air akibat panas matahari.", "correctIndex": 1}}, {"id": "wm2", "timeSec": 20, "question": {"id": "wm2q", "prompt": "Uap air yang mendingin di atmosfer dan membentuk awan mengalami proses?", "options": ["Evaporasi", "Transpirasi", "Kondensasi", "Limpasan"], "explanation": "Kondensasi terjadi saat uap air mendingin dan berubah kembali menjadi tetesan air kecil yang membentuk awan.", "correctIndex": 2}}]}
siklus-air	w3	dragdrop	2.3	Susun Urutan Tahapan Siklus Air	Drag & drop — cocokkan istilah dengan definisinya	2	{"items": [{"id": "wi1", "label": "☀️ Air laut menguap", "zoneId": "zw1"}, {"id": "wi2", "label": "💨 Tanaman melepas uap air (transpirasi)", "zoneId": "zw1"}, {"id": "wi3", "label": "☁️ Uap air membentuk awan", "zoneId": "zw2"}, {"id": "wi4", "label": "🌧️ Hujan turun ke daratan", "zoneId": "zw3"}, {"id": "wi5", "label": "🏞️ Air meresap ke tanah", "zoneId": "zw3"}, {"id": "wi6", "label": "🌊 Air mengalir kembali ke laut", "zoneId": "zw3"}], "zones": [{"id": "zw1", "hint": "Air berubah jadi uap", "label": "Penguapan"}, {"id": "zw2", "hint": "Uap air berkumpul jadi awan", "label": "Kondensasi"}, {"id": "zw3", "hint": "Air jatuh dan mengalir kembali", "label": "Presipitasi & Aliran"}], "instructions": "Seret setiap istilah ke kelompok tahapan siklus air yang sesuai."}
siklus-air	w4	text	2.4	Mengapa Siklus Air Penting?	Konten penguatan sebelum kuis akhir	3	{"body": "Siklus air menjaga ketersediaan air tawar bagi makhluk hidup, mengatur suhu bumi, dan mendukung pertanian. Perubahan iklim dapat mempercepat penguapan dan mengubah pola curah hujan, menyebabkan kekeringan di satu wilayah dan banjir di wilayah lain.", "imageAlt": "Sungai mengalir melalui hutan hijau", "imageQuery": "river flowing through green forest"}
mengenal-majas	b1	text	5.1	Bahasa yang Lebih Hidup	Panel pembuka — tunjukkan bahwa majas ada di sekitar kita	0	{"body": "Majas adalah gaya bahasa yang digunakan untuk membuat kalimat lebih hidup dan bermakna, bukan sekadar penyampaian fakta datar. Penulis dan penyair sering menggunakan majas untuk melukiskan perasaan atau membuat gambaran yang lebih kuat di benak pembaca.", "imageAlt": "Buku puisi terbuka dengan pena", "imageQuery": "open poetry book pen writing"}
siklus-air	w5	quiz	2.5	Kuis Akhir: Uji Pemahamanmu	Kuis penutup modul — 3 soal pilihan ganda	4	{"questions": [{"id": "wq1", "prompt": "Urutan tahapan siklus air yang benar adalah?", "options": ["Presipitasi → Evaporasi → Kondensasi", "Evaporasi → Kondensasi → Presipitasi", "Kondensasi → Presipitasi → Evaporasi", "Infiltrasi → Evaporasi → Presipitasi"], "explanation": "Air menguap (evaporasi), uap berkumpul membentuk awan (kondensasi), lalu jatuh sebagai hujan (presipitasi).", "correctIndex": 1}, {"id": "wq2", "prompt": "Apa yang menyebabkan perubahan iklim memengaruhi siklus air?", "options": ["Mempercepat rotasi bumi", "Mengubah pola penguapan dan curah hujan", "Menghentikan aliran sungai", "Mengurangi jumlah lautan"], "explanation": "Kenaikan suhu global mempercepat penguapan dan mengubah pola curah hujan, memicu kekeringan atau banjir ekstrem.", "correctIndex": 1}, {"id": "wq3", "prompt": "Proses air meresap ke dalam tanah disebut?", "options": ["Transpirasi", "Infiltrasi", "Sublimasi", "Kondensasi"], "explanation": "Infiltrasi adalah proses air hujan meresap ke dalam tanah dan menjadi bagian dari air tanah.", "correctIndex": 1}]}
rantai-makanan	c1	text	3.1	Siapa Makan Siapa?	Panel pembuka — kaitkan dengan pengalaman siswa mengamati alam	0	{"body": "Setiap makhluk hidup membutuhkan energi untuk bertahan hidup, dan energi itu berpindah dari satu organisme ke organisme lain lewat rantai makanan. Semuanya dimulai dari matahari, mengalir ke tumbuhan, lalu ke hewan pemakan tumbuhan, hingga hewan pemangsa di puncak rantai.", "imageAlt": "Padang rumput dengan berbagai hewan", "imageQuery": "savanna grassland animals ecosystem"}
rantai-makanan	c2	dragdrop	3.2	Kelompokkan Peran dalam Ekosistem	Drag & drop — kelompokkan organisme sesuai perannya	1	{"items": [{"id": "ci1", "label": "🌾 Rumput", "zoneId": "zc1"}, {"id": "ci2", "label": "🌳 Pohon", "zoneId": "zc1"}, {"id": "ci3", "label": "🐇 Kelinci", "zoneId": "zc2"}, {"id": "ci4", "label": "🦌 Rusa", "zoneId": "zc2"}, {"id": "ci5", "label": "🦁 Singa", "zoneId": "zc3"}, {"id": "ci6", "label": "🍄 Jamur", "zoneId": "zc4"}], "zones": [{"id": "zc1", "hint": "Menghasilkan makanan sendiri lewat fotosintesis", "label": "Produsen"}, {"id": "zc2", "hint": "Pemakan tumbuhan (herbivora)", "label": "Konsumen Primer"}, {"id": "zc3", "hint": "Pemangsa di puncak rantai (karnivora)", "label": "Konsumen Puncak"}, {"id": "zc4", "hint": "Menguraikan sisa organisme mati", "label": "Pengurai"}], "instructions": "Seret setiap organisme ke kelompok peran ekosistemnya yang tepat."}
rantai-makanan	c3	video	3.3	Video: Aliran Energi dalam Ekosistem	Interactive video — satu jeda untuk memeriksa pemahaman piramida energi	2	{"src": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", "poster": "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200&q=80", "markers": [{"id": "cm1", "timeSec": 6, "question": {"id": "cm1q", "prompt": "Mengapa jumlah energi berkurang di setiap tingkat rantai makanan?", "options": ["Karena hewan di tingkat atas makan lebih sedikit", "Sebagian energi hilang sebagai panas di setiap perpindahan", "Karena tumbuhan menyimpan semua energi", "Energi bertambah di setiap tingkat"], "explanation": "Setiap kali energi berpindah dari satu tingkat trofik ke tingkat berikutnya, sebagian besar terbuang sebagai panas melalui aktivitas metabolisme, sehingga jumlah energi yang tersedia semakin berkurang.", "correctIndex": 1}}]}
rantai-makanan	c4	quiz	3.4	Kuis Akhir: Uji Pemahamanmu	Kuis penutup modul — 3 soal pilihan ganda	3	{"questions": [{"id": "cq1", "prompt": "Organisme yang menghasilkan makanannya sendiri disebut?", "options": ["Konsumen", "Produsen", "Pengurai", "Predator"], "explanation": "Produsen, seperti tumbuhan dan alga, menghasilkan makanan sendiri lewat fotosintesis menggunakan energi matahari.", "correctIndex": 1}, {"id": "cq2", "prompt": "Apa peran jamur dan bakteri dalam rantai makanan?", "options": ["Sebagai konsumen puncak", "Sebagai produsen", "Menguraikan organisme mati menjadi nutrisi", "Menghasilkan oksigen utama"], "explanation": "Pengurai seperti jamur dan bakteri memecah sisa organisme mati menjadi nutrisi yang kembali menyuburkan tanah.", "correctIndex": 2}, {"id": "cq3", "prompt": "Herbivora dalam rantai makanan berperan sebagai?", "options": ["Produsen", "Konsumen primer", "Konsumen puncak", "Pengurai"], "explanation": "Herbivora memakan tumbuhan secara langsung, sehingga disebut konsumen primer (tingkat trofik kedua).", "correctIndex": 1}]}
pecahan-desimal	m1	text	4.1	Dua Cara Menulis Bilangan yang Sama	Panel pembuka — hubungkan pecahan dengan pembagian	0	{"body": "Pecahan seperti 1/2 dan desimal seperti 0,5 sebenarnya menunjukkan nilai yang sama, hanya ditulis dengan cara berbeda. Pecahan bisa diubah menjadi desimal dengan cara membagi pembilang (angka atas) dengan penyebut (angka bawah).", "imageAlt": "Papan tulis dengan pecahan dan desimal", "imageQuery": "math fractions decimals chalkboard"}
pecahan-desimal	m2	video	4.2	Video: Mengubah Pecahan ke Desimal	Interactive video — satu jeda untuk cek pemahaman cara pembagian	1	{"src": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", "poster": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&q=80", "markers": [{"id": "mm1", "timeSec": 7, "question": {"id": "mm1q", "prompt": "Hasil dari 3/4 jika diubah menjadi desimal adalah?", "options": ["0,34", "0,75", "0,43", "1,33"], "explanation": "3 dibagi 4 menghasilkan 0,75. Ingat: pembilang dibagi penyebut.", "correctIndex": 1}}]}
pecahan-desimal	m3	dragdrop	4.3	Cocokkan Pecahan dengan Desimalnya	Drag & drop — pasangkan pecahan dengan nilai desimal yang setara	2	{"items": [{"id": "mi1", "label": "1/2", "zoneId": "zm1"}, {"id": "mi2", "label": "2/4", "zoneId": "zm1"}, {"id": "mi3", "label": "1/4", "zoneId": "zm2"}, {"id": "mi4", "label": "25/100", "zoneId": "zm2"}, {"id": "mi5", "label": "3/4", "zoneId": "zm3"}, {"id": "mi6", "label": "75/100", "zoneId": "zm3"}], "zones": [{"id": "zm1", "hint": "Setengah", "label": "0,5"}, {"id": "zm2", "hint": "Seperempat", "label": "0,25"}, {"id": "zm3", "hint": "Tiga perempat", "label": "0,75"}], "instructions": "Seret setiap pecahan ke kelompok nilai desimal yang sama besar."}
pecahan-desimal	m4	quiz	4.4	Kuis Akhir: Uji Pemahamanmu	Kuis penutup modul — 3 soal pilihan ganda	3	{"questions": [{"id": "mq1", "prompt": "Bentuk desimal dari 1/5 adalah?", "options": ["0,15", "0,2", "0,5", "0,25"], "explanation": "1 dibagi 5 sama dengan 0,2.", "correctIndex": 1}, {"id": "mq2", "prompt": "Pecahan manakah yang senilai dengan 0,4?", "options": ["1/4", "2/5", "4/10 dan 2/5", "3/4"], "explanation": "4/10 dapat disederhanakan menjadi 2/5, keduanya sama dengan 0,4.", "correctIndex": 2}, {"id": "mq3", "prompt": "Untuk mengubah pecahan menjadi desimal, kita perlu?", "options": ["Mengalikan pembilang dan penyebut", "Membagi pembilang dengan penyebut", "Menjumlahkan pembilang dan penyebut", "Mengurangi penyebut dari pembilang"], "explanation": "Nilai desimal suatu pecahan diperoleh dengan membagi pembilang dengan penyebutnya.", "correctIndex": 1}]}
mengenal-majas	b2	video	5.2	Video: Contoh-Contoh Majas	Interactive video — satu jeda untuk menebak jenis majas	1	{"src": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", "poster": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=80", "markers": [{"id": "bm1", "timeSec": 6, "question": {"id": "bm1q", "prompt": "Kalimat \\"Angin berbisik lembut di telinga malam\\" menggunakan majas?", "options": ["Hiperbola", "Personifikasi", "Simile", "Metafora"], "explanation": "Personifikasi memberi sifat manusia (berbisik) pada benda mati/alam (angin), sehingga tergolong personifikasi.", "correctIndex": 1}}]}
mengenal-majas	b3	dragdrop	5.3	Kelompokkan Kalimat sesuai Jenis Majas	Drag & drop — cocokkan contoh kalimat dengan jenis majasnya	2	{"items": [{"id": "bi1", "label": "\\"Dia secepat kilat berlari\\"", "zoneId": "zb1"}, {"id": "bi2", "label": "\\"Bagaikan pinang dibelah dua\\"", "zoneId": "zb1"}, {"id": "bi3", "label": "\\"Hatinya sekeras batu\\"", "zoneId": "zb2"}, {"id": "bi4", "label": "\\"Dia adalah bintang kelas\\"", "zoneId": "zb2"}, {"id": "bi5", "label": "\\"Air matanya membanjiri ruangan\\"", "zoneId": "zb3"}, {"id": "bi6", "label": "\\"Suaranya menggelegar sekeras petir\\"", "zoneId": "zb3"}], "zones": [{"id": "zb1", "hint": "Perbandingan eksplisit — pakai kata \\"bagai\\", \\"seperti\\", \\"secepat\\"", "label": "Simile"}, {"id": "zb2", "hint": "Perbandingan langsung tanpa kata penghubung", "label": "Metafora"}, {"id": "zb3", "hint": "Melebih-lebihkan sesuatu", "label": "Hiperbola"}], "instructions": "Seret setiap kalimat ke kelompok jenis majas yang sesuai."}
mengenal-majas	b4	quiz	5.4	Kuis Akhir: Uji Pemahamanmu	Kuis penutup modul — 3 soal pilihan ganda	3	{"questions": [{"id": "bq1", "prompt": "Majas yang memberi sifat manusia pada benda mati disebut?", "options": ["Metafora", "Personifikasi", "Simile", "Ironi"], "explanation": "Personifikasi adalah majas yang memberikan sifat atau perilaku manusia pada benda mati.", "correctIndex": 1}, {"id": "bq2", "prompt": "Kalimat \\"Suaranya merdu bagai buluh perindu\\" adalah contoh majas?", "options": ["Hiperbola", "Personifikasi", "Simile", "Metafora"], "explanation": "Kalimat ini memakai kata \\"bagai\\" untuk membandingkan secara eksplisit, ciri khas simile.", "correctIndex": 2}, {"id": "bq3", "prompt": "Ciri utama majas hiperbola adalah?", "options": ["Membandingkan dua hal secara langsung", "Melebih-lebihkan suatu keadaan", "Memberi sifat manusia pada benda", "Menggunakan kata \\"bagai\\" atau \\"seperti\\""], "explanation": "Hiperbola digunakan untuk melebih-lebihkan sesuatu agar kesannya lebih kuat/dramatis.", "correctIndex": 1}]}
rukun-islam	p1	text	6.1	Lima Pondasi Keislaman	Panel pembuka — perkenalkan konsep rukun sebagai fondasi	0	{"body": "Rukun Islam adalah lima pondasi utama yang menjadi dasar praktik keislaman seorang muslim: syahadat, salat, zakat, puasa, dan haji. Kelimanya berperan seperti tiang penyangga sebuah bangunan — masing-masing memiliki peran penting untuk menguatkan keimanan dan ketakwaan.", "imageAlt": "Masjid dengan kubah dan menara saat senja", "imageQuery": "mosque dome minaret sunset"}
rukun-islam	p2	video	6.2	Video: Penjelasan Rukun Islam	Interactive video — satu jeda untuk cek pemahaman urutan	1	{"src": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", "poster": "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80", "markers": [{"id": "pm1", "timeSec": 6, "question": {"id": "pm1q", "prompt": "Rukun Islam yang pertama dan menjadi dasar keimanan adalah?", "options": ["Salat", "Syahadat", "Zakat", "Puasa"], "explanation": "Syahadat, yaitu ikrar kesaksian atas keesaan Allah dan kerasulan Nabi Muhammad SAW, adalah rukun Islam pertama dan pondasi bagi rukun lainnya.", "correctIndex": 1}}]}
rukun-islam	p3	dragdrop	6.3	Cocokkan Rukun Islam dengan Maknanya	Drag & drop — pasangkan setiap rukun dengan penjelasannya	2	{"items": [{"id": "pi1", "label": "Syahadat", "zoneId": "zp1"}, {"id": "pi2", "label": "Salat", "zoneId": "zp2"}, {"id": "pi3", "label": "Zakat", "zoneId": "zp3"}, {"id": "pi4", "label": "Puasa Ramadan", "zoneId": "zp4"}, {"id": "pi5", "label": "Haji", "zoneId": "zp5"}], "zones": [{"id": "zp1", "hint": "Kesaksian atas keesaan Allah", "label": "Ikrar keimanan"}, {"id": "zp2", "hint": "Penghubung hamba dengan Allah setiap hari", "label": "Ibadah lima waktu"}, {"id": "zp3", "hint": "Membersihkan harta & membantu sesama", "label": "Berbagi harta"}, {"id": "zp4", "hint": "Melatih kesabaran dan pengendalian diri", "label": "Menahan diri sebulan penuh"}, {"id": "zp5", "hint": "Bagi yang mampu, sekali seumur hidup", "label": "Ibadah ke Baitullah"}], "instructions": "Seret setiap rukun Islam ke penjelasan yang paling sesuai."}
rukun-islam	p4	quiz	6.4	Kuis Akhir: Uji Pemahamanmu	Kuis penutup modul — 3 soal pilihan ganda	3	{"questions": [{"id": "pq1", "prompt": "Berapa jumlah rukun Islam?", "options": ["3", "4", "5", "6"], "explanation": "Rukun Islam berjumlah lima: syahadat, salat, zakat, puasa, dan haji.", "correctIndex": 2}, {"id": "pq2", "prompt": "Ibadah puasa Ramadan bertujuan utama untuk melatih?", "options": ["Kekuatan fisik", "Kesabaran dan pengendalian diri", "Kemampuan berhitung", "Keterampilan berbicara"], "explanation": "Puasa melatih menahan diri dari makan, minum, dan hawa nafsu, sehingga menguatkan kesabaran dan pengendalian diri.", "correctIndex": 1}, {"id": "pq3", "prompt": "Ibadah haji wajib dilakukan oleh?", "options": ["Semua muslim tanpa terkecuali", "Muslim yang mampu secara fisik dan finansial", "Hanya laki-laki dewasa", "Hanya penduduk Arab Saudi"], "explanation": "Haji wajib bagi muslim yang telah mampu (istitha’ah) secara fisik, finansial, dan keamanan.", "correctIndex": 1}]}
bilangan-cacah-1000	bc1	text	1.A	Mengenal Bilangan Cacah sampai 1.000	Panel pembuka Bab 1 — sesuai peta konsep buku siswa	0	{"body": "Di bab ini kalian akan belajar banyak hal tentang bilangan cacah sampai 1.000: cara membaca dan menulisnya, menentukan nilai tempat setiap angka penyusunnya, membandingkan dan mengurutkan dua bilangan atau lebih, serta melakukan operasi hitung penjumlahan, pengurangan, perkalian, dan pembagian. Yuk, kita mulai dari cara membaca dan menulis bilangan!", "imageAlt": "Anak-anak belajar berhitung dengan balok angka", "imageQuery": "children counting number blocks classroom"}
bilangan-cacah-1000	bc1b	pdf	1.0	Baca Buku Aslinya (Opsional)	Panel referensi — sumber asli Bab 1 dari Buku Siswa Kemdikbud	1	{"src": "/materi/bab1-bilangan-cacah-1000.pdf", "description": "Ingin membaca penjelasan lengkap beserta gambar dan aktivitas kelompok dari buku aslinya? Buka atau unduh Bab 1 \\"Bilangan Cacah sampai 1.000\\" di bawah ini. Panel-panel berikutnya akan memandu kalian lewat versi interaktifnya."}
bilangan-cacah-1000	bc2	video	1.A	Video: Membaca dan Menulis Bilangan	Interactive video — satu jeda untuk cek cara membaca bilangan 3 angka	2	{"src": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", "poster": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&q=80", "markers": [{"id": "bc2m1", "timeSec": 6, "question": {"id": "bc2m1q", "prompt": "Bilangan 768 dibaca sebagai?", "options": ["Tujuh ratus enam puluh delapan", "Tujuh ribu enam ratus delapan", "Enam ratus tujuh puluh delapan", "Tujuh ratus delapan puluh enam"], "explanation": "Angka 7 menempati posisi ratusan, 6 menempati posisi puluhan, dan 8 menempati posisi satuan, sehingga dibaca \\"tujuh ratus enam puluh delapan\\".", "correctIndex": 0}}]}
bilangan-cacah-1000	bc3	dragdrop	1.A	Pasangkan Bilangan dengan Cara Membacanya	Drag & drop — diadaptasi dari Ayo Berlatih bagian A nomor 4	3	{"items": [{"id": "bc3i1", "label": "903", "zoneId": "bc3z1"}, {"id": "bc3i2", "label": "145", "zoneId": "bc3z2"}, {"id": "bc3i3", "label": "602", "zoneId": "bc3z3"}, {"id": "bc3i4", "label": "950", "zoneId": "bc3z4"}], "zones": [{"id": "bc3z1", "label": "Sembilan ratus tiga"}, {"id": "bc3z2", "label": "Seratus empat puluh lima"}, {"id": "bc3z3", "label": "Enam ratus dua"}, {"id": "bc3z4", "label": "Sembilan ratus lima puluh"}], "instructions": "Seret setiap lambang bilangan ke cara membaca yang tepat."}
bilangan-cacah-1000	bc4	text	1.B	Nilai Tempat: Ratusan, Puluhan, Satuan	Materi bagian B — konsep nilai tempat	4	{"body": "Setiap angka dalam sebuah bilangan memiliki nilai tempat yang berbeda-beda, tergantung posisinya. Pada bilangan 354, misalnya, angka 3 berada di posisi ratusan (bernilai 300), angka 5 di posisi puluhan (bernilai 50), dan angka 4 di posisi satuan (bernilai 4). Jadi, 354 = 3 ratusan + 5 puluhan + 4 satuan.", "imageAlt": "Balok nilai tempat ratusan puluhan satuan", "imageQuery": "place value blocks hundreds tens ones"}
bilangan-cacah-1000	bc5	dragdrop	1.B	Tentukan Nilai Tempat Angka 8	Drag & drop — diadaptasi dari Ayo Berlatih bagian B nomor 2	5	{"items": [{"id": "bc5i1", "label": "981", "zoneId": "bc5z2"}, {"id": "bc5i2", "label": "845", "zoneId": "bc5z1"}, {"id": "bc5i3", "label": "108", "zoneId": "bc5z3"}, {"id": "bc5i4", "label": "618", "zoneId": "bc5z3"}, {"id": "bc5i5", "label": "800", "zoneId": "bc5z1"}], "zones": [{"id": "bc5z1", "label": "Angka 8 = Ratusan"}, {"id": "bc5z2", "label": "Angka 8 = Puluhan"}, {"id": "bc5z3", "label": "Angka 8 = Satuan"}], "instructions": "Seret setiap bilangan ke kelompok sesuai nilai tempat angka 8 di dalamnya."}
bilangan-cacah-1000	bc5b	shortanswer	1.B	Isian Singkat: Uraikan Nilai Tempat	Isian singkat — diadaptasi dari Ayo Berlatih bagian B nomor 5 ("Isilah titik-titik")	6	{"items": [{"id": "bc5bi1", "prompt": "555 = ⬜ ratusan + 5 puluhan + 5 satuan. Berapa angka ratusannya?", "inputType": "number", "explanation": "555 terdiri atas 5 ratusan (500), 5 puluhan (50), dan 5 satuan (5).", "acceptedAnswers": ["5"]}, {"id": "bc5bi2", "prompt": "390 = 3 ratusan + ⬜ puluhan + 0 satuan. Berapa angka puluhannya?", "inputType": "number", "explanation": "390 terdiri atas 3 ratusan (300), 9 puluhan (90), dan 0 satuan.", "acceptedAnswers": ["9"]}, {"id": "bc5bi3", "prompt": "721 = 7 ratusan + 2 puluhan + ⬜ satuan. Berapa angka satuannya?", "inputType": "number", "explanation": "721 terdiri atas 7 ratusan (700), 2 puluhan (20), dan 1 satuan.", "acceptedAnswers": ["1"]}, {"id": "bc5bi4", "prompt": "493 = ⬜ ratusan + 9 puluhan + 3 satuan. Berapa angka ratusannya?", "inputType": "number", "explanation": "493 terdiri atas 4 ratusan (400), 9 puluhan (90), dan 3 satuan.", "acceptedAnswers": ["4"]}], "instructions": "Ketik angka yang tepat untuk melengkapi setiap penguraian nilai tempat berikut."}
bilangan-cacah-1000	bc6	quiz	1.C	Membandingkan dan Mengurutkan Bilangan	Kuis — diadaptasi dari Ayo Berlatih bagian C	7	{"questions": [{"id": "bc6q1", "prompt": "Tanda yang tepat untuk 378 ⬜ 345 adalah?", "options": ["<", ">", "=", "Tidak bisa dibandingkan"], "explanation": "378 lebih besar dari 345 karena angka ratusannya sama (3), namun angka puluhannya 7 lebih besar dari 4, jadi tandanya \\">\\".", "correctIndex": 1}, {"id": "bc6q2", "prompt": "Alfa memiliki 138 kelereng, Galih memiliki 103 kelereng, dan Andi memiliki 183 kelereng. Siapa yang memiliki kelereng paling banyak?", "options": ["Alfa", "Galih", "Andi", "Jumlahnya sama banyak"], "explanation": "Di antara 138, 103, dan 183, bilangan 183 adalah yang terbesar, jadi Andi memiliki kelereng paling banyak.", "correctIndex": 2}, {"id": "bc6q3", "prompt": "Urutan bilangan 325, 235, 532, dan 352 dari yang terbesar ke terkecil adalah?", "options": ["532, 352, 325, 235", "235, 325, 352, 532", "532, 325, 352, 235", "352, 532, 235, 325"], "explanation": "Dari yang terbesar ke terkecil: 532 (ratusan 5), lalu 352, 325 (ratusan 3, puluhan 5 vs 2), dan terakhir 235 (ratusan 2).", "correctIndex": 0}]}
bilangan-cacah-1000	bc7	dragdrop	1.D-F	Cocokkan Operasi Hitung dengan Hasilnya	Drag & drop — diadaptasi dari Ayo Berlatih bagian D (penjumlahan) & F (perkalian)	8	{"items": [{"id": "bc7i1", "label": "69 + 11", "zoneId": "bc7z1"}, {"id": "bc7i2", "label": "20 + 30", "zoneId": "bc7z2"}, {"id": "bc7i3", "label": "16 + 30 + 21", "zoneId": "bc7z3"}, {"id": "bc7i4", "label": "3 × 4", "zoneId": "bc7z4"}, {"id": "bc7i5", "label": "5 × 7", "zoneId": "bc7z5"}, {"id": "bc7i6", "label": "7 × 8", "zoneId": "bc7z6"}], "zones": [{"id": "bc7z1", "label": "Hasilnya 80"}, {"id": "bc7z2", "label": "Hasilnya 50"}, {"id": "bc7z3", "label": "Hasilnya 67"}, {"id": "bc7z4", "label": "Hasilnya 12"}, {"id": "bc7z5", "label": "Hasilnya 35"}, {"id": "bc7z6", "label": "Hasilnya 56"}], "instructions": "Seret setiap soal ke kotak hasil yang benar."}
bilangan-cacah-1000	bc7b	shortanswer	1.Asesmen	Isian Singkat: Latihan Operasi Hitung	Isian singkat — diadaptasi dari Asesmen akhir bab, nomor 4 ("Isilah titik-titik berikut")	9	{"items": [{"id": "bc7bi1", "prompt": "28 + 57 = ⬜", "inputType": "number", "explanation": "28 + 57 = 85.", "acceptedAnswers": ["85"]}, {"id": "bc7bi2", "prompt": "72 − 29 = ⬜", "inputType": "number", "explanation": "72 − 29 = 43.", "acceptedAnswers": ["43"]}, {"id": "bc7bi3", "prompt": "9 × 4 = ⬜", "inputType": "number", "explanation": "9 × 4 = 36.", "acceptedAnswers": ["36"]}, {"id": "bc7bi4", "prompt": "28 : 7 = ⬜", "inputType": "number", "explanation": "28 dibagi 7 sama dengan 4, karena 4 × 7 = 28.", "acceptedAnswers": ["4"]}, {"id": "bc7bi5", "prompt": "64 − 39 = ⬜", "inputType": "number", "explanation": "64 − 39 = 25.", "acceptedAnswers": ["25"]}, {"id": "bc7bi6", "prompt": "30 : 5 = ⬜", "inputType": "number", "explanation": "30 dibagi 5 sama dengan 6, karena 6 × 5 = 30.", "acceptedAnswers": ["6"]}], "instructions": "Ketik hasil dari setiap operasi hitung berikut."}
bilangan-cacah-1000	bc8	quiz	1.E-G	Kuis Akhir: Pengurangan dan Pembagian	Kuis penutup — diadaptasi dari Ayo Berlatih bagian E, G, dan Asesmen akhir bab	10	{"questions": [{"id": "bc8q1", "prompt": "Manakah pernyataan pengurangan berikut yang benar?", "options": ["61 − 21 = 41", "80 − 12 = 68", "92 − 20 − 12 = 50", "45 − 15 = 20"], "explanation": "80 − 12 = 68 benar. Perhatikan yang lain: 61 − 21 sebenarnya 40 (bukan 41), 92 − 20 − 12 sebenarnya 60 (bukan 50), dan 45 − 15 sebenarnya 30 (bukan 20).", "correctIndex": 1}, {"id": "bc8q2", "prompt": "Ayah memiliki 24 butir telur dan ingin memasukkannya ke 3 kotak sama banyak. Berapa isi setiap kotak?", "options": ["6 butir", "8 butir", "7 butir", "9 butir"], "explanation": "24 dibagi 3 sama dengan 8, karena 8 × 3 = 24. Jadi setiap kotak berisi 8 butir telur.", "correctIndex": 1}, {"id": "bc8q3", "prompt": "SD Suka Maju mengirim 22 siswa perempuan dan 19 siswa laki-laki untuk lomba paduan suara. Berapa jumlah seluruh siswa yang mengikuti lomba?", "options": ["31 siswa", "40 siswa", "41 siswa", "43 siswa"], "explanation": "22 + 19 = 41, jadi jumlah seluruh siswa yang mengikuti lomba paduan suara adalah 41 siswa.", "correctIndex": 2}]}
metamorposis	metamorfosis-sempurna-holometabola	text	1.1	Definisi Metamorfosis	Metamorfosis Sempurna (Holometabola)	0	{"body": "<p><strong>Metamorfosis</strong> adalah perubahan ukuran, bentuk, dan bagian-bagian tubuh hewan dari satu stadium ke stadium berikutnya. Proses ini terjadi pada hewan seperti serangga dan amfibi yang mengalami perubahan fisik dalam siklus hidupnya. Setiap stadium kehidupan hewan memiliki struktur dan fungsi tubuh yang berbeda, yang memungkinkan hewan tersebut berkembang menuju fase dewasa. Metamorfosis dikendalikan oleh hormon, yang memengaruhi perubahan dalam ukuran tubuh, organisasi jaringan, dan pembentukan bagian-bagian tubuh yang baru.</p>", "imageAlt": "Seekor capung sedang melakukan ekdisis terakhirnya, bermetamorfosis dari bentuk nimfanya", "imageUrl": "https://perpustakaan-belajar-api.vercel.app/uploads/3bb9525a-a1d3-447d-872e-eb638a060036.jpg"}
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.modules (id, "subjectId", grade, semester, title, subtitle, summary, "estimatedMinutes", accent, "createdAt", "updatedAt") FROM stdin;
terumbu-karang	ipas	5	2	Ekosistem Terumbu Karang	Modul interaktif — mengenal kehidupan bawah laut Indonesia	Jelajahi struktur terumbu karang, penghuninya, dan ancaman yang dihadapinya lewat video, drag & drop, dan kuis.	12-15 menit	#FF6F59	2026-08-13 05:39:50.56	2026-08-13 05:39:50.56
siklus-air	ipas	5	1	Siklus Air	Modul interaktif — perjalanan air dari laut ke langit dan kembali	Ikuti perjalanan setetes air lewat evaporasi, kondensasi, presipitasi, hingga infiltrasi lewat video, drag & drop, dan kuis.	10-12 menit	#2F80ED	2026-08-13 05:39:52.93	2026-08-13 05:39:52.93
rantai-makanan	ipas	5	1	Rantai Makanan	Modul interaktif — aliran energi dari produsen hingga pengurai	Pelajari peran produsen, konsumen, dan pengurai dalam ekosistem, lalu susun rantai makanan lewat aktivitas drag & drop.	8-10 menit	#2E9E5B	2026-08-13 05:39:54.449	2026-08-13 05:39:54.449
pecahan-desimal	matematika	5	1	Pecahan dan Desimal	Modul interaktif — mengubah pecahan menjadi bentuk desimal	Pahami hubungan pecahan dan desimal, lalu latihan mengonversi keduanya lewat video, drag & drop, dan kuis.	10-12 menit	#5B5FEF	2026-08-13 05:39:56.143	2026-08-13 05:39:56.143
mengenal-majas	bahasa-indonesia	6	1	Mengenal Majas	Modul interaktif — memperkaya tulisan dengan gaya bahasa	Kenali majas metafora, personifikasi, hiperbola, dan simile lewat contoh kalimat, video, drag & drop, dan kuis.	10-12 menit	#C1443C	2026-08-13 05:39:57.623	2026-08-13 05:39:57.623
bilangan-cacah-1000	matematika	3	1	Bilangan Cacah sampai 1.000	Modul interaktif — membaca, menulis, dan mengoperasikan bilangan cacah	Belajar membaca-menulis bilangan, nilai tempat, membandingkan, serta penjumlahan, pengurangan, perkalian, dan pembagian sampai 1.000 — mengikuti Buku Siswa Matematika Kelas III Kemdikbud.	20-25 menit	#5B5FEF	2026-08-13 05:40:00.391	2026-08-13 05:40:00.391
rukun-islam	pai	1	1	Rukun Islam	Modul interaktif — mengenal lima pondasi utama dalam Islam	Pelajari lima rukun Islam dan maknanya lewat video, drag & drop urutan, dan kuis pemahaman.	10-12 menit	#0E7C61	2026-08-13 05:39:59.057	2026-08-30 13:59:07.78
metamorposis	ipas	3	1	Metamorposis	Metamorfosis Sempurna (Holometabola).	<p><strong>Metamorfosis</strong> adalah <mark>proses perkembangan biologis pada hewan yang melibatkan perubahan ukuran, bentuk, dan struktur tubuh dari satu tahap ke tahap berikutnya hingga menjadi dewasa</mark></p>	10-15 menit	#5bc4e6	2026-09-06 09:53:56.591	2026-09-06 09:53:56.591
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.notifications (id, "userId", type, title, message, "assignmentId", read, "createdAt") FROM stdin;
\.


--
-- Data for Name: parent_assignments; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.parent_assignments (id, "parentId", "childId", title, description, "materialId", "dueDate", status, notes, "createdAt", "updatedAt", "selectedFrames") FROM stdin;
\.


--
-- Data for Name: parent_children; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.parent_children (id, "parentId", "childId", "createdAt") FROM stdin;
cmti1dzpx000104jr0ua8nu5a	cmthzr76i000004jxzpmxsb3u	cmti1dzp8000004jrtrq0nqux	2026-09-01 02:17:01.461
cmtn044rz000204i6la2xv3u5	cmthzr76i000004jxzpmxsb3u	cmtn044qy000004i6m7jeljjz	2026-09-04 13:40:12.719
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.payments (id, "userId", "planId", amount, status, "xenditInvoiceId", "xenditInvoiceUrl", "paidAt", "createdAt") FROM stdin;
cmt08hrs2000004jsgz5wmnor	cmsr39xrs0000vcg22jasip7c	basic	150000	PENDING	6a85c8b371f3431f22b1768d	https://checkout-staging.xendit.co/web/6a85c8b371f3431f22b1768d	\N	2026-08-19 15:16:03.938
cmt08j4yy000104jsdkulpq6u	cmsr39xrs0000vcg22jasip7c	pro	500000	PENDING	6a85c8f371f3431f22b1770c	https://checkout-staging.xendit.co/web/6a85c8f371f3431f22b1770c	\N	2026-08-19 15:17:07.69
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.plans (id, name, "priceIdr", "interval", "trialDays", features, "createdAt") FROM stdin;
free_trial	Free Trial	0	trial	14	["Semua fitur", "Berlaku 14 hari", "Tanpa kartu kredit"]	2026-08-13 05:40:03.356
basic	Basic	150000	month	\N	["Fitur utama", "Akses semua modul kelas 1-6", "Progres & riwayat belajar"]	2026-08-13 05:40:03.903
pro	Pro	500000	month	\N	["Semua fitur Basic", "Analytics & laporan lanjutan", "Dukungan prioritas"]	2026-08-13 05:40:04.156
\.


--
-- Data for Name: progress_records; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.progress_records ("clientId", "moduleId", "frameSlug", "userId", completed, correct, total, "updatedAt") FROM stdin;
\.


--
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.questions (id, "assignmentId", "childId", "parentId", question, reply, "createdAt", "repliedAt") FROM stdin;
\.


--
-- Data for Name: reading_progress; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.reading_progress (id, "childId", "materialId", "materialType", title, "totalPages", "currentPage", status, "lastReadAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.sessions (id, "userId", "refreshTokenHash", "userAgent", "createdAt", "expiresAt", "revokedAt") FROM stdin;
cmstut52t000004l68o6zzihq	cmsr39xrs0000vcg22jasip7c	1349c34703e748ed97afda4d672398dd15be765bb43eede8be59d84585e5ee80	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-15 04:06:22.709	2026-09-14 04:06:22.67	2026-08-15 04:07:02.078
cmsue73ls000004jo9mvrquqn	cmsr39xrs0000vcg22jasip7c	c6887b322c0604db6f69547d31f061c17494c310239c3673caa4ca6dd725036e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.133.0 Chrome/148.0.7778.280 Electron/42.8.0 Safari/537.36	2026-08-15 13:09:06.688	2026-09-14 13:09:06.663	2026-08-15 13:18:32.582
cmszvj0af000004l7kgbqb8fq	cmsr39xrs0000vcg22jasip7c	cead8ad340f03bc889ef969bad007283a9cf8e1ffc659f60ac8b28314699e3d4	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-19 09:13:06.615	2026-09-18 09:13:06.572	2026-08-19 09:28:40.801
cmszw315g000004l7p8roafcq	cmsr39xrs0000vcg22jasip7c	53ccf79ab81d92fe5fd4157087f9f4ddc74f849021f3ab5404ccc46bf8ec37f0	Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36	2026-08-19 09:28:40.852	2026-09-18 09:28:40.834	2026-08-19 10:52:01.047
cmszz27di000004jp7vcsvav6	cmsr39xrs0000vcg22jasip7c	3b8dfd4163c37a12fd2fcf1a3da5d2fbf0cb8a657b1aca91153ed5e5898af0d6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-19 10:52:01.11	2026-09-18 10:52:01.082	2026-08-19 11:43:21.983
cmt00w8o1000004jxrx7oi9qy	cmsr39xrs0000vcg22jasip7c	0df3c87e328c8d815f8d021daff399014d2b37b0ebb73839f3ad97dca90eb584	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-19 11:43:22.081	2026-09-18 11:43:22.041	2026-08-19 12:50:58.256
cmt03b6h8000004jj4gocbtry	cmsr39xrs0000vcg22jasip7c	dd174d7ca11425a575ba139f9eea8adc212815da2ee0339469827c1d23106568	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-19 12:50:58.316	2026-09-18 12:50:58.296	2026-08-19 15:11:15.444
cmt08bl8d000004ju66njztvp	cmsr39xrs0000vcg22jasip7c	b6358db93047bcde0a81efdc8de4222f12ed9439e7b59f6740645b99428bfe43	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-19 15:11:15.517	2026-09-18 15:11:15.495	2026-08-19 15:17:30.058
cmszv96ys000005l8c2kubzvj	cmsr39xrs0000vcg22jasip7c	112d03f65701c9b96390437e7dd2a1aac463fc6c106669441085992471255fdf	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.133.0 Chrome/148.0.7778.280 Electron/42.8.0 Safari/537.36	2026-08-19 09:05:28.708	2026-09-18 09:05:28.67	2026-08-20 08:58:12.004
cmt1b4dwl000004kv5mzv9hfg	cmsr39xrs0000vcg22jasip7c	f5715e3763f4dd030c6ddc875ef95507d45b2071338d1d442fae70c5a29db43f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-20 09:17:24.453	2026-09-19 09:17:24.414	2026-08-20 09:23:59.848
cmt1aiau1000104l48ob3w0np	cmsr39xrs0000vcg22jasip7c	d5384fb8136bdeb4ec9345cf74ab66128985bae6fd56737ead570f0d232f995c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-20 09:00:14.041	2026-09-19 09:00:14.031	2026-08-20 09:00:52.541
cmt1ajdjc000004jstdbobok2	cmsr3a17h0003vcg2sfsat140	34b60610654040585966d10502e5975abc71f14db0fdc5024381e0ed5ec419dd	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-20 09:01:04.2	2026-09-19 09:01:04.185	2026-08-20 09:04:42.561
cmt1bf1fi000004js9pvc7n1d	cmsr3a17h0003vcg2sfsat140	7fe7ab212f0c3580cda5dbf0081d855017b25d5f1e80acb7e61d732ff0de06b5	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-20 09:25:41.502	2026-09-19 09:25:41.488	2026-08-20 11:04:32.654
cmt1ey5zv000004l2dw8u5vqa	cmsr3a17h0003vcg2sfsat140	ebbf5ede2e9b53344a23b47a1023c6b7c257e18f5b91463a647029b75e426f33	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	2026-08-20 11:04:32.731	2026-09-19 11:04:32.692	2026-08-20 11:04:33.124
cmt1afoq9000004l4rjaysesx	cmsr39xrs0000vcg22jasip7c	2a0f49ee5dd8b6da6b9360b4b868ec24bac20e85c56cf3b3f8e26e1194aed3b5	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.133.0 Chrome/148.0.7778.280 Electron/42.8.0 Safari/537.36	2026-08-20 08:58:12.081	2026-09-19 08:58:12.061	2026-08-24 02:37:07.41
cmt6ml0ys000004i9zkgniqzv	cmsr39xrs0000vcg22jasip7c	807e3f39681bc52949aee8a9b1ac6573225b488a62d5d617f26c11ab28483394	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.133.0 Chrome/148.0.7778.280 Electron/42.8.0 Safari/537.36	2026-08-24 02:37:07.492	2026-09-23 02:37:07.479	2026-08-24 03:37:55.291
cmt6or7o9000004l581h74pjg	cmsr39xrs0000vcg22jasip7c	d9bb080d6eb8864467386f3f5b80cb2dd39285ddba9214cb8e6d9daf594dce4c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.133.0 Chrome/148.0.7778.280 Electron/42.8.0 Safari/537.36	2026-08-24 03:37:55.353	2026-09-23 03:37:55.342	\N
cmte7vfa9000004jl70evbhyk	cmsr39xrs0000vcg22jasip7c	3a5b645f1fc6f2b71493f67954ce398b560b58518d9fd1576b7afbbc41616339	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-29 10:07:27.778	2026-09-28 10:07:27.756	2026-08-29 10:59:20.883
cmte7uokd000204ldqrzn2wom	cmte7uoj5000004ldd2nu0njp	49e639bbc2148578ccb5b7b5ecb8a2c514a9f14ee277c60b693913935891240e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-29 10:06:53.149	2026-09-28 10:06:53.148	2026-08-29 10:07:07.729
cmte9q5tv000004iijha71rd6	cmsr39xrs0000vcg22jasip7c	b11cdc029dee68e37ff6d17c09f8ae8fc496f4a5de6c92fd4636072a541e8eb6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-29 10:59:21.475	2026-09-28 10:59:21.468	2026-08-29 11:56:47.641
cmtebs0xd000004jlyfaq69ts	cmsr39xrs0000vcg22jasip7c	69bf41add937aabfe02b63347b69f5d675bf6e9d8ce2f1a2542a60415335e6ea	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-29 11:56:47.665	2026-09-28 11:56:47.659	2026-08-29 12:12:15.417
cmtecbwsy000004jmo66909d0	cmsr39xrs0000vcg22jasip7c	fe0cc1649ae5ec992b716de6ca012f4f947e3df445e081dcd6a189e187e6cc46	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-29 12:12:15.442	2026-09-28 12:12:15.436	2026-08-29 12:33:51.087
cmted3ojp000004jfmcyj0n5t	cmsr39xrs0000vcg22jasip7c	f179e9aa2aa37bc2d9d471634cf02eddb78b503e75c81d5c760f3d677772acb9	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-29 12:33:51.109	2026-09-28 12:33:51.104	2026-08-29 23:41:28.327
cmtf0y8wu000004l20nzzlrra	cmsr39xrs0000vcg22jasip7c	98775b445e72f95bba67c43541bc4f078a1a26a6b231e4bb24307a29a437be85	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-29 23:41:28.35	2026-09-28 23:41:28.345	2026-08-29 23:42:31.05
cmtf2og9v000004l8ld4xufrs	cmsr39xrs0000vcg22jasip7c	82b71145ba5656904bea242ff1b1dc52c824689bec746cbcd2ebf9c041539e5e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 00:29:50.563	2026-09-29 00:29:50.544	2026-08-30 01:03:05.741
cmtf3v7s7000004k0lopru1v9	cmsr39xrs0000vcg22jasip7c	d2046d8f3854916e264e94118a0c1fed4056c8e211c619a5fb2645b3755a8255	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 01:03:05.767	2026-09-29 01:03:05.762	2026-08-30 01:03:06.127
cmtfdisuc000004l84fyyq0iz	cmsr39xrs0000vcg22jasip7c	98ddeb019ec3ab753c00a81fbab181daa41c310edf9d6a45df25a908c24e0563	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 05:33:22.692	2026-09-29 05:33:22.682	2026-08-30 05:46:58.849
cmtfko4i3000004jvs1sdu6sx	cmsr39xrs0000vcg22jasip7c	c521b522d2694eae3443429261f5c02b7c2c004fcc782a42bb48878d968ea75c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 08:53:28.395	2026-09-29 08:53:28.379	2026-08-30 09:20:50.878
cmtflnbv9000004jo963hz55r	cmsr39xrs0000vcg22jasip7c	5555422a556f764993831b7d39e97a40932c6e008d8249974938882327f6c4a7	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 09:20:50.901	2026-09-29 09:20:50.896	2026-08-30 09:20:51.267
cmtfnylgi000004kzv4btsem1	cmsr39xrs0000vcg22jasip7c	28fdecf923e4e99a95ff015e288edd9a5789325111592e31380c0d1ff6665e87	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 10:25:35.778	2026-09-29 10:25:35.769	2026-08-30 10:47:05.963
cmtfoq8zl000004jlagrv68ke	cmsr39xrs0000vcg22jasip7c	645b39762576c9bbf3118a96165230b952677cb0616f8eea1d272f64578289fe	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 10:47:05.986	2026-09-29 10:47:05.98	2026-08-30 11:03:43.444
cmtfpbmng000004l5dqqz4du3	cmsr39xrs0000vcg22jasip7c	3bccdc6067cdc9e81afcdd57c970ab2082c7b1099136a4c7308757fef7097dbe	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 11:03:43.468	2026-09-29 11:03:43.462	2026-08-30 11:22:35.216
cmtfpzvxk000004js0oxmcduz	cmsr39xrs0000vcg22jasip7c	a0a66ff93fc6cd5c8b558f9211c7aa9bfd6a6f1a2bb44672cb3440dc4ea25b0d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 11:22:35.24	2026-09-29 11:22:35.234	\N
cmtfu1g0t000004jsd2qmlg8l	cmsr3a17h0003vcg2sfsat140	fa16a9a628b507a306590a27cc79bcaa62d755cddbd2739cedadf8b14f1533ed	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 13:15:46.397	2026-09-29 13:15:46.389	2026-08-30 13:16:18.427
cmtfu2kos000004l5zqrd2eno	cmsr39xrs0000vcg22jasip7c	37729d592725014de5f28f9201b9dea8b29b576c90442d3b94ecfd5a64d906f9	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 13:16:39.1	2026-09-29 13:16:39.081	2026-08-30 13:32:17.518
cmtfump2g000004lh38rlfxcl	cmsr39xrs0000vcg22jasip7c	3e606711d8306871bccbb61395b5dfcb42916398b9aa56a9d21928a8749059c8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 13:32:17.896	2026-09-29 13:32:17.891	2026-08-30 13:47:17.865
cmtfv5zi7000004jvw0twrp5t	cmsr39xrs0000vcg22jasip7c	960a9499a809dfc5b548e9e5be582cf6983f9350ba5f72bc8c7c8dd8ef1d5442	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 13:47:17.887	2026-09-29 13:47:17.882	2026-08-30 14:15:22.566
cmtfw63jn000004jpxepd2edm	cmsr39xrs0000vcg22jasip7c	54cba9d4a7a93a8bf5b21db24ff4f0a6a4c08ad1ad77cf03efc6280179e605e7	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 14:15:22.739	2026-09-29 14:15:22.733	2026-08-30 14:35:06.582
cmtfwvh0v000004l1vm74zlks	cmsr39xrs0000vcg22jasip7c	5b236740bbf2fbec5c13e2f07c847d81486dcae6629b73eb668f0d9374aa6706	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 14:35:06.607	2026-09-29 14:35:06.601	2026-08-30 14:52:03.461
cmtfxh9vz000004jucsjdc1y7	cmsr39xrs0000vcg22jasip7c	b1b8dd5ce5788641cacfdcb64df53e72c9bd2dfd848157866b437d7899e86297	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 14:52:03.792	2026-09-29 14:52:03.785	2026-08-30 14:59:34.183
cmtfxs0o9000004k1il09jfv1	cmsr39xrs0000vcg22jasip7c	b126a5ccd2ebef3c4f4ae80d4551ee986af1d5bc65c1274d965ffd2f805f9055	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 15:00:25.065	2026-09-29 15:00:25.06	2026-08-30 22:06:51.238
cmtgd0f3x000004juifnjj6ek	cmsr39xrs0000vcg22jasip7c	1e2344117de574125739f00d4edd8ba28e85a8a1d82300a1d87bc1bc7b54ebc3	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 22:06:51.261	2026-09-29 22:06:51.256	2026-08-30 22:15:18.025
cmtgdvk9x000004k022496zca	cmsr39xrs0000vcg22jasip7c	968763564ac94325109463fb0a89ba08250728bd7e71436d7506146e3d6ea519	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 22:31:04.293	2026-09-29 22:31:04.284	2026-08-30 23:07:44.36
cmtgf6pvi000004l4zgaws8lu	cmsr39xrs0000vcg22jasip7c	163829118f1d9565956a07922aebebbd49c6e6c793617b60d321b5f5bb94cc11	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 23:07:44.382	2026-09-29 23:07:44.376	2026-08-30 23:19:11.262
cmtgfnjkd000104l45x2g3nib	cmsr39xrs0000vcg22jasip7c	0ce97128ebaa7dda319d5c6d38de725b49010631167782c60bdf2916b8d277fe	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 23:20:49.357	2026-09-29 23:20:49.356	2026-08-30 23:21:01.56
cmtgfr0ys000204l4e3yirv7v	cmsr39xrs0000vcg22jasip7c	c5b2ab969f2465e814deb12f099ab742c68bed5f7449dbbdec2b58a57bac43ab	Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36	2026-08-30 23:23:31.876	2026-09-29 23:23:31.875	2026-08-30 23:23:53.396
cmtgftuk0000004jn67xce068	cmsr39xrs0000vcg22jasip7c	d63b40b04d3066c493a254800b71834bd4aff700b70738dc0854c78f11688230	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-30 23:25:43.536	2026-09-29 23:25:43.531	2026-08-30 23:25:55.967
cmtgi65oy000004l56e0xurkp	cmsr39xrs0000vcg22jasip7c	def80f1bc48743163aa38ca4a0831ea0138aaa95689ae4351a008bb363811841	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 00:31:17.074	2026-09-30 00:31:17.057	2026-08-31 00:50:13.037
cmtgiui82000004jlmuxdccpr	cmsr39xrs0000vcg22jasip7c	a655d9eaa5c81c24c3be9d2d67f7a6b98943ce26b9e8fcf887e3a57fdd54d161	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 00:50:13.059	2026-09-30 00:50:13.053	2026-08-31 01:07:51.132
cmtgjh6nm000004ksd47mz9y4	cmsr39xrs0000vcg22jasip7c	233637071020aaf899a371d7130d1766958f92fa210c5271a96e4722bab6cde1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 01:07:51.154	2026-09-30 01:07:51.149	2026-08-31 01:11:08.091
cmtgjlrk4000004l77maaiq1c	cmsr39xrs0000vcg22jasip7c	ca5d09658d8b28f1f220e7bca7683bd4d3282bd97094b4c218bae6bcc3bc2662	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 01:11:24.869	2026-09-30 01:11:24.854	2026-08-31 01:11:27.41
cmtgjmv2g000104l702rfhyl6	cmsr39xrs0000vcg22jasip7c	38194bc6182c1a1771c832ab7a2f67eb3f2133df0311e855d50b55422ccff04b	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 01:12:16.072	2026-09-30 01:12:16.072	2026-08-31 01:25:50.241
cmtgk4mup000204l7p4q3jhh2	cmsr39xrs0000vcg22jasip7c	2c268b3b68fbed96409291bdd932da03851e76b9b966d8ff6220f7f659473c56	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 01:26:05.233	2026-09-30 01:26:05.233	2026-08-31 01:45:18.253
cmtgktcjp000004jldl0cr2wx	cmsr39xrs0000vcg22jasip7c	829d0dca0630643f989b609818b2fb5b336d5aa48f69864a44456fa86903282d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 01:45:18.278	2026-09-30 01:45:18.271	2026-08-31 02:35:42.9
cmtgmm6dn000004iawu0i52e3	cmsr39xrs0000vcg22jasip7c	7ee19c8ad5023bccb2c80b07086cc1af65a1057a0e0a4b6edf38c8f2c41dc8e4	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 02:35:42.923	2026-09-30 02:35:42.918	2026-08-31 02:51:31.885
cmtgn6ime000004k0p74vxbhm	cmsr39xrs0000vcg22jasip7c	6ce0061f45a0a6008fa0841d5718b13e8c4ce12c2410c662e79211a5147316e1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 02:51:31.91	2026-09-30 02:51:31.905	2026-08-31 03:07:06.04
cmtgnqjf2000004l4j1jidfjf	cmsr39xrs0000vcg22jasip7c	385367a40e6cfa9c81410216e5e959a9df8d2928f52f1127a768f3a6ee2bd42c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 03:07:06.062	2026-09-30 03:07:06.057	\N
cmtgxke6l000004l470sph4c0	cmsr3a17h0003vcg2sfsat140	91d0f896cf35bd724696f53db88a2e12ca3a5593b7ca3568db2cb979990f6156	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 07:42:15.501	2026-09-30 07:42:15.481	2026-08-31 08:17:38.184
cmtgytw2k000004ifkmpb56kf	cmsr3a17h0003vcg2sfsat140	0fd9b8d1087d915d7f2742c86017bdc58a689c7824a55aab5f43cbe520c9e10f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 08:17:38.204	2026-09-30 08:17:38.2	2026-08-31 08:58:31.609
cmth0ah5a000004l8a0kwwyba	cmsr3a17h0003vcg2sfsat140	810aa878378297dde868d6db84ed6dc93c40c633ae44f13535892ac75efd8224	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 08:58:31.63	2026-09-30 08:58:31.625	2026-08-31 09:13:55.327
cmth0u9w5000004le4ixiwafu	cmsr3a17h0003vcg2sfsat140	ed1aee087d5318671289c07c5edde692ebc92f1225b1a21b0b1bc81f5a431f9d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 09:13:55.349	2026-09-30 09:13:55.344	2026-08-31 09:36:17.382
cmth1n1fi000004k2k32wicaf	cmsr3a17h0003vcg2sfsat140	a1052394f700357c019570c2a77a5a5cdc91b625251b8a50633fc8616da6990a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 09:36:17.406	2026-09-30 09:36:17.401	2026-08-31 10:15:21.639
cmth31a9u000004l7ffpebnep	cmsr3a17h0003vcg2sfsat140	4d2a2d2995459029948019be18db20037d5d413cbc3456ae840e02c52b6b0d08	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 10:15:21.666	2026-09-30 10:15:21.656	2026-08-31 10:15:24.765
cmth3229v000004jo9ro5caxh	cmsr3a17h0003vcg2sfsat140	1ba42839995b05b9e9ce15b08f9d0a862e5e0ffc4c1ef329eebdc46f298e8ce5	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 10:15:57.955	2026-09-30 10:15:57.949	2026-08-31 10:16:20.819
cmth33ljf000004ktra0urn6u	cmte7uoj5000004ldd2nu0njp	b35b92a3a17c04ed41d21c19b720529e19b8cdf063da967044a58607cf1fe7d6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 10:17:09.579	2026-09-30 10:17:09.562	2026-08-31 10:17:55.94
cmth34u5s000104jo7ayycj8b	cmte7uoj5000004ldd2nu0njp	79b1b9836535feec60fb98ab166c9b5727733b6c547f0cf5be42bd480ea06beb	Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36	2026-08-31 10:18:07.408	2026-09-30 10:18:07.399	\N
cmths51gu000204lh0qs3iwog	cmths51fd000004lhcodvnpbj	244554730128a0617f945b75f14a91691d6be6dd33eb9bf5df2a820122601c98	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 21:58:07.279	2026-09-30 21:58:07.277	2026-08-31 22:13:55.098
cmthspd0h000005jsu4qm7n5c	cmths51fd000004lhcodvnpbj	414b672ed65417f0640e87918188fc1c92e25875b3e148214e544921b5d2f65e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 22:13:55.361	2026-09-30 22:13:55.355	2026-08-31 23:11:33.958
cmthurhp9000004ib3fslg13o	cmths51fd000004lhcodvnpbj	e2de2d7a9fa12b697c3bcbbeac9224403a44c2604da837c1e86a4737901116c0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-08-31 23:11:33.981	2026-09-30 23:11:33.976	2026-09-01 00:42:54.145
cmthy0y8w000004l4adx11234	cmths51fd000004lhcodvnpbj	69b64e78f0271ed2f87726bfe96d1715a18322bca113a36d64413b2178236d68	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 00:42:54.176	2026-10-01 00:42:54.17	2026-09-01 01:29:06.447
cmthzodd4000004juxjab8psk	cmths51fd000004lhcodvnpbj	342028618b66dc89f6e1e72ffe6b6244537df489d98b5dd9e0f230d9ca65ba00	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 01:29:06.472	2026-10-01 01:29:06.466	\N
cmthzonzt000004jsxx06l0z9	cmsr3a17h0003vcg2sfsat140	834dc641b0e55d21673abb23328aaa1b60bbb6a4d819c214f49c7ed772815167	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 01:29:20.249	2026-10-01 01:29:20.231	2026-09-01 01:29:28.388
cmthzp5wn000004l38p9s7hu1	cmths51fd000004lhcodvnpbj	dd67fa6de65a85cbbcb6dd580e8baf95f4b15d7be2f1b7b121c73ea5d921d2ee	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 01:29:43.463	2026-10-01 01:29:43.446	2026-09-01 01:30:37.113
cmthzr77n000204jx4menlc00	cmthzr76i000004jxzpmxsb3u	49ce567f3a3a78e5c45c5f4498ac5789713fd7df2d4a099c6ba9c0e57a8b7e16	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 01:31:18.467	2026-10-01 01:31:18.466	2026-09-01 01:36:34.192
cmti0xtjg000004i83s7p1qjq	cmthzr76i000004jxzpmxsb3u	003435b04333be4e63dac0c725ded69a5bd0f059c5fe6315482f27d571f52ddb	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 02:04:26.957	2026-10-01 02:04:26.939	2026-09-01 02:18:31.905
cmti1gass000304jrpzta2ian	cmti1dzp8000004jrtrq0nqux	7d56ea6d09900fefaf0c566b77e0e4d22cba3c64621dad18fd7d995da414ea9a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 02:18:49.132	2026-10-01 02:18:49.131	2026-09-01 02:30:32.926
cmti1vox9000004kyqxyh0krk	cmthzr76i000004jxzpmxsb3u	82eeb60a510863904a4f25848ae004ddb637bdfe7e05d04651af50c6e4ceb77b	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 02:30:47.277	2026-10-01 02:30:47.271	2026-09-01 02:31:44.503
cmti1xc2j000104jssqdsngr3	cmti1dzp8000004jrtrq0nqux	a6e326821f33234c9e92ea1e2f48695f935a12067ba6c5cc7cff80ac0e5ffb71	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 02:32:03.931	2026-10-01 02:32:03.929	2026-09-01 03:21:24.831
cmti3osqe000004i65qkr5i8p	cmti1dzp8000004jrtrq0nqux	c74abef0710603fe357ec67a19a2c0c2869f097e4afd4713fb37cfc4da5088d0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 03:21:24.854	2026-10-01 03:21:24.849	2026-09-01 03:22:42.009
cmti3qrgz000004l1ygf8qg28	cmthzr76i000004jxzpmxsb3u	dea7480a0bab3ee5b3b8fc60656c8b06c8c725de522d567decdc5a7a94965534	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 03:22:56.532	2026-10-01 03:22:56.527	2026-09-01 03:23:51.928
cmti3s8k3000004icyjaee1zt	cmti1dzp8000004jrtrq0nqux	7b2fbd373dd7a94fb5f5aab42e0ffcc6a15e9a57add11b4290647a6e508c4a1e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 03:24:05.331	2026-10-01 03:24:05.327	2026-09-01 03:42:14.945
cmti4flhi000004jpq6571ur1	cmti1dzp8000004jrtrq0nqux	4aaebfdfb6dbe84d0c3dd39707d93419a04aa7ded6c0d3f7a79992d652609c00	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 03:42:15.174	2026-10-01 03:42:15.169	2026-09-01 03:43:42.03
cmti4humw000004ieu1hegna0	cmti1dzp8000004jrtrq0nqux	1c90ddff6e46355210a2da1e75c14f1b218c6e8e0a34e9b8f1f626d7c7ba91bd	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 03:44:00.345	2026-10-01 03:44:00.327	2026-09-01 04:05:18.885
cmti5996l000004kygnu4f9cf	cmti1dzp8000004jrtrq0nqux	59e818bf8e66ae57a77d663b47db9a64b4532d06e44411fe2ad66a11f049c403	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 04:05:18.909	2026-10-01 04:05:18.903	2026-09-01 04:05:31.968
cmti59vkc000004jra8wgphjv	cmthzr76i000004jxzpmxsb3u	5e93de75e4a2f4bd76c1242cc995128a19fecd3760e80b641e84f74df4a536f6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 04:05:47.916	2026-10-01 04:05:47.91	2026-09-01 04:34:38.327
cmti6ayrw000004jip7hxiq5h	cmthzr76i000004jxzpmxsb3u	1e5add243840ea5bd4840a9c6d18067e3948fdb8a4b878a7562008964eb329b2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 04:34:38.349	2026-10-01 04:34:38.344	2026-09-01 05:36:27.386
cmti8igpd000004l82dpduj5d	cmthzr76i000004jxzpmxsb3u	2d45bc78a61f3a453a65eb0436aba16ca5f8217b01043d4164b58b624daa4291	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 05:36:27.41	2026-10-01 05:36:27.404	2026-09-01 05:36:41.717
cmti8j1wx000104l8q2ylv21v	cmti1dzp8000004jrtrq0nqux	90250a43c8d6ab14db76884891688c9a5fca18c62b4f665e40426109e4aa5a27	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 05:36:54.897	2026-10-01 05:36:54.886	2026-09-01 07:21:00.847
cmtic8xft000004lbt7wa7coj	cmti1dzp8000004jrtrq0nqux	a2fb2430ed4ff57f68de8b484e23bc902bc717ed48ce22e8a1226e7301fb41ce	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 07:21:01.002	2026-10-01 07:21:00.995	2026-09-01 07:21:35.151
cmtica0ez000004jupup7761o	cmthzr76i000004jxzpmxsb3u	0dbf0dc61c5d82aadc1e4b34e7b408374b022b4883d4dd60032b99a510d257fb	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 07:21:51.515	2026-10-01 07:21:51.498	2026-09-01 07:26:23.54
cmticg759000104kzkue8owwb	cmti1dzp8000004jrtrq0nqux	f3abe399849f1f0eb44e1dd677c41ea76fe676245ff55078232f7eeb2e3c2b9e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 07:26:40.173	2026-10-01 07:26:40.172	2026-09-01 07:40:42.045
cmticyjhr000004k02hyndtdg	cmti1dzp8000004jrtrq0nqux	941648ba8e16f2d0a35392b55f9476774c8e473465e72832cb9161493672a991	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 07:40:55.983	2026-10-01 07:40:55.977	2026-09-01 07:51:00.781
cmtidbtrm000104k0qghjnk44	cmti1dzp8000004jrtrq0nqux	27a51b201bff1d735209a4b11d7d31dd56d087f85269c3348800363cdd52b757	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 07:51:15.826	2026-10-01 07:51:15.826	2026-09-01 08:09:18.015
cmtidz0t6000004lask5ynvcl	cmti1dzp8000004jrtrq0nqux	9c331e91599b2e13b78e0021914c8e1c3a9373902c21de62ecfccd5eac5376c3	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 08:09:18.043	2026-10-01 08:09:18.033	2026-09-01 08:48:02.743
cmtifcuku000004ihaiore3rz	cmti1dzp8000004jrtrq0nqux	2ee96010133f008056873ceeb20c6e5339172efc746f077294aacb9dc7129f96	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 08:48:02.766	2026-10-01 08:48:02.761	2026-09-01 09:07:33.835
cmtig1y7a000004ksyo8vbtmr	cmti1dzp8000004jrtrq0nqux	8e32a4f7e48c98d2da058a016e270a0ce12f364f7d6b5aa354afd36b9c3805e7	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 09:07:33.863	2026-10-01 09:07:33.852	2026-09-01 09:18:02.805
cmtigfof8000004jp8jo32x3a	cmthzr76i000004jxzpmxsb3u	0e49ad04a452e21d418323109054fa7da61c4c168a66314f9af2c297c39a4e79	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 09:18:14.372	2026-10-01 09:18:14.353	2026-09-01 09:19:41.743
cmtigiaqf000204kzfinxkz13	cmti1dzp8000004jrtrq0nqux	e643dc38d24c157d40de405d8f77e7b1f8db400a42d80139d4625828ca1e448a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 09:20:16.599	2026-10-01 09:20:16.599	2026-09-01 11:27:48.715
cmtil2b7x000004l2f0je7ayy	cmti1dzp8000004jrtrq0nqux	a444f30932ca615a8ba05108662d322441e51d8fefeb7219046789d02f82786a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 11:27:48.813	2026-10-01 11:27:48.807	2026-09-01 11:49:33.68
cmtigc3tb000004kz8gp7fn0o	cmti1dzp8000004jrtrq0nqux	c95c2f70316fbed006cc5de7e51276edf5336744a95891972b1f63f28734153d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.135.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-09-01 09:15:27.695	2026-10-01 09:15:27.679	2026-09-05 01:52:27.103
cmtilua2u000004l1pnttfap4	cmti1dzp8000004jrtrq0nqux	caac55387cebd60cfd5178b6cc1dd7ceb57fe880a1c7ecfb353e667e2b9964dc	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 11:49:33.702	2026-10-01 11:49:33.697	2026-09-01 11:50:56.288
cmtilwaqq000004jlg7rnnebf	cmthzr76i000004jxzpmxsb3u	60f0ac10bea1643d233b744659df8eeac0f419bf788f4642ec0a9e8758b27d66	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 11:51:07.874	2026-10-01 11:51:07.856	2026-09-01 11:58:18.351
cmtim62zz000104jl8iiwk9ph	cmti1dzp8000004jrtrq0nqux	3592d8df01bc479cdaa15737a4e3247b47a7421ba029c44e934b54044dabec1d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 11:58:44.399	2026-10-01 11:58:44.399	2026-09-01 12:00:33.418
cmtim8qi9000004lh4v9ddi4l	cmthzr76i000004jxzpmxsb3u	d1d6bd0285256c8c01f0e9d9b95fe2b58cbde6ab45c93ae786d92d45ddce77a0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 12:00:48.177	2026-10-01 12:00:48.163	2026-09-01 12:03:10.084
cmtimc497000004las48wo5qe	cmti1dzp8000004jrtrq0nqux	64c250ebef2f79b34e7d66aebbfc08dbcf0a5842ffefebc81e68a05950dc6fcc	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 12:03:25.963	2026-10-01 12:03:25.95	2026-09-01 12:18:48.158
cmtimvvue000004jrd0k2uvmi	cmti1dzp8000004jrtrq0nqux	36ce36eab638eead8b1b242272781684146611c42046e96089a896761a14a1c1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 12:18:48.182	2026-10-01 12:18:48.176	2026-09-01 12:19:07.801
cmtimwm67000004l711le0xkq	cmthzr76i000004jxzpmxsb3u	79cbb09468c4ad4e6dd09404772e7274639ead5bbcade61c6b64f86a657d6719	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-01 12:19:22.303	2026-10-01 12:19:22.285	2026-09-02 01:27:39.046
cmtjf2cp5000004k0f2pom01u	cmthzr76i000004jxzpmxsb3u	7d727597827dec72a3591769a4137d36610c931d4ebc6de00b7b0c76d4dca77b	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 01:27:39.209	2026-10-02 01:27:39.186	\N
cmtjf2pmb000004jurmc5m7vk	cmthzr76i000004jxzpmxsb3u	323133dfb4ee59dc1c5ca35e2280c3cccb13c163ad8b8f1b54d7ce5cd21c1b3f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 01:27:55.955	2026-10-02 01:27:55.935	2026-09-02 01:43:43.598
cmtjfn0uc000004jpmi3gnnbh	cmthzr76i000004jxzpmxsb3u	f6d81662c9ccd6c07520a17798d020e5f39d9f23a6023621d639facc21a9aee6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 01:43:43.62	2026-10-02 01:43:43.615	2026-09-02 01:59:07.498
cmtjg6tq8000004l1zvvtn3g0	cmthzr76i000004jxzpmxsb3u	046f747531277ed13c1ad42b88d1d88c9865d646b717dded262eac9721308eb5	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 01:59:07.52	2026-10-02 01:59:07.515	2026-09-02 02:01:21.585
cmtjg9z63000004l4ppjz6kic	cmti1dzp8000004jrtrq0nqux	31fd42e8220b418853e23a6e937be653cfbc39e3f697ee544f05bd978caf6b12	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 02:01:34.539	2026-10-02 02:01:34.534	2026-09-02 02:04:12.307
cmtjgdlpc000204lbiz2mwevc	cmthzr76i000004jxzpmxsb3u	f817be275f10e18c60d08704a74a91c52daed2f788a15fb67a655336da52e8bc	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 02:04:23.712	2026-10-02 02:04:23.703	2026-09-02 02:19:43.586
cmtjgxbi4000004ifxt3duta6	cmthzr76i000004jxzpmxsb3u	35a1899104087d7179c5598ca15199c7cca80a440d33b8c96c2acb748b8ed593	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 02:19:43.612	2026-10-02 02:19:43.606	2026-09-02 02:34:55.483
cmtjhgv46000104ifl46f3aln	cmthzr76i000004jxzpmxsb3u	856e14aab10bb0d81c59151a4e07eaa081a6b677f2301bdc6ea8a3186691a8bb	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 02:34:55.494	2026-10-02 02:34:55.494	2026-09-02 02:50:43.618
cmtji16pi000004jw1tl9st8z	cmthzr76i000004jxzpmxsb3u	e4ab71c0d9aeab4cd4f298e32fde3e37a08ddcd6a0b2145e35725fecfa3eb265	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 02:50:43.638	2026-10-02 02:50:43.633	2026-09-02 03:19:43.247
cmtjj2h1o000004jxoxuzvy6y	cmthzr76i000004jxzpmxsb3u	c4ddd6f88941f90f3de1ec330bd2e069411f576ab02b83c55a3ed47234fb24ae	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 03:19:43.308	2026-10-02 03:19:43.268	2026-09-02 03:34:50.363
cmtjjlwzk000004jorjku90r3	cmthzr76i000004jxzpmxsb3u	434390f32c5f523e9c1c49691ff758917bb58d8aa45f971b127cf8d28b12df04	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 03:34:50.432	2026-10-02 03:34:50.393	2026-09-02 03:50:16.637
cmtjk5ro6000004l9n2895yzu	cmthzr76i000004jxzpmxsb3u	9beebc0a9980085162c8adb6f1b0b629f2a9b1d74702167a383a080c061cd23f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 03:50:16.662	2026-10-02 03:50:16.657	2026-09-02 03:57:44.013
cmtjkfmy7000004ldx4isa8re	cmti1dzp8000004jrtrq0nqux	76d9df6feb743920dbb89f911e5044e699a056a50d93447b1103d209fa7522e8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 03:57:57.103	2026-10-02 03:57:57.09	2026-09-02 03:59:10.844
cmtjuveon000004judcahah2e	cmthzr76i000004jxzpmxsb3u	acd8382d5d3951a54840b1b1b2e2c97e6195050b9f654d450fae42a0242fd77e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 08:50:09.047	2026-10-02 08:50:09.025	2026-09-02 09:05:11.038
cmtjveqoj000004l7l1aqqnaf	cmthzr76i000004jxzpmxsb3u	702e6d2fee0f9fab631484bf6e062e6ca1a5da823882fffd80ec0799e29b87a9	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 09:05:11.059	2026-10-02 09:05:11.054	2026-09-02 09:05:11.358
cmtjvf134000104l7dgvkm2wl	cmti1dzp8000004jrtrq0nqux	a1c59bc7c0ac7eccdc177da40b9f9a1d2cd340da2bc79246b3e9a37fdbe5036c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 09:05:24.544	2026-10-02 09:05:24.543	2026-09-02 09:20:24.753
cmtjvyc8m000004jurouugvwy	cmti1dzp8000004jrtrq0nqux	5b761ac4eea45ca51fd7d63df68e6b24ff46353a5a5e3f6b80f2e0a3670a01a0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 09:20:25.462	2026-10-02 09:20:25.458	\N
cmtk0xewb000004jpo7v9lob1	cmti1dzp8000004jrtrq0nqux	4f0df1b4a1079c09d7aacfc16dbf8606711d389a4d624b6ece9d28086127a37f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 11:39:40.331	2026-10-02 11:39:40.293	2026-09-02 11:41:08.268
cmtk0zoky000004l4vb376cbc	cmthzr76i000004jxzpmxsb3u	ce6f3163725a6940cb66f9971d31f2c59661577e7d2d5bf90caf22161ccd32d5	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 11:41:26.194	2026-10-02 11:41:26.189	2026-09-02 11:56:27.587
cmtk1j049000004l8jcna5ovr	cmthzr76i000004jxzpmxsb3u	56cf3eb81a507edfa31daff7f5b86783eaca9acd8036d99e9735e123cb007ae6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 11:56:27.609	2026-10-02 11:56:27.604	2026-09-02 12:10:05.057
cmtk21ej5000004l46ioo6kzp	cmti1dzp8000004jrtrq0nqux	f5cb628494f4b95c1636c623fbf19848ce34212ab0a37a4c09b1a7332d04c32d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 12:10:46.097	2026-10-02 12:10:46.092	2026-09-02 12:17:04.903
cmtk29sqj000004l64s4jiok6	cmthzr76i000004jxzpmxsb3u	9384044963513565faf250eec0c460191b365675aca1a2a05a22d3afe414ef8b	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 12:17:17.756	2026-10-02 12:17:17.737	2026-09-02 12:32:38.963
cmtk2tjk9000004l54lhl0i5f	cmthzr76i000004jxzpmxsb3u	96eaf7cd80b883d1670b37d82ed5569dd23d8af960dca5ca702ed05722f5a0ba	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 12:32:38.985	2026-10-02 12:32:38.98	2026-09-02 12:48:38.534
cmtk3e3yp000104l5troe9k9n	cmthzr76i000004jxzpmxsb3u	4d5997fe4161de43d572124c4cd32530398b9f552054352e6fbbf2d427882d14	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 12:48:38.545	2026-10-02 12:48:38.545	2026-09-02 13:03:44.71
cmtk3xk14000004kyq31yuuky	cmthzr76i000004jxzpmxsb3u	7a1b6b5b9c98695881d9f6dbdddb9646aef960e036445ffe4311229dcc1af5de	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 13:03:45.832	2026-10-02 13:03:45.827	2026-09-02 13:11:22.229
cmtk47r27000004jyo97xbw52	cmti1dzp8000004jrtrq0nqux	c52ff0f7d71087c46da2e22b1aa4146d36390035bad5474eb99330614017f31f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 13:11:41.503	2026-10-02 13:11:41.498	2026-09-02 13:12:58.336
cmtk4ekhe000004jxru6e5hks	cmsr39xrs0000vcg22jasip7c	2170751ea07e708e247b5536537075f55ce1437639c36f40e3ef353003f2ec23	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 13:16:59.57	2026-10-02 13:16:59.556	2026-09-02 13:19:13.623
cmtk4htr5000004l5b52nioue	cmthzr76i000004jxzpmxsb3u	af8ce76f32589ebf5706e1bc0c9590c1e6e77064b701b9efabd9545724085cc4	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 13:19:31.554	2026-10-02 13:19:31.54	2026-09-02 13:20:05.647
cmtk4izn7000004l5uhamd5kc	cmti1dzp8000004jrtrq0nqux	6e65fac1a7242f1c49c880dc56f9712c61e5695d2626497b0514b935042e906b	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 13:20:25.843	2026-10-02 13:20:25.825	2026-09-02 13:21:22.198
cmtk4kia8000204lfinh6whjc	cmthzr76i000004jxzpmxsb3u	9aadd23ca93be7f7799ba564ed121ae26bf770d31b5e13ce455938ecba88104a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 13:21:36.656	2026-10-02 13:21:36.655	2026-09-02 13:22:29.646
cmtk4m2xl000104kzmbotho89	cmti1dzp8000004jrtrq0nqux	467b1a7d35a32b4f7deb552136d133b1e6ce8ca81affa3e2575d9f087556a7da	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 13:22:50.073	2026-10-02 13:22:50.072	2026-09-02 13:38:11.193
cmtk55tox000004jxje3lnp3h	cmti1dzp8000004jrtrq0nqux	8c8ebf1091bc3c60ff0c362b13d8ce6481333a381c041f7de6841f001dde4dac	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 13:38:11.217	2026-10-02 13:38:11.211	2026-09-02 13:54:10.896
cmtk5qe6z000104jx3gbwazq5	cmti1dzp8000004jrtrq0nqux	72ad3960910d6c155f8939914d4d6273361dff830b523241da1f39017461093a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 13:54:10.907	2026-10-02 13:54:10.907	2026-09-02 14:09:10.882
cmtk69oml000204jxs2gafdda	cmti1dzp8000004jrtrq0nqux	33676f580a49b1fcc7659fdb7cffcb2aca7dd808f82d28a4783a5b1f9f4e6e24	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 14:09:10.893	2026-10-02 14:09:10.892	2026-09-02 14:24:10.892
cmtk6sz37000004larym652xd	cmti1dzp8000004jrtrq0nqux	2bd94a71636fcdd9613b7434af2934d12936d820cfca4c645f062e255034d0d4	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 14:24:10.915	2026-10-02 14:24:10.909	2026-09-02 14:49:38.296
cmtk7ppok000004l0x8mwdpay	cmti1dzp8000004jrtrq0nqux	3f5467c05993d49272b6d741e88592923a279a498f989336116221898e66ce14	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 14:49:38.372	2026-10-02 14:49:38.352	2026-09-02 15:06:04.138
cmtk8av26000004l1lbxm4uvm	cmti1dzp8000004jrtrq0nqux	34be171b379feda56f44bd8db89b98898440518fb07df3acf2b86173492674c6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 15:06:05.118	2026-10-02 15:06:05.113	\N
cmtkneku5000004ju87u1np0y	cmthzr76i000004jxzpmxsb3u	d8bbdd9b8965488b0dff7e265c0303cf246c7d9d8d2a1e6e85c02a0986000746	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 22:08:52.733	2026-10-02 22:08:52.712	2026-09-02 22:10:51.972
cmtknhgnb000004laqe5277ft	cmti1dzp8000004jrtrq0nqux	a31a5366275c4751409f4368b477eea6e2a5024bb6bdb5dc95e342d5b556894e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 22:11:07.271	2026-10-02 22:11:07.258	2026-09-02 22:26:56.039
cmtko1sqj000004jlm7xfst9c	cmti1dzp8000004jrtrq0nqux	dd3540a64dcfcf58583b0d3183184820f8cb661e91fded9be4e9ba98c7630579	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 22:26:56.06	2026-10-02 22:26:56.055	2026-09-02 22:40:17.641
cmtkojbjo000004iepbqn6v4y	cmthzr76i000004jxzpmxsb3u	951077f6bbe7ed25c8762e7f7b2240a085746f7c49209eeead71d65406245d13	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 22:40:33.588	2026-10-02 22:40:33.583	2026-09-02 22:55:56.112
cmtkp33e0000004lgl67cer7j	cmthzr76i000004jxzpmxsb3u	b4850fc7ba7421f6b3990d5fc29dd233289f324b197636aeca6d3482ca266c85	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 22:55:56.136	2026-10-02 22:55:56.13	2026-09-02 23:18:36.501
cmtkpw93k000004l1qc29iivt	cmthzr76i000004jxzpmxsb3u	4e254a7e12401e8d7b6d548f6118e6eee7417263629c30e51deb370e5ed943e0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 23:18:36.56	2026-10-02 23:18:36.532	2026-09-02 23:34:31.721
cmtkqgq50000004jovh7rrc1u	cmthzr76i000004jxzpmxsb3u	d59c325b4cb78a5510dd4da53e65bc919985d60e1a62c66cb9c274622e3a3143	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 23:34:31.764	2026-10-02 23:34:31.755	2026-09-02 23:50:57.92
cmtkr1v3m000004kwlk0airu7	cmthzr76i000004jxzpmxsb3u	eb9b926f94e781a967c9a49296a2ee6308f05cb94915a359ecaa46c46005af69	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-02 23:50:57.97	2026-10-02 23:50:57.964	2026-09-03 00:06:53.489
cmtkrmcfl000005l4skizllxr	cmthzr76i000004jxzpmxsb3u	5428b5884a3cf853752606b161c92bf8b34c2f2a9e08d31c3e523bd4961bb015	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 00:06:53.553	2026-10-03 00:06:53.529	2026-09-03 00:22:17.56
cmtks65g4000004jiksjrhhdw	cmthzr76i000004jxzpmxsb3u	e1c24e2e283627ca0639d122e939a47482932b7cc39b44303b3f5e9cd789df7e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 00:22:17.62	2026-10-03 00:22:17.601	2026-09-03 00:37:21.4
cmtkspitq000004idv0etsuf4	cmthzr76i000004jxzpmxsb3u	e7b1bd6449d3ab2b18c8dff7591b1c846bf1fa3924c9847694d7a42d76453c90	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 00:37:21.422	2026-10-03 00:37:21.417	2026-09-03 00:46:02.97
cmtkt11by000104idrdfwy1kr	cmti1dzp8000004jrtrq0nqux	b373572ac0a6a17b86498ccd95fdc41b31767d43b0e3e9ec607f7e4b3745921c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 00:46:18.622	2026-10-03 00:46:18.622	2026-09-03 01:01:52.453
cmtktl1wd000004l46ghd1s1o	cmti1dzp8000004jrtrq0nqux	c734a95179a663421a49989ba91ec8d25767e36ea521724bbfff4b0262345d1b	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 01:01:52.477	2026-10-03 01:01:52.472	2026-09-03 01:03:07.511
cmtktn13t000004ih5a1bml0h	cmthzr76i000004jxzpmxsb3u	fe602418cb3a63592ec3187346fff677892635b011f67f5bf7e67b32b629ac0f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 01:03:24.761	2026-10-03 01:03:24.748	\N
cmtkto5a0000004jr7qxxw9bz	cmthzr76i000004jxzpmxsb3u	2c6c4ec4861b60512afcde10f3d5e5eb60af04ca8ace2effc64eeee4f2b1bd61	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 01:04:16.824	2026-10-03 01:04:16.805	2026-09-03 01:09:54.819
cmtktvnaz000004ibhgztp1ba	cmti1dzp8000004jrtrq0nqux	8e0a871f22bb5b4d4c906ea8b4c84557ad859ddea4fe07168e65de413682bb1b	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 01:10:06.779	2026-10-03 01:10:06.774	2026-09-03 01:25:52.502
cmtkufx1p000004l4wnrmp71y	cmti1dzp8000004jrtrq0nqux	c4918670b6e1af4db026e2f2b8eab2129e23ee190653107e1221af5f85fab6de	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 01:25:52.525	2026-10-03 01:25:52.519	2026-09-03 01:41:08.457
cmtkuzjsl000104l4yhjua2eu	cmti1dzp8000004jrtrq0nqux	44827a09fd488948b1265b942214bf703dae403ab43f3181da1bddc087d6735c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 01:41:08.469	2026-10-03 01:41:08.468	2026-09-03 01:57:14.988
cmtkvk9l0000004l7vkdn6zyb	cmti1dzp8000004jrtrq0nqux	b4b7ec119c5b208f6492c35a3d02891a1ee4108f937e8eb920720b2ac4d3fbea	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 01:57:15.012	2026-10-03 01:57:15.003	2026-09-03 02:12:57.11
cmtkw4gjd000004jxaba08yi7	cmti1dzp8000004jrtrq0nqux	0a98f3a4ec06c0c66c755b5a0d046a78af6603de04239338162a820209090d1a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 02:12:57.145	2026-10-03 02:12:57.14	2026-09-03 02:13:32.969
cmtkw5itb000004jl5fwh53lk	cmthzr76i000004jxzpmxsb3u	b00d975e2b71163e190374c5d155eb9732dd94dc22ab054cdc1ed3d398caca64	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 02:13:46.751	2026-10-03 02:13:46.747	2026-09-03 02:25:54.418
cmtkwlcw4000004lbf9ii0783	cmti1dzp8000004jrtrq0nqux	5e766c1e97651e7bca2293a3579bf06d67cc7f4ff193ba2e3e05cde6a7549938	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 02:26:05.572	2026-10-03 02:26:05.556	\N
cmtkx1kh0000004l1c67qskn8	cmthzr76i000004jxzpmxsb3u	dac4fe477d6d7916931e72e520044c2c44ba74f228fd36609bf5f8d67a046369	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 02:38:41.892	2026-10-03 02:38:41.874	2026-09-03 02:53:57.215
cmtkxl6r8000004lacnfn8kes	cmthzr76i000004jxzpmxsb3u	48dbdba146d20c497a8a6febfce6b4cafa229c5c74270a61debbab7a39fb69df	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 02:53:57.236	2026-10-03 02:53:57.231	2026-09-03 03:09:13.386
cmtky4to5000104lah667n99g	cmthzr76i000004jxzpmxsb3u	8505cb08f758dd448aeb849cec60f3e30835ae3c8d7abe8af893ac5ce88193e2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 03:09:13.397	2026-10-03 03:09:13.397	2026-09-03 03:11:12.269
cmtky7o8g000004jyzs5fd54r	cmti1dzp8000004jrtrq0nqux	44d46abd21ce850bdd5e94538a127fd8547c1954a2b0d32acb0a66456ecceada	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 03:11:26.32	2026-10-03 03:11:26.316	\N
cmtky8l13000004jusp8z0dr2	cmthzr76i000004jxzpmxsb3u	2afa186bbcce74472366758f899cb4b8032232ebacae032f13b9da195e3cec81	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 03:12:08.823	2026-10-03 03:12:08.816	2026-09-03 03:35:54.433
cmtkz351y000004jx8osvm5ph	cmthzr76i000004jxzpmxsb3u	d044fd6badf617eb144b16de81568d7491aed10c2d5237b849c4115f2ac81631	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 03:35:54.454	2026-10-03 03:35:54.45	\N
cmtkz4av4000004ld373xtcdc	cmti1dzp8000004jrtrq0nqux	adb0a85fa673d617296fbe4f7810dfeb437dc49f972f14f11055bd3ac12cae07	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 03:36:48.64	2026-10-03 03:36:48.623	2026-09-03 03:51:54.879
cmtkznq52000004l194h24h1h	cmti1dzp8000004jrtrq0nqux	a7d60bc7fa29ed3373d58cf980ded0f7f2286e600df841ac16d56d73cc5142ef	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 03:51:54.902	2026-10-03 03:51:54.896	\N
cmtl04yhz000004l5uxbt0xd6	cmthzr76i000004jxzpmxsb3u	48e14520400268369219e8fadf66ea5c2602e96bd31a947db74bf5cd70e54601	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 04:05:18.887	2026-10-03 04:05:18.87	2026-09-03 04:08:21.025
cmtl099j8000004jv8no6vg4p	cmti1dzp8000004jrtrq0nqux	cc825f9b0fe89c7af36209746e1f47b08ac2b3df2118a85f7b6ddfd705fd2e47	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 04:08:39.812	2026-10-03 04:08:39.808	2026-09-03 04:30:28.723
cmtl11bjc000005jni50awmd0	cmti1dzp8000004jrtrq0nqux	28911f331b83d0df9759a6fe6e45cb4571f09be2b12fa5b56331b087159663de	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 04:30:28.777	2026-10-03 04:30:28.771	2026-09-03 04:46:54.48
cmtl1mg5w000004jwe1pdcxpy	cmti1dzp8000004jrtrq0nqux	7ae51e514644963c233f8c68c7762b16788017cfdf81b80801a421cfdaf61ab9	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 04:46:54.548	2026-10-03 04:46:54.521	2026-09-03 05:02:50.097
cmtl26xid000004jx6q0oxlx3	cmti1dzp8000004jrtrq0nqux	d615878fb76fbd6a83415237266045ac1210481b13caa39989b8e2d8154b0668	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 05:02:50.149	2026-10-03 05:02:50.138	2026-09-03 05:51:27.694
cmtl3xgri000004l2op3sv3u2	cmti1dzp8000004jrtrq0nqux	d21d5256c5712c4deb9d6dbc74f86e1d4f0d92fd17e65235cd70aa9c108bb27b	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 05:51:27.774	2026-10-03 05:51:27.744	2026-09-03 06:07:52.648
cmtl4ikqs000004jldxb9e448	cmti1dzp8000004jrtrq0nqux	880b3d4db21a2210325eaa9732ed19691b159cbf5df485c6e8785ff296c4e644	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 06:07:52.708	2026-10-03 06:07:52.688	2026-09-03 06:31:49.326
cmtl5ddas000004kvxi5y2dta	cmti1dzp8000004jrtrq0nqux	35a9b72c5bcf67631b2985628fe3362c34b2115b15ed7c7893c08ec177d482b3	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 06:31:49.396	2026-10-03 06:31:49.369	2026-09-03 07:03:40.57
cmtl6ic0s000004l8eafiwrlk	cmti1dzp8000004jrtrq0nqux	6d180a4d9446a69d636b08a7d2a9132f9cf22136ac22268ef1b148243a572a45	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 07:03:40.636	2026-10-03 07:03:40.631	2026-09-03 07:30:27.881
cmtl7gs7z000004laczr98uxr	cmti1dzp8000004jrtrq0nqux	30e4f44f1a7b7a3834a7ae8a8fb36c6dbe36774914035be6a85f871e8b10297a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 07:30:27.935	2026-10-03 07:30:27.924	2026-09-03 07:52:30.162
cmtl894h5000004l4c8nl65dn	cmti1dzp8000004jrtrq0nqux	6735b0b8e3ce7dc77ed1571230c95900cb442f61ab3d7cf633fbc58fd84730d1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 07:52:30.185	2026-10-03 07:52:30.18	\N
cmtl8alq2000004l2v5406ngv	cmthzr76i000004jxzpmxsb3u	7137944bc76de7e27bed6102abb523a1a0eecbfbc5ce06ff809ad218be92b8dd	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 07:53:39.194	2026-10-03 07:53:39.173	2026-09-03 07:53:50.92
cmtl8b4ii000004jr7dn51syd	cmti1dzp8000004jrtrq0nqux	a3651e090c3b9eee11eae17736c63dbd0911aeaf3f229cbd8d09d89acd3c4122	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 07:54:03.559	2026-10-03 07:54:03.542	2026-09-03 08:12:40.28
cmtl8z27g000004jyulfvzevf	cmti1dzp8000004jrtrq0nqux	ff30708ad70fa02c9a9b4cb1eca2f46c418d7b6633f65cbfa3ee8c8603de2072	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 08:12:40.3	2026-10-03 08:12:40.296	\N
cmtl8zm6a000004l7zjqj3lef	cmti1dzp8000004jrtrq0nqux	f17145aa623456b9b11c71135c919967b1726428d62f26e2ba0effb65f10b2d6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 08:13:06.178	2026-10-03 08:13:06.162	\N
cmtl9dlku000004k1rqj65d3a	cmsr39xrs0000vcg22jasip7c	acbfa822250a37ef91a9b8197355e1ab443337651146086672b3b1ceb75d3bb3	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 08:23:58.59	2026-10-03 08:23:58.573	2026-09-03 08:46:22.268
cmtla6edw000004l8iprjuyx0	cmsr39xrs0000vcg22jasip7c	600be62b6f2a931f8f5ccb036f9dc6cf2d26c4c19c2b3469ae5d1c81fe1be913	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 08:46:22.293	2026-10-03 08:46:22.287	2026-09-03 09:05:41.855
cmtlav95n000004jl53hnv0es	cmsr39xrs0000vcg22jasip7c	8cd250d4e9d25f9f83d7d6efe3dd6882041f1533c23d4e0c32b17ed86d4b2758	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 09:05:41.915	2026-10-03 09:05:41.885	2026-09-03 09:28:15.085
cmtlbo9az000004kyyyyou27k	cmsr39xrs0000vcg22jasip7c	c90b293e90151d28ed68989cc8bf23a401048852be18e448697cf9b3cc6e6242	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 09:28:15.131	2026-10-03 09:28:15.125	2026-09-03 09:28:16.455
cmtlboadd000004jxrv169rwn	cmsr39xrs0000vcg22jasip7c	1da7e7427eca509e18ec096069d2662bf7649648357b9bd0f173b41592dd1552	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 09:28:16.513	2026-10-03 09:28:16.491	2026-09-03 09:49:02.04
cmtlcezh2000004l7bqfnwlu9	cmsr39xrs0000vcg22jasip7c	414265ec47e780869e85f1ca952c0776a301a1786090adffa3fd32b648285047	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 09:49:02.102	2026-10-03 09:49:02.07	2026-09-03 10:04:33.642
cmtlcyz54000004inn2nvizjs	cmsr39xrs0000vcg22jasip7c	a15e0eb32cd6731f8243c4f0d0c7e4fc70cdcf12ea20d9bd019355c29f2885e8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 10:04:34.792	2026-10-03 10:04:34.787	2026-09-03 10:20:59.441
cmtldk2yq000004l2jg4on2lv	cmsr39xrs0000vcg22jasip7c	36ebf543d27528b451be901d799cf1231e55cb0955b1440c1c61ec6ec1c6cda8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 10:20:59.522	2026-10-03 10:20:59.503	2026-09-03 10:36:55.037
cmtle4kbm000004l3lz289g7g	cmsr39xrs0000vcg22jasip7c	a9c6e41b73e9f148ce4194c19ebe2f03b9985f9bde949d98a78951348ca992cc	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 10:36:55.138	2026-10-03 10:36:55.111	2026-09-03 10:52:24.605
cmtleohjc000004k1wlo2ueoj	cmsr39xrs0000vcg22jasip7c	1995a21e3bcb3594bde764dadc4c2465be884b26251c5b33003135dc49d869a8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 10:52:24.648	2026-10-03 10:52:24.626	2026-09-03 11:12:18.006
cmtlfe2df000004jilcw2p1zu	cmsr39xrs0000vcg22jasip7c	5c08487c4135560ff90e26465c5b9426f09e3ca87d4789e9d471330abe85beb7	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 11:12:18.051	2026-10-03 11:12:18.045	\N
cmtlfg1ct000104jilxnffoya	cmti1dzp8000004jrtrq0nqux	180b59e2b39218930e3b0646bd30a65d0df08f4e56cd405e8c973aba88eadab3	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 11:13:50.045	2026-10-03 11:13:50.045	\N
cmtlfi7fg000004l1q91tf07n	cmsr39xrs0000vcg22jasip7c	132d9fb7d384370e94cad464acecc5baa5eee01e249d7f353fae21fd096c1b86	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 11:15:31.229	2026-10-03 11:15:31.212	2026-09-03 12:28:01.739
cmtli3gd7000004l76z1xx8tx	cmsr39xrs0000vcg22jasip7c	eb9cdf40ba825e5e401f150b5eaa08cdc390059dd3c9f2025b69da6f1c6f3e6f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 12:28:01.819	2026-10-03 12:28:01.779	2026-09-03 13:13:00.244
cmtljpaj5000004jrqz721aqb	cmsr39xrs0000vcg22jasip7c	af2e128337a4da93c4aecbae4769b3dc73a1cbdcdae1f5bcd04ea435028877f3	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 13:13:00.305	2026-10-03 13:13:00.286	2026-09-03 22:07:36.832
cmtm2st4s000004jotax1bx2y	cmsr39xrs0000vcg22jasip7c	57a14e9d565f7de75ebe748056e8d028c2e7b60b3029400ada58eae38ced3408	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 22:07:37.084	2026-10-03 22:07:37.078	\N
cmtm2vjg4000004jo3fqospig	cmti1dzp8000004jrtrq0nqux	cc0faf90a65e00ac9af3b06c0496b865309f64080836f1de64dfaf1d22c6c44f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 22:09:44.5	2026-10-03 22:09:44.48	2026-09-03 22:35:10.672
cmtm3s93m000004larqpjev0t	cmti1dzp8000004jrtrq0nqux	ae698cc738081ea2b5c0f2cdec9c411c017efc15ecf9f011808048417d7627d1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-03 22:35:10.738	2026-10-03 22:35:10.733	2026-09-04 00:30:05.85
cmtm7w1fz000004lc3fc9iy6k	cmti1dzp8000004jrtrq0nqux	9f854f034a34f86abacb37d5b9524aad3b12c528dbbd96b0d479a53edaf43e2e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 00:30:05.903	2026-10-04 00:30:05.891	2026-09-04 00:54:05.692
cmtm8qwer000004l1brnfzmqt	cmti1dzp8000004jrtrq0nqux	b61d5458b574d268db83f6be5f0e8a778a6a5937ebef05664abb2d8ad86fe709	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 00:54:05.715	2026-10-04 00:54:05.71	\N
cmtm8s6d1000004l52wmfs7js	cmti1dzp8000004jrtrq0nqux	8666b1dcfdcbf592b98bc8ef5cb6637b1114ac2aef0a4e33f8f2e6b8b6a4b43e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 00:55:05.269	2026-10-04 00:55:05.249	\N
cmtm940aq000004l9wi1qbo9o	cmti1dzp8000004jrtrq0nqux	53ad610dcd20a152bc5eca06ca9515b0cb827581800ec68043a1f560e87af3fd	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 01:04:17.29	2026-10-04 01:04:17.273	2026-09-04 01:11:22.441
cmtmb3qr3000004l8pqtdp1np	cmti1dzp8000004jrtrq0nqux	deadef4a671e9e66d41f98bd3dc2904ba96f22e93236c2bd3e57af194bbdaf3f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 02:00:04.144	2026-10-04 02:00:04.115	2026-09-04 02:15:05.289
cmtmbn287000004l5dtrwb3wq	cmti1dzp8000004jrtrq0nqux	f2eb22f5d2fcc7b43a0aa6b243e7c0a01bf93e4e6db1c284cc5dca0cc7854c08	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 02:15:05.479	2026-10-04 02:15:05.474	2026-09-04 02:28:48.899
cmtmc7o4w000004ifpy50lmrw	cmthzr76i000004jxzpmxsb3u	055798e07a933de52df5f4b74e68dabc8e44191c9f6a82b51ca257cf2ef2141a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 02:31:06.992	2026-10-04 02:31:06.987	2026-09-04 02:46:08.4
cmtmcqzoo000004lajbvqnt37	cmthzr76i000004jxzpmxsb3u	ec2542171425de352c4b9ea59e5205259187c8c72c9facfb8be2cfc3c1bbd7e0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 02:46:08.424	2026-10-04 02:46:08.418	2026-09-04 03:01:20.894
cmtmdajro000004julfwhhrw2	cmthzr76i000004jxzpmxsb3u	b30e5fe71e8953d69865ce3e86bb4a20d34a2cd826d362fa24ed41270230067f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 03:01:20.916	2026-10-04 03:01:20.911	2026-09-04 03:27:37.985
cmtme8cou000004k02elqacjz	cmthzr76i000004jxzpmxsb3u	b3261dacd99d3c23b772e41fe6093d26158dd0aed9c470a50b2afc9c0c656ed0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 03:27:38.047	2026-10-04 03:27:38.007	\N
cmtmgayu4000004l98n3t78kq	cmthzr76i000004jxzpmxsb3u	3bd783fb68e72ce9fe2701635c9c1560f92054b2f836f8d2f8155c26510403f0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 04:25:39.292	2026-10-04 04:25:39.251	2026-09-04 05:36:08.181
cmtmitlw0000004jm7pf0ifg4	cmthzr76i000004jxzpmxsb3u	8ba3ebf6edc449dc1c131148068007fd55c30b0ec99ef53eafb77cebff8b08c2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 05:36:08.208	2026-10-04 05:36:08.199	2026-09-04 06:34:33.211
cmtmkwqez000004jstm63rk13	cmthzr76i000004jxzpmxsb3u	bad09dd55c7dbfe7699a7c0f2e3bf36c6a37a58e0f5605daee3e27e5968efa2d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 06:34:33.275	2026-10-04 06:34:33.253	2026-09-04 07:06:59.838
cmtmm2gfm000004lbx1b1voe6	cmthzr76i000004jxzpmxsb3u	1509e509357f698619b0d1e03847814f13eb10aaae8375054fec0865da54ddc8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 07:06:59.89	2026-10-04 07:06:59.881	2026-09-04 07:22:28.756
cmtmmmdkg000104lb9m8vcrhj	cmthzr76i000004jxzpmxsb3u	86cd3c7e52b91096d2ed88b29a38ab6d82bfd9f290a444b668653cb0495e410c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 07:22:29.296	2026-10-04 07:22:29.295	2026-09-04 07:37:39.854
cmtmn5w61000204lbjc3d8b75	cmthzr76i000004jxzpmxsb3u	58c3968a227d87ec954162e80574420408010f13a46b970678ccf3de31e48ba0	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 07:37:39.865	2026-10-04 07:37:39.865	2026-09-04 07:52:39.783
cmtmnp6k3000304lbbzxegn6l	cmthzr76i000004jxzpmxsb3u	fedc5ea52236530b4890bc19c046827a78c8a819cde168b423ce647da47b284d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 07:52:39.795	2026-10-04 07:52:39.795	2026-09-04 08:07:39.869
cmtmo8h2h000404lbogsobwjw	cmthzr76i000004jxzpmxsb3u	564937b4d93e92632fd4f721a9fac7b82242e5974828e8d44dea41b2df7b0a8a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 08:07:39.881	2026-10-04 08:07:39.88	2026-09-04 08:15:58.886
cmtmojp0b000004lctb7n9uj8	cmti1dzp8000004jrtrq0nqux	96c3aa10dfd58db7fd31f4050f8b728c289ca2579947672daa768f0a2e4f55d9	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 08:16:23.387	2026-10-04 08:16:23.374	2026-09-04 08:17:19.602
cmtmol66u000504lb0d3tf6sx	cmthzr76i000004jxzpmxsb3u	2199ef54bc695ecc1f500b6075af42a53faf8650617927f9eed42438220bdb7d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 08:17:32.31	2026-10-04 08:17:32.309	2026-09-04 13:11:51.824
cmtmz3ody000004iikhx6qckq	cmthzr76i000004jxzpmxsb3u	0896f03bc2ad9f92f82dd757f5b1967d152494b31b24a439e876a89deb05e635	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 13:11:51.862	2026-10-04 13:11:51.856	2026-09-04 13:39:25.155
cmtn0343h000004l4cqtvki6l	cmthzr76i000004jxzpmxsb3u	ce44d3d47be8d95e2d3005cfe253a104c4e5bb6dced6174db95ca0c56a867f9e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 13:39:25.181	2026-10-04 13:39:25.175	2026-09-04 13:41:22.268
cmtn061ja000004l7n5yuaekz	cmtn044qy000004i6m7jeljjz	a029b8cbd2e56ff559836994efbe1fcb720051132f4195b3ac36dfc96cde02ab	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 13:41:41.83	2026-10-04 13:41:41.816	2026-09-04 13:41:56.09
cmtn06x4o000004kzfyiwk5yj	cmthzr76i000004jxzpmxsb3u	a56b551fd8c95a096f4ce6c641b9807136729315a8dc3ad012439ddbb7969000	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 13:42:22.776	2026-10-04 13:42:22.758	2026-09-04 16:16:58
cmtn5ppzj000004jo3mjjkkbz	cmthzr76i000004jxzpmxsb3u	4e1a61055f0716755cb9bb9204cf99d3e55f0c0a9834e421970622afa435e484	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 16:16:58.063	2026-10-04 16:16:58.04	2026-09-04 16:43:55.466
cmtn6oe0u000004l7imiwe5lz	cmthzr76i000004jxzpmxsb3u	322b5fdb9cd726345709fbc628b1d69ae8614991d417159e4dfa7c25ffd69e6c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 16:43:55.518	2026-10-04 16:43:55.496	2026-09-04 16:48:25.914
cmtn6uir3000004l429z009fc	cmthzr76i000004jxzpmxsb3u	5e3f529b09ea92ee171d998a16b92576200e5454a3f9cef43e2c7081cf50fbbc	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 16:48:41.583	2026-10-04 16:48:41.578	2026-09-04 16:55:55.372
cmtn74hq5000004l85z2jip1j	cmthzr76i000004jxzpmxsb3u	823543c50e86715e5c9fd68cffc5c04843b54d18b23aa50ec0148f7158eb1feb	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 16:56:26.813	2026-10-04 16:56:26.809	2026-09-04 16:58:13.151
cmtn777jc000004l5s1d1my39	cmti1dzp8000004jrtrq0nqux	f16532cfe5489de75db3b13f67ebe454aa958f0737d2db9042b614239ebacd4a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 16:58:33.576	2026-10-04 16:58:33.559	2026-09-04 16:58:45.463
cmtn78kwb000004juxllql205	cmte7uoj5000004ldd2nu0njp	5902bcab352b109ff10e8b07aae5f669b604195e5a0c53ddfb71cf1fe580b7ec	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 16:59:37.547	2026-10-04 16:59:37.533	2026-09-04 16:59:58.564
cmtn79dk0000104l585gs1w9o	cmthzr76i000004jxzpmxsb3u	93ab04d034bb137d5cd8720420317604176a3aad1b695db0b69418c6fb5ed615	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 17:00:14.688	2026-10-04 17:00:14.688	2026-09-04 17:21:56.561
cmtn81a4i000004jubm9xhsvn	cmthzr76i000004jxzpmxsb3u	261412947e9ff34f265c2932c88b08ebe6e5d4e58c214f033efda461991fb55c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 17:21:56.61	2026-10-04 17:21:56.596	2026-09-04 17:40:10.888
cmtn8oqiw000004kyivumlu3n	cmthzr76i000004jxzpmxsb3u	d3de93a338426d4e91d930958f33db8eeba9b6fa815a8b9de27c91b16f2c2b62	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 17:40:10.952	2026-10-04 17:40:10.93	\N
cmtnlu0iw000004jis8nxwu8p	cmthzr76i000004jxzpmxsb3u	4f8001380051a204d777557d2c258048650a4c9c5b4aae31cca5593174a7be17	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-04 23:48:12.2	2026-10-04 23:48:12.161	2026-09-05 00:05:03.495
cmtnmfovl000004joce8g3tnj	cmthzr76i000004jxzpmxsb3u	4cf2dd46069f15908e3dec9266d16fec6f971c95181abf93884c8fc8e8875bcf	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 00:05:03.537	2026-10-05 00:05:03.515	2026-09-05 00:25:23.026
cmtnn5txd000004l2vicktmc0	cmthzr76i000004jxzpmxsb3u	5d2374af8f9d454a617e27655552d84c513b9ba938c86921354d36f0a38f0e27	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 00:25:23.137	2026-10-05 00:25:23.116	2026-09-05 00:40:55.837
cmtnnptog000004hz465axz1l	cmthzr76i000004jxzpmxsb3u	1341c416cace3471bc0387514570a61b1f5a407c0e3f5dbcaff0f9eae18d9f0b	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 00:40:55.936	2026-10-05 00:40:55.907	2026-09-05 01:36:23.31
cmtnpp55i000004ld582cgzwa	cmthzr76i000004jxzpmxsb3u	dcb72bceec6b78c04d82fc3be693f14401ffe462c181082795eecbaee6c09e7b	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 01:36:23.399	2026-10-05 01:36:23.36	2026-09-05 01:52:11.236
cmtnq9gkl000004jxe5vygdnz	cmthzr76i000004jxzpmxsb3u	fa9addb43c4ccf7a5502129e679bd997754e5172d8335bd986dfd1a547541003	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 01:52:11.313	2026-10-05 01:52:11.294	2026-09-05 01:52:11.623
cmtnq9srv000104jxhsg2ph5o	cmti1dzp8000004jrtrq0nqux	bdc5a13f6af37a3e690b74520c2eba578f8f9bc499bb2b4eb6db1e4c8c36b830	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.135.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-09-05 01:52:27.115	2026-10-05 01:52:27.114	\N
cmtnqa4nx000204jx3vjhybam	cmthzr76i000004jxzpmxsb3u	2319e48b216a1441f347bae46fee5d174e5cb7e64fc2fed34df688b56d52e466	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 01:52:42.525	2026-10-05 01:52:42.524	2026-09-05 07:10:26.065
cmto1mq7w000004l5tjc2315o	cmthzr76i000004jxzpmxsb3u	e30cfdadc6d493a40d52704ebb4873e206e404ad180badad256784a6341cacfb	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 07:10:26.108	2026-10-05 07:10:26.097	2026-09-05 07:17:35.959
cmto1w9kh000004l2yksrkqxj	cmsr39xrs0000vcg22jasip7c	01bab9443501fc45e0861b63e899fb8c75e879af2db8177f8fd4e77709dc55d2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 07:17:51.089	2026-10-05 07:17:51.075	2026-09-05 07:28:01.261
cmto29t6y000004jo49tuionr	cmthzr76i000004jxzpmxsb3u	d7435b37b4501ee29defb9309a65af88875b518077e3faebd7bf2dc323dc2277	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 07:28:23.05	2026-10-05 07:28:23.033	2026-09-05 08:51:01.691
cmto583de000004ledvx0kmnm	cmthzr76i000004jxzpmxsb3u	44ed9946d3e880091de5fde9b7a4b5ee2c14cfac4869f4f90b08d6f41d52bb95	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 08:51:01.778	2026-10-05 08:51:01.75	2026-09-05 09:18:31.001
cmto67fxv000004icres313xz	cmthzr76i000004jxzpmxsb3u	331b0c9f10a630f34bb92cf7025c19264bcabb6e2b1c869380e5eadbcd622cb4	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 09:18:31.027	2026-10-05 09:18:31.022	2026-09-05 12:55:15.883
cmtody6lj000004jum3m5i2hq	cmthzr76i000004jxzpmxsb3u	a1479274596c9c44d5abc27bdf0d5846d56cb4afaceb86d719285e5a2f03fc82	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 12:55:15.943	2026-10-05 12:55:15.912	2026-09-05 13:12:10.096
cmtoejxnx000004jx52xwpiij	cmthzr76i000004jxzpmxsb3u	3a951b2ca5815c0b0d57c157ef0a025b8951b7bb4668db54dafd31a5835ce8ae	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 13:12:10.797	2026-10-05 13:12:10.792	2026-09-05 14:09:52.871
cmtogm52i000004jp0w233ecv	cmthzr76i000004jxzpmxsb3u	04efa1fd46deef35a9b264f64c7d3a551d2fe98a4e3ab9e3f50b326e5b398cfc	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 14:09:52.938	2026-10-05 14:09:52.909	2026-09-05 22:35:57.914
cmtoyoyvu000004l8gbyz0tnf	cmthzr76i000004jxzpmxsb3u	22c037d23422a1ccbc90de79e978aaef9929ca3979e8c6fb807e8aa1bd2ace8c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 22:35:57.978	2026-10-05 22:35:57.944	2026-09-05 23:56:18.221
cmtp1ka9d000004l9y37hyyj8	cmthzr76i000004jxzpmxsb3u	693bfd89013ed4afd3ff2e0b9d83dee7fa26e31cb74413c870addef85dc64b8d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-05 23:56:18.289	2026-10-05 23:56:18.279	2026-09-06 02:04:59.289
cmtp65rub000004la0hs2plbf	cmthzr76i000004jxzpmxsb3u	df67cd2444e34c956cbb090af401435486faf5f4064f8cf3098f3bd9df26ae16	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 02:04:59.315	2026-10-06 02:04:59.31	2026-09-06 02:22:26.873
cmtp6s86r000004laaz6ctx57	cmthzr76i000004jxzpmxsb3u	30bf0ca941d6529f26f369f17e3a743da1e9289cdccee3dd9259594d7874ed6e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 02:22:26.931	2026-10-06 02:22:26.926	2026-09-06 02:38:11.263
cmtp7cgv1000004l7yqaq5bni	cmthzr76i000004jxzpmxsb3u	c77c39a1440d509e650c1010e1408b1877e3ef04a8f1054d3197bc87150b5668	Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36	2026-09-06 02:38:11.293	2026-10-06 02:38:11.288	2026-09-06 05:09:03.977
cmtpcqhzn000004l7oct46imd	cmthzr76i000004jxzpmxsb3u	34b8d76bc3634aa77054f30fc41900e6e981a6c196bebb2d23681a0695e1d31a	Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36	2026-09-06 05:09:04.019	2026-10-06 05:09:04.001	2026-09-06 05:43:21.743
cmtpdylsc000004l43w89kmu6	cmthzr76i000004jxzpmxsb3u	9c8e772195a2550f9210a92f390e51d83f371f1588182c4ab5410ab360a24dd1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 05:43:21.804	2026-10-06 05:43:21.79	2026-09-06 08:35:08.093
cmtpk3i7r000004l4ome95d0f	cmthzr76i000004jxzpmxsb3u	f5fcee4798ec5f889783ef8f41c81a592f2c5351e5832666a466bb7ca4fd944a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 08:35:08.151	2026-10-06 08:35:08.145	2026-09-06 08:53:14.408
cmtpkqshx000004l5ze5su2qf	cmthzr76i000004jxzpmxsb3u	83875c37127963303457356cd2f21da4aa00991bb8c1c30b733a37a737eb6f4e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 08:53:14.565	2026-10-06 08:53:14.544	2026-09-06 09:45:25.682
cmtpmlwiv000004l8b72sevzb	cmthzr76i000004jxzpmxsb3u	d65d3e4e1be86b2c7b632f3e475c12c44ca0a496c8379fe4c68db4980354de66	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 09:45:25.735	2026-10-06 09:45:25.712	\N
cmtpms9xi000004jro937rqr7	cmsr39xrs0000vcg22jasip7c	b0113e1836e202b1972f7704dffdf61c32acedf5d5f2cfd6df892fe8a4b3e49a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 09:50:23.046	2026-10-06 09:50:23.03	2026-09-06 09:56:20.353
cmtpn0a9c000004la3chz3gvt	cmthzr76i000004jxzpmxsb3u	7196411e1befad2a39e5612192235e4836f0303e4e9eba428b747e3465aa10e1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 09:56:36.72	2026-10-06 09:56:36.706	2026-09-06 12:09:13.658
cmtprqtwk000004l8gud4737e	cmthzr76i000004jxzpmxsb3u	816a246fc28f9749af74cd5dde80047b0f5b42e6b801e8b5452e73e479340190	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 12:09:13.7	2026-10-06 12:09:13.682	2026-09-06 14:44:35.267
cmtpxami8000004ju0jyvko3z	cmthzr76i000004jxzpmxsb3u	e07cb4f5b04c93768454607644cf92df2299349b5b322804a698d4ff68d1229e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 14:44:35.312	2026-10-06 14:44:35.306	2026-09-06 22:43:16.8
cmtqee873000004l4fkhvzp29	cmthzr76i000004jxzpmxsb3u	a3271999721c97342497f9309bb8bade8a5ccca522a9813fbd7a9419103642ee	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 22:43:16.863	2026-10-06 22:43:16.841	2026-09-06 23:05:36.867
cmtqf6yoe000004l2lc3v9rbp	cmthzr76i000004jxzpmxsb3u	1291a67be1f1244a825c1396fa6b72a13d65da07e8830a8baef031cc1eb7076d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 23:05:37.55	2026-10-06 23:05:37.545	2026-09-06 23:05:38.011
cmtqf6z1r000004js5k4m9yru	cmthzr76i000004jxzpmxsb3u	e9a907a727637e7e38085ed3cbb146c68395d6dcae2de111f493127bcfde47cb	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-06 23:05:38.031	2026-10-06 23:05:38.027	2026-09-07 02:26:40.505
cmtqmdik4000004lazcv6kx2y	cmthzr76i000004jxzpmxsb3u	640092c8d63f53c8c51c95a2fbf30354d43cd2f9f003856b3de05eacadc6b686	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 02:26:40.564	2026-10-07 02:26:40.537	2026-09-07 02:43:23.719
cmtqmz0m5000004jz3mqtnotg	cmthzr76i000004jxzpmxsb3u	2c0994b330ad6f63455c7058de6a1f70aadc398c1a9f31c701a135b284782394	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 02:43:23.741	2026-10-07 02:43:23.736	2026-09-07 03:02:18.954
cmtqnnckg000004k2mvqs8emj	cmthzr76i000004jxzpmxsb3u	ad1a9e09e5abbc4ae92307eef8e848c507e4431fb72c49b937d5c9f5d7c5dbfc	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 03:02:18.976	2026-10-07 03:02:18.971	2026-09-07 03:18:10.741
cmtqo7qzo000004led0bg6x0c	cmthzr76i000004jxzpmxsb3u	b1a882b6653c00f696c178ad21bd1234afcd5aeee3ee5064927ce3e25b599943	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 03:18:10.788	2026-10-07 03:18:10.783	2026-09-07 03:36:04.744
cmtqouroe000004kyhk2q814b	cmthzr76i000004jxzpmxsb3u	be31d3f0cdf3526e603ab8710495418e3a971d77e5bad55d9314238fa0a1fe26	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 03:36:04.766	2026-10-07 03:36:04.762	2026-09-07 03:53:47.721
cmtqphjvk000004jj0awbrrwk	cmthzr76i000004jxzpmxsb3u	958540d100640b3dbb73ca8e130b2ee7837d8d5d5fabdfb158e23981fe9a7cad	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 03:53:47.744	2026-10-07 03:53:47.739	2026-09-07 03:53:48.103
cmtqphk5u000104jjzpr0var4	cmthzr76i000004jxzpmxsb3u	55b91265cc3c1387b0e12bd63ab83033e3f026fbbe4f1c2c241587ac610a0866	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 03:53:48.114	2026-10-07 03:53:48.113	2026-09-07 04:34:14.226
cmtqqxk71000004kzirejfcms	cmthzr76i000004jxzpmxsb3u	9c8f98ae06b8d8f83dd6bfb71ab49362071e88f107da6eb450526552273680ac	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 04:34:14.269	2026-10-07 04:34:14.25	2026-09-07 08:57:56.243
cmtr0coka000004jpbvh7gkq5	cmthzr76i000004jxzpmxsb3u	1204ec905c80748692c8de87132ea0eaa13c47b1a7800ac4d8c5bcb6213151bb	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 08:57:56.314	2026-10-07 08:57:56.293	2026-09-07 09:13:41.802
cmtr0wy54000004jreqx08nok	cmthzr76i000004jxzpmxsb3u	6068ac448c883dbe6a26fa03ff02199cc43818a6a07d6aa647f3312854801c1d	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 09:13:41.848	2026-10-07 09:13:41.841	2026-09-07 12:53:15.719
cmtr8rb6o000004l21l5wlw12	cmthzr76i000004jxzpmxsb3u	1e3e11f3ba97f86dfa86b40dbed1582da93a9088884b108377543509c85d9ebd	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 12:53:15.744	2026-10-07 12:53:15.735	2026-09-07 13:43:57.761
cmtrakih3000004jsmn4ryzrs	cmthzr76i000004jxzpmxsb3u	fc8f648163e371238436919dc79f7d6f184c150601c716605c56d259107d6da4	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 13:43:57.831	2026-10-07 13:43:57.791	\N
cmtratw6z000104jsgu98mbb8	cmthzr76i000004jxzpmxsb3u	efc372df22af5c88b072533e9798cff989565fbdf6161ec3b7f9f2067e4234e9	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 13:51:15.515	2026-10-07 13:51:15.514	2026-09-07 14:13:24.216
cmtrbmdgc000004if6pzcv0t6	cmthzr76i000004jxzpmxsb3u	8efaf495fd6eb001f5a58b1f039e7db538e1c97bf1bb988eecc34d9841042906	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 14:13:24.252	2026-10-07 14:13:24.246	2026-09-07 23:00:38.53
cmtrugezz000004kt0lan25ok	cmthzr76i000004jxzpmxsb3u	b5d8d064428cb6229efebc242c44335fcb85714a5b6539ad4aaaeb05ac4a9a7f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 23:00:39.023	2026-10-07 23:00:39.018	2026-09-07 23:31:51.057
cmtrvkjit000004lb6u4cq5v7	cmthzr76i000004jxzpmxsb3u	78e658c237f535b00b702efc8bd0ed55e0f5ec9a01a177d877541d44d27d61a8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-07 23:31:51.125	2026-10-07 23:31:51.086	2026-09-08 02:22:02.372
cmts1nem9000004jshub5jrl9	cmthzr76i000004jxzpmxsb3u	50a20cd13333ba176173114c924a2bc1cafde4d211c4b32de7bbeafe083a1eff	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-08 02:22:02.433	2026-10-08 02:22:02.414	2026-09-08 04:51:07.063
cmts6z4dm000004l8wivfglal	cmthzr76i000004jxzpmxsb3u	35e6161900565e6f0b84a0666d4e2b76941fe5ef96e0fc4c9731de58a9cd1239	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-08 04:51:07.114	2026-10-08 04:51:07.104	2026-09-08 08:01:36.139
cmtsds33e000004l63sw5uaec	cmthzr76i000004jxzpmxsb3u	547f5c285fe3b4ac8d7ebb3878c4a1935d200b0d32cf9dd33435913d4d370bab	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-08 08:01:36.17	2026-10-08 08:01:36.164	2026-09-08 09:08:04.111
cmtsg5k97000004lfhr430bpg	cmthzr76i000004jxzpmxsb3u	2286dccf770742b9e99609601f59fbd8089a261c2c8c5887cd8ef159d4d00d93	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-08 09:08:04.171	2026-10-08 09:08:04.143	2026-09-08 09:25:21.879
cmtsgrt4b000004lduwljuybx	cmthzr76i000004jxzpmxsb3u	c5383fc58e83e2829800733ef9d1246d512013a923dafe6907806ec46cb80b9c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-08 09:25:22.091	2026-10-08 09:25:22.086	2026-09-08 09:42:28.897
cmtshdtg4000004jxszto8kwi	cmthzr76i000004jxzpmxsb3u	5f242f0416f8e254e256dfec71185d3ee538058b6af0674bea6c2ba95466ce46	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-08 09:42:28.948	2026-10-08 09:42:28.937	2026-09-08 09:57:46.703
cmtshxi25000004jrtxf42k6d	cmthzr76i000004jxzpmxsb3u	8cc898725460ed64ab5cd5d62afb6b45efcf9d30d982669fd6d0f5d63e6a4354	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-08 09:57:47.309	2026-10-08 09:57:47.304	\N
cmtsm4umo000004kyt269meer	cmthzr76i000004jxzpmxsb3u	b42f972a2b7393fbfce1b91c989a4e77cc3c37f12d1407d398e6b76b2ef698d4	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-08 11:55:28.656	2026-10-08 11:55:28.635	2026-09-08 12:55:30.958
cmtsoa28g000004l5521xmuoc	cmthzr76i000004jxzpmxsb3u	9493c26c77eca74b03ea106295c5e73acd9e2119cb741c8e4dcd548fa2a8f14b	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-08 12:55:31.024	2026-10-08 12:55:30.985	2026-09-08 12:56:55.464
cmtsocamr000004l28zlzhwwi	cmti1dzp8000004jrtrq0nqux	307cfc1e8add549bce6ca7b5f8842da34f89fd736ff038acd4461feebfd655cc	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-08 12:57:15.22	2026-10-08 12:57:15.214	2026-09-08 13:00:11.962
cmtsoge1e000004la2kotcu9t	cmthzr76i000004jxzpmxsb3u	8d67cf469d0cd8eae6cd818a388e365a6b0c461a732d77bdb6d663415ab033d5	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-08 13:00:26.258	2026-10-08 13:00:26.253	2026-09-08 13:27:14.708
cmtspev6b000004jxqjarzrlj	cmthzr76i000004jxzpmxsb3u	8e90e11ef42e6273f388ac85cc7e9d7f9809e1e8ef39ebe4b74c00828ef23405	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-08 13:27:14.771	2026-10-08 13:27:14.744	\N
cmttch15z000004jy346cfiqp	cmthzr76i000004jxzpmxsb3u	ddeda38a5ebdc720037a778d34e21120befefc7ebd36070579991a50f9fed38a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 00:12:47.015	2026-10-09 00:12:46.995	2026-09-09 00:47:16.396
cmttdpdy5000004kypapxhvri	cmthzr76i000004jxzpmxsb3u	f38daa88a3aecf2a1292151b77e9e27c17b132974feb9fffa7c1268474537387	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 00:47:16.445	2026-10-09 00:47:16.436	2026-09-09 01:08:16.365
cmttege53000004l7j39fbb25	cmthzr76i000004jxzpmxsb3u	33477f8d2934b63e61c67fb09642bf54da41bc912cc9f11cd3fbf120d10dde3f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 01:08:16.407	2026-10-09 01:08:16.398	\N
cmttgxvem000004k3egrhddt7	cmthzr76i000004jxzpmxsb3u	15f033981f4f675231b7e83fc29f5c98688fcab93212aa41337aff333a8e6515	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 02:17:51.166	2026-10-09 02:17:51.111	2026-09-09 03:35:03.012
cmttjp5e8000004l9edh3wm76	cmthzr76i000004jxzpmxsb3u	bf3a75755bbe25f328fcfec3fef2a9f57c2df990839bf46abb478831f8280c9e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 03:35:03.057	2026-10-09 03:35:03.051	\N
cmttjpion000004jrftq37fax	cmthzr76i000004jxzpmxsb3u	7eb7a2ae2228cd25ddc110099be31020160f293ec5e100f6ddb9e5ebccfd0df2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 03:35:20.279	2026-10-09 03:35:20.259	2026-09-09 04:12:12.527
cmttl0xpd000004l4fkcnw8c4	cmthzr76i000004jxzpmxsb3u	f4381a291602d80835c17973b9739cc1f66dc2ca10c06cfc3c7b6cf20e3b642f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 04:12:12.577	2026-10-09 04:12:12.566	\N
cmtts7vhg000004l4dsjkm6i2	cmthzr76i000004jxzpmxsb3u	e99e15c634267acbc53d8f57be2079c8c9cd09e0c8eea08f3e3f9ac0ca3c3a07	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 07:33:33.604	2026-10-09 07:33:33.567	2026-09-09 08:01:06.402
cmttt7auo000004ky65xqgmt1	cmthzr76i000004jxzpmxsb3u	9e9152595b1850f5b730bc11e72e275d9f37f29d94189d925f1f8445eaaa64cd	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 08:01:06.481	2026-10-09 08:01:06.441	2026-09-09 08:20:51.46
cmtttwp91000004l44xcbwjkq	cmthzr76i000004jxzpmxsb3u	dafcc7acf0aef7818ae3ccf326ca21be1bbd3c29f5818d69a51751c75c6ad634	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 08:20:51.541	2026-10-09 08:20:51.518	2026-09-09 08:25:46.059
cmttu3lbl000004ihw8c0wcsg	cmti1dzp8000004jrtrq0nqux	79f3cef3c9e62f60891c3c2033af99bc7e44a8ed18a675913d91447b6c95b1dd	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 08:26:13.041	2026-10-09 08:26:13.037	2026-09-09 08:33:20.861
cmttudp55000004l704ae25gn	cmthzr76i000004jxzpmxsb3u	baa7cb8385e6b7bb989fc1b4a66bb8be7b7a84e2db7c330df5c03955b6dc20b5	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 08:34:04.553	2026-10-09 08:34:04.539	2026-09-09 09:02:33.427
cmttvebrm000004l7jgkdxdeh	cmthzr76i000004jxzpmxsb3u	50cfbc0232115df6ab0c4d0217cb899d5bf69d71a6218722946d60bf30af3527	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 09:02:33.491	2026-10-09 09:02:33.48	\N
cmttveo6u000004l2f7ewggsc	cmthzr76i000004jxzpmxsb3u	1605bb8285cc865a039b608dc28f036b1ca9bb1599fbc3a18ea87f76345f8c44	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 09:02:49.603	2026-10-09 09:02:49.564	2026-09-09 09:49:41.683
cmttx2y29000004jr90rkjppc	cmthzr76i000004jxzpmxsb3u	44e0ee164b777a05ab4eea834cdc66805d96b4d0f79095c371fc3b8a3b01c40a	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 09:49:41.745	2026-10-09 09:49:41.74	2026-09-09 10:06:16.693
cmttxo9t6000004l8tlns6t8n	cmthzr76i000004jxzpmxsb3u	51e3f02a11b29bc8f1354a3a98e766c4c8f4149604a69cb1b375927fefc9a5f5	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 10:06:16.747	2026-10-09 10:06:16.724	2026-09-09 10:21:41.388
cmtty83ig000004jthkenhrbn	cmthzr76i000004jxzpmxsb3u	db616dea5d79e6853431a383171250074a4a13ca5197c7f8421930f552395ace	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 10:21:41.705	2026-10-09 10:21:41.698	2026-09-09 11:11:45.917
cmtu00hmh000004jlqsk3hpcf	cmthzr76i000004jxzpmxsb3u	644e6e24a2baf82b429571863a6a6277146ffde6f03921ee0e0963c066397587	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 11:11:45.977	2026-10-09 11:11:45.949	2026-09-09 12:31:08.018
cmtu2ukl9000004kzxz4tn7w3	cmthzr76i000004jxzpmxsb3u	6bddb9053cc77573d2298128a100f865dfca8ea9e80d85d755eb86b0c6ac2622	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 12:31:08.733	2026-10-09 12:31:08.727	2026-09-09 12:46:50.897
cmtu3ermo000004jjtm3g6s8y	cmthzr76i000004jxzpmxsb3u	84d05000eaf60e8b2e4204d2eb346f47e9ebaeb2ec19675ceede566b88de3c2c	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 12:46:50.977	2026-10-09 12:46:50.937	\N
cmtunzml0000004l2znc0kg2g	cmthzr76i000004jxzpmxsb3u	41fd7d1d089bdec112b88c16973e18860b184eec087c1bbe86baf7d57658e012	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-09 22:22:56.532	2026-10-09 22:22:56.512	2026-09-10 00:38:56.678
cmtusuj1b000004l8ssgu4w2f	cmthzr76i000004jxzpmxsb3u	f2dd3ce75e216d52f0470cebd2e05f0a63f884bc541b3e1d2a9922ade6439535	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-10 00:38:56.735	2026-10-10 00:38:56.728	2026-09-10 01:03:01.871
cmtutpih9000004jk4mcjvnr5	cmthzr76i000004jxzpmxsb3u	113e0701875f8c9879a3c247c416b64e06a302c39d89b31b81fb26bf80805081	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-10 01:03:02.349	2026-10-10 01:03:02.343	\N
cmtux385k000004jzfs3kas0p	cmthzr76i000004jxzpmxsb3u	c2314972ad092f4bc1415d9ae3b9faf9b449142246af67c23203ec50428b15f1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-10 02:37:41	2026-10-10 02:37:40.965	2026-09-10 04:09:43.013
cmtv0dl12000004jnhlf45bh5	cmthzr76i000004jxzpmxsb3u	d88499db7307ef3de1502ae7a98a88714a0b48038a9a5465d1eb098b8d802c41	Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36	2026-09-10 04:09:43.094	2026-10-10 04:09:43.075	2026-09-10 04:30:19.879
cmtv143e6000004lbrwuu59r8	cmthzr76i000004jxzpmxsb3u	2ea54b7a68b92825b4bd2362f85b0304b1a6a455a7937b55173fd1972c331910	Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36	2026-09-10 04:30:19.95	2026-10-10 04:30:19.918	2026-09-10 11:05:26.921
cmtvf87uu000004l01ag29ktc	cmthzr76i000004jxzpmxsb3u	07081a0a7a0d7addfa4aba55253f834c81b43412a6830d243380c38a48d0ed5e	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-10 11:05:26.982	2026-10-10 11:05:26.943	\N
cmtvf8j4r000004l38grfgdc1	cmthzr76i000004jxzpmxsb3u	52e33cbb3f2b281a55866576321d230a0c50227c623f47d07a3869a527c21e65	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-10 11:05:41.595	2026-10-10 11:05:41.538	2026-09-10 11:34:47.352
cmtvg9y7u000004jvy7all4am	cmthzr76i000004jxzpmxsb3u	bf825f6f4d726c69f6629fde7ba07a5dbcb3bc677672f6eb19d9d90f92dce15f	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-10 11:34:47.418	2026-10-10 11:34:47.399	2026-09-10 11:35:53.345
cmtvgbpac000004l940dwdapf	cmti1dzp8000004jrtrq0nqux	7dd782b78eeea777657f373efc6030da9be7d1286c1767f5c0cf936e9e215870	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-10 11:36:09.156	2026-10-10 11:36:09.138	2026-09-10 11:59:45.892
cmtvh62hu000004jqgp7odrdu	cmti1dzp8000004jrtrq0nqux	fa158da0bc2ecb013d808b19b3bd3b1c7cf8b35de16439b09cdcc053c0b03426	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-10 11:59:45.955	2026-10-10 11:59:45.932	2026-09-10 12:14:56.18
cmtvhpkzh000004l5x2kzru41	cmti1dzp8000004jrtrq0nqux	32cedfb586fc8089f29d5354d1811114ed5fb52f1985df6537df0ceccff8b9c7	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-10 12:14:56.382	2026-10-10 12:14:56.376	2026-09-10 12:30:17.086
cmtvi9bf9000004l5lj4vh6d8	cmti1dzp8000004jrtrq0nqux	c96b4f4f69f524f971caac9661280622263832c07c1e5fa0de2973de36d6b4e5	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-10 12:30:17.109	2026-10-10 12:30:17.104	2026-09-10 12:40:53.81
cmtvindbz000104l5jzxy3h2i	cmthzr76i000004jxzpmxsb3u	f895b33a2bd9871c44cbae33bff4ba06652b0aaa8d40e2107a5b502447033d26	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36	2026-09-10 12:41:12.767	2026-10-10 12:41:12.766	\N
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.subjects (id, name, "shortName", description, icon, accent, "createdAt", "updatedAt") FROM stdin;
ipas	IPAS (Ilmu Pengetahuan Alam dan Sosial)	IPAS	Ekosistem, siklus alam, dan fenomena di sekitar kita.	🔬	#FF6F59	2026-08-13 05:39:49.053	2026-08-13 05:39:49.053
matematika	Matematika	Matematika	Bilangan, pola, dan pemecahan masalah lewat latihan interaktif.	➗	#5B5FEF	2026-08-13 05:39:49.584	2026-08-13 05:39:49.584
bahasa-indonesia	Bahasa Indonesia	B. Indonesia	Teks, kosakata, dan gaya bahasa lewat contoh dan latihan.	📖	#C1443C	2026-08-13 05:39:49.943	2026-08-13 05:39:49.943
pai	Pendidikan Agama Islam (PAI)	PAI	Rukun, akhlak, dan kisah teladan dalam ajaran Islam.	🕌	#0E7C61	2026-08-13 05:39:50.247	2026-08-13 05:39:50.247
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.subscriptions (id, "userId", "planId", status, "currentPeriodEnd", "createdAt", "updatedAt") FROM stdin;
cmsr3a5480005vcg2qg7qdbh2	cmsr3a17h0003vcg2sfsat140	free_trial	TRIALING	2026-08-27 05:40:14.31	2026-08-13 05:40:14.312	2026-08-13 05:40:14.312
cmsr39zf50002vcg2cj52vifs	cmsr39xrs0000vcg22jasip7c	pro	CANCELED	2026-09-12 05:40:06.925	2026-08-13 05:40:06.929	2026-08-19 09:41:03.096
cmte7uojy000104ld33wwp8cy	cmte7uoj5000004ldd2nu0njp	free_trial	TRIALING	2026-09-12 10:06:53.131	2026-08-29 10:06:53.134	2026-08-29 10:06:53.134
cmths51gc000104lhyfu9hltb	cmths51fd000004lhcodvnpbj	free_trial	TRIALING	2026-09-14 21:58:07.254	2026-08-31 21:58:07.261	2026-08-31 21:58:07.261
cmthzr77b000104jxticgjdgv	cmthzr76i000004jxzpmxsb3u	free_trial	TRIALING	2026-09-15 01:31:18.453	2026-09-01 01:31:18.455	2026-09-01 01:31:18.455
cmtn044ro000104i6sfc6n40n	cmtn044qy000004i6m7jeljjz	free_trial	TRIALING	2026-09-18 13:40:12.706	2026-09-04 13:40:12.708	2026-09-04 13:40:12.708
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: prisma_migration
--

COPY public.users (id, name, email, "passwordHash", role, "createdAt", "updatedAt", grade, semester, "birthDate", gender, "isActive") FROM stdin;
cmsr3a17h0003vcg2sfsat140	Murid Demo	murid@sekolah.id	$2b$10$lzAnWaO2Z.KhMLxK3lEjperJDmiGkW1GDi4uSSxTW60WKSThn.46a	STUDENT	2026-08-13 05:40:09.245	2026-08-13 05:40:09.245	\N	\N	\N	\N	t
cmte7uoj5000004ldd2nu0njp	Andika Febrianto	andikaf@gmail.com	$2b$10$RlgVvAf/szWKZt59OoNqu.B3Rd97DNwqIWU9es1r1oL6yZFWRxmta	STUDENT	2026-08-29 10:06:53.105	2026-08-29 10:06:53.105	\N	\N	\N	\N	t
cmsr39xrs0000vcg22jasip7c	Operator	operator@sekolah.id	$2b$10$3mXXwtVESU1TNfM7neeQO.DGDL01qJPGh/yeq5O.7KI3Lb8AFZDWC	TEACHER	2026-08-13 05:40:04.793	2026-08-13 05:40:04.793	\N	\N	\N	\N	t
cmths51fd000004lhcodvnpbj	Acen	acen@gmail.com	$2b$10$zTkcrQXjKpsPP41IY5XDYu4sCP14ObSxlYiXn.U7otY6Cu15b3qWq	STUDENT	2026-08-31 21:58:07.225	2026-08-31 21:58:07.225	3	1	\N	\N	t
cmthzr76i000004jxzpmxsb3u	Andika	andika@gmail.com	$2b$10$5FyYS.6gNBlAeNekiMnhMOKJdCgqNRrVXqnYdclN7Fxbae/L.Vncy	PARENT	2026-09-01 01:31:18.426	2026-09-01 01:31:18.426	\N	\N	\N	\N	t
cmti1dzp8000004jrtrq0nqux	Dylan Alhuzein	dylan@gmail.com	$2b$10$6gv.pmvpV/FULYnNSQBziuGNqaKNk6YnAy0en6Jt45XxAPqDj67lq	STUDENT	2026-09-01 02:17:01.436	2026-09-05 07:10:43.628	3	1	\N	\N	t
cmtn044qy000004i6m7jeljjz	M.Zaki	zaki@yahoo.com	$2b$10$OjEs7OX/xbaXe3s1KmiHuubPpqFoCRlV3Sl/ls1yxLIkAGUbKwkRa	STUDENT	2026-09-04 13:40:12.682	2026-09-05 07:11:00.25	6	1	\N	\N	t
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: assignment_progress assignment_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.assignment_progress
    ADD CONSTRAINT assignment_progress_pkey PRIMARY KEY ("assignmentId", "frameSlug");


--
-- Name: frames frames_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.frames
    ADD CONSTRAINT frames_pkey PRIMARY KEY ("moduleId", slug);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: parent_assignments parent_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.parent_assignments
    ADD CONSTRAINT parent_assignments_pkey PRIMARY KEY (id);


--
-- Name: parent_children parent_children_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.parent_children
    ADD CONSTRAINT parent_children_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: progress_records progress_records_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.progress_records
    ADD CONSTRAINT progress_records_pkey PRIMARY KEY ("clientId", "moduleId", "frameSlug");


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: reading_progress reading_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT reading_progress_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: assignment_progress_assignmentId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "assignment_progress_assignmentId_idx" ON public.assignment_progress USING btree ("assignmentId");


--
-- Name: frames_moduleId_order_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "frames_moduleId_order_idx" ON public.frames USING btree ("moduleId", "order");


--
-- Name: modules_grade_semester_subjectId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "modules_grade_semester_subjectId_idx" ON public.modules USING btree (grade, semester, "subjectId");


--
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "notifications_userId_idx" ON public.notifications USING btree ("userId");


--
-- Name: notifications_userId_read_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "notifications_userId_read_idx" ON public.notifications USING btree ("userId", read);


--
-- Name: parent_assignments_childId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "parent_assignments_childId_idx" ON public.parent_assignments USING btree ("childId");


--
-- Name: parent_assignments_parentId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "parent_assignments_parentId_idx" ON public.parent_assignments USING btree ("parentId");


--
-- Name: parent_children_childId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "parent_children_childId_idx" ON public.parent_children USING btree ("childId");


--
-- Name: parent_children_parentId_childId_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "parent_children_parentId_childId_key" ON public.parent_children USING btree ("parentId", "childId");


--
-- Name: parent_children_parentId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "parent_children_parentId_idx" ON public.parent_children USING btree ("parentId");


--
-- Name: payments_userId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "payments_userId_idx" ON public.payments USING btree ("userId");


--
-- Name: payments_xenditInvoiceId_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "payments_xenditInvoiceId_key" ON public.payments USING btree ("xenditInvoiceId");


--
-- Name: progress_records_clientId_moduleId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "progress_records_clientId_moduleId_idx" ON public.progress_records USING btree ("clientId", "moduleId");


--
-- Name: progress_records_userId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "progress_records_userId_idx" ON public.progress_records USING btree ("userId");


--
-- Name: questions_assignmentId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "questions_assignmentId_idx" ON public.questions USING btree ("assignmentId");


--
-- Name: questions_childId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "questions_childId_idx" ON public.questions USING btree ("childId");


--
-- Name: questions_parentId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "questions_parentId_idx" ON public.questions USING btree ("parentId");


--
-- Name: reading_progress_childId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "reading_progress_childId_idx" ON public.reading_progress USING btree ("childId");


--
-- Name: reading_progress_childId_materialId_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "reading_progress_childId_materialId_key" ON public.reading_progress USING btree ("childId", "materialId");


--
-- Name: sessions_refreshTokenHash_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "sessions_refreshTokenHash_key" ON public.sessions USING btree ("refreshTokenHash");


--
-- Name: sessions_userId_idx; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE INDEX "sessions_userId_idx" ON public.sessions USING btree ("userId");


--
-- Name: subscriptions_userId_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX "subscriptions_userId_key" ON public.subscriptions USING btree ("userId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: prisma_migration
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: assignment_progress assignment_progress_assignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.assignment_progress
    ADD CONSTRAINT "assignment_progress_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES public.parent_assignments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: frames frames_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.frames
    ADD CONSTRAINT "frames_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: modules modules_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT "modules_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public.subjects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_assignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES public.parent_assignments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: parent_assignments parent_assignments_childId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.parent_assignments
    ADD CONSTRAINT "parent_assignments_childId_fkey" FOREIGN KEY ("childId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: parent_assignments parent_assignments_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.parent_assignments
    ADD CONSTRAINT "parent_assignments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: parent_children parent_children_childId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.parent_children
    ADD CONSTRAINT "parent_children_childId_fkey" FOREIGN KEY ("childId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: parent_children parent_children_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.parent_children
    ADD CONSTRAINT "parent_children_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: progress_records progress_records_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.progress_records
    ADD CONSTRAINT "progress_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questions questions_assignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES public.parent_assignments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questions questions_childId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_childId_fkey" FOREIGN KEY ("childId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: questions questions_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT "questions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reading_progress reading_progress_childId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT "reading_progress_childId_fkey" FOREIGN KEY ("childId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subscriptions subscriptions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: prisma_migration
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 19E88cCjuFoU3NpHd2wpYyvbKF8Vwp1LGcJBQ4anpDvOMRmqpkV5DAP7Chu2KXn

