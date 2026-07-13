// dashboard.js - Logika Frontend terintegrasi dengan Supabase (PostgreSQL Cloud)

// ==========================================
// KONFIGURASI SUPABASE
// ==========================================
// Masukkan URL Supabase dan Anon Key Anda di sini jika ingin di-hardcode
let SUPABASE_URL = 'https://hjinzrpqbcrjrllylrth.supabase.co';

let SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaW56cnBxYmNyanJsbHlscnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MDk2NzUsImV4cCI6MjA5OTQ4NTY3NX0.zBTeSstK6ft82yyGRbr-A90mmRT14TSCj4dOvM0vzDw';

// Fallback ke localStorage jika default masih placeholder
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || !SUPABASE_URL) {
    SUPABASE_URL = localStorage.getItem('supabase_url') || '';
}
if (SUPABASE_KEY === 'YOUR_SUPABASE_KEY' || !SUPABASE_KEY) {
    SUPABASE_KEY = localStorage.getItem('supabase_key') || '';
}

let supabaseClient = null;
if (SUPABASE_URL && SUPABASE_KEY) {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
        console.error("Gagal menginisialisasi Supabase:", e);
    }
}

// Prompt untuk setup Supabase jika belum terkonfigurasi
function checkSupabaseConfig() {
    if (!supabaseClient) {
        const url = prompt("Masukkan Supabase Project URL Anda:\n(Contoh: https://xxxx.supabase.co)");

        const key = prompt("Masukkan Supabase Anon/Public Key Anda:");
        if (url && key) {
            localStorage.setItem('supabase_url', url.trim());
            localStorage.setItem('supabase_key', key.trim());
            alert("Konfigurasi disimpan. Halaman akan dimuat ulang.");
            location.reload();
        } else {
            alert("Aplikasi berjalan dalam mode offline/terbatas karena Supabase belum dikonfigurasi.");
        }
    }
}

// Reset konfigurasi jika ingin mengganti database
window.resetSupabaseConfig = function() {
    if (confirm("Apakah Anda yakin ingin menghapus konfigurasi database Supabase saat ini?")) {
        localStorage.removeItem('supabase_url');
        localStorage.removeItem('supabase_key');
        location.reload();
    }
};

const MASTER_OPD_LIST = [
    { id: 'BKPSDM', nama: 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM)', kategori: 'DINAS' },
    { id: 'SETDA', nama: 'Sekretariat Daerah', kategori: 'DINAS' },
    { id: 'BPKD', nama: 'Badan Pengelolaan Keuangan Daerah (BPKD)', kategori: 'DINAS' },
    { id: 'BAPPEDA', nama: 'Badan Perencanaan Pembangunan Daerah (Bappeda)', kategori: 'DINAS' },
    { id: 'BPBD', nama: 'Badan Penanggulangan Bencana Daerah (BPBD)', kategori: 'DINAS' },
    { id: 'KESBANGPOL', nama: 'Badan Kesatuan Bangsa dan Politik (Kesbangpol)', kategori: 'DINAS' },
    { id: 'INSPEKTORAT', nama: 'Inspektorat Daerah', kategori: 'DINAS' },
    { id: 'SATPOL_PP_WH', nama: 'Satuan Polisi Pamong Praja dan Wilayatul Hisbah (Satpol PP dan WH)', kategori: 'DINAS' },
    { id: 'RSUD_ZM', nama: 'Rumah Sakit Umum Daerah (RSUD) dr. Zubir Mahmud', kategori: 'DINAS' },
    { id: 'RSUD_SAAS', nama: 'Rumah Sakit Umum Daerah (RSUD) Sultan Abdul Aziz Syah Peureulak', kategori: 'DINAS' },
    { id: 'DISDIK', nama: 'Dinas Pendidikan dan Kebudayaan', kategori: 'DINAS' },
    { id: 'DINKES', nama: 'Dinas Kesehatan', kategori: 'DINAS' },
    { id: 'PUPR', 'nama': 'Dinas Pekerjaan Umum dan Perumahan Rakyat (PUPR)', kategori: 'DINAS' },
    { id: 'DINSOS', nama: 'Dinas Sosial', kategori: 'DINAS' },
    { id: 'DISDUKCAPIL', nama: 'Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil)', kategori: 'DINAS' },
    { id: 'DPMG', nama: 'Dinas Pemberdayaan Masyarakat dan Gampong (DPMG)', kategori: 'DINAS' },
    { id: 'DSI', nama: 'Dinas Syariat Islam', kategori: 'DINAS' },
    { id: 'DINAS_DAYAH', nama: 'Dinas Pendidikan Dayah', kategori: 'DINAS' },
    { id: 'DPMPTSP', nama: 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP)', kategori: 'DINAS' },
    { id: 'DISKOMINFO', nama: 'Dinas Komunikasi dan Informatika (Diskominfo)', kategori: 'DINAS' },
    { id: 'DISHUB', nama: 'Dinas Perhubungan', kategori: 'DINAS' },
    { id: 'DLH', nama: 'Dinas Lingkungan Hidup', kategori: 'DINAS' },
    { id: 'DISPARPORA', nama: 'Dinas Pariwisata, Pemuda, dan Olahraga (Disparpora)', kategori: 'DINAS' },
    { id: 'DISKOPUKM', nama: 'Dinas Perdagangan, Koperasi, dan UKM', kategori: 'DINAS' },
    { id: 'DISTANBUN', nama: 'Dinas Pertanian dan Perkebunan', kategori: 'DINAS' },
    { id: 'DKP', nama: 'Dinas Kelautan dan Perikanan', kategori: 'DINAS' },
    { id: 'DP3AKB', nama: 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, dan Keluarga Berencana (DP3AKB)', kategori: 'DINAS' },
    { id: 'DISPUSIP', nama: 'Dinas Perpustakaan dan Kearsipan', kategori: 'DINAS' },
    { id: 'PERTANAHAN', nama: 'Dinas Pertanahan', kategori: 'DINAS' },
    { id: 'KEC_BANDA_ALAM', nama: 'Kecamatan Banda Alam', kategori: 'KECAMATAN' },
    { id: 'KEC_BIREM_BAYEUN', nama: 'Kecamatan Birem Bayeun', kategori: 'KECAMATAN' },
    { id: 'KEC_DARUL_AMAN', nama: 'Kecamatan Darul Aman', kategori: 'KECAMATAN' },
    { id: 'KEC_DARUL_FALAH', nama: 'Kecamatan Darul Falah', kategori: 'KECAMATAN' },
    { id: 'KEC_IDI', nama: 'Kecamatan Idi Rayeuk', kategori: 'KECAMATAN' },
    { id: 'KEC_IDI_TIMUR', nama: 'Kecamatan Idi Timur', kategori: 'KECAMATAN' },
    { id: 'KEC_IDI_TUNONG', nama: 'Kecamatan Idi Tunong', kategori: 'KECAMATAN' },
    { id: 'KEC_JULOK', nama: 'Kecamatan Julok', kategori: 'KECAMATAN' },
    { id: 'KEC_NURUSSALAM', nama: 'Kecamatan Nurussalam', kategori: 'KECAMATAN' },
    { id: 'KEC_PANTE_BIDARI', nama: 'Kecamatan Pante Bidari', kategori: 'KECAMATAN' },
    { id: 'KEC_PEUDAWA', nama: 'Kecamatan Peudawa', kategori: 'KECAMATAN' },
    { id: 'KEC_PEUNARON', nama: 'Kecamatan Peunaron', kategori: 'KECAMATAN' },
    { id: 'KEC_PEUREULAK', nama: 'Kecamatan Peureulak', kategori: 'KECAMATAN' },
    { id: 'KEC_PEUREULAK_BARAT', nama: 'Kecamatan Peureulak Barat', kategori: 'KECAMATAN' },
    { id: 'KEC_PEUREULAK_TIMUR', nama: 'Kecamatan Peureulak Timur', kategori: 'KECAMATAN' },
    { id: 'KEC_RANTO_PEUREULAK', nama: 'Kecamatan Ranto Peureulak', kategori: 'KECAMATAN' },
    { id: 'KEC_RANTAU_SELAMAT', nama: 'Kecamatan Rantau Selamat', kategori: 'KECAMATAN' },
    { id: 'KEC_SERBAJADI', nama: 'Kecamatan Serbajadi', kategori: 'KECAMATAN' },
    { id: 'KEC_SIMPANG_JERNIH', nama: 'Kecamatan Simpang Jernih', kategori: 'KECAMATAN' },
    { id: 'KEC_SIMPANG_ULIM', nama: 'Kecamatan Simpang Ulim', kategori: 'KECAMATAN' },
    { id: 'KEC_SUNGAI_RAYA', nama: 'Kecamatan Sungai Raya', kategori: 'KECAMATAN' },
    { id: 'SETWAN', nama: 'Sekretariat Dewan Perwakilan Rakyat Kabupaten', kategori: 'DINAS' },
    { id: 'SET_BAITUL_MAL', nama: 'Sekretariat Baitul Mal', kategori: 'DINAS' },
    { id: 'SET_MAA', nama: 'Sekretariat Majelis Adat Aceh', kategori: 'DINAS' },
    { id: 'SET_MPD', nama: 'Sekretariat Majelis Pendidikan Dayah', kategori: 'DINAS' },
    { id: 'SET_MPU', nama: 'Sekretariat Majelis Permusyawaratan Ulama', kategori: 'DINAS' }
];

const INDONESIAN_MONTHS = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

let currentCategoryFilter = 'SEMUA';
let kinerjaChart = null;
let currentUploadOpdId = null;
let currentUploadFilename = '';

// ==========================================
// INISIALISASI & FETCH DATABASE
// ==========================================

function initDatabase() {
    if (!supabaseClient) {
        checkSupabaseConfig();
        return;
    }
    updateDashboardDynamic();
}

function refreshAllData() {
    updateDashboardDynamic();
    renderOpdList();
    renderLaporanBulanan();
}

function populateFilters() {
    const filterBulan = document.getElementById('filter-bulan');
    const filterTahun = document.getElementById('filter-tahun');

    const currentBulan = filterBulan.value;
    const currentTahun = filterTahun.value;

    filterBulan.innerHTML = '';
    filterTahun.innerHTML = '';

    const years = [2026, 2025, 2024, 2023];

    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        filterTahun.appendChild(option);
    });

    if (currentTahun && years.includes(Number(currentTahun))) {
        filterTahun.value = currentTahun;
    } else {
        filterTahun.value = 2025; // Default ke data awal (2025)
    }

    updateBulanOptions();
}

