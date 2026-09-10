// dashboard.js - Logika SIMONIKA (Mendukung Master Data BKN e-Kinerja, Data OPD, Laporan Bulanan, Export Excel & Mode Demo Lokal)

// ==========================================
// KONFIGURASI STORAGE & DATABASE
// ==========================================
let STORAGE_MODE = localStorage.getItem('simonika_storage_mode') || 'local';

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

        // 1. Hide Master Data from Sidebar for Level 2
        if (adminNavSection) adminNavSection.style.display = 'none';
        if (navMasterData) navMasterData.style.display = 'none';

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
    { id: 'BKPSDM', nama: 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM)', kategori: 'DINAS', aliases: ['bkpsdm', 'kepegawaian', 'badan kepegawaian', 'pengembangan sumber daya manusia'] },
    { id: 'SETDA', nama: 'Sekretariat Daerah', kategori: 'DINAS', aliases: ['setda', 'sekretariat daerah', 'asisten', 'bagian hukum', 'bagian organisasi', 'bagian keuangan', 'bagian keistimewaan'] },
    { id: 'BPKD', nama: 'Badan Pengelolaan Keuangan Daerah (BPKD)', kategori: 'DINAS', aliases: ['bpkd', 'pengelolaan keuangan daerah', 'pengelolaan keuangan', 'dinas pengelolaan keuangan'] },
    { id: 'BAPPEDA', nama: 'Badan Perencanaan Pembangunan Daerah (Bappeda)', kategori: 'DINAS', aliases: ['bappeda', 'perencanaan pembangunan'] },
    { id: 'BPBD', nama: 'Badan Penanggulangan Bencana Daerah (BPBD)', kategori: 'DINAS', aliases: ['bpbd', 'penanggulangan bencana'] },
    { id: 'KESBANGPOL', nama: 'Badan Kesatuan Bangsa dan Politik (Kesbangpol)', kategori: 'DINAS', aliases: ['kesbangpol', 'kesatuan bangsa'] },
    { id: 'INSPEKTORAT', nama: 'Inspektorat Daerah', kategori: 'DINAS', aliases: ['inspektorat'] },
    { id: 'SATPOL_PP_WH', nama: 'Satuan Polisi Pamong Praja dan Wilayatul Hisbah (Satpol PP dan WH)', kategori: 'DINAS', aliases: ['satpol', 'polisi pamong praja', 'wilayatul hisbah'] },
    { id: 'RSUD_ZM', nama: 'Rumah Sakit Umum Daerah (RSUD) dr. Zubir Mahmud', kategori: 'DINAS', aliases: ['zubir mahmud', 'rsud zm', 'rsud dr. zubir', 'rsud zubir'] },
    { id: 'RSUD_SAAS', nama: 'Rumah Sakit Umum Daerah (RSUD) Sultan Abdul Aziz Syah Peureulak', kategori: 'DINAS', aliases: ['sultan abdul aziz syah', 'rsud saas', 'rsud peureulak', 'sultan abdul'] },
    { id: 'DISDIK', nama: 'Dinas Pendidikan dan Kebudayaan', kategori: 'DINAS', aliases: ['pendidikan dan kebudayaan', 'dinas pendidikan dan kebudayaan', 'disdik'] },
    { id: 'DINKES', nama: 'Dinas Kesehatan', kategori: 'DINAS', aliases: ['dinkes', 'dinas kesehatan'] },
    { id: 'PUPR', nama: 'Dinas Pekerjaan Umum dan Perumahan Rakyat (PUPR)', kategori: 'DINAS', aliases: ['pupr', 'pekerjaan umum', 'perumahan rakyat'] },
    { id: 'DINSOS', nama: 'Dinas Sosial', kategori: 'DINAS', aliases: ['dinsos', 'dinas sosial'] },
    { id: 'DISDUKCAPIL', nama: 'Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil)', kategori: 'DINAS', aliases: ['disdukcapil', 'kependudukan dan pencatatan', 'kependudukan'] },
    { id: 'DPMG', nama: 'Dinas Pemberdayaan Masyarakat dan Gampong (DPMG)', kategori: 'DINAS', aliases: ['dpmg', 'pemberdayaan masyarakat dan gampong', 'pemberdayaan masyarakat gampong'] },
    { id: 'DSI', nama: 'Dinas Syariat Islam', kategori: 'DINAS', aliases: ['syariat islam', 'dsi', 'dinas syariat'] },
    { id: 'DINAS_DAYAH', nama: 'Dinas Pendidikan Dayah', kategori: 'DINAS', aliases: ['pendidikan dayah', 'dinas pendidikan dayah', 'dayah'] },
    { id: 'DPMP2T', nama: 'Dinas Penanaman Modal dan Pelayanan Perizinan Terpadu (DPMP2T)', kategori: 'DINAS', aliases: ['dpmp2t', 'dpmptsp', 'penanaman modal', 'perizinan terpadu', 'pelayanan terpadu satu pintu'] },
    { id: 'DISKOMINFO', nama: 'Dinas Komunikasi dan Informatika (Diskominfo)', kategori: 'DINAS', aliases: ['diskominfo', 'komunikasi dan informatika', 'kominfo'] },
    { id: 'DISHUB', nama: 'Dinas Perhubungan', kategori: 'DINAS', aliases: ['dishub', 'dinas perhubungan', 'perhubungan'] },
    { id: 'DLH', nama: 'Dinas Lingkungan Hidup', kategori: 'DINAS', aliases: ['dlh', 'lingkungan hidup', 'dinas lingkungan'] },
    { id: 'DISPARPORA', nama: 'Dinas Pariwisata, Pemuda, dan Olahraga (Disparpora)', kategori: 'DINAS', aliases: ['disparpora', 'pariwisata pemuda dan olahraga', 'pariwisata pemuda', 'pariwisata', 'pemuda dan olahraga', 'pemuda dan olah raga'] },
    { id: 'DISKOPUKM', nama: 'Dinas Perdagangan, Koperasi, dan UKM', kategori: 'DINAS', aliases: ['perdagangan koperasi dan usaha kecil menengah', 'perdagangan koperasi', 'diskopukm', 'koperasi dan ukm', 'usaha kecil menengah', 'perdagangan koperasi dan ukm', 'perdagangan'] },
    { id: 'DISBUNNAK', nama: 'Dinas Perkebunan dan Peternakan', kategori: 'DINAS', aliases: ['disbunnak', 'perkebunan dan peternakan', 'perkebunan dan perternakan', 'perkebunan', 'peternakan', 'perternakan'] },
    { id: 'DKP', nama: 'Dinas Kelautan dan Perikanan', kategori: 'DINAS', aliases: ['kelautan dan perikanan', 'dinas perikanan', 'perikanan', 'kelautan', 'dkp'] },
    { id: 'DP3AKB', nama: 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, dan KB (DP3AKB)', kategori: 'DINAS', aliases: ['dp3akb', 'pemberdayaan perempuan perlindungan anak dan keluarga berencana', 'pemberdayaan perempuan', 'perlindungan anak', 'keluarga berencana'] },
    { id: 'DISPUSIP', nama: 'Dinas Perpustakaan dan Kearsipan', kategori: 'DINAS', aliases: ['dispusip', 'perpustakaan dan kearsipan', 'perpustakaan', 'kearsipan'] },
    { id: 'PERTANAHAN', nama: 'Dinas Pertanahan', kategori: 'DINAS', aliases: ['dinas pertanahan', 'pertanahan'] },
    { id: 'DISTANTPH', nama: 'Dinas Tanaman Pangan dan Hortikultura', kategori: 'DINAS', aliases: ['distantph', 'tanaman pangan dan hortikultura', 'tanaman pangan', 'hortikultura'] },
    { id: 'DKPP', nama: 'Dinas Ketahanan Pangan dan Penyuluhan', kategori: 'DINAS', aliases: ['dkpp', 'ketahanan pangan dan penyuluhan', 'ketahangan pangan dan penyuluhan', 'ketahanan pangan', 'ketahangan pangan'] },
    { id: 'DISPERINNAKERTRANS', nama: 'Dinas Perindustrian, Tenaga Kerja dan Transmigrasi', kategori: 'DINAS', aliases: ['disperinnakertrans', 'perindustrian tenaga kerja dan transmigrasi', 'perindustrian tenaga kerja', 'tenaga kerja dan transmigrasi', 'transmigrasi'] },
    { id: 'SETWAN', nama: 'Sekretariat Dewan Perwakilan Rakyat Kabupaten', kategori: 'DINAS', aliases: ['setwan', 'sekretariat dprk', 'sekretariat dewan perwakilan rakyat', 'sekretariat dewan'] },
    { id: 'SET_BAITUL_MAL', nama: 'Sekretariat Baitul Mal', kategori: 'DINAS', aliases: ['baitul mal', 'sekretariat baitul mal'] },
    { id: 'SET_MAA', nama: 'Sekretariat Majelis Adat Aceh', kategori: 'DINAS', aliases: ['majelis adat aceh', 'sekretariat majelis adat aceh', 'maa'] },
    { id: 'SET_MPA', nama: 'Sekretariat Majelis Pendidikan Aceh (MPA)', kategori: 'DINAS', aliases: ['majelis pendidikan aceh', 'sekretariat majelis pendidikan aceh', 'mpa', 'mpd'] },
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
    // Pastikan database dimulai dalam kondisi bersih (kosong) agar pengguna dapat mencoba mengunggah dataset master secara mandiri.
    if (localStorage.getItem('simonika_db_clean_v2') !== 'true') {
        localStorage.removeItem(LOCAL_STORAGE_KEY_REKAP);
        localStorage.setItem('simonika_db_clean_v2', 'true');
        try {
            const db = await openSimonikaDB();
            if (db && db.objectStoreNames.contains(STORE_ASN)) {
                const tx = db.transaction([STORE_ASN], 'readwrite');
                const store = tx.objectStore(STORE_ASN);
                store.clear();
            }
        } catch (e) {}
    }
}

