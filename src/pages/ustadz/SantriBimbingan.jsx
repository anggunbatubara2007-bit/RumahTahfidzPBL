import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    InputAdornment, LinearProgress, MenuItem, Pagination, Snackbar, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../auth';
import { palette } from '../../theme/theme';

// TODO: ganti penyimpanan localStorage ini dengan API backend.
// Santri bimbingan = santri aktif di kelompok ustadz yang login (FR-12).
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

// Tercapai bila 20 halaman. Tertinggal bila di bawah laju yang dibutuhkan, selebihnya Proses.
const statusSantri = (progres) => {
    if (progres >= TARGET) return 'Tercapai';
    return progres < targetSampaiHariIni ? 'Tertinggal' : 'Proses';
};

const WARNA_STATUS = { Tercapai: 'success', Proses: 'info', Tertinggal: 'error' };

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
    const [halaman, setHalaman] = useState(1);

    const [dialog, setDialog] = useState(false);
    const [form, setForm] = useState(FORM_KOSONG);
    const [errors, setErrors] = useState({});
    const [notif, setNotif] = useState(null); // { text, severity }

    useEffect(() => {
        try {
            localStorage.setItem(KUNCI_SETORAN, JSON.stringify(setoran));
        } catch {
            setNotif({
                text: 'Penyimpanan browser penuh. Setoran terakhir mungkin tidak tersimpan.',
                severity: 'warning',
            });
        }
    }, [setoran]);

    // Progres bulan ini per santri: hanya hafalan baru yang dihitung (FR-06)
    const progres = useMemo(() => {
        const hasil = {};
        setoran.forEach((s) => {
            if (s.jenis === 'Hafalan' && s.tanggal.startsWith(bulanIni)) {
                hasil[s.nis] = (hasil[s.nis] ?? 0) + s.halaman;
            }
        });
        return hasil;
    }, [setoran]);

    // ---------- Daftar ----------
    const baris = useMemo(() => {
        const q = cari.trim().toLowerCase();
        return santriList
            .filter((s) => !q || s.nama.toLowerCase().includes(q))
            .map((s) => {
                const nilai = progres[s.nis] ?? 0;
                return { ...s, progres: nilai, status: statusSantri(nilai) };
            })
            .sort((a, b) => a.nama.localeCompare(b.nama));
    }, [santriList, cari, progres]);

    const totalHalaman = Math.max(1, Math.ceil(baris.length / PER_PAGE));
    const halamanAman = Math.min(halaman, totalHalaman);
    const mulai = (halamanAman - 1) * PER_PAGE;
    const tampil = baris.slice(mulai, mulai + PER_PAGE);

    // ---------- Form catat setoran ----------
    const bukaCatat = (nis = '') => {
        setForm({ ...FORM_KOSONG, nis });
        setErrors({});
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
        if (!form.nilai) baru.nilai = 'Nilai wajib diisi untuk setiap setoran.'; // FR-15

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

            {/* Pencarian + tombol catat */}
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
                        flex: '1 1 280px', maxWidth: 480, bgcolor: '#fff',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 6,
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

                <Box sx={{ flex: 1 }} />

                <Button variant="contained" startIcon={<AddIcon />} onClick={() => bukaCatat()}>
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
                                        {s.nama}
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
                                        <Button size="small" onClick={() => bukaCatat(s.nis)}>
                                            Catat
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {baris.length === 0 && (
                    <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                        Tidak ada santri yang cocok dengan pencarian.
                    </Typography>
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

            {/* Dialog catat setoran */}
            <Dialog
                open={dialog}
                onClose={tutupDialog}
                fullWidth
                maxWidth="xs"
                slotProps={{ paper: { component: 'form', onSubmit: simpan, noValidate: true } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Catat Setoran</DialogTitle>

                <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
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
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={tutupDialog}>Batal</Button>
                    <Button type="submit" variant="contained">Simpan Setoran</Button>
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