function updateBulanOptions() {
    const filterBulan = document.getElementById('filter-bulan');
    const currentBulan = filterBulan.value;
    filterBulan.innerHTML = '';

    INDONESIAN_MONTHS.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        filterBulan.appendChild(option);
    });

    if (currentBulan && INDONESIAN_MONTHS.includes(currentBulan)) {
        filterBulan.value = currentBulan;
    } else {
        filterBulan.value = "DESEMBER";
    }

    updateOpdDropdown();
}

function updateOpdDropdown() {
    const opdSelect = document.getElementById('opd-select');
    const currentSelectedOpd = opdSelect.value;

    opdSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = 'SEMUA';
    if (currentCategoryFilter === 'SEMUA') {
        defaultOption.textContent = '-- TAMPILKAN SEMUA OPD --';
    } else if (currentCategoryFilter === 'DINAS') {
        defaultOption.textContent = '-- TAMPILKAN SEMUA DINAS / BADAN --';
    } else {
        defaultOption.textContent = '-- TAMPILKAN SEMUA KECAMATAN --';
    }
    opdSelect.appendChild(defaultOption);

    const filteredOpd = MASTER_OPD_LIST.filter(item => {
        if (currentCategoryFilter === 'SEMUA') return true;
        return item.kategori === currentCategoryFilter;
    }).sort((a, b) => a.nama.localeCompare(b.nama));

    filteredOpd.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.nama;
        opdSelect.appendChild(option);
    });

    const optionExists = Array.from(opdSelect.options).some(opt => opt.value === currentSelectedOpd);
    if (optionExists) {
        opdSelect.value = currentSelectedOpd;
    } else {
        opdSelect.value = 'SEMUA';
    }

    if (typeof syncSearchableDropdown === 'function') {
        syncSearchableDropdown();
    }
}

// ==========================================
// RENDER DATA DASHBOARD UTAMA (SUPABASE)
// ==========================================

async function updateDashboardDynamic() {
    if (!supabaseClient) return;

    const selectedYear = parseInt(document.getElementById('filter-tahun').value);
    const selectedBulan = document.getElementById('filter-bulan').value;
    const selectedOpd = document.getElementById('opd-select').value;

    if (!selectedYear || !selectedBulan) return;

    try {
        if (selectedOpd !== 'SEMUA') {
            // Tarik satu OPD
            const { data, error } = await supabaseClient
                .from('skp_rekap_bulanan')
                .select('*, master_opd(*)')
                .eq('tahun', selectedYear)
                .eq('bulan', selectedBulan)
                .eq('opd_id', selectedOpd)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                renderDashboardDOM(formatDashboardData(data, data.master_opd.nama));
            } else {
                const opdMeta = MASTER_OPD_LIST.find(o => o.id === selectedOpd);
                const displayName = opdMeta ? opdMeta.nama : 'Unit Kerja';
                renderDashboardDOM(getEmptyDashboardData(displayName));
            }
        } else {
            // Akumulasi data
            let query = supabaseClient
                .from('skp_rekap_bulanan')
                .select('*, master_opd(*)')
                .eq('tahun', selectedYear)
                .eq('bulan', selectedBulan);

            const { data, error } = await query;
            if (error) throw error;

            let filteredData = data || [];
            if (currentCategoryFilter !== 'SEMUA') {
                filteredData = filteredData.filter(row => row.master_opd && row.master_opd.kategori === currentCategoryFilter);
            }

            let displayName = "PENILAIAN SKP ASN PEMERINTAH KAB. ACEH TIMUR";
            if (currentCategoryFilter === 'DINAS') {
                displayName = "REKAPITULASI PENILAIAN SKP DINAS & BADAN KAB. ACEH TIMUR";
            } else if (currentCategoryFilter === 'KECAMATAN') {
                displayName = "REKAPITULASI PENILAIAN SKP KECAMATAN KAB. ACEH TIMUR";
            }

            if (filteredData && filteredData.length > 0) {
                // Sum data
                let aggregated = {
                    pns: 0, pppk: 0, pppk_dw: 0,
                    sangat_baik: 0, baik: 0, butuh_perbaikan: 0, kurang: 0, sangat_kurang: 0
                };
                filteredData.forEach(row => {
                    aggregated.pns += parseInt(row.pns) || 0;
                    aggregated.pppk += parseInt(row.pppk) || 0;
                    aggregated.pppk_dw += parseInt(row.pppk_dw) || 0;
                    aggregated.sangat_baik += parseInt(row.sangat_baik) || 0;
                    aggregated.baik += parseInt(row.baik) || 0;
                    aggregated.butuh_perbaikan += parseInt(row.butuh_perbaikan) || 0;
                    aggregated.kurang += parseInt(row.kurang) || 0;
                    aggregated.sangat_kurang += parseInt(row.sangat_kurang) || 0;
                });
                renderDashboardDOM(formatDashboardData(aggregated, displayName));
            } else {
                renderDashboardDOM(getEmptyDashboardData(displayName));
            }
        }
    } catch (err) {
        console.error("Gagal memperbarui dashboard:", err);
    }
}

function formatDashboardData(data, displayName) {
    const pns = parseInt(data.pns || 0);
    const pppk = parseInt(data.pppk || 0);
    const pppkDw = parseInt(data.pppk_dw || 0);
    const total = pns + pppk + pppkDw;

    const sangatBaik = parseInt(data.sangat_baik || 0);
    const baik = parseInt(data.baik || 0);
    const butuhPerbaikan = parseInt(data.butuh_perbaikan || 0);
    const kurang = parseInt(data.kurang || 0);
    const sangatKurang = parseInt(data.sangat_kurang || 0);
    const totalPredikat = sangatBaik + baik + butuhPerbaikan + kurang + sangatKurang;

    return {
        nama: displayName,
        total: total,
        pns: pns,
        pppk: pppk,
        pppkDw: pppkDw,
        predikat: [
            { nama: 'Sangat Baik', emoji: '👍', jumlah: sangatBaik, persen: totalPredikat > 0 ? (sangatBaik / totalPredikat) * 100 : 0, color: '#22c55e' },
            { nama: 'Baik', emoji: '✔️', jumlah: baik, persen: totalPredikat > 0 ? (baik / totalPredikat) * 100 : 0, color: '#3b82f6' },
            { nama: 'Butuh Perbaikan', emoji: '⚠️', jumlah: butuhPerbaikan, persen: totalPredikat > 0 ? (butuhPerbaikan / totalPredikat) * 100 : 0, color: '#eab308' },
            { nama: 'Kurang', emoji: '⬇️', jumlah: kurang, persen: totalPredikat > 0 ? (kurang / totalPredikat) * 100 : 0, color: '#f97316' },
            { nama: 'Sangat Kurang', emoji: '✖️', jumlah: sangatKurang, persen: totalPredikat > 0 ? (sangatKurang / totalPredikat) * 100 : 0, color: '#ef4444' }
        ]
    };
}

