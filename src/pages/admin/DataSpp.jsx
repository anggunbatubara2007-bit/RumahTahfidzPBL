import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, InputAdornment, MenuItem, Pagination, Snackbar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
    Typography,
} from '@mui/material';
import { palette } from '../../theme/theme';

// TODO: ganti penyimpanan localStorage ini dengan API backend.
const KUNCI_TAGIHAN = 'dataTagihanSpp';
const KUNCI_ATUR = 'pengaturanSpp';
const KUNCI_SANTRI = 'dataSantri'; // dikelola di halaman Data Santri
const KUNCI_KELOMPOK = 'dataKelompok'; // dikelola di halaman Kelompok Tahfidz

const PER_PAGE = 10;
const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const KELOMPOK_DEFAULT = ['Al-Fatih', 'Al-Nur', 'Ar-Rahman', 'Al-Ikhlas', 'Al-Falah', 'An-Naba'];

// Dipakai kalau halaman Data Santri belum pernah dibuka
const SANTRI_DEFAULT = [
    { nama: 'Ahmad Iam', nis: '2024001', kelompok: 'Al-Fatih', beasiswa: true, status: 'Aktif' },
    { nama: 'Mhd. Iqbal', nis: '2024002', kelompok: 'Al-Nur', beasiswa: false, status: 'Non-Aktif' },
    { nama: 'Miftahul Jannah', nis: '2024003', kelompok: 'Al-Fatih', beasiswa: true, status: 'Aktif' },
    { nama: 'Rizki Hanafi', nis: '2024004', kelompok: 'Al-Nur', beasiswa: true, status: 'Non-Aktif' },
    { nama: 'Ahmad Rizki', nis: '2024005', kelompok: 'Al-Fatih', beasiswa: false, status: 'Aktif' },
    { nama: 'Citra Anggun', nis: '2024006', kelompok: 'Ar-Rahman', beasiswa: true, status: 'Aktif' },
    { nama: 'Tesa Damayanti', nis: '2024007', kelompok: 'An-Naba', beasiswa: false, status: 'Aktif' },
    { nama: 'Fauzan Ahmad', nis: '2024008', kelompok: 'Ar-Rahman', beasiswa: false, status: 'Aktif' },
    { nama: 'Nur Aisyah', nis: '2024009', kelompok: 'An-Naba', beasiswa: true, status: 'Aktif' },
    { nama: 'Dimas Pratama', nis: '2024010', kelompok: 'Al-Nur', beasiswa: false, status: 'Aktif' },
    { nama: 'Salsabila', nis: '2024011', kelompok: 'Al-Fatih', beasiswa: false, status: 'Non-Aktif' },
    { nama: 'Habib Ramadhan', nis: '2024012', kelompok: 'Al-Ikhlas', beasiswa: true, status: 'Aktif' },
];

// Data contoh tagihan Oktober 2026
const TAGIHAN_AWAL = [
    { id: 's1', nis: '2024006', nama: 'Citra Anggun', kelompok: 'Ar-Rahman', bulan: '2026-10', jumlah: 0, jatuhTempo: '2026-10-20', status: 'Dibebaskan Beasiswa', dikirim: false },
    { id: 's2', nis: '2024005', nama: 'Ahmad Rizki', kelompok: 'Al-Fatih', bulan: '2026-10', jumlah: 350000, jatuhTempo: '2026-10-20', status: 'Belum bayar', dikirim: false },
    { id: 's3', nis: '2024007', nama: 'Tesa Damayanti', kelompok: 'An-Naba', bulan: '2026-10', jumlah: 350000, jatuhTempo: '2026-10-20', status: 'Sudah bayar', dikirim: true },
    { id: 's4', nis: '2024010', nama: 'Dimas Pratama', kelompok: 'Al-Nur', bulan: '2026-10', jumlah: 350000, jatuhTempo: '2026-10-05', status: 'Belum bayar', dikirim: true },
    { id: 's5', nis: '2024008', nama: 'Fauzan Ahmad', kelompok: 'Ar-Rahman', bulan: '2026-10', jumlah: 350000, jatuhTempo: '2026-10-20', status: 'Menunggu verifikasi', dikirim: true },
    { id: 's6', nis: '2024003', nama: 'Miftahul Jannah', kelompok: 'Al-Fatih', bulan: '2026-10', jumlah: 0, jatuhTempo: '2026-10-20', status: 'Dibebaskan Beasiswa', dikirim: false },
];

