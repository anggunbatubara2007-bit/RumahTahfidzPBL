import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Card, CardContent, Chip, InputAdornment, List, ListItemButton,
    ListItemText, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Typography,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { palette } from '../../theme/theme';

// TODO: ganti data dummy ini dengan data dari API backend.
const STATS = { totalSantri: 45, totalUstadz: 17, totalKelompok: 6 };

// Data setoran diambil dari halaman Hafalan, Target & Beasiswa (FR-04)
const SETORAN_HAFALAN = [
    { id: 1, tanggal: '2026-10-03', santri: 'Ahmad Fauzan', kelompok: 'Al-Fatih', jenis: 'Hafalan', surat: 'An-Naba 1-20', halaman: 5 },
    { id: 2, tanggal: '2026-10-08', santri: 'Ahmad Fauzan', kelompok: 'Al-Fatih', jenis: 'Hafalan', surat: 'An-Naba 21-40', halaman: 5 },
    { id: 3, tanggal: '2026-10-10', santri: 'Ahmad Fauzan', kelompok: 'Al-Fatih', jenis: "Muraja'ah", surat: 'Juz 29', halaman: 4 },
    { id: 4, tanggal: '2026-10-12', santri: 'Ahmad Fauzan', kelompok: 'Al-Fatih', jenis: 'Hafalan', surat: 'Al-Mursalat 1-25', halaman: 5 },
    { id: 5, tanggal: '2026-10-16', santri: 'Ahmad Fauzan', kelompok: 'Al-Fatih', jenis: 'Hafalan', surat: 'Al-Mursalat 26-50', halaman: 5 },
    { id: 6, tanggal: '2026-10-05', santri: 'Tesa Damayanti', kelompok: 'Al-Nur', jenis: 'Hafalan', surat: 'An-Naziat 1-46', halaman: 7 },
    { id: 7, tanggal: '2026-10-15', santri: 'Tesa Damayanti', kelompok: 'Al-Nur', jenis: 'Hafalan', surat: 'Abasa 1-42', halaman: 7 },
    { id: 8, tanggal: '2026-10-09', santri: 'Citra Anggun', kelompok: 'Ar-Rahman', jenis: 'Hafalan', surat: 'An-Naba 1-20', halaman: 4 },
    { id: 9, tanggal: '2026-10-17', santri: 'Citra Anggun', kelompok: 'Ar-Rahman', jenis: 'Hafalan', surat: 'An-Naba 21-40', halaman: 3 },
    { id: 10, tanggal: '2026-10-06', santri: 'Rizki Hanafi', kelompok: 'Al-Fatih', jenis: 'Hafalan', surat: 'At-Takwir 1-29', halaman: 6 },
    { id: 11, tanggal: '2026-10-14', santri: 'Rizki Hanafi', kelompok: 'Al-Fatih', jenis: 'Hafalan', surat: 'Al-Infitar 1-19', halaman: 6 },
    { id: 12, tanggal: '2026-10-02', santri: 'Mhd. Iqbal', kelompok: 'Al-Nur', jenis: 'Hafalan', surat: 'Al-Mulk 1-30', halaman: 10 },
    { id: 13, tanggal: '2026-10-13', santri: 'Mhd. Iqbal', kelompok: 'Al-Nur', jenis: 'Hafalan', surat: 'Al-Qalam 1-52', halaman: 10 },
    { id: 14, tanggal: '2026-10-11', santri: 'Miftahul Jannah', kelompok: 'Ar-Rahman', jenis: "Muraja'ah", surat: 'Juz 30', halaman: 3 },
];

const TARGET = 20; // target 20 halaman per bulan
const BULAN = { tahun: 2026, bulan: 10 };
const TANGGAL_REF = '2026-10-17';
const hariBulan = new Date(BULAN.tahun, BULAN.bulan, 0).getDate();
const hariBerjalan = Number(TANGGAL_REF.slice(8, 10));
const targetSampaiHariIni = (TARGET * hariBerjalan) / hariBulan;

// Status beasiswa otomatis berdasarkan capaian target bulanan (FR-04)
const statusBeasiswa = (progres) => {
    if (progres >= TARGET) return 'Tercapai';
    return progres < targetSampaiHariIni ? 'Tertinggal' : 'Belum tercapai';
};

const WARNA_STATUS = {
    Tercapai: 'success',
    'Belum tercapai': 'warning',
    Tertinggal: 'error',
};

const VERIFIKASI = [
    { id: 1, santri: 'Ahmad Fauzan', tagihan: 'SPP September' },
    { id: 2, santri: 'Mhd. Iqbal', tagihan: 'SPP Agustus' },
    { id: 3, santri: 'Miftahul Jannah', tagihan: 'SPP September' },
    { id: 4, santri: 'Rizki Hanafi', tagihan: 'SPP Agustus' },
    { id: 5, santri: 'Citra Anggun', tagihan: 'SPP Oktober' },
];

function StatCard({ label, value, icon: Icon }) {
    return (
        <Card>
            <CardContent>
                <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{value}</Typography>
                    <Icon sx={{ fontSize: 48, color: 'primary.main' }} />
                </Box>
            </CardContent>
        </Card>
    );
}

// Panel dengan header hijau tua (dipakai Verifikasi Pembayaran)
function Panel({ title, action, children }) {
    return (
        <Card sx={{ height: '100%', borderColor: palette.emeraldDeep, overflow: 'hidden' }}>
            <Box
                sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 2.5, py: 1.5, bgcolor: palette.emeraldDeep, color: '#fff',
                }}
            >
                <Typography variant="h6" sx={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
                    {title}
                </Typography>
                {action}
            </Box>
            {children}
        </Card>
    );
}

