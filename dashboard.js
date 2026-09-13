// dashboard.js - Logika SIMONIKA (Mendukung Master Data BKN e-Kinerja, Data OPD, Laporan Bulanan, Export Excel & Mode Demo Lokal)

// ==========================================
// KONFIGURASI STORAGE & DATABASE
// ==========================================
let STORAGE_MODE = 'supabase';

let SUPABASE_URL = 'https://hjinzrpqbcrjrllylrth.supabase.co';
let SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaW56cnBxYmNyanJsbHlscnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MDk2NzUsImV4cCI6MjA5OTQ4NTY3NX0.zBTeSstK6ft82yyGRbr-A90mmRT14TSCj4dOvM0vzDw';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || !SUPABASE_URL) {
    SUPABASE_URL = localStorage.getItem('supabase_url') || '';
}
if (SUPABASE_KEY === 'YOUR_SUPABASE_KEY' || !SUPABASE_KEY) {
    SUPABASE_KEY = localStorage.getItem('supabase_key') || '';
}

let supabaseClient = null;
if (window.supabase && SUPABASE_URL && SUPABASE_KEY) {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("SIMONIKA: Supabase Client berhasil terhubung ke Cloud Database.");
    } catch (e) {
        console.warn("Gagal inisialisasi Supabase SDK, beralih ke Mode Lokal:", e);
        STORAGE_MODE = 'local';
    }
} else {
    STORAGE_MODE = 'local';
}

// ==========================================
// USER ROLE & LEVEL MANAGEMENT (RBAC)
// ==========================================
const USER_LEVEL = parseInt(localStorage.getItem('simonika_user_level') || '1');
const USER_ROLE = localStorage.getItem('simonika_user_role') || 'superadmin';
const USER_OPD_ID = localStorage.getItem('simonika_user_opd_id') || '';
const USER_OPD_NAME = localStorage.getItem('simonika_user_opd_name') || 'Pemerintah Kabupaten Aceh Timur';
const USER_DISPLAY_NAME = localStorage.getItem('admin_user_display') || 'Admin BKPSDM';

function applyUserLevelPermissions() {
    const levelBadge = document.getElementById('user-level-badge');
    const levelText = document.getElementById('user-level-text');
    const profileName = document.getElementById('admin-profile-name');
    const profileSub = document.getElementById('admin-profile-sub');
    const sidebarUnit = document.getElementById('sidebar-unit-name');
    const sidebarRole = document.getElementById('sidebar-role-label');
    const sidebarAvatar = document.getElementById('sidebar-avatar-initial');
    const headerAvatar = document.getElementById('header-avatar');
    const adminNavSection = document.getElementById('section-admin-nav');
    const navMasterData = document.getElementById('nav-master-data');
    const navLaporanBulanan = document.getElementById('nav-laporan-bulanan');
    const dashboardFilterSec = document.getElementById('dashboard-opd-filter-section');
    const opdAllListSec = document.getElementById('section-daftar-seluruh-opd');
    const opdSingleContainer = document.getElementById('opd-single-select-container');

    if (USER_LEVEL === 2) {
        // OPERATOR OPD (STRICT ISOLATION)
        if (levelBadge) {
            levelBadge.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs bg-emerald-50 text-emerald-800 border-emerald-200";
        }
        if (levelText) {
            levelText.textContent = `Operator ${USER_OPD_NAME || USER_OPD_ID || 'Unit Kerja'}`;
        }
        if (profileName) profileName.textContent = USER_DISPLAY_NAME;
        if (profileSub) profileSub.textContent = USER_OPD_NAME;
        if (sidebarUnit) sidebarUnit.textContent = USER_OPD_NAME;
        if (sidebarRole) sidebarRole.textContent = 'Operator Unit Kerja';
        if (sidebarAvatar) sidebarAvatar.textContent = (USER_OPD_ID || 'OP').substring(0, 2);
        if (headerAvatar) headerAvatar.textContent = (USER_OPD_ID || 'OP').substring(0, 2);

        // 1. Hide Master Data & Rekap Laporan from Sidebar for Level 2
        if (adminNavSection) adminNavSection.style.display = 'none';
        if (navMasterData) navMasterData.style.display = 'none';
        if (navLaporanBulanan) navLaporanBulanan.style.display = 'none';

        // 2. Hide OPD selection dropdown on Dashboard (Level 2 is locked to their OPD)
        if (dashboardFilterSec) dashboardFilterSec.style.display = 'none';

        // 3. Hide list of all other OPDs on Data OPD page
        if (opdAllListSec) opdAllListSec.style.display = 'none';

        // 4. Hide / lock OPD selector dropdown on Data OPD page
        if (opdSingleContainer) opdSingleContainer.style.display = 'none';
    } else {
        // ADMINISTRATOR BKPSDM (SUPER ADMIN)
        if (levelBadge) {
            levelBadge.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs bg-indigo-50 text-indigo-700 border-indigo-200";
        }
        if (levelText) {
            levelText.textContent = 'Administrator BKPSDM';
        }
        if (profileName) profileName.textContent = USER_DISPLAY_NAME;
        if (profileSub) profileSub.textContent = 'Administrator Kabupaten';
        if (sidebarUnit) sidebarUnit.textContent = 'BKPSDM Kab. Aceh Timur';
        if (sidebarRole) sidebarRole.textContent = 'Administrator BKPSDM';
        if (sidebarAvatar) sidebarAvatar.textContent = 'AT';
        if (headerAvatar) headerAvatar.textContent = 'AD';

        if (adminNavSection) adminNavSection.style.display = 'block';
        if (navMasterData) navMasterData.style.display = 'flex';
        if (navLaporanBulanan) navLaporanBulanan.style.display = 'flex';
        if (dashboardFilterSec) dashboardFilterSec.style.display = 'flex';
        if (opdAllListSec) opdAllListSec.style.display = 'block';
        if (opdSingleContainer) opdSingleContainer.style.display = 'block';
    }
}


// ==========================================
// SISTEM DIALOG & NOTIFIKASI MODERN (SWEETALERT2 & TAILWIND)
// ==========================================
function simonikaAlert({ title = 'Informasi', text = '', html = '', icon = 'info', confirmText = 'Mengerti', timer = null }) {
    if (window.Swal) {
        return Swal.fire({
            title: `<span class="text-base sm:text-lg font-bold text-slate-800 tracking-tight">${title}</span>`,
            text: html ? undefined : text,
            html: html || (text ? `<p class="text-xs sm:text-sm text-slate-600 leading-relaxed">${text.replace(/\n/g, '<br>')}</p>` : undefined),
            icon: icon,
            iconColor: icon === 'success' ? '#10b981' : (icon === 'error' ? '#ef4444' : (icon === 'warning' ? '#f59e0b' : '#4f46e5')),
            confirmButtonText: confirmText,
            timer: timer,
            timerProgressBar: Boolean(timer),
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-slate-100 p-5 sm:p-6',
                confirmButton: 'py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 focus:outline-none'
            },
            buttonsStyling: false
        });
    } else {
        alert(text || title);
        return Promise.resolve({ isConfirmed: true });
    }
}
window.simonikaAlert = simonikaAlert;

function simonikaConfirm({ title = 'Konfirmasi Tindakan', text = '', html = '', icon = 'warning', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', isDanger = false }) {
    if (window.Swal) {
        const confirmBtnClass = isDanger 
            ? 'py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-red-600/25 focus:outline-none'
            : 'py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25 focus:outline-none';

        return Swal.fire({
            title: `<span class="text-base sm:text-lg font-bold text-slate-800 tracking-tight">${title}</span>`,
            text: html ? undefined : text,
            html: html || (text ? `<p class="text-xs sm:text-sm text-slate-600 leading-relaxed">${text.replace(/\n/g, '<br>')}</p>` : undefined),
            icon: icon,
            iconColor: isDanger ? '#ef4444' : (icon === 'warning' ? '#f59e0b' : '#4f46e5'),
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            customClass: {
                popup: 'rounded-2xl shadow-2xl border border-slate-100 p-5 sm:p-6',
                confirmButton: confirmBtnClass,
                cancelButton: 'py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs transition-all mr-3 focus:outline-none'
            },
            buttonsStyling: false
        });
    } else {
        const res = confirm(text || title);
        return Promise.resolve({ isConfirmed: res });
    }
}
window.simonikaConfirm = simonikaConfirm;

// ==========================================
// DATA MASTER 61 OPD & KECAMATAN KAB. ACEH TIMUR
// ==========================================
const MASTER_OPD_LIST = [
    { id: 'BKPSDM', nama: 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia', kategori: 'DINAS', aliases: ['bkpsdm', 'kepegawaian', 'badan kepegawaian', 'pengembangan sumber daya manusia'] },
    { id: 'SETDA', nama: 'Sekretariat Daerah', kategori: 'DINAS', aliases: ['setda', 'sekretariat daerah', 'asisten', 'bagian hukum', 'bagian organisasi', 'bagian keuangan', 'bagian keistimewaan'] },
    { id: 'BPKD', nama: 'Badan Pengelolaan Keuangan Daerah', kategori: 'DINAS', aliases: ['bpkd', 'pengelolaan keuangan daerah', 'pengelolaan keuangan', 'dinas pengelolaan keuangan'] },
    { id: 'BAPPEDA', nama: 'Badan Perencanaan Pembangunan Daerah', kategori: 'DINAS', aliases: ['bappeda', 'perencanaan pembangunan'] },
    { id: 'BPBD', nama: 'Badan Penanggulangan Bencana Daerah', kategori: 'DINAS', aliases: ['bpbd', 'penanggulangan bencana'] },
    { id: 'KESBANGPOL', nama: 'Badan Kesatuan Bangsa dan Politik', kategori: 'DINAS', aliases: ['kesbangpol', 'kesatuan bangsa'] },
    { id: 'INSPEKTORAT', nama: 'Inspektorat Daerah', kategori: 'DINAS', aliases: ['inspektorat'] },
    { id: 'SATPOL_PP_WH', nama: 'Satuan Polisi Pamong Praja dan Wilayatul Hisbah', kategori: 'DINAS', aliases: ['satpol', 'polisi pamong praja', 'wilayatul hisbah', 'satpol pp dan wh', 'satpol pp'] },
    { id: 'RSUD_ZM', nama: 'Rumah Sakit Umum Daerah dr. Zubir Mahmud', kategori: 'DINAS', aliases: ['zubir mahmud', 'rsud zm', 'rsud dr. zubir', 'rsud zubir', 'rsud'] },
    { id: 'RSUD_SAAS', nama: 'Rumah Sakit Umum Daerah Sultan Abdul Aziz Syah Peureulak', kategori: 'DINAS', aliases: ['sultan abdul aziz syah', 'rsud saas', 'rsud peureulak', 'sultan abdul', 'rsud'] },
    { id: 'DISDIK', nama: 'Dinas Pendidikan dan Kebudayaan', kategori: 'DINAS', aliases: ['pendidikan dan kebudayaan', 'dinas pendidikan dan kebudayaan', 'disdik'] },
    { id: 'DINKES', nama: 'Dinas Kesehatan', kategori: 'DINAS', aliases: ['dinkes', 'dinas kesehatan'] },
    { id: 'PUPR', nama: 'Dinas Pekerjaan Umum dan Perumahan Rakyat', kategori: 'DINAS', aliases: ['pupr', 'pekerjaan umum', 'perumahan rakyat'] },
    { id: 'DINSOS', nama: 'Dinas Sosial', kategori: 'DINAS', aliases: ['dinsos', 'dinas sosial'] },
    { id: 'DISDUKCAPIL', nama: 'Dinas Kependudukan dan Pencatatan Sipil', kategori: 'DINAS', aliases: ['disdukcapil', 'kependudukan dan pencatatan', 'kependudukan', 'dukcapil'] },
    { id: 'DPMG', nama: 'Dinas Pemberdayaan Masyarakat dan Gampong', kategori: 'DINAS', aliases: ['dpmg', 'pemberdayaan masyarakat dan gampong', 'pemberdayaan masyarakat gampong'] },
    { id: 'DSI', nama: 'Dinas Syariat Islam', kategori: 'DINAS', aliases: ['syariat islam', 'dsi', 'dinas syariat'] },
    { id: 'DINAS_DAYAH', nama: 'Dinas Pendidikan Dayah', kategori: 'DINAS', aliases: ['pendidikan dayah', 'dinas pendidikan dayah', 'dayah'] },
    { id: 'DPMP2T', nama: 'Dinas Penanaman Modal dan Pelayanan Perizinan Terpadu', kategori: 'DINAS', aliases: ['dpmp2t', 'dpmptsp', 'penanaman modal', 'perizinan terpadu', 'pelayanan terpadu satu pintu'] },
    { id: 'DISKOMINFO', nama: 'Dinas Komunikasi dan Informatika', kategori: 'DINAS', aliases: ['diskominfo', 'komunikasi dan informatika', 'kominfo'] },
    { id: 'DISHUB', nama: 'Dinas Perhubungan', kategori: 'DINAS', aliases: ['dishub', 'dinas perhubungan', 'perhubungan'] },
    { id: 'DLH', nama: 'Dinas Lingkungan Hidup', kategori: 'DINAS', aliases: ['dlh', 'lingkungan hidup', 'dinas lingkungan'] },
    { id: 'DISPARPORA', nama: 'Dinas Pariwisata, Pemuda, dan Olahraga', kategori: 'DINAS', aliases: ['disparpora', 'pariwisata pemuda dan olahraga', 'pariwisata pemuda', 'pariwisata', 'pemuda dan olahraga', 'pemuda dan olah raga'] },
    { id: 'DISKOPUKM', nama: 'Dinas Perdagangan, Koperasi, dan UKM', kategori: 'DINAS', aliases: ['perdagangan koperasi dan usaha kecil menengah', 'perdagangan koperasi', 'diskopukm', 'koperasi dan ukm', 'usaha kecil menengah', 'perdagangan koperasi dan ukm', 'perdagangan'] },
    { id: 'DISBUNNAK', nama: 'Dinas Perkebunan dan Peternakan', kategori: 'DINAS', aliases: ['disbunnak', 'perkebunan dan peternakan', 'perkebunan dan perternakan', 'perkebunan', 'peternakan', 'perternakan'] },
    { id: 'DKP', nama: 'Dinas Perikanan', kategori: 'DINAS', aliases: ['dinas perikanan', 'perikanan', 'kelautan dan perikanan', 'dinas kelautan dan perikanan', 'kelautan', 'dkp'] },
    { id: 'DP3AKB', nama: 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, dan KB', kategori: 'DINAS', aliases: ['dp3akb', 'pemberdayaan perempuan perlindungan anak dan keluarga berencana', 'pemberdayaan perempuan', 'perlindungan anak', 'keluarga berencana'] },
    { id: 'DISPUSIP', nama: 'Dinas Perpustakaan dan Kearsipan', kategori: 'DINAS', aliases: ['dispusip', 'perpustakaan dan kearsipan', 'perpustakaan', 'kearsipan'] },
    { id: 'PERTANAHAN', nama: 'Dinas Pertanahan', kategori: 'DINAS', aliases: ['dinas pertanahan', 'pertanahan'] },
    { id: 'DISTANTPH', nama: 'Dinas Tanaman Pangan dan Hortikultura', kategori: 'DINAS', aliases: ['distantph', 'tanaman pangan dan hortikultura', 'tanaman pangan', 'hortikultura'] },
    { id: 'DKPP', nama: 'Dinas Ketahanan Pangan dan Penyuluhan', kategori: 'DINAS', aliases: ['dkpp', 'ketahanan pangan dan penyuluhan', 'ketahangan pangan dan penyuluhan', 'ketahanan pangan', 'ketahangan pangan'] },
    { id: 'DISPERINNAKERTRANS', nama: 'Dinas Perindustrian, Tenaga Kerja dan Transmigrasi', kategori: 'DINAS', aliases: ['disperinnakertrans', 'perindustrian tenaga kerja dan transmigrasi', 'perindustrian tenaga kerja', 'tenaga kerja dan transmigrasi', 'transmigrasi'] },
    { id: 'SETWAN', nama: 'Sekretariat Dewan Perwakilan Rakyat Kabupaten', kategori: 'DINAS', aliases: ['setwan', 'sekretariat dprk', 'sekretariat dewan perwakilan rakyat', 'sekretariat dewan'] },
    { id: 'SET_BAITUL_MAL', nama: 'Sekretariat Baitul Mal', kategori: 'DINAS', aliases: ['baitul mal', 'sekretariat baitul mal'] },
    { id: 'SET_MAA', nama: 'Sekretariat Majelis Adat Aceh', kategori: 'DINAS', aliases: ['majelis adat aceh', 'sekretariat majelis adat aceh', 'maa'] },
    { id: 'SET_MPA', nama: 'Sekretariat Majelis Pendidikan Aceh', kategori: 'DINAS', aliases: ['majelis pendidikan aceh', 'sekretariat majelis pendidikan aceh', 'mpa', 'mpd'] },
    { id: 'SET_MPU', nama: 'Sekretariat Majelis Permusyawaratan Ulama', kategori: 'DINAS', aliases: ['majelis permusyawaratan ulama', 'sekretariat majelis permusyawaratan ulama', 'mpu'] },
    { id: 'KEC_BANDA_ALAM', nama: 'Kecamatan Banda Alam', kategori: 'KECAMATAN', aliases: ['banda alam', 'kecamatan banda alam'] },
    { id: 'KEC_BIREM_BAYEUN', nama: 'Kecamatan Birem Bayeun', kategori: 'KECAMATAN', aliases: ['birem bayeun', 'kecamatan birem bayeun'] },
    { id: 'KEC_DARUL_AMAN', nama: 'Kecamatan Darul Aman', kategori: 'KECAMATAN', aliases: ['darul aman', 'kecamatan darul aman'] },
    { id: 'KEC_DARUL_FALAH', nama: 'Kecamatan Darul Falah', kategori: 'KECAMATAN', aliases: ['darul falah', 'kecamatan darul falah'] },
    { id: 'KEC_DARUL_IHSAN', nama: 'Kecamatan Darul Ihsan', kategori: 'KECAMATAN', aliases: ['darul ihsan', 'kecamatan darul ihsan'] },
    { id: 'KEC_IDI', nama: 'Kecamatan Idi Rayeuk', kategori: 'KECAMATAN', aliases: ['idi rayeuk', 'kecamatan idi rayeuk', 'kecamatan idi'] },
    { id: 'KEC_IDI_TIMUR', nama: 'Kecamatan Idi Timur', kategori: 'KECAMATAN', aliases: ['idi timur', 'kecamatan idi timur', 'kecamatanidi timur'] },
    { id: 'KEC_IDI_TUNONG', nama: 'Kecamatan Idi Tunong', kategori: 'KECAMATAN', aliases: ['idi tunong', 'kecamatan idi tunong'] },
    { id: 'KEC_INDRA_MAKMU', nama: 'Kecamatan Indra Makmu', kategori: 'KECAMATAN', aliases: ['indra makmu', 'indramakmu', 'kecamatan indra makmu'] },
    { id: 'KEC_JULOK', nama: 'Kecamatan Julok', kategori: 'KECAMATAN', aliases: ['julok', 'kecamatan julok'] },
    { id: 'KEC_MADAT', nama: 'Kecamatan Madat', kategori: 'KECAMATAN', aliases: ['madat', 'kecamatan madat'] },
    { id: 'KEC_NURUSSALAM', nama: 'Kecamatan Nurussalam', kategori: 'KECAMATAN', aliases: ['nurussalam', 'kecamatan nurussalam'] },
    { id: 'KEC_PANTE_BIDARI', nama: 'Kecamatan Pante Bidari', kategori: 'KECAMATAN', aliases: ['pantee bidari', 'pante bidari', 'kecamatan pantee bidari', 'kecamatan pante bidari'] },
    { id: 'KEC_PEUDAWA', nama: 'Kecamatan Peudawa', kategori: 'KECAMATAN', aliases: ['peudawa', 'kecamatan peudawa'] },
    { id: 'KEC_PEUNARON', nama: 'Kecamatan Peunaron', kategori: 'KECAMATAN', aliases: ['peunaron', 'kecamatan peunaron'] },
    { id: 'KEC_PEUREULAK', nama: 'Kecamatan Peureulak', kategori: 'KECAMATAN', aliases: ['peureulak kota', 'kecamatan peureulak', 'peureulak'] },
    { id: 'KEC_PEUREULAK_BARAT', nama: 'Kecamatan Peureulak Barat', kategori: 'KECAMATAN', aliases: ['peureulak barat', 'kecamatan peureulak barat'] },
    { id: 'KEC_PEUREULAK_TIMUR', nama: 'Kecamatan Peureulak Timur', kategori: 'KECAMATAN', aliases: ['peureulak timur', 'kecamatan peureulak timur'] },
    { id: 'KEC_RANTO_PEUREULAK', nama: 'Kecamatan Ranto Peureulak', kategori: 'KECAMATAN', aliases: ['ranto peureulak', 'ranto pereulak', 'kecamatan ranto peureulak'] },
    { id: 'KEC_RANTAU_SELAMAT', nama: 'Kecamatan Rantau Selamat', kategori: 'KECAMATAN', aliases: ['rantau selamat', 'kecamatan rantau selamat'] },
    { id: 'KEC_SERBAJADI', nama: 'Kecamatan Serbajadi', kategori: 'KECAMATAN', aliases: ['serbajadi', 'serba jadi', 'kecamatan serbajadi'] },
    { id: 'KEC_SIMPANG_JERNIH', nama: 'Kecamatan Simpang Jernih', kategori: 'KECAMATAN', aliases: ['simpang jernih', 'kecamatan simpang jernih'] },
    { id: 'KEC_SIMPANG_ULIM', nama: 'Kecamatan Simpang Ulim', kategori: 'KECAMATAN', aliases: ['simpang ulim', 'kecamatan simpang ulim'] },
    { id: 'KEC_SUNGAI_RAYA', nama: 'Kecamatan Sungai Raya', kategori: 'KECAMATAN', aliases: ['sungai raya', 'kecamatan sungai raya'] }
];

const INDONESIAN_MONTHS = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

let currentCategoryFilter = 'SEMUA';
let kinerjaChart = null;

// ==========================================
// ENGINE LOCAL STORAGE (100% OFFLINE DEMO)
// ==========================================
const LOCAL_STORAGE_KEY_REKAP = 'simonika_rekap_data';

function getLocalRekapList() {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY_REKAP);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error("Gagal membaca Local Storage Rekap:", e);
        return [];
    }
}

function saveLocalRekapList(list) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY_REKAP, JSON.stringify(list));
    } catch (e) {
        console.error("Gagal menyimpan ke Local Storage Rekap:", e);
    }
}