function getEmptyDashboardData(displayName) {
    return {
        nama: displayName,
        total: 0, pns: 0, pppk: 0, pppkDw: 0,
        predikat: [
            { nama: 'Sangat Baik', emoji: '👍', jumlah: 0, persen: 0, color: '#22c55e' },
            { nama: 'Baik', emoji: '✔️', jumlah: 0, persen: 0, color: '#3b82f6' },
            { nama: 'Butuh Perbaikan', emoji: '⚠️', jumlah: 0, persen: 0, color: '#eab308' },
            { nama: 'Kurang', emoji: '⬇️', jumlah: 0, persen: 0, color: '#f97316' },
            { nama: 'Sangat Kurang', emoji: '✖️', jumlah: 0, persen: 0, color: '#ef4444' }
        ]
    };
}

function renderDashboardDOM(data) {
    document.getElementById('opd-subtitle').textContent = data.nama;

    document.getElementById('stat-total-asn').textContent = formatNumber(data.total);
    document.getElementById('stat-pns').textContent = formatNumber(data.pns);
    document.getElementById('stat-pppk').textContent = formatNumber(data.pppk);
    document.getElementById('stat-pppk-dw').textContent = formatNumber(data.pppkDw);

    const keys = ['sangatbaik', 'baik', 'butuhperbaikan', 'kurang', 'sangatkurang'];
    data.predikat.forEach((item, index) => {
        const key = keys[index];
        document.getElementById(`cat-${key}-count`).textContent = formatNumber(item.jumlah);
        document.getElementById(`cat-${key}-pct`).textContent = item.persen.toFixed(1) + '%';
        document.getElementById(`cat-${key}-bar`).style.width = item.persen + '%';
    });

    document.getElementById('table-total-asn').textContent = `Total: ${formatNumber(data.total)} ASN`;
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    data.predikat.forEach((item) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0';

        let badgeClass = '';
        if (item.nama === 'Sangat Baik') badgeClass = 'bg-green-50 text-green-700 border-green-200';
        else if (item.nama === 'Baik') badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
        else if (item.nama === 'Butuh Perbaikan') badgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
        else if (item.nama === 'Kurang') badgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
        else if (item.nama === 'Sangat Kurang') badgeClass = 'bg-red-50 text-red-700 border-red-200';

        row.innerHTML = `
            <td class="py-3.5 px-5 font-semibold text-slate-700 flex items-center gap-2.5">
                <span>${item.emoji}</span>
                <span class="px-2 py-0.5 rounded-lg border text-xs ${badgeClass}">${item.nama}</span>
            </td>
            <td class="py-3.5 px-4 text-right font-extrabold text-slate-800">${formatNumber(item.jumlah)}</td>
            <td class="py-3.5 px-5 text-right font-medium text-slate-500">${item.persen.toFixed(2)}%</td>
        `;
        tbody.appendChild(row);
    });

    if (kinerjaChart) {
        kinerjaChart.data.datasets[0].data = data.predikat.map(item => item.jumlah);
        const maxVal = Math.max(...data.predikat.map(item => item.jumlah));
        kinerjaChart.options.scales.y.max = maxVal === 0 ? 10 : Math.ceil(maxVal * 1.15);
        kinerjaChart.update();
    }
}

// ==========================================
// RENDER HALAMAN DATA OPD (SUPABASE)
// ==========================================

