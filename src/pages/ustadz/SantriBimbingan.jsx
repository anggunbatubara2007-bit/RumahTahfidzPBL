import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    InputAdornment, LinearProgress, MenuItem, Pagination, Snackbar, Tab, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useAuth } from '../auth';
import { palette } from '../../theme/theme';

// TODO: ganti penyimpanan localStorage ini dengan API backend.
// Santri bimbingan = santri aktif di kelompok ustadz yang login (FR-08).
const KUNCI_SETORAN = 'dataSetoran';
const KUNCI_SANTRI = 'dataSantri'; // dikelola admin di Data Santri

const TARGET = 20; // halaman per bulan (1 juz)
const PER_PAGE = 10;
const JENIS = ['Hafalan', "Muraja'ah"];
const NILAI = ['A', 'B+', 'B', 'C+', 'C', 'D'];

// Dipakai kalau belum ada santri aktif di kelompok ini pada data santri
const SANTRI_CONTOH = [
    { nis: '2024101', nama: 'Ahmad Fauzan' },
    { nis: '2024102', nama: 'Tesa Damayanti' },
    { nis: '2024103', nama: 'Citra Anggun' },
    { nis: '2024104', nama: 'Rizki Hanafi' },
    { nis: '2024105', nama: 'Miftahul Jannah' },
    { nis: '2024106', nama: 'Mhd. Iqbal' },
    { nis: '2024107', nama: 'Ahmad Rizki' },
];

// Progres awal bulan ini untuk data contoh (jumlah halaman hafalan)
const PROGRES_CONTOH = {
    '2024101': 20, '2024102': 9, '2024103': 15, '2024104': 10,
    '2024105': 20, '2024106': 14, '2024107': 5,
    '2024001': 12, '2024003': 20, '2024005': 5,
};

// ---------- Fungsi bantu ----------
const baca = (kunci) => {
    try {
        return JSON.parse(localStorage.getItem(kunci));
    } catch {
        return null;
    }
};

const dua = (n) => String(n).padStart(2, '0');
const sekarang = new Date();
const hariIni = `${sekarang.getFullYear()}-${dua(sekarang.getMonth() + 1)}-${dua(sekarang.getDate())}`;
const bulanIni = hariIni.slice(0, 7);
const hariBulan = new Date(sekarang.getFullYear(), sekarang.getMonth() + 1, 0).getDate();
const targetSampaiHariIni = (TARGET * sekarang.getDate()) / hariBulan;

const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const namaBulanIni = `${NAMA_BULAN[sekarang.getMonth()]} ${sekarang.getFullYear()}`;

const formatBulanLabel = (ym) => {
    if (!ym) return '';
    const parts = ym.split('-');
    if (parts.length < 2) return ym;
    const thn = Number(parts[0]);
    const bln = Number(parts[1]);
    if (!thn || !bln || bln < 1 || bln > 12) return ym;
    return `${NAMA_BULAN[bln - 1]} ${thn}`;
};

// Tercapai bila 20 halaman. Tertinggal bila di bawah laju yang dibutuhkan, selebihnya Proses.
const statusSantri = (progres) => {
    if (progres >= TARGET) return 'Tercapai';
    return progres < targetSampaiHariIni ? 'Tertinggal' : 'Proses';
};

const WARNA_STATUS = { Tercapai: 'success', Proses: 'info', Tertinggal: 'error' };

const WARNA_JENIS = {
    Hafalan: { bg: palette.frostedMint, text: palette.pineTeal },
    "Muraja'ah": { bg: '#DBEAFE', text: '#1E40AF' },
};

const formatTanggal = (iso) => {
    if (!iso) return '-';
    try {
        return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    } catch {
        return iso;
    }
};

const warnaNilai = (n = '') => {
    if (n === 'A') return 'success';
    if (n.startsWith('B')) return 'primary';
    if (n.startsWith('C')) return 'warning';
    return 'error';
};