function upsertLocalRekap(payload) {
    const list = getLocalRekapList();
    const index = list.findIndex(item => 
        item.opd_id === payload.opd_id && 
        item.bulan === payload.bulan && 
        parseInt(item.tahun) === parseInt(payload.tahun)
    );

    if (index !== -1) {
        list[index] = { ...list[index], ...payload, updated_at: new Date().toISOString() };
    } else {
        list.push({ ...payload, created_at: new Date().toISOString() });
    }
    saveLocalRekapList(list);
}

// Sinkronisasi Data Rekapitulasi dari Cloud Supabase
async function syncFromCloudDatabase() {
    if (!supabaseClient) return false;
    try {
        const { data, error } = await supabaseClient
            .from('skp_rekap_bulanan')
            .select('*');

        if (error) {
            console.warn("Supabase skp_rekap_bulanan query notice:", error.message || error);
            return false;
        }

        if (data && data.length > 0) {
            const mapped = data.map(item => ({
                opd_id: item.opd_id,
                bulan: item.bulan,
                tahun: parseInt(item.tahun),
                pns: parseInt(item.pns || 0),
                pppk: parseInt(item.pppk || 0),
                pppk_dw: parseInt(item.pppk_dw || 0),
                sangat_baik: parseInt(item.sangat_baik || 0),
                baik: parseInt(item.baik || 0),
                butuh_perbaikan: parseInt(item.butuh_perbaikan || 0),
                kurang: parseInt(item.kurang || 0),
                sangat_kurang: parseInt(item.sangat_kurang || 0),
                tidak_membuat_skp: parseInt(item.tidak_membuat_skp || 0),
                nama_file: item.nama_file || null,
                updated_at: item.updated_at || new Date().toISOString()
            }));
            saveLocalRekapList(mapped);
            console.log(`SIMONIKA: Berhasil mengunduh ${mapped.length} data rekapitulasi dari Supabase.`);
            return true;
        }
    } catch (e) {
        console.warn("Gagal sinkronisasi data dari Cloud Supabase:", e);
    }
    return false;
}
window.syncFromCloudDatabase = syncFromCloudDatabase;

// Pre-build Flat Aliases Sorted by Longest Length Descending
let CACHED_OPD_ALIAS_PAIRS = null;
function getCachedOpdAliasPairs() {
    if (CACHED_OPD_ALIAS_PAIRS) return CACHED_OPD_ALIAS_PAIRS;
    const pairs = [];
    MASTER_OPD_LIST.forEach(opd => {
        if (opd.aliases) {
            opd.aliases.forEach(alias => {
                const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
                pairs.push({ alias: cleanAlias, opd: opd });
            });
        }
        const cleanNama = opd.nama.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
        pairs.push({ alias: cleanNama, opd: opd });
    });
    // Sort descending by length so specific names match before general keywords
    pairs.sort((a, b) => b.alias.length - a.alias.length);
    CACHED_OPD_ALIAS_PAIRS = pairs;
    return pairs;
}

// ==========================================
// PENCARIAN & PEMETAAN NAMA OPD DARI DATASET
// ==========================================
function matchOpdFromText(unorInduk, unor, jabatan) {
    const combined = [unorInduk, unor, jabatan].filter(Boolean).join(' ');
    if (!combined) return null;
    const clean = combined.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

    // 1. Cek Exact ID
    const byId = MASTER_OPD_LIST.find(o => o.id.toLowerCase() === clean);
    if (byId) return byId;

    // 2. Cek Aliases (Sorted by length descending) - Mendahulukan 'Pendidikan Dayah', 'Majelis Pendidikan Aceh', 'Disparpora', 'Perikanan', dll.
    const aliasPairs = getCachedOpdAliasPairs();
    for (const pair of aliasPairs) {
        if (clean.includes(pair.alias)) {
            return pair.opd;
        }
    }

    // 3. Fallback Sektor Khusus Sekolah & Kesehatan
    if (/\b(smp|smpn|sd|sdn|skb|paud|tk|guru|sekolah)\b/.test(clean)) {
        return MASTER_OPD_LIST.find(o => o.id === 'DISDIK');
    }
    if (/\b(puskesmas|labkesda|pustu|poskesdes)\b/.test(clean)) {
        return MASTER_OPD_LIST.find(o => o.id === 'DINKES');
    }

    return null;
}

// ==========================================
// DATA REAL MASTER (BERSIH / KOSONG UNTUK PENGUJIAN MANDIRI)
// ==========================================
const REAL_MASTER_PRESEEDED = [];

async function ensureInitialRealSeed() {
    // Sinkronisasi data dari Cloud Supabase saat pertama kali inisialisasi
    if (supabaseClient) {
        return await syncFromCloudDatabase();
    }
    return false;
}

async function resetAllSimonikaData() {
    const confirmRes = await simonikaConfirm({
        title: 'Kosongkan Seluruh Database?',
        text: 'Tindakan ini akan menghapus seluruh dataset master, rincian ASN nominatif, dan rekapitulasi yang tersimpan di sistem dan Cloud Supabase.',
        icon: 'warning',
        confirmText: 'Ya, Kosongkan Sekarang',
        cancelText: 'Batalkan',
        isDanger: true
    });

    if (!confirmRes.isConfirmed) return;

    try {
        localStorage.removeItem(LOCAL_STORAGE_KEY_REKAP);
        const db = await openSimonikaDB();
        if (db && db.objectStoreNames.contains(STORE_ASN)) {
            const tx = db.transaction([STORE_ASN], 'readwrite');
            const store = tx.objectStore(STORE_ASN);
            store.clear();
        }

        // Hapus dari Supabase jika terhubung
        if (supabaseClient) {
            try {
                await supabaseClient.from('skp_detail_pegawai').delete().neq('id', 0);
                await supabaseClient.from('skp_rekap_bulanan').delete().neq('id', 0);
            } catch (supErr) {
                console.warn("Gagal mengosongkan Supabase:", supErr);
            }
        }

        populateFilters();
        refreshAllData();
        simonikaAlert({
            title: 'Database Dikosongkan!',
            text: 'Seluruh dataset master dan data nominatif ASN berhasil dibersihkan dari sistem lokal dan Cloud Supabase.',
            icon: 'success'
        });
    } catch (err) {
        console.error('Gagal mengosongkan database:', err);
        simonikaAlert({
            title: 'Gagal Mengosongkan',
            text: 'Terjadi kendala saat mengosongkan penyimpanan database: ' + err.message,
            icon: 'error'
        });
    }
}
window.resetAllSimonikaData = resetAllSimonikaData;

// ==========================================
// REFRESH & POPULATE FILTERS
// ==========================================
function refreshAllData() {
    updateDashboardDynamic();
    renderOpdList();
    renderSelectedOpdDetail();
    renderLaporanBulanan();
    updateResetButtonState();
}

function populateFilters() {
    const viewMonthSelectors = ['filter-bulan', 'opd-filter-bulan', 'laporan-filter-bulan'];
    const masterMonthSelector = 'master-filter-bulan';
    const yearSelectors = ['filter-tahun', 'opd-filter-tahun', 'master-filter-tahun', 'laporan-filter-tahun'];

    const SHORT_MONTHS_MAP = {
        'JANUARI': 'Jan', 'FEBRUARI': 'Feb', 'MARET': 'Mar', 'APRIL': 'Apr',
        'MEI': 'Mei', 'JUNI': 'Jun', 'JULI': 'Jul', 'AGUSTUS': 'Agu',
        'SEPTEMBER': 'Sep', 'OKTOBER': 'Okt', 'NOVEMBER': 'Nov', 'DESEMBER': 'Des'
    };

    const years = [2026, 2025, 2024, 2023];
    const selectedYear = parseInt(document.getElementById('filter-tahun')?.value || 2026);

    yearSelectors.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const curVal = el.value;
            el.innerHTML = '';
            years.forEach(yr => {
                const opt = document.createElement('option');
                opt.value = yr;
                opt.textContent = yr;
                el.appendChild(opt);
            });
            el.value = curVal ? parseInt(curVal) : selectedYear;
        }
    });

    // Periksa daftar bulan yang memiliki data pada tahun terpilih
    const localList = getLocalRekapList();
    const currentYearData = localList.filter(item => parseInt(item.tahun) === selectedYear);

    const monthCounts = {};
    currentYearData.forEach(item => {
        monthCounts[item.bulan] = (monthCounts[item.bulan] || 0) + 1;
    });

    // Daftar bulan yang memiliki data pada tahun ini
    const availableMonths = INDONESIAN_MONTHS.filter(m => (monthCounts[m] || 0) > 0);

    // 1. Selector Tampilan (Dashboard, OPD, Laporan): Singkat & Padat
    viewMonthSelectors.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const previousVal = el.value;
            el.innerHTML = '';

            if (availableMonths.length === 0) {
                const emptyOpt = document.createElement('option');
                emptyOpt.value = '';
                emptyOpt.textContent = '-- Kosong (' + selectedYear + ') --';
                emptyOpt.disabled = true;
                emptyOpt.selected = true;
                el.appendChild(emptyOpt);
            }

            INDONESIAN_MONTHS.forEach(m => {
                const count = monthCounts[m] || 0;
                const shortName = SHORT_MONTHS_MAP[m] || m;
                const opt = document.createElement('option');
                opt.value = m;

                if (count > 0) {
                    opt.textContent = '🟢 ' + shortName + ' (Ada)';
                    opt.className = 'font-bold text-emerald-800 bg-white';
                    opt.disabled = false;
                } else {
                    opt.textContent = '⚪ ' + shortName + ' (Kosong)';
                    opt.className = 'text-slate-400 bg-slate-50';
                    opt.disabled = true; // Tidak bisa diklik / dipilih jika tidak ada data
                }

                el.appendChild(opt);
            });

            // Tentukan pilihan bulan aktif:
            if (previousVal && availableMonths.includes(previousVal)) {
                el.value = previousVal;
            } else if (availableMonths.length > 0) {
                el.value = availableMonths[availableMonths.length - 1]; // Default ke bulan terbaru dengan data
            } else {
                el.value = '';
            }
        }
    });

    // 2. Selector Master Data (Upload Berkas): Tampilkan semua 12 bulan aktif ringkas
    const masterEl = document.getElementById(masterMonthSelector);
    if (masterEl) {
        const previousVal = masterEl.value;
        masterEl.innerHTML = '';
        INDONESIAN_MONTHS.forEach(m => {
            const count = monthCounts[m] || 0;
            const shortName = SHORT_MONTHS_MAP[m] || m;
            const opt = document.createElement('option');
            opt.value = m;
            if (count > 0) {
                opt.textContent = '🟢 ' + shortName + ' (Ada)';
                opt.className = 'font-bold text-emerald-700 bg-emerald-50';
            } else {
                opt.textContent = '⚪ ' + shortName + ' (Unggah)';
                opt.className = 'text-slate-600 font-normal';
            }
            masterEl.appendChild(opt);
        });

        const activeBulan = document.getElementById('filter-bulan')?.value;
        if (activeBulan && INDONESIAN_MONTHS.includes(activeBulan)) {
            masterEl.value = activeBulan;
        } else if (previousVal && INDONESIAN_MONTHS.includes(previousVal)) {
            masterEl.value = previousVal;
        } else if (availableMonths.length > 0) {
            masterEl.value = availableMonths[availableMonths.length - 1];
        } else {
            masterEl.value = 'JANUARI';
        }
    }

    const currentSelectedMonth = document.getElementById('filter-bulan')?.value || (availableMonths.length > 0 ? availableMonths[availableMonths.length - 1] : '');
    updateMonthStatusBadge(currentSelectedMonth, selectedYear);
    updateResetButtonState();
    populateOpdSingleSelect();
    updateOpdDropdown();
}

function updateResetButtonState() {
    const btn = document.getElementById('btn-reset-database');
    const btnText = document.getElementById('btn-reset-text');
    if (!btn) return;

    const localList = getLocalRekapList();
    const hasData = Array.isArray(localList) && localList.length > 0;

    if (hasData) {
        btn.disabled = false;
        btn.className = 'flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl transition-all focus:outline-none shadow-xs cursor-pointer';
        btn.title = 'Hapus seluruh data yang tersimpan di sistem';
        if (btnText) btnText.textContent = 'Kosongkan Database';
    } else {
        btn.disabled = true;
        btn.className = 'flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-not-allowed opacity-60';
        btn.title = 'Database masih kosong (tidak ada data)';
        if (btnText) btnText.textContent = 'Database Kosong';
    }
}

function updateMonthStatusBadge(selectedMonth, selectedYear) {
    const localList = getLocalRekapList();
    const filledCount = selectedMonth ? localList.filter(item => item.bulan === selectedMonth && parseInt(item.tahun) === parseInt(selectedYear)).length : 0;
    
    const badgeIds = ['month-status-badge-1', 'month-status-badge-2', 'month-status-badge-4'];
    const textIds = ['month-status-text-1', 'month-status-text-2', 'month-status-text-4'];
    const containerIds = ['month-widget-container-1', 'month-widget-container-2', 'month-widget-container-4'];

    const hasData = filledCount > 0;

    badgeIds.forEach((bId, idx) => {
        const badge = document.getElementById(bId);
        const text = document.getElementById(textIds[idx]);
        const cont = document.getElementById(containerIds[idx]);

        if (badge && text) {
            const dot = badge.querySelector('span:first-child');
            if (hasData) {
                badge.className = 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0';
                if (dot) dot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse';
                text.textContent = filledCount + ' OPD';
            } else {
                badge.className = 'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-slate-100 text-slate-500 border border-slate-200 shrink-0';
                if (dot) dot.className = 'w-1.5 h-1.5 rounded-full bg-slate-400';
                text.textContent = 'Kosong';
            }
        }

        if (cont) {
            const iconBox = cont.querySelector('div');
            if (hasData) {
                cont.className = 'flex items-center gap-1.5 px-2 py-1 rounded-lg border border-indigo-500 bg-white shadow-xs transition-all duration-200';
                if (iconBox) iconBox.className = 'p-1 rounded bg-indigo-600 text-white shadow-xs shrink-0 flex items-center justify-center transition-colors';
            } else {
                cont.className = 'flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50/70 shadow-none transition-all duration-200';
                if (iconBox) iconBox.className = 'p-1 rounded bg-slate-200 text-slate-400 shrink-0 flex items-center justify-center transition-colors';
            }
        }
    });
}

function populateOpdSingleSelect() {
    const select = document.getElementById('opd-single-select');
    if (!select) return;

    let list = MASTER_OPD_LIST;
    if (USER_LEVEL === 2 && USER_OPD_ID) {
        list = MASTER_OPD_LIST.filter(o => o.id === USER_OPD_ID);
    }

    const previousVal = select.value;
    select.innerHTML = '';

    list.slice().sort((a, b) => a.nama.localeCompare(b.nama)).forEach(opd => {
        const opt = document.createElement('option');
        opt.value = opd.id;
        opt.textContent = `${opd.nama} (${opd.kategori})`;
        select.appendChild(opt);
    });

    if (USER_LEVEL === 2 && USER_OPD_ID) {
        select.value = USER_OPD_ID;
        select.disabled = true;
    } else if (list.some(o => o.id === previousVal)) {
        select.value = previousVal;
    } else if (list.some(o => o.id === 'BKPSDM')) {
        select.value = 'BKPSDM';
    } else if (list.length > 0) {
        select.value = list[0].id;
    }

    renderOpdCustomDropdownItems();
    updateOpdCustomDropdownTriggerLabel();
}

function updateOpdCustomDropdownTriggerLabel() {
    const select = document.getElementById('opd-single-select');
    const label = document.getElementById('opd-custom-dropdown-label');
    const badge = document.getElementById('opd-custom-dropdown-badge');
    const trigger = document.getElementById('opd-custom-dropdown-trigger');

    if (!select || !label) return;

    const currentId = select.value;
    const opd = MASTER_OPD_LIST.find(o => o.id === currentId) || { id: currentId, nama: (USER_LEVEL === 2 ? USER_OPD_NAME : (currentId || 'Pilih Perangkat Daerah')), kategori: 'DINAS' };

    label.textContent = opd.nama;
    if (badge) {
        badge.textContent = opd.kategori;
        if (opd.kategori === 'KECAMATAN') {
            badge.className = 'px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-100 shrink-0';
        } else {
            badge.className = 'px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0';
        }
    }

    if (USER_LEVEL === 2 && USER_OPD_ID) {
        if (trigger) {
            trigger.disabled = true;
            trigger.classList.add('cursor-not-allowed', 'opacity-90');
        }
    }
}
window.updateOpdCustomDropdownTriggerLabel = updateOpdCustomDropdownTriggerLabel;