async function renderOpdList() {
    if (!supabaseClient) return;

    const container = document.getElementById('opdListContainer');
    if (!container) return;

    const selectedYear = parseInt(document.getElementById('opd-filter-tahun').value);
    const selectedBulan = document.getElementById('opd-filter-bulan').value;
    const searchQuery = (document.getElementById('searchOPD')?.value || '').toLowerCase().trim();

    container.innerHTML = '<div class="py-10 text-center text-slate-400 font-semibold">Memuat data...</div>';

    try {
        // Tarik rekap terisi
        const { data: filledList, error: errorFilled } = await supabaseClient
            .from('skp_rekap_bulanan')
            .select('opd_id, nama_file')
            .eq('tahun', selectedYear)
            .eq('bulan', selectedBulan);

        if (errorFilled) throw errorFilled;

        const filledMap = {};
        filledList.forEach(item => {
            filledMap[item.opd_id] = item.nama_file;
        });

        const filtered = MASTER_OPD_LIST.filter(opd => {
            return opd.nama.toLowerCase().includes(searchQuery) || opd.id.toLowerCase().includes(searchQuery);
        }).sort((a, b) => a.nama.localeCompare(b.nama));

        container.innerHTML = '';
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 text-center">
                    <span class="text-2xl mb-2">🔍</span>
                    <p class="text-xs font-semibold text-slate-400">Unit kerja tidak ditemukan</p>
                </div>
            `;
            return;
        }

        filtered.forEach(opd => {
            const isUploaded = !!filledMap[opd.id];
            const filename = filledMap[opd.id] || '';
            const itemDiv = document.createElement('div');
            itemDiv.className = `flex items-center justify-between p-4 ${isUploaded ? 'bg-slate-50/80 border-slate-100' : 'bg-white border-slate-200/60'} rounded-xl border transition-all hover:shadow-sm`;

            let statusHtml = '';
            let actionButtonHtml = '';

            if (isUploaded) {
                statusHtml = `
                    <p class="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1.5">
                        <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span> ${filename}
                    </p>
                `;
                actionButtonHtml = `
                    <button onclick="bukaModalUpload('${opd.id}')" class="px-3 py-1.5 text-xs font-bold text-indigo-650 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors focus:outline-none flex items-center gap-1">
                        🔄 Ganti
                    </button>
                `;
            } else {
                statusHtml = `
                    <p class="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1.5">
                        <span class="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Belum ada data
                    </p>
                `;
                actionButtonHtml = `
                    <button onclick="bukaModalUpload('${opd.id}')" class="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm active:scale-[0.98] transition-all focus:outline-none flex items-center gap-1">
                        📁 Unggah
                    </button>
                `;
            }

            itemDiv.innerHTML = `
                <div class="pr-3 overflow-hidden">
                    <p class="font-bold text-slate-800 text-xs sm:text-sm truncate">${opd.nama}</p>
                    ${statusHtml}
                </div>
                <div class="shrink-0">
                    ${actionButtonHtml}
                </div>
            `;
            container.appendChild(itemDiv);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="py-10 text-center text-red-500 font-semibold">Gagal memuat data dari Supabase.</div>';
    }
}

// ==========================================
// RENDER LAPORAN BULANAN (SUPABASE)
// ==========================================

async function renderLaporanBulanan() {
    if (!supabaseClient) return;

    const selectedYear = parseInt(document.getElementById('laporan-filter-tahun').value);
    const selectedBulan = document.getElementById('laporan-filter-bulan').value;

    const webSubtitle = document.getElementById('laporan-web-subtitle');
    if (webSubtitle) webSubtitle.textContent = `${selectedBulan} ${selectedYear}`;

    const printPeriod = document.getElementById('laporan-print-period');
    if (printPeriod) printPeriod.textContent = `PERIODE BULAN: ${selectedBulan} TAHUN: ${selectedYear}`;

    const printSigDate = document.getElementById('print-sig-date');
    if (printSigDate) {
        const monthTitle = selectedBulan.charAt(0) + selectedBulan.slice(1).toLowerCase();
        printSigDate.textContent = `Idi, ${monthTitle} ${selectedYear}`;
    }

    const tableBody = document.getElementById('laporan-table-body');
    const printTableBody = document.getElementById('laporan-print-table-body');
    if (!tableBody || !printTableBody) return;

    tableBody.innerHTML = '<tr><td colspan="9" class="py-10 text-center text-slate-400 font-semibold">Memuat data...</td></tr>';
    printTableBody.innerHTML = '';

    try {
        const { data: filledList, error } = await supabaseClient
            .from('skp_rekap_bulanan')
            .select('*')
            .eq('tahun', selectedYear)
            .eq('bulan', selectedBulan);

        if (error) throw error;

        const filledMap = {};
        filledList.forEach(item => {
            filledMap[item.opd_id] = item;
        });

        tableBody.innerHTML = '';

        let totalOpdFilled = 0;
        let totalPegawaiAcc = 0;
        let totalSangatBaikAcc = 0;
        let totalBaikAcc = 0;
        let totalButuhPerbaikanAcc = 0;
        let totalKurangAcc = 0;
        let totalSangatKurangAcc = 0;

        let countPns = 0;
        let countPppk = 0;

        MASTER_OPD_LIST.sort((a,b) => a.nama.localeCompare(b.nama)).forEach((opd, index) => {
            const dbData = filledMap[opd.id];
            const hasData = !!dbData;

            let totalPegawai = 0;
            let sangatBaik = 0;
            let baik = 0;
            let butuhPerbaikan = 0;
            let kurang = 0;
            let sangatKurang = 0;

            if (hasData) {
                totalPegawai = parseInt(dbData.pns || 0) + parseInt(dbData.pppk || 0) + parseInt(dbData.pppk_dw || 0);
                sangatBaik = parseInt(dbData.sangat_baik || 0);
                baik = parseInt(dbData.baik || 0);
                butuhPerbaikan = parseInt(dbData.butuh_perbaikan || 0);
                kurang = parseInt(dbData.kurang || 0);
                sangatKurang = parseInt(dbData.sangat_kurang || 0);

                countPns += parseInt(dbData.pns || 0);
                countPppk += (parseInt(dbData.pppk || 0) + parseInt(dbData.pppk_dw || 0));

                totalOpdFilled++;
                totalPegawaiAcc += totalPegawai;
                totalSangatBaikAcc += sangatBaik;
                totalBaikAcc += baik;
                totalButuhPerbaikanAcc += butuhPerbaikan;
                totalKurangAcc += kurang;
                totalSangatKurangAcc += sangatKurang;
            }

            // Web Table Row
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 border-b border-slate-100 last:border-0';
            const statusHtml = hasData 
                ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Terisi</span>`
                : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Belum Ada</span>`;

            tr.innerHTML = `
                <td class="py-3 px-4 text-center text-slate-400 font-semibold">${index + 1}</td>
                <td class="py-3 px-4">
                    <div class="font-bold text-slate-800">${opd.nama}</div>
                    <div class="text-[9px] text-slate-500 uppercase font-semibold mt-0.5">${opd.kategori}</div>
                </td>
                <td class="py-3 px-4 text-center">${statusHtml}</td>
                <td class="py-3 px-4 text-right font-bold">${hasData ? formatNumber(totalPegawai) : '-'}</td>
                <td class="py-3 px-3 text-right text-emerald-600 font-semibold">${hasData ? formatNumber(sangatBaik) : '-'}</td>
                <td class="py-3 px-3 text-right text-blue-600 font-semibold">${hasData ? formatNumber(baik) : '-'}</td>
                <td class="py-3 px-3 text-right text-yellow-600 font-semibold">${hasData ? formatNumber(butuhPerbaikan) : '-'}</td>
                <td class="py-3 px-3 text-right text-orange-500 font-semibold">${hasData ? formatNumber(kurang) : '-'}</td>
                <td class="py-3 px-3 text-right text-red-500 font-semibold">${hasData ? formatNumber(sangatKurang) : '-'}</td>
            `;
            tableBody.appendChild(tr);

            // Print Table Row
            const printTr = document.createElement('tr');
            printTr.innerHTML = `
                <td style="text-align: center;">${index + 1}</td>
                <td>${opd.nama}</td>
                <td style="text-align: center; font-weight: bold; color: ${hasData ? 'green' : 'red'};">${hasData ? 'Terisi' : 'Belum'}</td>
                <td style="text-align: right;">${hasData ? formatNumber(totalPegawai) : '0'}</td>
                <td style="text-align: right;">${hasData ? formatNumber(sangatBaik) : '0'}</td>
                <td style="text-align: right;">${hasData ? formatNumber(baik) : '0'}</td>
                <td style="text-align: right;">${hasData ? formatNumber(butuhPerbaikan) : '0'}</td>
                <td style="text-align: right;">${hasData ? formatNumber(kurang) : '0'}</td>
                <td style="text-align: right;">${hasData ? formatNumber(sangatKurang) : '0'}</td>
            `;
            printTableBody.appendChild(printTr);
        });

        // Update web labels
        document.getElementById('laporan-total-status').textContent = `${totalOpdFilled} / ${MASTER_OPD_LIST.length} OPD`;
        document.getElementById('laporan-total-pegawai').textContent = formatNumber(totalPegawaiAcc);
        document.getElementById('laporan-total-sangatbaik').textContent = formatNumber(totalSangatBaikAcc);
        document.getElementById('laporan-total-baik').textContent = formatNumber(totalBaikAcc);
        document.getElementById('laporan-total-butuhperbaikan').textContent = formatNumber(totalButuhPerbaikanAcc);
        document.getElementById('laporan-total-kurang').textContent = formatNumber(totalKurangAcc);
        document.getElementById('laporan-total-sangatkurang').textContent = formatNumber(totalSangatKurangAcc);

        // Update print labels
        document.getElementById('print-total-status').textContent = `${totalOpdFilled} OPD`;
        document.getElementById('print-total-pegawai').textContent = formatNumber(totalPegawaiAcc);
        document.getElementById('print-total-sangatbaik').textContent = formatNumber(totalSangatBaikAcc);
        document.getElementById('print-total-baik').textContent = formatNumber(totalBaikAcc);
        document.getElementById('print-total-butuhperbaikan').textContent = formatNumber(totalButuhPerbaikanAcc);
        document.getElementById('print-total-kurang').textContent = formatNumber(totalKurangAcc);
        document.getElementById('print-total-sangatkurang').textContent = formatNumber(totalSangatKurangAcc);

        // Update statistics cards
        const opdPct = MASTER_OPD_LIST.length > 0 ? (totalOpdFilled / MASTER_OPD_LIST.length) * 100 : 0;
        document.getElementById('laporan-stat-opd-count').textContent = `${totalOpdFilled} / ${MASTER_OPD_LIST.length}`;
        document.getElementById('laporan-stat-opd-pct').textContent = `${opdPct.toFixed(1)}% Terpenuhi`;

        document.getElementById('laporan-stat-asn-count').textContent = formatNumber(totalPegawaiAcc);
        document.getElementById('laporan-stat-asn-ratio').textContent = `PNS: ${formatNumber(countPns)} | PPPK: ${formatNumber(countPppk)}`;

        const totalPredikatAll = totalSangatBaikAcc + totalBaikAcc + totalButuhPerbaikanAcc + totalKurangAcc + totalSangatKurangAcc;
        const baikPct = totalPredikatAll > 0 ? ((totalSangatBaikAcc + totalBaikAcc) / totalPredikatAll) * 100 : 0;
        const kurangPct = totalPredikatAll > 0 ? ((totalButuhPerbaikanAcc + totalKurangAcc + totalSangatKurangAcc) / totalPredikatAll) * 100 : 0;

        document.getElementById('laporan-stat-baik-pct').textContent = `${baikPct.toFixed(1)}%`;
        document.getElementById('laporan-stat-baik-count').textContent = `${formatNumber(totalSangatBaikAcc + totalBaikAcc)} Pegawai`;

        document.getElementById('laporan-stat-kurang-pct').textContent = `${kurangPct.toFixed(1)}%`;
        document.getElementById('laporan-stat-kurang-count').textContent = `${formatNumber(totalButuhPerbaikanAcc + totalKurangAcc + totalSangatKurangAcc)} Pegawai`;

        // Update Print Info Blocks
        document.getElementById('print-info-opd-count').textContent = `${totalOpdFilled} dari ${MASTER_OPD_LIST.length} Unit Kerja / Kecamatan`;
        document.getElementById('print-info-pegawai-count').textContent = `${formatNumber(totalPegawaiAcc)} ASN (PNS: ${formatNumber(countPns)} | PPPK: ${formatNumber(countPppk)})`;

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="9" class="py-10 text-center text-red-500 font-semibold">Gagal memuat laporan.</td></tr>';
    }
}

// ==========================================
// RIWAYAT IMPOR (SUPABASE)
// ==========================================

async function renderImportHistory() {
    if (!supabaseClient) return;

    const list = document.getElementById('import-history-list');
    if (!list) return;
    list.innerHTML = '<div class="p-4 text-center text-xs text-slate-400 font-semibold">Memuat riwayat...</div>';

    try {
        const { data, error } = await supabaseClient
            .from('skp_rekap_bulanan')
            .select('tahun, bulan, opd_id');

        if (error) throw error;

        list.innerHTML = '';
        if (!data || data.length === 0) {
            list.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 font-semibold">Tidak ada data periode terimpor.</div>`;
            return;
        }

        // Group by year and month
        const history = {};
        data.forEach(item => {
            const key = `${item.bulan}_${item.tahun}`;
            if (!history[key]) {
                history[key] = { tahun: parseInt(item.tahun), bulan: item.bulan, opd_count: 0 };
            }
            history[key].opd_count++;
        });

        const historyList = Object.values(history).sort((a, b) => b.tahun - a.tahun || b.bulan.localeCompare(a.bulan));

        historyList.forEach(item => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0';

            const isDefault = item.tahun === 2023 && item.bulan === 'DESEMBER';

            div.innerHTML = `
                <div class="space-y-0.5">
                    <p class="text-xs font-bold text-slate-800">${item.bulan} ${item.tahun}</p>
                    <p class="text-[10px] text-slate-400 font-semibold uppercase">${item.opd_count} Unit Kerja Terdaftar</p>
                </div>
                ${isDefault ? `
                    <span class="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Bawaan</span>
                ` : `
                    <button onclick="deletePeriod('${item.tahun}', '${item.bulan}')" class="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors focus:outline-none" title="Hapus Periode Ini">
                        <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                `}
            `;
            list.appendChild(div);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = `<div class="p-4 text-center text-xs text-red-500 font-semibold">Gagal memuat riwayat.</div>`;
    }
}

