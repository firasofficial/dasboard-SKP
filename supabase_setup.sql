-- ========================================================
-- SKRIP SETUP DATABASE SUPABASE (POSTGRESQL) - SIMONIKA
-- Salin dan jalankan skrip ini di SQL Editor Supabase Anda
-- ========================================================

-- 1. Membuat Tabel Master OPD
CREATE TABLE IF NOT EXISTS master_opd (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL CHECK (kategori IN ('DINAS', 'KECAMATAN'))
);

-- 2. Membuat Tabel Rekap Bulanan (Agregasi per OPD)
CREATE TABLE IF NOT EXISTS skp_rekap_bulanan (
    id BIGSERIAL PRIMARY KEY,
    opd_id TEXT NOT NULL REFERENCES master_opd(id) ON DELETE CASCADE ON UPDATE CASCADE,
    bulan TEXT NOT NULL,
    tahun INT8 NOT NULL,
    pns INT8 DEFAULT 0,
    pppk INT8 DEFAULT 0,
    pppk_dw INT8 DEFAULT 0,
    sangat_baik INT8 DEFAULT 0,
    baik INT8 DEFAULT 0,
    butuh_perbaikan INT8 DEFAULT 0,
    kurang INT8 DEFAULT 0,
    sangat_kurang INT8 DEFAULT 0,
    tidak_membuat_skp INT8 DEFAULT 0,
    nama_file TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_periode_opd UNIQUE (opd_id, bulan, tahun)
);

-- Indeks untuk pencarian cepat rekap per periode
CREATE INDEX IF NOT EXISTS idx_rekap_periode ON skp_rekap_bulanan(bulan, tahun);
CREATE INDEX IF NOT EXISTS idx_rekap_opd ON skp_rekap_bulanan(opd_id);