function renderOpdCustomDropdownItems(filteredList) {
    const listContainer = document.getElementById('opd-custom-dropdown-list');
    const select = document.getElementById('opd-single-select');
    const matchCount = document.getElementById('opd-search-match-count');
    if (!listContainer || !select) return;

    let list = filteredList || MASTER_OPD_LIST;
    if (USER_LEVEL === 2 && USER_OPD_ID) {
        list = MASTER_OPD_LIST.filter(o => o.id === USER_OPD_ID);
    }

    if (matchCount) {
        matchCount.textContent = `${list.length} Unit Kerja`;
    }

    listContainer.innerHTML = '';
    if (list.length === 0) {
        listContainer.innerHTML = `
            <div class="py-6 px-4 text-center text-xs font-semibold text-slate-400">
                <span class="text-base block mb-1">🔍</span>
                Tidak menemukan perangkat daerah yang cocok.
            </div>
        `;
        return;
    }

    const currentSelectedId = select.value;
    list.slice().sort((a, b) => a.nama.localeCompare(b.nama)).forEach(opd => {
        const isSelected = opd.id === currentSelectedId;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between gap-2 cursor-pointer ${
            isSelected ? 'bg-indigo-50/90 text-indigo-700 font-bold border border-indigo-100' : 'text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-600'
        }`;

        const isKec = opd.kategori === 'KECAMATAN';
        btn.innerHTML = `
            <div class="flex items-center gap-2 truncate">
                <span class="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                    isKec ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }">${opd.kategori}</span>
                <span class="truncate">${opd.nama}</span>
            </div>
            ${isSelected ? '<span class="text-indigo-600 shrink-0 font-bold">✓</span>' : ''}
        `;

        btn.onclick = (e) => {
            e.stopPropagation();
            select.value = opd.id;
            updateOpdCustomDropdownTriggerLabel();
            renderSelectedOpdDetail();
            closeOpdCustomDropdown();
        };

        listContainer.appendChild(btn);
    });
}
window.renderOpdCustomDropdownItems = renderOpdCustomDropdownItems;

function toggleOpdCustomDropdown() {
    if (USER_LEVEL === 2 && USER_OPD_ID) return;
    const menu = document.getElementById('opd-custom-dropdown-menu');
    if (!menu) return;
    if (menu.classList.contains('hidden')) {
        openOpdCustomDropdown();
    } else {
        closeOpdCustomDropdown();
    }
}
window.toggleOpdCustomDropdown = toggleOpdCustomDropdown;

function openOpdCustomDropdown() {
    const menu = document.getElementById('opd-custom-dropdown-menu');
    const arrow = document.getElementById('opd-custom-dropdown-arrow');
    const searchInput = document.getElementById('opd-custom-search-input');
    if (!menu) return;

    menu.classList.remove('hidden');
    if (arrow) arrow.classList.add('rotate-180');
    if (searchInput) {
        searchInput.value = '';
        setTimeout(() => searchInput.focus(), 60);
    }
    renderOpdCustomDropdownItems();
}
window.openOpdCustomDropdown = openOpdCustomDropdown;

function closeOpdCustomDropdown() {
    const menu = document.getElementById('opd-custom-dropdown-menu');
    const arrow = document.getElementById('opd-custom-dropdown-arrow');
    if (!menu) return;

    menu.classList.add('hidden');
    if (arrow) arrow.classList.remove('rotate-180');
}
window.closeOpdCustomDropdown = closeOpdCustomDropdown;

function filterOpdCustomDropdown(query) {
    const q = (query || '').toLowerCase().trim();
    const clearBtn = document.getElementById('opd-custom-search-clear');
    if (clearBtn) {
        if (q) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
    }

    let filtered = MASTER_OPD_LIST;
    if (q) {
        filtered = MASTER_OPD_LIST.filter(opd => 
            opd.nama.toLowerCase().includes(q) || 
            opd.id.toLowerCase().includes(q) || 
            opd.kategori.toLowerCase().includes(q)
        );
    }

    renderOpdCustomDropdownItems(filtered);
}
window.filterOpdCustomDropdown = filterOpdCustomDropdown;

function clearOpdCustomSearch() {
    const searchInput = document.getElementById('opd-custom-search-input');
    if (searchInput) searchInput.value = '';
    filterOpdCustomDropdown('');
    if (searchInput) searchInput.focus();
}
window.clearOpdCustomSearch = clearOpdCustomSearch;

// Global click outside listener for custom dropdown
document.addEventListener('click', (e) => {
    const container = document.getElementById('opd-custom-dropdown-container');
    if (container && !container.contains(e.target)) {
        closeOpdCustomDropdown();
    }
});

function updateOpdDropdown() {
    const opdSelect = document.getElementById('opd-select');
    if (!opdSelect) return;
    const currentSelectedOpd = opdSelect.value;

    opdSelect.innerHTML = '';

    if (USER_LEVEL === 2 && USER_OPD_ID) {
        const myOpd = MASTER_OPD_LIST.find(o => o.id === USER_OPD_ID) || { id: USER_OPD_ID, nama: USER_OPD_NAME };
        const opt = document.createElement('option');
        opt.value = myOpd.id;
        opt.textContent = myOpd.nama;
        opdSelect.appendChild(opt);
        opdSelect.value = USER_OPD_ID;
        opdSelect.disabled = true;
        return;
    }

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

    const optionExists = opdSelect.options ? Array.from(opdSelect.options).some(opt => opt.value === currentSelectedOpd) : false;
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
// RENDER DASHBOARD UTAMA
// ==========================================
async function updateDashboardDynamic() {
    const filterTahunEl = document.getElementById('filter-tahun');
    const filterBulanEl = document.getElementById('filter-bulan');
    const opdSelectEl = document.getElementById('opd-select');

    if (!filterTahunEl || !filterBulanEl || !opdSelectEl) return;

    const selectedYear = parseInt(filterTahunEl.value);
    const selectedBulan = filterBulanEl.value;
    let selectedOpd = (USER_LEVEL === 2 && USER_OPD_ID) ? USER_OPD_ID : opdSelectEl.value;

    let periodData = getLocalRekapList().filter(item => item.bulan === selectedBulan && parseInt(item.tahun) === selectedYear);

    if (currentCategoryFilter !== 'SEMUA' && USER_LEVEL !== 2) {
        periodData = periodData.filter(row => {
            const meta = MASTER_OPD_LIST.find(o => o.id === row.opd_id);
            return meta && meta.kategori === currentCategoryFilter;
        });
    }

    if (selectedOpd !== 'SEMUA') {
        const opdMeta = MASTER_OPD_LIST.find(o => o.id === selectedOpd);
        const displayName = opdMeta ? opdMeta.nama : (USER_LEVEL === 2 ? USER_OPD_NAME : 'Unit Kerja');
        const singleData = periodData.find(row => row.opd_id === selectedOpd);

        if (singleData) {
            renderDashboardDOM(formatDashboardData(singleData, displayName));
        } else {
            renderDashboardDOM(getEmptyDashboardData(displayName));
        }
    } else {
        let displayName = "PENILAIAN SKP ASN PEMERINTAH KAB. ACEH TIMUR";
        if (currentCategoryFilter === 'DINAS') {
            displayName = "REKAPITULASI PENILAIAN SKP DINAS & BADAN KAB. ACEH TIMUR";
        } else if (currentCategoryFilter === 'KECAMATAN') {
            displayName = "REKAPITULASI PENILAIAN SKP KECAMATAN KAB. ACEH TIMUR";
        }

        let aggregated = {
            pns: 0, pppk: 0, pppk_dw: 0,
            sangat_baik: 0, baik: 0, butuh_perbaikan: 0, kurang: 0, sangat_kurang: 0, tidak_membuat_skp: 0
        };

        periodData.forEach(row => {
            aggregated.pns += parseInt(row.pns || 0);
            aggregated.pppk += parseInt(row.pppk || 0);
            aggregated.pppk_dw += parseInt(row.pppk_dw || 0);
            aggregated.sangat_baik += parseInt(row.sangat_baik || 0);
            aggregated.baik += parseInt(row.baik || 0);
            aggregated.butuh_perbaikan += parseInt(row.butuh_perbaikan || 0);
            aggregated.kurang += parseInt(row.kurang || 0);
            aggregated.sangat_kurang += parseInt(row.sangat_kurang || 0);
            aggregated.tidak_membuat_skp += parseInt(row.tidak_membuat_skp || 0);
        });

        renderDashboardDOM(formatDashboardData(aggregated, displayName));
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
    const tidakMembuatSkp = parseInt(data.tidak_membuat_skp || 0);
    const totalPredikat = sangatBaik + baik + butuhPerbaikan + kurang + sangatKurang + tidakMembuatSkp;

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
            { nama: 'Sangat Kurang', emoji: '✖️', jumlah: sangatKurang, persen: totalPredikat > 0 ? (sangatKurang / totalPredikat) * 100 : 0, color: '#ef4444' },
            { nama: 'Tidak membuat SKP', emoji: '🚫', jumlah: tidakMembuatSkp, persen: totalPredikat > 0 ? (tidakMembuatSkp / totalPredikat) * 100 : 0, color: '#64748b' }
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
            { nama: 'Sangat Kurang', emoji: '✖️', jumlah: 0, persen: 0, color: '#ef4444' },
            { nama: 'Tidak membuat SKP', emoji: '🚫', jumlah: 0, persen: 0, color: '#64748b' }
        ]
    };
}

function renderDashboardDOM(data) {
    const subtitleEl = document.getElementById('opd-subtitle');
    if (subtitleEl) subtitleEl.textContent = data.nama;

    const statTotal = document.getElementById('stat-total-asn');
    const statPns = document.getElementById('stat-pns');
    const statPppk = document.getElementById('stat-pppk');
    const statPppkDw = document.getElementById('stat-pppk-dw');

    if (statTotal) statTotal.textContent = formatNumber(data.total);
    if (statPns) statPns.textContent = formatNumber(data.pns);
    if (statPppk) statPppk.textContent = formatNumber(data.pppk);
    if (statPppkDw) statPppkDw.textContent = formatNumber(data.pppkDw);

    const keys = ['sangatbaik', 'baik', 'butuhperbaikan', 'kurang', 'sangatkurang', 'tidakmembuatskp'];
    data.predikat.forEach((item, index) => {
        const key = keys[index];
        const countElem = document.getElementById(`cat-${key}-count`);
        const pctElem = document.getElementById(`cat-${key}-pct`);
        const barElem = document.getElementById(`cat-${key}-bar`);
        if (countElem) countElem.textContent = formatNumber(item.jumlah);
        if (pctElem) pctElem.textContent = item.persen.toFixed(1) + '%';
        if (barElem) barElem.style.width = item.persen + '%';
    });

    const tableTotal = document.getElementById('table-total-asn');
    if (tableTotal) tableTotal.textContent = `Total: ${formatNumber(data.total)} ASN`;

    const tbody = document.getElementById('table-body');
    if (tbody) {
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
            else if (item.nama === 'Tidak membuat SKP') badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';

            row.innerHTML = `
                <td class="py-1.5 px-3 font-semibold text-slate-700 flex items-center gap-2">
                    <span class="text-xs">${item.emoji}</span>
                    <span class="px-1.5 py-0.5 rounded border text-[11px] font-bold ${badgeClass}">${item.nama}</span>
                </td>
                <td class="py-1.5 px-3 text-right font-extrabold text-slate-800 text-xs">${formatNumber(item.jumlah)}</td>
                <td class="py-1.5 px-3 text-right font-medium text-slate-500 text-xs">${item.persen.toFixed(2)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    if (kinerjaChart) {
        kinerjaChart.data.datasets[0].data = data.predikat.map(item => item.jumlah);
        const maxVal = Math.max(...data.predikat.map(item => item.jumlah));
        kinerjaChart.options.scales.y.max = maxVal === 0 ? 10 : Math.ceil(maxVal * 1.15);
        kinerjaChart.update();
    }
}

// ==========================================
// RENDER HALAMAN DATA OPD & DETAIL OPD TERPILIH
// ==========================================
// ==========================================
// INDEXEDDB STORAGE UNTUK DATA NOMINATIF ASN
// ==========================================
const SIMONIKA_DB_NAME = 'SimonikaDB';
const SIMONIKA_DB_VERSION = 1;
const STORE_ASN = 'asn_nominatif';

function openSimonikaDB() {
    return new Promise((resolve) => {
        if (!window.indexedDB) {
            console.warn("IndexedDB tidak didukung pada peramban ini.");
            resolve(null);
            return;
        }
        const request = indexedDB.open(SIMONIKA_DB_NAME, SIMONIKA_DB_VERSION);
        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_ASN)) {
                const store = db.createObjectStore(STORE_ASN, { keyPath: 'id', autoIncrement: true });
                store.createIndex('by_period_opd', ['tahun', 'bulan', 'opd_id'], { unique: false });
                store.createIndex('by_period', ['tahun', 'bulan'], { unique: false });
            }
        };
        request.onsuccess = function (event) {
            resolve(event.target.result);
        };
        request.onerror = function (event) {
            console.error("IndexedDB open error:", event.target.error);
            resolve(null);
        };
    });
}

async function saveAsnRecordsBatch(records, bulan, tahun) {
    const db = await openSimonikaDB();
    if (!db) return false;

    return new Promise((resolve) => {
        try {
            const tx = db.transaction([STORE_ASN], 'readwrite');
            const store = tx.objectStore(STORE_ASN);
            const index = store.index('by_period');
            const keyRange = IDBKeyRange.only([parseInt(tahun), bulan]);

            // Bersihkan data periode ini sebelum menimpa dengan batch baru
            const cursorReq = index.openCursor(keyRange);
            cursorReq.onsuccess = function (e) {
                const cursor = e.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    records.forEach(item => store.add(item));
                }
            };

            tx.oncomplete = function () {
                resolve(true);
            };
            tx.onerror = function (e) {
                console.error("Error batch saving ASN records:", e.target.error);
                resolve(false);
            };
        } catch (err) {
            console.error("IndexedDB transaction error:", err);
            resolve(false);
        }
    });
}

async function getAsnRecordsByOpd(opdId, bulan, tahun) {
    const db = await openSimonikaDB();
    let records = [];

    if (db) {
        records = await new Promise((resolve) => {
            try {
                const tx = db.transaction([STORE_ASN], 'readonly');
                const store = tx.objectStore(STORE_ASN);
                const index = store.index('by_period_opd');
                const keyRange = IDBKeyRange.only([parseInt(tahun), bulan, opdId]);
                const request = index.getAll(keyRange);

                request.onsuccess = function () {
                    resolve(request.result || []);
                };
                request.onerror = function () {
                    resolve([]);
                };
            } catch (e) {
                resolve([]);
            }
        });
    }

    // Jika di IndexedDB lokal belum ada, ambil dari Cloud Supabase
    if ((!records || records.length === 0) && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('skp_detail_pegawai')
                .select('*')
                .eq('opd_id', opdId)
                .eq('bulan', bulan)
                .eq('tahun', parseInt(tahun));

            if (!error && data && data.length > 0) {
                records = data.map((item, idx) => ({
                    opd_id: item.opd_id,
                    bulan: item.bulan,
                    tahun: parseInt(item.tahun),
                    no: idx + 1,
                    nip: item.nip || '',
                    nama: item.nama_pegawai || '',
                    skp_unor: item.skp_unor || '',
                    skp_unor_induk: item.skp_unor || '',
                    skp_jabatan: item.skp_jabatan || '',
                    hasil_kerja: item.hasil_kerja || '',
                    perilaku_kerja: item.perilaku_kerja || '',
                    hasil_akhir: item.predikat_kinerja || 'Tidak membuat SKP',
                    golru: item.golru || '',
                    jenis_pegawai: item.status_pegawai || 'pns',
                    skp_jenis_jabatan: item.skp_jenis_jabatan || '',
                    is_skp_plt_plh_pjb: item.is_skp_plt_plh_pjb || '0'
                }));

                // Cache ke IndexedDB agar pencarian berikutnya instan tanpa network call
                if (db) {
                    try {
                        const tx = db.transaction([STORE_ASN], 'readwrite');
                        const store = tx.objectStore(STORE_ASN);
                        records.forEach(r => store.add(r));
                    } catch (cacheErr) {
                        console.warn("Gagal menyimpan cache ke IndexedDB:", cacheErr);
                    }
                }
            }
        } catch (supErr) {
            console.warn("Gagal mengambil data nominatif dari Supabase:", supErr);
        }
    }

    return records;
}

// Generator ASN Demo Sintetis (Bila belum ada file dataset asli yang diunggah)
function generateSampleAsnRecords(opd, bulan, tahun, opdData) {
    const records = [];
    const countPns = parseInt(opdData?.pns || 12);
    const countPppk = parseInt(opdData?.pppk || 6);
    const countPppkDw = parseInt(opdData?.pppk_dw || 4);
    const total = Math.max(1, countPns + countPppk + countPppkDw);

    const firstNames = ['Muhammad', 'Ahmad', 'Teuku', 'Cut', 'Siti', 'Nur', 'Zulkifli', 'Iskandar', 'Faisal', 'Rahmat', 'Dewi', 'Sri', 'Bambang', 'Hendra', 'Safrizal', 'Mulyadi', 'Ilyas', 'Usman', 'Hasballah', 'Mukhlis'];
    const lastNames = ['Ibrahim', 'Yusuf', 'Abdullah', 'Saputra', 'Hidayat', 'Maulana', 'Siregar', 'Harahap', 'Lubis', 'Pratama', 'Kurniawan', 'Fadli', 'Akbar', 'Ramadhan', 'Nazaruddin', 'Zainal', 'Mahmud', 'Sanusi'];

    const jabatans = [
        'Analis Kebijakan Ahli Muda',
        'Penata Kelola Pelayanan Publik',
        'Pengadministrasi Perkantoran',
        'Pranata Komputer Ahli Pertama',
        'Perencana Ahli Pertama',
        'Pengawas Penyelenggaraan Urusan Pemerintahan Daerah',
        'Analis Sumber Daya Manusia Aparatur Ahli Pertama',
        'Penyusun Program Anggaran dan Pelaporan',
        'Bendahara Pengeluaran',
        'Pengelola Kepegawaian'
    ];

    const predikats = [
        { name: 'sangat baik', hasil: 'diatas', perilaku: 'diatas' },
        { name: 'baik', hasil: 'sesuai', perilaku: 'sesuai' },
        { name: 'baik', hasil: 'sesuai', perilaku: 'sesuai' },
        { name: 'baik', hasil: 'sesuai', perilaku: 'sesuai' },
        { name: 'butuh perbaikan', hasil: 'dibawah', perilaku: 'sesuai' },
        { name: 'kurang', hasil: 'dibawah', perilaku: 'dibawah' }
    ];

    for (let i = 1; i <= Math.min(total, 60); i++) {
        const fn = firstNames[(i + opd.id.length) % firstNames.length];
        const ln = lastNames[(i * 3) % lastNames.length];
        const isPns = i <= countPns;
        const isPppkDw = !isPns && i > (countPns + countPppk);
        const jenisPeg = isPns ? 'pns' : (isPppkDw ? 'pppk paruh waktu' : 'pppk');
        const golru = isPns ? (i % 2 === 0 ? 'III/b' : 'III/a') : (isPppkDw ? 'Golongan VII' : 'Golongan IX');
        const pred = predikats[i % predikats.length];
        const nip = isPns 
            ? `198${(50 + (i % 30)).toString()}0${(1 + (i % 9)).toString()}20100${(1 + (i % 9)).toString()}100${(i % 10)}`
            : `199${(60 + (i % 30)).toString()}0${(1 + (i % 9)).toString()}20232${(1 + (i % 9)).toString()}100${(i % 10)}`;

        records.push({
            opd_id: opd.id,
            bulan: bulan,
            tahun: parseInt(tahun),
            no: i,
            nip: nip,
            nama: `${fn} ${ln}`,
            skp_unor: opd.nama,
            skp_unor_induk: opd.nama,
            skp_jabatan: jabatans[i % jabatans.length],
            hasil_kerja: pred.hasil,
            perilaku_kerja: pred.perilaku,
            hasil_akhir: pred.name,
            golru: golru,
            jenis_pegawai: jenisPeg,
            skp_jenis_jabatan: '2',
            is_skp_plt_plh_pjb: '0'
        });
    }

    return records;
}

// State untuk Tabel ASN
let currentLoadedAsn = [];
let filteredAsn = [];
let asnPage = 1;
let asnPageSize = 15;