// Hapus salah satu periode
window.deletePeriod = async function (year, month) {
    if (!supabaseClient) return;
    if (confirm(`Apakah Anda yakin ingin menghapus data kinerja untuk periode ${month} ${year}?`)) {
        try {
            const { error: errorRekap } = await supabaseClient
                .from('skp_rekap_bulanan')
                .delete()
                .eq('tahun', parseInt(year))
                .eq('bulan', month);

            const { error: errorDetail } = await supabaseClient
                .from('skp_detail_pegawai')
                .delete()
                .eq('tahun', parseInt(year))
                .eq('bulan', month);

            if (errorRekap) throw errorRekap;
            if (errorDetail) throw errorDetail;

            alert(`Periode ${month} ${year} berhasil dihapus.`);
            refreshAllData();
            renderImportHistory();
        } catch (err) {
            console.error("Gagal menghapus periode:", err);
            alert("Gagal menghapus data dari Supabase.");
        }
    }
};

// Reset database ke default
window.confirmResetDatabase = async function () {
    if (!supabaseClient) return;
    if (confirm("Apakah Anda yakin ingin mereset seluruh database di Supabase? Seluruh data Excel yang pernah Anda impor akan dihapus permanen!")) {
        try {
            // Hapus data lama (karena API client tidak support TRUNCATE, kita delete all)
            const { error: errorRekap } = await supabaseClient.from('skp_rekap_bulanan').delete().neq('id', 0);
            const { error: errorDetail } = await supabaseClient.from('skp_detail_pegawai').delete().neq('id', 0);

            if (errorRekap) throw errorRekap;
            if (errorDetail) throw errorDetail;

            // Masukkan data default 2025
            const defaultSeed = [
                { opd_id: 'BKPSDM', bulan: 'DESEMBER', tahun: 2025, pns: 45, pppk: 20, pppk_dw: 16, sangat_baik: 20, baik: 60, butuh_perbaikan: 1, kurang: 0, sangat_kurang: 0, nama_file: 'skp_bkpsdm_final.xlsx' },
                { opd_id: 'DINKES', bulan: 'DESEMBER', tahun: 2025, pns: 210, pppk: 102, pppk_dw: 100, sangat_baik: 120, baik: 260, butuh_perbaikan: 24, kurang: 6, sangat_kurang: 2, nama_file: 'skp_dinkes_final.xlsx' },
                { opd_id: 'DISDIK', bulan: 'DESEMBER', tahun: 2025, pns: 950, pppk: 500, pppk_dw: 400, sangat_baik: 580, baik: 1100, butuh_perbaikan: 120, kurang: 40, sangat_kurang: 10, nama_file: 'skp_disdik_final.xlsx' },
                { opd_id: 'DISDUKCAPIL', bulan: 'DESEMBER', tahun: 2025, pns: 30, pppk: 15, pppk_dw: 10, sangat_baik: 15, baik: 38, butuh_perbaikan: 2, kurang: 0, sangat_kurang: 0, nama_file: 'skp_disdukcapil_final.xlsx' },
                { opd_id: 'SETDA', bulan: 'DESEMBER', tahun: 2025, pns: 75, pppk: 25, pppk_dw: 20, sangat_baik: 45, baik: 70, butuh_perbaikan: 5, kurang: 0, sangat_kurang: 0, nama_file: 'skp_setda_final.xlsx' },
                { opd_id: 'KEC_IDI', bulan: 'DESEMBER', tahun: 2025, pns: 25, pppk: 15, pppk_dw: 5, sangat_baik: 10, baik: 28, butuh_perbaikan: 5, kurang: 2, sangat_kurang: 0, nama_file: 'skp_kec_idi_final.xlsx' },
                { opd_id: 'KEC_PEUREULAK', bulan: 'DESEMBER', tahun: 2025, pns: 30, pppk: 10, pppk_dw: 10, sangat_baik: 15, baik: 30, butuh_perbaikan: 4, kurang: 1, sangat_kurang: 0, nama_file: 'skp_kec_peureulak_final.xlsx' }
            ];

            const { error: errorInsert } = await supabaseClient.from('skp_rekap_bulanan').insert(defaultSeed);
            if (errorInsert) throw errorInsert;

            alert("Database Supabase berhasil dikembalikan ke kondisi default.");
            refreshAllData();
            renderImportHistory();
        } catch (err) {
            console.error("Gagal mereset database:", err);
            alert("Gagal mereset database Supabase.");
        }
    }
};

// ==========================================
// UPLOAD FILE OTOMATIS (SUPABASE)
// ==========================================

window.bukaModalUpload = function (opdId) {
    if (!supabaseClient) {
        checkSupabaseConfig();
        return;
    }
    currentUploadOpdId = opdId;
    const opd = MASTER_OPD_LIST.find(o => o.id === opdId) || { nama: opdId };

    const selectedYear = document.getElementById('filter-tahun').value;
    const selectedBulan = document.getElementById('filter-bulan').value;

    document.getElementById('modal-title').textContent = `Unggah Berkas SKP - ${selectedBulan} ${selectedYear}`;
    document.getElementById('modal-subtitle').textContent = opd.nama;

    resetModalUploadState();

    document.getElementById('modal-default-bulan').value = selectedBulan;
    document.getElementById('modal-default-tahun').value = selectedYear;

    const modal = document.getElementById('modal-upload');
    const content = document.getElementById('modal-content');

    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
};

window.tutupModalUpload = function () {
    const modal = document.getElementById('modal-upload');
    const content = document.getElementById('modal-content');

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        resetModalUploadState();
    }, 200);
};

function resetModalUploadState() {
    document.getElementById('modal-file-input').value = '';
    document.getElementById('modal-parsing-progress').classList.add('hidden');
    document.getElementById('modal-import-config').classList.add('hidden');
    document.getElementById('modal-btn-process').disabled = true;

    currentWorkbook = null;
    currentUploadFilename = '';
}

function initModalUploadEvents() {
    const modalDropzone = document.getElementById('modal-dropzone');
    const modalFileInput = document.getElementById('modal-file-input');

    if (!modalDropzone || !modalFileInput) return;

    modalDropzone.addEventListener('click', () => modalFileInput.click());

    modalDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        modalDropzone.classList.add('border-indigo-500', 'bg-indigo-50/10');
    });

    modalDropzone.addEventListener('dragleave', () => {
        modalDropzone.classList.remove('border-indigo-500', 'bg-indigo-50/10');
    });

    modalDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        modalDropzone.classList.remove('border-indigo-500', 'bg-indigo-50/10');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            autoProcessExcelFile(files[0]);
        }
    });

    modalFileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            autoProcessExcelFile(files[0]);
        }
    });
}