-- 3. Membuat Tabel Detail ASN Nominatif (Rincian Seluruh Pegawai)
CREATE TABLE IF NOT EXISTS skp_detail_pegawai (
    id BIGSERIAL PRIMARY KEY,
    nip TEXT DEFAULT NULL,
    nama_pegawai TEXT NOT NULL,
    opd_id TEXT NOT NULL REFERENCES master_opd(id) ON DELETE CASCADE ON UPDATE CASCADE,
    bulan TEXT NOT NULL,
    tahun INT8 NOT NULL,
    predikat_kinerja TEXT NOT NULL,
    hasil_kerja TEXT DEFAULT NULL,
    perilaku_kerja TEXT DEFAULT NULL,
    skp_jabatan TEXT DEFAULT NULL,
    skp_unor TEXT DEFAULT NULL,
    golru TEXT DEFAULT NULL,
    status_pegawai TEXT DEFAULT 'PNS',
    skp_jenis_jabatan TEXT DEFAULT NULL,
    is_skp_plt_plh_pjb TEXT DEFAULT '0',
    nama_file TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indeks untuk query pencarian cepat detail pegawai
CREATE INDEX IF NOT EXISTS idx_detail_opd_periode ON skp_detail_pegawai(opd_id, bulan, tahun);
CREATE INDEX IF NOT EXISTS idx_detail_nip ON skp_detail_pegawai(nip);

-- 4. Menonaktifkan Row Level Security (RLS) agar dapat diakses dari frontend SIMONIKA
ALTER TABLE master_opd DISABLE ROW LEVEL SECURITY;
ALTER TABLE skp_rekap_bulanan DISABLE ROW LEVEL SECURITY;
ALTER TABLE skp_detail_pegawai DISABLE ROW LEVEL SECURITY;

-- 5. Mengisi Data Master 61 OPD & Kecamatan (100% Selaras dengan Aplikasi)
INSERT INTO master_opd (id, nama, kategori) VALUES
('BKPSDM', 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia', 'DINAS'),
('SETDA', 'Sekretariat Daerah', 'DINAS'),
('BPKD', 'Badan Pengelolaan Keuangan Daerah', 'DINAS'),
('BAPPEDA', 'Badan Perencanaan Pembangunan Daerah', 'DINAS'),
('BPBD', 'Badan Penanggulangan Bencana Daerah', 'DINAS'),
('KESBANGPOL', 'Badan Kesatuan Bangsa dan Politik', 'DINAS'),
('INSPEKTORAT', 'Inspektorat Daerah', 'DINAS'),
('SATPOL_PP_WH', 'Satuan Polisi Pamong Praja dan Wilayatul Hisbah', 'DINAS'),
('RSUD_ZM', 'Rumah Sakit Umum Daerah dr. Zubir Mahmud', 'DINAS'),
('RSUD_SAAS', 'Rumah Sakit Umum Daerah Sultan Abdul Aziz Syah Peureulak', 'DINAS'),
('DISDIK', 'Dinas Pendidikan dan Kebudayaan', 'DINAS'),
('DINKES', 'Dinas Kesehatan', 'DINAS'),
('PUPR', 'Dinas Pekerjaan Umum dan Perumahan Rakyat', 'DINAS'),
('DINSOS', 'Dinas Sosial', 'DINAS'),
('DISDUKCAPIL', 'Dinas Kependudukan dan Pencatatan Sipil', 'DINAS'),
('DPMG', 'Dinas Pemberdayaan Masyarakat dan Gampong', 'DINAS'),
('DSI', 'Dinas Syariat Islam', 'DINAS'),
('DINAS_DAYAH', 'Dinas Pendidikan Dayah', 'DINAS'),
('DPMP2T', 'Dinas Penanaman Modal dan Pelayanan Perizinan Terpadu', 'DINAS'),
('DISKOMINFO', 'Dinas Komunikasi dan Informatika', 'DINAS'),
('DISHUB', 'Dinas Perhubungan', 'DINAS'),
('DLH', 'Dinas Lingkungan Hidup', 'DINAS'),
('DISPARPORA', 'Dinas Pariwisata, Pemuda, dan Olahraga', 'DINAS'),
('DISKOPUKM', 'Dinas Perdagangan, Koperasi, dan UKM', 'DINAS'),
('DISBUNNAK', 'Dinas Perkebunan dan Peternakan', 'DINAS'),
('DKP', 'Dinas Kelautan dan Perikanan', 'DINAS'),
('DP3AKB', 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, dan KB', 'DINAS'),
('DISPUSIP', 'Dinas Perpustakaan dan Kearsipan', 'DINAS'),
('PERTANAHAN', 'Dinas Pertanahan', 'DINAS'),
('DISTANTPH', 'Dinas Tanaman Pangan dan Hortikultura', 'DINAS'),
('DKPP', 'Dinas Ketahanan Pangan dan Penyuluhan', 'DINAS'),
('DISPERINNAKERTRANS', 'Dinas Perindustrian, Tenaga Kerja dan Transmigrasi', 'DINAS'),
('SETWAN', 'Sekretariat Dewan Perwakilan Rakyat Kabupaten', 'DINAS'),
('SET_BAITUL_MAL', 'Sekretariat Baitul Mal', 'DINAS'),
('SET_MAA', 'Sekretariat Majelis Adat Aceh', 'DINAS'),
('SET_MPA', 'Sekretariat Majelis Pendidikan Aceh', 'DINAS'),
('SET_MPU', 'Sekretariat Majelis Permusyawaratan Ulama', 'DINAS'),
('KEC_BANDA_ALAM', 'Kecamatan Banda Alam', 'KECAMATAN'),
('KEC_BIREM_BAYEUN', 'Kecamatan Birem Bayeun', 'KECAMATAN'),
('KEC_DARUL_AMAN', 'Kecamatan Darul Aman', 'KECAMATAN'),
('KEC_DARUL_FALAH', 'Kecamatan Darul Falah', 'KECAMATAN'),
('KEC_DARUL_IHSAN', 'Kecamatan Darul Ihsan', 'KECAMATAN'),
('KEC_IDI', 'Kecamatan Idi Rayeuk', 'KECAMATAN'),
('KEC_IDI_TIMUR', 'Kecamatan Idi Timur', 'KECAMATAN'),
('KEC_IDI_TUNONG', 'Kecamatan Idi Tunong', 'KECAMATAN'),
('KEC_INDRA_MAKMU', 'Kecamatan Indra Makmu', 'KECAMATAN'),
('KEC_JULOK', 'Kecamatan Julok', 'KECAMATAN'),
('KEC_MADAT', 'Kecamatan Madat', 'KECAMATAN'),
('KEC_NURUSSALAM', 'Kecamatan Nurussalam', 'KECAMATAN'),
('KEC_PANTE_BIDARI', 'Kecamatan Pante Bidari', 'KECAMATAN'),
('KEC_PEUDAWA', 'Kecamatan Peudawa', 'KECAMATAN'),
('KEC_PEUNARON', 'Kecamatan Peunaron', 'KECAMATAN'),
('KEC_PEUREULAK', 'Kecamatan Peureulak', 'KECAMATAN'),
('KEC_PEUREULAK_BARAT', 'Kecamatan Peureulak Barat', 'KECAMATAN'),
('KEC_PEUREULAK_TIMUR', 'Kecamatan Peureulak Timur', 'KECAMATAN'),
('KEC_RANTO_PEUREULAK', 'Kecamatan Ranto Peureulak', 'KECAMATAN'),
('KEC_RANTAU_SELAMAT', 'Kecamatan Rantau Selamat', 'KECAMATAN'),
('KEC_SERBAJADI', 'Kecamatan Serbajadi', 'KECAMATAN'),
('KEC_SIMPANG_JERNIH', 'Kecamatan Simpang Jernih', 'KECAMATAN'),
('KEC_SIMPANG_ULIM', 'Kecamatan Simpang Ulim', 'KECAMATAN'),
('KEC_SUNGAI_RAYA', 'Kecamatan Sungai Raya', 'KECAMATAN')
ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, kategori = EXCLUDED.kategori;