// Data setoran awal agar tabel langsung terisi (hanya dipakai sekali)
const buatSetoranAwal = () => {
    const hasil = [];
    Object.entries(PROGRES_CONTOH).forEach(([nis, total]) => {
        const nama =
            SANTRI_CONTOH.find((s) => s.nis === nis)?.nama ?? `Santri ${nis}`;
        let sisa = total;
        let i = 0;
        while (sisa > 0) {
            const halaman = Math.min(5, sisa);
            hasil.push({
                id: `awal-${nis}-${i}`,
                tanggal: `${bulanIni}-${dua(Math.min(sekarang.getDate(), i + 1))}`,
                nis, santri: nama, jenis: 'Hafalan', surat: 'An-Naba 1-20',
                halaman, nilai: 'B+', catatan: '',
            });
            sisa -= halaman;
            i += 1;
        }
    });
    return hasil;
};

const muatSetoran = () => {
    const saved = baca(KUNCI_SETORAN);
    return Array.isArray(saved) ? saved : buatSetoranAwal();
};

const muatSantri = (kelompok) => {
    const saved = baca(KUNCI_SANTRI);
    const daftar = Array.isArray(saved)
        ? saved.filter((s) => s.kelompok === kelompok && s.status === 'Aktif')
        : [];
    return daftar.length > 0
        ? daftar.map((s) => ({ nis: s.nis, nama: s.nama }))
        : SANTRI_CONTOH;
};

const FORM_KOSONG = {
    nis: '', jenis: 'Hafalan', tanggal: hariIni, surat: '', halaman: '', nilai: '', catatan: '',
};