// ==========================================
// RENDER HALAMAN DATA OPD & DETAIL OPD TERPILIH
// ==========================================
async function renderSelectedOpdDetail() {
    window.renderSelectedOpdDetail = renderSelectedOpdDetail;
    const select = document.getElementById('opd-single-select');
    let opdId = (USER_LEVEL === 2 && USER_OPD_ID) ? USER_OPD_ID : (select?.value || 'BKPSDM');

    updateOpdCustomDropdownTriggerLabel();

    const selectedYear = parseInt(document.getElementById('opd-filter-tahun')?.value || 2026);
    const selectedBulan = document.getElementById('opd-filter-bulan')?.value || 'JULI';

    const opd = MASTER_OPD_LIST.find(o => o.id === opdId) || { id: opdId, nama: (USER_LEVEL === 2 ? USER_OPD_NAME : opdId), kategori: 'DINAS' };

    const localList = getLocalRekapList();
    const opdData = localList.find(item => item.opd_id === opdId && item.bulan === selectedBulan && parseInt(item.tahun) === selectedYear);

    const nameEl = document.getElementById('selected-opd-name');
    const badgeEl = document.getElementById('selected-opd-badge');
    const statusBadgeEl = document.getElementById('selected-opd-status-badge');
    const filenameEl = document.getElementById('selected-opd-filename');

    const totalEl = document.getElementById('selected-opd-total');
    const pnsEl = document.getElementById('selected-opd-pns');
    const pppkEl = document.getElementById('selected-opd-pppk');
    const pppkdwEl = document.getElementById('selected-opd-pppkdw');

    if (nameEl) nameEl.textContent = opd.nama;
    if (badgeEl) badgeEl.textContent = opd.kategori;

    if (opdData) {
        const pns = parseInt(opdData.pns || 0);
        const pppk = parseInt(opdData.pppk || 0);
        const pppk_dw = parseInt(opdData.pppk_dw || 0);
        const total = pns + pppk + pppk_dw;

        if (statusBadgeEl) {
            statusBadgeEl.className = "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200";
            statusBadgeEl.textContent = "Terisi";
        }
        if (filenameEl) filenameEl.textContent = `Berkas Master: ${opdData.nama_file || 'Tersimpan'}`;
        if (totalEl) totalEl.textContent = formatNumber(total);
        if (pnsEl) pnsEl.textContent = formatNumber(pns);
        if (pppkEl) pppkEl.textContent = formatNumber(pppk);
        if (pppkdwEl) pppkdwEl.textContent = formatNumber(pppk_dw);
    } else {
        if (statusBadgeEl) {
            statusBadgeEl.className = "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-600 border border-rose-200";
            statusBadgeEl.textContent = "Belum Ada Data";
        }
        if (filenameEl) filenameEl.textContent = `Berkas: Belum diunggah untuk periode ${selectedBulan} ${selectedYear}`;
        if (totalEl) totalEl.textContent = "0";
        if (pnsEl) pnsEl.textContent = "0";
        if (pppkEl) pppkEl.textContent = "0";
        if (pppkdwEl) pppkdwEl.textContent = "0";
    }

    // Ambil data nominatif ASN dari IndexedDB
    let asnRecords = await getAsnRecordsByOpd(opdId, selectedBulan, selectedYear);
    if ((!asnRecords || asnRecords.length === 0) && opdData) {
        // Fallback demo synthetic data jika data rekap ada tetapi file asli belum diunggah via IndexedDB
        asnRecords = generateSampleAsnRecords(opd, selectedBulan, selectedYear, opdData);
    }

    currentLoadedAsn = asnRecords || [];
    filterAsnTable();
};

// ==========================================
// LOGIKA FILTER & TABEL NOMINATIF ASN
// ==========================================
function filterAsnTable() {
window.filterAsnTable = filterAsnTable;
    const searchVal = (document.getElementById('asn-search-input')?.value || '').toLowerCase().trim();
    const predikatFilter = (document.getElementById('asn-filter-predikat')?.value || 'ALL').toUpperCase();
    const statusFilter = (document.getElementById('asn-filter-status')?.value || 'ALL').toUpperCase();

    filteredAsn = currentLoadedAsn.filter(item => {
        // Search NIP / Nama / Jabatan / Unor
        const matchSearch = !searchVal || 
            String(item.nip || '').toLowerCase().includes(searchVal) ||
            String(item.nama || '').toLowerCase().includes(searchVal) ||
            String(item.skp_jabatan || '').toLowerCase().includes(searchVal) ||
            String(item.skp_unor || '').toLowerCase().includes(searchVal);

        // Filter Predikat
        const itemPred = String(item.hasil_akhir || '').toUpperCase();
        let matchPredikat = true;
        if (predikatFilter !== 'ALL') {
            matchPredikat = itemPred.includes(predikatFilter);
        }

        // Filter Status
        const itemStatus = String(item.jenis_pegawai || '').toUpperCase();
        let matchStatus = true;
        if (statusFilter === 'PNS') {
            matchStatus = itemStatus.includes('PNS') && !itemStatus.includes('PPPK');
        } else if (statusFilter === 'PPPK') {
            matchStatus = itemStatus.includes('PPPK') && !itemStatus.includes('PARUH') && !itemStatus.includes('DW') && !itemStatus.includes('PW');
        } else if (statusFilter === 'PPPK_DW') {
            matchStatus = itemStatus.includes('PARUH') || itemStatus.includes('DW') || itemStatus.includes('PW');
        }

        return matchSearch && matchPredikat && matchStatus;
    });

    asnPage = 1;
    renderAsnTableRows();
};

function renderAsnTableRows() {
    const tbody = document.getElementById('asn-table-tbody');
    const badgeCount = document.getElementById('asn-table-count-badge');
    const infoSpan = document.getElementById('asn-pagination-info');
    const paginationControls = document.getElementById('asn-pagination-controls');

    if (!tbody) return;

    tbody.innerHTML = '';
    const totalCount = filteredAsn.length;
    if (badgeCount) badgeCount.textContent = `${formatNumber(totalCount)} Pegawai`;

    if (totalCount === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-8 text-center text-slate-400">
                    <div class="flex flex-col items-center justify-center">
                        <span class="text-2xl mb-1">📂</span>
                        <p class="font-semibold text-xs text-slate-600">Tidak ada data pegawai ASN</p>
                        <p class="text-[11px] text-slate-400 mt-0.5">Unggah dataset master SKP di menu Master Data untuk melihat daftar nominatif terpilah.</p>
                    </div>
                </td>
            </tr>
        `;
        if (infoSpan) infoSpan.textContent = 'Menampilkan 0 dari 0 data';
        if (paginationControls) paginationControls.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(totalCount / asnPageSize) || 1;
    if (asnPage > totalPages) asnPage = totalPages;
    if (asnPage < 1) asnPage = 1;

    const startIndex = (asnPage - 1) * asnPageSize;
    const endIndex = Math.min(startIndex + asnPageSize, totalCount);

    if (infoSpan) {
        infoSpan.textContent = `Menampilkan ${startIndex + 1} - ${endIndex} dari ${formatNumber(totalCount)} data`;
    }

    const pageRows = filteredAsn.slice(startIndex, endIndex);

    pageRows.forEach((item, idx) => {
        const rowNo = startIndex + idx + 1;
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0';

        // Styling Predikat Badge
        const predRaw = String(item.hasil_akhir || '').toLowerCase();
        let predBadge = 'bg-slate-100 text-slate-700 border-slate-200';
        let predLabel = item.hasil_akhir || 'Tidak Buat SKP';
        let predIcon = '🚫';

        if (predRaw.includes('sangat baik') || predRaw.includes('diatas') || predRaw.includes('istimewa')) {
            predBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
            predLabel = 'Sangat Baik';
            predIcon = '👍';
        } else if (predRaw.includes('sangat kurang') || predRaw.includes('sangat buruk')) {
            predBadge = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
            predLabel = 'Sangat Kurang';
            predIcon = '✖️';
        } else if (predRaw.includes('kurang') || predRaw.includes('dibawah')) {
            predBadge = 'bg-orange-50 text-orange-700 border-orange-200 font-bold';
            predLabel = 'Kurang';
            predIcon = '⬇️';
        } else if (predRaw.includes('perbaikan') || predRaw.includes('butuh')) {
            predBadge = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
            predLabel = 'Butuh Perbaikan';
            predIcon = '⚠️';
        } else if (predRaw.includes('baik') || predRaw.includes('sesuai')) {
            predBadge = 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
            predLabel = 'Baik';
            predIcon = '✔️';
        }

        // Status Pegawai Badge
        const statRaw = String(item.jenis_pegawai || '').toLowerCase();
        let statBadge = 'bg-slate-100 text-slate-700';
        let statLabel = 'PNS';
        if (statRaw.includes('pppk') && (statRaw.includes('paruh') || statRaw.includes('dw') || statRaw.includes('pw'))) {
            statBadge = 'bg-amber-100 text-amber-800';
            statLabel = 'PPPK PW';
        } else if (statRaw.includes('pppk')) {
            statBadge = 'bg-blue-100 text-blue-800';
            statLabel = 'PPPK';
        } else {
            statBadge = 'bg-emerald-100 text-emerald-800';
            statLabel = 'PNS';
        }

        tr.innerHTML = `
            <td class="py-2.5 px-3 text-center text-slate-400 font-semibold">${rowNo}</td>
            <td class="py-2.5 px-4">
                <div class="font-bold text-slate-900">${item.nama || '-'}</div>
                <div class="text-[11px] font-mono text-slate-500">${item.nip || '-'}</div>
            </td>
            <td class="py-2.5 px-4">
                <div class="font-medium text-slate-800">${item.skp_jabatan || '-'}</div>
                <div class="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">${item.skp_unor || '-'}</div>
            </td>
            <td class="py-2.5 px-3 text-center">
                <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${statBadge}">${statLabel}</span>
                <div class="text-[10px] text-slate-400 mt-0.5 font-medium">${item.golru || '-'}</div>
            </td>
            <td class="py-2.5 px-3 text-center capitalize text-[11px] font-semibold text-slate-700">${item.hasil_kerja || '-'}</td>
            <td class="py-2.5 px-3 text-center capitalize text-[11px] font-semibold text-slate-700">${item.perilaku_kerja || '-'}</td>
            <td class="py-2.5 px-4 text-center">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] ${predBadge}">
                    <span>${predIcon}</span>
                    <span>${predLabel}</span>
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Render Pagination Controls
    if (paginationControls) {
        paginationControls.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = `px-2 py-1 rounded border text-xs font-semibold ${asnPage > 1 ? 'bg-white hover:bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`;
        prevBtn.textContent = 'Sebelumnya';
        prevBtn.disabled = asnPage <= 1;
        prevBtn.onclick = () => goToAsnPage(asnPage - 1);
        paginationControls.appendChild(prevBtn);

        const curPageSpan = document.createElement('span');
        curPageSpan.className = 'px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded';
        curPageSpan.textContent = `${asnPage} / ${totalPages}`;
        paginationControls.appendChild(curPageSpan);

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = `px-2 py-1 rounded border text-xs font-semibold ${asnPage < totalPages ? 'bg-white hover:bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`;
        nextBtn.textContent = 'Selanjutnya';
        nextBtn.disabled = asnPage >= totalPages;
        nextBtn.onclick = () => goToAsnPage(asnPage + 1);
        paginationControls.appendChild(nextBtn);
    }
}

function goToAsnPage(page) {
window.goToAsnPage = goToAsnPage;
    asnPage = page;
    renderAsnTableRows();
};

function changeAsnPageSize() {
window.changeAsnPageSize = changeAsnPageSize;
    const el = document.getElementById('asn-page-size');
    if (el) {
        asnPageSize = parseInt(el.value) || 15;
        asnPage = 1;
        renderAsnTableRows();
    }
};