async function resetAllSimonikaData() {
    const confirmRes = await simonikaConfirm({
        title: 'Kosongkan Seluruh Database?',
        text: 'Tindakan ini akan menghapus seluruh dataset master, rincian ASN nominatif, dan rekapitulasi yang tersimpan di sistem.',
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
        populateFilters();
        refreshAllData();
        simonikaAlert({
            title: 'Database Dikosongkan!',
            text: 'Seluruh dataset master dan data nominatif ASN berhasil dibersihkan dari sistem.',
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
                badge.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0';
                if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
                text.textContent = filledCount + ' OPD';
            } else {
                badge.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold uppercase bg-slate-100 text-slate-500 border border-slate-200 shrink-0';
                if (dot) dot.className = 'w-2 h-2 rounded-full bg-slate-400';
                text.textContent = 'Kosong';
            }
        }

        if (cont) {
            const iconBox = cont.querySelector('div.rounded-lg');
            if (hasData) {
                cont.className = 'flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border-2 border-indigo-500 bg-white shadow-md shadow-indigo-500/15 transition-all duration-200';
                if (iconBox) iconBox.className = 'p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs shrink-0 flex items-center justify-center transition-colors';
            } else {
                cont.className = 'flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 shadow-none transition-all duration-200';
                if (iconBox) iconBox.className = 'p-1.5 rounded-lg bg-slate-200 text-slate-400 shrink-0 flex items-center justify-center transition-colors';
            }
        }
    });
}