const STATUS = ['Dibebaskan Beasiswa', 'Belum bayar', 'Menunggu verifikasi', 'Sudah bayar', 'Terlambat'];
const WARNA_STATUS = {
    'Dibebaskan Beasiswa': 'success',
    'Belum bayar': 'warning',
    'Menunggu verifikasi': 'info',
    'Sudah bayar': 'success',
    Terlambat: 'error',
};

// ---------- Fungsi bantu ----------
const baca = (kunci) => {
    try {
        return JSON.parse(localStorage.getItem(kunci));
    } catch {
        return null;
    }
};

const simpanKe = (kunci, data) => {
    try {
        localStorage.setItem(kunci, JSON.stringify(data));
    } catch {
        /* penyimpanan penuh atau diblokir: abaikan */
    }
};

const dua = (n) => String(n).padStart(2, '0');
const tanggalLokal = (d) => `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
const bulanDari = (d) => `${d.getFullYear()}-${dua(d.getMonth() + 1)}`;

const tambahBulan = (ym, n) => {
    const [y, m] = ym.split('-').map(Number);
    return bulanDari(new Date(y, m - 1 + n, 1));
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

export default function DataSpp() {
    const navigate = useNavigate();
    const hariIni = tanggalLokal(new Date());
    const bulanSekarang = bulanDari(new Date());

    const [tagihan, setTagihan] = useState(() => {
        const saved = baca(KUNCI_TAGIHAN);
        return Array.isArray(saved) ? saved : TAGIHAN_AWAL;
    });

    // Pengaturan SPP: bulan berlaku awalnya bulan depan
    const [atur, setAtur] = useState(() => {
        const saved = baca(KUNCI_ATUR);
        const bulan = tambahBulan(bulanDari(new Date()), 1);
        const hari = dua(saved?.hari ?? 20);
        return { nominal: String(saved?.nominal ?? '350000'), bulan, jatuhTempo: `${bulan}-${hari}` };
    });
    const [errors, setErrors] = useState({});
    const [rencana, setRencana] = useState(null); // ringkasan sebelum tagihan dibuat

    const [filterBulan, setFilterBulan] = useState(
        () => [...new Set(tagihan.map((t) => t.bulan))].sort().reverse()[0] ?? 'all'
    );
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterKelompok, setFilterKelompok] = useState('all');
    const [halaman, setHalaman] = useState(1);
    const [notif, setNotif] = useState(null); // { text, severity }

    useEffect(() => simpanKe(KUNCI_TAGIHAN, tagihan), [tagihan]);

    // ---------- Pilihan ----------
    const opsiBulanBerlaku = useMemo(
        () => Array.from({ length: 7 }, (_, i) => tambahBulan(bulanSekarang, i - 1)),
        [bulanSekarang]
    );

    const opsiBulanFilter = useMemo(
        () => [...new Set(tagihan.map((t) => t.bulan))].sort().reverse(),
        [tagihan]
    );

    const opsiKelompok = useMemo(() => {
        const saved = baca(KUNCI_KELOMPOK);
        const dasar = Array.isArray(saved) ? saved.map((k) => k.nama) : KELOMPOK_DEFAULT;
        return [...new Set([...dasar, ...tagihan.map((t) => t.kelompok)])];
    }, [tagihan]);

    // ---------- Daftar tagihan ----------
    const baris = useMemo(
        () =>
            tagihan
                .map((t) => ({
                    ...t,
                    // Belum bayar dan sudah lewat jatuh tempo dianggap terlambat
                    statusTampil:
                        t.status === 'Belum bayar' && t.jatuhTempo < hariIni ? 'Terlambat' : t.status,
                }))
                .filter(
                    (t) =>
                        (filterBulan === 'all' || t.bulan === filterBulan) &&
                        (filterStatus === 'all' || t.statusTampil === filterStatus) &&
                        (filterKelompok === 'all' || t.kelompok === filterKelompok)
                )
                .sort((a, b) => a.nama.localeCompare(b.nama)),
        [tagihan, hariIni, filterBulan, filterStatus, filterKelompok]
    );

    const totalHalaman = Math.max(1, Math.ceil(baris.length / PER_PAGE));
    const halamanAman = Math.min(halaman, totalHalaman);
    const mulai = (halamanAman - 1) * PER_PAGE;
    const tampil = baris.slice(mulai, mulai + PER_PAGE);

    const ubahFilter = (setter) => (e) => {
        setter(e.target.value);
        setHalaman(1);
    };

    // ---------- Pengaturan ----------
    const ubahNominal = (e) => {
        setAtur((prev) => ({ ...prev, nominal: e.target.value.replace(/\D/g, '') }));
        setErrors((prev) => ({ ...prev, nominal: '' }));
    };

    const ubahBulan = (e) => {
        const bulan = e.target.value;
        const hari = Math.min(Number(atur.jatuhTempo.slice(8, 10)) || 20, 28);
        setAtur((prev) => ({ ...prev, bulan, jatuhTempo: `${bulan}-${dua(hari)}` }));
    };

    const ubahJatuhTempo = (e) => {
        setAtur((prev) => ({ ...prev, jatuhTempo: e.target.value }));
        setErrors((prev) => ({ ...prev, jatuhTempo: '' }));
    };

    // Langkah 1: hitung dulu berapa tagihan yang akan dibuat, lalu minta konfirmasi
    const siapkanTagihan = () => {
        const baru = {};
        if (!atur.nominal || Number(atur.nominal) <= 0) baru.nominal = 'Nominal SPP wajib diisi.';
        if (!atur.jatuhTempo) baru.jatuhTempo = 'Tanggal jatuh tempo wajib diisi.';
        setErrors(baru);
        if (Object.keys(baru).length > 0) return;

        const saved = baca(KUNCI_SANTRI);
        const santri = Array.isArray(saved) ? saved : SANTRI_DEFAULT;
        const aktif = santri.filter((s) => s.status === 'Aktif'); // hanya santri aktif
        const sudahAda = new Set(tagihan.filter((t) => t.bulan === atur.bulan).map((t) => t.nis));
        const belumPunya = aktif.filter((s) => !sudahAda.has(s.nis));

        if (belumPunya.length === 0) {
            setNotif({
                text: `Semua santri aktif sudah punya tagihan ${labelBulan(atur.bulan)}.`,
                severity: 'info',
            });
            return;
        }

        setRencana({
            bulan: atur.bulan,
            nominal: Number(atur.nominal),
            jatuhTempo: atur.jatuhTempo,
            daftar: belumPunya,
            dilewati: aktif.length - belumPunya.length,
        });
    };

    // Langkah 2: buat tagihan. Santri penerima beasiswa dibebaskan (FR-08).
    const buatTagihan = () => {
        const { bulan, nominal, jatuhTempo, daftar } = rencana;
        const stamp = Date.now();

        const baru = daftar.map((s, i) => ({
            id: `${stamp}-${i}`,
            nis: s.nis,
            nama: s.nama,
            kelompok: s.kelompok,
            bulan,
            jumlah: s.beasiswa ? 0 : nominal,
            jatuhTempo,
            status: s.beasiswa ? 'Dibebaskan Beasiswa' : 'Belum bayar',
            dikirim: false,
        }));

        setTagihan((prev) => [...prev, ...baru]);
        simpanKe(KUNCI_ATUR, { nominal, hari: Number(jatuhTempo.slice(8, 10)) });

        setFilterBulan(bulan);
        setFilterStatus('all');
        setFilterKelompok('all');
        setHalaman(1);

        const dibebaskan = baru.filter((t) => t.status === 'Dibebaskan Beasiswa').length;
        setNotif({
            text: `${baru.length} tagihan ${labelBulan(bulan)} dibuat (${dibebaskan} santri dibebaskan beasiswa).`,
            severity: 'success',
        });
        setRencana(null);
    };

    // ---------- Aksi per baris ----------
    // Pengiriman di sini simulasi; notifikasi sungguhan baru ada setelah backend.
    const kirimTagihan = (t) => {
        setTagihan((prev) => prev.map((x) => (x.id === t.id ? { ...x, dikirim: true } : x)));
        setNotif({ text: `Tagihan ${labelBulan(t.bulan)} untuk ${t.nama} dikirim.`, severity: 'success' });
    };

    const kirimPengingat = (t) => {
        setNotif({ text: `Pengingat pembayaran untuk ${t.nama} dikirim.`, severity: 'success' });
    };

    const lihatBukti = (t) => navigate(`/admin/verifikasi?id=${t.id}`);

    const aksiBaris = (t) => {
        switch (t.statusTampil) {
            case 'Belum bayar':
                return (
                    <Button size="small" onClick={() => kirimTagihan(t)}>
                        {t.dikirim ? 'Kirim ulang' : 'Kirim tagihan'}
                    </Button>
                );
            case 'Terlambat':
                return (
                    <Button size="small" color="error" onClick={() => kirimPengingat(t)}>
                        Kirim pengingat
                    </Button>
                );
            case 'Menunggu verifikasi':
            case 'Sudah bayar':
                return (
                    <Button size="small" onClick={() => lihatBukti(t)}>
                        Lihat bukti
                    </Button>
                );
            default:
                return <Typography color="text.secondary">–</Typography>;
        }
    };

    return (
        <Box sx={{ display: 'grid', gap: 3 }}>
            <Typography color="text.secondary" sx={{ mt: -1 }}>
                Pengaturan tagihan bulanan dan status pembayaran seluruh santri
            </Typography>

            {/* Pengaturan SPP */}
            <Card
                sx={{
                    p: 3, borderRadius: 3, bgcolor: palette.honeydew,
                    borderColor: palette.aquamarine,
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 700, color: palette.pineTeal, mb: 2 }}>
                    Pengaturan SPP bulan ini
                </Typography>

                <Box
                    sx={{
                        display: 'grid', gap: 2, alignItems: 'start',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr) auto' },
                    }}
                >
                    <TextField
                        label="Nominal SPP"
                        size="small"
                        value={atur.nominal ? Number(atur.nominal).toLocaleString('id-ID') : ''}
                        onChange={ubahNominal}
                        error={Boolean(errors.nominal)}
                        helperText={errors.nominal}
                        sx={{ bgcolor: '#fff' }}
                        slotProps={{
                            input: { startAdornment: <InputAdornment position="start">Rp</InputAdornment> },
                            htmlInput: { inputMode: 'numeric' },
                        }}
                    />

                    <TextField
                        label="Tanggal jatuh tempo"
                        type="date"
                        size="small"
                        value={atur.jatuhTempo}
                        onChange={ubahJatuhTempo}
                        error={Boolean(errors.jatuhTempo)}
                        helperText={errors.jatuhTempo}
                        sx={{ bgcolor: '#fff' }}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />

                    <TextField
                        select
                        label="Bulan berlaku"
                        size="small"
                        value={atur.bulan}
                        onChange={ubahBulan}
                        sx={{ bgcolor: '#fff' }}
                    >
                        {opsiBulanBerlaku.map((b) => (
                            <MenuItem key={b} value={b}>{labelBulan(b)}</MenuItem>
                        ))}
                    </TextField>

                    <Button variant="contained" onClick={siapkanTagihan} sx={{ height: 40 }}>
                        Buat tagihan otomatis
                    </Button>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Tagihan otomatis dibuat untuk semua santri aktif. Santri yang sudah mendapat beasiswa
                    bulan itu dibebaskan dari tagihan.
                </Typography>
            </Card>

            {/* Filter */}
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: palette.pineTeal, mb: 1.5 }}>
                    Tagihan SPP seluruh santri
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                        select
                        size="small"
                        value={filterBulan}
                        onChange={ubahFilter(setFilterBulan)}
                        sx={{ minWidth: 190, bgcolor: '#fff' }}
                        slotProps={{ htmlInput: { 'aria-label': 'Filter bulan' } }}
                    >
                        <MenuItem value="all">Semua Bulan</MenuItem>
                        {opsiBulanFilter.map((b) => (
                            <MenuItem key={b} value={b}>{labelBulan(b)}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        value={filterStatus}
                        onChange={ubahFilter(setFilterStatus)}
                        sx={{ minWidth: 210, bgcolor: '#fff' }}
                        slotProps={{ htmlInput: { 'aria-label': 'Filter status' } }}
                    >
                        <MenuItem value="all">Semua Status</MenuItem>
                        {STATUS.map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        size="small"
                        value={filterKelompok}
                        onChange={ubahFilter(setFilterKelompok)}
                        sx={{ minWidth: 190, bgcolor: '#fff' }}
                        slotProps={{ htmlInput: { 'aria-label': 'Filter kelompok' } }}
                    >
                        <MenuItem value="all">Semua Kelompok</MenuItem>
                        {opsiKelompok.map((k) => (
                            <MenuItem key={k} value={k}>{k}</MenuItem>
                        ))}
                    </TextField>
                </Box>
            </Box>

            {/* Tabel */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Santri</TableCell>
                                <TableCell>Kelompok</TableCell>
                                <TableCell>Jumlah tagihan</TableCell>
                                <TableCell>Jatuh tempo</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="center">Aksi</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tampil.map((t) => {
                                const bebas = t.statusTampil === 'Dibebaskan Beasiswa';
                                return (
                                    <TableRow key={t.id} hover>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 600 }}>{t.nama}</Typography>
                                            {filterBulan === 'all' && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {labelBulan(t.bulan)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>{t.kelompok}</TableCell>
                                        <TableCell>{rupiah(t.jumlah)}</TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {bebas ? '–' : formatTanggal(t.jatuhTempo)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={t.statusTampil}
                                                size="small"
                                                color={WARNA_STATUS[t.statusTampil]}
                                                variant={bebas ? 'outlined' : 'filled'}
                                                sx={{ fontWeight: 600, minWidth: 130 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                            {aksiBaris(t)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {baris.length === 0 && (
                    <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                        {tagihan.length === 0
                            ? 'Belum ada tagihan. Atur nominal dan jatuh tempo, lalu klik "Buat tagihan otomatis".'
                            : 'Tidak ada tagihan yang cocok. Ubah bulan, status, atau kelompok.'}
                    </Typography>
                )}
            </Card>

            {/* Keterangan & halaman */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {baris.length === 0
                        ? 'Menampilkan 0 tagihan'
                        : `Menampilkan ${mulai + 1}-${mulai + tampil.length} dari ${baris.length} tagihan`}
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

            {/* Konfirmasi pembuatan tagihan */}
            <Dialog open={Boolean(rencana)} onClose={() => setRencana(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Buat tagihan otomatis?</DialogTitle>
                <DialogContent>
                    {rencana && (
                        <DialogContentText component="div">
                            Akan dibuat <strong>{rencana.daftar.length} tagihan</strong> untuk{' '}
                            <strong>{labelBulan(rencana.bulan)}</strong>:
                            <Box component="ul" sx={{ pl: 3, my: 1 }}>
                                <li>
                                    {rencana.daftar.filter((s) => !s.beasiswa).length} santri membayar{' '}
                                    {rupiah(rencana.nominal)}, jatuh tempo {formatTanggal(rencana.jatuhTempo)}
                                </li>
                                <li>
                                    {rencana.daftar.filter((s) => s.beasiswa).length} santri dibebaskan karena
                                    beasiswa
                                </li>
                            </Box>
                            {rencana.dilewati > 0 &&
                                `${rencana.dilewati} santri aktif sudah punya tagihan bulan ini dan dilewati.`}
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setRencana(null)}>Batal</Button>
                    <Button variant="contained" onClick={buatTagihan}>Buat Tagihan</Button>
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