// ==========================================
// UNDUH DATA ASN LENGKAP EXCEL (100% PERSIS TEMPLATE)
// Mengikuti Format Persis: "Format Rekap SKP per OPD.xlsx"
// ==========================================
async function unduhDataAsnExcel() {
    window.unduhDataAsnExcel = unduhDataAsnExcel;
    window.unduhDataAsnLengkapExcel = unduhDataAsnExcel;

    const select = document.getElementById('opd-single-select');
    let opdId = (USER_LEVEL === 2 && USER_OPD_ID) ? USER_OPD_ID : (select?.value || 'BKPSDM');
    const selectedYear = parseInt(document.getElementById('opd-filter-tahun')?.value || 2026);
    const selectedBulan = document.getElementById('opd-filter-bulan')?.value || 'JULI';
    const opd = MASTER_OPD_LIST.find(o => o.id === opdId) || { id: opdId, nama: (USER_LEVEL === 2 ? USER_OPD_NAME : opdId), kategori: 'DINAS' };

    let records = await getAsnRecordsByOpd(opdId, selectedBulan, selectedYear);
    if ((!records || records.length === 0) && currentLoadedAsn && currentLoadedAsn.length > 0) {
        records = currentLoadedAsn;
    }

    if (!records || records.length === 0) {
        simonikaAlert({
            title: 'Data Belum Tersedia',
            html: `<div class="text-left space-y-2 text-xs text-slate-600">
                <p>Tidak ditemukan data ASN untuk unit kerja: <strong class="text-slate-800">${opd.nama}</strong> pada periode <strong class="text-indigo-600">${selectedBulan} ${selectedYear}</strong>.</p>
                <p class="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-medium">Silakan unggah berkas master data SKP e-Kinerja terlebih dahulu melalui menu <strong>Master Data</strong>.</p>
            </div>`,
            icon: 'warning',
            confirmText: 'Tutup'
        });
        return;
    }

    // Standar Penamaan File: Laporan_Data SKP_Nama Opd_Bulan_Tahun.xlsx
    const cleanOpdName = opd.nama.replace(/[/\\?%*:|"<>]/g, '-').trim();
    const fileName = `Laporan_Data SKP_${cleanOpdName}_${selectedBulan}_${selectedYear}.xlsx`;

    // 1. Prioritaskan ExcelJS untuk clone 100% persis template "Format Rekap SKP per OPD.xlsx"
    if (window.ExcelJS) {
        try {
            showToast('Sedang menyusun data SKP sesuai template...', 'info');
            const wb = new window.ExcelJS.Workbook();
            const ws = wb.addWorksheet('Sheet3', {
                views: [{ showGridLines: true }]
            });

            // Lebar kolom persis 100% template
            ws.columns = [
                { key: 'no', width: 5.1 },
                { key: 'nip', width: 20.6 },
                { key: 'nama', width: 33.6 },
                { key: 'golru', width: 13.8 },
                { key: 'jabatan', width: 70.8 },
                { key: 'unor', width: 32.8 },
                { key: 'jenis', width: 18.1 },
                { key: 'skp', width: 21.7 },
                { key: 'ket', width: 9.3 }
            ];

            // Baris 1: Kosong (sesuai template)
            // Baris 2: Judul Dokumen (Merge A2:I2, Arial Narrow 16pt Bold, Center)
            ws.mergeCells('A2:I2');
            const titleCell = ws.getCell('A2');
            titleCell.value = `LAPORAN HASIL PENILAIAN KINERJA (SKP) ASN ${selectedBulan.toUpperCase()} TAHUN ${selectedYear}`;
            titleCell.font = { name: 'Arial Narrow', size: 16, bold: true };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

            // Baris 3: Kosong dengan border bawah tipis
            for (let c = 1; c <= 9; c++) {
                ws.getRow(3).getCell(c).border = {
                    bottom: { style: 'thin' }
                };
            }

            // Baris 4: Header Tabel (Tinggi: 37.5, Arial Narrow 12pt Bold, Fill #D6DCE4, Center Middle Wrap)
            const headerRow = ws.getRow(4);
            headerRow.height = 37.5;
            headerRow.values = [
                'NO', 'NIP', 'NAMA', 'GOL. RUANG', 'JABATAN', 'SATUAN KERJA', 'JENIS ASN', 'NILAI SKP', 'KET'
            ];
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Arial Narrow', size: 12, bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD6DCE4' }
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Baris 5 dst: Data ASN Nominatif
            let curRow = 5;
            records.forEach((r, i) => {
                let jenis = (r.jenis_pegawai || r.status_pegawai || 'PNS').toUpperCase();
                if (jenis.includes('PARUH') || jenis.includes('DW') || jenis.includes('PW')) {
                    jenis = 'PPPK PW';
                } else if (jenis.includes('PPPK')) {
                    jenis = 'PPPK';
                } else {
                    jenis = 'PNS';
                }

                const nilaiSkp = (r.hasil_akhir || r.predikat_kinerja || 'Tidak Membuat SKP').toUpperCase();
                let ket = '';
                if (r.is_skp_plt_plh_pjb && r.is_skp_plt_plh_pjb !== '0' && r.is_skp_plt_plh_pjb !== 0) {
                    ket = 'PLT/PLH';
                }

                const dataRow = ws.getRow(curRow);
                dataRow.height = 20;
                dataRow.values = [
                    i + 1,
                    String(r.nip || ''),
                    r.nama || r.nama_pegawai || '',
                    r.golru || '',
                    r.skp_jabatan || '',
                    r.skp_unor || opd.nama,
                    jenis,
                    nilaiSkp,
                    ket
                ];

                // Formatting cell persis template
                // Col 1 (NO): Arial Narrow 12pt, Center
                dataRow.getCell(1).font = { name: 'Arial Narrow', size: 12 };
                dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

                // Col 2 to 9: Calibri 12pt
                for (let c = 2; c <= 9; c++) {
                    const cell = dataRow.getCell(c);
                    cell.font = { name: 'Calibri', size: 12 };
                    if (c === 4 || c === 7 || c === 8) {
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    } else {
                        cell.alignment = { vertical: 'middle' };
                    }
                }

                // NIP as text
                dataRow.getCell(2).numFmt = '@';

                // Thin border all around
                for (let c = 1; c <= 9; c++) {
                    dataRow.getCell(c).border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }

                curRow++;
            });

            // Simpan file Excel ke browser
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            showToast('Data SKP berhasil diunduh sesuai template!', 'success');
            return;
        } catch (err) {
            console.error('ExcelJS data export failed, fallback to SheetJS:', err);
        }
    }

    // Fallback SheetJS
    if (!window.XLSX) return;
    const aoa = [
        [],
        [`LAPORAN HASIL PENILAIAN KINERJA (SKP) ASN ${selectedBulan.toUpperCase()} TAHUN ${selectedYear}`],
        [],
        [
            'NO',
            'NIP',
            'NAMA',
            'GOL. RUANG',
            'JABATAN',
            'SATUAN KERJA',
            'JENIS ASN',
            'NILAI SKP',
            'KET'
        ]
    ];

    records.forEach((r, i) => {
        let jenis = (r.jenis_pegawai || r.status_pegawai || 'PNS').toUpperCase();
        if (jenis.includes('PARUH') || jenis.includes('DW') || jenis.includes('PW')) {
            jenis = 'PPPK PW';
        } else if (jenis.includes('PPPK')) {
            jenis = 'PPPK';
        } else {
            jenis = 'PNS';
        }

        const nilaiSkp = (r.hasil_akhir || r.predikat_kinerja || 'Tidak Membuat SKP').toUpperCase();
        let ket = '';
        if (r.is_skp_plt_plh_pjb && r.is_skp_plt_plh_pjb !== '0' && r.is_skp_plt_plh_pjb !== 0) {
            ket = 'PLT/PLH';
        }

        aoa.push([
            i + 1,
            String(r.nip || ''),
            r.nama || r.nama_pegawai || '',
            r.golru || '',
            r.skp_jabatan || '',
            r.skp_unor || opd.nama,
            jenis,
            nilaiSkp,
            ket
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = [{ s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }];
    ws['!cols'] = [
        { wch: 5.1 },
        { wch: 20.6 },
        { wch: 33.6 },
        { wch: 13.8 },
        { wch: 70.8 },
        { wch: 32.8 },
        { wch: 18.1 },
        { wch: 21.7 },
        { wch: 9.3 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet3");
    XLSX.writeFile(wb, fileName);
    showToast('Data SKP berhasil diunduh!', 'success');
}

async function unduhRekapOpdExcel() {
    window.unduhRekapOpdExcel = unduhRekapOpdExcel;
    const select = document.getElementById('opd-single-select');

    let opdId = (USER_LEVEL === 2 && USER_OPD_ID) ? USER_OPD_ID : (select?.value || 'BKPSDM');
    const selectedYear = parseInt(document.getElementById('opd-filter-tahun')?.value || 2026);
    const selectedBulan = document.getElementById('opd-filter-bulan')?.value || 'JULI';
    const opd = MASTER_OPD_LIST.find(o => o.id === opdId) || { id: opdId, nama: (USER_LEVEL === 2 ? USER_OPD_NAME : opdId), kategori: 'DINAS' };

    const localList = getLocalRekapList();
    const opdData = localList.find(item => item.opd_id === opdId && item.bulan === selectedBulan && parseInt(item.tahun) === selectedYear);

    const pnsCount = opdData ? (opdData.pns || 0) : 0;
    const pppkCount = opdData ? (opdData.pppk || 0) : 0;
    const pppkPwCount = opdData ? (opdData.pppk_dw || 0) : 0;
    const totalPegawai = pnsCount + pppkCount + pppkPwCount;

    const sangatBaik = opdData ? (opdData.sangat_baik || 0) : 0;
    const baik = opdData ? (opdData.baik || 0) : 0;
    const butuhPerbaikan = opdData ? (opdData.butuh_perbaikan || 0) : 0;
    const kurang = opdData ? (opdData.kurang || 0) : 0;
    const sangatKurang = opdData ? (opdData.sangat_kurang || 0) : 0;
    const tidakMembuat = opdData ? (opdData.tidak_membuat_skp || 0) : 0;
    const totalSkp = sangatBaik + baik + butuhPerbaikan + kurang + sangatKurang + tidakMembuat;

    const cleanOpdName = opd.nama.replace(/[/\\?%*:|"<>]/g, '-').trim();
    const fileName = `Laporan_Rekap Statistik_${cleanOpdName}_${selectedBulan}_${selectedYear}.xlsx`;

    // 1. Ekspor Menggunakan ExcelJS (Format Kedinasan Profesional dengan Logo & Styling)
    if (window.ExcelJS) {
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'SIMONIKA - BKPSDM Kab. Aceh Timur';
            workbook.created = new Date();

            const ws = workbook.addWorksheet('Rekap Statistik SKP', {
                views: [{ showGridLines: true }]
            });

            // Set Lebar Kolom
            ws.columns = [
                { width: 6 },   // A (Margin Logo / No)
                { width: 55 },  // B (Kategori / Keterangan)
                { width: 22 },  // C (Jumlah Pegawai / Nilai)
                { width: 16 }   // D (Persentase)
            ];

            // Tambahkan Logo Aceh Timur jika tersedia
            if (typeof LOGO_ACEH_TIMUR_BASE64 !== 'undefined' && LOGO_ACEH_TIMUR_BASE64) {
                try {
                    const imageId = workbook.addImage({
                        base64: LOGO_ACEH_TIMUR_BASE64,
                        extension: 'png',
                    });
                    ws.addImage(imageId, {
                        tl: { col: 0.15, row: 0.6 },
                        ext: { width: 55, height: 68 }
                    });
                } catch (e) {
                    console.warn('Gagal menyisipkan logo pada rekap statistik:', e);
                }
            }

            // Kop Surat / Judul Laporan
            ws.mergeCells('B1:D1');
            const row1 = ws.getCell('B1');
            row1.value = 'PEMERINTAH KABUPATEN ACEH TIMUR';
            row1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF1E293B' } };
            row1.alignment = { vertical: 'middle', horizontal: 'center' };

            ws.mergeCells('B2:D2');
            const row2 = ws.getCell('B2');
            row2.value = 'REKAPITULASI PENILAIAN CAPAIAN KINERJA (SKP) ASN';
            row2.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0F172A' } };
            row2.alignment = { vertical: 'middle', horizontal: 'center' };

            ws.mergeCells('B3:D3');
            const row3 = ws.getCell('B3');
            row3.value = `UNIT KERJA: ${opd.nama.toUpperCase()}`;
            row3.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF334155' } };
            row3.alignment = { vertical: 'middle', horizontal: 'center' };

            ws.mergeCells('B4:D4');
            const row4 = ws.getCell('B4');
            row4.value = `PERIODE PENILAIAN: BULAN ${selectedBulan.toUpperCase()} TAHUN ${selectedYear}`;
            row4.font = { name: 'Arial', size: 10, italic: true, bold: true, color: { argb: 'FF475569' } };
            row4.alignment = { vertical: 'middle', horizontal: 'center' };

            // Garis Pembatas Kop
            for (let c = 1; c <= 4; c++) {
                ws.getCell(4, c).border = {
                    bottom: { style: 'double', color: { argb: 'FF000000' } }
                };
            }

            let currentRow = 6;

            const applyThinBorder = (cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                };
            };

            // ================= TABEL 1: KOMPOSISI PEGAWAI =================
            ws.mergeCells(`A${currentRow}:D${currentRow}`);
            const titleTab1 = ws.getCell(`A${currentRow}`);
            titleTab1.value = 'I. KOMPOSISI JUMLAH PEGAWAI ASN';
            titleTab1.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
            currentRow++;

            // Header Tabel 1
            const h1No = ws.getCell(`A${currentRow}`);
            h1No.value = 'NO';
            const h1Kat = ws.getCell(`B${currentRow}`);
            h1Kat.value = 'JENIS / STATUS PEGAWAI';
            const h1Jml = ws.getCell(`C${currentRow}`);
            h1Jml.value = 'JUMLAH (ORANG)';
            const h1Pct = ws.getCell(`D${currentRow}`);
            h1Pct.value = 'PERSENTASE';

            [h1No, h1Kat, h1Jml, h1Pct].forEach(cell => {
                cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6DCE4' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                applyThinBorder(cell);
            });
            ws.getRow(currentRow).height = 24;
            currentRow++;

            // Data Pegawai
            const pegawaiRows = [
                { no: 1, label: 'Pegawai Negeri Sipil (PNS)', val: pnsCount },
                { no: 2, label: 'PPPK Penuh Waktu', val: pppkCount },
                { no: 3, label: 'PPPK Paruh Waktu (PPPK PW)', val: pppkPwCount }
            ];

            pegawaiRows.forEach(item => {
                const cNo = ws.getCell(`A${currentRow}`);
                cNo.value = item.no;
                cNo.alignment = { vertical: 'middle', horizontal: 'center' };

                const cKat = ws.getCell(`B${currentRow}`);
                cKat.value = item.label;
                cKat.alignment = { vertical: 'middle', horizontal: 'left' };

                const cJml = ws.getCell(`C${currentRow}`);
                cJml.value = item.val;
                cJml.alignment = { vertical: 'middle', horizontal: 'center' };

                const cPct = ws.getCell(`D${currentRow}`);
                const pct = totalPegawai > 0 ? ((item.val / totalPegawai) * 100).toFixed(1) + '%' : '0.0%';
                cPct.value = pct;
                cPct.alignment = { vertical: 'middle', horizontal: 'center' };

                [cNo, cKat, cJml, cPct].forEach(cell => {
                    cell.font = { name: 'Calibri', size: 11 };
                    applyThinBorder(cell);
                });
                ws.getRow(currentRow).height = 20;
                currentRow++;
            });

            // Total Pegawai Row
            const totNo = ws.getCell(`A${currentRow}`);
            totNo.value = '';
            const totKat = ws.getCell(`B${currentRow}`);
            totKat.value = 'TOTAL PEGAWAI';
            const totJml = ws.getCell(`C${currentRow}`);
            totJml.value = totalPegawai;
            const totPct = ws.getCell(`D${currentRow}`);
            totPct.value = totalPegawai > 0 ? '100%' : '0%';

            [totNo, totKat, totJml, totPct].forEach(cell => {
                cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                applyThinBorder(cell);
            });
            totKat.alignment = { vertical: 'middle', horizontal: 'left' };
            ws.getRow(currentRow).height = 22;
            currentRow += 2;

            // ================= TABEL 2: CAPAIAN KINERJA SKP =================
            ws.mergeCells(`A${currentRow}:D${currentRow}`);
            const titleTab2 = ws.getCell(`A${currentRow}`);
            titleTab2.value = 'II. DISTRIBUSI HASIL PENILAIAN KINERJA (PREDIKAT SKP)';
            titleTab2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
            currentRow++;

            // Header Tabel 2
            const h2No = ws.getCell(`A${currentRow}`);
            h2No.value = 'NO';
            const h2Kat = ws.getCell(`B${currentRow}`);
            h2Kat.value = 'PREDIKAT KINERJA PEGAWAI';
            const h2Jml = ws.getCell(`C${currentRow}`);
            h2Jml.value = 'JUMLAH PEGAWAI';
            const h2Pct = ws.getCell(`D${currentRow}`);
            h2Pct.value = 'PERSENTASE';

            [h2No, h2Kat, h2Jml, h2Pct].forEach(cell => {
                cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6DCE4' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                applyThinBorder(cell);
            });
            ws.getRow(currentRow).height = 24;
            currentRow++;

            // Data Predikat SKP
            const predikatRows = [
                { no: 1, label: 'Sangat Baik', val: sangatBaik },
                { no: 2, label: 'Baik', val: baik },
                { no: 3, label: 'Butuh Perbaikan', val: butuhPerbaikan },
                { no: 4, label: 'Kurang', val: kurang },
                { no: 5, label: 'Sangat Kurang', val: sangatKurang },
                { no: 6, label: 'Tidak Membuat SKP', val: tidakMembuat }
            ];

            predikatRows.forEach(item => {
                const cNo = ws.getCell(`A${currentRow}`);
                cNo.value = item.no;
                cNo.alignment = { vertical: 'middle', horizontal: 'center' };

                const cKat = ws.getCell(`B${currentRow}`);
                cKat.value = item.label;
                cKat.alignment = { vertical: 'middle', horizontal: 'left' };

                const cJml = ws.getCell(`C${currentRow}`);
                cJml.value = item.val;
                cJml.alignment = { vertical: 'middle', horizontal: 'center' };

                const cPct = ws.getCell(`D${currentRow}`);
                const baseTot = totalSkp > 0 ? totalSkp : totalPegawai;
                const pct = baseTot > 0 ? ((item.val / baseTot) * 100).toFixed(1) + '%' : '0.0%';
                cPct.value = pct;
                cPct.alignment = { vertical: 'middle', horizontal: 'center' };

                [cNo, cKat, cJml, cPct].forEach(cell => {
                    cell.font = { name: 'Calibri', size: 11 };
                    applyThinBorder(cell);
                });
                ws.getRow(currentRow).height = 20;
                currentRow++;
            });

            // Total Predikat Row
            const totSkpNo = ws.getCell(`A${currentRow}`);
            totSkpNo.value = '';
            const totSkpKat = ws.getCell(`B${currentRow}`);
            totSkpKat.value = 'TOTAL DATA SKP';
            const totSkpJml = ws.getCell(`C${currentRow}`);
            totSkpJml.value = totalSkp;
            const totSkpPct = ws.getCell(`D${currentRow}`);
            totSkpPct.value = totalSkp > 0 ? '100%' : '0%';

            [totSkpNo, totSkpKat, totSkpJml, totSkpPct].forEach(cell => {
                cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                applyThinBorder(cell);
            });
            totSkpKat.alignment = { vertical: 'middle', horizontal: 'left' };
            ws.getRow(currentRow).height = 22;
            currentRow += 2;

            // Keterangan / Footer Unduh
            ws.mergeCells(`B${currentRow}:D${currentRow}`);
            const tglCell = ws.getCell(`B${currentRow}`);
            tglCell.value = `Diunduh melalui SIMONIKA pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
            tglCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
            tglCell.alignment = { horizontal: 'right' };

            // Generate file buffer & trigger download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            showToast('Laporan Rekap Statistik berhasil diunduh!', 'success');
            return;
        } catch (err) {
            console.error('ExcelJS rekap statistik export failed, fallback to SheetJS:', err);
        }
    }

    // Fallback SheetJS jika ExcelJS tidak tersedia
    if (!window.XLSX) return;
    const aoa = [
        ["REKAPITULASI PENILAIAN CAPAIAN KINERJA SKP ASN"],
        ["PEMERINTAH KABUPATEN ACEH TIMUR"],
        [`UNIT KERJA: ${opd.nama}`],
        [`PERIODE: ${selectedBulan} ${selectedYear}`],
        [],
        ["Kategori Pegawai / Predikat", "Jumlah Pegawai"],
        ["PNS", pnsCount],
        ["PPPK", pppkCount],
        ["PPPK PW", pppkPwCount],
        ["TOTAL PEGAWAI", totalPegawai],
        [],
        ["Predikat Sangat Baik", sangatBaik],
        ["Predikat Baik", baik],
        ["Predikat Butuh Perbaikan", butuhPerbaikan],
        ["Predikat Kurang", kurang],
        ["Predikat Sangat Kurang", sangatKurang],
        ["Tidak Membuat SKP", tidakMembuat]
    ];

    const wsFallback = XLSX.utils.aoa_to_sheet(aoa);
    wsFallback['!cols'] = [
        { wch: 55 },
        { wch: 18 }
    ];

    const wbFallback = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbFallback, wsFallback, "Rekap SKP OPD");
    XLSX.writeFile(wbFallback, fileName);
    showToast('Laporan Rekap Statistik berhasil diunduh!', 'success');
}

function renderOpdList() {
    const container = document.getElementById('opdListContainer');
    if (!container) return;

    const selectedYear = parseInt(document.getElementById('opd-filter-tahun')?.value || 2026);
    const selectedBulan = document.getElementById('opd-filter-bulan')?.value || 'JULI';
    const searchQuery = (document.getElementById('searchOPD')?.value || '').toLowerCase().trim();

    const localList = getLocalRekapList();
    const filledList = localList.filter(item => item.bulan === selectedBulan && parseInt(item.tahun) === selectedYear);

    const filledMap = {};
    filledList.forEach(item => {
        filledMap[item.opd_id] = item;
    });

    // Level 2: Strict filter on user OPD only
    let filtered = [];
    if (USER_LEVEL === 2 && USER_OPD_ID) {
        filtered = MASTER_OPD_LIST.filter(opd => opd.id === USER_OPD_ID);
    } else {
        filtered = MASTER_OPD_LIST.filter(opd => {
            return opd.nama.toLowerCase().includes(searchQuery) || opd.id.toLowerCase().includes(searchQuery);
        }).sort((a, b) => a.nama.localeCompare(b.nama));
    }

    container.innerHTML = '';
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-6 text-center">
                <span class="text-xl mb-1">🔍</span>
                <p class="text-xs font-semibold text-slate-400">Unit kerja tidak ditemukan</p>
            </div>
        `;
        return;
    }

    filtered.forEach(opd => {
        const itemData = filledMap[opd.id];
        const isUploaded = !!itemData;
        const filename = itemData?.nama_file || '';
        const itemDiv = document.createElement('div');
        itemDiv.className = `flex items-center justify-between p-3.5 ${isUploaded ? 'bg-slate-50/80 border-slate-200' : 'bg-white border-slate-200/60'} rounded-xl border transition-all hover:shadow-xs`;

        let statusHtml = '';
        if (isUploaded) {
            const totalPeg = (itemData.pns || 0) + (itemData.pppk || 0) + (itemData.pppk_dw || 0);
            statusHtml = `
                <p class="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1.5 truncate">
                    <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> Terisi (${formatNumber(totalPeg)} Pegawai) • ${filename}
                </p>
            `;
        } else {
            statusHtml = `
                <p class="text-[11px] text-rose-500 font-medium mt-0.5 flex items-center gap-1.5">
                    <span class="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Belum ada data
                </p>
            `;
        }

        itemDiv.innerHTML = `
            <div class="pr-3 overflow-hidden flex-1">
                <p class="font-bold text-slate-800 text-xs truncate">${opd.nama}</p>
                ${statusHtml}
            </div>
            <div class="shrink-0 flex items-center gap-2">
                <button onclick="pilihOpdDariList('${opd.id}')" class="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                    Lihat Detail
                </button>
            </div>
        `;
        container.appendChild(itemDiv);
    });
}

function pilihOpdDariList(opdId) {
    window.pilihOpdDariList = pilihOpdDariList;
    const select = document.getElementById('opd-single-select');
    if (select) {
        select.value = opdId;
        updateOpdCustomDropdownTriggerLabel();
        renderSelectedOpdDetail();
    }

    // Gulir halus sepenuhnya ke posisi paling atas halaman
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// MASTER DATASET BATCH IMPORTER (BKN / E-KINERJA)
// ==========================================
function initMasterDataEvents() {
    const dropzone = document.getElementById('master-dropzone');
    const fileInput = document.getElementById('master-file-input');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-indigo-600', 'bg-indigo-50/60');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-indigo-600', 'bg-indigo-50/60');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-indigo-600', 'bg-indigo-50/60');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processMasterDatasetExcel(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            processMasterDatasetExcel(files[0]);
        }
    });
}

function processMasterDatasetExcel(file) {
    const progressDiv = document.getElementById('master-parsing-progress');
    const progressBar = document.getElementById('master-progress-bar');
    const statusText = document.getElementById('master-progress-status');
    const percentText = document.getElementById('master-progress-pct');
    const resultDiv = document.getElementById('master-import-result');

    if (!progressDiv) return;

    progressDiv.classList.remove('hidden');
    if (resultDiv) resultDiv.classList.add('hidden');

    progressBar.style.width = '20%';
    percentText.textContent = '20%';
    statusText.textContent = 'Membaca berkas dataset SKP...';

    const reader = new FileReader();
    reader.onload = function (e) {
        progressBar.style.width = '45%';
        percentText.textContent = '45%';
        statusText.textContent = 'Mengurai baris pegawai & unit kerja...';

        setTimeout(async () => {
            try {
                if (!window.XLSX) throw new Error("SheetJS (XLSX) belum dimuat.");

                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];

                const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
                if (rawData.length === 0) throw new Error("Lembar kerja Excel kosong.");

                // Deteksi Bulan & Tahun dari header berkas (misal "Periode : Bulanan 5 Tahun 2026", "Juli 2026", dll)
                let detectedMonth = null;
                let detectedYear = null;

                for (let i = 0; i < Math.min(rawData.length, 10); i++) {
                    const lineStr = rawData[i].join(' ').toUpperCase();
                    if (lineStr.includes('PERIODE') || lineStr.includes('BULAN') || lineStr.includes('TAHUN')) {
                        if (lineStr.includes('BULANAN 5') || lineStr.includes('MEI')) detectedMonth = 'MEI';
                        else if (lineStr.includes('BULANAN 6') || lineStr.includes('JUNI')) detectedMonth = 'JUNI';
                        else if (lineStr.includes('BULANAN 7') || lineStr.includes('JULI')) detectedMonth = 'JULI';
                        else if (lineStr.includes('BULANAN 1') || lineStr.includes('JANUARI')) detectedMonth = 'JANUARI';
                        else if (lineStr.includes('BULANAN 2') || lineStr.includes('FEBRUARI')) detectedMonth = 'FEBRUARI';
                        else if (lineStr.includes('BULANAN 3') || lineStr.includes('MARET')) detectedMonth = 'MARET';
                        else if (lineStr.includes('BULANAN 4') || lineStr.includes('APRIL')) detectedMonth = 'APRIL';
                        else if (lineStr.includes('BULANAN 8') || lineStr.includes('AGUSTUS')) detectedMonth = 'AGUSTUS';
                        else if (lineStr.includes('BULANAN 9') || lineStr.includes('SEPTEMBER')) detectedMonth = 'SEPTEMBER';
                        else if (lineStr.includes('BULANAN 10') || lineStr.includes('OKTOBER')) detectedMonth = 'OKTOBER';
                        else if (lineStr.includes('BULANAN 11') || lineStr.includes('NOVEMBER')) detectedMonth = 'NOVEMBER';
                        else if (lineStr.includes('BULANAN 12') || lineStr.includes('DESEMBER')) detectedMonth = 'DESEMBER';

                        const yearMatch = lineStr.match(/\b(202[3-9])\b/);
                        if (yearMatch) detectedYear = parseInt(yearMatch[1]);
                    }
                }

                const currentSelectedMonth = document.getElementById('master-filter-bulan')?.value || 'JANUARI';
                const currentSelectedYear = parseInt(document.getElementById('master-filter-tahun')?.value || 2026);

                const finalMonth = detectedMonth || currentSelectedMonth;
                const finalYear = detectedYear || currentSelectedYear;

                // Cari baris tabel header
                let headerRowIndex = 0;
                for (let i = 0; i < Math.min(rawData.length, 15); i++) {
                    const rowLower = rawData[i].map(x => String(x).toLowerCase().trim());
                    if (rowLower.includes('nip') || rowLower.includes('skp_unor_induk') || rowLower.includes('satuan kerja') || rowLower.includes('unit kerja') || rowLower.includes('hasil_akhir') || rowLower.includes('predikat_skp')) {
                        headerRowIndex = i;
                        break;
                    }
                }

                const headers = rawData[headerRowIndex].map(h => String(h).trim().toLowerCase());
                const dataRows = rawData.slice(headerRowIndex + 1).filter(r => r.some(v => v !== ""));

                // Kolom indices
                let nipIdx = -1;
                let namaIdx = -1;
                let unorIdx = -1;
                let unorIndukIdx = -1;
                let jabatanIdx = -1;
                let hasilKerjaIdx = -1;
                let perilakuIdx = -1;
                let predikatIdx = -1;
                let statusIdx = -1;
                let golruIdx = -1;
                let jenisJabatanIdx = -1;
                let pltIdx = -1;

                headers.forEach((h, idx) => {
                    if (nipIdx === -1 && h.includes('nip')) nipIdx = idx;
                    if (namaIdx === -1 && h.includes('nama') && !h.includes('unor')) namaIdx = idx;
                    if (unorIdx === -1 && (h === 'skp_unor' || h.includes('satuan kerja') || h.includes('unit kerja') || h === 'unit')) unorIdx = idx;
                    if (unorIndukIdx === -1 && (h.includes('unor_induk') || h.includes('induk'))) unorIndukIdx = idx;
                    if (jabatanIdx === -1 && (h.includes('jabatan') && !h.includes('jenis'))) jabatanIdx = idx;
                    if (hasilKerjaIdx === -1 && h.includes('hasil_kerja')) hasilKerjaIdx = idx;
                    if (perilakuIdx === -1 && h.includes('perilaku')) perilakuIdx = idx;
                    if (predikatIdx === -1 && (h.includes('hasil_akhir') || h.includes('predikat_skp') || h.includes('hasil akhir') || h.includes('predikat'))) predikatIdx = idx;
                    if (statusIdx === -1 && (h.includes('jenis_pegawai') || h.includes('status'))) statusIdx = idx;
                    if (golruIdx === -1 && (h.includes('golru') || h.includes('golongan'))) golruIdx = idx;
                    if (jenisJabatanIdx === -1 && h.includes('jenis_jabatan')) jenisJabatanIdx = idx;
                    if (pltIdx === -1 && (h.includes('plt') || h.includes('plh') || h.includes('pjb'))) pltIdx = idx;
                });

                if (unorIdx === -1 && unorIndukIdx !== -1) unorIdx = unorIndukIdx;
                if (unorIndukIdx === -1 && unorIdx !== -1) unorIndukIdx = unorIdx;

                if (unorIdx === -1) {
                    throw new Error("Kolom Unit Kerja / Satuan Kerja / UNOR Induk tidak ditemukan di dataset.");
                }

                progressBar.style.width = '70%';
                percentText.textContent = '70%';
                statusText.textContent = `Memetakan & memilah ${dataRows.length} ASN ke 61 OPD...`;

                // Agregasi per OPD & Koleksi Data Mentah ASN Terpilah
                const opdAggregates = {};
                const allAsnRecords = [];
                let mappedCount = 0;

                dataRows.forEach((row, rowIdx) => {
                    const unorText = unorIdx !== -1 ? String(row[unorIdx] || '').trim() : '';
                    const unorIndukText = unorIndukIdx !== -1 ? String(row[unorIndukIdx] || '').trim() : '';
                    const jabatanText = jabatanIdx !== -1 ? String(row[jabatanIdx] || '').trim() : '';

                    if (!unorText && !unorIndukText) return;

                    const matchedOpd = matchOpdFromText(unorIndukText, unorText, jabatanText);
                    if (!matchedOpd) return;

                    const opdId = matchedOpd.id;
                    if (!opdAggregates[opdId]) {
                        opdAggregates[opdId] = {
                            opd_id: opdId,
                            bulan: finalMonth,
                            tahun: finalYear,
                            pns: 0,
                            pppk: 0,
                            pppk_dw: 0,
                            sangat_baik: 0,
                            baik: 0,
                            butuh_perbaikan: 0,
                            kurang: 0,
                            sangat_kurang: 0,
                            tidak_membuat_skp: 0,
                            nama_file: file.name
                        };
                    }

                    mappedCount++;
                    const target = opdAggregates[opdId];

                    // Deteksi Status Kepegawaian (PNS / PPPK / PPPK PW)
                    const statusVal = statusIdx !== -1 ? String(row[statusIdx] || '').toLowerCase() : 'pns';
                    const golruVal = golruIdx !== -1 ? String(row[golruIdx] || '').toLowerCase() : '';

                    if (statusVal.includes('pppk') && (statusVal.includes('paruh') || statusVal.includes('dw') || statusVal.includes('pw') || golruVal.includes('paruh'))) {
                        target.pppk_dw++;
                    } else if (statusVal.includes('pppk')) {
                        target.pppk++;
                    } else {
                        target.pns++;
                    }

                    // Deteksi Predikat Kinerja
                    const predVal = predikatIdx !== -1 ? String(row[predikatIdx] || '').toLowerCase() : '';
                    if (predVal.includes('sangat baik') || predVal.includes('diatas') || predVal.includes('istimewa')) {
                        target.sangat_baik++;
                    } else if (predVal.includes('sangat kurang') || predVal.includes('sangat buruk')) {
                        target.sangat_kurang++;
                    } else if (predVal.includes('kurang') || predVal.includes('dibawah')) {
                        target.kurang++;
                    } else if (predVal.includes('perbaikan') || predVal.includes('butuh')) {
                        target.butuh_perbaikan++;
                    } else if (predVal.includes('baik') || predVal.includes('sesuai')) {
                        target.baik++;
                    } else {
                        target.tidak_membuat_skp++;
                    }

                    // Simpan Baris Lengkap ASN Terpilah
                    allAsnRecords.push({
                        opd_id: opdId,
                        bulan: finalMonth,
                        tahun: parseInt(finalYear),
                        no: rowIdx + 1,
                        nip: nipIdx !== -1 ? String(row[nipIdx] || '').trim() : '',
                        nama: namaIdx !== -1 ? String(row[namaIdx] || '').trim() : '',
                        skp_unor: unorText || matchedOpd.nama,
                        skp_unor_induk: unorIndukText || matchedOpd.nama,
                        skp_jabatan: jabatanText,
                        hasil_kerja: hasilKerjaIdx !== -1 ? String(row[hasilKerjaIdx] || '').trim() : '',
                        perilaku_kerja: perilakuIdx !== -1 ? String(row[perilakuIdx] || '').trim() : '',
                        hasil_akhir: predVal || 'Tidak membuat SKP',
                        golru: golruIdx !== -1 ? String(row[golruIdx] || '').trim() : '',
                        jenis_pegawai: statusVal,
                        skp_jenis_jabatan: jenisJabatanIdx !== -1 ? String(row[jenisJabatanIdx] || '').trim() : '',
                        is_skp_plt_plh_pjb: pltIdx !== -1 ? String(row[pltIdx] || '').trim() : '0'
                    });
                });

                const updatedOpdCount = Object.keys(opdAggregates).length;
                if (updatedOpdCount === 0) {
                    throw new Error("Tidak ada unit kerja yang cocok dengan master 61 OPD.");
                }

                // Simpan Agregat ke Local Storage
                Object.values(opdAggregates).forEach(payload => {
                    upsertLocalRekap(payload);
                });

                // Simpan Seluruh Rincian Baris ASN ke IndexedDB
                await saveAsnRecordsBatch(allAsnRecords, finalMonth, finalYear);
                console.log(`Berhasil menyimpan ${allAsnRecords.length} baris nominatif ASN ke IndexedDB.`);

                // Simpan ke Supabase Cloud Database jika terhubung
                if (supabaseClient) {
                    try {
                        progressBar.style.width = '75%';
                        percentText.textContent = '75%';
                        statusText.textContent = 'Menyinkronkan rekapitulasi ke Cloud Supabase...';

                        const rekapRows = Object.values(opdAggregates).map(item => ({
                            opd_id: item.opd_id,
                            bulan: item.bulan,
                            tahun: parseInt(item.tahun),
                            pns: parseInt(item.pns || 0),
                            pppk: parseInt(item.pppk || 0),
                            pppk_dw: parseInt(item.pppk_dw || 0),
                            sangat_baik: parseInt(item.sangat_baik || 0),
                            baik: parseInt(item.baik || 0),
                            butuh_perbaikan: parseInt(item.butuh_perbaikan || 0),
                            kurang: parseInt(item.kurang || 0),
                            sangat_kurang: parseInt(item.sangat_kurang || 0),
                            tidak_membuat_skp: parseInt(item.tidak_membuat_skp || 0),
                            nama_file: file.name,
                            updated_at: new Date().toISOString()
                        }));

                        const { error: rekapErr } = await supabaseClient
                            .from('skp_rekap_bulanan')
                            .upsert(rekapRows, { onConflict: 'opd_id,bulan,tahun' });

                        if (rekapErr) {
                            console.warn("Supabase upsert rekap notice:", rekapErr.message || rekapErr);
                        }

                        progressBar.style.width = '85%';
                        percentText.textContent = '85%';
                        statusText.textContent = 'Menyinkronkan nominatif ASN ke Cloud Supabase...';

                        // Bersihkan baris detail periode ini sebelum menimpa data baru
                        await supabaseClient
                            .from('skp_detail_pegawai')
                            .delete()
                            .eq('bulan', finalMonth)
                            .eq('tahun', parseInt(finalYear));

                        const chunkSize = 500;
                        const mappedDetail = allAsnRecords.map(r => ({
                            nip: r.nip,
                            nama_pegawai: r.nama,
                            opd_id: r.opd_id,
                            bulan: r.bulan,
                            tahun: parseInt(r.tahun),
                            predikat_kinerja: r.hasil_akhir,
                            hasil_kerja: r.hasil_kerja,
                            perilaku_kerja: r.perilaku_kerja,
                            skp_jabatan: r.skp_jabatan,
                            skp_unor: r.skp_unor,
                            golru: r.golru,
                            status_pegawai: r.jenis_pegawai,
                            skp_jenis_jabatan: r.skp_jenis_jabatan,
                            is_skp_plt_plh_pjb: r.is_skp_plt_plh_pjb,
                            nama_file: file.name
                        }));

                        for (let i = 0; i < mappedDetail.length; i += chunkSize) {
                            const chunk = mappedDetail.slice(i, i + chunkSize);
                            const { error: chunkErr } = await supabaseClient
                                .from('skp_detail_pegawai')
                                .insert(chunk);
                            if (chunkErr) {
                                console.warn("Supabase insert detail chunk error:", chunkErr);
                                break;
                            }
                        }
                        console.log("SIMONIKA: Berhasil sinkronisasi master dataset ke Cloud Supabase.");
                    } catch (supSyncErr) {
                        console.warn("Gagal sinkronisasi data ke Cloud Supabase:", supSyncErr);
                    }
                }

                // Sinkronisasi Filter Bulan & Tahun jika berubah
                const filterBulan = document.getElementById('filter-bulan');
                const filterTahun = document.getElementById('filter-tahun');
                if (filterBulan && finalMonth) filterBulan.value = finalMonth;
                if (filterTahun && finalYear) filterTahun.value = finalYear;

                syncAllFilters(finalMonth, finalYear);

                progressBar.style.width = '100%';
                percentText.textContent = '100%';
                statusText.textContent = 'Selesai!';

                if (resultDiv) {
                    resultDiv.classList.remove('hidden');
                    document.getElementById('master-result-title').textContent = `Impor & Pemilahan Dataset ${finalMonth} ${finalYear} Berhasil!`;
                    document.getElementById('master-result-desc').textContent = `Sebanyak ${formatNumber(mappedCount)} ASN berhasil dipilah dan disimpan untuk ${updatedOpdCount} OPD.`;
                }

                populateFilters();
                refreshAllData();
                simonikaAlert({
                    title: 'Impor & Pemilahan Berhasil!',
                    html: `
                        <div class="text-left space-y-3 mt-2 text-xs">
                            <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                                <span class="text-slate-600 font-medium">Periode Dataset:</span>
                                <strong class="text-emerald-700 font-bold">${finalMonth} ${finalYear}</strong>
                            </div>
                            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                <span class="text-slate-600 font-medium">Total Pegawai Terpilah:</span>
                                <strong class="text-slate-900 font-bold text-sm">${formatNumber(mappedCount)} ASN</strong>
                            </div>
                            <div class="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                                <span class="text-slate-600 font-medium">Unit Kerja Terbarui:</span>
                                <strong class="text-indigo-700 font-bold">${updatedOpdCount} OPD & Kecamatan</strong>
                            </div>
                            <p class="text-[11px] text-slate-400 italic text-center pt-1">
                                Seluruh data dan grafik predikat telah diperbarui. Setiap Operator OPD kini dapat langsung mengunduh nominatif unit kerjanya.
                            </p>
                        </div>
                    `,
                    icon: 'success',
                    confirmText: 'Buka Dashboard'
                }).then(() => {
                    switchView('dashboard');
                });

            } catch (err) {
                console.error("Gagal memproses dataset:", err);
                simonikaAlert({
        title: 'Gagal Memproses Dataset',
        html: `<div class="text-left text-xs text-slate-600 space-y-2">
            <p>Terjadi kendala saat membaca dan mengurai berkas dataset spreadsheet:</p>
            <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-mono text-[11px]">
                ${err.message || 'Format berkas tidak sesuai.'}
            </div>
            <p class="text-slate-400 italic text-[10px]">Pastikan berkas berformat .xlsx, .xls, atau .csv standar hasil ekspor BKN e-Kinerja.</p>
        </div>`,
        icon: 'error',
        confirmText: 'Tutup'
    });
                progressDiv.classList.add('hidden');
            }
        }, 300);
    };
    reader.readAsArrayBuffer(file);
}

function syncAllFilters(month, year) {
    const viewMonthSelectors = ['filter-bulan', 'opd-filter-bulan', 'laporan-filter-bulan'];
    const masterMonthSelector = 'master-filter-bulan';
    const yearSelectors = ['filter-tahun', 'opd-filter-tahun', 'master-filter-tahun', 'laporan-filter-tahun'];

    viewMonthSelectors.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (month) {
                const hasOption = Array.from(el.options).some(o => o.value === month && !o.disabled);
                if (hasOption) el.value = month;
            } else {
                el.value = '';
            }
        }
    });

    const masterEl = document.getElementById(masterMonthSelector);
    if (masterEl && month) {
        masterEl.value = month;
    }

    yearSelectors.forEach(id => {
        const el = document.getElementById(id);
        if (el && year) el.value = year;
    });
}

// ==========================================
// RENDER LAPORAN BULANAN (WEB & PRINT VIEW)
// ==========================================
function renderLaporanBulanan() {
    const selectedYear = parseInt(document.getElementById('laporan-filter-tahun')?.value || 2026);
    const selectedBulan = document.getElementById('laporan-filter-bulan')?.value || 'JULI';

    const webSubtitle = document.getElementById('laporan-web-subtitle');
    if (webSubtitle) webSubtitle.textContent = `${selectedBulan} ${selectedYear}`;

    const printPeriod = document.getElementById('laporan-print-period');
    if (printPeriod) printPeriod.textContent = `PERIODE BULAN: ${selectedBulan} TAHUN: ${selectedYear}`;

    const printSigDate = document.getElementById('print-sig-date');
    if (printSigDate) {
        const monthTitle = selectedBulan.charAt(0) + selectedBulan.slice(1).toLowerCase();
        printSigDate.textContent = `Idi,       ${monthTitle} ${selectedYear}`;
    }

    const tableBody = document.getElementById('laporan-table-body');
    const printTableBody = document.getElementById('laporan-print-table-body');
    if (!tableBody || !printTableBody) return;

    const localList = getLocalRekapList();
    const filledList = localList.filter(item => item.bulan === selectedBulan && parseInt(item.tahun) === selectedYear);

    const filledMap = {};
    filledList.forEach(item => {
        filledMap[item.opd_id] = item;
    });

    tableBody.innerHTML = '';
    printTableBody.innerHTML = '';

    let totalOpdFilled = 0;
    let totalPegawaiAcc = 0;
    let totalSangatBaikAcc = 0;
    let totalBaikAcc = 0;
    let totalButuhPerbaikanAcc = 0;
    let totalKurangAcc = 0;
    let totalSangatKurangAcc = 0;
    let totalTidakMembuatSkpAcc = 0;

    let countPns = 0;
    let countPppk = 0;
    let countPppkPw = 0;

    // Filter daftar OPD yang ditampilkan (Jika Level 2: Hanya OPD sendiri)
    let opdListToRender = [];
    if (USER_LEVEL === 2 && USER_OPD_ID) {
        opdListToRender = MASTER_OPD_LIST.filter(o => o.id === USER_OPD_ID);
    } else {
        opdListToRender = MASTER_OPD_LIST.slice().sort((a, b) => a.nama.localeCompare(b.nama));
    }

    opdListToRender.forEach((opd, index) => {
        const dbData = filledMap[opd.id];
        const hasData = !!dbData;

        let totalPegawai = 0;
        let sangatBaik = 0;
        let baik = 0;
        let butuhPerbaikan = 0;
        let kurang = 0;
        let sangatKurang = 0;
        let tidakMembuatSkp = 0;

        if (hasData) {
            const pnsVal = parseInt(dbData.pns || 0);
            const pppkVal = parseInt(dbData.pppk || 0);
            const pppkPwVal = parseInt(dbData.pppk_dw || 0);
            totalPegawai = pnsVal + pppkVal + pppkPwVal;
            sangatBaik = parseInt(dbData.sangat_baik || 0);
            baik = parseInt(dbData.baik || 0);
            butuhPerbaikan = parseInt(dbData.butuh_perbaikan || 0);
            kurang = parseInt(dbData.kurang || 0);
            sangatKurang = parseInt(dbData.sangat_kurang || 0);
            tidakMembuatSkp = parseInt(dbData.tidak_membuat_skp || 0);

            countPns += pnsVal;
            countPppk += pppkVal;
            countPppkPw += pppkPwVal;

            totalOpdFilled++;
            totalPegawaiAcc += totalPegawai;
            totalSangatBaikAcc += sangatBaik;
            totalBaikAcc += baik;
            totalButuhPerbaikanAcc += butuhPerbaikan;
            totalKurangAcc += kurang;
            totalSangatKurangAcc += sangatKurang;
            totalTidakMembuatSkpAcc += tidakMembuatSkp;
        }

        // Web Table Row
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 border-b border-slate-100 last:border-0';

        tr.innerHTML = `
            <td class="py-1.5 px-3 text-center text-slate-400 font-semibold text-[11px]">${index + 1}</td>
            <td class="py-1.5 px-3">
                <div class="font-bold text-slate-800 text-xs">${opd.nama}</div>
                <div class="text-[9px] text-slate-400 uppercase font-semibold leading-none mt-0.5">${opd.kategori}</div>
            </td>
            <td class="py-1.5 px-3 text-right font-bold text-slate-800 text-xs">${hasData ? formatNumber(totalPegawai) : '-'}</td>
            <td class="py-1.5 px-2.5 text-right text-emerald-600 font-semibold text-xs">${hasData ? formatNumber(sangatBaik) : '-'}</td>
            <td class="py-1.5 px-2.5 text-right text-blue-600 font-semibold text-xs">${hasData ? formatNumber(baik) : '-'}</td>
            <td class="py-1.5 px-2.5 text-right text-yellow-600 font-semibold text-xs">${hasData ? formatNumber(butuhPerbaikan) : '-'}</td>
            <td class="py-1.5 px-2.5 text-right text-orange-500 font-semibold text-xs">${hasData ? formatNumber(kurang) : '-'}</td>
            <td class="py-1.5 px-2.5 text-right text-red-500 font-semibold text-xs">${hasData ? formatNumber(sangatKurang) : '-'}</td>
            <td class="py-1.5 px-2.5 text-right text-slate-500 font-semibold text-xs">${hasData ? formatNumber(tidakMembuatSkp) : '-'}</td>
        `;
        tableBody.appendChild(tr);

        // Print Table Row
        const printTr = document.createElement('tr');
        printTr.innerHTML = `
            <td style="text-align: center;">${index + 1}</td>
            <td>${opd.nama}</td>
            <td style="text-align: right;">${hasData ? formatNumber(totalPegawai) : '0'}</td>
            <td style="text-align: right;">${hasData ? formatNumber(sangatBaik) : '0'}</td>
            <td style="text-align: right;">${hasData ? formatNumber(baik) : '0'}</td>
            <td style="text-align: right;">${hasData ? formatNumber(butuhPerbaikan) : '0'}</td>
            <td style="text-align: right;">${hasData ? formatNumber(kurang) : '0'}</td>
            <td style="text-align: right;">${hasData ? formatNumber(sangatKurang) : '0'}</td>
            <td style="text-align: right;">${hasData ? formatNumber(tidakMembuatSkp) : '0'}</td>
        `;
        printTableBody.appendChild(printTr);
    });

    const maxOpdDisplay = (USER_LEVEL === 2 && USER_OPD_ID) ? 1 : MASTER_OPD_LIST.length;

    // Summary Labels
    const totalStatusEl = document.getElementById('laporan-total-status');
    if (totalStatusEl) totalStatusEl.textContent = `${totalOpdFilled} / ${maxOpdDisplay} OPD`;
    document.getElementById('laporan-total-pegawai').textContent = formatNumber(totalPegawaiAcc);
    document.getElementById('laporan-total-sangatbaik').textContent = formatNumber(totalSangatBaikAcc);
    document.getElementById('laporan-total-baik').textContent = formatNumber(totalBaikAcc);
    document.getElementById('laporan-total-butuhperbaikan').textContent = formatNumber(totalButuhPerbaikanAcc);
    document.getElementById('laporan-total-kurang').textContent = formatNumber(totalKurangAcc);
    document.getElementById('laporan-total-sangatkurang').textContent = formatNumber(totalSangatKurangAcc);
    const webTidakMembuat = document.getElementById('laporan-total-tidakmembuatskp');
    if (webTidakMembuat) webTidakMembuat.textContent = formatNumber(totalTidakMembuatSkpAcc);

    // Print Labels
    const printTotalStatus = document.getElementById('print-total-status');
    if (printTotalStatus) printTotalStatus.textContent = `${totalOpdFilled} OPD`;
    document.getElementById('print-total-pegawai').textContent = formatNumber(totalPegawaiAcc);
    document.getElementById('print-total-sangatbaik').textContent = formatNumber(totalSangatBaikAcc);
    document.getElementById('print-total-baik').textContent = formatNumber(totalBaikAcc);
    document.getElementById('print-total-butuhperbaikan').textContent = formatNumber(totalButuhPerbaikanAcc);
    document.getElementById('print-total-kurang').textContent = formatNumber(totalKurangAcc);
    document.getElementById('print-total-sangatkurang').textContent = formatNumber(totalSangatKurangAcc);
    const printTidakMembuat = document.getElementById('print-total-tidakmembuatskp');
    if (printTidakMembuat) printTidakMembuat.textContent = formatNumber(totalTidakMembuatSkpAcc);

    // 2 Stat Cards (jika elemen tersedia di DOM)
    const statOpdCount = document.getElementById('laporan-stat-opd-count');
    const statOpdPct = document.getElementById('laporan-stat-opd-pct');
    const statAsnCount = document.getElementById('laporan-stat-asn-count');
    const statAsnRatio = document.getElementById('laporan-stat-asn-ratio');
    const printInfoOpd = document.getElementById('print-info-opd-count');
    const printInfoPegawai = document.getElementById('print-info-pegawai-count');

    if (USER_LEVEL === 2) {
        if (statOpdCount) statOpdCount.textContent = `1 / 1 Unit Kerja`;
        if (statOpdPct) statOpdPct.textContent = totalOpdFilled > 0 ? `Terisi Lengkap` : `Belum Ada Data`;
        if (printInfoOpd) printInfoOpd.textContent = `Unit Kerja: ${USER_OPD_NAME}`;
    } else {
        const opdPct = MASTER_OPD_LIST.length > 0 ? (totalOpdFilled / MASTER_OPD_LIST.length) * 100 : 0;
        if (statOpdCount) statOpdCount.textContent = `${totalOpdFilled} / ${MASTER_OPD_LIST.length}`;
        if (statOpdPct) statOpdPct.textContent = `${opdPct.toFixed(1)}% Terpenuhi`;
        if (printInfoOpd) printInfoOpd.textContent = `${totalOpdFilled} dari ${MASTER_OPD_LIST.length} Unit Kerja / Kecamatan`;
    }

    if (statAsnCount) statAsnCount.textContent = formatNumber(totalPegawaiAcc);
    if (statAsnRatio) statAsnRatio.textContent = `PNS: ${formatNumber(countPns)} | PPPK: ${formatNumber(countPppk)} | PPPK PW: ${formatNumber(countPppkPw)}`;
    if (printInfoPegawai) printInfoPegawai.textContent = `${formatNumber(totalPegawaiAcc)} ASN (PNS: ${formatNumber(countPns)} | PPPK: ${formatNumber(countPppk)} | PPPK PW: ${formatNumber(countPppkPw)})`;
}

/// ==========================================
// LOGO RESMI PEMKAB ACEH TIMUR (EMBEDDED HIGH-RES BASE64)
// ==========================================
const LOGO_ACEH_TIMUR_BASE64 = "data:image/png;base64,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";

// UNDUH LAPORAN BULANAN (PDF RESMI - HIGH QUALITY VECTOR)
// ==========================================
async function unduhLaporanBulananPDF() {
    renderLaporanBulanan();
    const selectedYear = parseInt(document.getElementById('laporan-filter-tahun')?.value || 2026);
    const selectedBulan = document.getElementById('laporan-filter-bulan')?.value || 'JULI';
    const isOpdRole = (USER_LEVEL === 2 && USER_OPD_ID);

    const fileName = isOpdRole 
        ? `Laporan_Rekapitulasi_SKP_${USER_OPD_ID}_${selectedBulan}_${selectedYear}.pdf`
        : `Laporan_Rekapitulasi_SKP_ASN_${selectedBulan}_${selectedYear}_Kab_Aceh_Timur.pdf`;

    // 1. Ekspor PDF langsung berkualitas tinggi (Vector Text) menggunakan jsPDF & AutoTable
    const doc = (function() {
        let Ctor = null;
        if (window.jspdf && window.jspdf.jsPDF) Ctor = window.jspdf.jsPDF;
        else if (typeof window.jsPDF === 'function') Ctor = window.jsPDF;
        else if (typeof jsPDF === 'function') Ctor = jsPDF;
        if (!Ctor) return null;
        try {
            return new Ctor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        } catch (e) {
            return null;
        }
    })();

    if (doc) {
        try {
            showToast('Sedang memproses unduhan PDF resmi...', 'info');

            // Logo Pemkab Aceh Timur (di sebelah kiri kop surat - proporsional)
            if (typeof LOGO_ACEH_TIMUR_BASE64 !== 'undefined' && LOGO_ACEH_TIMUR_BASE64) {
                try {
                    doc.addImage(LOGO_ACEH_TIMUR_BASE64, 'PNG', 14, 11.5, 17.5, 17.2);
                } catch (imgErr) {
                    console.warn('Gagal memuat logo ke PDF:', imgErr);
                }
            }

            // KOP SURAT RESMI
            doc.setFont('times', 'bold');
            doc.setFontSize(11);
            doc.text('PEMERINTAH KABUPATEN ACEH TIMUR', 112, 14, { align: 'center' });
            doc.setFontSize(12.5);
            doc.text('BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA', 112, 19.5, { align: 'center' });
            
            doc.setFont('times', 'normal');
            doc.setFontSize(7.5);
            doc.text('KOMPLEK PUSAT PEMERINTAHAN, JALAN BANDA ACEH - MEDAN KM 370 GEDUNG NO 12 IDI (KODE POS 24454)', 112, 24, { align: 'center' });
            doc.text('Telepon (0646) 7020166, Email: bkpsdm.acehtimur@gmail.com', 112, 27.5, { align: 'center' });

            // Garis Ganda Kop Surat
            doc.setLineWidth(0.6);
            doc.line(14, 32, 196, 32);
            doc.setLineWidth(0.2);
            doc.line(14, 32.8, 196, 32.8);

            // Judul Dokumen
            doc.setFont('times', 'bold');
            doc.setFontSize(10.5);
            doc.text('LAPORAN REKAPITULASI CAPAIAN PREDIKAT KINERJA SKP ASN', 105, 38.5, { align: 'center' });
            doc.setFont('times', 'italic');
            doc.setFontSize(8.5);
            doc.text(`PERIODE BULAN: ${selectedBulan.toUpperCase()} TAHUN: ${selectedYear}`, 105, 43, { align: 'center' });

            // Ringkasan Data
            const localList = getLocalRekapList();
            const filledList = localList.filter(item => item.bulan === selectedBulan && parseInt(item.tahun) === selectedYear);
            const filledMap = {};
            filledList.forEach(item => { filledMap[item.opd_id] = item; });

            let opdListToRender = isOpdRole 
                ? MASTER_OPD_LIST.filter(o => o.id === USER_OPD_ID)
                : MASTER_OPD_LIST.slice().sort((a, b) => a.nama.localeCompare(b.nama));

            let totalOpdFilled = 0;
            let totalPegawaiAcc = 0;
            let totalSangatBaikAcc = 0;
            let totalBaikAcc = 0;
            let totalButuhPerbaikanAcc = 0;
            let totalKurangAcc = 0;
            let totalSangatKurangAcc = 0;
            let totalTidakMembuatSkpAcc = 0;
            let countPns = 0;
            let countPppk = 0;
            let countPppkPw = 0;

            const tableRows = [];
            opdListToRender.forEach((opd, index) => {
                const item = filledMap[opd.id];
                const hasData = !!item;
                let total = 0;
                let sb = 0, b = 0, bp = 0, k = 0, sk = 0, tms = 0;

                if (hasData) {
                    const pnsVal = item.pns || 0;
                    const pppkVal = item.pppk || 0;
                    const pppkPwVal = item.pppk_dw || 0;
                    total = pnsVal + pppkVal + pppkPwVal;
                    sb = item.sangat_baik || 0;
                    b = item.baik || 0;
                    bp = item.butuh_perbaikan || 0;
                    k = item.kurang || 0;
                    sk = item.sangat_kurang || 0;
                    tms = item.tidak_membuat_skp || 0;

                    totalOpdFilled++;
                    totalPegawaiAcc += total;
                    totalSangatBaikAcc += sb;
                    totalBaikAcc += b;
                    totalButuhPerbaikanAcc += bp;
                    totalKurangAcc += k;
                    totalSangatKurangAcc += sk;
                    totalTidakMembuatSkpAcc += tms;
                    countPns += pnsVal;
                    countPppk += pppkVal;
                    countPppkPw += pppkPwVal;

                    tableRows.push([
                        index + 1,
                        opd.nama,
                        formatNumber(total),
                        formatNumber(sb),
                        formatNumber(b),
                        formatNumber(bp),
                        formatNumber(k),
                        formatNumber(sk),
                        formatNumber(tms)
                    ]);
                } else {
                    tableRows.push([
                        index + 1,
                        opd.nama,
                        '0', '0', '0', '0', '0', '0', '0'
                    ]);
                }
            });

            // Parameter Tabel AutoTable
            const autoTableConfig = {
                startY: 48,
                head: [[
                    'No',
                    'Nama Unit Kerja / OPD',
                    'Total\nPegawai',
                    'Sangat\nBaik',
                    'Baik',
                    'Butuh\nPerbaikan',
                    'Kurang',
                    'Sangat\nKurang',
                    'Tidak Membuat\nSKP'
                ]],
                body: tableRows,
                foot: [[
                    'TOTAL',
                    isOpdRole ? `TOTAL REKAPITULASI ${USER_OPD_ID}` : 'TOTAL REKAPITULASI KESELURUHAN',
                    formatNumber(totalPegawaiAcc),
                    formatNumber(totalSangatBaikAcc),
                    formatNumber(totalBaikAcc),
                    formatNumber(totalButuhPerbaikanAcc),
                    formatNumber(totalKurangAcc),
                    formatNumber(totalSangatKurangAcc),
                    formatNumber(totalTidakMembuatSkpAcc)
                ]],
                showFoot: 'lastPage', // TOTAL REKAPITULASI HANYA DI HALAMAN TERAKHIR
                theme: 'grid',
                styles: {
                    font: 'times',
                    fontSize: 7.2,
                    cellPadding: 1.2,
                    textColor: [0, 0, 0],
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1
                },
                headStyles: {
                    fillColor: [240, 243, 246],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    fontSize: 7
                },
                footStyles: {
                    fillColor: [240, 243, 246],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 7 },
                    1: { halign: 'left', cellWidth: 65 },
                    2: { halign: 'right', cellWidth: 15 },
                    3: { halign: 'right', cellWidth: 14 },
                    4: { halign: 'right', cellWidth: 12 },
                    5: { halign: 'right', cellWidth: 18 },
                    6: { halign: 'right', cellWidth: 12 },
                    7: { halign: 'right', cellWidth: 15 },
                    8: { halign: 'right', cellWidth: 24 }
                },
                margin: { left: 14, right: 14, top: 12, bottom: 14 }
            };

            // Jalankan autoTable
            if (typeof doc.autoTable === 'function') {
                doc.autoTable(autoTableConfig);
            } else if (window.jspdf && typeof window.jspdf.autoTable === 'function') {
                window.jspdf.autoTable(doc, autoTableConfig);
            } else if (typeof window.autoTable === 'function') {
                window.autoTable(doc, autoTableConfig);
            } else if (typeof window.jspdfAutoTable === 'function') {
                window.jspdfAutoTable(doc, autoTableConfig);
            } else {
                throw new Error('AutoTable library not bound');
            }

            // Blok Tanda Tangan Resmi di Halaman Terakhir
            let finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 200) + 6;
            if (finalY > 235) {
                doc.addPage();
                finalY = 20;
            }

            const monthTitle = selectedBulan.charAt(0) + selectedBulan.slice(1).toLowerCase();
            doc.setFont('times', 'normal');
            doc.setFontSize(8);
            doc.text(`Idi,       ${monthTitle} ${selectedYear}`, 135, finalY);
            doc.setFont('times', 'bold');
            doc.text('KEPALA BADAN KEPEGAWAIAN DAN', 135, finalY + 3.5);
            doc.text('PENGEMBANGAN SUMBER DAYA MANUSIA', 135, finalY + 7);
            doc.text('KABUPATEN ACEH TIMUR', 135, finalY + 10.5);

            doc.text('TEUKU DIDI FARISHA, S.STP,. M. AP', 135, finalY + 28);
            doc.setLineWidth(0.2);
            doc.line(135, finalY + 28.8, 187, finalY + 28.8);
            doc.setFont('times', 'normal');
            doc.setFontSize(7.5);
            doc.text('Pembina Utama Muda (IV/c)', 135, finalY + 32);
            doc.text('NIP. 198412302004121001', 135, finalY + 35.5);

            // Item 5: Penomoran Halaman (Halaman X dari Y) & Catatan Kaki Resmi
            const totalPages = doc.internal.getNumberOfPages();
            const now = new Date();
            const tglIndo = now.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const jamIndo = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
            const footerLeftText = `Dicetak melalui SIMONIKA Kab. Aceh Timur pada ${tglIndo} pukul ${jamIndo} WIB`;

            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFont('times', 'italic');
                doc.setFontSize(7);
                doc.setTextColor(100, 100, 100);
                // Sisi Kiri
                doc.text(footerLeftText, 14, 290, { align: 'left' });
                // Sisi Kanan
                doc.text(`Halaman ${i} dari ${totalPages}`, 196, 290, { align: 'right' });
            }

            // Simpan langsung ke file download .pdf
            doc.save(fileName);
            showToast('Laporan PDF resmi berhasil diunduh!', 'success');
            return;
        } catch (e) {
            console.error('jsPDF execution error:', e);
            simonikaAlert({
                title: 'Gagal Mengunduh PDF',
                text: 'Terjadi kendala saat menyusun berkas PDF: ' + (e.message || e),
                icon: 'error'
            });
            return;
        }
    }

    // Jika pustaka jsPDF sama sekali belum siap
    simonikaAlert({
        title: 'Pustaka PDF Belum Siap',
        text: 'Pustaka pembuat PDF sedang dimuat. Silakan coba kembali dalam beberapa detik.',
        icon: 'warning'
    });
}
window.unduhLaporanBulananPDF = unduhLaporanBulananPDF;
window.cetakLaporanBulananPDF = unduhLaporanBulananPDF;