function autoProcessExcelFile(file) {
    currentUploadFilename = file.name;

    const progressDiv = document.getElementById('modal-parsing-progress');
    const progressBar = document.getElementById('modal-progress-bar');
    const statusText = document.getElementById('modal-progress-status-text');
    const percentText = document.getElementById('modal-progress-percent');

    progressDiv.classList.remove('hidden');
    progressBar.style.width = '20%';
    percentText.textContent = '20%';
    statusText.textContent = 'Membaca berkas...';

    const reader = new FileReader();
    reader.onload = function (e) {
        progressBar.style.width = '50%';
        percentText.textContent = '50%';
        statusText.textContent = 'Mengurai spreadsheet...';

        setTimeout(() => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

                if (rawData.length === 0) {
                    throw new Error("Lembar kerja kosong!");
                }

                // Cari baris header
                let headerRowIndex = 0;
                let maxMatches = -1;
                for (let i = 0; i < Math.min(rawData.length, 15); i++) {
                    const row = rawData[i];
                    if (!row) continue;
                    const nonEmptyCount = row.filter(val => String(val).trim() !== "").length;
                    if (nonEmptyCount < 3) continue;

                    let matches = 0;
                    row.forEach(val => {
                        const str = String(val).toLowerCase();
                        if (
                            /opd|unit|organisasi|kerja|instansi|kecamatan/i.test(str) ||
                            /pns|pppk|dw/i.test(str) ||
                            /sangat baik|baik|perbaikan|kurang/i.test(str) ||
                            /nip|nama|predikat|status pegawai/i.test(str)
                        ) {
                            matches++;
                        }
                    });
                    if (matches > maxMatches) {
                        maxMatches = matches;
                        headerRowIndex = i;
                    }
                }

                const headers = rawData[headerRowIndex].map(h => String(h).trim());
                const sheetRows = rawData.slice(headerRowIndex + 1).filter(row => row.some(val => val !== ""));

                // Deteksi otomatis tipe format
                const hasNip = headers.some(h => /nip|nama|pegawai/i.test(h));
                const hasPredikats = headers.some(h => /sangat baik|baik|butuh perbaikan/i.test(h));
                const formatType = (hasNip && !hasPredikats) ? 'detail' : 'rekap';

                // Pemetaan kata kunci kolom
                const mappings = {};
                if (formatType === 'rekap') {
                    mappings.opd = [/opd|unit|organisasi|kerja|instansi|kecamatan/i];
                    mappings.bulan = [/bulan|month/i];
                    mappings.tahun = [/tahun|year/i];
                    mappings.pns = [/^pns$/i, /pns/i];
                    mappings.pppk = [/^pppk$/i, /pppk/i];
                    mappings.pppk_dw = [/dw|daerah|dinas/i, /pppk.*dw/i];
                    mappings.sangat_baik = [/sangat baik/i, /sangatbaik/i];
                    mappings.baik = [/^baik$/i, /baik/i];
                    mappings.butuh_perbaikan = [/perbaikan|butuh/i];
                    mappings.kurang = [/^kurang$/i, /kurang/i];
                    mappings.sangat_kurang = [/sangat kurang/i, /sangatkurang/i];
                } else {
                    mappings.nip = [/nip|nomor induk/i];
                    mappings.nama = [/nama|pegawai/i];
                    mappings.status = [/status|golongan|jenis|kategori/i];
                    mappings.predikat = [/predikat|kinerja|skp|nilai/i];
                    mappings.bulan = [/bulan|month/i];
                    mappings.tahun = [/tahun|year/i];
                    mappings.opd = [/opd|unit|organisasi|kerja|instansi|kecamatan/i];
                }

                const colIdx = {};
                Object.keys(mappings).forEach(field => {
                    let idx = -1;
                    for (let regex of mappings[field]) {
                        idx = headers.findIndex(h => regex.test(h));
                        if (idx !== -1) break;
                    }
                    colIdx[field] = idx;
                });

                // Validasi kolom minimum
                if (formatType === 'rekap') {
                    const required = ['pns', 'pppk', 'pppk_dw', 'sangat_baik', 'baik', 'butuh_perbaikan', 'kurang', 'sangat_kurang'];
                    const missing = required.filter(f => colIdx[f] === -1);
                    if (missing.length > 0) {
                        throw new Error("Kolom Excel tidak sesuai template Rekap OPD (Kolom hilang: " + missing.join(', ') + ")");
                    }
                } else {
                    const required = ['nama', 'status', 'predikat'];
                    const missing = required.filter(f => colIdx[f] === -1);
                    if (missing.length > 0) {
                        throw new Error("Kolom Excel tidak sesuai template Detail Pegawai (Kolom hilang: " + missing.join(', ') + ")");
                    }
                }

                // Ambil nilai default bulan/tahun
                const defaultBulan = document.getElementById('modal-default-bulan').value;
                const defaultTahun = document.getElementById('modal-default-tahun').value;

                // Ekstraksi data
                const parsedRows = sheetRows.map(row => {
                    const obj = {};
                    Object.keys(colIdx).forEach(field => {
                        const idx = colIdx[field];
                        if (idx !== -1 && row[idx] !== undefined && row[idx] !== "") {
                            obj[field] = row[idx];
                        } else {
                            obj[field] = null;
                        }
                    });

                    // Normalisasi isi data
                    if (obj.bulan) obj.bulan = String(obj.bulan).trim().toUpperCase();
                    if (obj.tahun) obj.tahun = parseInt(obj.tahun) || null;
                    if (formatType === 'detail' && obj.predikat) {
                        obj.predikat = normalizePredikatName(obj.predikat);
                    }
                    return obj;
                });

                progressBar.style.width = '75%';
                percentText.textContent = '75%';
                statusText.textContent = 'Mengirim data ke Supabase...';

                uploadParsedData(formatType, parsedRows, file.name);

            } catch (err) {
                console.error(err);
                alert("Gagal memproses file: " + err.message);
                progressDiv.classList.add('hidden');
            }
        }, 300);
    };
    reader.readAsArrayBuffer(file);
}

async function uploadParsedData(formatType, parsedRows, filename) {
    const statusText = document.getElementById('modal-progress-status-text');
    const progressDiv = document.getElementById('modal-parsing-progress');
    const progressBar = document.getElementById('modal-progress-bar');
    const percentText = document.getElementById('modal-progress-percent');

    const defaultBulan = document.getElementById('modal-default-bulan').value;
    const defaultTahun = parseInt(document.getElementById('modal-default-tahun').value);

    try {
        if (formatType === 'rekap') {
            // Akumulasi baris
            let pns = 0, pppk = 0, pppk_dw = 0;
            let sangat_baik = 0, baik = 0, butuh_perbaikan = 0, kurang = 0, sangat_kurang = 0;
            let bulan = defaultBulan;
            let tahun = defaultTahun;

            parsedRows.forEach(row => {
                pns += parseInt(row.pns) || 0;
                pppk += parseInt(row.pppk) || 0;
                pppk_dw += parseInt(row.pppk_dw) || 0;
                sangat_baik += parseInt(row.sangat_baik) || 0;
                baik += parseInt(row.baik) || 0;
                butuh_perbaikan += parseInt(row.butuh_perbaikan) || 0;
                kurang += parseInt(row.kurang) || 0;
                sangat_kurang += parseInt(row.sangat_kurang) || 0;
                if (row.bulan) bulan = row.bulan;
                if (row.tahun) tahun = parseInt(row.tahun);
            });

            const payload = {
                opd_id: currentUploadOpdId,
                bulan: bulan,
                tahun: tahun,
                pns: pns,
                pppk: pppk,
                pppk_dw: pppk_dw,
                sangat_baik: sangat_baik,
                baik: baik,
                butuh_perbaikan: butuh_perbaikan,
                kurang: kurang,
                sangat_kurang: sangat_kurang,
                nama_file: filename
            };

            const { error } = await supabaseClient.from('skp_rekap_bulanan').upsert(payload);
            if (error) throw error;

            progressBar.style.width = '100%';
            percentText.textContent = '100%';
            statusText.textContent = 'Selesai!';

            setTimeout(() => {
                tutupModalUpload();
                alert("Data Rekap OPD berhasil diunggah ke Supabase!");
                refreshAllData();
            }, 500);

        } else {
            // Format Detail Pegawai
            let bulan = defaultBulan;
            let tahun = defaultTahun;
            if (parsedRows.length > 0) {
                if (parsedRows[0].bulan) bulan = parsedRows[0].bulan;
                if (parsedRows[0].tahun) tahun = parseInt(parsedRows[0].tahun);
            }

            // 1. Hapus detail lama
            const { error: errorDelete } = await supabaseClient
                .from('skp_detail_pegawai')
                .delete()
                .eq('opd_id', currentUploadOpdId)
                .eq('bulan', bulan)
                .eq('tahun', tahun);

            if (errorDelete) throw errorDelete;

            // 2. Kumpulkan baris detail & hitung akumulasi rekap
            let pnsCount = 0;
            let pppkCount = 0;
            let pppkDwCount = 0;
            let sangatBaik = 0, baik = 0, butuhPerbaikan = 0, kurang = 0, sangatKurang = 0;

            const rowsPayload = parsedRows.map(row => {
                const status = strtoupper(row.status || 'PNS');
                if (status.includes('PNS')) {
                    pnsCount++;
                } else if (status.includes('PPPK') && (status.includes('DW') || status.includes('DAERAH') || status.includes('DINAS'))) {
                    pppkDwCount++;
                } else if (status.includes('PPPK')) {
                    pppkCount++;
                } else {
                    pnsCount++;
                }

                const pred = row.predikat || 'Baik';
                if (pred === 'Sangat Baik') sangatBaik++;
                else if (pred === 'Baik') baik++;
                else if (pred === 'Butuh Perbaikan') butuhPerbaikan++;
                else if (pred === 'Kurang') kurang++;
                else if (pred === 'Sangat Kurang') sangatKurang++;
                else baik++;

                return {
                    nip: row.nip || null,
                    nama_pegawai: row.nama || '',
                    status_pegawai: status.includes('PNS') ? 'PNS' : (status.includes('DW') ? 'PPPK DW' : 'PPPK'),
                    opd_id: currentUploadOpdId,
                    predikat_kinerja: pred,
                    bulan: row.bulan || defaultBulan,
                    tahun: parseInt(row.tahun || defaultTahun),
                    nama_file: filename
                };
            });

            // Insert detail
            if (rowsPayload.length > 0) {
                const { error: errorInsertDetail } = await supabaseClient.from('skp_detail_pegawai').insert(rowsPayload);
                if (errorInsertDetail) throw errorInsertDetail;
            }

            // 3. Upsert rekap otomatis
            const rekapPayload = {
                opd_id: currentUploadOpdId,
                bulan: bulan,
                tahun: tahun,
                pns: pnsCount,
                pppk: pppkCount,
                pppk_dw: pppkDwCount,
                sangat_baik: sangatBaik,
                baik: baik,
                butuh_perbaikan: butuhPerbaikan,
                kurang: kurang,
                sangat_kurang: sangatKurang,
                nama_file: filename
            };

            const { error: errorUpsertRekap } = await supabaseClient.from('skp_rekap_bulanan').upsert(rekapPayload);
            if (errorUpsertRekap) throw errorUpsertRekap;

            progressBar.style.width = '100%';
            percentText.textContent = '100%';
            statusText.textContent = 'Selesai!';

            setTimeout(() => {
                tutupModalUpload();
                alert("Data Detail Pegawai berhasil diunggah & diakumulasikan ke Supabase!");
                refreshAllData();
            }, 500);
        }
    } catch (err) {
        console.error(err);
        alert("Gagal mengunggah data: " + err.message);
        progressDiv.classList.add('hidden');
    }
}