export default function SantriBimbingan() {
    const { user } = useAuth();
    const kelompok = user?.kelompok || 'Al-Fatih';

    const santriList = useMemo(() => muatSantri(kelompok), [kelompok]);
    const [setoran, setSetoran] = useState(muatSetoran);

    const [cari, setCari] = useState('');
    const [filterTanggal, setFilterTanggal] = useState('');
    const [halaman, setHalaman] = useState(1);

    const [dialog, setDialog] = useState(false);
    const [tabDialog, setTabDialog] = useState(0); // 0: Form Catat, 1: Riwayat Hafalan
    const [bulanRiwayat, setBulanRiwayat] = useState(bulanIni); // Filter riwayat per bulan
    const [form, setForm] = useState(FORM_KOSONG);
    const [errors, setErrors] = useState({});
    const [notif, setNotif] = useState(null); // { text, severity }

    useEffect(() => {
        try {
            localStorage.setItem(KUNCI_SETORAN, JSON.stringify(setoran));
        } catch {
            setTimeout(() => {
                setNotif({
                    text: 'Penyimpanan browser penuh. Setoran terakhir mungkin tidak tersimpan.',
                    severity: 'warning',
                });
            }, 0);
        }
    }, [setoran]);

    // Daftar bulan yang tersedia dari data setoran untuk filter riwayat per bulan
    const daftarBulan = useMemo(() => {
        const bulanSet = new Set();
        bulanSet.add(bulanIni);
        setoran.forEach((s) => {
            if (s.tanggal && s.tanggal.length >= 7) {
                bulanSet.add(s.tanggal.slice(0, 7));
            }
        });
        return Array.from(bulanSet).sort((a, b) => b.localeCompare(a));
    }, [setoran]);

    // Progres bulan ini per santri: hanya hafalan baru yang dihitung (FR-08)
    const progres = useMemo(() => {
        const hasil = {};
        setoran.forEach((s) => {
            if (s.jenis === 'Hafalan' && s.tanggal?.startsWith(bulanIni)) {
                hasil[s.nis] = (hasil[s.nis] ?? 0) + s.halaman;
            }
        });
        return hasil;
    }, [setoran]);

    // Riwayat hafalan santri yang dipilih KHUSUS per bulan yang dipilih (per bulan saja)
    const riwayatSantriBulan = useMemo(() => {
        if (!form.nis) return [];
        return setoran
            .filter((s) => s.nis === form.nis && s.tanggal?.startsWith(bulanRiwayat))
            .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || String(b.id).localeCompare(String(a.id)));
    }, [setoran, form.nis, bulanRiwayat]);

    // Total halaman hafalan baru untuk santri pada bulan yang dipilih
    const progresBulanDipilih = useMemo(() => {
        return riwayatSantriBulan
            .filter((s) => s.jenis === 'Hafalan')
            .reduce((sum, s) => sum + Number(s.halaman || 0), 0);
    }, [riwayatSantriBulan]);

    const statusBulanDipilih = statusSantri(progresBulanDipilih);
    const setoranTerakhir = riwayatSantriBulan[0] ?? null;
    const santriTerpilih = santriList.find((s) => s.nis === form.nis);

    // ---------- Daftar Santri (difilter nama dan tanggal di atas tabel) ----------
    const baris = useMemo(() => {
        const q = cari.trim().toLowerCase();
        return santriList
            .filter((s) => {
                const cocokNama = !q || s.nama.toLowerCase().includes(q);
                if (!cocokNama) return false;
                if (filterTanggal) {
                    // Filter berdasarkan tanggal: hanya santri yang memiliki setoran pada tanggal tersebut
                    return setoran.some((st) => st.nis === s.nis && st.tanggal === filterTanggal);
                }
                return true;
            })
            .map((s) => {
                const nilai = progres[s.nis] ?? 0;
                const setoranPadaTanggal = filterTanggal
                    ? setoran.filter((st) => st.nis === s.nis && st.tanggal === filterTanggal)
                    : [];
                return {
                    ...s,
                    progres: nilai,
                    status: statusSantri(nilai),
                    setoranPadaTanggal,
                };
            })
            .sort((a, b) => a.nama.localeCompare(b.nama));
    }, [santriList, cari, progres, filterTanggal, setoran]);

    const totalHalaman = Math.max(1, Math.ceil(baris.length / PER_PAGE));
    const halamanAman = Math.min(halaman, totalHalaman);
    const mulai = (halamanAman - 1) * PER_PAGE;
    const tampil = baris.slice(mulai, mulai + PER_PAGE);

    // ---------- Form catat setoran & riwayat ----------
    const bukaCatat = (nis = '', tab = 0) => {
        setForm({ ...FORM_KOSONG, nis });
        setErrors({});
        setTabDialog(tab);
        setBulanRiwayat(bulanIni);
        setDialog(true);
    };

    const tutupDialog = () => setDialog(false);

    const ubahForm = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const ubahHalaman = (e) => {
        setForm((prev) => ({ ...prev, halaman: e.target.value.replace(/\D/g, '') }));
        setErrors((prev) => ({ ...prev, halaman: '' }));
    };

    const simpan = (e) => {
        e.preventDefault();
        if (tabDialog !== 0) return;

        const surat = form.surat.trim();
        const jumlah = Number(form.halaman);
        const baru = {};

        if (!form.nis) baru.nis = 'Pilih santri.';
        if (!form.tanggal) {
            baru.tanggal = 'Tanggal wajib diisi.';
        } else if (form.tanggal > hariIni) {
            baru.tanggal = 'Tanggal tidak boleh setelah hari ini.';
        }
        if (!surat) baru.surat = 'Surat dan ayat wajib diisi.';
        if (!jumlah || jumlah <= 0) baru.halaman = 'Jumlah halaman harus lebih dari 0.';
        if (!form.nilai) baru.nilai = 'Nilai wajib diisi untuk setiap setoran.'; // FR-09

        setErrors(baru);
        if (Object.keys(baru).length > 0) return;

        const santri = santriList.find((s) => s.nis === form.nis);
        const progresLama = progres[form.nis] ?? 0;
        const hafalan = form.jenis === 'Hafalan';
        const progresBaru = hafalan ? progresLama + jumlah : progresLama;

        setSetoran((prev) => [
            ...prev,
            {
                id: Date.now(),
                tanggal: form.tanggal,
                nis: form.nis,
                santri: santri.nama,
                kelompok,
                jenis: form.jenis,
                surat,
                halaman: jumlah,
                nilai: form.nilai,
                catatan: form.catatan.trim(),
            },
        ]);

        const capaiBaru = hafalan && progresLama < TARGET && progresBaru >= TARGET;
        setNotif({
            text: capaiBaru
                ? `Setoran ${santri.nama} dicatat. Target ${TARGET} halaman tercapai, beasiswa bulan ini otomatis.`
                : hafalan
                    ? `Setoran ${santri.nama} dicatat. Progres bulan ini ${progresBaru}/${TARGET} halaman.`
                    : `Muraja'ah ${santri.nama} dicatat. Muraja'ah tidak masuk hitungan target.`,
            severity: 'success',
        });
        tutupDialog();
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            <Typography color="text.secondary" sx={{ mt: -1 }}>
                Kelompok {kelompok} · {santriList.length} santri · Progres {namaBulanIni}
            </Typography>

            {/* Pencarian + Filter Tanggal + tombol catat */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Cari nama santri ....."
                    value={cari}
                    onChange={(e) => {
                        setCari(e.target.value);
                        setHalaman(1);
                    }}
                    sx={{
                        flex: '1 1 220px', maxWidth: 360, bgcolor: '#fff',
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

                {/* Filter Tanggal di Atas Tabel */}
                <TextField
                    type="date"
                    size="small"
                    label="Filter Tanggal"
                    value={filterTanggal}
                    onChange={(e) => {
                        setFilterTanggal(e.target.value);
                        setHalaman(1);
                    }}
                    sx={{
                        bgcolor: '#fff', minWidth: 190,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            '& fieldset': { borderColor: palette.shamrock },
                            '&:hover fieldset': { borderColor: palette.turfGreen },
                        },
                    }}
                    slotProps={{
                        inputLabel: { shrink: true },
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CalendarMonthIcon fontSize="small" sx={{ color: palette.shamrock }} />
                                </InputAdornment>
                            ),
                        },
                        htmlInput: { 'aria-label': 'Filter tanggal setoran' },
                    }}
                />

                {filterTanggal && (
                    <Chip
                        label={`Tanggal: ${formatTanggal(filterTanggal)} ✕`}
                        size="small"
                        onClick={() => {
                            setFilterTanggal('');
                            setHalaman(1);
                        }}
                        onDelete={() => {
                            setFilterTanggal('');
                            setHalaman(1);
                        }}
                        sx={{
                            bgcolor: palette.frostedMint,
                            color: palette.pineTeal,
                            fontWeight: 600,
                        }}
                    />
                )}

                <Box sx={{ flex: 1 }} />

                <Button variant="contained" startIcon={<AddIcon />} onClick={() => bukaCatat('', 0)}>
                    Catat Setoran
                </Button>
            </Box>

            {/* Tabel */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small" sx={{ minWidth: 640 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Santri</TableCell>
                                <TableCell sx={{ minWidth: 200 }}>Progres bulan ini</TableCell>
                                <TableCell align="center">Capaian</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tampil.map((s) => (
                                <TableRow key={s.nis} hover>
                                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{s.nama}</Typography>
                                        {filterTanggal && s.setoranPadaTanggal?.length > 0 && (
                                            <Typography variant="caption" sx={{ color: palette.turfGreen, display: 'block', fontWeight: 600 }}>
                                                Setoran {formatTanggal(filterTanggal)}: {s.setoranPadaTanggal.map((st) => `${st.surat} (${st.halaman} hal, ${st.nilai})`).join('; ')}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min(100, (s.progres / TARGET) * 100)}
                                            color={s.status === 'Tertinggal' ? 'error' : 'primary'}
                                            sx={{ height: 8, borderRadius: 4, bgcolor: palette.frostedMint }}
                                            aria-label={`Progres ${s.nama}`}
                                        />
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        {s.progres}/{TARGET}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={s.status}
                                            size="small"
                                            color={WARNA_STATUS[s.status]}
                                            sx={{ fontWeight: 600, minWidth: 90 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'inline-flex', gap: 1 }}>
                                            <Button size="small" variant="contained" onClick={() => bukaCatat(s.nis, 0)}>
                                                Catat
                                            </Button>
                                            <Button size="small" variant="outlined" onClick={() => bukaCatat(s.nis, 1)}>
                                                Riwayat
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {baris.length === 0 && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            {filterTanggal
                                ? `Tidak ada santri yang memiliki setoran pada tanggal ${formatTanggal(filterTanggal)}.`
                                : 'Tidak ada santri yang cocok dengan pencarian.'}
                        </Typography>
                        {filterTanggal && (
                            <Button
                                size="small"
                                variant="outlined"
                                sx={{ mt: 1.5, borderColor: palette.shamrock, color: palette.pineTeal }}
                                onClick={() => {
                                    setFilterTanggal('');
                                    setHalaman(1);
                                }}
                            >
                                Tampilkan Semua Santri
                            </Button>
                        )}
                    </Box>
                )}
            </Card>

            {/* Keterangan & halaman */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {baris.length === 0
                        ? 'Menampilkan 0 santri'
                        : `Menampilkan ${mulai + 1}-${mulai + tampil.length} dari ${baris.length} santri`}
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

            {/* Dialog catat setoran & riwayat hafalan per bulan */}
            <Dialog
                open={dialog}
                onClose={tutupDialog}
                fullWidth
                maxWidth={tabDialog === 1 ? 'md' : 'sm'}
                slotProps={{
                    paper: {
                        component: 'form',
                        onSubmit: simpan,
                        noValidate: true,
                        sx: { borderRadius: 3, overflow: 'hidden' },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        bgcolor: palette.emeraldDeep,
                        color: '#fff',
                        py: 2,
                        px: 3,
                    }}
                >
                    Catat & Riwayat Hafalan
                </DialogTitle>

                <Tabs
                    value={tabDialog}
                    onChange={(_, val) => setTabDialog(val)}
                    sx={{
                        px: 2,
                        bgcolor: palette.honeydew,
                        borderBottom: `1px solid ${palette.aquamarine}`,
                        '& .MuiTab-root': {
                            fontWeight: 700,
                            textTransform: 'none',
                            fontSize: 14,
                            minHeight: 46,
                            color: palette.turfGreen,
                            '&.Mui-selected': { color: palette.pineTeal },
                        },
                        '& .MuiTabs-indicator': {
                            bgcolor: palette.pineTeal,
                            height: 3,
                        },
                    }}
                >
                    <Tab label="Catat Setoran" />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>Riwayat Hafalan</span>
                                {form.nis && (
                                    <Chip
                                        size="small"
                                        label={`${riwayatSantriBulan.length} (${formatBulanLabel(bulanRiwayat)})`}
                                        sx={{
                                            height: 20,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            bgcolor: palette.pineTeal,
                                            color: '#fff',
                                        }}
                                    />
                                )}
                            </Box>
                        }
                    />
                </Tabs>

                <DialogContent sx={{ p: 3, display: 'grid', gap: 2 }}>
                    {tabDialog === 0 ? (
                        <>
                            <TextField
                                select
                                label="Santri"
                                name="nis"
                                value={form.nis}
                                onChange={ubahForm}
                                error={Boolean(errors.nis)}
                                helperText={errors.nis}
                                fullWidth
                            >
                                {santriList.map((s) => (
                                    <MenuItem key={s.nis} value={s.nis}>{s.nama}</MenuItem>
                                ))}
                            </TextField>

                            {santriTerpilih && (
                                <Box
                                    sx={{
                                        p: 1.5,
                                        bgcolor: palette.honeydew,
                                        borderRadius: 2,
                                        border: `1px solid ${palette.aquamarine}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 1,
                                    }}
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" sx={{ color: palette.turfGreen, fontWeight: 700, display: 'block' }}>
                                            {setoranTerakhir ? 'SETORAN TERAKHIR:' : `RIWAYAT BULAN ${formatBulanLabel(bulanRiwayat).toUpperCase()}:`}
                                        </Typography>
                                        {setoranTerakhir ? (
                                            <>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: palette.pineTeal }}>
                                                    {setoranTerakhir.surat} ({setoranTerakhir.halaman} hal) • Nilai: {setoranTerakhir.nilai}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatTanggal(setoranTerakhir.tanggal)} • {setoranTerakhir.jenis}
                                                    {setoranTerakhir.catatan ? ` • "${setoranTerakhir.catatan}"` : ''}
                                                </Typography>
                                            </>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Belum ada riwayat setoran pada {formatBulanLabel(bulanRiwayat)}.
                                            </Typography>
                                        )}
                                    </Box>
                                    <Button
                                        type="button"
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setTabDialog(1)}
                                        sx={{
                                            fontSize: 12,
                                            whiteSpace: 'nowrap',
                                            borderColor: palette.shamrock,
                                            color: palette.pineTeal,
                                            flexShrink: 0,
                                        }}
                                    >
                                        Lihat Riwayat ({riwayatSantriBulan.length})
                                    </Button>
                                </Box>
                            )}

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <TextField
                                    select
                                    label="Jenis"
                                    name="jenis"
                                    value={form.jenis}
                                    onChange={ubahForm}
                                    fullWidth
                                >
                                    {JENIS.map((j) => (
                                        <MenuItem key={j} value={j}>{j}</MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    label="Tanggal"
                                    name="tanggal"
                                    type="date"
                                    value={form.tanggal}
                                    onChange={ubahForm}
                                    error={Boolean(errors.tanggal)}
                                    helperText={errors.tanggal}
                                    slotProps={{
                                        inputLabel: { shrink: true },
                                        htmlInput: { max: hariIni },
                                    }}
                                    fullWidth
                                />
                            </Box>

                            <TextField
                                label="Surat / ayat"
                                name="surat"
                                value={form.surat}
                                onChange={ubahForm}
                                error={Boolean(errors.surat)}
                                helperText={errors.surat || 'Contoh: An-Naba 1-20 atau Juz 29'}
                                fullWidth
                            />

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <TextField
                                    label="Jumlah halaman"
                                    name="halaman"
                                    value={form.halaman}
                                    onChange={ubahHalaman}
                                    error={Boolean(errors.halaman)}
                                    helperText={errors.halaman}
                                    slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                                    fullWidth
                                />

                                <TextField
                                    select
                                    label="Nilai"
                                    name="nilai"
                                    value={form.nilai}
                                    onChange={ubahForm}
                                    error={Boolean(errors.nilai)}
                                    helperText={errors.nilai}
                                    fullWidth
                                >
                                    {NILAI.map((n) => (
                                        <MenuItem key={n} value={n}>{n}</MenuItem>
                                    ))}
                                </TextField>
                            </Box>

                            <TextField
                                label="Catatan (tidak wajib)"
                                name="catatan"
                                value={form.catatan}
                                onChange={ubahForm}
                                helperText="Masukan untuk santri. Contoh: perbaiki makhraj huruf ض."
                                multiline
                                minRows={2}
                                fullWidth
                            />

                            {form.jenis === "Muraja'ah" && (
                                <Alert severity="info">
                                    Muraja'ah dicatat terpisah dan tidak dihitung ke target {TARGET} halaman.
                                </Alert>
                            )}
                        </>
                    ) : (
                        <Box sx={{ display: 'grid', gap: 2 }}>
                            {/* Pilihan santri & bulan riwayat */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.4fr 1fr' }, gap: 2 }}>
                                <TextField
                                    select
                                    size="small"
                                    label="Pilih Santri"
                                    name="nis"
                                    value={form.nis}
                                    onChange={ubahForm}
                                    fullWidth
                                >
                                    {santriList.map((s) => (
                                        <MenuItem key={s.nis} value={s.nis}>{s.nama}</MenuItem>
                                    ))}
                                </TextField>

                                <TextField
                                    select
                                    size="small"
                                    label="Pilih Bulan Riwayat"
                                    value={bulanRiwayat}
                                    onChange={(e) => setBulanRiwayat(e.target.value)}
                                    fullWidth
                                >
                                    {daftarBulan.map((bln) => (
                                        <MenuItem key={bln} value={bln}>
                                            {formatBulanLabel(bln)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>

                            {!form.nis ? (
                                <Alert severity="info">
                                    Silakan pilih santri terlebih dahulu untuk melihat riwayat setoran hafalan per bulan.
                                </Alert>
                            ) : riwayatSantriBulan.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#fafafa', borderRadius: 2 }}>
                                    <Typography color="text.secondary">
                                        Belum ada riwayat setoran untuk <strong>{santriTerpilih?.nama}</strong> pada bulan <strong>{formatBulanLabel(bulanRiwayat)}</strong>.
                                    </Typography>
                                    <Button
                                        type="button"
                                        variant="contained"
                                        size="small"
                                        sx={{ mt: 2 }}
                                        onClick={() => setTabDialog(0)}
                                    >
                                        Catat Setoran Baru
                                    </Button>
                                </Box>
                            ) : (
                                <>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 1,
                                            p: 1.5,
                                            bgcolor: palette.honeydew,
                                            borderRadius: 2,
                                            border: `1px solid ${palette.aquamarine}`,
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: palette.pineTeal }}>
                                                Riwayat Bulan {formatBulanLabel(bulanRiwayat)} · {santriTerpilih?.nama}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {riwayatSantriBulan.length} kali setoran dicatat
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                size="small"
                                                label={`Capaian: ${progresBulanDipilih}/${TARGET} halaman`}
                                                sx={{ fontWeight: 600, bgcolor: palette.frostedMint, color: palette.pineTeal }}
                                            />
                                            <Chip
                                                size="small"
                                                label={statusBulanDipilih}
                                                color={WARNA_STATUS[statusBulanDipilih]}
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </Box>
                                    </Box>

                                    <TableContainer
                                        sx={{
                                            maxHeight: 320,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: palette.emeraldDeep, color: '#fff', fontWeight: 600 }}>Tanggal</TableCell>
                                                    <TableCell sx={{ bgcolor: palette.emeraldDeep, color: '#fff', fontWeight: 600 }}>Jenis</TableCell>
                                                    <TableCell sx={{ bgcolor: palette.emeraldDeep, color: '#fff', fontWeight: 600 }}>Surah/Ayat</TableCell>
                                                    <TableCell align="center" sx={{ bgcolor: palette.emeraldDeep, color: '#fff', fontWeight: 600 }}>Halaman</TableCell>
                                                    <TableCell align="center" sx={{ bgcolor: palette.emeraldDeep, color: '#fff', fontWeight: 600 }}>Nilai</TableCell>
                                                    <TableCell sx={{ bgcolor: palette.emeraldDeep, color: '#fff', fontWeight: 600 }}>Catatan</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {riwayatSantriBulan.map((r) => (
                                                    <TableRow key={r.id} hover>
                                                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                                                            {formatTanggal(r.tanggal)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={r.jenis}
                                                                size="small"
                                                                sx={{
                                                                    fontSize: 11,
                                                                    fontWeight: 600,
                                                                    bgcolor: WARNA_JENIS[r.jenis]?.bg ?? palette.frostedMint,
                                                                    color: WARNA_JENIS[r.jenis]?.text ?? palette.pineTeal,
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{r.surat}</TableCell>
                                                        <TableCell align="center" sx={{ fontSize: 13 }}>{r.halaman}</TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                label={r.nilai}
                                                                size="small"
                                                                color={warnaNilai(r.nilai)}
                                                                sx={{ fontWeight: 700, minWidth: 32, height: 22, fontSize: 11 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: 12, color: 'text.secondary', maxWidth: 180 }}>
                                                            {r.catatan || '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                    {tabDialog === 0 ? (
                        <>
                            <Button type="button" onClick={tutupDialog}>Batal</Button>
                            {form.nis && riwayatSantriBulan.length > 0 && (
                                <Button
                                    type="button"
                                    onClick={() => setTabDialog(1)}
                                    sx={{ mr: 'auto', textTransform: 'none', color: palette.turfGreen }}
                                >
                                    Lihat Riwayat {formatBulanLabel(bulanRiwayat)} ({riwayatSantriBulan.length})
                                </Button>
                            )}
                            <Button type="submit" variant="contained">Simpan Setoran</Button>
                        </>
                    ) : (
                        <>
                            <Button type="button" onClick={tutupDialog}>Tutup</Button>
                            <Button type="button" variant="contained" onClick={() => setTabDialog(0)}>
                                + Catat Setoran Baru
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Pemberitahuan */}
            <Snackbar
                open={Boolean(notif)}
                autoHideDuration={4500}
                onClose={() => setNotif(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={notif?.severity ?? 'success'} onClose={() => setNotif(null)} variant="filled">
                    {notif?.text}
                </Alert>
            </Snackbar>
        </Box>
    );
}