// ==========================================
// EXPORT EXCEL LAPORAN BULANAN (EXCELJS & SHEETJS)
// FORMAT RESMI DILENGKAPI LOGO, MERGE KOP & STYLING PRESISI
// ==========================================
async function exportLaporanBulananExcel() {
    window.exportLaporanBulananExcel = exportLaporanBulananExcel;

    const selectedYear = parseInt(document.getElementById('laporan-filter-tahun')?.value || 2026);
    const selectedBulan = document.getElementById('laporan-filter-bulan')?.value || 'JULI';

    const localList = getLocalRekapList();
    const filledList = localList.filter(item => item.bulan === selectedBulan && parseInt(item.tahun) === selectedYear);

    const filledMap = {};
    filledList.forEach(item => {
        filledMap[item.opd_id] = item;
    });

    const isOpdRole = (USER_LEVEL === 2 && USER_OPD_ID);
    const maxOpdDisplay = isOpdRole ? 1 : MASTER_OPD_LIST.length;

    let opdListToExport = [];
    if (isOpdRole) {
        opdListToExport = MASTER_OPD_LIST.filter(o => o.id === USER_OPD_ID);
    } else {
        opdListToExport = MASTER_OPD_LIST.slice().sort((a, b) => a.nama.localeCompare(b.nama));
    }

    let totalOpdFilled = 0;
    let totalPegawaiAcc = 0;
    let totalSangatBaikAcc = 0;
    let totalBaikAcc = 0;
    let totalButuhPerbaikanAcc = 0;
    let totalKurangAcc = 0;
    let totalSangatKurangAcc = 0;
    let totalTidakMembuatSkpAcc = 0;
    let countPns = 0;
    let countPppk = 0;
    let countPppkPw = 0;

    const dataRows = [];
    opdListToExport.forEach((opd, idx) => {
        const item = filledMap[opd.id];
        const hasData = !!item;
        let totalPegawai = 0;
        let sangatBaik = 0;
        let baik = 0;
        let butuhPerbaikan = 0;
        let kurang = 0;
        let sangatKurang = 0;
        let tidakMembuatSkp = 0;

        if (hasData) {
            const pnsVal = item.pns || 0;
            const pppkVal = item.pppk || 0;
            const pppkPwVal = item.pppk_dw || 0;
            totalPegawai = pnsVal + pppkVal + pppkPwVal;
            sangatBaik = item.sangat_baik || 0;
            baik = item.baik || 0;
            butuhPerbaikan = item.butuh_perbaikan || 0;
            kurang = item.kurang || 0;
            sangatKurang = item.sangat_kurang || 0;
            tidakMembuatSkp = item.tidak_membuat_skp || 0;

            totalOpdFilled++;
            totalPegawaiAcc += totalPegawai;
            totalSangatBaikAcc += sangatBaik;
            totalBaikAcc += baik;
            totalButuhPerbaikanAcc += butuhPerbaikan;
            totalKurangAcc += kurang;
            totalSangatKurangAcc += sangatKurang;
            totalTidakMembuatSkpAcc += tidakMembuatSkp;

            countPns += pnsVal;
            countPppk += pppkVal;
            countPppkPw += pppkPwVal;

            dataRows.push([
                idx + 1,
                opd.nama,
                totalPegawai,
                sangatBaik,
                baik,
                butuhPerbaikan,
                kurang,
                sangatKurang,
                tidakMembuatSkp
            ]);
        } else {
            dataRows.push([
                idx + 1,
                opd.nama,
                0, 0, 0, 0, 0, 0, 0
            ]);
        }
    });

    const monthTitle = selectedBulan.charAt(0) + selectedBulan.slice(1).toLowerCase();
    const fileName = isOpdRole 
        ? `Laporan_Rekapitulasi_SKP_${USER_OPD_ID}_${selectedBulan}_${selectedYear}.xlsx`
        : `Laporan_Rekapitulasi_SKP_ASN_${selectedBulan}_${selectedYear}_Kab_Aceh_Timur.xlsx`;

    // 1. Prioritaskan ExcelJS untuk hasil paling profesional (dengan Logo & Cell Styling)
    if (window.ExcelJS) {
        try {
            showToast('Sedang menyusun berkas Excel resmi...', 'info');
            const wb = new window.ExcelJS.Workbook();
            const ws = wb.addWorksheet('Rekap SKP Bulanan', {
                views: [{ showGridLines: true }]
            });

            // Set Lebar Kolom (9 Kolom)
            ws.columns = [
                { key: 'no', width: 6 },
                { key: 'opd', width: 55 },
                { key: 'total', width: 15 },
                { key: 'sb', width: 14 },
                { key: 'b', width: 12 },
                { key: 'bp', width: 16 },
                { key: 'k', width: 12 },
                { key: 'sk', width: 15 },
                { key: 'tms', width: 18 }
            ];

            // Tambahkan Logo Pemkab Aceh Timur di sudut kiri atas kop
            if (typeof LOGO_ACEH_TIMUR_BASE64 !== 'undefined' && LOGO_ACEH_TIMUR_BASE64) {
                try {
                    const imageId = wb.addImage({
                        base64: LOGO_ACEH_TIMUR_BASE64,
                        extension: 'png'
                    });
                    ws.addImage(imageId, {
                        tl: { col: 0.15, row: 0.15 },
                        ext: { width: 68, height: 68 }
                    });
                } catch (imgErr) {
                    console.warn('Gagal memuat logo ke ExcelJS:', imgErr);
                }
            }

            // Kop Surat Resmi (Merge B:I, Center)
            ws.mergeCells('B1:I1');
            ws.getCell('B1').value = 'PEMERINTAH KABUPATEN ACEH TIMUR';
            ws.getCell('B1').font = { name: 'Times New Roman', size: 12, bold: true };
            ws.getCell('B1').alignment = { horizontal: 'center', vertical: 'middle' };

            ws.mergeCells('B2:I2');
            ws.getCell('B2').value = 'BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA';
            ws.getCell('B2').font = { name: 'Times New Roman', size: 13, bold: true };
            ws.getCell('B2').alignment = { horizontal: 'center', vertical: 'middle' };

            ws.mergeCells('B3:I3');
            ws.getCell('B3').value = 'KOMPLEK PUSAT PEMERINTAHAN, JALAN BANDA ACEH - MEDAN KM 370 GEDUNG NO 12 IDI (KODE POS 24454)';
            ws.getCell('B3').font = { name: 'Times New Roman', size: 9 };
            ws.getCell('B3').alignment = { horizontal: 'center', vertical: 'middle' };

            ws.mergeCells('B4:I4');
            ws.getCell('B4').value = 'Telepon (0646) 7020166, Email: bkpsdm.acehtimur@gmail.com';
            ws.getCell('B4').font = { name: 'Times New Roman', size: 9 };
            ws.getCell('B4').alignment = { horizontal: 'center', vertical: 'middle' };

            // Garis Ganda Kop Surat
            for (let c = 1; c <= 9; c++) {
                ws.getRow(4).getCell(c).border = {
                    bottom: { style: 'double' }
                };
            }

            // Judul Dokumen
            ws.mergeCells('A6:I6');
            ws.getCell('A6').value = 'LAPORAN REKAPITULASI CAPAIAN PREDIKAT KINERJA SKP ASN';
            ws.getCell('A6').font = { name: 'Times New Roman', size: 12, bold: true, underline: true };
            ws.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };

            ws.mergeCells('A7:I7');
            ws.getCell('A7').value = `PERIODE BULAN: ${selectedBulan.toUpperCase()} TAHUN: ${selectedYear}`;
            ws.getCell('A7').font = { name: 'Times New Roman', size: 10, italic: true };
            ws.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };

            // Header Tabel (Baris 9)
            const headerRow = ws.getRow(9);
            headerRow.values = [
                'No', 'Nama Unit Kerja / OPD', 'Total Pegawai',
                'Sangat Baik', 'Baik', 'Butuh Perbaikan', 'Kurang', 'Sangat Kurang', 'Tidak Membuat SKP'
            ];
            headerRow.height = 25;
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Times New Roman', size: 10, bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F3F6' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Data Rows (Mulai Baris 10)
            let currentRowNum = 10;
            dataRows.forEach((r) => {
                const row = ws.getRow(currentRowNum);
                row.values = r;
                row.height = 20;

                // Formatting per kolom
                row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }; // No
                row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };   // OPD

                // Numeric columns (3 to 9)
                for (let c = 3; c <= 9; c++) {
                    const numCell = row.getCell(c);
                    numCell.alignment = { horizontal: 'right', vertical: 'middle' };
                    numCell.numFmt = '#,##0';
                }

                // Border dan Font
                for (let c = 1; c <= 9; c++) {
                    const cell = row.getCell(c);
                    cell.font = { name: 'Times New Roman', size: 10 };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }
                currentRowNum++;
            });

            // Baris Total Rekapitulasi (Merge A:B)
            const totalRow = ws.getRow(currentRowNum);
            totalRow.height = 22;
            ws.mergeCells(`A${currentRowNum}:B${currentRowNum}`);
            
            const cellTotalLabel = ws.getCell(`A${currentRowNum}`);
            cellTotalLabel.value = isOpdRole ? `TOTAL REKAPITULASI ${USER_OPD_ID}` : 'TOTAL REKAPITULASI KESELURUHAN';
            cellTotalLabel.font = { name: 'Times New Roman', size: 10, bold: true };
            cellTotalLabel.alignment = { horizontal: 'center', vertical: 'middle' };
            cellTotalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F3F6' } };

            const totalValues = [
                totalPegawaiAcc, totalSangatBaikAcc, totalBaikAcc,
                totalButuhPerbaikanAcc, totalKurangAcc, totalSangatKurangAcc, totalTidakMembuatSkpAcc
            ];

            totalValues.forEach((val, idx) => {
                const colIdx = 3 + idx;
                const cell = totalRow.getCell(colIdx);
                cell.value = val;
                cell.numFmt = '#,##0';
                cell.font = { name: 'Times New Roman', size: 10, bold: true };
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F3F6' } };
            });

            for (let c = 1; c <= 9; c++) {
                totalRow.getCell(c).border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'double' },
                    right: { style: 'thin' }
                };
            }

            // Blok Tanda Tangan Resmi (Kolom F:I)
            const sigStart = currentRowNum + 2;

            function addSigLine(rowOffset, text, isBold = false, isUnderline = false, size = 10) {
                const rNum = sigStart + rowOffset;
                ws.mergeCells(`F${rNum}:I${rNum}`);
                const cell = ws.getCell(`F${rNum}`);
                cell.value = text;
                cell.font = { name: 'Times New Roman', size: size, bold: isBold, underline: isUnderline };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }

            addSigLine(0, `Idi,       ${monthTitle} ${selectedYear}`, false, false, 10);
            addSigLine(1, 'KEPALA BADAN KEPEGAWAIAN DAN', true, false, 10);
            addSigLine(2, 'PENGEMBANGAN SUMBER DAYA MANUSIA', true, false, 10);
            addSigLine(3, 'KABUPATEN ACEH TIMUR', true, false, 10);

            addSigLine(7, 'TEUKU DIDI FARISHA, S.STP,. M. AP', true, true, 10);
            addSigLine(8, 'Pembina Utama Muda (IV/c)', false, false, 9.5);
            addSigLine(9, 'NIP. 198412302004121001', false, false, 9.5);

            // Simpan file Excel ke browser
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            showToast('Laporan Excel resmi berhasil diunduh!', 'success');
            return;
        } catch (excelErr) {
            console.error('ExcelJS generation failed, fallback to SheetJS:', excelErr);
        }
    }

    // 2. Fallback SheetJS jika ExcelJS tidak tersedia
    if (!window.XLSX) {
        simonikaAlert({ title: 'Pustaka Belum Siap', text: 'Pustaka Excel sedang dimuat. Silakan coba kembali sesaat lagi.', icon: 'warning' });
        return;
    }

    const aoa = [
        ["", "PEMERINTAH KABUPATEN ACEH TIMUR"],
        ["", "BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER DAYA MANUSIA"],
        ["", "Komplek Pusat Pemerintahan, Jalan Banda Aceh - Medan Km 370 Gedung No 12 Idi (Kode Pos 24454)"],
        [],
        ["LAPORAN REKAPITULASI CAPAIAN PREDIKAT KINERJA SKP ASN"],
        [`PERIODE BULAN: ${selectedBulan.toUpperCase()} TAHUN: ${selectedYear}`],
        [],
        [
            "No",
            "Nama Unit Kerja / OPD",
            "Total Pegawai",
            "Sangat Baik",
            "Baik",
            "Butuh Perbaikan",
            "Kurang",
            "Sangat Kurang",
            "Tidak Membuat SKP"
        ]
    ];

    dataRows.forEach(row => aoa.push(row));

    aoa.push([
        "TOTAL",
        isOpdRole ? `TOTAL REKAPITULASI ${USER_OPD_ID}` : "TOTAL REKAPITULASI KESELURUHAN",
        totalPegawaiAcc,
        totalSangatBaikAcc,
        totalBaikAcc,
        totalButuhPerbaikanAcc,
        totalKurangAcc,
        totalSangatKurangAcc,
        totalTidakMembuatSkpAcc
    ]);

    aoa.push([]);
    aoa.push([]);
    aoa.push(["", "", "", "", "", `Idi,       ${monthTitle} ${selectedYear}`]);
    aoa.push(["", "", "", "", "", "KEPALA BADAN KEPEGAWAIAN DAN"]);
    aoa.push(["", "", "", "", "", "PENGEMBANGAN SUMBER DAYA MANUSIA"]);
    aoa.push(["", "", "", "", "", "KABUPATEN ACEH TIMUR"]);
    aoa.push([]);
    aoa.push([]);
    aoa.push(["", "", "", "", "", "TEUKU DIDI FARISHA, S.STP,. M. AP"]);
    aoa.push(["", "", "", "", "", "Pembina Utama Muda (IV/c)"]);
    aoa.push(["", "", "", "", "", "NIP. 198412302004121001"]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    ws['!merges'] = [
        { s: { r: 0, c: 1 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 1 }, e: { r: 1, c: 8 } },
        { s: { r: 2, c: 1 }, e: { r: 2, c: 8 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: 8 } }
    ];

    ws['!cols'] = [
        { wch: 6 },
        { wch: 55 },
        { wch: 15 },
        { wch: 14 },
        { wch: 12 },
        { wch: 16 },
        { wch: 12 },
        { wch: 15 },
        { wch: 18 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap SKP Bulanan");
    XLSX.writeFile(wb, fileName);
    showToast('Laporan Excel resmi berhasil diunduh!', 'success');
}

// ==========================================
// SEARCHABLE DROPDOWN OPD
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

    const currentOptText = (opdSelect.options && opdSelect.selectedIndex !== -1 && opdSelect.options[opdSelect.selectedIndex]) 
        ? opdSelect.options[opdSelect.selectedIndex].textContent 
        : '-- TAMPILKAN SEMUA OPD --';
    triggerLabel.textContent = currentOptText;
    triggerLabel.title = currentOptText;

    if (opdSelect.options) {
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
            triggerLabel.title = opt.textContent;
            closeSearchableDropdown();
        };
        list.appendChild(btn);
    });
    }
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
function setCategoryFilter(category) {
window.setCategoryFilter = setCategoryFilter;
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
            tab.className = "px-2 py-0.5 text-[10px] font-bold rounded-md transition-all bg-white text-slate-800 shadow-xs focus:outline-none";
        } else {
            tab.className = "px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all text-slate-500 hover:text-slate-850 focus:outline-none";
        }
    });

    updateOpdDropdown();
    updateDashboardDynamic();
};