function normalizePredikatName(name) {
    const clean = String(name).toUpperCase().replace(/\s+/g, '');
    if (clean.includes('SANGATBAIK')) return 'Sangat Baik';
    if (clean.includes('BAIK')) return 'Baik';
    if (clean.includes('PERBAIKAN') || clean.includes('BUTUH')) return 'Butuh Perbaikan';
    if (clean.includes('SANGATKURANG')) return 'Sangat Kurang';
    if (clean.includes('KURANG')) return 'Kurang';
    return 'Baik';
}

function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

function strtoupper(str) {
    return String(str || '').toUpperCase();
}

// ==========================================
// TEMPLATE DOWNLOAD LOGIC (SHEETJS)
// ==========================================

function downloadTemplateFile(type) {
    let headers = [];
    let mockRows = [];
    let filename = '';

    if (type === 'rekap') {
        headers = ["Unit Organisasi / OPD", "Bulan", "Tahun", "PNS", "PPPK", "PPPK DW", "Sangat Baik", "Baik", "Butuh Perbaikan", "Kurang", "Sangat Kurang"];
        mockRows = [
            ["Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM)", "DESEMBER", 2023, 45, 20, 16, 20, 60, 1, 0, 0],
            ["Dinas Kesehatan", "DESEMBER", 2023, 210, 102, 100, 120, 260, 24, 6, 2],
            ["Dinas Pendidikan dan Kebudayaan", "DESEMBER", 2023, 950, 500, 400, 580, 1100, 120, 40, 10]
        ];
        filename = 'template_rekap_skp_opd.xlsx';
    } else {
        headers = ["NIP", "Nama", "Status Pegawai", "Unit Kerja / OPD", "Predikat Kinerja", "Bulan", "Tahun"];
        mockRows = [
            ["198501012010011001", "Ahmad Subarjo", "PNS", "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM)", "Sangat Baik", "DESEMBER", 2023],
            ["199203152018022003", "Siti Aminah", "PPPK", "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM)", "Baik", "DESEMBER", 2023],
            ["198905202015031002", "Budi Santoso", "PNS", "Dinas Kesehatan", "Butuh Perbaikan", "DESEMBER", 2023],
            ["200110122024012005", "Rina Lestari", "PPPK DW", "Dinas Kesehatan", "Baik", "DESEMBER", 2023]
        ];
        filename = 'template_detail_pegawai_skp.xlsx';
    }

    const wsData = [headers, ...mockRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    Xcontent = XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, filename);
}

// ==========================================
// FITUR PENCARIAN / SEARCHABLE DROPDOWN OPD
// ==========================================

function openSearchableDropdown() {
    const menu = document.getElementById('searchable-opd-menu');
    const arrow = document.getElementById('searchable-opd-arrow');
    const searchInput = document.getElementById('searchable-opd-input');

    if (!menu) return;
    menu.classList.remove('hidden');
    requestAnimationFrame(() => {
        menu.classList.remove('scale-95', 'opacity-0');
        menu.classList.add('scale-100', 'opacity-100');
    });
    if (arrow) arrow.classList.add('rotate-180');
    if (searchInput) {
        searchInput.focus();
        searchInput.value = '';
    }
    filterSearchableDropdown('');
}

function closeSearchableDropdown() {
    const menu = document.getElementById('searchable-opd-menu');
    const arrow = document.getElementById('searchable-opd-arrow');

    if (!menu) return;
    menu.classList.remove('scale-100', 'opacity-100');
    menu.classList.add('scale-95', 'opacity-0');
    if (arrow) arrow.classList.remove('rotate-180');

    setTimeout(() => {
        if (menu) menu.classList.add('hidden');
    }, 150);
}

function filterSearchableDropdown(query) {
    const list = document.getElementById('searchable-opd-list');
    if (!list) return;
    const items = list.querySelectorAll('.searchable-opd-item');
    const q = query.toLowerCase().trim();

    let hasResults = false;
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(q)) {
            item.classList.remove('hidden');
            hasResults = true;
        } else {
            item.classList.add('hidden');
        }
    });

    let noResultEl = document.getElementById('searchable-opd-no-results');
    if (!hasResults) {
        if (!noResultEl) {
            noResultEl = document.createElement('div');
            noResultEl.id = 'searchable-opd-no-results';
            noResultEl.className = 'py-3 px-4 text-center text-xs font-semibold text-slate-400 bg-slate-50';
            noResultEl.textContent = 'Tidak menemukan unit kerja.';
            list.appendChild(noResultEl);
        } else {
            noResultEl.classList.remove('hidden');
        }
    } else if (noResultEl) {
        noResultEl.classList.add('hidden');
    }
}

function syncSearchableDropdown() {
    const opdSelect = document.getElementById('opd-select');
    const list = document.getElementById('searchable-opd-list');
    const triggerLabel = document.getElementById('searchable-opd-label');

    if (!opdSelect || !list || !triggerLabel) return;

    list.innerHTML = '';

    if (opdSelect.selectedIndex !== -1) {
        triggerLabel.textContent = opdSelect.options[opdSelect.selectedIndex].textContent;
    } else {
        triggerLabel.textContent = '-- TAMPILKAN SEMUA OPD --';
    }

    Array.from(opdSelect.options).forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'searchable-opd-item w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-between';
        btn.textContent = opt.textContent;

        if (opt.value === opdSelect.value) {
            btn.classList.add('bg-indigo-50/50', 'text-indigo-600', 'font-bold');
            const checkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            checkIcon.setAttribute('class', 'w-4 h-4 text-indigo-600 shrink-0');
            checkIcon.setAttribute('fill', 'none');
            checkIcon.setAttribute('stroke', 'currentColor');
            checkIcon.setAttribute('viewBox', '0 0 24 24');
            checkIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>';
            btn.appendChild(checkIcon);
        }

        btn.onclick = () => {
            opdSelect.value = opt.value;
            const event = new Event('change');
            opdSelect.dispatchEvent(event);
            triggerLabel.textContent = opt.textContent;
            closeSearchableDropdown();
        };
        list.appendChild(btn);
    });
}

