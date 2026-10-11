import { useMemo, useState } from 'react';
import {
    Box, Card, Chip, InputAdornment, MenuItem, Pagination, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import Search from '@mui/icons-material/Search';
import MenuBook from '@mui/icons-material/MenuBook';
import Groups from '@mui/icons-material/Groups';
import TrendingUp from '@mui/icons-material/TrendingUp';
import WarningAmber from '@mui/icons-material/WarningAmber';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import { palette } from '../../theme/theme';

// TODO: ganti data dummy ini dengan data dari API backend.
// Angka ringkasan nanti dihitung dari data santri bimbingan ustadz yang login (FR-12, FR-18).
const STATISTIK = [
    { title: 'Santri bimbingan', value: '18', satuan: 'santri', icon: Groups },
    { title: 'Setoran hari ini', value: '6', satuan: 'setoran', icon: MenuBook },
    { title: 'Capaian target bulan ini', value: '72%', satuan: 'dari target', icon: TrendingUp },
    { title: 'Tertinggal', value: '3', satuan: 'santri', icon: WarningAmber, peringatan: true },
];

const SETORAN = [
    { id: 1, tanggal: '2026-10-09', santri: 'Ahmad Fauzan', jenis: 'Hafalan', surat: 'An-Naba 1-20', halaman: 2, nilai: 'B+', catatan: 'Lancar' },
    { id: 2, tanggal: '2026-10-09', santri: 'Tesa Damayanti', jenis: "Muraja'ah", surat: 'Juz 29', halaman: 4, nilai: 'A', catatan: 'Tajwid' },
    { id: 3, tanggal: '2026-10-08', santri: 'Citra Anggun', jenis: 'Hafalan', surat: 'An-Naba 1-20', halaman: 2, nilai: 'A', catatan: 'Lancar' },
    { id: 4, tanggal: '2026-10-08', santri: 'Rizki Hanafi', jenis: "Muraja'ah", surat: 'An-Naba 1-20', halaman: 1, nilai: 'A', catatan: 'Ulangi' },
    { id: 5, tanggal: '2026-10-07', santri: 'Muhammad Iqbal', jenis: 'Hafalan', surat: 'Al-Mulk 1-10', halaman: 2, nilai: 'B', catatan: 'Perbaiki makhraj' },
    { id: 6, tanggal: '2026-10-06', santri: 'Miftahul Jannah', jenis: "Muraja'ah", surat: 'Juz 30', halaman: 3, nilai: 'A', catatan: 'Lancar' },
    { id: 7, tanggal: '2026-10-06', santri: 'Nur Aisyah', jenis: 'Hafalan', surat: 'An-Naziat 1-26', halaman: 3, nilai: 'A', catatan: 'Lancar' },
    { id: 8, tanggal: '2026-10-05', santri: 'Dimas Pratama', jenis: 'Hafalan', surat: 'Abasa 1-20', halaman: 2, nilai: 'B', catatan: 'Tajwid' },
    { id: 9, tanggal: '2026-10-05', santri: 'Habib Ramadhan', jenis: "Muraja'ah", surat: 'Juz 29', halaman: 5, nilai: 'B+', catatan: 'Lancar' },
    { id: 10, tanggal: '2026-10-03', santri: 'Salsabila', jenis: 'Hafalan', surat: 'At-Takwir 1-29', halaman: 3, nilai: 'C', catatan: 'Ulangi minggu depan' },
    { id: 11, tanggal: '2026-10-02', santri: 'Ahmad Rizki', jenis: 'Hafalan', surat: 'Al-Infitar 1-19', halaman: 2, nilai: 'A', catatan: 'Lancar' },
    { id: 12, tanggal: '2026-10-01', santri: 'Fauzan Ahmad', jenis: "Muraja'ah", surat: 'Juz 30', halaman: 4, nilai: 'B', catatan: 'Perbaiki panjang pendek' },
];

const JENIS = ['Hafalan', "Muraja'ah"];

// Warna chip jenis setoran: Hafalan hijau, Muraja'ah biru
const WARNA_JENIS = {
    Hafalan: { bg: palette.frostedMint, text: palette.pineTeal },
    "Muraja'ah": { bg: '#DBEAFE', text: '#1E40AF' },
};

const PER_PAGE = 10;

const WARNA_NILAI = (nilai) => {
    if (nilai.startsWith('A')) return palette.turfGreen;
    if (nilai.startsWith('B')) return palette.shamrock;
    return '#B45309'; // C ke bawah: perlu perhatian
};

// Kolom isian berbentuk pil dengan garis hijau
const pilSx = {
    bgcolor: '#fff',
    '& .MuiOutlinedInput-root': {
        borderRadius: 6,
        '& fieldset': { borderColor: palette.shamrock },
        '&:hover fieldset': { borderColor: palette.turfGreen },
    },
};

const formatTanggal = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
    });