function switchView(viewName) {
window.switchView = switchView;
    if (USER_LEVEL === 2 && (viewName === 'master-data' || viewName === 'laporan-bulanan')) {
        simonikaAlert({
            title: 'Akses Terbatas',
            html: `<p class="text-xs text-slate-600 leading-relaxed">Halaman ini hanya dapat diakses oleh <strong>Administrator BKPSDM (Level 1)</strong>.</p>`,
            icon: 'warning',
            confirmText: 'Saya Mengerti'
        });
        return;
    }

    const views = {
        'dashboard': document.getElementById('view-dashboard'),
        'data-opd': document.getElementById('view-data-opd'),
        'master-data': document.getElementById('view-master-data'),
        'laporan-bulanan': document.getElementById('view-laporan-bulanan')
    };

    const navs = {
        'dashboard': document.getElementById('nav-dashboard'),
        'data-opd': document.getElementById('nav-data-opd'),
        'master-data': document.getElementById('nav-master-data'),
        'laporan-bulanan': document.getElementById('nav-laporan-bulanan')
    };

    const inactiveClasses = ["text-slate-400", "hover:bg-slate-800", "hover:text-slate-100", "font-medium"];
    const activeClasses = ["bg-indigo-600/10", "text-indigo-400", "font-semibold", "border", "border-indigo-500/20"];

    Object.values(views).forEach(v => { if (v) v.classList.add('hidden'); });
    Object.values(navs).forEach(n => {
        if (n) {
            activeClasses.forEach(c => n.classList.remove(c));
            inactiveClasses.forEach(c => n.classList.add(c));
        }
    });

    if (views[viewName]) views[viewName].classList.remove('hidden');
    if (navs[viewName]) activeClasses.forEach(c => navs[viewName].classList.add(c));

    // Selalu refresh dan sinkronkan filter setiap kali berpindah view
    populateFilters();
    refreshAllData();

    if (viewName === 'dashboard') {
        updateDashboardDynamic();
    } else if (viewName === 'data-opd') {
        renderOpdList();
        renderSelectedOpdDetail();
    } else if (viewName === 'master-data') {
        updateResetButtonState();
    } else if (viewName === 'laporan-bulanan') {
        renderLaporanBulanan();
    }
};

