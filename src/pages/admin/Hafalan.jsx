import { useMemo, useState } from 'react';
import {
    Box, Card, Chip, LinearProgress, MenuItem, Pagination, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import Timer from '@mui/icons-material/Timer';
import { palette } from '../../theme/theme';

// TODO: ganti data dummy ini dengan data dari API backend.
// Setoran dicatat ustadz (FR-13, FR-14). Di sini admin hanya melihat.

const TARGET = 20; // halaman per bulan (1 juz)
const BULAN = { tahun: 2026, bulan: 10, nama: 'Oktober 2026' };
const TANGGAL_REF = '2026-10-17'; // "hari ini" untuk data dummy; ganti dengan tanggal sekarang saat data asli
const PER_PAGE = 10;

const KUNCI_KELOMPOK = 'dataKelompok';
const KELOMPOK_DEFAULT = ['Al-Fatih', 'Al-Nur', 'Ar-Rahman', 'Al-Ikhlas', 'Al-Falah', 'An-Naba'];

const muatNamaKelompok = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KUNCI_KELOMPOK));
        if (Array.isArray(saved)) return saved.map((k) => k.nama);
    } catch {
        /* data rusak: pakai daftar bawaan */
    }
    return KELOMPOK_DEFAULT;
};

const JENIS = ['Hafalan', "Muraja'ah"];

const SETORAN = [
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

// ---------- Hitungan target & beasiswa ----------
const hariBulan = new Date(BULAN.tahun, BULAN.bulan, 0).getDate();
const hariBerjalan = Number(TANGGAL_REF.slice(8, 10));
const targetSampaiHariIni = (TARGET * hariBerjalan) / hariBulan;

// Beasiswa otomatis (FR-07): Tercapai bila sudah 20 halaman.
// Selain itu, Tertinggal bila di bawah laju yang dibutuhkan, selebihnya Belum tercapai.
const statusBeasiswa = (progres) => {
    if (progres >= TARGET) return 'Tercapai';
    return progres < targetSampaiHariIni ? 'Tertinggal' : 'Belum tercapai';
};

const WARNA_STATUS = {
    Tercapai: 'success',
    'Belum tercapai': 'warning',
    Tertinggal: 'error',
};

const formatTanggal = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
    });

export default function Hafalan() {
    const daftarKelompok = useMemo(muatNamaKelompok, []);

    const [tanggal, setTanggal] = useState('');
    const [jenis, setJenis] = useState('all');
    const [kelompok, setKelompok] = useState('all');
    const [halaman, setHalaman] = useState(1);

    // Progres bulan ini per santri: hanya setoran hafalan baru yang dihitung (FR-06)
    const progresSantri = useMemo(() => {
        const hasil = {};
        SETORAN.forEach((s) => {
            if (s.jenis === 'Hafalan' && s.tanggal.startsWith(`${BULAN.tahun}-${BULAN.bulan}`)) {
                hasil[s.santri] = (hasil[s.santri] ?? 0) + s.halaman;
            }
        });
        return hasil;
    }, []);

    const terfilter = useMemo(
        () =>
            SETORAN.filter(
                (s) =>
                    (!tanggal || s.tanggal === tanggal) &&
                    (jenis === 'all' || s.jenis === jenis) &&
                    (kelompok === 'all' || s.kelompok === kelompok)
            ).sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id - a.id),
        [tanggal, jenis, kelompok]
    );

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
            <Typography color="text.secondary" sx={{ mt: -1 }}>
                Riwayat setoran, capaian target {TARGET} halaman/bulan, dan status beasiswa {BULAN.nama}
            </Typography>

            {/* Filter */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    type="date"
                    size="small"
                    value={tanggal}
                    onChange={ubahFilter(setTanggal)}
                    sx={{ minWidth: 170, bgcolor: '#fff' }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter tanggal' } }}
                />

                <TextField
                    select
                    size="small"
                    value={jenis}
                    onChange={ubahFilter(setJenis)}
                    sx={{ minWidth: 170, bgcolor: '#fff' }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter jenis setoran' } }}
                >
                    <MenuItem value="all">Semua jenis</MenuItem>
                    {JENIS.map((j) => (
                        <MenuItem key={j} value={j}>{j}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    size="small"
                    value={kelompok}
                    onChange={ubahFilter(setKelompok)}
                    sx={{ minWidth: 190, bgcolor: '#fff' }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter kelompok' } }}
                >
                    <MenuItem value="all">Semua Kelompok</MenuItem>
                    {daftarKelompok.map((k) => (
                        <MenuItem key={k} value={k}>{k}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {/* Keterangan target */}
            <Box
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 3,
                    bgcolor: palette.honeydew, border: `1px solid ${palette.aquamarine}`,
                }}
            >
                <Timer sx={{ color: palette.turfGreen, fontSize: 32 }} />
                <Box>
                    <Typography sx={{ fontWeight: 600 }}>
                        Target: {TARGET} halaman (1 juz)/bulan. Tercapai = beasiswa otomatis, bebas SPP bulan ini.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Yang dihitung hanya setoran hafalan baru. Muraja'ah tidak masuk target.
                    </Typography>
                </Box>
            </Box>

            {/* Tabel */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Tanggal</TableCell>
                                <TableCell>Santri</TableCell>
                                <TableCell>Jenis</TableCell>
                                <TableCell>Surat/ayat</TableCell>
                                <TableCell sx={{ minWidth: 190 }}>Progres bulan ini</TableCell>
                                <TableCell align="center">Beasiswa</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tampil.map((s) => {
                                const progres = progresSantri[s.santri] ?? 0;
                                const status = statusBeasiswa(progres);

                                return (
                                    <TableRow key={s.id} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {formatTanggal(s.tanggal)}
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 600 }}>{s.santri}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {s.kelompok}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={s.jenis}
                                                size="small"
                                                sx={{
                                                    bgcolor: palette.frostedMint,
                                                    color: palette.pineTeal,
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{s.surat}</TableCell>
                                        <TableCell>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(100, (progres / TARGET) * 100)}
                                                color={status === 'Tertinggal' ? 'error' : 'primary'}
                                                sx={{ height: 8, borderRadius: 4, bgcolor: palette.frostedMint }}
                                                aria-label={`Progres ${s.santri}`}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {progres}/{TARGET} halaman
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={status}
                                                size="small"
                                                color={WARNA_STATUS[status]}
                                                sx={{ fontWeight: 600, minWidth: 110 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {terfilter.length === 0 && (
                    <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                        Tidak ada setoran yang cocok. Ubah tanggal, jenis, atau kelompok.
                    </Typography>
                )}
            </Card>

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