function KartuStatistik({ title, value, satuan, icon: Icon, peringatan }) {
    return (
        <Card
            variant="outlined"
            sx={{ p: 2, borderRadius: 3, borderColor: palette.aquamarine, height: '100%' }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: palette.pineTeal, lineHeight: 1.4 }}>
                    {title}
                </Typography>
                <Icon sx={{ color: peringatan ? '#B45309' : palette.shamrock, flexShrink: 0 }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 1 }}>
                <Typography
                    sx={{
                        fontSize: 30, fontWeight: 700, lineHeight: 1.2,
                        color: peringatan ? '#B45309' : palette.pineTeal,
                    }}
                >
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">{satuan}</Typography>
            </Box>
        </Card>
    );
}

export default function UstadzDashboard() {
    const [cari, setCari] = useState('');
    const [jenis, setJenis] = useState('all');
    const [tanggal, setTanggal] = useState('');
    const [halaman, setHalaman] = useState(1);

    const terfilter = useMemo(() => {
        const q = cari.trim().toLowerCase();
        return SETORAN.filter(
            (s) =>
                (!q || s.santri.toLowerCase().includes(q)) &&
                (jenis === 'all' || s.jenis === jenis) &&
                (!tanggal || s.tanggal === tanggal)
        ).sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id - a.id);
    }, [cari, jenis, tanggal]);

    const totalHalaman = Math.max(1, Math.ceil(terfilter.length / PER_PAGE));
    const halamanAman = Math.min(halaman, totalHalaman);
    const mulai = (halamanAman - 1) * PER_PAGE;
    const tampil = terfilter.slice(mulai, mulai + PER_PAGE);

    const ubahFilter = (setter) => (e) => {
        setter(e.target.value);
        setHalaman(1);
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            {/* Ringkasan */}
            <Box
                sx={{
                    display: 'grid', gap: 2,
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                }}
            >
                {STATISTIK.map((item) => (
                    <KartuStatistik key={item.title} {...item} />
                ))}
            </Box>

            {/* Pencarian dan filter */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    size="small"
                    placeholder="Cari nama santri ....."
                    value={cari}
                    onChange={ubahFilter(setCari)}
                    sx={{ ...pilSx, flex: '1 1 240px', maxWidth: 340 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" sx={{ color: palette.shamrock }} />
                                </InputAdornment>
                            ),
                        },
                        htmlInput: { 'aria-label': 'Cari nama santri' },
                    }}
                />

                <TextField
                    select
                    size="small"
                    value={jenis}
                    onChange={ubahFilter(setJenis)}
                    sx={{ ...pilSx, minWidth: 170 }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter jenis setoran' } }}
                >
                    <MenuItem value="all">Semua jenis</MenuItem>
                    {JENIS.map((j) => (
                        <MenuItem key={j} value={j}>{j}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    type="date"
                    size="small"
                    value={tanggal}
                    onChange={ubahFilter(setTanggal)}
                    sx={{ ...pilSx, minWidth: 190 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CalendarMonth fontSize="small" sx={{ color: palette.shamrock }} />
                                </InputAdornment>
                            ),
                        },
                        htmlInput: { 'aria-label': 'Filter tanggal setoran' },
                    }}
                />
            </Box>

            {/* Setoran terbaru */}
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: palette.pineTeal }}>
                    Setoran Terbaru
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Riwayat setoran santri bimbingan
                </Typography>

                <Card variant="outlined" sx={{ borderRadius: 3, borderColor: palette.aquamarine, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table size="small" sx={{ minWidth: 760 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tanggal</TableCell>
                                    <TableCell>Santri</TableCell>
                                    <TableCell>Jenis</TableCell>
                                    <TableCell>Surah/Ayat</TableCell>
                                    <TableCell align="center">Halaman</TableCell>
                                    <TableCell align="center">Nilai</TableCell>
                                    <TableCell>Catatan</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {tampil.map((s) => (
                                    <TableRow key={s.id} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTanggal(s.tanggal)}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{s.santri}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={s.jenis}
                                                size="small"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: WARNA_JENIS[s.jenis].text,
                                                    bgcolor: WARNA_JENIS[s.jenis].bg,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{s.surat}</TableCell>
                                        <TableCell align="center">{s.halaman}</TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ fontWeight: 700, color: WARNA_NILAI(s.nilai) }}
                                        >
                                            {s.nilai}
                                        </TableCell>
                                        <TableCell>{s.catatan}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {terfilter.length === 0 && (
                        <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                            Tidak ada setoran yang cocok. Ubah kata kunci, jenis, atau tanggal.
                        </Typography>
                    )}
                </Card>
            </Box>

            {/* Keterangan & halaman */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {terfilter.length === 0
                        ? 'Menampilkan 0 setoran'
                        : `Menampilkan ${mulai + 1}-${mulai + tampil.length} dari ${terfilter.length} setoran`}
                </Typography>

                <Pagination
                    count={totalHalaman}
                    page={halamanAman}
                    onChange={(_, nomor) => setHalaman(nomor)}
                    variant="outlined"
                    shape="rounded"
                    sx={{
                        '& .MuiPaginationItem-root': {
                            borderColor: palette.pineTeal,
                            color: palette.pineTeal,
                            fontWeight: 600,
                            borderRadius: 2,
                        },
                        '& .MuiPaginationItem-root.Mui-selected': {
                            bgcolor: palette.frostedMint,
                            borderColor: palette.pineTeal,
                        },
                    }}
                />
            </Box>
        </Box>
    );
}