function populateOpdSingleSelect() {
    const select = document.getElementById('opd-single-select');
    if (!select) return;

    select.innerHTML = '';
    MASTER_OPD_LIST.slice().sort((a, b) => a.nama.localeCompare(b.nama)).forEach(opd => {
        const opt = document.createElement('option');
        opt.value = opd.id;
        opt.textContent = `${opd.nama} (${opd.kategori})`;
        select.appendChild(opt);
    });

    if (USER_LEVEL === 2 && USER_OPD_ID) {
        select.value = USER_OPD_ID;
        select.disabled = true;
    } else if (MASTER_OPD_LIST.some(o => o.id === 'BKPSDM')) {
        select.value = 'BKPSDM';
    }
}

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
                <td class="py-3.5 px-5 font-semibold text-slate-700 flex items-center gap-2.5">
                    <span>${item.emoji}</span>
                    <span class="px-2 py-0.5 rounded-lg border text-xs ${badgeClass}">${item.nama}</span>
                </td>
                <td class="py-3.5 px-4 text-right font-extrabold text-slate-800">${formatNumber(item.jumlah)}</td>
                <td class="py-3.5 px-5 text-right font-medium text-slate-500">${item.persen.toFixed(2)}%</td>
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
    if (!db) return [];

    return new Promise((resolve) => {
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
            statLabel = 'PPPK DW';
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
// UNDUH DATA ASN LENGKAP HASIL PEMILAHAN (.XLSX)
// ==========================================
async function unduhDataAsnLengkapExcel() {
window.unduhDataAsnLengkapExcel = unduhDataAsnLengkapExcel;
    if (!window.XLSX) {
        simonikaAlert({ title: 'Pustaka Belum Siap', text: 'Pustaka SheetJS (Excel) sedang dimuat. Silakan coba kembali sesaat lagi.', icon: 'warning' });
        return;
    }

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

    // Susun Format Standar BKN e-Kinerja
    const aoa = [
        [`Laporan Penilaian SKP Periode Bulanan ${selectedBulan} Tahun ${selectedYear}`],
        [`Instansi Pemerintah Kab. Aceh Timur - ${opd.nama}`],
        [`Periode : Bulanan ${selectedBulan}`],
        [`Unor Induk : ${opd.nama}`],
        [`Unor : ALL`],
        [`Data ditarik pada : ${new Date().toLocaleString('id-ID')}`],
        [],
        [
            'No',
            'nip',
            'nama',
            'skp_unor',
            'skp_unor_induk',
            'skp_jabatan',
            'hasil_kerja',
            'perilaku_kerja',
            'hasil_akhir',
            'golru',
            'jenis_pegawai',
            'skp_jenis_jabatan',
            'is_skp_plt_plh_pjb'
        ]
    ];

    records.forEach((r, i) => {
        aoa.push([
            i + 1,
            r.nip || '',
            r.nama || '',
            r.skp_unor || opd.nama,
            r.skp_unor_induk || opd.nama,
            r.skp_jabatan || '',
            r.hasil_kerja || '',
            r.perilaku_kerja || '',
            r.hasil_akhir || '',
            r.golru || '',
            r.jenis_pegawai || '',
            r.skp_jenis_jabatan || '',
            r.is_skp_plt_plh_pjb || '0'
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data ASN SKP");

    const fileName = `Laporan_SKP_ASN_${opd.id}_${selectedBulan}_${selectedYear}.xlsx`;
    XLSX.writeFile(wb, fileName);
};

function unduhRekapOpdExcel() {
window.unduhRekapOpdExcel = unduhRekapOpdExcel;
    const select = document.getElementById('opd-single-select');
    if (!window.XLSX) return;

    let opdId = (USER_LEVEL === 2 && USER_OPD_ID) ? USER_OPD_ID : (select?.value || 'BKPSDM');
    const selectedYear = parseInt(document.getElementById('opd-filter-tahun')?.value || 2026);
    const selectedBulan = document.getElementById('opd-filter-bulan')?.value || 'JULI';
    const opd = MASTER_OPD_LIST.find(o => o.id === opdId) || { id: opdId, nama: (USER_LEVEL === 2 ? USER_OPD_NAME : opdId), kategori: 'DINAS' };

    const localList = getLocalRekapList();
    const opdData = localList.find(item => item.opd_id === opdId && item.bulan === selectedBulan && parseInt(item.tahun) === selectedYear);

    const aoa = [
        ["REKAPITULASI PENILAIAN CAPAIAN KINERJA SKP ASN"],
        ["PEMERINTAH KABUPATEN ACEH TIMUR"],
        [`UNIT KERJA: ${opd.nama}`],
        [`PERIODE: ${selectedBulan} ${selectedYear}`],
        [],
        ["Kategori Pegawai / Predikat", "Jumlah Pegawai"],
        ["PNS", opdData ? (opdData.pns || 0) : 0],
        ["PPPK", opdData ? (opdData.pppk || 0) : 0],
        ["PPPK PW / DW", opdData ? (opdData.pppk_dw || 0) : 0],
        ["TOTAL PEGAWAI", opdData ? ((opdData.pns || 0) + (opdData.pppk || 0) + (opdData.pppk_dw || 0)) : 0],
        [],
        ["Predikat Sangat Baik", opdData ? (opdData.sangat_baik || 0) : 0],
        ["Predikat Baik", opdData ? (opdData.baik || 0) : 0],
        ["Predikat Butuh Perbaikan", opdData ? (opdData.butuh_perbaikan || 0) : 0],
        ["Predikat Kurang", opdData ? (opdData.kurang || 0) : 0],
        ["Predikat Sangat Kurang", opdData ? (opdData.sangat_kurang || 0) : 0],
        ["Tidak Membuat SKP", opdData ? (opdData.tidak_membuat_skp || 0) : 0]
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap SKP OPD");

    const fileName = `Rekap_SKP_${opd.id}_${selectedBulan}_${selectedYear}.xlsx`;
    XLSX.writeFile(wb, fileName);
};

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
        renderSelectedOpdDetail();
        select.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

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

        setTimeout(() => {
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

                    // Deteksi Status Kepegawaian (PNS / PPPK / PPPK DW)
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
                saveAsnRecordsBatch(allAsnRecords, finalMonth, finalYear).then(() => {
                    console.log(`Berhasil menyimpan ${allAsnRecords.length} baris nominatif ASN ke IndexedDB.`);
                });

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
            totalPegawai = parseInt(dbData.pns || 0) + parseInt(dbData.pppk || 0) + parseInt(dbData.pppk_dw || 0);
            sangatBaik = parseInt(dbData.sangat_baik || 0);
            baik = parseInt(dbData.baik || 0);
            butuhPerbaikan = parseInt(dbData.butuh_perbaikan || 0);
            kurang = parseInt(dbData.kurang || 0);
            sangatKurang = parseInt(dbData.sangat_kurang || 0);
            tidakMembuatSkp = parseInt(dbData.tidak_membuat_skp || 0);

            countPns += parseInt(dbData.pns || 0);
            countPppk += (parseInt(dbData.pppk || 0) + parseInt(dbData.pppk_dw || 0));

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
            <td class="py-3 px-3 text-right text-slate-500 font-semibold">${hasData ? formatNumber(tidakMembuatSkp) : '-'}</td>
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
            <td style="text-align: right;">${hasData ? formatNumber(tidakMembuatSkp) : '0'}</td>
        `;
        printTableBody.appendChild(printTr);
    });

    const maxOpdDisplay = (USER_LEVEL === 2 && USER_OPD_ID) ? 1 : MASTER_OPD_LIST.length;

    // Summary Labels
    document.getElementById('laporan-total-status').textContent = `${totalOpdFilled} / ${maxOpdDisplay} OPD`;
    document.getElementById('laporan-total-pegawai').textContent = formatNumber(totalPegawaiAcc);
    document.getElementById('laporan-total-sangatbaik').textContent = formatNumber(totalSangatBaikAcc);
    document.getElementById('laporan-total-baik').textContent = formatNumber(totalBaikAcc);
    document.getElementById('laporan-total-butuhperbaikan').textContent = formatNumber(totalButuhPerbaikanAcc);
    document.getElementById('laporan-total-kurang').textContent = formatNumber(totalKurangAcc);
    document.getElementById('laporan-total-sangatkurang').textContent = formatNumber(totalSangatKurangAcc);
    const webTidakMembuat = document.getElementById('laporan-total-tidakmembuatskp');
    if (webTidakMembuat) webTidakMembuat.textContent = formatNumber(totalTidakMembuatSkpAcc);

    // Print Labels
    document.getElementById('print-total-status').textContent = `${totalOpdFilled} OPD`;
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
    if (statAsnRatio) statAsnRatio.textContent = `PNS: ${formatNumber(countPns)} | PPPK: ${formatNumber(countPppk)}`;
    if (printInfoPegawai) printInfoPegawai.textContent = `${formatNumber(totalPegawaiAcc)} ASN (PNS: ${formatNumber(countPns)} | PPPK: ${formatNumber(countPppk)})`;
}

// ==========================================
// CETAK LAPORAN BULANAN (PDF / PRINT VIEW)
// ==========================================
function cetakLaporanBulananPDF() {
    renderLaporanBulanan();
    setTimeout(() => {
        window.print();
    }, 150);
}
window.cetakLaporanBulananPDF = cetakLaporanBulananPDF;

// ==========================================
// EXPORT EXCEL LAPORAN BULANAN (SHEETJS)
// ==========================================
function exportLaporanBulananExcel() {
window.exportLaporanBulananExcel = exportLaporanBulananExcel;
    if (!window.XLSX) {
        simonikaAlert({ title: 'Pustaka Belum Siap', text: 'Pustaka SheetJS (Excel) sedang dimuat. Silakan coba kembali sesaat lagi.', icon: 'warning' });
        return;
    }

    const selectedYear = parseInt(document.getElementById('laporan-filter-tahun')?.value || 2026);
    const selectedBulan = document.getElementById('laporan-filter-bulan')?.value || 'JULI';

    const localList = getLocalRekapList();
    const filledList = localList.filter(item => item.bulan === selectedBulan && parseInt(item.tahun) === selectedYear);

    const filledMap = {};
    filledList.forEach(item => {
        filledMap[item.opd_id] = item;
    });

    const isOpdRole = (USER_LEVEL === 2 && USER_OPD_ID);
    const reportTitle = isOpdRole 
        ? `LAPORAN REKAPITULASI CAPAIAN PREDIKAT KINERJA SKP UNIT KERJA: ${USER_OPD_NAME.toUpperCase()}`
        : "LAPORAN REKAPITULASI CAPAIAN PREDIKAT KINERJA SKP ASN KABUPATEN ACEH TIMUR";

    const aoa = [
        [reportTitle],
        ["PEMERINTAH KABUPATEN ACEH TIMUR"],
        [`PERIODE BULAN: ${selectedBulan}  TAHUN: ${selectedYear}`],
        [],
        [
            "No",
            "Nama Unit Kerja / OPD",
            "Kategori",
            "Status",
            "Total Pegawai",
            "Sangat Baik",
            "Baik",
            "Butuh Perbaikan",
            "Kurang",
            "Sangat Kurang",
            "Tidak Membuat SKP"
        ]
    ];

    let totalPegawaiAcc = 0;
    let totalSangatBaikAcc = 0;
    let totalBaikAcc = 0;
    let totalButuhPerbaikanAcc = 0;
    let totalKurangAcc = 0;
    let totalSangatKurangAcc = 0;
    let totalTidakMembuatSkpAcc = 0;

    let opdListToExport = [];
    if (isOpdRole) {
        opdListToExport = MASTER_OPD_LIST.filter(o => o.id === USER_OPD_ID);
    } else {
        opdListToExport = MASTER_OPD_LIST.slice().sort((a, b) => a.nama.localeCompare(b.nama));
    }

    opdListToExport.forEach((opd, idx) => {
        const item = filledMap[opd.id];
        if (item) {
            const total = (item.pns || 0) + (item.pppk || 0) + (item.pppk_dw || 0);
            totalPegawaiAcc += total;
            totalSangatBaikAcc += (item.sangat_baik || 0);
            totalBaikAcc += (item.baik || 0);
            totalButuhPerbaikanAcc += (item.butuh_perbaikan || 0);
            totalKurangAcc += (item.kurang || 0);
            totalSangatKurangAcc += (item.sangat_kurang || 0);
            totalTidakMembuatSkpAcc += (item.tidak_membuat_skp || 0);

            aoa.push([
                idx + 1,
                opd.nama,
                opd.kategori,
                "Terisi",
                total,
                item.sangat_baik || 0,
                item.baik || 0,
                item.butuh_perbaikan || 0,
                item.kurang || 0,
                item.sangat_kurang || 0,
                item.tidak_membuat_skp || 0
            ]);
        } else {
            aoa.push([
                idx + 1,
                opd.nama,
                opd.kategori,
                "Belum Ada",
                0, 0, 0, 0, 0, 0, 0
            ]);
        }
    });

    // Total Row
    aoa.push([
        "TOTAL",
        isOpdRole ? `TOTAL REKAPITULASI ${USER_OPD_ID}` : "TOTAL REKAPITULASI KESELURUHAN",
        "-",
        "-",
        totalPegawaiAcc,
        totalSangatBaikAcc,
        totalBaikAcc,
        totalButuhPerbaikanAcc,
        totalKurangAcc,
        totalSangatKurangAcc,
        totalTidakMembuatSkpAcc
    ]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap SKP Bulanan");

    const fileName = isOpdRole 
        ? `Laporan_Rekapitulasi_SKP_${USER_OPD_ID}_${selectedBulan}_${selectedYear}.xlsx`
        : `Laporan_Rekapitulasi_SKP_ASN_${selectedBulan}_${selectedYear}_Kab_Aceh_Timur.xlsx`;

    XLSX.writeFile(wb, fileName);
};

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
            tab.className = "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all bg-white text-slate-800 shadow-sm focus:outline-none";
        } else {
            tab.className = "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all text-slate-500 hover:text-slate-850 focus:outline-none";
        }
    });

    updateOpdDropdown();
    updateDashboardDynamic();
};

function switchView(viewName) {
window.switchView = switchView;
    if (USER_LEVEL === 2 && viewName === 'master-data') {
        simonikaAlert({
        title: 'Akses Terbatas',
        html: `<p class="text-xs text-slate-600 leading-relaxed">Halaman <strong>Master Data e-Kinerja</strong> hanya dapat diakses oleh <strong>Administrator BKPSDM (Level 1)</strong>.</p>`,
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
                        ticks: { font: { size: 11, weight: '600', family: 'Inter' }, color: '#64748b' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9', drawBorder: false },
                        ticks: { font: { size: 11, family: 'Inter' }, color: '#64748b', callback: function (value) { return formatNumber(value); } }
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

    // Seed Demo
    ensureInitialRealSeed();

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