function initSearchableDropdown() {
    const trigger = document.getElementById('searchable-opd-trigger');
    const menu = document.getElementById('searchable-opd-menu');
    const arrow = document.getElementById('searchable-opd-arrow');
    const searchInput = document.getElementById('searchable-opd-input');
    const opdSelect = document.getElementById('opd-select');

    if (!trigger || !menu || !arrow || !searchInput || !opdSelect) return;

    trigger.onclick = function (e) {
        e.stopPropagation();
        const isHidden = menu.classList.contains('hidden');
        if (isHidden) {
            openSearchableDropdown();
        } else {
            closeSearchableDropdown();
        }
    };

    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('searchable-opd-dropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            closeSearchableDropdown();
        }
    });

    searchInput.oninput = function (e) {
        filterSearchableDropdown(e.target.value);
    };

    opdSelect.addEventListener('change', () => {
        const triggerLabel = document.getElementById('searchable-opd-label');
        if (triggerLabel && opdSelect.selectedIndex !== -1) {
            triggerLabel.textContent = opdSelect.options[opdSelect.selectedIndex].textContent;
            syncSearchableDropdown();
        }
    });

    syncSearchableDropdown();
}

// ==========================================
// SEGMENTED FILTER & TAB ROUTING
// ==========================================

window.setCategoryFilter = function (category) {
    currentCategoryFilter = category;

    const tabs = {
        'SEMUA': document.getElementById('tab-cat-semua'),
        'DINAS': document.getElementById('tab-cat-dinas'),
        'KECAMATAN': document.getElementById('tab-cat-kecamatan')
    };

    Object.keys(tabs).forEach(k => {
        const tab = tabs[k];
        if (!tab) return;
        if (k === category) {
            tab.className = "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all bg-white text-slate-800 shadow-sm focus:outline-none";
        } else {
            tab.className = "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all text-slate-500 hover:text-slate-850 focus:outline-none";
        }
    });

    updateOpdDropdown();
    updateDashboardDynamic();
};

function switchView(viewName) {
    const dashboardView = document.getElementById('view-dashboard');
    const dataOpdView = document.getElementById('view-data-opd');
    const laporanView = document.getElementById('view-laporan-bulanan');

    const navDashboard = document.getElementById('nav-dashboard');
    const navDataOpd = document.getElementById('nav-data-opd');
    const navLaporan = document.getElementById('nav-laporan-bulanan');

    const inactiveClasses = ["text-slate-400", "hover:bg-slate-800", "hover:text-slate-100", "font-medium"];
    const activeClasses = ["bg-indigo-600/10", "text-indigo-400", "font-semibold", "border", "border-indigo-500/20"];

    if (dashboardView) dashboardView.classList.add('hidden');
    if (dataOpdView) dataOpdView.classList.add('hidden');
    if (laporanView) laporanView.classList.add('hidden');

    [navDashboard, navDataOpd, navLaporan].forEach(nav => {
        if (nav) {
            activeClasses.forEach(c => nav.classList.remove(c));
            inactiveClasses.forEach(c => nav.classList.add(c));
        }
    });

    if (viewName === 'dashboard') {
        if (dashboardView) dashboardView.classList.remove('hidden');
        if (navDashboard) {
            activeClasses.forEach(c => navDashboard.classList.add(c));
        }
        updateDashboardDynamic();
    } else if (viewName === 'data-opd') {
        if (dataOpdView) dataOpdView.classList.remove('hidden');
        if (navDataOpd) {
            activeClasses.forEach(c => navDataOpd.classList.add(c));
        }
        syncOpdFilters();
        renderImportHistory();
        renderOpdList();
    } else if (viewName === 'laporan-bulanan') {
        if (laporanView) laporanView.classList.remove('hidden');
        if (navLaporan) {
            activeClasses.forEach(c => navLaporan.classList.add(c));
        }
        syncLaporanFilters();
        renderLaporanBulanan();
    }
}

window.syncOpdFilters = function () {
    const mainBulan = document.getElementById('filter-bulan');
    const mainTahun = document.getElementById('filter-tahun');
    const opdBulan = document.getElementById('opd-filter-bulan');
    const opdTahun = document.getElementById('opd-filter-tahun');

    if (!opdBulan || !opdTahun) return;

    opdTahun.innerHTML = '';
    Array.from(mainTahun.options).forEach(opt => {
        const newOpt = document.createElement('option');
        newOpt.value = opt.value;
        newOpt.textContent = opt.textContent;
        opdTahun.appendChild(newOpt);
    });
    opdTahun.value = mainTahun.value;

    opdBulan.innerHTML = '';
    Array.from(mainBulan.options).forEach(opt => {
        const newOpt = document.createElement('option');
        newOpt.value = opt.value;
        newOpt.textContent = opt.textContent;
        opdBulan.appendChild(newOpt);
    });
    opdBulan.value = mainBulan.value;
};

window.syncLaporanFilters = function () {
    const mainBulan = document.getElementById('filter-bulan');
    const mainTahun = document.getElementById('filter-tahun');
    const lapBulan = document.getElementById('laporan-filter-bulan');
    const lapTahun = document.getElementById('laporan-filter-tahun');

    if (!lapBulan || !lapTahun) return;

    lapTahun.innerHTML = '';
    Array.from(mainTahun.options).forEach(opt => {
        const newOpt = document.createElement('option');
        newOpt.value = opt.value;
        newOpt.textContent = opt.textContent;
        lapTahun.appendChild(newOpt);
    });
    lapTahun.value = mainTahun.value;

    lapBulan.innerHTML = '';
    Array.from(mainBulan.options).forEach(opt => {
        const newOpt = document.createElement('option');
        newOpt.value = opt.value;
        newOpt.textContent = opt.textContent;
        lapBulan.appendChild(newOpt);
    });
    lapBulan.value = mainBulan.value;
};

// ==========================================
// INISIALISASI APLIKASI
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Render Chart
    const ctx = document.getElementById('kinerjaChart').getContext('2d');
    const labels = ['Sangat Baik', 'Baik', 'Butuh Perbaikan', 'Kurang', 'Sangat Kurang'];
    const colors = ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444'];

    kinerjaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah ASN',
                data: [0, 0, 0, 0, 0],
                backgroundColor: colors,
                borderRadius: 8,
                borderWidth: 0,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 12,
                    backgroundColor: '#0f172a',
                    titleFont: { size: 13, weight: 'bold', family: 'Inter' },
                    bodyFont: { size: 12, family: 'Inter' },
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.raw;
                            const pct = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
                            return `Jumlah: ${formatNumber(value)} Orang (${pct}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 11, weight: '600', family: 'Inter' },
                        color: '#64748b'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9', drawBorder: false },
                    ticks: {
                        font: { size: 11, family: 'Inter' },
                        color: '#64748b',
                        callback: function (value) { return formatNumber(value); }
                    }
                }
            }
        }
    });

    // 2. Setup Listeners
    document.getElementById('filter-bulan').addEventListener('change', function () {
        updateDashboardDynamic();
        updateOpdDropdown();
        syncOpdFilters();
        renderOpdList();
    });

    document.getElementById('filter-tahun').addEventListener('change', function () {
        updateBulanOptions();
        updateDashboardDynamic();
        syncOpdFilters();
        renderOpdList();
    });

    document.getElementById('opd-filter-bulan').addEventListener('change', function () {
        document.getElementById('filter-bulan').value = this.value;
        updateDashboardDynamic();
        updateOpdDropdown();
        renderOpdList();
    });

    document.getElementById('opd-filter-tahun').addEventListener('change', function () {
        document.getElementById('filter-tahun').value = this.value;
        updateBulanOptions();
        syncOpdFilters();
        updateDashboardDynamic();
        renderOpdList();
    });

    document.getElementById('opd-select').addEventListener('change', function () {
        updateDashboardDynamic();
    });

    document.getElementById('laporan-filter-bulan').addEventListener('change', function () {
        document.getElementById('filter-bulan').value = this.value;
        updateDashboardDynamic();
        renderLaporanBulanan();
    });

    document.getElementById('laporan-filter-tahun').addEventListener('change', function () {
        document.getElementById('filter-tahun').value = this.value;
        updateBulanOptions();
        syncLaporanFilters();
        updateDashboardDynamic();
        renderLaporanBulanan();
    });

    // Sidebar Toggle Mobile
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    if (sidebarToggle && sidebar && sidebarOverlay) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.remove('hidden');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        });
    }

    // Load Admin Profile
    const adminName = localStorage.getItem('admin_user_display') || 'Admin BKPSDM';
    const profileNameEl = document.getElementById('admin-profile-name');
    if (profileNameEl) {
        profileNameEl.textContent = adminName;
    }

    // Inisialisasi Database
    initDatabase();
    populateFilters();
    initModalUploadEvents();
    syncOpdFilters();
    renderOpdList();
    switchView('dashboard');
    initSearchableDropdown();
});

// Logout
window.handleLogout = function () {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
        localStorage.removeItem('admin_session_active');
        localStorage.removeItem('admin_user_display');
        window.location.href = 'index.html';
    }
};
