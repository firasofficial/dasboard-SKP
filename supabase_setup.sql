-- ========================================================
-- SKRIP SETUP DATABASE SUPABASE (POSTGRESQL)
-- Salin dan jalankan skrip ini di SQL Editor Supabase Anda
-- ========================================================

-- 1. Membuat Tabel Master OPD
CREATE TABLE IF NOT EXISTS master_opd (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL CHECK (kategori IN ('DINAS', 'KECAMATAN'))
);

-- 2. Membuat Tabel Rekap Bulanan
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
    nama_file TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_periode_opd UNIQUE (opd_id, bulan, tahun)
);

-- 3. Membuat Tabel Detail Pegawai
CREATE TABLE IF NOT EXISTS skp_detail_pegawai (
    id BIGSERIAL PRIMARY KEY,
    nip TEXT DEFAULT NULL,
    nama_pegawai TEXT NOT NULL,
    status_pegawai TEXT NOT NULL CHECK (status_pegawai IN ('PNS', 'PPPK', 'PPPK DW')),
    opd_id TEXT NOT NULL REFERENCES master_opd(id) ON DELETE CASCADE ON UPDATE CASCADE,
    predikat_kinerja TEXT NOT NULL,
    bulan TEXT NOT NULL,
    tahun INT8 NOT NULL,
    nama_file TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Menonaktifkan Row Level Security (RLS) agar dapat diakses dari frontend tanpa auth token kompleks
ALTER TABLE master_opd DISABLE ROW LEVEL SECURITY;
ALTER TABLE skp_rekap_bulanan DISABLE ROW LEVEL SECURITY;
ALTER TABLE skp_detail_pegawai DISABLE ROW LEVEL SECURITY;

-- 5. Mengisi Data Master OPD
-- Migrasi ID OPD lama ke ID baru (jika sudah ada data sebelumnya) agar relasi CASCADE berjalan otomatis
UPDATE master_opd SET id = 'DPMP2T', nama = 'Dinas Penanaman Modal dan Pelayanan Perizinan Terpadu (DPMP2T)' WHERE id = 'DPMPTSP';
UPDATE master_opd SET id = 'DISBUNNAK', nama = 'Dinas Perkebunan dan Peternakan' WHERE id = 'DISTANBUN';
UPDATE master_opd SET id = 'SET_MPA', nama = 'Sekretariat Majelis Pendidikan Aceh (MPA)' WHERE id = 'SET_MPD';

INSERT INTO master_opd (id, nama, kategori) VALUES
('BKPSDM', 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM)', 'DINAS'),
('SETDA', 'Sekretariat Daerah', 'DINAS'),
('BPKD', 'Badan Pengelolaan Keuangan Daerah (BPKD)', 'DINAS'),
('BAPPEDA', 'Badan Perencanaan Pembangunan Daerah (Bappeda)', 'DINAS'),
('BPBD', 'Badan Penanggulangan Bencana Daerah (BPBD)', 'DINAS'),
('KESBANGPOL', 'Badan Kesatuan Bangsa dan Politik (Kesbangpol)', 'DINAS'),
('INSPEKTORAT', 'Inspektorat Daerah', 'DINAS'),
('SATPOL_PP_WH', 'Satuan Polisi Pamong Praja dan Wilayatul Hisbah (Satpol PP dan WH)', 'DINAS'),
('RSUD_ZM', 'Rumah Sakit Umum Daerah (RSUD) dr. Zubir Mahmud', 'DINAS'),
('RSUD_SAAS', 'Rumah Sakit Umum Daerah (RSUD) Sultan Abdul Aziz Syah Peureulak', 'DINAS'),
('DISDIK', 'Dinas Pendidikan dan Kebudayaan', 'DINAS'),
('DINKES', 'Dinas Kesehatan', 'DINAS'),
('PUPR', 'Dinas Pekerjaan Umum dan Perumahan Rakyat (PUPR)', 'DINAS'),
('DINSOS', 'Dinas Sosial', 'DINAS'),
('DISDUKCAPIL', 'Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil)', 'DINAS'),
('DPMG', 'Dinas Pemberdayaan Masyarakat dan Gampong (DPMG)', 'DINAS'),
('DSI', 'Dinas Syariat Islam', 'DINAS'),
('DINAS_DAYAH', 'Dinas Pendidikan Dayah', 'DINAS'),
('DPMP2T', 'Dinas Penanaman Modal dan Pelayanan Perizinan Terpadu (DPMP2T)', 'DINAS'),
('DISKOMINFO', 'Dinas Komunikasi dan Informatika (Diskominfo)', 'DINAS'),
('DISHUB', 'Dinas Perhubungan', 'DINAS'),
('DLH', 'Dinas Lingkungan Hidup', 'DINAS'),
('DISPARPORA', 'Dinas Pariwisata, Pemuda, dan Olahraga (Disparpora)', 'DINAS'),
('DISKOPUKM', 'Dinas Perdagangan, Koperasi, dan UKM', 'DINAS'),
('DISBUNNAK', 'Dinas Perkebunan dan Peternakan', 'DINAS'),
('DKP', 'Dinas Kelautan dan Perikanan', 'DINAS'),
('DP3AKB', 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, dan Keluarga Berencana (DP3AKB)', 'DINAS'),
('DISPUSIP', 'Dinas Perpustakaan dan Kearsipan', 'DINAS'),
('PERTANAHAN', 'Dinas Pertanahan', 'DINAS'),
('DISTANTPH', 'Dinas Tanaman Pangan dan Hortikultura', 'DINAS'),
('DKPP', 'Dinas Ketahanan Pangan dan Penyuluhan', 'DINAS'),
('DISPERINNAKERTRANS', 'Dinas Perindustrian, Tenaga Kerja dan Transmigrasi', 'DINAS'),
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
('KEC_SUNGAI_RAYA', 'Kecamatan Sungai Raya', 'KECAMATAN'),
('SETWAN', 'Sekretariat Dewan Perwakilan Rakyat Kabupaten', 'DINAS'),
('SET_BAITUL_MAL', 'Sekretariat Baitul Mal', 'DINAS'),
('SET_MAA', 'Sekretariat Majelis Adat Aceh', 'DINAS'),
('SET_MPA', 'Sekretariat Majelis Pendidikan Aceh (MPA)', 'DINAS'),
('SET_MPU', 'Sekretariat Majelis Permusyawaratan Ulama', 'DINAS')
ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, kategori = EXCLUDED.kategori;

-- 6. Mengisi Data Awal Simulasi SKP (Tahun 2025 - Desember)
INSERT INTO skp_rekap_bulanan 
(opd_id, bulan, tahun, pns, pppk, pppk_dw, sangat_baik, baik, butuh_perbaikan, kurang, sangat_kurang, nama_file) 
VALUES
('BKPSDM', 'DESEMBER', 2025, 45, 20, 16, 20, 60, 1, 0, 0, 'skp_bkpsdm_final.xlsx'),
('DINKES', 'DESEMBER', 2025, 210, 102, 100, 120, 260, 24, 6, 2, 'skp_dinkes_final.xlsx'),
('DISDIK', 'DESEMBER', 2025, 950, 500, 400, 580, 1100, 120, 40, 10, 'skp_disdik_final.xlsx'),
('DISDUKCAPIL', 'DESEMBER', 2025, 30, 15, 10, 15, 38, 2, 0, 0, 'skp_disdukcapil_final.xlsx'),
('SETDA', 'DESEMBER', 2025, 75, 25, 20, 45, 70, 5, 0, 0, 'skp_setda_final.xlsx'),
('KEC_IDI', 'DESEMBER', 2025, 25, 15, 5, 10, 28, 5, 2, 0, 'skp_kec_idi_final.xlsx'),
('KEC_PEUREULAK', 'DESEMBER', 2025, 30, 10, 10, 15, 30, 4, 1, 0, 'skp_kec_peureulak_final.xlsx')
ON CONFLICT (opd_id, bulan, tahun) DO NOTHING;