function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num || 0);
}

// ==========================================
// INISIALISASI APLIKASI
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 0. Cek Session Login
    if (localStorage.getItem('admin_session_active') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    // Terapkan Hak Akses Level Pengguna
    applyUserLevelPermissions();

    // 1. Chart.js
    const canvas = document.getElementById('kinerjaChart');
    if (canvas && window.Chart) {
        const ctx = canvas.getContext('2d');
        const labels = ['Sangat Baik', 'Baik', 'Butuh Perbaikan', 'Kurang', 'Sangat Kurang', 'Tidak membuat SKP'];
        const colors = ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444', '#64748b'];

        kinerjaChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jumlah ASN',
                    data: [0, 0, 0, 0, 0, 0],
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
                        ticks: { font: { size: 9.5, weight: '600', family: 'Inter' }, color: '#64748b', maxRotation: 0, minRotation: 0 }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9', drawBorder: false },
                        ticks: { font: { size: 10, family: 'Inter' }, color: '#64748b', callback: function (value) { return formatNumber(value); } }
                    }
                }
            }
        });
    }

    // 2. Master Filter Change Event Listener (View filters use onMonthDropdownChange/onYearDropdownChange)
    document.getElementById('master-filter-bulan')?.addEventListener('change', function () {
        syncAllFilters(this.value, document.getElementById('master-filter-tahun')?.value || 2026);
    });
    document.getElementById('master-filter-tahun')?.addEventListener('change', function () {
        onYearDropdownChange(this.value);
    });

    document.getElementById('opd-select')?.addEventListener('change', function () {
        updateDashboardDynamic();
    });

    // 3. Sidebar Mobile Toggle
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

    // Seed & Cloud Database Sync
    ensureInitialRealSeed().then((synced) => {
        if (synced) {
            populateFilters();
            renderOpdList();
            renderSelectedOpdDetail();
            updateDashboardDynamic();
            if (typeof renderLaporanBulanan === 'function') renderLaporanBulanan();
        }
    });

    // Populate & Start
    populateFilters();
    initMasterDataEvents();
    renderOpdList();
    renderSelectedOpdDetail();
    updateDashboardDynamic();
    switchView('dashboard');
    initSearchableDropdown();
});




// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
function showToast(title, message = '', type = 'success') {
window.showToast = showToast;
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = "pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-white border shadow-xl transition-all duration-300 transform translate-y-2 opacity-0";

    let iconHtml = '';
    let borderClass = 'border-slate-100';
    
    if (type === 'success') {
        borderClass = 'border-emerald-100';
        iconHtml = `<div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
        </div>`;
    } else if (type === 'error') {
        borderClass = 'border-rose-100';
        iconHtml = `<div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </div>`;
    } else if (type === 'warning') {
        borderClass = 'border-amber-100';
        iconHtml = `<div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>`;
    } else {
        borderClass = 'border-indigo-100';
        iconHtml = `<div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>`;
    }

    toast.classList.add(borderClass);
    toast.innerHTML = `
        ${iconHtml}
        <div class="flex-1 pr-2">
            <p class="text-xs font-bold text-slate-800 leading-tight">${title}</p>
            ${message ? `<p class="text-[11px] text-slate-500 mt-0.5 leading-snug">${message}</p>` : ''}
        </div>
        <button onclick="document.getElementById('${toastId}')?.remove()" class="text-slate-400 hover:text-slate-600 p-1 focus:outline-none">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
    `;

    container.appendChild(toast);

    // Smooth entry
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    }, 20);

    // Auto dismiss after 3.8s
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-4');
        setTimeout(() => {
            if (toast.remove) {
                toast.remove();
            } else if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3800);
};

// ==========================================
// SEARCH CLEAR & EMPTY STATE LOGIC
// ==========================================
window.onAsnSearchInput = function (value) {
    const clearBtn = document.getElementById('asn-search-clear');
    if (clearBtn) {
        if (value && value.trim().length > 0) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }
    filterAsnTable();
};

window.clearAsnSearch = function () {
    const input = document.getElementById('asn-search-input');
    const clearBtn = document.getElementById('asn-search-clear');
    if (input) {
        input.value = '';
        input.focus();
    }
    if (clearBtn) clearBtn.classList.add('hidden');
    filterAsnTable();
};

window.resetAsnFilters = function () {
    clearAsnSearch();
    const filterPred = document.getElementById('asn-filter-predikat');
    const filterStat = document.getElementById('asn-filter-status');
    if (filterPred) filterPred.value = 'ALL';
    if (filterStat) filterStat.value = 'ALL';
    filterAsnTable();
    showToast('Filter Direset', 'Menampilkan seluruh data ASN unit kerja', 'info');
};

// ==========================================
// CUSTOM LOGOUT CONFIRMATION MODAL
// ==========================================
window.handleLogout = function () {
    const modal = document.getElementById('modal-logout-confirm');
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        if (confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
            confirmLogout();
        }
    }
};

window.closeLogoutModal = function () {
    const modal = document.getElementById('modal-logout-confirm');
    if (modal) modal.classList.add('hidden');
};

window.confirmLogout = function () {
    localStorage.removeItem('admin_session_active');
    localStorage.removeItem('simonika_user_level');
    localStorage.removeItem('simonika_user_role');
    localStorage.removeItem('simonika_user_opd_id');
    localStorage.removeItem('simonika_user_opd_name');
    localStorage.removeItem('admin_user_display');
    window.location.href = 'index.html';
};



// ==========================================
// PROMINENT MONTH SELECTOR & LOADING ANIMATION
// ==========================================
window.selectQuickMonth = function (month) {
    const year = document.getElementById('filter-tahun')?.value || 2026;
    triggerAnimatedMonthChange(month, year);
};

function onMonthDropdownChange(month) {
    const year = parseInt(document.getElementById('filter-tahun')?.value || 2026);
    if (!month) return;
    triggerAnimatedMonthChange(month, year);
}
window.onMonthDropdownChange = onMonthDropdownChange;

function onYearDropdownChange(year) {
    const yearVal = parseInt(year);
    ['filter-tahun', 'opd-filter-tahun', 'master-filter-tahun', 'laporan-filter-tahun'].forEach(yId => {
        const el = document.getElementById(yId);
        if (el) el.value = yearVal;
    });
    // Update daftar bulan & status data untuk tahun terpilih
    populateFilters();
    const activeMonth = document.getElementById('filter-bulan')?.value || '';
    triggerAnimatedMonthChange(activeMonth, yearVal);
}
window.onYearDropdownChange = onYearDropdownChange;

function triggerAnimatedMonthChange(month, year) {
    // 1. Sinkronisasi seluruh filter
    syncAllFilters(month, year);
    updateMonthStatusBadge(month, year);

    // 2. Render ulang data di semua tampilan
    refreshAllData();
    updateMonthStatusBadge(month, year);

    // 3. Notifikasi toast
    if (!month) {
        showToast('Periode Kosong', 'Tidak ada data SKP yang tersimpan untuk tahun ' + year, 'warning');
        return;
    }

    const localList = getLocalRekapList();
    const count = localList.filter(item => item.bulan === month && parseInt(item.tahun) === parseInt(year)).length;

    if (count > 0) {
        showToast('Periode Aktif', 'Menampilkan data SKP ASN periode ' + month + ' ' + year + ' (' + count + ' OPD Terisi)', 'success');
    } else {
        showToast('Periode Kosong', 'Belum ada data SKP diunggah untuk periode ' + month + ' ' + year, 'warning');
    }
}
window.triggerAnimatedMonthChange = triggerAnimatedMonthChange;

function updateQuickMonthPillsUI(activeMonth) {
    const pillContainers = ['quick-month-pills-dashboard', 'quick-month-pills-opd'];
    pillContainers.forEach(contId => {
        const container = document.getElementById(contId);
        if (!container) return;
        const buttons = container.querySelectorAll('button[data-month]');
        buttons.forEach(btn => {
            const m = btn.getAttribute('data-month');
            if (m === activeMonth) {
                btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-600 scale-105";
            } else {
                btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-200/60 border border-transparent";
            }
        });
    });
}

// Expose export functions globally
window.unduhDataAsnExcel = unduhDataAsnExcel;
window.unduhDataAsnLengkapExcel = unduhDataAsnExcel;
window.unduhRekapOpdExcel = unduhRekapOpdExcel;
