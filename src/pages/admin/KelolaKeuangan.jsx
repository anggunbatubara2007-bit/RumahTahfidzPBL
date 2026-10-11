import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, FormHelperText, IconButton, InputAdornment,
    MenuItem, Pagination, Snackbar, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFile from '@mui/icons-material/AttachFile';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import { palette } from '../../theme/theme';

// TODO: ganti penyimpanan localStorage ini dengan API backend.
const KUNCI = 'transaksiKeuangan';
const KUNCI_BUKTI = 'buktiTransfer'; // dikelola di halaman Verifikasi Pembayaran

const PER_PAGE = 10;
const MAKS_BERKAS = 1024 * 1024; // 1 MB, karena data contoh disimpan di browser
const BERKAS_BOLEH = ['image/jpeg', 'image/png', 'application/pdf'];

const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const KATEGORI = {
    Masuk: ['SPP', 'Donasi', 'Lainnya'],
    Keluar: ['Operasional', 'Gaji/honor', 'Konsumsi', 'Perlengkapan', 'Lainnya'],
};
const SEMUA_KATEGORI = [...new Set([...KATEGORI.Masuk, ...KATEGORI.Keluar])];

// Transaksi yang dicatat admin. Pemasukan SPP dari verifikasi pembayaran tidak
// disimpan di sini: ditambahkan otomatis saat halaman dibuka (lihat `otomatis`).
const DATA_AWAL = [
    { id: 1, tanggal: '2026-09-01', keterangan: 'Saldo awal kas', kategori: 'Lainnya', jenis: 'Masuk', jumlah: 20000000 },
    { id: 2, tanggal: '2026-09-15', keterangan: 'Honor ustadz', kategori: 'Gaji/honor', jenis: 'Keluar', jumlah: 4500000 },
    { id: 3, tanggal: '2026-09-20', keterangan: 'SPP tunai Habib Ramadhan', kategori: 'SPP', jenis: 'Masuk', jumlah: 350000 },
    { id: 4, tanggal: '2026-09-29', keterangan: 'Konsumsi santri', kategori: 'Konsumsi', jenis: 'Keluar', jumlah: 2000000 },
    { id: 5, tanggal: '2026-09-30', keterangan: 'Donasi wali santri', kategori: 'Donasi', jenis: 'Masuk', jumlah: 1000000 },
    { id: 6, tanggal: '2026-10-02', keterangan: 'Donasi wali santri', kategori: 'Donasi', jenis: 'Masuk', jumlah: 5000000 },
    { id: 7, tanggal: '2026-10-03', keterangan: 'SPP tunai Dimas Pratama', kategori: 'SPP', jenis: 'Masuk', jumlah: 350000 },
    { id: 8, tanggal: '2026-10-05', keterangan: 'Konsumsi santri', kategori: 'Konsumsi', jenis: 'Keluar', jumlah: 2000000 },
    { id: 9, tanggal: '2026-10-07', keterangan: 'Honor ustadz', kategori: 'Gaji/honor', jenis: 'Keluar', jumlah: 4500000 },
    { id: 10, tanggal: '2026-10-09', keterangan: 'Listrik dan air', kategori: 'Operasional', jenis: 'Keluar', jumlah: 850000 },
];

// ---------- Fungsi bantu ----------
const muat = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KUNCI));
        if (Array.isArray(saved)) return saved;
    } catch {
        /* data rusak: pakai data awal */
    }
    return DATA_AWAL;
};

const dua = (n) => String(n).padStart(2, '0');
const hariIniIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
};

const labelBulan = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    return `${NAMA_BULAN[m - 1]} ${y}`;
};

const formatTanggal = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
    });

const rupiah = (n) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
    }).format(n);

// 38500000 -> "Rp 38,5 jt"
const ringkas = (n) => {
    const abs = Math.abs(n);
    const tanda = n < 0 ? '-' : '';
    const angka = (v) => v.toLocaleString('id-ID', { maximumFractionDigits: 1 });
    if (abs >= 1e9) return `${tanda}Rp ${angka(abs / 1e9)} M`;
    if (abs >= 1e6) return `${tanda}Rp ${angka(abs / 1e6)} jt`;
    return `${tanda}${rupiah(abs)}`;
};