function EmptyState({ children }) {
    return (
        <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            {children}
        </Typography>
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    // Hitung progres hafalan per santri untuk menentukan status beasiswa (FR-04)
    const progresSantri = useMemo(() => {
        const hasil = {};
        SETORAN_HAFALAN.forEach((s) => {
            if (s.jenis === 'Hafalan' && s.tanggal?.startsWith(`${BULAN.tahun}-${BULAN.bulan}`)) {
                hasil[s.santri] = (hasil[s.santri] ?? 0) + s.halaman;
            }
        });
        return hasil;
    }, []);

    // Urutkan setoran terbaru terlebih dahulu
    const daftarSorted = useMemo(() => {
        return [...SETORAN_HAFALAN].sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id - a.id);
    }, []);

    // Filter berdasarkan nama santri (hanya memfilter tabel, tidak berpindah halaman)
    const terfilter = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return daftarSorted;
        return daftarSorted.filter((s) => s.santri.toLowerCase().includes(q));
    }, [query, daftarSorted]);

    // Jika sedang mencari, tampilkan semua yang cocok; jika tidak mencari, tampilkan 5 setoran terbaru
    const tampil = useMemo(() => {
        return query.trim() ? terfilter : terfilter.slice(0, 5);
    }, [query, terfilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        // Hanya memfilter data pada tabel di halaman ini, tidak mengarahkan pengguna ke halaman lain
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            {/* Ringkasan */}
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
                <StatCard label="Total Santri" value={STATS.totalSantri} icon={PeopleIcon} />
                <StatCard label="Total Ustadz" value={STATS.totalUstadz} icon={PersonIcon} />
                <StatCard label="Kelompok Tahfidz" value={STATS.totalKelompok} icon={GroupsIcon} />
            </Box>

            {/* Cari santri: memfilter tabel setoran hafalan langsung di dashboard */}
            <Box component="form" onSubmit={handleSearch} sx={{ maxWidth: 420 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Cari nama santri ....."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    sx={{
                        bgcolor: '#fff',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            '& fieldset': { borderColor: palette.shamrock },
                            '&:hover fieldset': { borderColor: palette.turfGreen },
                        },
                    }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" sx={{ color: palette.shamrock }} />
                                </InputAdornment>
                            ),
                        },
                        htmlInput: { 'aria-label': 'Cari nama santri' },
                    }}
                />
            </Box>

            {/* Setoran & verifikasi */}
            <Box
                sx={{
                    display: 'grid', gap: 3, alignItems: 'start',
                    gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' },
                }}
            >
                {/* Setoran Hafalan Terbaru: 3 kolom (Nama Santri, Surah/Ayat, Status Beasiswa) */}
                <Card sx={{ height: '100%', borderColor: palette.emeraldDeep, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ '& .MuiTableCell-root': { bgcolor: palette.emeraldDeep } }}>
                                {/* Baris 1: judul + tombol */}
                                <TableRow>
                                    <TableCell colSpan={3} sx={{ borderBottom: 0, pt: 1.5, pb: 0.5 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
                                                Setoran Hafalan Terbaru
                                            </Typography>
                                            <Button
                                                size="small"
                                                onClick={() => navigate('/admin/hafalan')}
                                                sx={{
                                                    color: '#fff',
                                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                                                }}
                                            >
                                                Lihat semua
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>

                                {/* Baris 2: nama kolom (3 kolom) */}
                                <TableRow>
                                    <TableCell sx={{ color: palette.frostedMint, pt: 0.5, fontWeight: 700 }}>
                                        Nama Santri
                                    </TableCell>
                                    <TableCell sx={{ color: palette.frostedMint, pt: 0.5, fontWeight: 700 }}>
                                        Surah/Ayat
                                    </TableCell>
                                    <TableCell align="center" sx={{ color: palette.frostedMint, pt: 0.5, fontWeight: 700 }}>
                                        Status Beasiswa
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {tampil.map((s) => {
                                    const progres = progresSantri[s.santri] ?? 0;
                                    const status = statusBeasiswa(progres);

                                    return (
                                        <TableRow key={s.id} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{s.santri}</TableCell>
                                            <TableCell>{s.surat}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={status}
                                                    size="small"
                                                    color={WARNA_STATUS[status] ?? 'default'}
                                                    sx={{ fontWeight: 600, minWidth: 100 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {tampil.length === 0 && (
                        <EmptyState>
                            {query.trim()
                                ? `Tidak ada santri dengan nama "${query}" pada data setoran.`
                                : 'Belum ada setoran hafalan.'}
                        </EmptyState>
                    )}
                </Card>

                {/* Verifikasi Pembayaran */}
                <Panel
                    title="Verifikasi Pembayaran"
                    action={
                        <Chip
                            size="small"
                            color={VERIFIKASI.length ? 'warning' : 'default'}
                            label={`${VERIFIKASI.length} Menunggu`}
                        />
                    }
                >
                    <List disablePadding>
                        {VERIFIKASI.map((v) => (
                            <ListItemButton
                                key={v.id}
                                divider
                                onClick={() => navigate(`/admin/verifikasi?id=${v.id}`)}
                            >
                                <ListItemText
                                    primary={v.santri}
                                    secondary={v.tagihan}
                                    slotProps={{ primary: { fontWeight: 600, fontSize: 14 } }}
                                />
                                <ChevronRightIcon color="action" />
                            </ListItemButton>
                        ))}
                    </List>
                    {VERIFIKASI.length === 0 && (
                        <EmptyState>Tidak ada bukti transfer yang menunggu verifikasi.</EmptyState>
                    )}
                </Panel>
            </Box>
        </Box>
    );
}
