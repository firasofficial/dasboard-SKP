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
('DKP', 'Dinas Perikanan', 'DINAS'),
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

-- 6. Membuat Tabel Manajemen Pengguna & Kata Sandi (User Accounts & Password Management)
CREATE TABLE IF NOT EXISTS simonika_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL DEFAULT 'DINAS',
    role TEXT NOT NULL DEFAULT 'opd',
    level INT4 NOT NULL DEFAULT 2,
    password TEXT NOT NULL,
    is_custom_password BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Menonaktifkan RLS untuk tabel simonika_users
ALTER TABLE simonika_users DISABLE ROW LEVEL SECURITY;

-- 7. Inisialisasi Akun Default Administrator BKPSDM & 61 OPD se-Kabupaten Aceh Timur
INSERT INTO simonika_users (id, username, nama, kategori, role, level, password, is_custom_password) VALUES
('ADMIN_BKPSDM', 'admin', 'Administrator BKPSDM Kab. Aceh Timur', 'ADMIN', 'admin', 1, 'bkpsdm2026', FALSE),
('BKPSDM', 'opd_bkpsdm', 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia', 'DINAS', 'opd', 2, 'opd123', FALSE),
('SETDA', 'opd_setda', 'Sekretariat Daerah', 'DINAS', 'opd', 2, 'opd123', FALSE),
('BPKD', 'opd_bpkd', 'Badan Pengelolaan Keuangan Daerah', 'DINAS', 'opd', 2, 'opd123', FALSE),
('BAPPEDA', 'opd_bappeda', 'Badan Perencanaan Pembangunan Daerah', 'DINAS', 'opd', 2, 'opd123', FALSE),
('BPBD', 'opd_bpbd', 'Badan Penanggulangan Bencana Daerah', 'DINAS', 'opd', 2, 'opd123', FALSE),
('KESBANGPOL', 'opd_kesbangpol', 'Badan Kesatuan Bangsa dan Politik', 'DINAS', 'opd', 2, 'opd123', FALSE),
('INSPEKTORAT', 'opd_inspektorat', 'Inspektorat Daerah', 'DINAS', 'opd', 2, 'opd123', FALSE),
('SATPOL_PP_WH', 'opd_satpol_pp_wh', 'Satuan Polisi Pamong Praja dan Wilayatul Hisbah', 'DINAS', 'opd', 2, 'opd123', FALSE),
('RSUD_ZM', 'opd_rsud_zm', 'Rumah Sakit Umum Daerah dr. Zubir Mahmud', 'DINAS', 'opd', 2, 'opd123', FALSE),
('RSUD_SAAS', 'opd_rsud_saas', 'Rumah Sakit Umum Daerah Sultan Abdul Aziz Syah Peureulak', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DISDIK', 'opd_disdik', 'Dinas Pendidikan dan Kebudayaan', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DINKES', 'opd_dinkes', 'Dinas Kesehatan', 'DINAS', 'opd', 2, 'opd123', FALSE),
('PUPR', 'opd_pupr', 'Dinas Pekerjaan Umum dan Perumahan Rakyat', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DINSOS', 'opd_dinsos', 'Dinas Sosial', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DISDUKCAPIL', 'opd_disdukcapil', 'Dinas Kependudukan dan Pencatatan Sipil', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DPMG', 'opd_dpmg', 'Dinas Pemberdayaan Masyarakat dan Gampong', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DSI', 'opd_dsi', 'Dinas Syariat Islam', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DINAS_DAYAH', 'opd_dinas_dayah', 'Dinas Pendidikan Dayah', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DPMP2T', 'opd_dpmp2t', 'Dinas Penanaman Modal dan Pelayanan Perizinan Terpadu', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DISKOMINFO', 'opd_diskominfo', 'Dinas Komunikasi dan Informatika', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DISHUB', 'opd_dishub', 'Dinas Perhubungan', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DLH', 'opd_dlh', 'Dinas Lingkungan Hidup', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DISPARPORA', 'opd_disparpora', 'Dinas Pariwisata, Pemuda, dan Olahraga', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DISKOPUKM', 'opd_diskopukm', 'Dinas Perdagangan, Koperasi, dan UKM', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DISBUNNAK', 'opd_disbunnak', 'Dinas Perkebunan dan Peternakan', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DKP', 'opd_dkp', 'Dinas Perikanan', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DP3AKB', 'opd_dp3akb', 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, dan KB', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DISPUSIP', 'opd_dispusip', 'Dinas Perpustakaan dan Kearsipan', 'DINAS', 'opd', 2, 'opd123', FALSE),
('PERTANAHAN', 'opd_pertanahan', 'Dinas Pertanahan', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DISTANTPH', 'opd_distantph', 'Dinas Tanaman Pangan dan Hortikultura', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DKPP', 'opd_dkpp', 'Dinas Ketahanan Pangan dan Penyuluhan', 'DINAS', 'opd', 2, 'opd123', FALSE),
('DISPERINNAKERTRANS', 'opd_disperinnakertrans', 'Dinas Perindustrian, Tenaga Kerja dan Transmigrasi', 'DINAS', 'opd', 2, 'opd123', FALSE),
('SETWAN', 'opd_setwan', 'Sekretariat Dewan Perwakilan Rakyat Kabupaten', 'DINAS', 'opd', 2, 'opd123', FALSE),
('SET_BAITUL_MAL', 'opd_set_baitul_mal', 'Sekretariat Baitul Mal', 'DINAS', 'opd', 2, 'opd123', FALSE),
('SET_MAA', 'opd_set_maa', 'Sekretariat Majelis Adat Aceh', 'DINAS', 'opd', 2, 'opd123', FALSE),
('SET_MPA', 'opd_set_mpa', 'Sekretariat Majelis Pendidikan Aceh', 'DINAS', 'opd', 2, 'opd123', FALSE),
('SET_MPU', 'opd_set_mpu', 'Sekretariat Majelis Permusyawaratan Ulama', 'DINAS', 'opd', 2, 'opd123', FALSE),
('KEC_BANDA_ALAM', 'opd_kec_banda_alam', 'Kecamatan Banda Alam', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_BIREM_BAYEUN', 'opd_kec_birem_bayeun', 'Kecamatan Birem Bayeun', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_DARUL_AMAN', 'opd_kec_darul_aman', 'Kecamatan Darul Aman', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_DARUL_FALAH', 'opd_kec_darul_falah', 'Kecamatan Darul Falah', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_DARUL_IHSAN', 'opd_kec_darul_ihsan', 'Kecamatan Darul Ihsan', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_IDI', 'opd_kec_idi', 'Kecamatan Idi Rayeuk', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_IDI_TIMUR', 'opd_kec_idi_timur', 'Kecamatan Idi Timur', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_IDI_TUNONG', 'opd_kec_idi_tunong', 'Kecamatan Idi Tunong', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_INDRA_MAKMU', 'opd_kec_indra_makmu', 'Kecamatan Indra Makmu', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_JULOK', 'opd_kec_julok', 'Kecamatan Julok', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_MADAT', 'opd_kec_madat', 'Kecamatan Madat', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_NURUSSALAM', 'opd_kec_nurussalam', 'Kecamatan Nurussalam', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_PANTE_BIDARI', 'opd_kec_pante_bidari', 'Kecamatan Pante Bidari', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_PEUDAWA', 'opd_kec_peudawa', 'Kecamatan Peudawa', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_PEUNARON', 'opd_kec_peunaron', 'Kecamatan Peunaron', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_PEUREULAK', 'opd_kec_peureulak', 'Kecamatan Peureulak', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_PEUREULAK_BARAT', 'opd_kec_peureulak_barat', 'Kecamatan Peureulak Barat', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_PEUREULAK_TIMUR', 'opd_kec_peureulak_timur', 'Kecamatan Peureulak Timur', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_RANTO_PEUREULAK', 'opd_kec_ranto_peureulak', 'Kecamatan Ranto Peureulak', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_RANTAU_SELAMAT', 'opd_kec_rantau_selamat', 'Kecamatan Rantau Selamat', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_SERBAJADI', 'opd_kec_serbajadi', 'Kecamatan Serbajadi', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_SIMPANG_JERNIH', 'opd_kec_simpang_jernih', 'Kecamatan Simpang Jernih', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_SIMPANG_ULIM', 'opd_kec_simpang_ulim', 'Kecamatan Simpang Ulim', 'KECAMATAN', 'opd', 2, 'opd123', FALSE),
('KEC_SUNGAI_RAYA', 'opd_kec_sungai_raya', 'Kecamatan Sungai Raya', 'KECAMATAN', 'opd', 2, 'opd123', FALSE)
ON CONFLICT (id) DO NOTHING;