// Pemasukan SPP otomatis dari pembayaran yang disetujui di Verifikasi Pembayaran
const bacaOtomatis = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KUNCI_BUKTI));
        if (!Array.isArray(saved)) return [];
        return saved
            .filter((b) => b.status === 'Disetujui')
            .map((b) => ({
                id: `spp-${b.id}`,
                otomatis: true,
                buktiId: b.id,
                tanggal: b.diprosesPada ?? b.tanggalUnggah,
                keterangan: `SPP ${b.nama} (${labelBulan(b.bulan)})`,
                kategori: 'SPP',
                jenis: 'Masuk',
                jumlah: b.jumlah,
            }));
    } catch {
        return [];
    }
};

const bacaBerkas = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Berkas tidak bisa dibaca.'));
        reader.readAsDataURL(file);
    });

const FORM_KOSONG = {
    jenis: 'Keluar', tanggal: '', kategori: '', keterangan: '', jumlah: '', namaFile: '', dataUrl: '',
};

export default function KelolaKeuangan() {
    const navigate = useNavigate();
    const hariIni = hariIniIso();
    const bulanSekarang = hariIni.slice(0, 7);

    const [transaksi, setTransaksi] = useState(muat);
    const otomatis = useMemo(bacaOtomatis, []);

    const [filterBulan, setFilterBulan] = useState(bulanSekarang);
    const [filterKategori, setFilterKategori] = useState('all');
    const [filterJenis, setFilterJenis] = useState('all');
    const [halaman, setHalaman] = useState(1);

    const [dialog, setDialog] = useState(null); // { mode: 'tambah' | 'ubah', id? }
    const [form, setForm] = useState(FORM_KOSONG);
    const [errors, setErrors] = useState({});
    const [hapus, setHapus] = useState(null);
    const [lihat, setLihat] = useState(null); // transaksi yang buktinya dilihat
    const [notif, setNotif] = useState(null); // { text, severity }

    useEffect(() => {
        try {
            localStorage.setItem(KUNCI, JSON.stringify(transaksi));
        } catch {
            setNotif({
                text: 'Penyimpanan browser penuh. Perubahan terakhir mungkin tidak tersimpan.',
                severity: 'warning',
            });
        }
    }, [transaksi]);

    const semua = useMemo(() => [...transaksi, ...otomatis], [transaksi, otomatis]);

    // ---------- Rekap ----------
    const opsiBulan = useMemo(
        () => [...new Set([bulanSekarang, ...semua.map((t) => t.tanggal.slice(0, 7))])].sort().reverse(),
        [semua, bulanSekarang]
    );

    const rekap = useMemo(() => {
        const dalamBulan = semua.filter((t) => filterBulan === 'all' || t.tanggal.startsWith(filterBulan));
        const jumlahJenis = (daftar, jenis) =>
            daftar.filter((t) => t.jenis === jenis).reduce((acc, t) => acc + t.jumlah, 0);

        // Saldo kas = semua pemasukan dikurangi pengeluaran sampai akhir bulan yang dipilih
        const sampaiBulan = semua.filter((t) => filterBulan === 'all' || t.tanggal.slice(0, 7) <= filterBulan);

        return {
            masuk: jumlahJenis(dalamBulan, 'Masuk'),
            keluar: jumlahJenis(dalamBulan, 'Keluar'),
            saldo: jumlahJenis(sampaiBulan, 'Masuk') - jumlahJenis(sampaiBulan, 'Keluar'),
        };
    }, [semua, filterBulan]);

    // ---------- Daftar ----------
    const terfilter = useMemo(
        () =>
            semua
                .filter(
                    (t) =>
                        (filterBulan === 'all' || t.tanggal.startsWith(filterBulan)) &&
                        (filterKategori === 'all' || t.kategori === filterKategori) &&
                        (filterJenis === 'all' || t.jenis === filterJenis)
                )
                .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || String(b.id).localeCompare(String(a.id))),
        [semua, filterBulan, filterKategori, filterJenis]
    );

    const totalHalaman = Math.max(1, Math.ceil(terfilter.length / PER_PAGE));
    const halamanAman = Math.min(halaman, totalHalaman);
    const mulai = (halamanAman - 1) * PER_PAGE;
    const tampil = terfilter.slice(mulai, mulai + PER_PAGE);

    const ubahFilter = (setter) => (e) => {
        setter(e.target.value);
        setHalaman(1);
    };

    // ---------- Form catat / ubah ----------
    const bukaTambah = () => {
        setForm({ ...FORM_KOSONG, tanggal: hariIni });
        setErrors({});
        setDialog({ mode: 'tambah' });
    };

    const bukaUbah = (t) => {
        setForm({
            jenis: t.jenis, tanggal: t.tanggal, kategori: t.kategori, keterangan: t.keterangan,
            jumlah: String(t.jumlah), namaFile: t.namaFile ?? '', dataUrl: t.dataUrl ?? '',
        });
        setErrors({});
        setDialog({ mode: 'ubah', id: t.id });
    };

    const tutupDialog = () => setDialog(null);

    const ubahForm = (e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const baru = { ...prev, [name]: value };
            // ganti jenis: kosongkan kategori kalau tidak cocok dengan jenis baru
            if (name === 'jenis' && !KATEGORI[value].includes(prev.kategori)) baru.kategori = '';
            return baru;
        });
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const ubahJumlah = (e) => {
        setForm((prev) => ({ ...prev, jumlah: e.target.value.replace(/\D/g, '') }));
        setErrors((prev) => ({ ...prev, jumlah: '' }));
    };

    const pilihBerkas = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // supaya berkas yang sama bisa dipilih lagi
        if (!file) return;

        if (!BERKAS_BOLEH.includes(file.type)) {
            setErrors((prev) => ({ ...prev, berkas: 'Format berkas harus JPG, PNG, atau PDF.' }));
            return;
        }
        if (file.size > MAKS_BERKAS) {
            setErrors((prev) => ({ ...prev, berkas: 'Ukuran berkas maksimal 1 MB.' }));
            return;
        }

        try {
            const dataUrl = await bacaBerkas(file);
            setForm((prev) => ({ ...prev, namaFile: file.name, dataUrl }));
            setErrors((prev) => ({ ...prev, berkas: '' }));
        } catch {
            setErrors((prev) => ({ ...prev, berkas: 'Berkas tidak bisa dibaca. Coba pilih ulang.' }));
        }
    };

    const hapusBerkas = () => setForm((prev) => ({ ...prev, namaFile: '', dataUrl: '' }));

    const simpan = (e) => {
        e.preventDefault();

        const keterangan = form.keterangan.trim();
        const jumlah = Number(form.jumlah);
        const baru = {};

        if (!form.tanggal) {
            baru.tanggal = 'Tanggal wajib diisi.';
        } else if (form.tanggal > hariIni) {
            baru.tanggal = 'Tanggal tidak boleh setelah hari ini.';
        }
        if (!form.kategori) baru.kategori = 'Pilih kategori.';
        if (!keterangan) baru.keterangan = 'Keterangan wajib diisi.';
        if (!jumlah || jumlah <= 0) baru.jumlah = 'Jumlah harus lebih dari 0.';

        setErrors(baru);
        if (Object.keys(baru).length > 0) return;

        const data = {
            tanggal: form.tanggal,
            keterangan,
            kategori: form.kategori,
            jenis: form.jenis,
            jumlah,
            namaFile: form.namaFile || undefined,
            dataUrl: form.dataUrl || undefined,
        };

        if (dialog.mode === 'tambah') {
            setTransaksi((prev) => [...prev, { id: Date.now(), ...data }]);
            setNotif({ text: `${form.jenis === 'Masuk' ? 'Pemasukan' : 'Pengeluaran'} ${rupiah(jumlah)} dicatat.`, severity: 'success' });
        } else {
            setTransaksi((prev) => prev.map((t) => (t.id === dialog.id ? { id: t.id, ...data } : t)));
            setNotif({ text: 'Transaksi berhasil diubah.', severity: 'success' });
        }

        // Tampilkan bulan transaksi yang baru dicatat supaya langsung terlihat
        if (filterBulan !== 'all') setFilterBulan(form.tanggal.slice(0, 7));
        setHalaman(1);
        tutupDialog();
    };

    // ---------- Hapus ----------
    const konfirmasiHapus = () => {
        setTransaksi((prev) => prev.filter((t) => t.id !== hapus.id));
        setNotif({ text: 'Transaksi berhasil dihapus.', severity: 'success' });
        setHapus(null);
    };

    // ---------- Kolom bukti ----------
    const kolomBukti = (t) => {
        if (t.otomatis) {
            return (
                <Button size="small" onClick={() => navigate(`/admin/verifikasi?id=${t.buktiId}`)}>
                    Dari verifikasi
                </Button>
            );
        }
        if (t.dataUrl || t.namaFile) {
            return (
                <Button size="small" onClick={() => setLihat(t)}>
                    {t.jenis === 'Keluar' ? 'Lihat nota' : 'Lihat bukti'}
                </Button>
            );
        }
        return <Typography color="text.secondary">–</Typography>;
    };

    const judulBulan = filterBulan === 'all' ? 'Semua bulan' : labelBulan(filterBulan);
    const keteranganBulan = filterBulan === 'all' ? 'total' : 'bulan ini';

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            {/* Judul kecil + tombol catat */}
            <Box
                sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 2,
                }}
            >
                <Typography color="text.secondary">
                    Catat dan rekap pemasukan serta pengeluaran pondok. {judulBulan}
                </Typography>

                <Button variant="contained" startIcon={<AddIcon />} onClick={bukaTambah}>
                    Catat transaksi
                </Button>
            </Box>

            {/* Ringkasan */}
            <Box
                sx={{
                    display: 'grid', gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                }}
            >
                {[
                    [`Pemasukan ${keteranganBulan}`, rekap.masuk, palette.pineTeal],
                    [`Pengeluaran ${keteranganBulan}`, rekap.keluar, palette.pineTeal],
                    ['Saldo kas', rekap.saldo, rekap.saldo < 0 ? '#D32F2F' : palette.pineTeal],
                ].map(([label, nilai, warna]) => (
                    <Card
                        key={label}
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 3, borderColor: palette.aquamarine }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 700, color: palette.pineTeal }}>
                            {label}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: warna, mt: 0.5 }}>
                            {ringkas(nilai)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {rupiah(nilai)}
                        </Typography>
                    </Card>
                ))}
            </Box>

            {/* Filter */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    select
                    size="small"
                    value={filterKategori}
                    onChange={ubahFilter(setFilterKategori)}
                    sx={{ minWidth: 200, bgcolor: '#fff' }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter kategori' } }}
                >
                    <MenuItem value="all">Semua Kategori</MenuItem>
                    {SEMUA_KATEGORI.map((k) => (
                        <MenuItem key={k} value={k}>{k}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    size="small"
                    value={filterJenis}
                    onChange={ubahFilter(setFilterJenis)}
                    sx={{ minWidth: 170, bgcolor: '#fff' }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter jenis' } }}
                >
                    <MenuItem value="all">Semua jenis</MenuItem>
                    <MenuItem value="Masuk">Masuk</MenuItem>
                    <MenuItem value="Keluar">Keluar</MenuItem>
                </TextField>

                <TextField
                    select
                    size="small"
                    value={filterBulan}
                    onChange={ubahFilter(setFilterBulan)}
                    sx={{ minWidth: 190, bgcolor: '#fff' }}
                    slotProps={{ htmlInput: { 'aria-label': 'Filter bulan' } }}
                >
                    <MenuItem value="all">Semua Bulan</MenuItem>
                    {opsiBulan.map((b) => (
                        <MenuItem key={b} value={b}>{labelBulan(b)}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {/* Tabel */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Tanggal</TableCell>
                                <TableCell>Keterangan</TableCell>
                                <TableCell>Kategori</TableCell>
                                <TableCell align="center">Jenis</TableCell>
                                <TableCell align="right">Jumlah</TableCell>
                                <TableCell align="center">Bukti</TableCell>
                                <TableCell align="center">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tampil.map((t) => (
                                <TableRow key={t.id} hover>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTanggal(t.tanggal)}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{t.keterangan}</TableCell>
                                    <TableCell>{t.kategori}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={t.jenis}
                                            size="small"
                                            color={t.jenis === 'Masuk' ? 'success' : 'error'}
                                            variant={t.jenis === 'Masuk' ? 'filled' : 'outlined'}
                                            sx={{ fontWeight: 600, minWidth: 64 }}
                                        />
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            whiteSpace: 'nowrap', fontWeight: 600,
                                            color: t.jenis === 'Keluar' ? 'error.main' : 'text.primary',
                                        }}
                                    >
                                        {t.jenis === 'Keluar' ? '-' : ''}{rupiah(t.jumlah)}
                                    </TableCell>
                                    <TableCell align="center">{kolomBukti(t)}</TableCell>
                                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                        {t.otomatis ? (
                                            <Tooltip title="Dicatat otomatis dari verifikasi pembayaran. Ubah lewat halaman Verifikasi.">
                                                <span>
                                                    <IconButton size="small" disabled aria-label="Transaksi otomatis, tidak bisa diubah">
                                                        <LockOutlined fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        ) : (
                                            <>
                                                <Tooltip title="Ubah">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => bukaUbah(t)}
                                                        aria-label={`Ubah ${t.keterangan}`}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Hapus">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setHapus(t)}
                                                        aria-label={`Hapus ${t.keterangan}`}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {terfilter.length === 0 && (
                    <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                        {semua.length === 0
                            ? 'Belum ada transaksi. Klik "Catat transaksi" untuk mencatat yang pertama.'
                            : 'Tidak ada transaksi yang cocok. Ubah kategori, jenis, atau bulan.'}
                    </Typography>
                )}
            </Card>

            {/* Keterangan & halaman */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {terfilter.length === 0
                        ? 'Menampilkan 0 transaksi'
                        : `Menampilkan ${mulai + 1}-${mulai + tampil.length} dari ${terfilter.length} transaksi`}
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

            {/* Dialog catat / ubah transaksi */}
            <Dialog
                open={Boolean(dialog)}
                onClose={tutupDialog}
                fullWidth
                maxWidth="xs"
                slotProps={{ paper: { component: 'form', onSubmit: simpan, noValidate: true } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {dialog?.mode === 'ubah' ? 'Ubah Transaksi' : 'Catat Transaksi'}
                </DialogTitle>

                <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
                    <TextField
                        select
                        label="Jenis"
                        name="jenis"
                        value={form.jenis}
                        onChange={ubahForm}
                        fullWidth
                    >
                        <MenuItem value="Masuk">Masuk (pemasukan)</MenuItem>
                        <MenuItem value="Keluar">Keluar (pengeluaran)</MenuItem>
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

                    <TextField
                        select
                        label="Kategori"
                        name="kategori"
                        value={form.kategori}
                        onChange={ubahForm}
                        error={Boolean(errors.kategori)}
                        helperText={errors.kategori}
                        fullWidth
                    >
                        {KATEGORI[form.jenis].map((k) => (
                            <MenuItem key={k} value={k}>{k}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Keterangan"
                        name="keterangan"
                        value={form.keterangan}
                        onChange={ubahForm}
                        error={Boolean(errors.keterangan)}
                        helperText={errors.keterangan || 'Contoh: Konsumsi santri, Honor ustadz'}
                        autoFocus
                        fullWidth
                    />

                    <TextField
                        label="Jumlah"
                        name="jumlah"
                        value={form.jumlah ? Number(form.jumlah).toLocaleString('id-ID') : ''}
                        onChange={ubahJumlah}
                        error={Boolean(errors.jumlah)}
                        helperText={errors.jumlah}
                        slotProps={{
                            input: { startAdornment: <InputAdornment position="start">Rp</InputAdornment> },
                            htmlInput: { inputMode: 'numeric' },
                        }}
                        fullWidth
                    />

                    {/* Nota / bukti (tidak wajib) */}
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>
                            {form.jenis === 'Keluar' ? 'Nota' : 'Bukti'} (tidak wajib)
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Button component="label" variant="outlined" startIcon={<AttachFile />}>
                                {form.namaFile ? 'Ganti berkas' : 'Pilih berkas'}
                                <input
                                    type="file"
                                    hidden
                                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                    onChange={pilihBerkas}
                                />
                            </Button>

                            {form.namaFile && (
                                <>
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                                        {form.namaFile}
                                    </Typography>
                                    <Button size="small" color="error" onClick={hapusBerkas}>
                                        Hapus
                                    </Button>
                                </>
                            )}
                        </Box>

                        <FormHelperText error={Boolean(errors.berkas)}>
                            {errors.berkas || 'Format JPG, PNG, atau PDF. Maksimal 1 MB.'}
                        </FormHelperText>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={tutupDialog}>Batal</Button>
                    <Button type="submit" variant="contained">
                        {dialog?.mode === 'ubah' ? 'Simpan' : 'Catat'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog lihat nota / bukti */}
            <Dialog open={Boolean(lihat)} onClose={() => setLihat(null)} fullWidth maxWidth="sm">
                {lihat && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700 }}>
                            {lihat.jenis === 'Keluar' ? 'Nota' : 'Bukti'}: {lihat.keterangan}
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box
                                sx={{
                                    minHeight: 160, borderRadius: 2, bgcolor: palette.honeydew,
                                    border: `1px dashed ${palette.aquamarine}`, display: 'grid',
                                    placeItems: 'center', p: 2, textAlign: 'center',
                                }}
                            >
                                {lihat.dataUrl?.startsWith('data:image') ? (
                                    <Box
                                        component="img"
                                        src={lihat.dataUrl}
                                        alt={`${lihat.jenis === 'Keluar' ? 'Nota' : 'Bukti'} ${lihat.keterangan}`}
                                        sx={{ maxWidth: '100%', maxHeight: 360, display: 'block' }}
                                    />
                                ) : (
                                    <Box>
                                        <InsertDriveFileOutlined sx={{ fontSize: 48, color: palette.turfGreen }} />
                                        <Typography sx={{ fontWeight: 600 }}>{lihat.namaFile}</Typography>
                                        {lihat.dataUrl?.startsWith('data:application/pdf') && (
                                            <Button
                                                component="a"
                                                href={lihat.dataUrl}
                                                download={lihat.namaFile}
                                                sx={{ mt: 1 }}
                                            >
                                                Unduh PDF
                                            </Button>
                                        )}
                                    </Box>
                                )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                                {formatTanggal(lihat.tanggal)} · {lihat.kategori} · {rupiah(lihat.jumlah)}
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2 }}>
                            <Button variant="contained" onClick={() => setLihat(null)}>Tutup</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Dialog konfirmasi hapus */}
            <Dialog open={Boolean(hapus)} onClose={() => setHapus(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Hapus transaksi?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <strong>{hapus?.keterangan}</strong> ({hapus && rupiah(hapus.jumlah)}, {hapus?.jenis})
                        akan dihapus dan saldo kas dihitung ulang. Tindakan ini tidak bisa dikembalikan.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setHapus(null)}>Batal</Button>
                    <Button color="error" variant="contained" onClick={konfirmasiHapus}>
                        Hapus
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Pemberitahuan */}
            <Snackbar
                open={Boolean(notif)}
                autoHideDuration={4000}
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